import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { env } from '../config/env';

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: unknown;

  constructor(message: string, statusCode = 500, code = 'INTERNAL_ERROR', details?: unknown) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void {
  // 1. AppError (Operational known errors)
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        ...(err.details ? { details: err.details } : {}),
      },
    });
    return;
  }

  // 2. Zod validation errors
  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request payload',
        details: err.format(),
      },
    });
    return;
  }

  // 3. Body parser syntax error or payload too large
  if (err && typeof err === 'object') {
    const errorObj = err as { type?: string; status?: number; message?: string };
    if (errorObj.type === 'entity.too.large') {
      res.status(413).json({
        success: false,
        error: {
          code: 'PAYLOAD_TOO_LARGE',
          message: 'Request payload exceeds maximum allowed size (100kb)',
        },
      });
      return;
    }
    if (errorObj.status === 400 && 'body' in errorObj) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_JSON',
          message: 'Malformed JSON payload in request body',
        },
      });
      return;
    }
  }

  // 4. Unexpected server error
  console.error('[Unhandled Error]', err);
  const isProduction = env.NODE_ENV === 'production';
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: isProduction ? 'An unexpected error occurred' : (err instanceof Error ? err.message : 'Unknown error'),
    },
  });
}
