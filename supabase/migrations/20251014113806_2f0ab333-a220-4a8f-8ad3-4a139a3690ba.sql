-- Add user_id column to admins table and set up super admin

-- Step 1: Add user_id column as nullable first
ALTER TABLE public.admins
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Step 2: Delete any existing records without a user_id (they're incomplete)
DELETE FROM public.admins WHERE user_id IS NULL;

-- Step 3: Make user_id required and unique for new records
ALTER TABLE public.admins
ALTER COLUMN user_id SET NOT NULL;

ALTER TABLE public.admins
ADD CONSTRAINT admins_user_id_unique UNIQUE (user_id);

-- Step 4: Insert super admin records for user 0af07a59-e76a-41f6-8745-8d6ddac1ba25
INSERT INTO public.admins (user_id, full_name, role)
VALUES ('0af07a59-e76a-41f6-8745-8d6ddac1ba25', 'Super Admin', 'super-admin')
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO public.user_roles (user_id, role)
VALUES ('0af07a59-e76a-41f6-8745-8d6ddac1ba25', 'super-admin')
ON CONFLICT (user_id, role) DO NOTHING;