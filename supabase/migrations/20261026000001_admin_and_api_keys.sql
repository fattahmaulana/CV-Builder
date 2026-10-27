-- ==============================================================================
-- CVBuilder Database Migration: Admin, API Key Manager, and Feature Flags
-- Target: Postgres (Supabase)
-- ==============================================================================

-- 1. ADD ROLE COLUMN TO PROFILES TABLE
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin'));

CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- Prevent regular users from updating their own role column
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

CREATE POLICY "Users can update their own profile except role"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id AND 
    (role = (SELECT p.role FROM public.profiles p WHERE p.id = auth.uid()))
  );

-- 2. API KEYS TABLE (Sensitive Key Management with Zero Client Access)
CREATE TABLE IF NOT EXISTS public.api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL CHECK (provider IN ('gemini', 'doku', 'job_api', 'turnstile', 'smtp', 'other')),
  label TEXT NOT NULL,
  encrypted_key TEXT NOT NULL,       -- AES-256-GCM format iv:authTag:ciphertext
  last_four_chars TEXT NOT NULL,     -- Masked representation e.g. "...ab12"
  status TEXT NOT NULL DEFAULT 'aktif' CHECK (status IN ('aktif', 'cooldown', 'habis', 'tidak_valid', 'nonaktif')),
  priority INTEGER NOT NULL DEFAULT 1,
  weight INTEGER NOT NULL DEFAULT 1,
  requests_today INTEGER NOT NULL DEFAULT 0,
  errors_today INTEGER NOT NULL DEFAULT 0,
  cooldown_until TIMESTAMPTZ,
  last_used_at TIMESTAMPTZ,
  last_error TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_api_keys_provider_status ON public.api_keys(provider, status);
CREATE INDEX IF NOT EXISTS idx_api_keys_priority ON public.api_keys(priority DESC, weight DESC);

-- STRICT RLS ON API_KEYS: Client applications can NEVER query this table directly
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on api_keys"
  ON public.api_keys FOR ALL
  USING (auth.role() = 'service_role');

-- 3. ADMIN AUDIT LOG TABLE (Immutable record of admin actions)
CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT,
  ip_hash TEXT,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_admin_audit_log_user_id ON public.admin_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_action ON public.admin_audit_log(action);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_created_at ON public.admin_audit_log(created_at DESC);

ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on admin_audit_log"
  ON public.admin_audit_log FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Admins can view admin_audit_log"
  ON public.admin_audit_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- 4. APP SETTINGS TABLE (Global Configuration & Pricing)
CREATE TABLE IF NOT EXISTS public.app_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can read public app settings"
  ON public.app_settings FOR SELECT
  USING (true);

CREATE POLICY "Service role full access on app_settings"
  ON public.app_settings FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Admins can update app_settings"
  ON public.app_settings FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- 5. FEATURE FLAGS TABLE (Staged Rollouts & Toggles)
CREATE TABLE IF NOT EXISTS public.feature_flags (
  key TEXT PRIMARY KEY,
  enabled BOOLEAN NOT NULL DEFAULT false,
  description TEXT,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can read feature flags"
  ON public.feature_flags FOR SELECT
  USING (true);

CREATE POLICY "Service role full access on feature_flags"
  ON public.feature_flags FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Admins can update feature_flags"
  ON public.feature_flags FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Seed default application settings and feature flags
INSERT INTO public.app_settings (key, value, description)
VALUES 
  ('price_idr', '5000'::jsonb, 'Harga pembuatan CV ATS Harvard dalam Rupiah'),
  ('max_ai_revisions', '3'::jsonb, 'Batas revisi AI gratis pasca pembayaran'),
  ('ai_revision_window_days', '7'::jsonb, 'Masa berlaku kuota revisi AI (hari)'),
  ('gemini_primary_model', '"gemini-2.0-flash"'::jsonb, 'Model utama Gemini AI'),
  ('gemini_fallback_model', '"gemini-1.5-flash"'::jsonb, 'Model cadangan Gemini AI')
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.feature_flags (key, enabled, description)
VALUES
  ('job_directory', true, 'Direktori lowongan fresh graduate aktif'),
  ('scene_3d', false, 'Scene 3D hero R3F eksperimental (default mati untuk performa)'),
  ('google_sheets_sync', true, 'Sinkronisasi pelacak lamaran ke Google Sheets')
ON CONFLICT (key) DO NOTHING;
