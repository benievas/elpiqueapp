-- Sprint 10: Categoría de torneos
-- Ejecutar en Supabase SQL Editor

ALTER TABLE tournaments
  ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'Libre';
