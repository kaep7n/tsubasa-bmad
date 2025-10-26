/**
 * Team Model
 * Represents a sports team (1:1 relationship with User/Coach in v1)
 */
export interface Team {
  id: string;
  name: string;
  season: string | null;
  logo_url: string | null;
  created_by: string;
  created_at: Date;
  updated_at: Date;
}

/**
 * Create Team Request
 * DTO for creating a new team
 */
export interface CreateTeamRequest {
  name: string;
  season: string;
  created_by: string; // auth.uid()
}

/**
 * Team Response
 * Response type for team operations
 */
export interface TeamResponse {
  team: Team | null;
  error: TeamError | null;
}

/**
 * Team Error
 * Error type for team operations
 */
export interface TeamError {
  message: string;
  status?: number;
}
