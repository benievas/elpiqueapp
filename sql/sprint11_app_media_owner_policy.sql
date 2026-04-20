-- ============================================================
-- Sprint 11 — Permitir a owners subir al prefijo complex-images/
--              dentro del bucket app-media
-- Ejecutar en Supabase SQL Editor
-- ============================================================

-- Owners (o admins) pueden insertar dentro de complex-images/{su_user_id}/...
DROP POLICY IF EXISTS "app-media owner insert complex-images" ON storage.objects;
CREATE POLICY "app-media owner insert complex-images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'app-media'
    AND name LIKE 'complex-images/' || auth.uid()::text || '/%'
  );

DROP POLICY IF EXISTS "app-media owner update complex-images" ON storage.objects;
CREATE POLICY "app-media owner update complex-images"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'app-media'
    AND name LIKE 'complex-images/' || auth.uid()::text || '/%'
  );

DROP POLICY IF EXISTS "app-media owner delete complex-images" ON storage.objects;
CREATE POLICY "app-media owner delete complex-images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'app-media'
    AND name LIKE 'complex-images/' || auth.uid()::text || '/%'
  );

-- (La lectura pública ya existe en sprint10_storage_app_media.sql)
