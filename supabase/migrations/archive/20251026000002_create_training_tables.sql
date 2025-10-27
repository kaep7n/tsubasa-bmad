-- Migration: Create Training Sessions and Attendance Tables
-- Story: 3.1 Training Sessions Database Schema
-- Date: 2025-10-26

-- =====================================================
-- 1. CREATE TRAINING_TEMPLATES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS training_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  default_duration_minutes INTEGER DEFAULT 90 CHECK (default_duration_minutes > 0),
  default_location TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Add comment
COMMENT ON TABLE training_templates IS 'Reusable templates for recurring training sessions';

-- =====================================================
-- 2. CREATE TRAINING_SESSIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS training_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE NOT NULL,
  session_template_id UUID REFERENCES training_templates(id) ON DELETE SET NULL,
  date TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER DEFAULT 90 CHECK (duration_minutes > 0),
  location TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  deleted_at TIMESTAMPTZ
);

-- Add comment
COMMENT ON TABLE training_sessions IS 'Individual training sessions with attendance tracking';

-- =====================================================
-- 3. CREATE TRAINING_ATTENDANCE TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS training_attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  training_session_id UUID REFERENCES training_sessions(id) ON DELETE CASCADE NOT NULL,
  player_id UUID REFERENCES players(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('attended', 'excused', 'absent')),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(training_session_id, player_id)
);

-- Add comment
COMMENT ON TABLE training_attendance IS 'Player attendance records for training sessions';

-- =====================================================
-- 4. CREATE INDEXES FOR PERFORMANCE
-- =====================================================

-- Training sessions: Chronological queries by team
CREATE INDEX IF NOT EXISTS idx_training_sessions_team_date
  ON training_sessions(team_id, date DESC);

-- Training sessions: Filter by template
CREATE INDEX IF NOT EXISTS idx_training_sessions_template
  ON training_sessions(session_template_id)
  WHERE session_template_id IS NOT NULL;

-- Training sessions: Soft delete queries
CREATE INDEX IF NOT EXISTS idx_training_sessions_deleted
  ON training_sessions(team_id, deleted_at)
  WHERE deleted_at IS NULL;

-- Training attendance: Lookup by session
CREATE INDEX IF NOT EXISTS idx_training_attendance_session
  ON training_attendance(training_session_id);

-- Training attendance: Player attendance history
CREATE INDEX IF NOT EXISTS idx_training_attendance_player
  ON training_attendance(player_id);

-- Training attendance: Status queries
CREATE INDEX IF NOT EXISTS idx_training_attendance_status
  ON training_attendance(player_id, status);

-- =====================================================
-- 5. CREATE UPDATED_AT TRIGGERS
-- =====================================================

-- Trigger for training_templates
CREATE TRIGGER set_updated_at_training_templates
  BEFORE UPDATE ON training_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for training_sessions
CREATE TRIGGER set_updated_at_training_sessions
  BEFORE UPDATE ON training_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for training_attendance
CREATE TRIGGER set_updated_at_training_attendance
  BEFORE UPDATE ON training_attendance
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 6. ENABLE ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE training_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_attendance ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 7. CREATE RLS POLICIES - TRAINING_TEMPLATES
-- =====================================================

-- SELECT: Users can view templates for their team
CREATE POLICY "Users can view their team's training templates"
  ON training_templates
  FOR SELECT
  USING (
    team_id IN (
      SELECT id FROM teams WHERE created_by = auth.uid()
    )
  );

-- INSERT: Users can create templates for their team
CREATE POLICY "Users can create training templates for their team"
  ON training_templates
  FOR INSERT
  WITH CHECK (
    team_id IN (
      SELECT id FROM teams WHERE created_by = auth.uid()
    )
  );

-- UPDATE: Users can update their team's templates
CREATE POLICY "Users can update their team's training templates"
  ON training_templates
  FOR UPDATE
  USING (
    team_id IN (
      SELECT id FROM teams WHERE created_by = auth.uid()
    )
  );

-- DELETE: Users can delete their team's templates
CREATE POLICY "Users can delete their team's training templates"
  ON training_templates
  FOR DELETE
  USING (
    team_id IN (
      SELECT id FROM teams WHERE created_by = auth.uid()
    )
  );

-- =====================================================
-- 8. CREATE RLS POLICIES - TRAINING_SESSIONS
-- =====================================================

-- SELECT: Users can view sessions for their team (excluding soft-deleted)
CREATE POLICY "Users can view their team's training sessions"
  ON training_sessions
  FOR SELECT
  USING (
    team_id IN (
      SELECT id FROM teams WHERE created_by = auth.uid()
    )
    AND deleted_at IS NULL
  );

-- INSERT: Users can create sessions for their team
CREATE POLICY "Users can create training sessions for their team"
  ON training_sessions
  FOR INSERT
  WITH CHECK (
    team_id IN (
      SELECT id FROM teams WHERE created_by = auth.uid()
    )
  );

-- UPDATE: Users can update their team's sessions
CREATE POLICY "Users can update their team's training sessions"
  ON training_sessions
  FOR UPDATE
  USING (
    team_id IN (
      SELECT id FROM teams WHERE created_by = auth.uid()
    )
  );

-- DELETE: Users can delete their team's sessions (soft delete via UPDATE)
CREATE POLICY "Users can delete their team's training sessions"
  ON training_sessions
  FOR DELETE
  USING (
    team_id IN (
      SELECT id FROM teams WHERE created_by = auth.uid()
    )
  );

-- =====================================================
-- 9. CREATE RLS POLICIES - TRAINING_ATTENDANCE
-- =====================================================

-- SELECT: Users can view attendance for their team's sessions
CREATE POLICY "Users can view attendance for their team's sessions"
  ON training_attendance
  FOR SELECT
  USING (
    training_session_id IN (
      SELECT id FROM training_sessions
      WHERE team_id IN (
        SELECT id FROM teams WHERE created_by = auth.uid()
      )
    )
  );

-- INSERT: Users can create attendance records for their team's sessions
CREATE POLICY "Users can create attendance for their team's sessions"
  ON training_attendance
  FOR INSERT
  WITH CHECK (
    training_session_id IN (
      SELECT id FROM training_sessions
      WHERE team_id IN (
        SELECT id FROM teams WHERE created_by = auth.uid()
      )
    )
  );

-- UPDATE: Users can update attendance for their team's sessions
CREATE POLICY "Users can update attendance for their team's sessions"
  ON training_attendance
  FOR UPDATE
  USING (
    training_session_id IN (
      SELECT id FROM training_sessions
      WHERE team_id IN (
        SELECT id FROM teams WHERE created_by = auth.uid()
      )
    )
  );

-- DELETE: Users can delete attendance for their team's sessions
CREATE POLICY "Users can delete attendance for their team's sessions"
  ON training_attendance
  FOR DELETE
  USING (
    training_session_id IN (
      SELECT id FROM training_sessions
      WHERE team_id IN (
        SELECT id FROM teams WHERE created_by = auth.uid()
      )
    )
  );
