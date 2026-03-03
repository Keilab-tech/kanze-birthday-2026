
-- Create storage bucket for birthday media
INSERT INTO storage.buckets (id, name, public)
VALUES ('kanze-birthday', 'kanze-birthday', true);

-- Allow public read access to all files
CREATE POLICY "Public read access for kanze-birthday"
ON storage.objects FOR SELECT
USING (bucket_id = 'kanze-birthday');

-- Allow authenticated users to upload
CREATE POLICY "Authenticated upload for kanze-birthday"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'kanze-birthday');

-- Allow authenticated users to delete their uploads
CREATE POLICY "Authenticated delete for kanze-birthday"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'kanze-birthday');
