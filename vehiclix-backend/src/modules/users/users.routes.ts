import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import { validateBody } from '../../middleware/validate';
import { updateProfileSchema } from './users.schema';
import { getProfile, updateProfile, deleteAccount } from './users.controller';

const router = Router();

router.use(requireAuth);

router.get('/profile', getProfile);
router.patch('/profile', validateBody(updateProfileSchema), updateProfile);
router.delete('/account', deleteAccount);

export default router;
