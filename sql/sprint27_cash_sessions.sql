-- Sprint 27: Sistema de sesiones de caja (POS)
-- Ejecutar en Supabase SQL Editor

-- Tabla de sesiones de caja
CREATE TABLE IF NOT EXISTS cash_sessions (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  complex_id    UUID        NOT NULL REFERENCES complexes(id) ON DELETE CASCADE,
  opened_by     UUID        NOT NULL REFERENCES profiles(id),
  closed_by     UUID        REFERENCES profiles(id),
  opened_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  closed_at     TIMESTAMPTZ,
  fondo_inicial DECIMAL(10,2) NOT NULL DEFAULT 0,
  saldo_final   DECIMAL(10,2),
  notas_cierre  TEXT,
  estado        TEXT        NOT NULL DEFAULT 'abierta'
                            CHECK (estado IN ('abierta', 'cerrada'))
);

CREATE INDEX IF NOT EXISTS idx_cash_sessions_complex ON cash_sessions(complex_id);
CREATE INDEX IF NOT EXISTS idx_cash_sessions_estado  ON cash_sessions(complex_id, estado);

-- RLS cash_sessions
ALTER TABLE cash_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owner manages cash_sessions" ON cash_sessions;
CREATE POLICY "Owner manages cash_sessions" ON cash_sessions
  FOR ALL USING (
    complex_id IN (SELECT id FROM complexes WHERE owner_id = auth.uid())
  ) WITH CHECK (
    complex_id IN (SELECT id FROM complexes WHERE owner_id = auth.uid())
  );

-- Agregar session_id a cash_movements (si ya existe la tabla)
ALTER TABLE cash_movements
  ADD COLUMN IF NOT EXISTS session_id UUID REFERENCES cash_sessions(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_cash_movements_session ON cash_movements(session_id);
