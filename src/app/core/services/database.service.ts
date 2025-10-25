import { Injectable } from '@angular/core';
import Dexie, { Table } from 'dexie';
import { Team } from '../models/team.model';
import { Game } from '../models/game.model';
import { TrainingSession } from '../models/training-session.model';
import { SyncOperation } from '../models/sync-operation.model';

/**
 * Player interface (will be fully defined in Epic 2)
 */
export interface Player {
  id: string;
  team_id: string;
  coach_id: string;
  name: string;
  position?: string;
  jersey_number?: number;
  created_at: Date;
  updated_at: Date;
}

/**
 * Goal interface (will be fully defined in Epic 4)
 */
export interface Goal {
  id: string;
  game_id: string;
  scorer_id: string;
  assist_id?: string;
  minute: number;
  created_at: Date;
}

/**
 * Goal Assist interface
 */
export interface GoalAssist {
  id: string;
  goal_id: string;
  player_id: string;
  created_at: Date;
}

/**
 * Opponent Goal interface
 */
export interface OpponentGoal {
  id: string;
  game_id: string;
  minute: number;
  created_at: Date;
}

/**
 * Game Attendance interface
 */
export interface GameAttendance {
  id: string;
  game_id: string;
  player_id: string;
  status: 'present' | 'absent' | 'late';
  created_at: Date;
}

/**
 * Training Attendance interface
 */
export interface TrainingAttendance {
  id: string;
  training_id: string;
  player_id: string;
  status: 'present' | 'absent' | 'late';
  created_at: Date;
}

/**
 * TsubasaDatabase
 * Dexie database for offline storage
 */
export class TsubasaDatabase extends Dexie {
  // Tables
  teams!: Table<Team, string>;
  players!: Table<Player, string>;
  games!: Table<Game, string>;
  training_sessions!: Table<TrainingSession, string>;
  goals!: Table<Goal, string>;
  goal_assists!: Table<GoalAssist, string>;
  opponent_goals!: Table<OpponentGoal, string>;
  game_attendance!: Table<GameAttendance, string>;
  training_attendance!: Table<TrainingAttendance, string>;
  sync_queue!: Table<SyncOperation, number>;

  constructor() {
    super('TsubasaDB');

    this.version(1).stores({
      // Teams table
      teams: 'id, created_by, name',

      // Players table - indexed by team_id and coach_id for filtering
      players: 'id, team_id, coach_id, jersey_number',

      // Games table - indexed by coach_id and date for filtering
      games: 'id, coach_id, date, status',

      // Training sessions table - indexed by coach_id and date
      training_sessions: 'id, coach_id, date, status',

      // Goals table - indexed by game_id and scorer_id
      goals: 'id, game_id, scorer_id, minute',

      // Goal assists table - indexed by goal_id and player_id
      goal_assists: 'id, goal_id, player_id',

      // Opponent goals table - indexed by game_id
      opponent_goals: 'id, game_id, minute',

      // Game attendance table - indexed by game_id and player_id
      game_attendance: 'id, game_id, player_id, status',

      // Training attendance table - indexed by training_id and player_id
      training_attendance: 'id, training_id, player_id, status',

      // Sync queue table - auto-increment id, indexed by timestamp and synced status
      sync_queue: '++id, timestamp, synced, table'
    });
  }
}

/**
 * DatabaseService
 * Provides access to IndexedDB via Dexie
 */
@Injectable({
  providedIn: 'root'
})
export class DatabaseService {
  public db: TsubasaDatabase;

  constructor() {
    this.db = new TsubasaDatabase();
  }

  /**
   * Clear all data from database (useful for testing or logout)
   */
  async clearAll(): Promise<void> {
    await this.db.teams.clear();
    await this.db.players.clear();
    await this.db.games.clear();
    await this.db.training_sessions.clear();
    await this.db.goals.clear();
    await this.db.goal_assists.clear();
    await this.db.opponent_goals.clear();
    await this.db.game_attendance.clear();
    await this.db.training_attendance.clear();
    await this.db.sync_queue.clear();
  }

  /**
   * Get database stats (for debugging)
   */
  async getStats(): Promise<Record<string, number>> {
    return {
      teams: await this.db.teams.count(),
      players: await this.db.players.count(),
      games: await this.db.games.count(),
      training_sessions: await this.db.training_sessions.count(),
      goals: await this.db.goals.count(),
      sync_queue: await this.db.sync_queue.count()
    };
  }
}
