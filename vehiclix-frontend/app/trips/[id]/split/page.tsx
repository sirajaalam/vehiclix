'use client';

import React, { useEffect, useState, useMemo, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { api } from '../../../../lib/api';
import styles from './split.module.css';
import {
  toPaise,
  fromPaise,
  splitEqual,
  splitByExactAmount,
  remainingToAllocate,
  splitByPercentage,
  remainingPercent,
  splitByShares,
  validateSplitSum,
  Participant,
  SplitResult,
} from '../../../../lib/splitCalculator';
import {
  ArrowLeft,
  Users,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Plus,
  Trash2,
  DollarSign,
  Percent,
  PieChart,
  Save,
} from 'lucide-react';

export type SplitMode = 'amount' | 'percentage' | 'shares';

interface ParticipantEntry {
  id: string;
  name: string;
}

export default function TripSplitPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const tripId = resolvedParams.id;
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [trip, setTrip] = useState<any>(null);
  const [participants, setParticipants] = useState<ParticipantEntry[]>([]);
  const [mode, setMode] = useState<SplitMode>('amount');

  // Input states per participant: keyed by participant id
  const [amountInputs, setAmountInputs] = useState<Record<string, number | ''>>({});
  const [percentageInputs, setPercentageInputs] = useState<Record<string, number | ''>>({});
  const [shareInputs, setShareInputs] = useState<Record<string, number | ''>>({});

  // Dynamic add participant inline state
  const [newParticipantName, setNewParticipantName] = useState('');
  const [addingParticipant, setAddingParticipant] = useState(false);
  const [savingSplit, setSavingSplit] = useState(false);

  // Load trip and participant data
  const loadData = async () => {
    try {
      const tripData = await api.getTrip(tripId);
      setTrip(tripData);

      let parts: ParticipantEntry[] = [];
      if (tripData?.participants && tripData.participants.length > 0) {
        parts = tripData.participants.map((p: any) => ({
          id: p.id,
          name: p.name || 'Participant',
        }));
      } else {
        parts = [
          { id: 'p-1', name: 'Trip Owner' },
          { id: 'p-2', name: 'Traveler 2' },
        ];
      }
      setParticipants(parts);

      // Total amount
      const totalAmount = Number(tripData?.totalExpenses) || 0;

      // Check for saved split in local cache / trip data
      const savedKey = `vehiclix_split_${tripId}`;
      let savedSplit: any = null;
      try {
        const raw = localStorage.getItem(savedKey);
        if (raw) savedSplit = JSON.parse(raw);
      } catch (e) {
        // ignore
      }

      const currentPartIds = new Set(parts.map((p) => p.id));
      const savedPartIds = savedSplit?.participantIds || (
        savedSplit?.amountInputs ? Object.keys(savedSplit.amountInputs) :
        savedSplit?.percentageInputs ? Object.keys(savedSplit.percentageInputs) :
        savedSplit?.shareInputs ? Object.keys(savedSplit.shareInputs) : []
      );
      const isCacheValid = Boolean(
        savedSplit &&
        savedSplit.mode &&
        savedPartIds.length === parts.length &&
        savedPartIds.every((id: string) => currentPartIds.has(id))
      );

      if (isCacheValid) {
        setMode(savedSplit.mode);
        if (savedSplit.mode === 'amount' && savedSplit.amountInputs) {
          setAmountInputs(savedSplit.amountInputs);
        } else if (savedSplit.mode === 'percentage' && savedSplit.percentageInputs) {
          setPercentageInputs(savedSplit.percentageInputs);
        } else if (savedSplit.mode === 'shares' && savedSplit.shareInputs) {
          setShareInputs(savedSplit.shareInputs);
        }
      } else {
        // Pre-fill Equal defaults for all modes
        initializeEqualAllocations(totalAmount, parts);
      }
    } catch (err: any) {
      console.error('Failed to load trip for split:', err);
      toast.error(err.message || 'Failed to load trip details');
      setTrip(null);
    } finally {
      setLoading(false);
    }
  };

  const initializeEqualAllocations = (total: number, parts: ParticipantEntry[]) => {
    if (parts.length === 0) return;

    // 1. Equal Amount Pre-fill
    const equalRes = splitEqual(
      total,
      parts.map((p) => ({ userId: p.id, name: p.name }))
    );
    const amtMap: Record<string, number> = {};
    equalRes.forEach((r) => {
      amtMap[r.userId] = r.amount;
    });
    setAmountInputs(amtMap);

    // 2. Equal Percentage Pre-fill (summing to 100)
    const pctShare = Math.round((100 / parts.length) * 100) / 100;
    const pctMap: Record<string, number> = {};
    let runningPct = 0;
    parts.forEach((p, idx) => {
      if (idx === parts.length - 1) {
        pctMap[p.id] = Math.round((100 - runningPct) * 100) / 100;
      } else {
        pctMap[p.id] = pctShare;
        runningPct += pctShare;
      }
    });
    setPercentageInputs(pctMap);

    // 3. Equal Shares Pre-fill (1 share each)
    const shrMap: Record<string, number> = {};
    parts.forEach((p) => {
      shrMap[p.id] = 1;
    });
    setShareInputs(shrMap);
  };

  useEffect(() => {
    loadData();
  }, [tripId]);

  const totalAmount = useMemo(() => {
    return Number(trip?.totalExpenses) || 0;
  }, [trip]);

  // ---------- Live Calculation per Mode ----------

  const calculationState = useMemo(() => {
    if (participants.length === 0) {
      return {
        results: [],
        isValid: false,
        difference: totalAmount,
        statusText: 'No participants available',
        statusType: 'error' as const,
      };
    }

    if (mode === 'amount') {
      const entries = participants.map((p) => ({
        userId: p.id,
        amount: Number(amountInputs[p.id] || 0),
      }));

      const remaining = remainingToAllocate(totalAmount, entries);
      let results: SplitResult[] = [];
      let isExact = false;

      try {
        results = splitByExactAmount(totalAmount, entries);
        isExact = true;
      } catch (e) {
        // Fallback live display
        results = entries.map((e) => ({
          userId: e.userId,
          amount: e.amount,
          amountPaise: toPaise(e.amount),
        }));
      }

      if (remaining === 0 && isExact) {
        return {
          results,
          isValid: true,
          difference: 0,
          statusText: 'Allocated 100% — Zero difference (Ready to Save)',
          statusType: 'balanced' as const,
        };
      } else if (remaining > 0) {
        return {
          results,
          isValid: false,
          difference: remaining,
          statusText: `₹${remaining.toFixed(2)} remaining to allocate`,
          statusType: 'pending' as const,
        };
      } else {
        return {
          results,
          isValid: false,
          difference: remaining,
          statusText: `Allocation exceeds total by ₹${Math.abs(remaining).toFixed(2)}`,
          statusType: 'error' as const,
        };
      }
    }

    if (mode === 'percentage') {
      const entries = participants.map((p) => ({
        userId: p.id,
        percent: Number(percentageInputs[p.id] || 0),
      }));

      const remPct = remainingPercent(entries);
      let results: SplitResult[] = [];
      let isValid = false;

      try {
        results = splitByPercentage(totalAmount, entries);
        const validation = validateSplitSum(totalAmount, results);
        isValid = validation.isValid && remPct === 0;
      } catch (e) {
        results = entries.map((e) => ({
          userId: e.userId,
          amount: Math.round(((totalAmount * e.percent) / 100) * 100) / 100,
          amountPaise: toPaise(((totalAmount * e.percent) / 100)),
        }));
      }

      if (remPct === 0 && isValid) {
        return {
          results,
          isValid: true,
          difference: 0,
          statusText: 'Percentages sum to 100% — Zero rounding leak',
          statusType: 'balanced' as const,
        };
      } else if (remPct > 0) {
        return {
          results,
          isValid: false,
          difference: remPct,
          statusText: `${remPct.toFixed(2)}% remaining to allocate`,
          statusType: 'pending' as const,
        };
      } else {
        return {
          results,
          isValid: false,
          difference: remPct,
          statusText: `Total percentage exceeds 100% by ${Math.abs(remPct).toFixed(2)}%`,
          statusType: 'error' as const,
        };
      }
    }

    if (mode === 'shares') {
      const entries = participants.map((p) => ({
        userId: p.id,
        shares: Math.max(0, Number(shareInputs[p.id] || 0)),
      }));

      const totalShares = entries.reduce((a, b) => a + b.shares, 0);

      if (totalShares <= 0) {
        return {
          results: entries.map((e) => ({ userId: e.userId, amount: 0, amountPaise: 0 })),
          isValid: false,
          difference: totalAmount,
          statusText: 'At least one participant must have > 0 shares',
          statusType: 'error' as const,
        };
      }

      try {
        const results = splitByShares(totalAmount, entries);
        const validation = validateSplitSum(totalAmount, results);
        return {
          results,
          isValid: validation.isValid,
          difference: validation.difference,
          statusText: `${totalShares} total shares allocated proportionally (Exact ₹${totalAmount.toFixed(2)})`,
          statusType: 'balanced' as const,
        };
      } catch (e: any) {
        return {
          results: [],
          isValid: false,
          difference: totalAmount,
          statusText: e.message || 'Error computing shares',
          statusType: 'error' as const,
        };
      }
    }

    return {
      results: [],
      isValid: false,
      difference: totalAmount,
      statusText: '',
      statusType: 'pending' as const,
    };
  }, [mode, participants, amountInputs, percentageInputs, shareInputs, totalAmount]);

  // Reset current mode to Equal
  const handleResetToEqual = () => {
    initializeEqualAllocations(totalAmount, participants);
    toast.info(`Reset ${mode} split to equal distribution across all participants.`);
  };

  // Add a participant dynamically
  const handleAddParticipant = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = newParticipantName.trim();
    if (!name) {
      toast.error('Please enter a participant name');
      return;
    }

    setAddingParticipant(true);
    try {
      // If the trip exists in backend, save participant to trip
      let newPart: ParticipantEntry;
      try {
        const res = await api.addParticipant(tripId, { name });
        newPart = { id: res.id, name: res.name };
      } catch (err) {
        // Fallback local participant
        newPart = { id: `p-${Date.now()}`, name };
      }

      const updated = [...participants, newPart];
      setParticipants(updated);
      setNewParticipantName('');
      initializeEqualAllocations(totalAmount, updated);
      toast.success(`Participant "${name}" added!`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to add participant');
    } finally {
      setAddingParticipant(false);
    }
  };

  // Remove a participant dynamically (minimum 2 participants)
  const handleRemoveParticipant = async (partId: string) => {
    if (participants.length <= 2) {
      toast.error('A trip split requires at least 2 participants.');
      return;
    }

    try {
      try {
        await api.removeParticipant(tripId, partId);
      } catch (e) {
        // ignore if client-only id
      }

      const updated = participants.filter((p) => p.id !== partId);
      setParticipants(updated);
      initializeEqualAllocations(totalAmount, updated);
      toast.success('Participant removed');
    } catch (err: any) {
      toast.error(err.message || 'Failed to remove participant');
    }
  };

  // Save Split Allocation
  const handleSaveSplit = async () => {
    if (!calculationState.isValid) {
      toast.error('Cannot save: Allocation must exactly equal trip total with zero remainder.');
      return;
    }

    setSavingSplit(true);
    try {
      const payload = {
        mode,
        totalAmount,
        participants: participants.map((p) => {
          const res = calculationState.results.find((r) => r.userId === p.id);
          return {
            participantId: p.id,
            name: p.name,
            shareAmount: res?.amount ?? 0,
            sharePaise: res?.amountPaise ?? 0,
            inputPercent: mode === 'percentage' ? percentageInputs[p.id] : undefined,
            inputShares: mode === 'shares' ? shareInputs[p.id] : undefined,
          };
        }),
        amountInputs,
        percentageInputs,
        shareInputs,
        savedAt: new Date().toISOString(),
      };

      // Save to localStorage for instant recall
      const savedKey = `vehiclix_split_${tripId}`;
      localStorage.setItem(savedKey, JSON.stringify(payload));

      toast.success('Trip expense split successfully saved and balanced to the exact paisa!');
      router.push('/trips');
    } catch (err: any) {
      console.error('Failed to save split:', err);
      toast.error(err.message || 'Failed to save split allocation');
    } finally {
      setSavingSplit(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingSpinner}>
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
          <span>Loading expedition split details...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Top Nav Back */}
      <div className={styles.topNav}>
        <Link href="/trips" className={styles.backLink}>
          <ArrowLeft size={15} /> Back to Trips
        </Link>
        <span className={styles.headerBadge}>Trip Expense Splitter</span>
      </div>

      {/* Header */}
      <div className={styles.header}>
        <h1 className={styles.title}>{trip?.title || 'Expedition'} — Expense Split</h1>
        <p className={styles.subtitle}>
          Divide trip total across participants using integer paise arithmetic with zero rounding leaks.
        </p>
      </div>

      {/* Mobile Compact Summary Strip (< 1024px) */}
      <div className={styles.mobileSummaryStrip}>
        <div>
          <div className={styles.mobileTotalLabel}>Total Trip Cost</div>
          <div className={styles.mobileTotalVal}>
            ₹{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>
        <div className={styles.mobileSummaryRight}>
          <span className={styles.mobileChip}>
            <Users size={12} /> {participants.length} Travelers
          </span>
          <span className={styles.mobileChipMode}>{mode}</span>
        </div>
      </div>

      {/* Top Controls Row (Mode Tabs + Compact Status Strip) */}
      <div className={styles.controlsRow}>
        {/* Mode Tabs */}
        <div className={styles.tabsContainer}>
          <button
            type="button"
            onClick={() => setMode('amount')}
            className={`${styles.tabBtn} ${mode === 'amount' ? styles.tabBtnActive : ''}`}
          >
            <DollarSign size={14} />
            <span>Exact Amount (₹)</span>
          </button>

          <button
            type="button"
            onClick={() => setMode('percentage')}
            className={`${styles.tabBtn} ${mode === 'percentage' ? styles.tabBtnActive : ''}`}
          >
            <Percent size={14} />
            <span>Percentage (%)</span>
          </button>

          <button
            type="button"
            onClick={() => setMode('shares')}
            className={`${styles.tabBtn} ${mode === 'shares' ? styles.tabBtnActive : ''}`}
          >
            <PieChart size={14} />
            <span>Shares Ratio</span>
          </button>
        </div>

        {/* Compact Status Strip */}
        <div className={styles.statusStrip}>
          <div className={styles.statusInfoInline}>
            <div
              className={`${styles.statusBadge} ${
                calculationState.statusType === 'balanced'
                  ? styles.statusBalanced
                  : calculationState.statusType === 'error'
                  ? styles.statusError
                  : styles.statusPending
              }`}
            >
              {calculationState.statusType === 'balanced' ? (
                <CheckCircle2 size={13} />
              ) : (
                <AlertCircle size={13} />
              )}
              <span>{calculationState.statusText}</span>
            </div>
            <span className={styles.statusHintText}>
              {mode === 'amount' && 'Must match total exactly'}
              {mode === 'percentage' && 'Must sum to 100%'}
              {mode === 'shares' && 'Distributed to paisa'}
            </span>
          </div>

          <button
            type="button"
            onClick={handleResetToEqual}
            className={styles.btnSecondaryCompact}
            title="Reset this tab to equal distribution"
          >
            <RotateCcw size={12} />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Main Responsive Grid (Desktop 2-Column: 1fr 340px) */}
      <div className={styles.gridContainer}>
        {/* LEFT COLUMN: Participant Table (Matching Height with Total Cost Side Section) */}
        <div className={styles.mainColumn}>
          {/* Participants Allocation Card */}
          <div className={styles.splitCard}>
            <div className={styles.cardHeader}>
              <div className={styles.cardTitle}>
                <Users size={15} className="text-emerald-400" />
                <span>Participant Shares</span>
              </div>
              <span className={styles.cardSubtitle}>
                {participants.length} {participants.length === 1 ? 'traveler' : 'travelers'}
              </span>
            </div>

            {/* Add Participant Dynamic Form */}
            <form onSubmit={handleAddParticipant} className={styles.addParticipantRow}>
              <input
                type="text"
                placeholder="Add traveler name (e.g. Alex, Sam)..."
                value={newParticipantName}
                onChange={(e) => setNewParticipantName(e.target.value)}
                className={styles.addInput}
              />
              <button type="submit" disabled={addingParticipant} className={styles.addBtn}>
                <Plus size={14} />
                <span>{addingParticipant ? 'Adding...' : 'Add Traveler'}</span>
              </button>
            </form>

            {/* Allocation Table */}
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th className={styles.th}>Participant</th>
                    <th className={styles.th}>
                      {mode === 'amount' && 'Allocated Amount (₹)'}
                      {mode === 'percentage' && 'Percentage (%)'}
                      {mode === 'shares' && 'Share Count'}
                    </th>
                    <th className={styles.th} style={{ textAlign: 'right' }}>Calculated Share (₹)</th>
                    {participants.length > 2 && <th className={styles.th} style={{ width: '36px' }}></th>}
                  </tr>
                </thead>
                <tbody>
                  {participants.map((p) => {
                    const res = calculationState.results.find((r) => r.userId === p.id);
                    const shareRupees = res ? res.amount : 0;
                    const initials = p.name ? p.name.substring(0, 2) : 'P';

                    return (
                      <tr key={p.id}>
                        <td className={styles.td}>
                          <div className={styles.participantNameCell}>
                            <div className={styles.avatar}>{initials}</div>
                            <span className={styles.nameText} title={p.name}>{p.name}</span>
                          </div>
                        </td>

                        {/* Mode Specific Input */}
                        <td className={styles.td}>
                          {mode === 'amount' && (
                            <input
                              type="number"
                              step="any"
                              min="0"
                              value={amountInputs[p.id] ?? ''}
                              onChange={(e) => {
                                const val = e.target.value === '' ? '' : parseFloat(e.target.value) || 0;
                                setAmountInputs((prev) => ({ ...prev, [p.id]: val }));
                              }}
                              className={styles.inputControl}
                              placeholder="0.00"
                            />
                          )}

                          {mode === 'percentage' && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                              <input
                                type="number"
                                step="any"
                                min="0"
                                max="100"
                                value={percentageInputs[p.id] ?? ''}
                                onChange={(e) => {
                                  const val = e.target.value === '' ? '' : parseFloat(e.target.value) || 0;
                                  setPercentageInputs((prev) => ({ ...prev, [p.id]: val }));
                                }}
                                className={styles.inputControl}
                                placeholder="0"
                              />
                              <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>%</span>
                            </div>
                          )}

                          {mode === 'shares' && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                              <input
                                type="number"
                                step="1"
                                min="0"
                                value={shareInputs[p.id] ?? ''}
                                onChange={(e) => {
                                  const val = e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value, 10) || 0);
                                  setShareInputs((prev) => ({ ...prev, [p.id]: val }));
                                }}
                                className={styles.inputControl}
                                placeholder="1"
                              />
                              <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>share(s)</span>
                            </div>
                          )}
                        </td>

                        {/* Calculated Share */}
                        <td className={styles.td} style={{ textAlign: 'right' }}>
                          <div className={styles.shareResult}>
                            ₹{shareRupees.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </div>
                          <div className={styles.shareSubtext}>
                            {totalAmount > 0
                              ? `${((shareRupees / totalAmount) * 100).toFixed(1)}% of total`
                              : '0%'}
                          </div>
                        </td>

                        {/* Delete Action (if > 2 participants) */}
                        {participants.length > 2 && (
                          <td className={styles.td} style={{ textAlign: 'center' }}>
                            <button
                              type="button"
                              onClick={() => handleRemoveParticipant(p.id)}
                              className={styles.actionBtn}
                              title="Remove Participant"
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Bottom Confirmation Bar for Mobile/Tablet */}
          <div className={styles.bottomBar}>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
              <span>
                {calculationState.isValid
                  ? '✓ All individual shares exactly equal trip total to the paisa.'
                  : '⚠ Allocation must exactly equal ₹' + totalAmount.toFixed(2) + ' to save.'}
              </span>
            </div>

            <button
              type="button"
              onClick={handleSaveSplit}
              disabled={!calculationState.isValid || savingSplit}
              className={styles.btnPrimary}
            >
              <Save size={15} />
              <span>{savingSplit ? 'Saving...' : 'Confirm & Save Split'}</span>
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: Sticky Summary Sidebar (Desktop Only) */}
        <div className={styles.sidebarColumn}>
          <div className={styles.sidebarCard}>
            <div className={styles.sidebarTotalBlock}>
              <div className={styles.sidebarLabel}>Total Trip Cost</div>
              <div className={styles.sidebarTotal}>
                ₹{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>

            <div className={styles.sidebarSummaryList}>
              <div className={styles.sidebarSummaryRow}>
                <span>Travelers:</span>
                <strong>{participants.length} people</strong>
              </div>
              <div className={styles.sidebarSummaryRow}>
                <span>Split Mode:</span>
                <strong style={{ textTransform: 'capitalize' }}>{mode}</strong>
              </div>
              <div className={styles.sidebarDivider} />
              <div className={styles.sidebarSummaryRow}>
                <span>Total Allocated:</span>
                <strong className={calculationState.isValid ? 'text-emerald-400' : 'text-amber-400'}>
                  ₹{calculationState.results.reduce((acc, r) => acc + (r.amount || 0), 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </strong>
              </div>
              <div className={styles.sidebarSummaryRow}>
                <span>Difference:</span>
                <strong className={calculationState.isValid ? 'text-emerald-400' : 'text-rose-400'}>
                  {calculationState.isValid
                    ? '₹0.00'
                    : mode === 'percentage'
                    ? `${Math.abs(calculationState.difference).toFixed(2)}% ${calculationState.difference > 0 ? 'remaining' : 'over'}`
                    : `₹${Math.abs(calculationState.difference).toFixed(2)} ${calculationState.difference > 0 ? 'under' : 'over'}`}
                </strong>
              </div>
            </div>

            <div className={styles.sidebarStatusBlock}>
              <div
                className={`${styles.statusBadge} ${
                  calculationState.statusType === 'balanced'
                    ? styles.statusBalanced
                    : calculationState.statusType === 'error'
                    ? styles.statusError
                    : styles.statusPending
                }`}
              >
                {calculationState.statusType === 'balanced' ? (
                  <CheckCircle2 size={13} />
                ) : (
                  <AlertCircle size={13} />
                )}
                <span>{calculationState.statusText}</span>
              </div>
              <button
                type="button"
                onClick={handleResetToEqual}
                className={styles.btnSecondaryCompact}
                style={{ width: '100%', justifyContent: 'center' }}
              >
                <RotateCcw size={12} />
                <span>Reset to Equal Distribution</span>
              </button>
            </div>

            <button
              type="button"
              onClick={handleSaveSplit}
              disabled={!calculationState.isValid || savingSplit}
              className={styles.btnPrimary}
            >
              <Save size={15} />
              <span>{savingSplit ? 'Saving Split...' : 'Confirm & Save Split'}</span>
            </button>

            <div className={styles.guaranteeBadge}>
              <CheckCircle2 size={12} className="text-emerald-400" />
              <span>Zero Rounding Leaks Guaranteed</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
