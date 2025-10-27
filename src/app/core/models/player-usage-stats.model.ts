/**
 * Player Usage Stats Model
 * Story: 5.9 Smart Player Sorting by Frequency
 * Tracks how frequently players are selected for goals/assists
 */

/**
 * Player usage statistics for smart sorting
 */
export interface PlayerUsageStats {
  player_id: string;
  usage_count: number;
  last_used_at: string; // ISO 8601 timestamp
}
