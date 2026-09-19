-- Migration: create_service_records
-- Description: Sets up service_records and service_parts tables with exact monetary representation, constraints, indexes, triggers, and RLS

-- 1. service_records table
CREATE TABLE IF NOT EXISTS public.service_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id uuid NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  service_date timestamptz NOT NULL DEFAULT now(),
  odometer numeric(10,2) CHECK (odometer IS NULL OR odometer >= 0),
  service_provider text,
  notes text,
  labour_cost numeric(12,2) NOT NULL DEFAULT 0.00 CHECK (labour_cost >= 0),
  parts_cost numeric(12,2) NOT NULL DEFAULT 0.00 CHECK (parts_cost >= 0),
  tax numeric(12,2) NOT NULL DEFAULT 0.00 CHECK (tax >= 0),
  misc_cost numeric(12,2) NOT NULL DEFAULT 0.00 CHECK (misc_cost >= 0),
  total_cost numeric(12,2) NOT NULL CHECK (total_cost >= 0),
  next_service_date date,
  next_service_odometer numeric(10,2) CHECK (next_service_odometer IS NULL OR next_service_odometer >= 0),
  reminder_notes text,
  document_paths text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes for service_records
CREATE INDEX IF NOT EXISTS idx_service_records_vehicle_id 
  ON public.service_records(vehicle_id);

CREATE INDEX IF NOT EXISTS idx_service_records_user_id 
  ON public.service_records(user_id);

CREATE INDEX IF NOT EXISTS idx_service_records_service_date 
  ON public.service_records(service_date DESC);

-- Trigger for service_records updated_at
DROP TRIGGER IF EXISTS trigger_service_records_updated_at ON public.service_records;
CREATE TRIGGER trigger_service_records_updated_at
  BEFORE UPDATE ON public.service_records
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- 2. service_parts table
CREATE TABLE IF NOT EXISTS public.service_parts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_record_id uuid NOT NULL REFERENCES public.service_records(id) ON DELETE CASCADE,
  part_name text NOT NULL,
  part_number text,
  quantity numeric(10,2) NOT NULL DEFAULT 1.00 CHECK (quantity > 0),
  unit_cost numeric(12,2) NOT NULL CHECK (unit_cost >= 0),
  total_cost numeric(12,2) NOT NULL CHECK (total_cost >= 0),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Index for service_parts
CREATE INDEX IF NOT EXISTS idx_service_parts_service_record_id 
  ON public.service_parts(service_record_id);

-- 3. Row Level Security
ALTER TABLE public.service_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_parts ENABLE ROW LEVEL SECURITY;

-- Policies for service_records
CREATE POLICY "Users can view own service records" 
  ON public.service_records FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own service records" 
  ON public.service_records FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own service records" 
  ON public.service_records FOR UPDATE 
  USING (auth.uid() = user_id) 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own service records" 
  ON public.service_records FOR DELETE 
  USING (auth.uid() = user_id);

-- Policies for service_parts (via service_records relationship)
CREATE POLICY "Users can view own service parts" 
  ON public.service_parts FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM public.service_records sr 
    WHERE sr.id = service_parts.service_record_id AND sr.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert own service parts" 
  ON public.service_parts FOR INSERT 
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.service_records sr 
    WHERE sr.id = service_parts.service_record_id AND sr.user_id = auth.uid()
  ));

CREATE POLICY "Users can update own service parts" 
  ON public.service_parts FOR UPDATE 
  USING (EXISTS (
    SELECT 1 FROM public.service_records sr 
    WHERE sr.id = service_parts.service_record_id AND sr.user_id = auth.uid()
  )) 
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.service_records sr 
    WHERE sr.id = service_parts.service_record_id AND sr.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete own service parts" 
  ON public.service_parts FOR DELETE 
  USING (EXISTS (
    SELECT 1 FROM public.service_records sr 
    WHERE sr.id = service_parts.service_record_id AND sr.user_id = auth.uid()
  ));

COMMENT ON TABLE public.service_records IS 'Vehicle service and maintenance logs with cost breakdowns and reminder info.';
COMMENT ON TABLE public.service_parts IS 'Itemized parts used in a specific vehicle service record.';
