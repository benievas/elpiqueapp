-- ============================================================
-- Sprint 7 — Pagos MercadoPago
-- EJECUTAR EN SUPABASE SQL EDITOR
-- Usa DROP + CREATE para evitar conflictos con tabla payments preexistente
-- ============================================================

-- ─── Limpiar tabla preexistente (sin datos útiles aún) ────────
DROP TABLE IF EXISTS payments CASCADE;

-- ─── TABLA payments ──────────────────────────────────────────
CREATE TABLE payments (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID        REFERENCES profiles(id)           ON DELETE SET NULL,
  booking_id          UUID        REFERENCES court_availability(id) ON DELETE SET NULL,
  subscription_id     UUID        REFERENCES subscriptions(id)      ON DELETE SET NULL,
  type                TEXT        NOT NULL
                        CHECK (type IN ('booking', 'pro_player', 'owner_sub')),
  amount              NUMERIC     NOT NULL,
  mp_preference_id    TEXT,
  mp_payment_id       TEXT,
  mp_external_ref     TEXT,
  status              TEXT        NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled', 'refunded')),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices
CREATE INDEX payments_user_id_idx    ON payments (user_id);
CREATE INDEX payments_booking_id_idx ON payments (booking_id);
CREATE INDEX payments_status_idx     ON payments (status);
CREATE INDEX payments_mp_pay_idx     ON payments (mp_payment_id);
CREATE INDEX payments_ext_ref_idx    ON payments (mp_external_ref);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION update_payments_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;
CREATE TRIGGER trg_payments_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION update_payments_updated_at();

-- ─── RLS ─────────────────────────────────────────────────────
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access payments" ON payments
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "Users read own payments" ON payments
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users insert own payments" ON payments
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- ─── Columnas extra en subscriptions ─────────────────────────
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS mp_preference_id TEXT;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS mp_payment_id    TEXT;

-- ─── VERIFICACIÓN ────────────────────────────────────────────
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'payments'
ORDER BY ordinal_position;
