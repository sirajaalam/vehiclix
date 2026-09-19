import { CalculateTripCostInput, TripCalculationResult } from './calculator.schema';

export function calculateTripFuelCost(input: CalculateTripCostInput): TripCalculationResult {
  const fuelRequired = input.distance / input.mileage;
  const estimatedCostPaise = Math.round(fuelRequired * input.fuelPrice * 100);

  return {
    distance: input.distance,
    mileage: input.mileage,
    fuelPrice: input.fuelPrice,
    fuelType: input.fuelType,
    fuelRequired: Math.round(fuelRequired * 1000) / 1000,
    estimatedCost: estimatedCostPaise / 100,
  };
}
