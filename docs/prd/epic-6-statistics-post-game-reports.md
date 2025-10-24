# 11. Epic 6: Statistics & Post-Game Reports

**Epic Goal**: Provide actionable insights from tracked data through statistics dashboards and exportable post-game reports that coaches can share with parents and league organizers.

## Story 6.1: Player Statistics Aggregation Service

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

## Story 6.2: Player Statistics Dashboard

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

## Story 6.3: Team Statistics Dashboard

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

## Story 6.4: Post-Game Report Generation

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

## Story 6.5: CSV Export for Player Statistics

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

## Story 6.6: Season Summary Report

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

## Story 6.7: Statistics Privacy & Sharing Controls

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

## Story 6.8: Game Result Recording (Win/Draw/Loss)

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

## Story 6.9: Statistics Dashboard Navigation & Layout

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

## Story 6.10: Statistics Performance Optimization

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
