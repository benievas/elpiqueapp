-- ============================================================
-- Sprint 10 — MercadoPago: aplicar TODO en orden
-- Ejecutar este archivo completo en Supabase SQL Editor
-- ============================================================

-- ─── 1. Columnas MP OAuth en profiles ────────────────────────
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS mp_access_token   TEXT,
  ADD COLUMN IF NOT EXISTS mp_refresh_token  TEXT,
  ADD COLUMN IF NOT EXISTS mp_user_id        TEXT,
  ADD COLUMN IF NOT EXISTS mp_connected_at   TIMESTAMPTZ;

-- ─── 2. deposit_pct en courts (seña parcial) ─────────────────
ALTER TABLE courts
  ADD COLUMN IF NOT EXISTS deposit_pct INTEGER NOT NULL DEFAULT 100
  CHECK (deposit_pct BETWEEN 1 AND 100);

COMMENT ON COLUMN courts.deposit_pct IS '% del precio total que se cobra como seña (1-100). 100 = pago completo anticipado.';

-- ─── 3. Columnas de pago en parties ──────────────────────────
ALTER TABLE parties
  ADD COLUMN IF NOT EXISTS payment_mode      TEXT        DEFAULT 'full'
    CHECK (payment_mode IN ('full', 'split')),
  ADD COLUMN IF NOT EXISTS total_amount      NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS seña_amount       NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS collected_amount  NUMERIC(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS payment_status    TEXT        NOT NULL DEFAULT 'pending'
    CHECK (payment_status IN ('pending','partial','funded','released','refunded')),
  ADD COLUMN IF NOT EXISTS payment_deadline  TIMESTAMPTZ;

-- ─── 4. Tabla party_payments ─────────────────────────────────
CREATE TABLE IF NOT EXISTS party_payments (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  party_id          UUID        NOT NULL REFERENCES parties(id) ON DELETE CASCADE,
  player_id         UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount            NUMERIC(10,2) NOT NULL,
  mp_preference_id  TEXT,
  mp_payment_id     TEXT,
  mp_status         TEXT        NOT NULL DEFAULT 'pending'
    CHECK (mp_status IN ('pending','authorized','captured','cancelled','refunded')),
  paid_at           TIMESTAMPTZ,
  captured_at       TIMESTAMPTZ,
  cancelled_at      TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (party_id, player_id)
);

CREATE INDEX IF NOT EXISTS party_payments_party_idx  ON party_payments (party_id);
CREATE INDEX IF NOT EXISTS party_payments_player_idx ON party_payments (player_id);
CREATE INDEX IF NOT EXISTS party_payments_mp_idx     ON party_payments (mp_payment_id);

ALTER TABLE party_payments ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='party_payments' AND policyname='Admin full access party_payments') THEN
    CREATE POLICY "Admin full access party_payments" ON party_payments
      FOR ALL USING (is_admin()) WITH CHECK (is_admin());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='party_payments' AND policyname='Player read own payments') THEN
    CREATE POLICY "Player read own payments" ON party_payments
      FOR SELECT USING (player_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='party_payments' AND policyname='Player insert own payments') THEN
    CREATE POLICY "Player insert own payments" ON party_payments
      FOR INSERT WITH CHECK (player_id = auth.uid());
  END IF;
END $$;

-- ─── 5. RLS profiles: update MP tokens ───────────────────────
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='profiles' AND policyname='Owner update own mp tokens') THEN
    CREATE POLICY "Owner update own mp tokens" ON profiles
      FOR UPDATE USING (id = auth.uid())
      WITH CHECK (id = auth.uid());
  END IF;
END $$;

-- ─── 6. Función helper: owner tiene MP conectado ─────────────
CREATE OR REPLACE FUNCTION owner_has_mp_connected(p_owner_id UUID)
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER AS $$
  SELECT mp_access_token IS NOT NULL AND mp_access_token != ''
  FROM profiles WHERE id = p_owner_id;
$$;

-- ─── 7. Trigger: recalcular collected_amount ─────────────────
CREATE OR REPLACE FUNCTION fn_update_party_collected()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_party_id  UUID;
  v_collected NUMERIC(10,2);
  v_seña      NUMERIC(10,2);
BEGIN
  v_party_id := CASE WHEN TG_OP = 'DELETE' THEN OLD.party_id ELSE NEW.party_id END;
  SELECT COALESCE(SUM(amount), 0) INTO v_collected
  FROM party_payments
  WHERE party_id = v_party_id AND mp_status IN ('authorized', 'captured');
  SELECT seña_amount INTO v_seña FROM parties WHERE id = v_party_id;
  UPDATE parties SET
    collected_amount = v_collected,
    payment_status = CASE
      WHEN v_collected <= 0      THEN 'pending'
      WHEN v_collected >= v_seña THEN 'funded'
      ELSE 'partial'
    END
  WHERE id = v_party_id;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_party_collected_update ON party_payments;
CREATE TRIGGER trg_party_collected_update
  AFTER INSERT OR UPDATE OF mp_status OR DELETE ON party_payments
  FOR EACH ROW EXECUTE FUNCTION fn_update_party_collected();

-- ─── VERIFICACIÓN ─────────────────────────────────────────────
SELECT 'party_payments OK' WHERE EXISTS (
  SELECT 1 FROM information_schema.tables WHERE table_name = 'party_payments'
);
SELECT 'deposit_pct OK' WHERE EXISTS (
  SELECT 1 FROM information_schema.columns WHERE table_name='courts' AND column_name='deposit_pct'
);
SELECT 'mp_access_token OK' WHERE EXISTS (
  SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='mp_access_token'
);
