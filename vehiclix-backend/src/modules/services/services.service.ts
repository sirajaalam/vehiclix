import { query, pgPool } from '../../database/postgres';
import {
  CreateServiceRecordInput,
  UpdateServiceRecordInput,
  ServiceRecordResponse,
  ServicePartResponse,
} from './services.schema';
import { AppError } from '../../middleware/error-handler';
import { getVehicleById } from '../vehicles/vehicles.service';

interface ServiceRecordRow {
  id: string;
  vehicle_id: string;
  user_id: string;
  service_date: Date;
  odometer: string | number | null;
  service_provider: string | null;
  notes: string | null;
  labour_cost: string | number;
  parts_cost: string | number;
  tax: string | number;
  misc_cost: string | number;
  total_cost: string | number;
  next_service_date: string | null;
  next_service_odometer: string | number | null;
  reminder_notes: string | null;
  document_paths: string[];
  created_at: Date;
  updated_at: Date;
}

interface ServicePartRow {
  id: string;
  part_name: string;
  part_number: string | null;
  quantity: string | number;
  unit_cost: string | number;
  total_cost: string | number;
  notes: string | null;
  created_at: Date;
}

function mapRowToServiceRecord(row: ServiceRecordRow, parts?: ServicePartResponse[]): ServiceRecordResponse {
  return {
    id: row.id,
    vehicleId: row.vehicle_id,
    userId: row.user_id,
    serviceDate: row.service_date.toISOString(),
    odometer: row.odometer !== null ? parseFloat(String(row.odometer)) : null,
    serviceProvider: row.service_provider,
    notes: row.notes,
    labourCost: parseFloat(String(row.labour_cost)),
    partsCost: parseFloat(String(row.parts_cost)),
    tax: parseFloat(String(row.tax)),
    miscCost: parseFloat(String(row.misc_cost)),
    totalCost: parseFloat(String(row.total_cost)),
    nextServiceDate: row.next_service_date,
    nextServiceOdometer: row.next_service_odometer !== null ? parseFloat(String(row.next_service_odometer)) : null,
    reminderNotes: row.reminder_notes,
    documentPaths: row.document_paths || [],
    parts,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

function mapRowToPart(row: ServicePartRow): ServicePartResponse {
  return {
    id: row.id,
    partName: row.part_name,
    partNumber: row.part_number,
    quantity: parseFloat(String(row.quantity)),
    unitCost: parseFloat(String(row.unit_cost)),
    totalCost: parseFloat(String(row.total_cost)),
    notes: row.notes || null,
    createdAt: row.created_at.toISOString(),
  };
}

export async function createServiceRecord(
  userId: string,
  input: CreateServiceRecordInput
): Promise<ServiceRecordResponse> {
  const vehicle = await getVehicleById(userId, input.vehicleId);

  // 1. Calculate parts total in integer paise
  let partsTotalPaise = 0;
  const processedParts = (input.parts || []).map((p) => {
    const qty = p.quantity ?? 1;
    const partCostPaise = Math.round((p.totalCost ?? (qty * p.unitCost)) * 100);
    partsTotalPaise += partCostPaise;
    return {
      ...p,
      quantity: qty,
      totalCost: partCostPaise / 100,
    };
  });

  const partsCost = input.partsCost !== undefined ? input.partsCost : partsTotalPaise / 100;
  const labourCost = input.labourCost ?? 0;
  const tax = input.tax ?? 0;
  const miscCost = input.miscCost ?? 0;

  // 2. Calculate total service cost in paise
  let totalCost = input.totalCost;
  if (totalCost === undefined) {
    const totalPaise = Math.round((labourCost + partsCost + tax + miscCost) * 100);
    totalCost = totalPaise / 100;
  }

  const client = await pgPool.connect();
  try {
    await client.query('BEGIN');

    // 3. Insert service record
    const insertRes = await client.query<ServiceRecordRow>(
      `INSERT INTO public.service_records (
         vehicle_id, user_id, service_date, odometer, service_provider,
         notes, labour_cost, parts_cost, tax, misc_cost, total_cost,
         next_service_date, next_service_odometer, reminder_notes, document_paths
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
       RETURNING *`,
      [
        input.vehicleId,
        userId,
        input.serviceDate || new Date().toISOString(),
        input.odometer || null,
        input.serviceProvider || null,
        input.notes || null,
        labourCost,
        partsCost,
        tax,
        miscCost,
        totalCost,
        input.nextServiceDate || null,
        input.nextServiceOdometer || null,
        input.reminderNotes || null,
        input.documentPaths || [],
      ]
    );

    const insertedRow = insertRes.rows[0];
    if (!insertedRow) {
      throw new AppError('Failed to record service', 500, 'CREATE_SERVICE_FAILED');
    }

    // 4. Insert service parts if any
    const createdParts: ServicePartResponse[] = [];
    for (const part of processedParts) {
      const partRes = await client.query<ServicePartRow>(
        `INSERT INTO public.service_parts (
           service_record_id, part_name, part_number, quantity, unit_cost, total_cost, notes
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [insertedRow.id, part.partName, part.partNumber || null, part.quantity, part.unitCost, part.totalCost, part.notes || null]
      );
      if (partRes.rows[0]) {
        createdParts.push(mapRowToPart(partRes.rows[0]));
      }
    }

    // 5. Update vehicle current odometer if reading is higher than current
    if (input.odometer !== undefined && input.odometer !== null && input.odometer > vehicle.currentOdometer) {
      await client.query(
        `UPDATE public.vehicles SET current_odometer = $1 WHERE id = $2`,
        [input.odometer, input.vehicleId]
      );
    }

    await client.query('COMMIT');
    return mapRowToServiceRecord(insertedRow, createdParts);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function listServiceRecords(userId: string, vehicleId?: string): Promise<ServiceRecordResponse[]> {
  let sql = `SELECT * FROM public.service_records WHERE user_id = $1`;
  const params: unknown[] = [userId];

  if (vehicleId) {
    sql += ` AND vehicle_id = $2`;
    params.push(vehicleId);
  }

  sql += ` ORDER BY service_date DESC`;

  const res = await query<ServiceRecordRow>(sql, params);
  if (res.rows.length === 0) {
    return [];
  }

  const recordIds = res.rows.map((r) => r.id);
  const partsRes = await query<ServicePartRow & { service_record_id: string }>(
    `SELECT * FROM public.service_parts WHERE service_record_id = ANY($1::uuid[]) ORDER BY created_at ASC`,
    [recordIds]
  );

  const partsByRecordId: Record<string, ServicePartResponse[]> = {};
  for (const partRow of partsRes.rows) {
    const list = partsByRecordId[partRow.service_record_id] ?? [];
    list.push(mapRowToPart(partRow));
    partsByRecordId[partRow.service_record_id] = list;
  }

  return res.rows.map((row) => mapRowToServiceRecord(row, partsByRecordId[row.id] || []));
}

export async function getServiceRecordById(userId: string, serviceId: string): Promise<ServiceRecordResponse> {
  const recordRes = await query<ServiceRecordRow>(
    `SELECT * FROM public.service_records WHERE id = $1 AND user_id = $2`,
    [serviceId, userId]
  );

  const row = recordRes.rows[0];
  if (!row) {
    throw new AppError('Service record not found', 404, 'SERVICE_RECORD_NOT_FOUND');
  }

  // Fetch associated parts
  const partsRes = await query<ServicePartRow>(
    `SELECT * FROM public.service_parts WHERE service_record_id = $1 ORDER BY created_at ASC`,
    [serviceId]
  );

  return mapRowToServiceRecord(row, partsRes.rows.map(mapRowToPart));
}

export async function updateServiceRecord(
  userId: string,
  serviceId: string,
  input: UpdateServiceRecordInput
): Promise<ServiceRecordResponse> {
  const existing = await getServiceRecordById(userId, serviceId);

  const client = await pgPool.connect();
  try {
    await client.query('BEGIN');

    const setClauses: string[] = [];
    const params: any[] = [serviceId, userId];
    let idx = 3;

    if (input.serviceDate !== undefined) {
      setClauses.push(`service_date = $${idx++}`);
      params.push(input.serviceDate);
    }
    if (input.odometer !== undefined) {
      setClauses.push(`odometer = $${idx++}`);
      params.push(input.odometer);
    }
    if (input.serviceProvider !== undefined) {
      setClauses.push(`service_provider = $${idx++}`);
      params.push(input.serviceProvider);
    }
    if (input.notes !== undefined) {
      setClauses.push(`notes = $${idx++}`);
      params.push(input.notes);
    }
    if (input.labourCost !== undefined) {
      setClauses.push(`labour_cost = $${idx++}`);
      params.push(input.labourCost);
    }
    if (input.partsCost !== undefined) {
      setClauses.push(`parts_cost = $${idx++}`);
      params.push(input.partsCost);
    }
    if (input.tax !== undefined) {
      setClauses.push(`tax = $${idx++}`);
      params.push(input.tax);
    }
    if (input.miscCost !== undefined) {
      setClauses.push(`misc_cost = $${idx++}`);
      params.push(input.miscCost);
    }
    if (input.totalCost !== undefined) {
      setClauses.push(`total_cost = $${idx++}`);
      params.push(input.totalCost);
    }
    if (input.nextServiceDate !== undefined) {
      setClauses.push(`next_service_date = $${idx++}`);
      params.push(input.nextServiceDate);
    }
    if (input.nextServiceOdometer !== undefined) {
      setClauses.push(`next_service_odometer = $${idx++}`);
      params.push(input.nextServiceOdometer);
    }
    if (input.reminderNotes !== undefined) {
      setClauses.push(`reminder_notes = $${idx++}`);
      params.push(input.reminderNotes);
    }
    if (input.documentPaths !== undefined) {
      setClauses.push(`document_paths = $${idx++}`);
      params.push(input.documentPaths);
    }

    let row = existing as unknown as ServiceRecordRow;
    if (setClauses.length > 0) {
      const res = await client.query<ServiceRecordRow>(
        `UPDATE public.service_records
         SET ${setClauses.join(', ')}
         WHERE id = $1 AND user_id = $2
         RETURNING *`,
        params
      );
      if (!res.rows[0]) {
        throw new AppError('Failed to update service record', 500, 'UPDATE_FAILED');
      }
      row = res.rows[0];
    }

    let updatedParts: ServicePartResponse[] | undefined;
    if (input.parts !== undefined) {
      // Replace parts
      await client.query(`DELETE FROM public.service_parts WHERE service_record_id = $1`, [serviceId]);
      updatedParts = [];
      for (const part of input.parts) {
        const qty = part.quantity ?? 1;
        const totalCost = part.totalCost ?? (qty * part.unitCost);
        const partRes = await client.query<ServicePartRow>(
          `INSERT INTO public.service_parts (
             service_record_id, part_name, part_number, quantity, unit_cost, total_cost, notes
           )
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           RETURNING *`,
          [serviceId, part.partName, part.partNumber || null, qty, part.unitCost, totalCost, part.notes || null]
        );
        if (partRes.rows[0]) {
          updatedParts.push(mapRowToPart(partRes.rows[0]));
        }
      }
    } else {
      const partsRes = await client.query<ServicePartRow>(
        `SELECT * FROM public.service_parts WHERE service_record_id = $1 ORDER BY created_at ASC`,
        [serviceId]
      );
      updatedParts = partsRes.rows.map(mapRowToPart);
    }

    await client.query('COMMIT');
    return mapRowToServiceRecord(row, updatedParts);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function deleteServiceRecord(userId: string, serviceId: string): Promise<void> {
  await getServiceRecordById(userId, serviceId);

  await query(`DELETE FROM public.service_records WHERE id = $1 AND user_id = $2`, [serviceId, userId]);
}
