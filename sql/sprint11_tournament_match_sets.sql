-- ============================================================
-- Sprint 11 — Scores por set/juegos en tournament_matches
-- Columna sets = jsonb: [{ "a": 6, "b": 4 }, { "a": 3, "b": 6 }, { "a": 7, "b": 5 }]
-- puntaje_a / puntaje_b se mantienen como "sets ganados" (agregado)
-- Ejecutar en Supabase SQL Editor
-- ============================================================

ALTER TABLE tournament_matches
  ADD COLUMN IF NOT EXISTS sets JSONB;

COMMENT ON COLUMN tournament_matches.sets IS
  'Array de sets/parciales para deportes que usan sets (tenis, padel, voley). Ejemplo: [{"a":6,"b":4},{"a":7,"b":5}]. Para deportes con score único queda NULL.';
