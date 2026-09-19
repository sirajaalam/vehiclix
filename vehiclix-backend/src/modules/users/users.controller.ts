import { Request, Response, NextFunction } from 'express';
import { getUserProfile, updateUserProfile, deleteUserAccount } from './users.service';
import { UpdateProfileInput } from './users.schema';
import { AppError } from '../../middleware/error-handler';

export async function getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
    }

    const profile = await getUserProfile(req.user.id, req.user.email);

    res.status(200).json({
      success: true,
      data: profile,
    });
  } catch (err) {
    next(err);
  }
}

export async function updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
    }

    const input = req.body as UpdateProfileInput;
    const updated = await updateUserProfile(req.user.id, input, req.user.email);

    res.status(200).json({
      success: true,
      data: updated,
    });
  } catch (err) {
    next(err);
  }
}

export async function deleteAccount(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
    }

    await deleteUserAccount(req.user.id);

    res.status(200).json({
      success: true,
      data: {
        message: 'Account data and associated vehicles successfully removed.',
      },
    });
  } catch (err) {
    next(err);
  }
}
