-- Migration: Update games table and add game_attendance for Epic 4
-- Epic: 4 - Game Management & Calendar Integration
-- Story: 4.1 Games Database Schema
-- Created: 2025-10-26

-- ====================
-- 1. Update games table to match Epic 4 requirements
-- ====================

-- Drop old RLS policies
DROP POLICY IF EXISTS "Users can view own games" ON games;
DROP POLICY IF EXISTS "Users can create games" ON games;
DROP POLICY IF EXISTS "Users can update own games" ON games;
DROP POLICY IF EXISTS "Users can delete own games" ON games;

-- Add team_id column (will be populated from coach_id via teams table)
ALTER TABLE games ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES teams(id) ON DELETE CASCADE;

-- Populate team_id from coach_id using teams table
UPDATE games
SET team_id = teams.id
FROM teams
WHERE games.coach_id = teams.created_by;

-- Make team_id NOT NULL after population
ALTER TABLE games ALTER COLUMN team_id SET NOT NULL;

-- Add new columns for Epic 4
ALTER TABLE games ADD COLUMN IF NOT EXISTS home_away TEXT CHECK (home_away IN ('home', 'away'));
ALTER TABLE games ADD COLUMN IF NOT EXISTS result TEXT CHECK (result IN ('win', 'draw', 'loss'));
ALTER TABLE games ADD COLUMN IF NOT EXISTS calendar_sync_id TEXT;
ALTER TABLE games ADD COLUMN IF NOT EXISTS is_protected BOOLEAN DEFAULT false NOT NULL;
ALTER TABLE games ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Rename score columns to match Epic 4 naming
ALTER TABLE games RENAME COLUMN our_score TO final_score_team;
ALTER TABLE games RENAME COLUMN opponent_score TO final_score_opponent;

-- Make score columns nullable (not set until game is completed)
ALTER TABLE games ALTER COLUMN final_score_team DROP DEFAULT;
ALTER TABLE games ALTER COLUMN final_score_opponent DROP DEFAULT;
ALTER TABLE games ALTER COLUMN final_score_team DROP NOT NULL;
ALTER TABLE games ALTER COLUMN final_score_opponent DROP NOT NULL;

-- Change date to TIMESTAMPTZ for full date+time support
ALTER TABLE games ALTER COLUMN date TYPE TIMESTAMPTZ USING (date::date + COALESCE(start_time::time, '00:00'::time));

-- Remove start_time column (now part of date)
ALTER TABLE games DROP COLUMN IF EXISTS start_time;

-- ====================
-- 2. Create game_attendance table
-- ====================

CREATE TABLE IF NOT EXISTS game_attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID REFERENCES games(id) ON DELETE CASCADE NOT NULL,
  player_id UUID REFERENCES players(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('attended', 'excused', 'absent')),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(game_id, player_id)
);

-- ====================
-- 3. Create indexes for performance
-- ====================

-- Games indexes
CREATE INDEX IF NOT EXISTS idx_games_team_date ON games(team_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_games_calendar_sync ON games(calendar_sync_id);
CREATE INDEX IF NOT EXISTS idx_games_status ON games(status);

-- Game attendance indexes
CREATE INDEX IF NOT EXISTS idx_game_attendance_game ON game_attendance(game_id);
CREATE INDEX IF NOT EXISTS idx_game_attendance_player ON game_attendance(player_id);

-- ====================
-- 4. Create triggers
-- ====================

-- Trigger to auto-set is_protected when attendance or goals exist
CREATE OR REPLACE FUNCTION set_game_protected()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if game has attendance records or scores recorded
  IF (SELECT COUNT(*) FROM game_attendance WHERE game_id = NEW.id) > 0
     OR (NEW.final_score_team IS NOT NULL AND NEW.final_score_opponent IS NOT NULL) THEN
    NEW.is_protected = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_game_protected
  BEFORE INSERT OR UPDATE ON games
  FOR EACH ROW
  EXECUTE FUNCTION set_game_protected();

-- Trigger to update game is_protected when attendance is added
CREATE OR REPLACE FUNCTION update_game_protected_on_attendance()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE games
  SET is_protected = true
  WHERE id = NEW.game_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_game_protected
  AFTER INSERT ON game_attendance
  FOR EACH ROW
  EXECUTE FUNCTION update_game_protected_on_attendance();

-- Updated_at trigger for game_attendance
CREATE TRIGGER update_game_attendance_updated_at
  BEFORE UPDATE ON game_attendance
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ====================
-- 5. Enable RLS and create policies
-- ====================

-- Enable RLS on game_attendance
ALTER TABLE game_attendance ENABLE ROW LEVEL SECURITY;

-- New RLS policies for games using team_id
CREATE POLICY "Users can view team games" ON games
  FOR SELECT
  USING (
    team_id IN (
      SELECT id FROM teams WHERE created_by = auth.uid()
    )
  );

CREATE POLICY "Users can create team games" ON games
  FOR INSERT
  WITH CHECK (
    team_id IN (
      SELECT id FROM teams WHERE created_by = auth.uid()
    )
  );

CREATE POLICY "Users can update team games" ON games
  FOR UPDATE
  USING (
    team_id IN (
      SELECT id FROM teams WHERE created_by = auth.uid()
    )
  );

CREATE POLICY "Users can delete team games" ON games
  FOR DELETE
  USING (
    team_id IN (
      SELECT id FROM teams WHERE created_by = auth.uid()
    )
  );

-- RLS policies for game_attendance (via join to games.team_id)
CREATE POLICY "Users can view team game attendance" ON game_attendance
  FOR SELECT
  USING (
    game_id IN (
      SELECT id FROM games WHERE team_id IN (
        SELECT id FROM teams WHERE created_by = auth.uid()
      )
    )
  );

CREATE POLICY "Users can create team game attendance" ON game_attendance
  FOR INSERT
  WITH CHECK (
    game_id IN (
      SELECT id FROM games WHERE team_id IN (
        SELECT id FROM teams WHERE created_by = auth.uid()
      )
    )
  );

CREATE POLICY "Users can update team game attendance" ON game_attendance
  FOR UPDATE
  USING (
    game_id IN (
      SELECT id FROM games WHERE team_id IN (
        SELECT id FROM teams WHERE created_by = auth.uid()
      )
    )
  );

CREATE POLICY "Users can delete team game attendance" ON game_attendance
  FOR DELETE
  USING (
    game_id IN (
      SELECT id FROM games WHERE team_id IN (
        SELECT id FROM teams WHERE created_by = auth.uid()
      )
    )
  );

-- ====================
-- 6. Clean up old columns (optional, can be kept for compatibility)
-- ====================

-- Keep coach_id for now to avoid breaking existing queries
-- TODO: Remove coach_id in future migration after all queries updated
