import { Injectable, inject, signal } from '@angular/core';
import { Observable, from, of, catchError, tap, map } from 'rxjs';
import { Player } from '../../../models/player.model';
import { SupabaseService } from '../../../core/services/supabase.service';
import { DatabaseService } from '../../../core/services/database.service';
import { AuthService } from '../../../core/services/auth.service';

/**
 * PlayerService
 * Handles CRUD operations for players with offline-first pattern:
 * 1. Check IndexedDB cache first
 * 2. Fetch from Supabase in background
 * 3. Update cache with fresh data
 *
 * Story: 2.2 Player List View
 */
@Injectable({
  providedIn: 'root',
})
export class PlayerService {
  private supabase = inject(SupabaseService);
  private db = inject(DatabaseService);
  private auth = inject(AuthService);

  // Reactive state
  private playersSignal = signal<Player[]>([]);
  players = this.playersSignal.asReadonly();

  /**
   * Get all players for the current team
   * Implements offline-first pattern
   */
  getPlayers(teamId: string): Observable<Player[]> {
    // First, get from IndexedDB
    return from(this.db.db.players.where('team_id').equals(teamId).toArray()).pipe(
      tap(cachedPlayers => {
        // Update signal with cached data immediately
        this.playersSignal.set(cachedPlayers as Player[]);

        // Then fetch from Supabase in background
        this.fetchPlayersFromSupabase(teamId);
      }),
      catchError(error => {
        console.error('Error loading players from IndexedDB:', error);
        // Fallback to Supabase if IndexedDB fails
        return this.fetchPlayersFromSupabase(teamId);
      }),
    );
  }

  /**
   * Fetch players from Supabase and update cache
   * @private
   */
  private fetchPlayersFromSupabase(teamId: string): Observable<Player[]> {
    return from(
      this.supabase.client
        .from('players')
        .select('*')
        .eq('team_id', teamId)
        .is('deleted_at', null)
        .order('first_name', { ascending: true })
        .then(async ({ data, error }) => {
          if (error) throw error;

          const players = data as Player[];

          // Update IndexedDB cache
          await this.updateCache(players);

          // Update signal
          this.playersSignal.set(players);

          return players;
        }),
    ).pipe(
      catchError(error => {
        console.error('Error fetching players from Supabase:', error);
        return of([]);
      }),
    );
  }

  /**
   * Get a single player by ID
   */
  getPlayer(id: string): Observable<Player | null> {
    // Try IndexedDB first
    return from(this.db.db.players.get(id)).pipe(
      tap(player => {
        if (!player) {
          // Fetch from Supabase if not in cache
          this.fetchPlayerFromSupabase(id);
        }
      }),
      catchError(() => this.fetchPlayerFromSupabase(id)),
    ) as Observable<Player | null>;
  }

  /**
   * Fetch a single player from Supabase
   * @private
   */
  private fetchPlayerFromSupabase(id: string): Observable<Player | null> {
    return from(
      this.supabase.client
        .from('players')
        .select('*')
        .eq('id', id)
        .single()
        .then(async ({ data, error }) => {
          if (error) throw error;

          const player = data as Player;

          // Update IndexedDB cache
          await this.db.db.players.put(player);

          return player;
        }),
    ).pipe(
      catchError(error => {
        console.error('Error fetching player from Supabase:', error);
        return of(null);
      }),
    );
  }

  /**
   * Refresh players from Supabase (for pull-to-refresh)
   */
  refreshPlayers(teamId: string): Observable<Player[]> {
    return this.fetchPlayersFromSupabase(teamId);
  }

  /**
   * Update IndexedDB cache with players
   * @private
   */
  private async updateCache(players: Player[]): Promise<void> {
    try {
      await this.db.db.players.bulkPut(players);
    } catch (error) {
      console.error('Error updating player cache:', error);
    }
  }

  /**
   * Create a new player
   */
  createPlayer(
    player: Omit<Player, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>,
  ): Observable<Player> {
    const newPlayer = {
      ...player,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      deleted_at: null,
    };

    return from(
      this.supabase.client
        .from('players')
        .insert(newPlayer)
        .select()
        .single()
        .then(async ({ data, error }) => {
          if (error) throw error;

          const createdPlayer = data as Player;

          // Update IndexedDB cache
          await this.db.db.players.put(createdPlayer);

          // Update signal
          const currentPlayers = this.playersSignal();
          this.playersSignal.set([...currentPlayers, createdPlayer]);

          return createdPlayer;
        }),
    ).pipe(
      catchError(error => {
        console.error('Error creating player:', error);
        throw error;
      }),
    );
  }

  /**
   * Upload player photo to Supabase Storage
   */
  uploadPlayerPhoto(teamId: string, playerId: string, file: File): Observable<string> {
    const fileExtension = file.name.split('.').pop() || 'jpg';
    const filePath = `${teamId}/${playerId}.${fileExtension}`;

    return from(
      this.supabase.client.storage
        .from('player-photos')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
        })
        .then(({ error }) => {
          if (error) throw error;

          // Get public URL
          const { data: urlData } = this.supabase.client.storage
            .from('player-photos')
            .getPublicUrl(filePath);

          return urlData.publicUrl;
        }),
    ).pipe(
      catchError(error => {
        console.error('Error uploading player photo:', error);
        throw error;
      }),
    );
  }

  /**
   * Update an existing player
   */
  updatePlayer(playerId: string, updates: Partial<Player>): Observable<Player> {
    const updateData = {
      ...updates,
      updated_at: new Date().toISOString(),
    };

    return from(
      this.supabase.client
        .from('players')
        .update(updateData)
        .eq('id', playerId)
        .select()
        .single()
        .then(async ({ data, error }) => {
          if (error) throw error;

          const updatedPlayer = data as Player;

          // Update IndexedDB cache
          await this.db.db.players.put(updatedPlayer);

          // Update signal
          const currentPlayers = this.playersSignal();
          const index = currentPlayers.findIndex(p => p.id === playerId);
          if (index !== -1) {
            const newPlayers = [...currentPlayers];
            newPlayers[index] = updatedPlayer;
            this.playersSignal.set(newPlayers);
          }

          return updatedPlayer;
        }),
    ).pipe(
      catchError(error => {
        console.error('Error updating player:', error);
        throw error;
      }),
    );
  }

  /**
   * Soft delete a player
   */
  deletePlayer(playerId: string): Observable<void> {
    return this.updatePlayer(playerId, {
      deleted_at: new Date().toISOString(),
    }).pipe(
      tap(() => {
        // Remove from signal
        const currentPlayers = this.playersSignal();
        this.playersSignal.set(currentPlayers.filter(p => p.id !== playerId));
      }),
      map(() => undefined),
      catchError(error => {
        console.error('Error deleting player:', error);
        throw error;
      }),
    );
  }

  /**
   * Restore a soft-deleted player (undo delete)
   */
  restorePlayer(playerId: string): Observable<Player> {
    return this.updatePlayer(playerId, {
      deleted_at: null,
    });
  }
}
