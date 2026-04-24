-- Sprint 23: Fixes para Feed Posts RLS y Partido Social
-- Ejecutar en Supabase SQL Editor

-- ==========================================
-- 1. FIX FEED POSTS (Permisos del Dueño)
-- ==========================================
ALTER TABLE feed_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "feed_posts_read" ON feed_posts;
CREATE POLICY "feed_posts_read" ON feed_posts
  FOR SELECT USING (
    (visible = true AND (fecha_expiracion IS NULL OR fecha_expiracion > now()))
    OR is_admin()
    OR autor_id = auth.uid()
  );

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

DROP POLICY IF EXISTS "feed_posts_update" ON feed_posts;
CREATE POLICY "feed_posts_update" ON feed_posts
  FOR UPDATE USING (
    is_admin() OR autor_id = auth.uid()
  );

DROP POLICY IF EXISTS "feed_posts_delete" ON feed_posts;
CREATE POLICY "feed_posts_delete" ON feed_posts
  FOR DELETE USING (
    is_admin() OR autor_id = auth.uid()
  );


-- ==========================================
-- 2. FIX PARTIDOS SOCIAL (Permisos y Estructura)
-- ==========================================
CREATE TABLE IF NOT EXISTS partidos (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  creador_id    UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  deporte       TEXT        NOT NULL,
  fecha         DATE        NOT NULL,
  hora_inicio   TIME        NOT NULL,
  ciudad        TEXT        NOT NULL,
  descripcion   TEXT,
  slots_totales INT         NOT NULL CHECK (slots_totales BETWEEN 2 AND 22),
  slots_ocupados INT        NOT NULL DEFAULT 1,
  estado        TEXT        NOT NULL DEFAULT 'abierto'
                            CHECK (estado IN ('abierto', 'completo', 'cancelado')),
  complex_id    UUID        REFERENCES complexes(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS partido_jugadores (
  partido_id    UUID        NOT NULL REFERENCES partidos(id) ON DELETE CASCADE,
  user_id       UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  nombre_display TEXT,
  telefono      TEXT,
  joined_at     TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (partido_id, user_id)
);

ALTER TABLE partidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE partido_jugadores ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "partidos_read" ON partidos;
CREATE POLICY "partidos_read" ON partidos FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "partidos_insert" ON partidos;
CREATE POLICY "partidos_insert" ON partidos FOR INSERT TO authenticated WITH CHECK (creador_id = auth.uid());

DROP POLICY IF EXISTS "partidos_update" ON partidos;
CREATE POLICY "partidos_update" ON partidos FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS "partidos_delete" ON partidos;
CREATE POLICY "partidos_delete" ON partidos FOR DELETE TO authenticated USING (creador_id = auth.uid());

DROP POLICY IF EXISTS "partido_jugadores_read" ON partido_jugadores;
CREATE POLICY "partido_jugadores_read" ON partido_jugadores FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "partido_jugadores_insert" ON partido_jugadores;
CREATE POLICY "partido_jugadores_insert" ON partido_jugadores FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "partido_jugadores_delete" ON partido_jugadores;
CREATE POLICY "partido_jugadores_delete" ON partido_jugadores FOR DELETE TO authenticated USING (user_id = auth.uid());
