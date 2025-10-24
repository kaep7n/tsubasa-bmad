# 3. UI Design Goals

## 3.1 UX Vision

Tsubasa's user experience is optimized for **speed and simplicity** in high-pressure, mobile-first contexts. Coaches standing on the sideline during games need to log events in <5 seconds without missing game action. The UI prioritizes:

1. **Optimistic UI**: Immediate feedback for all actions (no loading spinners for offline writes)
2. **Smart Defaults**: Pre-fill forms with likely values (e.g., today's date, current time)
3. **Progressive Disclosure**: Hide complexity until needed (e.g., assists are optional, edits are secondary actions)
4. **Thumb-Friendly Layout**: Primary actions in bottom 30% of screen for one-handed use
5. **Visual Hierarchy**: Bold numerals for scores, clear iconography, high-contrast action buttons

## 3.2 Interaction Paradigms

- **3-Tap Maximum**: Core workflows (log goal, mark attendance) complete in ≤3 taps
- **Swipe Gestures**: Navigate between tabs/sections with horizontal swipes
- **Floating Action Buttons (FABs)**: Primary action always visible (e.g., "Log Goal" during games)
- **Bottom Sheets**: Contextual actions appear in bottom sheets (material design pattern)
- **Toast Notifications**: Transient confirmations with undo option (5-second timeout)

## 3.3 Core Screens

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

## 3.4 Accessibility Requirements

- **WCAG 2.1 Level AA Compliance**: 4.5:1 contrast ratios, keyboard navigation, ARIA labels
- **Screen Reader Support**: Semantic HTML, ARIA live regions for dynamic updates
- **Touch Target Size**: Minimum 56px height for all interactive elements
- **Focus Indicators**: Visible focus outlines on all keyboard-navigable elements
- **Error Handling**: Clear error messages with recovery instructions

## 3.5 Visual Design & Branding

- **Color Palette**: Primary (football green), Secondary (energy orange), Neutral (grays)
- **Typography**: System font stack (SF Pro on iOS, Roboto on Android) for performance
- **Iconography**: Material Design icons (consistent, recognizable)
- **Photography**: Optional team logo and player photos (graceful fallbacks with initials avatars)
- **Spacing**: 8px grid system (Tailwind default spacing scale)

## 3.6 Responsive Design

- **Mobile-First**: Designed for 375px+ width (iPhone SE and larger)
- **Tablet Support**: Two-column layouts on 768px+ width (iPad)
- **Desktop Support**: Sidebar navigation on 1024px+ width (optional stretch goal)
- **PWA Installation**: Standalone mode with splash screen and app icon

---
