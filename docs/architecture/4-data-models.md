# 4. Data Models

## User (Coach)
**Purpose:** Represents a volunteer coach who manages a team. In v1, each coach has exactly one team (1:1 relationship).

**Key Attributes:**
- id: UUID - Unique identifier (Supabase Auth user ID)
- email: string - Login email address
- created_at: timestamp - Account creation date
- team_name: string - Name of the coach's team
- coach_name: string (optional) - Display name for the coach

**TypeScript Interface:**
```typescript
interface Coach {
  id: string;
  email: string;
  created_at: Date;
  team_name: string;
  coach_name?: string;
}
```

**Relationships:**
- Owns all team data (players, games, training sessions)

## Player
**Purpose:** Represents a youth football player on the coach's team. Minimal data for privacy.

**Key Attributes:**
- id: UUID - Unique identifier
- coach_id: UUID - Reference to owning coach (for RLS)
- first_name: string - Player's first name only
- last_initial: string - Last name initial (e.g., "R")
- display_name: string - Computed: "Max R."
- created_at: timestamp - When added to roster
- is_active: boolean - Soft delete for roster management

**TypeScript Interface:**
```typescript
interface Player {
  id: string;
  coach_id: string;
  first_name: string;
  last_initial: string;
  display_name?: string; // Computed: first_name + last_initial
  created_at: Date;
  is_active: boolean;
}
```

## Squad
**Purpose:** Grouping mechanism for players (e.g., "First Team", "U12 Blue").

**TypeScript Interface:**
```typescript
interface Squad {
  id: string;
  coach_id: string;
  name: string;
  color?: string; // Hex color for UI
  created_at: Date;
  is_active: boolean;
}
```

## TrainingSession
**Purpose:** Represents a practice/training event with attendance tracking.

**TypeScript Interface:**
```typescript
type TrainingStatus = 'scheduled' | 'completed' | 'cancelled';

interface TrainingSession {
  id: string;
  coach_id: string;
  date: Date;
  start_time: string; // "18:00"
  duration_minutes: number;
  location?: string;
  status: TrainingStatus;
  cancel_reason?: string;
  template_id?: string;
  notes?: string;
  created_at: Date;
}
```

## Attendance
**Purpose:** Tracks player attendance at training sessions. Three-state system.

**TypeScript Interface:**
```typescript
type AttendanceStatus = 'attended' | 'excused' | 'absent';

interface Attendance {
  id: string;
  coach_id: string;
  training_session_id: string;
  player_id: string;
  status: AttendanceStatus;
  marked_at: Date;
}
```

## Game
**Purpose:** Represents a match with opponent, tracking goals and timing.

**TypeScript Interface:**
```typescript
type GameStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';

interface Game {
  id: string;
  coach_id: string;
  date: Date;
  start_time?: string;
  opponent: string;
  location?: string;
  status: GameStatus;
  cancel_reason?: string;
  our_score: number;
  opponent_score: number;
  periods: number;
  period_minutes: number;
  current_period?: number;
  game_time_seconds?: number;
  notes?: string;
  created_at: Date;
}
```

## Goal
**Purpose:** Records a goal scored by our team with scorer, assists, and timing.

**TypeScript Interface:**
```typescript
interface Goal {
  id: string;
  coach_id: string;
  game_id: string;
  scorer_id?: string; // Null for own goals
  game_time_seconds: number;
  period: number;
  is_own_goal: boolean;
  created_at: Date;

  // Joined data (from queries)
  scorer?: Player;
  assists?: Player[];
}
```

---
