import { Injectable, signal } from '@angular/core';
import { Observable, from, of } from 'rxjs';
import { map, switchMap, tap, catchError } from 'rxjs/operators';
import { DatabaseService } from '../../../core/services/database.service';
import { SupabaseService } from '../../../core/services/supabase.service';
import { SyncService } from '../../../core/services/sync.service';
import {
  TrainingSession,
  TrainingSessionFormData,
} from '../../../core/models/training-session.model';

/**
 * Training Session with attendance summary
 */
export interface TrainingSessionWithAttendance extends TrainingSession {
  attended_count: number;
  total_players: number;
  attendance_rate: number;
}

/**
 * TrainingSessionService
 * Story: 3.3 Training Session List View
 * Manages training sessions with offline-first architecture
 */
@Injectable({
  providedIn: 'root',
})
export class TrainingSessionService {
  // Signal to hold sessions for reactive UI
  private sessionsSignal = signal<TrainingSessionWithAttendance[]>([]);
  public readonly sessions = this.sessionsSignal.asReadonly();

  constructor(
    private db: DatabaseService,
    private supabase: SupabaseService,
    private syncService: SyncService,
  ) {}

  /**
   * Get all training sessions for a team
   * Cache-first: Returns cached data immediately, then fetches from Supabase in background
   */
  getTrainingSessions(teamId: string): Observable<TrainingSessionWithAttendance[]> {
    // First, get from IndexedDB cache
    return from(
      this.db.db.training_sessions
        .where('team_id')
        .equals(teamId)
        .and(session => !session.deleted_at)
        .toArray(),
    ).pipe(
      switchMap(async cachedSessions => {
        // Calculate attendance for each session from IndexedDB
        const sessionsWithAttendance = await Promise.all(
          cachedSessions.map(async session => {
            const attendance = await this.db.db.training_attendance
              .where('training_session_id')
              .equals(session.id)
              .toArray();

            const attended = attendance.filter(a => a.status === 'attended').length;
            const total = attendance.length;

            return {
              ...session,
              attended_count: attended,
              total_players: total,
              attendance_rate: total > 0 ? (attended / total) * 100 : 0,
            };
          }),
        );

        // Sort by date descending (most recent first)
        sessionsWithAttendance.sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
        );

        this.sessionsSignal.set(sessionsWithAttendance);

        // Background fetch from Supabase if online
        if (navigator.onLine) {
          this.fetchFromSupabase(teamId).subscribe();
        }

        return sessionsWithAttendance;
      }),
      catchError(error => {
        console.error('Error getting sessions from IndexedDB:', error);
        return of([]);
      }),
    );
  }

  /**
   * Fetch sessions from Supabase and update IndexedDB cache
   */
  private fetchFromSupabase(teamId: string): Observable<TrainingSessionWithAttendance[]> {
    return from(
      this.supabase.client
        .from('training_sessions')
        .select('*')
        .eq('team_id', teamId)
        .is('deleted_at', null)
        .order('date', { ascending: false }),
    ).pipe(
      switchMap(async ({ data, error }) => {
        if (error) throw error;

        const sessions = (data || []) as TrainingSession[];

        // Update IndexedDB cache
        await this.db.db.training_sessions.bulkPut(sessions);

        // Fetch attendance for each session
        const sessionsWithAttendance = await Promise.all(
          sessions.map(async session => {
            const { data: attendance } = await this.supabase.client
              .from('training_attendance')
              .select('*')
              .eq('training_session_id', session.id);

            const attendanceRecords = attendance || [];
            const attended = attendanceRecords.filter(a => a.status === 'attended').length;
            const total = attendanceRecords.length;

            // Cache attendance records
            if (attendanceRecords.length > 0) {
              await this.db.db.training_attendance.bulkPut(attendanceRecords);
            }

            return {
              ...session,
              attended_count: attended,
              total_players: total,
              attendance_rate: total > 0 ? (attended / total) * 100 : 0,
            };
          }),
        );

        // Update signal
        this.sessionsSignal.set(sessionsWithAttendance);

        return sessionsWithAttendance;
      }),
      catchError(error => {
        console.error('Error fetching sessions from Supabase:', error);
        return of([]);
      }),
    );
  }

  /**
   * Create a new training session
   */
  createSession(teamId: string, sessionData: TrainingSessionFormData): Observable<TrainingSession> {
    return from(
      (async () => {
        // Generate client-side UUID
        const id = crypto.randomUUID();
        const now = new Date().toISOString();

        const newSession: TrainingSession = {
          id,
          team_id: teamId,
          ...sessionData,
          created_at: now,
          updated_at: now,
          deleted_at: null,
        };

        // Save to IndexedDB first
        await this.db.db.training_sessions.add(newSession);

        // Update signal
        const currentSessions = this.sessionsSignal();
        this.sessionsSignal.set([
          {
            ...newSession,
            attended_count: 0,
            total_players: 0,
            attendance_rate: 0,
          },
          ...currentSessions,
        ]);

        // Queue for sync if offline, otherwise sync immediately
        if (navigator.onLine) {
          const { error } = await this.supabase.client.from('training_sessions').insert(newSession);

          if (error) throw error;
        } else {
          await this.syncService.queueOperation('training_sessions', 'insert', id, newSession);
        }

        return newSession;
      })(),
    );
  }

  /**
   * Update an existing training session
   */
  updateSession(
    sessionId: string,
    updates: Partial<TrainingSessionFormData>,
  ): Observable<TrainingSession> {
    return from(
      (async () => {
        const now = new Date().toISOString();
        const updateData = {
          ...updates,
          updated_at: now,
        };

        // Update in IndexedDB
        await this.db.db.training_sessions.update(sessionId, updateData);

        // Get updated session
        const updatedSession = await this.db.db.training_sessions.get(sessionId);
        if (!updatedSession) throw new Error('Session not found');

        // Update signal
        const currentSessions = this.sessionsSignal();
        const index = currentSessions.findIndex(s => s.id === sessionId);
        if (index !== -1) {
          const newSessions = [...currentSessions];
          newSessions[index] = {
            ...newSessions[index],
            ...updatedSession,
          };
          this.sessionsSignal.set(newSessions);
        }

        // Queue for sync if offline, otherwise sync immediately
        if (navigator.onLine) {
          const { error } = await this.supabase.client
            .from('training_sessions')
            .update(updateData)
            .eq('id', sessionId);

          if (error) throw error;
        } else {
          await this.syncService.queueOperation(
            'training_sessions',
            'update',
            sessionId,
            updateData,
          );
        }

        return updatedSession;
      })(),
    );
  }

  /**
   * Delete (soft delete) a training session
   */
  deleteSession(sessionId: string): Observable<void> {
    return from(
      (async () => {
        const now = new Date().toISOString();

        // Soft delete in IndexedDB
        await this.db.db.training_sessions.update(sessionId, {
          deleted_at: now,
        });

        // Remove from signal
        const currentSessions = this.sessionsSignal();
        this.sessionsSignal.set(currentSessions.filter(s => s.id !== sessionId));

        // Queue for sync if offline, otherwise sync immediately
        if (navigator.onLine) {
          const { error } = await this.supabase.client
            .from('training_sessions')
            .update({ deleted_at: now })
            .eq('id', sessionId);

          if (error) throw error;
        } else {
          await this.syncService.queueOperation('training_sessions', 'update', sessionId, {
            deleted_at: now,
          });
        }
      })(),
    );
  }

  /**
   * Restore a deleted training session (undo delete)
   */
  restoreSession(sessionId: string): Observable<TrainingSession> {
    return from(
      (async () => {
        // Restore in IndexedDB
        await this.db.db.training_sessions.update(sessionId, {
          deleted_at: null,
        });

        // Get restored session
        const restoredSession = await this.db.db.training_sessions.get(sessionId);
        if (!restoredSession) throw new Error('Session not found');

        // Calculate attendance
        const attendance = await this.db.db.training_attendance
          .where('training_session_id')
          .equals(sessionId)
          .toArray();

        const attended = attendance.filter(a => a.status === 'attended').length;
        const total = attendance.length;

        const sessionWithAttendance = {
          ...restoredSession,
          attended_count: attended,
          total_players: total,
          attendance_rate: total > 0 ? (attended / total) * 100 : 0,
        };

        // Add back to signal (sorted by date)
        const currentSessions = this.sessionsSignal();
        const newSessions = [...currentSessions, sessionWithAttendance];
        newSessions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        this.sessionsSignal.set(newSessions);

        // Queue for sync if offline, otherwise sync immediately
        if (navigator.onLine) {
          const { error } = await this.supabase.client
            .from('training_sessions')
            .update({ deleted_at: null })
            .eq('id', sessionId);

          if (error) throw error;
        } else {
          await this.syncService.queueOperation('training_sessions', 'update', sessionId, {
            deleted_at: null,
          });
        }

        return restoredSession;
      })(),
    );
  }

  /**
   * Get a single session by ID
   */
  getSession(sessionId: string): Observable<TrainingSessionWithAttendance | null> {
    return from(
      (async () => {
        const session = await this.db.db.training_sessions.get(sessionId);
        if (!session) return null;

        const attendance = await this.db.db.training_attendance
          .where('training_session_id')
          .equals(sessionId)
          .toArray();

        const attended = attendance.filter(a => a.status === 'attended').length;
        const total = attendance.length;

        return {
          ...session,
          attended_count: attended,
          total_players: total,
          attendance_rate: total > 0 ? (attended / total) * 100 : 0,
        };
      })(),
    ).pipe(
      catchError(error => {
        console.error('Error getting session:', error);
        return of(null);
      }),
    );
  }

  /**
   * Refresh sessions from Supabase (for pull-to-refresh)
   */
  refreshSessions(teamId: string): Observable<TrainingSessionWithAttendance[]> {
    return this.fetchFromSupabase(teamId);
  }
}
