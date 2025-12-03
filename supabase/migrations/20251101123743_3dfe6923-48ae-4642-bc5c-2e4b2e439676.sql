-- Make user-files bucket public so files can be accessed
UPDATE storage.buckets
SET public = true
WHERE id = 'user-files';

-- Create storage policies for user-files bucket
CREATE POLICY "Admins can upload files to user-files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'user-files' AND
  is_admin(auth.uid())
);

CREATE POLICY "Admins can view all files in user-files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'user-files' AND
  is_admin(auth.uid())
);

CREATE POLICY "Admins can update files in user-files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'user-files' AND
  is_admin(auth.uid())
);

CREATE POLICY "Admins can delete files in user-files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'user-files' AND
  is_admin(auth.uid())
);