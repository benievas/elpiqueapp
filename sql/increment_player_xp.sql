-- Función para incrementar XP del jugador y recalcular nivel
-- Ejecutar en Supabase SQL Editor

CREATE OR REPLACE FUNCTION public.increment_player_xp(
  profile_id_input UUID,
  xp_to_add       INT,
  parties_to_add   INT DEFAULT 0
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_xp INT;
BEGIN
  -- Upsert: crea el registro si no existe, o suma XP si ya existe
  INSERT INTO player_stats (profile_id, xp, parties_played, level)
  VALUES (
    profile_id_input,
    xp_to_add,
    parties_to_add,
    CASE
      WHEN xp_to_add >= 1000 THEN 'elite'
      WHEN xp_to_add >= 600  THEN 'avanzado'
      WHEN xp_to_add >= 300  THEN 'intermedio'
      WHEN xp_to_add >= 100  THEN 'amateur'
      ELSE 'principiante'
    END
  )
  ON CONFLICT (profile_id) DO UPDATE
  SET
    xp             = player_stats.xp + xp_to_add,
    parties_played = player_stats.parties_played + parties_to_add,
    level = CASE
      WHEN player_stats.xp + xp_to_add >= 1000 THEN 'elite'
      WHEN player_stats.xp + xp_to_add >= 600  THEN 'avanzado'
      WHEN player_stats.xp + xp_to_add >= 300  THEN 'intermedio'
      WHEN player_stats.xp + xp_to_add >= 100  THEN 'amateur'
      ELSE 'principiante'
    END,
    updated_at = NOW();
END;
$$;

-- Dar permisos al rol anon y authenticated
GRANT EXECUTE ON FUNCTION public.increment_player_xp(UUID, INT, INT) TO anon, authenticated;
