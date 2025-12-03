-- Allow public read access to user-files bucket
CREATE POLICY "Public can view files in user-files bucket"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'user-files');