-- ============================================================
-- Sprint 10 — MP Marketplace OAuth
-- Almacena tokens MP de los owners para split automático
-- EJECUTAR EN SUPABASE SQL EDITOR
-- ============================================================

-- ─── Columnas MP OAuth en profiles ───────────────────────────
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS mp_access_token   TEXT,
  ADD COLUMN IF NOT EXISTS mp_refresh_token  TEXT,
  ADD COLUMN IF NOT EXISTS mp_user_id        TEXT,   -- ID de cuenta MP del owner
  ADD COLUMN IF NOT EXISTS mp_connected_at   TIMESTAMPTZ;

COMMENT ON COLUMN profiles.mp_access_token  IS 'Token MP del owner para cobros via Marketplace';
COMMENT ON COLUMN profiles.mp_user_id       IS 'ID de cuenta MercadoPago del owner (collector_id)';

-- ─── RLS: solo el propio usuario y admin pueden ver/editar ───
-- Los tokens son sensibles, restringir acceso
CREATE POLICY "Owner update own mp tokens" ON profiles
  FOR UPDATE USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- ─── Vista segura: verificar si owner tiene MP conectado ─────
-- (sin exponer el token)
CREATE OR REPLACE FUNCTION owner_has_mp_connected(p_owner_id UUID)
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER AS $$
  SELECT mp_access_token IS NOT NULL AND mp_access_token != ''
  FROM profiles WHERE id = p_owner_id;
$$;

-- ─── VERIFICACIÓN ─────────────────────────────────────────────
SELECT column_name FROM information_schema.columns
WHERE table_name = 'profiles'
  AND column_name IN ('mp_access_token','mp_refresh_token','mp_user_id','mp_connected_at');
