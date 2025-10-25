# 9. Epic 4: Game Management & Calendar Integration

**Epic Goal**: Enable manual game creation and automatic calendar import (iCal + Google Calendar OAuth).

## Story 4.1: Games Database Schema

**As a** developer
**I want** the games database schema created
**So that** game data can be stored and tracked

**Acceptance Criteria**:
- ✅ Migration file created with `games` table:
  - `id` (uuid, primary key, default: gen_random_uuid())
  - `team_id` (uuid, foreign key to teams, not null)
  - `opponent` (text, not null)
  - `date` (timestamptz, not null)
  - `location` (text, nullable)
  - `home_away` (text, nullable, CHECK constraint: 'home' | 'away')
  - `status` (text, default: 'scheduled', CHECK constraint: 'scheduled' | 'in_progress' | 'completed' | 'cancelled')
  - `final_score_team` (int, nullable)
  - `final_score_opponent` (int, nullable)
  - `result` (text, nullable, CHECK constraint: 'win' | 'draw' | 'loss')
  - `calendar_sync_id` (text, nullable, for Google Calendar event ID)
  - `is_protected` (boolean, default: false, prevents deletion if attendance/goals exist)
  - `created_at`, `updated_at`, `deleted_at`
- ✅ Migration file created with `game_attendance` table:
  - `id` (uuid, primary key, default: gen_random_uuid())
  - `game_id` (uuid, foreign key to games, not null)
  - `player_id` (uuid, foreign key to players, not null)
  - `status` (text, not null, CHECK constraint: 'attended' | 'excused' | 'absent')
  - `created_at`, `updated_at`
  - Unique constraint: (game_id, player_id)
- ✅ RLS policies enabled on both tables (team_id isolation via joins)
- ✅ Indexes created:
  - `games(team_id, date)` for chronological queries
  - `games(calendar_sync_id)` for Google Calendar sync lookups
  - `game_attendance(game_id)` for attendance lookups
  - `game_attendance(player_id)` for player game history
- ✅ Trigger added: Update `updated_at` on row modification
- ✅ Trigger added: Set `is_protected = true` when goals or attendance exist
- ✅ Migration applied: `supabase db push`
- ✅ TypeScript types generated: `supabase gen types typescript`
- ✅ pgTAP tests verify schema constraints, triggers, and RLS policies

---

## Story 4.2: Game List View

**As a** coach
**I want** to see a list of all games
**So that** I can review past results and see upcoming matches

**Acceptance Criteria**:
- ✅ `GameListComponent` created with chronological list (upcoming first, then past)
- ✅ Each list item displays:
  - Opponent name (bold)
  - Date and time (e.g., "Sat, Oct 28, 2025 - 10:00 AM")
  - Location (if provided)
  - Home/Away badge (if specified)
  - Result badge: W (green), D (yellow), L (red) for completed games
  - Final score (if completed): "3-1"
  - Status badge: "Scheduled" | "In Progress" | "Completed" | "Cancelled"
- ✅ Data fetched from Supabase on component init:
  - Query: `SELECT * FROM games WHERE team_id = {id} AND deleted_at IS NULL ORDER BY date ASC`
  - Cached to IndexedDB after fetch
- ✅ Filter options:
  - "All Games" (default)
  - "Upcoming" (date >= today, status != 'completed')
  - "Past" (status = 'completed')
  - "Cancelled" (status = 'cancelled')
- ✅ Search bar: Filter by opponent name (case-insensitive)
- ✅ FAB: "Create Game" button with sub-menu:
  - "Manual Entry" (navigates to creation form)
  - "Import Calendar" (opens calendar import options)
- ✅ Empty state: "No games yet - tap + to schedule your first game"
- ✅ Tap item: Navigate to game detail screen
- ✅ Swipe left on item: Show edit/delete actions (delete only if not protected)
- ✅ Offline mode: Works from IndexedDB cache
- ✅ Pull-to-refresh: Re-fetches from Supabase
- ✅ Loading state: Skeleton list items while data loads
- ✅ Unit test: Verify filtering and sorting logic
- ✅ E2E test: Navigate to game list, verify games displayed

---

## Story 4.3: Create Game (Manual Entry)

**As a** coach
**I want** to create a game manually
**So that** I can track games that aren't in my calendar

**Acceptance Criteria**:
- ✅ `CreateGameComponent` created with form fields:
  - Opponent Name (required, text input)
  - Date (required, date picker, default: next Saturday)
  - Time (required, time picker, default: 10:00 AM)
  - Location (optional, text input)
  - Home/Away (optional, radio buttons: Home | Away)
- ✅ On submit:
  - Generate UUID for game_id client-side
  - Insert game record to Supabase `games` table with status='scheduled'
  - Save to IndexedDB (if offline, add to sync queue)
  - Navigate to game detail screen
  - Show toast: "Game created: {Opponent} on {Date}"
- ✅ Offline handling: Form submission works offline
- ✅ Error handling:
  - Network failures: Retry with exponential backoff
  - Validation errors: Inline error messages
- ✅ Loading state: Disable form during submission
- ✅ Cancel button: Navigate back to game list
- ✅ Unit test: Verify form validation and submission logic
- ✅ E2E test: Create game, verify saved to database

---

## Story 4.4: Edit Game Details

**As a** coach
**I want** to edit game details
**So that** I can correct mistakes or update information

**Acceptance Criteria**:
- ✅ "Edit Game" button on game detail screen (before game starts)
- ✅ `EditGameComponent` created (reuses form from CreateGameComponent)
- ✅ Form pre-populated with existing game data
- ✅ On submit:
  - Update game record in Supabase `games` table
  - Update IndexedDB (if offline, add to sync queue)
  - Set `updated_at = now()`
  - If Google Calendar synced (`calendar_sync_id` exists), update calendar event
  - Navigate back to game detail screen
  - Show toast: "Game updated"
- ✅ Restrictions:
  - Cannot edit game if status='in_progress' or 'completed' (show warning)
  - Can edit opponent name, location even if protected
- ✅ Offline handling: Form submission works offline (calendar sync queued)
- ✅ Cancel button: Navigate back without saving
- ✅ Unit test: Verify update logic and restrictions
- ✅ E2E test: Edit game, verify changes saved

---

## Story 4.5: Cancel Game

**As a** coach
**I want** to cancel a game if it's called off
**So that** my schedule reflects reality

**Acceptance Criteria**:
- ✅ "Cancel Game" button on game detail screen
- ✅ Tapping "Cancel" shows confirmation dialog:
  - Title: "Cancel this game?"
  - Message: "If attendance or goals have been recorded, they will be preserved but marked as cancelled. This action can be undone."
  - Actions: "Keep Game" | "Cancel Game"
- ✅ On confirm:
  - Set `status = 'cancelled'` in game record (do NOT soft delete)
  - Update IndexedDB (if offline, add to sync queue)
  - If Google Calendar synced, cancel calendar event (or update title to "[CANCELLED] {opponent}")
  - Navigate back to game list
  - Show toast with undo action: "Game cancelled" [Undo]
- ✅ Undo functionality:
  - If "Undo" tapped within 5 seconds, set `status = 'scheduled'`
  - Re-sync to Supabase and Google Calendar
  - Show toast: "Cancellation undone"
- ✅ Protected games:
  - If `is_protected = true`, show additional warning: "This game has recorded data (goals/attendance). Cancelling will preserve the data."
  - Attendance and goals remain queryable for statistics
- ✅ Cancelled games:
  - Shown in game list with "Cancelled" badge
  - Can be filtered out via "Upcoming" or "Past" filters
- ✅ Offline handling: Cancellation works offline
- ✅ Unit test: Verify cancellation logic and protected game handling
- ✅ E2E test: Cancel game, undo, verify restored

---

## Story 4.6: Calendar Import (iCal File Upload)

**As a** coach
**I want** to import games from an iCal (.ics) file
**So that** I don't have to manually enter my league schedule

**Acceptance Criteria**:
- ✅ "Import Calendar" button on game list screen opens import modal
- ✅ Import modal displays two options:
  - "Upload iCal File (.ics)" (file input)
  - "Connect Google Calendar" (OAuth flow, Story 4.7)
- ✅ iCal file upload flow:
  - User selects .ics file from device
  - Parse iCal using library (e.g., `ical.js`)
  - Extract events with titles containing opponent names (heuristic: ignore "training", "practice")
  - Display preview list: Event title, Date/Time, Location (with checkboxes to select which to import)
- ✅ Import preview:
  - Show extracted fields: Opponent (from event title), Date, Time, Location
  - Allow editing opponent name before import (text input)
  - "Import Selected" button (default: all checked)
- ✅ On import:
  - Generate UUIDs for game_ids client-side
  - Batch insert game records to Supabase `games` table
  - Save to IndexedDB (if offline, add to sync queue)
  - Navigate back to game list
  - Show toast: "{N} games imported"
- ✅ Error handling:
  - Invalid .ics file: Show error "Unable to parse file"
  - No events found: Show error "No games found in calendar"
  - Duplicate games (same opponent + date): Show warning, allow user to skip or override
- ✅ Offline handling: Import works offline (games saved to IndexedDB, synced later)
- ✅ Unit test: Verify iCal parsing with sample .ics file
- ✅ E2E test: Upload .ics file, verify games imported

---

## Story 4.7: Google Calendar OAuth Integration

**As a** coach
**I want** to connect my Google Calendar
**So that** games are automatically synced from my calendar

**Acceptance Criteria**:
- ✅ "Connect Google Calendar" button in import modal (Story 4.6)
- ✅ OAuth flow:
  - Tapping button opens Google OAuth consent screen (Supabase Auth Google provider)
  - Scopes requested: `https://www.googleapis.com/auth/calendar.readonly`
  - On authorization, Google returns access token and refresh token
  - Tokens stored securely in Supabase Auth user metadata
- ✅ Calendar selection:
  - After authorization, fetch user's calendar list (Google Calendar API)
  - Display modal: "Select calendar to sync" (dropdown of calendar names)
  - User selects calendar, taps "Sync"
- ✅ Calendar sync service:
  - `GoogleCalendarSyncService` created with method: `syncGames(calendarId: string)`
  - Fetches events from selected calendar (date range: today to +6 months)
  - Filters events by heuristics: Title doesn't contain "training", "practice", "meeting"
  - Extracts: Opponent (event title), Date, Time, Location, Event ID (for future updates)
  - Compares with existing games (by `calendar_sync_id`) to avoid duplicates
- ✅ On sync:
  - Batch insert new game records to Supabase `games` table
  - Save `calendar_sync_id` for each game (Google event ID)
  - Save to IndexedDB (if offline, add to sync queue)
  - Show toast: "{N} games synced from Google Calendar"
- ✅ Incremental sync:
  - Store last sync timestamp in team profile (`last_calendar_sync_at`)
  - Future syncs only fetch events modified since last sync
  - Update existing games if calendar event changes (by `calendar_sync_id`)
- ✅ Token refresh:
  - Refresh token automatically refreshed by Supabase Auth when expired
  - Handle revoked tokens: Show error "Google Calendar access revoked. Please reconnect."
- ✅ Disconnect calendar:
  - "Disconnect Google Calendar" button in settings
  - Revokes tokens, clears calendar sync metadata
  - Existing games with `calendar_sync_id` preserved (no longer update)
- ✅ Offline handling:
  - OAuth and sync require online connection (show error if offline)
- ✅ Unit test: Verify event parsing and duplicate detection
- ✅ E2E test: Connect Google Calendar, verify games synced

---

## Story 4.8: Calendar Backfill (Historical Games)

**As a** coach
**I want** to import past games from my calendar
**So that** I can track historical data

**Acceptance Criteria**:
- ✅ "Backfill Historical Games" option in Google Calendar sync modal (Story 4.7)
- ✅ Checkbox: "Include past games" (default: unchecked)
- ✅ If checked, show date range picker:
  - Start Date (default: 6 months ago)
  - End Date (default: today)
- ✅ On sync with backfill:
  - Fetch events from selected calendar in specified date range
  - Filter and import as in Story 4.7
  - Mark historical games as `status = 'completed'` if date < today
- ✅ Historical game handling:
  - Imported historical games appear in game list with "Completed" status
  - No final score or result recorded (coach can edit manually if desired)
  - Attendance not backfilled (requires manual entry)
- ✅ Performance:
  - Batch API requests if >100 events (Google Calendar API limit: 2500 events per page)
  - Show progress indicator: "Importing... {N} games processed"
- ✅ Offline handling: Backfill requires online connection
- ✅ Unit test: Verify date range filtering and status assignment
- ✅ E2E test: Backfill 10 historical games, verify imported as completed

---
