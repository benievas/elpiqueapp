-- =====================================================
-- FIXES: cash_sessions + feed_posts RLS
-- Ejecutar en Supabase SQL Editor
-- =====================================================

-- 1. Agregar columna efectivo_contado a cash_sessions
ALTER TABLE cash_sessions
  ADD COLUMN IF NOT EXISTS efectivo_contado DECIMAL(10,2);

-- 2. Fix feed_posts RLS — reemplazar política de INSERT
--    sin depender de is_admin() que puede no existir

ALTER TABLE feed_posts ENABLE ROW LEVEL SECURITY;

-- SELECT: posts visibles al público + propios + admin
DROP POLICY IF EXISTS "feed_posts_read" ON feed_posts;
CREATE POLICY "feed_posts_read" ON feed_posts
  FOR SELECT USING (
    (visible = true AND (fecha_expiracion IS NULL OR fecha_expiracion > now()))
    OR autor_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND rol IN ('admin', 'superadmin'))
  );

-- INSERT: admin o propietario activo
DROP POLICY IF EXISTS "feed_posts_insert" ON feed_posts;
CREATE POLICY "feed_posts_insert" ON feed_posts
  FOR INSERT WITH CHECK (
    autor_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND rol IN ('admin', 'superadmin', 'propietario')
    )
  );

-- UPDATE: propio o admin
DROP POLICY IF EXISTS "feed_posts_update" ON feed_posts;
CREATE POLICY "feed_posts_update" ON feed_posts
  FOR UPDATE USING (
    autor_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND rol IN ('admin', 'superadmin'))
  );

-- DELETE: propio o admin
DROP POLICY IF EXISTS "feed_posts_delete" ON feed_posts;
CREATE POLICY "feed_posts_delete" ON feed_posts
  FOR DELETE USING (
    autor_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND rol IN ('admin', 'superadmin'))
  );

-- 3. Fix tournament_matches UPDATE para propietarios del complejo
ALTER TABLE tournament_matches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tournament_matches_read"   ON tournament_matches;
DROP POLICY IF EXISTS "tournament_matches_insert" ON tournament_matches;
DROP POLICY IF EXISTS "tournament_matches_update" ON tournament_matches;
DROP POLICY IF EXISTS "tournament_matches_delete" ON tournament_matches;

CREATE POLICY "tournament_matches_read" ON tournament_matches
  FOR SELECT TO public USING (true);

CREATE POLICY "tournament_matches_insert" ON tournament_matches
  FOR INSERT TO authenticated WITH CHECK (
    tournament_id IN (
      SELECT t.id FROM tournaments t
      JOIN complexes c ON c.id = t.complex_id
      WHERE c.owner_id = auth.uid()
    )
  );

CREATE POLICY "tournament_matches_update" ON tournament_matches
  FOR UPDATE TO authenticated USING (
    tournament_id IN (
      SELECT t.id FROM tournaments t
      JOIN complexes c ON c.id = t.complex_id
      WHERE c.owner_id = auth.uid()
    )
  );

CREATE POLICY "tournament_matches_delete" ON tournament_matches
  FOR DELETE TO authenticated USING (
    tournament_id IN (
      SELECT t.id FROM tournaments t
      JOIN complexes c ON c.id = t.complex_id
      WHERE c.owner_id = auth.uid()
    )
  );
