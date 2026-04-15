-- MatchPro — Migraciones Sprint 2 pendientes
-- Aplicar en: Supabase → SQL Editor
-- Estas columnas faltan en court_availability y son necesarias para el sistema de reservas

-- 1. Agregar columna status (pending/confirmed/rejected)
ALTER TABLE court_availability ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';

-- 2. Agregar columna booker_id ( referencia al jugador que reserva)
ALTER TABLE court_availability ADD COLUMN IF NOT EXISTS booker_id UUID REFERENCES auth.users(id);

-- 3. Agregar columna booker_note (nota opcional del jugador)
ALTER TABLE court_availability ADD COLUMN IF NOT EXISTS booker_note TEXT;

-- 4. Actualizar filas existentes que ya están reservadas (is_booked = true)
--    para que tengan status = 'confirmed' y evitar inconsistencias
UPDATE court_availability SET status = 'confirmed' WHERE is_booked = true AND status IS NULL;

-- Nota: También se recomienda revisar sql/migrations_sprint2.sql completo
-- para ver otras migraciones relacionadas (player_stats, RLS policies, etc.)
