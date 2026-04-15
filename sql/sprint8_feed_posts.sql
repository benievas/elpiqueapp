-- ============================================================
-- feed_posts: Contenido unificado del feed del jugador
-- Autores: admin (global o por ciudad) y owner (por ciudad)
-- Tipos: news | promo | event | tournament | tip
-- valid_until NULL = sin expiración (posts de admin permanentes)
-- Torneos (Sprint 8): valid_until = tournament.end_date + 1 day
-- ============================================================

CREATE TABLE IF NOT EXISTS feed_posts (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id   UUID        REFERENCES profiles(id) ON DELETE SET NULL,
  city_id     UUID        REFERENCES cities(id)   ON DELETE CASCADE,  -- NULL = global
  type        TEXT        NOT NULL DEFAULT 'news'
                CHECK (type IN ('news', 'promo', 'event', 'tournament', 'tip')),
  title       TEXT        NOT NULL,
  body        TEXT,
  image_url   TEXT,
  valid_until DATE,                                                     -- NULL = sin límite
  published   BOOLEAN     NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS feed_posts_city_idx    ON feed_posts (city_id);
CREATE INDEX IF NOT EXISTS feed_posts_created_idx ON feed_posts (created_at DESC);

ALTER TABLE feed_posts ENABLE ROW LEVEL SECURITY;

-- Lectura: jugadores ven publicados + no vencidos de su ciudad o globales
--          owners ven sus propios posts (para gestión)
--          admins ven todo
CREATE POLICY "feed_posts_read" ON feed_posts
  FOR SELECT USING (
    (
      published = true
      AND (valid_until IS NULL OR valid_until >= CURRENT_DATE)
    )
    OR is_admin()
    OR author_id = auth.uid()
  );

-- Insertar: admins y owners (owner debe ser el autor)
CREATE POLICY "feed_posts_insert" ON feed_posts
  FOR INSERT WITH CHECK (
    is_admin()
    OR (
      author_id = auth.uid()
      AND EXISTS (
        SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'owner'
      )
    )
  );

-- Actualizar: admins y autor del post
CREATE POLICY "feed_posts_update" ON feed_posts
  FOR UPDATE USING (
    is_admin() OR author_id = auth.uid()
  );

-- Eliminar: admins y autor del post
CREATE POLICY "feed_posts_delete" ON feed_posts
  FOR DELETE USING (
    is_admin() OR author_id = auth.uid()
  );
