-- Sprint 9: Reseñas de canchas
-- Ejecutar en Supabase SQL Editor

CREATE TABLE IF NOT EXISTS court_reviews (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  court_id    UUID NOT NULL REFERENCES courts(id) ON DELETE CASCADE,
  profile_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rating      INT  NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment     TEXT,
  created_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE (court_id, profile_id)   -- una reseña por usuario por cancha
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_court_reviews_court  ON court_reviews(court_id);
CREATE INDEX IF NOT EXISTS idx_court_reviews_profile ON court_reviews(profile_id);

-- RLS
ALTER TABLE court_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "court_reviews_read"   ON court_reviews FOR SELECT TO authenticated USING (true);
CREATE POLICY "court_reviews_insert" ON court_reviews FOR INSERT TO authenticated WITH CHECK (profile_id = auth.uid());
CREATE POLICY "court_reviews_update" ON court_reviews FOR UPDATE TO authenticated USING (profile_id = auth.uid());
CREATE POLICY "court_reviews_delete" ON court_reviews FOR DELETE TO authenticated USING (profile_id = auth.uid());
