import { Injectable, signal } from '@angular/core';
import { Observable, from, of } from 'rxjs';
import { map, switchMap, tap, catchError } from 'rxjs/operators';
import { DatabaseService } from '../../../core/services/database.service';
import { SupabaseService } from '../../../core/services/supabase.service';
import { SyncService } from '../../../core/services/sync.service';
import {
  Game,
  GameFormData,
  CreateGameRequest,
  UpdateGameRequest,
} from '../../../core/models/game.model';

/**
 * GameService
 * Story: 4.2 Game List View, 4.3 Create Game
 * Manages games with offline-first architecture
 */
@Injectable({
  providedIn: 'root',
})
export class GameService {
  // Signal to hold games for reactive UI
  private gamesSignal = signal<Game[]>([]);
  public readonly games = this.gamesSignal.asReadonly();

  constructor(
    private db: DatabaseService,
    private supabase: SupabaseService,
    private syncService: SyncService,
  ) {}

  /**
   * Get all games for a team
   * Cache-first: Returns cached data immediately, then fetches from Supabase in background
   */
  getGames(teamId: string): Observable<Game[]> {
    // First, get from IndexedDB cache
    return from(
      this.db.db.games
        .where('team_id')
        .equals(teamId)
        .and(game => !game.deleted_at)
        .toArray(),
    ).pipe(
      switchMap(async cachedGames => {
        // Sort by date (upcoming first, then past)
        cachedGames.sort((a, b) => {
          const dateA = new Date(a.date).getTime();
          const dateB = new Date(b.date).getTime();
          const now = Date.now();

          // Upcoming games: ascending order
          // Past games: descending order
          const aIsPast = dateA < now;
          const bIsPast = dateB < now;

          if (aIsPast === bIsPast) {
            return aIsPast ? dateB - dateA : dateA - dateB;
          }
          return aIsPast ? 1 : -1;
        });

        this.gamesSignal.set(cachedGames);

        // Background fetch from Supabase if online
        if (navigator.onLine) {
          this.fetchFromSupabase(teamId).subscribe();
        }

        return cachedGames;
      }),
      catchError(error => {
        console.error('Error getting games from IndexedDB:', error);
        return of([]);
      }),
    );
  }

  /**
   * Fetch games from Supabase and update IndexedDB cache
   */
  private fetchFromSupabase(teamId: string): Observable<Game[]> {
    return from(
      this.supabase.client
        .from('games')
        .select('*')
        .eq('team_id', teamId)
        .is('deleted_at', null)
        .order('date', { ascending: true }),
    ).pipe(
      switchMap(async ({ data, error }) => {
        if (error) throw error;

        const games = (data || []) as Game[];

        // Update IndexedDB cache
        await this.db.db.games.bulkPut(games);

        // Sort and update signal
        games.sort((a, b) => {
          const dateA = new Date(a.date).getTime();
          const dateB = new Date(b.date).getTime();
          const now = Date.now();

          const aIsPast = dateA < now;
          const bIsPast = dateB < now;

          if (aIsPast === bIsPast) {
            return aIsPast ? dateB - dateA : dateA - dateB;
          }
          return aIsPast ? 1 : -1;
        });

        this.gamesSignal.set(games);

        return games;
      }),
      catchError(error => {
        console.error('Error fetching games from Supabase:', error);
        return of([]);
      }),
    );
  }

  /**
   * Create a new game
   */
  createGame(teamId: string, gameData: GameFormData): Observable<Game> {
    return from(
      (async () => {
        // Generate client-side UUID
        const id = crypto.randomUUID();
        const now = new Date().toISOString();

        const newGame: Game = {
          id,
          team_id: teamId,
          opponent: gameData.opponent,
          date: gameData.date,
          location: gameData.location || null,
          home_away: gameData.home_away || null,
          status: 'scheduled',
          final_score_team: null,
          final_score_opponent: null,
          result: null,
          calendar_sync_id: null,
          is_protected: false,
          created_at: now,
          updated_at: now,
          deleted_at: null,
        };

        // Save to IndexedDB first
        await this.db.db.games.add(newGame);

        // Update signal
        const currentGames = this.gamesSignal();
        const updatedGames = [newGame, ...currentGames];
        updatedGames.sort((a, b) => {
          const dateA = new Date(a.date).getTime();
          const dateB = new Date(b.date).getTime();
          const now = Date.now();
          const aIsPast = dateA < now;
          const bIsPast = dateB < now;
          if (aIsPast === bIsPast) {
            return aIsPast ? dateB - dateA : dateA - dateB;
          }
          return aIsPast ? 1 : -1;
        });
        this.gamesSignal.set(updatedGames);

        // Queue for sync if offline, otherwise sync immediately
        if (navigator.onLine) {
          const { error } = await this.supabase.client.from('games').insert(newGame);

          if (error) throw error;
        } else {
          await this.syncService.queueOperation('games', 'insert', id, newGame);
        }

        return newGame;
      })(),
    );
  }

  /**
   * Update an existing game
   */
  updateGame(gameId: string, updates: UpdateGameRequest): Observable<Game> {
    return from(
      (async () => {
        const now = new Date().toISOString();
        const updateData = {
          ...updates,
          updated_at: now,
        };

        // Update in IndexedDB
        await this.db.db.games.update(gameId, updateData);

        // Get updated game
        const updatedGame = await this.db.db.games.get(gameId);
        if (!updatedGame) throw new Error('Game not found');

        // Update signal
        const currentGames = this.gamesSignal();
        const index = currentGames.findIndex(g => g.id === gameId);
        if (index !== -1) {
          const newGames = [...currentGames];
          newGames[index] = updatedGame;
          this.gamesSignal.set(newGames);
        }

        // Queue for sync if offline, otherwise sync immediately
        if (navigator.onLine) {
          const { error } = await this.supabase.client
            .from('games')
            .update(updateData)
            .eq('id', gameId);

          if (error) throw error;
        } else {
          await this.syncService.queueOperation('games', 'update', gameId, updateData);
        }

        return updatedGame;
      })(),
    );
  }

  /**
   * Cancel a game (set status to cancelled, not soft delete)
   */
  cancelGame(gameId: string): Observable<void> {
    return from(
      (async () => {
        const now = new Date().toISOString();

        // Update status in IndexedDB
        await this.db.db.games.update(gameId, {
          status: 'cancelled',
          updated_at: now,
        });

        // Update signal
        const currentGames = this.gamesSignal();
        const index = currentGames.findIndex(g => g.id === gameId);
        if (index !== -1) {
          const newGames = [...currentGames];
          newGames[index] = { ...newGames[index], status: 'cancelled', updated_at: now };
          this.gamesSignal.set(newGames);
        }

        // Queue for sync if offline, otherwise sync immediately
        if (navigator.onLine) {
          const { error } = await this.supabase.client
            .from('games')
            .update({ status: 'cancelled', updated_at: now })
            .eq('id', gameId);

          if (error) throw error;
        } else {
          await this.syncService.queueOperation('games', 'update', gameId, {
            status: 'cancelled',
            updated_at: now,
          });
        }
      })(),
    );
  }

  /**
   * Restore a cancelled game
   */
  restoreGame(gameId: string): Observable<void> {
    return from(
      (async () => {
        const now = new Date().toISOString();

        // Update status in IndexedDB
        await this.db.db.games.update(gameId, {
          status: 'scheduled',
          updated_at: now,
        });

        // Update signal
        const currentGames = this.gamesSignal();
        const index = currentGames.findIndex(g => g.id === gameId);
        if (index !== -1) {
          const newGames = [...currentGames];
          newGames[index] = { ...newGames[index], status: 'scheduled', updated_at: now };
          this.gamesSignal.set(newGames);
        }

        // Queue for sync if offline, otherwise sync immediately
        if (navigator.onLine) {
          const { error } = await this.supabase.client
            .from('games')
            .update({ status: 'scheduled', updated_at: now })
            .eq('id', gameId);

          if (error) throw error;
        } else {
          await this.syncService.queueOperation('games', 'update', gameId, {
            status: 'scheduled',
            updated_at: now,
          });
        }
      })(),
    );
  }

  /**
   * Delete a game (soft delete) - only if not protected
   */
  deleteGame(gameId: string): Observable<void> {
    return from(
      (async () => {
        const now = new Date().toISOString();

        // Check if game is protected
        const game = await this.db.db.games.get(gameId);
        if (game?.is_protected) {
          throw new Error('Cannot delete protected game with recorded attendance or goals');
        }

        // Soft delete in IndexedDB
        await this.db.db.games.update(gameId, {
          deleted_at: now,
        });

        // Remove from signal
        const currentGames = this.gamesSignal();
        this.gamesSignal.set(currentGames.filter(g => g.id !== gameId));

        // Queue for sync if offline, otherwise sync immediately
        if (navigator.onLine) {
          const { error } = await this.supabase.client
            .from('games')
            .update({ deleted_at: now })
            .eq('id', gameId);

          if (error) throw error;
        } else {
          await this.syncService.queueOperation('games', 'update', gameId, { deleted_at: now });
        }
      })(),
    );
  }

  /**
   * Get a single game by ID
   */
  getGame(gameId: string): Observable<Game | null> {
    return from(this.db.db.games.get(gameId)).pipe(
      map(game => game || null),
      catchError(error => {
        console.error('Error getting game:', error);
        return of(null);
      }),
    );
  }

  /**
   * Refresh games from Supabase (for pull-to-refresh)
   */
  refreshGames(teamId: string): Observable<Game[]> {
    return this.fetchFromSupabase(teamId);
  }
}
