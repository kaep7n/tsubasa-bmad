# 9. Database Schema

PostgreSQL schema with RLS policies for complete data isolation:

## Key Tables
- `coaches` - User profiles extending auth.users
- `players` - Team roster with minimal PII
- `squads` - Player groupings
- `training_sessions` - Practice events
- `attendances` - Three-state attendance tracking
- `games` - Match records
- `goals` - Our team's goals
- `goal_assists` - Many-to-many assists
- `opponent_goals` - Simple opponent scoring

## Security
- All tables have Row-Level Security (RLS) enabled
- Policies ensure `coach_id = auth.uid()` for complete isolation
- SECURITY DEFINER functions for elevated operations
- Comprehensive indexes on foreign keys and commonly filtered columns

---
