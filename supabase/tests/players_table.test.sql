-- Test file for players table
-- Story: 2.1 Player Database Schema
-- Created: 2025-10-26

BEGIN;
SELECT plan(25);

-- Test table exists
SELECT has_table('public', 'players', 'players table should exist');

-- Test columns exist
SELECT has_column('public', 'players', 'id', 'players should have id column');
SELECT has_column('public', 'players', 'team_id', 'players should have team_id column');
SELECT has_column('public', 'players', 'first_name', 'players should have first_name column');
SELECT has_column('public', 'players', 'last_name', 'players should have last_name column');
SELECT has_column('public', 'players', 'date_of_birth', 'players should have date_of_birth column');
SELECT has_column('public', 'players', 'jersey_number', 'players should have jersey_number column');
SELECT has_column('public', 'players', 'photo_url', 'players should have photo_url column');
SELECT has_column('public', 'players', 'squad', 'players should have squad column');
SELECT has_column('public', 'players', 'created_at', 'players should have created_at column');
SELECT has_column('public', 'players', 'updated_at', 'players should have updated_at column');
SELECT has_column('public', 'players', 'deleted_at', 'players should have deleted_at column');

-- Test column types
SELECT col_type_is('public', 'players', 'id', 'uuid', 'id should be uuid');
SELECT col_type_is('public', 'players', 'team_id', 'uuid', 'team_id should be uuid');
SELECT col_type_is('public', 'players', 'first_name', 'text', 'first_name should be text');
SELECT col_type_is('public', 'players', 'last_name', 'text', 'last_name should be text');

-- Test NOT NULL constraints
SELECT col_not_null('public', 'players', 'id', 'id should not be null');
SELECT col_not_null('public', 'players', 'team_id', 'team_id should not be null');
SELECT col_not_null('public', 'players', 'first_name', 'first_name should not be null');
SELECT col_not_null('public', 'players', 'last_name', 'last_name should not be null');

-- Test foreign key
SELECT has_fk('public', 'players', 'players should have foreign key to teams');

-- Test indexes exist
SELECT has_index('public', 'players', 'idx_players_team_active', 'idx_players_team_active should exist');
SELECT has_index('public', 'players', 'idx_players_jersey_number', 'idx_players_jersey_number should exist');
SELECT has_index('public', 'players', 'idx_players_names', 'idx_players_names should exist');

-- Test RLS enabled
SELECT rls_enabled('public', 'players', 'RLS should be enabled on players');

SELECT * FROM finish();
ROLLBACK;
