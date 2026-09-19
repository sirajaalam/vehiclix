import { Request, Response, NextFunction } from 'express';
import { generateVehicleSummaryPdf, generateTripSummaryPdf } from './reports.service';
import { AppError } from '../../middleware/error-handler';

export async function downloadVehicleReport(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
    const vehicleId = req.params.vehicleId as string;
    const pdfBuffer = await generateVehicleSummaryPdf(req.user.id, vehicleId);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="vehicle-summary-${vehicleId}.pdf"`);
    res.status(200).send(pdfBuffer);
  } catch (err) {
    next(err);
  }
}

export async function downloadTripReport(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
    const tripId = req.params.tripId as string;
    const pdfBuffer = await generateTripSummaryPdf(req.user.id, tripId);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="trip-summary-${tripId}.pdf"`);
    res.status(200).send(pdfBuffer);
  } catch (err) {
    next(err);
  }
}
