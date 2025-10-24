# Architect: Validate PRD Against Architecture

## Context

You are Winston, the Architect agent. You previously created the full-stack architecture document for Tsubasa (`docs/architecture.md`). John (PM agent) has now completed the Product Requirements Document (`docs/prd.md`).

## Your Mission

Perform a comprehensive validation of the PRD against the architecture document to identify:

1. **Alignment Issues**: Requirements that conflict with architectural decisions
2. **Missing Technical Details**: Stories that need additional implementation guidance
3. **Performance Risks**: Requirements that may not meet performance budgets
4. **Security Gaps**: Requirements that could compromise security model
5. **Scalability Concerns**: Requirements that may not scale to 1000+ teams

## Validation Checklist

### 1. Database Schema Alignment

**Architecture Reference**: Section 5 (Data Architecture)

**PRD Stories to Validate**:
- Story 1.2: Supabase Project Setup & Schema Initialization
- Story 2.1: Player Database Schema
- Story 3.1: Training Sessions Database Schema
- Story 4.1: Games Database Schema
- Story 5.1: Goals Database Schema & Sync Infrastructure

**Questions to Answer**:
- ✅ Do all table definitions in PRD match architecture document?
- ✅ Are RLS policies consistent with security model (team_id isolation)?
- ✅ Are indexes defined for all foreign keys and query patterns?
- ✅ Are soft delete patterns (`deleted_at`) applied consistently?
- ✅ Are triggers defined for `updated_at` maintenance?

**Output**: List any discrepancies or missing details.

---

### 2. API Strategy Alignment

**Architecture Reference**: Section 6 (API Layer)

**PRD Stories to Validate**:
- Story 1.2: Supabase PostgREST endpoints
- Story 5.1: Goals API (nested under games)
- All CRUD operations across epics

**Questions to Answer**:
- ✅ Are API patterns consistent with Supabase PostgREST limitations?
- ✅ Is nested resource pattern (`/games/{id}/goals`) handled via query parameters or RPC?
- ✅ Are RPC functions needed for complex queries (statistics aggregations)?
- ✅ Are batch operations (calendar import, squad changes) handled efficiently?
- ✅ Are rate limits considered (Supabase free tier: 60 requests/minute)?

**Output**: List any API implementation gaps or recommended RPC functions.

---

### 3. Offline Sync Strategy Validation

**Architecture Reference**: Section 9 (Offline Strategy)

**PRD Stories to Validate**:
- Story 1.7: Offline Foundation (Service Worker & IndexedDB)
- Story 5.10: Offline Sync for Live Game Events
- All stories with offline handling acceptance criteria

**Questions to Answer**:
- ✅ Is sync queue design consistent with architecture (operation types, ordering)?
- ✅ Is conflict resolution strategy (last-write-wins) applied consistently?
- ✅ Are atomic operations (goal + assists) handled correctly in sync queue?
- ✅ Are retry strategies (exponential backoff) defined consistently?
- ✅ Is IndexedDB schema in PRD aligned with Dexie.js schema in architecture?

**Output**: List any sync implementation risks or missing details.

---

### 4. Performance Budget Compliance

**Architecture Reference**: Section 14 (Performance Requirements)

**PRD Stories to Validate**:
- Story 5.4: Goal logging in <5 seconds
- Story 6.1: Statistics aggregation performance
- Story 6.10: Statistics Performance Optimization
- NFR-001: Performance requirements

**Questions to Answer**:
- ✅ Do performance targets in PRD match architecture budgets?
  - Page load: <2s on 3G
  - Goal logging: <5s
  - Statistics: <500ms (1 season), <5s (5 seasons)
- ✅ Are Web Workers used for heavy computations (timer, statistics)?
- ✅ Are IndexedDB indexes sufficient for query performance?
- ✅ Is virtual scrolling specified for large lists (>50 players)?
- ✅ Is bundle size budget (<500KB compressed) achievable with dependencies?

**Output**: List any performance risks or recommended optimizations.

---

### 5. Security Model Compliance

**Architecture Reference**: Section 11 (Security)

**PRD Stories to Validate**:
- Story 1.4: Authentication Implementation
- All RLS policies in schema stories
- Story 6.7: Statistics Privacy & Sharing Controls
- NFR-004: Security requirements

**Questions to Answer**:
- ✅ Is JWT-based authentication with Supabase Auth consistent?
- ✅ Are all RLS policies filtering by `team_id` from JWT claims?
- ✅ Are sensitive fields (email, DOB) protected from client-side logging?
- ✅ Is OAuth scope minimization applied (Google Calendar: readonly only)?
- ✅ Are HTTPS-only and CSP headers enforced (architecture Section 11.2)?
- ✅ Is file upload security addressed (photo/logo size limits, type validation)?

**Output**: List any security vulnerabilities or missing protections.

---

### 6. Testing Strategy Alignment

**Architecture Reference**: Section 12 (Testing & Quality Assurance)

**PRD Stories to Validate**:
- All stories with testing acceptance criteria
- NFR-010: Testing requirements

**Questions to Answer**:
- ✅ Is unit test coverage target (80%) achievable with story sizing?
- ✅ Are pgTAP tests specified for all RLS policies?
- ✅ Are E2E tests specified for critical workflows (auth, goal logging, sync)?
- ✅ Is offline testing strategy defined (E2E with network throttling)?
- ✅ Are performance benchmarks testable (Story 6.10)?

**Output**: List any testing gaps or recommended additional test cases.

---

### 7. Technology Stack Validation

**Architecture Reference**: Section 3 (Technology Stack)

**PRD Stories to Validate**:
- Story 1.1: Project Scaffolding
- Story 1.3: CI/CD Pipeline Setup
- Story 1.7: Service Worker configuration
- Story 5.2: Web Worker for timer

**Questions to Answer**:
- ✅ Are all dependencies in PRD compatible with versions in architecture?
  - Angular 17.3 LTS
  - TypeScript 5.2+
  - Tailwind CSS 3.3+
  - Angular Material 17.x
  - Dexie.js (IndexedDB wrapper)
  - Supabase JS Client 2.x
- ✅ Is Angular Service Worker (`@angular/service-worker`) specified correctly?
- ✅ Are Web Workers compatible with Angular 17.3 (dedicated worker, not shared)?
- ✅ Is chart library (Chart.js or ng2-charts) lightweight enough for bundle budget?
- ✅ Is PDF generation library (jsPDF) compatible with offline-first strategy?

**Output**: List any dependency conflicts or version mismatches.

---

### 8. Scalability & Data Retention

**Architecture Reference**: Section 13 (Deployment), Section 11.5 (Data Retention)

**PRD Stories to Validate**:
- Story 2.5: Delete Player (Soft Delete)
- Story 3.7: Cancel Training Session
- Story 4.5: Cancel Game
- Story 6.10: Statistics Performance Optimization
- NFR-007: Data Retention
- NFR-008: Scalability

**Questions to Answer**:
- ✅ Is soft delete pattern (90-day retention) applied consistently?
- ✅ Is hard delete automation planned (Supabase cron job or Edge Function)?
- ✅ Is IndexedDB storage bounded (<50MB per team) with warnings at 40MB?
- ✅ Are Supabase free tier limits considered (500MB DB, 2GB bandwidth/month)?
- ✅ Is statistics aggregation scalable to 100+ games per team?

**Output**: List any scalability bottlenecks or data retention gaps.

---

### 9. Missing Architecture Implementation Details

**Review all PRD stories for:**

1. **Unspecified RPC Functions**: Complex queries that need PostgreSQL functions
   - Statistics aggregations (Story 6.1)
   - Attendance rate calculations (Story 3.6)
   - Win/loss record queries (Story 6.3)

2. **Unspecified Triggers**: Database automation not mentioned
   - Set `is_protected = true` on games when goals/attendance exist (Story 4.1)
   - Update `updated_at` on row modification (all tables)

3. **Unspecified Indexes**: Performance-critical indexes not listed
   - Composite indexes for join queries
   - Full-text search indexes (if player/opponent search uses FTS)

4. **Unspecified Service Worker Routes**: Cache strategies not detailed
   - Which API routes to cache (if any)?
   - Dynamic content caching (player photos, team logos)

5. **Unspecified Error Handling**: Specific error scenarios
   - Sync conflict resolution UI (Story 2.4 mentions but doesn't detail)
   - Storage quota exceeded handling (Story 2.3 mentions)

**Output**: List missing implementation details that should be added to architecture or PRD.

---

### 10. Epic Sequencing & Dependencies

**Review Epic order in PRD Section 5:**

1. Epic 1: Foundation & Authentication
2. Epic 2: Player & Squad Management
3. Epic 3: Training Sessions & Attendance
4. Epic 4: Game Management & Calendar Integration
5. Epic 5: Live Game Tracking
6. Epic 6: Statistics & Post-Game Reports

**Questions to Answer**:
- ✅ Are dependencies between epics clear (e.g., Epic 5 depends on Epic 2 players, Epic 4 games)?
- ✅ Can epics be developed in parallel (e.g., Epic 2 and Epic 3 are independent)?
- ✅ Are cross-cutting concerns (offline sync, testing) addressed incrementally?
- ✅ Is Epic 5 (critical UX) scheduled early enough to validate <5s goal logging?

**Output**: Recommend any epic reordering or parallelization opportunities.

---

## Deliverables

Provide a structured report with the following sections:

### 1. Executive Summary
- Overall alignment score (e.g., "95% aligned, 5% requires clarification")
- Top 3 risks identified
- Recommendation: Proceed / Address issues first / Major revisions needed

### 2. Detailed Findings

For each validation checklist item (1-10), provide:

```markdown
## [Validation Item Name]

**Status**: ✅ Aligned | ⚠️ Minor Issues | ❌ Critical Issues

**Findings**:
- [Finding 1]
- [Finding 2]

**Recommendations**:
- [Action 1]
- [Action 2]

**Affected Stories**:
- Story X.Y: [Story name]
```

### 3. Missing Implementation Details

List any details that should be added to architecture document or PRD:

```markdown
## Missing Detail: [Name]

**Location**: Architecture Section X or PRD Story Y.Z

**Description**: [What's missing]

**Recommendation**: [Specific text to add]

**Priority**: High | Medium | Low
```

### 4. Architecture Updates Needed

If any architectural decisions need revision based on PRD:

```markdown
## Architecture Update: [Topic]

**Current Architecture**: [What architecture doc says]

**PRD Requirement**: [What PRD requires]

**Conflict**: [Why they conflict]

**Proposed Resolution**: [How to align them]
```

### 5. Approval & Next Steps

```markdown
## Approval Status

- [ ] Database schema validated
- [ ] API strategy validated
- [ ] Offline sync validated
- [ ] Performance budgets validated
- [ ] Security model validated
- [ ] Testing strategy validated
- [ ] Technology stack validated
- [ ] Scalability validated
- [ ] Implementation details complete
- [ ] Epic sequencing optimal

**Overall Recommendation**: [Proceed / Conditional Proceed / Revise]

**Next Steps**:
1. [Action item 1]
2. [Action item 2]
```

---

## Success Criteria

Your validation is successful if:

1. ✅ All 10 validation items addressed with status (✅/⚠️/❌)
2. ✅ Critical issues (❌) have clear resolution paths
3. ✅ Missing implementation details are specific and actionable
4. ✅ Recommendations are prioritized (High/Medium/Low)
5. ✅ Overall recommendation is clear (Proceed/Conditional/Revise)

---

**Ready to begin? Start by reading `docs/architecture.md` and `docs/prd.md` in parallel, then work through the validation checklist systematically.**
