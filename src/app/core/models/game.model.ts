/**
 * Game Model
 * Represents a game/match scheduled or completed by the coach
 */

export type GameStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';

export interface Game {
  id: string;
  coach_id: string;
  date: Date;
  start_time: string | null;
  opponent: string;
  location: string | null;
  status: GameStatus;
  our_score: number;
  opponent_score: number;
  created_at: Date;
  updated_at: Date;
}

export interface GameResultBadge {
  label: 'W' | 'D' | 'L';
  color: 'success' | 'warning' | 'error';
}

export interface CreateGameRequest {
  coach_id: string;
  date: string; // ISO date string
  start_time?: string;
  opponent: string;
  location?: string;
  status?: GameStatus;
}

export interface UpdateGameRequest {
  date?: string;
  start_time?: string;
  opponent?: string;
  location?: string;
  status?: GameStatus;
  our_score?: number;
  opponent_score?: number;
}
