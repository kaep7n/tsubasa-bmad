import { Injectable, signal } from '@angular/core';
import { Observable, from, of } from 'rxjs';
import { catchError, map, switchMap, tap } from 'rxjs/operators';
import { DatabaseService } from './database.service';
import { SupabaseService } from './supabase.service';
import { SyncService } from './sync.service';
import { PlayerSortingService } from './player-sorting.service';
import {
  Goal,
  GoalAssist,
  OpponentGoal,
  GoalFormData,
  OpponentGoalFormData,
  GoalWithDetails,
} from '../models/goal.model';
import { v4 as uuidv4 } from 'uuid';

/**
 * GoalService
 * Story: 5.1 Goals Database Schema & Sync Infrastructure
 * Manages goals, assists, and opponent goals with offline support
 */
@Injectable({
  providedIn: 'root',
})
export class GoalService {
  // Signals for reactive state
  private goalsSignal = signal<Goal[]>([]);
  private opponentGoalsSignal = signal<OpponentGoal[]>([]);

  // Public readonly signals
  public readonly goals = this.goalsSignal.asReadonly();
  public readonly opponentGoals = this.opponentGoalsSignal.asReadonly();

  constructor(
    private db: DatabaseService,
    private supabase: SupabaseService,
    private syncService: SyncService,
    private playerSortingService: PlayerSortingService
  ) {}

  // ========================================================================
  // Goals
  // ========================================================================

  /**
   * Get all goals for a game
   * Tries Supabase first (if online), falls back to IndexedDB
   */
  getGoalsForGame(gameId: string): Observable<Goal[]> {
    if (navigator.onLine) {
      return from(
        this.supabase.client
          .from('goals')
          .select('*')
          .eq('game_id', gameId)
          .is('deleted_at', null)
          .order('scored_at_minute', { ascending: true })
      ).pipe(
        switchMap(({ data, error }) => {
          if (error) throw error;
          const goals = (data || []) as Goal[];

          // Update IndexedDB cache
          return from(this.cacheGoals(goals)).pipe(map(() => goals));
        }),
        tap(goals => this.goalsSignal.set(goals)),
        catchError(error => {
          console.error('Error fetching goals from Supabase:', error);
          return this.getGoalsFromIndexedDB(gameId);
        })
      );
    } else {
      return this.getGoalsFromIndexedDB(gameId);
    }
  }

  /**
   * Get goals from IndexedDB (offline)
   */
  private getGoalsFromIndexedDB(gameId: string): Observable<Goal[]> {
    return from(
      this.db.db.goals
        .where('game_id')
        .equals(gameId)
        .and(goal => !goal.deleted_at)
        .sortBy('scored_at_minute')
    ).pipe(tap(goals => this.goalsSignal.set(goals)));
  }

  /**
   * Cache goals to IndexedDB
   */
  private async cacheGoals(goals: Goal[]): Promise<void> {
    await this.db.db.goals.bulkPut(goals);
  }

  /**
   * Create a new goal with assists (atomic operation)
   */
  createGoal(formData: GoalFormData): Observable<Goal> {
    const goal: Goal = {
      id: uuidv4(),
      game_id: formData.game_id,
      player_id: formData.player_id,
      scored_at_minute: formData.scored_at_minute,
      scored_at_timestamp: formData.scored_at_timestamp,
      notes: formData.notes || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      deleted_at: null,
      sync_state: navigator.onLine ? 'synced' : 'pending',
    };

    return from(this.saveGoalWithAssists(goal, formData.assist_player_ids || [])).pipe(
      map(() => goal)
    );
  }

  /**
   * Save goal and assists atomically
   */
  private async saveGoalWithAssists(goal: Goal, assistPlayerIds: string[]): Promise<void> {
    if (navigator.onLine) {
      try {
        // Insert goal
        const { error: goalError } = await this.supabase.client.from('goals').insert(goal);
        if (goalError) throw goalError;

        // Insert assists
        if (assistPlayerIds.length > 0) {
          const assists: GoalAssist[] = assistPlayerIds.map(playerId => ({
            id: uuidv4(),
            goal_id: goal.id,
            player_id: playerId,
            created_at: new Date().toISOString(),
            sync_state: 'synced',
          }));

          const { error: assistError } = await this.supabase.client
            .from('goal_assists')
            .insert(assists);
          if (assistError) throw assistError;
        }

        // Cache to IndexedDB
        await this.db.db.goals.put(goal);

        // Track player selections for smart sorting
        await this.trackPlayerSelections(goal.player_id, assistPlayerIds);
      } catch (error) {
        console.error('Error saving goal online:', error);
        // Fall back to offline mode
        goal.sync_state = 'pending';
        await this.saveGoalOffline(goal, assistPlayerIds);
      }
    } else {
      await this.saveGoalOffline(goal, assistPlayerIds);
    }
  }

  /**
   * Save goal offline (queue for sync)
   */
  private async saveGoalOffline(goal: Goal, assistPlayerIds: string[]): Promise<void> {
    // Save to IndexedDB
    await this.db.db.goals.put(goal);

    // Queue for sync
    await this.syncService.queueOperation('goals', 'insert', goal.id, goal);

    // Queue assists
    for (const playerId of assistPlayerIds) {
      const assist: GoalAssist = {
        id: uuidv4(),
        goal_id: goal.id,
        player_id: playerId,
        created_at: new Date().toISOString(),
        sync_state: 'pending',
      };

      await this.db.db.goal_assists.put(assist);
      await this.syncService.queueOperation('goal_assists', 'insert', assist.id, assist);
    }

    // Track player selections for smart sorting
    await this.trackPlayerSelections(goal.player_id, assistPlayerIds);
  }

  /**
   * Track player selections for smart sorting
   * Tracks both the scorer and all assists
   */
  private async trackPlayerSelections(scorerId: string, assistPlayerIds: string[]): Promise<void> {
    try {
      // Track the scorer
      await this.playerSortingService.trackPlayerSelection(scorerId);

      // Track all assists
      for (const assistId of assistPlayerIds) {
        await this.playerSortingService.trackPlayerSelection(assistId);
      }
    } catch (error) {
      console.error('Error tracking player selections:', error);
      // Don't throw - tracking is not critical to goal creation
    }
  }

  /**
   * Update a goal
   */
  updateGoal(goalId: string, updates: Partial<Goal>): Observable<Goal> {
    return from(this.db.db.goals.get(goalId)).pipe(
      switchMap(goal => {
        if (!goal) throw new Error('Goal not found');

        const updatedGoal: Goal = {
          ...goal,
          ...updates,
          updated_at: new Date().toISOString(),
          sync_state: navigator.onLine ? 'synced' : 'pending',
        };

        return from(this.updateGoalInDb(updatedGoal)).pipe(map(() => updatedGoal));
      })
    );
  }

  /**
   * Update goal in database
   */
  private async updateGoalInDb(goal: Goal): Promise<void> {
    await this.db.db.goals.put(goal);

    if (navigator.onLine) {
      const { error } = await this.supabase.client
        .from('goals')
        .update(goal)
        .eq('id', goal.id);

      if (error) {
        goal.sync_state = 'pending';
        await this.db.db.goals.put(goal);
        await this.syncService.queueOperation('goals', 'update', goal.id, goal);
      }
    } else {
      await this.syncService.queueOperation('goals', 'update', goal.id, goal);
    }
  }

  /**
   * Delete a goal (soft delete)
   * Also soft deletes associated assists
   */
  deleteGoal(goalId: string): Observable<void> {
    return from(this.db.db.goals.get(goalId)).pipe(
      switchMap(goal => {
        if (!goal) throw new Error('Goal not found');

        goal.deleted_at = new Date().toISOString();
        goal.sync_state = navigator.onLine ? 'synced' : 'pending';

        return from(this.deleteGoalAndAssists(goal));
      })
    );
  }

  /**
   * Delete goal and its assists atomically
   */
  private async deleteGoalAndAssists(goal: Goal): Promise<void> {
    const deletedAt = new Date().toISOString();

    // Soft delete the goal
    await this.updateGoalInDb(goal);

    // Soft delete associated assists
    const assists = await this.db.db.goal_assists
      .where('goal_id')
      .equals(goal.id)
      .toArray();

    for (const assist of assists) {
      await this.db.db.goal_assists.delete(assist.id);
      if (!navigator.onLine) {
        await this.syncService.queueOperation('goal_assists', 'delete', assist.id, assist);
      }
    }
  }

  /**
   * Update a goal with assists (atomic operation)
   * Used for editing goals - updates goal data and replaces assists
   */
  updateGoalWithAssists(
    goalId: string,
    updates: Partial<Goal>,
    newAssistPlayerIds: string[]
  ): Observable<Goal> {
    return from(this.db.db.goals.get(goalId)).pipe(
      switchMap(goal => {
        if (!goal) throw new Error('Goal not found');

        const updatedGoal: Goal = {
          ...goal,
          ...updates,
          updated_at: new Date().toISOString(),
          sync_state: 'pending',
        };

        return from(this.updateGoalAndAssists(updatedGoal, newAssistPlayerIds)).pipe(
          map(() => updatedGoal)
        );
      })
    );
  }

  /**
   * Update goal and replace assists atomically
   */
  private async updateGoalAndAssists(goal: Goal, newAssistPlayerIds: string[]): Promise<void> {
    // Update the goal
    await this.updateGoalInDb(goal);

    // Remove old assists
    const oldAssists = await this.db.db.goal_assists.where('goal_id').equals(goal.id).toArray();
    for (const assist of oldAssists) {
      await this.db.db.goal_assists.delete(assist.id);
      await this.syncService.queueOperation('goal_assists', 'delete', assist.id, assist);
    }

    // Add new assists
    for (const playerId of newAssistPlayerIds) {
      const assist: GoalAssist = {
        id: uuidv4(),
        goal_id: goal.id,
        player_id: playerId,
        created_at: new Date().toISOString(),
        sync_state: 'pending',
      };

      await this.db.db.goal_assists.put(assist);
      await this.syncService.queueOperation('goal_assists', 'insert', assist.id, assist);
    }
  }

  // ========================================================================
  // Goal Assists
  // ========================================================================

  /**
   * Get assists for a goal
   */
  getAssistsForGoal(goalId: string): Observable<GoalAssist[]> {
    if (navigator.onLine) {
      return from(
        this.supabase.client.from('goal_assists').select('*').eq('goal_id', goalId)
      ).pipe(
        switchMap(({ data, error }) => {
          if (error) throw error;
          const assists = (data || []) as GoalAssist[];

          // Cache to IndexedDB
          return from(this.db.db.goal_assists.bulkPut(assists)).pipe(
            map(() => assists)
          );
        }),
        catchError(() => this.getAssistsFromIndexedDB(goalId))
      );
    } else {
      return this.getAssistsFromIndexedDB(goalId);
    }
  }

  /**
   * Get assists from IndexedDB
   */
  private getAssistsFromIndexedDB(goalId: string): Observable<GoalAssist[]> {
    return from(this.db.db.goal_assists.where('goal_id').equals(goalId).toArray());
  }

  // ========================================================================
  // Opponent Goals
  // ========================================================================

  /**
   * Get all opponent goals for a game
   */
  getOpponentGoalsForGame(gameId: string): Observable<OpponentGoal[]> {
    if (navigator.onLine) {
      return from(
        this.supabase.client
          .from('opponent_goals')
          .select('*')
          .eq('game_id', gameId)
          .is('deleted_at', null)
          .order('scored_at_minute', { ascending: true })
      ).pipe(
        switchMap(({ data, error }) => {
          if (error) throw error;
          const goals = (data || []) as OpponentGoal[];

          return from(this.cacheOpponentGoals(goals)).pipe(map(() => goals));
        }),
        tap(goals => this.opponentGoalsSignal.set(goals)),
        catchError(() => this.getOpponentGoalsFromIndexedDB(gameId))
      );
    } else {
      return this.getOpponentGoalsFromIndexedDB(gameId);
    }
  }

  /**
   * Get opponent goals from IndexedDB
   */
  private getOpponentGoalsFromIndexedDB(gameId: string): Observable<OpponentGoal[]> {
    return from(
      this.db.db.opponent_goals
        .where('game_id')
        .equals(gameId)
        .and(goal => !goal.deleted_at)
        .sortBy('scored_at_minute')
    ).pipe(tap(goals => this.opponentGoalsSignal.set(goals)));
  }

  /**
   * Cache opponent goals to IndexedDB
   */
  private async cacheOpponentGoals(goals: OpponentGoal[]): Promise<void> {
    await this.db.db.opponent_goals.bulkPut(goals);
  }

  /**
   * Create an opponent goal
   */
  createOpponentGoal(formData: OpponentGoalFormData): Observable<OpponentGoal> {
    const goal: OpponentGoal = {
      id: uuidv4(),
      game_id: formData.game_id,
      scored_at_minute: formData.scored_at_minute,
      scored_at_timestamp: formData.scored_at_timestamp,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      deleted_at: null,
      sync_state: navigator.onLine ? 'synced' : 'pending',
    };

    return from(this.saveOpponentGoal(goal)).pipe(map(() => goal));
  }

  /**
   * Save opponent goal to database
   */
  private async saveOpponentGoal(goal: OpponentGoal): Promise<void> {
    await this.db.db.opponent_goals.put(goal);

    if (navigator.onLine) {
      const { error } = await this.supabase.client.from('opponent_goals').insert(goal);

      if (error) {
        goal.sync_state = 'pending';
        await this.db.db.opponent_goals.put(goal);
        await this.syncService.queueOperation('opponent_goals', 'insert', goal.id, goal);
      }
    } else {
      await this.syncService.queueOperation('opponent_goals', 'insert', goal.id, goal);
    }
  }

  /**
   * Delete an opponent goal (soft delete)
   */
  deleteOpponentGoal(goalId: string): Observable<void> {
    return from(this.db.db.opponent_goals.get(goalId)).pipe(
      switchMap(goal => {
        if (!goal) throw new Error('Opponent goal not found');

        goal.deleted_at = new Date().toISOString();
        goal.sync_state = navigator.onLine ? 'synced' : 'pending';

        return from(this.updateOpponentGoalInDb(goal));
      })
    );
  }

  /**
   * Update opponent goal in database
   */
  private async updateOpponentGoalInDb(goal: OpponentGoal): Promise<void> {
    await this.db.db.opponent_goals.put(goal);

    if (navigator.onLine) {
      const { error } = await this.supabase.client
        .from('opponent_goals')
        .update(goal)
        .eq('id', goal.id);

      if (error) {
        goal.sync_state = 'pending';
        await this.db.db.opponent_goals.put(goal);
        await this.syncService.queueOperation('opponent_goals', 'update', goal.id, goal);
      }
    } else {
      await this.syncService.queueOperation('opponent_goals', 'update', goal.id, goal);
    }
  }
}
