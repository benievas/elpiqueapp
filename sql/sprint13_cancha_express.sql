-- Sprint 13: Cancha libre ahora — express discount on courts

ALTER TABLE courts
  ADD COLUMN IF NOT EXISTS descuento_express BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS descuento_pct     INTEGER  NOT NULL DEFAULT 0
    CHECK (descuento_pct BETWEEN 0 AND 50);

COMMENT ON COLUMN courts.descuento_express IS 'Owner-activated express discount for last-minute slots';
COMMENT ON COLUMN courts.descuento_pct     IS 'Discount percentage (0-50%) shown on home widget';
