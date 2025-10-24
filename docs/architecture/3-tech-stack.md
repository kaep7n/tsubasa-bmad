# 3. Tech Stack

This is the **DEFINITIVE** technology selection for the entire Tsubasa project. This table represents the single source of truth - all development must use these exact versions.

| Category | Technology | Version | Purpose | Rationale |
|----------|------------|---------|---------|-----------|
| Frontend Language | TypeScript | 5.2+ | Type-safe JavaScript for Angular app | Catches errors at compile time; required by Angular; improves maintainability |
| Frontend Framework | Angular | 17.3 LTS | Component-based SPA framework | LTS for stability; standalone components reduce boilerplate; excellent PWA support |
| UI Component Library | Angular Material | 17.3 | Material Design components | Consistent with Angular version; mobile-optimized; large touch targets for sideline use |
| State Management | RxJS + Signals | 7.8 / Angular 17+ | Reactive state and async operations | RxJS for async operations; Signals for simpler component state |
| Backend Language | SQL (PostgreSQL) | 14+ | Database queries via Supabase | No custom backend code needed; Supabase handles API generation |
| Backend Framework | Supabase (PostgREST) | 2.x | Auto-generated REST API from PostgreSQL | Zero backend code to maintain; automatic API from schema |
| API Style | REST | OpenAPI 3.0 | CRUD operations on resources | Supabase auto-generates RESTful endpoints; simpler than GraphQL for offline sync |
| Database | PostgreSQL | 14+ | Relational data storage | ACID compliance critical for stats accuracy; excellent JSON support; RLS for security |
| Cache | IndexedDB | Browser API | Offline data storage | Native browser storage for PWA offline mode; stores full dataset locally |
| File Storage | Supabase Storage | 2.x | Future: photos, exports (v2) | Same auth as database; S3-compatible |
| Authentication | Supabase Auth | 2.x | Email/password authentication | Integrated with database RLS; JWT sessions; handles password reset |
| Frontend Testing | Jasmine + Karma | 6.4 / 6.2 | Unit and component testing | Angular default; well-integrated |
| Backend Testing | pgTAP | 1.2+ | Database testing | Tests RLS policies and migrations |
| E2E Testing | Playwright | 1.40+ | Cross-browser E2E testing | Better than Cypress for PWA testing; handles Service Workers |
| Build Tool | Angular CLI | 17.3 | Development and build orchestration | Standard Angular tooling; handles PWA generation |
| Bundler | Webpack (via Angular) | 5.x | Module bundling and optimization | Handled by Angular CLI |
| IaC Tool | Supabase CLI | 1.x | Database migrations and RLS policies | Version control for database schema |
| CI/CD | GitHub Actions | N/A | Automated testing and deployment | Free for public repos; integrates with Cloudflare Pages |
| Monitoring | Sentry | 7.x | Error tracking and performance | Generous free tier; Angular SDK |
| Logging | Console + Sentry | N/A | Development and production logging | Console for dev; Sentry captures production errors |
| CSS Framework | Tailwind CSS | 3.4 | Utility-first CSS framework | Rapid prototyping; mobile-first utilities |

---
