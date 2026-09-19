import { query, pgPool } from '../../database/postgres';
import {
  CreateVehicleInput,
  UpdateVehicleInput,
  VehicleResponse,
  VehicleType,
  FuelType,
} from './vehicles.schema';
import { AppError } from '../../middleware/error-handler';

interface VehicleRow {
  id: string;
  user_id: string;
  name: string;
  make: string | null;
  model: string | null;
  year: number | null;
  license_plate: string | null;
  vehicle_type: VehicleType;
  fuel_type: FuelType;
  initial_odometer: string | number;
  current_odometer: string | number;
  rc_document_path: string | null;
  is_primary?: boolean | null;
  tank_capacity?: string | number | null;
  created_at: Date;
  updated_at: Date;
}

function mapRowToVehicle(row: VehicleRow): VehicleResponse {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    make: row.make,
    model: row.model,
    year: row.year,
    licensePlate: row.license_plate,
    vehicleType: row.vehicle_type,
    fuelType: row.fuel_type,
    initialOdometer: parseFloat(String(row.initial_odometer)),
    currentOdometer: parseFloat(String(row.current_odometer)),
    rcDocumentPath: row.rc_document_path,
    isPrimary: Boolean(row.is_primary),
    tankCapacity: row.tank_capacity != null ? parseFloat(String(row.tank_capacity)) : null,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

export async function createVehicle(userId: string, input: CreateVehicleInput): Promise<VehicleResponse> {
  const initialOdo = input.initialOdometer ?? 0;

  // If set as primary, unset any existing primary vehicle for this user
  if (input.isPrimary) {
    await query(`UPDATE public.vehicles SET is_primary = false WHERE user_id = $1`, [userId]);
  }

  const result = await query<VehicleRow>(
    `INSERT INTO public.vehicles (
       user_id, name, make, model, year, license_plate,
       vehicle_type, fuel_type, initial_odometer, current_odometer, rc_document_path,
       is_primary, tank_capacity
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
     RETURNING *`,
    [
      userId,
      input.name,
      input.make || null,
      input.model || null,
      input.year || null,
      input.licensePlate || null,
      input.vehicleType,
      input.fuelType,
      initialOdo,
      initialOdo,
      input.rcDocumentPath || null,
      input.isPrimary ?? false,
      input.tankCapacity ?? null,
    ]
  );

  const row = result.rows[0];
  if (!row) {
    throw new AppError('Failed to create vehicle record', 500, 'CREATE_VEHICLE_FAILED');
  }

  return mapRowToVehicle(row);
}

export async function listVehicles(userId: string): Promise<VehicleResponse[]> {
  const result = await query<VehicleRow>(
    `SELECT * FROM public.vehicles
     WHERE user_id = $1
     ORDER BY is_primary DESC, created_at DESC`,
    [userId]
  );

  return result.rows.map(mapRowToVehicle);
}

export async function getVehicleById(userId: string, vehicleId: string): Promise<VehicleResponse> {
  const result = await query<VehicleRow>(
    `SELECT * FROM public.vehicles
     WHERE id = $1 AND user_id = $2`,
    [vehicleId, userId]
  );

  const row = result.rows[0];
  if (!row) {
    throw new AppError('Vehicle not found or you do not have permission to view it', 404, 'VEHICLE_NOT_FOUND');
  }

  return mapRowToVehicle(row);
}

export async function updateVehicle(
  userId: string,
  vehicleId: string,
  input: UpdateVehicleInput
): Promise<VehicleResponse> {
  // First verify existence and ownership
  const existing = await getVehicleById(userId, vehicleId);

  const newInitialOdo = input.initialOdometer !== undefined ? input.initialOdometer : existing.initialOdometer;
  const newCurrentOdo = input.currentOdometer !== undefined ? input.currentOdometer : existing.currentOdometer;

  if (newCurrentOdo < newInitialOdo) {
    throw new AppError(
      'Current odometer cannot be less than initial odometer',
      400,
      'INVALID_ODOMETER_CONTINUITY'
    );
  }

  // If updating to primary, unset any existing primary vehicle
  if (input.isPrimary === true) {
    await query(`UPDATE public.vehicles SET is_primary = false WHERE user_id = $1 AND id != $2`, [userId, vehicleId]);
  }

  const setClauses: string[] = [];
  const params: any[] = [vehicleId, userId];
  let idx = 3;

  if (input.name !== undefined) {
    setClauses.push(`name = $${idx++}`);
    params.push(input.name);
  }
  if (input.make !== undefined) {
    setClauses.push(`make = $${idx++}`);
    params.push(input.make);
  }
  if (input.model !== undefined) {
    setClauses.push(`model = $${idx++}`);
    params.push(input.model);
  }
  if (input.year !== undefined) {
    setClauses.push(`year = $${idx++}`);
    params.push(input.year);
  }
  if (input.licensePlate !== undefined) {
    setClauses.push(`license_plate = $${idx++}`);
    params.push(input.licensePlate);
  }
  if (input.vehicleType !== undefined) {
    setClauses.push(`vehicle_type = $${idx++}`);
    params.push(input.vehicleType);
  }
  if (input.fuelType !== undefined) {
    setClauses.push(`fuel_type = $${idx++}`);
    params.push(input.fuelType);
  }
  if (input.initialOdometer !== undefined) {
    setClauses.push(`initial_odometer = $${idx++}`);
    params.push(input.initialOdometer);
  }
  if (input.currentOdometer !== undefined) {
    setClauses.push(`current_odometer = $${idx++}`);
    params.push(input.currentOdometer);
  }
  if (input.rcDocumentPath !== undefined) {
    setClauses.push(`rc_document_path = $${idx++}`);
    params.push(input.rcDocumentPath);
  }
  if (input.isPrimary !== undefined) {
    setClauses.push(`is_primary = $${idx++}`);
    params.push(input.isPrimary);
  }
  if (input.tankCapacity !== undefined) {
    setClauses.push(`tank_capacity = $${idx++}`);
    params.push(input.tankCapacity);
  }

  if (setClauses.length === 0) {
    return existing;
  }

  const result = await query<VehicleRow>(
    `UPDATE public.vehicles
     SET ${setClauses.join(', ')}
     WHERE id = $1 AND user_id = $2
     RETURNING *`,
    params
  );

  const row = result.rows[0];
  if (!row) {
    throw new AppError('Failed to update vehicle', 500, 'UPDATE_FAILED');
  }

  return mapRowToVehicle(row);
}

export async function deleteVehicle(userId: string, vehicleId: string): Promise<void> {
  // Ensure vehicle belongs to authenticated user (IDOR prevention)
  await getVehicleById(userId, vehicleId);

  const client = await pgPool.connect();
  try {
    await client.query('BEGIN');

    // Rule: "If a trip references a Garage vehicle and that vehicle is deleted,
    // do not delete the trip merely because the vehicle was deleted. Preserve the trip
    // and remove/null the vehicle relationship"
    // (Check if trips table exists before updating)
    const checkTable = await client.query(
      `SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'trips'`
    );
    if (checkTable.rowCount && checkTable.rowCount > 0) {
      await client.query(`UPDATE public.trips SET vehicle_id = NULL WHERE vehicle_id = $1`, [vehicleId]);
    }

    // Delete vehicle (cascades related fuel entries, service records, and RC document references)
    await client.query(`DELETE FROM public.vehicles WHERE id = $1 AND user_id = $2`, [vehicleId, userId]);

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
