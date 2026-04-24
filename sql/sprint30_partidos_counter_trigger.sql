-- Sprint 30: Trigger para recalcular slots_ocupados automáticamente
-- Evita race conditions al unirse/salir de partidos sociales
-- Ejecutar en Supabase SQL Editor

CREATE OR REPLACE FUNCTION sync_partido_slots()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  pid UUID;
  cnt INT;
BEGIN
  pid := COALESCE(NEW.partido_id, OLD.partido_id);
  SELECT COUNT(*) INTO cnt FROM partido_jugadores WHERE partido_id = pid;

  UPDATE partidos SET
    slots_ocupados = cnt,
    estado = CASE
      WHEN estado = 'cancelado' THEN 'cancelado'
      WHEN cnt >= slots_totales   THEN 'completo'
      ELSE 'abierto'
    END
  WHERE id = pid;

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_partido_slots ON partido_jugadores;
CREATE TRIGGER trg_sync_partido_slots
AFTER INSERT OR DELETE ON partido_jugadores
FOR EACH ROW EXECUTE FUNCTION sync_partido_slots();

-- Sincronizar todos los partidos existentes una vez
UPDATE partidos p
SET slots_ocupados = (SELECT COUNT(*) FROM partido_jugadores pj WHERE pj.partido_id = p.id),
    estado = CASE
      WHEN p.estado = 'cancelado' THEN 'cancelado'
      WHEN (SELECT COUNT(*) FROM partido_jugadores pj WHERE pj.partido_id = p.id) >= p.slots_totales THEN 'completo'
      ELSE 'abierto'
    END;
