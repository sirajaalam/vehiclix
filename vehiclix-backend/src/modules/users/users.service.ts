import { query, pgPool } from '../../database/postgres';
import { UpdateProfileInput, UserProfileResponse } from './users.schema';
import { AppError } from '../../middleware/error-handler';

interface UserDetailsRow {
  id: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  profile_image_path: string | null;
  created_at: Date;
  updated_at: Date;
}

function mapRowToProfile(row: UserDetailsRow, email?: string): UserProfileResponse {
  return {
    id: row.id,
    email,
    firstName: row.first_name,
    lastName: row.last_name,
    phone: row.phone,
    profileImagePath: row.profile_image_path,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

export async function getUserProfile(userId: string, email?: string): Promise<UserProfileResponse> {
  const result = await query<UserDetailsRow>(
    `SELECT id, first_name, last_name, phone, profile_image_path, created_at, updated_at
     FROM public.user_details
     WHERE id = $1`,
    [userId]
  );

  const firstRow = result.rows[0];
  if (!firstRow) {
    // If no row exists yet in user_details, create initial blank row
    const insertResult = await query<UserDetailsRow>(
      `INSERT INTO public.user_details (id)
       VALUES ($1)
       ON CONFLICT (id) DO NOTHING
       RETURNING id, first_name, last_name, phone, profile_image_path, created_at, updated_at`,
      [userId]
    );

    const insertedRow = insertResult.rows[0];
    if (insertedRow) {
      return mapRowToProfile(insertedRow, email);
    }

    // If concurrency conflict occurred, re-query
    const retryResult = await query<UserDetailsRow>(
      `SELECT id, first_name, last_name, phone, profile_image_path, created_at, updated_at
       FROM public.user_details
       WHERE id = $1`,
      [userId]
    );
    const retryRow = retryResult.rows[0];
    if (!retryRow) {
      throw new AppError('Profile not found', 404, 'PROFILE_NOT_FOUND');
    }
    return mapRowToProfile(retryRow, email);
  }

  return mapRowToProfile(firstRow, email);
}

export async function updateUserProfile(
  userId: string,
  input: UpdateProfileInput,
  email?: string
): Promise<UserProfileResponse> {
  const result = await query<UserDetailsRow>(
    `INSERT INTO public.user_details (id, first_name, last_name, phone, profile_image_path)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (id) DO UPDATE SET
       first_name = COALESCE($2::varchar, public.user_details.first_name),
       last_name = COALESCE($3::varchar, public.user_details.last_name),
       phone = CASE WHEN $4::varchar IS NOT NULL THEN $4::varchar ELSE public.user_details.phone END,
       profile_image_path = CASE WHEN $5::text IS NOT NULL THEN $5::text ELSE public.user_details.profile_image_path END
     RETURNING id, first_name, last_name, phone, profile_image_path, created_at, updated_at`,
    [
      userId,
      input.firstName !== undefined ? input.firstName : null,
      input.lastName !== undefined ? input.lastName : null,
      input.phone !== undefined ? input.phone : null,
      input.profileImagePath !== undefined ? input.profileImagePath : null,
    ]
  );

  const updatedRow = result.rows[0];
  if (!updatedRow) {
    throw new AppError('Failed to update profile', 500, 'UPDATE_FAILED');
  }

  return mapRowToProfile(updatedRow, email);
}

export async function deleteUserAccount(userId: string): Promise<void> {
  const client = await pgPool.connect();
  try {
    await client.query('BEGIN');

    // 1. Delete vehicles owned by user (foreign keys cascade fuel/service)
    await client.query('DELETE FROM public.vehicles WHERE user_id = $1', [userId]);

    // 2. Delete user profile details
    await client.query('DELETE FROM public.user_details WHERE id = $1', [userId]);

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
