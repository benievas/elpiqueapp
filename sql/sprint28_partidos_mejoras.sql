-- =====================================================
-- SPRINT 28: Mejoras Armá Partido
-- Ejecutar en Supabase SQL Editor
-- =====================================================

-- 1. Agregar complex_id a partidos (FK opcional)
ALTER TABLE partidos
  ADD COLUMN IF NOT EXISTS complex_id UUID REFERENCES complexes(id) ON DELETE SET NULL;

-- 2. Actualizar RLS de partidos para permitir cancelar (UPDATE estado='cancelado' por el creador)
DROP POLICY IF EXISTS "partidos_update" ON partidos;
CREATE POLICY "partidos_update" ON partidos
  FOR UPDATE TO authenticated USING (creador_id = auth.uid());

-- 3. RLS delete para partido_jugadores (creador puede limpiar todos los jugadores)
DROP POLICY IF EXISTS "partido_jugadores_delete_all" ON partido_jugadores;
CREATE POLICY "partido_jugadores_delete_all" ON partido_jugadores
  FOR DELETE TO authenticated USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM partidos p WHERE p.id = partido_id AND p.creador_id = auth.uid()
    )
  );
