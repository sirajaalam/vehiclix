import { z } from 'zod';
import { fuelTypeEnum, FuelType } from '../vehicles/vehicles.schema';

export const calculateTripCostSchema = z.object({
  distance: z.number().positive('Distance must be greater than 0'),
  mileage: z.number().positive('Mileage / efficiency must be greater than 0'),
  fuelPrice: z.number().nonnegative('Fuel price cannot be negative'),
  fuelType: fuelTypeEnum,
});

export type CalculateTripCostInput = z.infer<typeof calculateTripCostSchema>;

export interface TripCalculationResult {
  distance: number;
  mileage: number;
  fuelPrice: number;
  fuelType: FuelType;
  fuelRequired: number;
  estimatedCost: number;
}
