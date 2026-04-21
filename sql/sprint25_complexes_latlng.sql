-- Sprint 25: Coordenadas geográficas en complexes
-- Ejecutar en Supabase SQL Editor

-- Agregar columnas lat/lng si no existen
ALTER TABLE complexes ADD COLUMN IF NOT EXISTS lat DOUBLE PRECISION;
ALTER TABLE complexes ADD COLUMN IF NOT EXISTS lng DOUBLE PRECISION;

-- Comentarios descriptivos
COMMENT ON COLUMN complexes.lat IS 'Latitud del complejo (marcada por el propietario en el mapa)';
COMMENT ON COLUMN complexes.lng IS 'Longitud del complejo (marcada por el propietario en el mapa)';
