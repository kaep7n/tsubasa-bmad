# 6. Epic 1: Foundation & Authentication

**Epic Goal**: Establish technical foundation with authentication, team setup, dashboard, and offline infrastructure.

## Story 1.1: Project Scaffolding & Infrastructure Setup

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

## Story 1.2: Supabase Project Setup & Schema Initialization

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

## Story 1.3: CI/CD Pipeline Setup

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

## Story 1.4: Authentication Implementation (Supabase Auth)

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

## Story 1.5: Team Creation & Profile Setup

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

## Story 1.6: Dashboard Home Screen

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

## Story 1.7: Offline Foundation (Service Worker & IndexedDB)

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
