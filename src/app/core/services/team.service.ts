import { Injectable } from '@angular/core';
import { Observable, from, throwError } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import { SupabaseService } from './supabase.service';
import { Team, CreateTeamRequest, TeamResponse } from '../models/team.model';
import { getFileExtension } from '../../shared/utils/image-resize.util';

/**
 * TeamService
 * Handles team CRUD operations and logo uploads to Supabase Storage
 */
@Injectable({
  providedIn: 'root'
})
export class TeamService {
  private readonly BUCKET_NAME = 'team-logos';

  constructor(private supabase: SupabaseService) {}

  /**
   * Create a new team
   * @param name Team name
   * @param season Season identifier (e.g., "2024-2025")
   * @returns Observable<TeamResponse>
   */
  createTeam(name: string, season: string): Observable<TeamResponse> {
    return from(
      this.supabase.client.auth.getUser()
    ).pipe(
      switchMap(({ data: { user }, error: authError }) => {
        if (authError || !user) {
          return throwError(() => new Error('User not authenticated'));
        }

        const teamData: CreateTeamRequest = {
          name,
          season,
          created_by: user.id
        };

        return from(
          this.supabase.client
            .from('teams')
            .insert(teamData)
            .select()
            .single()
        );
      }),
      map(({ data, error }) => {
        if (error) {
          return {
            team: null,
            error: {
              message: error.message || 'Failed to create team',
              status: error.code ? parseInt(error.code) : 500
            }
          };
        }

        return {
          team: this.mapTeamData(data),
          error: null
        };
      }),
      catchError(error => {
        return throwError(() => ({
          team: null,
          error: {
            message: error.message || 'An unexpected error occurred',
            status: 500
          }
        }));
      })
    );
  }

  /**
   * Upload team logo to Supabase Storage
   * @param teamId Team ID
   * @param file Image file (already resized)
   * @returns Observable<string> Public URL of uploaded logo
   */
  uploadTeamLogo(teamId: string, file: File): Observable<string> {
    const fileExtension = getFileExtension(file.name);
    const filePath = `${teamId}.${fileExtension}`;

    return from(
      this.supabase.client.storage
        .from(this.BUCKET_NAME)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true // Replace existing file if present
        })
    ).pipe(
      switchMap(({ data, error }) => {
        if (error) {
          return throwError(() => new Error(`Upload failed: ${error.message}`));
        }

        // Get public URL
        const { data: publicUrlData } = this.supabase.client.storage
          .from(this.BUCKET_NAME)
          .getPublicUrl(filePath);

        if (!publicUrlData?.publicUrl) {
          return throwError(() => new Error('Failed to get public URL'));
        }

        return from([publicUrlData.publicUrl]);
      }),
      catchError(error => {
        console.error('Logo upload error:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Update team record with logo URL
   * @param teamId Team ID
   * @param logoUrl Public URL of logo
   * @returns Observable<void>
   */
  updateTeamLogo(teamId: string, logoUrl: string): Observable<void> {
    return from(
      this.supabase.client
        .from('teams')
        .update({ logo_url: logoUrl, updated_at: new Date().toISOString() })
        .eq('id', teamId)
    ).pipe(
      map(({ error }) => {
        if (error) {
          throw new Error(`Failed to update team logo: ${error.message}`);
        }
      }),
      catchError(error => {
        console.error('Logo update error:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get the current user's team
   * @returns Observable<Team | null>
   */
  getUserTeam(): Observable<Team | null> {
    return from(
      this.supabase.client.auth.getUser()
    ).pipe(
      switchMap(({ data: { user }, error: authError }) => {
        if (authError || !user) {
          return from([null]);
        }

        return from(
          this.supabase.client
            .from('teams')
            .select('*')
            .eq('created_by', user.id)
            .single()
        ).pipe(
          map(({ data, error }) => {
            // If no team found, return null (not an error)
            if (error && error.code === 'PGRST116') {
              return null;
            }

            if (error) {
              console.error('Error fetching team:', error);
              return null;
            }

            return data ? this.mapTeamData(data) : null;
          })
        );
      }),
      catchError(error => {
        console.error('Unexpected error fetching team:', error);
        return from([null]);
      })
    );
  }

  /**
   * Get team by ID
   * @param teamId Team ID
   * @returns Observable<Team | null>
   */
  getTeamById(teamId: string): Observable<Team | null> {
    return from(
      this.supabase.client
        .from('teams')
        .select('*')
        .eq('id', teamId)
        .single()
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          console.error('Error fetching team:', error);
          return null;
        }

        return data ? this.mapTeamData(data) : null;
      }),
      catchError(() => from([null]))
    );
  }

  /**
   * Map Supabase team data to Team model
   * @param data Raw data from Supabase
   * @returns Team
   */
  private mapTeamData(data: any): Team {
    return {
      id: data.id,
      name: data.name,
      season: data.season,
      logo_url: data.logo_url,
      created_by: data.created_by,
      created_at: new Date(data.created_at),
      updated_at: new Date(data.updated_at)
    };
  }
}