import { Injectable } from '@angular/core';
import { DatabaseService } from './database.service';
import { PlayerUsageStats } from '../models/player-usage-stats.model';
import { Player, getPlayerFullName } from '../../models/player.model';

/**
 * PlayerSortingService
 * Story: 5.9 Smart Player Sorting by Frequency
 * Manages player usage statistics for smart sorting in goal logging
 */
@Injectable({
  providedIn: 'root',
})
export class PlayerSortingService {
  constructor(private db: DatabaseService) {}

  /**
   * Track player selection (increment usage count and update timestamp)
   * Called when a player scores a goal or provides an assist
   */
  async trackPlayerSelection(playerId: string): Promise<void> {
    try {
      // Get existing stats or create new
      let stats = await this.db.db.player_usage_stats.get(playerId);

      if (stats) {
        // Update existing stats
        stats.usage_count += 1;
        stats.last_used_at = new Date().toISOString();
      } else {
        // Create new stats
        stats = {
          player_id: playerId,
          usage_count: 1,
          last_used_at: new Date().toISOString(),
        };
      }

      await this.db.db.player_usage_stats.put(stats);
    } catch (error) {
      console.error('[PlayerSortingService] Error tracking player selection:', error);
      throw error;
    }
  }

  /**
   * Get sorted players for a game
   * Sorting logic:
   * 1. Current game scorers (by goal count, descending)
   * 2. Usage frequency (by usage_count, descending)
   * 3. Alphabetical (by last name, ascending)
   *
   * @param gameId - ID of the current game
   * @param teamId - ID of the team
   * @returns Sorted array of players with usage stats
   */
  async getSortedPlayers(
    gameId: string,
    teamId: string
  ): Promise<Array<Player & { goalCount: number; usageCount: number }>> {
    try {
      // Load all active players for the team
      const players = await this.db.db.players
        .where('team_id')
        .equals(teamId)
        .and(p => !p.deleted_at)
        .toArray();

      // Load goals for this game to count scorers
      const goals = await this.db.db.goals
        .where('game_id')
        .equals(gameId)
        .and(g => !g.deleted_at)
        .toArray();

      // Count goals per player in this game
      const goalCounts = new Map<string, number>();
      goals.forEach(goal => {
        goalCounts.set(goal.player_id, (goalCounts.get(goal.player_id) || 0) + 1);
      });

      // Get usage stats for all players
      const usageStatsMap = new Map<string, PlayerUsageStats>();
      const allUsageStats = await this.db.db.player_usage_stats.toArray();
      allUsageStats.forEach(stats => {
        usageStatsMap.set(stats.player_id, stats);
      });

      // Combine player data with stats
      const playersWithStats = players.map(player => ({
        ...player,
        goalCount: goalCounts.get(player.id) || 0,
        usageCount: usageStatsMap.get(player.id)?.usage_count || 0,
      }));

      // Sort according to the logic:
      // 1. Current game scorers (goalCount desc)
      // 2. Usage frequency (usageCount desc)
      // 3. Alphabetical (last name asc)
      return playersWithStats.sort((a, b) => {
        // 1. Goal count in current game (descending)
        if (a.goalCount !== b.goalCount) {
          return b.goalCount - a.goalCount;
        }

        // 2. Usage frequency (descending)
        if (a.usageCount !== b.usageCount) {
          return b.usageCount - a.usageCount;
        }

        // 3. Alphabetical by last name (ascending)
        return a.last_name.localeCompare(b.last_name);
      });
    } catch (error) {
      console.error('[PlayerSortingService] Error getting sorted players:', error);
      throw error;
    }
  }

  /**
   * Reset all usage statistics
   * Clears the player_usage_stats table
   */
  async resetUsageStats(): Promise<void> {
    try {
      await this.db.db.player_usage_stats.clear();
      console.log('[PlayerSortingService] Usage stats reset successfully');
    } catch (error) {
      console.error('[PlayerSortingService] Error resetting usage stats:', error);
      throw error;
    }
  }

  /**
   * Get usage stats for a specific player
   * Useful for debugging or displaying player statistics
   */
  async getPlayerUsageStats(playerId: string): Promise<PlayerUsageStats | undefined> {
    try {
      return await this.db.db.player_usage_stats.get(playerId);
    } catch (error) {
      console.error('[PlayerSortingService] Error getting player usage stats:', error);
      throw error;
    }
  }

  /**
   * Get all usage stats
   * Useful for debugging or analytics
   */
  async getAllUsageStats(): Promise<PlayerUsageStats[]> {
    try {
      return await this.db.db.player_usage_stats.toArray();
    } catch (error) {
      console.error('[PlayerSortingService] Error getting all usage stats:', error);
      throw error;
    }
  }
}
