# 10. Epic 5: Live Game Tracking

**Epic Goal**: Enable coaches to track game events in real-time with minimal friction, achieving <5 second goal logging while maintaining full offline capability.

## Story 5.1: Goals Database Schema & Sync Infrastructure

**As a** developer
**I want** the database schema for goals, assists, and opponent goals
**So that** game events can be tracked with proper relationships and sync state

**Acceptance Criteria**:
- ✅ `goals` table created with fields:
  - `id` (uuid, PK), `game_id` (uuid, FK to games), `player_id` (uuid, FK to players)
  - `scored_at_minute` (int, game minute), `scored_at_timestamp` (timestamptz, absolute time)
  - `notes` (text, nullable), `created_at`, `updated_at`, `sync_state`
- ✅ `goal_assists` junction table created:
  - `id` (uuid, PK), `goal_id` (uuid, FK to goals), `player_id` (uuid, FK to players)
  - `created_at`, `sync_state`
- ✅ `opponent_goals` table created:
  - `id` (uuid, PK), `game_id` (uuid, FK to games)
  - `scored_at_minute` (int), `scored_at_timestamp` (timestamptz)
  - `created_at`, `updated_at`, `sync_state`
- ✅ RLS policies applied for all three tables (team_id isolation via joins)
- ✅ Composite indexes created for performance:
  - `goals(game_id, scored_at_minute)` for chronological ordering
  - `goal_assists(goal_id)` for assist lookups
  - `opponent_goals(game_id, scored_at_minute)` for opponent timeline
- ✅ pgTAP tests verify schema constraints and RLS policies
- ✅ Sync service extended to handle goals, goal_assists, opponent_goals with proper ordering
- ✅ TypeScript types generated for all three tables

---

## Story 5.2: Game Timer with Background Persistence

**As a** coach
**I want** the game timer to continue running even when my phone is locked or I switch apps
**So that** game time remains accurate throughout the match

**Acceptance Criteria**:
- ✅ `GameTimerService` created using Web Worker for background execution
- ✅ Timer tracks:
  - Current game minute (0-90+)
  - Elapsed real time
  - Paused/running state
  - Half-time detection (configurable at 45 min)
- ✅ Timer state persists to IndexedDB every 5 seconds
- ✅ Timer resumes from last known state on app reopen
- ✅ Service exposes Signals for reactive UI updates:
  - `currentMinute()`, `isRunning()`, `isHalfTime()`
- ✅ Timer handles edge cases:
  - Phone sleep/wake cycles
  - App backgrounding
  - Browser tab switching
  - Page refresh
- ✅ Manual adjustments supported (pause, resume, set minute)
- ✅ Jasmine unit tests verify timer accuracy and persistence
- ✅ E2E test verifies timer survives page reload

---

## Story 5.3: Live Scoreboard Header Component

**As a** coach
**I want** to see the current score and game time at all times during live tracking
**So that** I maintain situational awareness without scrolling

**Acceptance Criteria**:
- ✅ `LiveScoreboardComponent` created as sticky header component
- ✅ Displays:
  - Team score vs Opponent score (large, bold numerals)
  - Current game minute with visual indicator (running/paused)
  - Half-time status banner when applicable
- ✅ Positioned as fixed header with z-index above content
- ✅ Mobile-optimized: compact height (48-56px), thumb-safe zones
- ✅ Visual states:
  - Green pulse when timer running
  - Yellow background during half-time
  - Red when paused
- ✅ Tappable timer opens quick-adjust modal (pause/resume/set minute)
- ✅ Score increments animate with brief highlight
- ✅ Component tested in isolation with mock timer service
- ✅ Accessibility: ARIA live region announces score changes

---

## Story 5.4: Goal Logging Workflow (Scorer Selection)

**As a** coach
**I want** to log a goal with minimal taps (<5 seconds)
**So that** I can track scoring without missing game action

**Acceptance Criteria**:
- ✅ "Log Goal" FAB (Floating Action Button) always visible on live game screen
- ✅ Tapping FAB opens modal with smart-sorted player list:
  - Players who've scored this game at top
  - Recently used players next (frequency-based sorting)
  - Remaining players alphabetically
  - Visual indicator shows prior goals next to player name
- ✅ Single tap on player name logs goal immediately:
  - Creates goal record with current game minute
  - Saves to IndexedDB with sync_state='pending'
  - Adds to sync queue
  - Closes modal
  - Updates scoreboard (+1)
  - Shows toast confirmation "Goal by [Player Name] - [Minute]'"
- ✅ Modal includes "Opponent Goal" button at bottom for quick opponent tracking
- ✅ Large touch targets (56px min height) for each player
- ✅ Search filter at top for large squads (>15 players)
- ✅ Modal dismisses on outside tap or back button
- ✅ Offline: goal queued for sync, visible in game timeline immediately
- ✅ E2E test: log goal in <3 taps, verify scoreboard and timeline update

---

## Story 5.5: Assist Tracking (Multi-Select Enhancement)

**As a** coach
**I want** to optionally track assists when logging a goal
**So that** I can credit players who contributed to scoring

**Acceptance Criteria**:
- ✅ After selecting scorer, modal transitions to "Add Assists?" screen
- ✅ Same smart-sorted player list displayed (excluding scorer)
- ✅ Multi-select interface:
  - Tap player to toggle selection (checkmark appears)
  - "Skip" button to save goal without assists
  - "Save" button to save goal with selected assists (1-3 players typical)
- ✅ Timeout after 10 seconds auto-saves with no assists (prevents blocking workflow)
- ✅ Assists saved as separate `goal_assists` records linked to goal
- ✅ Assist tracking is optional - single-tap workflow still available via long-press on scorer
- ✅ Timeline view shows assists under goal entry: "Goal: [Scorer] (Assists: [Name1], [Name2])"
- ✅ Sync service handles goal + assists as atomic unit (all or nothing)
- ✅ E2E test: log goal with 2 assists, verify database records and timeline display

---

## Story 5.6: Opponent Goal Tracking

**As a** coach
**I want** to track opponent goals with minimal effort
**So that** the scoreboard reflects actual game state

**Acceptance Criteria**:
- ✅ "Opponent Goal" button in goal logging modal
- ✅ Single tap creates opponent_goal record:
  - Saves current game minute
  - Saves to IndexedDB with sync_state='pending'
  - Adds to sync queue
  - Updates scoreboard (opponent +1)
  - Shows toast "Opponent Goal - [Minute]'"
- ✅ Opponent goals appear in timeline view with distinct styling (red/amber)
- ✅ Opponent score visible in live scoreboard header
- ✅ No player selection required (opponent roster not tracked in MVP)
- ✅ Offline: opponent goal queued for sync, visible immediately
- ✅ Unit test verifies opponent_goals table sync logic
- ✅ E2E test: log opponent goal, verify scoreboard update

---

## Story 5.7: Game Timeline & Event History

**As a** coach
**I want** to see a chronological list of all game events
**So that** I can review what happened and verify accuracy

**Acceptance Criteria**:
- ✅ `GameTimelineComponent` displays scrollable event list below scoreboard
- ✅ Events displayed chronologically (most recent at top):
  - Goals: "[Minute]' - Goal by [Player Name]" (with assists if applicable)
  - Opponent Goals: "[Minute]' - Opponent Goal"
  - Half-time marker: "Half-Time" divider
- ✅ Each event shows:
  - Game minute (left-aligned)
  - Event description (middle)
  - Edit/delete icons (right-aligned, icon buttons)
- ✅ Visual styling:
  - Team goals: green accent
  - Opponent goals: red/amber accent
  - Half-time: gray divider
- ✅ Tap event to expand details (scorer, assists, timestamp, notes)
- ✅ Empty state when no events: "No goals yet - tap the + button to start tracking"
- ✅ Timeline updates reactively via Signals when new events added
- ✅ Timeline persists scroll position during updates
- ✅ Accessibility: semantic list markup, screen reader friendly

---

## Story 5.8: Undo/Edit Goal Functionality

**As a** coach
**I want** to undo or edit goals if I make a mistake
**So that** the game record remains accurate

**Acceptance Criteria**:
- ✅ "Undo" toast action appears for 5 seconds after logging goal/assist
- ✅ Tapping "Undo" within 5 seconds:
  - Marks goal as deleted (soft delete with deleted_at timestamp)
  - Reverts scoreboard (-1)
  - Removes from timeline
  - Adds delete operation to sync queue
- ✅ Edit icon on timeline events opens edit modal:
  - Change scorer (dropdown)
  - Add/remove assists (multi-select)
  - Adjust minute (number input)
  - Add notes (text area)
- ✅ Save edits:
  - Updates goal record with updated_at timestamp
  - Updates sync_state to 'pending'
  - Re-syncs on next connection
  - Shows toast "Goal updated"
- ✅ Delete icon on timeline events:
  - Shows confirmation dialog "Delete this goal?"
  - Soft deletes on confirm
  - Updates scoreboard and timeline
- ✅ Deleted goals sync to backend (soft delete, not hard delete)
- ✅ E2E test: log goal, undo within 5 seconds, verify scoreboard reverts
- ✅ E2E test: edit goal scorer, verify database and timeline update

---

## Story 5.9: Smart Player Sorting by Frequency

**As a** coach
**I want** the most relevant players at the top of the goal logging list
**So that** I can log goals faster for active players

**Acceptance Criteria**:
- ✅ `PlayerSortingService` tracks player selection frequency:
  - Stores usage count per player in IndexedDB (`player_usage_stats` table)
  - Increments count each time player selected for goal/assist
  - Persists across sessions
- ✅ Sorting algorithm for goal logging modal:
  1. Players who scored in current game (chronological order)
  2. Players by usage frequency (descending)
  3. Remaining players alphabetically by first name
- ✅ Visual indicators:
  - Badge shows goal count for current game next to player name
  - Subtle "⭐" icon for frequently selected players
- ✅ Sorting updates reactively after each goal logged
- ✅ Reset functionality: clear usage stats at season end (manual trigger in settings)
- ✅ Service tested with mock data verifying sort order
- ✅ E2E test: log 3 goals by same player, verify player moves to top of list

---

## Story 5.10: Offline Sync for Live Game Events

**As a** coach
**I want** all game events to sync automatically when connectivity returns
**So that** I never lose tracking data due to poor stadium connectivity

**Acceptance Criteria**:
- ✅ All live game operations (goals, assists, opponent goals, edits, deletes) write to IndexedDB first
- ✅ Sync queue processes operations in chronological order:
  - Goals with their assists synced atomically
  - Edits applied after creates
  - Deletes applied last
- ✅ Conflict resolution:
  - Last-write-wins for edits (compare updated_at timestamps)
  - Server version always wins for deleted records
- ✅ Sync status indicators:
  - Icon in scoreboard header shows sync state (pending/syncing/synced/error)
  - Timeline events show sync badge (cloud icon: gray=pending, green=synced, red=error)
- ✅ Retry logic: exponential backoff for failed syncs (1s, 2s, 4s, 8s, max 30s)
- ✅ Background sync using Service Worker when possible (Periodic Background Sync API)
- ✅ Sync service emits events for analytics:
  - Sync success/failure counts
  - Sync latency metrics
  - Conflict resolution events
- ✅ E2E test: log 5 goals offline, go online, verify all sync to Supabase
- ✅ E2E test: simulate conflict (edit same goal on two devices), verify resolution

---
