-- MatchPro — Tablas Sprint 3
-- Aplicar en Supabase → SQL Editor
-- Fecha: 2026-03-31

-- ============================================================================
-- 1. TABLA feedback
-- ============================================================================
CREATE TABLE IF NOT EXISTS feedback (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  category    TEXT NOT NULL,  -- 'bug' | 'suggestion' | 'complaint' | 'other'
  title       TEXT,
  body        TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'feedback' AND policyname = 'feedback_insert_auth') THEN
    CREATE POLICY "feedback_insert_auth" ON feedback
      FOR INSERT WITH CHECK (auth.role() = 'authenticated');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'feedback' AND policyname = 'feedback_select_own') THEN
    CREATE POLICY "feedback_select_own" ON feedback
      FOR SELECT USING (user_id = auth.uid());
  END IF;
END $$;


-- ============================================================================
-- 2. TABLA promotions
-- ============================================================================
CREATE TABLE IF NOT EXISTS promotions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id         UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  court_id         UUID REFERENCES courts(id) ON DELETE SET NULL,
  city_id          UUID REFERENCES cities(id),
  title            TEXT NOT NULL,
  description      TEXT,
  image_url        TEXT,
  discount_percent INTEGER,
  sport            TEXT,
  type             TEXT DEFAULT 'promo',  -- 'promo' | 'event' | 'news'
  valid_from       DATE,
  valid_until      DATE,
  active           BOOLEAN DEFAULT true,
  created_at       TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'promotions' AND policyname = 'promotions_select_active') THEN
    CREATE POLICY "promotions_select_active" ON promotions
      FOR SELECT USING (active = true OR owner_id = auth.uid());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'promotions' AND policyname = 'promotions_insert_owner') THEN
    CREATE POLICY "promotions_insert_owner" ON promotions
      FOR INSERT WITH CHECK (owner_id = auth.uid());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'promotions' AND policyname = 'promotions_update_owner') THEN
    CREATE POLICY "promotions_update_owner" ON promotions
      FOR UPDATE USING (owner_id = auth.uid());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'promotions' AND policyname = 'promotions_delete_owner') THEN
    CREATE POLICY "promotions_delete_owner" ON promotions
      FOR DELETE USING (owner_id = auth.uid());
  END IF;
END $$;


-- ============================================================================
-- 3. TABLA teams
-- ============================================================================
CREATE TABLE IF NOT EXISTS teams (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT NOT NULL,
  sport        TEXT NOT NULL,
  color        TEXT DEFAULT '#C8FF00',
  badge_emoji  TEXT DEFAULT '⚽',
  badge_photo  TEXT,
  description  TEXT,
  captain_id   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  city_id      UUID REFERENCES cities(id),
  created_at   TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE teams ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'teams' AND policyname = 'teams_select_all') THEN
    CREATE POLICY "teams_select_all" ON teams FOR SELECT USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'teams' AND policyname = 'teams_insert_auth') THEN
    CREATE POLICY "teams_insert_auth" ON teams
      FOR INSERT WITH CHECK (captain_id = auth.uid());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'teams' AND policyname = 'teams_update_captain') THEN
    CREATE POLICY "teams_update_captain" ON teams
      FOR UPDATE USING (captain_id = auth.uid());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'teams' AND policyname = 'teams_delete_captain') THEN
    CREATE POLICY "teams_delete_captain" ON teams
      FOR DELETE USING (captain_id = auth.uid());
  END IF;
END $$;


-- ============================================================================
-- 4. TABLA team_members
-- ============================================================================
CREATE TABLE IF NOT EXISTS team_members (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id    UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  player_id  UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role       TEXT DEFAULT 'member',  -- 'captain' | 'member'
  joined_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE (team_id, player_id)
);

ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'team_members' AND policyname = 'team_members_select_all') THEN
    CREATE POLICY "team_members_select_all" ON team_members FOR SELECT USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'team_members' AND policyname = 'team_members_insert_auth') THEN
    CREATE POLICY "team_members_insert_auth" ON team_members
      FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'team_members' AND policyname = 'team_members_delete_own') THEN
    CREATE POLICY "team_members_delete_own" ON team_members
      FOR DELETE USING (EXISTS (SELECT 1 FROM teams t WHERE t.id = team_id AND t.captain_id = auth.uid()));
  END IF;
END $$;


-- ============================================================================
-- 5. COLUMNAS PENDIENTES EN court_availability
-- ============================================================================
ALTER TABLE court_availability ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';
ALTER TABLE court_availability ADD COLUMN IF NOT EXISTS booker_id UUID REFERENCES auth.users(id);
ALTER TABLE court_availability ADD COLUMN IF NOT EXISTS booker_note TEXT;
ALTER TABLE court_availability ADD COLUMN IF NOT EXISTS time_to TEXT;
ALTER TABLE court_availability ADD COLUMN IF NOT EXISTS reserved_for TEXT;

-- Migrar reservas existentes que estén marcadas como booked sin status
UPDATE court_availability SET status = 'confirmed'
WHERE is_booked = true AND status IS NULL;


-- ============================================================================
-- 6. COLUMNAS PENDIENTES EN courts
-- ============================================================================
ALTER TABLE courts ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES profiles(id);
ALTER TABLE courts ADD COLUMN IF NOT EXISTS business_id UUID;
ALTER TABLE courts ADD COLUMN IF NOT EXISTS business_name TEXT;

-- ============================================================================
-- Verificación post-ejecución:
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'
--   AND table_name IN ('feedback', 'promotions', 'teams', 'team_members');
--
-- SELECT column_name FROM information_schema.columns
--   WHERE table_name = 'court_availability'
--   AND column_name IN ('status', 'booker_id', 'time_to', 'reserved_for');
-- ============================================================================
