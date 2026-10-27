-- Migration: Add google_email and needs_reconnect to google_connections table
ALTER TABLE public.google_connections
  ADD COLUMN IF NOT EXISTS google_email TEXT,
  ADD COLUMN IF NOT EXISTS needs_reconnect BOOLEAN NOT NULL DEFAULT false;

-- Allow users to update their own google_connections (for disconnect or flag update)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'google_connections' AND policyname = 'Users can update their own connection'
  ) THEN
    CREATE POLICY "Users can update their own connection"
      ON public.google_connections FOR UPDATE
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;
