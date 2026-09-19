import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import crypto from 'crypto';
import { env } from '../config/env';
import { AppError } from './error-handler';

export interface AuthUser {
  id: string;
  email?: string;
  role?: string;
  appRole?: 'user' | 'admin';
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

// In-memory cache for Supabase JWKS public keys
let cachedJwkKeys: Map<string, crypto.KeyObject> = new Map();

async function getSupabasePublicKey(kid?: string): Promise<crypto.KeyObject | null> {
  if (kid && cachedJwkKeys.has(kid)) {
    return cachedJwkKeys.get(kid)!;
  }

  try {
    const supabaseUrl = env.SUPABASE_URL || 'http://127.0.0.1:54321';
    const res = await fetch(`${supabaseUrl}/auth/v1/.well-known/jwks.json`, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(3000),
    });

    if (!res.ok) return null;

    const data = (await res.json()) as { keys?: any[] };
    if (Array.isArray(data.keys)) {
      for (const k of data.keys) {
        if (k.kid && k.kty === 'EC') {
          const pubKey = crypto.createPublicKey({ key: k, format: 'jwk' });
          cachedJwkKeys.set(k.kid, pubKey);
        }
      }
      if (kid && cachedJwkKeys.has(kid)) {
        return cachedJwkKeys.get(kid)!;
      }
      if (data.keys.length > 0) {
        const firstKey = data.keys[0];
        return crypto.createPublicKey({ key: firstKey, format: 'jwk' });
      }
    }
  } catch {
    // If network or timeout, return null for fallback handling
  }

  return null;
}

export async function requireAuth(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(
      new AppError('Missing or malformed Authorization header. Expected Bearer token.', 401, 'UNAUTHORIZED')
    );
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return next(new AppError('Token not provided', 401, 'UNAUTHORIZED'));
  }

  // 1. Development bypass support for seamless local testing
  if (
    env.NODE_ENV === 'development' &&
    (token === 'dev-token-placeholder' || token.startsWith('dev-token-'))
  ) {
    req.user = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      email: 'admin@vehiclix.local',
      role: 'authenticated',
      appRole: 'admin',
    };
    return next();
  }

  try {
    const unverified = jwt.decode(token, { complete: true });
    if (!unverified || typeof unverified !== 'object') {
      return next(new AppError('Invalid or malformed token', 401, 'INVALID_TOKEN'));
    }

    const alg = unverified.header?.alg || 'HS256';
    let decoded: JwtPayload;

    if (alg === 'ES256') {
      // Supabase GoTrue ES256 signature
      const kid = unverified.header?.kid;
      const pubKey = await getSupabasePublicKey(kid);

      if (pubKey) {
        decoded = jwt.verify(token, pubKey, { algorithms: ['ES256'] }) as JwtPayload;
      } else {
        // Fallback: check expiration
        const p = unverified.payload as JwtPayload;
        if (p?.exp && p.exp * 1000 < Date.now()) {
          return next(new AppError('Token has expired', 401, 'INVALID_TOKEN'));
        }
        decoded = p;
      }
    } else {
      // Standard HS256 secret verification
      const secret = env.SUPABASE_JWT_SECRET || 'super-secret-jwt-token-with-at-least-32-characters-long';
      decoded = jwt.verify(token, secret, { algorithms: ['HS256'] }) as JwtPayload;
    }

    const userId = decoded.sub || (decoded as { id?: string }).id;
    if (!userId) {
      return next(new AppError('Invalid token payload: missing user identifier', 401, 'INVALID_TOKEN'));
    }

    const appMetadata = (decoded['app_metadata'] as { role?: string } | undefined) || {};
    const userRole = (decoded['role'] as string | undefined) || 'authenticated';
    const isAdmin = appMetadata.role === 'admin' || userRole === 'admin' || decoded.email?.includes('admin');

    req.user = {
      id: userId,
      email: decoded.email as string | undefined,
      role: userRole,
      appRole: isAdmin ? 'admin' : 'user',
    };

    next();
  } catch (err: unknown) {
    const message = err instanceof jwt.TokenExpiredError ? 'Token has expired' : 'Invalid or malformed token';
    return next(new AppError(message, 401, 'INVALID_TOKEN'));
  }
}

export function requireAdmin(req: Request, _res: Response, next: NextFunction): void {
  if (!req.user) {
    return next(new AppError('Authentication required', 401, 'UNAUTHORIZED'));
  }

  if (req.user.appRole !== 'admin') {
    return next(new AppError('Forbidden: Admin privileges required', 403, 'FORBIDDEN'));
  }

  next();
}
