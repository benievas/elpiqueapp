-- Sprint 21: Agregar imagen_url a la tabla courts
-- Ejecutar en Supabase SQL Editor para permitir subir fotos por cancha

ALTER TABLE courts ADD COLUMN IF NOT EXISTS imagen_principal TEXT;
