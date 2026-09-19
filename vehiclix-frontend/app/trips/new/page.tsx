'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Compass,
  Car,
  Calendar,
  Navigation,
  DollarSign,
  Users,
  Plus,
  Trash2,
  AlertCircle,
  AlertTriangle,
  ChevronDown,
  Sparkles,
  Save,
  CheckCircle2,
  UserPlus,
} from 'lucide-react';
import { api } from '../../../lib/api';
import { DatePicker } from '../../../components/ui';
import { Modal } from '../../../components/ui/Modal';
import { toast } from 'sonner';

interface Vehicle {
  id: string;
  name: string | null;
  make: string;
  model: string;
  year?: number | null;
  licensePlate?: string | null;
}

interface ExpenseRow {
  category: 'FUEL' | 'FOOD' | 'TOLL' | 'STAY' | 'OTHER';
  amount: number | '';
  expenseDate: string;
  notes: string;
}

interface ParticipantRow {
  id?: string;
  name: string;
  email?: string;
  phone?: string;
}

export default function NewTripPage() {
  const router = useRouter();

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loadingVehicles, setLoadingVehicles] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const today = new Date().toISOString().split('T')[0];
  const [title, setTitle] = useState('');
  const [vehicleId, setVehicleId] = useState('');
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState('');
  const [startLocation, setStartLocation] = useState('');
  const [destination, setDestination] = useState('');
  const [estimatedDistance, setEstimatedDistance] = useState<number | ''>('');
  const [actualDistance, setActualDistance] = useState<number | ''>('');
  const [notes, setNotes] = useState('');

  // Participants State
  const [participants, setParticipants] = useState<ParticipantRow[]>([
    { name: 'Trip Owner (Organizer)' },
  ]);
  const [newParticipantName, setNewParticipantName] = useState('');
  const [newParticipantEmail, setNewParticipantEmail] = useState('');
  const [isParticipantModalOpen, setIsParticipantModalOpen] = useState(false);

  // Expenses State
  const [expenses, setExpenses] = useState<ExpenseRow[]>([
    { category: 'FUEL', amount: '', expenseDate: today, notes: '' },
  ]);

  // Validation errors
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    async function fetchGarageVehicles() {
      try {
        const vData = await api.listVehicles();
        setVehicles(vData || []);
        if (vData && vData.length > 0) {
          setVehicleId(vData[0].id);
        }
      } catch (err: any) {
        console.error('Failed to load vehicles:', err);
        toast.error('Could not load garage vehicles.');
      } finally {
        setLoadingVehicles(false);
      }
    }
    fetchGarageVehicles();
  }, []);

  // Add Participant
  const handleAddParticipant = () => {
    const trimmed = newParticipantName.trim();
    if (!trimmed) {
      toast.error('Please enter a participant name');
      return;
    }
    if (participants.some((p) => p.name.toLowerCase() === trimmed.toLowerCase())) {
      toast.error('A participant with this name is already in the expedition');
      return;
    }
    setParticipants([
      ...participants,
      {
        name: trimmed,
        email: newParticipantEmail.trim() || undefined,
      },
    ]);
    setNewParticipantName('');
    setNewParticipantEmail('');
  };

  // Remove Participant
  const handleRemoveParticipant = (index: number) => {
    if (participants.length <= 1) {
      toast.error('At least one participant is required.');
      return;
    }
    setParticipants(participants.filter((_, i) => i !== index));
  };

  // Add Expense Row
  const handleAddExpenseRow = () => {
    setExpenses([
      ...expenses,
      {
        category: 'FUEL',
        amount: '',
        expenseDate: startDate || today,
        notes: '',
      },
    ]);
  };

  // Update Expense Row
  const handleUpdateExpenseRow = (index: number, field: keyof ExpenseRow, val: any) => {
    setExpenses((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: val };
      return copy;
    });
  };

  // Remove Expense Row
  const handleRemoveExpenseRow = (index: number) => {
    if (expenses.length <= 1) {
      setExpenses([{ category: 'FUEL', amount: '', expenseDate: today, notes: '' }]);
      return;
    }
    setExpenses((prev) => prev.filter((_, i) => i !== index));
  };

  // Helper date parsing
  const safeIsoDate = (dateVal: string | undefined | null): string => {
    if (!dateVal) return new Date().toISOString();
    const d = new Date(dateVal);
    return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
  };

  const totalExpenseAmount = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const errs: Record<string, string> = {};
    if (!title.trim()) {
      errs.title = 'Expedition title is required';
    }
    if (!vehicleId) {
      errs.vehicleId = 'Please select a registered garage vehicle';
    }
    if (!startDate) {
      errs.startDate = 'Start date is required';
    }
    if (endDate && startDate && new Date(endDate) < new Date(startDate)) {
      errs.endDate = 'End date cannot be earlier than start date';
    }
    if (estimatedDistance !== '' && Number(estimatedDistance) < 0) {
      errs.estimatedDistance = 'Estimated distance cannot be negative';
    }
    if (actualDistance !== '' && Number(actualDistance) < 0) {
      errs.actualDistance = 'Actual distance cannot be negative';
    }

    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      toast.error('Please resolve the highlighted errors in the form.');
      return;
    }
    setFieldErrors({});

    setSubmitting(true);

    const validExpenses = expenses
      .filter((exp) => Number(exp.amount) > 0)
      .map((exp) => ({
        category: exp.category,
        amount: Number(exp.amount),
        expenseDate: safeIsoDate(exp.expenseDate),
        notes: exp.notes ? exp.notes.trim() || undefined : undefined,
      }));

    const validParticipants = participants.map((p) => ({
      name: p.name.trim(),
      email: p.email ? p.email.trim() || undefined : undefined,
      phone: p.phone ? p.phone.trim() || undefined : undefined,
      isIncludedInSplit: true,
    }));

    const payload = {
      title: title.trim(),
      vehicleId,
      status: 'PLANNED',
      startDate: safeIsoDate(startDate),
      endDate: endDate ? safeIsoDate(endDate) : undefined,
      startLocation: startLocation.trim() || undefined,
      destination: destination.trim() || undefined,
      estimatedDistance: estimatedDistance !== '' ? Number(estimatedDistance) : undefined,
      actualDistance: actualDistance !== '' ? Number(actualDistance) : undefined,
      splitExpenses: validParticipants.length > 1,
      notes: notes.trim() || undefined,
      initialParticipants: validParticipants,
      initialExpenses: validExpenses.length > 0 ? validExpenses : undefined,
    };

    try {
      const created = await api.createTrip(payload);
      toast.success('Expedition planned and created successfully!');

      // Redirect directly to Split page if expenses exist or more than 1 participant
      router.push(`/trips/${created.id}/split`);
    } catch (err: any) {
      console.error('Failed to create expedition:', err);
      toast.error(err.message || 'Failed to create expedition.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-16">
      {/* Top Breadcrumb / Navigation Bar */}
      <div className="border-b border-white/[0.08] bg-slate-900/80 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <Link
              href="/trips"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-white/[0.08] bg-white/[0.03] text-slate-300 hover:text-white hover:bg-white/[0.08] transition-colors text-xs font-medium shrink-0 whitespace-nowrap"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Back to Expeditions</span>
              <span className="sm:hidden">Back</span>
            </Link>
            <span className="text-slate-600 hidden sm:inline">/</span>
            <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5 truncate whitespace-nowrap">
              <Compass className="h-3.5 w-3.5 shrink-0" />
              <span>Plan Expedition</span>
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <button
              type="button"
              onClick={() => router.push('/trips')}
              className="hidden sm:inline-block px-3.5 py-1.5 text-xs text-slate-400 hover:text-white transition-colors whitespace-nowrap"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="new-trip-form"
              disabled={submitting}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 px-3.5 py-1.5 sm:px-4 sm:py-2 text-xs font-bold text-slate-950 transition-all shadow-lg shadow-emerald-500/20 active:scale-95 disabled:opacity-50 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Save className="h-4 w-4" />
              <span>{submitting ? 'Creating...' : 'Save & Split'}</span>
            </button>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Compass className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight font-display">
                Plan Road Expedition
              </h1>
              <p className="text-xs sm:text-sm text-slate-400">
                Configure vehicle logistics, register expedition travelers, and budget itemized expenses
              </p>
            </div>
          </div>
        </div>

        {/* Warning if no vehicles in garage */}
        {vehicles.length === 0 && !loadingVehicles && (
          <div className="mb-6 flex items-center justify-between gap-3 p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-300">
            <div className="flex items-center gap-2.5 min-w-0">
              <AlertTriangle className="h-5 w-5 flex-shrink-0 text-amber-400" />
              <div>
                <p className="font-semibold text-white text-xs sm:text-sm">No registered vehicles found in your garage</p>
                <p className="text-xs text-amber-200/80">You must register at least one vehicle in your Garage before planning trips.</p>
              </div>
            </div>
            <Link
              href="/garage"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-400 transition-colors shrink-0 shadow-sm"
            >
              <Car className="h-3.5 w-3.5" /> Go to Garage
            </Link>
          </div>
        )}

        {/* Form Body */}
        <form id="new-trip-form" onSubmit={handleSubmit} noValidate className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* LEFT COLUMN: Logistics & Vehicle (7 Cols) */}
            <div className="lg:col-span-7 space-y-6">
              <div className="rounded-2xl border border-white/[0.08] bg-slate-900/60 p-5 sm:p-6 backdrop-blur-xl space-y-5">
                <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-white/[0.06]">
                  <Car className="h-4 w-4 text-emerald-400" />
                  <span>Expedition Logistics & Vehicle</span>
                </div>

                {/* Title */}
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Expedition Title <span className="text-rose-400 font-bold">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => {
                      setTitle(e.target.value);
                      if (fieldErrors.title) setFieldErrors((prev) => { const n = { ...prev }; delete n.title; return n; });
                    }}
                    className={`w-full h-10 rounded-xl border px-3.5 text-white text-xs focus:outline-none transition-colors ${
                      fieldErrors.title
                        ? 'border-rose-500/80 bg-rose-500/5 focus:border-rose-500'
                        : 'border-white/[0.1] bg-slate-950/80 focus:border-emerald-500'
                    }`}
                    placeholder="e.g. Western Ghats Coastal Escape"
                  />
                  {fieldErrors.title && (
                    <p className="mt-1 text-[11px] text-rose-400 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3 shrink-0" />
                      <span>{fieldErrors.title}</span>
                    </p>
                  )}
                </div>

                {/* Registered Vehicle Selection */}
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Assign Garage Vehicle <span className="text-rose-400 font-bold">*</span>
                  </label>
                  <div className="relative">
                    <select
                      required
                      value={vehicleId}
                      onChange={(e) => {
                        setVehicleId(e.target.value);
                        if (fieldErrors.vehicleId) setFieldErrors((prev) => { const n = { ...prev }; delete n.vehicleId; return n; });
                      }}
                      className={`w-full h-10 appearance-none rounded-xl border px-3.5 pr-10 text-white text-xs focus:outline-none transition-colors cursor-pointer ${
                        fieldErrors.vehicleId
                          ? 'border-rose-500/80 bg-rose-500/5 focus:border-rose-500'
                          : 'border-white/[0.1] bg-slate-950/80 focus:border-emerald-500'
                      }`}
                    >
                      <option value="" disabled>Select Registered Vehicle *</option>
                      {vehicles.map((v) => (
                        <option key={v.id} value={v.id} className="bg-slate-900 text-white">
                          {v.name ? `${v.name} (${v.make} ${v.model})` : `${v.make} ${v.model}`}
                          {v.licensePlate ? ` • ${v.licensePlate}` : ''}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  </div>
                  {fieldErrors.vehicleId && (
                    <p className="mt-1 text-[11px] text-rose-400 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3 shrink-0" />
                      <span>{fieldErrors.vehicleId}</span>
                    </p>
                  )}
                </div>

                {/* Dates: Start & End */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <DatePicker
                    label="Expedition Start Date"
                    required
                    value={startDate}
                    onChange={(e) => {
                      setStartDate(e.target.value);
                      if (fieldErrors.startDate) setFieldErrors((prev) => { const n = { ...prev }; delete n.startDate; return n; });
                    }}
                    error={fieldErrors.startDate}
                  />
                  <DatePicker
                    label="Expedition End Date (Optional)"
                    value={endDate}
                    onChange={(e) => {
                      setEndDate(e.target.value);
                      if (fieldErrors.endDate) setFieldErrors((prev) => { const n = { ...prev }; delete n.endDate; return n; });
                    }}
                    error={fieldErrors.endDate}
                  />
                </div>

                {/* Locations: Start & Destination */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      Start Origin <span className="text-[10px] text-slate-500 font-normal">(optional)</span>
                    </label>
                    <input
                      type="text"
                      value={startLocation}
                      onChange={(e) => setStartLocation(e.target.value)}
                      className="w-full h-10 rounded-xl border border-white/[0.1] bg-slate-950/80 px-3.5 text-white text-xs focus:border-emerald-500 focus:outline-none transition-colors"
                      placeholder="e.g. Mumbai, Bandra"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      Destination <span className="text-[10px] text-slate-500 font-normal">(optional)</span>
                    </label>
                    <input
                      type="text"
                      value={destination}
                      onChange={(e) => setDestination(e.target.value)}
                      className="w-full h-10 rounded-xl border border-white/[0.1] bg-slate-950/80 px-3.5 text-white text-xs focus:border-emerald-500 focus:outline-none transition-colors"
                      placeholder="e.g. Goa, Candolim"
                    />
                  </div>
                </div>

                {/* Distances: Estimated & Actual */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      Estimated Distance (km) <span className="text-[10px] text-slate-500 font-normal">(optional)</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={estimatedDistance}
                      onChange={(e) => {
                        setEstimatedDistance(e.target.value === '' ? '' : Number(e.target.value));
                        if (fieldErrors.estimatedDistance) setFieldErrors((prev) => { const n = { ...prev }; delete n.estimatedDistance; return n; });
                      }}
                      className="w-full h-10 rounded-xl border border-white/[0.1] bg-slate-950/80 px-3.5 text-white text-xs focus:border-emerald-500 focus:outline-none transition-colors font-mono"
                      placeholder="e.g. 580"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      Actual Distance (km) <span className="text-[10px] text-slate-500 font-normal">(optional)</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={actualDistance}
                      onChange={(e) => {
                        setActualDistance(e.target.value === '' ? '' : Number(e.target.value));
                        if (fieldErrors.actualDistance) setFieldErrors((prev) => { const n = { ...prev }; delete n.actualDistance; return n; });
                      }}
                      className="w-full h-10 rounded-xl border border-white/[0.1] bg-slate-950/80 px-3.5 text-white text-xs focus:border-emerald-500 focus:outline-none transition-colors font-mono"
                      placeholder="e.g. 605"
                    />
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Notes & Itinerary Details <span className="text-[10px] text-slate-500 font-normal">(optional)</span>
                  </label>
                  <textarea
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full rounded-xl border border-white/[0.1] bg-slate-950/80 p-3 text-white text-xs focus:border-emerald-500 focus:outline-none transition-colors"
                    placeholder="Route waypoints, overnight halt locations, scenic stops..."
                  />
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Participants & Itemized Expenses (5 Cols) */}
            <div className="lg:col-span-5 space-y-6">
              {/* + Add / Manage Participants Action Button */}
              <button
                type="button"
                onClick={() => setIsParticipantModalOpen(true)}
                className="w-full flex items-center justify-between p-3.5 sm:p-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/15 text-white transition-all shadow-md shadow-emerald-500/5 active:scale-[0.99] cursor-pointer group"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="h-8 w-8 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 group-hover:scale-105 transition-transform">
                    <Users className="h-4 w-4" />
                  </div>
                  <span className="text-xs sm:text-sm font-bold text-white truncate">
                    + Add / Manage Participants
                  </span>
                </div>
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shrink-0 ml-2">
                  {participants.length} {participants.length === 1 ? 'Traveler' : 'Travelers'}
                </span>
              </button>

              {/* EXPEDITION PARTICIPANTS MODAL */}
              <Modal
                isOpen={isParticipantModalOpen}
                onClose={() => setIsParticipantModalOpen(false)}
                title="Expedition Participants"
                subtitle="Add travelers joining this road trip to split expenses"
                icon={
                  <div className="h-9 w-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                    <Users className="h-4.5 w-4.5" />
                  </div>
                }
                size="md"
                footer={
                  <div className="w-full flex items-center justify-between">
                    <span className="text-xs text-slate-400 font-mono">
                      {participants.length} {participants.length === 1 ? 'Traveler registered' : 'Travelers registered'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsParticipantModalOpen(false)}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 px-4 py-2 text-xs font-bold text-slate-950 transition-all cursor-pointer shadow-md shadow-emerald-500/20 active:scale-95"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Done</span>
                    </button>
                  </div>
                }
              >
                <div className="space-y-4">
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Add travelers joining this expedition. Each traveler will automatically receive an equal balanced share row in the Splitwise section.
                  </p>

                  {/* Add Traveler Input Bar */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newParticipantName}
                      onChange={(e) => setNewParticipantName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddParticipant();
                        }
                      }}
                      placeholder="Traveler name (e.g. Alice, Rahul)..."
                      className="flex-1 h-10 rounded-xl border border-white/[0.1] bg-slate-950/80 px-3.5 text-xs text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none transition-colors"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={handleAddParticipant}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-4 py-2 text-xs font-bold transition-all shadow-md shadow-emerald-500/20 active:scale-95 cursor-pointer shrink-0"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Add</span>
                    </button>
                  </div>

                  {/* Participant List */}
                  <div className="space-y-2 max-h-60 sm:max-h-72 overflow-y-auto pr-1">
                    {participants.map((p, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 rounded-xl border border-white/[0.06] bg-slate-950/60 hover:border-white/[0.12] transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="h-8 w-8 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-xs font-bold text-emerald-400 shrink-0">
                            {p.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-white truncate">{p.name}</p>
                            {idx === 0 ? (
                              <span className="text-[10px] text-emerald-400 font-mono">Trip Organizer</span>
                            ) : (
                              <span className="text-[10px] text-slate-500">Participant #{idx + 1}</span>
                            )}
                          </div>
                        </div>

                        {participants.length > 1 && idx > 0 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveParticipant(idx)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                            title="Remove participant"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </Modal>

              {/* EXPENSES CARD */}
              <div className="rounded-2xl border border-white/[0.08] bg-slate-900/60 p-5 backdrop-blur-xl space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-emerald-400" />
                    <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                      Itemized Expenses
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white font-mono">
                      ₹{totalExpenseAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                    <button
                      type="button"
                      onClick={handleAddExpenseRow}
                      className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-400 px-2.5 py-1 text-xs font-semibold transition-colors cursor-pointer"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Add</span>
                    </button>
                  </div>
                </div>

                {/* Expense List */}
                <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                  {expenses.map((exp, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl border border-white/[0.05] bg-slate-950/40 space-y-2.5"
                    >
                      <div className="flex items-center gap-2">
                        {/* Category */}
                        <div className="relative flex-1">
                          <select
                            value={exp.category}
                            onChange={(e) => handleUpdateExpenseRow(idx, 'category', e.target.value)}
                            className="w-full h-8 appearance-none rounded-lg border border-white/[0.08] bg-slate-900 px-2.5 pr-6 text-xs text-white focus:outline-none cursor-pointer"
                          >
                            <option value="FUEL">⛽ Fuel</option>
                            <option value="FOOD">🍽️ Food</option>
                            <option value="TOLL">🛣️ Toll</option>
                            <option value="STAY">🏨 Stay</option>
                            <option value="OTHER">📦 Other</option>
                          </select>
                          <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                        </div>

                        {/* Amount */}
                        <div className="w-28">
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={exp.amount}
                            onChange={(e) =>
                              handleUpdateExpenseRow(
                                idx,
                                'amount',
                                e.target.value === '' ? '' : Math.max(0, parseFloat(e.target.value) || 0)
                              )
                            }
                            className="w-full h-8 rounded-lg border border-white/[0.08] bg-slate-900 px-2.5 text-xs text-white font-mono focus:outline-none"
                            placeholder="Amount ₹"
                          />
                        </div>

                        {/* Delete Row */}
                        <button
                          type="button"
                          onClick={() => handleRemoveExpenseRow(idx)}
                          className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                          title="Remove row"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      {/* Notes / Date sub-row */}
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="date"
                          value={exp.expenseDate}
                          onChange={(e) => handleUpdateExpenseRow(idx, 'expenseDate', e.target.value)}
                          className="h-7 rounded-lg border border-white/[0.06] bg-slate-900/60 px-2 text-[11px] text-white focus:outline-none [color-scheme:dark]"
                        />
                        <input
                          type="text"
                          value={exp.notes}
                          onChange={(e) => handleUpdateExpenseRow(idx, 'notes', e.target.value)}
                          placeholder="Note (optional)"
                          className="h-7 rounded-lg border border-white/[0.06] bg-slate-900/60 px-2 text-[11px] text-white placeholder:text-slate-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* QUICK SUMMARY CARD */}
              <div className="p-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Total Travelers:</span>
                  <span className="font-bold text-white">{participants.length}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Estimated Total Cost:</span>
                  <span className="font-bold text-emerald-400 font-mono text-sm">
                    ₹{totalExpenseAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="pt-2 border-t border-emerald-500/10 text-[11px] text-slate-400 flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                  <span>
                    Saving will open Splitwise with {participants.length} traveler {participants.length === 1 ? 'row' : 'rows'}.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}
