/**
 * Splitwise-style Expense Split Calculator
 * -----------------------------------------
 * Handles: Equal, Exact Amount, Percentage, and Share-based splits.
 * Guarantees: sum of individual splits ALWAYS equals the total amount exactly,
 * with no rounding leaks (e.g. ₹1000 / 3 people = ₹333.34 + ₹333.33 + ₹333.33).
 *
 * Strategy: all math is done in PAISE (integers) to avoid floating point errors,
 * using the "Largest Remainder Method" to distribute leftover paise fairly.
 */

// ---------- Types ----------

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

// ---------- Core helpers ----------

/** Convert rupees (float) to paise (integer). Rounds to nearest paisa. */
export function toPaise(rupees: number): number {
  return Math.round(Number(rupees || 0) * 100);
}

/** Convert paise (integer) back to rupees (2 decimal places). */
export function fromPaise(paise: number): number {
  return Math.round(paise) / 100;
}

/**
 * Distributes `totalPaise` across participants according to `weights`
 * (weights can be percentages, share-counts, or equal 1s — anything proportional).
 * Uses the Largest Remainder Method so the sum always equals totalPaise exactly.
 */
export function distributeByWeights(
  totalPaise: number,
  weights: number[]
): number[] {
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  if (totalWeight <= 0) {
    return weights.map(() => 0);
  }

  // Raw (unrounded) share per participant, and floored integer share
  const rawShares = weights.map((w) => (totalPaise * w) / totalWeight);
  const flooredShares = rawShares.map((r) => Math.floor(r));

  // How many paise are left after flooring everyone
  let remainder = totalPaise - flooredShares.reduce((a, b) => a + b, 0);

  // Sort indices by largest fractional remainder first — they get the
  // leftover paise (1 each) until remainder is exhausted.
  const fractionalParts = rawShares.map((r, i) => ({
    index: i,
    frac: r - Math.floor(r),
  }));
  fractionalParts.sort((a, b) => b.frac - a.frac);

  const result = [...flooredShares];
  for (let i = 0; i < fractionalParts.length && remainder > 0; i++) {
    result[fractionalParts[i].index] += 1;
    remainder -= 1;
  }

  return result;
}

// ---------- 1. Equal Split ----------

export function splitEqual(
  totalAmount: number,
  participants: Participant[]
): SplitResult[] {
  const totalPaise = toPaise(totalAmount);
  if (participants.length === 0) return [];
  const weights = participants.map(() => 1); // everyone gets equal weight
  const paiseShares = distributeByWeights(totalPaise, weights);

  return participants.map((p, i) => ({
    userId: p.userId,
    amount: fromPaise(paiseShares[i]),
    amountPaise: paiseShares[i],
  }));
}

// ---------- 2. Exact Amount Split ----------

export interface ExactInput {
  userId: string;
  amount: number; // rupees
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

  return entries.map((e, i) => ({
    userId: e.userId,
    amount: fromPaise(enteredPaise[i]),
    amountPaise: enteredPaise[i],
  }));
}

/** Live helper for the UI: how much is left to allocate as the user types. */
export function remainingToAllocate(
  totalAmount: number,
  entries: ExactInput[]
): number {
  const totalPaise = toPaise(totalAmount);
  const sumEntered = entries.reduce((a, e) => a + toPaise(e.amount || 0), 0);
  return fromPaise(totalPaise - sumEntered);
}

// ---------- 3. Percentage Split ----------

export interface PercentageInput {
  userId: string;
  percent: number; // e.g. 33.33
}

export const PERCENT_TOLERANCE = 0.01; // allow tiny float slack, e.g. 33.33+33.33+33.34

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

  return entries.map((e, i) => ({
    userId: e.userId,
    amount: fromPaise(paiseShares[i]),
    amountPaise: paiseShares[i],
  }));
}

/** Live helper for the UI: how much % is left to allocate. */
export function remainingPercent(entries: PercentageInput[]): number {
  const sum = entries.reduce((a, e) => a + (Number(e.percent) || 0), 0);
  return Math.round((100 - sum) * 100) / 100;
}

// ---------- 4. Share-based Split ----------

export interface ShareInput {
  userId: string;
  shares: number; // e.g. 2, 1, 1, 1
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

  return entries.map((e, i) => ({
    userId: e.userId,
    amount: fromPaise(paiseShares[i]),
    amountPaise: paiseShares[i],
  }));
}

// ---------- Validation summary (for UI feedback) ----------

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
