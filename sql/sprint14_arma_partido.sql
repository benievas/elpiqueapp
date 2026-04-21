-- Sprint 14: Armá partido — matchmaking social

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

-- Índices
CREATE INDEX IF NOT EXISTS partidos_ciudad_fecha_idx ON partidos (ciudad, fecha, estado);
CREATE INDEX IF NOT EXISTS partido_jugadores_partido_idx ON partido_jugadores (partido_id);

-- RLS
ALTER TABLE partidos          ENABLE ROW LEVEL SECURITY;
ALTER TABLE partido_jugadores ENABLE ROW LEVEL SECURITY;

-- partidos: cualquier autenticado lee; solo creador modifica
CREATE POLICY "partidos_select" ON partidos
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "partidos_insert" ON partidos
  FOR INSERT TO authenticated WITH CHECK (creador_id = auth.uid());

CREATE POLICY "partidos_update" ON partidos
  FOR UPDATE TO authenticated USING (creador_id = auth.uid());

CREATE POLICY "partidos_delete" ON partidos
  FOR DELETE TO authenticated USING (creador_id = auth.uid());

-- partido_jugadores: cualquier autenticado lee; cada uno gestiona la suya
CREATE POLICY "pj_select" ON partido_jugadores
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "pj_insert" ON partido_jugadores
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "pj_delete" ON partido_jugadores
  FOR DELETE TO authenticated USING (user_id = auth.uid());
