'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { api } from '../../lib/api';
import { Pagination } from '../../components/Pagination';
import { Modal, Button, Input, Select, DatePicker, SearchBar, Textarea } from '../../components/ui';
import {
  Wrench,
  Plus,
  Trash2,
  Calendar,
  Search,
  X,
  Filter,
  Car,
  ChevronDown,
  Clock,
  Eye,
  Edit2,
  DollarSign,
  AlertTriangle,
  AlertCircle,
  FileText,
  CheckCircle2,
  TrendingUp,
  Package,
} from 'lucide-react';

interface ServicePartItem {
  id?: string;
  partName: string;
  price: number;
  notes?: string;
  unitCost?: number;
  quantity?: number;
  totalCost?: number;
  partNumber?: string;
}

interface ServiceRecord {
  id: string;
  vehicleId: string;
  userId: string;
  serviceDate: string;
  odometer: number | null;
  serviceProvider: string | null;
  notes: string | null;
  labourCost: number;
  partsCost: number;
  tax: number;
  miscCost: number;
  totalCost: number;
  nextServiceDate: string | null;
  nextServiceOdometer: number | null;
  reminderNotes: string | null;
  documentPaths?: string[];
  parts?: ServicePartItem[];
  createdAt?: string;
  updatedAt?: string;
}

const COMMON_AUTOMOTIVE_PARTS = [
  'Engine Oil',
  'Oil Filter',
  'Air Filter',
  'Cabin / AC Filter',
  'Brake Pads (Front/Rear)',
  'Brake Discs / Rotors',
  'Spark Plugs',
  'Car Battery',
  'Wiper Blades',
  'Coolant / Antifreeze',
  'Brake Fluid',
  'Transmission Fluid',
  'Fuel Filter',
  'Clutch Plate / Assembly',
  'Timing Belt / Drive Belt',
  'Tyres / Wheel Alignment',
  'Suspension Struts / Bushing',
];

export default function ServicesPage() {
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [records, setRecords] = useState<ServiceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVehicleFilter, setSelectedVehicleFilter] = useState('ALL');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(6);

  // Modal States
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<ServiceRecord | null>(null);

  // Form State for Add / Edit
  const [formVehicleId, setFormVehicleId] = useState('');
  const [formServiceDate, setFormServiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [formOdometer, setFormOdometer] = useState<number | ''>('');
  const [formServiceProvider, setFormServiceProvider] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formLabourCost, setFormLabourCost] = useState<number | ''>(0);
  const [formPartsCost, setFormPartsCost] = useState<number | ''>(0);
  const [formTax, setFormTax] = useState<number | ''>(0);
  const [formMiscCost, setFormMiscCost] = useState<number | ''>(0);
  const [formNextServiceDate, setFormNextServiceDate] = useState('');
  const [formNextServiceOdometer, setFormNextServiceOdometer] = useState<number | ''>('');
  const [formReminderNotes, setFormReminderNotes] = useState('');
  const [formParts, setFormParts] = useState<ServicePartItem[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Quick Part Add State (Part Name Preset / Custom *, Price *, Note)
  const [showAddPartSection, setShowAddPartSection] = useState(false);
  const [selectedPartPreset, setSelectedPartPreset] = useState('');
  const [customPartName, setCustomPartName] = useState('');
  const [newPartPrice, setNewPartPrice] = useState<number | ''>('');
  const [newPartNote, setNewPartNote] = useState('');
  const [partInputError, setPartInputError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const loadData = async () => {
    try {
      const [vData, sData] = await Promise.all([api.listVehicles(), api.listServices()]);
      setVehicles(Array.isArray(vData) ? vData : []);
      setRecords(Array.isArray(sData) ? sData : []);
      if (vData && vData.length > 0 && !formVehicleId) {
        setFormVehicleId(vData[0].id);
      }
    } catch (err: any) {
      console.error('Failed to load maintenance services:', err);
      toast.error(err.message || 'Failed to load maintenance records');
      setVehicles([]);
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Map vehicle details lookup
  const vehicleMap = useMemo(() => {
    const map = new Map<string, any>();
    vehicles.forEach((v) => map.set(v.id, v));
    return map;
  }, [vehicles]);

  // Telemetry KPIs Calculation
  const stats = useMemo(() => {
    const totalSpend = records.reduce((sum, r) => sum + (r.totalCost || 0), 0);
    const totalPartsCost = records.reduce((sum, r) => sum + (r.partsCost || 0), 0);
    const totalLabourCost = records.reduce((sum, r) => sum + (r.labourCost || 0), 0);

    const now = new Date();
    const upcomingServices = records.filter((r) => {
      if (!r.nextServiceDate) return false;
      const target = new Date(r.nextServiceDate);
      return target >= now;
    });

    return {
      totalSpend,
      serviceCount: records.length,
      partsAndLabour: totalPartsCost + totalLabourCost,
      upcomingCount: upcomingServices.length,
    };
  }, [records]);

  // Filtered Records
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      // Vehicle Filter
      if (selectedVehicleFilter !== 'ALL' && r.vehicleId !== selectedVehicleFilter) {
        return false;
      }

      // Category / Type Filter
      if (selectedCategoryFilter !== 'ALL') {
        const text = `${r.notes || ''} ${r.serviceProvider || ''}`.toLowerCase();
        if (selectedCategoryFilter === 'OIL' && !text.includes('oil') && !text.includes('fluid')) return false;
        if (selectedCategoryFilter === 'ROUTINE' && !text.includes('routine') && !text.includes('scheduled') && !text.includes('inspection')) return false;
        if (selectedCategoryFilter === 'BRAKES' && !text.includes('brake') && !text.includes('wheel') && !text.includes('suspension')) return false;
        if (selectedCategoryFilter === 'REPAIRS' && !text.includes('repair') && !text.includes('replacement') && !text.includes('part')) return false;
        if (selectedCategoryFilter === 'REMINDER' && !r.nextServiceDate) return false;
      }

      // Search Query Filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const v = vehicleMap.get(r.vehicleId);
        const matchVehicle = v ? `${v.name} ${v.make || ''} ${v.model || ''} ${v.licensePlate || ''}`.toLowerCase().includes(q) : false;
        const matchProvider = (r.serviceProvider || '').toLowerCase().includes(q);
        const matchNotes = (r.notes || '').toLowerCase().includes(q);
        const matchReminder = (r.reminderNotes || '').toLowerCase().includes(q);
        if (!matchVehicle && !matchProvider && !matchNotes && !matchReminder) return false;
      }

      return true;
    });
  }, [records, selectedVehicleFilter, selectedCategoryFilter, searchQuery, vehicleMap]);

  // Paginated Records
  const totalPages = Math.ceil(filteredRecords.length / pageSize) || 1;
  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRecords.slice(start, start + pageSize);
  }, [filteredRecords, currentPage, pageSize]);

  // Reset form helper
  const resetForm = () => {
    setFormVehicleId(vehicles[0]?.id || '');
    setFormServiceDate(new Date().toISOString().split('T')[0]);
    setFormOdometer('');
    setFormServiceProvider('');
    setFormNotes('');
    setFormLabourCost(0);
    setFormPartsCost(0);
    setFormTax(0);
    setFormMiscCost(0);
    setFormNextServiceDate('');
    setFormNextServiceOdometer('');
    setFormReminderNotes('');
    setFormParts([]);
    setShowAddPartSection(false);
    setSelectedPartPreset('');
    setCustomPartName('');
    setNewPartPrice('');
    setNewPartNote('');
    setPartInputError(null);
    setFieldErrors({});
  };

  const handleOpenAdd = () => {
    resetForm();
    setShowAddModal(true);
  };

  const handleOpenEdit = async (rec: ServiceRecord) => {
    setSelectedRecord(rec);
    setFieldErrors({});
    setFormVehicleId(rec.vehicleId);
    setFormServiceDate(rec.serviceDate ? new Date(rec.serviceDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
    setFormOdometer(rec.odometer !== null ? rec.odometer : '');
    setFormServiceProvider(rec.serviceProvider || '');
    setFormNotes(rec.notes || '');
    setFormLabourCost(rec.labourCost ?? 0);
    setFormPartsCost(rec.partsCost ?? 0);
    setFormTax(rec.tax ?? 0);
    setFormMiscCost(rec.miscCost ?? 0);
    setFormNextServiceDate(rec.nextServiceDate ? new Date(rec.nextServiceDate).toISOString().split('T')[0] : '');
    setFormNextServiceOdometer(rec.nextServiceOdometer !== null ? rec.nextServiceOdometer : '');
    setFormReminderNotes(rec.reminderNotes || '');
    const mappedParts = (rec.parts || []).map((p) => ({
      ...p,
      partName: p.partName,
      price: p.price ?? p.unitCost ?? p.totalCost ?? 0,
      notes: p.notes || '',
    }));
    setFormParts(mappedParts);
    setShowAddPartSection(false);
    setSelectedPartPreset('');
    setCustomPartName('');
    setNewPartPrice('');
    setNewPartNote('');
    setPartInputError(null);
    setShowEditModal(true);

    // If rec.parts was empty or not preloaded, fetch full detail to ensure parts are shown
    if (!rec.parts || rec.parts.length === 0) {
      try {
        const detail = await api.getService(rec.id);
        if (detail && detail.parts && detail.parts.length > 0) {
          setFormParts(
            detail.parts.map((p: any) => ({
              ...p,
              partName: p.partName,
              price: p.price ?? p.unitCost ?? p.totalCost ?? 0,
              notes: p.notes || '',
            }))
          );
        }
      } catch (e) {
        console.error('Failed to fetch service detail parts', e);
      }
    }
  };

  const handleOpenView = async (rec: ServiceRecord) => {
    setSelectedRecord(rec);
    setShowViewModal(true);
    if (!rec.parts || rec.parts.length === 0) {
      try {
        const detail = await api.getService(rec.id);
        if (detail && detail.parts) {
          setSelectedRecord({ ...rec, parts: detail.parts });
        }
      } catch (e) {
        console.error('Failed to fetch service detail for view', e);
      }
    }
  };

  const handleOpenDelete = (rec: ServiceRecord) => {
    setSelectedRecord(rec);
    setShowDeleteModal(true);
  };

  // Add Itemized Part to form (Name and Price are compulsory, Note is optional)
  const handleAddPartItem = () => {
    setPartInputError(null);
    const resolvedName = selectedPartPreset === 'OTHER' ? customPartName.trim() : selectedPartPreset.trim();
    const priceNum = typeof newPartPrice === 'number' ? newPartPrice : parseFloat(String(newPartPrice));

    if (!resolvedName && (isNaN(priceNum) || priceNum <= 0)) {
      setPartInputError(selectedPartPreset === 'OTHER' ? 'Custom part name and valid price are compulsory.' : 'Please select a part name and enter a valid price.');
      return;
    }
    if (!resolvedName) {
      setPartInputError(selectedPartPreset === 'OTHER' ? 'Please enter a custom part name.' : 'Please select a part name from the dropdown.');
      return;
    }
    if (isNaN(priceNum) || priceNum <= 0) {
      setPartInputError('Valid price (> 0) is compulsory.');
      return;
    }

    const price = Math.round(priceNum * 100) / 100;
    const newPart: ServicePartItem = {
      partName: resolvedName,
      price: price,
      notes: newPartNote.trim() || undefined,
      unitCost: price,
      quantity: 1,
      totalCost: price,
    };

    const updated = [...formParts, newPart];
    setFormParts(updated);

    // Auto-update parts cost sum
    const newPartsSum = updated.reduce((acc, p) => acc + (p.price ?? p.unitCost ?? p.totalCost ?? 0), 0);
    setFormPartsCost(newPartsSum);

    // Clear item inputs and close input section
    setSelectedPartPreset('');
    setCustomPartName('');
    setNewPartPrice('');
    setNewPartNote('');
    setPartInputError(null);
    setShowAddPartSection(false);
  };

  const handleRemovePartItem = (index: number) => {
    const updated = formParts.filter((_, i) => i !== index);
    setFormParts(updated);
    const newPartsSum = updated.reduce((acc, p) => acc + (p.price ?? p.unitCost ?? p.totalCost ?? 0), 0);
    setFormPartsCost(newPartsSum);
  };

  // Live Total Cost calculation
  const calculatedTotal = useMemo(() => {
    const labour = Number(formLabourCost) || 0;
    const parts = formParts.reduce((acc, p) => acc + (p.price ?? p.unitCost ?? p.totalCost ?? 0), 0) + (showAddPartSection && Number(newPartPrice) > 0 ? Number(newPartPrice) : 0);
    const misc = Number(formMiscCost) || 0;
    const tax = Number(formTax) || 0;
    return labour + parts + misc + tax;
  }, [formLabourCost, formParts, showAddPartSection, newPartPrice, formMiscCost, formTax]);

  // Submit Create
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    if (!formVehicleId) {
      errors.vehicleId = 'Please select a vehicle.';
    }
    if (!formServiceDate) {
      errors.serviceDate = 'Service date is required.';
    }
    if (formOdometer !== '' && (Number(formOdometer) < 0 || isNaN(Number(formOdometer)))) {
      errors.odometer = 'Odometer reading cannot be negative.';
    }
    if (formNextServiceOdometer !== '' && (Number(formNextServiceOdometer) < 0 || isNaN(Number(formNextServiceOdometer)))) {
      errors.nextServiceOdometer = 'Target odometer cannot be negative.';
    }
    if (formNextServiceDate && formServiceDate && new Date(formNextServiceDate) < new Date(formServiceDate)) {
      errors.nextServiceDate = 'Next service date cannot be earlier than service date.';
    }

    let finalParts = [...formParts];
    // If Parts Used section is enabled (open), part name and price are strictly required
    if (showAddPartSection) {
      const resolvedName = selectedPartPreset === 'OTHER' ? customPartName.trim() : selectedPartPreset.trim();
      const priceNum = typeof newPartPrice === 'number' ? newPartPrice : parseFloat(String(newPartPrice));

      if (!resolvedName || isNaN(priceNum) || priceNum <= 0) {
        const errMsg =
          !resolvedName && (isNaN(priceNum) || priceNum <= 0)
            ? 'Part Name and valid Price (> 0) are required when Parts Used section is enabled.'
            : !resolvedName
            ? selectedPartPreset === 'OTHER'
              ? 'Please enter a custom part name.'
              : 'Please select a part name from the dropdown.'
            : 'Please enter a valid price (> 0) for the part.';
        setPartInputError(errMsg);
        errors.parts = errMsg;
      } else {
        const price = Math.round(priceNum * 100) / 100;
        const newPart: ServicePartItem = {
          partName: resolvedName,
          price: price,
          notes: newPartNote.trim() || undefined,
          unitCost: price,
          quantity: 1,
          totalCost: price,
        };
        finalParts.push(newPart);
        setFormParts(finalParts);
        setShowAddPartSection(false);
        setSelectedPartPreset('');
        setCustomPartName('');
        setNewPartPrice('');
        setNewPartNote('');
        setPartInputError(null);
      }
    }

    const partsCostTotal = finalParts.reduce((acc, p) => acc + (p.price ?? p.unitCost ?? 0), 0);
    const labour = Number(formLabourCost) || 0;
    const misc = Number(formMiscCost) || 0;
    const tax = Number(formTax) || 0;
    const computedTotal = labour + partsCostTotal + misc + tax;

    if (computedTotal <= 0) {
      errors.cost = 'Total service cost cannot be ₹0.00. Please enter labour, misc, or parts.';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      toast.error('Please resolve the highlighted errors in the form.');
      return;
    }

    setSubmitting(true);
    setFieldErrors({});

    const payload: any = {
      vehicleId: formVehicleId,
      serviceDate: new Date(formServiceDate).toISOString(),
      odometer: formOdometer !== '' ? Number(formOdometer) : null,
      serviceProvider: formServiceProvider.trim() || null,
      notes: formNotes.trim() || null,
      labourCost: labour,
      partsCost: partsCostTotal,
      tax: tax,
      miscCost: misc,
      totalCost: computedTotal,
      nextServiceDate: formNextServiceDate ? formNextServiceDate : null,
      nextServiceOdometer: formNextServiceOdometer !== '' ? Number(formNextServiceOdometer) : null,
      reminderNotes: formReminderNotes.trim() || null,
      parts: finalParts.map((p) => ({
        partName: p.partName,
        quantity: 1,
        unitCost: p.price ?? p.unitCost ?? 0,
        totalCost: p.price ?? p.unitCost ?? 0,
        notes: p.notes || null,
      })),
    };

    try {
      await api.createService(payload);
      toast.success('Service record saved successfully!');
      await loadData();
      setShowAddModal(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to save service record');
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Update
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecord) return;

    const errors: Record<string, string> = {};
    if (!formVehicleId) {
      errors.vehicleId = 'Please select a vehicle.';
    }
    if (!formServiceDate) {
      errors.serviceDate = 'Service date is required.';
    }
    if (formOdometer !== '' && (Number(formOdometer) < 0 || isNaN(Number(formOdometer)))) {
      errors.odometer = 'Odometer reading cannot be negative.';
    }
    if (formNextServiceOdometer !== '' && (Number(formNextServiceOdometer) < 0 || isNaN(Number(formNextServiceOdometer)))) {
      errors.nextServiceOdometer = 'Target odometer cannot be negative.';
    }
    if (formNextServiceDate && formServiceDate && new Date(formNextServiceDate) < new Date(formServiceDate)) {
      errors.nextServiceDate = 'Next service date cannot be earlier than service date.';
    }

    let finalParts = [...formParts];
    // If Parts Used section is enabled (open), part name and price are strictly required
    if (showAddPartSection) {
      const resolvedName = selectedPartPreset === 'OTHER' ? customPartName.trim() : selectedPartPreset.trim();
      const priceNum = typeof newPartPrice === 'number' ? newPartPrice : parseFloat(String(newPartPrice));

      if (!resolvedName || isNaN(priceNum) || priceNum <= 0) {
        const errMsg =
          !resolvedName && (isNaN(priceNum) || priceNum <= 0)
            ? 'Part Name and valid Price (> 0) are required when Parts Used section is enabled.'
            : !resolvedName
            ? selectedPartPreset === 'OTHER'
              ? 'Please enter a custom part name.'
              : 'Please select a part name from the dropdown.'
            : 'Please enter a valid price (> 0) for the part.';
        setPartInputError(errMsg);
        errors.parts = errMsg;
      } else {
        const price = Math.round(priceNum * 100) / 100;
        const newPart: ServicePartItem = {
          partName: resolvedName,
          price: price,
          notes: newPartNote.trim() || undefined,
          unitCost: price,
          quantity: 1,
          totalCost: price,
        };
        finalParts.push(newPart);
        setFormParts(finalParts);
        setShowAddPartSection(false);
        setSelectedPartPreset('');
        setCustomPartName('');
        setNewPartPrice('');
        setNewPartNote('');
        setPartInputError(null);
      }
    }

    const partsCostTotal = finalParts.reduce((acc, p) => acc + (p.price ?? p.unitCost ?? 0), 0);
    const labour = Number(formLabourCost) || 0;
    const misc = Number(formMiscCost) || 0;
    const tax = Number(formTax) || 0;
    const computedTotal = labour + partsCostTotal + misc + tax;

    if (computedTotal <= 0) {
      errors.cost = 'Total service cost cannot be ₹0.00. Please enter labour, misc, or parts.';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      toast.error('Please resolve the highlighted errors in the form.');
      return;
    }

    setSubmitting(true);
    setFieldErrors({});

    const payload: any = {};
    const existingDate = selectedRecord.serviceDate ? new Date(selectedRecord.serviceDate).toISOString().split('T')[0] : '';
    const newDate = new Date(formServiceDate).toISOString().split('T')[0];
    if (newDate !== existingDate) {
      payload.serviceDate = new Date(formServiceDate).toISOString();
    }
    const odoVal = formOdometer !== '' ? Number(formOdometer) : null;
    if (odoVal !== (selectedRecord.odometer ?? null)) {
      payload.odometer = odoVal;
    }
    const providerVal = formServiceProvider.trim() || null;
    if (providerVal !== (selectedRecord.serviceProvider ?? null)) {
      payload.serviceProvider = providerVal;
    }
    const notesVal = formNotes.trim() || null;
    if (notesVal !== (selectedRecord.notes ?? null)) {
      payload.notes = notesVal;
    }
    if (labour !== selectedRecord.labourCost) {
      payload.labourCost = labour;
    }
    if (partsCostTotal !== selectedRecord.partsCost) {
      payload.partsCost = partsCostTotal;
    }
    if (tax !== selectedRecord.tax) {
      payload.tax = tax;
    }
    if (misc !== selectedRecord.miscCost) {
      payload.miscCost = misc;
    }
    if (computedTotal !== selectedRecord.totalCost) {
      payload.totalCost = computedTotal;
    }
    const nextDateVal = formNextServiceDate ? formNextServiceDate : null;
    if (nextDateVal !== (selectedRecord.nextServiceDate ? new Date(selectedRecord.nextServiceDate).toISOString().split('T')[0] : null)) {
      payload.nextServiceDate = nextDateVal;
    }
    const nextOdoVal = formNextServiceOdometer !== '' ? Number(formNextServiceOdometer) : null;
    if (nextOdoVal !== (selectedRecord.nextServiceOdometer ?? null)) {
      payload.nextServiceOdometer = nextOdoVal;
    }
    const remNotesVal = formReminderNotes.trim() || null;
    if (remNotesVal !== (selectedRecord.reminderNotes ?? null)) {
      payload.reminderNotes = remNotesVal;
    }

    // Check if parts array changed
    const existingParts = selectedRecord.parts || [];
    const partsChanged =
      finalParts.length !== existingParts.length ||
      finalParts.some((p, i) => {
        const ep = existingParts[i];
        if (!ep) return true;
        return (
          p.partName !== ep.partName ||
          (p.price ?? p.unitCost ?? 0) !== (ep.price ?? ep.unitCost ?? 0) ||
          (p.notes || null) !== (ep.notes || null)
        );
      });

    if (partsChanged) {
      payload.parts = finalParts.map((p) => ({
        partName: p.partName,
        quantity: 1,
        unitCost: p.price ?? p.unitCost ?? 0,
        totalCost: p.price ?? p.unitCost ?? 0,
        notes: p.notes || null,
      }));
    }

    if (Object.keys(payload).length === 0) {
      toast.info('No changes were made.');
      setShowEditModal(false);
      setSelectedRecord(null);
      setSubmitting(false);
      return;
    }

    try {
      await api.updateService(selectedRecord.id, payload);
      toast.success('Service record updated successfully!');
      await loadData();
      setShowEditModal(false);
      setSelectedRecord(null);
    } catch (err: any) {
      toast.error(err.message || 'Failed to update service record');
    } finally {
      setSubmitting(false);
    }
  };

  // Confirm Delete
  const handleConfirmDelete = async () => {
    if (!selectedRecord) return;
    setSubmitting(true);
    try {
      await api.deleteService(selectedRecord.id);
      toast.success('Service record deleted');
      await loadData();
      setShowDeleteModal(false);
      setSelectedRecord(null);
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete service record');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-3.5 py-4 pb-24 sm:px-6 sm:py-8 sm:pb-12 lg:px-8 space-y-5 sm:space-y-8">
      {/* 1. Header Section */}
      <div className="border-b border-white/[0.08] pb-3.5 sm:pb-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
            <h1 className="text-lg sm:text-2xl lg:text-3xl font-bold text-white tracking-tight truncate">
              <span className="sm:hidden">Maintenance</span>
              <span className="hidden sm:inline">Maintenance & Services</span>
            </h1>
            <span className="rounded-full bg-emerald-500/10 px-2 sm:px-2.5 py-0.5 text-[11px] sm:text-xs font-semibold text-emerald-400 border border-emerald-500/20 shrink-0">
              <span className="sm:hidden">{records.length}</span>
              <span className="hidden sm:inline">{records.length} {records.length === 1 ? 'Record' : 'Records'}</span>
            </span>
          </div>

          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-1.5 sm:gap-2 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold shadow-[0_2px_12px_rgba(16,185,129,0.3)] transition-all cursor-pointer active:scale-95 shrink-0"
          >
            <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4 stroke-[2.5]" />
            <span>Log Service</span>
          </button>
        </div>
        <p className="hidden sm:block mt-1 sm:mt-1.5 text-xs sm:text-sm text-slate-400 max-w-2xl leading-relaxed">
          Record maintenance repairs, track parts replacements, and monitor automated service reminder targets
        </p>
      </div>

      {/* Mandatory Garage Fleet Onboarding Banner (if no registered vehicles in garage) */}
      {!loading && vehicles.length === 0 && (
        <div className="flex items-center justify-between gap-3 p-3.5 sm:p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-300">
          <div className="flex items-center gap-2.5 min-w-0">
            <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 shrink-0 text-amber-400" />
            <div>
              <p className="font-semibold text-white text-xs sm:text-sm">No registered vehicles found in your garage</p>
              <p className="text-[11px] sm:text-xs text-amber-200/80">You must register at least one vehicle in your Garage before logging maintenance records.</p>
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

      {/* 2. Responsive Telemetry Cards: Horizontal Snap Reel on Mobile, 4-Column Grid on Desktop */}
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
            ₹{stats.totalSpend.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
          </div>
          <div className="hidden sm:block mt-0.5 sm:mt-1 text-xs text-slate-500 truncate">
            Across all service visits
          </div>
        </div>

        {/* Services Logged */}
        <div className="min-w-[150px] w-[45%] sm:w-auto shrink-0 snap-start rounded-2xl border border-white/[0.08] bg-slate-900/50 p-3 sm:p-4.5 shadow-[0_2px_8px_rgba(0,0,0,0.35)] backdrop-blur-md flex flex-col justify-between hover:border-white/[0.14] transition-all">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider truncate">Services Done</span>
            <div className="p-1 sm:p-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 shrink-0">
              <Wrench className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
            </div>
          </div>
          <div className="mt-1.5 sm:mt-2 text-base sm:text-2xl lg:text-3xl font-black text-blue-400 tracking-tight truncate">
            {stats.serviceCount} <span className="text-xs sm:text-base font-normal text-slate-400">visits</span>
          </div>
          <div className="hidden sm:block mt-0.5 sm:mt-1 text-xs text-slate-500 truncate">Completed logs</div>
        </div>

        {/* Parts & Labour Investment */}
        <div className="min-w-[150px] w-[45%] sm:w-auto shrink-0 snap-start rounded-2xl border border-white/[0.08] bg-slate-900/50 p-3 sm:p-4.5 shadow-[0_2px_8px_rgba(0,0,0,0.35)] backdrop-blur-md flex flex-col justify-between hover:border-white/[0.14] transition-all">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider truncate">Parts & Labour</span>
            <div className="p-1 sm:p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 shrink-0">
              <Package className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
            </div>
          </div>
          <div className="mt-1.5 sm:mt-2 text-base sm:text-2xl lg:text-3xl font-black text-amber-400 tracking-tight truncate">
            ₹{stats.partsAndLabour.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
          </div>
          <div className="hidden sm:block mt-0.5 sm:mt-1 text-xs text-slate-500 truncate">Direct workshop repairs</div>
        </div>

        {/* Upcoming Targets */}
        <div className="min-w-[150px] w-[45%] sm:w-auto shrink-0 snap-start rounded-2xl border border-white/[0.08] bg-slate-900/50 p-3 sm:p-4.5 shadow-[0_2px_8px_rgba(0,0,0,0.35)] backdrop-blur-md flex flex-col justify-between hover:border-white/[0.14] transition-all">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider truncate">Upcoming Due</span>
            <div className="p-1 sm:p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shrink-0">
              <Calendar className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
            </div>
          </div>
          <div className="mt-1.5 sm:mt-2 text-base sm:text-2xl lg:text-3xl font-black text-emerald-400 tracking-tight truncate">
            {stats.upcomingCount} <span className="text-xs sm:text-base font-normal text-slate-400">reminders</span>
          </div>
          <div className="hidden sm:block mt-0.5 sm:mt-1 text-xs text-slate-500 truncate">Scheduled target checkups</div>
        </div>
      </div>

      {/* 3. Apple-Grade Toolbar: Search & Dual Filter Dropdowns */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <SearchBar
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setCurrentPage(1);
          }}
          onClear={() => {
            setSearchQuery('');
            setCurrentPage(1);
          }}
          placeholder="Search provider, notes, invoice..."
        />

        {/* Right Controls: Category Dropdown + Vehicle Dropdown */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          <div className="min-w-[130px] sm:min-w-[155px]">
            <Select
              value={selectedCategoryFilter}
              onChange={(e) => {
                setSelectedCategoryFilter(e.target.value);
                setCurrentPage(1);
              }}
              leftIcon={<Filter className={`h-3.5 w-3.5 ${selectedCategoryFilter !== 'ALL' ? 'text-emerald-400' : 'text-slate-400'}`} />}
              options={[
                { value: 'ALL', label: 'All Services' },
                { value: 'ROUTINE', label: 'Routine & Scheduled' },
                { value: 'OIL', label: 'Oil & Fluids' },
                { value: 'BRAKES', label: 'Brakes & Suspension' },
                { value: 'REPAIRS', label: 'Repairs & Parts' },
                { value: 'REMINDER', label: 'Upcoming Reminders' },
              ]}
            />
          </div>

          <div className="min-w-[145px] sm:min-w-[195px]">
            <Select
              value={selectedVehicleFilter}
              onChange={(e) => {
                setSelectedVehicleFilter(e.target.value);
                setCurrentPage(1);
              }}
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

      {/* 4. Service Records List / Cards */}
      {loading ? (
        <div className="py-16 text-center text-sm text-slate-400 animate-pulse">
          Loading maintenance service records...
        </div>
      ) : filteredRecords.length === 0 ? (
        <div className="rounded-[18px] border border-dashed border-white/[0.1] bg-slate-950/40 p-12 text-center space-y-3">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-900 text-slate-500 border border-white/[0.06]">
            <Wrench className="h-6 w-6" />
          </div>
          <h3 className="text-base font-semibold text-white tracking-tight">No maintenance records found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {searchQuery || selectedVehicleFilter !== 'ALL' || selectedCategoryFilter !== 'ALL'
              ? 'No service logs matched your search or filters. Try clearing your filters.'
              : 'Log your first scheduled inspection, oil service, or repair to maintain vehicle reliability.'}
          </p>
          <div className="pt-2 flex justify-center gap-2">
            {searchQuery || selectedVehicleFilter !== 'ALL' || selectedCategoryFilter !== 'ALL' ? (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedVehicleFilter('ALL');
                  setSelectedCategoryFilter('ALL');
                  setCurrentPage(1);
                }}
                className="apple-btn rounded-xl border border-white/[0.1] px-4 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Clear Filters
              </button>
            ) : (
              <button
                onClick={handleOpenAdd}
                className="apple-btn inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 px-4 py-2 text-xs font-semibold text-slate-950 hover:bg-emerald-400 shadow-sm cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Log First Service</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-3.5">
          {paginatedRecords.map((r) => {
            const v = vehicleMap.get(r.vehicleId);
            return (
              <div
                key={r.id}
                className="group rounded-2xl border border-white/[0.08] bg-slate-900/50 p-4 sm:p-5 hover:border-white/[0.14] hover:bg-slate-900/70 transition-all shadow-[0_2px_8px_rgba(0,0,0,0.35)] flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                {/* Left Info Column */}
                <div className="space-y-2 flex-1 min-w-0">
                  {/* Top metadata tags */}
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Vehicle Badge */}
                    <span className="inline-flex items-center gap-1 rounded-md border border-white/[0.08] bg-slate-800/80 px-2 py-0.5 text-xs font-semibold text-white">
                      <Car className="h-3 w-3 text-emerald-400" />
                      <span>{v ? v.name : 'Vehicle'}</span>
                      {v?.licensePlate && (
                        <span className="text-slate-400 font-mono text-[11px]">({v.licensePlate})</span>
                      )}
                    </span>

                    {/* Date */}
                    <span className="text-xs text-slate-400 font-medium">
                      {new Date(r.serviceDate).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>

                    {/* Workshop / Provider */}
                    {r.serviceProvider && (
                      <span className="rounded-md border border-white/[0.06] bg-slate-800/50 px-2 py-0.5 text-[11px] font-medium text-slate-300">
                        {r.serviceProvider}
                      </span>
                    )}

                    {/* Odometer */}
                    {r.odometer !== null && (
                      <span className="text-xs text-slate-500 font-mono">
                        at {Number(r.odometer).toLocaleString()} km
                      </span>
                    )}
                  </div>

                  {/* Notes / Description */}
                  <h3 className="text-sm sm:text-base font-semibold text-white tracking-tight leading-snug">
                    {r.notes || 'Routine maintenance and inspection'}
                  </h3>

                  {/* Cost breakdown items */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
                    {r.labourCost > 0 && <span>Labour: ₹{r.labourCost.toLocaleString('en-IN')}</span>}
                    {r.partsCost > 0 && <span>Parts: ₹{r.partsCost.toLocaleString('en-IN')}</span>}
                    {r.tax > 0 && <span>Tax: ₹{r.tax.toLocaleString('en-IN')}</span>}
                    {r.miscCost > 0 && <span>Misc: ₹{r.miscCost.toLocaleString('en-IN')}</span>}
                    {r.parts && r.parts.length > 0 && (
                      <span className="text-emerald-400/90 text-[11px] font-medium">
                        ({r.parts.length} {r.parts.length === 1 ? 'part item' : 'part items'})
                      </span>
                    )}
                  </div>

                  {/* Next Service Target Tag */}
                  {r.nextServiceDate && (
                    <div className="flex items-center gap-2 pt-0.5">
                      <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-medium text-emerald-300">
                        <Calendar className="h-3 w-3 text-emerald-400" />
                        <span>Next Target: {new Date(r.nextServiceDate).toLocaleDateString('en-GB')}</span>
                        {r.nextServiceOdometer && (
                          <span className="font-mono">({Number(r.nextServiceOdometer).toLocaleString()} km)</span>
                        )}
                      </div>
                      {r.reminderNotes && (
                        <span className="text-[11px] text-slate-500 italic truncate max-w-xs">
                          "{r.reminderNotes}"
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Right Action Column */}
                <div className="flex md:flex-col items-center md:items-end justify-between md:justify-center gap-3 pt-3 md:pt-0 border-t md:border-t-0 border-white/[0.06] shrink-0">
                  {/* Total Invoiced */}
                  <div className="text-left md:text-right">
                    <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold block">Total Invoiced</span>
                    <span className="text-lg sm:text-xl font-black text-emerald-400 tracking-tight">
                      ₹{r.totalCost?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>

                  {/* Action Buttons: View, Edit, Delete */}
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenView(r)}
                      className="inline-flex items-center gap-1 rounded-lg border border-white/[0.08] bg-slate-800/80 px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer active:scale-95"
                      title="View complete invoice details"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">View</span>
                    </button>
                    <button
                      onClick={() => handleOpenEdit(r)}
                      className="inline-flex items-center gap-1 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1.5 text-xs font-medium text-emerald-300 hover:bg-emerald-500/20 transition-colors cursor-pointer active:scale-95"
                      title="Edit service details"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Edit</span>
                    </button>
                    <button
                      onClick={() => handleOpenDelete(r)}
                      className="inline-flex items-center gap-1 rounded-lg border border-rose-500/30 bg-rose-500/10 p-1.5 text-xs font-medium text-rose-300 hover:bg-rose-500/20 transition-colors cursor-pointer active:scale-95"
                      title="Delete service log"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {/* 5. Pagination */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredRecords.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={(sz) => {
              setPageSize(sz);
              setCurrentPage(1);
            }}
            pageSizeOptions={[6, 12, 24]}
            itemLabel="service records"
          />
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. LOG SERVICE MODAL (Landscape 2-Column with Fixed Header & Footer)       */}
      {/* ========================================================================= */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-6 overflow-hidden">
          <div className="w-full max-w-5xl xl:max-w-6xl max-h-[90vh] rounded-[20px] border border-white/[0.12] bg-slate-900/95 shadow-2xl backdrop-blur-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* FIXED HEADER */}
            <div className="flex items-center justify-between border-b border-white/[0.06] px-6 py-4.5 bg-slate-900/90 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                  <Wrench className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">Log Maintenance Service</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Record service invoices, labor, itemized parts, and next reminder targets</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="rounded-full p-2 text-slate-400 hover:bg-white/[0.08] hover:text-white transition-colors cursor-pointer"
                title="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* SCROLLABLE 2-COLUMN BODY */}
            <form id="add-service-form" onSubmit={handleCreateSubmit} noValidate className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin text-xs">
              {/* Warning banner if no registered vehicles in garage */}
              {vehicles.length === 0 && (
                <div className="flex items-center justify-between gap-3 p-3.5 sm:p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-300">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 text-amber-400" />
                    <div>
                      <p className="font-semibold text-white text-xs sm:text-sm">No registered vehicles found in your garage</p>
                      <p className="text-[11px] sm:text-xs text-amber-200/80">You must register at least one vehicle in your Garage before logging maintenance records.</p>
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* LEFT COLUMN: Service Logistics & Workshop */}
                <div className="space-y-4">
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Car className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Service Logistics & Workshop</span>
                  </div>

                  {/* Vehicle Selection (MANDATORY) */}
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">
                      Target Vehicle <span className="text-rose-400 font-bold ml-0.5">*</span>{' '}
                      <span className="text-emerald-400 font-normal">(Garage vehicles only)</span>
                    </label>
                    <select
                      value={formVehicleId}
                      onChange={(e) => {
                        setFormVehicleId(e.target.value);
                        if (fieldErrors.vehicleId) setFieldErrors((prev) => ({ ...prev, vehicleId: '' }));
                      }}
                      className={`w-full h-9 rounded-xl border px-3 text-white text-xs focus:outline-none transition-colors ${
                        fieldErrors.vehicleId
                          ? 'border-rose-500/80 bg-rose-500/5 focus:border-rose-500 focus:ring-1 focus:ring-rose-500/20'
                          : 'border-white/[0.1] bg-slate-900 focus:border-emerald-500'
                      }`}
                    >
                      {vehicles.length === 0 ? (
                        <option value="">No registered vehicles available</option>
                      ) : (
                        vehicles.map((v) => (
                          <option key={v.id} value={v.id}>
                            {v.name} ({v.licensePlate || 'No plate'})
                          </option>
                        ))
                      )}
                    </select>
                    {fieldErrors.vehicleId && (
                      <p className="mt-1 text-[11px] text-rose-400 flex items-center gap-1 animate-in fade-in slide-in-from-top-1">
                        <AlertCircle className="h-3 w-3 shrink-0" />
                        <span>{fieldErrors.vehicleId}</span>
                      </p>
                    )}
                  </div>

                  {/* Service Date & Odometer */}
                  <div className="grid grid-cols-2 gap-3">
                    <DatePicker
                      label="Service Date"
                      required
                      value={formServiceDate}
                      onChange={(e) => {
                        setFormServiceDate(e.target.value);
                        if (fieldErrors.serviceDate) setFieldErrors((prev) => ({ ...prev, serviceDate: '' }));
                      }}
                      error={fieldErrors.serviceDate}
                    />
                    <div>
                      <label className="block text-slate-300 font-medium mb-1">
                        Odometer (km) <span className="text-[10px] text-slate-500 font-normal lowercase ml-1">(optional)</span>
                      </label>
                      <input
                        type="number"
                        min="0"
                        placeholder="e.g. 24500"
                        value={formOdometer}
                        onChange={(e) => {
                          setFormOdometer(e.target.value !== '' ? parseInt(e.target.value) : '');
                          if (fieldErrors.odometer) setFieldErrors((prev) => ({ ...prev, odometer: '' }));
                        }}
                        className={`w-full h-9 rounded-xl border px-3 text-white text-xs focus:outline-none font-mono transition-colors ${
                          fieldErrors.odometer
                            ? 'border-rose-500/80 bg-rose-500/5 focus:border-rose-500 focus:ring-1 focus:ring-rose-500/20'
                            : 'border-white/[0.1] bg-slate-900 focus:border-emerald-500'
                        }`}
                      />
                      {fieldErrors.odometer && (
                        <p className="mt-1 text-[11px] text-rose-400 flex items-center gap-1 animate-in fade-in slide-in-from-top-1">
                          <AlertCircle className="h-3 w-3 shrink-0" />
                          <span>{fieldErrors.odometer}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Service Provider */}
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">
                      Workshop / Service Provider <span className="text-[10px] text-slate-500 font-normal lowercase ml-1">(optional)</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Authorized Dealership, Bosch Service"
                      value={formServiceProvider}
                      onChange={(e) => setFormServiceProvider(e.target.value)}
                      className="w-full h-9 rounded-xl border border-white/[0.1] bg-slate-900 px-3 text-white text-xs placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none"
                    />
                  </div>

                  {/* Service Description / Work Done */}
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">
                      Work Done / Inspection Details <span className="text-[10px] text-slate-500 font-normal lowercase ml-1">(optional)</span>
                    </label>
                    <textarea
                      rows={3}
                      placeholder="e.g. 30k scheduled servicing, oil filter changed, brake pads inspection"
                      value={formNotes}
                      onChange={(e) => setFormNotes(e.target.value)}
                      className="w-full rounded-xl border border-white/[0.1] bg-slate-900 p-3 text-white text-xs placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none resize-none"
                    />
                  </div>

                  {/* Next Service Target Reminders */}
                  <div className="rounded-xl border border-white/[0.08] bg-slate-950/60 p-4 space-y-3">
                    <div className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-emerald-400" />
                      <span>Next Maintenance Target <span className="text-[10px] text-slate-500 font-normal lowercase ml-1">(optional)</span></span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <DatePicker
                        label="Next Service Date"
                        value={formNextServiceDate}
                        onChange={(e) => {
                          setFormNextServiceDate(e.target.value);
                          if (fieldErrors.nextServiceDate) setFieldErrors((prev) => ({ ...prev, nextServiceDate: '' }));
                        }}
                        error={fieldErrors.nextServiceDate}
                      />
                      <div>
                        <label className="block text-slate-400 mb-1">Target Odometer (km)</label>
                        <input
                          type="number"
                          min="0"
                          placeholder="e.g. 34500"
                          value={formNextServiceOdometer}
                          onChange={(e) => {
                            setFormNextServiceOdometer(e.target.value !== '' ? parseInt(e.target.value) : '');
                            if (fieldErrors.nextServiceOdometer) setFieldErrors((prev) => ({ ...prev, nextServiceOdometer: '' }));
                          }}
                          className={`w-full h-9 rounded-lg border px-2.5 text-white text-xs focus:outline-none font-mono transition-colors ${
                            fieldErrors.nextServiceOdometer
                              ? 'border-rose-500/80 bg-rose-500/5 focus:border-rose-500 focus:ring-1 focus:ring-rose-500/20'
                              : 'border-white/[0.1] bg-slate-900 focus:border-emerald-500'
                          }`}
                        />
                        {fieldErrors.nextServiceOdometer && (
                          <p className="mt-1 text-[11px] text-rose-400 flex items-center gap-1 animate-in fade-in slide-in-from-top-1">
                            <AlertCircle className="h-3 w-3 shrink-0" />
                            <span>{fieldErrors.nextServiceOdometer}</span>
                          </p>
                        )}
                      </div>
                    </div>
                    <div>
                      <input
                        type="text"
                        placeholder="Reminder note (e.g. Inspect brake discs & coolant)"
                        value={formReminderNotes}
                        onChange={(e) => setFormReminderNotes(e.target.value)}
                        className="w-full h-9 rounded-lg border border-white/[0.1] bg-slate-900 px-2.5 text-white text-xs placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* RIGHT COLUMN: Cost Breakdown & Itemized Parts */}
                <div className="space-y-4">
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5 text-blue-400" />
                    <span>Cost Breakdown & Itemized Parts</span>
                  </div>

                  {/* Cost Breakdown Grid */}
                  <div className={`rounded-xl border p-4 space-y-3 transition-colors ${
                    fieldErrors.cost ? 'border-rose-500/80 bg-rose-500/5' : 'border-white/[0.08] bg-slate-950/60'
                  }`}>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-slate-400 mb-1">
                          Labour (₹) <span className="text-[10px] text-slate-500 font-normal lowercase ml-1">(optional)</span>
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="any"
                          value={formLabourCost}
                          onChange={(e) => {
                            setFormLabourCost(e.target.value !== '' ? parseFloat(e.target.value) : '');
                            if (fieldErrors.cost) setFieldErrors((prev) => ({ ...prev, cost: '' }));
                          }}
                          className="w-full h-9 rounded-lg border border-white/[0.1] bg-slate-900 px-2.5 text-white text-xs focus:border-emerald-500 focus:outline-none font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-400 mb-1">
                          Misc (₹) <span className="text-[10px] text-slate-500 font-normal lowercase ml-1">(optional)</span>
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="any"
                          value={formMiscCost}
                          onChange={(e) => {
                            setFormMiscCost(e.target.value !== '' ? parseFloat(e.target.value) : '');
                            if (fieldErrors.cost) setFieldErrors((prev) => ({ ...prev, cost: '' }));
                          }}
                          className="w-full h-9 rounded-lg border border-white/[0.1] bg-slate-900 px-2.5 text-white text-xs focus:border-emerald-500 focus:outline-none font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-400 mb-1">
                          Tax / GST (₹) <span className="text-[10px] text-slate-500 font-normal lowercase ml-1">(optional)</span>
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="any"
                          value={formTax}
                          onChange={(e) => {
                            setFormTax(e.target.value !== '' ? parseFloat(e.target.value) : '');
                            if (fieldErrors.cost) setFieldErrors((prev) => ({ ...prev, cost: '' }));
                          }}
                          className="w-full h-9 rounded-lg border border-white/[0.1] bg-slate-900 px-2.5 text-white text-xs focus:border-emerald-500 focus:outline-none font-mono"
                        />
                      </div>
                    </div>

                    {/* Auto Calculated Total Banner */}
                    <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 flex justify-between items-center text-xs">
                      <span className="text-emerald-300 font-medium">Calculated Total Amount:</span>
                      <span className="font-black text-base text-emerald-400 font-mono">
                        ₹{calculatedTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                    {fieldErrors.cost && (
                      <p className="text-[11px] text-rose-400 flex items-center gap-1 animate-in fade-in slide-in-from-top-1">
                        <AlertCircle className="h-3 w-3 shrink-0" />
                        <span>{fieldErrors.cost}</span>
                      </p>
                    )}
                  </div>

                  {/* Itemized Parts Section */}
                  <div className="rounded-xl border border-white/[0.08] bg-slate-950/60 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-300 font-semibold text-xs">Parts Used (Optional)</span>
                        {formParts.length > 0 && (
                          <span className="text-[11px] text-slate-500">
                            ({formParts.length} {formParts.length === 1 ? 'part' : 'parts'})
                          </span>
                        )}
                      </div>
                      {!showAddPartSection && (
                        <button
                          type="button"
                          onClick={() => {
                            setShowAddPartSection(true);
                            setPartInputError(null);
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold transition-all cursor-pointer shadow-sm active:scale-95"
                          title="Add part"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          <span>Add Part</span>
                        </button>
                      )}
                    </div>

                    {/* New Part Input Section: Only visible when user clicked + / Add Part */}
                    {showAddPartSection && (
                      <div className="space-y-2 bg-slate-900/90 p-3 rounded-xl border border-emerald-500/30 shadow-sm animate-in fade-in duration-200">
                        <div className="flex items-center justify-between border-b border-white/[0.06] pb-1.5">
                          <span className="text-[11px] font-semibold text-emerald-400">New Part Entry</span>
                          <button
                            type="button"
                            onClick={() => {
                              setShowAddPartSection(false);
                              setSelectedPartPreset('');
                              setCustomPartName('');
                              setNewPartPrice('');
                              setNewPartNote('');
                              setPartInputError(null);
                            }}
                            className="text-slate-500 hover:text-slate-300 p-0.5 cursor-pointer"
                            title="Cancel"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <div className="space-y-2.5">
                          {selectedPartPreset === 'OTHER' ? (
                            <>
                              {/* Row 1: Dropdown + Custom Name Input */}
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                <div>
                                  <label className="block text-[11px] text-slate-400 mb-1">Part Preset</label>
                                  <select
                                    value={selectedPartPreset}
                                    onChange={(e) => {
                                      setSelectedPartPreset(e.target.value);
                                      if (partInputError) setPartInputError(null);
                                    }}
                                    className={`w-full h-8 rounded-lg border ${
                                      partInputError && !selectedPartPreset
                                        ? 'border-rose-500 ring-1 ring-rose-500/50 bg-rose-500/10'
                                        : 'border-white/[0.1]'
                                    } bg-slate-900 px-2 text-xs text-white focus:border-emerald-500 focus:outline-none cursor-pointer`}
                                  >
                                    <option value="" disabled>Select Part Name *</option>
                                    {COMMON_AUTOMOTIVE_PARTS.map((p) => (
                                      <option key={p} value={p}>{p}</option>
                                    ))}
                                    <option value="OTHER">Other (Custom Part)...</option>
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-[11px] text-slate-400 mb-1">Custom Part Name *</label>
                                  <input
                                    type="text"
                                    placeholder="e.g. Timing Belt Kit, Spark Plugs *"
                                    value={customPartName}
                                    onChange={(e) => {
                                      setCustomPartName(e.target.value);
                                      if (partInputError) setPartInputError(null);
                                    }}
                                    className={`w-full h-8 rounded-lg border ${
                                      partInputError && !customPartName.trim()
                                        ? 'border-rose-500 ring-1 ring-rose-500/50 bg-rose-500/10'
                                        : 'border-white/[0.1]'
                                    } bg-slate-900 px-2.5 text-xs text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none`}
                                    autoFocus
                                  />
                                </div>
                              </div>

                              {/* Row 2: Price + Note + Add Button */}
                              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end">
                                <div className="sm:col-span-4">
                                  <label className="block text-[11px] text-slate-400 mb-1">Price (₹) *</label>
                                  <input
                                    type="number"
                                    min="0"
                                    step="any"
                                    placeholder="0.00"
                                    value={newPartPrice}
                                    onChange={(e) => {
                                      setNewPartPrice(e.target.value !== '' ? parseFloat(e.target.value) : '');
                                      if (partInputError) setPartInputError(null);
                                    }}
                                    className={`w-full h-8 rounded-lg border ${
                                      partInputError && (newPartPrice === '' || Number(newPartPrice) <= 0)
                                        ? 'border-rose-500 ring-1 ring-rose-500/50 bg-rose-500/10'
                                        : 'border-white/[0.1]'
                                    } bg-slate-900 px-2.5 text-xs text-white font-mono placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none`}
                                  />
                                </div>
                                <div className="sm:col-span-5">
                                  <label className="block text-[11px] text-slate-400 mb-1">Part Note (Optional)</label>
                                  <input
                                    type="text"
                                    placeholder="e.g. Bosch OEM, Front axle"
                                    value={newPartNote}
                                    onChange={(e) => setNewPartNote(e.target.value)}
                                    className="w-full h-8 rounded-lg border border-white/[0.1] bg-slate-900 px-2.5 text-xs text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none"
                                  />
                                </div>
                                <div className="sm:col-span-3">
                                  <button
                                    type="button"
                                    onClick={handleAddPartItem}
                                    className="w-full h-8 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-sm text-xs px-2"
                                    title="Add Part Item"
                                  >
                                    <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
                                    <span>Add Item</span>
                                  </button>
                                </div>
                              </div>
                            </>
                          ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end">
                              <div className="sm:col-span-5">
                                <label className="block text-[11px] text-slate-400 mb-1">Part Name *</label>
                                <select
                                  value={selectedPartPreset}
                                  onChange={(e) => {
                                    setSelectedPartPreset(e.target.value);
                                    if (partInputError) setPartInputError(null);
                                  }}
                                  className={`w-full h-8 rounded-lg border ${
                                    partInputError && !selectedPartPreset
                                      ? 'border-rose-500 ring-1 ring-rose-500/50 bg-rose-500/10'
                                      : 'border-white/[0.1]'
                                  } bg-slate-900 px-2 text-xs text-white focus:border-emerald-500 focus:outline-none cursor-pointer`}
                                >
                                  <option value="" disabled>Select Part Name *</option>
                                  {COMMON_AUTOMOTIVE_PARTS.map((p) => (
                                    <option key={p} value={p}>{p}</option>
                                  ))}
                                  <option value="OTHER">Other (Custom Part)...</option>
                                </select>
                              </div>
                              <div className="sm:col-span-3">
                                <label className="block text-[11px] text-slate-400 mb-1">Price (₹) *</label>
                                <input
                                  type="number"
                                  min="0"
                                  step="any"
                                  placeholder="0.00"
                                  value={newPartPrice}
                                  onChange={(e) => {
                                    setNewPartPrice(e.target.value !== '' ? parseFloat(e.target.value) : '');
                                    if (partInputError) setPartInputError(null);
                                  }}
                                  className={`w-full h-8 rounded-lg border ${
                                    partInputError && (newPartPrice === '' || Number(newPartPrice) <= 0)
                                      ? 'border-rose-500 ring-1 ring-rose-500/50 bg-rose-500/10'
                                      : 'border-white/[0.1]'
                                  } bg-slate-900 px-2.5 text-xs text-white font-mono placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none`}
                                />
                              </div>
                              <div className="sm:col-span-3">
                                <label className="block text-[11px] text-slate-400 mb-1">Note (Optional)</label>
                                <input
                                  type="text"
                                  placeholder="e.g. Bosch OEM"
                                  value={newPartNote}
                                  onChange={(e) => setNewPartNote(e.target.value)}
                                  className="w-full h-8 rounded-lg border border-white/[0.1] bg-slate-900 px-2.5 text-xs text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none"
                                />
                              </div>
                              <div className="sm:col-span-1">
                                <button
                                  type="button"
                                  onClick={handleAddPartItem}
                                  className="w-full h-8 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold flex items-center justify-center cursor-pointer transition-colors shadow-sm"
                                  title="Add Item"
                                >
                                  <Plus className="h-4 w-4 stroke-[2.5]" />
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                        {partInputError && (
                          <p className="text-[11px] text-rose-400 flex items-center gap-1 pt-0.5">
                            <AlertTriangle className="h-3 w-3 shrink-0" />
                            <span>{partInputError}</span>
                          </p>
                        )}
                      </div>
                    )}

                    {/* Added Parts List */}
                    {formParts.length > 0 && (
                      <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                        {formParts.map((p, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-slate-900 border border-white/[0.06] text-xs"
                          >
                            <div className="flex-1 min-w-0 pr-2">
                              <span className="font-semibold text-white truncate block">{p.partName}</span>
                              {p.notes && (
                                <span className="text-slate-400 text-[11px] truncate block mt-0.5">
                                  <span className="text-slate-500">Note:</span> {p.notes}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2.5 shrink-0">
                              <span className="font-bold text-emerald-400 font-mono">
                                ₹{(p.price ?? p.unitCost ?? p.totalCost ?? 0).toLocaleString('en-IN')}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleRemovePartItem(idx)}
                                className="text-slate-500 hover:text-rose-400 p-0.5 cursor-pointer transition-colors"
                                title="Remove part"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </form>

            {/* FIXED FOOTER */}
            <div className="flex items-center justify-between border-t border-white/[0.08] px-6 py-4 bg-slate-900/90 flex-shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Total:</span>
                <span className={`text-sm font-bold font-mono ${calculatedTotal > 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                  ₹{calculatedTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                {calculatedTotal <= 0 && (
                  <span className="text-[11px] text-amber-400/90 font-medium">
                    (Cannot be ₹0.00)
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="apple-btn rounded-xl border border-white/[0.1] px-4 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  form="add-service-form"
                  disabled={submitting || vehicles.length === 0 || calculatedTotal <= 0}
                  className="apple-btn rounded-xl bg-emerald-500 hover:bg-emerald-400 px-5 py-2 text-xs font-bold text-slate-950 shadow-sm transition-all cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Logging Service...' : 'Save Service Record'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. EDIT SERVICE MODAL (Landscape 2-Column with Fixed Header & Footer)      */}
      {/* ========================================================================= */}
      {showEditModal && selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-6 overflow-hidden">
          <div className="w-full max-w-5xl xl:max-w-6xl max-h-[90vh] rounded-[20px] border border-white/[0.12] bg-slate-900/95 shadow-2xl backdrop-blur-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* FIXED HEADER */}
            <div className="flex items-center justify-between border-b border-white/[0.06] px-6 py-4.5 bg-slate-900/90 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-400">
                  <Edit2 className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">Edit Service Record</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Update invoice costs, odometer, workshop notes, or target reminders</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedRecord(null);
                }}
                className="rounded-full p-2 text-slate-400 hover:bg-white/[0.08] hover:text-white transition-colors cursor-pointer"
                title="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* SCROLLABLE 2-COLUMN BODY */}
            <form id="edit-service-form" onSubmit={handleEditSubmit} noValidate className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* LEFT COLUMN: Service Logistics & Workshop */}
                <div className="space-y-4">
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Car className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Service Logistics & Workshop</span>
                  </div>

                  {/* Target Vehicle */}
                  <div>
                    <label className="block text-slate-300 font-medium mb-1.5">Vehicle</label>
                    <div className="w-full h-10 rounded-xl border border-white/[0.06] bg-slate-950/40 px-3 flex items-center text-slate-300 text-xs font-semibold">
                      {vehicleMap.get(formVehicleId)?.name || 'Vehicle'}
                    </div>
                  </div>

                  {/* Date & Odometer */}
                  <div className="grid grid-cols-2 gap-3">
                    <DatePicker
                      label="Service Date"
                      required
                      value={formServiceDate}
                      onChange={(e) => {
                        setFormServiceDate(e.target.value);
                        if (fieldErrors.serviceDate) setFieldErrors(prev => { const n = { ...prev }; delete n.serviceDate; return n; });
                      }}
                      error={fieldErrors.serviceDate}
                    />
                    <div>
                      <label className="block text-slate-300 font-medium mb-1.5">
                        Odometer (km) <span className="text-[10px] text-slate-500 font-normal lowercase ml-1">(optional)</span>
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={formOdometer}
                        onChange={(e) => {
                          setFormOdometer(e.target.value ? parseFloat(e.target.value) : '');
                          if (fieldErrors.odometer) setFieldErrors(prev => { const n = { ...prev }; delete n.odometer; return n; });
                        }}
                        className={`w-full h-10 rounded-xl border px-3 text-white text-xs focus:outline-none transition-colors font-mono ${
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
                  </div>

                  {/* Service Provider / Workshop */}
                  <div>
                    <label className="block text-slate-300 font-medium mb-1.5">
                      Service Provider / Workshop <span className="text-[10px] text-slate-500 font-normal lowercase ml-1">(optional)</span>
                    </label>
                    <input
                      type="text"
                      value={formServiceProvider}
                      onChange={(e) => setFormServiceProvider(e.target.value)}
                      className="w-full h-10 rounded-xl border border-white/[0.1] bg-slate-950/80 px-3 text-white text-xs focus:border-emerald-500 focus:outline-none transition-colors"
                    />
                  </div>

                  {/* Notes & Description */}
                  <div>
                    <label className="block text-slate-300 font-medium mb-1.5">
                      Service Notes & Work Done <span className="text-[10px] text-slate-500 font-normal lowercase ml-1">(optional)</span>
                    </label>
                    <textarea
                      rows={3}
                      value={formNotes}
                      onChange={(e) => setFormNotes(e.target.value)}
                      className="w-full rounded-xl border border-white/[0.1] bg-slate-950/80 p-3 text-white text-xs focus:border-emerald-500 focus:outline-none transition-colors"
                    />
                  </div>

                  {/* Next Service Target Reminder */}
                  <div className="rounded-xl border border-white/[0.08] bg-slate-950/60 p-4 space-y-3">
                    <span className="block text-slate-300 font-semibold text-xs">Next Service Target Reminder (Optional)</span>
                    <div className="grid grid-cols-2 gap-3">
                      <DatePicker
                        label={<span>Target Date <span className="text-[10px] text-slate-500 font-normal lowercase ml-1">(optional)</span></span>}
                        value={formNextServiceDate}
                        onChange={(e) => {
                          setFormNextServiceDate(e.target.value);
                          if (fieldErrors.nextServiceDate) setFieldErrors(prev => { const n = { ...prev }; delete n.nextServiceDate; return n; });
                        }}
                        error={fieldErrors.nextServiceDate}
                      />
                      <div>
                        <label className="block text-slate-400 mb-1">
                          Target Odometer (km) <span className="text-[10px] text-slate-500 font-normal lowercase ml-1">(optional)</span>
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={formNextServiceOdometer}
                          onChange={(e) => {
                            setFormNextServiceOdometer(e.target.value ? parseFloat(e.target.value) : '');
                            if (fieldErrors.nextServiceOdometer) setFieldErrors(prev => { const n = { ...prev }; delete n.nextServiceOdometer; return n; });
                          }}
                          className={`w-full h-9 rounded-lg border px-2.5 text-white text-xs focus:outline-none font-mono ${
                            fieldErrors.nextServiceOdometer
                              ? 'border-rose-500/80 bg-rose-500/5 focus:border-rose-500'
                              : 'border-white/[0.1] bg-slate-900 focus:border-emerald-500'
                          }`}
                        />
                        {fieldErrors.nextServiceOdometer && (
                          <p className="mt-1 text-[11px] text-rose-400 flex items-center gap-1 animate-in fade-in slide-in-from-top-1">
                            <AlertCircle className="h-3 w-3 shrink-0" />
                            <span>{fieldErrors.nextServiceOdometer}</span>
                          </p>
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">
                        Reminder Instructions / Notes <span className="text-[10px] text-slate-500 font-normal lowercase ml-1">(optional)</span>
                      </label>
                      <input
                        type="text"
                        value={formReminderNotes}
                        onChange={(e) => setFormReminderNotes(e.target.value)}
                        className="w-full h-9 rounded-lg border border-white/[0.1] bg-slate-900 px-2.5 text-white text-xs focus:border-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* RIGHT COLUMN: Cost Breakdown & Itemized Parts */}
                <div className="space-y-4">
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5 text-blue-400" />
                    <span>Cost Breakdown & Itemized Parts</span>
                  </div>

                  {/* Cost Breakdown Grid */}
                  <div className="rounded-xl border border-white/[0.08] bg-slate-950/60 p-4 space-y-3">
                    {fieldErrors.cost && (
                      <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-center gap-1.5 text-xs text-rose-400 animate-in fade-in slide-in-from-top-1">
                        <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                        <span>{fieldErrors.cost}</span>
                      </div>
                    )}
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-slate-400 mb-1">
                          Labour (₹) <span className="text-[10px] text-slate-500 font-normal lowercase ml-1">(optional)</span>
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="any"
                          value={formLabourCost}
                          onChange={(e) => {
                            setFormLabourCost(e.target.value !== '' ? parseFloat(e.target.value) : '');
                            if (fieldErrors.cost) setFieldErrors(prev => { const n = { ...prev }; delete n.cost; return n; });
                          }}
                          className="w-full h-9 rounded-lg border border-white/[0.1] bg-slate-900 px-2.5 text-white text-xs focus:border-emerald-500 focus:outline-none font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-400 mb-1">
                          Misc (₹) <span className="text-[10px] text-slate-500 font-normal lowercase ml-1">(optional)</span>
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="any"
                          value={formMiscCost}
                          onChange={(e) => {
                            setFormMiscCost(e.target.value !== '' ? parseFloat(e.target.value) : '');
                            if (fieldErrors.cost) setFieldErrors(prev => { const n = { ...prev }; delete n.cost; return n; });
                          }}
                          className="w-full h-9 rounded-lg border border-white/[0.1] bg-slate-900 px-2.5 text-white text-xs focus:border-emerald-500 focus:outline-none font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-400 mb-1">
                          Tax / GST (₹) <span className="text-[10px] text-slate-500 font-normal lowercase ml-1">(optional)</span>
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="any"
                          value={formTax}
                          onChange={(e) => {
                            setFormTax(e.target.value !== '' ? parseFloat(e.target.value) : '');
                            if (fieldErrors.cost) setFieldErrors(prev => { const n = { ...prev }; delete n.cost; return n; });
                          }}
                          className="w-full h-9 rounded-lg border border-white/[0.1] bg-slate-900 px-2.5 text-white text-xs focus:border-emerald-500 focus:outline-none font-mono"
                        />
                      </div>
                    </div>

                    {/* Auto Calculated Total Banner */}
                    <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 flex justify-between items-center text-xs">
                      <span className="text-emerald-300 font-medium">Updated Total Amount:</span>
                      <span className="font-black text-base text-emerald-400 font-mono">
                        ₹{calculatedTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>

                  {/* Itemized Parts Section */}
                  <div className="rounded-xl border border-white/[0.08] bg-slate-950/60 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-300 font-semibold text-xs">Parts Used (Optional)</span>
                        {formParts.length > 0 && (
                          <span className="text-[11px] text-slate-500">
                            ({formParts.length} {formParts.length === 1 ? 'part' : 'parts'})
                          </span>
                        )}
                      </div>
                      {!showAddPartSection && (
                        <button
                          type="button"
                          onClick={() => {
                            setShowAddPartSection(true);
                            setPartInputError(null);
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold transition-all cursor-pointer shadow-sm active:scale-95"
                          title="Add part"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          <span>Add Part</span>
                        </button>
                      )}
                    </div>

                    {/* New Part Input Section: Only visible when user clicked + / Add Part */}
                    {showAddPartSection && (
                      <div className="space-y-2 bg-slate-900/90 p-3 rounded-xl border border-emerald-500/30 shadow-sm animate-in fade-in duration-200">
                        <div className="flex items-center justify-between border-b border-white/[0.06] pb-1.5">
                          <span className="text-[11px] font-semibold text-emerald-400">New Part Entry</span>
                          <button
                            type="button"
                            onClick={() => {
                              setShowAddPartSection(false);
                              setSelectedPartPreset('');
                              setCustomPartName('');
                              setNewPartPrice('');
                              setNewPartNote('');
                              setPartInputError(null);
                            }}
                            className="text-slate-500 hover:text-slate-300 p-0.5 cursor-pointer"
                            title="Cancel"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <div className="space-y-2.5">
                          {selectedPartPreset === 'OTHER' ? (
                            <>
                              {/* Row 1: Dropdown + Custom Name Input */}
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                <div>
                                  <label className="block text-[11px] text-slate-400 mb-1">Part Preset</label>
                                  <select
                                    value={selectedPartPreset}
                                    onChange={(e) => {
                                      setSelectedPartPreset(e.target.value);
                                      if (partInputError) setPartInputError(null);
                                    }}
                                    className={`w-full h-8 rounded-lg border ${
                                      partInputError && !selectedPartPreset
                                        ? 'border-rose-500 ring-1 ring-rose-500/50 bg-rose-500/10'
                                        : 'border-white/[0.1]'
                                    } bg-slate-900 px-2 text-xs text-white focus:border-emerald-500 focus:outline-none cursor-pointer`}
                                  >
                                    <option value="" disabled>Select Part Name *</option>
                                    {COMMON_AUTOMOTIVE_PARTS.map((p) => (
                                      <option key={p} value={p}>{p}</option>
                                    ))}
                                    <option value="OTHER">Other (Custom Part)...</option>
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-[11px] text-slate-400 mb-1">Custom Part Name *</label>
                                  <input
                                    type="text"
                                    placeholder="e.g. Timing Belt Kit, Spark Plugs *"
                                    value={customPartName}
                                    onChange={(e) => {
                                      setCustomPartName(e.target.value);
                                      if (partInputError) setPartInputError(null);
                                    }}
                                    className={`w-full h-8 rounded-lg border ${
                                      partInputError && !customPartName.trim()
                                        ? 'border-rose-500 ring-1 ring-rose-500/50 bg-rose-500/10'
                                        : 'border-white/[0.1]'
                                    } bg-slate-900 px-2.5 text-xs text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none`}
                                    autoFocus
                                  />
                                </div>
                              </div>

                              {/* Row 2: Price + Note + Add Button */}
                              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end">
                                <div className="sm:col-span-4">
                                  <label className="block text-[11px] text-slate-400 mb-1">Price (₹) *</label>
                                  <input
                                    type="number"
                                    min="0"
                                    step="any"
                                    placeholder="0.00"
                                    value={newPartPrice}
                                    onChange={(e) => {
                                      setNewPartPrice(e.target.value !== '' ? parseFloat(e.target.value) : '');
                                      if (partInputError) setPartInputError(null);
                                    }}
                                    className={`w-full h-8 rounded-lg border ${
                                      partInputError && (newPartPrice === '' || Number(newPartPrice) <= 0)
                                        ? 'border-rose-500 ring-1 ring-rose-500/50 bg-rose-500/10'
                                        : 'border-white/[0.1]'
                                    } bg-slate-900 px-2.5 text-xs text-white font-mono placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none`}
                                  />
                                </div>
                                <div className="sm:col-span-5">
                                  <label className="block text-[11px] text-slate-400 mb-1">Part Note (Optional)</label>
                                  <input
                                    type="text"
                                    placeholder="e.g. Bosch OEM, Front axle"
                                    value={newPartNote}
                                    onChange={(e) => setNewPartNote(e.target.value)}
                                    className="w-full h-8 rounded-lg border border-white/[0.1] bg-slate-900 px-2.5 text-xs text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none"
                                  />
                                </div>
                                <div className="sm:col-span-3">
                                  <button
                                    type="button"
                                    onClick={handleAddPartItem}
                                    className="w-full h-8 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-sm text-xs px-2"
                                    title="Add Part Item"
                                  >
                                    <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
                                    <span>Add Item</span>
                                  </button>
                                </div>
                              </div>
                            </>
                          ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end">
                              <div className="sm:col-span-5">
                                <label className="block text-[11px] text-slate-400 mb-1">Part Name *</label>
                                <select
                                  value={selectedPartPreset}
                                  onChange={(e) => {
                                    setSelectedPartPreset(e.target.value);
                                    if (partInputError) setPartInputError(null);
                                  }}
                                  className={`w-full h-8 rounded-lg border ${
                                    partInputError && !selectedPartPreset
                                      ? 'border-rose-500 ring-1 ring-rose-500/50 bg-rose-500/10'
                                      : 'border-white/[0.1]'
                                  } bg-slate-900 px-2 text-xs text-white focus:border-emerald-500 focus:outline-none cursor-pointer`}
                                >
                                  <option value="" disabled>Select Part Name *</option>
                                  {COMMON_AUTOMOTIVE_PARTS.map((p) => (
                                    <option key={p} value={p}>{p}</option>
                                  ))}
                                  <option value="OTHER">Other (Custom Part)...</option>
                                </select>
                              </div>
                              <div className="sm:col-span-3">
                                <label className="block text-[11px] text-slate-400 mb-1">Price (₹) *</label>
                                <input
                                  type="number"
                                  min="0"
                                  step="any"
                                  placeholder="0.00"
                                  value={newPartPrice}
                                  onChange={(e) => {
                                    setNewPartPrice(e.target.value !== '' ? parseFloat(e.target.value) : '');
                                    if (partInputError) setPartInputError(null);
                                  }}
                                  className={`w-full h-8 rounded-lg border ${
                                    partInputError && (newPartPrice === '' || Number(newPartPrice) <= 0)
                                      ? 'border-rose-500 ring-1 ring-rose-500/50 bg-rose-500/10'
                                      : 'border-white/[0.1]'
                                  } bg-slate-900 px-2.5 text-xs text-white font-mono placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none`}
                                />
                              </div>
                              <div className="sm:col-span-3">
                                <label className="block text-[11px] text-slate-400 mb-1">Note (Optional)</label>
                                <input
                                  type="text"
                                  placeholder="e.g. Bosch OEM"
                                  value={newPartNote}
                                  onChange={(e) => setNewPartNote(e.target.value)}
                                  className="w-full h-8 rounded-lg border border-white/[0.1] bg-slate-900 px-2.5 text-xs text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none"
                                />
                              </div>
                              <div className="sm:col-span-1">
                                <button
                                  type="button"
                                  onClick={handleAddPartItem}
                                  className="w-full h-8 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold flex items-center justify-center cursor-pointer transition-colors shadow-sm"
                                  title="Add Item"
                                >
                                  <Plus className="h-4 w-4 stroke-[2.5]" />
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                        {partInputError && (
                          <p className="text-[11px] text-rose-400 flex items-center gap-1 px-1">
                            <AlertTriangle className="h-3 w-3 shrink-0" />
                            <span>{partInputError}</span>
                          </p>
                        )}
                      </div>
                    )}

                    {/* Added Parts List */}
                    {formParts.length > 0 ? (
                      <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                        {formParts.map((p, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-slate-900 border border-white/[0.06] text-xs"
                          >
                            <div className="flex-1 min-w-0 pr-2">
                              <span className="font-semibold text-white truncate block">{p.partName}</span>
                              {p.notes && (
                                <span className="text-slate-400 text-[11px] truncate block mt-0.5">
                                  <span className="text-slate-500">Note:</span> {p.notes}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2.5 shrink-0">
                              <span className="font-bold text-emerald-400 font-mono">
                                ₹{(p.price ?? p.unitCost ?? p.totalCost ?? 0).toLocaleString('en-IN')}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleRemovePartItem(idx)}
                                className="text-slate-500 hover:text-rose-400 p-0.5 cursor-pointer transition-colors"
                                title="Remove part"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[11px] text-slate-500 italic text-center py-1">
                        No parts added. Adding parts is optional.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </form>

            {/* FIXED FOOTER */}
            <div className="flex items-center justify-between border-t border-white/[0.08] px-6 py-4 bg-slate-900/90 flex-shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Total:</span>
                <span className={`text-sm font-bold font-mono ${calculatedTotal > 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                  ₹{calculatedTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                {calculatedTotal <= 0 && (
                  <span className="text-[11px] text-amber-400/90 font-medium">
                    (Cannot be ₹0.00)
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedRecord(null);
                  }}
                  className="apple-btn rounded-xl border border-white/[0.1] px-4 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  form="edit-service-form"
                  disabled={submitting || calculatedTotal <= 0}
                  className="apple-btn rounded-xl bg-emerald-500 hover:bg-emerald-400 px-5 py-2 text-xs font-bold text-slate-950 shadow-sm transition-all cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Updating...' : 'Update Record'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: View Service Details */}
      {showViewModal && selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="w-full max-w-xl rounded-2xl border border-white/[0.1] bg-slate-900/95 p-6 sm:p-8 shadow-2xl backdrop-blur-2xl space-y-5 my-8 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">Service Invoice Summary</h2>
                  <p className="text-xs text-slate-400 font-mono">ID: {selectedRecord.id.slice(0, 8)}...</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowViewModal(false);
                  setSelectedRecord(null);
                }}
                className="rounded-lg p-1.5 text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Vehicle & Date Overview */}
            <div className="rounded-xl border border-white/[0.08] bg-slate-950/60 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Car className="h-4 w-4 text-emerald-400" />
                  <span className="text-sm font-bold text-white">
                    {vehicleMap.get(selectedRecord.vehicleId)?.name || 'Vehicle'}
                  </span>
                  {vehicleMap.get(selectedRecord.vehicleId)?.licensePlate && (
                    <span className="text-xs text-slate-400 font-mono">
                      ({vehicleMap.get(selectedRecord.vehicleId)?.licensePlate})
                    </span>
                  )}
                </div>
                <span className="text-xs font-semibold text-slate-300">
                  {new Date(selectedRecord.serviceDate).toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs text-slate-400 pt-2 border-t border-white/[0.06]">
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase">Service Provider</span>
                  <span className="text-white font-medium">{selectedRecord.serviceProvider || 'Not specified'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase">Odometer</span>
                  <span className="text-white font-mono font-medium">
                    {selectedRecord.odometer !== null ? `${selectedRecord.odometer.toLocaleString()} km` : 'Not recorded'}
                  </span>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Work Performed</span>
              <p className="text-xs text-slate-200 bg-slate-950/50 p-3 rounded-xl border border-white/[0.06] leading-relaxed">
                {selectedRecord.notes || 'Routine scheduled vehicle maintenance inspection.'}
              </p>
            </div>

            {/* Financial Details */}
            <div className="space-y-2">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Financial Breakdown</span>
              <div className="rounded-xl border border-white/[0.08] bg-slate-950/60 p-3.5 space-y-2 text-xs">
                <div className="flex justify-between text-slate-300">
                  <span>Labour Cost:</span>
                  <span className="font-mono font-semibold">₹{selectedRecord.labourCost?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Parts Cost:</span>
                  <span className="font-mono font-semibold">₹{selectedRecord.partsCost?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Tax:</span>
                  <span className="font-mono font-semibold">₹{selectedRecord.tax?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                {selectedRecord.miscCost > 0 && (
                  <div className="flex justify-between text-slate-300">
                    <span>Misc / Other:</span>
                    <span className="font-mono font-semibold">₹{selectedRecord.miscCost?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-2 border-t border-white/[0.08] text-sm">
                  <span className="font-bold text-white">Total Amount Invoiced:</span>
                  <span className="font-black text-emerald-400 text-base font-mono">
                    ₹{selectedRecord.totalCost?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>

            {/* Itemized Parts if any */}
            {selectedRecord.parts && selectedRecord.parts.length > 0 && (
              <div className="space-y-2">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Parts Logged</span>
                <div className="rounded-xl border border-white/[0.08] bg-slate-950/60 p-2.5 space-y-1.5 text-xs">
                  {selectedRecord.parts.map((p, i) => (
                    <div key={i} className="flex justify-between items-center py-1.5 border-b border-white/[0.04] last:border-0">
                      <div className="min-w-0 flex-1 pr-2">
                        <span className="text-white font-medium block truncate">{p.partName}</span>
                        {p.notes && (
                          <span className="text-slate-400 text-[11px] block truncate mt-0.5">
                            <span className="text-slate-500">Note:</span> {p.notes}
                          </span>
                        )}
                      </div>
                      <span className="font-bold text-emerald-400 font-mono shrink-0">
                        ₹{(p.price ?? p.unitCost ?? p.totalCost ?? 0).toLocaleString('en-IN')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Next Service Reminder Info */}
            {selectedRecord.nextServiceDate && (
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 space-y-1.5 text-xs">
                <div className="flex items-center gap-1.5 font-bold text-emerald-300">
                  <Calendar className="h-4 w-4 text-emerald-400" />
                  <span>Next Service Target Reminder</span>
                </div>
                <div className="text-slate-200">
                  Target Date: <strong className="text-white">{new Date(selectedRecord.nextServiceDate).toLocaleDateString('en-GB')}</strong>
                  {selectedRecord.nextServiceOdometer && (
                    <span> or at <strong className="text-white">{Number(selectedRecord.nextServiceOdometer).toLocaleString()} km</strong></span>
                  )}
                </div>
                {selectedRecord.reminderNotes && (
                  <p className="text-slate-400 text-[11px] italic">"{selectedRecord.reminderNotes}"</p>
                )}
              </div>
            )}

            {/* Footer Actions */}
            <div className="flex justify-between items-center pt-3 border-t border-white/[0.08]">
              <button
                type="button"
                onClick={() => {
                  setShowViewModal(false);
                  handleOpenDelete(selectedRecord);
                }}
                className="text-rose-400 hover:text-rose-300 text-xs font-semibold px-2 py-1 cursor-pointer"
              >
                Delete Log
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowViewModal(false);
                    handleOpenEdit(selectedRecord);
                  }}
                  className="rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-4 py-2 text-xs transition-colors cursor-pointer"
                >
                  Edit Invoice
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: Delete Confirmation */}
      <Modal
        isOpen={showDeleteModal && selectedRecord !== null}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedRecord(null);
        }}
        title="Delete Maintenance Record"
        subtitle="This action is permanent and cannot be undone."
        icon={
          <div className="p-2.5 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-400 shrink-0">
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
                setSelectedRecord(null);
              }}
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
              Delete Record
            </Button>
          </>
        }
      >
        {selectedRecord && (
          <div className="rounded-xl border border-white/[0.08] bg-slate-950/60 p-3.5 text-xs space-y-1.5 text-slate-300">
            <div>
              Vehicle: <strong className="text-white">{vehicleMap.get(selectedRecord.vehicleId)?.name || 'Vehicle'}</strong>
            </div>
            <div>
              Date: <strong className="text-white">{new Date(selectedRecord.serviceDate).toLocaleDateString('en-GB')}</strong>
            </div>
            <div>
              Total Amount: <strong className="text-rose-400 font-mono">₹{selectedRecord.totalCost?.toLocaleString('en-IN')}</strong>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
