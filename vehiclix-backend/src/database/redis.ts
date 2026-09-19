import Redis from 'ioredis';
import { env } from '../config/env';

function sanitizeRedisUrl(raw: string): string {
  if (!raw) return 'redis://127.0.0.1:6379';
  let url = raw.trim();

  // Strip CLI command syntax if copied from Upstash console (e.g. redis-cli --tls -u redis://...)
  if (url.includes('-u ')) {
    url = url.split('-u ')[1]?.trim() || url;
  }
  if (url.startsWith('redis://redis-cli')) {
    url = url.replace('redis://redis-cli', '').trim();
    if (url.includes('-u ')) {
      url = url.split('-u ')[1]?.trim() || url;
    }
  }
  if (url.startsWith('redis-cli ')) {
    url = url.replace('redis-cli ', '').trim();
  }

  // Upstash requires rediss:// (TLS)
  if (url.includes('upstash.io') && url.startsWith('redis://')) {
    url = url.replace('redis://', 'rediss://');
  }

  // Fallback if malformed
  if (!url.startsWith('redis://') && !url.startsWith('rediss://')) {
    url = 'redis://127.0.0.1:6379';
  }

  return url;
}

function initRedis(): Redis {
  const url = sanitizeRedisUrl(env.REDIS_URL);

  try {
    const client = new Redis(url, {
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

    client.on('connect', () => {
      console.log('[Redis] Successfully connected.');
    });

    client.on('error', (err) => {
      console.warn('[Redis] Connection warning:', err.message);
    });

    return client;
  } catch (err: any) {
    console.warn('[Redis] Initialization error (falling back to offline client):', err?.message);
    return new Redis({ lazyConnect: true, enableOfflineQueue: false });
  }
}

export const redis = initRedis();

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
