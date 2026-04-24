-- Sprint 19: Sincronización Automática de Rating Promedio
-- Ejecutar en Supabase SQL Editor

-- Función que recalcula el rating y total de reseñas de un complejo
CREATE OR REPLACE FUNCTION update_complex_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE complexes
  SET 
    rating_promedio = (
      SELECT ROUND(AVG(estrellas::numeric), 1) 
      FROM reviews 
      WHERE complex_id = COALESCE(NEW.complex_id, OLD.complex_id)
    ),
    total_reviews = (
      SELECT COUNT(*) 
      FROM reviews 
      WHERE complex_id = COALESCE(NEW.complex_id, OLD.complex_id)
    )
  WHERE id = COALESCE(NEW.complex_id, OLD.complex_id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Disparador que ejecuta la función al insertar, actualizar o eliminar una reseña
DROP TRIGGER IF EXISTS trigger_update_complex_rating ON reviews;
CREATE TRIGGER trigger_update_complex_rating
AFTER INSERT OR UPDATE OR DELETE ON reviews
FOR EACH ROW
EXECUTE FUNCTION update_complex_rating();
