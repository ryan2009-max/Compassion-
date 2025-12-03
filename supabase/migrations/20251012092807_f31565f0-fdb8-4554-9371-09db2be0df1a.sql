-- Create storage bucket for user files
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'user-files',
  'user-files',
  false,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'application/pdf']
);

-- RLS policies for user files bucket
CREATE POLICY "Users can view their own files"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'user-files' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can upload their own files"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'user-files' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own files"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'user-files' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own files"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'user-files' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Admins can view all files
CREATE POLICY "Admins can view all user files"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'user-files' AND
  is_admin(auth.uid())
);

-- Admins can manage all files
CREATE POLICY "Admins can manage all user files"
ON storage.objects
FOR ALL
USING (
  bucket_id = 'user-files' AND
  is_admin(auth.uid())
);

-- Add files column to profiles table to store file metadata
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS files jsonb DEFAULT '[]'::jsonb;