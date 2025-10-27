# Archived Migrations

This directory contains the original migration files that were consolidated into `20251027000000_init_schema.sql`.

## Why Consolidate?

The original migrations accumulated technical debt:
- Conflicting patterns (coach_id vs team_id)
- RLS policy bugs (incorrect table references)
- Historical migration order issues
- Fresh database environment with no backwards compatibility needed

## Archived Files

1. **20251025100149_create_teams_table.sql**
   - Created teams table with RLS policies
   - Defined update_updated_at_column() function

2. **20250125_add_games_training_tables.sql**
   - Created games table with coach_id (deprecated pattern)
   - Created training_sessions table with coach_id (deprecated pattern)
   - Legacy file with old patterns

3. **20251026000001_create_players_table.sql**
   - Created players table with team_id (correct pattern)
   - Included soft delete support

4. **20251026000003_update_games_epic4.sql**
   - Updated games table: coach_id → team_id migration
   - Added game_attendance table
   - Added is_protected functionality

5. **20251027000001_create_goals_schema.sql**
   - Created goals, goal_assists, opponent_goals tables
   - **BUG**: RLS policies referenced non-existent team_members table
   - Fixed in consolidated migration

6. **20251026000002_create_training_tables.sql**
   - Created training_templates, training_sessions, training_attendance
   - Used team_id pattern (correct)
   - RLS policies fixed in consolidated migration

## Consolidated Migration

**File:** `../20251027000000_init_schema.sql`

**What changed:**
- All tables use team_id pattern (no coach_id)
- All RLS policies use correct pattern: `SELECT id FROM teams WHERE created_by = auth.uid()`
- Goals RLS policies fixed (removed team_members reference)
- Proper dependency order: teams → players → games → goals → training
- 10 tables, 40 RLS policies, 23 indexes, 11 triggers

**Tables included:**
- Core: teams, players
- Games: games, game_attendance, goals, goal_assists, opponent_goals
- Training: training_templates, training_sessions, training_attendance

## Rollback Plan

If needed, restore these files to the migrations directory and run `supabase db reset`.

## Date Consolidated

2025-10-27

## Story Reference

Story: DB-consolidate-migrations.story.md
