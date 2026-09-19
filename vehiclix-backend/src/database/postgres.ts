import { Pool, QueryResult, QueryResultRow } from 'pg';
import { env } from '../config/env';

function sanitizeDatabaseUrl(raw: string): string {
  if (!raw) return 'postgresql://postgres:postgres@127.0.0.1:54322/postgres';
  try {
    const trimmed = raw.trim();
    // Check if password has unencoded '@' symbol (e.g. postgresql://user:pass@word@host:5432/db)
    const match = trimmed.match(/^(postgres(?:ql)?:\/\/)([^:]+):([^@]+@[^@]+)@(.+)$/);
    if (match && match[1] && match[2] && match[3] && match[4]) {
      return `${match[1]}${match[2]}:${encodeURIComponent(match[3])}@${match[4]}`;
    }
    return trimmed;
  } catch {
    return raw;
  }
}

export const pgPool = new Pool({
  connectionString: sanitizeDatabaseUrl(env.DATABASE_URL),
  max: 10,
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
