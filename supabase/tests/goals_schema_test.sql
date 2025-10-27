-- pgTAP Tests for Goals Schema (Story 5.1)
-- Tests schema constraints, foreign keys, indexes, and RLS policies

BEGIN;
SELECT plan(50); -- Adjust based on number of tests

-- ============================================================================
-- Table Existence Tests
-- ============================================================================

SELECT has_table('public', 'goals', 'goals table should exist');
SELECT has_table('public', 'goal_assists', 'goal_assists table should exist');
SELECT has_table('public', 'opponent_goals', 'opponent_goals table should exist');

-- ============================================================================
-- Column Tests: goals
-- ============================================================================

SELECT has_column('public', 'goals', 'id', 'goals should have id column');
SELECT has_column('public', 'goals', 'game_id', 'goals should have game_id column');
SELECT has_column('public', 'goals', 'player_id', 'goals should have player_id column');
SELECT has_column('public', 'goals', 'scored_at_minute', 'goals should have scored_at_minute column');
SELECT has_column('public', 'goals', 'scored_at_timestamp', 'goals should have scored_at_timestamp column');
SELECT has_column('public', 'goals', 'notes', 'goals should have notes column');
SELECT has_column('public', 'goals', 'created_at', 'goals should have created_at column');
SELECT has_column('public', 'goals', 'updated_at', 'goals should have updated_at column');
SELECT has_column('public', 'goals', 'deleted_at', 'goals should have deleted_at column');
SELECT has_column('public', 'goals', 'sync_state', 'goals should have sync_state column');

-- ============================================================================
-- Column Tests: goal_assists
-- ============================================================================

SELECT has_column('public', 'goal_assists', 'id', 'goal_assists should have id column');
SELECT has_column('public', 'goal_assists', 'goal_id', 'goal_assists should have goal_id column');
SELECT has_column('public', 'goal_assists', 'player_id', 'goal_assists should have player_id column');
SELECT has_column('public', 'goal_assists', 'created_at', 'goal_assists should have created_at column');
SELECT has_column('public', 'goal_assists', 'sync_state', 'goal_assists should have sync_state column');

-- ============================================================================
-- Column Tests: opponent_goals
-- ============================================================================

SELECT has_column('public', 'opponent_goals', 'id', 'opponent_goals should have id column');
SELECT has_column('public', 'opponent_goals', 'game_id', 'opponent_goals should have game_id column');
SELECT has_column('public', 'opponent_goals', 'scored_at_minute', 'opponent_goals should have scored_at_minute column');
SELECT has_column('public', 'opponent_goals', 'scored_at_timestamp', 'opponent_goals should have scored_at_timestamp column');
SELECT has_column('public', 'opponent_goals', 'created_at', 'opponent_goals should have created_at column');
SELECT has_column('public', 'opponent_goals', 'updated_at', 'opponent_goals should have updated_at column');
SELECT has_column('public', 'opponent_goals', 'deleted_at', 'opponent_goals should have deleted_at column');
SELECT has_column('public', 'opponent_goals', 'sync_state', 'opponent_goals should have sync_state column');

-- ============================================================================
-- Primary Key Tests
-- ============================================================================

SELECT col_is_pk('public', 'goals', 'id', 'goals.id should be primary key');
SELECT col_is_pk('public', 'goal_assists', 'id', 'goal_assists.id should be primary key');
SELECT col_is_pk('public', 'opponent_goals', 'id', 'opponent_goals.id should be primary key');

-- ============================================================================
-- Foreign Key Tests
-- ============================================================================

SELECT col_is_fk('public', 'goals', 'game_id', 'goals.game_id should be foreign key');
SELECT col_is_fk('public', 'goals', 'player_id', 'goals.player_id should be foreign key');
SELECT col_is_fk('public', 'goal_assists', 'goal_id', 'goal_assists.goal_id should be foreign key');
SELECT col_is_fk('public', 'goal_assists', 'player_id', 'goal_assists.player_id should be foreign key');
SELECT col_is_fk('public', 'opponent_goals', 'game_id', 'opponent_goals.game_id should be foreign key');

-- ============================================================================
-- NOT NULL Constraints
-- ============================================================================

SELECT col_not_null('public', 'goals', 'game_id', 'goals.game_id should be NOT NULL');
SELECT col_not_null('public', 'goals', 'player_id', 'goals.player_id should be NOT NULL');
SELECT col_not_null('public', 'goals', 'scored_at_minute', 'goals.scored_at_minute should be NOT NULL');
SELECT col_not_null('public', 'goals', 'scored_at_timestamp', 'goals.scored_at_timestamp should be NOT NULL');
SELECT col_not_null('public', 'goal_assists', 'goal_id', 'goal_assists.goal_id should be NOT NULL');
SELECT col_not_null('public', 'goal_assists', 'player_id', 'goal_assists.player_id should be NOT NULL');
SELECT col_not_null('public', 'opponent_goals', 'game_id', 'opponent_goals.game_id should be NOT NULL');
SELECT col_not_null('public', 'opponent_goals', 'scored_at_minute', 'opponent_goals.scored_at_minute should be NOT NULL');
SELECT col_not_null('public', 'opponent_goals', 'scored_at_timestamp', 'opponent_goals.scored_at_timestamp should be NOT NULL');

-- ============================================================================
-- Index Tests
-- ============================================================================

SELECT has_index('public', 'goals', 'idx_goals_game_minute', 'goals should have game_minute index');
SELECT has_index('public', 'goals', 'idx_goals_timestamp', 'goals should have timestamp index');
SELECT has_index('public', 'goal_assists', 'idx_goal_assists_goal', 'goal_assists should have goal index');
SELECT has_index('public', 'opponent_goals', 'idx_opponent_goals_game_minute', 'opponent_goals should have game_minute index');

-- ============================================================================
-- RLS Tests
-- ============================================================================

SELECT is(
    (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public' AND tablename = 'goals'),
    4::bigint,
    'goals table should have 4 RLS policies (SELECT, INSERT, UPDATE, DELETE)'
);

SELECT is(
    (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public' AND tablename = 'goal_assists'),
    4::bigint,
    'goal_assists table should have 4 RLS policies'
);

SELECT is(
    (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public' AND tablename = 'opponent_goals'),
    4::bigint,
    'opponent_goals table should have 4 RLS policies'
);

SELECT finish();
ROLLBACK;
