-- Sprint 30: Tabla favoritos (complejos marcados por jugadores)
-- Ejecutar en Supabase SQL Editor

CREATE TABLE IF NOT EXISTS favoritos (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  complex_id UUID NOT NULL REFERENCES complexes(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, complex_id)
);

ALTER TABLE favoritos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "favoritos_select_own" ON favoritos
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "favoritos_insert_own" ON favoritos
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "favoritos_delete_own" ON favoritos
  FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS favoritos_user_id_idx ON favoritos(user_id);
CREATE INDEX IF NOT EXISTS favoritos_complex_id_idx ON favoritos(complex_id);
