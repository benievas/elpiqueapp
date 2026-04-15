-- Sprint 6.2: RLS Admin Policies + Content Management Tables
-- Ejecutar en Supabase SQL Editor

-- ─── 1. is_admin() — SECURITY DEFINER evita recursión en RLS ───────────────
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin');
$$;

-- ─── 2. RLS: Admin puede ver y modificar TODOS los profiles ────────────────
DROP POLICY IF EXISTS "Admin full access profiles" ON profiles;
CREATE POLICY "Admin full access profiles" ON profiles
  FOR ALL USING (is_admin());

-- ─── 3. RLS: Admin puede ver y modificar TODOS los complexes ──────────────
DROP POLICY IF EXISTS "Admin full access complexes" ON complexes;
CREATE POLICY "Admin full access complexes" ON complexes
  FOR ALL USING (is_admin());

-- ─── 4. RLS: Admin puede ver y modificar TODAS las courts ────────────────
DROP POLICY IF EXISTS "Admin full access courts" ON courts;
CREATE POLICY "Admin full access courts" ON courts
  FOR ALL USING (is_admin());

-- ─── 5. RLS: Admin puede ver y modificar TODOS los parties ───────────────
DROP POLICY IF EXISTS "Admin full access parties" ON parties;
CREATE POLICY "Admin full access parties" ON parties
  FOR ALL USING (is_admin());

-- ─── 6. RLS: Admin puede ver y modificar TODAS las reservas ──────────────
DROP POLICY IF EXISTS "Admin full access court_availability" ON court_availability;
CREATE POLICY "Admin full access court_availability" ON court_availability
  FOR ALL USING (is_admin());

-- ─── 7. RLS: Admin puede ver TODOS los players ───────────────────────────
DROP POLICY IF EXISTS "Admin full access players" ON players;
CREATE POLICY "Admin full access players" ON players
  FOR ALL USING (is_admin());

-- ─── 8. Tabla app_config (banners, videos, config global) ─────────────────
CREATE TABLE IF NOT EXISTS app_config (
  key         TEXT PRIMARY KEY,
  value       JSONB NOT NULL,
  updated_at  TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE app_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read app_config" ON app_config;
CREATE POLICY "Public read app_config" ON app_config
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin write app_config" ON app_config;
CREATE POLICY "Admin write app_config" ON app_config
  FOR ALL USING (is_admin());

-- Datos iniciales de app_config
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

INSERT INTO app_config (key, value) VALUES (
  'login_videos',
  '[
    "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
    "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4"
  ]'::jsonb
) ON CONFLICT (key) DO NOTHING;

-- splash_videos: vacío por defecto (usa assets locales)
-- Cuando el admin suba videos a Supabase Storage, pegar las URLs aquí
INSERT INTO app_config (key, value) VALUES (
  'splash_videos',
  '[]'::jsonb
) ON CONFLICT (key) DO NOTHING;

-- ─── 9. Tabla app_news (novedades de la app) ──────────────────────────────
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
CREATE POLICY "Public read published news" ON app_news
  FOR SELECT USING (published = true OR is_admin());

DROP POLICY IF EXISTS "Admin all news" ON app_news;
CREATE POLICY "Admin all news" ON app_news
  FOR ALL USING (is_admin());
