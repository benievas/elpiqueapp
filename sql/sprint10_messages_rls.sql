-- ============================================================
-- RLS completo para tabla messages (chat de partido)
-- Ejecutar en SQL Editor de Supabase
-- ============================================================

-- 1. REPLICA IDENTITY FULL — necesario para filtrar realtime por party_id (no es PK)
ALTER TABLE messages REPLICA IDENTITY FULL;

-- 2. Habilitar realtime en la publicación (solo si no está ya agregada)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE messages;
  END IF;
END $$;

-- 3. Asegurar que RLS está habilitado
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- 4. Política SELECT — miembros y creador pueden leer mensajes del partido
DROP POLICY IF EXISTS "Party members can read messages" ON messages;
CREATE POLICY "Party members can read messages"
ON messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM party_members
    WHERE party_members.party_id = messages.party_id
      AND party_members.profile_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM parties
    WHERE parties.id = messages.party_id
      AND parties.creator_id = auth.uid()
  )
);

-- 5. Política INSERT — solo miembros y creador pueden enviar mensajes
DROP POLICY IF EXISTS "Party members can insert messages" ON messages;
CREATE POLICY "Party members can insert messages"
ON messages FOR INSERT
WITH CHECK (
  auth.uid() = sender_id
  AND (
    EXISTS (
      SELECT 1 FROM party_members
      WHERE party_members.party_id = messages.party_id
        AND party_members.profile_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM parties
      WHERE parties.id = messages.party_id
        AND parties.creator_id = auth.uid()
    )
  )
);
