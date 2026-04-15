-- ============================================================
-- Sprint 10: Bucket app-media para videos e imágenes del admin
-- Ejecutar en SQL Editor de Supabase
-- ============================================================

-- Crear bucket público app-media (si no existe)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'app-media',
  'app-media',
  true,                          -- público: URLs accesibles sin auth
  524288000,                     -- 500 MB límite por archivo
  ARRAY[
    'video/mp4', 'video/webm', 'video/quicktime',
    'image/jpeg', 'image/png', 'image/webp', 'image/gif'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 524288000,
  allowed_mime_types = ARRAY[
    'video/mp4', 'video/webm', 'video/quicktime',
    'image/jpeg', 'image/png', 'image/webp', 'image/gif'
  ];

-- ── RLS: solo admins pueden subir/actualizar/eliminar ─────────────────────────

-- Lectura pública (para que los videos se vean en la app)
CREATE POLICY "app-media public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'app-media');

-- Solo admins pueden insertar
CREATE POLICY "app-media admin insert"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'app-media'
    AND (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

-- Solo admins pueden actualizar (upsert)
CREATE POLICY "app-media admin update"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'app-media'
    AND (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

-- Solo admins pueden eliminar
CREATE POLICY "app-media admin delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'app-media'
    AND (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );
