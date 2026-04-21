-- Sprint 16: Auto-desactivar complejos sin suscripción activa

-- ─── 1. pg_cron: revisión diaria a las 3am ────────────────────────────────────
SELECT cron.schedule(
  'desactivar-complejos-sin-suscripcion',
  '0 3 * * *',
  $$
  UPDATE complexes
  SET activo = false, updated_at = NOW()
  WHERE activo = true
    AND NOT EXISTS (
      SELECT 1 FROM subscriptions s
      WHERE s.user_id = complexes.owner_id
        AND s.status IN ('active', 'trial')
        AND s.ends_at > NOW()
    );
  $$
);

-- ─── 2. Función sync: activa o desactiva complejos de un owner ────────────────
CREATE OR REPLACE FUNCTION sync_complex_activo(p_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  tiene_sub BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM subscriptions
    WHERE user_id = p_user_id
      AND status IN ('active', 'trial')
      AND ends_at > NOW()
  ) INTO tiene_sub;

  UPDATE complexes
  SET activo = tiene_sub, updated_at = NOW()
  WHERE owner_id = p_user_id;
END;
$$;

COMMENT ON FUNCTION sync_complex_activo IS
  'Activa o desactiva todos los complejos de un owner según suscripción vigente. Llamar desde webhook MP.';
