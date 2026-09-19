import { Request, Response, NextFunction } from 'express';
import { calculateTripFuelCost } from './calculator.service';
import { CalculateTripCostInput } from './calculator.schema';

export function estimateTripCost(req: Request, res: Response, next: NextFunction): void {
  try {
    const input = req.body as CalculateTripCostInput;
    const result = calculateTripFuelCost(input);
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
}
