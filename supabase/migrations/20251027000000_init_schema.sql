-- =================================================================
-- Tsubasa Database Schema - Consolidated Init Migration
-- =================================================================
-- Created: 2025-10-27
-- Purpose: Single consolidated migration for all database tables
-- Replaces: 6 legacy migrations with conflicts and inconsistencies
--
-- This migration creates the complete database schema including:
-- - Core: teams, players
-- - Games: games, game_attendance, goals, goal_assists, opponent_goals
-- - Training: training_templates, training_sessions, training_attendance
--
-- All tables use team_id pattern (not coach_id)
-- All RLS policies use: SELECT id FROM teams WHERE created_by = auth.uid()
-- =================================================================

-- =================================================================
-- PART 1: UTILITY FUNCTIONS
-- =================================================================

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =================================================================
-- PART 2: CORE TABLES (teams, players)
-- =================================================================

-- -----------------------------------------------------------------
-- Table: teams
-- -----------------------------------------------------------------
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  season TEXT,
  logo_url TEXT,
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

COMMENT ON TABLE teams IS 'Soccer teams managed by coaches';

-- Index for RLS performance
CREATE INDEX idx_teams_created_by ON teams(created_by);

-- Enable RLS
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;

-- RLS Policies for teams
CREATE POLICY "Users can view own teams" ON teams
  FOR SELECT
  USING (auth.uid() = created_by);

CREATE POLICY "Users can create teams" ON teams
  FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update own teams" ON teams
  FOR UPDATE
  USING (auth.uid() = created_by);

CREATE POLICY "Users can delete own teams" ON teams
  FOR DELETE
  USING (auth.uid() = created_by);

-- -----------------------------------------------------------------
-- Table: players
-- -----------------------------------------------------------------
CREATE TABLE players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  date_of_birth DATE,
  jersey_number INTEGER CHECK (jersey_number >= 0 AND jersey_number <= 99),
  photo_url TEXT,
  squad TEXT CHECK (squad IN ('starters', 'substitutes')),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  deleted_at TIMESTAMPTZ
);

COMMENT ON TABLE players IS 'Players belonging to teams';

-- Indexes for players
CREATE INDEX idx_players_team_active ON players(team_id, deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX idx_players_jersey_number ON players(team_id, jersey_number) WHERE deleted_at IS NULL;
CREATE INDEX idx_players_names ON players(first_name, last_name);

-- Enable RLS
ALTER TABLE players ENABLE ROW LEVEL SECURITY;

-- RLS Policies for players
CREATE POLICY "Users can view their team's players" ON players
  FOR SELECT
  USING (
    team_id IN (SELECT id FROM teams WHERE created_by = auth.uid())
  );

CREATE POLICY "Users can insert players to their team" ON players
  FOR INSERT
  WITH CHECK (
    team_id IN (SELECT id FROM teams WHERE created_by = auth.uid())
  );

CREATE POLICY "Users can update their team's players" ON players
  FOR UPDATE
  USING (
    team_id IN (SELECT id FROM teams WHERE created_by = auth.uid())
  );

CREATE POLICY "Users can delete their team's players" ON players
  FOR DELETE
  USING (
    team_id IN (SELECT id FROM teams WHERE created_by = auth.uid())
  );

-- =================================================================
-- PART 3: GAMES SCHEMA
-- =================================================================

-- -----------------------------------------------------------------
-- Table: games
-- -----------------------------------------------------------------
CREATE TABLE games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE NOT NULL,
  date TIMESTAMPTZ NOT NULL,
  opponent TEXT NOT NULL,
  location TEXT,
  home_away TEXT CHECK (home_away IN ('home', 'away')),
  status TEXT CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')) DEFAULT 'scheduled',
  final_score_team INTEGER,
  final_score_opponent INTEGER,
  result TEXT CHECK (result IN ('win', 'draw', 'loss')),
  calendar_sync_id TEXT,
  is_protected BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  deleted_at TIMESTAMPTZ
);

COMMENT ON TABLE games IS 'Games/matches with scores and status';

-- Indexes for games
CREATE INDEX idx_games_team_date ON games(team_id, date DESC);
CREATE INDEX idx_games_calendar_sync ON games(calendar_sync_id);
CREATE INDEX idx_games_status ON games(status);
CREATE INDEX idx_games_deleted ON games(team_id, deleted_at) WHERE deleted_at IS NULL;

-- Enable RLS
ALTER TABLE games ENABLE ROW LEVEL SECURITY;

-- RLS Policies for games
CREATE POLICY "Users can view team games" ON games
  FOR SELECT
  USING (
    team_id IN (SELECT id FROM teams WHERE created_by = auth.uid())
  );

CREATE POLICY "Users can create team games" ON games
  FOR INSERT
  WITH CHECK (
    team_id IN (SELECT id FROM teams WHERE created_by = auth.uid())
  );

CREATE POLICY "Users can update team games" ON games
  FOR UPDATE
  USING (
    team_id IN (SELECT id FROM teams WHERE created_by = auth.uid())
  );

CREATE POLICY "Users can delete team games" ON games
  FOR DELETE
  USING (
    team_id IN (SELECT id FROM teams WHERE created_by = auth.uid())
  );

-- -----------------------------------------------------------------
-- Table: game_attendance
-- -----------------------------------------------------------------
CREATE TABLE game_attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID REFERENCES games(id) ON DELETE CASCADE NOT NULL,
  player_id UUID REFERENCES players(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('attended', 'excused', 'absent')),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(game_id, player_id)
);

COMMENT ON TABLE game_attendance IS 'Player attendance for games';

-- Indexes for game_attendance
CREATE INDEX idx_game_attendance_game ON game_attendance(game_id);
CREATE INDEX idx_game_attendance_player ON game_attendance(player_id);

-- Enable RLS
ALTER TABLE game_attendance ENABLE ROW LEVEL SECURITY;

-- RLS Policies for game_attendance
CREATE POLICY "Users can view team game attendance" ON game_attendance
  FOR SELECT
  USING (
    game_id IN (
      SELECT id FROM games
      WHERE team_id IN (SELECT id FROM teams WHERE created_by = auth.uid())
    )
  );

CREATE POLICY "Users can create team game attendance" ON game_attendance
  FOR INSERT
  WITH CHECK (
    game_id IN (
      SELECT id FROM games
      WHERE team_id IN (SELECT id FROM teams WHERE created_by = auth.uid())
    )
  );

CREATE POLICY "Users can update team game attendance" ON game_attendance
  FOR UPDATE
  USING (
    game_id IN (
      SELECT id FROM games
      WHERE team_id IN (SELECT id FROM teams WHERE created_by = auth.uid())
    )
  );

CREATE POLICY "Users can delete team game attendance" ON game_attendance
  FOR DELETE
  USING (
    game_id IN (
      SELECT id FROM games
      WHERE team_id IN (SELECT id FROM teams WHERE created_by = auth.uid())
    )
  );

-- -----------------------------------------------------------------
-- Table: goals
-- -----------------------------------------------------------------
CREATE TABLE goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  scored_at_minute INTEGER NOT NULL CHECK (scored_at_minute >= 0 AND scored_at_minute <= 120),
  scored_at_timestamp TIMESTAMPTZ NOT NULL,
  notes TEXT,
  sync_state TEXT NOT NULL DEFAULT 'synced' CHECK (sync_state IN ('pending', 'syncing', 'synced', 'error')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

COMMENT ON TABLE goals IS 'Goals scored by team players';

-- Indexes for goals
CREATE INDEX idx_goals_game_minute ON goals(game_id, scored_at_minute);
CREATE INDEX idx_goals_timestamp ON goals(scored_at_timestamp);
CREATE INDEX idx_goals_player ON goals(player_id);

-- Enable RLS
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;

-- RLS Policies for goals
CREATE POLICY "goals_select" ON goals FOR SELECT
USING (
  game_id IN (
    SELECT id FROM games
    WHERE team_id IN (SELECT id FROM teams WHERE created_by = auth.uid())
  )
);

CREATE POLICY "goals_insert" ON goals FOR INSERT
WITH CHECK (
  game_id IN (
    SELECT id FROM games
    WHERE team_id IN (SELECT id FROM teams WHERE created_by = auth.uid())
  )
);

CREATE POLICY "goals_update" ON goals FOR UPDATE
USING (
  game_id IN (
    SELECT id FROM games
    WHERE team_id IN (SELECT id FROM teams WHERE created_by = auth.uid())
  )
);

CREATE POLICY "goals_delete" ON goals FOR DELETE
USING (
  game_id IN (
    SELECT id FROM games
    WHERE team_id IN (SELECT id FROM teams WHERE created_by = auth.uid())
  )
);

-- -----------------------------------------------------------------
-- Table: goal_assists
-- -----------------------------------------------------------------
CREATE TABLE goal_assists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  sync_state TEXT NOT NULL DEFAULT 'synced' CHECK (sync_state IN ('pending', 'syncing', 'synced', 'error')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(goal_id, player_id)
);

COMMENT ON TABLE goal_assists IS 'Assists for goals';

-- Indexes for goal_assists
CREATE INDEX idx_goal_assists_goal ON goal_assists(goal_id);
CREATE INDEX idx_goal_assists_player ON goal_assists(player_id);

-- Enable RLS
ALTER TABLE goal_assists ENABLE ROW LEVEL SECURITY;

-- RLS Policies for goal_assists
CREATE POLICY "goal_assists_select" ON goal_assists FOR SELECT
USING (
  goal_id IN (
    SELECT id FROM goals
    WHERE game_id IN (
      SELECT id FROM games
      WHERE team_id IN (SELECT id FROM teams WHERE created_by = auth.uid())
    )
  )
);

CREATE POLICY "goal_assists_insert" ON goal_assists FOR INSERT
WITH CHECK (
  goal_id IN (
    SELECT id FROM goals
    WHERE game_id IN (
      SELECT id FROM games
      WHERE team_id IN (SELECT id FROM teams WHERE created_by = auth.uid())
    )
  )
);

CREATE POLICY "goal_assists_update" ON goal_assists FOR UPDATE
USING (
  goal_id IN (
    SELECT id FROM goals
    WHERE game_id IN (
      SELECT id FROM games
      WHERE team_id IN (SELECT id FROM teams WHERE created_by = auth.uid())
    )
  )
);

CREATE POLICY "goal_assists_delete" ON goal_assists FOR DELETE
USING (
  goal_id IN (
    SELECT id FROM goals
    WHERE game_id IN (
      SELECT id FROM games
      WHERE team_id IN (SELECT id FROM teams WHERE created_by = auth.uid())
    )
  )
);

-- -----------------------------------------------------------------
-- Table: opponent_goals
-- -----------------------------------------------------------------
CREATE TABLE opponent_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  scored_at_minute INTEGER NOT NULL CHECK (scored_at_minute >= 0 AND scored_at_minute <= 120),
  scored_at_timestamp TIMESTAMPTZ NOT NULL,
  sync_state TEXT NOT NULL DEFAULT 'synced' CHECK (sync_state IN ('pending', 'syncing', 'synced', 'error')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

COMMENT ON TABLE opponent_goals IS 'Goals scored by opponents';

-- Indexes for opponent_goals
CREATE INDEX idx_opponent_goals_game_minute ON opponent_goals(game_id, scored_at_minute);
CREATE INDEX idx_opponent_goals_timestamp ON opponent_goals(scored_at_timestamp);

-- Enable RLS
ALTER TABLE opponent_goals ENABLE ROW LEVEL SECURITY;

-- RLS Policies for opponent_goals
CREATE POLICY "opponent_goals_select" ON opponent_goals FOR SELECT
USING (
  game_id IN (
    SELECT id FROM games
    WHERE team_id IN (SELECT id FROM teams WHERE created_by = auth.uid())
  )
);

CREATE POLICY "opponent_goals_insert" ON opponent_goals FOR INSERT
WITH CHECK (
  game_id IN (
    SELECT id FROM games
    WHERE team_id IN (SELECT id FROM teams WHERE created_by = auth.uid())
  )
);

CREATE POLICY "opponent_goals_update" ON opponent_goals FOR UPDATE
USING (
  game_id IN (
    SELECT id FROM games
    WHERE team_id IN (SELECT id FROM teams WHERE created_by = auth.uid())
  )
);

CREATE POLICY "opponent_goals_delete" ON opponent_goals FOR DELETE
USING (
  game_id IN (
    SELECT id FROM games
    WHERE team_id IN (SELECT id FROM teams WHERE created_by = auth.uid())
  )
);

-- =================================================================
-- PART 4: TRAINING SCHEMA
-- =================================================================

-- -----------------------------------------------------------------
-- Table: training_templates
-- -----------------------------------------------------------------
CREATE TABLE training_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  default_duration_minutes INTEGER DEFAULT 90 CHECK (default_duration_minutes > 0),
  default_location TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

COMMENT ON TABLE training_templates IS 'Reusable templates for recurring training sessions';

-- Enable RLS
ALTER TABLE training_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for training_templates
CREATE POLICY "Users can view their team's training templates"
  ON training_templates
  FOR SELECT
  USING (
    team_id IN (SELECT id FROM teams WHERE created_by = auth.uid())
  );

CREATE POLICY "Users can create training templates for their team"
  ON training_templates
  FOR INSERT
  WITH CHECK (
    team_id IN (SELECT id FROM teams WHERE created_by = auth.uid())
  );

CREATE POLICY "Users can update their team's training templates"
  ON training_templates
  FOR UPDATE
  USING (
    team_id IN (SELECT id FROM teams WHERE created_by = auth.uid())
  );

CREATE POLICY "Users can delete their team's training templates"
  ON training_templates
  FOR DELETE
  USING (
    team_id IN (SELECT id FROM teams WHERE created_by = auth.uid())
  );

-- -----------------------------------------------------------------
-- Table: training_sessions
-- -----------------------------------------------------------------
CREATE TABLE training_sessions (
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

COMMENT ON TABLE training_sessions IS 'Individual training sessions with attendance tracking';

-- Indexes for training_sessions
CREATE INDEX idx_training_sessions_team_date
  ON training_sessions(team_id, date DESC);

CREATE INDEX idx_training_sessions_template
  ON training_sessions(session_template_id)
  WHERE session_template_id IS NOT NULL;

CREATE INDEX idx_training_sessions_deleted
  ON training_sessions(team_id, deleted_at)
  WHERE deleted_at IS NULL;

-- Enable RLS
ALTER TABLE training_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for training_sessions
CREATE POLICY "Users can view their team's training sessions"
  ON training_sessions
  FOR SELECT
  USING (
    team_id IN (SELECT id FROM teams WHERE created_by = auth.uid())
    AND deleted_at IS NULL
  );

CREATE POLICY "Users can create training sessions for their team"
  ON training_sessions
  FOR INSERT
  WITH CHECK (
    team_id IN (SELECT id FROM teams WHERE created_by = auth.uid())
  );

CREATE POLICY "Users can update their team's training sessions"
  ON training_sessions
  FOR UPDATE
  USING (
    team_id IN (SELECT id FROM teams WHERE created_by = auth.uid())
  );

CREATE POLICY "Users can delete their team's training sessions"
  ON training_sessions
  FOR DELETE
  USING (
    team_id IN (SELECT id FROM teams WHERE created_by = auth.uid())
  );

-- -----------------------------------------------------------------
-- Table: training_attendance
-- -----------------------------------------------------------------
CREATE TABLE training_attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  training_session_id UUID REFERENCES training_sessions(id) ON DELETE CASCADE NOT NULL,
  player_id UUID REFERENCES players(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('attended', 'excused', 'absent')),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(training_session_id, player_id)
);

COMMENT ON TABLE training_attendance IS 'Player attendance records for training sessions';

-- Indexes for training_attendance
CREATE INDEX idx_training_attendance_session
  ON training_attendance(training_session_id);

CREATE INDEX idx_training_attendance_player
  ON training_attendance(player_id);

CREATE INDEX idx_training_attendance_status
  ON training_attendance(player_id, status);

-- Enable RLS
ALTER TABLE training_attendance ENABLE ROW LEVEL SECURITY;

-- RLS Policies for training_attendance
CREATE POLICY "Users can view attendance for their team's sessions"
  ON training_attendance
  FOR SELECT
  USING (
    training_session_id IN (
      SELECT id FROM training_sessions
      WHERE team_id IN (SELECT id FROM teams WHERE created_by = auth.uid())
    )
  );

CREATE POLICY "Users can create attendance for their team's sessions"
  ON training_attendance
  FOR INSERT
  WITH CHECK (
    training_session_id IN (
      SELECT id FROM training_sessions
      WHERE team_id IN (SELECT id FROM teams WHERE created_by = auth.uid())
    )
  );

CREATE POLICY "Users can update attendance for their team's sessions"
  ON training_attendance
  FOR UPDATE
  USING (
    training_session_id IN (
      SELECT id FROM training_sessions
      WHERE team_id IN (SELECT id FROM teams WHERE created_by = auth.uid())
    )
  );

CREATE POLICY "Users can delete attendance for their team's sessions"
  ON training_attendance
  FOR DELETE
  USING (
    training_session_id IN (
      SELECT id FROM training_sessions
      WHERE team_id IN (SELECT id FROM teams WHERE created_by = auth.uid())
    )
  );

-- =================================================================
-- PART 5: TRIGGERS
-- =================================================================

-- Teams
CREATE TRIGGER update_teams_updated_at
  BEFORE UPDATE ON teams
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Players
CREATE TRIGGER update_players_updated_at
  BEFORE UPDATE ON players
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Games
CREATE TRIGGER update_games_updated_at
  BEFORE UPDATE ON games
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Game attendance
CREATE TRIGGER update_game_attendance_updated_at
  BEFORE UPDATE ON game_attendance
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Goals
CREATE TRIGGER goals_updated_at
  BEFORE UPDATE ON goals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Opponent goals
CREATE TRIGGER opponent_goals_updated_at
  BEFORE UPDATE ON opponent_goals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Training templates
CREATE TRIGGER set_updated_at_training_templates
  BEFORE UPDATE ON training_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Training sessions
CREATE TRIGGER set_updated_at_training_sessions
  BEFORE UPDATE ON training_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Training attendance
CREATE TRIGGER set_updated_at_training_attendance
  BEFORE UPDATE ON training_attendance
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =================================================================
-- PART 6: CUSTOM TRIGGERS FOR BUSINESS LOGIC
-- =================================================================

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

-- =================================================================
-- MIGRATION COMPLETE
-- =================================================================
-- Tables created: 10
--   Core: teams, players
--   Games: games, game_attendance, goals, goal_assists, opponent_goals
--   Training: training_templates, training_sessions, training_attendance
--
-- RLS policies: 40 (4 per table × 10 tables)
-- Indexes: 23
-- Triggers: 11 (9 updated_at + 2 business logic)
--
-- All tables use team_id pattern (not coach_id)
-- All RLS policies use: SELECT id FROM teams WHERE created_by = auth.uid()
-- =================================================================
