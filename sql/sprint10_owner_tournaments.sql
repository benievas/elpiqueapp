-- Sprint 10: Permisos de owners para gestionar torneos de su ciudad
-- Ejecutar en Supabase SQL Editor

-- Owners pueden crear torneos para su ciudad
CREATE POLICY "owners_insert_tournaments" ON tournaments
  FOR INSERT
  WITH CHECK (
    city_id IN (
      SELECT DISTINCT city_id FROM courts WHERE owner_id = auth.uid()
    )
  );

-- Owners pueden actualizar torneos de su ciudad
CREATE POLICY "owners_update_tournaments" ON tournaments
  FOR UPDATE
  USING (
    city_id IN (
      SELECT DISTINCT city_id FROM courts WHERE owner_id = auth.uid()
    )
  );

-- Owners pueden aprobar/eliminar equipos en torneos de su ciudad
CREATE POLICY "owners_update_tournament_teams" ON tournament_teams
  FOR UPDATE
  USING (
    tournament_id IN (
      SELECT t.id FROM tournaments t
      WHERE t.city_id IN (
        SELECT DISTINCT city_id FROM courts WHERE owner_id = auth.uid()
      )
    )
  );

-- Owners pueden insertar y actualizar partidos en torneos de su ciudad
CREATE POLICY "owners_insert_tournament_matches" ON tournament_matches
  FOR INSERT
  WITH CHECK (
    tournament_id IN (
      SELECT t.id FROM tournaments t
      WHERE t.city_id IN (
        SELECT DISTINCT city_id FROM courts WHERE owner_id = auth.uid()
      )
    )
  );

CREATE POLICY "owners_update_tournament_matches" ON tournament_matches
  FOR UPDATE
  USING (
    tournament_id IN (
      SELECT t.id FROM tournaments t
      WHERE t.city_id IN (
        SELECT DISTINCT city_id FROM courts WHERE owner_id = auth.uid()
      )
    )
  );

-- Web home video: insertar clave en app_config si no existe
INSERT INTO app_config (key, value, updated_at)
VALUES ('web_home_video', '""'::jsonb, now())
ON CONFLICT (key) DO NOTHING;
