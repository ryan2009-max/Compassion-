-- Create table for system categories configuration
CREATE TABLE IF NOT EXISTS public.system_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create table for system fields configuration
CREATE TABLE IF NOT EXISTS public.system_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES public.system_categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  field_type TEXT NOT NULL CHECK (field_type IN ('text', 'textarea', 'image', 'video', 'audio', 'pdf', 'docx')),
  is_required BOOLEAN NOT NULL DEFAULT false,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.system_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_fields ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Only admins can manage system configuration
CREATE POLICY "Only admins can view system categories"
  ON public.system_categories
  FOR SELECT
  USING (is_admin(auth.uid()));

CREATE POLICY "Only admins can manage system categories"
  ON public.system_categories
  FOR ALL
  USING (is_admin(auth.uid()));

CREATE POLICY "Only admins can view system fields"
  ON public.system_fields
  FOR SELECT
  USING (is_admin(auth.uid()));

CREATE POLICY "Only admins can manage system fields"
  ON public.system_fields
  FOR ALL
  USING (is_admin(auth.uid()));

-- Create indexes for better performance
CREATE INDEX idx_system_fields_category_id ON public.system_fields(category_id);
CREATE INDEX idx_system_categories_order ON public.system_categories(display_order);
CREATE INDEX idx_system_fields_order ON public.system_fields(display_order);

-- Insert default categories
INSERT INTO public.system_categories (name, display_order) VALUES
  ('Background Information', 1),
  ('Home Visit', 2),
  ('Health Records', 3),
  ('Gifts', 4),
  ('Spiritual Development', 5),
  ('Academic Records', 6),
  ('Career Dream', 7),
  ('Commitment Forms', 8);

-- Trigger to update updated_at timestamp
CREATE TRIGGER update_system_categories_updated_at
  BEFORE UPDATE ON public.system_categories
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_system_fields_updated_at
  BEFORE UPDATE ON public.system_fields
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();