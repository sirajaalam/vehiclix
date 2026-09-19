import { query, pgPool } from '../../database/postgres';
import {
  CreateFuelEntryInput,
  UpdateFuelEntryInput,
  FuelEntryResponse,
  FuelStatisticsResponse,
  FuelUnit,
} from './fuel.schema';
import { FuelType } from '../vehicles/vehicles.schema';
import { AppError } from '../../middleware/error-handler';
import { getVehicleById } from '../vehicles/vehicles.service';

interface FuelRow {
  id: string;
  vehicle_id: string;
  user_id: string;
  entry_date: Date;
  odometer: string | number | null;
  quantity: string | number;
  unit: FuelUnit;
  price_per_unit: string | number;
  total_amount: string | number;
  fuel_type: FuelType;
  station_name: string | null;
  notes: string | null;
  created_at: Date;
  updated_at: Date;
}

function mapRowToFuel(row: FuelRow): FuelEntryResponse {
  return {
    id: row.id,
    vehicleId: row.vehicle_id,
    userId: row.user_id,
    entryDate: row.entry_date.toISOString(),
    odometer: row.odometer !== null ? parseFloat(String(row.odometer)) : null,
    quantity: parseFloat(String(row.quantity)),
    unit: row.unit,
    pricePerUnit: parseFloat(String(row.price_per_unit)),
    totalAmount: parseFloat(String(row.total_amount)),
    fuelType: row.fuel_type,
    stationName: row.station_name,
    notes: row.notes,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

export async function createFuelEntry(userId: string, input: CreateFuelEntryInput): Promise<FuelEntryResponse> {
  // 1. Verify vehicle belongs to user
  const vehicle = await getVehicleById(userId, input.vehicleId);

  // 2. Exact paise calculation if totalAmount not explicitly specified
  let totalAmount = input.totalAmount;
  if (totalAmount === undefined) {
    const paise = Math.round(input.quantity * input.pricePerUnit * 100);
    totalAmount = paise / 100;
  }

  const client = await pgPool.connect();
  try {
    await client.query('BEGIN');

    // 3. Insert fuel entry
    const insertRes = await client.query<FuelRow>(
      `INSERT INTO public.fuel_entries (
         vehicle_id, user_id, entry_date, odometer, quantity, unit,
         price_per_unit, total_amount, fuel_type, station_name, notes
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [
        input.vehicleId,
        userId,
        input.entryDate || new Date().toISOString(),
        input.odometer || null,
        input.quantity,
        input.unit,
        input.pricePerUnit,
        totalAmount,
        input.fuelType,
        input.stationName || null,
        input.notes || null,
      ]
    );

    const insertedRow = insertRes.rows[0];
    if (!insertedRow) {
      throw new AppError('Failed to record fuel entry', 500, 'CREATE_FUEL_ENTRY_FAILED');
    }

    // 4. Update vehicle odometer if provided reading is higher than current
    if (input.odometer !== undefined && input.odometer !== null && input.odometer > vehicle.currentOdometer) {
      await client.query(
        `UPDATE public.vehicles SET current_odometer = $1 WHERE id = $2`,
        [input.odometer, input.vehicleId]
      );
    }

    await client.query('COMMIT');
    return mapRowToFuel(insertedRow);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function listFuelEntries(userId: string, vehicleId?: string): Promise<FuelEntryResponse[]> {
  let sql = `SELECT * FROM public.fuel_entries WHERE user_id = $1`;
  const params: unknown[] = [userId];

  if (vehicleId) {
    sql += ` AND vehicle_id = $2`;
    params.push(vehicleId);
  }

  sql += ` ORDER BY entry_date DESC, created_at DESC`;

  const res = await query<FuelRow>(sql, params);
  return res.rows.map(mapRowToFuel);
}

export async function getFuelEntryById(userId: string, fuelId: string): Promise<FuelEntryResponse> {
  const res = await query<FuelRow>(
    `SELECT * FROM public.fuel_entries WHERE id = $1 AND user_id = $2`,
    [fuelId, userId]
  );

  const row = res.rows[0];
  if (!row) {
    throw new AppError('Fuel entry not found', 404, 'FUEL_ENTRY_NOT_FOUND');
  }

  return mapRowToFuel(row);
}

export async function updateFuelEntry(
  userId: string,
  fuelId: string,
  input: UpdateFuelEntryInput
): Promise<FuelEntryResponse> {
  const existing = await getFuelEntryById(userId, fuelId);

  const setClauses: string[] = [];
  const params: any[] = [fuelId, userId];
  let idx = 3;

  if (input.vehicleId !== undefined) {
    await getVehicleById(userId, input.vehicleId);
    setClauses.push(`vehicle_id = $${idx++}`);
    params.push(input.vehicleId);
  }

  if (input.entryDate !== undefined) {
    setClauses.push(`entry_date = $${idx++}`);
    params.push(input.entryDate);
  }
  if (input.odometer !== undefined) {
    setClauses.push(`odometer = $${idx++}`);
    params.push(input.odometer);
  }
  if (input.quantity !== undefined) {
    setClauses.push(`quantity = $${idx++}`);
    params.push(input.quantity);
  }
  if (input.unit !== undefined) {
    setClauses.push(`unit = $${idx++}`);
    params.push(input.unit);
  }
  if (input.pricePerUnit !== undefined) {
    setClauses.push(`price_per_unit = $${idx++}`);
    params.push(input.pricePerUnit);
  }
  if (input.totalAmount !== undefined) {
    setClauses.push(`total_amount = $${idx++}`);
    params.push(input.totalAmount);
  }
  if (input.fuelType !== undefined) {
    setClauses.push(`fuel_type = $${idx++}`);
    params.push(input.fuelType);
  }
  if (input.stationName !== undefined) {
    setClauses.push(`station_name = $${idx++}`);
    params.push(input.stationName);
  }
  if (input.notes !== undefined) {
    setClauses.push(`notes = $${idx++}`);
    params.push(input.notes);
  }

  if (setClauses.length === 0) {
    return existing;
  }

  const res = await query<FuelRow>(
    `UPDATE public.fuel_entries
     SET ${setClauses.join(', ')}
     WHERE id = $1 AND user_id = $2
     RETURNING *`,
    params
  );

  const row = res.rows[0];
  if (!row) {
    throw new AppError('Failed to update fuel entry', 500, 'UPDATE_FAILED');
  }

  return mapRowToFuel(row);
}

export async function deleteFuelEntry(userId: string, fuelId: string): Promise<void> {
  await getFuelEntryById(userId, fuelId);

  await query(`DELETE FROM public.fuel_entries WHERE id = $1 AND user_id = $2`, [fuelId, userId]);
}

export async function getFuelStatistics(userId: string, vehicleId?: string): Promise<FuelStatisticsResponse> {
  let sql = `
    SELECT
      COALESCE(SUM(total_amount), 0) AS total_spend,
      COUNT(id) AS entry_count,
      COALESCE(AVG(price_per_unit), 0) AS avg_price,
      unit,
      COALESCE(SUM(quantity), 0) AS unit_quantity
    FROM public.fuel_entries
    WHERE user_id = $1
  `;
  const params: unknown[] = [userId];

  if (vehicleId) {
    sql += ` AND vehicle_id = $2`;
    params.push(vehicleId);
  }

  sql += ` GROUP BY unit`;

  const res = await query<{
    total_spend: string | number;
    entry_count: string | number;
    avg_price: string | number;
    unit: string;
    unit_quantity: string | number;
  }>(sql, params);

  let totalSpend = 0;
  let entryCount = 0;
  let weightedPriceSum = 0;
  const quantityByUnit: Record<string, number> = {};

  for (const row of res.rows) {
    const spend = parseFloat(String(row.total_spend));
    const count = parseInt(String(row.entry_count), 10);
    const avgPrice = parseFloat(String(row.avg_price));
    const qty = parseFloat(String(row.unit_quantity));

    totalSpend += spend;
    entryCount += count;
    weightedPriceSum += avgPrice * count;
    quantityByUnit[row.unit] = qty;
  }

  return {
    totalSpend: Math.round(totalSpend * 100) / 100,
    entryCount,
    quantityByUnit,
    averagePricePerUnit: entryCount > 0 ? Math.round((weightedPriceSum / entryCount) * 100) / 100 : 0,
  };
}
