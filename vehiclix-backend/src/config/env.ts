import dotenv from 'dotenv';
import { z } from 'zod';

// Load .env file
dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.string().default('production'),
  PORT: z.coerce.number().default(9090),
  CORS_ORIGIN: z.string().default('*'),
  DATABASE_URL: z.string().default('postgresql://postgres:postgres@127.0.0.1:54322/postgres'),
  REDIS_URL: z.string().default('redis://127.0.0.1:6379'),
  SUPABASE_URL: z.string().default(''),
  SUPABASE_ANON_KEY: z.string().default(''),
  SUPABASE_SERVICE_ROLE_KEY: z.string().default(''),
  SUPABASE_JWT_SECRET: z.string().default(''),
});

export type Env = z.infer<typeof envSchema>;

function parseEnv(): Env {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error('❌ Warning: Environment parsing had issues:', result.error.format());
    return {
      NODE_ENV: process.env.NODE_ENV || 'production',
      PORT: Number(process.env.PORT) || 9090,
      CORS_ORIGIN: process.env.CORS_ORIGIN || '*',
      DATABASE_URL: process.env.DATABASE_URL || '',
      REDIS_URL: process.env.REDIS_URL || 'redis://127.0.0.1:6379',
      SUPABASE_URL: process.env.SUPABASE_URL || '',
      SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || '',
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
      SUPABASE_JWT_SECRET: process.env.SUPABASE_JWT_SECRET || '',
    };
  }

  return result.data;
}

export const env = parseEnv();
