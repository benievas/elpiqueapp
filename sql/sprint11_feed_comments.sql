-- ============================================================
-- Sprint 11 — Comentarios en feed_posts
-- Ejecutar en Supabase SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS feed_comments (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id    UUID NOT NULL REFERENCES feed_posts(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES profiles(id)   ON DELETE CASCADE,
  contenido  TEXT NOT NULL CHECK (char_length(contenido) BETWEEN 1 AND 500),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_feed_comments_post ON feed_comments(post_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feed_comments_user ON feed_comments(user_id);

ALTER TABLE feed_comments ENABLE ROW LEVEL SECURITY;

-- Todos los autenticados pueden leer comentarios
DROP POLICY IF EXISTS "feed_comments_select" ON feed_comments;
CREATE POLICY "feed_comments_select" ON feed_comments
  FOR SELECT TO authenticated
  USING (true);

-- Usuarios pueden crear comentarios propios
DROP POLICY IF EXISTS "feed_comments_insert_self" ON feed_comments;
CREATE POLICY "feed_comments_insert_self" ON feed_comments
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Usuarios pueden editar sus propios comentarios
DROP POLICY IF EXISTS "feed_comments_update_self" ON feed_comments;
CREATE POLICY "feed_comments_update_self" ON feed_comments
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Usuarios pueden borrar sus propios comentarios
DROP POLICY IF EXISTS "feed_comments_delete_self" ON feed_comments;
CREATE POLICY "feed_comments_delete_self" ON feed_comments
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());
