import { Injectable, signal } from '@angular/core';
import { Observable, from, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { SupabaseService } from './supabase.service';
import { DatabaseService } from './database.service';
import {
  GoogleCalendar,
  GoogleCalendarEvent,
  CalendarSyncOptions,
  CalendarSyncResult,
  CalendarConnectionStatus,
  isGameEvent,
  extractOpponentName,
  determineHomeAway,
} from '../models/calendar-sync.model';
import { Game } from '../models/game.model';

/**
 * GoogleCalendarSyncService
 * Stories: 4.7 Google Calendar OAuth, 4.8 Calendar Backfill
 * Manages Google Calendar OAuth and syncs games from calendar
 *
 * SETUP REQUIRED:
 * 1. Create Google Cloud project at https://console.cloud.google.com
 * 2. Enable Google Calendar API
 * 3. Configure OAuth consent screen
 * 4. Create OAuth 2.0 credentials (Web application)
 * 5. Add authorized redirect URI: https://[your-supabase-project].supabase.co/auth/v1/callback
 * 6. In Supabase Dashboard > Authentication > Providers:
 *    - Enable Google provider
 *    - Add Client ID and Client Secret
 *    - Add scope: https://www.googleapis.com/auth/calendar.readonly
 */
@Injectable({
  providedIn: 'root',
})
export class GoogleCalendarSyncService {
  private readonly CALENDAR_API_BASE = 'https://www.googleapis.com/calendar/v3';
  private readonly CALENDAR_SCOPE = 'https://www.googleapis.com/auth/calendar.readonly';

  // Signals for reactive state
  private syncingSignal = signal(false);
  private progressSignal = signal(0);
  private connectionStatusSignal = signal<CalendarConnectionStatus>({ connected: false });

  public readonly isSyncing = this.syncingSignal.asReadonly();
  public readonly progress = this.progressSignal.asReadonly();
  public readonly connectionStatus = this.connectionStatusSignal.asReadonly();

  constructor(
    private supabase: SupabaseService,
    private db: DatabaseService,
  ) {
    this.checkConnectionStatus();
  }

  /**
   * Check if Google Calendar is connected
   */
  private async checkConnectionStatus(): Promise<void> {
    try {
      const {
        data: { session },
      } = await this.supabase.client.auth.getSession();

      if (session?.provider_token) {
        // User has Google OAuth token
        const metadata = session.user.user_metadata;
        this.connectionStatusSignal.set({
          connected: true,
          calendarId: metadata?.['calendar_id'],
          calendarName: metadata?.['calendar_name'],
          lastSyncAt: metadata?.['last_calendar_sync'],
        });
      } else {
        this.connectionStatusSignal.set({ connected: false });
      }
    } catch (error) {
      console.error('Error checking calendar connection:', error);
      this.connectionStatusSignal.set({ connected: false });
    }
  }

  /**
   * Connect Google Calendar via OAuth
   * Opens Google OAuth consent screen
   */
  connectCalendar(): Observable<void> {
    if (!navigator.onLine) {
      return throwError(() => new Error('Calendar sync requires internet connection'));
    }

    return from(
      (async () => {
        // Trigger OAuth flow via Supabase Auth
        const { error } = await this.supabase.client.auth.signInWithOAuth({
          provider: 'google',
          options: {
            scopes: this.CALENDAR_SCOPE,
            redirectTo: window.location.origin + '/games',
          },
        });

        if (error) throw error;

        // Note: After OAuth redirect, checkConnectionStatus will be called automatically
      })(),
    );
  }

  /**
   * Disconnect Google Calendar
   * Revokes tokens and clears metadata
   */
  disconnectCalendar(): Observable<void> {
    return from(
      (async () => {
        const {
          data: { session },
        } = await this.supabase.client.auth.getSession();

        if (session?.provider_token) {
          // Revoke Google OAuth token
          try {
            await fetch('https://oauth2.googleapis.com/revoke', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
              },
              body: `token=${session.provider_token}`,
            });
          } catch (error) {
            console.error('Error revoking token:', error);
          }
        }

        // Clear calendar metadata
        await this.supabase.client.auth.updateUser({
          data: {
            calendar_id: null,
            calendar_name: null,
            last_calendar_sync: null,
          },
        });

        this.connectionStatusSignal.set({ connected: false });
      })(),
    );
  }

  /**
   * Fetch list of user's Google Calendars
   */
  fetchCalendarList(): Observable<GoogleCalendar[]> {
    if (!navigator.onLine) {
      return throwError(() => new Error('Calendar sync requires internet connection'));
    }

    return from(this.getAccessToken()).pipe(
      switchMap(token =>
        from(
          fetch(`${this.CALENDAR_API_BASE}/users/me/calendarList`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),
        ),
      ),
      switchMap(response => from(response.json())),
      catchError(error => {
        console.error('Error fetching calendar list:', error);
        return throwError(() => new Error('Failed to fetch calendar list'));
      }),
    );
  }

  /**
   * Sync games from Google Calendar
   * Stories 4.7 and 4.8
   */
  syncGames(
    teamId: string,
    calendarId: string,
    options?: CalendarSyncOptions,
  ): Observable<CalendarSyncResult> {
    if (!navigator.onLine) {
      return throwError(() => new Error('Calendar sync requires internet connection'));
    }

    this.syncingSignal.set(true);
    this.progressSignal.set(0);

    return from(
      (async () => {
        const result: CalendarSyncResult = {
          gamesImported: 0,
          gamesUpdated: 0,
          errors: [],
        };

        try {
          const token = await this.getAccessToken();

          // Set date range
          const timeMin = options?.startDate?.toISOString() || new Date().toISOString();
          const timeMax =
            options?.endDate?.toISOString() ||
            new Date(Date.now() + 6 * 30 * 24 * 60 * 60 * 1000).toISOString(); // +6 months

          // Fetch events with pagination
          const events = await this.fetchAllEvents(token, calendarId, timeMin, timeMax);

          // Filter for game events
          const gameEvents = events.filter(event => isGameEvent(event.summary || ''));

          // Process each event
          for (let i = 0; i < gameEvents.length; i++) {
            try {
              const event = gameEvents[i];
              const { imported, updated } = await this.processEvent(event, teamId);

              if (imported) result.gamesImported++;
              if (updated) result.gamesUpdated++;

              this.progressSignal.set(Math.round(((i + 1) / gameEvents.length) * 100));
            } catch (error) {
              result.errors.push(`Failed to process event: ${error}`);
            }
          }

          // Update sync metadata
          await this.updateSyncMetadata(calendarId, new Date().toISOString());

          return result;
        } catch (error) {
          console.error('Error syncing calendar:', error);
          throw error;
        } finally {
          this.syncingSignal.set(false);
          this.progressSignal.set(0);
        }
      })(),
    );
  }

  /**
   * Get access token from Supabase session
   */
  private async getAccessToken(): Promise<string> {
    const {
      data: { session },
    } = await this.supabase.client.auth.getSession();

    if (!session?.provider_token) {
      throw new Error('Google Calendar not connected. Please connect first.');
    }

    return session.provider_token;
  }

  /**
   * Fetch all events with pagination
   */
  private async fetchAllEvents(
    token: string,
    calendarId: string,
    timeMin: string,
    timeMax: string,
  ): Promise<GoogleCalendarEvent[]> {
    const allEvents: GoogleCalendarEvent[] = [];
    let pageToken: string | undefined;

    do {
      const url = new URL(`${this.CALENDAR_API_BASE}/calendars/${calendarId}/events`);
      url.searchParams.set('timeMin', timeMin);
      url.searchParams.set('timeMax', timeMax);
      url.searchParams.set('singleEvents', 'true');
      url.searchParams.set('orderBy', 'startTime');
      url.searchParams.set('maxResults', '100');
      if (pageToken) url.searchParams.set('pageToken', pageToken);

      const response = await fetch(url.toString(), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Calendar API error: ${response.statusText}`);
      }

      const data = await response.json();
      allEvents.push(...(data.items || []));
      pageToken = data.nextPageToken;
    } while (pageToken);

    return allEvents;
  }

  /**
   * Process a single calendar event
   */
  private async processEvent(
    event: GoogleCalendarEvent,
    teamId: string,
  ): Promise<{ imported: boolean; updated: boolean }> {
    // Extract game data
    const opponent = extractOpponentName(event.summary || 'Unknown Opponent');
    const dateTime = event.start.dateTime || event.start.date;
    if (!dateTime) return { imported: false, updated: false };

    const gameDate = new Date(dateTime);
    const status = gameDate < new Date() ? 'completed' : 'scheduled';
    const homeAway = determineHomeAway(event.summary || '', event.location);

    // Check if game already exists by calendar_sync_id
    const existingGames = await this.db.db.games
      .where('calendar_sync_id')
      .equals(event.id)
      .toArray();

    if (existingGames.length > 0) {
      // Update existing game
      const existingGame = existingGames[0];
      await this.db.db.games.update(existingGame.id, {
        opponent,
        date: gameDate.toISOString(),
        location: event.location || null,
        home_away: homeAway,
        updated_at: new Date().toISOString(),
      });

      // Sync to Supabase if online
      if (navigator.onLine) {
        await this.supabase.client
          .from('games')
          .update({
            opponent,
            date: gameDate.toISOString(),
            location: event.location || null,
            home_away: homeAway,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingGame.id);
      }

      return { imported: false, updated: true };
    } else {
      // Create new game
      const newGame: Game = {
        id: crypto.randomUUID(),
        team_id: teamId,
        opponent,
        date: gameDate.toISOString(),
        location: event.location || null,
        home_away: homeAway,
        status,
        final_score_team: null,
        final_score_opponent: null,
        result: null,
        calendar_sync_id: event.id,
        is_protected: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        deleted_at: null,
      };

      await this.db.db.games.add(newGame);

      // Sync to Supabase if online
      if (navigator.onLine) {
        await this.supabase.client.from('games').insert(newGame);
      }

      return { imported: true, updated: false };
    }
  }

  /**
   * Update sync metadata in user profile
   */
  private async updateSyncMetadata(calendarId: string, lastSyncAt: string): Promise<void> {
    await this.supabase.client.auth.updateUser({
      data: {
        calendar_id: calendarId,
        last_calendar_sync: lastSyncAt,
      },
    });

    await this.checkConnectionStatus();
  }
}
