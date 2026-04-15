-- Habilitar Realtime para direct_messages y messages (party chat)
-- Ejecutar en Supabase SQL Editor

ALTER TABLE direct_messages REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE direct_messages;

-- Por si el party chat tampoco actualiza en vivo
ALTER TABLE messages REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
