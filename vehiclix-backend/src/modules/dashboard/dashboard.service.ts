import { query } from '../../database/postgres';

export interface DashboardSummaryResponse {
  vehiclesCount: number;
  fuelSummary: {
    totalSpend: number;
    entriesCount: number;
  };
  serviceSummary: {
    totalSpend: number;
    recordsCount: number;
    upcomingServicesCount: number;
  };
  tripSummary: {
    totalTrips: number;
    inProgressTrips: number;
    plannedTrips: number;
  };
  upcomingServices: Array<{
    id: string;
    vehicleId: string;
    vehicleName: string;
    nextServiceDate: string | null;
    nextServiceOdometer: number | null;
    reminderNotes: string | null;
  }>;
}

export async function getDashboardSummary(userId: string): Promise<DashboardSummaryResponse> {
  const [vehiclesRes, fuelRes, serviceRes, tripsRes, upcomingRes] = await Promise.all([
    // 1. Vehicle count
    query<{ count: string | number }>(
      `SELECT COUNT(id) AS count FROM public.vehicles WHERE user_id = $1`,
      [userId]
    ),
    // 2. Fuel spend & count
    query<{ total_spend: string | number; count: string | number }>(
      `SELECT COALESCE(SUM(total_amount), 0) AS total_spend, COUNT(id) AS count
       FROM public.fuel_entries WHERE user_id = $1`,
      [userId]
    ),
    // 3. Service spend & count
    query<{ total_spend: string | number; count: string | number; upcoming_count: string | number }>(
      `SELECT
         COALESCE(SUM(total_cost), 0) AS total_spend,
         COUNT(id) AS count,
         COUNT(CASE WHEN next_service_date >= CURRENT_DATE THEN 1 END) AS upcoming_count
       FROM public.service_records WHERE user_id = $1`,
      [userId]
    ),
    // 4. Trip counts
    query<{ total: string | number; in_progress: string | number; planned: string | number }>(
      `SELECT
         COUNT(id) AS total,
         COUNT(CASE WHEN status = 'IN_PROGRESS' THEN 1 END) AS in_progress,
         COUNT(CASE WHEN status = 'PLANNED' THEN 1 END) AS planned
       FROM public.trips WHERE user_id = $1`,
      [userId]
    ),
    // 5. Upcoming services list
    query<{
      id: string;
      vehicle_id: string;
      vehicle_name: string;
      next_service_date: string | null;
      next_service_odometer: string | number | null;
      reminder_notes: string | null;
    }>(
      `SELECT
         sr.id, sr.vehicle_id, v.name AS vehicle_name,
         sr.next_service_date, sr.next_service_odometer, sr.reminder_notes
       FROM public.service_records sr
       JOIN public.vehicles v ON v.id = sr.vehicle_id
       WHERE sr.user_id = $1 AND sr.next_service_date >= CURRENT_DATE
       ORDER BY sr.next_service_date ASC
       LIMIT 5`,
      [userId]
    ),
  ]);

  const vehCount = parseInt(String(vehiclesRes.rows[0]?.count || 0), 10);
  const fuelSpend = parseFloat(String(fuelRes.rows[0]?.total_spend || 0));
  const fuelCount = parseInt(String(fuelRes.rows[0]?.count || 0), 10);
  const srvSpend = parseFloat(String(serviceRes.rows[0]?.total_spend || 0));
  const srvCount = parseInt(String(serviceRes.rows[0]?.count || 0), 10);
  const upcomingCount = parseInt(String(serviceRes.rows[0]?.upcoming_count || 0), 10);

  const tripTotal = parseInt(String(tripsRes.rows[0]?.total || 0), 10);
  const tripInProgress = parseInt(String(tripsRes.rows[0]?.in_progress || 0), 10);
  const tripPlanned = parseInt(String(tripsRes.rows[0]?.planned || 0), 10);

  return {
    vehiclesCount: vehCount,
    fuelSummary: {
      totalSpend: Math.round(fuelSpend * 100) / 100,
      entriesCount: fuelCount,
    },
    serviceSummary: {
      totalSpend: Math.round(srvSpend * 100) / 100,
      recordsCount: srvCount,
      upcomingServicesCount: upcomingCount,
    },
    tripSummary: {
      totalTrips: tripTotal,
      inProgressTrips: tripInProgress,
      plannedTrips: tripPlanned,
    },
    upcomingServices: upcomingRes.rows.map((row) => ({
      id: row.id,
      vehicleId: row.vehicle_id,
      vehicleName: row.vehicle_name,
      nextServiceDate: row.next_service_date,
      nextServiceOdometer: row.next_service_odometer !== null ? parseFloat(String(row.next_service_odometer)) : null,
      reminderNotes: row.reminder_notes,
    })),
  };
}
