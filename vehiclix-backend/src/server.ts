import { app } from './app';
import { env } from './config/env';
import { closePostgres } from './database/postgres';
import { closeRedis } from './database/redis';

const server = app.listen(env.PORT, () => {
  console.log(`🚀 Vehiclix Backend running on http://localhost:${env.PORT}`);
  console.log(`📖 Swagger API Docs: http://localhost:${env.PORT}/api/docs`);
  console.log(`🩺 Health Check: http://localhost:${env.PORT}/api/v1/health`);
  console.log(`🌱 Environment: ${env.NODE_ENV}`);
});

let isShuttingDown = false;

async function gracefulShutdown(signal: string) {
  if (isShuttingDown) return;
  isShuttingDown = true;

  console.log(`\n[Server] Received ${signal}. Starting graceful shutdown...`);

  server.close(async () => {
    console.log('[Server] HTTP server closed.');

    try {
      await Promise.all([closePostgres(), closeRedis()]);
      console.log('[Server] All database connections closed. Exiting process.');
      process.exit(0);
    } catch (err) {
      console.error('[Server] Error during graceful shutdown:', err);
      process.exit(1);
    }
  });

  // Force shutdown after 10 seconds if lingering
  setTimeout(() => {
    console.error('[Server] Graceful shutdown timed out. Forcing exit.');
    process.exit(1);
  }, 10000).unref();
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
