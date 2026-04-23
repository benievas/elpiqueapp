-- =====================================================
-- PARTIDOS SOCIAL — Setup completo
-- Ejecutar en Supabase SQL Editor (una sola vez)
-- Seguro re-ejecutar: usa IF NOT EXISTS + DROP IF EXISTS
-- =====================================================

-- 1. Tabla principal de partidos
CREATE TABLE IF NOT EXISTS partidos (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  creador_id     UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  deporte        TEXT        NOT NULL,
  fecha          DATE        NOT NULL,
  hora_inicio    TIME        NOT NULL,
  ciudad         TEXT        NOT NULL,
  descripcion    TEXT,
  slots_totales  INT         NOT NULL CHECK (slots_totales BETWEEN 2 AND 22),
  slots_ocupados INT         NOT NULL DEFAULT 1,
  estado         TEXT        NOT NULL DEFAULT 'abierto'
                             CHECK (estado IN ('abierto', 'completo', 'cancelado')),
  complex_id     UUID        REFERENCES complexes(id) ON DELETE SET NULL,
  created_at     TIMESTAMPTZ DEFAULT now()
);

-- 2. Tabla de jugadores inscriptos
CREATE TABLE IF NOT EXISTS partido_jugadores (
  partido_id     UUID        NOT NULL REFERENCES partidos(id) ON DELETE CASCADE,
  user_id        UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  nombre_display TEXT,
  telefono       TEXT,
  joined_at      TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (partido_id, user_id)
);

-- 3. Índices para performance
CREATE INDEX IF NOT EXISTS idx_partidos_ciudad_fecha ON partidos (ciudad, fecha);
CREATE INDEX IF NOT EXISTS idx_partidos_estado ON partidos (estado);
CREATE INDEX IF NOT EXISTS idx_partido_jugadores_user ON partido_jugadores (user_id);

-- 4. RLS
ALTER TABLE partidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE partido_jugadores ENABLE ROW LEVEL SECURITY;

-- 5. Políticas de partidos
DROP POLICY IF EXISTS "partidos_read"   ON partidos;
DROP POLICY IF EXISTS "partidos_insert" ON partidos;
DROP POLICY IF EXISTS "partidos_update" ON partidos;
DROP POLICY IF EXISTS "partidos_delete" ON partidos;

CREATE POLICY "partidos_read"   ON partidos FOR SELECT TO public      USING (true);
CREATE POLICY "partidos_insert" ON partidos FOR INSERT TO authenticated WITH CHECK (creador_id = auth.uid());
CREATE POLICY "partidos_update" ON partidos FOR UPDATE TO authenticated USING (true);
CREATE POLICY "partidos_delete" ON partidos FOR DELETE TO authenticated USING (creador_id = auth.uid());

-- 6. Políticas de partido_jugadores
DROP POLICY IF EXISTS "partido_jugadores_read"   ON partido_jugadores;
DROP POLICY IF EXISTS "partido_jugadores_insert" ON partido_jugadores;
DROP POLICY IF EXISTS "partido_jugadores_delete" ON partido_jugadores;

CREATE POLICY "partido_jugadores_read"   ON partido_jugadores FOR SELECT TO public      USING (true);
CREATE POLICY "partido_jugadores_insert" ON partido_jugadores FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "partido_jugadores_delete" ON partido_jugadores FOR DELETE TO authenticated USING (user_id = auth.uid());
