-- Migration: create_trips_and_expenses
-- Description: Sets up trips, trip_participants, and trip_expenses tables with split support and RLS

-- 1. trips table
CREATE TABLE IF NOT EXISTS public.trips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vehicle_id uuid REFERENCES public.vehicles(id) ON DELETE SET NULL,
  title text NOT NULL,
  start_date timestamptz NOT NULL,
  end_date timestamptz,
  start_location text,
  destination text,
  estimated_distance numeric(10,2) CHECK (estimated_distance IS NULL OR estimated_distance >= 0),
  actual_distance numeric(10,2) CHECK (actual_distance IS NULL OR actual_distance >= 0),
  status text NOT NULL DEFAULT 'PLANNED' CHECK (status IN ('PLANNED', 'IN_PROGRESS', 'COMPLETED')),
  split_expenses boolean NOT NULL DEFAULT false,
  split_method text NOT NULL DEFAULT 'EQUAL' CHECK (split_method IN ('EQUAL')),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT chk_trip_dates CHECK (end_date IS NULL OR end_date >= start_date)
);

CREATE INDEX IF NOT EXISTS idx_trips_user_id ON public.trips(user_id);
CREATE INDEX IF NOT EXISTS idx_trips_vehicle_id ON public.trips(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_trips_status ON public.trips(status);
CREATE INDEX IF NOT EXISTS idx_trips_start_date ON public.trips(start_date DESC);

DROP TRIGGER IF EXISTS trigger_trips_updated_at ON public.trips;
CREATE TRIGGER trigger_trips_updated_at
  BEFORE UPDATE ON public.trips
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- 2. trip_participants table
CREATE TABLE IF NOT EXISTS public.trip_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  name text NOT NULL,
  email text,
  phone text,
  is_included_in_split boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_trip_participants_trip_id ON public.trip_participants(trip_id);
CREATE INDEX IF NOT EXISTS idx_trip_participants_user_id ON public.trip_participants(user_id);

-- 3. trip_expenses table
CREATE TABLE IF NOT EXISTS public.trip_expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  payer_participant_id uuid NOT NULL REFERENCES public.trip_participants(id) ON DELETE RESTRICT,
  category text NOT NULL CHECK (category IN ('FUEL', 'FOOD', 'TOLL', 'STAY', 'OTHER')),
  amount numeric(12,2) NOT NULL CHECK (amount > 0),
  expense_date timestamptz NOT NULL DEFAULT now(),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_trip_expenses_trip_id ON public.trip_expenses(trip_id);
CREATE INDEX IF NOT EXISTS idx_trip_expenses_payer ON public.trip_expenses(payer_participant_id);
CREATE INDEX IF NOT EXISTS idx_trip_expenses_category ON public.trip_expenses(category);

DROP TRIGGER IF EXISTS trigger_trip_expenses_updated_at ON public.trip_expenses;
CREATE TRIGGER trigger_trip_expenses_updated_at
  BEFORE UPDATE ON public.trip_expenses
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- 4. Row Level Security
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_expenses ENABLE ROW LEVEL SECURITY;

-- Policies for trips
CREATE POLICY "Users can view own trips" 
  ON public.trips FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own trips" 
  ON public.trips FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own trips" 
  ON public.trips FOR UPDATE 
  USING (auth.uid() = user_id) 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own trips" 
  ON public.trips FOR DELETE 
  USING (auth.uid() = user_id);

-- Policies for trip_participants
CREATE POLICY "Users can view participants of own trips" 
  ON public.trip_participants FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.trips t WHERE t.id = trip_participants.trip_id AND t.user_id = auth.uid()));

CREATE POLICY "Users can insert participants to own trips" 
  ON public.trip_participants FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM public.trips t WHERE t.id = trip_participants.trip_id AND t.user_id = auth.uid()));

CREATE POLICY "Users can update participants of own trips" 
  ON public.trip_participants FOR UPDATE 
  USING (EXISTS (SELECT 1 FROM public.trips t WHERE t.id = trip_participants.trip_id AND t.user_id = auth.uid())) 
  WITH CHECK (EXISTS (SELECT 1 FROM public.trips t WHERE t.id = trip_participants.trip_id AND t.user_id = auth.uid()));

CREATE POLICY "Users can delete participants from own trips" 
  ON public.trip_participants FOR DELETE 
  USING (EXISTS (SELECT 1 FROM public.trips t WHERE t.id = trip_participants.trip_id AND t.user_id = auth.uid()));

-- Policies for trip_expenses
CREATE POLICY "Users can view expenses of own trips" 
  ON public.trip_expenses FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.trips t WHERE t.id = trip_expenses.trip_id AND t.user_id = auth.uid()));

CREATE POLICY "Users can insert expenses to own trips" 
  ON public.trip_expenses FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM public.trips t WHERE t.id = trip_expenses.trip_id AND t.user_id = auth.uid()));

CREATE POLICY "Users can update expenses of own trips" 
  ON public.trip_expenses FOR UPDATE 
  USING (EXISTS (SELECT 1 FROM public.trips t WHERE t.id = trip_expenses.trip_id AND t.user_id = auth.uid())) 
  WITH CHECK (EXISTS (SELECT 1 FROM public.trips t WHERE t.id = trip_expenses.trip_id AND t.user_id = auth.uid()));

CREATE POLICY "Users can delete expenses from own trips" 
  ON public.trip_expenses FOR DELETE 
  USING (EXISTS (SELECT 1 FROM public.trips t WHERE t.id = trip_expenses.trip_id AND t.user_id = auth.uid()));

COMMENT ON TABLE public.trips IS 'User road trips with status tracking and optional equal expense splitting.';
COMMENT ON TABLE public.trip_participants IS 'Registered or guest participants assigned to a trip.';
COMMENT ON TABLE public.trip_expenses IS 'Itemized expenses incurred during a trip and associated with a payer participant.';
