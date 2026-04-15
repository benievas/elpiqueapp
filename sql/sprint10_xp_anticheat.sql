-- Sprint 10: Anti-gaming del sistema XP
-- Ejecutar en Supabase SQL Editor

-- ── Tabla de log de XP ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS xp_log (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  action      TEXT NOT NULL,
  xp_amount   INT  NOT NULL,
  party_id    UUID,                    -- NULL para acciones sin partido (win, finish)
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_xp_log_profile  ON xp_log(profile_id);
CREATE INDEX IF NOT EXISTS idx_xp_log_party    ON xp_log(party_id) WHERE party_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_xp_log_daily    ON xp_log(profile_id, action, created_at);

ALTER TABLE xp_log ENABLE ROW LEVEL SECURITY;
-- Solo el propio jugador puede leer su log; nadie puede escribir directamente (solo via RPC)
CREATE POLICY "xp_log_select" ON xp_log FOR SELECT TO authenticated USING (profile_id = auth.uid());

-- ── RPC award_xp con cap diario ──────────────────────────────
-- Límites diarios:
--   create_party → 2 veces/día  (evita crear+cancelar en loop)
--   join_party   → 4 veces/día  (puede unirse a varios partidos)
--   win_party    → sin límite   (ganó de verdad)
--   finish_party → sin límite   (completó el partido)
--
-- Retorna TRUE si se otorgó XP, FALSE si se alcanzó el cap.
CREATE OR REPLACE FUNCTION public.award_xp(
  p_profile_id  UUID,
  p_action      TEXT,
  p_xp          INT,
  p_party_id    UUID    DEFAULT NULL,
  p_parties_add INT     DEFAULT 0
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_daily_count INT;
  v_max_daily   INT;
  v_already     INT;
BEGIN
  -- Cap diario por acción
  v_max_daily := CASE p_action
    WHEN 'create_party' THEN 2
    WHEN 'join_party'   THEN 4
    ELSE 9999
  END;

  -- Evitar doble XP por el mismo partido
  IF p_party_id IS NOT NULL THEN
    SELECT COUNT(*) INTO v_already
    FROM xp_log
    WHERE profile_id = p_profile_id
      AND action     = p_action
      AND party_id   = p_party_id;

    IF v_already > 0 THEN
      RETURN FALSE; -- ya se otorgó XP para este partido
    END IF;
  END IF;

  -- Verificar cap diario
  SELECT COUNT(*) INTO v_daily_count
  FROM xp_log
  WHERE profile_id = p_profile_id
    AND action     = p_action
    AND created_at >= date_trunc('day', now() AT TIME ZONE 'America/Argentina/Buenos_Aires');

  IF v_daily_count >= v_max_daily THEN
    RETURN FALSE; -- cap alcanzado
  END IF;

  -- Registrar el evento
  INSERT INTO xp_log (profile_id, action, xp_amount, party_id)
  VALUES (p_profile_id, p_action, p_xp, p_party_id);

  -- Otorgar XP
  INSERT INTO player_stats (profile_id, xp, parties_played, level)
  VALUES (
    p_profile_id, p_xp, p_parties_add,
    CASE WHEN p_xp >= 1000 THEN 'elite' WHEN p_xp >= 600 THEN 'avanzado'
         WHEN p_xp >= 300 THEN 'intermedio' WHEN p_xp >= 100 THEN 'amateur'
         ELSE 'principiante' END
  )
  ON CONFLICT (profile_id) DO UPDATE SET
    xp             = player_stats.xp + p_xp,
    parties_played = player_stats.parties_played + p_parties_add,
    level = CASE
      WHEN player_stats.xp + p_xp >= 1000 THEN 'elite'
      WHEN player_stats.xp + p_xp >= 600  THEN 'avanzado'
      WHEN player_stats.xp + p_xp >= 300  THEN 'intermedio'
      WHEN player_stats.xp + p_xp >= 100  THEN 'amateur'
      ELSE 'principiante'
    END,
    updated_at = now();

  RETURN TRUE;
END;
$$;

GRANT EXECUTE ON FUNCTION public.award_xp(UUID, TEXT, INT, UUID, INT) TO authenticated;
