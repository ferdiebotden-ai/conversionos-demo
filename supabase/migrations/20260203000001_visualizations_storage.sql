-- Create visualizations storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'visualizations',
  'visualizations',
  true,
  52428800,  -- 50MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp']::text[]
)
ON CONFLICT (id) DO NOTHING;

-- Storage policy: Allow public read access
CREATE POLICY "Public read access"
ON storage.objects FOR SELECT
USING (bucket_id = 'visualizations');

-- Storage policy: Allow service role to upload
CREATE POLICY "Service role upload"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'visualizations');

-- Storage policy: Allow service role to update
CREATE POLICY "Service role update"
ON storage.objects FOR UPDATE
USING (bucket_id = 'visualizations');

-- Storage policy: Allow service role to delete
CREATE POLICY "Service role delete"
ON storage.objects FOR DELETE
USING (bucket_id = 'visualizations');
