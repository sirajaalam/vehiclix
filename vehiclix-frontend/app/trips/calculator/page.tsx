'use client';

import { motion, AnimatePresence } from 'framer-motion';

import React, { useState } from 'react';
import Link from 'next/link';
import { api } from '../../../lib/api';
import {
  Calculator,
  Fuel,
  ArrowRight,
  Gauge,
  Users,
  MapPin,
  Compass,
  ArrowLeft,
} from 'lucide-react';
import { Input, Select, Button } from '../../../components/ui';

export default function PrivateTripCalculatorPage() {
  // Mode: 'distance' or 'route'
  const [calcMode, setCalcMode] = useState<'distance' | 'route'>('distance');
  const [startLocation, setStartLocation] = useState('');
  const [destination, setDestination] = useState('');

  // Input fields
  const [distance, setDistance] = useState<number | ''>('');
  const [mileage, setMileage] = useState<number | ''>('');
  const [fuelPrice, setFuelPrice] = useState<number | ''>('');
  const [fuelType, setFuelType] = useState<string>('PETROL');
  const [passengers, setPassengers] = useState<number>(1);

  const [calcErrors, setCalcErrors] = useState<{
    distance?: string;
    mileage?: string;
    fuelPrice?: string;
    route?: string;
  }>({});
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    fuelRequired: number;
    estimatedCost: number;
    costPerKm: number;
    costPerPerson: number;
    distance: number;
  } | null>(null);

  const handleFuelTypeChange = (type: string) => {
    setFuelType(type);
    // Suggest default values if field is empty
    if (mileage === '') {
      if (type === 'ELECTRIC') setMileage(6.5);
      else if (type === 'CNG') setMileage(22);
      else if (type === 'DIESEL') setMileage(18);
      else if (type === 'PETROL') setMileage(15);
    }
    if (fuelPrice === '') {
      if (type === 'ELECTRIC') setFuelPrice(10);
      else if (type === 'CNG') setFuelPrice(85);
      else if (type === 'DIESEL') setFuelPrice(92);
      else if (type === 'PETROL') setFuelPrice(104);
    }
  };

  const validate = () => {
    const errors: { distance?: string; mileage?: string; fuelPrice?: string; route?: string } = {};

    if (distance === '' || Number(distance) <= 0) {
      errors.distance = 'Distance must be greater than 0 km.';
    }
    if (mileage === '' || Number(mileage) <= 0) {
      errors.mileage = 'Mileage/efficiency must be greater than 0.';
    }
    if (fuelPrice === '' || Number(fuelPrice) <= 0) {
      errors.fuelPrice = 'Fuel price must be greater than ₹0.';
    }
    if (calcMode === 'route') {
      if (!startLocation.trim() || !destination.trim()) {
        errors.route = 'Please enter both starting point and destination.';
      }
    }

    setCalcErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCalculate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      return;
    }

    setLoading(true);
    const numDist = Number(distance);
    const numMile = Number(mileage);
    const numPrice = Number(fuelPrice);
    const numPass = Math.max(1, Number(passengers) || 1);

    try {
      const res = await api.estimateTripCost({
        distance: numDist,
        mileage: numMile,
        fuelPrice: numPrice,
        fuelType,
      });

      const cost = res.estimatedCost;
      setResult({
        fuelRequired: res.fuelRequired,
        estimatedCost: cost,
        costPerKm: Math.round((cost / res.distance) * 100) / 100,
        costPerPerson: Math.round((cost / numPass) * 100) / 100,
        distance: res.distance,
      });
    } catch {
      const req = Math.round((numDist / numMile) * 100) / 100;
      const cost = Math.round(req * numPrice);
      setResult({
        fuelRequired: req,
        estimatedCost: cost,
        costPerKm: Math.round((cost / numDist) * 100) / 100,
        costPerPerson: Math.round((cost / numPass) * 100) / 100,
        distance: numDist,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      {/* Header with Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/[0.08] pb-6">
        <div>
          <div className="flex items-center gap-2">
            <Link
              href="/trips"
              className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-emerald-400 transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Trips</span>
            </Link>
            <span className="text-slate-600">/</span>
            <span className="text-xs font-semibold text-emerald-400">Trip Calculator</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mt-1">
            Trip Fuel & Cost Calculator
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Calculate fuel consumption, total expenditure, and per-passenger splits before you embark on your trip.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/trips"
            className="apple-btn inline-flex items-center gap-1.5 rounded-[10px] border border-white/[0.08] bg-slate-900 px-3.5 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <Compass className="h-4 w-4 text-emerald-400" />
            <span>All Trips</span>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Form Card */}
        <div className="lg:col-span-7 rounded-[18px] border border-white/[0.08] bg-slate-900/60 p-6 sm:p-8 backdrop-blur-md shadow-[0_8px_30px_rgba(0,0,0,0.4)]">
          {/* Mode Switcher with Smooth Sliding Indicator */}
          <div className="relative mb-6 flex items-center p-1 bg-slate-950/80 rounded-[12px] border border-white/[0.08]">
            <button
              type="button"
              onClick={() => setCalcMode('distance')}
              className={`relative flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-[10px] transition-colors cursor-pointer z-10 ${
                calcMode === 'distance' ? 'text-emerald-400' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {calcMode === 'distance' && (
                <motion.div
                  layoutId="calcModePill"
                  className="absolute inset-0 rounded-[10px] bg-emerald-500/15 border border-emerald-500/30 shadow-[0_2px_8px_rgba(16,185,129,0.15)] -z-10"
                  transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                />
              )}
              <Gauge className="h-3.5 w-3.5 relative z-10" />
              <span className="relative z-10">Distance Only</span>
            </button>
            <button
              type="button"
              onClick={() => setCalcMode('route')}
              className={`relative flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-[10px] transition-colors cursor-pointer z-10 ${
                calcMode === 'route' ? 'text-emerald-400' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {calcMode === 'route' && (
                <motion.div
                  layoutId="calcModePill"
                  className="absolute inset-0 rounded-[10px] bg-emerald-500/15 border border-emerald-500/30 shadow-[0_2px_8px_rgba(16,185,129,0.15)] -z-10"
                  transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                />
              )}
              <Compass className="h-3.5 w-3.5 relative z-10" />
              <span className="relative z-10">From → To Route</span>
            </button>
          </div>

          <form onSubmit={handleCalculate} noValidate className="space-y-5">
            {/* Route Mode Inputs with Smooth Accordion Transition */}
            <AnimatePresence initial={false}>
              {calcMode === 'route' && (
                <motion.div
                  initial={{ opacity: 0, height: 0, scale: 0.98 }}
                  animate={{ opacity: 1, height: 'auto', scale: 1 }}
                  exit={{ opacity: 0, height: 0, scale: 0.98 }}
                  transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                  className="overflow-hidden"
                >
                  <div className="p-4 rounded-[14px] bg-slate-950/60 border border-white/[0.08] space-y-3">
                    <div className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-emerald-400" />
                      Route Details
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Input
                        label="Starting From"
                        placeholder="e.g. Mumbai"
                        value={startLocation}
                        onChange={(e) => setStartLocation(e.target.value)}
                      />
                      <Input
                        label="Destination"
                        placeholder="e.g. Pune"
                        value={destination}
                        onChange={(e) => setDestination(e.target.value)}
                      />
                    </div>
                    {calcErrors.route && (
                      <p className="text-xs text-rose-400 font-medium">{calcErrors.route}</p>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Distance Input */}
            <Input
              label={calcMode === 'route' ? 'Estimated Road Distance (km)' : 'Trip Distance (km)'}
              required
              type="number"
              min="1"
              step="any"
              value={distance}
              onChange={(e) => {
                setDistance(e.target.value === '' ? '' : parseFloat(e.target.value));
                if (calcErrors.distance) setCalcErrors((prev) => ({ ...prev, distance: undefined }));
              }}
              error={calcErrors.distance}
              placeholder="e.g. 450"
              rightElement={<span className="text-xs text-slate-500">km</span>}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="Fuel / Energy Type"
                required
                value={fuelType}
                onChange={(e) => handleFuelTypeChange(e.target.value)}
                options={[
                  { value: 'PETROL', label: 'Petrol' },
                  { value: 'DIESEL', label: 'Diesel' },
                  { value: 'CNG', label: 'CNG' },
                  { value: 'ELECTRIC', label: 'Electric (EV)' },
                  { value: 'OTHER', label: 'Other' },
                ]}
              />

              <Input
                label="Mileage / Efficiency"
                required
                type="number"
                min="0.1"
                step="any"
                value={mileage}
                onChange={(e) => {
                  setMileage(e.target.value === '' ? '' : parseFloat(e.target.value));
                  if (calcErrors.mileage) setCalcErrors((prev) => ({ ...prev, mileage: undefined }));
                }}
                error={calcErrors.mileage}
                placeholder="e.g. 15"
                rightElement={
                  <span className="text-xs text-slate-500">
                    {fuelType === 'ELECTRIC' ? 'km/kWh' : fuelType === 'CNG' ? 'km/kg' : 'km/l'}
                  </span>
                }
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Fuel Price Per Unit (₹)"
                required
                type="number"
                min="0"
                step="any"
                value={fuelPrice}
                onChange={(e) => {
                  setFuelPrice(e.target.value === '' ? '' : parseFloat(e.target.value));
                  if (calcErrors.fuelPrice) setCalcErrors((prev) => ({ ...prev, fuelPrice: undefined }));
                }}
                error={calcErrors.fuelPrice}
                placeholder="e.g. 104.5"
                rightElement={<span className="text-xs text-slate-500">₹/unit</span>}
              />

              <Input
                label="Passengers (Carpool Split)"
                type="number"
                min="1"
                max="20"
                value={passengers}
                onChange={(e) => setPassengers(Math.max(1, parseInt(e.target.value) || 1))}
                placeholder="1"
                rightElement={<span className="text-xs text-slate-500">people</span>}
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              isLoading={loading}
              loadingText="Calculating..."
              leftIcon={<Calculator className="h-4 w-4" />}
            >
              Calculate Trip Fuel & Cost
            </Button>
          </form>
        </div>

        {/* Results Card */}
        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-[18px] border border-white/[0.08] bg-slate-900/70 p-6 sm:p-8 shadow-[0_8px_30px_rgba(0,0,0,0.4)] backdrop-blur-md">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Trip Expenditure Forecast
            </h2>

            {result ? (
              <div className="mt-6 space-y-6">
                <div>
                  <span className="text-xs text-slate-400">Total Estimated Cost</span>
                  <div className="text-4xl font-extrabold text-white flex items-baseline gap-1 mt-1 tracking-tight">
                    <span className="text-2xl text-emerald-400 font-bold">₹</span>
                    {result.estimatedCost.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/[0.08]">
                  <div className="rounded-[12px] border border-white/[0.08] bg-slate-950/60 p-3.5">
                    <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
                      <Fuel className="h-3.5 w-3.5 text-teal-400" />
                      Required Energy
                    </div>
                    <div className="text-lg font-bold text-white tracking-tight">
                      {result.fuelRequired}{' '}
                      <span className="text-xs text-slate-400 font-normal">
                        {fuelType === 'ELECTRIC' ? 'kWh' : fuelType === 'CNG' ? 'kg' : 'Litres'}
                      </span>
                    </div>
                  </div>

                  <div className="rounded-[12px] border border-white/[0.08] bg-slate-950/60 p-3.5">
                    <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
                      <Gauge className="h-3.5 w-3.5 text-cyan-400" />
                      Cost Per km
                    </div>
                    <div className="text-lg font-bold text-white tracking-tight">
                      ₹{result.costPerKm}
                    </div>
                  </div>
                </div>

                {/* Per Person Split */}
                {passengers > 1 && (
                  <div className="rounded-[12px] border border-emerald-500/20 bg-emerald-500/10 p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-emerald-400" />
                        <span className="text-xs font-semibold text-emerald-300">
                          Cost per passenger ({passengers} people):
                        </span>
                      </div>
                      <div className="text-lg font-bold text-white tracking-tight">
                        ₹{result.costPerPerson}{' '}
                        <span className="text-xs font-normal text-slate-400">/ person</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Action button: Plan trip */}
                <div className="space-y-3 pt-2">
                  <Link
                    href={`/trips${calcMode === 'route' && startLocation && destination ? `?start=${encodeURIComponent(startLocation)}&dest=${encodeURIComponent(destination)}&distance=${result.distance}` : ''}`}
                    className="apple-btn flex items-center justify-center gap-2 w-full rounded-[10px] bg-emerald-500 px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-950 shadow-md hover:bg-emerald-400 transition-all cursor-pointer"
                  >
                    <Compass className="h-4 w-4" />
                    <span>Plan This in Trips</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-sm text-slate-500">
                Enter trip parameters on the left to view fuel and cost estimations.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
