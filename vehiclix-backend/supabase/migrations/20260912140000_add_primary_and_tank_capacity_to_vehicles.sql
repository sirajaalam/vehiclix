-- Add is_primary and tank_capacity to public.vehicles
ALTER TABLE public.vehicles
  ADD COLUMN IF NOT EXISTS is_primary boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS tank_capacity numeric(6,2);

-- Constraint to ensure tank capacity is positive if provided
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_vehicles_tank_capacity'
  ) THEN
    ALTER TABLE public.vehicles
      ADD CONSTRAINT chk_vehicles_tank_capacity CHECK (tank_capacity IS NULL OR tank_capacity > 0);
  END IF;
END $$;

-- Index for quickly finding the user's primary vehicle
CREATE INDEX IF NOT EXISTS idx_vehicles_user_primary
  ON public.vehicles(user_id, is_primary)
  WHERE is_primary = true;
