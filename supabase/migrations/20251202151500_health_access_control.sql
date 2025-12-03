-- Enable RLS and enforce superadmin-only access to Health Records
-- Create helper function to check superadmin role
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.role = 'super-admin'
  );
$$;

-- Audit table for health file access and modifications
CREATE TABLE IF NOT EXISTS public.health_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  action text NOT NULL,
  profile_id uuid,
  category_id uuid,
  file_name text,
  file_url text,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS on user_data_categories
ALTER TABLE public.user_data_categories ENABLE ROW LEVEL SECURITY;

-- Policy: Only superadmins can SELECT health records
CREATE POLICY "superadmins_select_health_records"
ON public.user_data_categories
FOR SELECT
USING (
  category_name = 'Health Records' AND public.is_super_admin()
);

-- Policy: Only superadmins can INSERT health records
CREATE POLICY "superadmins_insert_health_records"
ON public.user_data_categories
FOR INSERT
WITH CHECK (
  category_name = 'Health Records' AND public.is_super_admin()
);

-- Policy: Only superadmins can UPDATE health records
CREATE POLICY "superadmins_update_health_records"
ON public.user_data_categories
FOR UPDATE
USING (
  category_name = 'Health Records' AND public.is_super_admin()
)
WITH CHECK (
  category_name = 'Health Records' AND public.is_super_admin()
);

-- Policy: Only superadmins can DELETE health records
CREATE POLICY "superadmins_delete_health_records"
ON public.user_data_categories
FOR DELETE
USING (
  category_name = 'Health Records' AND public.is_super_admin()
);

-- Broad non-health policies to preserve app behavior
CREATE POLICY "auth_select_non_health"
ON public.user_data_categories
FOR SELECT
TO authenticated
USING (
  category_name <> 'Health Records'
);

CREATE POLICY "auth_insert_non_health"
ON public.user_data_categories
FOR INSERT
TO authenticated
WITH CHECK (
  category_name <> 'Health Records'
);

CREATE POLICY "auth_update_non_health"
ON public.user_data_categories
FOR UPDATE
TO authenticated
USING (
  category_name <> 'Health Records'
)
WITH CHECK (
  category_name <> 'Health Records'
);

CREATE POLICY "auth_delete_non_health"
ON public.user_data_categories
FOR DELETE
TO authenticated
USING (
  category_name <> 'Health Records'
);

-- Storage policies: restrict health files
-- Drop overly broad public read policy if exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'objects' AND polname = 'Public can view files in user-files bucket'
  ) THEN
    DROP POLICY "Public can view files in user-files bucket" ON storage.objects;
  END IF;
END $$;

-- Public can view non-health files only
CREATE POLICY "Public can view non-health files"
ON storage.objects
FOR SELECT
TO public
USING (
  bucket_id = 'user-files' AND name NOT LIKE 'health/%'
);

-- Superadmins can manage health files
CREATE POLICY "Superadmins manage health files SELECT"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'user-files' AND name LIKE 'health/%' AND public.is_super_admin()
);

CREATE POLICY "Superadmins manage health files INSERT"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'user-files' AND name LIKE 'health/%' AND public.is_super_admin()
);

CREATE POLICY "Superadmins manage health files UPDATE"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'user-files' AND name LIKE 'health/%' AND public.is_super_admin()
)
WITH CHECK (
  bucket_id = 'user-files' AND name LIKE 'health/%' AND public.is_super_admin()
);

CREATE POLICY "Superadmins manage health files DELETE"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'user-files' AND name LIKE 'health/%' AND public.is_super_admin()
);

-- Triggers to audit health record modifications
CREATE OR REPLACE FUNCTION public.log_health_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF (TG_OP = 'INSERT' AND NEW.category_name = 'Health Records') THEN
    INSERT INTO public.health_audit_logs(user_id, action, profile_id, category_id, metadata)
    VALUES (auth.uid(), 'insert', NEW.profile_id, NEW.id, jsonb_build_object('new', NEW.category_data));
  ELSIF (TG_OP = 'UPDATE' AND NEW.category_name = 'Health Records') THEN
    INSERT INTO public.health_audit_logs(user_id, action, profile_id, category_id, metadata)
    VALUES (auth.uid(), 'update', NEW.profile_id, NEW.id, jsonb_build_object('old', OLD.category_data, 'new', NEW.category_data));
  ELSIF (TG_OP = 'DELETE' AND OLD.category_name = 'Health Records') THEN
    INSERT INTO public.health_audit_logs(user_id, action, profile_id, category_id, metadata)
    VALUES (auth.uid(), 'delete', OLD.profile_id, OLD.id, jsonb_build_object('old', OLD.category_data));
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_log_health_change ON public.user_data_categories;
CREATE TRIGGER trg_log_health_change
AFTER INSERT OR UPDATE OR DELETE ON public.user_data_categories
FOR EACH ROW
EXECUTE FUNCTION public.log_health_change();

-- Allow superadmins to insert audit logs manually (e.g., view events)
ALTER TABLE public.health_audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "superadmins_insert_audit"
ON public.health_audit_logs
FOR INSERT
TO authenticated
WITH CHECK (public.is_super_admin());

