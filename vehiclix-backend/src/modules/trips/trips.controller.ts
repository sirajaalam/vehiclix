import { Request, Response, NextFunction } from 'express';
import * as tripsService from './trips.service';
import {
  CreateTripInput,
  UpdateTripInput,
  AddParticipantInput,
  CreateTripExpenseInput,
  UpdateTripExpenseInput,
} from './trips.schema';
import { AppError } from '../../middleware/error-handler';

export async function createTrip(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
    const input = req.body as CreateTripInput;
    const trip = await tripsService.createTrip(req.user.id, input);
    res.status(201).json({ success: true, data: trip });
  } catch (err) {
    next(err);
  }
}

export async function listTrips(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
    const trips = await tripsService.listTrips(req.user.id);
    res.status(200).json({ success: true, data: trips });
  } catch (err) {
    next(err);
  }
}

export async function getTrip(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
    const trip = await tripsService.getTripById(req.user.id, req.params.id as string);
    res.status(200).json({ success: true, data: trip });
  } catch (err) {
    next(err);
  }
}

export async function updateTrip(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
    const input = req.body as UpdateTripInput;
    const trip = await tripsService.updateTrip(req.user.id, req.params.id as string, input);
    res.status(200).json({ success: true, data: trip });
  } catch (err) {
    next(err);
  }
}

export async function deleteTrip(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
    await tripsService.deleteTrip(req.user.id, req.params.id as string);
    res.status(200).json({ success: true, data: { message: 'Trip deleted successfully.' } });
  } catch (err) {
    next(err);
  }
}

export async function addParticipant(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
    const input = req.body as AddParticipantInput;
    const participant = await tripsService.addParticipant(req.user.id, req.params.id as string, input);
    res.status(201).json({ success: true, data: participant });
  } catch (err) {
    next(err);
  }
}

export async function deleteParticipant(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
    await tripsService.deleteParticipant(req.user.id, req.params.id as string, req.params.participantId as string);
    res.status(200).json({ success: true, data: { message: 'Participant removed successfully.' } });
  } catch (err) {
    next(err);
  }
}

export async function createExpense(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
    const input = req.body as CreateTripExpenseInput;
    const expense = await tripsService.createTripExpense(req.user.id, req.params.id as string, input);
    res.status(201).json({ success: true, data: expense });
  } catch (err) {
    next(err);
  }
}

export async function updateExpense(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
    const input = req.body as UpdateTripExpenseInput;
    const expense = await tripsService.updateTripExpense(req.user.id, req.params.id as string, req.params.expenseId as string, input);
    res.status(200).json({ success: true, data: expense });
  } catch (err) {
    next(err);
  }
}

export async function deleteExpense(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
    await tripsService.deleteTripExpense(req.user.id, req.params.id as string, req.params.expenseId as string);
    res.status(200).json({ success: true, data: { message: 'Expense deleted successfully.' } });
  } catch (err) {
    next(err);
  }
}

export async function getTripSplit(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
    const split = await tripsService.calculateTripSplit(req.user.id, req.params.id as string);
    res.status(200).json({ success: true, data: split });
  } catch (err) {
    next(err);
  }
}
