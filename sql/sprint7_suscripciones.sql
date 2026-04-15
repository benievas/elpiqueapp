-- ============================================================
-- Sprint 7 — Suscripciones + Fix Admin (IDEMPOTENTE)
-- EJECUTAR EN SUPABASE SQL EDITOR
-- ============================================================

-- ─── PASO 1: Desactivar RLS para recuperar acceso ────────────
-- (si hay una policy rota que llama a is_admin() inexistente,
--  cualquier query a estas tablas devuelve 400 — esto lo rompe)
ALTER TABLE profiles           DISABLE ROW LEVEL SECURITY;
ALTER TABLE complexes          DISABLE ROW LEVEL SECURITY;
ALTER TABLE courts             DISABLE ROW LEVEL SECURITY;
ALTER TABLE parties            DISABLE ROW LEVEL SECURITY;
ALTER TABLE court_availability DISABLE ROW LEVEL SECURITY;
ALTER TABLE players            DISABLE ROW LEVEL SECURITY;
ALTER TABLE cities             DISABLE ROW LEVEL SECURITY;

-- ─── PASO 2: Columnas faltantes ──────────────────────────────
ALTER TABLE profiles           ADD COLUMN IF NOT EXISTS role   TEXT    NOT NULL DEFAULT 'player';
ALTER TABLE profiles           ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE complexes          ADD COLUMN IF NOT EXISTS status TEXT    NOT NULL DEFAULT 'active';
ALTER TABLE court_availability ADD COLUMN IF NOT EXISTS party_id  UUID REFERENCES parties(id) ON DELETE SET NULL;
ALTER TABLE court_availability ADD COLUMN IF NOT EXISTS booker_id UUID REFERENCES profiles(id) ON DELETE SET NULL;

-- ─── PASO 3: Rol admin y is_admin() ──────────────────────────
-- Ahora que RLS está desactivado, el UPDATE funciona sin problema
UPDATE profiles SET role = 'admin'
WHERE id = '866a3379-bed9-4cbc-b4ed-b01ac2693791';

CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin');
$$;

-- ─── PASO 4: Limpiar todas las policies viejas rotas ─────────
DROP POLICY IF EXISTS "Admin full access profiles"           ON profiles;
DROP POLICY IF EXISTS "Admin full access complexes"          ON complexes;
DROP POLICY IF EXISTS "Admin full access courts"             ON courts;
DROP POLICY IF EXISTS "Admin full access parties"            ON parties;
DROP POLICY IF EXISTS "Admin full access court_availability" ON court_availability;
DROP POLICY IF EXISTS "Admin full access players"            ON players;
DROP POLICY IF EXISTS "Admin full access cities"             ON cities;

-- ─── PASO 5: Re-activar RLS con policies correctas ───────────
ALTER TABLE profiles          ENABLE ROW LEVEL SECURITY;
ALTER TABLE complexes         ENABLE ROW LEVEL SECURITY;
ALTER TABLE courts            ENABLE ROW LEVEL SECURITY;
ALTER TABLE parties           ENABLE ROW LEVEL SECURITY;
ALTER TABLE court_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE players           ENABLE ROW LEVEL SECURITY;
ALTER TABLE cities            ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin full access profiles"           ON profiles;
DROP POLICY IF EXISTS "Admin full access complexes"          ON complexes;
DROP POLICY IF EXISTS "Admin full access courts"             ON courts;
DROP POLICY IF EXISTS "Admin full access parties"            ON parties;
DROP POLICY IF EXISTS "Admin full access court_availability" ON court_availability;
DROP POLICY IF EXISTS "Admin full access players"            ON players;
DROP POLICY IF EXISTS "Admin full access cities"             ON cities;

-- Admin: acceso total
CREATE POLICY "Admin full access profiles"           ON profiles           FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Admin full access complexes"          ON complexes          FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Admin full access courts"             ON courts             FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Admin full access parties"            ON parties            FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Admin full access court_availability" ON court_availability FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Admin full access players"            ON players            FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Admin full access cities"             ON cities             FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- Usuarios normales: acceso propio / lectura pública necesaria
DROP POLICY IF EXISTS "Users read own profile"        ON profiles;
DROP POLICY IF EXISTS "Users update own profile"      ON profiles;
DROP POLICY IF EXISTS "Public read profiles"          ON profiles;
DROP POLICY IF EXISTS "Public read complexes"         ON complexes;
DROP POLICY IF EXISTS "Public read courts"            ON courts;
DROP POLICY IF EXISTS "Public read parties"           ON parties;
DROP POLICY IF EXISTS "Public read court_availability" ON court_availability;
DROP POLICY IF EXISTS "Public read players"           ON players;
DROP POLICY IF EXISTS "Public read cities"            ON cities;

CREATE POLICY "Public read profiles"           ON profiles           FOR SELECT USING (true);
CREATE POLICY "Users update own profile"       ON profiles           FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "Users insert own profile"       ON profiles           FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Public read complexes"          ON complexes          FOR SELECT USING (true);
CREATE POLICY "Public read courts"             ON courts             FOR SELECT USING (true);
CREATE POLICY "Public read parties"            ON parties            FOR SELECT USING (true);
CREATE POLICY "Public read court_availability" ON court_availability FOR SELECT USING (true);
CREATE POLICY "Users manage own availability"  ON court_availability FOR ALL   USING (auth.uid() = booker_id) WITH CHECK (auth.uid() = booker_id);
CREATE POLICY "Public read players"            ON players            FOR SELECT USING (true);
CREATE POLICY "Users manage own player"        ON players            FOR ALL   USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "Public read cities"             ON cities             FOR SELECT USING (true);

-- ─── Funciones admin ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION admin_get_user_email(user_id UUID)
RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NOT is_admin() THEN RAISE EXCEPTION 'Unauthorized'; END IF;
  RETURN (SELECT email FROM auth.users WHERE id = user_id);
END;
$$;

CREATE OR REPLACE FUNCTION admin_delete_user(user_id UUID)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NOT is_admin() THEN RAISE EXCEPTION 'Unauthorized'; END IF;
  DELETE FROM auth.users WHERE id = user_id;
END;
$$;

-- ─── app_config y app_news (idempotente) ─────────────────────
CREATE TABLE IF NOT EXISTS app_config (
  key        TEXT        PRIMARY KEY,
  value      JSONB       NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE app_config ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read app_config" ON app_config;
DROP POLICY IF EXISTS "Admin write app_config" ON app_config;
CREATE POLICY "Public read app_config" ON app_config FOR SELECT USING (true);
CREATE POLICY "Admin write app_config" ON app_config FOR ALL USING (is_admin()) WITH CHECK (is_admin());

INSERT INTO app_config (key, value) VALUES (
  'home_banners',
  '[
    {"key":"futbol5",  "label":"FÚTBOL 5",  "photo":"https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=900&q=80"},
    {"key":"futbol7",  "label":"FÚTBOL 7",  "photo":"https://images.unsplash.com/photo-1522778034537-20a2486be803?w=900&q=80"},
    {"key":"futbol8",  "label":"FÚTBOL 8",  "photo":"https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=900&q=80"},
    {"key":"futbol11", "label":"FÚTBOL 11", "photo":"https://images.unsplash.com/photo-1551958219-acbc595b9f7c?w=900&q=80"},
    {"key":"padel",    "label":"PÁDEL",     "photo":"https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=900&q=80"},
    {"key":"tenis",    "label":"TENIS",     "photo":"https://images.unsplash.com/photo-1595435742656-5272d0b3fa82?w=900&q=80"}
  ]'::jsonb
) ON CONFLICT (key) DO NOTHING;
INSERT INTO app_config (key, value) VALUES ('login_videos',  '[]'::jsonb) ON CONFLICT (key) DO NOTHING;
INSERT INTO app_config (key, value) VALUES ('splash_videos', '[]'::jsonb) ON CONFLICT (key) DO NOTHING;

CREATE TABLE IF NOT EXISTS app_news (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  title        TEXT        NOT NULL,
  body         TEXT        NOT NULL,
  version      TEXT,
  emoji        TEXT        NOT NULL DEFAULT '🚀',
  published    BOOLEAN     NOT NULL DEFAULT false,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  published_at TIMESTAMPTZ
);
ALTER TABLE app_news ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read published news" ON app_news;
DROP POLICY IF EXISTS "Admin all news"             ON app_news;
CREATE POLICY "Public read published news" ON app_news FOR SELECT USING (published = true OR is_admin());
CREATE POLICY "Admin all news"             ON app_news FOR ALL    USING (is_admin()) WITH CHECK (is_admin());

-- ─── TABLA SUBSCRIPTIONS ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS subscriptions (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  plan                TEXT        NOT NULL CHECK (plan IN ('owner', 'pro_player')),
  status              TEXT        NOT NULL DEFAULT 'pending'
                                  CHECK (status IN ('active', 'pending', 'cancelled', 'expired')),
  amount              INT         NOT NULL DEFAULT 0,         -- en ARS
  mp_subscription_id  TEXT,                                   -- futuro MP
  starts_at           TIMESTAMPTZ DEFAULT now(),
  ends_at             TIMESTAMPTZ,
  notes               TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admin full access subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Users read own subscriptions"    ON subscriptions;
CREATE POLICY "Admin full access subscriptions" ON subscriptions
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Users read own subscriptions" ON subscriptions
  FOR SELECT USING (user_id = auth.uid());

-- ─── VERIFICACIÓN FINAL ───────────────────────────────────────
-- Correr esto para confirmar que todo está bien:
-- SELECT id, username, role, active FROM profiles ORDER BY created_at DESC LIMIT 10;
-- SELECT is_admin();  -- debe retornar TRUE si estás logueado como admin
