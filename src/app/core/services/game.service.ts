import { Injectable } from '@angular/core';
import { Observable, from } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { SupabaseService } from './supabase.service';
import { Game } from '../models/game.model';

/**
 * GameService
 * Epic 4: Game Management & Calendar Integration
 * Handles game CRUD operations and queries
 * Note: This is a legacy service - use GameService from features/games for new code
 */
@Injectable({
  providedIn: 'root',
})
export class GameService {
  constructor(private supabase: SupabaseService) {}

  /**
   * Get upcoming games for a team
   * @param teamId Team ID to filter by
   * @param limit Number of games to return (default: 3)
   * @returns Observable<Game[]> sorted by date ascending
   */
  getUpcomingGames(teamId: string, limit = 3): Observable<Game[]> {
    const now = new Date().toISOString();

    return from(
      this.supabase.client
        .from('games')
        .select('*')
        .eq('team_id', teamId)
        .gte('date', now)
        .is('deleted_at', null)
        .neq('status', 'completed')
        .neq('status', 'cancelled')
        .order('date', { ascending: true })
        .limit(limit),
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          console.error('Error fetching upcoming games:', error);
          return [];
        }
        return (data || []) as Game[];
      }),
      catchError(() => from([[]])),
    );
  }

  /**
   * Get recent completed games for a team
   * @param teamId Team ID to filter by
   * @param limit Number of games to return (default: 5)
   * @returns Observable<Game[]> sorted by date descending
   */
  getRecentGames(teamId: string, limit = 5): Observable<Game[]> {
    return from(
      this.supabase.client
        .from('games')
        .select('*')
        .eq('team_id', teamId)
        .eq('status', 'completed')
        .is('deleted_at', null)
        .order('date', { ascending: false })
        .limit(limit),
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          console.error('Error fetching recent games:', error);
          return [];
        }
        return (data || []) as Game[];
      }),
      catchError(() => from([[]])),
    );
  }

  /**
   * Get game by ID
   * @param id Game ID
   * @returns Observable<Game | null>
   */
  getGameById(id: string): Observable<Game | null> {
    return from(this.supabase.client.from('games').select('*').eq('id', id).single()).pipe(
      map(({ data, error }) => {
        if (error) {
          console.error('Error fetching game:', error);
          return null;
        }
        return data as Game | null;
      }),
      catchError(() => from([null])),
    );
  }
}
