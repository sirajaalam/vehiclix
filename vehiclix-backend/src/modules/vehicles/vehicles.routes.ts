import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import { validateBody, validateParams } from '../../middleware/validate';
import {
  createVehicleSchema,
  updateVehicleSchema,
  vehicleIdParamSchema,
} from './vehicles.schema';
import {
  createVehicle,
  listVehicles,
  getVehicle,
  updateVehicle,
  deleteVehicle,
} from './vehicles.controller';

const router = Router();

router.use(requireAuth);

router.post('/', validateBody(createVehicleSchema), createVehicle);
router.get('/', listVehicles);
router.get('/:id', validateParams(vehicleIdParamSchema), getVehicle);
router.patch(
  '/:id',
  validateParams(vehicleIdParamSchema),
  validateBody(updateVehicleSchema),
  updateVehicle
);
router.delete('/:id', validateParams(vehicleIdParamSchema), deleteVehicle);

export default router;
