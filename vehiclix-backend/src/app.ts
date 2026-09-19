import express, { Express } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { env } from './config/env';
import { requestLogger } from './middleware/request-logger';
import { errorHandler } from './middleware/error-handler';
import { notFoundHandler } from './middleware/not-found';
import healthRoutes from './modules/health/health.routes';
import usersRoutes from './modules/users/users.routes';
import vehiclesRoutes from './modules/vehicles/vehicles.routes';
import fuelRoutes from './modules/fuel/fuel.routes';
import servicesRoutes from './modules/services/services.routes';
import tripsRoutes from './modules/trips/trips.routes';
import calculatorRoutes from './modules/calculator/calculator.routes';
import dashboardRoutes from './modules/dashboard/dashboard.routes';
import reportsRoutes from './modules/reports/reports.routes';
import adminRoutes from './modules/admin/admin.routes';
import swaggerRoutes from './docs/swagger';

export function createApp(): Express {
  const app = express();

  // 1. Security headers
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'"], // required for Swagger UI
          styleSrc: ["'self'", "'unsafe-inline'"],  // required for Swagger UI
          imgSrc: ["'self'", 'data:'],
        },
      },
      crossOriginEmbedderPolicy: false,
    })
  );

  // 2. Strict CORS
  const allowedOrigins = env.CORS_ORIGIN.split(',').map((o) => o.trim());
  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps, curl, server-to-server) in non-production
        if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
          callback(null, true);
        } else {
          callback(new Error(`CORS blocked for origin: ${origin}`));
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );

  // 3. Request size limits
  app.use(express.json({ limit: '100kb' }));
  app.use(express.urlencoded({ extended: true, limit: '100kb' }));

  // 4. Sanitized request logger
  app.use(requestLogger);

  // 5. API Documentation (Swagger)
  app.use('/api/docs', swaggerRoutes);

  // 6. API v1 Routing
  const v1Router = express.Router();
  v1Router.use(healthRoutes);
  v1Router.use('/calculator', calculatorRoutes);
  v1Router.use('/dashboard', dashboardRoutes);
  v1Router.use('/reports', reportsRoutes);
  v1Router.use('/admin', adminRoutes);
  v1Router.use('/users', usersRoutes);
  v1Router.use('/vehicles', vehiclesRoutes);
  v1Router.use('/fuel', fuelRoutes);
  v1Router.use('/services', servicesRoutes);
  v1Router.use('/trips', tripsRoutes);

  // Root status check
  app.get('/', (_req, res) => {
    res.json({
      status: 'ok',
      name: 'VehiClix API',
      health: '/api/v1/health',
      docs: '/api/docs',
    });
  });

  app.use('/api/v1', v1Router);

  // 7. 404 Handler for unmatched routes
  app.use(notFoundHandler);

  // 8. Global Error Handler
  app.use(errorHandler);

  return app;
}

export const app = createApp();
export default app;

// Ensure CommonJS default export compatibility for Vercel Node runtime
if (typeof module !== 'undefined' && module.exports) {
  module.exports = app;
  module.exports.app = app;
  module.exports.default = app;
}
