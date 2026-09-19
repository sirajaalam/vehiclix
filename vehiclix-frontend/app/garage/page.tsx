'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { api } from '../../lib/api';
import {
  Car,
  Bike,
  Truck,
  Zap,
  Plus,
  Edit2,
  Trash2,
  FileDown,
  Gauge,
  Search,
  Check,
  X,
  AlertTriangle,
  AlertCircle,
  Fuel,
  Wrench,
  Eye,
  ArrowUpDown,
  Filter,
  ChevronDown,
  ChevronUp,
  ChevronsDownUp,
  ChevronsUpDown,
} from 'lucide-react';
import { Modal, Button, Input, Select, SearchBar } from '../../components/ui';
import { Pagination } from '../../components/Pagination';

interface Vehicle {
  id: string;
  name: string;
  make?: string | null;
  model?: string | null;
  year?: number | null;
  licensePlate?: string | null;
  vehicleType: string;
  fuelType: string;
  initialOdometer: number;
  currentOdometer: number;
  tankCapacity?: number | null;
  isPrimary?: boolean;
  fillsCount?: number;
  servicesCount?: number;
}

export interface CapacityConfig {
  label: string;
  shortUnit: string;
  longUnit: string;
  placeholder: string;
  helper: string;
}

export const getCapacityConfig = (fuelType: string): CapacityConfig => {
  switch (fuelType) {
    case 'ELECTRIC':
      return {
        label: 'Battery Capacity (kWh)',
        shortUnit: 'kWh',
        longUnit: 'kWh',
        placeholder: 'e.g. 60',
        helper: 'Traction battery pack size in kilowatt-hours (kWh)',
      };
    case 'CNG':
      return {
        label: 'Cylinder Capacity (kg)',
        shortUnit: 'kg',
        longUnit: 'kg (Kilograms)',
        placeholder: 'e.g. 12',
        helper: 'CNG gas cylinder water-equivalent capacity in kilograms (kg)',
      };
    case 'DIESEL':
      return {
        label: 'Fuel Tank Capacity (L)',
        shortUnit: 'L',
        longUnit: 'Litres',
        placeholder: 'e.g. 50',
        helper: 'Usable diesel fuel tank capacity in litres (L)',
      };
    case 'PETROL':
      return {
        label: 'Fuel Tank Capacity (L)',
        shortUnit: 'L',
        longUnit: 'Litres',
        placeholder: 'e.g. 45',
        helper: 'Usable petrol fuel tank capacity in litres (L)',
      };
    case 'OTHER':
    default:
      return {
        label: 'Tank / Storage Capacity',
        shortUnit: 'units',
        longUnit: 'Units',
        placeholder: 'e.g. 40',
        helper: 'Total fuel or energy storage volume for this vehicle',
      };
  }
};

export default function GaragePage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'ALL' | 'CAR' | 'BIKE' | 'TRUCK' | 'ELECTRIC' | 'CNG' | 'PRIMARY'>('ALL');

  // Collapsed Vehicle Cards State (Set of vehicle IDs)
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set());

  const toggleCollapse = (id: string) => {
    setCollapsedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const isAllCollapsed = vehicles.length > 0 && vehicles.every((v) => collapsedIds.has(v.id));

  const toggleCollapseAll = () => {
    if (isAllCollapsed) {
      setCollapsedIds(new Set());
    } else {
      setCollapsedIds(new Set(vehicles.map((v) => v.id)));
    }
  };

  // Modal States
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [viewingVehicle, setViewingVehicle] = useState<Vehicle | null>(null);
  const [deletingVehicle, setDeletingVehicle] = useState<Vehicle | null>(null);

  // Form States (for Add & Edit)
  const [formName, setFormName] = useState('');
  const [formMake, setFormMake] = useState('');
  const [formModel, setFormModel] = useState('');
  const [formYear, setFormYear] = useState<number | ''>('');
  const [formLicensePlate, setFormLicensePlate] = useState('');
  const [formVehicleType, setFormVehicleType] = useState('CAR');
  const [formFuelType, setFormFuelType] = useState('');
  const [formInitialOdometer, setFormInitialOdometer] = useState<number | ''>(0);
  const [formCurrentOdometer, setFormCurrentOdometer] = useState<number | ''>(0);
  const [formTankCapacity, setFormTankCapacity] = useState<string>('');
  const [formIsPrimary, setFormIsPrimary] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Load vehicles
  const fetchVehicles = async () => {
    try {
      const [vehiclesData, fuelData, servicesData] = await Promise.allSettled([
        api.listVehicles(),
        api.listFuel(),
        api.listServices(),
      ]);

      const rawVehicles: Vehicle[] = vehiclesData.status === 'fulfilled' && Array.isArray(vehiclesData.value) ? vehiclesData.value : [];
      const fuelList: any[] = fuelData.status === 'fulfilled' && Array.isArray(fuelData.value) ? fuelData.value : [];
      const servicesList: any[] = servicesData.status === 'fulfilled' && Array.isArray(servicesData.value) ? servicesData.value : [];

      const mapped = rawVehicles.map((v) => ({
        ...v,
        fillsCount: fuelList.filter((f) => f.vehicleId === v.id).length,
        servicesCount: servicesList.filter((s) => s.vehicleId === v.id).length,
      }));
      setVehicles(mapped);
    } catch (err: any) {
      console.error('Failed to load vehicles:', err);
      toast.error(err.message || 'Failed to load garage vehicles');
      setVehicles([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  // Open Create Modal
  const handleOpenAdd = () => {
    setFormName('');
    setFormMake('');
    setFormModel('');
    setFormYear('');
    setFormLicensePlate('');
    setFormVehicleType('CAR');
    setFormFuelType('');
    setFormInitialOdometer(0);
    setFormCurrentOdometer(0);
    setFormTankCapacity('');
    setFormIsPrimary(vehicles.length === 0);
    setFormError(null);
    setFieldErrors({});
    setShowAddModal(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (v: Vehicle) => {
    setEditingVehicle(v);
    setFormName(v.name || '');
    setFormMake(v.make || '');
    setFormModel(v.model || '');
    setFormYear(v.year || '');
    setFormLicensePlate(v.licensePlate || '');
    setFormVehicleType(v.vehicleType || 'CAR');
    setFormFuelType(v.fuelType || 'PETROL');
    setFormInitialOdometer(v.initialOdometer ?? 0);
    setFormCurrentOdometer(v.currentOdometer ?? v.initialOdometer ?? 0);
    setFormTankCapacity(v.tankCapacity != null ? String(v.tankCapacity) : '');
    setFormIsPrimary(Boolean(v.isPrimary));
    setFormError(null);
    setFieldErrors({});
  };

  // CREATE Vehicle
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    if (!formName.trim()) {
      errors.name = 'Vehicle name is required.';
    }
    if (!formFuelType) {
      errors.fuelType = 'Please select a fuel type.';
    }
    if (!formVehicleType) {
      errors.vehicleType = 'Please select a vehicle type.';
    }
    if (formInitialOdometer === '' || Number(formInitialOdometer) < 0 || isNaN(Number(formInitialOdometer))) {
      errors.initialOdometer = 'Baseline odometer must be 0 or greater.';
    }
    if (formYear) {
      const yr = Number(formYear);
      const maxYr = new Date().getFullYear() + 1;
      if (isNaN(yr) || yr < 1900 || yr > maxYr) {
        errors.year = `Year must be between 1900 and ${maxYr}.`;
      }
    }
    if (formTankCapacity) {
      const cap = parseFloat(formTankCapacity);
      if (isNaN(cap) || cap <= 0) {
        errors.tankCapacity = 'Capacity must be greater than 0.';
      }
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      toast.error('Please resolve the highlighted errors in the form.');
      return;
    }

    setSubmitting(true);
    setFormError(null);
    setFieldErrors({});

    try {
      const payload = {
        name: formName.trim(),
        make: formMake.trim() || undefined,
        model: formModel.trim() || undefined,
        year: formYear ? Number(formYear) : undefined,
        licensePlate: formLicensePlate.trim() || undefined,
        vehicleType: formVehicleType,
        fuelType: formFuelType,
        initialOdometer: Number(formInitialOdometer) || 0,
        isPrimary: formIsPrimary,
        tankCapacity: formTankCapacity ? parseFloat(formTankCapacity) : undefined,
      };

      await api.createVehicle(payload);
      toast.success('Vehicle registered successfully!');
      setShowAddModal(false);
      await fetchVehicles();
    } catch (err: any) {
      setFormError(err.message || 'Failed to create vehicle');
      toast.error(err.message || 'Failed to create vehicle');
    } finally {
      setSubmitting(false);
    }
  };

  // UPDATE Vehicle
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVehicle) return;

    const errors: Record<string, string> = {};
    if (!formName.trim()) {
      errors.name = 'Vehicle name is required.';
    }
    if (!formFuelType) {
      errors.fuelType = 'Please select a fuel type.';
    }
    const initialOdo = Number(formInitialOdometer) || 0;
    const currentOdo = Number(formCurrentOdometer) || initialOdo;

    if (formCurrentOdometer === '' || Number(formCurrentOdometer) < 0 || isNaN(Number(formCurrentOdometer))) {
      errors.currentOdometer = 'Current odometer must be 0 or greater.';
    } else if (currentOdo < initialOdo) {
      errors.currentOdometer = `Current odometer (${currentOdo} km) cannot be less than initial baseline (${initialOdo} km).`;
    }

    if (formYear) {
      const yr = Number(formYear);
      const maxYr = new Date().getFullYear() + 1;
      if (isNaN(yr) || yr < 1900 || yr > maxYr) {
        errors.year = `Year must be between 1900 and ${maxYr}.`;
      }
    }
    if (formTankCapacity) {
      const cap = parseFloat(formTankCapacity);
      if (isNaN(cap) || cap <= 0) {
        errors.tankCapacity = 'Capacity must be greater than 0.';
      }
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      toast.error('Please resolve the highlighted errors in the form.');
      return;
    }

    setSubmitting(true);
    setFormError(null);
    setFieldErrors({});

    try {
      const payload: any = {};
      const nameTrimmed = formName.trim();
      if (nameTrimmed !== editingVehicle.name) payload.name = nameTrimmed;

      const makeVal = formMake.trim() || null;
      if (makeVal !== (editingVehicle.make || null)) payload.make = makeVal;

      const modelVal = formModel.trim() || null;
      if (modelVal !== (editingVehicle.model || null)) payload.model = modelVal;

      const yearVal = formYear ? Number(formYear) : null;
      if (yearVal !== (editingVehicle.year || null)) payload.year = yearVal;

      const plateVal = formLicensePlate.trim() || null;
      if (plateVal !== (editingVehicle.licensePlate || null)) payload.licensePlate = plateVal;

      if (formVehicleType !== editingVehicle.vehicleType) payload.vehicleType = formVehicleType;
      if (formFuelType !== editingVehicle.fuelType) payload.fuelType = formFuelType;

      if (initialOdo !== editingVehicle.initialOdometer) payload.initialOdometer = initialOdo;
      if (currentOdo !== editingVehicle.currentOdometer) payload.currentOdometer = currentOdo;

      if (formIsPrimary !== editingVehicle.isPrimary) payload.isPrimary = formIsPrimary;

      const tankVal = formTankCapacity ? parseFloat(formTankCapacity) : null;
      const existingTank =
        editingVehicle.tankCapacity !== null && editingVehicle.tankCapacity !== undefined
          ? parseFloat(String(editingVehicle.tankCapacity))
          : null;
      if (tankVal !== existingTank) payload.tankCapacity = tankVal;

      if (Object.keys(payload).length === 0) {
        toast.info('No changes were made.');
        setEditingVehicle(null);
        setSubmitting(false);
        return;
      }

      await api.updateVehicle(editingVehicle.id, payload);
      toast.success('Vehicle specifications updated!');
      setEditingVehicle(null);
      await fetchVehicles();
    } catch (err: any) {
      setFormError(err.message || 'Failed to update vehicle');
      toast.error(err.message || 'Failed to update vehicle');
    } finally {
      setSubmitting(false);
    }
  };

  // DELETE Vehicle
  const handleConfirmDelete = async () => {
    if (!deletingVehicle) return;
    setSubmitting(true);

    try {
      await api.deleteVehicle(deletingVehicle.id);
      toast.success('Vehicle removed from garage');
      setDeletingVehicle(null);
      await fetchVehicles();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete vehicle');
    } finally {
      setSubmitting(false);
    }
  };

  // Quick Toggle Primary
  const handleTogglePrimary = async (vehicle: Vehicle) => {
    const nextPrimary = !vehicle.isPrimary;
    try {
      await api.updateVehicle(vehicle.id, { isPrimary: nextPrimary });
      toast.success(nextPrimary ? `${vehicle.name} set as primary vehicle` : `${vehicle.name} unset as primary`);
      await fetchVehicles();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update primary status');
    }
  };

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(6);

  // Reset page to 1 when filters or search change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedFilter]);

  // Filtered vehicles
  const filteredVehicles = useMemo(() => {
    return vehicles.filter((v) => {
      // Search match
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        v.name.toLowerCase().includes(q) ||
        (v.make && v.make.toLowerCase().includes(q)) ||
        (v.model && v.model.toLowerCase().includes(q)) ||
        (v.licensePlate && v.licensePlate.toLowerCase().includes(q));

      if (!matchesSearch) return false;

      // Filter match
      if (selectedFilter === 'CAR') return v.vehicleType === 'CAR';
      if (selectedFilter === 'BIKE') return v.vehicleType === 'BIKE';
      if (selectedFilter === 'TRUCK') return v.vehicleType === 'TRUCK';
      if (selectedFilter === 'ELECTRIC') return v.fuelType === 'ELECTRIC';
      if (selectedFilter === 'CNG') return v.fuelType === 'CNG';
      if (selectedFilter === 'PRIMARY') return Boolean(v.isPrimary);

      return true;
    });
  }, [vehicles, searchQuery, selectedFilter]);

  // Paginated vehicles
  const totalPages = Math.ceil(filteredVehicles.length / pageSize) || 1;
  const paginatedVehicles = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredVehicles.slice(start, start + pageSize);
  }, [filteredVehicles, currentPage, pageSize]);

  // Icon helper
  const getVehicleIcon = (type: string, fuel: string) => {
    if (fuel === 'ELECTRIC') return <Zap className="h-5 w-5 text-cyan-400" />;
    if (fuel === 'CNG') return <Fuel className="h-5 w-5 text-teal-400" />;
    if (type === 'BIKE') return <Bike className="h-5 w-5 text-amber-400" />;
    if (type === 'TRUCK') return <Truck className="h-5 w-5 text-orange-400" />;
    return <Car className="h-5 w-5 text-emerald-400" />;
  };

  return (
    <div className="mx-auto max-w-7xl px-3.5 py-4 pb-24 sm:px-6 sm:py-8 sm:pb-12 lg:px-8 space-y-5 sm:space-y-8">
      {/* Page Header */}
      <div className="border-b border-white/[0.08] pb-3.5 sm:pb-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
            <h1 className="text-lg sm:text-2xl lg:text-3xl font-bold text-white tracking-tight truncate">
              Garage Vehicles
            </h1>
            <span className="rounded-full bg-emerald-500/10 px-2 sm:px-2.5 py-0.5 text-[11px] sm:text-xs font-semibold text-emerald-400 border border-emerald-500/20 shrink-0">
              <span className="sm:hidden">{vehicles.length}</span>
              <span className="hidden sm:inline">{vehicles.length} {vehicles.length === 1 ? 'Vehicle' : 'Vehicles'}</span>
            </span>
          </div>

          {/* Action Button: Refined Apple pill button that stays compact and never stretches full-width */}
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-1.5 sm:gap-2 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold shadow-[0_2px_12px_rgba(16,185,129,0.3)] transition-all cursor-pointer active:scale-95 shrink-0"
          >
            <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4 stroke-[2.5]" />
            <span>Add Vehicle</span>
          </button>
        </div>

        <p className="hidden sm:block mt-1.5 text-xs sm:text-sm text-slate-400 max-w-2xl leading-relaxed">
          Create, inspect, update, and manage your vehicles, baseline odometers, and fuel capacities.
        </p>
      </div>

      {/* Toolbar: Search (Left) & Category Filter Dropdown + Collapse All (Right) */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search Input - Full width on responsive, capped on desktop, h-10 Apple height */}
        <SearchBar
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onClear={() => setSearchQuery('')}
          placeholder="Search by name, make, model, or plate..."
        />

        {/* Right Controls: Category Filter Dropdown (Before Collapse All) + Collapse All Toggle */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Category Filter Dropdown */}
          <div className="min-w-[135px] sm:min-w-[155px]">
            <Select
              value={selectedFilter}
              onChange={(e) => setSelectedFilter(e.target.value as any)}
              leftIcon={<Filter className={`h-3.5 w-3.5 ${selectedFilter !== 'ALL' ? 'text-emerald-400' : 'text-slate-400'}`} />}
              options={[
                { value: 'ALL', label: 'All Vehicles' },
                { value: 'PRIMARY', label: 'Primary' },
                { value: 'CAR', label: 'Cars' },
                { value: 'BIKE', label: 'Bikes' },
                { value: 'TRUCK', label: 'Trucks' },
                { value: 'ELECTRIC', label: 'EV' },
                { value: 'CNG', label: 'CNG' },
              ]}
            />
          </div>

          {/* Global Collapse All / Expand All Toggle - Matching h-10 height, rounded-xl */}
          <button
            onClick={toggleCollapseAll}
            className={`inline-flex items-center gap-2 rounded-xl border h-10 px-3 sm:px-3.5 text-xs font-semibold transition-all cursor-pointer whitespace-nowrap flex-shrink-0 shadow-sm active:scale-95 ${
              isAllCollapsed
                ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25 shadow-[0_0_14px_rgba(16,185,129,0.12)]'
                : 'border-white/[0.08] bg-slate-900/60 text-slate-300 hover:text-white hover:bg-slate-800 hover:border-white/[0.15]'
            }`}
            title={isAllCollapsed ? 'Expand all vehicle cards to full specs' : 'Collapse all cards into compact summary cards'}
          >
            {isAllCollapsed ? (
              <>
                <ChevronsUpDown className="h-4 w-4 text-emerald-400" />
                <span>Expand All</span>
                <span className="hidden sm:inline rounded-full bg-emerald-500/20 px-1.5 py-0.5 text-[10px] text-emerald-300 font-mono">
                  Compact
                </span>
              </>
            ) : (
              <>
                <ChevronsDownUp className="h-4 w-4 text-slate-400" />
                <span>Collapse All</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Vehicles Grid */}
      {loading ? (
        <div className="py-16 text-center text-sm text-slate-400">Loading garage vehicles...</div>
      ) : filteredVehicles.length === 0 ? (
        <div className="rounded-[18px] border border-dashed border-white/[0.1] bg-slate-950/40 p-12 text-center space-y-3">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-900 text-slate-500 border border-white/[0.06]">
            <Car className="h-6 w-6" />
          </div>
          <h3 className="text-base font-semibold text-white tracking-tight">No vehicles found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {searchQuery || selectedFilter !== 'ALL'
              ? 'No vehicles matched your search filter criteria. Try clearing your filters.'
              : 'Add your first car, motorcycle, or commercial vehicle to begin tracking odometer and fuel expenses.'}
          </p>
          <div className="pt-2 flex justify-center gap-2">
            {searchQuery || selectedFilter !== 'ALL' ? (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedFilter('ALL');
                }}
                className="apple-btn rounded-[10px] border border-white/[0.1] px-4 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800 transition-colors"
              >
                Clear Filters
              </button>
            ) : (
              <button
                onClick={handleOpenAdd}
                className="apple-btn inline-flex items-center gap-1.5 rounded-[10px] bg-emerald-500 px-4 py-2 text-xs font-semibold text-slate-950 hover:bg-emerald-400 shadow-sm"
              >
                <Plus className="h-4 w-4" /> Add Vehicle
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {paginatedVehicles.map((v) => {
            const isCollapsed = collapsedIds.has(v.id);

            return (
              <div
                key={v.id}
                className={`group rounded-[18px] border ${
                  v.isPrimary
                    ? 'border-emerald-500/30 bg-gradient-to-b from-slate-900/80 to-slate-950/80 shadow-[0_0_24px_rgba(16,185,129,0.08)]'
                    : 'border-white/[0.08] bg-slate-900/50 shadow-[0_2px_12px_rgba(0,0,0,0.35)]'
                } ${isCollapsed ? 'p-4 sm:p-4.5' : 'p-5 sm:p-6'} flex flex-col justify-between hover:border-white/[0.18] hover:shadow-xl transition-all duration-200 relative overflow-hidden`}
              >
                {/* Primary Accent Top Stripe */}
                {v.isPrimary && (
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500" />
                )}

                <div>
                  {/* Header: Icon, Name, Primary Star & Actions */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      {/* Vehicle Type Icon (Apple 10px squircle) */}
                      <div
                        className={`flex ${isCollapsed ? 'h-9.5 w-9.5' : 'h-11 w-11'} items-center justify-center rounded-[10px] border flex-shrink-0 transition-all ${
                          v.fuelType === 'ELECTRIC'
                            ? 'bg-cyan-500/10 border-cyan-500/20'
                            : v.fuelType === 'CNG'
                            ? 'bg-teal-500/10 border-teal-500/20'
                            : v.vehicleType === 'BIKE'
                            ? 'bg-amber-500/10 border-amber-500/20'
                            : 'bg-emerald-500/10 border-emerald-500/20'
                        }`}
                      >
                        {getVehicleIcon(v.vehicleType, v.fuelType)}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h3 className="text-base font-bold text-white tracking-tight truncate">{v.name}</h3>
                          {v.isPrimary && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 flex-shrink-0">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span> Primary
                            </span>
                          )}
                        </div>
                        {(v.make || v.model) && (
                          <p className="text-xs text-slate-400 mt-0.5 truncate">
                            {v.make} {v.model} {v.year ? `(${v.year})` : ''}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Right Header: Odometer Badge (when collapsed) + Card Collapse Toggle */}
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {isCollapsed && (
                        <div className="hidden sm:flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-slate-950/70 px-2 py-1 text-xs font-mono font-bold text-white shadow-inner">
                          <Gauge className="h-3 w-3 text-emerald-400" />
                          <span>{v.currentOdometer?.toLocaleString()} km</span>
                        </div>
                      )}
                      {/* Card Collapse / Expand Chevron Button */}
                      <button
                        onClick={() => toggleCollapse(v.id)}
                        className="p-1.5 rounded-[8px] text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer"
                        title={isCollapsed ? 'Expand card specs' : 'Collapse card into compact summary'}
                      >
                        {isCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Concentric Telemetry Container - Full Specs vs Compact Summary */}
                  {isCollapsed ? (
                    <div className="mt-3 flex items-center justify-between gap-2 flex-wrap text-xs">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-white font-semibold text-[11px] bg-slate-950/70 border border-white/[0.08] px-2 py-0.5 rounded-[6px]">
                          {v.licensePlate || 'UNREGISTERED'}
                        </span>
                        <span
                          className={`rounded-[6px] border px-2 py-0.5 text-[10px] font-semibold ${
                            v.fuelType === 'ELECTRIC'
                              ? 'border-cyan-500/30 bg-cyan-500/10 text-cyan-400'
                              : v.fuelType === 'CNG'
                              ? 'border-teal-500/30 bg-teal-500/10 text-teal-400'
                              : 'border-white/[0.08] bg-slate-800/80 text-slate-300'
                          }`}
                        >
                          {v.fuelType}
                          {v.tankCapacity ? ` • ${v.tankCapacity} ${getCapacityConfig(v.fuelType).shortUnit}` : ''}
                        </span>
                      </div>
                      <div className="sm:hidden flex items-center gap-1 text-[11px] font-mono font-bold text-white">
                        <Gauge className="h-3 w-3 text-emerald-400" />
                        <span>{v.currentOdometer?.toLocaleString()} km</span>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-5 rounded-[12px] border border-white/[0.06] bg-slate-950/60 p-4 space-y-2.5 transition-all animate-in fade-in duration-200">
                      {/* License Plate & Badges */}
                      <div className="flex items-center justify-between text-xs pb-2 border-b border-white/[0.04]">
                        <span className="text-slate-400">Plate:</span>
                        <span className="font-mono text-white font-semibold tracking-wider">
                          {v.licensePlate || 'UNREGISTERED'}
                        </span>
                      </div>

                      {/* Fuel & Tank Specs */}
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400">
                          {v.fuelType === 'ELECTRIC'
                            ? 'Battery:'
                            : v.fuelType === 'CNG'
                            ? 'Cylinder:'
                            : 'Fuel Tank:'}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`rounded-[6px] border px-2 py-0.5 text-[10px] font-semibold ${
                              v.fuelType === 'ELECTRIC'
                                ? 'border-cyan-500/30 bg-cyan-500/10 text-cyan-400'
                                : v.fuelType === 'CNG'
                                ? 'border-teal-500/30 bg-teal-500/10 text-teal-400'
                                : 'border-white/[0.08] bg-slate-800/80 text-slate-300'
                            }`}
                          >
                            {v.fuelType}
                          </span>
                          {v.tankCapacity ? (
                            <span
                              className={`rounded-[6px] border px-2 py-0.5 text-[10px] font-mono font-medium ${
                                v.fuelType === 'ELECTRIC'
                                  ? 'border-cyan-500/20 bg-cyan-500/10 text-cyan-400'
                                  : v.fuelType === 'CNG'
                                  ? 'border-teal-500/20 bg-teal-500/10 text-teal-400'
                                  : 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400'
                              }`}
                            >
                              {v.tankCapacity} {getCapacityConfig(v.fuelType).shortUnit}
                            </span>
                          ) : null}
                        </div>
                      </div>

                      {/* Current Odometer */}
                      <div className="flex items-center justify-between text-xs pt-1">
                        <span className="text-slate-400 flex items-center gap-1.5">
                          <Gauge className="h-3.5 w-3.5 text-emerald-400" /> Current Odometer:
                        </span>
                        <span className="font-mono font-bold text-white text-sm">
                          {v.currentOdometer?.toLocaleString()} km
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Card Footer: Activity Stats ([⛽ X fills] [🔧 Y services]) + Quick CRUD Actions */}
                <div className={`${isCollapsed ? 'mt-3.5 pt-2.5' : 'mt-6 pt-3.5'} border-t border-white/[0.06] flex items-center justify-between gap-2 text-xs`}>
                  {/* Left: Activity Stats matching user's image */}
                  <div className="flex items-center gap-3 text-slate-400 select-none">
                    <Link
                      href="/fuel"
                      className="inline-flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer group"
                      title="View fuel logs for this vehicle"
                    >
                      <Fuel className="h-3.5 w-3.5 text-slate-400 group-hover:text-blue-400 transition-colors" />
                      <span className="text-[11px] font-medium">{v.fillsCount ?? 0} fills</span>
                    </Link>
                    <Link
                      href="/services"
                      className="inline-flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer group"
                      title="View service maintenance history for this vehicle"
                    >
                      <Wrench className="h-3.5 w-3.5 text-slate-400 group-hover:text-amber-400 transition-colors" />
                      <span className="text-[11px] font-medium">{v.servicesCount ?? 0} services</span>
                    </Link>
                  </div>

                  {/* Right: CRUD Action Buttons (View, Edit, Delete) */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {/* View Details Button */}
                    <button
                      onClick={() => setViewingVehicle(v)}
                      className="p-1.5 rounded-[8px] text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
                      title="View vehicle details"
                    >
                      <Eye className="h-4 w-4" />
                    </button>

                    {/* Edit Vehicle Button */}
                    <button
                      onClick={() => handleOpenEdit(v)}
                      className="p-1.5 rounded-[8px] text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors cursor-pointer"
                      title="Edit vehicle details"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>

                    {/* Delete Vehicle Button */}
                    <button
                      onClick={() => setDeletingVehicle(v)}
                      className="p-1.5 rounded-[8px] text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                      title="Delete vehicle"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Reusable Pagination Component */}
      {!loading && filteredVehicles.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredVehicles.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
          pageSizeOptions={[3, 6, 12, 24]}
          itemLabel="vehicles"
        />
      )}

      {/* ========================================================================= */}
      {/* 1. CREATE VEHICLE MODAL (Landscape 2-Col with Fixed Header & Footer)      */}
      {/* ========================================================================= */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-6 overflow-hidden">
          <div className="w-full max-w-3xl max-h-[90vh] rounded-[20px] border border-white/[0.12] bg-slate-900/95 shadow-2xl backdrop-blur-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* FIXED HEADER */}
            <div className="flex items-center justify-between border-b border-white/[0.06] px-6 py-4.5 bg-slate-900/90 flex-shrink-0">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">Add New Vehicle</h2>
                <p className="text-xs text-slate-400 mt-0.5">Register a new vehicle to your personal garage</p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="rounded-[8px] p-2 text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
                title="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* SCROLLABLE 2-COLUMN BODY */}
            <form id="add-vehicle-form" onSubmit={handleCreate} noValidate className="flex-1 overflow-y-auto p-6 space-y-5 scrollbar-thin text-xs">
              {formError && (
                <div className="flex items-center gap-2 rounded-[10px] border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400">
                  <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Landscape 2-Column Responsive Form */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Column: Specifications & Identity */}
                <div className="space-y-4">
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Vehicle Specifications
                  </div>

                  {/* Vehicle Name */}
                  <div>
                    <label className="block text-slate-300 font-medium mb-1.5">
                      Vehicle Name <span className="text-rose-400 font-bold ml-0.5">*</span>
                    </label>
                    <input
                      type="text"
                      value={formName}
                      onChange={(e) => {
                        setFormName(e.target.value);
                        if (fieldErrors.name) setFieldErrors((prev) => ({ ...prev, name: '' }));
                      }}
                      className={`w-full rounded-[10px] border p-3 text-white text-sm focus:outline-none transition-colors ${
                        fieldErrors.name
                          ? 'border-rose-500/80 bg-rose-500/5 focus:border-rose-500 focus:ring-1 focus:ring-rose-500/20'
                          : 'border-white/[0.1] bg-slate-950/80 focus:border-emerald-500'
                      }`}
                      placeholder="e.g. Daily Commuter"
                    />
                    {fieldErrors.name && (
                      <p className="mt-1 text-[11px] text-rose-400 flex items-center gap-1 animate-in fade-in slide-in-from-top-1">
                        <AlertCircle className="h-3 w-3 shrink-0" />
                        <span>{fieldErrors.name}</span>
                      </p>
                    )}
                  </div>

                  {/* Type & Fuel */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-300 font-medium mb-1.5">Vehicle Type</label>
                      <select
                        value={formVehicleType}
                        onChange={(e) => {
                          setFormVehicleType(e.target.value);
                          if (fieldErrors.vehicleType) setFieldErrors((prev) => ({ ...prev, vehicleType: '' }));
                        }}
                        className={`w-full rounded-[10px] border p-3 text-white text-sm focus:outline-none cursor-pointer transition-colors ${
                          fieldErrors.vehicleType
                            ? 'border-rose-500/80 bg-rose-500/5 focus:border-rose-500 focus:ring-1 focus:ring-rose-500/20'
                            : 'border-white/[0.1] bg-slate-950/80 focus:border-emerald-500'
                        }`}
                      >
                        <option value="CAR">Car</option>
                        <option value="BIKE">Motorcycle / Bike</option>
                        <option value="TRUCK">Truck / Commercial</option>
                        <option value="OTHER">Other</option>
                      </select>
                      {fieldErrors.vehicleType && (
                        <p className="mt-1 text-[11px] text-rose-400 flex items-center gap-1 animate-in fade-in slide-in-from-top-1">
                          <AlertCircle className="h-3 w-3 shrink-0" />
                          <span>{fieldErrors.vehicleType}</span>
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-slate-300 font-medium mb-1.5">
                        Fuel Type <span className="text-rose-400 font-bold ml-0.5">*</span>
                      </label>
                      <select
                        value={formFuelType}
                        onChange={(e) => {
                          setFormFuelType(e.target.value);
                          if (fieldErrors.fuelType) setFieldErrors((prev) => ({ ...prev, fuelType: '' }));
                        }}
                        className={`w-full rounded-[10px] border p-3 text-white text-sm focus:outline-none cursor-pointer transition-colors ${
                          fieldErrors.fuelType
                            ? 'border-rose-500/80 bg-rose-500/5 focus:border-rose-500 focus:ring-1 focus:ring-rose-500/20'
                            : 'border-white/[0.1] bg-slate-950/80 focus:border-emerald-500'
                        }`}
                      >
                        <option value="" disabled>Select Fuel Type *</option>
                        <option value="PETROL">Petrol</option>
                        <option value="DIESEL">Diesel</option>
                        <option value="CNG">CNG</option>
                        <option value="ELECTRIC">Electric</option>
                        <option value="OTHER">Other</option>
                      </select>
                      {fieldErrors.fuelType && (
                        <p className="mt-1 text-[11px] text-rose-400 flex items-center gap-1 animate-in fade-in slide-in-from-top-1">
                          <AlertCircle className="h-3 w-3 shrink-0" />
                          <span>{fieldErrors.fuelType}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Make & Model */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-300 font-medium mb-1.5">
                        Brand / Make <span className="text-[10px] text-slate-500 font-normal lowercase ml-1">(optional)</span>
                      </label>
                      <input
                        type="text"
                        value={formMake}
                        onChange={(e) => setFormMake(e.target.value)}
                        className="w-full rounded-[10px] border border-white/[0.1] bg-slate-950/80 p-3 text-white text-sm focus:border-emerald-500 focus:outline-none"
                        placeholder="e.g. Honda"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 font-medium mb-1.5">
                        Model <span className="text-[10px] text-slate-500 font-normal lowercase ml-1">(optional)</span>
                      </label>
                      <input
                        type="text"
                        value={formModel}
                        onChange={(e) => setFormModel(e.target.value)}
                        className="w-full rounded-[10px] border border-white/[0.1] bg-slate-950/80 p-3 text-white text-sm focus:border-emerald-500 focus:outline-none"
                        placeholder="e.g. City"
                      />
                    </div>
                  </div>

                  {/* Year & License Plate */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-300 font-medium mb-1.5">
                        Year <span className="text-[10px] text-slate-500 font-normal lowercase ml-1">(optional)</span>
                      </label>
                      <input
                        type="number"
                        min="1900"
                        max="2100"
                        value={formYear}
                        onChange={(e) => {
                          setFormYear(e.target.value ? parseInt(e.target.value) : '');
                          if (fieldErrors.year) setFieldErrors((prev) => ({ ...prev, year: '' }));
                        }}
                        className={`w-full rounded-[10px] border p-3 text-white text-sm focus:outline-none transition-colors ${
                          fieldErrors.year
                            ? 'border-rose-500/80 bg-rose-500/5 focus:border-rose-500 focus:ring-1 focus:ring-rose-500/20'
                            : 'border-white/[0.1] bg-slate-950/80 focus:border-emerald-500'
                        }`}
                        placeholder="e.g. 2024"
                      />
                      {fieldErrors.year && (
                        <p className="mt-1 text-[11px] text-rose-400 flex items-center gap-1 animate-in fade-in slide-in-from-top-1">
                          <AlertCircle className="h-3 w-3 shrink-0" />
                          <span>{fieldErrors.year}</span>
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-slate-300 font-medium mb-1.5">
                        License Plate <span className="text-[10px] text-slate-500 font-normal lowercase ml-1">(optional)</span>
                      </label>
                      <input
                        type="text"
                        value={formLicensePlate}
                        onChange={(e) => setFormLicensePlate(e.target.value)}
                        className="w-full rounded-[10px] border border-white/[0.1] bg-slate-950/80 p-3 text-white text-sm font-mono focus:border-emerald-500 focus:outline-none uppercase"
                        placeholder="e.g. MH01AB1234"
                      />
                    </div>
                  </div>
                </div>

                {/* Right Column: Telemetry, Capacity & Defaults */}
                <div className="space-y-4">
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Telemetry & Defaults
                  </div>

                  {/* Baseline Odometer & Dynamic Capacity */}
                  <div>
                    <label className="block text-slate-300 font-medium mb-1.5">
                      Baseline Odometer (km) <span className="text-rose-400 font-bold ml-0.5">*</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formInitialOdometer}
                      onChange={(e) => {
                        setFormInitialOdometer(e.target.value === '' ? '' : parseFloat(e.target.value) || 0);
                        if (fieldErrors.initialOdometer) setFieldErrors((prev) => ({ ...prev, initialOdometer: '' }));
                      }}
                      className={`w-full rounded-[10px] border p-3 text-white text-sm font-mono focus:outline-none transition-colors ${
                        fieldErrors.initialOdometer
                          ? 'border-rose-500/80 bg-rose-500/5 focus:border-rose-500 focus:ring-1 focus:ring-rose-500/20'
                          : 'border-white/[0.1] bg-slate-950/80 focus:border-emerald-500'
                      }`}
                      placeholder="0"
                    />
                    {fieldErrors.initialOdometer && (
                      <p className="mt-1 text-[11px] text-rose-400 flex items-center gap-1 animate-in fade-in slide-in-from-top-1">
                        <AlertCircle className="h-3 w-3 shrink-0" />
                        <span>{fieldErrors.initialOdometer}</span>
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1.5 flex items-center justify-between">
                      <span>
                        {getCapacityConfig(formFuelType).label} <span className="text-[10px] text-slate-500 font-normal lowercase ml-1">(optional)</span>
                      </span>
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        value={formTankCapacity}
                        onChange={(e) => {
                          setFormTankCapacity(e.target.value);
                          if (fieldErrors.tankCapacity) setFieldErrors((prev) => ({ ...prev, tankCapacity: '' }));
                        }}
                        className={`w-full rounded-[10px] border p-3 pr-16 text-white text-sm font-mono focus:outline-none transition-colors ${
                          fieldErrors.tankCapacity
                            ? 'border-rose-500/80 bg-rose-500/5 focus:border-rose-500 focus:ring-1 focus:ring-rose-500/20'
                            : 'border-white/[0.1] bg-slate-950/80 focus:border-emerald-500'
                        }`}
                        placeholder={getCapacityConfig(formFuelType).placeholder}
                      />
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-[6px] bg-slate-800 border border-white/[0.08] px-2 py-1 text-[11px] font-mono font-semibold text-slate-300 pointer-events-none">
                        {getCapacityConfig(formFuelType).shortUnit}
                      </span>
                    </div>
                    {fieldErrors.tankCapacity ? (
                      <p className="mt-1 text-[11px] text-rose-400 flex items-center gap-1 animate-in fade-in slide-in-from-top-1">
                        <AlertCircle className="h-3 w-3 shrink-0" />
                        <span>{fieldErrors.tankCapacity}</span>
                      </p>
                    ) : (
                      <p className="text-[11px] text-slate-500 mt-1">{getCapacityConfig(formFuelType).helper}</p>
                    )}
                  </div>

                  {/* Set as Primary Vehicle option */}
                  <div className="pt-1">
                    <label className="flex items-center gap-3 cursor-pointer group select-none rounded-[12px] border border-white/[0.08] bg-slate-950/60 p-3.5 hover:border-white/[0.14] transition-all">
                      <div className="relative flex items-center justify-center">
                        <input
                          type="checkbox"
                          checked={formIsPrimary}
                          onChange={(e) => setFormIsPrimary(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-5 h-5 rounded-[6px] border border-white/[0.2] bg-slate-950 peer-checked:bg-emerald-500 peer-checked:border-emerald-500 transition-all flex items-center justify-center">
                          {formIsPrimary && <Check className="h-3.5 w-3.5 text-slate-950 stroke-[3]" />}
                        </div>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-semibold text-white">Set as Primary Vehicle</span>
                        <span className="text-[11px] text-slate-400">
                          Used as default vehicle for quick fuel logging and trips
                        </span>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            </form>

            {/* FIXED FOOTER */}
            <div className="flex items-center justify-between border-t border-white/[0.08] px-6 py-4 bg-slate-900/90 flex-shrink-0">
              <span className="text-[11px] text-slate-500">* Required field</span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="apple-btn rounded-[10px] border border-white/[0.1] px-4 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  form="add-vehicle-form"
                  disabled={submitting}
                  className="apple-btn rounded-[10px] bg-emerald-500 px-5 py-2 text-xs font-semibold text-slate-950 shadow-sm hover:bg-emerald-400 transition-colors cursor-pointer active:scale-95 disabled:opacity-50"
                >
                  {submitting ? 'Creating...' : 'Create Vehicle'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. EDIT VEHICLE MODAL (Landscape 2-Col with Fixed Header & Footer)        */}
      {/* ========================================================================= */}
      {editingVehicle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-6 overflow-hidden">
          <div className="w-full max-w-3xl max-h-[90vh] rounded-[20px] border border-white/[0.12] bg-slate-900/95 shadow-2xl backdrop-blur-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* FIXED HEADER */}
            <div className="flex items-center justify-between border-b border-white/[0.06] px-6 py-4.5 bg-slate-900/90 flex-shrink-0">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">Edit Vehicle</h2>
                <p className="text-xs text-slate-400 mt-0.5">Modify specifications and odometer readings</p>
              </div>
              <button
                onClick={() => setEditingVehicle(null)}
                className="rounded-[8px] p-2 text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
                title="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* SCROLLABLE CENTER BODY */}
            <form id="edit-vehicle-form" onSubmit={handleUpdate} noValidate className="flex-1 overflow-y-auto p-6 space-y-5 scrollbar-thin text-xs">
              {formError && (
                <div className="flex items-center gap-2 rounded-[10px] border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400">
                  <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Landscape 2-Column Responsive Form */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Column: Specifications & Identity */}
                <div className="space-y-4">
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Vehicle Specifications
                  </div>

                  {/* Vehicle Name */}
                  <div>
                    <label className="block text-slate-300 font-medium mb-1.5">
                      Vehicle Name <span className="text-rose-400 font-bold ml-0.5">*</span>
                    </label>
                    <input
                      type="text"
                      value={formName}
                      onChange={(e) => {
                        setFormName(e.target.value);
                        if (fieldErrors.name) setFieldErrors((prev) => ({ ...prev, name: '' }));
                      }}
                      className={`w-full rounded-[10px] border p-3 text-white text-sm focus:outline-none transition-colors ${
                        fieldErrors.name
                          ? 'border-rose-500/80 bg-rose-500/5 focus:border-rose-500 focus:ring-1 focus:ring-rose-500/20'
                          : 'border-white/[0.1] bg-slate-950/80 focus:border-emerald-500'
                      }`}
                    />
                    {fieldErrors.name && (
                      <p className="mt-1 text-[11px] text-rose-400 flex items-center gap-1 animate-in fade-in slide-in-from-top-1">
                        <AlertCircle className="h-3 w-3 shrink-0" />
                        <span>{fieldErrors.name}</span>
                      </p>
                    )}
                  </div>

                  {/* Type & Fuel */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-300 font-medium mb-1.5">Vehicle Type</label>
                      <select
                        value={formVehicleType}
                        onChange={(e) => {
                          setFormVehicleType(e.target.value);
                          if (fieldErrors.vehicleType) setFieldErrors((prev) => ({ ...prev, vehicleType: '' }));
                        }}
                        className={`w-full rounded-[10px] border p-3 text-white text-sm focus:outline-none cursor-pointer transition-colors ${
                          fieldErrors.vehicleType
                            ? 'border-rose-500/80 bg-rose-500/5 focus:border-rose-500 focus:ring-1 focus:ring-rose-500/20'
                            : 'border-white/[0.1] bg-slate-950/80 focus:border-emerald-500'
                        }`}
                      >
                        <option value="CAR">Car</option>
                        <option value="BIKE">Motorcycle / Bike</option>
                        <option value="TRUCK">Truck / Commercial</option>
                        <option value="OTHER">Other</option>
                      </select>
                      {fieldErrors.vehicleType && (
                        <p className="mt-1 text-[11px] text-rose-400 flex items-center gap-1 animate-in fade-in slide-in-from-top-1">
                          <AlertCircle className="h-3 w-3 shrink-0" />
                          <span>{fieldErrors.vehicleType}</span>
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-slate-300 font-medium mb-1.5">
                        Fuel Type <span className="text-rose-400 font-bold ml-0.5">*</span>
                      </label>
                      <select
                        value={formFuelType}
                        onChange={(e) => {
                          setFormFuelType(e.target.value);
                          if (fieldErrors.fuelType) setFieldErrors((prev) => ({ ...prev, fuelType: '' }));
                        }}
                        className={`w-full rounded-[10px] border p-3 text-white text-sm focus:outline-none cursor-pointer transition-colors ${
                          fieldErrors.fuelType
                            ? 'border-rose-500/80 bg-rose-500/5 focus:border-rose-500 focus:ring-1 focus:ring-rose-500/20'
                            : 'border-white/[0.1] bg-slate-950/80 focus:border-emerald-500'
                        }`}
                      >
                        <option value="PETROL">Petrol</option>
                        <option value="DIESEL">Diesel</option>
                        <option value="CNG">CNG</option>
                        <option value="ELECTRIC">Electric</option>
                        <option value="OTHER">Other</option>
                      </select>
                      {fieldErrors.fuelType && (
                        <p className="mt-1 text-[11px] text-rose-400 flex items-center gap-1 animate-in fade-in slide-in-from-top-1">
                          <AlertCircle className="h-3 w-3 shrink-0" />
                          <span>{fieldErrors.fuelType}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Make & Model */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-300 font-medium mb-1.5">
                        Brand / Make <span className="text-[10px] text-slate-500 font-normal lowercase ml-1">(optional)</span>
                      </label>
                      <input
                        type="text"
                        value={formMake}
                        onChange={(e) => setFormMake(e.target.value)}
                        className="w-full rounded-[10px] border border-white/[0.1] bg-slate-950/80 p-3 text-white text-sm focus:border-emerald-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 font-medium mb-1.5">
                        Model <span className="text-[10px] text-slate-500 font-normal lowercase ml-1">(optional)</span>
                      </label>
                      <input
                        type="text"
                        value={formModel}
                        onChange={(e) => setFormModel(e.target.value)}
                        className="w-full rounded-[10px] border border-white/[0.1] bg-slate-950/80 p-3 text-white text-sm focus:border-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Year & License Plate */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-300 font-medium mb-1.5">
                        Year <span className="text-[10px] text-slate-500 font-normal lowercase ml-1">(optional)</span>
                      </label>
                      <input
                        type="number"
                        min="1900"
                        max="2100"
                        value={formYear}
                        onChange={(e) => {
                          setFormYear(e.target.value ? parseInt(e.target.value) : '');
                          if (fieldErrors.year) setFieldErrors((prev) => ({ ...prev, year: '' }));
                        }}
                        className={`w-full rounded-[10px] border p-3 text-white text-sm focus:outline-none transition-colors ${
                          fieldErrors.year
                            ? 'border-rose-500/80 bg-rose-500/5 focus:border-rose-500 focus:ring-1 focus:ring-rose-500/20'
                            : 'border-white/[0.1] bg-slate-950/80 focus:border-emerald-500'
                        }`}
                      />
                      {fieldErrors.year && (
                        <p className="mt-1 text-[11px] text-rose-400 flex items-center gap-1 animate-in fade-in slide-in-from-top-1">
                          <AlertCircle className="h-3 w-3 shrink-0" />
                          <span>{fieldErrors.year}</span>
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-slate-300 font-medium mb-1.5">
                        License Plate <span className="text-[10px] text-slate-500 font-normal lowercase ml-1">(optional)</span>
                      </label>
                      <input
                        type="text"
                        value={formLicensePlate}
                        onChange={(e) => setFormLicensePlate(e.target.value)}
                        className="w-full rounded-[10px] border border-white/[0.1] bg-slate-950/80 p-3 text-white text-sm font-mono focus:border-emerald-500 focus:outline-none uppercase"
                      />
                    </div>
                  </div>
                </div>

                {/* Right Column: Telemetry, Capacity & Defaults */}
                <div className="space-y-4">
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Telemetry & Defaults
                  </div>

                  {/* Current Odometer */}
                  <div>
                    <label className="block text-slate-300 font-medium mb-1.5">
                      Current Odometer (km) <span className="text-rose-400 font-bold ml-0.5">*</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formCurrentOdometer}
                      onChange={(e) => {
                        setFormCurrentOdometer(e.target.value === '' ? '' : parseFloat(e.target.value) || 0);
                        if (fieldErrors.currentOdometer) setFieldErrors((prev) => ({ ...prev, currentOdometer: '' }));
                      }}
                      className={`w-full rounded-[10px] border p-3 text-white text-sm font-mono focus:outline-none transition-colors ${
                        fieldErrors.currentOdometer
                          ? 'border-rose-500/80 bg-rose-500/5 focus:border-rose-500 focus:ring-1 focus:ring-rose-500/20'
                          : 'border-white/[0.1] bg-slate-950/80 focus:border-emerald-500'
                      }`}
                    />
                    {fieldErrors.currentOdometer && (
                      <p className="mt-1 text-[11px] text-rose-400 flex items-center gap-1 animate-in fade-in slide-in-from-top-1">
                        <AlertCircle className="h-3 w-3 shrink-0" />
                        <span>{fieldErrors.currentOdometer}</span>
                      </p>
                    )}
                  </div>

                  {/* Dynamic Capacity */}
                  <div>
                    <label className="block text-slate-300 font-medium mb-1.5 flex items-center justify-between">
                      <span>
                        {getCapacityConfig(formFuelType).label} <span className="text-[10px] text-slate-500 font-normal lowercase ml-1">(optional)</span>
                      </span>
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        value={formTankCapacity}
                        onChange={(e) => {
                          setFormTankCapacity(e.target.value);
                          if (fieldErrors.tankCapacity) setFieldErrors((prev) => ({ ...prev, tankCapacity: '' }));
                        }}
                        className={`w-full rounded-[10px] border p-3 pr-16 text-white text-sm font-mono focus:outline-none transition-colors ${
                          fieldErrors.tankCapacity
                            ? 'border-rose-500/80 bg-rose-500/5 focus:border-rose-500 focus:ring-1 focus:ring-rose-500/20'
                            : 'border-white/[0.1] bg-slate-950/80 focus:border-emerald-500'
                        }`}
                        placeholder={getCapacityConfig(formFuelType).placeholder}
                      />
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-[6px] bg-slate-800 border border-white/[0.08] px-2 py-1 text-[11px] font-mono font-semibold text-slate-300 pointer-events-none">
                        {getCapacityConfig(formFuelType).shortUnit}
                      </span>
                    </div>
                    {fieldErrors.tankCapacity ? (
                      <p className="mt-1 text-[11px] text-rose-400 flex items-center gap-1 animate-in fade-in slide-in-from-top-1">
                        <AlertCircle className="h-3 w-3 shrink-0" />
                        <span>{fieldErrors.tankCapacity}</span>
                      </p>
                    ) : (
                      <p className="text-[11px] text-slate-500 mt-1">{getCapacityConfig(formFuelType).helper}</p>
                    )}
                  </div>

                  {/* Set as Primary Vehicle option */}
                  <div className="pt-1">
                    <label className="flex items-center gap-3 cursor-pointer group select-none rounded-[12px] border border-white/[0.08] bg-slate-950/60 p-3.5 hover:border-white/[0.14] transition-all">
                      <div className="relative flex items-center justify-center">
                        <input
                          type="checkbox"
                          checked={formIsPrimary}
                          onChange={(e) => setFormIsPrimary(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-5 h-5 rounded-[6px] border border-white/[0.2] bg-slate-950 peer-checked:bg-emerald-500 peer-checked:border-emerald-500 transition-all flex items-center justify-center">
                          {formIsPrimary && <Check className="h-3.5 w-3.5 text-slate-950 stroke-[3]" />}
                        </div>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-semibold text-white">Set as Primary Vehicle</span>
                        <span className="text-[11px] text-slate-400">
                          Default vehicle for quick fuel logging and trip expenses
                        </span>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            </form>

            {/* FIXED FOOTER */}
            <div className="flex items-center justify-between border-t border-white/[0.08] px-6 py-4 bg-slate-900/90 flex-shrink-0">
              <span className="text-[11px] text-slate-500">* Required field</span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setEditingVehicle(null)}
                  className="apple-btn rounded-[10px] border border-white/[0.1] px-4 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  form="edit-vehicle-form"
                  disabled={submitting}
                  className="apple-btn rounded-[10px] bg-emerald-500 px-5 py-2 text-xs font-semibold text-slate-950 shadow-sm hover:bg-emerald-400 transition-colors cursor-pointer active:scale-95 disabled:opacity-50"
                >
                  {submitting ? 'Updating...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. VIEW VEHICLE DETAILS MODAL (Read Inspection Modal)                     */}
      {/* ========================================================================= */}
      {viewingVehicle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-6 overflow-hidden">
          <div className="w-full max-w-lg max-h-[90vh] rounded-[20px] border border-white/[0.12] bg-slate-900/95 shadow-2xl backdrop-blur-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* FIXED HEADER */}
            <div className="flex items-start justify-between border-b border-white/[0.06] px-6 py-4.5 bg-slate-900/90 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-[12px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex-shrink-0">
                  {getVehicleIcon(viewingVehicle.vehicleType, viewingVehicle.fuelType)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">{viewingVehicle.name}</h2>
                    {viewingVehicle.isPrimary && (
                      <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
                        Primary
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400">
                    {viewingVehicle.make} {viewingVehicle.model} {viewingVehicle.year ? `(${viewingVehicle.year})` : ''}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setViewingVehicle(null)}
                className="rounded-[8px] p-2 text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
                title="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* SCROLLABLE CENTER BODY */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-thin">
              {/* Spec Details Table */}
              <div className="rounded-[14px] border border-white/[0.07] bg-slate-950/70 p-4 divide-y divide-white/[0.04] text-xs space-y-2.5">
                <div className="flex items-center justify-between pt-1">
                  <span className="text-slate-400">Registration Number</span>
                  <span className="font-mono text-white font-bold">{viewingVehicle.licensePlate || '—'}</span>
                </div>
                <div className="flex items-center justify-between pt-2.5">
                  <span className="text-slate-400">Vehicle Type</span>
                  <span className="text-white font-medium capitalize">{viewingVehicle.vehicleType.toLowerCase()}</span>
                </div>
                <div className="flex items-center justify-between pt-2.5">
                  <span className="text-slate-400">Fuel Classification</span>
                  <span className="rounded-[6px] bg-slate-800/80 px-2 py-0.5 text-[10px] font-semibold text-slate-300 border border-white/[0.08]">
                    {viewingVehicle.fuelType}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-2.5">
                  <span className="text-slate-400">
                    {viewingVehicle.fuelType === 'ELECTRIC'
                      ? 'Battery Pack Capacity'
                      : viewingVehicle.fuelType === 'CNG'
                      ? 'Cylinder Storage Capacity'
                      : 'Fuel Tank Capacity'}
                  </span>
                  <span className="font-mono text-emerald-400 font-semibold">
                    {viewingVehicle.tankCapacity
                      ? `${viewingVehicle.tankCapacity} ${getCapacityConfig(viewingVehicle.fuelType).longUnit}`
                      : 'Not specified'}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-2.5">
                  <span className="text-slate-400">Current Odometer</span>
                  <span className="font-mono text-white font-bold text-sm">
                    {viewingVehicle.currentOdometer?.toLocaleString()} km
                  </span>
                </div>
                <div className="flex items-center justify-between pt-2.5">
                  <span className="text-slate-400">Baseline Registration Odometer</span>
                  <span className="font-mono text-slate-300">{viewingVehicle.initialOdometer?.toLocaleString()} km</span>
                </div>
                <div className="flex items-center justify-between pt-2.5">
                  <span className="text-slate-400">Total Tracked Distance</span>
                  <span className="font-mono text-emerald-400 font-semibold">
                    {(
                      (viewingVehicle.currentOdometer || 0) - (viewingVehicle.initialOdometer || 0)
                    ).toLocaleString()}{' '}
                    km
                  </span>
                </div>
              </div>

              {/* Quick Activity Pulse: Refills & Services Badges */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <Link
                  href="/fuel"
                  className="rounded-[12px] border border-white/[0.07] bg-slate-950/60 p-3.5 flex items-center justify-between hover:border-blue-500/30 hover:bg-slate-950 transition-all group"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      <Fuel className="h-4 w-4" />
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-400 block">Fuel Activity</span>
                      <span className="text-xs font-bold text-white font-mono">{viewingVehicle.fillsCount ?? 0} fills</span>
                    </div>
                  </div>
                  <span className="text-[10px] text-blue-400 group-hover:underline">View →</span>
                </Link>

                <Link
                  href="/services"
                  className="rounded-[12px] border border-white/[0.07] bg-slate-950/60 p-3.5 flex items-center justify-between hover:border-amber-500/30 hover:bg-slate-950 transition-all group"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      <Wrench className="h-4 w-4" />
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-400 block">Maintenance</span>
                      <span className="text-xs font-bold text-white font-mono">{viewingVehicle.servicesCount ?? 0} services</span>
                    </div>
                  </div>
                  <span className="text-[10px] text-amber-400 group-hover:underline">View →</span>
                </Link>
              </div>

              {/* Quick Links / Actions */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <Link
                  href={`/fuel`}
                  className="apple-btn flex items-center justify-center gap-2 rounded-[10px] border border-blue-500/20 bg-blue-500/10 px-3 py-2.5 text-xs font-medium text-blue-400 hover:bg-blue-500/20 transition-all text-center"
                >
                  <Fuel className="h-4 w-4" /> Log Fuel Refill
                </Link>
                <Link
                  href={`/services`}
                  className="apple-btn flex items-center justify-center gap-2 rounded-[10px] border border-amber-500/20 bg-amber-500/10 px-3 py-2.5 text-xs font-medium text-amber-400 hover:bg-amber-500/20 transition-all text-center"
                >
                  <Wrench className="h-4 w-4" /> Log Maintenance
                </Link>
              </div>
            </div>

            {/* FIXED FOOTER */}
            <div className="flex items-center justify-between border-t border-white/[0.08] px-6 py-4 bg-slate-900/90 flex-shrink-0">
              <a
                href={api.downloadVehicleReportUrl(viewingVehicle.id)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
              >
                <FileDown className="h-4 w-4" /> Download PDF Summary
              </a>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const toEdit = viewingVehicle;
                    setViewingVehicle(null);
                    handleOpenEdit(toEdit);
                  }}
                  className="apple-btn rounded-[10px] border border-white/[0.1] px-4 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Edit Vehicle
                </button>
                <button
                  type="button"
                  onClick={() => setViewingVehicle(null)}
                  className="apple-btn rounded-[10px] bg-slate-800 px-4 py-2 text-xs font-medium text-white hover:bg-slate-700 transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. DELETE CONFIRMATION DIALOG (Safe Apple Deletion Modal)                 */}
      {/* ========================================================================= */}
      <Modal
        isOpen={deletingVehicle !== null}
        onClose={() => setDeletingVehicle(null)}
        title={deletingVehicle ? `Delete "${deletingVehicle.name}"?` : 'Delete Vehicle?'}
        icon={
          <div className="flex h-11 w-11 items-center justify-center rounded-[10px] bg-red-500/10 text-red-400 border border-red-500/20 shrink-0">
            <AlertTriangle className="h-6 w-6" />
          </div>
        }
        size="md"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setDeletingVehicle(null)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              disabled={submitting}
              isLoading={submitting}
              loadingText="Deleting..."
              onClick={handleConfirmDelete}
            >
              Delete Vehicle
            </Button>
          </>
        }
      >
        <p className="text-xs text-slate-400 leading-relaxed">
          This will permanently delete this vehicle along with its associated fuel entries and maintenance logs.
          Any trips referencing this vehicle will be safely preserved.
        </p>
      </Modal>
    </div>
  );
}
