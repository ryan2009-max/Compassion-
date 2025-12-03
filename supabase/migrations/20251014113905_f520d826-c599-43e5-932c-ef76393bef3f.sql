-- Insert super admin records for user 0af07a59-e76a-41f6-8745-8d6ddac1ba25

-- Insert into admins table
INSERT INTO public.admins (user_id, full_name, role)
VALUES ('0af07a59-e76a-41f6-8745-8d6ddac1ba25', 'Super Admin', 'super-admin')
ON CONFLICT (user_id) DO NOTHING;

-- Insert into user_roles table
INSERT INTO public.user_roles (user_id, role)
VALUES ('0af07a59-e76a-41f6-8745-8d6ddac1ba25', 'super-admin')
ON CONFLICT (user_id, role) DO NOTHING;