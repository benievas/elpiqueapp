-- Sprint 26: Horario semanal por cancha (court_schedules)
-- Ejecutar en Supabase SQL Editor

CREATE TABLE IF NOT EXISTS court_schedules (
  id          UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  court_id    UUID    NOT NULL REFERENCES courts(id) ON DELETE CASCADE,
  dia_semana  INT     NOT NULL CHECK (dia_semana BETWEEN 0 AND 6), -- 0=Dom, 1=Lun...6=Sáb
  activo      BOOLEAN NOT NULL DEFAULT true,
  hora_inicio TIME    NOT NULL DEFAULT '08:00',
  hora_fin    TIME    NOT NULL DEFAULT '22:00',
  UNIQUE(court_id, dia_semana)
);

-- RLS
ALTER TABLE court_schedules ENABLE ROW LEVEL SECURITY;

-- El dueño del complejo puede ver y modificar sus horarios
DROP POLICY IF EXISTS "Owner manages own court schedules" ON court_schedules;
CREATE POLICY "Owner manages own court schedules" ON court_schedules
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM courts c
      JOIN complexes cx ON cx.id = c.complex_id
      WHERE c.id = court_schedules.court_id
        AND cx.owner_id = auth.uid()
    )
  );

-- Público puede leer horarios de canchas activas
DROP POLICY IF EXISTS "Public read court schedules" ON court_schedules;
CREATE POLICY "Public read court schedules" ON court_schedules
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM courts c
      WHERE c.id = court_schedules.court_id AND c.activa = true
    )
  );
