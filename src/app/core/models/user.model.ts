/**
 * User Model
 * Represents an authenticated user (coach) in the system
 * Based on Supabase Auth user type
 */
export interface User {
  id: string;
  email: string;
  created_at: Date;
  email_confirmed_at?: Date;
  last_sign_in_at?: Date;
  user_metadata?: {
    full_name?: string;
    avatar_url?: string;
  };
}

/**
 * Auth Response
 * Response type for authentication operations
 */
export interface AuthResponse {
  user: User | null;
  session: AuthSession | null;
  error: AuthError | null;
}

/**
 * Auth Session
 * Represents an active user session
 */
export interface AuthSession {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  expires_at?: number;
  token_type: string;
  user: User;
}

/**
 * Auth Error
 * Error type for authentication operations
 */
export interface AuthError {
  message: string;
  status?: number;
}