-- MatchPro — MercadoPago Integration SQL
-- Apply in Supabase SQL Editor

-- 1. Updates to profiles table for Payments & Subscriptions
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS mp_access_token TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS mp_refresh_token TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS mp_user_id TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'inactive'; -- For Owners: inactive | active | pending
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_pro BOOLEAN DEFAULT false;              -- For Players

-- 2. Updates to court_availability (Reservations) for Split Payments
ALTER TABLE court_availability ADD COLUMN IF NOT EXISTS mp_preference_id TEXT;
ALTER TABLE court_availability ADD COLUMN IF NOT EXISTS mp_payment_id TEXT;
ALTER TABLE court_availability ADD COLUMN IF NOT EXISTS mp_payment_status TEXT;           -- pending | approved | rejected
ALTER TABLE court_availability ADD COLUMN IF NOT EXISTS application_fee NUMERIC DEFAULT 0; -- Your commission
ALTER TABLE court_availability ADD COLUMN IF NOT EXISTS total_price NUMERIC DEFAULT 0;     -- Full price paid by player

-- 3. Create a table for Global App Settings (Commission %, etc.)
CREATE TABLE IF NOT EXISTS app_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Insert default commission (e.g., 10%)
INSERT INTO app_settings (key, value) 
VALUES ('commission_percent', '10')
ON CONFLICT (key) DO NOTHING;

-- 4. Secure access to tokens
-- Ensure RLS is active and only the owner can see their own tokens (though Edge Functions will use service_role)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- edge-functions-only-access: We might want a separate table for secret tokens 
-- to keep profiles clean, but for now we'll restrict the profiles_select policy.

-- Update existing policy or add a restrictive one for tokens if necessary.
-- Note: Service role used by Edge Functions bypasses RLS.

-- 5. Notifications table (ensure it exists for webhooks to talk to users)
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- reservation_confirmed | subscription_active | payment_failed
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    data JSONB DEFAULT '{}',
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);
