# 4. Technical Assumptions

## 4.1 Architecture

- **Frontend**: Angular 17.3 LTS with standalone components, Signals for reactivity
- **Backend**: Supabase (PostgreSQL, Auth, Storage, RLS policies)
- **Deployment**: Cloudflare Pages with global CDN
- **Offline Storage**: IndexedDB (via Dexie.js wrapper) + Service Worker
- **Repository**: Monorepo structure with `/src` (Angular app), `/supabase` (migrations/functions), `/docs` (architecture/PRD)

## 4.2 Data Model

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

## 4.3 API Strategy

- **Supabase PostgREST**: RESTful API with automatic endpoint generation from PostgreSQL schema
- **Row-Level Security (RLS)**: All tables filtered by team_id derived from JWT claims
- **Real-Time Subscriptions**: Not used in MVP (offline-first polling on reconnection)
- **RPC Functions**: Used for complex queries (e.g., aggregated statistics)

API conventions:
- Nested resources via query parameters (e.g., `/goals?game_id=eq.{id}`)
- Composite indexes on foreign keys for query performance
- Timestamps: `created_at`, `updated_at`, `deleted_at` (soft deletes)

## 4.4 Offline Sync Strategy

- **Sync Queue**: IndexedDB table (`sync_queue`) stores pending operations
- **Operation Types**: CREATE, UPDATE, DELETE with optimistic IDs (UUIDs generated client-side)
- **Conflict Resolution**: Last-write-wins (compare `updated_at` timestamps)
- **Atomic Operations**: Goals + assists synced as single transaction
- **Retry Logic**: Exponential backoff (1s, 2s, 4s, 8s, max 30s)
- **Background Sync**: Service Worker Periodic Background Sync API (when supported)

## 4.5 Testing Strategy

- **Unit Tests**: Jasmine/Karma for Angular services and components (80% coverage target)
- **Integration Tests**: pgTAP for database schema, RLS policies, and triggers (100% coverage for security-critical code)
- **E2E Tests**: Playwright for critical workflows (goal logging, offline sync, authentication)
- **Manual Testing**: Device testing on iOS Safari, Android Chrome, low-connectivity scenarios

## 4.6 CI/CD Pipeline

- **Version Control**: Git with GitHub
- **CI**: GitHub Actions workflow on push to main
  - Lint: ESLint + Prettier
  - Unit tests: Karma (headless Chrome)
  - Build: Angular production build with minification
  - Database tests: Supabase CLI + pgTAP
- **CD**: Automatic deployment to Cloudflare Pages on successful CI
- **Preview Deployments**: Branch previews for pull requests

## 4.7 Infrastructure

- **Hosting**: Cloudflare Pages (free tier: unlimited bandwidth, 500 builds/month)
- **Database**: Supabase (free tier: 500MB PostgreSQL, 2GB bandwidth/month)
- **CDN**: Cloudflare global CDN (automatic, included with Pages)
- **SSL**: Automatic HTTPS via Cloudflare (Let's Encrypt)
- **Monitoring**: Sentry for error tracking (free tier: 5,000 events/month)
- **Analytics**: (Optional) Google Analytics 4 or Plausible for privacy-friendly tracking

## 4.8 Security Model

- **Authentication**: Supabase Auth (JWT tokens with 7-day expiry, refresh token rotation)
- **Authorization**: Row-Level Security (RLS) policies on all tables filtering by `team_id`
- **Data Isolation**: `team_id` derived from JWT claims (`app_metadata.team_id`)
- **HTTPS-Only**: Enforced via Cloudflare Pages (HSTS headers)
- **CSP Headers**: Content Security Policy to prevent XSS attacks
- **Input Validation**: Client-side (Angular forms) + server-side (PostgreSQL constraints)

## 4.9 Performance Budgets

- **JavaScript Bundle**: <500KB compressed (Angular + dependencies)
- **Initial Page Load**: <2s on 3G (target: 1.5s on 4G)
- **Time to Interactive (TTI)**: <3s on 3G
- **IndexedDB Queries**: <100ms for reads, <50ms for writes
- **Statistics Aggregation**: <500ms for 1 season, <5s for 5 seasons

## 4.10 Browser & Device Support

- **Browsers**: Chrome 90+, Safari 14+, Firefox 88+, Edge 90+
- **Devices**: iOS 14+ (iPhone SE and larger), Android 8+ (mid-range devices)
- **PWA Install**: Supported on iOS 14+ and Android 5+
- **Service Worker**: Required for offline mode (graceful degradation if unsupported)

---
