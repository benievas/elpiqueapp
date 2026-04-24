-- Sprint 29: tabla comprobantes de pago por transferencia

CREATE TABLE IF NOT EXISTS payment_comprobantes (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  complex_id     UUID REFERENCES complexes(id) ON DELETE SET NULL,
  plan           TEXT NOT NULL CHECK (plan IN ('monthly','annual')),
  monto          INT  NOT NULL,
  comprobante_url TEXT NOT NULL,
  estado         TEXT NOT NULL DEFAULT 'pendiente'
                 CHECK (estado IN ('pendiente','aprobado','rechazado')),
  notas_admin    TEXT,
  created_at     TIMESTAMPTZ DEFAULT now(),
  reviewed_at    TIMESTAMPTZ
);

ALTER TABLE payment_comprobantes ENABLE ROW LEVEL SECURITY;

-- Owner solo ve sus propios comprobantes
CREATE POLICY "comprobantes_select_own" ON payment_comprobantes
  FOR SELECT TO authenticated USING (user_id = auth.uid());

-- Owner puede insertar
CREATE POLICY "comprobantes_insert_own" ON payment_comprobantes
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- Admin puede ver y actualizar todos
CREATE POLICY "comprobantes_admin_all" ON payment_comprobantes
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND rol = 'admin')
  );

-- Índices
CREATE INDEX IF NOT EXISTS payment_comprobantes_user_id_idx ON payment_comprobantes(user_id);
CREATE INDEX IF NOT EXISTS payment_comprobantes_estado_idx ON payment_comprobantes(estado);
