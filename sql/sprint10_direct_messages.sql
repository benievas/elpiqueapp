-- ============================================================
-- Sprint 10 — Chat directo 1:1 entre jugadores
-- ============================================================

CREATE TABLE IF NOT EXISTS direct_messages (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  from_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  to_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  body       TEXT NOT NULL CHECK (char_length(body) BETWEEN 1 AND 500),
  read       BOOLEAN DEFAULT FALSE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice compuesto para buscar la conversación entre dos usuarios de forma eficiente
CREATE INDEX IF NOT EXISTS dm_conversation_idx
  ON direct_messages (LEAST(from_id, to_id), GREATEST(from_id, to_id), created_at DESC);

-- RLS
ALTER TABLE direct_messages ENABLE ROW LEVEL SECURITY;

-- Cada usuario solo ve sus propios mensajes
CREATE POLICY "dm_select_own" ON direct_messages
  FOR SELECT USING (auth.uid() = from_id OR auth.uid() = to_id);

-- Solo el remitente puede insertar
CREATE POLICY "dm_insert_own" ON direct_messages
  FOR INSERT WITH CHECK (auth.uid() = from_id);

-- Solo el destinatario puede marcar como leído
CREATE POLICY "dm_update_read" ON direct_messages
  FOR UPDATE USING (auth.uid() = to_id)
  WITH CHECK (auth.uid() = to_id);
