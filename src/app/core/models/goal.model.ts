/**
 * Goal Models
 * Story: 5.1 Goals Database Schema
 * Models for goals, goal assists, and opponent goals
 */

export type SyncState = 'pending' | 'syncing' | 'synced' | 'error';

/**
 * Goal scored by a player
 */
export interface Goal {
  id: string;
  game_id: string;
  player_id: string;
  scored_at_minute: number; // 0-120
  scored_at_timestamp: string; // ISO 8601
  notes?: string | null;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
  sync_state: SyncState;
}

/**
 * Assist for a goal (junction table)
 */
export interface GoalAssist {
  id: string;
  goal_id: string;
  player_id: string;
  created_at: string;
  sync_state: SyncState;
}

/**
 * Goal scored by opponent team
 */
export interface OpponentGoal {
  id: string;
  game_id: string;
  scored_at_minute: number; // 0-120
  scored_at_timestamp: string; // ISO 8601
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
  sync_state: SyncState;
}

/**
 * Extended Goal with player and assists info (for UI)
 */
export interface GoalWithDetails extends Goal {
  player_name?: string;
  player_number?: number;
  assists?: GoalAssist[];
  assist_players?: Array<{
    id: string;
    name: string;
    number?: number;
  }>;
}

/**
 * Form data for creating a goal
 */
export interface GoalFormData {
  game_id: string;
  player_id: string;
  scored_at_minute: number;
  scored_at_timestamp: string;
  notes?: string;
  assist_player_ids?: string[]; // Players who assisted
}

/**
 * Form data for creating an opponent goal
 */
export interface OpponentGoalFormData {
  game_id: string;
  scored_at_minute: number;
  scored_at_timestamp: string;
}

/**
 * Timeline event for game display
 */
export interface GameTimelineEvent {
  type: 'goal' | 'opponent_goal';
  minute: number;
  timestamp: string;
  player_name?: string;
  player_number?: number;
  assists?: Array<{
    player_name: string;
    player_number?: number;
  }>;
}

/**
 * Format minute display (e.g., "45+2" for injury time)
 */
export function formatGameMinute(minute: number): string {
  if (minute <= 45) {
    return `${minute}'`;
  } else if (minute <= 90) {
    const extraTime = minute - 45;
    return extraTime > 0 ? `45+${extraTime}'` : "45'";
  } else {
    const extraTime = minute - 90;
    return extraTime > 0 ? `90+${extraTime}'` : "90'";
  }
}

/**
 * Get current game minute from timestamp
 */
export function getGameMinute(gameStartTime: Date, eventTime: Date): number {
  const diff = Math.floor((eventTime.getTime() - gameStartTime.getTime()) / 60000);
  return Math.max(0, Math.min(120, diff));
}

/**
 * Validate goal minute (0-120)
 */
export function isValidGameMinute(minute: number): boolean {
  return minute >= 0 && minute <= 120;
}
