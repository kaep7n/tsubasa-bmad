# 7. Epic 2: Player & Squad Management

**Epic Goal**: Enable coaches to manage their roster with add/edit/delete capabilities and squad organization.

## Story 2.1: Player Database Schema

**As a** developer
**I want** the player database schema created
**So that** player data can be stored and queried

**Acceptance Criteria**:
- ✅ Migration file created with `players` table:
  - `id` (uuid, primary key, default: gen_random_uuid())
  - `team_id` (uuid, foreign key to teams, not null)
  - `first_name` (text, not null)
  - `last_name` (text, not null)
  - `date_of_birth` (date, nullable)
  - `jersey_number` (int, nullable)
  - `photo_url` (text, nullable)
  - `squad` (text, nullable, e.g., "starters" or "substitutes")
  - `created_at` (timestamptz, default: now())
  - `updated_at` (timestamptz, default: now())
  - `deleted_at` (timestamptz, nullable for soft deletes)
- ✅ RLS policies enabled on `players` table:
  - SELECT: Users can only see players from their team (`team_id = auth.jwt()->>'team_id'`)
  - INSERT: Users can only insert players to their team
  - UPDATE: Users can only update players from their team
  - DELETE: Users can only delete players from their team
- ✅ Composite index created: `players(team_id, deleted_at)` for active player queries
- ✅ Index created: `players(jersey_number)` for quick lookups
- ✅ Trigger added: Update `updated_at` on row modification
- ✅ Migration applied: `supabase db push`
- ✅ TypeScript types generated: `supabase gen types typescript`
- ✅ pgTAP tests verify schema constraints and RLS policies

---

## Story 2.2: Player List View

**As a** coach
**I want** to see a list of all my players
**So that** I can quickly access player information

**Acceptance Criteria**:
- ✅ `PlayerListComponent` created with grid layout (2 columns on mobile, 3+ on tablet)
- ✅ Each player card displays:
  - Photo (circular avatar) or initials if no photo
  - First name + Last name
  - Jersey number (top-right badge)
  - Quick stats preview: Goals this season, Attendance rate
- ✅ Data fetched from Supabase on component init:
  - Query: `SELECT * FROM players WHERE team_id = {id} AND deleted_at IS NULL ORDER BY first_name ASC`
  - Cached to IndexedDB after fetch
- ✅ Search bar at top:
  - Filters by first name or last name (case-insensitive)
  - Debounced input (300ms delay)
- ✅ Filter dropdown:
  - "All Players" (default)
  - "Starters"
  - "Substitutes"
  - "No Squad Assigned"
- ✅ Sort options (dropdown):
  - Alphabetical (A-Z)
  - Jersey Number (1-99)
  - Goals (Descending)
- ✅ FAB: "Add Player" button (navigates to player creation form)
- ✅ Empty state: "No players yet - tap + to add your first player"
- ✅ Tap card: Navigate to player detail screen
- ✅ Long-press card: Show quick actions (Edit, Delete)
- ✅ Offline mode: Works from IndexedDB cache, shows sync status indicator
- ✅ Pull-to-refresh: Re-fetches from Supabase
- ✅ Loading state: Skeleton cards while data loads
- ✅ Unit test: Verify filtering and sorting logic
- ✅ E2E test: Navigate to player list, verify players displayed

---

## Story 2.3: Add Player Form

**As a** coach
**I want** to add a new player to my roster
**So that** I can track their performance

**Acceptance Criteria**:
- ✅ `AddPlayerComponent` created with form fields:
  - First Name (required, text input)
  - Last Name (required, text input)
  - Date of Birth (optional, date picker)
  - Jersey Number (optional, number input 1-99)
  - Photo (optional, file upload - images only, max 5MB)
  - Squad (optional, dropdown: "Starters" | "Substitutes")
- ✅ Form validation:
  - First/Last name: Required, min 2 chars, max 50 chars
  - Jersey number: Optional, integer 1-99, unique within team (show warning if duplicate)
  - Photo: Optional, image formats only (JPEG, PNG, HEIC), max 5MB
- ✅ Photo upload flow:
  - Client-side resize to 512x512px using canvas API
  - Upload to Supabase Storage bucket: `player-photos`
  - File naming: `{team_id}/{player_id}.{extension}`
  - Set public read access on upload
- ✅ On submit:
  - Generate UUID for player_id client-side
  - Upload photo (if provided), get public URL
  - Insert player record to Supabase `players` table
  - Save to IndexedDB (if offline, add to sync queue)
  - Navigate to player detail screen
  - Show toast: "Player added: {First Name} {Last Name}"
- ✅ Offline handling:
  - Form submission works offline
  - Photo upload queued for sync
  - Record saved to IndexedDB with `sync_state = 'pending'`
- ✅ Error handling:
  - Network failures: Retry with exponential backoff
  - Validation errors: Inline error messages
  - Storage quota exceeded: Show error, suggest deleting old photos
- ✅ Loading state: Disable form during submission
- ✅ Cancel button: Navigate back to player list (with confirmation if form dirty)
- ✅ Unit test: Verify form validation and submission logic
- ✅ E2E test: Add player with photo, verify saved to database

---

## Story 2.4: Edit Player Form

**As a** coach
**I want** to edit player details
**So that** I can correct mistakes or update information

**Acceptance Criteria**:
- ✅ `EditPlayerComponent` created (reuses form from AddPlayerComponent)
- ✅ Form pre-populated with existing player data on load
- ✅ Photo handling:
  - Display current photo if exists
  - "Change Photo" button to upload new photo
  - "Remove Photo" button to delete photo (sets `photo_url = null`)
- ✅ On submit:
  - Update player record in Supabase `players` table
  - Update IndexedDB (if offline, add to sync queue)
  - Set `updated_at = now()`
  - Navigate back to player detail screen
  - Show toast: "Player updated: {First Name} {Last Name}"
- ✅ Photo replacement:
  - Upload new photo to Supabase Storage (overwrites old file)
  - Update `photo_url` in player record
- ✅ Photo deletion:
  - Delete photo from Supabase Storage
  - Set `photo_url = null` in player record
- ✅ Offline handling:
  - Form submission works offline
  - Photo operations queued for sync
  - Record updated in IndexedDB with `sync_state = 'pending'`
- ✅ Conflict resolution:
  - If player was updated by another device, show warning
  - Offer options: "Keep my changes" | "Use server version" | "Merge manually"
- ✅ Cancel button: Navigate back without saving (with confirmation if form dirty)
- ✅ Unit test: Verify update logic and conflict resolution
- ✅ E2E test: Edit player, verify changes saved

---

## Story 2.5: Delete Player (Soft Delete)

**As a** coach
**I want** to delete players who leave the team
**So that** my roster remains current

**Acceptance Criteria**:
- ✅ "Delete Player" button on player detail screen
- ✅ Tapping "Delete" shows confirmation dialog:
  - Title: "Delete {First Name} {Last Name}?"
  - Message: "This will remove the player from your roster. Their statistics will be preserved. This action can be undone within 90 days."
  - Actions: "Cancel" | "Delete"
- ✅ On confirm:
  - Soft delete: Set `deleted_at = now()` in player record (do NOT hard delete)
  - Update IndexedDB (if offline, add to sync queue)
  - Navigate back to player list
  - Show toast with undo action: "Player deleted" [Undo]
- ✅ Undo functionality:
  - If "Undo" tapped within 5 seconds, set `deleted_at = null`
  - Re-sync to Supabase
  - Show toast: "Deletion cancelled"
- ✅ Soft-deleted players:
  - Excluded from player list queries (`WHERE deleted_at IS NULL`)
  - Statistics remain intact (goals, assists, attendance preserved)
  - Can be hard-deleted after 90 days (manual or automated cleanup job)
- ✅ Offline handling:
  - Deletion works offline
  - Delete operation added to sync queue
- ✅ Unit test: Verify soft delete and undo logic
- ✅ E2E test: Delete player, undo, verify player restored

---

## Story 2.6: Squad Management (Grouping Players)

**As a** coach
**I want** to organize players into squads (e.g., starters, substitutes)
**So that** I can quickly identify player roles

**Acceptance Criteria**:
- ✅ `SquadManagementComponent` created (accessible from player list menu)
- ✅ Displays two lists:
  - **Starters**: Players with `squad = 'starters'`
  - **Substitutes**: Players with `squad = 'substitutes'`
  - **Unassigned**: Players with `squad IS NULL`
- ✅ Drag-and-drop interface:
  - Players can be dragged between lists
  - On drop, update `squad` field in player record
  - Visual feedback during drag (highlight drop zones)
- ✅ Bulk actions:
  - "Select All" checkbox for each list
  - "Move Selected to Starters/Substitutes" buttons
- ✅ On squad change:
  - Update player record in Supabase `players` table
  - Update IndexedDB (if offline, add to sync queue)
  - Set `updated_at = now()`
- ✅ Offline handling:
  - Squad changes work offline
  - Changes queued for sync
- ✅ Save button: Commits all changes (or auto-save on each drag-drop)
- ✅ Cancel button: Reverts unsaved changes
- ✅ Mobile optimization:
  - Drag-and-drop may be challenging on mobile, provide alternative: tap player → show "Move to..." dropdown
- ✅ Unit test: Verify squad assignment logic
- ✅ E2E test: Move player between squads, verify saved

---

## Story 2.7: Player Statistics Service Foundation

**As a** developer
**I want** a service to calculate per-player statistics
**So that** player cards and detail screens can display stats

**Acceptance Criteria**:
- ✅ `PlayerStatsService` created with methods:
  - `getPlayerStats(playerId: string): Observable<PlayerStats>` - Returns stats for a single player
  - `getAllPlayerStats(teamId: string): Observable<PlayerStats[]>` - Returns stats for all players
- ✅ Statistics calculated:
  - Games played (count from `game_attendance` where status = 'attended')
  - Goals scored (count from `goals` where player_id = X)
  - Assists (count from `goal_assists` where player_id = X)
  - Attendance rate: (attended / total games) * 100
  - Training sessions attended (count from `training_attendance` where status = 'attended')
- ✅ Queries run against IndexedDB for offline access:
  - Join `players` with `game_attendance`, `goals`, `goal_assists`, `training_attendance`
  - Use Dexie.js compound queries with indexes
- ✅ Results cached in memory with TTL (5 minutes)
- ✅ Cache invalidated on relevant data changes (new goal, attendance change, etc.)
- ✅ Service exposes Signals for reactive updates: `playerStats()`
- ✅ Unit test: Verify calculation accuracy with mock data
- ✅ Performance test: Verify <100ms query time for 20 players, 50 games

---
