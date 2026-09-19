import { z } from 'zod';

export const tripStatusEnum = z.enum(['PLANNED', 'IN_PROGRESS', 'COMPLETED']);
export type TripStatus = z.infer<typeof tripStatusEnum>;

export const expenseCategoryEnum = z.enum(['FUEL', 'FOOD', 'TOLL', 'STAY', 'OTHER']);
export type ExpenseCategory = z.infer<typeof expenseCategoryEnum>;

export const tripIdParamSchema = z.object({
  id: z.string().uuid('Invalid trip ID format. Must be a valid UUID.'),
});

export const participantIdParamSchema = z.object({
  id: z.string().uuid(),
  participantId: z.string().uuid(),
});

export const expenseIdParamSchema = z.object({
  id: z.string().uuid(),
  expenseId: z.string().uuid(),
});

export const createTripSchema = z.object({
  vehicleId: z.string().uuid().optional().nullable(),
  title: z.string().trim().min(1, 'Trip title is required').max(150),
  startDate: z.string().datetime({ offset: true }),
  endDate: z.string().datetime({ offset: true }).optional().nullable(),
  startLocation: z.string().trim().max(150).optional().nullable(),
  destination: z.string().trim().max(150).optional().nullable(),
  estimatedDistance: z.number().nonnegative().optional().nullable(),
  actualDistance: z.number().nonnegative().optional().nullable(),
  status: tripStatusEnum.default('PLANNED'),
  splitExpenses: z.boolean().default(false),
  notes: z.string().trim().max(1000).optional().nullable(),
  initialParticipants: z.array(z.object({
    name: z.string().trim().min(1, 'Participant name required'),
    email: z.string().email().optional().nullable(),
    phone: z.string().optional().nullable(),
    isIncludedInSplit: z.boolean().default(true),
  })).optional().default([]),
  initialExpenses: z.array(z.object({
    category: expenseCategoryEnum,
    amount: z.number().positive('Expense amount must be greater than 0'),
    expenseDate: z.string().optional(),
    notes: z.string().trim().max(500).optional().nullable(),
  })).optional().default([]),
});

export type CreateTripInput = z.infer<typeof createTripSchema>;

export const updateTripSchema = z.object({
  vehicleId: z.string().uuid().optional().nullable(),
  title: z.string().trim().min(1).max(150).optional(),
  startDate: z.string().datetime({ offset: true }).optional(),
  endDate: z.string().datetime({ offset: true }).optional().nullable(),
  startLocation: z.string().trim().max(150).optional().nullable(),
  destination: z.string().trim().max(150).optional().nullable(),
  estimatedDistance: z.number().nonnegative().optional().nullable(),
  actualDistance: z.number().nonnegative().optional().nullable(),
  status: tripStatusEnum.optional(),
  splitExpenses: z.boolean().optional(),
  notes: z.string().trim().max(1000).optional().nullable(),
  expenses: z.array(z.object({
    category: expenseCategoryEnum,
    amount: z.number().positive('Expense amount must be greater than 0'),
    expenseDate: z.string().optional(),
    notes: z.string().trim().max(500).optional().nullable(),
  })).optional(),
  participants: z.array(z.object({
    id: z.string().uuid().optional(),
    name: z.string().trim().min(1, 'Participant name required'),
    email: z.string().email().optional().nullable(),
    phone: z.string().optional().nullable(),
    isIncludedInSplit: z.boolean().default(true),
  })).optional(),
});

export type UpdateTripInput = z.infer<typeof updateTripSchema>;

export const addParticipantSchema = z.object({
  name: z.string().trim().min(1, 'Participant name is required').max(100),
  email: z.string().email().optional().nullable(),
  phone: z.string().optional().nullable(),
  isIncludedInSplit: z.boolean().default(true),
});

export type AddParticipantInput = z.infer<typeof addParticipantSchema>;

export const createTripExpenseSchema = z.object({
  payerParticipantId: z.string().uuid('Valid payer participant ID is required'),
  category: expenseCategoryEnum,
  amount: z.number().positive('Expense amount must be greater than 0'),
  expenseDate: z.string().datetime({ offset: true }).optional().default(() => new Date().toISOString()),
  notes: z.string().trim().max(500).optional().nullable(),
});

export type CreateTripExpenseInput = z.infer<typeof createTripExpenseSchema>;

export const updateTripExpenseSchema = z.object({
  payerParticipantId: z.string().uuid().optional(),
  category: expenseCategoryEnum.optional(),
  amount: z.number().positive().optional(),
  expenseDate: z.string().datetime({ offset: true }).optional(),
  notes: z.string().trim().max(500).optional().nullable(),
});

export type UpdateTripExpenseInput = z.infer<typeof updateTripExpenseSchema>;

export interface ParticipantResponse {
  id: string;
  tripId: string;
  userId: string | null;
  name: string;
  email: string | null;
  phone: string | null;
  isIncludedInSplit: boolean;
  createdAt: string;
}

export interface TripExpenseResponse {
  id: string;
  tripId: string;
  payerParticipantId: string;
  payerName?: string;
  category: ExpenseCategory;
  amount: number;
  expenseDate: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TripResponse {
  id: string;
  userId: string;
  vehicleId: string | null;
  title: string;
  startDate: string;
  endDate: string | null;
  startLocation: string | null;
  destination: string | null;
  estimatedDistance: number | null;
  actualDistance: number | null;
  status: TripStatus;
  splitExpenses: boolean;
  splitMethod: string;
  notes: string | null;
  participants?: ParticipantResponse[];
  expenses?: TripExpenseResponse[];
  totalExpenses?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ParticipantSplitSummary {
  participantId: string;
  name: string;
  paid: number;
  share: number;
  balance: number; // positive = paid more than share, negative = owes
}

export interface TripSplitCalculationResponse {
  tripId: string;
  tripTitle: string;
  splitExpenses: boolean;
  splitMethod: string;
  totalTripExpenses: number;
  includedParticipantCount: number;
  baseSharePerPerson: number;
  participants: ParticipantSplitSummary[];
}
