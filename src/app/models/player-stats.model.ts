/**
 * Player Statistics Model
 * Story: 2.7 Player Statistics Service Foundation
 *
 * Represents aggregated statistics for a player
 */

export interface PlayerStats {
  /** Player ID */
  playerId: string;

  /** Total games played (attended) */
  gamesPlayed: number;

  /** Total goals scored */
  goalsScored: number;

  /** Total assists */
  assists: number;

  /** Attendance rate as percentage (0-100) */
  attendanceRate: number;

  /** Total training sessions attended */
  trainingSessionsAttended: number;

  /** Computed: Average goals per game */
  goalsPerGame: number;

  /** Timestamp of when stats were last calculated */
  lastUpdated: Date;
}

/**
 * Helper to create empty stats for a player
 */
export function createEmptyPlayerStats(playerId: string): PlayerStats {
  return {
    playerId,
    gamesPlayed: 0,
    goalsScored: 0,
    assists: 0,
    attendanceRate: 0,
    trainingSessionsAttended: 0,
    goalsPerGame: 0,
    lastUpdated: new Date(),
  };
}

/**
 * Helper to calculate goals per game
 */
export function calculateGoalsPerGame(goalsScored: number, gamesPlayed: number): number {
  if (gamesPlayed === 0) return 0;
  return Math.round((goalsScored / gamesPlayed) * 100) / 100; // 2 decimal places
}

/**
 * Helper to calculate attendance rate
 */
export function calculateAttendanceRate(attended: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((attended / total) * 100 * 100) / 100; // 2 decimal places
}
