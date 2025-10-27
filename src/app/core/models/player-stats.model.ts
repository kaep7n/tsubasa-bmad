/**
 * Player Statistics Model
 * Epic: 6 - Player Statistics & Reports
 * Story: 6.1 Player Statistics Aggregation Service
 */

/**
 * Per-player statistics aggregated across games and training
 */
export interface PlayerStats {
  player_id: string;
  player_name: string;
  games_played: number;
  goals_scored: number;
  assists: number;
  attendance_rate: number; // 0-100%
  training_sessions_attended: number;
}

/**
 * Team-level statistics aggregated across games
 */
export interface TeamStats {
  team_id: string;
  total_games_played: number;
  total_goals_scored: number;
  total_goals_conceded: number;
  wins: number;
  draws: number;
  losses: number;
  goal_difference: number;
  win_rate: number; // 0-100%
}

/**
 * Date range for filtering stats
 */
export interface DateRange {
  start: string; // ISO 8601 date string
  end: string; // ISO 8601 date string
}

/**
 * Cached statistics with timestamp
 */
export interface StatsCache {
  cache_key: string;
  data: PlayerStats[] | TeamStats;
  last_calculated: string; // ISO 8601 timestamp
}

/**
 * Helper to check if cache is still valid (< 5 minutes old)
 */
export function isCacheValid(cache: StatsCache, maxAgeMinutes = 5): boolean {
  const cacheTime = new Date(cache.last_calculated).getTime();
  const now = Date.now();
  const ageMinutes = (now - cacheTime) / 1000 / 60;
  return ageMinutes < maxAgeMinutes;
}

/**
 * Helper to create cache key
 */
export function createCacheKey(
  type: 'player' | 'team',
  teamId: string,
  dateRange?: DateRange,
): string {
  if (dateRange) {
    return `${type}_stats_${teamId}_${dateRange.start}_${dateRange.end}`;
  }
  return `${type}_stats_${teamId}_all`;
}
