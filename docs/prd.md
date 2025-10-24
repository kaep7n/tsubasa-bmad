# Product Requirements Document (PRD)
# Tsubasa - Youth Football Statistics Tracker

**Version:** 1.0
**Last Updated:** 2025-10-24
**Document Owner:** John (PM Agent)
**Status:** Ready for Development

---

## Change Log

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-10-24 | John (PM) | Initial PRD created from brainstorming session and architecture document |

---

## 1. Goals and Background Context

### 1.1 Goals

This PRD defines the MVP requirements for Tsubasa, a Progressive Web Application (PWA) designed to help volunteer youth football coaches efficiently track player statistics, game events, and team performance.

**Primary Goals:**

1. **Speed**: Enable goal logging in <5 seconds, faster than handwriting on paper
2. **Offline-First**: Ensure full functionality without internet connectivity during games
3. **Simplicity**: Minimize cognitive load with smart defaults and 3-tap-max workflows
4. **Reliability**: Achieve 95%+ offline sync success rate with zero data loss
5. **Accessibility**: Support coaches aged 30-50 with varying technical proficiency
6. **Mobile-Optimized**: Deliver thumb-friendly UI for one-handed operation on touchscreens
7. **Privacy**: Protect youth player data with team-level isolation and secure authentication
8. **Scalability**: Support multiple seasons of data (100+ games) without performance degradation

### 1.2 Background Context

Volunteer youth football coaches (ages 30-50) manage teams of 15-20 players across training sessions and competitive games. Current solutions include:

- **Paper notebooks**: Fast but error-prone, no analytics, data entry burden
- **Spreadsheets**: Require manual data entry after games, slow during live tracking
- **Generic sports apps**: Complex interfaces designed for professional teams, require constant connectivity

**The Problem**: Coaches need to track goals, assists, attendance, and opponent scores during fast-paced games while standing on the sideline. Existing tools are either too slow (digital) or too limited (paper). The "faster than handwriting" requirement is the killer feature that differentiates Tsubasa.

**Target Users**: Volunteer coaches with smartphone access (iOS/Android), managing U8-U14 youth teams, needing quick statistics for league reporting and parent communication.

**Success Metrics**:
- 50+ active coaches within 6 months of launch
- <5 second average time to log a goal
- 95%+ offline sync success rate
- 4.5+ star rating on app stores
- 70%+ weekly active usage during season

---

## 2. Requirements

### 2.1 Functional Requirements

#### FR-001: Authentication & Team Setup
- System shall support email/password and OAuth (Google) authentication via Supabase Auth
- Users shall create a team profile with name, season, and optional logo
- System shall assign unique team_id for data isolation via Row-Level Security (RLS)

#### FR-002: Player Management
- Users shall add players with: first name, last name, date of birth, jersey number, optional photo
- Users shall edit player details at any time
- Users shall archive (soft delete) players who leave the team
- System shall display player list with search/filter capabilities
- Users shall organize players into squads (e.g., starters, substitutes)

#### FR-003: Training Session Management
- Users shall create training session templates with date/time/location
- Users shall create manual training sessions from templates or scratch
- Users shall mark attendance for each player (Attended/Excused/Absent)
- System shall display training session list with date/attendance summary
- Users shall view attendance statistics per player (% attendance rate)
- Users shall edit or cancel training sessions

#### FR-004: Game Management
- Users shall create games manually with: opponent name, date/time, location, home/away
- Users shall edit game details before or after completion
- Users shall cancel games with protected attendance/goals
- System shall display game list with date/opponent/result
- Users shall import games via iCal (.ics) file upload
- Users shall connect Google Calendar OAuth for automatic game sync
- System shall backfill historical games on calendar connection

#### FR-005: Live Game Tracking
- System shall provide persistent game timer (0-90+ minutes) running in Web Worker
- Timer shall survive app backgrounding, phone sleep, and page refresh via IndexedDB persistence
- Users shall see live scoreboard (team vs opponent) in sticky header during game
- Users shall log goals in <5 seconds via single-tap player selection
- Users shall optionally track assists (multi-select, 1-3 players)
- Users shall track opponent goals with single tap
- System shall display chronological game timeline (goals, assists, opponent goals)
- Users shall undo goals within 5 seconds via toast action
- Users shall edit or delete goals via timeline event actions
- System shall sort player selection list by: (1) current game scorers, (2) usage frequency, (3) alphabetically

#### FR-006: Offline Sync
- System shall persist all data (players, games, training, goals, attendance) to IndexedDB
- System shall queue mutations (create/update/delete) when offline
- System shall sync queued operations to Supabase on connectivity restoration
- System shall resolve sync conflicts using last-write-wins (by updated_at timestamp)
- System shall display sync status indicators (pending/syncing/synced/error)
- System shall retry failed syncs with exponential backoff (1s, 2s, 4s, 8s, max 30s)

#### FR-007: Statistics & Reporting
- System shall aggregate player statistics: games played, goals, assists, attendance rate, training sessions attended
- System shall aggregate team statistics: W-D-L record, goals for/against, goal difference
- Users shall view player statistics in sortable table with date range filter
- Users shall view team statistics dashboard with visual charts (goals per game, win rate, top scorers)
- Users shall generate post-game reports with: score, goal timeline, attendance, coach notes
- Users shall export reports as: PDF, HTML (copy to clipboard), Web Share API, Print
- Users shall export player statistics to CSV
- Users shall generate season summary report with team achievements and individual awards
- Users shall control statistics privacy (show/hide comparative rankings, enable/disable CSV export, include/exclude photos)

#### FR-008: Game Result Recording
- Users shall finalize games after timer reaches 90+ minutes
- System shall auto-calculate result (Win/Draw/Loss) from current score
- Users shall manually adjust final score if opponent tracking was incomplete
- System shall update game status to 'completed' and record final_score_team, final_score_opponent, result

#### FR-009: Dashboard & Navigation
- System shall display dashboard with: upcoming games/training, recent results, quick actions
- Users shall navigate via bottom tab bar (mobile) or sidebar menu (desktop)
- System shall provide breadcrumb navigation on detail screens

#### FR-010: Data Export
- Users shall export player statistics to CSV with UTF-8 encoding
- CSV exports shall respect current filters (date range, search query)
- File naming convention: `tsubasa-player-stats-YYYY-MM-DD.csv`

### 2.2 Non-Functional Requirements

#### NFR-001: Performance
- Page load time shall be <2 seconds on 3G connection
- Goal logging workflow shall complete in <5 seconds
- Statistics aggregation shall complete in <500ms for 1 season (20 games, 15 players)
- Statistics aggregation shall complete in <5s for 5 seasons (100 games, 20 players)
- App shall support 100+ games per team without performance degradation

#### NFR-002: Offline Capability
- App shall function fully offline after initial load
- Service Worker shall cache all static assets (HTML, CSS, JS, fonts, icons)
- IndexedDB shall store all team data with <10MB footprint per team per season
- Sync queue shall process 100+ queued operations within 30 seconds on reconnection

#### NFR-003: Mobile Optimization
- Touch targets shall be ≥56px height (WCAG 2.1 Level AAA)
- App shall support portrait orientation on 375px+ width screens (iPhone SE and larger)
- App shall be operable one-handed with thumb-safe zones
- Forms shall use mobile-optimized input types (date pickers, number keyboards)

#### NFR-004: Security
- All API communication shall use HTTPS only
- Authentication tokens (JWT) shall expire after 7 days with refresh token rotation
- Row-Level Security (RLS) policies shall enforce team_id isolation on all tables
- Passwords shall be hashed using bcrypt (Supabase Auth default)
- Sensitive data (email, player DOB) shall never be logged or exposed in client-side errors

#### NFR-005: Accessibility
- App shall comply with WCAG 2.1 Level AA standards
- All interactive elements shall be keyboard navigable
- Color contrast ratios shall meet 4.5:1 for normal text, 3:1 for large text
- Form inputs shall have associated labels and error messages
- Dynamic content updates shall use ARIA live regions
- Images shall have alt text (or empty alt for decorative images)

#### NFR-006: Browser Support
- App shall support Chrome 90+, Safari 14+, Firefox 88+, Edge 90+
- Service Worker shall gracefully degrade if not supported (online-only mode)
- PWA installation shall be supported on iOS 14+ and Android 5+

#### NFR-007: Data Retention
- Deleted records shall be soft-deleted (deleted_at timestamp) for 90 days
- Hard delete shall occur after 90-day retention period (automated job)
- Supabase backups shall be retained for 7 days (point-in-time recovery)

#### NFR-008: Scalability
- Database shall support 1000+ teams without performance degradation
- Supabase free tier limits: 500MB database, 2GB bandwidth/month, 50,000 monthly active users
- IndexedDB storage shall be bounded to 50MB per team (warn user at 40MB)

#### NFR-009: Monitoring & Observability
- Client-side errors shall be reported to error tracking service (e.g., Sentry)
- Sync failures shall be logged with error codes for debugging
- Performance metrics (page load, sync latency) shall be tracked via Performance API

#### NFR-010: Testing
- Unit test coverage shall be ≥80% for services and components (Jasmine/Karma)
- Database schema shall have 100% pgTAP test coverage for RLS policies
- Critical workflows (goal logging, sync) shall have E2E test coverage (Playwright)

---

## 3. UI Design Goals

### 3.1 UX Vision

Tsubasa's user experience is optimized for **speed and simplicity** in high-pressure, mobile-first contexts. Coaches standing on the sideline during games need to log events in <5 seconds without missing game action. The UI prioritizes:

1. **Optimistic UI**: Immediate feedback for all actions (no loading spinners for offline writes)
2. **Smart Defaults**: Pre-fill forms with likely values (e.g., today's date, current time)
3. **Progressive Disclosure**: Hide complexity until needed (e.g., assists are optional, edits are secondary actions)
4. **Thumb-Friendly Layout**: Primary actions in bottom 30% of screen for one-handed use
5. **Visual Hierarchy**: Bold numerals for scores, clear iconography, high-contrast action buttons

### 3.2 Interaction Paradigms

- **3-Tap Maximum**: Core workflows (log goal, mark attendance) complete in ≤3 taps
- **Swipe Gestures**: Navigate between tabs/sections with horizontal swipes
- **Floating Action Buttons (FABs)**: Primary action always visible (e.g., "Log Goal" during games)
- **Bottom Sheets**: Contextual actions appear in bottom sheets (material design pattern)
- **Toast Notifications**: Transient confirmations with undo option (5-second timeout)

### 3.3 Core Screens

1. **Dashboard**: Upcoming games/training, recent results, quick actions (add player, create game)
2. **Player List**: Searchable grid with player cards (photo, name, jersey number, stats preview)
3. **Player Detail**: Full profile with tabs (Stats, Attendance, Edit)
4. **Game List**: Chronological list with opponent, date, result (W-D-L badge)
5. **Game Detail**: Score, goal timeline, attendance, generate report button
6. **Live Game Tracking**: Sticky scoreboard header, scrollable timeline, FAB for "Log Goal"
7. **Goal Logging Modal**: Smart-sorted player list, search filter, opponent goal button
8. **Training List**: Calendar view or list view with date/attendance summary
9. **Statistics Dashboard**: Tabs for Team Overview, Player Stats, Games (with charts)
10. **Settings**: Team profile, privacy controls, sync status, about/help

### 3.4 Accessibility Requirements

- **WCAG 2.1 Level AA Compliance**: 4.5:1 contrast ratios, keyboard navigation, ARIA labels
- **Screen Reader Support**: Semantic HTML, ARIA live regions for dynamic updates
- **Touch Target Size**: Minimum 56px height for all interactive elements
- **Focus Indicators**: Visible focus outlines on all keyboard-navigable elements
- **Error Handling**: Clear error messages with recovery instructions

### 3.5 Visual Design & Branding

- **Color Palette**: Primary (football green), Secondary (energy orange), Neutral (grays)
- **Typography**: System font stack (SF Pro on iOS, Roboto on Android) for performance
- **Iconography**: Material Design icons (consistent, recognizable)
- **Photography**: Optional team logo and player photos (graceful fallbacks with initials avatars)
- **Spacing**: 8px grid system (Tailwind default spacing scale)

### 3.6 Responsive Design

- **Mobile-First**: Designed for 375px+ width (iPhone SE and larger)
- **Tablet Support**: Two-column layouts on 768px+ width (iPad)
- **Desktop Support**: Sidebar navigation on 1024px+ width (optional stretch goal)
- **PWA Installation**: Standalone mode with splash screen and app icon

---

## 4. Technical Assumptions

### 4.1 Architecture

- **Frontend**: Angular 17.3 LTS with standalone components, Signals for reactivity
- **Backend**: Supabase (PostgreSQL, Auth, Storage, RLS policies)
- **Deployment**: Cloudflare Pages with global CDN
- **Offline Storage**: IndexedDB (via Dexie.js wrapper) + Service Worker
- **Repository**: Monorepo structure with `/src` (Angular app), `/supabase` (migrations/functions), `/docs` (architecture/PRD)

### 4.2 Data Model

Key entities (see architecture document for full schema):

- **teams**: Team profile (name, season, logo_url, created_by user_id)
- **players**: Player profile (team_id, first_name, last_name, dob, jersey_number, photo_url)
- **games**: Game details (team_id, opponent, date, location, status, final_score_team, final_score_opponent, result)
- **goals**: Goal events (game_id, player_id, scored_at_minute, scored_at_timestamp, notes)
- **goal_assists**: Assists (goal_id, player_id)
- **opponent_goals**: Opponent scoring (game_id, scored_at_minute)
- **training_sessions**: Training details (team_id, date, location, session_template_id)
- **training_templates**: Reusable templates (team_id, name, default_duration)
- **game_attendance**: Game attendance (game_id, player_id, status: attended/excused/absent)
- **training_attendance**: Training attendance (training_session_id, player_id, status)

### 4.3 API Strategy

- **Supabase PostgREST**: RESTful API with automatic endpoint generation from PostgreSQL schema
- **Row-Level Security (RLS)**: All tables filtered by team_id derived from JWT claims
- **Real-Time Subscriptions**: Not used in MVP (offline-first polling on reconnection)
- **RPC Functions**: Used for complex queries (e.g., aggregated statistics)

API conventions:
- Nested resources via query parameters (e.g., `/goals?game_id=eq.{id}`)
- Composite indexes on foreign keys for query performance
- Timestamps: `created_at`, `updated_at`, `deleted_at` (soft deletes)

### 4.4 Offline Sync Strategy

- **Sync Queue**: IndexedDB table (`sync_queue`) stores pending operations
- **Operation Types**: CREATE, UPDATE, DELETE with optimistic IDs (UUIDs generated client-side)
- **Conflict Resolution**: Last-write-wins (compare `updated_at` timestamps)
- **Atomic Operations**: Goals + assists synced as single transaction
- **Retry Logic**: Exponential backoff (1s, 2s, 4s, 8s, max 30s)
- **Background Sync**: Service Worker Periodic Background Sync API (when supported)

### 4.5 Testing Strategy

- **Unit Tests**: Jasmine/Karma for Angular services and components (80% coverage target)
- **Integration Tests**: pgTAP for database schema, RLS policies, and triggers (100% coverage for security-critical code)
- **E2E Tests**: Playwright for critical workflows (goal logging, offline sync, authentication)
- **Manual Testing**: Device testing on iOS Safari, Android Chrome, low-connectivity scenarios

### 4.6 CI/CD Pipeline

- **Version Control**: Git with GitHub
- **CI**: GitHub Actions workflow on push to main
  - Lint: ESLint + Prettier
  - Unit tests: Karma (headless Chrome)
  - Build: Angular production build with minification
  - Database tests: Supabase CLI + pgTAP
- **CD**: Automatic deployment to Cloudflare Pages on successful CI
- **Preview Deployments**: Branch previews for pull requests

### 4.7 Infrastructure

- **Hosting**: Cloudflare Pages (free tier: unlimited bandwidth, 500 builds/month)
- **Database**: Supabase (free tier: 500MB PostgreSQL, 2GB bandwidth/month)
- **CDN**: Cloudflare global CDN (automatic, included with Pages)
- **SSL**: Automatic HTTPS via Cloudflare (Let's Encrypt)
- **Monitoring**: Sentry for error tracking (free tier: 5,000 events/month)
- **Analytics**: (Optional) Google Analytics 4 or Plausible for privacy-friendly tracking

### 4.8 Security Model

- **Authentication**: Supabase Auth (JWT tokens with 7-day expiry, refresh token rotation)
- **Authorization**: Row-Level Security (RLS) policies on all tables filtering by `team_id`
- **Data Isolation**: `team_id` derived from JWT claims (`app_metadata.team_id`)
- **HTTPS-Only**: Enforced via Cloudflare Pages (HSTS headers)
- **CSP Headers**: Content Security Policy to prevent XSS attacks
- **Input Validation**: Client-side (Angular forms) + server-side (PostgreSQL constraints)

### 4.9 Performance Budgets

- **JavaScript Bundle**: <500KB compressed (Angular + dependencies)
- **Initial Page Load**: <2s on 3G (target: 1.5s on 4G)
- **Time to Interactive (TTI)**: <3s on 3G
- **IndexedDB Queries**: <100ms for reads, <50ms for writes
- **Statistics Aggregation**: <500ms for 1 season, <5s for 5 seasons

### 4.10 Browser & Device Support

- **Browsers**: Chrome 90+, Safari 14+, Firefox 88+, Edge 90+
- **Devices**: iOS 14+ (iPhone SE and larger), Android 8+ (mid-range devices)
- **PWA Install**: Supported on iOS 14+ and Android 5+
- **Service Worker**: Required for offline mode (graceful degradation if unsupported)

---

## 5. Epic List

### Epic 1: Foundation & Authentication
**Goal**: Establish technical foundation with authentication, team setup, dashboard, and offline infrastructure.

### Epic 2: Player & Squad Management
**Goal**: Enable coaches to manage their roster with add/edit/delete capabilities and squad organization.

### Epic 3: Training Sessions & Attendance
**Goal**: Provide tools to schedule training sessions, track attendance, and view participation statistics.

### Epic 4: Game Management & Calendar Integration
**Goal**: Enable manual game creation and automatic calendar import (iCal + Google Calendar OAuth).

### Epic 5: Live Game Tracking
**Goal**: Deliver the core value proposition with <5 second goal logging, live scoreboard, and timeline view.

### Epic 6: Statistics & Post-Game Reports
**Goal**: Transform tracked data into actionable insights with statistics dashboards and shareable reports.

---

## 6. Epic 1: Foundation & Authentication

**Epic Goal**: Establish technical foundation with authentication, team setup, dashboard, and offline infrastructure.

### Story 1.1: Project Scaffolding & Infrastructure Setup

**As a** developer
**I want** the Angular project scaffolded with all necessary dependencies
**So that** development can proceed with consistent tooling

**Acceptance Criteria**:
- ✅ Angular 17.3 LTS project created with standalone components
- ✅ TypeScript 5.2+ configured with strict mode
- ✅ ESLint + Prettier configured with team rules
- ✅ Git repository initialized with `.gitignore` for Angular
- ✅ Monorepo structure created:
  - `/src` - Angular application
  - `/supabase` - Database migrations and functions
  - `/docs` - Architecture and PRD documents
- ✅ Package.json scripts defined:
  - `npm start` - Development server
  - `npm test` - Unit tests with Karma
  - `npm run build` - Production build
  - `npm run lint` - ESLint check
- ✅ Tailwind CSS 3.3+ installed and configured
- ✅ Angular Material 17.x installed with theme customization
- ✅ Development server runs on `http://localhost:4200`

---

### Story 1.2: Supabase Project Setup & Schema Initialization

**As a** developer
**I want** the Supabase project configured with base schema
**So that** authentication and data storage are ready

**Acceptance Criteria**:
- ✅ Supabase project created (free tier)
- ✅ Supabase CLI installed and initialized
- ✅ Initial migration file created with `teams` table:
  - `id` (uuid, primary key, default: gen_random_uuid())
  - `name` (text, not null)
  - `season` (text, e.g., "2024-2025")
  - `logo_url` (text, nullable)
  - `created_by` (uuid, foreign key to auth.users)
  - `created_at` (timestamptz, default: now())
  - `updated_at` (timestamptz, default: now())
- ✅ RLS policies enabled on `teams` table:
  - SELECT: Users can only see teams they created (`created_by = auth.uid()`)
  - INSERT: Users can create teams with their user_id
  - UPDATE: Users can only update teams they own
  - DELETE: Users can only delete teams they own
- ✅ Migration applied to Supabase project: `supabase db push`
- ✅ Connection string saved to `.env` file (not committed to Git)
- ✅ pgTAP tests created for `teams` table schema and RLS policies

---

### Story 1.3: CI/CD Pipeline Setup

**As a** developer
**I want** continuous integration and deployment automated
**So that** code quality is maintained and deployments are fast

**Acceptance Criteria**:
- ✅ GitHub repository created (private or public based on preference)
- ✅ GitHub Actions workflow file created (`.github/workflows/ci.yml`):
  - Trigger: Push to `main` branch and pull requests
  - Jobs:
    1. Lint: Run ESLint and Prettier check
    2. Test: Run Karma unit tests in headless Chrome
    3. Build: Run Angular production build (`ng build --configuration production`)
    4. Database Test: Run pgTAP tests against Supabase staging environment
- ✅ Cloudflare Pages project created and connected to GitHub repo
- ✅ Cloudflare Pages build settings configured:
  - Build command: `npm run build`
  - Build output directory: `dist/tsubasa/browser`
  - Environment variables: Supabase URL and anon key
- ✅ Automatic deployment on push to `main` branch
- ✅ Preview deployments enabled for pull requests
- ✅ Build status badge added to README.md

---

### Story 1.4: Authentication Implementation (Supabase Auth)

**As a** user
**I want** to sign up and log in with email/password or Google OAuth
**So that** my team data is secure and isolated

**Acceptance Criteria**:
- ✅ `AuthService` created with methods:
  - `signUp(email, password)` - Creates user account via Supabase Auth
  - `signIn(email, password)` - Authenticates user, returns JWT
  - `signInWithGoogle()` - OAuth flow via Supabase Auth Google provider
  - `signOut()` - Clears session and redirects to login
  - `getCurrentUser()` - Returns observable of current user state
- ✅ `LoginComponent` created with:
  - Email/password form with validation (email format, password min length 8 chars)
  - "Sign in with Google" button
  - "Create account" link to registration form
  - Error handling for invalid credentials
- ✅ `SignupComponent` created with:
  - Email/password/confirm password form with validation
  - Password strength indicator
  - "Already have an account?" link to login
- ✅ Auth state persisted to localStorage (Supabase default behavior)
- ✅ Route guards implemented:
  - `AuthGuard` - Redirects unauthenticated users to login
  - `UnauthGuard` - Redirects authenticated users away from login/signup
- ✅ JWT token automatically included in Supabase client requests
- ✅ Token refresh handled automatically by Supabase client (7-day expiry)
- ✅ Unit tests for AuthService with mocked Supabase client
- ✅ E2E test for login flow (Playwright)

---

### Story 1.5: Team Creation & Profile Setup

**As a** new user
**I want** to create my team profile after first login
**So that** I can start adding players and tracking games

**Acceptance Criteria**:
- ✅ `TeamSetupComponent` displayed after first login (if user has no team)
- ✅ Form fields:
  - Team Name (required, text input)
  - Season (required, text input with placeholder "2024-2025")
  - Team Logo (optional, file upload - images only, max 2MB)
- ✅ Logo upload uses Supabase Storage:
  - Bucket: `team-logos` with public read access
  - File naming: `{team_id}.{extension}`
  - Resize to 512x512px on client before upload (using canvas API)
- ✅ On submit:
  - Create team record in `teams` table with `created_by = auth.uid()`
  - Upload logo to Supabase Storage (if provided)
  - Save logo URL to team record
  - Update user metadata: `app_metadata.team_id = team.id` (for RLS)
  - Redirect to dashboard
- ✅ Error handling:
  - Network failures: Retry with exponential backoff
  - Validation errors: Inline error messages
  - Duplicate team name: Allow (not globally unique)
- ✅ Loading state: Disable form during submission
- ✅ Unit test: Verify team creation saves to Supabase
- ✅ E2E test: Complete team setup flow after signup

---

### Story 1.6: Dashboard Home Screen

**As a** coach
**I want** to see upcoming games/training and recent results on the dashboard
**So that** I have an overview of my team's schedule

**Acceptance Criteria**:
- ✅ `DashboardComponent` created as default landing page after login
- ✅ Dashboard displays:
  - **Header**: Team name and logo
  - **Upcoming Events** section:
    - Next 3 games (opponent, date/time, countdown "in 2 days")
    - Next 3 training sessions (date/time, location)
    - Empty state: "No upcoming events - tap + to create a game or training"
  - **Recent Results** section:
    - Last 5 games with result badges (W-D-L) and final score
    - Empty state: "No games played yet"
  - **Quick Actions** FAB menu:
    - Add Player
    - Create Game
    - Create Training Session
- ✅ Data fetched from Supabase on component init:
  - Query `games` table filtered by `team_id`, ordered by date descending
  - Query `training_sessions` table filtered by `team_id`, ordered by date descending
- ✅ Pull-to-refresh on mobile (Angular CDK Scrolling)
- ✅ Loading state: Skeleton screens while data fetches
- ✅ Offline mode: Display cached data from IndexedDB with sync status indicator
- ✅ Navigation: Tapping event navigates to detail screen
- ✅ Responsive: Two-column layout on tablet (768px+ width)
- ✅ Unit test: Verify data fetching and display logic
- ✅ E2E test: Navigate dashboard after team setup

---

### Story 1.7: Offline Foundation (Service Worker & IndexedDB)

**As a** developer
**I want** Service Worker and IndexedDB infrastructure in place
**So that** offline functionality can be built incrementally

**Acceptance Criteria**:
- ✅ Angular Service Worker configured via `@angular/service-worker`
- ✅ `ngsw-config.json` created with cache strategies:
  - **App shell**: Cache all HTML, CSS, JS bundles
  - **Fonts**: Cache Google Fonts (if used) or local fonts
  - **Images**: Cache Material icons and team logos (max 50MB)
  - **Data**: No API caching (handled by IndexedDB sync)
- ✅ Service Worker registered in `main.ts` (production builds only)
- ✅ Dexie.js installed (IndexedDB wrapper for TypeScript)
- ✅ `DatabaseService` created with Dexie schema:
  - Tables: `teams`, `players`, `games`, `training_sessions`, `goals`, `goal_assists`, `opponent_goals`, `game_attendance`, `training_attendance`, `sync_queue`
  - Indexes: Foreign keys (e.g., `players.team_id`, `goals.game_id`)
- ✅ `SyncService` created with methods:
  - `queueOperation(table, operation, data)` - Adds to sync queue
  - `processSyncQueue()` - Syncs queued operations to Supabase
  - `pullChanges()` - Fetches updates from Supabase since last sync
  - `resolveConflict(local, remote)` - Last-write-wins by `updated_at`
- ✅ Sync triggered on:
  - App startup (if online)
  - Network reconnection (via `navigator.onLine` listener)
  - Manual refresh (pull-to-refresh)
- ✅ Sync status exposed via Signal: `syncState()` returns 'pending' | 'syncing' | 'synced' | 'error'
- ✅ Unit test: Verify sync queue operations and conflict resolution
- ✅ E2E test: Create record offline, go online, verify sync to Supabase

---

## 7. Epic 2: Player & Squad Management

**Epic Goal**: Enable coaches to manage their roster with add/edit/delete capabilities and squad organization.

### Story 2.1: Player Database Schema

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

### Story 2.2: Player List View

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

### Story 2.3: Add Player Form

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

### Story 2.4: Edit Player Form

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

### Story 2.5: Delete Player (Soft Delete)

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

### Story 2.6: Squad Management (Grouping Players)

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

### Story 2.7: Player Statistics Service Foundation

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

## 8. Epic 3: Training Sessions & Attendance

**Epic Goal**: Provide tools to schedule training sessions, track attendance, and view participation statistics.

### Story 3.1: Training Sessions Database Schema

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

### Story 3.2: Training Template Creation

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

### Story 3.3: Training Session List View

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

### Story 3.4: Create Training Session (Manual)

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

### Story 3.5: Mark Training Attendance

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

### Story 3.6: Training Attendance Statistics

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

### Story 3.7: Cancel Training Session

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

### Story 3.8: Edit Training Session Template

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

## 9. Epic 4: Game Management & Calendar Integration

**Epic Goal**: Enable manual game creation and automatic calendar import (iCal + Google Calendar OAuth).

### Story 4.1: Games Database Schema

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

### Story 4.2: Game List View

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

### Story 4.3: Create Game (Manual Entry)

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

### Story 4.4: Edit Game Details

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

### Story 4.5: Cancel Game

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

### Story 4.6: Calendar Import (iCal File Upload)

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

### Story 4.7: Google Calendar OAuth Integration

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

### Story 4.8: Calendar Backfill (Historical Games)

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

## 10. Epic 5: Live Game Tracking

**Epic Goal**: Enable coaches to track game events in real-time with minimal friction, achieving <5 second goal logging while maintaining full offline capability.

### Story 5.1: Goals Database Schema & Sync Infrastructure

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

### Story 5.2: Game Timer with Background Persistence

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

### Story 5.3: Live Scoreboard Header Component

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

### Story 5.4: Goal Logging Workflow (Scorer Selection)

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

### Story 5.5: Assist Tracking (Multi-Select Enhancement)

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

### Story 5.6: Opponent Goal Tracking

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

### Story 5.7: Game Timeline & Event History

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

### Story 5.8: Undo/Edit Goal Functionality

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

### Story 5.9: Smart Player Sorting by Frequency

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

### Story 5.10: Offline Sync for Live Game Events

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

## 11. Epic 6: Statistics & Post-Game Reports

**Epic Goal**: Provide actionable insights from tracked data through statistics dashboards and exportable post-game reports that coaches can share with parents and league organizers.

### Story 6.1: Player Statistics Aggregation Service

**As a** developer
**I want** a service that aggregates player statistics across games
**So that** statistics views can display accurate, performant data

**Acceptance Criteria**:
- ✅ `PlayerStatsService` created with methods to calculate:
  - **Per-player totals**: goals, assists, games played, attendance rate, training sessions attended
  - **Per-player averages**: goals per game, assists per game
  - **Team totals**: total goals scored, total goals conceded, win/loss/draw record
- ✅ Aggregations run against IndexedDB for offline access:
  - Query all games for date range
  - Join with goals, goal_assists, game_attendance, training_attendance
  - Calculate aggregates using reduce operations
- ✅ Caching strategy:
  - Cache aggregates in IndexedDB with last_calculated timestamp
  - Invalidate cache when new games/goals added
  - Recalculate on demand when cache stale (>5 min old)
- ✅ Service exposes Signals for reactive UI:
  - `playerStats()`, `teamStats()`, `isCalculating()`
- ✅ Performance optimization:
  - Aggregation runs in Web Worker to avoid blocking UI
  - Large datasets (>50 games) calculated incrementally with progress updates
- ✅ TypeScript types for stats objects:
  ```typescript
  interface PlayerStats {
    playerId: string;
    playerName: string;
    gamesPlayed: number;
    goalsScored: number;
    assists: number;
    attendanceRate: number; // 0-100%
    trainingSessionsAttended: number;
  }
  ```
- ✅ Jasmine unit tests verify calculation accuracy with mock data
- ✅ E2E test: create 3 games with goals, verify stats aggregate correctly

---

### Story 6.2: Player Statistics Dashboard

**As a** coach
**I want** to see individual player statistics in a sortable table
**So that** I can identify top performers and players needing encouragement

**Acceptance Criteria**:
- ✅ `PlayerStatsComponent` displays table with columns:
  - Player Name (with avatar if available)
  - Games Played
  - Goals Scored
  - Assists
  - Attendance Rate (%)
  - Training Sessions Attended
- ✅ Sortable by any column (ascending/descending)
- ✅ Default sort: Goals Scored (descending)
- ✅ Mobile-optimized:
  - Horizontal scroll for table on small screens
  - Sticky first column (player name)
  - Compact spacing (48px row height)
- ✅ Search/filter:
  - Text search by player name
  - Filter by date range (season, last month, all time)
- ✅ Visual indicators:
  - Highlight top 3 players in each category (gold/silver/bronze badges)
  - Low attendance (<70%) shown in amber/red
- ✅ Empty state: "No games played yet - statistics will appear after your first game"
- ✅ Export button: "Export to CSV" (triggers download)
- ✅ Offline: works entirely from IndexedDB, no network required
- ✅ Accessibility: sortable table with ARIA sort attributes, keyboard navigation
- ✅ E2E test: verify sorting, filtering, and CSV export

---

### Story 6.3: Team Statistics Dashboard

**As a** coach
**I want** to see overall team performance metrics
**So that** I can track progress over the season

**Acceptance Criteria**:
- ✅ `TeamStatsComponent` displays summary cards:
  - **Games Played**: Total count with W-D-L record
  - **Goals For**: Total scored with per-game average
  - **Goals Against**: Total conceded with per-game average
  - **Goal Difference**: +/- with visual indicator (green=positive, red=negative)
  - **Top Scorer**: Player name with goal count
  - **Top Assister**: Player name with assist count
  - **Attendance Average**: % across all games/training
- ✅ Date range filter: Season, Last Month, Last 3 Months, All Time
- ✅ Visual charts (using lightweight chart library like Chart.js or ng2-charts):
  - **Goals per game timeline**: Line chart showing scoring trend
  - **Win rate over time**: Stacked bar chart (W/D/L per month)
  - **Top 5 scorers**: Horizontal bar chart
- ✅ Mobile-optimized: cards stack vertically, charts resize responsively
- ✅ Offline: all data from IndexedDB, charts render without network
- ✅ Empty state: "Play your first game to see team statistics"
- ✅ Accessibility: charts have text alternatives, cards use semantic HTML
- ✅ Unit test: verify stat calculations with mock data
- ✅ E2E test: verify charts render and respond to date range filter

---

### Story 6.4: Post-Game Report Generation

**As a** coach
**I want** to generate a shareable report after each game
**So that** I can send summaries to parents and league organizers

**Acceptance Criteria**:
- ✅ "Generate Report" button on game detail screen (visible after game ends)
- ✅ Report includes:
  - **Header**: Team name, opponent, date, final score
  - **Goal Timeline**: Chronological list of goals with scorers and assists
  - **Player Stats**: Goals and assists for this game
  - **Attendance**: List of players who attended
  - **Notes**: Optional coach comments (editable text area)
- ✅ Report generated as HTML template with clean formatting
- ✅ Export options:
  - **Copy to Clipboard**: HTML formatted for email paste
  - **Share**: Native Web Share API (if supported) for SMS/WhatsApp/email
  - **Download PDF**: Client-side PDF generation using jsPDF or similar
  - **Print**: Browser print dialog with print-optimized CSS
- ✅ Template styling:
  - Clean, professional layout
  - Team branding (logo if uploaded)
  - Mobile-friendly for viewing on parent devices
- ✅ Offline: report generated entirely from IndexedDB
- ✅ Preview before sharing: modal shows rendered report
- ✅ E2E test: generate report, verify all sections populated, test copy to clipboard

---

### Story 6.5: CSV Export for Player Statistics

**As a** coach
**I want** to export player statistics to CSV
**So that** I can analyze data in Excel or share with league administrators

**Acceptance Criteria**:
- ✅ "Export to CSV" button on Player Statistics dashboard
- ✅ CSV includes columns:
  - Player Name, Jersey Number, Games Played, Goals Scored, Assists, Attendance Rate, Training Sessions Attended
- ✅ Respects current filters:
  - If date range filter applied, export reflects filtered data
  - If search filter applied, export includes only visible players
- ✅ File naming: `tsubasa-player-stats-YYYY-MM-DD.csv`
- ✅ Encoding: UTF-8 with BOM for Excel compatibility
- ✅ CSV generation:
  - Client-side using Blob API
  - Triggers browser download
  - No server request required
- ✅ Empty state handling: if no data, show toast "No statistics to export"
- ✅ Offline: works entirely client-side
- ✅ Unit test: verify CSV formatting and UTF-8 encoding
- ✅ E2E test: export CSV, verify file downloads with correct name and content

---

### Story 6.6: Season Summary Report

**As a** coach
**I want** to generate an end-of-season summary report
**So that** I can celebrate achievements with players and parents

**Acceptance Criteria**:
- ✅ "Season Summary" option in Statistics menu
- ✅ Report includes:
  - **Season Overview**: Date range, games played, W-D-L record
  - **Team Achievements**:
    - Total goals scored
    - Best win (largest margin)
    - Longest winning streak
    - Cleansheet count (games with 0 goals conceded)
  - **Individual Awards**:
    - Golden Boot (top scorer)
    - Playmaker Award (top assists)
    - Perfect Attendance (100% attendance)
    - Most Improved (largest goals/game increase month-over-month)
  - **Player Profiles**: Mini-profile for each player with photo, stats, and coach comment
- ✅ Coach can add custom comments per player (saved in database)
- ✅ Export options:
  - **PDF**: Multi-page formatted document with team branding
  - **Print**: Print-optimized layout with page breaks
  - **Share**: Web Share API for digital distribution
- ✅ Template styling:
  - Professional, celebratory design
  - Photo placeholders if no player photos uploaded
  - Team colors/branding
- ✅ Generated entirely offline from IndexedDB
- ✅ Preview modal before export
- ✅ E2E test: generate season summary for 10-game season, verify awards calculated correctly

---

### Story 6.7: Statistics Privacy & Sharing Controls

**As a** coach
**I want** to control what statistics are visible and shareable
**So that** I respect player privacy and parental preferences

**Acceptance Criteria**:
- ✅ Team Settings page includes "Statistics & Privacy" section:
  - **Show comparative stats**: Toggle to show/hide player rankings (top scorer badges, etc.)
  - **Allow CSV export**: Toggle to enable/disable CSV export feature
  - **Include photos in reports**: Toggle to include/exclude player photos in shared reports
- ✅ When "Show comparative stats" disabled:
  - Player Stats dashboard shows data but no rankings/badges
  - Season summary shows team totals only, no individual awards
- ✅ When "Allow CSV export" disabled:
  - Export button hidden from UI
  - API prevents CSV generation (security through obscurity)
- ✅ When "Include photos in reports" disabled:
  - Reports use initials avatars instead of photos
  - PDF exports exclude photo placeholders
- ✅ Settings saved to team profile in Supabase
- ✅ Settings synced offline to IndexedDB
- ✅ Default settings: All toggles enabled (opt-out privacy model for MVP)
- ✅ Unit test: verify privacy settings respected in report generation
- ✅ E2E test: disable comparative stats, verify badges hidden

---

### Story 6.8: Game Result Recording (Win/Draw/Loss)

**As a** coach
**I want** to manually record the final game result
**So that** win/loss statistics are accurate even if opponent score tracking was incomplete

**Acceptance Criteria**:
- ✅ "Finalize Game" button appears on live game screen after timer reaches 90+ minutes
- ✅ Tapping "Finalize Game" opens modal with:
  - Display current score: Team X - Y Opponent
  - Result auto-calculated: Win/Draw/Loss
  - Manual override option: "Adjust final score" fields if opponent tracking incomplete
  - Confirmation button: "Confirm & Finalize"
- ✅ Finalization updates game record:
  - Set `status = 'completed'`
  - Set `final_score_team` and `final_score_opponent`
  - Set `result` field ('win' | 'draw' | 'loss')
  - Set `finalized_at` timestamp
- ✅ After finalization:
  - Redirect to game detail screen
  - Show "Generate Report" button
  - Timer stops and cannot be restarted
  - Goals can still be edited (in case of post-game corrections)
- ✅ Result contributes to team statistics (W-D-L record)
- ✅ Finalization synced to Supabase with sync_state tracking
- ✅ Offline: finalization saved to IndexedDB, synced when online
- ✅ E2E test: finalize game, verify result calculated correctly, verify report generation available

---

### Story 6.9: Statistics Dashboard Navigation & Layout

**As a** coach
**I want** an intuitive navigation structure for all statistics features
**So that** I can quickly access the data I need

**Acceptance Criteria**:
- ✅ "Statistics" section added to main navigation menu
- ✅ Statistics landing page displays tabs:
  - **Overview**: Team stats dashboard (default view)
  - **Players**: Player stats table
  - **Games**: List of all games with quick links to reports
- ✅ Mobile navigation:
  - Bottom tab bar with icons (Overview/Players/Games)
  - Swipe gestures to switch tabs
- ✅ Desktop navigation:
  - Sidebar menu with expandable "Statistics" section
  - Sub-items: Overview, Players, Games, Season Summary
- ✅ Breadcrumb navigation on detail screens
- ✅ Quick actions in header:
  - Date range filter (applies to all tabs)
  - Export button (context-aware: CSV for Players, Report for Games)
- ✅ Loading states: skeleton screens while calculating statistics
- ✅ Error states: friendly messages if no data available
- ✅ Accessibility: keyboard navigation, ARIA landmarks, skip links
- ✅ E2E test: navigate through all tabs, verify content loads correctly

---

### Story 6.10: Statistics Performance Optimization

**As a** developer
**I want** statistics calculations to be performant with large datasets
**So that** the app remains responsive even after multiple seasons

**Acceptance Criteria**:
- ✅ Aggregation benchmarks:
  - <500ms for 1 season (20 games, 15 players, ~50 goals)
  - <2s for 3 seasons (60 games, 15 players, ~150 goals)
  - <5s for 5 seasons (100 games, 20 players, ~300 goals)
- ✅ Performance optimizations implemented:
  - **Web Worker**: All aggregations run in background thread
  - **Incremental calculation**: Large datasets processed in chunks with yield points
  - **Indexed queries**: IndexedDB compound indexes for efficient joins
  - **Memoization**: Cache frequently accessed calculations
  - **Virtual scrolling**: Player table uses CDK Virtual Scroll for >50 players
- ✅ Progress indicators:
  - Spinner with percentage for long calculations (>1s)
  - "Calculating statistics... 45%" text updates
- ✅ Lazy loading:
  - Charts load after initial stats render
  - Chart data calculated on-demand when tab viewed
- ✅ Memory management:
  - Large query results released after aggregation
  - Chart instances destroyed when component unmounted
- ✅ Performance monitoring:
  - Console logs for calculation times in development
  - Performance.mark() calls for profiling
- ✅ Unit test: verify benchmarks with simulated large datasets
- ✅ E2E test: create 50-game dataset, verify statistics load within performance targets

---

## 12. Next Steps

This PRD is now ready for development! Here are the recommended next steps:

### For UX/UI Design:
Review the UI Design Goals (Section 3) and create wireframes/mockups for the 10 core screens. Pay special attention to:
- Live game tracking interface (Stories 5.2-5.7) - this is the critical UX
- Goal logging modal with smart-sorted player list (Story 5.4)
- Statistics dashboards with charts (Stories 6.2-6.3)

### For Architecture Review:
Cross-reference this PRD with `docs/architecture.md` to ensure alignment on:
- Database schema definitions (verify all tables match)
- API patterns and RLS policies
- Offline sync strategy and conflict resolution
- Performance budgets and optimization targets

### For Development Team:
1. Start with **Epic 1** (Foundation & Authentication) to establish infrastructure
2. Proceed sequentially through epics (dependencies are ordered)
3. Each story is sized for 3-8 hours of focused development (suitable for AI agent execution)
4. Prioritize E2E tests for critical workflows: authentication, goal logging, offline sync
5. Target timeline: ~12-20 weeks with AI-assisted development

### For Product Manager:
1. Create epic files in `docs/prd/` for easier navigation (optional)
2. Set up project tracking (GitHub Issues, Linear, Jira) with stories as tickets
3. Schedule design reviews for high-risk UX (live game tracking)
4. Plan user testing sessions with target coaches (post-Epic 5 completion)

---

**Document Status: ✅ Complete and Ready for Development**
