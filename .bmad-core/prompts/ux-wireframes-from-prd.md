# UX Expert: Wireframe Generation from PRD

## Context

You are a UX Expert specializing in mobile-first Progressive Web Applications. You have been provided with:

1. **Product Requirements Document (PRD)**: `docs/prd.md` - Complete functional and non-functional requirements with 6 epics
2. **Architecture Document**: `docs/architecture.md` - Technical implementation details
3. **Project Brief**: `docs/brief.md` - Problem statement and target users

## Your Mission

Create low-fidelity wireframes for the 10 core screens identified in the PRD (Section 3.3), focusing on the **Live Game Tracking** interface as the highest priority.

## Critical Requirements from PRD

### Target Users
- Volunteer youth football coaches (ages 30-50)
- Managing 15-20 players per team
- Using mobile devices (iOS/Android) in outdoor stadium conditions
- Varying technical proficiency

### Core UX Constraints
- **Speed**: Goal logging must complete in <5 seconds (<3 taps)
- **Offline-First**: All features must work without connectivity
- **Mobile-First**: Designed for 375px+ width screens (iPhone SE and larger)
- **One-Handed Operation**: Primary actions in bottom 30% of screen (thumb-safe zones)
- **Touch Targets**: Minimum 56px height for all interactive elements
- **Accessibility**: WCAG 2.1 Level AA compliance

### Interaction Paradigms
1. **Optimistic UI**: Immediate feedback, no loading spinners for offline writes
2. **Smart Defaults**: Pre-fill forms with likely values
3. **Progressive Disclosure**: Hide complexity until needed
4. **3-Tap Maximum**: Core workflows complete in ≤3 taps
5. **Toast Notifications**: Transient confirmations with 5-second undo option

## Priority Screens (Wireframe in This Order)

### 1. Live Game Tracking (CRITICAL - Epic 5)
**Reference Stories**: 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8

**Key Components**:
- **Sticky Scoreboard Header** (48-56px height):
  - Team score vs Opponent score (large, bold numerals)
  - Current game minute with visual indicator (running/paused/half-time)
  - Sync status icon (pending/syncing/synced/error)
- **Scrollable Game Timeline**:
  - Chronological event list (most recent at top)
  - Goal events: "[Minute]' - Goal by [Player Name] (Assists: [Names])"
  - Opponent goal events: "[Minute]' - Opponent Goal"
  - Half-time divider
  - Edit/delete icons on each event
- **Floating Action Button (FAB)**: "Log Goal" (bottom-right, above thumb zone)

**Goal Logging Modal** (triggered by FAB):
- Smart-sorted player list:
  - Current game scorers at top (with goal count badge)
  - Frequently selected players next (⭐ icon)
  - Remaining players alphabetically
- Search filter at top (for >15 players)
- Large touch targets (56px min height)
- "Opponent Goal" button at bottom
- Outside tap or back button to dismiss

**Assist Selection Modal** (after scorer selected):
- Same player list (excluding scorer)
- Multi-select checkboxes
- "Skip" button (no assists)
- "Save" button (with selected assists)
- 10-second timeout with auto-save

**Timer Quick-Adjust Modal** (tapping scoreboard timer):
- Pause/Resume button (large, center)
- Set Minute input (number field)
- Current minute display
- Close button

### 2. Player List
**Reference Stories**: 2.2, 2.3

**Key Components**:
- Search bar at top
- Filter dropdown (All/Starters/Substitutes)
- Sort dropdown (Alphabetical/Jersey/Goals)
- Grid layout (2 columns mobile, 3+ tablet):
  - Player card: Circular avatar/initials, Name, Jersey number badge, Quick stats (goals, attendance)
- FAB: "Add Player"
- Empty state: "No players yet - tap + to add your first player"

### 3. Game List
**Reference Stories**: 4.2, 4.3

**Key Components**:
- Filter dropdown (All/Upcoming/Past/Cancelled)
- Search bar (opponent name)
- List items:
  - Opponent name (bold)
  - Date/time, Location
  - Home/Away badge
  - Result badge (W-D-L) for completed games
  - Final score
- FAB with sub-menu:
  - "Manual Entry"
  - "Import Calendar"
- Empty state: "No games yet - tap + to schedule your first game"

### 4. Statistics Dashboard (Team Overview)
**Reference Stories**: 6.3, 6.9

**Key Components**:
- Date range filter (top)
- Summary cards (stacked vertically on mobile):
  - Games Played (W-D-L record)
  - Goals For/Against/Difference
  - Top Scorer/Assister
  - Attendance Average
- Visual charts:
  - Goals per game timeline (line chart)
  - Win rate over time (stacked bar chart)
  - Top 5 scorers (horizontal bar chart)
- Tab navigation (Overview/Players/Games)

### 5. Player Statistics Table
**Reference Stories**: 6.2

**Key Components**:
- Search bar (player name)
- Date range filter
- Export to CSV button
- Sortable table:
  - Columns: Player Name, Games, Goals, Assists, Attendance %, Training Attended
  - Sticky first column (player name)
  - Gold/silver/bronze badges for top 3 in each category
  - Low attendance (<70%) in amber/red
- Horizontal scroll on mobile
- Empty state: "No games played yet"

### 6. Dashboard Home Screen
**Reference Stories**: 1.6

**Key Components**:
- Header: Team name and logo
- Upcoming Events section:
  - Next 3 games (opponent, date/time, countdown)
  - Next 3 training sessions (date/time, location)
- Recent Results section:
  - Last 5 games (result badge, final score)
- FAB menu: Add Player, Create Game, Create Training
- Pull-to-refresh indicator
- Sync status indicator

### 7. Training Session Detail
**Reference Stories**: 3.5

**Key Components**:
- Header: Date, time, duration, location
- Attendance summary: "12/15 attended (80%)"
- Quick actions: "Mark All Attended", "Reset"
- Player list with three-state toggles:
  - Attended (green checkmark)
  - Excused (yellow dash)
  - Absent (red X)
- Search filter (player name)
- "Edit Session" and "Cancel Session" buttons

### 8. Add/Edit Player Form
**Reference Stories**: 2.3, 2.4

**Key Components**:
- Form fields:
  - First Name (required)
  - Last Name (required)
  - Date of Birth (date picker)
  - Jersey Number (number input 1-99)
  - Photo (file upload with preview)
  - Squad (dropdown: Starters/Substitutes)
- Validation errors (inline)
- Loading state (disable form during submission)
- Cancel and Save buttons (bottom)

### 9. Post-Game Report Preview
**Reference Stories**: 6.4

**Key Components**:
- Report preview (scrollable):
  - Header: Team name, opponent, date, final score
  - Goal timeline with scorers/assists
  - Player stats for this game
  - Attendance list
  - Coach notes (editable textarea)
- Export options (bottom sheet):
  - Copy to Clipboard
  - Share (Web Share API)
  - Download PDF
  - Print
- Close button

### 10. Login/Signup Screens
**Reference Stories**: 1.4

**Key Components**:
- **Login**:
  - Email input
  - Password input
  - "Sign in with Google" button
  - "Create account" link
  - Error messages
- **Signup**:
  - Email input
  - Password input (with strength indicator)
  - Confirm password input
  - "Already have an account?" link
  - Create account button

## Deliverables

For each screen, provide:

1. **Low-Fidelity Wireframe**: ASCII art, Markdown diagram, or description of layout
2. **Component Hierarchy**: List of components from top to bottom
3. **Interaction Flow**: Numbered steps for primary user journey
4. **Edge Cases**: Empty states, loading states, error states
5. **Accessibility Notes**: ARIA labels, focus order, screen reader announcements

## Design System Assumptions

Based on PRD Section 3.5:

- **Colors**: Primary (football green), Secondary (energy orange), Neutral (grays)
- **Typography**: System fonts (SF Pro on iOS, Roboto on Android)
- **Icons**: Material Design icons
- **Spacing**: 8px grid system (Tailwind default)
- **Component Library**: Angular Material 17.x

## Output Format

For each screen, use this template:

```markdown
## Screen: [Screen Name]

### Layout (Low-Fi Wireframe)

[ASCII art or description]

### Component Hierarchy

1. [Top-level component]
   - [Child component]
   - [Child component]
2. [Next component]

### Primary User Journey

1. [Step 1]
2. [Step 2]
3. [Expected outcome]

### States

- **Empty**: [Description]
- **Loading**: [Description]
- **Error**: [Description]

### Accessibility

- [ARIA labels]
- [Focus order]
- [Screen reader announcements]

### Open Questions

- [Question for product/design review]
```

## Success Criteria

Your wireframes are successful if:

1. ✅ Live Game Tracking achieves <3-tap goal logging
2. ✅ All primary actions in bottom 30% of screen (thumb-safe)
3. ✅ Touch targets ≥56px height
4. ✅ Offline states clearly communicated
5. ✅ Empty/loading/error states defined
6. ✅ Accessibility requirements addressed

## Next Steps After Wireframes

1. Review wireframes with product manager (John)
2. Validate with target users (youth football coaches)
3. Create high-fidelity mockups with branding
4. Hand off to development team with component specifications

---

**Ready to begin? Start with Screen #1 (Live Game Tracking) - it's the most critical UX.**
