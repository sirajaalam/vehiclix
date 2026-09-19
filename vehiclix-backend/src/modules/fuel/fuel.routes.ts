import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import { validateBody, validateParams, validateQuery } from '../../middleware/validate';
import {
  createFuelEntrySchema,
  updateFuelEntrySchema,
  fuelIdParamSchema,
  fuelQuerySchema,
} from './fuel.schema';
import {
  createFuelEntry,
  listFuelEntries,
  getFuelEntry,
  updateFuelEntry,
  deleteFuelEntry,
  getFuelStats,
} from './fuel.controller';

const router = Router();

router.use(requireAuth);

router.post('/', validateBody(createFuelEntrySchema), createFuelEntry);
router.get('/', validateQuery(fuelQuerySchema), listFuelEntries);
router.get('/stats', validateQuery(fuelQuerySchema), getFuelStats);
router.get('/:id', validateParams(fuelIdParamSchema), getFuelEntry);
router.patch(
  '/:id',
  validateParams(fuelIdParamSchema),
  validateBody(updateFuelEntrySchema),
  updateFuelEntry
);
router.delete('/:id', validateParams(fuelIdParamSchema), deleteFuelEntry);

export default router;
