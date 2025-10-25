# 12. Unified Project Structure

## 12.1 High-Level Overview

```plaintext
tsubasa/
├── .github/workflows/       # CI/CD
├── src/                     # Angular application
│   ├── app/
│   │   ├── core/           # Services, guards
│   │   ├── shared/         # Reusable components
│   │   └── features/       # Feature modules
│   ├── assets/             # PWA icons, manifest
│   ├── environments/       # Config per environment
│   └── styles/             # Global styles
├── supabase/               # Database migrations
│   └── migrations/
├── tests/                  # E2E tests
├── docs/                   # Documentation
└── package.json
```

## 12.2 Complete Source Tree Structure

This is the **DEFINITIVE** directory structure for the Tsubasa project. All code must be organized according to this structure.

```
tsubasa/
├── .github/
│   └── workflows/
│       ├── ci.yml                          # CI pipeline (lint, test, build)
│       └── deploy.yml                      # CD to Cloudflare Pages
│
├── .vscode/
│   ├── extensions.json                     # Recommended VS Code extensions
│   ├── settings.json                       # Workspace settings
│   └── launch.json                         # Debug configurations
│
├── .bmad-core/                             # BMAD framework (if using)
│   ├── core-config.yaml
│   ├── tasks/
│   ├── templates/
│   └── checklists/
│
├── docs/
│   ├── architecture.md                     # This document
│   ├── prd.md                              # Product requirements
│   ├── stories/                            # User stories
│   └── api/
│       └── supabase-schema.md              # Database schema reference
│
├── supabase/
│   ├── config.toml                         # Supabase project config
│   ├── .gitignore
│   ├── migrations/
│   │   ├── 20250101000001_init_schema.sql
│   │   ├── 20250101000002_teams_players.sql
│   │   ├── 20250101000003_games_goals.sql
│   │   ├── 20250101000004_training_sessions.sql
│   │   ├── 20250101000005_rls_policies.sql
│   │   └── 20250101000006_indexes.sql
│   ├── functions/
│   │   ├── get-player-stats/
│   │   │   └── index.ts                    # RPC: Player stats aggregation
│   │   ├── get-team-stats/
│   │   │   └── index.ts                    # RPC: Team stats aggregation
│   │   └── bulk-update-attendance/
│   │       └── index.ts                    # RPC: Bulk attendance operations
│   └── seed.sql                            # Test data for local development
│
├── src/
│   ├── app/
│   │   ├── app.component.ts                # Root component
│   │   ├── app.component.html
│   │   ├── app.component.scss
│   │   ├── app.config.ts                   # Application configuration (providers)
│   │   ├── app.routes.ts                   # Root route definitions
│   │   │
│   │   ├── core/                           # Singleton services, guards, interceptors
│   │   │   ├── auth/
│   │   │   │   ├── auth.service.ts         # Supabase auth wrapper
│   │   │   │   ├── auth.guard.ts           # Route protection
│   │   │   │   └── auth.interceptor.ts     # JWT injection
│   │   │   ├── sync/
│   │   │   │   ├── sync-queue.service.ts   # Offline operation queue
│   │   │   │   ├── sync-manager.service.ts # Background sync orchestrator
│   │   │   │   └── conflict-resolver.service.ts # Conflict resolution
│   │   │   ├── storage/
│   │   │   │   ├── indexed-db.service.ts   # Dexie.js wrapper
│   │   │   │   └── db-schema.ts            # IndexedDB schema definition
│   │   │   ├── network/
│   │   │   │   ├── network-status.service.ts   # Online/offline detection
│   │   │   │   └── network.interceptor.ts      # Queue offline requests
│   │   │   └── supabase/
│   │   │       └── supabase.service.ts     # Supabase client wrapper
│   │   │
│   │   ├── shared/                         # Reusable components, pipes, directives
│   │   │   ├── components/
│   │   │   │   ├── header/
│   │   │   │   │   ├── header.component.ts
│   │   │   │   │   ├── header.component.html
│   │   │   │   │   └── header.component.scss
│   │   │   │   ├── bottom-nav/
│   │   │   │   │   ├── bottom-nav.component.ts
│   │   │   │   │   ├── bottom-nav.component.html
│   │   │   │   │   └── bottom-nav.component.scss
│   │   │   │   ├── player-avatar/
│   │   │   │   │   ├── player-avatar.component.ts
│   │   │   │   │   ├── player-avatar.component.html
│   │   │   │   │   └── player-avatar.component.scss
│   │   │   │   ├── loading-spinner/
│   │   │   │   │   ├── loading-spinner.component.ts
│   │   │   │   │   └── loading-spinner.component.html
│   │   │   │   ├── empty-state/
│   │   │   │   │   ├── empty-state.component.ts
│   │   │   │   │   └── empty-state.component.html
│   │   │   │   └── confirmation-dialog/
│   │   │   │       ├── confirmation-dialog.component.ts
│   │   │   │       └── confirmation-dialog.component.html
│   │   │   ├── pipes/
│   │   │   │   ├── time-format.pipe.ts     # Format game time (seconds → "45'")
│   │   │   │   ├── player-name.pipe.ts     # Format player display name
│   │   │   │   └── date-format.pipe.ts     # Localized date formatting
│   │   │   └── directives/
│   │   │       ├── long-press.directive.ts # Touch gesture for mobile
│   │   │       └── swipe-action.directive.ts # Swipe to delete/edit
│   │   │
│   │   ├── features/                       # Feature modules (lazy-loaded)
│   │   │   │
│   │   │   ├── auth/
│   │   │   │   ├── pages/
│   │   │   │   │   ├── login/
│   │   │   │   │   │   ├── login.component.ts
│   │   │   │   │   │   ├── login.component.html
│   │   │   │   │   │   └── login.component.scss
│   │   │   │   │   ├── register/
│   │   │   │   │   │   ├── register.component.ts
│   │   │   │   │   │   ├── register.component.html
│   │   │   │   │   │   └── register.component.scss
│   │   │   │   │   ├── team-setup/
│   │   │   │   │   │   ├── team-setup.component.ts
│   │   │   │   │   │   ├── team-setup.component.html
│   │   │   │   │   │   └── team-setup.component.scss
│   │   │   │   │   └── password-reset/
│   │   │   │   │       ├── password-reset.component.ts
│   │   │   │   │       └── password-reset.component.html
│   │   │   │   └── auth.routes.ts
│   │   │   │
│   │   │   ├── dashboard/
│   │   │   │   ├── pages/
│   │   │   │   │   └── home/
│   │   │   │   │       ├── home.component.ts
│   │   │   │   │       ├── home.component.html
│   │   │   │   │       └── home.component.scss
│   │   │   │   ├── components/
│   │   │   │   │   ├── quick-stats-card/
│   │   │   │   │   │   ├── quick-stats-card.component.ts
│   │   │   │   │   │   ├── quick-stats-card.component.html
│   │   │   │   │   │   └── quick-stats-card.component.scss
│   │   │   │   │   ├── upcoming-games-widget/
│   │   │   │   │   │   ├── upcoming-games-widget.component.ts
│   │   │   │   │   │   ├── upcoming-games-widget.component.html
│   │   │   │   │   │   └── upcoming-games-widget.component.scss
│   │   │   │   │   └── recent-training-widget/
│   │   │   │   │       └── recent-training-widget.component.ts
│   │   │   │   └── dashboard.routes.ts
│   │   │   │
│   │   │   ├── players/
│   │   │   │   ├── pages/
│   │   │   │   │   ├── player-list/
│   │   │   │   │   │   ├── player-list.component.ts
│   │   │   │   │   │   ├── player-list.component.html
│   │   │   │   │   │   └── player-list.component.scss
│   │   │   │   │   ├── player-detail/
│   │   │   │   │   │   ├── player-detail.component.ts
│   │   │   │   │   │   ├── player-detail.component.html
│   │   │   │   │   │   └── player-detail.component.scss
│   │   │   │   │   └── player-form/
│   │   │   │   │       ├── player-form.component.ts
│   │   │   │   │       ├── player-form.component.html
│   │   │   │   │       └── player-form.component.scss
│   │   │   │   ├── components/
│   │   │   │   │   ├── player-card/
│   │   │   │   │   │   ├── player-card.component.ts
│   │   │   │   │   │   ├── player-card.component.html
│   │   │   │   │   │   └── player-card.component.scss
│   │   │   │   │   └── squad-selector/
│   │   │   │   │       ├── squad-selector.component.ts
│   │   │   │   │       └── squad-selector.component.html
│   │   │   │   ├── services/
│   │   │   │   │   └── player.service.ts
│   │   │   │   └── players.routes.ts
│   │   │   │
│   │   │   ├── games/
│   │   │   │   ├── pages/
│   │   │   │   │   ├── game-list/
│   │   │   │   │   │   ├── game-list.component.ts
│   │   │   │   │   │   ├── game-list.component.html
│   │   │   │   │   │   └── game-list.component.scss
│   │   │   │   │   ├── game-form/
│   │   │   │   │   │   ├── game-form.component.ts
│   │   │   │   │   │   ├── game-form.component.html
│   │   │   │   │   │   └── game-form.component.scss
│   │   │   │   │   ├── game-detail/
│   │   │   │   │   │   ├── game-detail.component.ts
│   │   │   │   │   │   ├── game-detail.component.html
│   │   │   │   │   │   └── game-detail.component.scss
│   │   │   │   │   └── live-game/
│   │   │   │   │       ├── live-game.component.ts     # Live game tracking UI
│   │   │   │   │       ├── live-game.component.html
│   │   │   │   │       └── live-game.component.scss
│   │   │   │   ├── components/
│   │   │   │   │   ├── game-card/
│   │   │   │   │   │   ├── game-card.component.ts
│   │   │   │   │   │   ├── game-card.component.html
│   │   │   │   │   │   └── game-card.component.scss
│   │   │   │   │   ├── live-scoreboard/
│   │   │   │   │   │   ├── live-scoreboard.component.ts    # Sticky header with live score
│   │   │   │   │   │   ├── live-scoreboard.component.html
│   │   │   │   │   │   └── live-scoreboard.component.scss
│   │   │   │   │   ├── goal-logger/
│   │   │   │   │   │   ├── goal-logger.component.ts        # <5 second goal logging
│   │   │   │   │   │   ├── goal-logger.component.html
│   │   │   │   │   │   └── goal-logger.component.scss
│   │   │   │   │   ├── game-timeline/
│   │   │   │   │   │   ├── game-timeline.component.ts      # Event history
│   │   │   │   │   │   ├── game-timeline.component.html
│   │   │   │   │   │   └── game-timeline.component.scss
│   │   │   │   │   ├── game-timer/
│   │   │   │   │   │   ├── game-timer.component.ts         # Web Worker timer display
│   │   │   │   │   │   ├── game-timer.component.html
│   │   │   │   │   │   └── game-timer.component.scss
│   │   │   │   │   └── calendar-import/
│   │   │   │   │       ├── calendar-import.component.ts     # iCal + Google Calendar
│   │   │   │   │       └── calendar-import.component.html
│   │   │   │   ├── services/
│   │   │   │   │   ├── game.service.ts
│   │   │   │   │   ├── goal.service.ts
│   │   │   │   │   ├── game-timer.service.ts               # Web Worker manager
│   │   │   │   │   └── calendar-import.service.ts          # Calendar integration
│   │   │   │   └── games.routes.ts
│   │   │   │
│   │   │   ├── training/
│   │   │   │   ├── pages/
│   │   │   │   │   ├── training-list/
│   │   │   │   │   │   ├── training-list.component.ts
│   │   │   │   │   │   ├── training-list.component.html
│   │   │   │   │   │   └── training-list.component.scss
│   │   │   │   │   ├── training-detail/
│   │   │   │   │   │   ├── training-detail.component.ts
│   │   │   │   │   │   ├── training-detail.component.html
│   │   │   │   │   │   └── training-detail.component.scss
│   │   │   │   │   └── training-form/
│   │   │   │   │       ├── training-form.component.ts
│   │   │   │   │       ├── training-form.component.html
│   │   │   │   │       └── training-form.component.scss
│   │   │   │   ├── components/
│   │   │   │   │   ├── training-card/
│   │   │   │   │   │   ├── training-card.component.ts
│   │   │   │   │   │   ├── training-card.component.html
│   │   │   │   │   │   └── training-card.component.scss
│   │   │   │   │   ├── attendance-tracker/
│   │   │   │   │   │   ├── attendance-tracker.component.ts  # 3-state attendance
│   │   │   │   │   │   ├── attendance-tracker.component.html
│   │   │   │   │   │   └── attendance-tracker.component.scss
│   │   │   │   │   └── template-selector/
│   │   │   │   │       ├── template-selector.component.ts
│   │   │   │   │       └── template-selector.component.html
│   │   │   │   ├── services/
│   │   │   │   │   ├── training.service.ts
│   │   │   │   │   └── attendance.service.ts
│   │   │   │   └── training.routes.ts
│   │   │   │
│   │   │   └── statistics/
│   │   │       ├── pages/
│   │   │       │   ├── stats-dashboard/
│   │   │       │   │   ├── stats-dashboard.component.ts
│   │   │       │   │   ├── stats-dashboard.component.html
│   │   │       │   │   └── stats-dashboard.component.scss
│   │   │       │   ├── player-stats/
│   │   │       │   │   ├── player-stats.component.ts
│   │   │       │   │   ├── player-stats.component.html
│   │   │       │   │   └── player-stats.component.scss
│   │   │       │   └── post-game-report/
│   │   │       │       ├── post-game-report.component.ts
│   │   │       │       ├── post-game-report.component.html
│   │   │       │       └── post-game-report.component.scss
│   │   │       ├── components/
│   │   │       │   ├── stat-card/
│   │   │       │   │   ├── stat-card.component.ts
│   │   │       │   │   ├── stat-card.component.html
│   │   │       │   │   └── stat-card.component.scss
│   │   │       │   └── chart-wrapper/
│   │   │       │       ├── chart-wrapper.component.ts
│   │   │       │       └── chart-wrapper.component.html
│   │   │       ├── services/
│   │   │       │   └── statistics.service.ts
│   │   │       └── statistics.routes.ts
│   │   │
│   │   └── models/                         # TypeScript interfaces + types
│   │       ├── player.model.ts
│   │       ├── game.model.ts
│   │       ├── goal.model.ts
│   │       ├── training.model.ts
│   │       ├── attendance.model.ts
│   │       ├── squad.model.ts
│   │       ├── team.model.ts
│   │       ├── sync-operation.model.ts
│   │       └── supabase.types.ts           # Auto-generated from Supabase CLI
│   │
│   ├── assets/
│   │   ├── icons/
│   │   │   ├── icon-72x72.png              # PWA icons (multiple sizes)
│   │   │   ├── icon-96x96.png
│   │   │   ├── icon-128x128.png
│   │   │   ├── icon-144x144.png
│   │   │   ├── icon-152x152.png
│   │   │   ├── icon-192x192.png
│   │   │   ├── icon-384x384.png
│   │   │   └── icon-512x512.png
│   │   ├── images/
│   │   │   ├── logo.svg
│   │   │   ├── logo-white.svg
│   │   │   └── placeholder-avatar.svg
│   │   └── i18n/                           # (Future) Internationalization
│   │       └── en.json
│   │
│   ├── environments/
│   │   ├── environment.ts                  # Development config
│   │   ├── environment.staging.ts          # Staging config
│   │   └── environment.prod.ts             # Production config
│   │
│   ├── styles/
│   │   ├── _variables.scss                 # SCSS variables (colors, spacing)
│   │   ├── _mixins.scss                    # SCSS mixins
│   │   ├── _typography.scss                # Font definitions
│   │   ├── _material-overrides.scss        # Angular Material theme overrides
│   │   └── styles.scss                     # Global styles + Tailwind imports
│   │
│   ├── workers/
│   │   └── game-timer.worker.ts            # Web Worker for background game timer
│   │
│   ├── index.html                          # HTML entry point
│   ├── main.ts                             # Angular bootstrap
│   ├── manifest.webmanifest                # PWA manifest
│   ├── ngsw-config.json                    # Service Worker config
│   └── polyfills.ts                        # Browser polyfills (if needed)
│
├── tests/
│   ├── e2e/                                # Playwright E2E tests
│   │   ├── auth.spec.ts
│   │   ├── goal-logging.spec.ts
│   │   ├── offline-sync.spec.ts
│   │   └── player-management.spec.ts
│   └── playwright.config.ts
│
├── .editorconfig                           # Editor settings
├── .eslintrc.json                          # ESLint rules
├── .gitignore
├── .prettierrc                             # Prettier formatting
├── angular.json                            # Angular CLI config
├── karma.conf.js                           # Karma test runner config
├── package.json
├── package-lock.json
├── README.md
├── tailwind.config.js                      # Tailwind CSS config
├── tsconfig.json                           # TypeScript base config
├── tsconfig.app.json                       # App-specific TS config
└── tsconfig.spec.json                      # Test-specific TS config
```

## 12.3 Key Directory Purposes

### `/src/app/core/`
**Purpose:** Singleton services that are instantiated once and used throughout the application.

**Rules:**
- Services are provided in root (`providedIn: 'root'`)
- Guards and interceptors live here
- Never import feature modules into core

### `/src/app/shared/`
**Purpose:** Reusable, stateless components, pipes, and directives used across multiple features.

**Rules:**
- Components should be presentational (dumb components)
- No business logic or API calls
- Should be highly reusable

### `/src/app/features/`
**Purpose:** Feature modules organized by domain. Each feature is lazy-loaded.

**Rules:**
- Each feature has its own routes file
- Services can be feature-scoped or provided in root
- Pages are routable components, components are reusable within the feature

### `/src/app/models/`
**Purpose:** TypeScript interfaces and types shared across the application.

**Rules:**
- Define once, use everywhere (DRY principle)
- Match database schema for consistency
- Use `supabase.types.ts` as single source of truth for database types

### `/supabase/migrations/`
**Purpose:** Version-controlled database schema changes.

**Rules:**
- Migrations are immutable (never edit existing migrations)
- Use timestamp-based naming: `YYYYMMDDHHMMSS_description.sql`
- Always test migrations locally before production

## 12.4 File Naming Conventions

| Type | Pattern | Example |
|------|---------|---------|
| Component | `*.component.ts` | `player-list.component.ts` |
| Service | `*.service.ts` | `auth.service.ts` |
| Guard | `*.guard.ts` | `auth.guard.ts` |
| Interceptor | `*.interceptor.ts` | `network.interceptor.ts` |
| Pipe | `*.pipe.ts` | `time-format.pipe.ts` |
| Directive | `*.directive.ts` | `long-press.directive.ts` |
| Model | `*.model.ts` | `player.model.ts` |
| Routes | `*.routes.ts` | `games.routes.ts` |
| Spec (Test) | `*.spec.ts` | `player.service.spec.ts` |

## 12.5 Import Path Conventions

Use TypeScript path mapping for cleaner imports:

```typescript
// tsconfig.json
{
  "compilerOptions": {
    "paths": {
      "@core/*": ["src/app/core/*"],
      "@shared/*": ["src/app/shared/*"],
      "@features/*": ["src/app/features/*"],
      "@models/*": ["src/app/models/*"],
      "@environments/*": ["src/environments/*"]
    }
  }
}
```

**Example Usage:**
```typescript
import { AuthService } from '@core/auth/auth.service';
import { PlayerService } from '@features/players/services/player.service';
import { Player } from '@models/player.model';
```

---
