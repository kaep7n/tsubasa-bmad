import { Injectable, signal } from '@angular/core';
import { Observable, from, of } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { DatabaseService } from './database.service';
import {
  PlayerStats,
  TeamStats,
  DateRange,
  StatsCache,
  isCacheValid,
  createCacheKey,
} from '../models/player-stats.model';

/**
 * PlayerStatsService
 * Story: 6.1 Player Statistics Aggregation Service
 * Aggregates player and team statistics across games and training
 */
@Injectable({
  providedIn: 'root',
})
export class PlayerStatsService {
  // Signals for reactive state
  private playerStatsSignal = signal<PlayerStats[]>([]);
  private teamStatsSignal = signal<TeamStats | null>(null);
  private isCalculatingSignal = signal(false);

  // Readonly getters for signals
  public readonly playerStats = this.playerStatsSignal.asReadonly();
  public readonly teamStats = this.teamStatsSignal.asReadonly();
  public readonly isCalculating = this.isCalculatingSignal.asReadonly();

  constructor(private db: DatabaseService) {}

  /**
   * Calculate player statistics for a team
   * Uses caching with 5-minute invalidation
   */
  calculatePlayerStats(teamId: string, dateRange?: DateRange): Observable<PlayerStats[]> {
    return from(
      (async () => {
        this.isCalculatingSignal.set(true);

        try {
          // Check cache first
          const cacheKey = createCacheKey('player', teamId, dateRange);
          const cachedStats = await this.db.db.stats_cache.get(cacheKey);

          if (cachedStats && isCacheValid(cachedStats)) {
            const stats = cachedStats.data as PlayerStats[];
            this.playerStatsSignal.set(stats);
            this.isCalculatingSignal.set(false);
            return stats;
          }

          // Calculate fresh stats
          const stats = await this.computePlayerStats(teamId, dateRange);

          // Update cache
          const cache: StatsCache = {
            cache_key: cacheKey,
            data: stats,
            last_calculated: new Date().toISOString(),
          };
          await this.db.db.stats_cache.put(cache);

          // Update signal
          this.playerStatsSignal.set(stats);
          this.isCalculatingSignal.set(false);

          return stats;
        } catch (error) {
          console.error('Error calculating player stats:', error);
          this.isCalculatingSignal.set(false);
          throw error;
        }
      })(),
    );
  }

  /**
   * Calculate team statistics
   * Uses caching with 5-minute invalidation
   */
  calculateTeamStats(teamId: string, dateRange?: DateRange): Observable<TeamStats> {
    return from(
      (async () => {
        this.isCalculatingSignal.set(true);

        try {
          // Check cache first
          const cacheKey = createCacheKey('team', teamId, dateRange);
          const cachedStats = await this.db.db.stats_cache.get(cacheKey);

          if (cachedStats && isCacheValid(cachedStats)) {
            const stats = cachedStats.data as TeamStats;
            this.teamStatsSignal.set(stats);
            this.isCalculatingSignal.set(false);
            return stats;
          }

          // Calculate fresh stats
          const stats = await this.computeTeamStats(teamId, dateRange);

          // Update cache
          const cache: StatsCache = {
            cache_key: cacheKey,
            data: stats,
            last_calculated: new Date().toISOString(),
          };
          await this.db.db.stats_cache.put(cache);

          // Update signal
          this.teamStatsSignal.set(stats);
          this.isCalculatingSignal.set(false);

          return stats;
        } catch (error) {
          console.error('Error calculating team stats:', error);
          this.isCalculatingSignal.set(false);
          throw error;
        }
      })(),
    );
  }

  /**
   * Invalidate all cached statistics for a team
   * Called when new data is added (goals, games, attendance)
   */
  async invalidateCache(teamId: string): Promise<void> {
    // Delete all cache entries for this team
    const allCache = await this.db.db.stats_cache.toArray();
    const teamCache = allCache.filter(cache => cache.cache_key.includes(teamId));

    for (const cache of teamCache) {
      await this.db.db.stats_cache.delete(cache.cache_key);
    }
  }

  /**
   * Compute player statistics from database
   */
  private async computePlayerStats(teamId: string, dateRange?: DateRange): Promise<PlayerStats[]> {
    // Get all players for team
    const players = await this.db.db.players.where('team_id').equals(teamId).toArray();

    // Get games for team (with optional date range)
    let gamesQuery = this.db.db.games.where('team_id').equals(teamId);

    if (dateRange) {
      gamesQuery = gamesQuery.and(
        game => !game.deleted_at && game.date >= dateRange.start && game.date <= dateRange.end,
      );
    } else {
      gamesQuery = gamesQuery.and(game => !game.deleted_at);
    }

    const games = await gamesQuery.toArray();
    const gameIds = games.map(g => g.id);

    // Calculate stats for each player
    const statsPromises = players.map(async player => {
      const stats: PlayerStats = {
        player_id: player.id,
        player_name: `${player.first_name} ${player.last_name}`,
        games_played: await this.countGamesPlayed(player.id, gameIds),
        goals_scored: await this.countGoals(player.id, gameIds),
        assists: await this.countAssists(player.id, gameIds),
        attendance_rate: await this.calculateAttendanceRate(player.id, gameIds),
        training_sessions_attended: await this.countTrainingSessions(player.id, teamId, dateRange),
      };
      return stats;
    });

    return Promise.all(statsPromises);
  }

  /**
   * Compute team statistics from database
   */
  private async computeTeamStats(teamId: string, dateRange?: DateRange): Promise<TeamStats> {
    // Get games for team (completed only)
    let gamesQuery = this.db.db.games
      .where('team_id')
      .equals(teamId)
      .and(game => !game.deleted_at && game.status === 'completed');

    if (dateRange) {
      gamesQuery = gamesQuery.and(
        game => game.date >= dateRange.start && game.date <= dateRange.end,
      );
    }

    const games = await gamesQuery.toArray();
    const gameIds = games.map(g => g.id);

    // Count goals
    const goals = await this.db.db.goals.where('game_id').anyOf(gameIds).toArray();
    const opponentGoals = await this.db.db.opponent_goals.where('game_id').anyOf(gameIds).toArray();

    // Count results
    const wins = games.filter(g => g.result === 'win').length;
    const draws = games.filter(g => g.result === 'draw').length;
    const losses = games.filter(g => g.result === 'loss').length;

    const totalGamesPlayed = games.length;
    const totalGoalsScored = goals.length;
    const totalGoalsConceded = opponentGoals.length;
    const goalDifference = totalGoalsScored - totalGoalsConceded;
    const winRate = totalGamesPlayed > 0 ? (wins / totalGamesPlayed) * 100 : 0;

    return {
      team_id: teamId,
      total_games_played: totalGamesPlayed,
      total_goals_scored: totalGoalsScored,
      total_goals_conceded: totalGoalsConceded,
      wins,
      draws,
      losses,
      goal_difference: goalDifference,
      win_rate: parseFloat(winRate.toFixed(2)),
    };
  }

  /**
   * Count games played by player
   */
  private async countGamesPlayed(playerId: string, gameIds: string[]): Promise<number> {
    if (gameIds.length === 0) return 0;

    const attendance = await this.db.db.game_attendance
      .where('game_id')
      .anyOf(gameIds)
      .and(att => att.player_id === playerId && att.status === 'attended')
      .toArray();

    return attendance.length;
  }

  /**
   * Count goals scored by player
   */
  private async countGoals(playerId: string, gameIds: string[]): Promise<number> {
    if (gameIds.length === 0) return 0;

    const goals = await this.db.db.goals
      .where('game_id')
      .anyOf(gameIds)
      .and(goal => goal.player_id === playerId)
      .toArray();

    return goals.length;
  }

  /**
   * Count assists by player
   */
  private async countAssists(playerId: string, gameIds: string[]): Promise<number> {
    if (gameIds.length === 0) return 0;

    // Get all goals for these games
    const goals = await this.db.db.goals.where('game_id').anyOf(gameIds).toArray();
    const goalIds = goals.map(g => g.id);

    if (goalIds.length === 0) return 0;

    // Count assists for these goals
    const assists = await this.db.db.goal_assists
      .where('goal_id')
      .anyOf(goalIds)
      .and(assist => assist.player_id === playerId)
      .toArray();

    return assists.length;
  }

  /**
   * Calculate attendance rate (percentage of games attended)
   */
  private async calculateAttendanceRate(playerId: string, gameIds: string[]): Promise<number> {
    if (gameIds.length === 0) return 0;

    // Count total games where player had attendance record
    const allAttendance = await this.db.db.game_attendance
      .where('game_id')
      .anyOf(gameIds)
      .and(att => att.player_id === playerId)
      .toArray();

    const totalGames = allAttendance.length;
    if (totalGames === 0) return 0;

    // Count attended games
    const attendedGames = allAttendance.filter(att => att.status === 'attended').length;

    const rate = (attendedGames / totalGames) * 100;
    return parseFloat(rate.toFixed(2));
  }

  /**
   * Count training sessions attended by player
   */
  private async countTrainingSessions(
    playerId: string,
    teamId: string,
    dateRange?: DateRange,
  ): Promise<number> {
    // Get training sessions for team
    let sessionsQuery = this.db.db.training_sessions.where('team_id').equals(teamId);

    if (dateRange) {
      sessionsQuery = sessionsQuery.and(
        session => session.date >= dateRange.start && session.date <= dateRange.end,
      );
    }

    const sessions = await sessionsQuery.toArray();
    const sessionIds = sessions.map(s => s.id);

    if (sessionIds.length === 0) return 0;

    // Count attended training sessions
    const attendance = await this.db.db.training_attendance
      .where('training_session_id')
      .anyOf(sessionIds)
      .and(att => att.player_id === playerId && att.status === 'attended')
      .toArray();

    return attendance.length;
  }
}
