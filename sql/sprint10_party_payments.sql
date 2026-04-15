-- ============================================================
-- Sprint 10 — Pagos Fraccionados MP (Pre-auth + Escrow)
-- EJECUTAR EN SUPABASE SQL EDITOR
-- ============================================================

-- ─── 1. Columnas en parties ───────────────────────────────────
ALTER TABLE parties
  ADD COLUMN IF NOT EXISTS payment_mode      TEXT        DEFAULT 'full'
    CHECK (payment_mode IN ('full', 'split')),
  ADD COLUMN IF NOT EXISTS total_amount      NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS seña_amount       NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS collected_amount  NUMERIC(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS payment_status    TEXT        NOT NULL DEFAULT 'pending'
    CHECK (payment_status IN ('pending','partial','funded','released','refunded')),
  ADD COLUMN IF NOT EXISTS payment_deadline  TIMESTAMPTZ;

COMMENT ON COLUMN parties.payment_mode     IS 'full = pago total anticipado, split = pago fraccionado';
COMMENT ON COLUMN parties.total_amount     IS 'Precio total de la cancha';
COMMENT ON COLUMN parties.seña_amount      IS 'Monto objetivo (seña % del total o total)';
COMMENT ON COLUMN parties.collected_amount IS 'Monto acumulado en escrow (pre-auths aprobados)';
COMMENT ON COLUMN parties.payment_status   IS 'Estado del escrow del partido';
COMMENT ON COLUMN parties.payment_deadline IS 'Límite horario para completar la meta (24hs antes del partido)';

-- ─── 2. Tabla party_payments ──────────────────────────────────
DROP TABLE IF EXISTS party_payments CASCADE;

CREATE TABLE party_payments (
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

-- ─── 3. RLS party_payments ────────────────────────────────────
ALTER TABLE party_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access party_payments" ON party_payments
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "Player read own payments" ON party_payments
  FOR SELECT USING (player_id = auth.uid());

CREATE POLICY "Player insert own payments" ON party_payments
  FOR INSERT WITH CHECK (player_id = auth.uid());

-- Owner puede ver pagos de sus partidos
CREATE POLICY "Owner read party payments" ON party_payments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM parties p
      JOIN court_availability ca ON ca.party_id = p.id
      JOIN courts c ON c.id = ca.court_id
      JOIN complexes cx ON cx.id = c.complex_id
      WHERE p.id = party_payments.party_id
        AND cx.owner_id = auth.uid()
    )
  );

-- ─── 4. Función: recalcular collected_amount y detectar meta ──
CREATE OR REPLACE FUNCTION fn_update_party_collected()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_party_id       UUID;
  v_collected      NUMERIC(10,2);
  v_seña           NUMERIC(10,2);
  v_deadline       TIMESTAMPTZ;
BEGIN
  -- Determinar party_id según operación
  IF TG_OP = 'DELETE' THEN
    v_party_id := OLD.party_id;
  ELSE
    v_party_id := NEW.party_id;
  END IF;

  -- Sumar solo pagos authorized o captured
  SELECT COALESCE(SUM(amount), 0)
  INTO v_collected
  FROM party_payments
  WHERE party_id = v_party_id
    AND mp_status IN ('authorized', 'captured');

  -- Obtener meta y deadline
  SELECT seña_amount, payment_deadline
  INTO v_seña, v_deadline
  FROM parties
  WHERE id = v_party_id;

  -- Actualizar collected_amount y payment_status
  UPDATE parties SET
    collected_amount = v_collected,
    payment_status = CASE
      WHEN v_collected <= 0                        THEN 'pending'
      WHEN v_collected >= v_seña                   THEN 'funded'
      ELSE                                              'partial'
    END
  WHERE id = v_party_id;

  RETURN NULL;
END;
$$;

CREATE TRIGGER trg_party_collected_update
  AFTER INSERT OR UPDATE OF mp_status OR DELETE ON party_payments
  FOR EACH ROW EXECUTE FUNCTION fn_update_party_collected();

-- ─── 5. Función: al llegar a 'funded' → confirmar slot ────────
CREATE OR REPLACE FUNCTION fn_on_party_funded()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- Solo actuar cuando payment_status cambia a 'funded'
  IF NEW.payment_status = 'funded' AND
     (OLD.payment_status IS DISTINCT FROM 'funded') THEN

    -- Confirmar el slot de court_availability
    UPDATE court_availability
    SET status = 'confirmed'
    WHERE party_id = NEW.id
      AND status = 'pending';

    -- Llamar Edge Function para capturar todos los holds
    -- (se hace via pg_net o desde la app al detectar el cambio)
    PERFORM net.http_post(
      url     := current_setting('app.supabase_url') || '/functions/v1/capture-party-payments',
      headers := jsonb_build_object(
        'Content-Type',  'application/json',
        'Authorization', 'Bearer ' || current_setting('app.service_role_key')
      ),
      body    := jsonb_build_object('party_id', NEW.id)
    );

  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_on_party_funded
  AFTER UPDATE OF payment_status ON parties
  FOR EACH ROW EXECUTE FUNCTION fn_on_party_funded();

-- ─── 6. Función: al cancelar partido → cancelar todos los holds
CREATE OR REPLACE FUNCTION fn_on_party_cancelled()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NEW.status = 'cancelled' AND
     (OLD.status IS DISTINCT FROM 'cancelled') AND
     NEW.payment_status NOT IN ('funded', 'released') THEN

    -- Llamar Edge Function para cancelar todos los holds
    PERFORM net.http_post(
      url     := current_setting('app.supabase_url') || '/functions/v1/cancel-party-payments',
      headers := jsonb_build_object(
        'Content-Type',  'application/json',
        'Authorization', 'Bearer ' || current_setting('app.service_role_key')
      ),
      body    := jsonb_build_object('party_id', NEW.id)
    );

  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_on_party_cancelled
  AFTER UPDATE OF status ON parties
  FOR EACH ROW EXECUTE FUNCTION fn_on_party_cancelled();

-- ─── 7. Función: al sacar jugador → cancelar su hold ──────────
CREATE OR REPLACE FUNCTION fn_on_member_removed()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_payment_status TEXT;
BEGIN
  -- Verificar que el partido no esté ya funded/released
  SELECT payment_status INTO v_payment_status
  FROM parties WHERE id = OLD.party_id;

  IF v_payment_status NOT IN ('funded', 'released') THEN
    PERFORM net.http_post(
      url     := current_setting('app.supabase_url') || '/functions/v1/cancel-party-payments',
      headers := jsonb_build_object(
        'Content-Type',  'application/json',
        'Authorization', 'Bearer ' || current_setting('app.service_role_key')
      ),
      body    := jsonb_build_object(
        'party_id',  OLD.party_id,
        'player_id', OLD.player_id
      )
    );
  END IF;

  RETURN OLD;
END;
$$;

CREATE TRIGGER trg_on_member_removed
  BEFORE DELETE ON party_members
  FOR EACH ROW EXECUTE FUNCTION fn_on_member_removed();

-- ─── 8. Cron: configurar por separado ────────────────────────
-- El cron de cancelación de partidos expirados se configura en:
-- sql/sprint10_cron.sql (ejecutar DESPUÉS de habilitar pg_cron)
-- Dashboard → Database → Extensions → pg_cron → Enable

-- ─── 9. RPC: obtener resumen de pagos de un partido ───────────
CREATE OR REPLACE FUNCTION get_party_payment_summary(p_party_id UUID)
RETURNS TABLE (
  player_id     UUID,
  username      TEXT,
  avatar_url    TEXT,
  amount        NUMERIC(10,2),
  mp_status     TEXT,
  paid_at       TIMESTAMPTZ
) LANGUAGE sql SECURITY DEFINER AS $$
  SELECT
    pp.player_id,
    pr.username,
    pr.avatar_url,
    pp.amount,
    pp.mp_status,
    pp.paid_at
  FROM party_payments pp
  JOIN profiles pr ON pr.id = pp.player_id
  WHERE pp.party_id = p_party_id
  ORDER BY pp.created_at;
$$;

-- ─── VERIFICACIÓN ─────────────────────────────────────────────
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'parties'
  AND column_name IN ('payment_mode','total_amount','seña_amount','collected_amount','payment_status','payment_deadline')
ORDER BY ordinal_position;

SELECT table_name FROM information_schema.tables
WHERE table_name = 'party_payments';
