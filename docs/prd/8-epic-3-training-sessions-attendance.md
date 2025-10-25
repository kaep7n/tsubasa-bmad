# 8. Epic 3: Training Sessions & Attendance

**Epic Goal**: Provide tools to schedule training sessions, track attendance, and view participation statistics.

## Story 3.1: Training Sessions Database Schema

**As a** developer
**I want** the training sessions database schema created
**So that** training data can be stored and attendance tracked

**Acceptance Criteria**:
- ✅ Migration file created with `training_templates` table:
  - `id` (uuid, primary key, default: gen_random_uuid())
  - `team_id` (uuid, foreign key to teams, not null)
  - `name` (text, not null, e.g., "Tuesday Practice")
  - `default_duration_minutes` (int, default: 90)
  - `default_location` (text, nullable)
  - `created_at`, `updated_at`
- ✅ Migration file created with `training_sessions` table:
  - `id` (uuid, primary key, default: gen_random_uuid())
  - `team_id` (uuid, foreign key to teams, not null)
  - `session_template_id` (uuid, foreign key to training_templates, nullable)
  - `date` (timestamptz, not null)
  - `duration_minutes` (int, default: 90)
  - `location` (text, nullable)
  - `notes` (text, nullable)
  - `created_at`, `updated_at`, `deleted_at`
- ✅ Migration file created with `training_attendance` table:
  - `id` (uuid, primary key, default: gen_random_uuid())
  - `training_session_id` (uuid, foreign key to training_sessions, not null)
  - `player_id` (uuid, foreign key to players, not null)
  - `status` (text, not null, CHECK constraint: 'attended' | 'excused' | 'absent')
  - `created_at`, `updated_at`
  - Unique constraint: (training_session_id, player_id)
- ✅ RLS policies enabled on all three tables (team_id isolation via joins)
- ✅ Indexes created:
  - `training_sessions(team_id, date)` for chronological queries
  - `training_attendance(training_session_id)` for attendance lookups
  - `training_attendance(player_id)` for player attendance history
- ✅ Trigger added: Update `updated_at` on row modification
- ✅ Migration applied: `supabase db push`
- ✅ TypeScript types generated: `supabase gen types typescript`
- ✅ pgTAP tests verify schema constraints and RLS policies

---

## Story 3.2: Training Template Creation

**As a** coach
**I want** to create reusable training session templates
**So that** I can quickly schedule recurring sessions

**Acceptance Criteria**:
- ✅ `TrainingTemplateComponent` created (accessible from settings or training list)
- ✅ Form fields:
  - Template Name (required, text input, e.g., "Tuesday Practice")
  - Default Duration (optional, number input in minutes, default: 90)
  - Default Location (optional, text input)
- ✅ Template list displays existing templates with edit/delete actions
- ✅ On submit:
  - Insert template record to Supabase `training_templates` table
  - Save to IndexedDB (if offline, add to sync queue)
  - Show toast: "Template created: {Template Name}"
- ✅ Edit template:
  - Pre-populate form with existing template data
  - Update template record on save
- ✅ Delete template:
  - Show confirmation: "Delete template? Existing sessions will not be affected."
  - Hard delete template record (not referenced by existing sessions)
- ✅ Offline handling: Template CRUD operations work offline
- ✅ Unit test: Verify template CRUD logic
- ✅ E2E test: Create template, use in session creation

---

## Story 3.3: Training Session List View

**As a** coach
**I want** to see a list of all training sessions
**So that** I can review past sessions and plan future ones

**Acceptance Criteria**:
- ✅ `TrainingListComponent` created with chronological list (most recent first)
- ✅ Each list item displays:
  - Date and time (e.g., "Tue, Oct 24, 2025 - 6:00 PM")
  - Duration (e.g., "90 min")
  - Location (if provided)
  - Attendance summary: "12/15 attended" with progress bar
- ✅ Data fetched from Supabase on component init:
  - Query: `SELECT * FROM training_sessions WHERE team_id = {id} AND deleted_at IS NULL ORDER BY date DESC`
  - Join with `training_attendance` to calculate attendance summary
  - Cached to IndexedDB after fetch
- ✅ Filter options:
  - "All Sessions" (default)
  - "Upcoming" (date >= today)
  - "Past" (date < today)
- ✅ Search bar: Filter by location (case-insensitive)
- ✅ FAB: "Create Training Session" button (navigates to creation form)
- ✅ Empty state: "No training sessions yet - tap + to schedule your first session"
- ✅ Tap item: Navigate to training session detail screen
- ✅ Swipe left on item: Show delete action
- ✅ Offline mode: Works from IndexedDB cache
- ✅ Pull-to-refresh: Re-fetches from Supabase
- ✅ Loading state: Skeleton list items while data loads
- ✅ Unit test: Verify filtering and attendance summary calculation
- ✅ E2E test: Navigate to training list, verify sessions displayed

---

## Story 3.4: Create Training Session (Manual)

**As a** coach
**I want** to create a training session manually
**So that** I can schedule ad-hoc or recurring sessions

**Acceptance Criteria**:
- ✅ `CreateTrainingSessionComponent` created with form fields:
  - Template (optional, dropdown of existing templates)
  - Date (required, date picker, default: today)
  - Time (required, time picker, default: 6:00 PM)
  - Duration (optional, number input in minutes, default: 90)
  - Location (optional, text input)
  - Notes (optional, textarea)
- ✅ Template selection:
  - If template selected, auto-fill duration and location from template defaults
  - User can override auto-filled values
- ✅ On submit:
  - Generate UUID for session_id client-side
  - Insert session record to Supabase `training_sessions` table
  - Save to IndexedDB (if offline, add to sync queue)
  - Navigate to session detail screen
  - Show toast: "Training session created"
- ✅ Offline handling: Form submission works offline
- ✅ Error handling:
  - Network failures: Retry with exponential backoff
  - Validation errors: Inline error messages
- ✅ Loading state: Disable form during submission
- ✅ Cancel button: Navigate back to training list
- ✅ Unit test: Verify form validation and submission logic
- ✅ E2E test: Create training session, verify saved to database

---

## Story 3.5: Mark Training Attendance

**As a** coach
**I want** to mark player attendance for each training session
**So that** I can track participation rates

**Acceptance Criteria**:
- ✅ `TrainingAttendanceComponent` displayed on training session detail screen
- ✅ Player list with attendance toggles:
  - Three-state toggle for each player: Attended (green checkmark) | Excused (yellow dash) | Absent (red X)
  - Default state: Absent (no attendance record created)
- ✅ Quick actions:
  - "Mark All Attended" button (sets all players to 'attended')
  - "Reset" button (clears all attendance records)
- ✅ On attendance change:
  - Upsert `training_attendance` record (INSERT or UPDATE if exists)
  - Save to IndexedDB (if offline, add to sync queue)
  - Update attendance summary in session list
- ✅ Offline handling:
  - Attendance changes work offline
  - Changes queued for sync
- ✅ Optimistic UI:
  - Toggle updates immediately without waiting for server response
  - Revert on sync failure with error toast
- ✅ Search filter: Filter player list by name
- ✅ Display attendance rate: "12/15 attended (80%)"
- ✅ Unit test: Verify attendance upsert logic
- ✅ E2E test: Mark attendance, verify saved to database

---

## Story 3.6: Training Attendance Statistics

**As a** coach
**I want** to view attendance statistics per training session and per player
**So that** I can identify participation trends

**Acceptance Criteria**:
- ✅ `TrainingStatsComponent` accessible from training list menu
- ✅ Display options:
  - **Per-session view**: List of sessions with attendance summary and date
  - **Per-player view**: List of players with attendance rate (% attended)
- ✅ Per-session view:
  - Sort by date (descending)
  - Shows: Date, Attendance summary (e.g., "12/15 - 80%"), Tap to view details
- ✅ Per-player view:
  - Sort by attendance rate (descending)
  - Shows: Player name, Sessions attended / Total sessions, Attendance rate %
  - Color-coded rates: Green (90%+), Yellow (70-89%), Red (<70%)
- ✅ Date range filter: Season, Last Month, Last 3 Months, All Time
- ✅ Export button: "Export to CSV" (player attendance rates)
- ✅ Data aggregated from IndexedDB (offline-capable)
- ✅ Empty state: "No training sessions yet"
- ✅ Unit test: Verify attendance rate calculation
- ✅ E2E test: View statistics, verify rates accurate

---

## Story 3.7: Cancel Training Session

**As a** coach
**I want** to cancel a training session
**So that** cancelled sessions are reflected in the schedule

**Acceptance Criteria**:
- ✅ "Cancel Session" button on training session detail screen
- ✅ Tapping "Cancel" shows confirmation dialog:
  - Title: "Cancel this training session?"
  - Message: "Attendance records will be preserved but marked as cancelled. This action can be undone."
  - Actions: "Keep Session" | "Cancel Session"
- ✅ On confirm:
  - Soft delete: Set `deleted_at = now()` in session record
  - Update IndexedDB (if offline, add to sync queue)
  - Navigate back to training list
  - Show toast with undo action: "Session cancelled" [Undo]
- ✅ Undo functionality:
  - If "Undo" tapped within 5 seconds, set `deleted_at = null`
  - Re-sync to Supabase
  - Show toast: "Cancellation undone"
- ✅ Cancelled sessions:
  - Excluded from training list queries by default
  - Option to show cancelled sessions (filter toggle)
  - Attendance records preserved (for statistics)
- ✅ Offline handling: Cancellation works offline
- ✅ Unit test: Verify soft delete and undo logic
- ✅ E2E test: Cancel session, undo, verify restored

---

## Story 3.8: Edit Training Session Template

**As a** coach
**I want** to edit training session details
**So that** I can correct mistakes or update information

**Acceptance Criteria**:
- ✅ "Edit Session" button on training session detail screen
- ✅ `EditTrainingSessionComponent` created (reuses form from CreateTrainingSessionComponent)
- ✅ Form pre-populated with existing session data
- ✅ On submit:
  - Update session record in Supabase `training_sessions` table
  - Update IndexedDB (if offline, add to sync queue)
  - Set `updated_at = now()`
  - Navigate back to session detail screen
  - Show toast: "Session updated"
- ✅ Offline handling: Form submission works offline
- ✅ Cancel button: Navigate back without saving
- ✅ Unit test: Verify update logic
- ✅ E2E test: Edit session, verify changes saved

---
