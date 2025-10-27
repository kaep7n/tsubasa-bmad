import { Injectable } from '@angular/core';
import Dexie, { Table } from 'dexie';
import { Team } from '../models/team.model';
import { Game } from '../models/game.model';
import { GameAttendance } from '../models/game-attendance.model';
import { TrainingSession } from '../models/training-session.model';
import { TrainingTemplate } from '../models/training-template.model';
import { TrainingAttendance } from '../models/training-attendance.model';
import { SyncOperation } from '../models/sync-operation.model';
import { Player } from '../../models/player.model';
import { StatsCache } from '../models/player-stats.model';

/**
 * Goal interface (will be fully defined in Epic 5)
 */
export interface Goal {
  id: string;
  game_id: string;
  scorer_id: string;
  assist_id?: string;
  minute: number;
  created_at: string;
}

/**
 * Goal Assist interface
 */
export interface GoalAssist {
  id: string;
  goal_id: string;
  player_id: string;
  created_at: string;
}

/**
 * Opponent Goal interface
 */
export interface OpponentGoal {
  id: string;
  game_id: string;
  minute: number;
  created_at: string;
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
  training_templates!: Table<TrainingTemplate, string>;
  training_sessions!: Table<TrainingSession, string>;
  goals!: Table<Goal, string>;
  goal_assists!: Table<GoalAssist, string>;
  opponent_goals!: Table<OpponentGoal, string>;
  game_attendance!: Table<GameAttendance, string>;
  training_attendance!: Table<TrainingAttendance, string>;
  sync_queue!: Table<SyncOperation, number>;
  stats_cache!: Table<StatsCache, string>;

  constructor() {
    super('TsubasaDB');

    this.version(1).stores({
      // Teams table
      teams: 'id, created_by, name',

      // Players table - indexed by team_id for filtering
      players: 'id, team_id, jersey_number',

      // Games table - indexed by team_id and date for filtering
      games: 'id, team_id, date, status, calendar_sync_id',

      // Training templates table - indexed by team_id
      training_templates: 'id, team_id, name',

      // Training sessions table - indexed by team_id and date
      training_sessions: 'id, team_id, date, session_template_id',

      // Goals table - indexed by game_id and scorer_id
      goals: 'id, game_id, scorer_id, minute',

      // Goal assists table - indexed by goal_id and player_id
      goal_assists: 'id, goal_id, player_id',

      // Opponent goals table - indexed by game_id
      opponent_goals: 'id, game_id, minute',

      // Game attendance table - indexed by game_id and player_id
      game_attendance: 'id, game_id, player_id, status',

      // Training attendance table - indexed by training_session_id and player_id
      training_attendance: 'id, training_session_id, player_id, status',

      // Sync queue table - auto-increment id, indexed by timestamp and synced status
      sync_queue: '++id, timestamp, synced, table',

      // Stats cache table - indexed by cache_key
      stats_cache: 'cache_key, last_calculated',
    });
  }
}

/**
 * DatabaseService
 * Provides access to IndexedDB via Dexie
 */
@Injectable({
  providedIn: 'root',
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
    await this.db.training_templates.clear();
    await this.db.training_sessions.clear();
    await this.db.goals.clear();
    await this.db.goal_assists.clear();
    await this.db.opponent_goals.clear();
    await this.db.game_attendance.clear();
    await this.db.training_attendance.clear();
    await this.db.sync_queue.clear();
    await this.db.stats_cache.clear();
  }

  /**
   * Get database stats (for debugging)
   */
  async getStats(): Promise<Record<string, number>> {
    return {
      teams: await this.db.teams.count(),
      players: await this.db.players.count(),
      games: await this.db.games.count(),
      training_templates: await this.db.training_templates.count(),
      training_sessions: await this.db.training_sessions.count(),
      goals: await this.db.goals.count(),
      sync_queue: await this.db.sync_queue.count(),
    };
  }
}
