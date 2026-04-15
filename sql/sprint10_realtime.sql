-- ============================================================
-- Habilitar Realtime en las tablas clave
-- Ejecutar en SQL Editor de Supabase
-- ============================================================

-- Agregar tablas a la publicación de realtime
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE parties;
ALTER PUBLICATION supabase_realtime ADD TABLE party_members;
ALTER PUBLICATION supabase_realtime ADD TABLE party_payments;
ALTER PUBLICATION supabase_realtime ADD TABLE court_availability;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
