import { z } from 'zod';

export const vehicleReportParamSchema = z.object({
  vehicleId: z.string().uuid('Invalid vehicle ID format. Must be a valid UUID.'),
});

export const tripReportParamSchema = z.object({
  tripId: z.string().uuid('Invalid trip ID format. Must be a valid UUID.'),
});
