import { Injectable } from '@angular/core';
import { Observable, from } from 'rxjs';
import { DatabaseService } from '../../../core/services/database.service';
import { SupabaseService } from '../../../core/services/supabase.service';
import { SyncService } from '../../../core/services/sync.service';
import {
  TrainingAttendance,
  AttendanceStatus,
  BulkAttendanceUpdate,
} from '../../../core/models/training-attendance.model';

/**
 * TrainingAttendanceService
 * Story: 3.5 Mark Training Attendance
 * Manages player attendance for training sessions
 */
@Injectable({
  providedIn: 'root',
})
export class TrainingAttendanceService {
  constructor(
    private db: DatabaseService,
    private supabase: SupabaseService,
    private syncService: SyncService,
  ) {}

  /**
   * Get attendance records for a training session
   */
  getAttendance(sessionId: string): Observable<TrainingAttendance[]> {
    return from(
      this.db.db.training_attendance.where('training_session_id').equals(sessionId).toArray(),
    );
  }

  /**
   * Mark or update attendance for a player
   * Upserts attendance record (insert or update if exists)
   */
  markAttendance(
    sessionId: string,
    playerId: string,
    status: AttendanceStatus,
  ): Observable<TrainingAttendance> {
    return from(
      (async () => {
        const now = new Date().toISOString();

        // Check if attendance record exists
        const existing = await this.db.db.training_attendance
          .where('[training_session_id+player_id]')
          .equals([sessionId, playerId])
          .first();

        if (existing) {
          // Update existing record
          await this.db.db.training_attendance.update(existing.id, {
            status,
            updated_at: now,
          });

          const updated = await this.db.db.training_attendance.get(existing.id);
          if (!updated) throw new Error('Failed to get updated attendance');

          // Queue for sync if offline, otherwise sync immediately
          if (navigator.onLine) {
            const { error } = await this.supabase.client
              .from('training_attendance')
              .update({ status, updated_at: now })
              .eq('id', existing.id);

            if (error) throw error;
          } else {
            await this.syncService.queueOperation('training_attendance', 'update', existing.id, {
              status,
              updated_at: now,
            });
          }

          return updated;
        } else {
          // Create new record
          const id = crypto.randomUUID();
          const newAttendance: TrainingAttendance = {
            id,
            training_session_id: sessionId,
            player_id: playerId,
            status,
            created_at: now,
            updated_at: now,
          };

          await this.db.db.training_attendance.add(newAttendance);

          // Queue for sync if offline, otherwise sync immediately
          if (navigator.onLine) {
            const { error } = await this.supabase.client
              .from('training_attendance')
              .insert(newAttendance);

            if (error) throw error;
          } else {
            await this.syncService.queueOperation(
              'training_attendance',
              'insert',
              id,
              newAttendance,
            );
          }

          return newAttendance;
        }
      })(),
    );
  }

  /**
   * Mark all players as attended (bulk action)
   */
  markAllAttended(sessionId: string, playerIds: string[]): Observable<void> {
    return from(
      (async () => {
        await Promise.all(
          playerIds.map(playerId =>
            this.markAttendance(sessionId, playerId, 'attended').toPromise(),
          ),
        );
      })(),
    );
  }

  /**
   * Reset all attendance records for a session
   */
  resetAttendance(sessionId: string): Observable<void> {
    return from(
      (async () => {
        // Delete all attendance records for this session
        const records = await this.db.db.training_attendance
          .where('training_session_id')
          .equals(sessionId)
          .toArray();

        await this.db.db.training_attendance
          .where('training_session_id')
          .equals(sessionId)
          .delete();

        // Queue for sync if offline, otherwise sync immediately
        if (navigator.onLine) {
          await Promise.all(
            records.map(async record => {
              const { error } = await this.supabase.client
                .from('training_attendance')
                .delete()
                .eq('id', record.id);

              if (error) throw error;
            }),
          );
        } else {
          await Promise.all(
            records.map(record =>
              this.syncService.queueOperation('training_attendance', 'delete', record.id, {}),
            ),
          );
        }
      })(),
    );
  }

  /**
   * Get attendance status for a specific player in a session
   */
  getPlayerAttendance(sessionId: string, playerId: string): Observable<TrainingAttendance | null> {
    return from(
      this.db.db.training_attendance
        .where('[training_session_id+player_id]')
        .equals([sessionId, playerId])
        .first()
        .then(result => result || null),
    );
  }

  /**
   * Bulk update attendance for multiple players
   */
  bulkUpdateAttendance(sessionId: string, updates: BulkAttendanceUpdate): Observable<void> {
    return from(
      (async () => {
        await Promise.all(
          updates.player_ids.map(playerId =>
            this.markAttendance(sessionId, playerId, updates.status).toPromise(),
          ),
        );
      })(),
    );
  }
}
