-- Sprint 5.8: Trigger automático — cancelar party cuando se elimina su slot de court_availability
-- Ejecutar en Supabase SQL Editor

-- Función que cancela el partido vinculado al borrar un slot
CREATE OR REPLACE FUNCTION fn_cancel_party_on_slot_delete()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.party_id IS NOT NULL THEN
    UPDATE parties SET status = 'cancelled' WHERE id = OLD.party_id;
  END IF;
  RETURN OLD;
END;
$$;

-- Trigger: se ejecuta ANTES de cada DELETE en court_availability
DROP TRIGGER IF EXISTS trg_cancel_party_on_slot_delete ON court_availability;
CREATE TRIGGER trg_cancel_party_on_slot_delete
BEFORE DELETE ON court_availability
FOR EACH ROW EXECUTE FUNCTION fn_cancel_party_on_slot_delete();
