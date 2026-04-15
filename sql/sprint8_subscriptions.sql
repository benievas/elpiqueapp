-- ============================================================
-- Sprint 8 — Suscripciones con Trial (30 días gratis)
-- EJECUTAR EN SUPABASE SQL EDITOR
-- ============================================================

-- ─── 1. Columna is_trial en subscriptions ────────────────────
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS is_trial BOOLEAN NOT NULL DEFAULT false;

-- ─── 2. Ampliar CHECK de status para incluir 'trial' ─────────
ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS subscriptions_status_check;
ALTER TABLE subscriptions ADD CONSTRAINT subscriptions_status_check
  CHECK (status IN ('active', 'trial', 'pending', 'cancelled', 'expired'));

-- ─── 3. RLS: usuarios pueden insertar su propia suscripción ──
--     (necesario para activar trial desde el cliente)
DROP POLICY IF EXISTS "Users insert own subscriptions" ON subscriptions;
CREATE POLICY "Users insert own subscriptions" ON subscriptions
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- ─── 4. RPC para verificar suscripción activa ────────────────
CREATE OR REPLACE FUNCTION has_active_subscription(p_user_id UUID, p_plan TEXT)
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM subscriptions
    WHERE user_id  = p_user_id
      AND plan     = p_plan
      AND status   IN ('active', 'trial')
      AND (ends_at IS NULL OR ends_at > now())
  );
$$;

-- ─── 5. Trigger: trial automático al convertirse en owner ────
CREATE OR REPLACE FUNCTION auto_create_owner_trial()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.role = 'owner' AND (OLD IS NULL OR OLD.role IS DISTINCT FROM 'owner') THEN
    IF NOT EXISTS (SELECT 1 FROM subscriptions WHERE user_id = NEW.id AND plan = 'owner') THEN
      INSERT INTO subscriptions (user_id, plan, status, amount, is_trial, starts_at, ends_at, notes)
      VALUES (
        NEW.id, 'owner', 'trial', 0, true,
        now(), now() + INTERVAL '30 days',
        'Período de prueba gratuito — 30 días'
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_owner_trial ON profiles;
CREATE TRIGGER trg_auto_owner_trial
  AFTER INSERT OR UPDATE OF role ON profiles
  FOR EACH ROW EXECUTE FUNCTION auto_create_owner_trial();

-- ─── 6. Dar trial a owners existentes sin suscripción ────────
INSERT INTO subscriptions (user_id, plan, status, amount, is_trial, starts_at, ends_at, notes)
SELECT p.id, 'owner', 'trial', 0, true,
       now(), now() + INTERVAL '30 days',
       'Período de prueba gratuito — 30 días'
FROM profiles p
WHERE p.role = 'owner'
  AND NOT EXISTS (
    SELECT 1 FROM subscriptions s WHERE s.user_id = p.id AND s.plan = 'owner'
  );

-- ─── VERIFICACIÓN ────────────────────────────────────────────
SELECT p.id, p.role,
       s.status, s.is_trial, s.ends_at
FROM profiles p
LEFT JOIN subscriptions s ON s.user_id = p.id AND s.plan = 'owner'
WHERE p.role = 'owner'
ORDER BY p.created_at DESC
LIMIT 10;
