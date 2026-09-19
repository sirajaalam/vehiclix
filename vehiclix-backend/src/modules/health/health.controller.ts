import { Request, Response, NextFunction } from 'express';
import { getHealthStatus } from './health.service';

export async function getHealth(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const health = await getHealthStatus();
    // HTTP 200 even if degraded so monitors/balancers receive diagnostic payload
    res.status(200).json({
      success: true,
      data: health,
    });
  } catch (err) {
    next(err);
  }
}
