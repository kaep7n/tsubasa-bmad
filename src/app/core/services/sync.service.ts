import { Injectable, signal } from '@angular/core';
import { fromEvent } from 'rxjs';
import { DatabaseService } from './database.service';
import { SupabaseService } from './supabase.service';
import { SyncOperation, SyncState, SyncStatus } from '../models/sync-operation.model';

/**
 * SyncService
 * Manages offline queue and synchronization with Supabase
 */
@Injectable({
  providedIn: 'root',
})
export class SyncService {
  // Sync state signal
  private syncStateSignal = signal<SyncState>({
    status: 'pending',
    lastSyncTime: null,
    pendingCount: 0,
    error: null,
  });

  // Public readonly signal
  public readonly syncState = this.syncStateSignal.asReadonly();

  // Sync in progress flag
  private isSyncing = false;

  // Max retry attempts
  private readonly MAX_RETRIES = 3;

  constructor(
    private db: DatabaseService,
    private supabase: SupabaseService,
  ) {
    this.initializeSync();
  }

  /**
   * Initialize sync listeners and perform initial sync
   */
  private initializeSync(): void {
    // Listen for online events
    fromEvent(window, 'online').subscribe(() => {
      console.log('Network connection restored');
      this.processSyncQueue();
    });

    // Perform initial sync if online
    if (navigator.onLine) {
      this.processSyncQueue();
    }

    // Update pending count on initialization
    this.updatePendingCount();
  }

  /**
   * Queue an operation for sync
   * @param table Table name
   * @param operation Operation type
   * @param recordId Record ID
   * @param data Record data
   */
  async queueOperation(
    table: string,
    operation: 'insert' | 'update' | 'delete',
    recordId: string,
    data: any,
  ): Promise<void> {
    const syncOp: SyncOperation = {
      table,
      operation,
      recordId,
      data,
      timestamp: Date.now(),
      synced: false,
      retryCount: 0,
    };

    await this.db.db.sync_queue.add(syncOp);
    await this.updatePendingCount();

    // Try to sync immediately if online
    if (navigator.onLine && !this.isSyncing) {
      this.processSyncQueue();
    }
  }

  /**
   * Process sync queue - sync all pending operations to Supabase
   */
  async processSyncQueue(): Promise<void> {
    if (this.isSyncing) {
      console.log('Sync already in progress');
      return;
    }

    if (!navigator.onLine) {
      console.log('Cannot sync: offline');
      return;
    }

    this.isSyncing = true;
    this.updateSyncState('syncing');

    try {
      // Get all unsynced operations
      const pendingOps = await this.db.db.sync_queue
        .where('synced')
        .equals(0)
        .sortBy('timestamp');

      if (pendingOps.length === 0) {
        this.updateSyncState('synced');
        this.isSyncing = false;
        return;
      }

      console.log(`Processing ${pendingOps.length} pending operations`);

      // Process each operation
      for (const op of pendingOps) {
        try {
          await this.syncOperation(op);

          // Mark as synced
          await this.db.db.sync_queue.update(op.id!, {
            synced: true,
            error: undefined,
          });
        } catch (error: any) {
          console.error(`Error syncing operation ${op.id}:`, error);

          // Increment retry count
          const retryCount = (op.retryCount || 0) + 1;

          if (retryCount >= this.MAX_RETRIES) {
            // Max retries reached, mark as error
            await this.db.db.sync_queue.update(op.id!, {
              error: error.message || 'Max retries reached',
              retryCount,
            });
          } else {
            // Increment retry count
            await this.db.db.sync_queue.update(op.id!, {
              retryCount,
            });
          }
        }
      }

      // Update state
      await this.updatePendingCount();
      this.updateSyncState('synced', null, Date.now());
    } catch (error: any) {
      console.error('Sync queue processing error:', error);
      this.updateSyncState('error', error.message);
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Sync a single operation to Supabase
   * @param op Sync operation
   */
  private async syncOperation(op: SyncOperation): Promise<void> {
    const { table, operation, recordId, data } = op;

    switch (operation) {
      case 'insert':
        const { error: insertError } = await this.supabase.client.from(table).insert(data);

        if (insertError) throw insertError;
        break;

      case 'update':
        const { error: updateError } = await this.supabase.client
          .from(table)
          .update(data)
          .eq('id', recordId);

        if (updateError) throw updateError;
        break;

      case 'delete':
        const { error: deleteError } = await this.supabase.client
          .from(table)
          .delete()
          .eq('id', recordId);

        if (deleteError) throw deleteError;
        break;
    }
  }

  /**
   * Pull changes from Supabase since last sync
   * @param table Table name
   * @param lastSyncTime Last sync timestamp (optional)
   */
  async pullChanges(table: string, lastSyncTime?: number): Promise<any[]> {
    if (!navigator.onLine) {
      console.log('Cannot pull changes: offline');
      return [];
    }

    let query = this.supabase.client.from(table).select('*');

    if (lastSyncTime) {
      const lastSyncDate = new Date(lastSyncTime).toISOString();
      query = query.gt('updated_at', lastSyncDate);
    }

    const { data, error } = await query;

    if (error) {
      console.error(`Error pulling changes from ${table}:`, error);
      throw error;
    }

    return data || [];
  }

  /**
   * Resolve conflict between local and remote records
   * Uses last-write-wins strategy based on updated_at timestamp
   * @param local Local record
   * @param remote Remote record
   * @returns Winning record
   */
  resolveConflict<T extends { updated_at: Date | string }>(local: T, remote: T): T {
    const localTime = new Date(local.updated_at).getTime();
    const remoteTime = new Date(remote.updated_at).getTime();

    // Last write wins
    return remoteTime > localTime ? remote : local;
  }

  /**
   * Manually trigger sync (for pull-to-refresh)
   */
  async manualSync(): Promise<void> {
    return this.processSyncQueue();
  }

  /**
   * Update sync state
   */
  private updateSyncState(
    status: SyncStatus,
    error: string | null = null,
    lastSyncTime: number | null = null,
  ): void {
    const currentState = this.syncStateSignal();
    this.syncStateSignal.set({
      ...currentState,
      status,
      error,
      lastSyncTime: lastSyncTime !== null ? lastSyncTime : currentState.lastSyncTime,
    });
  }

  /**
   * Update pending count in sync state
   */
  private async updatePendingCount(): Promise<void> {
    const count = await this.db.db.sync_queue.where('synced').equals(0).count();

    const currentState = this.syncStateSignal();
    this.syncStateSignal.set({
      ...currentState,
      pendingCount: count,
    });
  }

  /**
   * Clear synced operations from queue (cleanup)
   */
  async clearSyncedOperations(): Promise<void> {
    await this.db.db.sync_queue.where('synced').equals(1).delete();

    await this.updatePendingCount();
  }

  /**
   * Get sync statistics
   */
  async getSyncStats(): Promise<{
    pending: number;
    synced: number;
    failed: number;
  }> {
    const pending = await this.db.db.sync_queue
      .where('synced')
      .equals(0)
      .and(op => !op.error)
      .count();

    const synced = await this.db.db.sync_queue.where('synced').equals(1).count();

    const failed = await this.db.db.sync_queue
      .where('synced')
      .equals(0)
      .and(op => !!op.error)
      .count();

    return { pending, synced, failed };
  }
}
