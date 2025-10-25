# 2. Requirements

## 2.1 Functional Requirements

### FR-001: Authentication & Team Setup
- System shall support email/password and OAuth (Google) authentication via Supabase Auth
- Users shall create a team profile with name, season, and optional logo
- System shall assign unique team_id for data isolation via Row-Level Security (RLS)

### FR-002: Player Management
- Users shall add players with: first name, last name, date of birth, jersey number, optional photo
- Users shall edit player details at any time
- Users shall archive (soft delete) players who leave the team
- System shall display player list with search/filter capabilities
- Users shall organize players into squads (e.g., starters, substitutes)

### FR-003: Training Session Management
- Users shall create training session templates with date/time/location
- Users shall create manual training sessions from templates or scratch
- Users shall mark attendance for each player (Attended/Excused/Absent)
- System shall display training session list with date/attendance summary
- Users shall view attendance statistics per player (% attendance rate)
- Users shall edit or cancel training sessions

### FR-004: Game Management
- Users shall create games manually with: opponent name, date/time, location, home/away
- Users shall edit game details before or after completion
- Users shall cancel games with protected attendance/goals
- System shall display game list with date/opponent/result
- Users shall import games via iCal (.ics) file upload
- Users shall connect Google Calendar OAuth for automatic game sync
- System shall backfill historical games on calendar connection

### FR-005: Live Game Tracking
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

### FR-006: Offline Sync
- System shall persist all data (players, games, training, goals, attendance) to IndexedDB
- System shall queue mutations (create/update/delete) when offline
- System shall sync queued operations to Supabase on connectivity restoration
- System shall resolve sync conflicts using last-write-wins (by updated_at timestamp)
- System shall display sync status indicators (pending/syncing/synced/error)
- System shall retry failed syncs with exponential backoff (1s, 2s, 4s, 8s, max 30s)

### FR-007: Statistics & Reporting
- System shall aggregate player statistics: games played, goals, assists, attendance rate, training sessions attended
- System shall aggregate team statistics: W-D-L record, goals for/against, goal difference
- Users shall view player statistics in sortable table with date range filter
- Users shall view team statistics dashboard with visual charts (goals per game, win rate, top scorers)
- Users shall generate post-game reports with: score, goal timeline, attendance, coach notes
- Users shall export reports as: PDF, HTML (copy to clipboard), Web Share API, Print
- Users shall export player statistics to CSV
- Users shall generate season summary report with team achievements and individual awards
- Users shall control statistics privacy (show/hide comparative rankings, enable/disable CSV export, include/exclude photos)

### FR-008: Game Result Recording
- Users shall finalize games after timer reaches 90+ minutes
- System shall auto-calculate result (Win/Draw/Loss) from current score
- Users shall manually adjust final score if opponent tracking was incomplete
- System shall update game status to 'completed' and record final_score_team, final_score_opponent, result

### FR-009: Dashboard & Navigation
- System shall display dashboard with: upcoming games/training, recent results, quick actions
- Users shall navigate via bottom tab bar (mobile) or sidebar menu (desktop)
- System shall provide breadcrumb navigation on detail screens

### FR-010: Data Export
- Users shall export player statistics to CSV with UTF-8 encoding
- CSV exports shall respect current filters (date range, search query)
- File naming convention: `tsubasa-player-stats-YYYY-MM-DD.csv`

## 2.2 Non-Functional Requirements

### NFR-001: Performance
- Page load time shall be <2 seconds on 3G connection
- Goal logging workflow shall complete in <5 seconds
- Statistics aggregation shall complete in <500ms for 1 season (20 games, 15 players)
- Statistics aggregation shall complete in <5s for 5 seasons (100 games, 20 players)
- App shall support 100+ games per team without performance degradation

### NFR-002: Offline Capability
- App shall function fully offline after initial load
- Service Worker shall cache all static assets (HTML, CSS, JS, fonts, icons)
- IndexedDB shall store all team data with <10MB footprint per team per season
- Sync queue shall process 100+ queued operations within 30 seconds on reconnection

### NFR-003: Mobile Optimization
- Touch targets shall be ≥56px height (WCAG 2.1 Level AAA)
- App shall support portrait orientation on 375px+ width screens (iPhone SE and larger)
- App shall be operable one-handed with thumb-safe zones
- Forms shall use mobile-optimized input types (date pickers, number keyboards)

### NFR-004: Security
- All API communication shall use HTTPS only
- Authentication tokens (JWT) shall expire after 7 days with refresh token rotation
- Row-Level Security (RLS) policies shall enforce team_id isolation on all tables
- Passwords shall be hashed using bcrypt (Supabase Auth default)
- Sensitive data (email, player DOB) shall never be logged or exposed in client-side errors

### NFR-005: Accessibility
- App shall comply with WCAG 2.1 Level AA standards
- All interactive elements shall be keyboard navigable
- Color contrast ratios shall meet 4.5:1 for normal text, 3:1 for large text
- Form inputs shall have associated labels and error messages
- Dynamic content updates shall use ARIA live regions
- Images shall have alt text (or empty alt for decorative images)

### NFR-006: Browser Support
- App shall support Chrome 90+, Safari 14+, Firefox 88+, Edge 90+
- Service Worker shall gracefully degrade if not supported (online-only mode)
- PWA installation shall be supported on iOS 14+ and Android 5+

### NFR-007: Data Retention
- Deleted records shall be soft-deleted (deleted_at timestamp) for 90 days
- Hard delete shall occur after 90-day retention period (automated job)
- Supabase backups shall be retained for 7 days (point-in-time recovery)

### NFR-008: Scalability
- Database shall support 1000+ teams without performance degradation
- Supabase free tier limits: 500MB database, 2GB bandwidth/month, 50,000 monthly active users
- IndexedDB storage shall be bounded to 50MB per team (warn user at 40MB)

### NFR-009: Monitoring & Observability
- Client-side errors shall be reported to error tracking service (e.g., Sentry)
- Sync failures shall be logged with error codes for debugging
- Performance metrics (page load, sync latency) shall be tracked via Performance API

### NFR-010: Testing
- Unit test coverage shall be ≥80% for services and components (Jasmine/Karma)
- Database schema shall have 100% pgTAP test coverage for RLS policies
- Critical workflows (goal logging, sync) shall have E2E test coverage (Playwright)

---
