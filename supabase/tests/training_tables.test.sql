-- Test Suite: Training Tables
-- Story: 3.1 Training Sessions Database Schema
-- Tests for training_templates, training_sessions, and training_attendance tables

BEGIN;

SELECT plan(40);

-- =====================================================
-- 1. TABLE EXISTENCE TESTS
-- =====================================================

SELECT has_table('training_templates', 'training_templates table should exist');
SELECT has_table('training_sessions', 'training_sessions table should exist');
SELECT has_table('training_attendance', 'training_attendance table should exist');

-- =====================================================
-- 2. COLUMN EXISTENCE TESTS - TRAINING_TEMPLATES
-- =====================================================

SELECT has_column('training_templates', 'id', 'training_templates should have id column');
SELECT has_column('training_templates', 'team_id', 'training_templates should have team_id column');
SELECT has_column('training_templates', 'name', 'training_templates should have name column');
SELECT has_column(
  'training_templates',
  'default_duration_minutes',
  'training_templates should have default_duration_minutes column'
);
SELECT has_column(
  'training_templates',
  'default_location',
  'training_templates should have default_location column'
);
SELECT has_column('training_templates', 'created_at', 'training_templates should have created_at column');
SELECT has_column('training_templates', 'updated_at', 'training_templates should have updated_at column');

-- =====================================================
-- 3. COLUMN EXISTENCE TESTS - TRAINING_SESSIONS
-- =====================================================

SELECT has_column('training_sessions', 'id', 'training_sessions should have id column');
SELECT has_column('training_sessions', 'team_id', 'training_sessions should have team_id column');
SELECT has_column(
  'training_sessions',
  'session_template_id',
  'training_sessions should have session_template_id column'
);
SELECT has_column('training_sessions', 'date', 'training_sessions should have date column');
SELECT has_column(
  'training_sessions',
  'duration_minutes',
  'training_sessions should have duration_minutes column'
);
SELECT has_column('training_sessions', 'location', 'training_sessions should have location column');
SELECT has_column('training_sessions', 'notes', 'training_sessions should have notes column');
SELECT has_column('training_sessions', 'created_at', 'training_sessions should have created_at column');
SELECT has_column('training_sessions', 'updated_at', 'training_sessions should have updated_at column');
SELECT has_column('training_sessions', 'deleted_at', 'training_sessions should have deleted_at column');

-- =====================================================
-- 4. COLUMN EXISTENCE TESTS - TRAINING_ATTENDANCE
-- =====================================================

SELECT has_column('training_attendance', 'id', 'training_attendance should have id column');
SELECT has_column(
  'training_attendance',
  'training_session_id',
  'training_attendance should have training_session_id column'
);
SELECT has_column('training_attendance', 'player_id', 'training_attendance should have player_id column');
SELECT has_column('training_attendance', 'status', 'training_attendance should have status column');
SELECT has_column('training_attendance', 'created_at', 'training_attendance should have created_at column');
SELECT has_column('training_attendance', 'updated_at', 'training_attendance should have updated_at column');

-- =====================================================
-- 5. PRIMARY KEY TESTS
-- =====================================================

SELECT col_is_pk('training_templates', 'id', 'id should be primary key in training_templates');
SELECT col_is_pk('training_sessions', 'id', 'id should be primary key in training_sessions');
SELECT col_is_pk('training_attendance', 'id', 'id should be primary key in training_attendance');

-- =====================================================
-- 6. FOREIGN KEY TESTS
-- =====================================================

SELECT col_is_fk(
  'training_templates',
  'team_id',
  'team_id should be foreign key in training_templates'
);
SELECT col_is_fk(
  'training_sessions',
  'team_id',
  'team_id should be foreign key in training_sessions'
);
SELECT col_is_fk(
  'training_sessions',
  'session_template_id',
  'session_template_id should be foreign key in training_sessions'
);
SELECT col_is_fk(
  'training_attendance',
  'training_session_id',
  'training_session_id should be foreign key in training_attendance'
);
SELECT col_is_fk(
  'training_attendance',
  'player_id',
  'player_id should be foreign key in training_attendance'
);

-- =====================================================
-- 7. INDEX TESTS
-- =====================================================

SELECT has_index(
  'training_sessions',
  'idx_training_sessions_team_date',
  'training_sessions should have team_date index'
);
SELECT has_index(
  'training_sessions',
  'idx_training_sessions_template',
  'training_sessions should have template index'
);
SELECT has_index(
  'training_sessions',
  'idx_training_sessions_deleted',
  'training_sessions should have deleted index'
);
SELECT has_index(
  'training_attendance',
  'idx_training_attendance_session',
  'training_attendance should have session index'
);
SELECT has_index(
  'training_attendance',
  'idx_training_attendance_player',
  'training_attendance should have player index'
);

-- =====================================================
-- 8. RLS POLICY TESTS
-- =====================================================

-- Note: pgTAP doesn't have built-in RLS policy testing functions
-- These tests verify that RLS is enabled on the tables

SELECT is(
  (SELECT relrowsecurity FROM pg_class WHERE relname = 'training_templates'),
  true,
  'RLS should be enabled on training_templates'
);

SELECT is(
  (SELECT relrowsecurity FROM pg_class WHERE relname = 'training_sessions'),
  true,
  'RLS should be enabled on training_sessions'
);

SELECT is(
  (SELECT relrowsecurity FROM pg_class WHERE relname = 'training_attendance'),
  true,
  'RLS should be enabled on training_attendance'
);

SELECT * FROM finish();

ROLLBACK;
