-- Sprint 20: Permisos RLS para Partido Social
-- Ejecutar en Supabase SQL Editor para arreglar la creación de partidos

-- Habilitar RLS si no estaba habilitado
ALTER TABLE partidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE partido_jugadores ENABLE ROW LEVEL SECURITY;

-- Políticas para Partidos
DROP POLICY IF EXISTS "partidos_read" ON partidos;
CREATE POLICY "partidos_read" ON partidos FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "partidos_insert" ON partidos;
CREATE POLICY "partidos_insert" ON partidos FOR INSERT TO authenticated WITH CHECK (creador_id = auth.uid());

DROP POLICY IF EXISTS "partidos_update" ON partidos;
CREATE POLICY "partidos_update" ON partidos FOR UPDATE TO authenticated USING (true); -- Permitir a cualquiera que se una actualizar los slots ocupados (o refinar a solo creador/jugadores)

-- Políticas para Jugadores de Partidos
DROP POLICY IF EXISTS "partido_jugadores_read" ON partido_jugadores;
CREATE POLICY "partido_jugadores_read" ON partido_jugadores FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "partido_jugadores_insert" ON partido_jugadores;
CREATE POLICY "partido_jugadores_insert" ON partido_jugadores FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "partido_jugadores_delete" ON partido_jugadores;
CREATE POLICY "partido_jugadores_delete" ON partido_jugadores FOR DELETE TO authenticated USING (user_id = auth.uid());
