'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { api } from '../../lib/api';
import {
  Fuel,
  Plus,
  Trash2,
  Zap,
  TrendingUp,
  Search,
  X,
  Eye,
  Edit2,
  Calendar,
  Gauge,
  MapPin,
  FileText,
  AlertTriangle,
  AlertCircle,
  Car,
  ChevronDown,
  Check,
} from 'lucide-react';
import { Pagination } from '../../components/Pagination';
import { Modal, Button, Input, Select, DateTimePicker, SearchBar, Textarea } from '../../components/ui';

interface Vehicle {
  id: string;
  name: string;
  make?: string | null;
  model?: string | null;
  licensePlate?: string | null;
  vehicleType: string;
  fuelType: string;
  tankCapacity?: number | null;
}

interface FuelEntry {
  id: string;
  vehicleId: string;
  entryDate: string;
  quantity: number;
  unit: string;
  pricePerUnit: number;
  totalAmount: number;
  fuelType: string;
  odometer?: number | null;
  stationName?: string | null;
  notes?: string | null;
  createdAt?: string;
  updatedAt?: string;
  vehicle?: Vehicle;
}

export default function FuelPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [entries, setEntries] = useState<FuelEntry[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Filters & Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVehicleFilter, setSelectedVehicleFilter] = useState('ALL');
  const [selectedEnergyFilter, setSelectedEnergyFilter] = useState<'ALL' | 'PETROL' | 'DIESEL' | 'ELECTRIC' | 'CNG'>('ALL');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(6);

  // Modals State
  const [showAddModal, setShowAddModal] = useState(false);
  const [viewingEntry, setViewingEntry] = useState<FuelEntry | null>(null);
  const [editingEntry, setEditingEntry] = useState<FuelEntry | null>(null);
  const [deletingEntry, setDeletingEntry] = useState<FuelEntry | null>(null);

  // Input Entry Mode: 'AMOUNT' (e.g. ₹2,000) or 'QUANTITY' (e.g. 20 L)
  const [inputMode, setInputMode] = useState<'AMOUNT' | 'QUANTITY'>('AMOUNT');

  // Form State for Add / Edit
  const [formData, setFormData] = useState({
    vehicleId: '',
    quantity: '' as number | '',
    unit: 'LITRE',
    pricePerUnit: '' as number | '',
    totalAmount: '' as number | '',
    fuelType: 'PETROL',
    odometer: '' as number | '',
    stationName: '',
    entryDate: new Date().toISOString().slice(0, 16), // YYYY-MM-DDTHH:mm
    notes: '',
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  // Reset page when filter or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedVehicleFilter, selectedEnergyFilter]);

  const loadData = async () => {
    try {
      const [vData, fData, sData] = await Promise.all([
        api.listVehicles(),
        api.listFuel(),
        api.getFuelStats(),
      ]);
      const rawFuel = Array.isArray(fData) ? fData : [];
      const sortedFuel = [...rawFuel].sort((a, b) => {
        const timeA = new Date(a.entryDate || a.createdAt || 0).getTime();
        const timeB = new Date(b.entryDate || b.createdAt || 0).getTime();
        if (timeB !== timeA) return timeB - timeA;
        const createdA = new Date(a.createdAt || 0).getTime();
        const createdB = new Date(b.createdAt || 0).getTime();
        return createdB - createdA;
      });
      setVehicles(Array.isArray(vData) ? vData : []);
      setEntries(sortedFuel);
      setStats(sData || null);
    } catch (err: any) {
      console.error('Failed to load fuel data:', err);
      toast.error(err.message || 'Failed to load fuel records');
      setVehicles([]);
      setEntries([]);
      setStats(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Map vehicle details to fuel entries with guaranteed newest-first descending sort
  const enrichedEntries = useMemo(() => {
    const sorted = [...entries].sort((a, b) => {
      const timeA = new Date(a.entryDate || a.createdAt || 0).getTime();
      const timeB = new Date(b.entryDate || b.createdAt || 0).getTime();
      if (timeB !== timeA) return timeB - timeA;
      const createdA = new Date(a.createdAt || 0).getTime();
      const createdB = new Date(b.createdAt || 0).getTime();
      return createdB - createdA;
    });

    return sorted.map((entry) => {
      const v = vehicles.find((veh) => veh.id === entry.vehicleId);
      return {
        ...entry,
        vehicle: v,
      };
    });
  }, [entries, vehicles]);

  // Multi-dimensional filtered entries
  const filteredEntries = useMemo(() => {
    return enrichedEntries.filter((entry) => {
      // 1. Vehicle filter
      if (selectedVehicleFilter !== 'ALL' && entry.vehicleId !== selectedVehicleFilter) {
        return false;
      }

      // 2. Energy type filter
      if (selectedEnergyFilter !== 'ALL' && entry.fuelType !== selectedEnergyFilter) {
        return false;
      }

      // 3. Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const vehicleName = entry.vehicle?.name?.toLowerCase() || '';
        const vehiclePlate = entry.vehicle?.licensePlate?.toLowerCase() || '';
        const station = entry.stationName?.toLowerCase() || '';
        const notes = entry.notes?.toLowerCase() || '';
        const dateStr = new Date(entry.entryDate).toLocaleDateString('en-GB');

        const matches =
          vehicleName.includes(q) ||
          vehiclePlate.includes(q) ||
          station.includes(q) ||
          notes.includes(q) ||
          dateStr.includes(q);

        if (!matches) return false;
      }

      return true;
    });
  }, [enrichedEntries, selectedVehicleFilter, selectedEnergyFilter, searchQuery]);

  // Paginated entries
  const totalPages = Math.ceil(filteredEntries.length / pageSize) || 1;
  const paginatedEntries = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredEntries.slice(start, start + pageSize);
  }, [filteredEntries, currentPage, pageSize]);

  // Bidirectional Synchronization Helpers for Amount (₹) vs Quantity (L/kg/kWh)
  const handleAmountChange = (amountVal: number | '') => {
    if (amountVal === '' || isNaN(amountVal)) {
      setFormData((prev) => ({
        ...prev,
        totalAmount: '',
        quantity: prev.pricePerUnit ? '' : prev.quantity,
      }));
      return;
    }
    const rate = Number(formData.pricePerUnit) || 0;
    const computedQty = rate > 0 ? Math.round((amountVal / rate) * 100) / 100 : '';
    setFormData((prev) => ({
      ...prev,
      totalAmount: amountVal,
      quantity: computedQty !== '' ? computedQty : prev.quantity,
    }));
  };

  const handleQuantityChange = (qtyVal: number | '') => {
    if (qtyVal === '' || isNaN(qtyVal)) {
      setFormData((prev) => ({
        ...prev,
        quantity: '',
        totalAmount: prev.pricePerUnit ? '' : prev.totalAmount,
      }));
      return;
    }
    const rate = Number(formData.pricePerUnit) || 0;
    const computedTotal = rate > 0 ? Math.round(qtyVal * rate * 100) / 100 : '';
    setFormData((prev) => ({
      ...prev,
      quantity: qtyVal,
      totalAmount: computedTotal !== '' ? computedTotal : prev.totalAmount,
    }));
  };

  const handlePriceChange = (priceVal: number | '') => {
    if (priceVal === '' || isNaN(priceVal)) {
      setFormData((prev) => ({
        ...prev,
        pricePerUnit: '',
      }));
      return;
    }
    if (inputMode === 'AMOUNT') {
      const amt = Number(formData.totalAmount) || 0;
      const computedQty = priceVal > 0 && amt > 0 ? Math.round((amt / priceVal) * 100) / 100 : formData.quantity;
      setFormData((prev) => ({
        ...prev,
        pricePerUnit: priceVal,
        quantity: computedQty,
      }));
    } else {
      const qty = Number(formData.quantity) || 0;
      const computedTotal = priceVal > 0 && qty > 0 ? Math.round(qty * priceVal * 100) / 100 : formData.totalAmount;
      setFormData((prev) => ({
        ...prev,
        pricePerUnit: priceVal,
        totalAmount: computedTotal,
      }));
    }
  };

  const getAmountPresets = (_fuelType?: string) => {
    return [100, 200, 500, 1000];
  };

  const getQuantityPresets = (_fuelType?: string) => {
    return [5, 10, 15, 20, 30];
  };

  // Auto-adapt fuel type and unit when a vehicle is selected without pre-filling numbers
  const handleVehicleChange = (vehId: string) => {
    const v = vehicles.find((item) => item.id === vehId);
    if (!v) {
      setFormData((prev) => ({ ...prev, vehicleId: vehId }));
      return;
    }

    let defaultUnit = 'LITRE';
    if (v.fuelType === 'ELECTRIC') {
      defaultUnit = 'KWH';
    } else if (v.fuelType === 'CNG') {
      defaultUnit = 'KG';
    }

    setFormData((prev) => ({
      ...prev,
      vehicleId: vehId,
      fuelType: v.fuelType,
      unit: defaultUnit,
    }));
  };

  // Open Create Modal with clean empty inputs
  const handleOpenAdd = () => {
    const defaultVehicle = vehicles[0];
    const fuelT = defaultVehicle?.fuelType || 'PETROL';
    let defaultUnit = 'LITRE';

    if (fuelT === 'ELECTRIC') {
      defaultUnit = 'KWH';
    } else if (fuelT === 'CNG') {
      defaultUnit = 'KG';
    }

    setFormData({
      vehicleId: defaultVehicle?.id || '',
      quantity: '',
      unit: defaultUnit,
      pricePerUnit: '',
      totalAmount: '',
      fuelType: fuelT,
      odometer: '',
      stationName: '',
      entryDate: new Date().toISOString().slice(0, 16),
      notes: '',
    });
    setInputMode('AMOUNT');
    setFieldErrors({});
    setShowAddModal(true);
  };

  // Open Edit Modal pre-filled
  const handleOpenEdit = (entry: FuelEntry) => {
    setFormData({
      vehicleId: entry.vehicleId,
      quantity: entry.quantity,
      unit: entry.unit,
      pricePerUnit: entry.pricePerUnit,
      totalAmount: entry.totalAmount,
      fuelType: entry.fuelType,
      odometer: entry.odometer ?? '',
      stationName: entry.stationName || '',
      entryDate: new Date(entry.entryDate).toISOString().slice(0, 16),
      notes: entry.notes || '',
    });
    setInputMode('AMOUNT');
    setFieldErrors({});
    setEditingEntry(entry);
  };

  // Submit Create
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    if (!formData.vehicleId) {
      errors.vehicleId = 'Please select a vehicle.';
    }
    if (!formData.pricePerUnit || Number(formData.pricePerUnit) <= 0 || isNaN(Number(formData.pricePerUnit))) {
      errors.pricePerUnit = 'Price per unit must be greater than 0.';
    }
    if (inputMode === 'AMOUNT') {
      if (!formData.totalAmount || Number(formData.totalAmount) <= 0 || isNaN(Number(formData.totalAmount))) {
        errors.totalAmount = 'Spend amount must be greater than 0.';
      }
    } else {
      if (!formData.quantity || Number(formData.quantity) <= 0 || isNaN(Number(formData.quantity))) {
        errors.quantity = 'Quantity must be greater than 0.';
      }
    }
    if (!formData.entryDate) {
      errors.entryDate = 'Date & time is required.';
    }
    if (formData.odometer !== '' && (Number(formData.odometer) < 0 || isNaN(Number(formData.odometer)))) {
      errors.odometer = 'Odometer reading cannot be negative.';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      toast.error('Please resolve the highlighted errors in the form.');
      return;
    }

    setSubmitting(true);
    setFieldErrors({});
    const finalTotal =
      Number(formData.totalAmount) > 0
        ? Number(formData.totalAmount)
        : Math.round(Number(formData.quantity) * Number(formData.pricePerUnit) * 100) / 100;

    const finalQty =
      Number(formData.quantity) > 0
        ? Number(formData.quantity)
        : Number(formData.pricePerUnit) > 0
        ? Math.round((finalTotal / Number(formData.pricePerUnit)) * 100) / 100
        : 1;

    const payload = {
      vehicleId: formData.vehicleId,
      quantity: finalQty,
      unit: formData.unit,
      pricePerUnit: Number(formData.pricePerUnit),
      totalAmount: finalTotal,
      fuelType: formData.fuelType,
      odometer: formData.odometer ? Number(formData.odometer) : null,
      stationName: formData.stationName.trim() || null,
      entryDate: new Date(formData.entryDate).toISOString(),
      notes: formData.notes.trim() || null,
    };

    try {
      await api.createFuel(payload);
      toast.success('Fuel entry logged successfully!');
      await loadData();
      setShowAddModal(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to log fuel entry');
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Edit
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEntry) return;

    const errors: Record<string, string> = {};
    if (!formData.vehicleId) {
      errors.vehicleId = 'Please select a vehicle.';
    }
    if (!formData.pricePerUnit || Number(formData.pricePerUnit) <= 0 || isNaN(Number(formData.pricePerUnit))) {
      errors.pricePerUnit = 'Price per unit must be greater than 0.';
    }
    if (inputMode === 'AMOUNT') {
      if (!formData.totalAmount || Number(formData.totalAmount) <= 0 || isNaN(Number(formData.totalAmount))) {
        errors.totalAmount = 'Spend amount must be greater than 0.';
      }
    } else {
      if (!formData.quantity || Number(formData.quantity) <= 0 || isNaN(Number(formData.quantity))) {
        errors.quantity = 'Quantity must be greater than 0.';
      }
    }
    if (!formData.entryDate) {
      errors.entryDate = 'Date & time is required.';
    }
    if (formData.odometer !== '' && (Number(formData.odometer) < 0 || isNaN(Number(formData.odometer)))) {
      errors.odometer = 'Odometer reading cannot be negative.';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      toast.error('Please resolve the highlighted errors in the form.');
      return;
    }

    setSubmitting(true);
    setFieldErrors({});
    const finalTotal =
      Number(formData.totalAmount) > 0
        ? Number(formData.totalAmount)
        : Math.round(Number(formData.quantity) * Number(formData.pricePerUnit) * 100) / 100;

    const finalQty =
      Number(formData.quantity) > 0
        ? Number(formData.quantity)
        : Number(formData.pricePerUnit) > 0
        ? Math.round((finalTotal / Number(formData.pricePerUnit)) * 100) / 100
        : 1;

    const payload: any = {};
    if (formData.vehicleId && formData.vehicleId !== editingEntry.vehicleId) {
      payload.vehicleId = formData.vehicleId;
    }
    if (finalQty !== editingEntry.quantity) {
      payload.quantity = finalQty;
    }
    if (formData.unit !== editingEntry.unit) {
      payload.unit = formData.unit;
    }
    if (Number(formData.pricePerUnit) !== editingEntry.pricePerUnit) {
      payload.pricePerUnit = Number(formData.pricePerUnit);
    }
    if (finalTotal !== editingEntry.totalAmount) {
      payload.totalAmount = finalTotal;
    }
    if (formData.fuelType !== editingEntry.fuelType) {
      payload.fuelType = formData.fuelType;
    }
    const odoVal = formData.odometer ? Number(formData.odometer) : null;
    if (odoVal !== (editingEntry.odometer ?? null)) {
      payload.odometer = odoVal;
    }
    const stationVal = formData.stationName.trim() || null;
    if (stationVal !== (editingEntry.stationName ?? null)) {
      payload.stationName = stationVal;
    }
    const existingDate = editingEntry.entryDate ? new Date(editingEntry.entryDate).toISOString().split('T')[0] : '';
    const newDate = new Date(formData.entryDate).toISOString().split('T')[0];
    if (newDate !== existingDate) {
      payload.entryDate = new Date(formData.entryDate).toISOString();
    }
    const notesVal = formData.notes.trim() || null;
    if (notesVal !== (editingEntry.notes ?? null)) {
      payload.notes = notesVal;
    }

    if (Object.keys(payload).length === 0) {
      toast.info('No changes were made.');
      setEditingEntry(null);
      setSubmitting(false);
      return;
    }

    try {
      await api.updateFuel(editingEntry.id, payload);
      toast.success('Fuel entry updated successfully!');
      await loadData();
      setEditingEntry(null);
    } catch (err: any) {
      toast.error(err.message || 'Failed to update fuel entry');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Action
  const handleDeleteSubmit = async () => {
    if (!deletingEntry) return;
    setSubmitting(true);

    try {
      await api.deleteFuel(deletingEntry.id);
      toast.success('Fuel entry removed');
      await loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete fuel entry');
    } finally {
      setSubmitting(false);
      setDeletingEntry(null);
    }
  };

  // Helper unit badges
  const getFuelBadge = (type: string) => {
    switch (type) {
      case 'ELECTRIC':
        return {
          icon: Zap,
          label: 'Electric (EV)',
          badgeClass: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
          unitShort: 'kWh',
        };
      case 'CNG':
        return {
          icon: Fuel,
          label: 'CNG',
          badgeClass: 'bg-teal-500/10 text-teal-400 border-teal-500/20',
          unitShort: 'kg',
        };
      case 'DIESEL':
        return {
          icon: Fuel,
          label: 'Diesel',
          badgeClass: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
          unitShort: 'L',
        };
      case 'PETROL':
      default:
        return {
          icon: Fuel,
          label: 'Petrol',
          badgeClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
          unitShort: 'L',
        };
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-3.5 py-4 pb-24 sm:px-6 sm:py-8 sm:pb-12 lg:px-8 space-y-5 sm:space-y-8">
      {/* 1. Header (Matching Clean Apple Layout from Garage) */}
      <div className="border-b border-white/[0.08] pb-3.5 sm:pb-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
            <h1 className="text-lg sm:text-2xl lg:text-3xl font-bold text-white tracking-tight truncate">
              <span className="sm:hidden">Fuel & Energy</span>
              <span className="hidden sm:inline">Fuel & Energy Tracking</span>
            </h1>
            <span className="rounded-full bg-emerald-500/10 px-2 sm:px-2.5 py-0.5 text-[11px] sm:text-xs font-semibold text-emerald-400 border border-emerald-500/20 shrink-0">
              <span className="sm:hidden">{filteredEntries.length}</span>
              <span className="hidden sm:inline">{filteredEntries.length} {filteredEntries.length === 1 ? 'Entry' : 'Entries'}</span>
            </span>
          </div>

          {/* Action Button: Compact Apple capsule */}
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-1.5 sm:gap-2 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold shadow-[0_2px_12px_rgba(16,185,129,0.3)] transition-all cursor-pointer active:scale-95 shrink-0"
          >
            <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4 stroke-[2.5]" />
            <span className="sm:hidden">Log Fuel</span>
            <span className="hidden sm:inline">Log Fuel / Charge</span>
          </button>
        </div>

        <p className="hidden sm:block mt-1.5 text-xs sm:text-sm text-slate-400 max-w-2xl leading-relaxed">
          Record fuel refills and EV charging sessions with exact telemetry, unit precision, and cost analytics.
        </p>
      </div>

      {/* Mandatory Garage Fleet Onboarding Banner (if no registered vehicles in garage) */}
      {!loading && vehicles.length === 0 && (
        <div className="flex items-center justify-between gap-3 p-3.5 sm:p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-300">
          <div className="flex items-center gap-2.5 min-w-0">
            <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 shrink-0 text-amber-400" />
            <div>
              <p className="font-semibold text-white text-xs sm:text-sm">No registered vehicles found in your garage</p>
              <p className="text-[11px] sm:text-xs text-amber-200/80">You must register at least one vehicle in your Garage before logging fuel records.</p>
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

      {/* 2. Stats Telemetry Cards: Horizontal Snap Reel on Mobile, 4-Column Grid on Desktop */}
      <div className="flex items-stretch gap-2.5 overflow-x-auto no-scrollbar snap-x snap-mandatory -mx-3.5 px-3.5 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:gap-4 pb-1 sm:pb-0">
        {/* Total Spend */}
        <div className="min-w-[150px] w-[45%] sm:w-auto shrink-0 snap-start rounded-2xl border border-white/[0.08] bg-slate-900/50 p-3 sm:p-4.5 shadow-[0_2px_8px_rgba(0,0,0,0.35)] backdrop-blur-md flex flex-col justify-between hover:border-white/[0.14] transition-all">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider truncate">Total Spend</span>
            <div className="p-1 sm:p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shrink-0">
              <TrendingUp className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
            </div>
          </div>
          <div className="mt-1.5 sm:mt-2 text-base sm:text-2xl lg:text-3xl font-black text-white tracking-tight truncate">
            ₹{(stats?.totalSpend ?? entries.reduce((acc, e) => acc + e.totalAmount, 0)).toLocaleString('en-IN', {
              maximumFractionDigits: 2,
            })}
          </div>
          <div className="hidden sm:block mt-0.5 sm:mt-1 text-xs text-slate-500 truncate">
            {entries.length} fuel logs recorded
          </div>
        </div>

        {/* Liquid Fuel Consumption */}
        <div className="min-w-[150px] w-[45%] sm:w-auto shrink-0 snap-start rounded-2xl border border-white/[0.08] bg-slate-900/50 p-3 sm:p-4.5 shadow-[0_2px_8px_rgba(0,0,0,0.35)] backdrop-blur-md flex flex-col justify-between hover:border-white/[0.14] transition-all">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider truncate">Liquid Fuel</span>
            <div className="p-1 sm:p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shrink-0">
              <Fuel className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
            </div>
          </div>
          <div className="mt-1.5 sm:mt-2 text-base sm:text-2xl lg:text-3xl font-black text-emerald-400 tracking-tight truncate">
            {(
              stats?.quantityByUnit?.LITRE ??
              entries.filter((e) => e.unit === 'LITRE').reduce((acc, e) => acc + e.quantity, 0)
            ).toLocaleString()}{' '}
            <span className="text-xs sm:text-base font-normal text-slate-400">L</span>
          </div>
          <div className="hidden sm:block mt-0.5 sm:mt-1 text-xs text-slate-500 truncate">Petrol & Diesel</div>
        </div>

        {/* EV Charge Energy */}
        <div className="min-w-[150px] w-[45%] sm:w-auto shrink-0 snap-start rounded-2xl border border-white/[0.08] bg-slate-900/50 p-3 sm:p-4.5 shadow-[0_2px_8px_rgba(0,0,0,0.35)] backdrop-blur-md flex flex-col justify-between hover:border-white/[0.14] transition-all">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider truncate">EV Energy</span>
            <div className="p-1 sm:p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 shrink-0">
              <Zap className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
            </div>
          </div>
          <div className="mt-1.5 sm:mt-2 text-base sm:text-2xl lg:text-3xl font-black text-cyan-400 tracking-tight truncate">
            {(
              stats?.quantityByUnit?.KWH ??
              entries.filter((e) => e.unit === 'KWH').reduce((acc, e) => acc + e.quantity, 0)
            ).toLocaleString()}{' '}
            <span className="text-xs sm:text-base font-normal text-slate-400">kWh</span>
          </div>
          <div className="hidden sm:block mt-0.5 sm:mt-1 text-xs text-slate-500 truncate">Electric charging</div>
        </div>

        {/* CNG Consumption */}
        <div className="min-w-[150px] w-[45%] sm:w-auto shrink-0 snap-start rounded-2xl border border-white/[0.08] bg-slate-900/50 p-3 sm:p-4.5 shadow-[0_2px_8px_rgba(0,0,0,0.35)] backdrop-blur-md flex flex-col justify-between hover:border-white/[0.14] transition-all">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider truncate">CNG Mass</span>
            <div className="p-1 sm:p-1.5 rounded-lg bg-teal-500/10 border border-teal-500/20 text-teal-400 shrink-0">
              <Fuel className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
            </div>
          </div>
          <div className="mt-1.5 sm:mt-2 text-base sm:text-2xl lg:text-3xl font-black text-teal-400 tracking-tight truncate">
            {(
              stats?.quantityByUnit?.KG ??
              entries.filter((e) => e.unit === 'KG').reduce((acc, e) => acc + e.quantity, 0)
            ).toLocaleString()}{' '}
            <span className="text-xs sm:text-base font-normal text-slate-400">kg</span>
          </div>
          <div className="hidden sm:block mt-0.5 sm:mt-1 text-xs text-slate-500 truncate">Gas replenishment</div>
        </div>
      </div>

      {/* 3. Toolbar: Search (Left) & Energy Filter Dropdown + Vehicle Filter Dropdown (Right) */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <SearchBar
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onClear={() => setSearchQuery('')}
          placeholder="Search station, vehicle, notes, date..."
        />

        {/* Right Controls: Energy Filter Dropdown + Vehicle Dropdown */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          <div className="min-w-[130px] sm:min-w-[150px]">
            <Select
              value={selectedEnergyFilter}
              onChange={(e) => setSelectedEnergyFilter(e.target.value as any)}
              leftIcon={<Fuel className={`h-3.5 w-3.5 ${selectedEnergyFilter !== 'ALL' ? 'text-emerald-400' : 'text-slate-400'}`} />}
              options={[
                { value: 'ALL', label: 'All Energy' },
                { value: 'PETROL', label: 'Petrol' },
                { value: 'DIESEL', label: 'Diesel' },
                { value: 'ELECTRIC', label: 'Electric (EV)' },
                { value: 'CNG', label: 'CNG' },
              ]}
            />
          </div>

          <div className="min-w-[150px] sm:min-w-[200px]">
            <Select
              value={selectedVehicleFilter}
              onChange={(e) => setSelectedVehicleFilter(e.target.value)}
              leftIcon={<Car className={`h-3.5 w-3.5 ${selectedVehicleFilter !== 'ALL' ? 'text-emerald-400' : 'text-slate-400'}`} />}
            >
              <option value="ALL">All Vehicles</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name} ({v.licensePlate || v.fuelType})
                </option>
              ))}
            </Select>
          </div>
        </div>
      </div>

      {/* 4. Logs List: Desktop Table & Mobile Cards */}
      {loading ? (
        <div className="py-16 text-center text-sm text-slate-400">Loading fuel & energy entries...</div>
      ) : filteredEntries.length === 0 ? (
        <div className="rounded-[18px] border border-dashed border-white/[0.1] bg-slate-900/30 p-12 text-center space-y-3">
          <Fuel className="h-10 w-10 text-slate-600 mx-auto" />
          <h3 className="text-base font-semibold text-white">No fuel or energy entries found</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            {searchQuery || selectedVehicleFilter !== 'ALL' || selectedEnergyFilter !== 'ALL'
              ? 'Try resetting your search query or energy filters.'
              : 'Log your first fuel fill or electric vehicle charge to begin tracking.'}
          </p>
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500 px-4 py-2 text-xs font-semibold text-slate-950 hover:bg-emerald-400 transition-all cursor-pointer shadow-sm"
          >
            <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
            <span>Log Energy Purchase</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Desktop Table */}
          <div className="hidden md:block rounded-[18px] border border-white/[0.08] bg-slate-900/60 shadow-[0_4px_20px_rgba(0,0,0,0.35)] backdrop-blur-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/[0.08] bg-slate-950/40 text-slate-400 font-semibold">
                    <th className="py-3.5 px-4">Date</th>
                    <th className="py-3.5 px-4">Vehicle</th>
                    <th className="py-3.5 px-4">Energy Type</th>
                    <th className="py-3.5 px-4">Quantity</th>
                    <th className="py-3.5 px-4">Rate / Unit</th>
                    <th className="py-3.5 px-4">Total Amount</th>
                    <th className="py-3.5 px-4">Odometer</th>
                    <th className="py-3.5 px-4">Station / Network</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.05]">
                  {paginatedEntries.map((entry) => {
                    const badge = getFuelBadge(entry.fuelType);
                    const Icon = badge.icon;

                    return (
                      <tr key={entry.id} className="text-slate-200 hover:bg-white/[0.02] transition-colors group">
                        <td className="py-3.5 px-4 font-mono text-slate-300">
                          {new Date(entry.entryDate).toLocaleDateString('en-GB', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </td>
                        <td className="py-3.5 px-4 font-medium text-white">
                          <div>
                            <span>{entry.vehicle?.name || 'Unassigned'}</span>
                            {entry.vehicle?.licensePlate && (
                              <span className="block text-[10px] font-mono text-slate-500">
                                {entry.vehicle.licensePlate}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold border ${badge.badgeClass}`}
                          >
                            <Icon className="h-2.5 w-2.5" />
                            {badge.label}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-white">
                          {entry.quantity}{' '}
                          <span className="text-[10px] font-mono text-slate-400 font-normal">{badge.unitShort}</span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-300 font-mono">
                          ₹{entry.pricePerUnit} / {badge.unitShort}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-emerald-400 text-sm">
                          ₹{entry.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-slate-400">
                          {entry.odometer ? `${entry.odometer.toLocaleString()} km` : '—'}
                        </td>
                        <td className="py-3.5 px-4 text-slate-300 max-w-[180px] truncate" title={entry.stationName || ''}>
                          {entry.stationName || '—'}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => setViewingEntry(entry)}
                              className="p-1.5 rounded-[6px] text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer"
                              title="View Details"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleOpenEdit(entry)}
                              className="p-1.5 rounded-[6px] text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors cursor-pointer"
                              title="Edit Entry"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => setDeletingEntry(entry)}
                              className="p-1.5 rounded-[6px] text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                              title="Delete Entry"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Cards View */}
          <div className="md:hidden space-y-3">
            {paginatedEntries.map((entry) => {
              const badge = getFuelBadge(entry.fuelType);
              const Icon = badge.icon;

              return (
                <div
                  key={entry.id}
                  className="rounded-[16px] border border-white/[0.08] bg-slate-900/70 p-4 shadow-sm backdrop-blur-md space-y-3"
                >
                  {/* Top Row: Vehicle + Total Amount */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-white text-sm">{entry.vehicle?.name || 'Unassigned'}</span>
                        <span
                          className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[9px] font-semibold border ${badge.badgeClass}`}
                        >
                          <Icon className="h-2 w-2" />
                          {badge.label}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-500 font-mono">
                        {new Date(entry.entryDate).toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    </div>

                    <div className="text-right">
                      <div className="text-base font-bold text-emerald-400">
                        ₹{entry.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {entry.quantity} {badge.unitShort} @ ₹{entry.pricePerUnit}
                      </div>
                    </div>
                  </div>

                  {/* Middle Row: Odometer & Station */}
                  {(entry.odometer || entry.stationName) && (
                    <div className="flex items-center justify-between text-xs pt-2 border-t border-white/[0.05] text-slate-400">
                      {entry.odometer ? (
                        <span className="flex items-center gap-1 font-mono">
                          <Gauge className="h-3 w-3 text-slate-500" />
                          {entry.odometer.toLocaleString()} km
                        </span>
                      ) : (
                        <span />
                      )}

                      {entry.stationName && (
                        <span className="flex items-center gap-1 truncate max-w-[200px]" title={entry.stationName}>
                          <MapPin className="h-3 w-3 text-slate-500 shrink-0" />
                          <span className="truncate">{entry.stationName}</span>
                        </span>
                      )}
                    </div>
                  )}

                  {/* Bottom Action Row */}
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/[0.05]">
                    <button
                      onClick={() => setViewingEntry(entry)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/[0.06] hover:bg-white/[0.1] text-[11px] text-slate-300 transition-colors"
                    >
                      <Eye className="h-3 w-3" /> View
                    </button>
                    <button
                      onClick={() => handleOpenEdit(entry)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 hover:bg-emerald-500/20 text-[11px] text-emerald-400 border border-emerald-500/20 transition-colors"
                    >
                      <Edit2 className="h-3 w-3" /> Edit
                    </button>
                    <button
                      onClick={() => setDeletingEntry(entry)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-500/10 hover:bg-rose-500/20 text-[11px] text-rose-400 border border-rose-500/20 transition-colors"
                    >
                      <Trash2 className="h-3 w-3" /> Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* 5. Reusable Pagination Component */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredEntries.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
            pageSizeOptions={[5, 10, 20, 50]}
            itemLabel="entries"
          />
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. CREATE FUEL / CHARGE MODAL (Landscape 2-Column Apple Design)            */}
      {/* ========================================================================= */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-6 overflow-hidden">
          <div className="w-full max-w-4xl max-h-[92vh] rounded-[20px] border border-white/[0.12] bg-slate-900/95 shadow-2xl backdrop-blur-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* FIXED HEADER */}
            <div className="flex items-center justify-between border-b border-white/[0.06] px-6 py-4.5 bg-slate-900/90 flex-shrink-0">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight flex items-center gap-2">
                  <Fuel className="h-5 w-5 text-emerald-400" /> Log Fuel Refill / EV Charge
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">Record energy purchase details and odometer telemetry</p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="rounded-full p-2 text-slate-400 hover:bg-white/[0.08] hover:text-white transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* SCROLLABLE 2-COLUMN BODY */}
            <form id="add-fuel-form" onSubmit={handleCreateSubmit} noValidate className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Warning banner if no registered vehicles in garage */}
              {vehicles.length === 0 && (
                <div className="flex items-center justify-between gap-3 p-3.5 sm:p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-300">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 text-amber-400" />
                    <div>
                      <p className="font-semibold text-white text-xs sm:text-sm">No registered vehicles found in your garage</p>
                      <p className="text-[11px] sm:text-xs text-amber-200/80">You must register at least one vehicle in your Garage before logging fuel records.</p>
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
                {/* LEFT COLUMN: Vehicle, Fuel Type, Input Mode (Amount vs Quantity), Rates & Presets */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">
                      Target Registered Vehicle <span className="text-rose-400 font-bold ml-0.5">*</span>{' '}
                      <span className="text-emerald-400 font-normal">(Garage vehicles only)</span>
                    </label>
                    <select
                      value={formData.vehicleId}
                      onChange={(e) => {
                        handleVehicleChange(e.target.value);
                        if (fieldErrors.vehicleId) setFieldErrors((prev) => ({ ...prev, vehicleId: '' }));
                      }}
                      className={`w-full rounded-[10px] border p-3 text-white text-sm focus:outline-none cursor-pointer transition-colors ${
                        fieldErrors.vehicleId
                          ? 'border-rose-500/80 bg-rose-500/5 focus:border-rose-500 focus:ring-1 focus:ring-rose-500/20'
                          : 'border-white/[0.1] bg-slate-950/80 focus:border-emerald-500'
                      }`}
                    >
                      <option value="" disabled>Select Registered Vehicle *</option>
                      {vehicles.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.name} ({v.fuelType}) — {v.licensePlate || 'No Plate'}
                        </option>
                      ))}
                    </select>
                    {fieldErrors.vehicleId && (
                      <p className="mt-1 text-[11px] text-rose-400 flex items-center gap-1 animate-in fade-in slide-in-from-top-1">
                        <AlertCircle className="h-3 w-3 shrink-0" />
                        <span>{fieldErrors.vehicleId}</span>
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1.5 flex items-center justify-between">
                      <span>Energy Classification</span>
                      <span className="text-[11px] text-slate-500 font-normal">Vehicle fuel type</span>
                    </label>
                    <div className="flex items-center justify-between gap-2.5 p-2.5 rounded-[10px] border border-white/[0.1] bg-slate-950/80 text-slate-200">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${getFuelBadge(formData.fuelType).badgeClass}`}>
                        <Fuel className="h-3.5 w-3.5" />
                        <span>{getFuelBadge(formData.fuelType).label}</span>
                      </span>
                      <span className="text-xs text-slate-400">
                        Dispense unit: <span className="font-mono text-emerald-400 font-bold">{formData.unit}</span> ({getFuelBadge(formData.fuelType).unitShort})
                      </span>
                    </div>
                  </div>

                  {/* Mode Selector: Fill by Total Amount (₹) vs Fill by Quantity */}
                  <div>
                    <label className="block text-slate-300 font-medium mb-1.5">How are you logging this fill?</label>
                    <div className="grid grid-cols-2 p-1 rounded-xl bg-slate-950 border border-white/[0.08] text-xs">
                      <button
                        type="button"
                        onClick={() => setInputMode('AMOUNT')}
                        className={`py-2 px-3 rounded-[9px] font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                          inputMode === 'AMOUNT'
                            ? 'bg-emerald-500 text-slate-950 shadow-md font-bold'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <span className="text-sm font-black">₹</span>
                        <span>Fill by Amount (₹)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setInputMode('QUANTITY')}
                        className={`py-2 px-3 rounded-[9px] font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                          inputMode === 'QUANTITY'
                            ? 'bg-emerald-500 text-slate-950 shadow-md font-bold'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <Fuel className="h-3.5 w-3.5" />
                        <span>By {formData.fuelType === 'ELECTRIC' ? 'Energy (kWh)' : `Quantity (${getFuelBadge(formData.fuelType).unitShort})`}</span>
                      </button>
                    </div>
                  </div>

                  {/* Mode A: BY TOTAL AMOUNT (₹) */}
                  {inputMode === 'AMOUNT' && (
                    <div className="space-y-3 rounded-[14px] border border-white/[0.08] bg-slate-950/60 p-3.5">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-slate-200 font-semibold text-xs">
                            Total Spend Amount (₹) <span className="text-rose-400 font-bold ml-0.5">*</span>
                          </label>
                        </div>
                        <div className="relative">
                          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base font-bold text-slate-400">₹</span>
                          <input
                            type="number"
                            min="1"
                            step="any"
                            value={formData.totalAmount !== '' ? formData.totalAmount : ''}
                            onChange={(e) => {
                              handleAmountChange(e.target.value === '' ? '' : parseFloat(e.target.value));
                              if (fieldErrors.totalAmount) setFieldErrors((prev) => ({ ...prev, totalAmount: '' }));
                            }}
                            className={`w-full rounded-[10px] border pl-8 pr-4 py-2.5 text-white text-base font-bold focus:outline-none transition-colors ${
                              fieldErrors.totalAmount
                                ? 'border-rose-500/80 bg-rose-500/5 focus:border-rose-500 focus:ring-1 focus:ring-rose-500/20'
                                : 'border-white/[0.12] bg-slate-900 focus:border-emerald-500'
                            }`}
                            placeholder="e.g. 2000"
                          />
                        </div>
                        {fieldErrors.totalAmount && (
                          <p className="mt-1 text-[11px] text-rose-400 flex items-center gap-1 animate-in fade-in slide-in-from-top-1">
                            <AlertCircle className="h-3 w-3 shrink-0" />
                            <span>{fieldErrors.totalAmount}</span>
                          </p>
                        )}

                        {/* Quick Presets */}
                        <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                          <span className="text-[10px] text-slate-500 uppercase font-semibold">Quick:</span>
                          {getAmountPresets(formData.fuelType).map((amt) => (
                            <button
                              key={amt}
                              type="button"
                              onClick={() => handleAmountChange(amt)}
                              className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium transition-all cursor-pointer ${
                                formData.totalAmount === amt
                                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-bold'
                                  : 'bg-white/[0.05] text-slate-300 hover:bg-white/[0.1] border border-white/[0.06]'
                              }`}
                            >
                              ₹{amt.toLocaleString('en-IN')}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/[0.06]">
                        <div>
                          <label className="block text-slate-400 text-[11px] font-medium mb-1">
                            Price / {getFuelBadge(formData.fuelType).unitShort} (₹) <span className="text-rose-400 font-bold ml-0.5">*</span>
                          </label>
                          <input
                            type="number"
                            min="0.1"
                            step="any"
                            value={formData.pricePerUnit !== '' ? formData.pricePerUnit : ''}
                            onChange={(e) => {
                              handlePriceChange(e.target.value === '' ? '' : parseFloat(e.target.value));
                              if (fieldErrors.pricePerUnit) setFieldErrors((prev) => ({ ...prev, pricePerUnit: '' }));
                            }}
                            className={`w-full rounded-[10px] border p-2 text-white text-xs font-mono focus:outline-none transition-colors ${
                              fieldErrors.pricePerUnit
                                ? 'border-rose-500/80 bg-rose-500/5 focus:border-rose-500 focus:ring-1 focus:ring-rose-500/20'
                                : 'border-white/[0.1] bg-slate-900 focus:border-emerald-500'
                            }`}
                            placeholder="e.g. 104.5"
                          />
                          {fieldErrors.pricePerUnit && (
                            <p className="mt-1 text-[11px] text-rose-400 flex items-center gap-1 animate-in fade-in slide-in-from-top-1">
                              <AlertCircle className="h-3 w-3 shrink-0" />
                              <span>{fieldErrors.pricePerUnit}</span>
                            </p>
                          )}
                        </div>
                        <div>
                          <label className="block text-slate-400 text-[11px] font-medium mb-1">
                            Dispensed {getFuelBadge(formData.fuelType).unitShort}
                          </label>
                          <div className="rounded-[10px] border border-white/[0.08] bg-slate-900/80 p-2 text-emerald-400 text-xs font-mono font-bold">
                            {formData.quantity !== '' ? formData.quantity : '-'} {getFuelBadge(formData.fuelType).unitShort}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Mode B: BY QUANTITY / ENERGY */}
                  {inputMode === 'QUANTITY' && (
                    <div className="space-y-3 rounded-[14px] border border-white/[0.08] bg-slate-950/60 p-3.5">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-slate-200 font-semibold text-xs">
                            Quantity ({getFuelBadge(formData.fuelType).unitShort}) <span className="text-rose-400 font-bold ml-0.5">*</span>
                          </label>
                        </div>
                        <div className="relative">
                          <input
                            type="number"
                            min="0.01"
                            step="any"
                            value={formData.quantity !== '' ? formData.quantity : ''}
                            onChange={(e) => {
                              handleQuantityChange(e.target.value === '' ? '' : parseFloat(e.target.value));
                              if (fieldErrors.quantity) setFieldErrors((prev) => ({ ...prev, quantity: '' }));
                            }}
                            className={`w-full rounded-[10px] border px-4 py-2.5 text-white text-base font-bold focus:outline-none transition-colors ${
                              fieldErrors.quantity
                                ? 'border-rose-500/80 bg-rose-500/5 focus:border-rose-500 focus:ring-1 focus:ring-rose-500/20'
                                : 'border-white/[0.12] bg-slate-900 focus:border-emerald-500'
                            }`}
                            placeholder="e.g. 20"
                          />
                          <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 bg-white/[0.08] px-2 py-0.5 rounded-full">
                            {getFuelBadge(formData.fuelType).unitShort}
                          </span>
                        </div>
                        {fieldErrors.quantity && (
                          <p className="mt-1 text-[11px] text-rose-400 flex items-center gap-1 animate-in fade-in slide-in-from-top-1">
                            <AlertCircle className="h-3 w-3 shrink-0" />
                            <span>{fieldErrors.quantity}</span>
                          </p>
                        )}

                        {/* Quick Presets */}
                        <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                          <span className="text-[10px] text-slate-500 uppercase font-semibold">Quick:</span>
                          {getQuantityPresets(formData.fuelType).map((qty) => (
                            <button
                              key={qty}
                              type="button"
                              onClick={() => handleQuantityChange(qty)}
                              className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium transition-all cursor-pointer ${
                                formData.quantity === qty
                                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-bold'
                                  : 'bg-white/[0.05] text-slate-300 hover:bg-white/[0.1] border border-white/[0.06]'
                              }`}
                            >
                              {qty}{getFuelBadge(formData.fuelType).unitShort}
                            </button>
                          ))}
                          {vehicles.find((v) => v.id === formData.vehicleId)?.tankCapacity && (
                            <button
                              type="button"
                              onClick={() => {
                                const cap = vehicles.find((v) => v.id === formData.vehicleId)!.tankCapacity!;
                                handleQuantityChange(cap);
                              }}
                              className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25 border border-emerald-500/30 transition-all cursor-pointer"
                            >
                              Full {formData.fuelType === 'ELECTRIC' ? 'Battery' : formData.fuelType === 'CNG' ? 'Cylinder' : 'Tank'} ({vehicles.find((v) => v.id === formData.vehicleId)?.tankCapacity} {getFuelBadge(formData.fuelType).unitShort})
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/[0.06]">
                        <div>
                          <label className="block text-slate-400 text-[11px] font-medium mb-1">
                            Price / {getFuelBadge(formData.fuelType).unitShort} (₹) <span className="text-rose-400 font-bold ml-0.5">*</span>
                          </label>
                          <input
                            type="number"
                            min="0.1"
                            step="any"
                            value={formData.pricePerUnit !== '' ? formData.pricePerUnit : ''}
                            onChange={(e) => {
                              handlePriceChange(e.target.value === '' ? '' : parseFloat(e.target.value));
                              if (fieldErrors.pricePerUnit) setFieldErrors((prev) => ({ ...prev, pricePerUnit: '' }));
                            }}
                            className={`w-full rounded-[10px] border p-2 text-white text-xs font-mono focus:outline-none transition-colors ${
                              fieldErrors.pricePerUnit
                                ? 'border-rose-500/80 bg-rose-500/5 focus:border-rose-500 focus:ring-1 focus:ring-rose-500/20'
                                : 'border-white/[0.1] bg-slate-900 focus:border-emerald-500'
                            }`}
                            placeholder="e.g. 104.5"
                          />
                          {fieldErrors.pricePerUnit && (
                            <p className="mt-1 text-[11px] text-rose-400 flex items-center gap-1 animate-in fade-in slide-in-from-top-1">
                              <AlertCircle className="h-3 w-3 shrink-0" />
                              <span>{fieldErrors.pricePerUnit}</span>
                            </p>
                          )}
                        </div>
                        <div>
                          <label className="block text-slate-400 text-[11px] font-medium mb-1">
                            Calculated Spend
                          </label>
                          <div className="rounded-[10px] border border-white/[0.08] bg-slate-900/80 p-2 text-emerald-400 text-xs font-mono font-bold">
                            ₹{formData.totalAmount !== '' ? Number(formData.totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Dual Telemetry Summary Card */}
                  <div className="rounded-[12px] border border-emerald-500/25 bg-emerald-500/10 p-3.5 flex items-center justify-between shadow-sm">
                    <div>
                      <span className="text-slate-400 text-xs block font-medium">Telemetry Summary:</span>
                      <span className="text-xs text-slate-300 font-mono">
                        {formData.quantity !== '' ? formData.quantity : '-'} {getFuelBadge(formData.fuelType).unitShort} @ {formData.pricePerUnit !== '' ? `₹${formData.pricePerUnit}` : '₹-'}/{getFuelBadge(formData.fuelType).unitShort}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[11px] text-slate-400 block font-medium">Total Spend</span>
                      <span className="text-xl font-black text-emerald-400">
                        ₹{formData.totalAmount !== '' ? Number(formData.totalAmount).toLocaleString('en-IN', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        }) : '0.00'}
                      </span>
                    </div>
                  </div>

                  {/* EV Guidance Hint (only shown for Electric vehicles) */}
                  {formData.fuelType === 'ELECTRIC' && (
                    <div className="rounded-[12px] border border-cyan-500/25 bg-cyan-500/10 p-3 flex items-start gap-2.5 text-xs text-cyan-200">
                      <Zap className="h-4 w-4 text-cyan-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold block text-cyan-300 mb-0.5">EV Charging Session Guide:</span>
                        Public chargers (Tata Power, Zeon, Jio-bp, Ather) bill by energy units (<strong>kWh</strong>) or wallet top-up (e.g. ₹500).
                        Choose <strong>Fill by Amount (₹)</strong> for fixed wallet debits, or <strong>By Energy (kWh)</strong> for measured meter units.
                      </div>
                    </div>
                  )}
                </div>

                {/* RIGHT COLUMN: Date, Odometer, Station, Notes */}
                <div className="space-y-4">
                  <DateTimePicker
                    label="Date & Time"
                    required
                    value={formData.entryDate}
                    onChange={(e) => {
                      setFormData({ ...formData, entryDate: e.target.value });
                      if (fieldErrors.entryDate) setFieldErrors((prev) => ({ ...prev, entryDate: '' }));
                    }}
                    error={fieldErrors.entryDate}
                  />

                  <div>
                    <label className="block text-slate-300 font-medium mb-1">
                      Odometer Reading (km) <span className="text-[10px] text-slate-500 font-normal lowercase ml-1">(optional)</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.odometer}
                      onChange={(e) => {
                        setFormData({ ...formData, odometer: e.target.value ? parseFloat(e.target.value) : '' });
                        if (fieldErrors.odometer) setFieldErrors((prev) => ({ ...prev, odometer: '' }));
                      }}
                      className={`w-full rounded-[10px] border p-3 text-white text-sm focus:outline-none transition-colors ${
                        fieldErrors.odometer
                          ? 'border-rose-500/80 bg-rose-500/5 focus:border-rose-500 focus:ring-1 focus:ring-rose-500/20'
                          : 'border-white/[0.1] bg-slate-950/80 focus:border-emerald-500'
                      }`}
                      placeholder="e.g. 6450"
                    />
                    {fieldErrors.odometer && (
                      <p className="mt-1 text-[11px] text-rose-400 flex items-center gap-1 animate-in fade-in slide-in-from-top-1">
                        <AlertCircle className="h-3 w-3 shrink-0" />
                        <span>{fieldErrors.odometer}</span>
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1">
                      Fuel Station / EV Charging Network <span className="text-[10px] text-slate-500 font-normal lowercase ml-1">(optional)</span>
                    </label>
                    <input
                      type="text"
                      value={formData.stationName}
                      onChange={(e) => setFormData({ ...formData, stationName: e.target.value })}
                      className="w-full rounded-[10px] border border-white/[0.1] bg-slate-950/80 p-3 text-white text-sm focus:border-emerald-500 focus:outline-none"
                      placeholder="e.g. Shell Highway, Tata Power EZ Hub"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1">
                      Trip / Session Notes <span className="text-[10px] text-slate-500 font-normal lowercase ml-1">(optional)</span>
                    </label>
                    <textarea
                      rows={2}
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      className="w-full rounded-[10px] border border-white/[0.1] bg-slate-950/80 p-3 text-white text-sm focus:border-emerald-500 focus:outline-none resize-none"
                      placeholder="e.g. Highway run, charged to 90%, AC full load"
                    />
                  </div>
                </div>
              </div>
            </form>

            {/* FIXED FOOTER */}
            <div className="flex items-center justify-end gap-3 border-t border-white/[0.06] px-6 py-4 bg-slate-900/90 flex-shrink-0">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="rounded-full px-5 py-2 text-xs font-semibold text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="add-fuel-form"
                disabled={submitting || vehicles.length === 0 || !formData.vehicleId}
                className="rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-6 py-2 text-xs font-bold shadow-sm transition-all cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Recording...' : 'Record Energy Purchase'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. VIEW FUEL ENTRY DETAILS MODAL (Apple Inspection Card)                  */}
      {/* ========================================================================= */}
      {viewingEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-6 overflow-hidden">
          <div className="w-full max-w-2xl rounded-[20px] border border-white/[0.12] bg-slate-900/95 shadow-2xl backdrop-blur-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/[0.06] px-6 py-4.5 bg-slate-900/90 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full border ${getFuelBadge(viewingEntry.fuelType).badgeClass}`}
                >
                  <Fuel className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white tracking-tight">Fuel & Energy Telemetry</h2>
                  <p className="text-xs text-slate-400">
                    Logged on {new Date(viewingEntry.entryDate).toLocaleString('en-GB')}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewingEntry(null)}
                className="rounded-full p-2 text-slate-400 hover:bg-white/[0.08] hover:text-white transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Inspection Body */}
            <div className="p-6 space-y-5 text-xs">
              {/* Top Hero: Total Amount & Badge */}
              <div className="rounded-[16px] border border-white/[0.08] bg-slate-950/60 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <span className="text-slate-400 text-xs block">Total Purchase Amount</span>
                  <span className="text-3xl font-black text-emerald-400">
                    ₹{viewingEntry.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold border ${getFuelBadge(viewingEntry.fuelType).badgeClass}`}
                  >
                    {getFuelBadge(viewingEntry.fuelType).label}
                  </span>
                </div>
              </div>

              {/* Telemetry Breakdown Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-[12px] border border-white/[0.06] bg-slate-950/40 p-3.5 space-y-1">
                  <span className="text-slate-400 text-[11px]">Quantity Dispensed</span>
                  <div className="text-base font-bold text-white">
                    {viewingEntry.quantity} {getFuelBadge(viewingEntry.fuelType).unitShort}
                  </div>
                </div>

                <div className="rounded-[12px] border border-white/[0.06] bg-slate-950/40 p-3.5 space-y-1">
                  <span className="text-slate-400 text-[11px]">Unit Price</span>
                  <div className="text-base font-bold text-slate-200">
                    ₹{viewingEntry.pricePerUnit} / {getFuelBadge(viewingEntry.fuelType).unitShort}
                  </div>
                </div>

                <div className="rounded-[12px] border border-white/[0.06] bg-slate-950/40 p-3.5 space-y-1">
                  <span className="text-slate-400 text-[11px]">Vehicle</span>
                  <div className="text-sm font-semibold text-white truncate">
                    {viewingEntry.vehicle?.name || 'Unassigned'}
                  </div>
                  {viewingEntry.vehicle?.licensePlate && (
                    <span className="text-[10px] font-mono text-slate-500">{viewingEntry.vehicle.licensePlate}</span>
                  )}
                </div>

                <div className="rounded-[12px] border border-white/[0.06] bg-slate-950/40 p-3.5 space-y-1">
                  <span className="text-slate-400 text-[11px]">Odometer at Refill</span>
                  <div className="text-sm font-mono font-bold text-white">
                    {viewingEntry.odometer ? `${viewingEntry.odometer.toLocaleString()} km` : 'Not recorded'}
                  </div>
                </div>
              </div>

              {/* Station & Notes */}
              {(viewingEntry.stationName || viewingEntry.notes) && (
                <div className="rounded-[12px] border border-white/[0.06] bg-slate-950/40 p-4 space-y-2">
                  {viewingEntry.stationName && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-emerald-400 shrink-0" />
                      <span className="text-white font-medium">{viewingEntry.stationName}</span>
                    </div>
                  )}
                  {viewingEntry.notes && (
                    <div className="flex items-start gap-2 pt-1 text-slate-300">
                      <FileText className="h-4 w-4 text-slate-500 shrink-0 mt-0.5" />
                      <span>{viewingEntry.notes}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-white/[0.06] px-6 py-4 bg-slate-900/90 flex-shrink-0">
              <button
                type="button"
                onClick={() => setViewingEntry(null)}
                className="rounded-full px-5 py-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  const toEdit = viewingEntry;
                  setViewingEntry(null);
                  handleOpenEdit(toEdit);
                }}
                className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-5 py-2 text-xs font-bold transition-all cursor-pointer shadow-sm"
              >
                <Edit2 className="h-3.5 w-3.5" />
                <span>Edit Entry</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. EDIT FUEL ENTRY MODAL (Landscape 2-Column Apple Design)                 */}
      {/* ========================================================================= */}
      {editingEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-6 overflow-hidden">
          <div className="w-full max-w-4xl max-h-[92vh] rounded-[20px] border border-white/[0.12] bg-slate-900/95 shadow-2xl backdrop-blur-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/[0.06] px-6 py-4.5 bg-slate-900/90 flex-shrink-0">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight flex items-center gap-2">
                  <Edit2 className="h-5 w-5 text-emerald-400" /> Edit Fuel / EV Charge Record
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Update quantity, price, or station for {editingEntry.vehicle?.name || 'this entry'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingEntry(null)}
                className="rounded-full p-2 text-slate-400 hover:bg-white/[0.08] hover:text-white transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Scrollable Form */}
            <form id="edit-fuel-form" onSubmit={handleEditSubmit} noValidate className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
                {/* LEFT: Mode Toggle, Amount vs Quantity, Presets, Recalculated Amount */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">
                      Target Registered Vehicle <span className="text-rose-400 font-bold ml-0.5">*</span>{' '}
                      <span className="text-emerald-400 font-normal">(Garage vehicles only)</span>
                    </label>
                    <select
                      value={formData.vehicleId}
                      onChange={(e) => {
                        handleVehicleChange(e.target.value);
                        if (fieldErrors.vehicleId) setFieldErrors((prev) => ({ ...prev, vehicleId: '' }));
                      }}
                      className={`w-full rounded-[10px] border p-3 text-white text-sm focus:outline-none cursor-pointer transition-colors ${
                        fieldErrors.vehicleId
                          ? 'border-rose-500/80 bg-rose-500/5 focus:border-rose-500 focus:ring-1 focus:ring-rose-500/20'
                          : 'border-white/[0.1] bg-slate-950/80 focus:border-emerald-500'
                      }`}
                    >
                      <option value="" disabled>Select Registered Vehicle *</option>
                      {vehicles.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.name} ({v.fuelType}) — {v.licensePlate || 'No Plate'}
                        </option>
                      ))}
                    </select>
                    {fieldErrors.vehicleId && (
                      <p className="mt-1 text-[11px] text-rose-400 flex items-center gap-1 animate-in fade-in slide-in-from-top-1">
                        <AlertCircle className="h-3 w-3 shrink-0" />
                        <span>{fieldErrors.vehicleId}</span>
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1.5 flex items-center justify-between">
                      <span>Energy Classification</span>
                      <span className="text-[11px] text-slate-500 font-normal">Vehicle fuel type</span>
                    </label>
                    <div className="flex items-center justify-between gap-2.5 p-2.5 rounded-[10px] border border-white/[0.1] bg-slate-950/80 text-slate-200">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${getFuelBadge(formData.fuelType).badgeClass}`}>
                        <Fuel className="h-3.5 w-3.5" />
                        <span>{getFuelBadge(formData.fuelType).label}</span>
                      </span>
                      <span className="text-xs text-slate-400">
                        Dispense unit: <span className="font-mono text-emerald-400 font-bold">{formData.unit}</span> ({getFuelBadge(formData.fuelType).unitShort})
                      </span>
                    </div>
                  </div>

                  {/* Mode Selector */}
                  <div>
                    <label className="block text-slate-300 font-medium mb-1.5">Edit By:</label>
                    <div className="grid grid-cols-2 p-1 rounded-xl bg-slate-950 border border-white/[0.08] text-xs">
                      <button
                        type="button"
                        onClick={() => setInputMode('AMOUNT')}
                        className={`py-2 px-3 rounded-[9px] font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                          inputMode === 'AMOUNT'
                            ? 'bg-emerald-500 text-slate-950 shadow-md font-bold'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <span className="text-sm font-black">₹</span>
                        <span>By Total Amount (₹)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setInputMode('QUANTITY')}
                        className={`py-2 px-3 rounded-[9px] font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                          inputMode === 'QUANTITY'
                            ? 'bg-emerald-500 text-slate-950 shadow-md font-bold'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <Fuel className="h-3.5 w-3.5" />
                        <span>By {formData.fuelType === 'ELECTRIC' ? 'Energy (kWh)' : `Quantity (${getFuelBadge(formData.fuelType).unitShort})`}</span>
                      </button>
                    </div>
                  </div>

                  {/* Mode A: BY TOTAL AMOUNT (₹) */}
                  {inputMode === 'AMOUNT' && (
                    <div className="space-y-3 rounded-[14px] border border-white/[0.08] bg-slate-950/60 p-3.5">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-slate-200 font-semibold text-xs">
                            Total Spend Amount (₹) <span className="text-rose-400 font-bold ml-0.5">*</span>
                          </label>
                        </div>
                        <div className="relative">
                          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base font-bold text-slate-400">₹</span>
                          <input
                            type="number"
                            min="1"
                            step="any"
                            value={formData.totalAmount !== '' ? formData.totalAmount : ''}
                            onChange={(e) => {
                              handleAmountChange(e.target.value === '' ? '' : parseFloat(e.target.value));
                              if (fieldErrors.totalAmount) setFieldErrors((prev) => ({ ...prev, totalAmount: '' }));
                            }}
                            className={`w-full rounded-[10px] border pl-8 pr-4 py-2.5 text-white text-base font-bold focus:outline-none transition-colors ${
                              fieldErrors.totalAmount
                                ? 'border-rose-500/80 bg-rose-500/5 focus:border-rose-500 focus:ring-1 focus:ring-rose-500/20'
                                : 'border-white/[0.12] bg-slate-900 focus:border-emerald-500'
                            }`}
                            placeholder="e.g. 2000"
                          />
                        </div>
                        {fieldErrors.totalAmount && (
                          <p className="mt-1 text-[11px] text-rose-400 flex items-center gap-1 animate-in fade-in slide-in-from-top-1">
                            <AlertCircle className="h-3 w-3 shrink-0" />
                            <span>{fieldErrors.totalAmount}</span>
                          </p>
                        )}

                        {/* Quick Presets */}
                        <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                          <span className="text-[10px] text-slate-500 uppercase font-semibold">Quick:</span>
                          {getAmountPresets(formData.fuelType).map((amt) => (
                            <button
                              key={amt}
                              type="button"
                              onClick={() => handleAmountChange(amt)}
                              className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium transition-all cursor-pointer ${
                                formData.totalAmount === amt
                                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-bold'
                                  : 'bg-white/[0.05] text-slate-300 hover:bg-white/[0.1] border border-white/[0.06]'
                              }`}
                            >
                              ₹{amt.toLocaleString('en-IN')}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/[0.06]">
                        <div>
                          <label className="block text-slate-400 text-[11px] font-medium mb-1">
                            Price / {getFuelBadge(formData.fuelType).unitShort} (₹) <span className="text-rose-400 font-bold ml-0.5">*</span>
                          </label>
                          <input
                            type="number"
                            min="0.1"
                            step="any"
                            value={formData.pricePerUnit !== '' ? formData.pricePerUnit : ''}
                            onChange={(e) => {
                              handlePriceChange(e.target.value === '' ? '' : parseFloat(e.target.value));
                              if (fieldErrors.pricePerUnit) setFieldErrors((prev) => ({ ...prev, pricePerUnit: '' }));
                            }}
                            className={`w-full rounded-[10px] border p-2 text-white text-xs font-mono focus:outline-none transition-colors ${
                              fieldErrors.pricePerUnit
                                ? 'border-rose-500/80 bg-rose-500/5 focus:border-rose-500 focus:ring-1 focus:ring-rose-500/20'
                                : 'border-white/[0.1] bg-slate-900 focus:border-emerald-500'
                            }`}
                            placeholder="e.g. 104.5"
                          />
                          {fieldErrors.pricePerUnit && (
                            <p className="mt-1 text-[11px] text-rose-400 flex items-center gap-1 animate-in fade-in slide-in-from-top-1">
                              <AlertCircle className="h-3 w-3 shrink-0" />
                              <span>{fieldErrors.pricePerUnit}</span>
                            </p>
                          )}
                        </div>
                        <div>
                          <label className="block text-slate-400 text-[11px] font-medium mb-1">
                            Dispensed {getFuelBadge(formData.fuelType).unitShort}
                          </label>
                          <div className="rounded-[10px] border border-white/[0.08] bg-slate-900/80 p-2 text-emerald-400 text-xs font-mono font-bold">
                            {formData.quantity !== '' ? formData.quantity : '-'} {getFuelBadge(formData.fuelType).unitShort}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Mode B: BY QUANTITY / ENERGY */}
                  {inputMode === 'QUANTITY' && (
                    <div className="space-y-3 rounded-[14px] border border-white/[0.08] bg-slate-950/60 p-3.5">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-slate-200 font-semibold text-xs">
                            Quantity ({getFuelBadge(formData.fuelType).unitShort}) <span className="text-rose-400 font-bold ml-0.5">*</span>
                          </label>
                          <span className="text-[11px] text-emerald-400 font-mono">
                            e.g. 20 {getFuelBadge(formData.fuelType).unitShort}
                          </span>
                        </div>
                        <div className="relative">
                          <input
                            type="number"
                            min="0.01"
                            step="any"
                            value={formData.quantity !== '' ? formData.quantity : ''}
                            onChange={(e) => {
                              handleQuantityChange(e.target.value === '' ? '' : parseFloat(e.target.value));
                              if (fieldErrors.quantity) setFieldErrors((prev) => ({ ...prev, quantity: '' }));
                            }}
                            className={`w-full rounded-[10px] border px-4 py-2.5 text-white text-base font-bold focus:outline-none transition-colors ${
                              fieldErrors.quantity
                                ? 'border-rose-500/80 bg-rose-500/5 focus:border-rose-500 focus:ring-1 focus:ring-rose-500/20'
                                : 'border-white/[0.12] bg-slate-900 focus:border-emerald-500'
                            }`}
                            placeholder="e.g. 20"
                          />
                          <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 bg-white/[0.08] px-2 py-0.5 rounded-full">
                            {getFuelBadge(formData.fuelType).unitShort}
                          </span>
                        </div>
                        {fieldErrors.quantity && (
                          <p className="mt-1 text-[11px] text-rose-400 flex items-center gap-1 animate-in fade-in slide-in-from-top-1">
                            <AlertCircle className="h-3 w-3 shrink-0" />
                            <span>{fieldErrors.quantity}</span>
                          </p>
                        )}

                        {/* Quick Presets */}
                        <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                          <span className="text-[10px] text-slate-500 uppercase font-semibold">Quick:</span>
                          {getQuantityPresets(formData.fuelType).map((qty) => (
                            <button
                              key={qty}
                              type="button"
                              onClick={() => handleQuantityChange(qty)}
                              className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium transition-all cursor-pointer ${
                                formData.quantity === qty
                                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-bold'
                                  : 'bg-white/[0.05] text-slate-300 hover:bg-white/[0.1] border border-white/[0.06]'
                              }`}
                            >
                              {qty}{getFuelBadge(formData.fuelType).unitShort}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/[0.06]">
                        <div>
                          <label className="block text-slate-400 text-[11px] font-medium mb-1">
                            Price / {getFuelBadge(formData.fuelType).unitShort} (₹) <span className="text-rose-400 font-bold ml-0.5">*</span>
                          </label>
                          <input
                            type="number"
                            min="0.1"
                            step="any"
                            value={formData.pricePerUnit !== '' ? formData.pricePerUnit : ''}
                            onChange={(e) => {
                              handlePriceChange(e.target.value === '' ? '' : parseFloat(e.target.value));
                              if (fieldErrors.pricePerUnit) setFieldErrors((prev) => ({ ...prev, pricePerUnit: '' }));
                            }}
                            className={`w-full rounded-[10px] border p-2 text-white text-xs font-mono focus:outline-none transition-colors ${
                              fieldErrors.pricePerUnit
                                ? 'border-rose-500/80 bg-rose-500/5 focus:border-rose-500 focus:ring-1 focus:ring-rose-500/20'
                                : 'border-white/[0.1] bg-slate-900 focus:border-emerald-500'
                            }`}
                            placeholder="e.g. 104.5"
                          />
                          {fieldErrors.pricePerUnit && (
                            <p className="mt-1 text-[11px] text-rose-400 flex items-center gap-1 animate-in fade-in slide-in-from-top-1">
                              <AlertCircle className="h-3 w-3 shrink-0" />
                              <span>{fieldErrors.pricePerUnit}</span>
                            </p>
                          )}
                        </div>
                        <div>
                          <label className="block text-slate-400 text-[11px] font-medium mb-1">
                            Calculated Spend
                          </label>
                          <div className="rounded-[10px] border border-white/[0.08] bg-slate-900/80 p-2 text-emerald-400 text-xs font-mono font-bold">
                            ₹{formData.totalAmount !== '' ? Number(formData.totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Dual Telemetry Summary Card */}
                  <div className="rounded-[12px] border border-emerald-500/25 bg-emerald-500/10 p-3.5 flex items-center justify-between shadow-sm">
                    <div>
                      <span className="text-slate-400 text-xs block font-medium">Recalculated Summary:</span>
                      <span className="text-xs text-slate-300 font-mono">
                        {formData.quantity !== '' ? formData.quantity : '-'} {getFuelBadge(formData.fuelType).unitShort} @ {formData.pricePerUnit !== '' ? `₹${formData.pricePerUnit}` : '₹-'}/{getFuelBadge(formData.fuelType).unitShort}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[11px] text-slate-400 block font-medium">Total Cost</span>
                      <span className="text-xl font-black text-emerald-400">
                        ₹{formData.totalAmount !== '' ? Number(formData.totalAmount).toLocaleString('en-IN', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        }) : '0.00'}
                      </span>
                    </div>
                  </div>

                  {/* EV Guidance Hint */}
                  {formData.fuelType === 'ELECTRIC' && (
                    <div className="rounded-[12px] border border-cyan-500/25 bg-cyan-500/10 p-3 flex items-start gap-2.5 text-xs text-cyan-200">
                      <Zap className="h-4 w-4 text-cyan-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold block text-cyan-300 mb-0.5">EV Charging Guide:</span>
                        You can adjust by total session recharge (₹) or the energy units delivered (kWh).
                      </div>
                    </div>
                  )}
                </div>

                {/* RIGHT: Date, Odometer, Station, Notes */}
                <div className="space-y-4">
                  <DateTimePicker
                    label="Date & Time"
                    required
                    value={formData.entryDate}
                    onChange={(e) => {
                      setFormData({ ...formData, entryDate: e.target.value });
                      if (fieldErrors.entryDate) setFieldErrors((prev) => ({ ...prev, entryDate: '' }));
                    }}
                    error={fieldErrors.entryDate}
                  />

                  <div>
                    <label className="block text-slate-300 font-medium mb-1">
                      Odometer Reading (km) <span className="text-[10px] text-slate-500 font-normal lowercase ml-1">(optional)</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.odometer}
                      onChange={(e) => {
                        setFormData({ ...formData, odometer: e.target.value ? parseFloat(e.target.value) : '' });
                        if (fieldErrors.odometer) setFieldErrors((prev) => ({ ...prev, odometer: '' }));
                      }}
                      className={`w-full rounded-[10px] border p-3 text-white text-sm focus:outline-none transition-colors ${
                        fieldErrors.odometer
                          ? 'border-rose-500/80 bg-rose-500/5 focus:border-rose-500 focus:ring-1 focus:ring-rose-500/20'
                          : 'border-white/[0.1] bg-slate-950/80 focus:border-emerald-500'
                      }`}
                    />
                    {fieldErrors.odometer && (
                      <p className="mt-1 text-[11px] text-rose-400 flex items-center gap-1 animate-in fade-in slide-in-from-top-1">
                        <AlertCircle className="h-3 w-3 shrink-0" />
                        <span>{fieldErrors.odometer}</span>
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1">
                      Fuel Station / Charging Network <span className="text-[10px] text-slate-500 font-normal lowercase ml-1">(optional)</span>
                    </label>
                    <input
                      type="text"
                      value={formData.stationName}
                      onChange={(e) => setFormData({ ...formData, stationName: e.target.value })}
                      className="w-full rounded-[10px] border border-white/[0.1] bg-slate-950/80 p-3 text-white text-sm focus:border-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1">
                      Notes <span className="text-[10px] text-slate-500 font-normal lowercase ml-1">(optional)</span>
                    </label>
                    <textarea
                      rows={2}
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      className="w-full rounded-[10px] border border-white/[0.1] bg-slate-950/80 p-3 text-white text-sm focus:border-emerald-500 focus:outline-none resize-none"
                    />
                  </div>
                </div>
              </div>
            </form>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 border-t border-white/[0.06] px-6 py-4 bg-slate-900/90 flex-shrink-0">
              <button
                type="button"
                onClick={() => setEditingEntry(null)}
                className="rounded-full px-5 py-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="edit-fuel-form"
                disabled={submitting}
                className="rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-6 py-2 text-xs font-bold transition-all cursor-pointer active:scale-95 disabled:opacity-50 shadow-sm"
              >
                {submitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. DELETE CONFIRMATION MODAL                                              */}
      {/* ========================================================================= */}
      <Modal
        isOpen={deletingEntry !== null}
        onClose={() => setDeletingEntry(null)}
        title="Delete Fuel Entry?"
        subtitle="This action cannot be undone."
        icon={
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-500/15 text-rose-400 border border-rose-500/20 shrink-0">
            <AlertTriangle className="h-5 w-5" />
          </div>
        }
        size="md"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setDeletingEntry(null)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleDeleteSubmit}
              isLoading={submitting}
              loadingText="Deleting..."
            >
              Delete Entry
            </Button>
          </>
        }
      >
        {deletingEntry && (
          <div className="space-y-4">
            <div className="rounded-[12px] border border-white/[0.06] bg-slate-950/60 p-3.5 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-300">
                <span className="text-slate-500">Vehicle:</span>
                <span className="font-semibold text-white">{deletingEntry.vehicle?.name || 'Unassigned'}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span className="text-slate-500">Amount:</span>
                <span className="font-bold text-emerald-400">
                  ₹{deletingEntry.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span className="text-slate-500">Date:</span>
                <span className="font-mono text-slate-300">
                  {new Date(deletingEntry.entryDate).toLocaleDateString('en-GB')}
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Deleting this record will adjust total expenditure and fuel telemetry stats.
            </p>
          </div>
        )}
      </Modal>
    </div>
  );
}
