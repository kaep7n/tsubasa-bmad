-- Migration: Create Goals Schema (Story 5.1)
-- Creates tables for goals, goal_assists, and opponent_goals with RLS policies

-- ============================================================================
-- Table: goals
-- ============================================================================
CREATE TABLE IF NOT EXISTS goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  scored_at_minute INTEGER NOT NULL CHECK (scored_at_minute >= 0 AND scored_at_minute <= 120),
  scored_at_timestamp TIMESTAMPTZ NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  sync_state TEXT NOT NULL DEFAULT 'synced' CHECK (sync_state IN ('pending', 'syncing', 'synced', 'error'))
);

-- ============================================================================
-- Table: goal_assists
-- ============================================================================
CREATE TABLE IF NOT EXISTS goal_assists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sync_state TEXT NOT NULL DEFAULT 'synced' CHECK (sync_state IN ('pending', 'syncing', 'synced', 'error')),
  UNIQUE(goal_id, player_id) -- Prevent duplicate assists for same goal
);

-- ============================================================================
-- Table: opponent_goals
-- ============================================================================
CREATE TABLE IF NOT EXISTS opponent_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  scored_at_minute INTEGER NOT NULL CHECK (scored_at_minute >= 0 AND scored_at_minute <= 120),
  scored_at_timestamp TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  sync_state TEXT NOT NULL DEFAULT 'synced' CHECK (sync_state IN ('pending', 'syncing', 'synced', 'error'))
);

-- ============================================================================
-- Indexes for Performance
-- ============================================================================

-- Chronological queries for goals timeline
CREATE INDEX IF NOT EXISTS idx_goals_game_minute ON goals(game_id, scored_at_minute);
CREATE INDEX IF NOT EXISTS idx_goals_timestamp ON goals(scored_at_timestamp);
CREATE INDEX IF NOT EXISTS idx_goals_player ON goals(player_id);

-- Assist lookups
CREATE INDEX IF NOT EXISTS idx_goal_assists_goal ON goal_assists(goal_id);
CREATE INDEX IF NOT EXISTS idx_goal_assists_player ON goal_assists(player_id);

-- Opponent goals timeline
CREATE INDEX IF NOT EXISTS idx_opponent_goals_game_minute ON opponent_goals(game_id, scored_at_minute);
CREATE INDEX IF NOT EXISTS idx_opponent_goals_timestamp ON opponent_goals(scored_at_timestamp);

-- ============================================================================
-- Row Level Security (RLS) Policies
-- ============================================================================

-- Enable RLS
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE goal_assists ENABLE ROW LEVEL SECURITY;
ALTER TABLE opponent_goals ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS Policies: goals
-- ============================================================================

-- SELECT: User can view goals for their team's games
CREATE POLICY "goals_select" ON goals FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM games
    JOIN team_members ON team_members.team_id = games.team_id
    WHERE games.id = goals.game_id
    AND team_members.user_id = auth.uid()
  )
);

-- INSERT: User can add goals for their team's games
CREATE POLICY "goals_insert" ON goals FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM games
    JOIN team_members ON team_members.team_id = games.team_id
    WHERE games.id = goals.game_id
    AND team_members.user_id = auth.uid()
  )
);

-- UPDATE: User can update goals for their team's games
CREATE POLICY "goals_update" ON goals FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM games
    JOIN team_members ON team_members.team_id = games.team_id
    WHERE games.id = goals.game_id
    AND team_members.user_id = auth.uid()
  )
);

-- DELETE: User can delete goals for their team's games
CREATE POLICY "goals_delete" ON goals FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM games
    JOIN team_members ON team_members.team_id = games.team_id
    WHERE games.id = goals.game_id
    AND team_members.user_id = auth.uid()
  )
);

-- ============================================================================
-- RLS Policies: goal_assists
-- ============================================================================

-- SELECT: User can view assists for their team's goals
CREATE POLICY "goal_assists_select" ON goal_assists FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM goals
    JOIN games ON games.id = goals.game_id
    JOIN team_members ON team_members.team_id = games.team_id
    WHERE goals.id = goal_assists.goal_id
    AND team_members.user_id = auth.uid()
  )
);

-- INSERT: User can add assists for their team's goals
CREATE POLICY "goal_assists_insert" ON goal_assists FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM goals
    JOIN games ON games.id = goals.game_id
    JOIN team_members ON team_members.team_id = games.team_id
    WHERE goals.id = goal_assists.goal_id
    AND team_members.user_id = auth.uid()
  )
);

-- UPDATE: User can update assists for their team's goals
CREATE POLICY "goal_assists_update" ON goal_assists FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM goals
    JOIN games ON games.id = goals.game_id
    JOIN team_members ON team_members.team_id = games.team_id
    WHERE goals.id = goal_assists.goal_id
    AND team_members.user_id = auth.uid()
  )
);

-- DELETE: User can delete assists for their team's goals
CREATE POLICY "goal_assists_delete" ON goal_assists FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM goals
    JOIN games ON games.id = goals.game_id
    JOIN team_members ON team_members.team_id = games.team_id
    WHERE goals.id = goal_assists.goal_id
    AND team_members.user_id = auth.uid()
  )
);

-- ============================================================================
-- RLS Policies: opponent_goals
-- ============================================================================

-- SELECT: User can view opponent goals for their team's games
CREATE POLICY "opponent_goals_select" ON opponent_goals FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM games
    JOIN team_members ON team_members.team_id = games.team_id
    WHERE games.id = opponent_goals.game_id
    AND team_members.user_id = auth.uid()
  )
);

-- INSERT: User can add opponent goals for their team's games
CREATE POLICY "opponent_goals_insert" ON opponent_goals FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM games
    JOIN team_members ON team_members.team_id = games.team_id
    WHERE games.id = opponent_goals.game_id
    AND team_members.user_id = auth.uid()
  )
);

-- UPDATE: User can update opponent goals for their team's games
CREATE POLICY "opponent_goals_update" ON opponent_goals FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM games
    JOIN team_members ON team_members.team_id = games.team_id
    WHERE games.id = opponent_goals.game_id
    AND team_members.user_id = auth.uid()
  )
);

-- DELETE: User can delete opponent goals for their team's games
CREATE POLICY "opponent_goals_delete" ON opponent_goals FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM games
    JOIN team_members ON team_members.team_id = games.team_id
    WHERE games.id = opponent_goals.game_id
    AND team_members.user_id = auth.uid()
  )
);

-- ============================================================================
-- Trigger: Update updated_at timestamp
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER goals_updated_at
  BEFORE UPDATE ON goals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER opponent_goals_updated_at
  BEFORE UPDATE ON opponent_goals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
