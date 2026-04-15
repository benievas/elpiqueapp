-- ============================================================
-- Sprint 10 — Privacidad de mensajes directos
-- Agrega allow_dm a profiles y bloquea inserts vía RLS
-- ============================================================

-- 1. Columna allow_dm en profiles (true por defecto = acepta mensajes)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS allow_dm BOOLEAN NOT NULL DEFAULT TRUE;

-- 2. Actualizar la política INSERT de direct_messages para respetar allow_dm
DROP POLICY IF EXISTS "dm_insert_own" ON direct_messages;

CREATE POLICY "dm_insert_own" ON direct_messages
  FOR INSERT WITH CHECK (
    auth.uid() = from_id
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = to_id
        AND profiles.allow_dm = TRUE
    )
  );

-- 3. Permitir que cualquier usuario autenticado lea el allow_dm de otro perfil
-- (necesario para que el cliente pueda verificar antes de mostrar el botón)
DROP POLICY IF EXISTS "profiles_read_allow_dm" ON profiles;
-- (La política SELECT de profiles ya debería permitir esto si existe una política pública de lectura)
-- Si no existe, crear:
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Public profiles are viewable by everyone'
  ) THEN
    CREATE POLICY "Public profiles are viewable by everyone"
      ON profiles FOR SELECT
      USING (true);
  END IF;
END $$;
