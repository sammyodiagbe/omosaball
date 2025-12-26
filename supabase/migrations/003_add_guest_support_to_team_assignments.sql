-- Allow guest players to be assigned to teams
-- Make player_id nullable and add rsvp_id for guest reference

-- Drop the existing foreign key constraint
ALTER TABLE team_assignments DROP CONSTRAINT IF EXISTS team_assignments_player_id_fkey;

-- Make player_id nullable
ALTER TABLE team_assignments ALTER COLUMN player_id DROP NOT NULL;

-- Add rsvp_id column for guest players
ALTER TABLE team_assignments ADD COLUMN rsvp_id UUID REFERENCES rsvps(id) ON DELETE CASCADE;

-- Re-add the foreign key constraint (now allows null)
ALTER TABLE team_assignments ADD CONSTRAINT team_assignments_player_id_fkey
  FOREIGN KEY (player_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Add check constraint: either player_id or rsvp_id must be set
ALTER TABLE team_assignments ADD CONSTRAINT team_assignments_player_or_rsvp_check
  CHECK (player_id IS NOT NULL OR rsvp_id IS NOT NULL);

-- Update unique constraint to handle both cases
ALTER TABLE team_assignments DROP CONSTRAINT IF EXISTS team_assignments_team_id_player_id_key;
CREATE UNIQUE INDEX team_assignments_team_player_unique ON team_assignments (team_id, player_id) WHERE player_id IS NOT NULL;
CREATE UNIQUE INDEX team_assignments_team_rsvp_unique ON team_assignments (team_id, rsvp_id) WHERE rsvp_id IS NOT NULL;
