# 6. Components

## Auth Service
**Responsibility:** Manages authentication flow, session state, and guards for protected routes.

**Key Interfaces:**
- `login(email, password): Observable<User>`
- `logout(): Observable<void>`
- `getCurrentUser(): Observable<User | null>`
- `isAuthenticated$: Observable<boolean>`

## Offline Sync Manager
**Responsibility:** Orchestrates offline data storage, sync queue management, and conflict resolution. Core component for PWA offline-first architecture.

**Key Interfaces:**
- `queueOperation(operation: SyncOperation): Promise<void>`
- `syncPendingOperations(): Observable<SyncResult[]>`
- `getOfflineStatus(): Observable<OfflineStatus>`

## Live Game Tracker Component
**Responsibility:** Real-time game tracking interface optimized for sideline use. Most critical component for user experience.

**Key Interfaces:**
- Game timer with period management
- Live scoreboard display
- Goal logging with player selection
- Assist selection (multi-select)
- Undo/edit controls
- Smart player sorting based on frequency

## Data Service Layer
**Responsibility:** Abstraction layer between Angular components and Supabase API. Handles caching, offline queue, and optimistic updates.

**Key Services:**
- `PlayerDataService`: CRUD for players
- `GameDataService`: Game management and goal tracking
- `TrainingDataService`: Sessions and attendance
- `StatsDataService`: Aggregated statistics calculations

---
