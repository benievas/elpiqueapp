-- ============================================================
-- Sprint 10 FIX — Triggers SQL puro (sin net.http_post)
-- Las llamadas a MP se manejan desde la app y mp-webhook
-- EJECUTAR EN SUPABASE SQL EDITOR
-- ============================================================

-- ─── FIX: constraint mp_status ────────────────────────────────
ALTER TABLE party_payments DROP CONSTRAINT IF EXISTS party_payments_mp_status_check;
ALTER TABLE party_payments ADD CONSTRAINT party_payments_mp_status_check
  CHECK (mp_status IN ('pending','authorized','captured','cancelled','refunded'));

-- ─── FIX Función 4: recalcular collected_amount ───────────────
CREATE OR REPLACE FUNCTION fn_update_party_collected()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_party_id  UUID;
  v_collected NUMERIC(10,2);
  v_seña      NUMERIC(10,2);
BEGIN
  IF TG_OP = 'DELETE' THEN v_party_id := OLD.party_id;
  ELSE                      v_party_id := NEW.party_id;
  END IF;

  SELECT COALESCE(SUM(amount), 0) INTO v_collected
  FROM party_payments
  WHERE party_id = v_party_id
    AND mp_status IN ('authorized', 'captured');

  SELECT seña_amount INTO v_seña FROM parties WHERE id = v_party_id;

  UPDATE parties SET
    collected_amount = v_collected,
    payment_status = CASE
      WHEN v_collected <= 0      THEN 'pending'
      WHEN v_collected >= v_seña THEN 'funded'
      ELSE                            'partial'
    END
  WHERE id = v_party_id;

  RETURN NULL;
END;
$$;

-- ─── FIX Función 5: al llegar a funded → confirmar slot (SQL puro) ──
-- La captura en MP la dispara el mp-webhook al detectar payment_status='funded'
CREATE OR REPLACE FUNCTION fn_on_party_funded()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NEW.payment_status = 'funded' AND
     (OLD.payment_status IS DISTINCT FROM 'funded') THEN
    -- Solo SQL: confirmar el slot de la cancha
    UPDATE court_availability
    SET status = 'confirmed'
    WHERE party_id = NEW.id AND status = 'pending';
  END IF;
  RETURN NEW;
END;
$$;

-- ─── FIX Función 6: al cancelar partido → marcar pagos para reembolso ──
-- El reembolso real en MP lo maneja la app / cancel-expired-parties
CREATE OR REPLACE FUNCTION fn_on_party_cancelled()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NEW.status = 'cancelled' AND
     (OLD.status IS DISTINCT FROM 'cancelled') AND
     NEW.payment_status NOT IN ('funded', 'released') THEN

    -- Marcar todos los pagos capturados como pendientes de reembolso
    -- (la Edge Function refund-party-payments los procesa)
    UPDATE parties SET payment_status = 'refunded' WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

-- ─── FIX Función 7: al sacar jugador → el slot queda libre ────
-- El reembolso individual lo maneja la app al confirmar la baja
CREATE OR REPLACE FUNCTION fn_on_member_removed()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_payment_status TEXT;
BEGIN
  SELECT payment_status INTO v_payment_status FROM parties WHERE id = OLD.party_id;
  -- Si ya está fundado/completado, no hacer nada especial
  -- El reembolso (si aplica) lo maneja la app antes de llamar el DELETE
  RETURN OLD;
END;
$$;

-- ─── VERIFICACIÓN ─────────────────────────────────────────────
SELECT routine_name FROM information_schema.routines
WHERE routine_name IN (
  'fn_update_party_collected','fn_on_party_funded',
  'fn_on_party_cancelled','fn_on_member_removed'
);
