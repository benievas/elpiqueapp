-- Sprint 21: Storage Policies para 'app-media'
-- Ejecutar en Supabase SQL Editor para permitir la subida de imágenes

-- Asegurarse de que el bucket exista (si no existe, crearlo)
INSERT INTO storage.buckets (id, name, public)
VALUES ('app-media', 'app-media', true)
ON CONFLICT (id) DO NOTHING;

-- Permitir a cualquier usuario autenticado subir archivos al bucket app-media
DROP POLICY IF EXISTS "Permitir subida de media a usuarios autenticados" ON storage.objects;
CREATE POLICY "Permitir subida de media a usuarios autenticados"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'app-media' );

-- Permitir a cualquier usuario autenticado modificar o borrar sus archivos en app-media
DROP POLICY IF EXISTS "Permitir modificacion de media a autores" ON storage.objects;
CREATE POLICY "Permitir modificacion de media a autores"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'app-media' AND owner = auth.uid() );

DROP POLICY IF EXISTS "Permitir borrado de media a autores" ON storage.objects;
CREATE POLICY "Permitir borrado de media a autores"
ON storage.objects FOR DELETE
TO authenticated
USING ( bucket_id = 'app-media' AND owner = auth.uid() );

-- Permitir a TODO EL MUNDO leer los archivos (para las imágenes públicas de los torneos, feed, etc)
DROP POLICY IF EXISTS "Permitir lectura publica de app-media" ON storage.objects;
CREATE POLICY "Permitir lectura publica de app-media"
ON storage.objects FOR SELECT
TO public
USING ( bucket_id = 'app-media' );
