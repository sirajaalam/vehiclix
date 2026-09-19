import { Request, Response, NextFunction } from 'express';

export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const { method, originalUrl } = req;
    const { statusCode } = res;

    // Zero secret leakage: only method, path, status, and duration are logged
    console.log(`[HTTP] ${method} ${originalUrl} ${statusCode} - ${duration}ms`);
  });

  next();
}
