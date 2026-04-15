-- MatchPro — Sprint 4: MercadoPago Marketplace
-- Aplicar en Supabase → SQL Editor
-- Fecha: 2026-03-31

-- ============================================================================
-- 1. TABLA payments
--    Registra cada intento/confirmación de pago vía MercadoPago
-- ============================================================================
CREATE TABLE IF NOT EXISTS payments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id      UUID REFERENCES court_availability(id) ON DELETE SET NULL,
  party_id        UUID REFERENCES parties(id) ON DELETE SET NULL,
  payer_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  preference_id   TEXT,            -- MP preference_id (generado al crear el intent de pago)
  payment_id      TEXT,            -- MP payment_id (retornado al confirmar)
  merchant_order  TEXT,            -- MP merchant_order_id
  status          TEXT DEFAULT 'pending',
  -- pending | approved | in_process | rejected | refunded | cancelled | charged_back
  amount          NUMERIC(10,2) NOT NULL,
  currency        TEXT DEFAULT 'ARS',
  description     TEXT,
  metadata        JSONB,           -- datos extra (ej: court_name, party_name, etc.)
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'payments' AND policyname = 'payments_select_own') THEN
    CREATE POLICY "payments_select_own" ON payments
      FOR SELECT USING (payer_id = auth.uid());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'payments' AND policyname = 'payments_insert_own') THEN
    CREATE POLICY "payments_insert_own" ON payments
      FOR INSERT WITH CHECK (payer_id = auth.uid());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'payments' AND policyname = 'payments_update_own') THEN
    CREATE POLICY "payments_update_own" ON payments
      FOR UPDATE USING (payer_id = auth.uid());
  END IF;
END $$;


-- ============================================================================
-- 2. TABLA party_payments
--    Seña grupal: cada miembro del partido paga su parte
-- ============================================================================
CREATE TABLE IF NOT EXISTS party_payments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  party_id    UUID NOT NULL REFERENCES parties(id) ON DELETE CASCADE,
  player_id   UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  payment_id  UUID REFERENCES payments(id) ON DELETE SET NULL,
  amount      NUMERIC(10,2),
  status      TEXT DEFAULT 'pending',  -- pending | paid | refunded
  paid_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE (party_id, player_id)
);

ALTER TABLE party_payments ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'party_payments' AND policyname = 'party_payments_select') THEN
    CREATE POLICY "party_payments_select" ON party_payments
      FOR SELECT USING (
        player_id IN (SELECT id FROM players WHERE profile_id = auth.uid())
        OR party_id IN (SELECT id FROM parties WHERE creator_id = auth.uid())
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'party_payments' AND policyname = 'party_payments_insert') THEN
    CREATE POLICY "party_payments_insert" ON party_payments
      FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
  END IF;
END $$;


-- ============================================================================
-- 3. Columna requires_payment en parties (opcional, para partidos con seña)
-- ============================================================================
ALTER TABLE parties ADD COLUMN IF NOT EXISTS requires_payment BOOLEAN DEFAULT false;
ALTER TABLE parties ADD COLUMN IF NOT EXISTS payment_amount   NUMERIC(10,2);

-- ============================================================================
-- 4. Columna payment_required en court_availability
-- ============================================================================
ALTER TABLE court_availability ADD COLUMN IF NOT EXISTS payment_id UUID REFERENCES payments(id) ON DELETE SET NULL;

-- ============================================================================
-- Verificación post-ejecución:
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'
--   AND table_name IN ('payments', 'party_payments');
-- ============================================================================
