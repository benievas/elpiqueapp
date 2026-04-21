-- Sprint 24: Fix completo para Armá Partido
-- Ejecutar en Supabase SQL Editor

-- ─────────────────────────────────────────────────────────────
-- 1. Crear tablas si no existen
-- ─────────────────────────────────────────────────────────────
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

-- ─────────────────────────────────────────────────────────────
-- 2. Índices
-- ─────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS partidos_ciudad_fecha_idx   ON partidos (ciudad, fecha, estado);
CREATE INDEX IF NOT EXISTS partido_jugadores_partido_idx ON partido_jugadores (partido_id);

-- ─────────────────────────────────────────────────────────────
-- 3. RLS
-- ─────────────────────────────────────────────────────────────
ALTER TABLE partidos          ENABLE ROW LEVEL SECURITY;
ALTER TABLE partido_jugadores ENABLE ROW LEVEL SECURITY;

-- partidos: cualquier usuario (incluso anon) puede leer
DROP POLICY IF EXISTS "partidos_select"  ON partidos;
DROP POLICY IF EXISTS "partidos_read"    ON partidos;
CREATE POLICY "partidos_read" ON partidos
  FOR SELECT TO public USING (true);

-- Solo el creador puede crear
DROP POLICY IF EXISTS "partidos_insert" ON partidos;
CREATE POLICY "partidos_insert" ON partidos
  FOR INSERT TO authenticated WITH CHECK (creador_id = auth.uid());

-- Cualquier autenticado puede actualizar slots (necesario para que jugadores se unan)
DROP POLICY IF EXISTS "partidos_update" ON partidos;
CREATE POLICY "partidos_update" ON partidos
  FOR UPDATE TO authenticated USING (true);

-- Solo el creador puede eliminar
DROP POLICY IF EXISTS "partidos_delete" ON partidos;
CREATE POLICY "partidos_delete" ON partidos
  FOR DELETE TO authenticated USING (creador_id = auth.uid());

-- partido_jugadores: cualquier usuario puede leer
DROP POLICY IF EXISTS "pj_select"               ON partido_jugadores;
DROP POLICY IF EXISTS "partido_jugadores_read"   ON partido_jugadores;
CREATE POLICY "partido_jugadores_read" ON partido_jugadores
  FOR SELECT TO public USING (true);

-- Cada usuario gestiona su propia inscripción
DROP POLICY IF EXISTS "pj_insert"               ON partido_jugadores;
DROP POLICY IF EXISTS "partido_jugadores_insert" ON partido_jugadores;
CREATE POLICY "partido_jugadores_insert" ON partido_jugadores
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "pj_delete"               ON partido_jugadores;
DROP POLICY IF EXISTS "partido_jugadores_delete" ON partido_jugadores;
CREATE POLICY "partido_jugadores_delete" ON partido_jugadores
  FOR DELETE TO authenticated USING (user_id = auth.uid());
