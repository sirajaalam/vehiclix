/**
 * Splitwise-style Expense Split Calculator
 * -----------------------------------------
 * Pure, UI-agnostic calculation library with integer paise math and Largest Remainder Method.
 */

export interface Participant {
  userId: string;
  name?: string;
}

export interface SplitResult {
  userId: string;
  amount: number;      // in rupees, 2 decimal places
  amountPaise: number; // in paise, integer
}

export type SplitType = "equal" | "exact" | "percentage" | "shares";

export function toPaise(rupees: number): number {
  return Math.round(Number(rupees || 0) * 100);
}

export function fromPaise(paise: number): number {
  return Math.round(paise) / 100;
}

export function distributeByWeights(
  totalPaise: number,
  weights: number[]
): number[] {
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  if (totalWeight <= 0) {
    return weights.map(() => 0);
  }

  const rawShares = weights.map((w) => (totalPaise * w) / totalWeight);
  const flooredShares = rawShares.map((r) => Math.floor(r));

  let remainder = totalPaise - flooredShares.reduce((a, b) => a + b, 0);

  const fractionalParts = rawShares.map((r, i) => ({
    index: i,
    frac: r - Math.floor(r),
  }));
  fractionalParts.sort((a, b) => b.frac - a.frac);

  const result = [...flooredShares];
  for (let i = 0; i < fractionalParts.length && remainder > 0; i++) {
    const item = fractionalParts[i];
    if (item && result[item.index] !== undefined) {
      result[item.index] = (result[item.index] ?? 0) + 1;
      remainder -= 1;
    }
  }

  return result;
}

export function splitEqual(
  totalAmount: number,
  participants: Participant[]
): SplitResult[] {
  const totalPaise = toPaise(totalAmount);
  if (participants.length === 0) return [];
  const weights = participants.map(() => 1);
  const paiseShares = distributeByWeights(totalPaise, weights);

  return participants.map((p, i) => {
    const share = paiseShares[i] ?? 0;
    return {
      userId: p.userId,
      amount: fromPaise(share),
      amountPaise: share,
    };
  });
}

export interface ExactInput {
  userId: string;
  amount: number;
}

export function splitByExactAmount(
  totalAmount: number,
  entries: ExactInput[]
): SplitResult[] {
  const totalPaise = toPaise(totalAmount);
  const enteredPaise = entries.map((e) => toPaise(e.amount));
  const sumEntered = enteredPaise.reduce((a, b) => a + b, 0);

  if (sumEntered !== totalPaise) {
    const diff = fromPaise(totalPaise - sumEntered);
    throw new Error(
      diff > 0
        ? `Amounts fall short by ₹${diff.toFixed(2)}. Please allocate the remaining amount.`
        : `Amounts exceed the total by ₹${Math.abs(diff).toFixed(2)}. Please reduce allocations.`
    );
  }

  return entries.map((e, i) => {
    const p = enteredPaise[i] ?? 0;
    return {
      userId: e.userId,
      amount: fromPaise(p),
      amountPaise: p,
    };
  });
}

export function remainingToAllocate(
  totalAmount: number,
  entries: ExactInput[]
): number {
  const totalPaise = toPaise(totalAmount);
  const sumEntered = entries.reduce((a, e) => a + toPaise(e.amount || 0), 0);
  return fromPaise(totalPaise - sumEntered);
}

export interface PercentageInput {
  userId: string;
  percent: number;
}

export const PERCENT_TOLERANCE = 0.01;

export function splitByPercentage(
  totalAmount: number,
  entries: PercentageInput[]
): SplitResult[] {
  const totalPaise = toPaise(totalAmount);
  const sumPercent = entries.reduce((a, e) => a + (Number(e.percent) || 0), 0);

  if (Math.abs(sumPercent - 100) > PERCENT_TOLERANCE) {
    throw new Error(
      `Percentages must add up to 100%. Currently: ${sumPercent.toFixed(2)}%`
    );
  }

  const weights = entries.map((e) => Math.max(0, Number(e.percent) || 0));
  const paiseShares = distributeByWeights(totalPaise, weights);

  return entries.map((e, i) => {
    const share = paiseShares[i] ?? 0;
    return {
      userId: e.userId,
      amount: fromPaise(share),
      amountPaise: share,
    };
  });
}

export function remainingPercent(entries: PercentageInput[]): number {
  const sum = entries.reduce((a, e) => a + (Number(e.percent) || 0), 0);
  return Math.round((100 - sum) * 100) / 100;
}

export interface ShareInput {
  userId: string;
  shares: number;
}

export function splitByShares(
  totalAmount: number,
  entries: ShareInput[]
): SplitResult[] {
  const totalPaise = toPaise(totalAmount);

  if (entries.some((e) => Number(e.shares) < 0)) {
    throw new Error("Shares cannot be negative.");
  }
  if (entries.every((e) => Number(e.shares) === 0)) {
    throw new Error("At least one participant must have shares greater than 0.");
  }

  const weights = entries.map((e) => Math.max(0, Number(e.shares) || 0));
  const paiseShares = distributeByWeights(totalPaise, weights);

  return entries.map((e, i) => {
    const share = paiseShares[i] ?? 0;
    return {
      userId: e.userId,
      amount: fromPaise(share),
      amountPaise: share,
    };
  });
}

export function validateSplitSum(
  totalAmount: number,
  results: SplitResult[]
): { isValid: boolean; difference: number } {
  const totalPaise = toPaise(totalAmount);
  const sumPaise = results.reduce((a, r) => a + r.amountPaise, 0);
  return {
    isValid: sumPaise === totalPaise,
    difference: fromPaise(totalPaise - sumPaise),
  };
}
