import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';

/**
 * SupabaseService
 * Singleton service that provides access to the Supabase client
 * Configures authentication with auto-refresh and persistent sessions
 */
@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(
      environment.supabaseUrl,
      environment.supabaseAnonKey,
      {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: true
        }
      }
    );
  }

  /**
   * Get the Supabase client instance
   * @returns SupabaseClient instance
   */
  get client(): SupabaseClient {
    return this.supabase;
  }
}