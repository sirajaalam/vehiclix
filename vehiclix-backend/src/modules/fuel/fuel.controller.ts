import { Request, Response, NextFunction } from 'express';
import * as fuelService from './fuel.service';
import { CreateFuelEntryInput, UpdateFuelEntryInput } from './fuel.schema';
import { AppError } from '../../middleware/error-handler';

export async function createFuelEntry(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
    const input = req.body as CreateFuelEntryInput;
    const entry = await fuelService.createFuelEntry(req.user.id, input);
    res.status(201).json({
      success: true,
      data: entry,
    });
  } catch (err) {
    next(err);
  }
}

export async function listFuelEntries(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
    const vehicleId = req.query['vehicleId'] as string | undefined;
    const entries = await fuelService.listFuelEntries(req.user.id, vehicleId);
    res.status(200).json({
      success: true,
      data: entries,
    });
  } catch (err) {
    next(err);
  }
}

export async function getFuelEntry(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
    const entry = await fuelService.getFuelEntryById(req.user.id, req.params.id as string);
    res.status(200).json({
      success: true,
      data: entry,
    });
  } catch (err) {
    next(err);
  }
}

export async function updateFuelEntry(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
    const input = req.body as UpdateFuelEntryInput;
    const entry = await fuelService.updateFuelEntry(req.user.id, req.params.id as string, input);
    res.status(200).json({
      success: true,
      data: entry,
    });
  } catch (err) {
    next(err);
  }
}

export async function deleteFuelEntry(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
    await fuelService.deleteFuelEntry(req.user.id, req.params.id as string);
    res.status(200).json({
      success: true,
      data: {
        message: 'Fuel entry deleted successfully.',
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function getFuelStats(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
    const vehicleId = req.query['vehicleId'] as string | undefined;
    const stats = await fuelService.getFuelStatistics(req.user.id, vehicleId);
    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (err) {
    next(err);
  }
}
