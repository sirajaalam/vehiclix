'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { api } from '../../lib/api';
import { Pagination } from '../../components/Pagination';
import { Modal, Button, Input, Select, DatePicker, SearchBar, Textarea } from '../../components/ui';
import {
  Compass,
  Plus,
  Trash2,
  Calendar,
  MapPin,
  Lock,
  Search,
  X,
  Filter,
  Edit2,
  Eye,
  Navigation,
  IndianRupee,
  CheckCircle2,
  Clock,
  ArrowRight,
  AlertTriangle,
  AlertCircle,
  Car,
  Milestone,
  ChevronDown,
  Receipt,
  Users,
} from 'lucide-react';

interface FormTripExpense {
  category: 'FUEL' | 'FOOD' | 'TOLL' | 'STAY' | 'OTHER';
  amount: number | string;
  expenseDate: string;
  notes: string;
}

interface TripParticipant {
  id?: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  isIncludedInSplit?: boolean;
}

interface Trip {
  id: string;
  userId?: string;
  vehicleId?: string | null;
  vehicleName?: string | null;
  title: string;
  startDate: string;
  endDate?: string | null;
  startLocation?: string | null;
  destination?: string | null;
  estimatedDistance?: number | null;
  actualDistance?: number | null;
  status: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED';
  splitExpenses: boolean;
  splitMethod?: string;
  notes?: string | null;
  totalExpenses?: number;
  participants?: TripParticipant[];
  expenses?: any[];
  createdAt?: string;
  updatedAt?: string;
}

interface Vehicle {
  id: string;
  name?: string;
  make?: string;
  model?: string;
  year?: number;
  registrationNumber?: string;
  licensePlate?: string;
  vehicleType?: string;
  energyType?: string;
  fuelType?: string;
}

// Auto-detect trip active status (PLANNED vs IN_PROGRESS) based on start date.
// Trips only become COMPLETED when explicitly marked as complete by the user.
export function deriveTripStatus(startDate: string): 'PLANNED' | 'IN_PROGRESS' {
  if (!startDate) return 'PLANNED';
  const now = new Date();

  // Normalize start date to beginning of day in local time
  const [sYear, sMonth, sDay] = startDate.split('T')[0].split('-').map(Number);
  const startDay = new Date(sYear, sMonth - 1, sDay, 0, 0, 0, 0);

  // If start date is in the future
  if (now.getTime() < startDay.getTime()) {
    return 'PLANNED';
  }

  return 'IN_PROGRESS';
}

export default function TripsPage() {
  const router = useRouter();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('ALL');
  const [selectedVehicleFilter, setSelectedVehicleFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(6);

  // Modal States
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);

  // Form State for Add / Edit
  const [formVehicleId, setFormVehicleId] = useState('');
  const [formTitle, setFormTitle] = useState('');
  const [formStartDate, setFormStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [formEndDate, setFormEndDate] = useState('');
  const [formStartLocation, setFormStartLocation] = useState('');
  const [formDestination, setFormDestination] = useState('');
  const [formEstimatedDistance, setFormEstimatedDistance] = useState<number | ''>('');
  const [formActualDistance, setFormActualDistance] = useState<number | ''>('');
  const [formSplitExpenses, setFormSplitExpenses] = useState(true);
  const [formParticipantNames, setFormParticipantNames] = useState('Alice, Bob, Charlie');
  const [formNotes, setFormNotes] = useState('');
  const [formExpenses, setFormExpenses] = useState<FormTripExpense[]>([]);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [completingTripId, setCompletingTripId] = useState<string | null>(null);
  const [loadingTripDetails, setLoadingTripDetails] = useState(false);

  const handleAddExpenseRow = () => {
    const defaultDate = formStartDate || new Date().toISOString().split('T')[0];
    setFormExpenses((prev) => [
      ...prev,
      { category: 'OTHER', amount: 0, expenseDate: defaultDate, notes: '' },
    ]);
  };

  const handleRemoveExpenseRow = (index: number) => {
    setFormExpenses((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateExpenseRow = (index: number, field: keyof FormTripExpense, value: any) => {
    setFormExpenses((prev) =>
      prev.map((exp, i) => (i === index ? { ...exp, [field]: value } : exp))
    );
  };

  const safeIsoDate = (val: any): string => {
    if (!val) return new Date().toISOString();
    const d = new Date(val);
    return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
  };

  const isTripEligibleForCompletion = (trip: Trip | null): boolean => {
    if (!trip || trip.status === 'COMPLETED') return false;
    const completionDateStr = trip.endDate
      ? trip.endDate.split('T')[0]
      : trip.startDate.split('T')[0];
    const todayStr = new Date().toISOString().split('T')[0];
    return todayStr > completionDateStr;
  };

  const handleMarkAsComplete = async (trip: Trip) => {
    setCompletingTripId(trip.id);
    try {
      await api.updateTrip(trip.id, { status: 'COMPLETED' });
      toast.success(`Trip "${trip.title}" marked as completed!`);
      setTrips((prev) =>
        prev.map((t) => (t.id === trip.id ? { ...t, status: 'COMPLETED' } : t))
      );
      if (selectedTrip?.id === trip.id) {
        setSelectedTrip((prev) => (prev ? { ...prev, status: 'COMPLETED' } : null));
      }
      await loadData();
    } catch (err: any) {
      console.error('Failed to mark trip as complete:', err);
      toast.error(err.message || 'Failed to mark trip as complete');
    } finally {
      setCompletingTripId(null);
    }
  };

  const loadData = async () => {
    try {
      const [vData, tData] = await Promise.all([api.listVehicles(), api.listTrips()]);
      const vehicleList: Vehicle[] = Array.isArray(vData) ? vData : [];
      setVehicles(vehicleList);

      const tripList: any[] = Array.isArray(tData) ? tData : [];
      const enriched = tripList.map((trip: any) => {
        const matchV = vehicleList.find((v: any) => v.id === trip.vehicleId);
        const isCompleted = trip.status === 'COMPLETED';
        return {
          ...trip,
          totalExpenses: Number(trip.totalExpenses) || 0,
          status: isCompleted ? 'COMPLETED' : deriveTripStatus(trip.startDate),
          vehicleName: matchV ? (matchV.name || `${matchV.make || ''} ${matchV.model || ''}`).trim() : null,
        };
      });
      setTrips(enriched);
    } catch (err: any) {
      console.error('Failed to load trips data:', err);
      toast.error(err.message || 'Failed to load trips');
      setVehicles([]);
      setTrips([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Helper to format vehicle label
  const getVehicleLabel = (v: Vehicle) => {
    const name = v.name || `${v.make || ''} ${v.model || ''}`.trim();
    const plate = v.registrationNumber || v.licensePlate;
    return plate ? `${name} (${plate})` : name;
  };

  // Telemetry Calculations
  const telemetry = useMemo(() => {
    const totalTrips = trips.length;
    const activeTrips = trips.filter((t) => t.status === 'IN_PROGRESS').length;
    const totalExpenses = trips.reduce((sum, t) => sum + (Number(t.totalExpenses) || 0), 0);
    const totalDistance = trips.reduce((sum, t) => {
      const dist = t.actualDistance != null ? Number(t.actualDistance) : Number(t.estimatedDistance) || 0;
      return sum + dist;
    }, 0);

    return { totalTrips, activeTrips, totalExpenses, totalDistance };
  }, [trips]);

  // Filtering Logic
  const filteredTrips = useMemo(() => {
    return trips.filter((trip) => {
      // 1. Status Filter
      if (selectedStatusFilter !== 'ALL' && trip.status !== selectedStatusFilter) {
        return false;
      }

      // 2. Vehicle Filter
      if (selectedVehicleFilter !== 'ALL') {
        if (trip.vehicleId !== selectedVehicleFilter) return false;
      }

      // 3. Search Query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const titleMatch = trip.title.toLowerCase().includes(query);
        const startMatch = (trip.startLocation || '').toLowerCase().includes(query);
        const destMatch = (trip.destination || '').toLowerCase().includes(query);
        const notesMatch = (trip.notes || '').toLowerCase().includes(query);
        const vehicleMatch = (trip.vehicleName || '').toLowerCase().includes(query);
        const partMatch = (trip.participants || []).some((p) => p.name.toLowerCase().includes(query));

        if (!titleMatch && !startMatch && !destMatch && !notesMatch && !vehicleMatch && !partMatch) {
          return false;
        }
      }

      return true;
    });
  }, [trips, selectedStatusFilter, selectedVehicleFilter, searchQuery]);

  // Pagination Logic
  const totalPages = Math.ceil(filteredTrips.length / pageSize) || 1;
  const paginatedTrips = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredTrips.slice(start, start + pageSize);
  }, [filteredTrips, currentPage, pageSize]);

  // Reset pagination on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedStatusFilter, selectedVehicleFilter, pageSize]);

  // Navigation Handlers
  const openAddModal = () => {
    router.push('/trips/new');
  };

  const openEditModal = (trip: Trip) => {
    if (trip.status === 'COMPLETED') {
      toast.error('Completed trips are finalized and cannot be edited.');
      return;
    }
    router.push(`/trips/${trip.id}/edit`);
  };

  const openViewModal = async (trip: Trip) => {
    setSelectedTrip(trip);
    setShowViewModal(true);
    setLoadingTripDetails(true);
    try {
      const fullTrip = await api.getTrip(trip.id);
      setSelectedTrip((prev) => (prev && prev.id === trip.id ? { ...prev, ...fullTrip } : prev));
    } catch (e) {
      console.error('Failed to load full trip details:', e);
    } finally {
      setLoadingTripDetails(false);
    }
  };

  const openDeleteModal = (trip: Trip) => {
    setSelectedTrip(trip);
    setShowDeleteModal(true);
  };

  // Delete Trip
  const handleDeleteTrip = async () => {
    if (!selectedTrip) return;
    setSubmitting(true);
    try {
      await api.deleteTrip(selectedTrip.id);
      toast.success('Trip removed');
      setTrips((prev) => prev.filter((t) => t.id !== selectedTrip.id));
      setShowDeleteModal(false);
      setSelectedTrip(null);
      await loadData();
    } catch (err: any) {
      console.error('Failed to delete trip from database:', err);
      toast.error(err.message || 'Failed to delete trip from database.');
    } finally {
      setSubmitting(false);
    }
  };

  // Status Badge Component
  const renderStatusBadge = (status: Trip['status']) => {
    switch (status) {
      case 'IN_PROGRESS':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            In Progress
          </span>
        );
      case 'PLANNED':
        return (
          <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-medium border border-blue-500/30 bg-blue-500/10 text-blue-400">
            <Clock className="h-3 w-3" />
            Planned
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-medium border border-white/[0.1] bg-slate-800/80 text-slate-300">
            <CheckCircle2 className="h-3 w-3 text-emerald-400" />
            Completed
          </span>
        );
    }
  };

  const hasActiveFilters = searchQuery !== '' || selectedStatusFilter !== 'ALL' || selectedVehicleFilter !== 'ALL';

  return (
    <div className="mx-auto max-w-7xl px-3.5 py-4 pb-24 sm:px-6 sm:py-8 sm:pb-12 lg:px-8 space-y-5 sm:space-y-8">
      {/* Page Header */}
      <div className="border-b border-white/[0.08] pb-3.5 sm:pb-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
            <h1 className="text-lg sm:text-2xl font-bold tracking-tight text-white truncate">
              Road Trips
            </h1>
            <span className="rounded-full bg-emerald-500/10 px-2 sm:px-2.5 py-0.5 text-[11px] sm:text-xs font-semibold text-emerald-400 border border-emerald-500/20 shrink-0">
              <span className="sm:hidden">{trips.length}</span>
              <span className="hidden sm:inline">{trips.length} {trips.length === 1 ? 'Trip' : 'Trips'}</span>
            </span>
          </div>

          {/* Action Button: Refined Apple pill button matching garage and fuel pages in responsive mode */}
          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-1.5 sm:gap-2 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold shadow-[0_2px_12px_rgba(16,185,129,0.3)] transition-all cursor-pointer active:scale-95 shrink-0"
          >
            <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4 stroke-[2.5]" />
            <span>Plan Trip</span>
          </button>
        </div>

        <p className="hidden sm:block mt-1.5 text-xs sm:text-sm text-slate-400 max-w-2xl leading-relaxed">
          Coordinate multi-destination road trips, assign registered garage vehicles, and balance group shared costs.
        </p>
      </div>

      {/* Mandatory Garage Vehicle Onboarding Banner (if no registered vehicles in garage) */}
      {!loading && vehicles.length === 0 && (
        <div className="flex items-center justify-between gap-3 p-3.5 sm:p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-300">
          <div className="flex items-center gap-2.5 min-w-0">
            <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 shrink-0 text-amber-400" />
            <div>
              <p className="font-semibold text-white text-xs sm:text-sm">No registered vehicles found in your garage</p>
              <p className="text-[11px] sm:text-xs text-amber-200/80">You must register at least one vehicle in your Garage before planning trips.</p>
            </div>
          </div>
          <Link
            href="/garage"
            className="inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-lg bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-400 transition-colors shrink-0 shadow-sm cursor-pointer"
          >
            <Car className="h-3.5 w-3.5" /> Go to Garage
          </Link>
        </div>
      )}

      {/* Telemetry Cards: Horizontal Snap Reel on Mobile, 4-Column Grid on Desktop */}
      <div className="flex items-stretch gap-2.5 overflow-x-auto no-scrollbar snap-x snap-mandatory -mx-3.5 px-3.5 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:gap-4 pb-1 sm:pb-0">
        {/* Total Trips */}
        <div className="min-w-[150px] w-[45%] sm:w-auto shrink-0 snap-start rounded-2xl border border-white/[0.08] bg-slate-900/50 p-3 sm:p-4.5 shadow-[0_2px_8px_rgba(0,0,0,0.35)] backdrop-blur-md flex flex-col justify-between hover:border-white/[0.14] transition-all">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider truncate">Total Expeditions</span>
            <div className="p-1 sm:p-1.5 rounded-lg bg-violet-500/10 border border-violet-500/20 text-violet-400 shrink-0">
              <Compass className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
            </div>
          </div>
          <p className="mt-1.5 sm:mt-2 text-base sm:text-2xl font-black tracking-tight text-white truncate">{telemetry.totalTrips}</p>
          <p className="hidden sm:block mt-0.5 text-xs text-slate-500 truncate">Logged in trip history</p>
        </div>

        {/* Active Trips */}
        <div className="min-w-[150px] w-[45%] sm:w-auto shrink-0 snap-start rounded-2xl border border-white/[0.08] bg-slate-900/50 p-3 sm:p-4.5 shadow-[0_2px_8px_rgba(0,0,0,0.35)] backdrop-blur-md flex flex-col justify-between hover:border-white/[0.14] transition-all">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider truncate">Active On-Road</span>
            <div className="p-1 sm:p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shrink-0">
              <Navigation className="h-3 w-3 sm:h-3.5 sm:w-3.5 animate-spin-slow" />
            </div>
          </div>
          <p className="mt-1.5 sm:mt-2 text-base sm:text-2xl font-black tracking-tight text-emerald-400 truncate">{telemetry.activeTrips}</p>
          <p className="hidden sm:block mt-0.5 text-xs text-slate-500 truncate">Currently in progress</p>
        </div>

        {/* Trip Expenses */}
        <div className="min-w-[150px] w-[45%] sm:w-auto shrink-0 snap-start rounded-2xl border border-white/[0.08] bg-slate-900/50 p-3 sm:p-4.5 shadow-[0_2px_8px_rgba(0,0,0,0.35)] backdrop-blur-md flex flex-col justify-between hover:border-white/[0.14] transition-all">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider truncate">Trip Expenses</span>
            <div className="p-1 sm:p-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 shrink-0">
              <Receipt className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
            </div>
          </div>
          <p className="mt-1.5 sm:mt-2 text-base sm:text-2xl font-black tracking-tight text-white truncate">
            ₹{telemetry.totalExpenses.toLocaleString('en-IN')}
          </p>
          <p className="hidden sm:block mt-0.5 text-xs text-slate-500 truncate">Total trip expenses logged</p>
        </div>

        {/* Total Distance */}
        <div className="min-w-[150px] w-[45%] sm:w-auto shrink-0 snap-start rounded-2xl border border-white/[0.08] bg-slate-900/50 p-3 sm:p-4.5 shadow-[0_2px_8px_rgba(0,0,0,0.35)] backdrop-blur-md flex flex-col justify-between hover:border-white/[0.14] transition-all">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider truncate">Distance</span>
            <div className="p-1 sm:p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 shrink-0">
              <Milestone className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
            </div>
          </div>
          <p className="mt-1.5 sm:mt-2 text-base sm:text-2xl font-black tracking-tight text-amber-400 truncate">
            {telemetry.totalDistance.toLocaleString()} <span className="text-xs font-normal text-slate-400">km</span>
          </p>
          <p className="hidden sm:block mt-0.5 text-xs text-slate-500 truncate">Total distance logged</p>
        </div>
      </div>

      {/* Apple-Grade Dual Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Row 1: Search Bar */}
        <SearchBar
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onClear={() => setSearchQuery('')}
          placeholder="Search trips by destination, route, vehicle..."
        />

        {/* Row 2: Companion Dropdowns */}
        <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
          {/* Status Dropdown */}
          <div className="flex-1 sm:flex-initial min-w-[130px] sm:min-w-[150px]">
            <Select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              leftIcon={<Filter className={`h-3.5 w-3.5 ${selectedStatusFilter !== 'ALL' ? 'text-emerald-400' : 'text-slate-400'}`} />}
              options={[
                { value: 'ALL', label: 'All Expeditions' },
                { value: 'IN_PROGRESS', label: 'In Progress' },
                { value: 'PLANNED', label: 'Planned' },
                { value: 'COMPLETED', label: 'Completed' },
              ]}
            />
          </div>

          {/* Vehicle Dropdown */}
          <div className="flex-1 sm:flex-initial min-w-[140px] sm:min-w-[180px]">
            <Select
              value={selectedVehicleFilter}
              onChange={(e) => setSelectedVehicleFilter(e.target.value)}
              leftIcon={<Car className={`h-3.5 w-3.5 ${selectedVehicleFilter !== 'ALL' ? 'text-emerald-400' : 'text-slate-400'}`} />}
            >
              <option value="ALL">All Vehicles</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {getVehicleLabel(v)}
                </option>
              ))}
            </Select>
          </div>

          {/* Reset button if filter active */}
          {hasActiveFilters && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedStatusFilter('ALL');
                setSelectedVehicleFilter('ALL');
              }}
              className="h-10 px-3 rounded-xl border border-white/[0.08] bg-slate-900/60 hover:bg-slate-800 text-slate-400 hover:text-white text-xs font-medium transition-all shrink-0 flex items-center gap-1.5 cursor-pointer"
              title="Reset all filters"
            >
              <X className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Trips Cards Grid */}
      {loading ? (
        <div className="py-20 text-center text-sm text-slate-400">
          <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent mb-3" />
          <p>Syncing expedition telemetry...</p>
        </div>
      ) : filteredTrips.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/[0.1] p-12 text-center bg-slate-900/30 backdrop-blur-sm">
          <Compass className="mx-auto h-12 w-12 text-slate-600 mb-3" />
          <h3 className="text-base font-semibold text-white tracking-tight">No road trips found</h3>
          <p className="mt-1 text-xs text-slate-400 max-w-sm mx-auto">
            {hasActiveFilters
              ? 'No trips match the current filter or search criteria. Try adjusting or clearing your filters.'
              : vehicles.length === 0
              ? 'You have not registered any vehicles yet. Add a vehicle to your garage to plan your first road trip.'
              : 'You have not created any expeditions yet. Plan your first road trip to start sharing expenses and routes.'}
          </p>
          {hasActiveFilters ? (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedStatusFilter('ALL');
                setSelectedVehicleFilter('ALL');
              }}
              className="mt-4 inline-flex items-center gap-1.5 text-xs text-emerald-400 hover:underline cursor-pointer"
            >
              Clear all filters
            </button>
          ) : vehicles.length === 0 ? (
            <Link
              href="/garage"
              className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-slate-950 shadow-sm hover:bg-amber-400 transition-all cursor-pointer"
            >
              <Car className="h-3.5 w-3.5" /> Register Vehicle First
            </Link>
          ) : (
            <button
              onClick={openAddModal}
              className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 px-4 py-2 text-xs font-semibold text-slate-950 shadow-sm hover:bg-emerald-400 transition-all cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" /> Plan First Trip
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {paginatedTrips.map((trip) => {
            const isCompleted = trip.status === 'COMPLETED';
            const distance = trip.actualDistance != null ? trip.actualDistance : trip.estimatedDistance;

            return (
              <div
                key={trip.id}
                className="group rounded-2xl border border-white/[0.08] bg-slate-900/50 p-5 sm:p-6 flex flex-col justify-between hover:border-white/[0.16] hover:bg-slate-900/70 transition-all shadow-[0_4px_16px_rgba(0,0,0,0.35)] relative overflow-hidden"
              >
                {/* Subtle top indicator bar */}
                <div
                  className={`absolute top-0 left-0 right-0 h-1 ${
                    trip.status === 'IN_PROGRESS'
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                      : trip.status === 'PLANNED'
                      ? 'bg-gradient-to-r from-blue-500 to-indigo-400'
                      : 'bg-gradient-to-r from-slate-700 to-slate-600'
                  }`}
                />

                <div className="space-y-3.5">
                  {/* Status & Vehicle Tag */}
                  <div className="flex items-center justify-between gap-2">
                    {renderStatusBadge(trip.status)}

                    {trip.vehicleName && (
                      <span className="inline-flex items-center gap-1 rounded-md bg-white/[0.05] border border-white/[0.08] px-2 py-0.5 text-[10px] text-slate-300 font-medium truncate max-w-[150px]">
                        <Car className="h-3 w-3 text-slate-400 shrink-0" />
                        <span className="truncate">{trip.vehicleName}</span>
                      </span>
                    )}

                    {isCompleted && (
                      <span className="flex items-center gap-1 text-[10px] text-slate-500 ml-auto" title="Completed trip ledger is locked">
                        <Lock className="h-3 w-3" /> Locked
                      </span>
                    )}
                  </div>

                  {/* Title & Route */}
                  <div>
                    <h3
                      onClick={() => openViewModal(trip)}
                      className="text-base font-bold text-white tracking-tight group-hover:text-emerald-400 transition-colors cursor-pointer line-clamp-1"
                      title={trip.title}
                    >
                      {trip.title}
                    </h3>

                    {(trip.startLocation || trip.destination) && (
                      <div className="mt-1.5 flex items-center gap-1.5 text-xs text-slate-400">
                        <MapPin className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                        <span className="truncate">
                          {trip.startLocation || 'Origin'} <ArrowRight className="inline h-2.5 w-2.5 mx-0.5 text-slate-500" />{' '}
                          {trip.destination || 'Destination'}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Trip Meta: Dates & Distance */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/[0.06] text-xs">
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <Calendar className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                      <span className="truncate">
                        {new Date(trip.startDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                        {trip.endDate && ` - ${new Date(trip.endDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}`}
                      </span>
                    </div>

                    {distance != null && (
                      <div className="flex items-center gap-1.5 text-slate-400 justify-end">
                        <Milestone className="h-3.5 w-3.5 text-amber-400/80 shrink-0" />
                        <span>{distance} km</span>
                      </div>
                    )}
                  </div>

                  {/* Expenses Badge */}
                  <div className="flex items-center justify-between pt-2 text-xs">
                    <div className="flex items-center gap-1 text-slate-400">
                      <IndianRupee className="h-3.5 w-3.5 text-emerald-400" />
                      <span className="font-semibold text-white">
                        ₹{(trip.totalExpenses || 0).toLocaleString('en-IN')}
                      </span>
                      <span className="text-[10px] text-slate-500">expenses</span>
                    </div>
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div className="mt-5 pt-3.5 border-t border-white/[0.06] flex items-center justify-between gap-2">
                  {/* Left Actions: Details & Split */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openViewModal(trip)}
                      className="apple-btn inline-flex items-center gap-1.5 rounded-xl border border-white/[0.08] bg-slate-800/60 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      <Eye className="h-3.5 w-3.5 text-slate-400" />
                      <span>Details</span>
                    </button>

                    <Link
                      href={`/trips/${trip.id}/split`}
                      className="apple-btn inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/20 transition-colors cursor-pointer"
                      title="Split Trip Expenses"
                    >
                      <Users className="h-3.5 w-3.5" />
                      <span>Split</span>
                    </Link>
                  </div>

                  {/* Right Actions: Edit, Delete */}
                  <div className="flex items-center gap-1">
                    {trip.status !== 'COMPLETED' && (
                      <button
                        onClick={() => openEditModal(trip)}
                        className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-white/[0.06] transition-colors cursor-pointer"
                        title="Edit Trip Details"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                    )}

                    <button
                      onClick={() => openDeleteModal(trip)}
                      className="text-slate-500 hover:text-red-400 p-1.5 rounded-lg hover:bg-red-500/10 transition-colors cursor-pointer"
                      title="Delete Trip"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {!loading && filteredTrips.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredTrips.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
          itemLabel="expeditions"
        />
      )}



      {/* ========================================================================= */}
      {/* 3. QUICK VIEW DETAILS MODAL (Landscape 2-Column with Fixed Header & Footer) */}
      {/* ========================================================================= */}
      {showViewModal && selectedTrip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-6 overflow-hidden">
          <div className="w-full max-w-3xl lg:max-w-4xl max-h-[90vh] rounded-[20px] border border-white/[0.12] bg-slate-900/95 shadow-2xl backdrop-blur-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* FIXED HEADER */}
            <div className="flex items-center justify-between border-b border-white/[0.06] px-6 py-4.5 bg-slate-900/90 flex-shrink-0">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  {renderStatusBadge(selectedTrip.status)}
                  {selectedTrip.vehicleName && (
                    <span className="inline-flex items-center gap-1 rounded-md bg-white/[0.05] border border-white/[0.08] px-2 py-0.5 text-[10px] text-slate-300">
                      <Car className="h-3 w-3 text-slate-400" />
                      {selectedTrip.vehicleName}
                    </span>
                  )}
                  {selectedTrip.status === 'COMPLETED' && (
                    <span className="flex items-center gap-1 text-[10px] text-slate-500" title="Completed trip ledger is locked">
                      <Lock className="h-3 w-3" /> Locked
                    </span>
                  )}
                </div>
                <h2 className="text-xl font-bold text-white tracking-tight">{selectedTrip.title}</h2>
              </div>
              <button
                onClick={() => {
                  setShowViewModal(false);
                  setSelectedTrip(null);
                }}
                className="rounded-full p-2 text-slate-400 hover:bg-white/[0.08] hover:text-white transition-colors cursor-pointer"
                title="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* SCROLLABLE BODY */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin text-xs">
              {/* Route Visualizer Card */}
              <div className="rounded-2xl border border-white/[0.08] bg-slate-950/60 p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Route Trajectory</span>
                  <span className="text-xs text-slate-400 font-mono">
                    {selectedTrip.actualDistance != null
                      ? `${selectedTrip.actualDistance} km (actual distance)`
                      : selectedTrip.estimatedDistance != null
                      ? `${selectedTrip.estimatedDistance} km (estimated)`
                      : 'Distance not recorded'}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4 pt-1">
                  <div className="flex items-center gap-2.5">
                    <div className="h-3.5 w-3.5 rounded-full bg-emerald-500/20 border-2 border-emerald-400" />
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase font-semibold">Origin</p>
                      <p className="text-sm font-bold text-white">{selectedTrip.startLocation || 'Origin'}</p>
                    </div>
                  </div>

                  <div className="flex-1 flex items-center justify-center px-4">
                    <div className="w-full h-px border-t border-dashed border-white/[0.2] relative">
                      <Navigation className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-4 w-4 text-emerald-400" />
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <div className="h-3.5 w-3.5 rounded-full bg-blue-500/20 border-2 border-blue-400" />
                    <div className="text-right">
                      <p className="text-[10px] text-slate-500 uppercase font-semibold">Destination</p>
                      <p className="text-sm font-bold text-white">{selectedTrip.destination || 'Destination'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 2-Column Detail Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Left: Schedule & Expenses */}
                <div className="space-y-3">
                  <div className="rounded-xl border border-white/[0.08] bg-slate-950/50 p-4 space-y-1">
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold block">Expedition Window</span>
                    <div className="flex items-center gap-2 text-white font-medium text-xs">
                      <Calendar className="h-4 w-4 text-slate-400 shrink-0" />
                      <span>
                        {new Date(selectedTrip.startDate).toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                        {selectedTrip.endDate && ` → ${new Date(selectedTrip.endDate).toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}`}
                      </span>
                    </div>
                  </div>

                  <div className="rounded-xl border border-white/[0.08] bg-slate-950/50 p-4 space-y-1">
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold block">Total Expenses</span>
                    <div className="flex items-center gap-2">
                      <IndianRupee className="h-4 w-4 text-emerald-400 shrink-0" />
                      <span className="text-base font-bold text-white font-mono">
                        ₹{(selectedTrip.totalExpenses || 0).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: Route Notes */}
                <div className="space-y-3">
                  {selectedTrip.notes ? (
                    <div className="rounded-xl border border-white/[0.08] bg-slate-950/50 p-4 space-y-1">
                      <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold block">Highlights & Notes</span>
                      <p className="text-xs text-slate-300 leading-relaxed">{selectedTrip.notes}</p>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-white/[0.08] bg-slate-950/50 p-4 text-xs text-slate-500">
                      No additional trip highlights logged.
                    </div>
                  )}
                </div>
              </div>

              {/* Itemized Trip Expenses List */}
              <div className="rounded-2xl border border-white/[0.08] bg-[#0c121e]/90 p-4 sm:p-5 space-y-3 shadow-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center justify-center h-5 w-6 rounded border border-white/[0.15] bg-slate-800 text-[11px] font-semibold text-slate-300">
                      $
                    </div>
                    <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                      Itemized Expenses
                    </span>
                    {selectedTrip.expenses && selectedTrip.expenses.length > 0 && (
                      <span className="rounded-full bg-white/[0.06] border border-white/[0.08] px-2 py-0.5 text-[10px] text-slate-400 font-medium">
                        {selectedTrip.expenses.length} {selectedTrip.expenses.length === 1 ? 'item' : 'items'}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-xs font-bold text-emerald-400 font-mono">
                      Total: ₹{(selectedTrip.totalExpenses || 0).toLocaleString('en-IN')}
                    </div>
                    <Link
                      href={`/trips/${selectedTrip.id}/split`}
                      className="inline-flex items-center gap-1 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                    >
                      <Users className="h-3 w-3" />
                      <span>Split</span>
                    </Link>
                  </div>
                </div>

                {loadingTripDetails ? (
                  <div className="py-6 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
                    <span>Loading expenses...</span>
                  </div>
                ) : selectedTrip.expenses && selectedTrip.expenses.length > 0 ? (
                  <div className="overflow-x-auto no-scrollbar">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-white/[0.06] text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                          <th className="pb-2.5 font-medium">Category</th>
                          <th className="pb-2.5 font-medium">Date</th>
                          <th className="pb-2.5 font-medium">Notes</th>
                          <th className="pb-2.5 font-medium text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/[0.04]">
                        {selectedTrip.expenses.map((exp: any, i: number) => {
                          const categoryLabels: Record<string, { label: string; icon: string; badge: string }> = {
                            FUEL: { label: 'Fuel', icon: '⛽', badge: 'text-amber-400 bg-amber-400/10 border-amber-400/20' },
                            FOOD: { label: 'Food', icon: '🍽️', badge: 'text-orange-400 bg-orange-400/10 border-orange-400/20' },
                            TOLL: { label: 'Toll', icon: '🛣️', badge: 'text-blue-400 bg-blue-400/10 border-blue-400/20' },
                            STAY: { label: 'Stay', icon: '🏨', badge: 'text-purple-400 bg-purple-400/10 border-purple-400/20' },
                            OTHER: { label: 'Other', icon: '📦', badge: 'text-slate-400 bg-slate-400/10 border-slate-400/20' },
                          };
                          const cat = categoryLabels[exp.category] || categoryLabels.OTHER;
                          const expDate = exp.expenseDate
                            ? new Date(exp.expenseDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })
                            : '—';

                          return (
                            <tr key={exp.id || i} className="hover:bg-white/[0.02] transition-colors">
                              <td className="py-2.5">
                                <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg border text-[11px] font-medium ${cat.badge}`}>
                                  <span>{cat.icon}</span>
                                  <span>{cat.label}</span>
                                </span>
                              </td>
                              <td className="py-2.5 text-slate-400">{expDate}</td>
                              <td className="py-2.5 text-slate-300 max-w-[200px] truncate">{exp.notes || '—'}</td>
                              <td className="py-2.5 text-right font-semibold text-white font-mono">
                                ₹{Number(exp.amount).toLocaleString('en-IN')}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="rounded-xl border border-white/[0.04] bg-slate-950/40 p-4 text-center text-xs text-slate-500">
                    No itemized expenses logged for this expedition.
                  </div>
                )}
              </div>
            </div>

            {/* FIXED FOOTER */}
            <div className="flex items-center justify-between border-t border-white/[0.08] px-6 py-4 bg-slate-900/90 flex-shrink-0">
              <Link
                href={`/trips/${selectedTrip.id}/split`}
                className="apple-btn inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-2 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/20 transition-colors cursor-pointer"
              >
                <Users className="h-3.5 w-3.5" />
                <span>Split Expenses</span>
              </Link>

              <div className="flex items-center gap-2">
                {isTripEligibleForCompletion(selectedTrip) && (
                  <button
                    type="button"
                    onClick={() => handleMarkAsComplete(selectedTrip)}
                    disabled={completingTripId === selectedTrip.id}
                    className="apple-btn inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-2 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/20 transition-colors cursor-pointer disabled:opacity-50"
                    title="Mark Trip as Complete"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    {completingTripId === selectedTrip.id ? 'Completing...' : 'Mark as Complete Trip'}
                  </button>
                )}

                {selectedTrip.status !== 'COMPLETED' && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowViewModal(false);
                      openEditModal(selectedTrip);
                    }}
                    className="apple-btn inline-flex items-center gap-1.5 rounded-xl border border-white/[0.1] bg-slate-800 px-3.5 py-2 text-xs font-medium text-slate-200 hover:bg-slate-700 transition-colors cursor-pointer"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                    Edit
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. DELETE CONFIRMATION DIALOG                                             */}
      {/* ========================================================================= */}
      <Modal
        isOpen={showDeleteModal && selectedTrip !== null}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedTrip(null);
        }}
        title="Delete Road Trip"
        subtitle="This action cannot be undone"
        icon={
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-2 text-red-400 shrink-0">
            <AlertTriangle className="h-5 w-5" />
          </div>
        }
        size="md"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                setShowDeleteModal(false);
                setSelectedTrip(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              disabled={submitting}
              isLoading={submitting}
              loadingText="Deleting..."
              leftIcon={<Trash2 className="h-3.5 w-3.5" />}
              onClick={handleDeleteTrip}
            >
              Delete Expedition
            </Button>
          </>
        }
      >
        {selectedTrip && (
          <p className="text-xs text-slate-300 leading-relaxed">
            Are you sure you want to permanently delete expedition{' '}
            <strong className="text-white font-semibold">"{selectedTrip.title}"</strong>? All associated split records and
            expenses will be unlinked.
          </p>
        )}
      </Modal>
    </div>
  );
}
