import { Injectable } from '@angular/core';
import { Observable, from } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { SupabaseService } from './supabase.service';
import { TrainingSession } from '../models/training-session.model';

/**
 * TrainingService
 * Handles training session CRUD operations and queries
 * Note: This is a legacy service - use TrainingSessionService from features/training for new code
 */
@Injectable({
  providedIn: 'root',
})
export class TrainingService {
  constructor(private supabase: SupabaseService) {}

  /**
   * Get upcoming training sessions
   * @param teamId Team ID to filter by
   * @param limit Number of sessions to return (default: 3)
   * @returns Observable<TrainingSession[]> sorted by date ascending
   */
  getUpcomingTrainingSessions(teamId: string, limit = 3): Observable<TrainingSession[]> {
    const now = new Date().toISOString();

    return from(
      this.supabase.client
        .from('training_sessions')
        .select('*')
        .eq('team_id', teamId)
        .gte('date', now)
        .is('deleted_at', null)
        .order('date', { ascending: true })
        .limit(limit),
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          console.error('Error fetching upcoming training sessions:', error);
          return [];
        }
        return (data || []) as TrainingSession[];
      }),
      catchError(() => from([[]])),
    );
  }

  /**
   * Get training session by ID
   * @param id Training session ID
   * @returns Observable<TrainingSession | null>
   */
  getTrainingById(id: string): Observable<TrainingSession | null> {
    return from(
      this.supabase.client.from('training_sessions').select('*').eq('id', id).single(),
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          console.error('Error fetching training session:', error);
          return null;
        }
        return data as TrainingSession | null;
      }),
      catchError(() => from([null])),
    );
  }
}
