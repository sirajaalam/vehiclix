'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { api } from '../../lib/api';
import {
  Calculator,
  Sparkles,
  Fuel,
  ArrowRight,
  Gauge,
  Users,
  LogIn,
} from 'lucide-react';
import { Input, Select, Button } from '../../components/ui';

export default function PublicCalculatorPage() {
  const [distance, setDistance] = useState<number | ''>('');
  const [mileage, setMileage] = useState<number | ''>('');
  const [fuelPrice, setFuelPrice] = useState<number | ''>('');
  const [fuelType, setFuelType] = useState<string>('PETROL');
  const [passengers, setPassengers] = useState<number>(1);

  const [calcErrors, setCalcErrors] = useState<{
    distance?: string;
    mileage?: string;
    fuelPrice?: string;
  }>({});
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    fuelRequired: number;
    estimatedCost: number;
    costPerKm: number;
    costPerPerson: number;
  } | null>(null);

  const validate = () => {
    const errors: { distance?: string; mileage?: string; fuelPrice?: string } = {};
    if (distance === '' || Number(distance) <= 0) {
      errors.distance = 'Distance must be greater than 0 km.';
    }
    if (mileage === '' || Number(mileage) <= 0) {
      errors.mileage = 'Mileage/efficiency must be greater than 0.';
    }
    if (fuelPrice === '' || Number(fuelPrice) <= 0) {
      errors.fuelPrice = 'Fuel price must be greater than ₹0.';
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

      setResult({
        fuelRequired: res.fuelRequired,
        estimatedCost: res.estimatedCost,
        costPerKm: Math.round((res.estimatedCost / res.distance) * 100) / 100,
        costPerPerson: Math.round((res.estimatedCost / numPass) * 100) / 100,
      });
    } catch {
      // Local calculation fallback
      const req = Math.round((numDist / numMile) * 100) / 100;
      const cost = Math.round(req * numPrice);
      setResult({
        fuelRequired: req,
        estimatedCost: cost,
        costPerKm: Math.round((cost / numDist) * 100) / 100,
        costPerPerson: Math.round((cost / numPass) * 100) / 100,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="text-center max-w-2xl mx-auto mb-10">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1 text-xs font-semibold text-emerald-400 mb-3">
          <Sparkles className="h-3.5 w-3.5" />
          Public Calculator • Zero Map Dependency
        </div>
        <h1 className="text-3xl font-extrabold text-white sm:text-4xl">
          Trip Fuel & Cost Calculator
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          Estimate fuel consumption and total expenditure for upcoming road trips before you embark.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Form Card */}
        <div className="lg:col-span-7 rounded-[18px] border border-white/[0.08] bg-slate-900/60 p-6 sm:p-8 backdrop-blur-md shadow-[0_8px_30px_rgba(0,0,0,0.4)]">
          <form onSubmit={handleCalculate} noValidate className="space-y-6">
            <Input
              label="Trip Distance (km)"
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
                onChange={(e) => setFuelType(e.target.value)}
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
              Estimated Trip Expenses
            </h2>

            {result ? (
              <div className="mt-6 space-y-6">
                <div>
                  <span className="text-xs text-slate-400">Total Fuel Cost</span>
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

                <div className="rounded-[10px] border border-emerald-500/20 bg-emerald-500/5 p-4 text-xs text-slate-300">
                  💡 <strong>Pro Tip:</strong> Planning a group road trip? Sign in to Vehiclix to select vehicles from your garage and split total food, fuel, toll, and stay expenses equally among passengers.
                  <div className="mt-3">
                    <Link
                      href="/login"
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
                    >
                      <LogIn className="h-3.5 w-3.5" />
                      <span>Sign in to Vehiclix</span>
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-sm text-slate-500">
                Enter trip parameters on the left to view fuel estimation.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
