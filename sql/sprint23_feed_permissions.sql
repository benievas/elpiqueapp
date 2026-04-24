-- Fix feed_posts RLS to correctly read 'rol' instead of 'role' and map attributes properly

ALTER TABLE feed_posts ENABLE ROW LEVEL SECURITY;

-- Lectura:
DROP POLICY IF EXISTS "feed_posts_read" ON feed_posts;
CREATE POLICY "feed_posts_read" ON feed_posts
  FOR SELECT USING (
    (visible = true AND (fecha_expiracion IS NULL OR fecha_expiracion > now()))
    OR is_admin()
    OR autor_id = auth.uid()
  );

-- Inserción:
DROP POLICY IF EXISTS "feed_posts_insert" ON feed_posts;
CREATE POLICY "feed_posts_insert" ON feed_posts
  FOR INSERT WITH CHECK (
    is_admin()
    OR (
      autor_id = auth.uid()
      AND EXISTS (
        SELECT 1 FROM profiles WHERE id = auth.uid() AND rol = 'propietario'
      )
    )
  );

-- Actualización:
DROP POLICY IF EXISTS "feed_posts_update" ON feed_posts;
CREATE POLICY "feed_posts_update" ON feed_posts
  FOR UPDATE USING (
    is_admin() OR autor_id = auth.uid()
  );

-- Eliminación:
DROP POLICY IF EXISTS "feed_posts_delete" ON feed_posts;
CREATE POLICY "feed_posts_delete" ON feed_posts
  FOR DELETE USING (
    is_admin() OR autor_id = auth.uid()
  );
