import { Router } from 'express';
import { validateBody } from '../../middleware/validate';
import { calculateTripCostSchema } from './calculator.schema';
import { estimateTripCost } from './calculator.controller';

const router = Router();

// Public endpoint — no authentication required
router.post('/estimate', validateBody(calculateTripCostSchema), estimateTripCost);

export default router;
