-- Agrega porcentaje de seña configurable por el dueño en cada cancha
ALTER TABLE courts
  ADD COLUMN IF NOT EXISTS deposit_pct integer NOT NULL DEFAULT 100
  CHECK (deposit_pct IN (10, 20, 30, 40, 50, 100));

COMMENT ON COLUMN courts.deposit_pct IS
  'Porcentaje de seña requerido al reservar (10/20/30/40/50/100). Default 100 = pago total.';
