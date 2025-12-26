-- OmosaBall Database Schema
-- Run this in your Supabase SQL Editor

-- 1. PROFILES TABLE (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  preferred_position TEXT NOT NULL CHECK (preferred_position IN ('defender', 'midfielder', 'attacker')),
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. GAMES TABLE
CREATE TABLE IF NOT EXISTS games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  time TIME NOT NULL DEFAULT '22:45', -- 10:45 PM arrival time
  location TEXT DEFAULT 'Default Field',
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'cancelled', 'completed')),
  max_players INTEGER DEFAULT 40, -- 4 teams x 10 players
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. RSVPS TABLE (player responses to games)
CREATE TABLE IF NOT EXISTS rsvps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'declined', 'waitlist')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(game_id, player_id)
);

-- 4. TEAMS TABLE (team assignments for a specific game)
CREATE TABLE IF NOT EXISTS teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  color TEXT NOT NULL CHECK (color IN ('red', 'white', 'blue', 'black')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(game_id, color)
);

-- 5. TEAM_ASSIGNMENTS TABLE (players assigned to teams)
CREATE TABLE IF NOT EXISTS team_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  position_slot TEXT CHECK (position_slot IN ('defender', 'midfielder', 'attacker')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(team_id, player_id)
);

-- 6. ADMIN_SETTINGS TABLE (simple admin password storage)
CREATE TABLE IF NOT EXISTS admin_settings (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1), -- Single row
  password_hash TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. RECURRING_SCHEDULE TABLE (for auto-scheduling)
CREATE TABLE IF NOT EXISTS recurring_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  day_of_week INTEGER NOT NULL CHECK (day_of_week IN (2, 4)), -- 2=Tuesday, 4=Thursday
  time TIME NOT NULL DEFAULT '22:45',
  location TEXT DEFAULT 'Default Field',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_rsvps_game_id ON rsvps(game_id);
CREATE INDEX IF NOT EXISTS idx_rsvps_player_id ON rsvps(player_id);
CREATE INDEX IF NOT EXISTS idx_games_date ON games(date);
CREATE INDEX IF NOT EXISTS idx_games_status ON games(status);
CREATE INDEX IF NOT EXISTS idx_team_assignments_team_id ON team_assignments(team_id);
CREATE INDEX IF NOT EXISTS idx_team_assignments_player_id ON team_assignments(player_id);

-- ROW LEVEL SECURITY
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE rsvps ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_schedule ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Games policies
CREATE POLICY "Games are viewable by everyone" ON games FOR SELECT USING (true);
CREATE POLICY "Service role can manage games" ON games FOR ALL USING (true);

-- RSVPs policies
CREATE POLICY "RSVPs are viewable by everyone" ON rsvps FOR SELECT USING (true);
CREATE POLICY "Users can insert own RSVP" ON rsvps FOR INSERT WITH CHECK (auth.uid() = player_id);
CREATE POLICY "Users can update own RSVP" ON rsvps FOR UPDATE USING (auth.uid() = player_id);
CREATE POLICY "Users can delete own RSVP" ON rsvps FOR DELETE USING (auth.uid() = player_id);

-- Teams policies
CREATE POLICY "Teams are viewable by everyone" ON teams FOR SELECT USING (true);
CREATE POLICY "Service role can manage teams" ON teams FOR ALL USING (true);

-- Team assignments policies
CREATE POLICY "Team assignments are viewable by everyone" ON team_assignments FOR SELECT USING (true);
CREATE POLICY "Service role can manage team assignments" ON team_assignments FOR ALL USING (true);

-- Admin settings policies (only service role)
CREATE POLICY "Admin settings are private" ON admin_settings FOR ALL USING (false);

-- Recurring schedule policies
CREATE POLICY "Recurring schedule is viewable by everyone" ON recurring_schedule FOR SELECT USING (true);
CREATE POLICY "Service role can manage recurring schedule" ON recurring_schedule FOR ALL USING (true);

-- TRIGGER: Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, preferred_position)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Unknown'),
    COALESCE(NEW.raw_user_meta_data->>'preferred_position', 'midfielder')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- SEED: Insert default recurring schedule
INSERT INTO recurring_schedule (day_of_week, time, location, is_active)
VALUES
  (2, '22:45', 'Default Field', true),  -- Tuesday
  (4, '22:45', 'Default Field', true)   -- Thursday
ON CONFLICT DO NOTHING;
