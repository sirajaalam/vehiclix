import { z } from 'zod';
import { fuelTypeEnum, FuelType } from '../vehicles/vehicles.schema';

export const fuelUnitEnum = z.enum(['LITRE', 'GALLON', 'KG', 'KWH']);
export type FuelUnit = z.infer<typeof fuelUnitEnum>;

export const fuelIdParamSchema = z.object({
  id: z.string().uuid('Invalid fuel entry ID format. Must be a valid UUID.'),
});

export const fuelQuerySchema = z.object({
  vehicleId: z.string().uuid('Invalid vehicle ID format').optional(),
});

export const createFuelEntrySchema = z.object({
  vehicleId: z.string().uuid('Valid vehicle ID is required'),
  entryDate: z.string().datetime({ offset: true }).optional().default(() => new Date().toISOString()),
  odometer: z.number().nonnegative('Odometer reading cannot be negative').optional().nullable(),
  quantity: z.number().positive('Quantity must be greater than 0'),
  unit: fuelUnitEnum,
  pricePerUnit: z.number().nonnegative('Price per unit cannot be negative'),
  totalAmount: z.number().nonnegative('Total amount cannot be negative').optional(),
  fuelType: fuelTypeEnum,
  stationName: z.string().trim().max(100).optional().nullable(),
  notes: z.string().trim().max(500).optional().nullable(),
});

export type CreateFuelEntryInput = z.infer<typeof createFuelEntrySchema>;

export const updateFuelEntrySchema = z.object({
  vehicleId: z.string().uuid('Invalid vehicle ID format').optional(),
  entryDate: z.string().datetime({ offset: true }).optional(),
  odometer: z.number().nonnegative().optional().nullable(),
  quantity: z.number().positive().optional(),
  unit: fuelUnitEnum.optional(),
  pricePerUnit: z.number().nonnegative().optional(),
  totalAmount: z.number().nonnegative().optional(),
  fuelType: fuelTypeEnum.optional(),
  stationName: z.string().trim().max(100).optional().nullable(),
  notes: z.string().trim().max(500).optional().nullable(),
});

export type UpdateFuelEntryInput = z.infer<typeof updateFuelEntrySchema>;

export interface FuelEntryResponse {
  id: string;
  vehicleId: string;
  userId: string;
  entryDate: string;
  odometer: number | null;
  quantity: number;
  unit: FuelUnit;
  pricePerUnit: number;
  totalAmount: number;
  fuelType: FuelType;
  stationName: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface FuelStatisticsResponse {
  totalSpend: number;
  entryCount: number;
  quantityByUnit: Record<string, number>;
  averagePricePerUnit: number;
}
