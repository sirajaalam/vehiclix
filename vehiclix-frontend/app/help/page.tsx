import React from 'react';
import Link from 'next/link';
import { HelpCircle, Car, Fuel, Wrench, Compass, Split, ShieldCheck } from 'lucide-react';

export default function HelpPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="text-center max-w-2xl mx-auto mb-12">
        <h1 className="text-3xl font-extrabold text-white sm:text-4xl">Help Center & Guides</h1>
        <p className="mt-2 text-sm text-slate-400">
          Learn how to get the most out of Vehiclix vehicle, fuel, and trip split management.
        </p>
      </div>

      <div className="space-y-8">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
          <div className="flex items-center gap-3 mb-3">
            <Car className="h-5 w-5 text-emerald-400" />
            <h2 className="text-lg font-bold text-white">Garage & Vehicle Lifecycle</h2>
          </div>
          <p className="text-sm text-slate-300 leading-relaxed">
            Add all your personal or commercial vehicles (Car, Bike, Truck, or Other). Set your initial baseline odometer. Every fuel entry and maintenance log will automatically update the vehicle’s current odometer while ensuring non-decreasing mileage continuity.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
          <div className="flex items-center gap-3 mb-3">
            <Fuel className="h-5 w-5 text-teal-400" />
            <h2 className="text-lg font-bold text-white">Fuel & Energy Purchases</h2>
          </div>
          <p className="text-sm text-slate-300 leading-relaxed">
            Record fuel purchases across Petrol, Diesel, CNG (KG), and Electric (kWh). Enter the price per unit and quantity; Vehiclix uses exact paise integer calculations to prevent rounding loss. View aggregated spend and consumption across your garage.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
          <div className="flex items-center gap-3 mb-3">
            <Split className="h-5 w-5 text-indigo-400" />
            <h2 className="text-lg font-bold text-white">Group Road Trips & Equal Split</h2>
          </div>
          <p className="text-sm text-slate-300 leading-relaxed">
            Create planned, in-progress, or completed road trips. Add registered or guest participants. As expenses are logged for fuel, food, toll, or stay, the system computes the exact net balance for each person using deterministic paise remainder distribution. Completed trips become immutable read-only records.
          </p>
        </div>
      </div>
    </div>
  );
}
