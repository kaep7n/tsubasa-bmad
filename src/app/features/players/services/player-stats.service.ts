import { Injectable, inject, signal } from '@angular/core';
import { Observable, from, of, forkJoin } from 'rxjs';
import { tap, switchMap } from 'rxjs/operators';
import { PlayerStats, createEmptyPlayerStats } from '../../../models/player-stats.model';
import { DatabaseService } from '../../../core/services/database.service';

/**
 * PlayerStatsService
 * Foundation service for calculating and caching player statistics
 * Story: 2.7 Player Statistics Service Foundation
 *
 * Features:
 * - Calculates aggregated player statistics from game and training data
 * - In-memory cache with 5-minute TTL
 * - Cache invalidation on data changes
 * - Reactive state with signals
 *
 * Note: Full implementation requires tables from Epic 3 & 4:
 * - game_attendance (Epic 4)
 * - goals (Epic 4)
 * - goal_assists (Epic 4)
 * - training_attendance (Epic 3)
 *
 * Current implementation returns placeholder data until those tables exist.
 */
@Injectable({
  providedIn: 'root',
})
export class PlayerStatsService {
  private db = inject(DatabaseService);

  // In-memory cache with TTL
  private cache = new Map<string, { stats: PlayerStats; timestamp: number }>();
  private readonly TTL = 5 * 60 * 1000; // 5 minutes in milliseconds

  // Reactive state - Map of player ID to stats
  private playerStatsSignal = signal<Map<string, PlayerStats>>(new Map());
  playerStats = this.playerStatsSignal.asReadonly();

  /**
   * Get statistics for a single player
   *
   * Implementation:
   * 1. Check cache first
   * 2. If cache miss or expired, query IndexedDB
   * 3. Update cache and signal
   * 4. Return stats
   *
   * @param playerId - Player ID
   * @returns Observable of player statistics
   */
  getPlayerStats(playerId: string): Observable<PlayerStats> {
    // Check cache
    const cached = this.cache.get(playerId);
    if (cached && Date.now() - cached.timestamp < this.TTL) {
      return of(cached.stats);
    }

    // Cache miss or expired - query database
    return this.queryPlayerStats(playerId).pipe(
      tap(stats => {
        // Update cache
        this.cache.set(playerId, {
          stats,
          timestamp: Date.now(),
        });

        // Update signal
        const currentStats = new Map(this.playerStatsSignal());
        currentStats.set(playerId, stats);
        this.playerStatsSignal.set(currentStats);
      }),
    );
  }

  /**
   * Get statistics for all players in a team
   *
   * @param teamId - Team ID
   * @returns Observable of array of player statistics
   */
  getAllPlayerStats(teamId: string): Observable<PlayerStats[]> {
    return from(
      this.db.db.players
        .where('team_id')
        .equals(teamId)
        .and(p => !p.deleted_at)
        .toArray(),
    ).pipe(
      switchMap(players => {
        if (players.length === 0) {
          return of([]);
        }

        // Query stats for each player
        const statsObservables = players.map(player => this.queryPlayerStats(player.id));

        // Wait for all to complete
        return forkJoin(statsObservables);
      }),
    );
  }

  /**
   * Query player statistics from IndexedDB
   * @private
   *
   * TODO: Replace placeholder implementation with real queries when tables exist
   *
   * Required tables (Epic 3 & 4):
   * - game_attendance: player_id, status ('attended' | 'excused' | 'unexcused')
   * - goals: scorer_id, game_id
   * - goal_assists: player_id, goal_id
   * - training_attendance: player_id, status ('attended' | 'excused' | 'unexcused')
   */
  private queryPlayerStats(playerId: string): Observable<PlayerStats> {
    return from(this.calculateStats(playerId));
  }

  /**
   * Calculate statistics for a player
   * @private
   */
  private async calculateStats(playerId: string): Promise<PlayerStats> {
    // TODO: Replace with real queries when tables exist
    // For now, return empty stats as placeholder

    /* Future implementation (when tables exist):

    // Count goals scored
    const goalsScored = await this.db.db.goals
      .where('scorer_id')
      .equals(playerId)
      .count();

    // Count assists
    const assists = await this.db.db.goalAssists
      .where('player_id')
      .equals(playerId)
      .count();

    // Count games attended
    const gamesPlayed = await this.db.db.gameAttendance
      .where({ player_id: playerId, status: 'attended' })
      .count();

    // Count total games for team (to calculate attendance rate)
    const player = await this.db.db.players.get(playerId);
    const totalGames = await this.db.db.games
      .where('team_id')
      .equals(player.team_id)
      .count();

    // Count training sessions attended
    const trainingSessionsAttended = await this.db.db.trainingAttendance
      .where({ player_id: playerId, status: 'attended' })
      .count();

    // Calculate derived stats
    const attendanceRate = calculateAttendanceRate(gamesPlayed, totalGames);
    const goalsPerGame = calculateGoalsPerGame(goalsScored, gamesPlayed);

    return {
      playerId,
      gamesPlayed,
      goalsScored,
      assists,
      attendanceRate,
      trainingSessionsAttended,
      goalsPerGame,
      lastUpdated: new Date(),
    };
    */

    // Placeholder: Return empty stats
    return createEmptyPlayerStats(playerId);
  }

  /**
   * Invalidate cache for a specific player
   * Call this when underlying data changes (new goal, attendance marked, etc.)
   *
   * @param playerId - Player ID to invalidate
   */
  invalidatePlayerCache(playerId: string): void {
    this.cache.delete(playerId);

    // Remove from signal
    const currentStats = new Map(this.playerStatsSignal());
    currentStats.delete(playerId);
    this.playerStatsSignal.set(currentStats);
  }

  /**
   * Invalidate cache for all players
   * Call this on bulk data changes
   */
  invalidateAllCache(): void {
    this.cache.clear();
    this.playerStatsSignal.set(new Map());
  }

  /**
   * Invalidate cache for all players in a team
   * @param teamId - Team ID
   */
  invalidateTeamCache(teamId: string): void {
    // Remove all cached entries for players in this team
    from(this.db.db.players.where('team_id').equals(teamId).toArray()).subscribe(players => {
      players.forEach(player => this.invalidatePlayerCache(player.id));
    });
  }

  /**
   * Refresh stats for a player (force re-query)
   * @param playerId - Player ID
   */
  refreshPlayerStats(playerId: string): Observable<PlayerStats> {
    this.invalidatePlayerCache(playerId);
    return this.getPlayerStats(playerId);
  }
}
