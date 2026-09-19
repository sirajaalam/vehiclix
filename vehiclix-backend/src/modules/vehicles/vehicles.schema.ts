import { z } from 'zod';

export const vehicleTypeEnum = z.enum(['CAR', 'BIKE', 'TRUCK', 'OTHER']);
export type VehicleType = z.infer<typeof vehicleTypeEnum>;

export const fuelTypeEnum = z.enum(['PETROL', 'DIESEL', 'CNG', 'ELECTRIC', 'OTHER']);
export type FuelType = z.infer<typeof fuelTypeEnum>;

export const vehicleIdParamSchema = z.object({
  id: z.string().uuid('Invalid vehicle ID format. Must be a valid UUID.'),
});

export const createVehicleSchema = z.object({
  name: z.string().trim().min(1, 'Vehicle name is required').max(100),
  make: z.string().trim().max(50).optional().nullable(),
  model: z.string().trim().max(50).optional().nullable(),
  year: z.number().int().min(1900).max(2100).optional().nullable(),
  licensePlate: z.string().trim().max(30).optional().nullable(),
  vehicleType: vehicleTypeEnum,
  fuelType: fuelTypeEnum,
  initialOdometer: z.number().nonnegative('Initial odometer cannot be negative').default(0),
  rcDocumentPath: z.string().trim().max(255).optional().nullable(),
  isPrimary: z.boolean().optional().default(false),
  tankCapacity: z.number().positive('Tank capacity must be positive').max(9999.99, 'Tank capacity exceeds limit').optional().nullable(),
});

export type CreateVehicleInput = z.infer<typeof createVehicleSchema>;

export const updateVehicleSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  make: z.string().trim().max(50).optional().nullable(),
  model: z.string().trim().max(50).optional().nullable(),
  year: z.number().int().min(1900).max(2100).optional().nullable(),
  licensePlate: z.string().trim().max(30).optional().nullable(),
  vehicleType: vehicleTypeEnum.optional(),
  fuelType: fuelTypeEnum.optional(),
  initialOdometer: z.number().nonnegative().optional(),
  currentOdometer: z.number().nonnegative().optional(),
  rcDocumentPath: z.string().trim().max(255).optional().nullable(),
  isPrimary: z.boolean().optional(),
  tankCapacity: z.number().positive('Tank capacity must be positive').max(9999.99, 'Tank capacity exceeds limit').optional().nullable(),
}).refine(
  (data) => {
    if (data.initialOdometer !== undefined && data.currentOdometer !== undefined) {
      return data.currentOdometer >= data.initialOdometer;
    }
    return true;
  },
  {
    message: 'Current odometer reading must be greater than or equal to initial odometer reading',
    path: ['currentOdometer'],
  }
);

export type UpdateVehicleInput = z.infer<typeof updateVehicleSchema>;

export interface VehicleResponse {
  id: string;
  userId: string;
  name: string;
  make: string | null;
  model: string | null;
  year: number | null;
  licensePlate: string | null;
  vehicleType: VehicleType;
  fuelType: FuelType;
  initialOdometer: number;
  currentOdometer: number;
  rcDocumentPath: string | null;
  isPrimary: boolean;
  tankCapacity: number | null;
  createdAt: string;
  updatedAt: string;
}
