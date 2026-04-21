-- Sprint 15: AI review summary column on complexes

ALTER TABLE complexes
  ADD COLUMN IF NOT EXISTS ai_resumen TEXT,
  ADD COLUMN IF NOT EXISTS ai_resumen_updated_at TIMESTAMPTZ;

COMMENT ON COLUMN complexes.ai_resumen IS 'AI-generated summary of reviews (Claude). Regenerated when reviews >= 5.';
