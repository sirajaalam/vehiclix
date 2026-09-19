import { Request, Response, NextFunction } from 'express';
import * as servicesService from './services.service';
import { CreateServiceRecordInput, UpdateServiceRecordInput } from './services.schema';
import { AppError } from '../../middleware/error-handler';

export async function createService(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
    const input = req.body as CreateServiceRecordInput;
    const record = await servicesService.createServiceRecord(req.user.id, input);
    res.status(201).json({
      success: true,
      data: record,
    });
  } catch (err) {
    next(err);
  }
}

export async function listServices(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
    const vehicleId = req.query['vehicleId'] as string | undefined;
    const records = await servicesService.listServiceRecords(req.user.id, vehicleId);
    res.status(200).json({
      success: true,
      data: records,
    });
  } catch (err) {
    next(err);
  }
}

export async function getService(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
    const record = await servicesService.getServiceRecordById(req.user.id, req.params.id as string);
    res.status(200).json({
      success: true,
      data: record,
    });
  } catch (err) {
    next(err);
  }
}

export async function updateService(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
    const input = req.body as UpdateServiceRecordInput;
    const record = await servicesService.updateServiceRecord(req.user.id, req.params.id as string, input);
    res.status(200).json({
      success: true,
      data: record,
    });
  } catch (err) {
    next(err);
  }
}

export async function deleteService(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
    await servicesService.deleteServiceRecord(req.user.id, req.params.id as string);
    res.status(200).json({
      success: true,
      data: {
        message: 'Service record deleted successfully.',
      },
    });
  } catch (err) {
    next(err);
  }
}
