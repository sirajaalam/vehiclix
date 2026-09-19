import { query } from '../../database/postgres';

export interface AdminOverviewResponse {
  totalUsers: number;
  totalVehicles: number;
  totalTrips: number;
  totalFuelSpend: number;
  totalServiceSpend: number;
}

export interface AdminUserListItem {
  id: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  profileImagePath: string | null;
  vehiclesCount: number;
  createdAt: string;
}

export async function getAdminOverview(): Promise<AdminOverviewResponse> {
  const [usersRes, vehiclesRes, tripsRes, fuelRes, serviceRes] = await Promise.all([
    query<{ count: string | number }>(`SELECT COUNT(id) AS count FROM public.user_details`),
    query<{ count: string | number }>(`SELECT COUNT(id) AS count FROM public.vehicles`),
    query<{ count: string | number }>(`SELECT COUNT(id) AS count FROM public.trips`),
    query<{ total: string | number }>(`SELECT COALESCE(SUM(total_amount), 0) AS total FROM public.fuel_entries`),
    query<{ total: string | number }>(`SELECT COALESCE(SUM(total_cost), 0) AS total FROM public.service_records`),
  ]);

  return {
    totalUsers: parseInt(String(usersRes.rows[0]?.count || 0), 10),
    totalVehicles: parseInt(String(vehiclesRes.rows[0]?.count || 0), 10),
    totalTrips: parseInt(String(tripsRes.rows[0]?.count || 0), 10),
    totalFuelSpend: parseFloat(String(fuelRes.rows[0]?.total || 0)),
    totalServiceSpend: parseFloat(String(serviceRes.rows[0]?.total || 0)),
  };
}

export async function listAdminUsers(search?: string): Promise<AdminUserListItem[]> {
  let sql = `
    SELECT
      ud.id,
      ud.first_name,
      ud.last_name,
      ud.phone,
      ud.profile_image_path,
      ud.created_at,
      COUNT(v.id) AS vehicles_count
    FROM public.user_details ud
    LEFT JOIN public.vehicles v ON v.user_id = ud.id
  `;
  const params: unknown[] = [];

  if (search) {
    sql += ` WHERE ud.first_name ILIKE $1 OR ud.last_name ILIKE $1 OR ud.phone ILIKE $1`;
    params.push(`%${search}%`);
  }

  sql += ` GROUP BY ud.id ORDER BY ud.created_at DESC LIMIT 50`;

  const res = await query<{
    id: string;
    first_name: string | null;
    last_name: string | null;
    phone: string | null;
    profile_image_path: string | null;
    created_at: Date;
    vehicles_count: string | number;
  }>(sql, params);

  return res.rows.map((row) => ({
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    phone: row.phone,
    profileImagePath: row.profile_image_path,
    vehiclesCount: parseInt(String(row.vehicles_count), 10),
    createdAt: row.created_at.toISOString(),
  }));
}
