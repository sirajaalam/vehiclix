import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import { validateParams } from '../../middleware/validate';
import { vehicleReportParamSchema, tripReportParamSchema } from './reports.schema';
import { downloadVehicleReport, downloadTripReport } from './reports.controller';

const router = Router();

router.use(requireAuth);

router.get('/vehicle/:vehicleId', validateParams(vehicleReportParamSchema), downloadVehicleReport);
router.get('/trip/:tripId', validateParams(tripReportParamSchema), downloadTripReport);

export default router;
