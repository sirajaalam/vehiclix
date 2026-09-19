import { Request, Response, NextFunction } from 'express';
import { getAdminOverview, listAdminUsers } from './admin.service';

export async function getOverview(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const overview = await getAdminOverview();
    res.status(200).json({
      success: true,
      data: overview,
    });
  } catch (err) {
    next(err);
  }
}

export async function getUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const search = req.query['search'] as string | undefined;
    const users = await listAdminUsers(search);
    res.status(200).json({
      success: true,
      data: users,
    });
  } catch (err) {
    next(err);
  }
}
