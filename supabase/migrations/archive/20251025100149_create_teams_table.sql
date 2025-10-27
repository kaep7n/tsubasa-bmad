-- Create teams table
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  season TEXT,
  logo_url TEXT,
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Add index on created_by for RLS performance
CREATE INDEX idx_teams_created_by ON teams(created_by);

-- Create function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update updated_at
CREATE TRIGGER update_teams_updated_at
  BEFORE UPDATE ON teams
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- SELECT: Users can only see their own teams
CREATE POLICY "Users can view own teams" ON teams
  FOR SELECT
  USING (auth.uid() = created_by);

-- INSERT: Users can create teams with their user_id
CREATE POLICY "Users can create teams" ON teams
  FOR INSERT
  WITH CHECK (auth.uid() = created_by);

-- UPDATE: Users can only update their own teams
CREATE POLICY "Users can update own teams" ON teams
  FOR UPDATE
  USING (auth.uid() = created_by);

-- DELETE: Users can only delete their own teams
CREATE POLICY "Users can delete own teams" ON teams
  FOR DELETE
  USING (auth.uid() = created_by);
