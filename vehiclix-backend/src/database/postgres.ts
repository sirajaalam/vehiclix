import { Pool, QueryResult, QueryResultRow } from 'pg';
import { env } from '../config/env';

export const pgPool = new Pool({
  connectionString: env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pgPool.on('error', (err) => {
  console.error('[PostgreSQL] Unexpected error on idle client:', err.message);
});

export async function query<R extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[]
): Promise<QueryResult<R>> {
  const start = Date.now();
  const res = await pgPool.query<R>(text, params);
  const duration = Date.now() - start;
  if (env.NODE_ENV === 'development') {
    console.debug(`[PostgreSQL] Executed query in ${duration}ms:`, { text, duration });
  }
  return res;
}

export async function checkPostgresHealth(): Promise<{
  status: 'connected' | 'disconnected';
  latencyMs?: number;
  error?: string;
}> {
  const start = Date.now();
  try {
    const client = await pgPool.connect();
    try {
      await client.query('SELECT 1');
      return {
        status: 'connected',
        latencyMs: Date.now() - start,
      };
    } finally {
      client.release();
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown connection failure';
    return {
      status: 'disconnected',
      error: message,
    };
  }
}

export async function closePostgres(): Promise<void> {
  try {
    await pgPool.end();
    console.log('[PostgreSQL] Connection pool closed.');
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[PostgreSQL] Error closing pool:', message);
  }
}
