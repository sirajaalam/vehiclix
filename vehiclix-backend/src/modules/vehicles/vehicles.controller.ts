import { Request, Response, NextFunction } from 'express';
import * as vehiclesService from './vehicles.service';
import { CreateVehicleInput, UpdateVehicleInput } from './vehicles.schema';
import { AppError } from '../../middleware/error-handler';

export async function createVehicle(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
    const input = req.body as CreateVehicleInput;
    const vehicle = await vehiclesService.createVehicle(req.user.id, input);
    res.status(201).json({
      success: true,
      data: vehicle,
    });
  } catch (err) {
    next(err);
  }
}

export async function listVehicles(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
    const vehicles = await vehiclesService.listVehicles(req.user.id);
    res.status(200).json({
      success: true,
      data: vehicles,
    });
  } catch (err) {
    next(err);
  }
}

export async function getVehicle(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
    const vehicle = await vehiclesService.getVehicleById(req.user.id, req.params.id as string);
    res.status(200).json({
      success: true,
      data: vehicle,
    });
  } catch (err) {
    next(err);
  }
}

export async function updateVehicle(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
    const input = req.body as UpdateVehicleInput;
    const vehicle = await vehiclesService.updateVehicle(req.user.id, req.params.id as string, input);
    res.status(200).json({
      success: true,
      data: vehicle,
    });
  } catch (err) {
    next(err);
  }
}

export async function deleteVehicle(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
    await vehiclesService.deleteVehicle(req.user.id, req.params.id as string);
    res.status(200).json({
      success: true,
      data: {
        message: 'Vehicle and associated data successfully deleted.',
      },
    });
  } catch (err) {
    next(err);
  }
}
