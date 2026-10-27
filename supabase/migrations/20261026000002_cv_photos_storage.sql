-- ==============================================================================
-- CVBuilder Database Migration: Private Storage Bucket for CV Photos (Template B)
-- Target: Postgres / Supabase Storage
-- ==============================================================================

-- 1. CREATE PRIVATE STORAGE BUCKET FOR CV PHOTOS
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'cv-photos',
  'cv-photos',
  false, -- Strictly private, accessible only via authenticated signed URLs
  2097152, -- 2MB maximum file size limit
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 2097152,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp'];

-- 2. ROW LEVEL SECURITY (RLS) POLICIES ON storage.objects
-- Rule: Photos are stored under the user's UUID directory: {user_id}/{cv_id}-photo.{ext}

-- Allow users to upload their own photo
CREATE POLICY "Users can upload their own CV photo"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'cv-photos' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Allow users to view/download their own photo
CREATE POLICY "Users can view their own CV photo"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'cv-photos' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Allow users to delete their own photo
CREATE POLICY "Users can delete their own CV photo"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'cv-photos' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Allow service role full management
CREATE POLICY "Service role full access on cv-photos"
  ON storage.objects FOR ALL
  USING (auth.role() = 'service_role');
