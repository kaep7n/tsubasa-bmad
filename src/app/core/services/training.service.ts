import { Injectable } from '@angular/core';
import { Observable, from } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { SupabaseService } from './supabase.service';
import { TrainingSession, TrainingStatus } from '../models/training-session.model';

/**
 * TrainingService
 * Handles training session CRUD operations and queries
 */
@Injectable({
  providedIn: 'root'
})
export class TrainingService {
  constructor(private supabase: SupabaseService) {}

  /**
   * Get upcoming training sessions
   * @param limit Number of sessions to return (default: 3)
   * @returns Observable<TrainingSession[]> sorted by date ascending
   */
  getUpcomingTrainingSessions(limit: number = 3): Observable<TrainingSession[]> {
    const today = new Date().toISOString().split('T')[0];

    return from(
      this.supabase.client
        .from('training_sessions')
        .select('*')
        .gte('date', today)
        .neq('status', 'cancelled')
        .order('date', { ascending: true })
        .limit(limit)
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          console.error('Error fetching upcoming training sessions:', error);
          return [];
        }
        return data ? data.map(this.mapTrainingData) : [];
      }),
      catchError(() => from([[]]))
    );
  }

  /**
   * Get training session by ID
   * @param id Training session ID
   * @returns Observable<TrainingSession | null>
   */
  getTrainingById(id: string): Observable<TrainingSession | null> {
    return from(
      this.supabase.client
        .from('training_sessions')
        .select('*')
        .eq('id', id)
        .single()
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          console.error('Error fetching training session:', error);
          return null;
        }
        return data ? this.mapTrainingData(data) : null;
      }),
      catchError(() => from([null]))
    );
  }

  /**
   * Map Supabase training data to TrainingSession model
   * @param data Raw data from Supabase
   * @returns TrainingSession
   */
  private mapTrainingData(data: any): TrainingSession {
    return {
      id: data.id,
      coach_id: data.coach_id,
      date: new Date(data.date),
      start_time: data.start_time,
      duration_minutes: data.duration_minutes,
      location: data.location,
      status: data.status as TrainingStatus,
      created_at: new Date(data.created_at),
      updated_at: new Date(data.updated_at)
    };
  }
}