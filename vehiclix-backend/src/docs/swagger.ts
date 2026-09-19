import { Router } from 'express';
import swaggerUi from 'swagger-ui-express';
import { openApiSpec } from './openapi';

const router = Router();

router.use('/', swaggerUi.serve);
router.get('/', swaggerUi.setup(openApiSpec));

export default router;
