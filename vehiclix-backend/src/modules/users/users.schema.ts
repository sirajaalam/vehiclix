import { z } from 'zod';

export const updateProfileSchema = z.object({
  firstName: z.string().trim().max(50).optional(),
  lastName: z.string().trim().max(50).optional(),
  phone: z.string().trim().regex(/^\+?[0-9\s-]{7,20}$/, 'Invalid phone number format').optional().nullable(),
  profileImagePath: z.string().trim().max(255).optional().nullable(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

export interface UserProfileResponse {
  id: string;
  email?: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  profileImagePath: string | null;
  createdAt: string;
  updatedAt: string;
}
