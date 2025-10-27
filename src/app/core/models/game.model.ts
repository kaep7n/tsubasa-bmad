/**
 * Game Model
 * Epic 4: Game Management & Calendar Integration
 * Represents a game/match scheduled or completed by the team
 */

export type GameStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
export type HomeAway = 'home' | 'away';
export type GameResult = 'win' | 'draw' | 'loss';

/**
 * Game entity (from database)
 */
export interface Game {
  id: string;
  team_id: string;
  opponent: string;
  date: string; // ISO 8601 timestamp
  location: string | null;
  home_away: HomeAway | null;
  status: GameStatus;
  final_score_team: number | null;
  final_score_opponent: number | null;
  result: GameResult | null;
  calendar_sync_id: string | null;
  is_protected: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;

  // Legacy field (kept for compatibility)
  coach_id?: string;
}

/**
 * Form data for creating a game
 */
export interface GameFormData {
  opponent: string;
  date: string; // ISO 8601 timestamp
  location?: string | null;
  home_away?: HomeAway | null;
}

/**
 * Create game request (includes team_id)
 */
export interface CreateGameRequest extends GameFormData {
  team_id: string;
  status?: GameStatus;
}

/**
 * Update game request
 */
export interface UpdateGameRequest {
  opponent?: string;
  date?: string;
  location?: string | null;
  home_away?: HomeAway | null;
  status?: GameStatus;
  final_score_team?: number | null;
  final_score_opponent?: number | null;
  result?: GameResult | null;
}

/**
 * Result badge for UI display
 */
export interface GameResultBadge {
  label: 'W' | 'D' | 'L';
  color: 'success' | 'warning' | 'error';
}

/**
 * Calculate game result badge from scores
 */
export function getGameResultBadge(game: Game): GameResultBadge | null {
  if (game.final_score_team === null || game.final_score_opponent === null) {
    return null;
  }

  if (game.final_score_team > game.final_score_opponent) {
    return { label: 'W', color: 'success' };
  } else if (game.final_score_team < game.final_score_opponent) {
    return { label: 'L', color: 'error' };
  } else {
    return { label: 'D', color: 'warning' };
  }
}

/**
 * Format game date for display
 */
export function formatGameDate(dateString: string): string {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(dateString));
}

/**
 * Format game time for display
 */
export function formatGameTime(dateString: string): string {
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(dateString));
}

/**
 * Check if game is in the past
 */
export function isGamePast(dateString: string): boolean {
  return new Date(dateString) < new Date();
}

/**
 * Check if game is upcoming (future and not completed/cancelled)
 */
export function isGameUpcoming(game: Game): boolean {
  return !isGamePast(game.date) && game.status !== 'completed' && game.status !== 'cancelled';
}
