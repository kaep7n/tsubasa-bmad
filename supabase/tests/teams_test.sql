BEGIN;
SELECT plan(25);

-- Schema Tests
-- Test 1: Verify teams table exists
SELECT has_table('public', 'teams', 'teams table should exist');

-- Test 2-8: Verify all columns exist
SELECT has_column('public', 'teams', 'id', 'teams should have id column');
SELECT has_column('public', 'teams', 'name', 'teams should have name column');
SELECT has_column('public', 'teams', 'season', 'teams should have season column');
SELECT has_column('public', 'teams', 'logo_url', 'teams should have logo_url column');
SELECT has_column('public', 'teams', 'created_by', 'teams should have created_by column');
SELECT has_column('public', 'teams', 'created_at', 'teams should have created_at column');
SELECT has_column('public', 'teams', 'updated_at', 'teams should have updated_at column');

-- Test 9: Verify primary key
SELECT col_is_pk('public', 'teams', 'id', 'id should be primary key');

-- Test 10: Verify foreign key
SELECT col_is_fk('public', 'teams', 'created_by', 'created_by should be foreign key');

-- Test 11-13: Verify NOT NULL constraints
SELECT col_not_null('public', 'teams', 'name', 'name should be NOT NULL');
SELECT col_not_null('public', 'teams', 'created_by', 'created_by should be NOT NULL');
SELECT col_not_null('public', 'teams', 'created_at', 'created_at should be NOT NULL');

-- Test 14-15: Verify column types
SELECT col_type_is('public', 'teams', 'id', 'uuid', 'id should be UUID');
SELECT col_type_is('public', 'teams', 'name', 'text', 'name should be TEXT');

-- Test 16: Verify index exists on created_by
SELECT has_index('public', 'teams', 'idx_teams_created_by', 'index on created_by should exist');

-- RLS Tests
-- Test 17: Verify RLS is enabled
SELECT tables_are('public', ARRAY['teams'], 'only teams table should exist in public schema');
SELECT ok(
  (SELECT relrowsecurity FROM pg_class WHERE relname = 'teams'),
  'RLS should be enabled on teams table'
);

-- Test 19-22: Verify RLS policies exist
SELECT policies_are('public', 'teams', ARRAY[
  'Users can view own teams',
  'Users can create teams',
  'Users can update own teams',
  'Users can delete own teams'
], 'teams table should have exactly 4 RLS policies');

-- Test 23: Verify SELECT policy
SELECT policy_cmd_is('public', 'teams', 'Users can view own teams', 'SELECT',
  'SELECT policy should be for SELECT operations');

-- Test 24: Verify INSERT policy
SELECT policy_cmd_is('public', 'teams', 'Users can create teams', 'INSERT',
  'INSERT policy should be for INSERT operations');

-- Test 25: Verify UPDATE policy
SELECT policy_cmd_is('public', 'teams', 'Users can update own teams', 'UPDATE',
  'UPDATE policy should be for UPDATE operations');

SELECT * FROM finish();
ROLLBACK;
