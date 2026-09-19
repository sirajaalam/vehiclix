-- Migration: create_user_details_and_vehicles
-- Description: Sets up user_details and vehicles tables with constraints, indexes, triggers, and RLS

-- 1. Updated-at trigger function
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. user_details table
CREATE TABLE IF NOT EXISTS public.user_details (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name text,
  last_name text,
  phone text,
  profile_image_path text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Index for phone lookups if needed
CREATE INDEX IF NOT EXISTS idx_user_details_phone 
  ON public.user_details(phone) 
  WHERE phone IS NOT NULL;

-- Trigger for user_details updated_at
DROP TRIGGER IF EXISTS trigger_user_details_updated_at ON public.user_details;
CREATE TRIGGER trigger_user_details_updated_at
  BEFORE UPDATE ON public.user_details
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- 3. vehicles table
CREATE TABLE IF NOT EXISTS public.vehicles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  make text,
  model text,
  year integer,
  license_plate text,
  vehicle_type text NOT NULL,
  fuel_type text NOT NULL,
  initial_odometer numeric(10,2) NOT NULL DEFAULT 0.00,
  current_odometer numeric(10,2) NOT NULL DEFAULT 0.00,
  rc_document_path text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  -- Constraints
  CONSTRAINT chk_vehicles_year CHECK (year IS NULL OR (year >= 1900 AND year <= 2100)),
  CONSTRAINT chk_vehicles_vehicle_type CHECK (vehicle_type IN ('CAR', 'BIKE', 'TRUCK', 'OTHER')),
  CONSTRAINT chk_vehicles_fuel_type CHECK (fuel_type IN ('PETROL', 'DIESEL', 'CNG', 'ELECTRIC', 'OTHER')),
  CONSTRAINT chk_vehicles_initial_odometer CHECK (initial_odometer >= 0),
  CONSTRAINT chk_vehicles_current_odometer CHECK (current_odometer >= 0),
  CONSTRAINT chk_vehicles_odometer_continuity CHECK (current_odometer >= initial_odometer)
);

-- Indexes for vehicles
CREATE INDEX IF NOT EXISTS idx_vehicles_user_id 
  ON public.vehicles(user_id);

CREATE INDEX IF NOT EXISTS idx_vehicles_license_plate 
  ON public.vehicles(license_plate) 
  WHERE license_plate IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_vehicles_vehicle_type 
  ON public.vehicles(vehicle_type);

-- Trigger for vehicles updated_at
DROP TRIGGER IF EXISTS trigger_vehicles_updated_at ON public.vehicles;
CREATE TRIGGER trigger_vehicles_updated_at
  BEFORE UPDATE ON public.vehicles
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- 4. Row Level Security (RLS)
ALTER TABLE public.user_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;

-- Policies for user_details
CREATE POLICY "Users can view own profile" 
  ON public.user_details FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" 
  ON public.user_details FOR INSERT 
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
  ON public.user_details FOR UPDATE 
  USING (auth.uid() = id) 
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can delete own profile" 
  ON public.user_details FOR DELETE 
  USING (auth.uid() = id);

-- Policies for vehicles
CREATE POLICY "Users can view own vehicles" 
  ON public.vehicles FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own vehicles" 
  ON public.vehicles FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own vehicles" 
  ON public.vehicles FOR UPDATE 
  USING (auth.uid() = user_id) 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own vehicles" 
  ON public.vehicles FOR DELETE 
  USING (auth.uid() = user_id);

-- Documentation comments
COMMENT ON TABLE public.user_details IS 'Extended application profile data for authenticated users.';
COMMENT ON TABLE public.vehicles IS 'Vehicles managed by users in their garage.';
COMMENT ON COLUMN public.vehicles.initial_odometer IS 'Baseline odometer reading when vehicle was added.';
COMMENT ON COLUMN public.vehicles.current_odometer IS 'Latest recorded odometer reading (updated by fuel and service logs).';
COMMENT ON COLUMN public.vehicles.rc_document_path IS 'Storage path in Supabase Storage for vehicle RC document.';
