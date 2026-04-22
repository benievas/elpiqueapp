-- Sprint fix: RLS de tournaments para owners
-- El error "new row violates row-level security policy" indica que la política
-- de INSERT no permite que el propietario del complejo cree torneos.
-- Ejecutar en Supabase SQL Editor

-- Asegurar que RLS esté habilitado
ALTER TABLE tournaments ENABLE ROW LEVEL SECURITY;

-- Lectura pública (torneos públicos) + propietario ve los suyos + admin
DROP POLICY IF EXISTS "tournaments_select" ON tournaments;
CREATE POLICY "tournaments_select" ON tournaments
  FOR SELECT USING (
    es_publico = true
    OR (
      complex_id IN (
        SELECT id FROM complexes WHERE owner_id = auth.uid()
      )
    )
    OR is_admin()
  );

-- Inserción: el propietario del complejo puede crear torneos
DROP POLICY IF EXISTS "tournaments_insert" ON tournaments;
CREATE POLICY "tournaments_insert" ON tournaments
  FOR INSERT WITH CHECK (
    complex_id IN (
      SELECT id FROM complexes WHERE owner_id = auth.uid()
    )
    OR is_admin()
  );

-- Actualización: el propietario del complejo puede editar sus torneos
DROP POLICY IF EXISTS "tournaments_update" ON tournaments;
CREATE POLICY "tournaments_update" ON tournaments
  FOR UPDATE USING (
    complex_id IN (
      SELECT id FROM complexes WHERE owner_id = auth.uid()
    )
    OR is_admin()
  );

-- Eliminación: el propietario del complejo puede borrar sus torneos
DROP POLICY IF EXISTS "tournaments_delete" ON tournaments;
CREATE POLICY "tournaments_delete" ON tournaments
  FOR DELETE USING (
    complex_id IN (
      SELECT id FROM complexes WHERE owner_id = auth.uid()
    )
    OR is_admin()
  );
