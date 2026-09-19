import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import { validateBody, validateParams } from '../../middleware/validate';
import {
  createTripSchema,
  updateTripSchema,
  tripIdParamSchema,
  addParticipantSchema,
  participantIdParamSchema,
  createTripExpenseSchema,
  updateTripExpenseSchema,
  expenseIdParamSchema,
} from './trips.schema';
import {
  createTrip,
  listTrips,
  getTrip,
  updateTrip,
  deleteTrip,
  addParticipant,
  deleteParticipant,
  createExpense,
  updateExpense,
  deleteExpense,
  getTripSplit,
} from './trips.controller';

const router = Router();

router.use(requireAuth);

// Trip CRUD
router.post('/', validateBody(createTripSchema), createTrip);
router.get('/', listTrips);
router.get('/:id', validateParams(tripIdParamSchema), getTrip);
router.patch('/:id', validateParams(tripIdParamSchema), validateBody(updateTripSchema), updateTrip);
router.delete('/:id', validateParams(tripIdParamSchema), deleteTrip);

// Trip Participants
router.post('/:id/participants', validateParams(tripIdParamSchema), validateBody(addParticipantSchema), addParticipant);
router.delete('/:id/participants/:participantId', validateParams(participantIdParamSchema), deleteParticipant);

// Trip Expenses
router.post('/:id/expenses', validateParams(tripIdParamSchema), validateBody(createTripExpenseSchema), createExpense);
router.patch('/:id/expenses/:expenseId', validateParams(expenseIdParamSchema), validateBody(updateTripExpenseSchema), updateExpense);
router.delete('/:id/expenses/:expenseId', validateParams(expenseIdParamSchema), deleteExpense);

// Trip Equal Split Calculation
router.get('/:id/split', validateParams(tripIdParamSchema), getTripSplit);

export default router;
