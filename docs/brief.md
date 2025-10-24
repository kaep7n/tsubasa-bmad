# Project Brief: Tsubasa

**Date:** 2025-10-24
**Version:** 1.0
**Author:** Business Analyst Mary

---

## Executive Summary

**Tsubasa** is a Progressive Web Application designed to help volunteer youth football trainers track player statistics, attendance, and game performance faster and more reliably than current Excel spreadsheet and handwritten note methods.

The primary problem is that youth football coaches waste valuable coaching time managing administrative tasks with fragmented, error-prone tools (Excel for attendance, paper for game stats), risking data loss and reducing focus on player development.

**Target market:** Volunteer youth football coaches managing teams of 15-20 players (ages 8-14) with 2-3 training sessions per week and weekend games.

**Key value proposition:** Sideline-optimized mobile interface that makes tracking stats faster than handwriting, with offline capability for remote fields, privacy-first data handling for youth players, and team-focused culture that celebrates all contributions (not just goals).

---

## Problem Statement

**Current State:**

Youth football coaches currently manage player data using fragmented, manual tools:
- **Attendance tracking**: Excel spreadsheets updated after each training session
- **Game statistics**: Handwritten notes on paper during matches, often lost or illegible
- **Player development**: Mental notes or scattered documents with no systematic tracking

This creates multiple pain points:
- **Time waste**: Coaches spend valuable sideline time writing notes instead of coaching
- **Data loss risk**: Paper notes get lost, wet, or damaged; no backup
- **Context switching friction**: Moving between Excel and paper breaks workflow
- **Limited insights**: No easy way to see trends, attendance patterns, or player development over time
- **Parent communication gap**: Difficult to share progress with parents without manual report creation

**Impact:**

- Coaches estimate spending **2-3 hours per week** on administrative tasks instead of coaching
- **30-40% of handwritten game notes** are lost or become illegible over a season
- Players miss recognition for defensive contributions because only goals/assists are easily tracked
- Volunteer coaches burn out from administrative burden, reducing retention

**Why Existing Solutions Fall Short:**

- **General note-taking apps** (Evernote, OneNote): Not optimized for sideline use; require too many taps; no offline reliability
- **Professional sports tracking apps** (Hudl, TeamSnap): Over-engineered for youth context; require subscriptions; include inappropriate features (public leaderboards); desktop-first design
- **Spreadsheets**: Too slow for real-time game tracking; no mobile optimization; no offline support

**Urgency:**

Youth sports participation is growing post-pandemic, but volunteer coach retention is declining due to administrative burden. Coaches need tools that **respect their time** and **make their volunteer work sustainable**, not more complex. The season structure (40+ training sessions, 20+ games per year) means small inefficiencies compound into hours of wasted time.

---

## Proposed Solution

**Core Concept:**

Tsubasa is a Progressive Web Application (PWA) that transforms youth football stat tracking from a fragmented, time-consuming chore into a fast, reliable sideline companion. Built specifically for volunteer coaches managing youth teams, it prioritizes **speed over features** and **simplicity over complexity**.

**Key Approach:**

1. **Mobile-first sideline UX**: Large touch targets, one-handed operation, smart sorting that learns coaching patterns - optimized for use while standing on the sideline watching the game

2. **Offline-first architecture**: Service workers enable full functionality without internet connection, automatically syncing when connectivity returns - essential for remote field locations

3. **Privacy-by-design**: Minimal data collection (first name + initials only), GDPR-compliant, no sensitive youth information stored

4. **Team-first culture**: No leaderboards or public rankings; celebrates all contributions (goals AND defensive plays); individual stats remain private for development purposes only

5. **Automation where helpful**: Recurring training templates, calendar import, smart player sorting - but always with manual override to protect tracked data

**Core Differentiators:**

- **Faster than handwriting**: Goal logging in 2-3 taps; attendance tracking in seconds; if it's not faster than paper, it fails
- **Respects volunteer time**: Minimal post-game admin (<30 seconds optional); screenshot reports instead of complex sharing infrastructure
- **Celebrates all positions**: Defensive highlight tracking gives defenders and goalkeepers equal visibility with scorers
- **Works everywhere**: Browser-based PWA means no app store friction; works on any device; install-to-homescreen feels native

**Why This Will Succeed:**

Unlike professional sports apps that add complexity, Tsubasa **removes friction**. It succeeds by:
- Solving the volunteer coach's actual workflow (not what professional teams need)
- Making the transition cost near-zero (faster than current method = immediate adoption)
- Building trust through privacy-first youth data handling
- Creating sustainable habits through daily attendance tracking, not just weekly games

**High-Level Vision:**

Version 1 delivers the core workflow: player management, training attendance, live game tracking, and basic statistics. Success unlocks Version 2 collaboration features (multi-coach teams, club management) and Version 3 AI-powered insights (pattern recognition, development recommendations) - but only after proving the foundational workflow actually saves coaches time.

---

## Target Users

### Primary User Segment: Volunteer Youth Football Coaches

**Demographics:**
- **Age**: 30-50 years old (typically parents of players)
- **Role**: Volunteer coaches for youth teams (U8-U14 age groups)
- **Team size**: Managing 15-20 players per team
- **Experience level**: Mixed - from first-time coaches to experienced multi-year volunteers
- **Technical comfort**: Moderate - comfortable with smartphones and basic apps, but not power users

**Current Behaviors & Workflows:**
- Conducts 2-3 training sessions per week (evenings/weekends)
- Manages 1-2 games per weekend during season
- Uses Excel for attendance tracking (updated at home after training)
- Uses handwritten notes during games for goal/assist tracking
- Communicates with parents via WhatsApp/messaging groups
- Juggling coaching with full-time job and family responsibilities

**Specific Needs & Pain Points:**
- **Time scarcity**: Every minute of admin is time away from coaching or family
- **Sideline usability**: Need to track stats while watching the game, not staring at phone
- **Data reliability**: Can't risk losing a season's worth of tracking data
- **Offline access**: Many fields have poor/no cell coverage
- **Simplicity**: No time to learn complex software or deal with technical issues
- **Parent communication**: Need easy way to share results without building reports

**Goals They're Trying to Achieve:**
- Spend more time coaching, less time on paperwork
- Make fair decisions about playing time based on attendance data
- Recognize all players (not just scorers) to build team culture
- Provide meaningful feedback to players and parents about development
- Manage volunteer responsibilities sustainably without burnout

---

### Secondary User Segment: Parents of Youth Players

**Note:** In Version 1, parents are **indirect users** (not app users themselves), but they benefit from the coach's improved workflow.

**Demographics:**
- Parents of children ages 8-14 playing youth football
- Want visibility into their child's participation and development
- Value transparency and fairness from coaches

**Current Behaviors:**
- Receive game updates via WhatsApp screenshots or verbal communication
- Attend games when possible but miss many due to work/siblings
- Interested in their child's progress but don't need detailed stats

**How They Benefit from Tsubasa (v1):**
- Receive screenshot reports after games (coach shares in team chat)
- More consistent attendance tracking means fairer playing time decisions
- Coach has more energy for actual coaching instead of admin
- All contributions (defense, goals) are recognized equally

**Future Consideration (v2):**
- Read-only access to their own child's stats
- Notification when game results are posted
- Ability to mark child as absent/excused directly

---

## Goals & Success Metrics

### Business Objectives

- **Achieve product-market fit within 6 months**: 50+ active coaches using the app for full season (20+ games tracked per coach)
- **Prove time savings**: Coaches report saving average 1.5+ hours per week vs. Excel/paper method
- **Demonstrate reliability**: 95%+ data sync success rate; zero reported data loss incidents
- **Validate offline capability**: 80%+ of games tracked include offline periods (proving field connectivity need)
- **Drive adoption through speed**: Average goal logging time <5 seconds from event to recorded

### User Success Metrics

- **Adoption velocity**: Coach tracks first game within 48 hours of signup
- **Habit formation**: Coach uses app for 80%+ of training sessions (attendance tracking)
- **Completion rates**: 90%+ of started games are completed and synced (not abandoned mid-game)
- **Engagement depth**: Average coach logs 15+ games and 30+ training sessions per season
- **Retention**: 70%+ of coaches who complete one season return for second season

### Key Performance Indicators (KPIs)

- **Time to first value**: Minutes from signup to first attendance tracked or game started - Target: <5 minutes
- **Stats per game**: Average number of events logged per game (goals, assists, opponent goals) - Target: 8+ events (indicates actual usage, not just starting/stopping timer)
- **Offline usage rate**: Percentage of sessions that include offline periods - Target: 60%+ (validates offline need)
- **Screenshot report generation**: Percentage of completed games where coach views report screen - Target: 70%+ (indicates sharing intent)
- **Weekly active users (WAU)**: Percentage of registered coaches who log activity in a given week - Target: 60%+ during season
- **Net Promoter Score (NPS)**: Coach likelihood to recommend to other coaches - Target: 40+ (indicating strong product-market fit)
- **Feature adoption - Training templates**: Percentage of coaches who create recurring training templates - Target: 80%+ (indicates moving beyond manual entry)

---

## MVP Scope

### Core Features (Must Have)

**1. Authentication & Team Setup**
- **Supabase authentication**: Simple email/password signup and login
- **One team per coach**: Each coach manages their own isolated team data
- **Row-level security**: Automatic data isolation between coaches
- *Rationale: Simplest possible auth model; proves value for single coach before adding collaboration complexity*

**2. Player Management**
- **Add/edit players**: First name + last name initials only (e.g., "Max R.")
- **Squad grouping**: Create squads/divisions (e.g., "First Team", "U12 Blue")
- **Multi-squad assignment**: Players can belong to multiple squads
- **Squad filtering**: Filter all views by selected squad
- *Rationale: Privacy-first minimal data; flexible squad system handles real-world complexity of players in multiple age groups*

**3. Training Session Management**
- **Recurring training templates**: Define schedule (days, time, duration, location)
- **Auto-generate sessions**: Create full season of training sessions from template
- **Multiple templates**: Support different schedules (e.g., Tuesday/Thursday practices)
- **Manual session creation**: Add one-off sessions outside templates
- **Session cancellation**: Mark cancelled with reason (bad weather, facility issue)
- **Quick attendance tracking**: Three-state system (Attended/Excused/Absent)
- **Attendance visualization**: Show as percentage and ratio (e.g., "17/20 - 85%")
- *Rationale: Templates prevent 40+ manual entries becoming adoption barrier; attendance is daily habit-forming touchpoint*

**4. Game Management**
- **Game list**: View past and upcoming games chronologically
- **Manual game creation**: Add games with date, opponent, location
- **Game cancellation**: Mark cancelled with reason
- **Calendar import**: Import from Google Calendar/iCal (optional)
- **One-way sync with refresh**: Manual refresh to detect rescheduled games
- **Protected completed games**: Calendar sync never overwrites games with tracked stats
- **Backfill capability**: Add historical games/training sessions with data
- *Rationale: Manual creation ensures always works; calendar import reduces friction for those who use it; protecting completed games prevents data loss disaster*

**5. Live Game Tracking**
- **Background-persistent timer**: Continues running when phone sleeps
- **Configurable periods**: Set period count and duration (e.g., 4x 15 minutes)
- **Pause/resume controls**: Handle stoppages, halftime, injuries
- **Manual time adjustment**: +/- controls to sync with official time
- **Period switching**: Manually advance or reset periods with confirmation
- **Live scoreboard**: Always-visible score, time, and period display
- **Quick goal logging**: Tap scorer, select multiple assists, auto-timestamp
- **Opponent goal tracking**: Simple "Opponent scored" button
- **Own goal marking**: Flag as own goal (no player blame)
- **Undo/edit functionality**: Fix mistakes with swipe or timed button
- **Smart player sorting**: Frequently selected players bubble to top
- **Large touch targets**: Optimized for one-handed sideline use
- *Rationale: This is the "faster than handwriting" test; must be bulletproof reliable and blazing fast or entire value prop fails*

**6. Post-Game Features**
- **Screenshot-optimized report**: Single-screen view with final score, scorers, times, stats
- **Mobile-friendly layout**: Readable text, good contrast, fits in one screenshot
- **Optional quick reflection**: Overall feeling + "What went well" + "To improve" (all optional, <30 seconds)
- *Rationale: Screenshot solves parent communication without building sharing infrastructure; optional reflection respects coach energy levels*

**7. Statistics & Dashboards**
- **Individual player dashboard**: Goals, assists, attendance %, games played
- **Team dashboard**: Collective stats (total goals, avg attendance, games played, win/loss)
- **No leaderboards**: Individual stats visible only to coach, not ranked publicly
- **Season context**: Display which season data belongs to
- *Rationale: Makes tracked data visible and valuable; team-first approach avoids unhealthy competition*

**8. Technical Infrastructure**
- **Progressive Web App (PWA)**: Browser-based, install-to-homescreen capability
- **Offline mode**: Service workers enable full functionality without internet
- **Automatic sync**: Queue changes, sync when connectivity returns
- **Angular frontend**: Component-based, TypeScript
- **Supabase backend**: Postgres database, realtime subscriptions, auth, RLS
- **Cloudflare Pages**: Deployment from GitHub, global CDN
- *Rationale: PWA removes app store friction; offline is non-negotiable for field use; tech stack proven and modern*

---

### Out of Scope for MVP

- Multi-coach collaboration (assistant coaches, shared access)
- Parent/player login or read-only views
- Tactical tags for goals (corner, counter-attack, etc.)
- Defensive highlight tracking (saves, tackles, interceptions)
- Custom tag creation
- Substitution and playing time tracking
- Position tracking
- Progress graphs and trend visualizations
- Export to PDF/Excel
- Shareable links for reports
- Push notifications
- Two-way calendar sync
- Club/association management
- Cross-team analytics

*Rationale: All valuable features, but not required to prove core value proposition of "faster than Excel + paper for solo coach"*

---

### MVP Success Criteria

The MVP is successful if:
1. **Speed test**: Coaches can log a goal in <5 seconds (faster than writing on paper)
2. **Reliability test**: Zero data loss incidents across 50+ coaches over 6 months
3. **Offline test**: App functions fully offline and syncs correctly when connection returns
4. **Adoption test**: 50+ coaches track full season (15+ games, 30+ trainings each)
5. **Satisfaction test**: NPS score 40+ and 70%+ say it saves them time vs. previous method
6. **Retention test**: 70%+ of season-completing coaches sign up for second season

If these criteria are met, proceed to Version 2 with collaboration features. If not, iterate on core workflow before expanding scope.

---

## Post-MVP Vision

### Phase 2 Features (Version 2 - 3-6 months after MVP launch)

**Collaboration & Multi-User Access:**
- Multiple coaches per team (head coach + assistants)
- Role-based permissions (admin, coach, assistant, viewer)
- Parent read-only access to their child's stats
- Real-time collaborative game tracking (assistant coach can log while head coach focuses on game)

**Organization Management:**
- Club/association admin role managing multiple teams
- Cross-team reporting and analytics
- Shared player pool (players participating across age groups)
- Club-wide statistics aggregation

**Enhanced Game Tracking:**
- Tactical context tags (corner, counter-attack, pressing, combination play, etc.)
- Custom tag creation for coach-specific terminology
- Defensive highlight tracking (saves, tackles, interceptions, recoveries)
- Player attribution for defensive plays (celebrate defenders equally)
- Substitution and playing time tracking
- Position tracking (post-game assignment)

**Advanced Analytics:**
- Progress graphs showing player improvement over time (goals per game, attendance trends)
- Tag-based tactical analysis ("Team scores 40% of goals from corners")
- Season-to-season comparison
- Position-specific metrics
- Milestone celebrations ("First 5 goals!")

**Data Portability:**
- Export to PDF/Excel for season reports
- Shareable links for game reports (replace screenshot workflow)
- Printable player certificates/season summaries

*Timing rationale: Only build collaboration after proving single-coach value; only build advanced analytics once enough data exists*

---

### Long-term Vision (12-24 months)

**AI-Powered Development Insights:**
Transform from data tracking tool to intelligent coaching assistant. AI analyzes patterns across seasons to suggest:
- Personalized training recommendations based on player development trajectories
- Tactical pattern recognition (identify team strengths/weaknesses automatically)
- Lineup optimization considering attendance, form, opponent style, fairness
- Early identification of players who might benefit from position changes

**Video Integration:**
- Link game video timestamps to tracked events (goals, defensive plays)
- AI-generated highlight reels from raw game footage
- Tactical annotation tools (draw on video, share with players)

**Community & Benchmarking:**
- Anonymous benchmarking against age-group averages (privacy-safe)
- Coach community: share successful drill libraries, training plans
- Development pathway tracking: long-term player progress across multiple seasons/clubs

**Youth-Appropriate Gamification:**
- Personal achievement badges visible only to player (no public competition)
- Team-based challenges encouraging collective goals
- Progress celebrations that motivate without unhealthy comparison

*Vision principle: Add intelligence that helps coaches develop players better, while maintaining youth-appropriate values (privacy, team-first, positive reinforcement)*

---

### Expansion Opportunities

**Geographic Expansion:**
- Multi-language support for international youth football communities
- Region-specific compliance (COPPA in US, GDPR in EU variations)
- Adaptation for different youth football structures (academy systems vs. recreational leagues)

**Sport Expansion:**
- Adapt to other youth team sports (basketball, hockey, handball, rugby)
- Core tracking mechanics apply universally; sport-specific stats configurable

**Business Model Evolution:**
- Free tier for individual coaches (current MVP model)
- Premium tier for clubs/associations ($5-10/month for multi-team management)
- Enterprise tier for large organizations (custom integrations, priority support)

**Strategic Partnerships:**
- Integration with youth league management systems
- Partnership with coaching education organizations
- Referee apps integration for official game data sync

*Expansion principle: Prove value in core market (volunteer football coaches) before expanding to adjacent markets or monetization*

---

## Technical Considerations

### Platform Requirements

- **Target Platforms:** Progressive Web App (PWA) accessible via modern web browsers
- **Browser/OS Support:**
  - **Mobile:** iOS Safari 14+, Chrome/Android 90+
  - **Desktop:** Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
  - **Install capability:** "Add to Home Screen" on mobile for app-like experience
- **Performance Requirements:**
  - Page load: <2 seconds on 3G connection
  - Goal logging action: <500ms response time
  - Offline mode: 100% feature parity with online mode
  - Sync latency: <5 seconds after connection restored
  - Local storage: Support 500+ games + 1000+ training sessions offline

---

### Technology Preferences

- **Frontend:** Angular 17+ with TypeScript
  - Component-based architecture for maintainability
  - Angular Material or custom component library for consistent UI
  - RxJS for reactive state management
  - Angular Service Worker for PWA capabilities

- **Backend:** Supabase (PostgreSQL + Realtime + Auth)
  - Postgres database with Row-Level Security (RLS) policies
  - Supabase Auth for user management (email/password initially)
  - Realtime subscriptions for potential future multi-user features
  - Supabase Storage for future file uploads (photos, exports)

- **Database:** PostgreSQL via Supabase
  - Relational structure: users → teams → players, games, training sessions
  - JSONB columns for flexible metadata (tags, custom fields)
  - Timestamptz for proper timezone handling
  - Indexes on frequently queried fields (team_id, date ranges)

- **Hosting/Infrastructure:**
  - Cloudflare Pages for frontend deployment
  - GitHub Actions for CI/CD pipeline
  - Automated deployment on push to main branch
  - Preview deployments for pull requests
  - Cloudflare CDN for global performance

---

### Architecture Considerations

**Repository Structure:**
```
tsubasa/
├── src/
│   ├── app/
│   │   ├── core/           # Singleton services, guards
│   │   ├── shared/         # Shared components, pipes, directives
│   │   ├── features/       # Feature modules
│   │   │   ├── auth/
│   │   │   ├── players/
│   │   │   ├── training/
│   │   │   ├── games/
│   │   │   ├── live-tracking/
│   │   │   └── stats/
│   │   └── models/         # TypeScript interfaces
│   └── environments/
├── docs/                   # Project documentation
└── supabase/              # Database migrations, RLS policies
```

**Service Architecture:**
- **Monolithic frontend**: Single Angular application (no micro-frontends for MVP)
- **Backend-as-a-Service**: Supabase handles all backend logic via API
- **Offline-first data layer**: Service Worker + IndexedDB for local persistence
- **Sync queue pattern**: Queue mutations during offline, replay on reconnection

**Integration Requirements:**
- **Calendar import**: iCal/ICS file parsing (use ical.js library)
- **Google Calendar API**: OAuth flow for calendar read access (optional feature)
- **Future integrations (v2+)**: Email notifications, SMS via Twilio, export to Google Sheets

**Security/Compliance:**
- **Authentication**: Supabase Auth with secure session management
- **Authorization**: Row-Level Security (RLS) policies enforce data isolation
  - Each coach sees only their team data
  - Policy: `team_id = auth.uid()` on all tables
- **Data privacy**: GDPR-compliant minimal data collection
  - No PII beyond first name + initials
  - Clear data retention policies
  - User can delete account and all data
- **HTTPS only**: Cloudflare enforces TLS 1.3
- **XSS protection**: Angular's built-in sanitization
- **CSRF protection**: Supabase JWT-based auth (no cookies)
- **Input validation**: Client-side + database constraints
- **Youth data protection**: No sensitive youth information stored (no birthdates, addresses, photos in v1)

---

## Constraints & Assumptions

### Constraints

**Budget:**
- **Development**: Solo developer or small team (1-2 developers)
- **Infrastructure**: Target <$50/month for MVP phase (Supabase free tier + Cloudflare Pages free tier)
- **Scaling budget**: Plan for <$200/month at 100 active coaches
- **No marketing budget**: Growth through word-of-mouth and coach networks initially

**Timeline:**
- **MVP target**: 15-16 weeks (4 months) to production-ready v1
- **Phase breakdown**:
  - Weeks 1-7: Core game tracking + offline infrastructure
  - Weeks 8-11: Attendance + training templates
  - Weeks 12-15: Statistics dashboards + polish
  - Week 16: Beta testing with real coaches
- **Constraint rationale**: Longer timeline risks missing season start (coaches onboard pre-season)

**Resources:**
- **Team size**: 1-2 developers maximum for MVP
- **Design resources**: Bootstrap with Material Design or similar; custom design in v2
- **Testing resources**: 5-10 volunteer coaches for beta testing
- **Time availability**: Assume part-time development (20-30 hours/week)

**Technical:**
- **Browser limitations**: No native mobile features (camera, push notifications on iOS, background location)
- **Offline storage limits**: ~50MB per domain in Safari (more generous in Chrome)
- **Service Worker constraints**: iOS Safari has limited PWA support vs. Android
- **Third-party dependencies**: Reliant on Supabase availability and pricing stability
- **Mobile keyboard**: Input UX constrained by mobile keyboard behavior (can't customize)

---

### Key Assumptions

**Market & User Assumptions:**
- Youth football coaches are frustrated enough with Excel/paper to try new solution
- Volunteer coaches have smartphones and basic technical comfort
- Coaches will trust browser-based app with season data (no "real app" perception barrier)
- Speed improvement over current method is sufficient motivation (no need for incentives)
- Coach-to-coach word-of-mouth is viable growth channel in tight-knit youth sports community

**Usage Pattern Assumptions:**
- Typical season: 40 training sessions, 20 games over 6-8 months
- Team size: 15-20 players average
- Training sessions: 2-3 per week, 60-90 minutes each
- Games: 1-2 per weekend, 60 minutes average
- Coaches will use app consistently throughout season (not just occasional games)

**Technical Assumptions:**
- Modern smartphone browsers (2020+) have sufficient PWA support
- IndexedDB storage is reliable for offline data persistence
- Service Workers work consistently across target browsers
- Supabase free tier (500MB database, 50k monthly active users) sufficient for MVP
- Cloudflare Pages free tier (unlimited requests, 500 builds/month) sufficient for MVP
- Network connectivity returns within reasonable time (hours, not days) for sync to work

**Business Assumptions:**
- Free product can acquire 50+ coaches in 6 months through organic growth
- Product-market fit proven at 50 coaches before monetization needed
- Coaches will tolerate occasional bugs/issues in exchange for free tool (MVP grace period)
- Data privacy approach (minimal PII) satisfies regulatory requirements without legal review
- Single developer can maintain production app for 50-100 users

**Competitive Assumptions:**
- Existing professional sports apps won't pivot to youth/volunteer market (not profitable enough)
- General note-taking apps won't optimize for sideline stat tracking (too niche)
- Other youth sports apps overcharge or over-engineer (opportunity for simple/free alternative)
- Coaches prefer specialized tool over general-purpose spreadsheet despite learning curve

**Development Assumptions:**
- Angular + Supabase stack is productive (don't need custom backend)
- Offline-first architecture is achievable within timeline (Service Workers well-documented)
- No major browser API changes during development period
- GitHub + Cloudflare Pages CI/CD is reliable
- Supabase RLS policies provide sufficient security without custom auth logic

---

## Risks & Open Questions

### Key Risks

**1. Adoption Risk - "Nobody switches from Excel"**
- **Description**: Coaches stick with familiar Excel/paper despite inefficiencies due to switching costs or habit inertia
- **Impact**: High - if coaches don't adopt, product fails regardless of technical quality
- **Mitigation**:
  - Prove speed advantage in first 5 minutes of use (faster than handwriting test)
  - Provide Excel import for historical data (reduce switching cost)
  - Target pre-season period when coaches naturally evaluate tools
  - Recruit 5-10 beta coaches for testimonials and feedback

**2. Offline Sync Reliability Risk - "Data loss destroys trust"**
- **Description**: Bugs in offline sync cause data loss or corruption; coach loses season of tracking
- **Impact**: Critical - single data loss incident destroys reputation and trust
- **Mitigation**:
  - Extensive offline testing with simulated network failures
  - Local backup/export capability (download data as JSON)
  - Optimistic UI with clear sync status indicators
  - Conservative sync strategy (prefer duplicate data over lost data)
  - Automated daily backups on Supabase side

**3. Mobile Safari PWA Limitations Risk**
- **Description**: iOS Safari has weaker PWA support (storage limits, no push notifications, home screen icon limitations)
- **Impact**: Medium - could force native iOS app development (expensive, scope creep)
- **Mitigation**:
  - Design within Safari constraints from day one
  - Test extensively on real iPhones, not just simulators
  - Educate users on "Add to Home Screen" for better experience
  - Monitor Apple's PWA roadmap for improvements
  - Accept some features won't work on iOS (document limitations)

**4. User Error Risk - "Coaches make mistakes during games"**
- **Description**: Fast-paced game environment leads to logging errors (wrong player, wrong time, etc.)
- **Impact**: Medium - errors reduce data quality and coach confidence
- **Mitigation**:
  - Robust undo/edit functionality (swipe to undo, timed undo button)
  - Post-game review/edit mode for corrections
  - Large touch targets to reduce mis-taps
  - Confirmation prompts for destructive actions (reset period, delete game)

**5. Privacy/Compliance Risk - "GDPR/COPPA violation"**
- **Description**: Youth data handling doesn't meet regulatory requirements; legal issues or fines
- **Impact**: High - could force shutdown or expensive legal remediation
- **Mitigation**:
  - Minimize data collection (first name + initials only)
  - No sensitive youth data (birthdates, addresses, photos)
  - Clear privacy policy and terms of service
  - User data deletion capability
  - Consider legal review before public launch ($500-1000 investment)

**6. Supabase Dependency Risk - "Third-party service issues"**
- **Description**: Supabase pricing changes, service outages, or product discontinuation
- **Impact**: Medium-High - could require expensive migration or service interruption
- **Mitigation**:
  - Use open-source components where possible (Postgres, PostgREST)
  - Design database schema to be portable
  - Export capability allows migration if needed
  - Monitor Supabase status and roadmap
  - Have backup plan (self-hosted Supabase or alternative BaaS)

**7. Volunteer Coach Burnout Risk - "Target users leave coaching"**
- **Description**: Volunteer coach retention declines; market shrinks or churns constantly
- **Impact**: Medium - limits growth and increases acquisition difficulty
- **Mitigation**:
  - Product explicitly addresses burnout (saves time, reduces admin burden)
  - Focus on retention (returning coaches more valuable than new ones)
  - Build features that make coaching more sustainable (training templates, quick workflows)

**8. Feature Creep Risk - "MVP becomes bloated"**
- **Description**: Pressure to add features delays launch or complicates core workflow
- **Impact**: Medium - delays time-to-market and increases development cost
- **Mitigation**:
  - Ruthlessly prioritize MVP scope (already defined)
  - Create "v2 parking lot" for good ideas that aren't MVP critical
  - Measure success against speed/simplicity metrics, not feature count
  - User testing focuses on "is it faster?" not "what's missing?"

---

### Open Questions

**Product & Market:**
- How do coaches currently handle multi-season data? Archive old seasons or keep everything accessible?
- What percentage of youth coaches use smartphones during games? (Assumption: 80%+, but needs validation)
- Are coaches willing to pay for premium features, or must it remain free forever?
- Do coaches prefer dark mode for night games/indoor facilities?
- How important is team branding (logo, colors) in the app?

**Technical:**
- What's the optimal data model for multi-season support? (Soft delete old seasons? Separate tables? Archive to cold storage?)
- How large can IndexedDB storage realistically grow before performance degrades on older phones?
- Should we use Angular Signals (new reactive primitive) or stick with RxJS? (Angular 17+ decision)
- What's the offline conflict resolution strategy if coach tracks same game on two devices offline?
- Do we need real-time sync via Supabase Realtime subscriptions, or is periodic polling sufficient?

**User Experience:**
- What's the ideal onboarding flow? (Skip tutorial and let coaches explore? Guided 5-minute tour? Video walkthrough?)
- Should player photos be optional in MVP, or defer to v2 entirely?
- How many squads do coaches typically manage simultaneously? (Affects UI complexity)
- What's the maximum number of assists to support per goal? (2? 3? Unlimited?)
- Should game timer default to running clock or stopped clock? (Different leagues have different rules)

**Business & Growth:**
- What's the most effective distribution channel? (Facebook groups? League websites? Coach education programs?)
- Should we target recreational leagues first, or competitive/academy programs?
- Is there a seasonal acquisition pattern? (All signups pre-season, or continuous throughout year?)
- Would youth league organizations pay for bulk licenses? (B2B opportunity)
- Do we need formal partnerships with football associations, or just grassroots growth?

**Compliance & Legal:**
- Does collecting first name + initials require parental consent under COPPA? (US-specific)
- Are there country-specific youth data regulations beyond GDPR we need to consider?
- Should we have terms of service reviewed by lawyer before public launch?
- What data retention policy is appropriate? (Delete after X years of inactivity?)
- Do we need liability waivers for coaches using app during games?

---

### Areas Needing Further Research

**Competitive Analysis:**
- Deep dive on existing youth sports apps (TeamSnap, SportsEngine, LeagueApps)
- What do they do well? What are gaps? Why haven't they captured volunteer coach market?
- What's their pricing? (Helps validate free tier strategy)

**Technical Feasibility:**
- Build prototype of offline sync with Service Workers (highest technical risk)
- Test IndexedDB performance with realistic data volumes (500+ games)
- Validate calendar import from Google Calendar (OAuth flow complexity)

**User Research:**
- Interview 10-15 youth football coaches about current workflow
- Observe coaches during actual games (what are pain points in real time?)
- Test paper prototype of game tracking UI with coaches

**Market Sizing:**
- How many youth football teams exist in target markets? (Germany? UK? US?)
- What percentage are volunteer-coached vs. paid staff?
- What's realistic market penetration? (1% of teams? 5%?)

**Regulatory Research:**
- GDPR compliance checklist for youth data
- COPPA requirements (US market)
- Data protection laws in target countries (Germany: BDSG, UK: DPA 2018)

---

## Appendices

### A. Research Summary

**Brainstorming Session Results** (October 24, 2025)

A comprehensive 90-minute brainstorming session was conducted using Role Playing and "Yes, And..." Building techniques to generate ideas from the youth football trainer perspective. Key outputs:

- **150+ ideas generated** across all aspects of the application
- **40 MVP features identified** through convergent prioritization
- **Key insights discovered**:
  - Speed as the only metric that matters for adoption
  - Youth context fundamentally changes design (privacy-first, team-first, positive reinforcement)
  - Offline capability is non-negotiable for remote field locations
  - Simplicity is harder than complexity (resist feature creep)
  - Post-game coach energy is near zero (minimize admin burden)
  - Defensive players need equal visibility to prevent scorer-centric culture

**Session documented in:** `docs/brainstorming-session-results.md`

**Key themes identified:**
1. **Speed as killer feature** - Must be faster than Excel + handwriting to drive adoption
2. **Youth-appropriate design** - Privacy-first, team-focused (no leaderboards), positive reinforcement
3. **Mobile-first sideline UX** - Large touch targets, one-handed use, minimal taps
4. **Offline capability essential** - Remote fields often lack connectivity
5. **Simplicity over complexity** - Minimal post-game admin, optional features, focus on core workflow

**Notable connections:**
- Attendance + lineup decisions: Seeing attendance ratios when planning who plays creates fairness
- Squad filtering + multi-squad players: Handles real-world complexity where kids play up/down age groups
- Timer persistence + PWA: Service workers solve the "phone sleeps during game" problem perfectly
- Defensive tracking + team culture: Celebrating defenders equally prevents scorer-centric culture
- Post-game minimal input + screenshot sharing: Respects coach energy while enabling parent communication
- Calendar import + protected completed games: Automation where helpful, but never risks tracked data

---

### B. Stakeholder Input

**Primary Stakeholder:** Youth football trainer (volunteer coach)

**Input gathered during brainstorming:**
- Current workflow pain: Excel for attendance (updated at home), handwritten notes during games
- Critical requirement: Must be faster than handwriting or it won't be adopted
- Offline necessity: Many fields have poor/no connectivity
- Privacy concern: Minimal youth data collection essential
- Cultural requirement: Team-first approach, no public leaderboards
- Time constraint: Post-game admin must be optional and <30 seconds

**Key quote (paraphrased):** "If it's quicker to track attendance and game stats than my current Excel + handwriting method, I would instantly switch."

**Future stakeholders to consider:**
- Parents (v2): Want visibility into child's participation and development
- Players (v2): May benefit from seeing own progress in youth-appropriate way
- Club administrators (v2): Need cross-team reporting and management
- League organizers (v3): Potential integration with league management systems

---

### C. References

**Technical Documentation:**
- [Angular Documentation](https://angular.dev) - Frontend framework
- [Supabase Documentation](https://supabase.com/docs) - Backend-as-a-Service
- [Service Workers API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API) - Offline capability
- [IndexedDB API](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API) - Client-side storage
- [PWA Best Practices](https://web.dev/progressive-web-apps/) - Progressive Web App patterns

**Compliance & Privacy:**
- [GDPR Official Text](https://gdpr-info.eu/) - EU data protection regulation
- [COPPA Rule](https://www.ftc.gov/legal-library/browse/rules/childrens-online-privacy-protection-rule-coppa) - US children's privacy law
- [ICO Guide to GDPR](https://ico.org.uk/for-organisations/guide-to-data-protection/guide-to-the-general-data-protection-regulation-gdpr/) - UK implementation guidance

**Inspiration & Competitive Context:**
- TeamSnap - Team management platform (over-engineered for volunteers, subscription model)
- SportsEngine - League management system (desktop-first, club-focused)
- Hudl - Video analysis platform (professional/academy focus, expensive)

**Project Documentation:**
- Brainstorming Session Results: `docs/brainstorming-session-results.md`
- Project Brief (this document): `docs/brief.md`

---

## Next Steps

### Immediate Actions

1. **Validate assumptions with real coaches** (Week 1)
   - Interview 5-10 volunteer youth football coaches
   - Observe coaches during training/games to understand actual workflow
   - Validate pain points: Is Excel + paper really the problem? How much time does it cost?
   - Test paper prototype of game tracking UI
   - Confirm: Would they switch if it's faster?

2. **Set up technical infrastructure** (Week 1-2)
   - Create GitHub repository and project structure
   - Set up Supabase project (free tier)
   - Configure Cloudflare Pages deployment
   - Initialize Angular 17+ project with TypeScript
   - Set up CI/CD pipeline (GitHub Actions → Cloudflare Pages)
   - Configure development, staging, production environments

3. **Build offline sync prototype** (Week 2-3)
   - Highest technical risk - prove it works before committing to full build
   - Implement Service Worker with IndexedDB
   - Test offline data persistence and sync queue
   - Simulate network failures and recovery
   - Validate performance with realistic data volumes
   - Document patterns for team to follow

4. **Design core user flows** (Week 2-3)
   - Wireframe key screens: game tracking, attendance, player list, stats dashboard
   - Focus on mobile-first, thumb-friendly layouts
   - Design large touch targets and one-handed operation
   - Create clickable prototype in Figma or similar
   - Test with 3-5 coaches for feedback
   - Iterate based on "is this faster than paper?" test

5. **Define database schema** (Week 3-4)
   - Design Postgres tables: users, teams, players, squads, games, training_sessions, goals, events
   - Plan Row-Level Security (RLS) policies for data isolation
   - Consider multi-season data model
   - Document migration strategy
   - Set up initial Supabase migration files
   - Test RLS policies with sample data

6. **Competitive analysis deep-dive** (Week 4)
   - Sign up for TeamSnap, SportsEngine, other youth sports apps
   - Document: What do they do well? What are gaps? Pricing models?
   - Identify positioning: How is Tsubasa different/better?
   - Look for features to avoid (complexity traps)
   - Validate free tier strategy

7. **Begin MVP development** (Week 5+)
   - Follow 15-week development timeline from brainstorming session
   - Weeks 5-11: Core game tracking + offline + attendance + training templates
   - Weeks 12-15: Statistics dashboards + polish
   - Week 16: Beta testing with recruited coaches
   - Weekly progress reviews against "faster than paper" success criteria

8. **Recruit beta testers** (Week 4-6)
   - Identify 5-10 volunteer coaches willing to test during season
   - Mix of technical comfort levels (not just early adopters)
   - Coaches with active teams and upcoming games
   - Establish feedback loop (weekly check-ins)
   - Offer early access in exchange for honest feedback

9. **Legal/compliance review** (Week 8-10, parallel with dev)
   - Draft privacy policy and terms of service
   - Consider legal review for GDPR/COPPA compliance ($500-1000)
   - Document data retention and deletion policies
   - Prepare consent flows if required
   - Set up data protection impact assessment (DPIA)

10. **Plan launch strategy** (Week 12-14)
    - Target pre-season period (coaches evaluate tools before season starts)
    - Identify distribution channels: Facebook coach groups, league websites, coaching forums
    - Prepare launch materials: demo video, screenshots, one-pager
    - Build email list from beta testers and interested coaches
    - Plan soft launch → public launch progression

---

### PM Handoff

This Project Brief provides the full context for **Tsubasa - Youth Football Statistics Tracker**.

**For Product Manager or Technical Lead:**

The brief documents:
- **Problem validated through brainstorming**: Volunteer coaches waste 2-3 hours/week on Excel + handwritten stats
- **Solution validated through user input**: Mobile-first PWA that's faster than paper
- **MVP scope ruthlessly prioritized**: 40 must-have features, everything else deferred to v2
- **Success criteria defined**: Speed, reliability, adoption, retention metrics
- **Technical approach justified**: Angular + Supabase + Cloudflare Pages PWA with offline-first architecture
- **Risks identified with mitigations**: Adoption, data loss, privacy, dependency, feature creep
- **Timeline established**: 15 weeks to production-ready MVP

**Next phase:** Create detailed Product Requirements Document (PRD) that translates this brief into:
- User stories with acceptance criteria
- Detailed wireframes and mockups
- API specifications and data models
- Test plans and quality criteria
- Sprint planning and milestone definitions

**Key principles to maintain:**
1. **Speed over features** - If it's not faster than paper, it fails
2. **Simplicity over complexity** - Resist feature creep
3. **Privacy-first** - Minimal youth data collection
4. **Team-first culture** - No leaderboards or rankings
5. **Offline-first** - Must work on remote fields without connectivity

**Questions for PRD phase:**
- Detailed user flows for each feature (step-by-step interactions)
- Error handling and edge cases
- Accessibility requirements (WCAG compliance level)
- Analytics and instrumentation strategy
- Beta testing plan and success criteria

---

**Start in PRD Generation Mode**: Review this brief thoroughly and work with the team to create the PRD section by section, asking for any necessary clarification or suggesting improvements based on technical feasibility and user experience best practices.

---

*Project Brief created using the BMAD-METHOD™ strategic analysis framework*
