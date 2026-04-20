-- ============================================================
-- Sprint 11 — Agregar tournament_matches a realtime
--              (para resultados en vivo en /torneos/[slug])
-- Ejecutar en Supabase SQL Editor
-- ============================================================

ALTER PUBLICATION supabase_realtime ADD TABLE tournament_matches;
ALTER PUBLICATION supabase_realtime ADD TABLE tournaments;
ALTER PUBLICATION supabase_realtime ADD TABLE tournament_teams;
