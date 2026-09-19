import PDFDocument from 'pdfkit';
import { query } from '../../database/postgres';
import { getVehicleById } from '../vehicles/vehicles.service';
import { getTripById, calculateTripSplit } from '../trips/trips.service';

function createPdfBuffer(builder: (doc: PDFKit.PDFDocument) => void): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const chunks: Buffer[] = [];

    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', (err: Error) => reject(err));

    builder(doc);
    doc.end();
  });
}

export async function generateVehicleSummaryPdf(userId: string, vehicleId: string): Promise<Buffer> {
  const vehicle = await getVehicleById(userId, vehicleId);

  const [fuelAgg, serviceAgg] = await Promise.all([
    query<{ total_spend: string | number; total_quantity: string | number; entry_count: string | number }>(
      `SELECT COALESCE(SUM(total_amount), 0) AS total_spend,
              COALESCE(SUM(quantity), 0) AS total_quantity,
              COUNT(id) AS entry_count
       FROM public.fuel_entries
       WHERE vehicle_id = $1 AND user_id = $2`,
      [vehicleId, userId]
    ),
    query<{ total_spend: string | number; record_count: string | number }>(
      `SELECT COALESCE(SUM(total_cost), 0) AS total_spend,
              COUNT(id) AS record_count
       FROM public.service_records
       WHERE vehicle_id = $1 AND user_id = $2`,
      [vehicleId, userId]
    ),
  ]);

  const fuelSpend = parseFloat(String(fuelAgg.rows[0]?.total_spend || 0));
  const fuelQty = parseFloat(String(fuelAgg.rows[0]?.total_quantity || 0));
  const fuelCount = parseInt(String(fuelAgg.rows[0]?.entry_count || 0), 10);

  const serviceSpend = parseFloat(String(serviceAgg.rows[0]?.total_spend || 0));
  const serviceCount = parseInt(String(serviceAgg.rows[0]?.record_count || 0), 10);
  const totalSpend = fuelSpend + serviceSpend;

  return createPdfBuffer((doc) => {
    // Header
    doc.fontSize(22).fillColor('#1e293b').text('Vehiclix', { align: 'center' });
    doc.fontSize(11).fillColor('#64748b').text('Vehicle & Fuel Intelligence Report', { align: 'center' });
    doc.moveDown(1.5);

    // Vehicle Details Box
    doc.fontSize(16).fillColor('#0f172a').text(`Vehicle: ${vehicle.name}`);
    doc.fontSize(10).fillColor('#334155');
    doc.text(`Type: ${vehicle.vehicleType} | Fuel: ${vehicle.fuelType}`);
    if (vehicle.licensePlate) doc.text(`License Plate: ${vehicle.licensePlate}`);
    if (vehicle.make || vehicle.model) doc.text(`Make & Model: ${vehicle.make || ''} ${vehicle.model || ''}`);
    doc.text(`Current Odometer: ${vehicle.currentOdometer.toLocaleString()} km`);
    doc.text(`Report Generated: ${new Date().toLocaleDateString('en-GB')}`);
    doc.moveDown();

    // Financial Summary
    doc.fontSize(14).fillColor('#0f172a').text('Total Expense Overview');
    doc.fontSize(11).fillColor('#334155');
    doc.text(`Total Vehicle Spend: ₹${totalSpend.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`);
    doc.text(`Total Fuel Spend (${fuelCount} entries): ₹${fuelSpend.toLocaleString('en-IN', { minimumFractionDigits: 2 })} (${fuelQty} units)`);
    doc.text(`Total Maintenance Spend (${serviceCount} services): ₹${serviceSpend.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`);
    doc.moveDown(1.5);

    doc.fontSize(9).fillColor('#94a3b8').text('Generated on demand by Vehiclix. No database report table required.', { align: 'center' });
  });
}

export async function generateTripSummaryPdf(userId: string, tripId: string): Promise<Buffer> {
  const trip = await getTripById(userId, tripId);
  const split = await calculateTripSplit(userId, tripId);

  return createPdfBuffer((doc) => {
    // Header
    doc.fontSize(22).fillColor('#1e293b').text('Vehiclix', { align: 'center' });
    doc.fontSize(11).fillColor('#64748b').text('Trip Summary & Split Report', { align: 'center' });
    doc.moveDown(1.5);

    // Trip Details
    doc.fontSize(16).fillColor('#0f172a').text(`Trip: ${trip.title}`);
    doc.fontSize(10).fillColor('#334155');
    doc.text(`Status: ${trip.status}`);
    doc.text(`Dates: ${new Date(trip.startDate).toLocaleDateString('en-GB')} ${trip.endDate ? `to ${new Date(trip.endDate).toLocaleDateString('en-GB')}` : ''}`);
    if (trip.startLocation || trip.destination) {
      doc.text(`Route: ${trip.startLocation || 'N/A'} -> ${trip.destination || 'N/A'}`);
    }
    doc.text(`Total Trip Expenses: ₹${split.totalTripExpenses.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`);
    doc.moveDown();

    // Split Breakdown Table
    doc.fontSize(14).fillColor('#0f172a').text(`Equal Split Breakdown (Method: ${trip.splitMethod})`);
    doc.fontSize(10).fillColor('#334155');
    doc.text(`Base Share Per Person: ₹${split.baseSharePerPerson.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`);
    doc.moveDown(0.5);

    doc.fontSize(10).fillColor('#0f172a').text('Participant             | Paid          | Share         | Net Balance');
    doc.text('----------------------------------------------------------------------');

    for (const p of split.participants) {
      const balanceStr = p.balance > 0 ? `+₹${p.balance.toFixed(2)}` : p.balance < 0 ? `-₹${Math.abs(p.balance).toFixed(2)}` : '₹0.00 (settled)';
      const namePadded = p.name.padEnd(24, ' ');
      const paidStr = `₹${p.paid.toFixed(2)}`.padEnd(14, ' ');
      const shareStr = `₹${p.share.toFixed(2)}`.padEnd(14, ' ');
      doc.text(`${namePadded}| ${paidStr}| ${shareStr}| ${balanceStr}`);
    }

    doc.moveDown(2);
    doc.fontSize(9).fillColor('#94a3b8').text('Positive balance means the participant is owed money; negative balance means the participant owes money.', { align: 'center' });
  });
}
