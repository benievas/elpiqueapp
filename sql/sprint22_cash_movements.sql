-- Sprint 22 FIX: Tabla cash_movements SIN trigger moddatetime
-- La función moddatetime() requiere la extensión 'moddatetime' que no está activada.
-- Usamos un trigger manual con NOW() en su lugar.
-- Ejecutar en Supabase SQL Editor

CREATE TABLE IF NOT EXISTS cash_movements (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  complex_id  UUID NOT NULL REFERENCES complexes(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  tipo        TEXT NOT NULL CHECK (tipo IN ('ingreso', 'egreso')),
  categoria   TEXT NOT NULL,
  monto       DECIMAL(10,2) NOT NULL,
  metodo_pago TEXT NOT NULL DEFAULT 'efectivo',
  descripcion TEXT,
  notas       TEXT,
  fecha       TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  reservation_id UUID REFERENCES reservations(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  updated_at  TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- Índices útiles
CREATE INDEX IF NOT EXISTS idx_cash_movements_complex ON cash_movements(complex_id);
CREATE INDEX IF NOT EXISTS idx_cash_movements_fecha ON cash_movements(fecha);

-- RLS
ALTER TABLE cash_movements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owner full access cash_movements" ON cash_movements;
CREATE POLICY "Owner full access cash_movements" ON cash_movements
  FOR ALL USING (
    complex_id IN (
      SELECT id FROM complexes WHERE owner_id = auth.uid()
    )
  ) WITH CHECK (
    complex_id IN (
      SELECT id FROM complexes WHERE owner_id = auth.uid()
    )
  );

-- Trigger updated_at sin extensión moddatetime
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_cash_movements_updated_at ON cash_movements;
CREATE TRIGGER set_cash_movements_updated_at
  BEFORE UPDATE ON cash_movements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
