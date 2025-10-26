import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, take } from 'rxjs/operators';
import { SupabaseService } from './supabase.service';
import { User, AuthResponse } from '../models/user.model';
import type { AuthError, User as SupabaseUser } from '@supabase/supabase-js';
import { TeamService } from './team.service';

/**
 * AuthService
 * Handles all authentication operations using Supabase Auth
 * Maintains current user state and provides authentication methods
 */
@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(
    private supabase: SupabaseService,
    private router: Router,
    private teamService: TeamService,
  ) {
    // Initialize auth state from Supabase session
    this.initializeAuthState();
  }

  /**
   * Initialize authentication state on service creation
   * Checks for existing session and sets up auth state listener
   */
  private async initializeAuthState(): Promise<void> {
    try {
      const {
        data: { session },
      } = await this.supabase.client.auth.getSession();
      if (session?.user) {
        this.currentUserSubject.next(this.mapSupabaseUser(session.user));
      }

      // Listen for auth state changes
      this.supabase.client.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          this.currentUserSubject.next(this.mapSupabaseUser(session.user));
        } else {
          this.currentUserSubject.next(null);
        }
      });
    } catch (_error) {
      console.error('Error initializing auth state:', _error);
      this.currentUserSubject.next(null);
    }
  }

  /**
   * Map Supabase user to application User model
   */
  private mapSupabaseUser(supabaseUser: SupabaseUser): User {
    return {
      id: supabaseUser.id,
      email: supabaseUser.email || '',
      created_at: new Date(supabaseUser.created_at),
      email_confirmed_at: supabaseUser.email_confirmed_at
        ? new Date(supabaseUser.email_confirmed_at)
        : undefined,
      last_sign_in_at: supabaseUser.last_sign_in_at
        ? new Date(supabaseUser.last_sign_in_at)
        : undefined,
      user_metadata: supabaseUser.user_metadata,
    };
  }

  /**
   * Sign up a new user with email and password
   * @param email User email address
   * @param password User password (minimum 8 characters)
   * @returns Promise with AuthResponse
   */
  async signUp(email: string, password: string): Promise<AuthResponse> {
    try {
      const { data, error } = await this.supabase.client.auth.signUp({
        email,
        password,
      });

      if (error) {
        return {
          user: null,
          session: null,
          error: { message: this.mapErrorMessage(error), status: error.status },
        };
      }

      return {
        user: data.user ? this.mapSupabaseUser(data.user) : null,
        session: data.session
          ? {
              access_token: data.session.access_token,
              refresh_token: data.session.refresh_token,
              expires_in: data.session.expires_in,
              expires_at: data.session.expires_at,
              token_type: data.session.token_type,
              user: this.mapSupabaseUser(data.session.user),
            }
          : null,
        error: null,
      };
    } catch (_error) {
      return {
        user: null,
        session: null,
        error: { message: 'An unexpected error occurred during sign up', status: 500 },
      };
    }
  }

  /**
   * Sign in a user with email and password
   * @param email User email address
   * @param password User password
   * @returns Promise with AuthResponse
   */
  async signIn(email: string, password: string): Promise<AuthResponse> {
    try {
      const { data, error } = await this.supabase.client.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return {
          user: null,
          session: null,
          error: { message: this.mapErrorMessage(error), status: error.status },
        };
      }

      return {
        user: data.user ? this.mapSupabaseUser(data.user) : null,
        session: data.session
          ? {
              access_token: data.session.access_token,
              refresh_token: data.session.refresh_token,
              expires_in: data.session.expires_in,
              expires_at: data.session.expires_at,
              token_type: data.session.token_type,
              user: this.mapSupabaseUser(data.session.user),
            }
          : null,
        error: null,
      };
    } catch (_error) {
      return {
        user: null,
        session: null,
        error: { message: 'An unexpected error occurred during sign in', status: 500 },
      };
    }
  }

  /**
   * Sign in with Google OAuth
   * @returns Promise with AuthResponse
   */
  async signInWithGoogle(): Promise<AuthResponse> {
    try {
      const { error } = await this.supabase.client.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        return {
          user: null,
          session: null,
          error: { message: this.mapErrorMessage(error), status: error.status },
        };
      }

      // OAuth flow will redirect, so we return success
      return {
        user: null,
        session: null,
        error: null,
      };
    } catch (_error) {
      return {
        user: null,
        session: null,
        error: { message: 'An unexpected error occurred during Google sign in', status: 500 },
      };
    }
  }

  /**
   * Sign out the current user
   * Clears session and redirects to login page
   */
  async signOut(): Promise<void> {
    try {
      await this.supabase.client.auth.signOut();
      this.currentUserSubject.next(null);
      this.router.navigate(['/login']);
    } catch (_error) {
      console.error('Error signing out:', _error);
      // Even if sign out fails, clear local state and redirect
      this.currentUserSubject.next(null);
      this.router.navigate(['/login']);
    }
  }

  /**
   * Get the current user as an Observable
   * @returns Observable of current user or null if not authenticated
   */
  getCurrentUser(): Observable<User | null> {
    return this.currentUser$;
  }

  /**
   * Check if user is currently authenticated
   * @returns Observable<boolean> true if authenticated
   */
  isAuthenticated(): Observable<boolean> {
    return this.currentUser$.pipe(map(user => user !== null));
  }

  /**
   * Check if user has a team and redirect appropriately after login
   * Redirects to /team-setup if no team exists, otherwise to /dashboard
   */
  checkAndRedirectAfterLogin(): void {
    this.teamService
      .getUserTeam()
      .pipe(take(1))
      .subscribe({
        next: team => {
          if (team) {
            // User has a team, redirect to dashboard
            this.router.navigate(['/dashboard']);
          } else {
            // User has no team, redirect to team setup
            this.router.navigate(['/team-setup']);
          }
        },
        error: error => {
          console.error('Error checking team status:', error);
          // On error, default to team setup to be safe
          this.router.navigate(['/team-setup']);
        },
      });
  }

  /**
   * Map Supabase error messages to user-friendly messages
   */
  private mapErrorMessage(error: AuthError): string {
    const errorMessage = error.message.toLowerCase();

    if (errorMessage.includes('invalid login credentials')) {
      return 'Invalid email or password';
    }
    if (errorMessage.includes('user already registered')) {
      return 'An account with this email already exists';
    }
    if (errorMessage.includes('email not confirmed')) {
      return 'Please confirm your email address before signing in';
    }
    if (errorMessage.includes('password')) {
      return 'Password must be at least 8 characters';
    }

    return error.message;
  }
}
