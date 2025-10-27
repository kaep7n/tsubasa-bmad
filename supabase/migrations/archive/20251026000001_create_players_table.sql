-- Migration: Create players table
-- Story: 2.1 Player Database Schema
-- Created: 2025-10-26

-- Create players table
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

-- Create indexes for performance
-- Composite index for active players by team
CREATE INDEX idx_players_team_active ON players(team_id, deleted_at) WHERE deleted_at IS NULL;

-- Index for jersey number lookups within team
CREATE INDEX idx_players_jersey_number ON players(team_id, jersey_number) WHERE deleted_at IS NULL;

-- Index for player name searches
CREATE INDEX idx_players_names ON players(first_name, last_name);

-- Create trigger to auto-update updated_at
CREATE TRIGGER update_players_updated_at
  BEFORE UPDATE ON players
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE players ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- SELECT: Users can only see players from their team
CREATE POLICY "Users can view their team's players" ON players
  FOR SELECT
  USING (
    team_id IN (SELECT id FROM teams WHERE created_by = auth.uid())
  );

-- INSERT: Users can only insert players to their team
CREATE POLICY "Users can insert players to their team" ON players
  FOR INSERT
  WITH CHECK (
    team_id IN (SELECT id FROM teams WHERE created_by = auth.uid())
  );

-- UPDATE: Users can only update players from their team
CREATE POLICY "Users can update their team's players" ON players
  FOR UPDATE
  USING (
    team_id IN (SELECT id FROM teams WHERE created_by = auth.uid())
  );

-- DELETE: Users can only delete players from their team (soft delete)
CREATE POLICY "Users can delete their team's players" ON players
  FOR DELETE
  USING (
    team_id IN (SELECT id FROM teams WHERE created_by = auth.uid())
  );