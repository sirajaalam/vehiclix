import { Request, Response, NextFunction } from 'express';
import { getDashboardSummary } from './dashboard.service';
import { AppError } from '../../middleware/error-handler';

export async function getDashboard(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
    const summary = await getDashboardSummary(req.user.id);
    res.status(200).json({
      success: true,
      data: summary,
    });
  } catch (err) {
    next(err);
  }
}
