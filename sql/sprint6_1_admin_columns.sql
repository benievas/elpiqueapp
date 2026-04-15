-- Sprint 6.1: Columnas para Panel Super Admin
-- Ejecutar en Supabase SQL Editor

-- 1. Campo role en profiles ('player' | 'owner' | 'admin')
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'player';

-- 2. Campo active en profiles (para suspender cuentas)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT true;

-- 3. Campo status en complexes ('active' | 'pending' | 'suspended')
ALTER TABLE complexes ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active';

-- 4. RPC auxiliar: permite que un usuario setee su propio role a 'owner'
--    (usada por el owner layout como auto-repair)
CREATE OR REPLACE FUNCTION set_own_role_owner()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE profiles SET role = 'owner' WHERE id = auth.uid() AND role = 'player';
END;
$$;

-- 5. (Opcional) Setear manualmente a un usuario como admin para pruebas:
-- UPDATE profiles SET role = 'admin' WHERE id = '<user-uuid>';
