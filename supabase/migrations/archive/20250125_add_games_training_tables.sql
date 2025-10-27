-- Migration: Add games and training_sessions tables
-- Story: 1.6 Dashboard Home Screen
-- Created: 2025-01-25

-- Create games table
CREATE TABLE games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID REFERENCES auth.users(id) NOT NULL,
  date DATE NOT NULL,
  start_time TEXT,
  opponent TEXT NOT NULL,
  location TEXT,
  status TEXT CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')) DEFAULT 'scheduled',
  our_score INTEGER DEFAULT 0,
  opponent_score INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create training_sessions table
CREATE TABLE training_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID REFERENCES auth.users(id) NOT NULL,
  date DATE NOT NULL,
  start_time TEXT NOT NULL,
  duration_minutes INTEGER,
  location TEXT,
  status TEXT CHECK (status IN ('scheduled', 'completed', 'cancelled')) DEFAULT 'scheduled',
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS on games table
ALTER TABLE games ENABLE ROW LEVEL SECURITY;

-- RLS Policies for games
CREATE POLICY "Users can view own games" ON games
  FOR SELECT USING (auth.uid() = coach_id);

CREATE POLICY "Users can create games" ON games
  FOR INSERT WITH CHECK (auth.uid() = coach_id);

CREATE POLICY "Users can update own games" ON games
  FOR UPDATE USING (auth.uid() = coach_id);

CREATE POLICY "Users can delete own games" ON games
  FOR DELETE USING (auth.uid() = coach_id);

-- Enable RLS on training_sessions table
ALTER TABLE training_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for training_sessions
CREATE POLICY "Users can view own training" ON training_sessions
  FOR SELECT USING (auth.uid() = coach_id);

CREATE POLICY "Users can create training" ON training_sessions
  FOR INSERT WITH CHECK (auth.uid() = coach_id);

CREATE POLICY "Users can update own training" ON training_sessions
  FOR UPDATE USING (auth.uid() = coach_id);

CREATE POLICY "Users can delete own training" ON training_sessions
  FOR DELETE USING (auth.uid() = coach_id);

-- Indexes for performance
CREATE INDEX idx_games_coach_id ON games(coach_id);
CREATE INDEX idx_games_date ON games(date);
CREATE INDEX idx_games_status ON games(status);

CREATE INDEX idx_training_coach_id ON training_sessions(coach_id);
CREATE INDEX idx_training_date ON training_sessions(date);

-- Add updated_at trigger for games
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_games_updated_at
  BEFORE UPDATE ON games
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_training_sessions_updated_at
  BEFORE UPDATE ON training_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();