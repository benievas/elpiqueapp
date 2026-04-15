-- MatchPro Sprint 2 — SQL Migrations
-- Aplicar en Supabase → SQL Editor

-- 1. Columna is_available en players
--    Permite al jugador marcar si está disponible para jugar ahora
ALTER TABLE players ADD COLUMN IF NOT EXISTS is_available BOOLEAN DEFAULT false;

-- 2. Columna schedule en courts (JSONB)
--    Guarda los horarios disponibles por día de la semana para cada cancha
--    Estructura: { lun: { open: "08:00", close: "23:00", active: true }, mar: {...}, ... }
ALTER TABLE courts ADD COLUMN IF NOT EXISTS schedule JSONB DEFAULT '{}';

-- 3. Columna time_to en court_availability (para rangos de reserva)
--    Permite marcar un rango 14:00→16:00 en una sola fila
ALTER TABLE court_availability ADD COLUMN IF NOT EXISTS time_to TEXT;

-- 4. Columna reserved_for en court_availability (nombre del jugador que reservó)
ALTER TABLE court_availability ADD COLUMN IF NOT EXISTS reserved_for TEXT;

-- 5. Columna owner_id en courts (para notificar al dueño en reservas)
ALTER TABLE courts ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES profiles(id);

-- 6. Tabla party_invites (invitaciones entre jugadores)
CREATE TABLE IF NOT EXISTS party_invites (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  party_id      UUID REFERENCES parties(id) ON DELETE CASCADE,
  from_user_id  UUID NOT NULL,  -- player.id del que invita
  to_user_id    UUID NOT NULL,  -- player.id del invitado
  status        TEXT NOT NULL DEFAULT 'pending',  -- pending|accepted|rejected
  created_at    TIMESTAMPTZ DEFAULT now(),
  UNIQUE (party_id, to_user_id)
);

-- 7. Tabla player_stats (XP, niveles, goles, asistencias)
CREATE TABLE IF NOT EXISTS player_stats (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id      UUID UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  xp              INTEGER DEFAULT 0,
  level           TEXT DEFAULT 'principiante',
  parties_played  INTEGER DEFAULT 0,
  parties_won     INTEGER DEFAULT 0,
  goals           INTEGER DEFAULT 0,
  assists         INTEGER DEFAULT 0,
  rating_sum      INTEGER DEFAULT 0,
  rating_count    INTEGER DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

-- 8. Tabla party_ratings (rating por partido finalizado)
CREATE TABLE IF NOT EXISTS party_ratings (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  party_id   UUID UNIQUE REFERENCES parties(id) ON DELETE CASCADE,
  rating     INTEGER CHECK (rating BETWEEN 1 AND 5),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 9. Columna push_token en players (para notificaciones push)
ALTER TABLE players ADD COLUMN IF NOT EXISTS push_token TEXT;

-- 10. Columna status en parties (open|full|cancelled|completed)
ALTER TABLE parties ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'open';

-- RLS habilitado en party_invites
ALTER TABLE party_invites ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "party_invites_select" ON party_invites
  FOR SELECT USING (from_user_id = auth.uid() OR to_user_id = auth.uid());
CREATE POLICY IF NOT EXISTS "party_invites_insert" ON party_invites
  FOR INSERT WITH CHECK (from_user_id = auth.uid());
CREATE POLICY IF NOT EXISTS "party_invites_update" ON party_invites
  FOR UPDATE USING (to_user_id = auth.uid());

-- RLS en player_stats (acceso público de lectura para el perfil de otros)
ALTER TABLE player_stats ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "player_stats_select_all" ON player_stats FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "player_stats_insert_own" ON player_stats
  FOR INSERT WITH CHECK (profile_id = auth.uid());
CREATE POLICY IF NOT EXISTS "player_stats_update_own" ON player_stats
  FOR UPDATE USING (profile_id = auth.uid());

-- 11. RPC para establecer role=owner de forma segura (SECURITY DEFINER bypasses RLS)
--     Llamar desde owner-login.tsx tras registro/login exitoso
CREATE OR REPLACE FUNCTION set_own_role_owner()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update if exists
  UPDATE profiles SET role = 'owner' WHERE id = auth.uid();
  -- Insert if not exists yet (e.g., trigger hasn't fired yet after signUp)
  IF NOT FOUND THEN
    INSERT INTO profiles (id, role)
    VALUES (auth.uid(), 'owner')
    ON CONFLICT (id) DO UPDATE SET role = 'owner';
  END IF;
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION set_own_role_owner() TO authenticated;

-- ── Sprint 3 additions ──────────────────────────────────────────────────────

-- 12. Booking status in court_availability
--     pending = awaiting owner confirmation, confirmed = owner accepted, rejected = owner declined
ALTER TABLE court_availability ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';
ALTER TABLE court_availability ADD COLUMN IF NOT EXISTS booker_id UUID REFERENCES auth.users(id);
ALTER TABLE court_availability ADD COLUMN IF NOT EXISTS booker_note TEXT;

-- Update existing booked rows to have a status
UPDATE court_availability SET status = 'confirmed' WHERE is_booked = true AND status IS NULL;

-- 13. player_stats: add player_id column (FK to players.id) for lookup by players.id
--     The table already has profile_id; this adds a direct FK to players table for convenience
ALTER TABLE player_stats ADD COLUMN IF NOT EXISTS player_id UUID REFERENCES players(id);

-- 14. court_availability RLS — owners can update status on their courts
ALTER TABLE court_availability ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "court_availability_select_all" ON court_availability
  FOR SELECT USING (true);

CREATE POLICY IF NOT EXISTS "court_availability_insert_auth" ON court_availability
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY IF NOT EXISTS "court_availability_update_owner" ON court_availability
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM courts c WHERE c.id = court_id AND c.owner_id = auth.uid()
    )
    OR booker_id = auth.uid()
  );

CREATE POLICY IF NOT EXISTS "court_availability_delete_owner" ON court_availability
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM courts c WHERE c.id = court_id AND c.owner_id = auth.uid()
    )
  );
