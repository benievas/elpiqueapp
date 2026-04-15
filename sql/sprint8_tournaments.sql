-- ============================================================
-- Sprint 8 — Torneos
-- Tablas: tournaments, tournament_teams, tournament_matches
-- ============================================================

-- ── tournaments ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tournaments (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  city_id              UUID REFERENCES cities(id) ON DELETE SET NULL,
  name                 TEXT NOT NULL,
  sport                TEXT NOT NULL DEFAULT 'futbol5',
  format               TEXT NOT NULL DEFAULT 'Eliminación directa',
  description          TEXT,
  start_date           DATE NOT NULL,
  end_date             DATE NOT NULL,
  registration_deadline DATE,
  max_teams            INT NOT NULL DEFAULT 8,
  entry_fee            INT NOT NULL DEFAULT 0,          -- ARS
  prize_description    TEXT,
  photo_url            TEXT,
  status               TEXT NOT NULL DEFAULT 'open'
    CHECK (status IN ('open','in_progress','finished','cancelled')),
  created_by           UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at           TIMESTAMPTZ DEFAULT now()
);

-- ── tournament_teams ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tournament_teams (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id   UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  team_name       TEXT NOT NULL,
  captain_id      UUID REFERENCES profiles(id) ON DELETE SET NULL,
  status          TEXT NOT NULL DEFAULT 'registered'
    CHECK (status IN ('registered','approved','eliminated','champion')),
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- ── tournament_matches ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS tournament_matches (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id   UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  round           INT NOT NULL DEFAULT 1,
  match_number    INT NOT NULL DEFAULT 1,
  team_a_id       UUID REFERENCES tournament_teams(id) ON DELETE SET NULL,
  team_b_id       UUID REFERENCES tournament_teams(id) ON DELETE SET NULL,
  score_a         INT,
  score_b         INT,
  winner_id       UUID REFERENCES tournament_teams(id) ON DELETE SET NULL,
  played_at       TIMESTAMPTZ,
  scheduled_date  DATE,
  scheduled_time  TEXT,
  status          TEXT NOT NULL DEFAULT 'scheduled'
    CHECK (status IN ('scheduled','played','cancelled')),
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- ── RLS ─────────────────────────────────────────────────────
ALTER TABLE tournaments         ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_teams    ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_matches  ENABLE ROW LEVEL SECURITY;

-- tournaments: todos leen activos; solo admin escribe
CREATE POLICY "torneos_select" ON tournaments
  FOR SELECT TO authenticated
  USING (status != 'cancelled');

CREATE POLICY "torneos_admin_all" ON tournaments
  FOR ALL TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- tournament_teams: todos leen; auth puede registrar; admin gestiona
CREATE POLICY "torteams_select" ON tournament_teams
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "torteams_insert" ON tournament_teams
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "torteams_admin_update" ON tournament_teams
  FOR UPDATE TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "torteams_admin_delete" ON tournament_teams
  FOR DELETE TO authenticated USING (is_admin());

-- tournament_matches: todos leen; solo admin escribe
CREATE POLICY "tormatches_select" ON tournament_matches
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "tormatches_admin_all" ON tournament_matches
  FOR ALL TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- ── Trigger: auto-crear feed_post al publicar torneo ────────
CREATE OR REPLACE FUNCTION auto_tournament_feed_post()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- Al insertar un torneo status='open', crear post en feed
  IF TG_OP = 'INSERT' AND NEW.status = 'open' THEN
    INSERT INTO feed_posts (
      author_id, city_id, type, title, body,
      image_url, valid_until, published
    ) VALUES (
      NEW.created_by,
      NEW.city_id,
      'tournament',
      NEW.name,
      COALESCE(NEW.description, 'Torneo de ' || NEW.sport || ' — ¡Inscribite ahora!'),
      NEW.photo_url,
      NEW.end_date + interval '1 day',
      true
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_tournament_feed_post ON tournaments;
CREATE TRIGGER trg_tournament_feed_post
  AFTER INSERT ON tournaments
  FOR EACH ROW EXECUTE FUNCTION auto_tournament_feed_post();

-- ── Índices ──────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_tournaments_city    ON tournaments(city_id);
CREATE INDEX IF NOT EXISTS idx_tournaments_status  ON tournaments(status);
CREATE INDEX IF NOT EXISTS idx_torteams_tournament ON tournament_teams(tournament_id);
CREATE INDEX IF NOT EXISTS idx_tormatches_tournament ON tournament_matches(tournament_id);
