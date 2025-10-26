/**
 * Player Model
 * Story: 2.1 Player Database Schema
 * Created: 2025-10-26
 */

/**
 * Main Player interface matching the database schema
 */
export interface Player {
  id: string;
  team_id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string | null;
  jersey_number: number | null;
  photo_url: string | null;
  squad: 'starters' | 'substitutes' | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

/**
 * Type for creating a new player (omits auto-generated fields)
 */
export type CreatePlayerDto = Omit<Player, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>;

/**
 * Type for updating a player (all fields optional except id)
 */
export type UpdatePlayerDto = Partial<Omit<Player, 'id' | 'created_at' | 'updated_at'>> & {
  id: string;
};

/**
 * Helper type for player display (computed full name)
 */
export interface PlayerDisplay extends Player {
  fullName: string;
  initials: string;
}

/**
 * Squad type definition
 */
export type Squad = 'starters' | 'substitutes';

/**
 * Helper function to get player's full name
 */
export function getPlayerFullName(player: Player): string {
  return `${player.first_name} ${player.last_name}`;
}

/**
 * Helper function to get player's initials
 */
export function getPlayerInitials(player: Player): string {
  return `${player.first_name.charAt(0)}${player.last_name.charAt(0)}`.toUpperCase();
}

/**
 * Helper function to convert Player to PlayerDisplay
 */
export function toPlayerDisplay(player: Player): PlayerDisplay {
  return {
    ...player,
    fullName: getPlayerFullName(player),
    initials: getPlayerInitials(player),
  };
}
