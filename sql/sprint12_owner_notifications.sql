-- Sprint 12: Owner notification preferences
-- Adds notif_email column to profiles (default ON)

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS notif_email BOOLEAN NOT NULL DEFAULT true;

-- Optional: comment describes intent
COMMENT ON COLUMN profiles.notif_email IS 'Owner opt-in for email notifications (reservas + torneos)';
