import { z } from 'zod';

export const serviceIdParamSchema = z.object({
  id: z.string().uuid('Invalid service record ID format. Must be a valid UUID.'),
});

export const serviceQuerySchema = z.object({
  vehicleId: z.string().uuid('Invalid vehicle ID format').optional(),
});

export const servicePartInputSchema = z.object({
  partName: z.string().trim().min(1, 'Part name is required').max(100),
  partNumber: z.string().trim().max(50).optional().nullable(),
  quantity: z.number().positive('Quantity must be greater than 0').default(1).optional(),
  unitCost: z.number().nonnegative('Unit cost cannot be negative'),
  totalCost: z.number().nonnegative('Total cost cannot be negative').optional(),
  notes: z.string().trim().max(500).optional().nullable(),
});

export type ServicePartInput = z.infer<typeof servicePartInputSchema>;

export const createServiceRecordSchema = z.object({
  vehicleId: z.string().uuid('Valid vehicle ID is required'),
  serviceDate: z.string().datetime({ offset: true }).optional().default(() => new Date().toISOString()),
  odometer: z.number().nonnegative('Odometer cannot be negative').optional().nullable(),
  serviceProvider: z.string().trim().max(100).optional().nullable(),
  notes: z.string().trim().max(1000).optional().nullable(),
  labourCost: z.number().nonnegative().default(0),
  partsCost: z.number().nonnegative().optional(),
  tax: z.number().nonnegative().default(0),
  miscCost: z.number().nonnegative().default(0),
  totalCost: z.number().nonnegative().optional(),
  nextServiceDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Next service date must be in YYYY-MM-DD format').optional().nullable(),
  nextServiceOdometer: z.number().nonnegative().optional().nullable(),
  reminderNotes: z.string().trim().max(500).optional().nullable(),
  documentPaths: z.array(z.string().trim()).default([]),
  parts: z.array(servicePartInputSchema).default([]),
});

export type CreateServiceRecordInput = z.infer<typeof createServiceRecordSchema>;

export const updateServiceRecordSchema = z.object({
  serviceDate: z.string().datetime({ offset: true }).optional(),
  odometer: z.number().nonnegative().optional().nullable(),
  serviceProvider: z.string().trim().max(100).optional().nullable(),
  notes: z.string().trim().max(1000).optional().nullable(),
  labourCost: z.number().nonnegative().optional(),
  partsCost: z.number().nonnegative().optional(),
  tax: z.number().nonnegative().optional(),
  miscCost: z.number().nonnegative().optional(),
  totalCost: z.number().nonnegative().optional(),
  nextServiceDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  nextServiceOdometer: z.number().nonnegative().optional().nullable(),
  reminderNotes: z.string().trim().max(500).optional().nullable(),
  documentPaths: z.array(z.string().trim()).optional(),
  parts: z.array(servicePartInputSchema).optional(),
});

export type UpdateServiceRecordInput = z.infer<typeof updateServiceRecordSchema>;

export interface ServicePartResponse {
  id: string;
  partName: string;
  partNumber: string | null;
  quantity: number;
  unitCost: number;
  totalCost: number;
  notes?: string | null;
  createdAt: string;
}

export interface ServiceRecordResponse {
  id: string;
  vehicleId: string;
  userId: string;
  serviceDate: string;
  odometer: number | null;
  serviceProvider: string | null;
  notes: string | null;
  labourCost: number;
  partsCost: number;
  tax: number;
  miscCost: number;
  totalCost: number;
  nextServiceDate: string | null;
  nextServiceOdometer: number | null;
  reminderNotes: string | null;
  documentPaths: string[];
  parts?: ServicePartResponse[];
  createdAt: string;
  updatedAt: string;
}
