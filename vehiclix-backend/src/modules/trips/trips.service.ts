import { query, pgPool } from '../../database/postgres';
import {
  CreateTripInput,
  UpdateTripInput,
  AddParticipantInput,
  CreateTripExpenseInput,
  UpdateTripExpenseInput,
  TripResponse,
  ParticipantResponse,
  TripExpenseResponse,
  TripSplitCalculationResponse,
  ParticipantSplitSummary,
  TripStatus,
  ExpenseCategory,
} from './trips.schema';
import { AppError } from '../../middleware/error-handler';

interface TripRow {
  id: string;
  user_id: string;
  vehicle_id: string | null;
  title: string;
  start_date: Date;
  end_date: Date | null;
  start_location: string | null;
  destination: string | null;
  estimated_distance: string | number | null;
  actual_distance: string | number | null;
  status: TripStatus;
  split_expenses: boolean;
  split_method: string;
  notes: string | null;
  created_at: Date;
  updated_at: Date;
  total_expenses?: string | number;
}

interface ParticipantRow {
  id: string;
  trip_id: string;
  user_id: string | null;
  name: string;
  email: string | null;
  phone: string | null;
  is_included_in_split: boolean;
  created_at: Date;
}

interface ExpenseRow {
  id: string;
  trip_id: string;
  payer_participant_id: string;
  category: ExpenseCategory;
  amount: string | number;
  expense_date: Date;
  notes: string | null;
  created_at: Date;
  updated_at: Date;
  payer_name?: string;
}

export function deriveTripStatus(startDate: string | Date): 'PLANNED' | 'IN_PROGRESS' {
  if (!startDate) return 'PLANNED';
  const now = new Date();
  const start = new Date(startDate);
  const startDay = new Date(start.getFullYear(), start.getMonth(), start.getDate(), 0, 0, 0, 0);

  if (now.getTime() < startDay.getTime()) {
    return 'PLANNED';
  }

  return 'IN_PROGRESS';
}

function toISOStringSafe(val: any): string | null {
  if (!val) return null;
  if (val instanceof Date) {
    return isNaN(val.getTime()) ? null : val.toISOString();
  }
  if (typeof val === 'string') {
    const d = new Date(val);
    return isNaN(d.getTime()) ? val : d.toISOString();
  }
  return null;
}

function mapRowToTrip(row: any): TripResponse {
  const startDateVal = row.start_date || row.startDate;
  const endDateVal = row.end_date || row.endDate;
  const createdAtVal = row.created_at || row.createdAt || new Date();
  const updatedAtVal = row.updated_at || row.updatedAt || new Date();

  const dynamicStatus = row.status === 'COMPLETED' ? 'COMPLETED' : deriveTripStatus(startDateVal);
  return {
    id: row.id,
    userId: row.user_id || row.userId,
    vehicleId: row.vehicle_id !== undefined ? row.vehicle_id : row.vehicleId,
    title: row.title,
    startDate: toISOStringSafe(startDateVal) || new Date().toISOString(),
    endDate: toISOStringSafe(endDateVal),
    startLocation: row.start_location !== undefined ? row.start_location : row.startLocation,
    destination: row.destination,
    estimatedDistance:
      row.estimated_distance !== undefined && row.estimated_distance !== null
        ? parseFloat(String(row.estimated_distance))
        : row.estimatedDistance !== undefined && row.estimatedDistance !== null
        ? parseFloat(String(row.estimatedDistance))
        : null,
    actualDistance:
      row.actual_distance !== undefined && row.actual_distance !== null
        ? parseFloat(String(row.actual_distance))
        : row.actualDistance !== undefined && row.actualDistance !== null
        ? parseFloat(String(row.actualDistance))
        : null,
    status: row.status === 'COMPLETED' ? 'COMPLETED' : dynamicStatus,
    splitExpenses: row.split_expenses !== undefined ? Boolean(row.split_expenses) : Boolean(row.splitExpenses),
    splitMethod: row.split_method || row.splitMethod || 'EQUAL',
    notes: row.notes,
    totalExpenses:
      row.total_expenses !== undefined
        ? parseFloat(String(row.total_expenses))
        : row.totalExpenses !== undefined
        ? parseFloat(String(row.totalExpenses))
        : undefined,
    createdAt: toISOStringSafe(createdAtVal) || new Date().toISOString(),
    updatedAt: toISOStringSafe(updatedAtVal) || new Date().toISOString(),
  };
}

function mapRowToParticipant(row: ParticipantRow): ParticipantResponse {
  return {
    id: row.id,
    tripId: row.trip_id,
    userId: row.user_id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    isIncludedInSplit: row.is_included_in_split,
    createdAt: toISOStringSafe(row.created_at) || new Date().toISOString(),
  };
}

function mapRowToExpense(row: any): TripExpenseResponse {
  return {
    id: row.id,
    tripId: row.trip_id || row.tripId,
    payerParticipantId: row.payer_participant_id || row.payerParticipantId,
    payerName: row.payer_name || row.payerName,
    category: row.category,
    amount: parseFloat(String(row.amount)),
    expenseDate: toISOStringSafe(row.expense_date || row.expenseDate) || new Date().toISOString(),
    notes: row.notes,
    createdAt: toISOStringSafe(row.created_at || row.createdAt) || new Date().toISOString(),
    updatedAt: toISOStringSafe(row.updated_at || row.updatedAt) || new Date().toISOString(),
  };
}

export async function createTrip(userId: string, input: CreateTripInput): Promise<TripResponse> {
  const client = await pgPool.connect();
  try {
    await client.query('BEGIN');

    // 1. Insert Trip
    const tripRes = await client.query<TripRow>(
      `INSERT INTO public.trips (
         user_id, vehicle_id, title, start_date, end_date,
         start_location, destination, estimated_distance, actual_distance,
         status, split_expenses, notes
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING *`,
      [
        userId,
        input.vehicleId || null,
        input.title,
        input.startDate,
        input.endDate || null,
        input.startLocation || null,
        input.destination || null,
        input.estimatedDistance || null,
        input.actualDistance || null,
        input.status || deriveTripStatus(input.startDate),
        input.splitExpenses,
        input.notes || null,
      ]
    );

    const tripRow = tripRes.rows[0];
    if (!tripRow) {
      throw new AppError('Failed to create trip', 500, 'CREATE_TRIP_FAILED');
    }

    // 2. Add creator as default participant if no initial participants, or add initial participants
    const participants: ParticipantResponse[] = [];
    if (input.initialParticipants && input.initialParticipants.length > 0) {
      for (const p of input.initialParticipants) {
        const pRes = await client.query<ParticipantRow>(
          `INSERT INTO public.trip_participants (trip_id, name, email, phone, is_included_in_split)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING *`,
          [tripRow.id, p.name, p.email || null, p.phone || null, p.isIncludedInSplit]
        );
        if (pRes.rows[0]) participants.push(mapRowToParticipant(pRes.rows[0]));
      }
    } else {
      // Default: add trip owner as first participant
      const pRes = await client.query<ParticipantRow>(
        `INSERT INTO public.trip_participants (trip_id, user_id, name)
         VALUES ($1, $2, 'Trip Owner')
         RETURNING *`,
        [tripRow.id, userId]
      );
      if (pRes.rows[0]) participants.push(mapRowToParticipant(pRes.rows[0]));
    }

    // 3. Add initial expenses if provided
    let totalExpAmount = 0;
    if (input.initialExpenses && input.initialExpenses.length > 0) {
      const payerId = participants[0]?.id;
      if (payerId) {
        for (const exp of input.initialExpenses) {
          if (exp.amount > 0) {
            await client.query(
              `INSERT INTO public.trip_expenses (
                 trip_id, payer_participant_id, category, amount, expense_date, notes
               )
               VALUES ($1, $2, $3, $4, $5, $6)`,
              [
                tripRow.id,
                payerId,
                exp.category,
                exp.amount,
                exp.expenseDate ? new Date(exp.expenseDate) : new Date(),
                exp.notes || null,
              ]
            );
            totalExpAmount += exp.amount;
          }
        }
      }
    }

    await client.query('COMMIT');

    const mappedTrip = mapRowToTrip(tripRow);
    mappedTrip.participants = participants;
    mappedTrip.totalExpenses = totalExpAmount;
    return mappedTrip;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function listTrips(userId: string): Promise<TripResponse[]> {
  const res = await query<TripRow>(
    `SELECT t.*, COALESCE(SUM(te.amount), 0) AS total_expenses
     FROM public.trips t
     LEFT JOIN public.trip_expenses te ON te.trip_id = t.id
     WHERE t.user_id = $1
     GROUP BY t.id
     ORDER BY t.start_date DESC`,
    [userId]
  );
  return res.rows.map(mapRowToTrip);
}

export async function getTripById(userId: string, tripId: string): Promise<TripResponse> {
  const tripRes = await query<TripRow>(
    `SELECT * FROM public.trips WHERE id = $1 AND user_id = $2`,
    [tripId, userId]
  );

  const tripRow = tripRes.rows[0];
  if (!tripRow) {
    throw new AppError('Trip not found or unauthorized', 404, 'TRIP_NOT_FOUND');
  }

  // Fetch participants
  const partRes = await query<ParticipantRow>(
    `SELECT * FROM public.trip_participants WHERE trip_id = $1 ORDER BY created_at ASC`,
    [tripId]
  );

  // Fetch expenses
  const expRes = await query<ExpenseRow>(
    `SELECT te.*, tp.name as payer_name
     FROM public.trip_expenses te
     JOIN public.trip_participants tp ON tp.id = te.payer_participant_id
     WHERE te.trip_id = $1
     ORDER BY te.expense_date DESC`,
    [tripId]
  );

  let totalExpensesPaise = 0;
  for (const exp of expRes.rows) {
    totalExpensesPaise += Math.round(parseFloat(String(exp.amount)) * 100);
  }

  const mapped = mapRowToTrip(tripRow);
  mapped.participants = partRes.rows.map(mapRowToParticipant);
  mapped.expenses = expRes.rows.map(mapRowToExpense);
  mapped.totalExpenses = totalExpensesPaise / 100;
  return mapped;
}

export async function updateTrip(userId: string, tripId: string, input: UpdateTripInput): Promise<TripResponse> {
  // Check existence and verify read-only rule
  const existing = await getTripById(userId, tripId);
  if (existing.status === 'COMPLETED' && input.status !== 'IN_PROGRESS' && input.status !== 'PLANNED') {
    // Rule: "Completed trips are read-only"
    throw new AppError('Completed trips are read-only and cannot be modified.', 400, 'COMPLETED_TRIP_READONLY');
  }

  const setClauses: string[] = [];
  const params: any[] = [tripId, userId];
  let idx = 3;

  if (input.vehicleId !== undefined) {
    setClauses.push(`vehicle_id = $${idx++}`);
    params.push(input.vehicleId);
  }
  if (input.title !== undefined) {
    setClauses.push(`title = $${idx++}`);
    params.push(input.title);
  }
  if (input.startDate !== undefined) {
    setClauses.push(`start_date = $${idx++}`);
    params.push(input.startDate);
  }
  if (input.endDate !== undefined) {
    setClauses.push(`end_date = $${idx++}`);
    params.push(input.endDate);
  }
  if (input.startLocation !== undefined) {
    setClauses.push(`start_location = $${idx++}`);
    params.push(input.startLocation);
  }
  if (input.destination !== undefined) {
    setClauses.push(`destination = $${idx++}`);
    params.push(input.destination);
  }
  if (input.estimatedDistance !== undefined) {
    setClauses.push(`estimated_distance = $${idx++}`);
    params.push(input.estimatedDistance);
  }
  if (input.actualDistance !== undefined) {
    setClauses.push(`actual_distance = $${idx++}`);
    params.push(input.actualDistance);
  }
  if (input.status !== undefined) {
    setClauses.push(`status = $${idx++}`);
    params.push(input.status);
  }
  if (input.splitExpenses !== undefined) {
    setClauses.push(`split_expenses = $${idx++}`);
    params.push(input.splitExpenses);
  }
  if (input.notes !== undefined) {
    setClauses.push(`notes = $${idx++}`);
    params.push(input.notes);
  }

  if (setClauses.length === 0 && input.expenses === undefined && input.participants === undefined) {
    return existing;
  }

  const client = await pgPool.connect();
  try {
    await client.query('BEGIN');

    let tripRow: TripRow;
    if (setClauses.length > 0) {
      const res = await client.query<TripRow>(
        `UPDATE public.trips
         SET ${setClauses.join(', ')}
         WHERE id = $1 AND user_id = $2
         RETURNING *`,
        params
      );
      if (!res.rows[0]) {
        throw new AppError('Failed to update trip', 500, 'UPDATE_FAILED');
      }
      tripRow = res.rows[0];
    } else {
      const res = await client.query<TripRow>(
        `SELECT * FROM public.trips WHERE id = $1 AND user_id = $2`,
        [tripId, userId]
      );
      if (!res.rows[0]) {
        throw new AppError('Trip not found', 404, 'TRIP_NOT_FOUND');
      }
      tripRow = res.rows[0];
    }

    // Sync participants if provided
    if (input.participants !== undefined && input.participants.length > 0) {
      const existingPartsRes = await client.query<ParticipantRow>(
        `SELECT * FROM public.trip_participants WHERE trip_id = $1 ORDER BY created_at ASC`,
        [tripId]
      );
      const existingParts = existingPartsRes.rows;
      const keepIds = new Set<string>();

      for (const p of input.participants) {
        if (p.id) {
          const match = existingParts.find((ep) => ep.id === p.id);
          if (match) {
            keepIds.add(p.id);
            await client.query(
              `UPDATE public.trip_participants
               SET name = $1, email = $2, phone = $3, is_included_in_split = $4
               WHERE id = $5 AND trip_id = $6`,
              [p.name, p.email || null, p.phone || null, p.isIncludedInSplit !== false, p.id, tripId]
            );
            continue;
          }
        }
        const insertRes = await client.query<{ id: string }>(
          `INSERT INTO public.trip_participants (trip_id, name, email, phone, is_included_in_split)
           VALUES ($1, $2, $3, $4, $5) RETURNING id`,
          [tripId, p.name, p.email || null, p.phone || null, p.isIncludedInSplit !== false]
        );
        if (insertRes.rows[0]) {
          keepIds.add(insertRes.rows[0].id);
        }
      }

      // Reassign expenses of removed participants before deleting them
      const toDelete = existingParts.filter((ep) => !keepIds.has(ep.id));
      if (toDelete.length > 0 && keepIds.size > 0) {
        const fallbackId = Array.from(keepIds)[0];
        for (const dp of toDelete) {
          await client.query(
            `UPDATE public.trip_expenses SET payer_participant_id = $1 WHERE trip_id = $2 AND payer_participant_id = $3`,
            [fallbackId, tripId, dp.id]
          );
          await client.query(
            `DELETE FROM public.trip_participants WHERE id = $1 AND trip_id = $2`,
            [dp.id, tripId]
          );
        }
      }
    }

    if (input.expenses !== undefined) {
      const partRes = await client.query<{ id: string }>(
        `SELECT id FROM public.trip_participants WHERE trip_id = $1 ORDER BY created_at ASC LIMIT 1`,
        [tripId]
      );
      let participantId: string;
      if (partRes.rows.length > 0 && partRes.rows[0]) {
        participantId = partRes.rows[0].id;
      } else {
        const ownerPart = await client.query<{ id: string }>(
          `INSERT INTO public.trip_participants (trip_id, user_id, name)
           VALUES ($1, $2, 'Trip Owner') RETURNING id`,
          [tripId, userId]
        );
        participantId = ownerPart.rows[0]!.id;
      }

      await client.query(`DELETE FROM public.trip_expenses WHERE trip_id = $1`, [tripId]);
      for (const exp of input.expenses) {
        await client.query(
          `INSERT INTO public.trip_expenses (trip_id, payer_participant_id, category, amount, expense_date, notes)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            tripId,
            participantId,
            exp.category,
            exp.amount,
            exp.expenseDate || new Date().toISOString().split('T')[0],
            exp.notes || null,
          ]
        );
      }
    }

    await client.query('COMMIT');

    const mapped = mapRowToTrip(tripRow);
    const expRes = await query<ExpenseRow>(
      `SELECT te.*, tp.name as payer_name
       FROM public.trip_expenses te
       JOIN public.trip_participants tp ON tp.id = te.payer_participant_id
       WHERE te.trip_id = $1
       ORDER BY te.expense_date DESC`,
      [tripId]
    );
    let totalExpensesPaise = 0;
    for (const exp of expRes.rows) {
      totalExpensesPaise += Math.round(parseFloat(String(exp.amount)) * 100);
    }
    mapped.expenses = expRes.rows.map(mapRowToExpense);
    mapped.totalExpenses = totalExpensesPaise / 100;

    const partRes = await query<ParticipantRow>(
      `SELECT * FROM public.trip_participants WHERE trip_id = $1 ORDER BY created_at ASC`,
      [tripId]
    );
    mapped.participants = partRes.rows.map(mapRowToParticipant);

    return mapped;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function deleteTrip(userId: string, tripId: string): Promise<void> {
  // Ensure ownership
  await getTripById(userId, tripId);

  // Rule: "All trip statuses may be deleted."
  await query(`DELETE FROM public.trips WHERE id = $1 AND user_id = $2`, [tripId, userId]);
}

// ---------------- PARTICIPANTS ----------------

export async function addParticipant(
  userId: string,
  tripId: string,
  input: AddParticipantInput
): Promise<ParticipantResponse> {
  const trip = await getTripById(userId, tripId);
  if (trip.status === 'COMPLETED') {
    throw new AppError('Cannot add participant to completed trip', 400, 'COMPLETED_TRIP_READONLY');
  }

  const res = await query<ParticipantRow>(
    `INSERT INTO public.trip_participants (trip_id, name, email, phone, is_included_in_split)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [tripId, input.name, input.email || null, input.phone || null, input.isIncludedInSplit]
  );

  const row = res.rows[0];
  if (!row) throw new AppError('Failed to add participant', 500, 'CREATE_FAILED');
  return mapRowToParticipant(row);
}

export async function deleteParticipant(userId: string, tripId: string, participantId: string): Promise<void> {
  const trip = await getTripById(userId, tripId);
  if (trip.status === 'COMPLETED') {
    throw new AppError('Cannot modify completed trip', 400, 'COMPLETED_TRIP_READONLY');
  }

  // Check if participant is a payer on any existing expense
  const expCheck = await query(
    `SELECT 1 FROM public.trip_expenses WHERE payer_participant_id = $1 LIMIT 1`,
    [participantId]
  );
  if (expCheck.rowCount && expCheck.rowCount > 0) {
    throw new AppError(
      'Cannot remove participant who is recorded as the payer for trip expenses. Reassign or delete expenses first.',
      400,
      'PARTICIPANT_HAS_EXPENSES'
    );
  }

  await query(`DELETE FROM public.trip_participants WHERE id = $1 AND trip_id = $2`, [participantId, tripId]);
}

// ---------------- EXPENSES ----------------

export async function createTripExpense(
  userId: string,
  tripId: string,
  input: CreateTripExpenseInput
): Promise<TripExpenseResponse> {
  const trip = await getTripById(userId, tripId);
  if (trip.status === 'COMPLETED') {
    throw new AppError('Cannot add expense to completed trip', 400, 'COMPLETED_TRIP_READONLY');
  }

  // Verify payer belongs to this trip
  const partCheck = await query<ParticipantRow>(
    `SELECT * FROM public.trip_participants WHERE id = $1 AND trip_id = $2`,
    [input.payerParticipantId, tripId]
  );
  const payerRow = partCheck.rows[0];
  if (!payerRow) {
    throw new AppError('Payer must be a participant of this trip', 400, 'INVALID_PAYER_PARTICIPANT');
  }

  const amountInPaise = Math.round(input.amount * 100);
  const amountExact = amountInPaise / 100;

  const res = await query<ExpenseRow>(
    `INSERT INTO public.trip_expenses (trip_id, payer_participant_id, category, amount, expense_date, notes)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [tripId, input.payerParticipantId, input.category, amountExact, input.expenseDate || new Date().toISOString(), input.notes || null]
  );

  const row = res.rows[0];
  if (!row) throw new AppError('Failed to create expense', 500, 'CREATE_EXPENSE_FAILED');
  row.payer_name = payerRow.name;
  return mapRowToExpense(row);
}

export async function updateTripExpense(
  userId: string,
  tripId: string,
  expenseId: string,
  input: UpdateTripExpenseInput
): Promise<TripExpenseResponse> {
  const trip = await getTripById(userId, tripId);
  if (trip.status === 'COMPLETED') {
    throw new AppError('Cannot modify expenses on a completed trip', 400, 'COMPLETED_TRIP_READONLY');
  }

  if (input.payerParticipantId) {
    const partCheck = await query(
      `SELECT 1 FROM public.trip_participants WHERE id = $1 AND trip_id = $2`,
      [input.payerParticipantId, tripId]
    );
    if (!partCheck.rowCount || partCheck.rowCount === 0) {
      throw new AppError('Payer must be a participant of this trip', 400, 'INVALID_PAYER_PARTICIPANT');
    }
  }


  const setClauses: string[] = [];
  const params: any[] = [expenseId, tripId];
  let idx = 3;

  if (input.payerParticipantId !== undefined) {
    setClauses.push(`payer_participant_id = $${idx++}`);
    params.push(input.payerParticipantId);
  }
  if (input.category !== undefined) {
    setClauses.push(`category = $${idx++}`);
    params.push(input.category);
  }
  if (input.amount !== undefined) {
    const amountExact = Math.round(input.amount * 100) / 100;
    setClauses.push(`amount = $${idx++}`);
    params.push(amountExact);
  }
  if (input.expenseDate !== undefined) {
    setClauses.push(`expense_date = $${idx++}`);
    params.push(input.expenseDate);
  }
  if (input.notes !== undefined) {
    setClauses.push(`notes = $${idx++}`);
    params.push(input.notes);
  }

  if (setClauses.length === 0) {
    const existing = await query<ExpenseRow>(
      `SELECT * FROM public.trip_expenses WHERE id = $1 AND trip_id = $2`,
      [expenseId, tripId]
    );
    if (!existing.rows[0]) throw new AppError('Expense not found', 404, 'EXPENSE_NOT_FOUND');
    return mapRowToExpense(existing.rows[0]);
  }

  const res = await query<ExpenseRow>(
    `UPDATE public.trip_expenses
     SET ${setClauses.join(', ')}
     WHERE id = $1 AND trip_id = $2
     RETURNING *`,
    params
  );

  const row = res.rows[0];
  if (!row) throw new AppError('Failed to update expense', 500, 'UPDATE_FAILED');
  return mapRowToExpense(row);
}

export async function deleteTripExpense(userId: string, tripId: string, expenseId: string): Promise<void> {
  const trip = await getTripById(userId, tripId);
  if (trip.status === 'COMPLETED') {
    throw new AppError('Cannot delete expense on completed trip', 400, 'COMPLETED_TRIP_READONLY');
  }

  await query(`DELETE FROM public.trip_expenses WHERE id = $1 AND trip_id = $2`, [expenseId, tripId]);
}

// ---------------- EQUAL SPLIT CALCULATION ----------------

export async function calculateTripSplit(userId: string, tripId: string): Promise<TripSplitCalculationResponse> {
  const trip = await getTripById(userId, tripId);
  const participants = trip.participants || [];
  const expenses = trip.expenses || [];

  // Filter participants included in split
  const includedParticipants = participants.filter((p) => p.isIncludedInSplit);
  const includedCount = includedParticipants.length;

  // 1. Calculate total expenses in integer paise
  let totalExpensesPaise = 0;
  const paidMapPaise = new Map<string, number>();

  for (const p of participants) {
    paidMapPaise.set(p.id, 0);
  }

  for (const exp of expenses) {
    const expPaise = Math.round(exp.amount * 100);
    totalExpensesPaise += expPaise;
    const currentPaid = paidMapPaise.get(exp.payerParticipantId) || 0;
    paidMapPaise.set(exp.payerParticipantId, currentPaid + expPaise);
  }

  // 2. Deterministic equal split in paise
  const shareMapPaise = new Map<string, number>();
  for (const p of participants) {
    shareMapPaise.set(p.id, 0);
  }

  if (includedCount > 0) {
    const baseSharePaise = Math.floor(totalExpensesPaise / includedCount);
    let remainderPaise = totalExpensesPaise % includedCount;

    // Distribute base share
    for (const p of includedParticipants) {
      shareMapPaise.set(p.id, baseSharePaise);
    }

    // Deterministic distribution of remainder paise (ordered by participant ID)
    const sortedIncluded = [...includedParticipants].sort((a, b) => a.id.localeCompare(b.id));
    for (let i = 0; i < remainderPaise; i++) {
      const p = sortedIncluded[i];
      if (p) {
        shareMapPaise.set(p.id, (shareMapPaise.get(p.id) || 0) + 1);
      }
    }
  }

  // 3. Build summary
  const summary: ParticipantSplitSummary[] = participants.map((p) => {
    const paidPaise = paidMapPaise.get(p.id) || 0;
    const sharePaise = shareMapPaise.get(p.id) || 0;
    const balancePaise = paidPaise - sharePaise;

    return {
      participantId: p.id,
      name: p.name,
      paid: paidPaise / 100,
      share: sharePaise / 100,
      balance: balancePaise / 100,
    };
  });

  return {
    tripId: trip.id,
    tripTitle: trip.title,
    splitExpenses: trip.splitExpenses,
    splitMethod: 'EQUAL',
    totalTripExpenses: totalExpensesPaise / 100,
    includedParticipantCount: includedCount,
    baseSharePerPerson: includedCount > 0 ? Math.floor(totalExpensesPaise / includedCount) / 100 : 0,
    participants: summary,
  };
}
