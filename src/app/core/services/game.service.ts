import { Injectable } from '@angular/core';
import { Observable, from } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { SupabaseService } from './supabase.service';
import { Game, GameStatus } from '../models/game.model';

/**
 * GameService
 * Handles game CRUD operations and queries
 */
@Injectable({
  providedIn: 'root',
})
export class GameService {
  constructor(private supabase: SupabaseService) {}

  /**
   * Get upcoming games
   * @param limit Number of games to return (default: 3)
   * @returns Observable<Game[]> sorted by date ascending
   */
  getUpcomingGames(limit = 3): Observable<Game[]> {
    const today = new Date().toISOString().split('T')[0];

    return from(
      this.supabase.client
        .from('games')
        .select('*')
        .gte('date', today)
        .neq('status', 'completed')
        .order('date', { ascending: true })
        .limit(limit),
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          console.error('Error fetching upcoming games:', error);
          return [];
        }
        return data ? data.map(this.mapGameData) : [];
      }),
      catchError(() => from([[]])),
    );
  }

  /**
   * Get recent completed games
   * @param limit Number of games to return (default: 5)
   * @returns Observable<Game[]> sorted by date descending
   */
  getRecentGames(limit = 5): Observable<Game[]> {
    return from(
      this.supabase.client
        .from('games')
        .select('*')
        .eq('status', 'completed')
        .order('date', { ascending: false })
        .limit(limit),
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          console.error('Error fetching recent games:', error);
          return [];
        }
        return data ? data.map(this.mapGameData) : [];
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
        return data ? this.mapGameData(data) : null;
      }),
      catchError(() => from([null])),
    );
  }

  /**
   * Map Supabase game data to Game model
   * @param data Raw data from Supabase
   * @returns Game
   */
  private mapGameData(data: any): Game {
    return {
      id: data.id,
      coach_id: data.coach_id,
      date: new Date(data.date),
      start_time: data.start_time,
      opponent: data.opponent,
      location: data.location,
      status: data.status as GameStatus,
      our_score: data.our_score || 0,
      opponent_score: data.opponent_score || 0,
      created_at: new Date(data.created_at),
      updated_at: new Date(data.updated_at),
    };
  }
}
