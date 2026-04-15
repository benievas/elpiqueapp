-- Sprint 5.5: Vincular court_availability con parties
-- Ejecutar en Supabase SQL Editor si la columna no existe aún

ALTER TABLE court_availability ADD COLUMN IF NOT EXISTS party_id UUID REFERENCES parties(id) ON DELETE SET NULL;

-- Índice para consultas rápidas por party_id
CREATE INDEX IF NOT EXISTS idx_court_availability_party_id ON court_availability(party_id);
