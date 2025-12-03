-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Public can view files in user-files bucket" ON storage.objects;

-- Allow anyone to view files in user-files bucket
CREATE POLICY "Public Access to user-files"
ON storage.objects
FOR SELECT
USING (bucket_id = 'user-files');

-- Allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload to user-files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'user-files');

-- Allow authenticated users to update their files
CREATE POLICY "Authenticated users can update user-files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'user-files');

-- Allow authenticated users to delete files
CREATE POLICY "Authenticated users can delete user-files"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'user-files');