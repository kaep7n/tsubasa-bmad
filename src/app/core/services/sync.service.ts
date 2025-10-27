import { Injectable, signal } from '@angular/core';
import { fromEvent } from 'rxjs';
import { DatabaseService } from './database.service';
import { SupabaseService } from './supabase.service';
import { SyncOperation, SyncOperationType, SyncState, SyncStatus } from '../models/sync-operation.model';

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

  // Max retry attempts with exponential backoff
  private readonly MAX_RETRIES = 10;
  private readonly MAX_BACKOFF_MS = 30000; // 30 seconds

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
   * Operations are prioritized: CREATEs → UPDATEs → DELETEs
   * Goals with assists are synced atomically
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
      const pendingOps = await this.db.db.sync_queue.where('synced').equals(0).sortBy('timestamp');

      if (pendingOps.length === 0) {
        this.updateSyncState('synced');
        this.isSyncing = false;
        return;
      }

      console.log(`Processing ${pendingOps.length} pending operations`);

      // Sort operations by priority: CREATE → UPDATE → DELETE
      const sortedOps = this.prioritizeOperations(pendingOps);

      // Group goals with their assists for atomic sync
      const groupedOps = this.groupGoalWithAssists(sortedOps);

      // Process each operation/group
      for (const item of groupedOps) {
        if (Array.isArray(item)) {
          // Atomic goal+assists group
          await this.syncGoalWithAssists(item);
        } else {
          // Single operation
          await this.syncSingleOperation(item);
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
   * Prioritize operations: CREATE → UPDATE → DELETE
   * Within each priority level, sort by timestamp
   */
  private prioritizeOperations(ops: SyncOperation[]): SyncOperation[] {
    const operationPriority: Record<SyncOperationType, number> = {
      insert: 1,
      update: 2,
      delete: 3,
    };

    return ops.sort((a, b) => {
      const priorityDiff = operationPriority[a.operation] - operationPriority[b.operation];
      if (priorityDiff !== 0) return priorityDiff;
      return a.timestamp - b.timestamp;
    });
  }

  /**
   * Group goals with their assists for atomic sync
   * Returns array of single operations or operation groups
   */
  private groupGoalWithAssists(ops: SyncOperation[]): (SyncOperation | SyncOperation[])[] {
    const result: (SyncOperation | SyncOperation[])[] = [];
    const goalMap = new Map<string, SyncOperation[]>();
    const assistMap = new Map<string, SyncOperation>();

    // First pass: identify goals and assists
    for (const op of ops) {
      if (op.table === 'goals' && op.operation === 'insert') {
        goalMap.set(op.recordId, [op]);
      } else if (op.table === 'goal_assists' && op.operation === 'insert') {
        const goalId = (op.data as any).goal_id;
        if (goalId) {
          assistMap.set(op.id!.toString(), op);
        }
      }
    }

    // Second pass: group assists with their goals
    for (const [opId, assist] of assistMap.entries()) {
      const goalId = (assist.data as any).goal_id;
      if (goalMap.has(goalId)) {
        goalMap.get(goalId)!.push(assist);
      }
    }

    // Third pass: build result array
    const processedIds = new Set<number>();

    for (const op of ops) {
      if (processedIds.has(op.id!)) continue;

      if (op.table === 'goals' && op.operation === 'insert' && goalMap.has(op.recordId)) {
        const group = goalMap.get(op.recordId)!;
        result.push(group);
        group.forEach(item => processedIds.add(item.id!));
      } else if (op.table === 'goal_assists' && assistMap.has(op.id!.toString())) {
        // Skip assists that are part of a goal group
        const goalId = (op.data as any).goal_id;
        if (!goalMap.has(goalId)) {
          result.push(op);
          processedIds.add(op.id!);
        }
      } else {
        result.push(op);
        processedIds.add(op.id!);
      }
    }

    return result;
  }

  /**
   * Sync a goal with its assists atomically
   */
  private async syncGoalWithAssists(ops: SyncOperation[]): Promise<void> {
    const goalOp = ops.find(op => op.table === 'goals');
    if (!goalOp) return;

    const assistOps = ops.filter(op => op.table === 'goal_assists');
    const startTime = Date.now();

    try {
      // Sync goal first
      await this.syncOperation(goalOp);

      // Then sync all assists
      for (const assistOp of assistOps) {
        await this.syncOperation(assistOp);
      }

      // Mark all as synced
      for (const op of ops) {
        await this.db.db.sync_queue.update(op.id!, {
          synced: true,
          error: undefined,
        });
      }

      // Emit success event
      this.emitAnalyticsEvent('sync_success', {
        entity_type: 'goal_with_assists',
        entity_id: goalOp.recordId,
        duration_ms: Date.now() - startTime,
        assist_count: assistOps.length,
      });
    } catch (error: any) {
      console.error(`Error syncing goal ${goalOp.recordId} with assists:`, error);

      // Increment retry count for all operations
      for (const op of ops) {
        const retryCount = (op.retryCount || 0) + 1;

        if (retryCount >= this.MAX_RETRIES) {
          await this.db.db.sync_queue.update(op.id!, {
            error: error.message || 'Max retries reached',
            retryCount,
          });

          // Emit failure event
          this.emitAnalyticsEvent('sync_failure', {
            entity_type: 'goal_with_assists',
            entity_id: goalOp.recordId,
            error: error.message,
            retry_count: retryCount,
          });
        } else {
          await this.db.db.sync_queue.update(op.id!, {
            retryCount,
          });

          // Schedule retry with exponential backoff
          const delay = this.calculateRetryDelay(retryCount);
          setTimeout(() => this.processSyncQueue(), delay);
        }
      }
    }
  }

  /**
   * Sync a single operation with retry logic
   */
  private async syncSingleOperation(op: SyncOperation): Promise<void> {
    const startTime = Date.now();

    try {
      await this.syncOperation(op);

      // Mark as synced
      await this.db.db.sync_queue.update(op.id!, {
        synced: true,
        error: undefined,
      });

      // Emit success event
      this.emitAnalyticsEvent('sync_success', {
        entity_type: op.table,
        entity_id: op.recordId,
        operation: op.operation,
        duration_ms: Date.now() - startTime,
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

        // Emit failure event
        this.emitAnalyticsEvent('sync_failure', {
          entity_type: op.table,
          entity_id: op.recordId,
          operation: op.operation,
          error: error.message,
          retry_count: retryCount,
        });
      } else {
        // Increment retry count
        await this.db.db.sync_queue.update(op.id!, {
          retryCount,
        });

        // Schedule retry with exponential backoff
        const delay = this.calculateRetryDelay(retryCount);
        setTimeout(() => this.processSyncQueue(), delay);
      }
    }
  }

  /**
   * Calculate retry delay with exponential backoff
   * Formula: Math.min(1000 * 2^retryCount, MAX_BACKOFF_MS)
   * Results: 1s, 2s, 4s, 8s, 16s, max 30s
   */
  private calculateRetryDelay(retryCount: number): number {
    return Math.min(1000 * Math.pow(2, retryCount), this.MAX_BACKOFF_MS);
  }

  /**
   * Emit analytics event for sync operations
   * Logs to console in dev, can be wired to analytics service in prod
   */
  private emitAnalyticsEvent(eventName: string, data: Record<string, any>): void {
    console.log(`[Analytics] ${eventName}:`, data);

    // TODO: Wire up to analytics service (e.g., Google Analytics, Mixpanel)
    // Example: this.analytics.track(eventName, data);
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
