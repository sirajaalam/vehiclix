import { checkPostgresHealth } from '../../database/postgres';
import { checkRedisHealth } from '../../database/redis';
import { env } from '../../config/env';

export interface HealthCheckResult {
  status: 'ok' | 'degraded';
  timestamp: string;
  uptimeSeconds: number;
  environment: string;
  version: string;
  services: {
    postgres: {
      status: 'connected' | 'disconnected';
      latencyMs?: number;
      error?: string;
    };
    redis: {
      status: 'connected' | 'disconnected';
      latencyMs?: number;
      error?: string;
    };
  };
}

export async function getHealthStatus(): Promise<HealthCheckResult> {
  const [postgres, redis] = await Promise.all([
    checkPostgresHealth(),
    checkRedisHealth(),
  ]);

  const isDegraded = postgres.status !== 'connected' || redis.status !== 'connected';

  return {
    status: isDegraded ? 'degraded' : 'ok',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    environment: env.NODE_ENV,
    version: '0.1.0',
    services: {
      postgres,
      redis,
    },
  };
}
