import Redis from 'ioredis';
import { env } from '../config/env';

export const redis = new Redis(env.REDIS_URL, {
  lazyConnect: true,
  maxRetriesPerRequest: 1,
  enableOfflineQueue: false,
  connectTimeout: 3000,
  retryStrategy(times) {
    if (times > 3) {
      return null; // Stop retrying after 3 attempts
    }
    return Math.min(times * 500, 2000);
  },
});

redis.on('connect', () => {
  console.log('[Redis] Successfully connected.');
});

redis.on('error', (err) => {
  // In dev, Redis may not be immediately running; log cleanly without crashing
  console.warn('[Redis] Connection warning:', err.message);
});

export async function checkRedisHealth(): Promise<{
  status: 'connected' | 'disconnected';
  latencyMs?: number;
  error?: string;
}> {
  const start = Date.now();
  try {
    if (redis.status === 'wait') {
      await redis.connect();
    }
    const pong = await redis.ping();
    if (pong === 'PONG') {
      return {
        status: 'connected',
        latencyMs: Date.now() - start,
      };
    }
    return {
      status: 'disconnected',
      error: `Unexpected ping response: ${pong}`,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Redis unreachable';
    return {
      status: 'disconnected',
      error: message,
    };
  }
}

export async function closeRedis(): Promise<void> {
  try {
    if (redis.status !== 'end') {
      await redis.quit();
      console.log('[Redis] Connection closed.');
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[Redis] Error disconnecting:', message);
  }
}
