-- ============================================================
-- Sprint 11 — Likes persistentes en feed_posts
-- Ejecutar en Supabase SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS feed_likes (
  post_id    UUID NOT NULL REFERENCES feed_posts(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES profiles(id)   ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (post_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_feed_likes_post ON feed_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_feed_likes_user ON feed_likes(user_id);

ALTER TABLE feed_likes ENABLE ROW LEVEL SECURITY;

-- Todos los autenticados pueden leer
DROP POLICY IF EXISTS "feed_likes_select" ON feed_likes;
CREATE POLICY "feed_likes_select" ON feed_likes
  FOR SELECT TO authenticated
  USING (true);

-- Cada usuario solo puede insertar su propio like
DROP POLICY IF EXISTS "feed_likes_insert_self" ON feed_likes;
CREATE POLICY "feed_likes_insert_self" ON feed_likes
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Cada usuario solo puede eliminar su propio like
DROP POLICY IF EXISTS "feed_likes_delete_self" ON feed_likes;
CREATE POLICY "feed_likes_delete_self" ON feed_likes
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());
