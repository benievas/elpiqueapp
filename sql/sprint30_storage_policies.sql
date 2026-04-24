-- Sprint 30: Políticas definitivas de storage para bucket app-media
-- Cubre todos los prefijos usados en la app:
--   feed-posts/, courts/, complex-images/, comprobantes/, home-slides/, home-videos/
-- Ejecutar en Supabase SQL Editor

-- 1. Asegurar que el bucket exista y sea público
INSERT INTO storage.buckets (id, name, public)
VALUES ('app-media', 'app-media', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Limpiar políticas conflictivas anteriores
DROP POLICY IF EXISTS "app-media owner insert complex-images" ON storage.objects;
DROP POLICY IF EXISTS "app-media owner update complex-images" ON storage.objects;
DROP POLICY IF EXISTS "app-media owner delete complex-images" ON storage.objects;
DROP POLICY IF EXISTS "Permitir subida de media a usuarios autenticados" ON storage.objects;
DROP POLICY IF EXISTS "Permitir modificacion de media a autores" ON storage.objects;
DROP POLICY IF EXISTS "Permitir borrado de media a autores" ON storage.objects;
DROP POLICY IF EXISTS "Permitir lectura publica de app-media" ON storage.objects;
DROP POLICY IF EXISTS "app-media authenticated upload" ON storage.objects;
DROP POLICY IF EXISTS "app-media authenticated update" ON storage.objects;
DROP POLICY IF EXISTS "app-media authenticated delete" ON storage.objects;
DROP POLICY IF EXISTS "app-media public read" ON storage.objects;

-- 3. Lectura pública (anon + authenticated)
CREATE POLICY "app-media public read"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'app-media');

-- 4. Cualquier usuario autenticado puede subir a app-media
CREATE POLICY "app-media authenticated upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'app-media');

-- 5. Cada usuario puede actualizar sus propios objetos
CREATE POLICY "app-media authenticated update"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'app-media' AND (auth.uid())::text = (storage.foldername(name))[2]);

-- 6. Cada usuario puede borrar sus propios objetos
CREATE POLICY "app-media authenticated delete"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'app-media' AND (auth.uid())::text = (storage.foldername(name))[2]);
