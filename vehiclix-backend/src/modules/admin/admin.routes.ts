import { Router } from 'express';
import { requireAuth, requireAdmin } from '../../middleware/auth';
import { getOverview, getUsers } from './admin.controller';

const router = Router();

// Strictly enforce both authentication and admin role authorization
router.use(requireAuth, requireAdmin);

router.get('/overview', getOverview);
router.get('/users', getUsers);

export default router;
