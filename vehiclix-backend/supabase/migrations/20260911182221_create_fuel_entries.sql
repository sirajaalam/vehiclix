-- Migration: create_fuel_entries
-- Description: Sets up fuel_entries table for fuel and EV charging tracking with constraints, indexes, triggers, and RLS

CREATE TABLE IF NOT EXISTS public.fuel_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id uuid NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entry_date timestamptz NOT NULL DEFAULT now(),
  odometer numeric(10,2) CHECK (odometer IS NULL OR odometer >= 0),
  quantity numeric(10,3) NOT NULL CHECK (quantity > 0),
  unit text NOT NULL CHECK (unit IN ('LITRE', 'GALLON', 'KG', 'KWH')),
  price_per_unit numeric(12,2) NOT NULL CHECK (price_per_unit >= 0),
  total_amount numeric(12,2) NOT NULL CHECK (total_amount >= 0),
  fuel_type text NOT NULL CHECK (fuel_type IN ('PETROL', 'DIESEL', 'CNG', 'ELECTRIC', 'OTHER')),
  station_name text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_fuel_entries_vehicle_id 
  ON public.fuel_entries(vehicle_id);

CREATE INDEX IF NOT EXISTS idx_fuel_entries_user_id 
  ON public.fuel_entries(user_id);

CREATE INDEX IF NOT EXISTS idx_fuel_entries_entry_date 
  ON public.fuel_entries(entry_date DESC);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS trigger_fuel_entries_updated_at ON public.fuel_entries;
CREATE TRIGGER trigger_fuel_entries_updated_at
  BEFORE UPDATE ON public.fuel_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- Row Level Security
ALTER TABLE public.fuel_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own fuel entries" 
  ON public.fuel_entries FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own fuel entries" 
  ON public.fuel_entries FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own fuel entries" 
  ON public.fuel_entries FOR UPDATE 
  USING (auth.uid() = user_id) 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own fuel entries" 
  ON public.fuel_entries FOR DELETE 
  USING (auth.uid() = user_id);

COMMENT ON TABLE public.fuel_entries IS 'Fuel purchase and EV charging logs with exact quantity and price.';
COMMENT ON COLUMN public.fuel_entries.unit IS 'Unit of fuel or energy (LITRE, GALLON, KG for CNG, KWH for EV).';
