import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import { validateBody, validateParams, validateQuery } from '../../middleware/validate';
import {
  createServiceRecordSchema,
  updateServiceRecordSchema,
  serviceIdParamSchema,
  serviceQuerySchema,
} from './services.schema';
import {
  createService,
  listServices,
  getService,
  updateService,
  deleteService,
} from './services.controller';

const router = Router();

router.use(requireAuth);

router.post('/', validateBody(createServiceRecordSchema), createService);
router.get('/', validateQuery(serviceQuerySchema), listServices);
router.get('/:id', validateParams(serviceIdParamSchema), getService);
router.patch(
  '/:id',
  validateParams(serviceIdParamSchema),
  validateBody(updateServiceRecordSchema),
  updateService
);
router.delete('/:id', validateParams(serviceIdParamSchema), deleteService);

export default router;
