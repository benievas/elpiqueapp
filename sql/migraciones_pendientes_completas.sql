-- MatchPro — MIGRACIONES PENDIENTES COMPLETAS (Sprint 2)
-- Fecha: 2025-03-31
-- Executar en: Supabase Dashboard → SQL Editor

-- ============================================================================
-- PARTE 1: court_availability — Campos faltantes para sistema de reservas
-- ============================================================================

-- 1.1. Columnas de gestión de estado de reserva
ALTER TABLE court_availability ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';
ALTER TABLE court_availability ADD COLUMN IF NOT EXISTS booker_id UUID REFERENCES auth.users(id);
ALTER TABLE court_availability ADD COLUMN IF NOT EXISTS booker_note TEXT;
ALTER TABLE court_availability ADD COLUMN IF NOT EXISTS time_to TEXT; -- Para rangos horarios (ej: "16:00")

-- 1.2. Migrar datos existentes
-- Si ya hay reservas (is_booked = true), marcarlas como 'confirmed' para mantener consistencia
UPDATE court_availability SET status = 'confirmed' WHERE is_booked = true AND status IS NULL;

-- ============================================================================
-- PARTE 2: RLS Policies para court_availability
-- IMPORTANTE: habilitar RLS y crear políticas de acceso
-- ============================================================================

ALTER TABLE court_availability ENABLE ROW LEVEL SECURITY;

-- Política 1: SELECT público (cualquiera puede ver disponibilidad)
CREATE POLICY IF NOT EXISTS "court_availability_select_all" ON court_availability
  FOR SELECT USING (true);

-- Política 2: INSERT autenticado (jugadores pueden crear reservas)
CREATE POLICY IF NOT EXISTS "court_availability_insert_auth" ON court_availability
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Política 3: UPDATE — dueños pueden modificar reservas de sus canchas, jugadores pueden modificar sus propias reservas
CREATE POLICY IF NOT EXISTS "court_availability_update_owner" ON court_availability
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM courts c WHERE c.id = court_id AND c.owner_id = auth.uid()
    )
    OR booker_id = auth.uid()
  );

-- Política 4: DELETE — solo dueños pueden eliminar slots de sus canchas
CREATE POLICY IF NOT EXISTS "court_availability_delete_owner" ON court_availability
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM courts c WHERE c.id = court_id AND c.owner_id = auth.uid()
    )
  );

-- ============================================================================
-- PARTE 3: player_stats — Asegurar policy pública de SELECT
-- ============================================================================

ALTER TABLE player_stats ENABLE ROW LEVEL SECURITY;

-- Policy: Permitir leer stats de cualquier jugador (para perfiles públicos)
CREATE POLICY IF NOT EXISTS "player_stats_select_all" ON player_stats
  FOR SELECT USING (true);

-- Nota: Las policies de INSERT/UPDATE ya deberían estar en migrations_sprint2.sql
-- (para que cada jugador pueda modificar sus propias stats)

-- ============================================================================
-- PARTE 4: Verificaciones post-ejecución
-- ============================================================================

-- Después de ejecutar, verificar que las columnas existan:
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'court_availability' AND column_name IN ('status', 'booker_id', 'booker_note', 'time_to');

-- Verificar policies aplicadas:
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual FROM pg_policies WHERE tablename = 'court_availability';

-- ============================================================================
-- FIN MIGRACIONES PENDIENTES
-- ============================================================================
