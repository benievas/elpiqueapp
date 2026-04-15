-- ============================================================
-- Sprint 6 — Admin Fix Completo (IDEMPOTENTE — seguro re-ejecutar)
-- EJECUTAR EN SUPABASE SQL EDITOR
-- Reemplaza/supersede: sprint6_1_admin_columns.sql + sprint6_rls_content.sql
-- ============================================================

-- ─── 1. Columnas necesarias ─────────────────────────────────
ALTER TABLE profiles   ADD COLUMN IF NOT EXISTS role   TEXT    NOT NULL DEFAULT 'player';
ALTER TABLE profiles   ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE complexes  ADD COLUMN IF NOT EXISTS status TEXT    NOT NULL DEFAULT 'active';

-- ─── 2. is_admin() — SECURITY DEFINER evita recursión RLS ──
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin');
$$;

-- ─── 3. RLS: Admin ve y modifica TODO ───────────────────────
ALTER TABLE profiles          ENABLE ROW LEVEL SECURITY;
ALTER TABLE complexes          ENABLE ROW LEVEL SECURITY;
ALTER TABLE courts             ENABLE ROW LEVEL SECURITY;
ALTER TABLE parties            ENABLE ROW LEVEL SECURITY;
ALTER TABLE court_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE players            ENABLE ROW LEVEL SECURITY;
ALTER TABLE cities             ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin full access profiles"           ON profiles;
DROP POLICY IF EXISTS "Admin full access complexes"          ON complexes;
DROP POLICY IF EXISTS "Admin full access courts"             ON courts;
DROP POLICY IF EXISTS "Admin full access parties"            ON parties;
DROP POLICY IF EXISTS "Admin full access court_availability" ON court_availability;
DROP POLICY IF EXISTS "Admin full access players"            ON players;
DROP POLICY IF EXISTS "Admin full access cities"             ON cities;

CREATE POLICY "Admin full access profiles"           ON profiles           FOR ALL USING (is_admin());
CREATE POLICY "Admin full access complexes"          ON complexes          FOR ALL USING (is_admin());
CREATE POLICY "Admin full access courts"             ON courts             FOR ALL USING (is_admin());
CREATE POLICY "Admin full access parties"            ON parties            FOR ALL USING (is_admin());
CREATE POLICY "Admin full access court_availability" ON court_availability FOR ALL USING (is_admin());
CREATE POLICY "Admin full access players"            ON players            FOR ALL USING (is_admin());
CREATE POLICY "Admin full access cities"             ON cities             FOR ALL USING (is_admin());

-- ─── 4. Funciones admin para gestión de usuarios ────────────
-- Obtener email de un usuario (accede a auth.users)
CREATE OR REPLACE FUNCTION admin_get_user_email(user_id UUID)
RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NOT is_admin() THEN RAISE EXCEPTION 'Unauthorized'; END IF;
  RETURN (SELECT email FROM auth.users WHERE id = user_id);
END;
$$;

-- Eliminar usuario (borra de auth.users — cascada borra profiles)
CREATE OR REPLACE FUNCTION admin_delete_user(user_id UUID)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NOT is_admin() THEN RAISE EXCEPTION 'Unauthorized'; END IF;
  DELETE FROM auth.users WHERE id = user_id;
END;
$$;

-- ─── 5. Tabla app_config (banners, videos, config global) ───
CREATE TABLE IF NOT EXISTS app_config (
  key        TEXT        PRIMARY KEY,
  value      JSONB       NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE app_config ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read app_config"  ON app_config;
DROP POLICY IF EXISTS "Admin write app_config"  ON app_config;
CREATE POLICY "Public read app_config" ON app_config FOR SELECT USING (true);
CREATE POLICY "Admin write app_config" ON app_config FOR ALL    USING (is_admin());

-- Datos iniciales (no sobreescribe si ya existen)
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

-- ─── 6. Tabla app_news (novedades/changelog visible a jugadores) ─
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
CREATE POLICY "Admin all news"             ON app_news FOR ALL    USING (is_admin());
