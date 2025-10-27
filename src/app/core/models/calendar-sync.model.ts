/**
 * Calendar Sync Models
 * Epic: 4 - Game Management & Calendar Integration
 * Stories: 4.7 Google Calendar OAuth, 4.8 Calendar Backfill
 */

/**
 * Google Calendar event from API
 */
export interface GoogleCalendarEvent {
  id: string;
  summary: string;
  description?: string;
  location?: string;
  start: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  status: string;
  updated: string;
}

/**
 * Google Calendar list item
 */
export interface GoogleCalendar {
  id: string;
  summary: string;
  description?: string;
  primary?: boolean;
  backgroundColor?: string;
}

/**
 * Calendar sync options
 */
export interface CalendarSyncOptions {
  startDate?: Date;
  endDate?: Date;
  includeHistorical?: boolean;
}

/**
 * Calendar sync result
 */
export interface CalendarSyncResult {
  gamesImported: number;
  gamesUpdated: number;
  errors: string[];
}

/**
 * Calendar connection status
 */
export interface CalendarConnectionStatus {
  connected: boolean;
  calendarId?: string;
  calendarName?: string;
  lastSyncAt?: string;
}

/**
 * Check if event title looks like a game (not training/practice/meeting)
 */
export function isGameEvent(title: string): boolean {
  const lowerTitle = title.toLowerCase();
  const excludeKeywords = ['training', 'practice', 'meeting', 'call', 'zoom', 'conference'];
  return !excludeKeywords.some(keyword => lowerTitle.includes(keyword));
}

/**
 * Extract opponent name from event title
 * Tries common patterns like "vs Team Name", "@ Team Name", "Team Name (away)"
 */
export function extractOpponentName(title: string): string {
  // Remove common prefixes
  const opponent = title.trim();

  // Pattern: "vs Team Name" or "@ Team Name"
  const vsMatch = opponent.match(/(?:vs\.?|@)\s+(.+?)(?:\s*[\(\[]|$)/i);
  if (vsMatch) {
    return vsMatch[1].trim();
  }

  // Pattern: "Team Name (away)" or "Team Name (home)"
  const locationMatch = opponent.match(/^(.+?)\s*[\(\[](?:away|home)/i);
  if (locationMatch) {
    return locationMatch[1].trim();
  }

  // Default: use full title
  return opponent;
}

/**
 * Determine if game is home or away from event details
 */
export function determineHomeAway(title: string, location?: string): 'home' | 'away' | null {
  const lowerTitle = title.toLowerCase();
  const lowerLocation = location?.toLowerCase() || '';

  if (lowerTitle.includes('(home)') || lowerTitle.includes('[home]')) {
    return 'home';
  }
  if (lowerTitle.includes('(away)') || lowerTitle.includes('[away]')) {
    return 'away';
  }
  if (lowerTitle.includes('@') || lowerLocation.includes('away')) {
    return 'away';
  }

  return null;
}
