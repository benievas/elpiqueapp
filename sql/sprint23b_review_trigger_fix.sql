-- Sprint 23 B: Fix triggers and cache for complexes and subscriptions (CORREGIDO)

-- 1. Asegurar el Trigger de Reseñas para calcular rating promedio y total reviews
CREATE OR REPLACE FUNCTION update_complex_rating()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    UPDATE complexes
    SET rating_promedio = (SELECT ROUND(AVG(estrellas)::numeric, 1) FROM reviews WHERE complex_id = NEW.complex_id),
        total_reviews = (SELECT COUNT(*) FROM reviews WHERE complex_id = NEW.complex_id)
    WHERE id = NEW.complex_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE complexes
    SET rating_promedio = (SELECT COALESCE(ROUND(AVG(estrellas)::numeric, 1), 0) FROM reviews WHERE complex_id = OLD.complex_id),
        total_reviews = (SELECT COUNT(*) FROM reviews WHERE complex_id = OLD.complex_id)
    WHERE id = OLD.complex_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_complex_rating ON reviews;
CREATE TRIGGER trg_update_complex_rating
AFTER INSERT OR UPDATE OR DELETE ON reviews
FOR EACH ROW EXECUTE FUNCTION update_complex_rating();

-- Forzar recálculo para arreglar valores que puedan haber quedado en 0
UPDATE complexes c
SET rating_promedio = COALESCE((SELECT ROUND(AVG(estrellas)::numeric, 1) FROM reviews WHERE complex_id = c.id), 0),
    total_reviews = COALESCE((SELECT COUNT(*) FROM reviews WHERE complex_id = c.id), 0);
