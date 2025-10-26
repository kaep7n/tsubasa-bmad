/**
 * Sync Operation Model
 * Represents a queued operation that needs to be synced to Supabase
 */

export type SyncOperationType = 'insert' | 'update' | 'delete';

export type SyncStatus = 'pending' | 'syncing' | 'synced' | 'error';

export interface SyncOperation {
  id?: number; // Auto-incremented by Dexie
  table: string;
  operation: SyncOperationType;
  recordId: string;
  data: Record<string, unknown>;
  timestamp: number;
  synced: boolean;
  error?: string;
  retryCount: number;
}

export interface SyncState {
  status: SyncStatus;
  lastSyncTime: number | null;
  pendingCount: number;
  error: string | null;
}
