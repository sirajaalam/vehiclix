'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'sonner';
import { api } from '../../lib/api';
import {
  Car,
  Fuel,
  Wrench,
  Compass,
  Plus,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  Calendar,
  Sparkles,
  Calculator,
} from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await api.getDashboard();
        setData(res);
      } catch (err: any) {
        console.error('Failed to load dashboard data:', err);
        toast.error(err.message || 'Failed to load dashboard metrics');
        setData(null);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/[0.08] pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Intelligence Dashboard</h1>
          <p className="mt-1 text-sm text-slate-400">
            Welcome back, {user?.appRole === 'admin' ? 'Administrator' : (user?.email?.split('@')[0] || 'Member')}. Real-time garage and expenditure overview.
          </p>
        </div>
        <div className="flex flex-wrap gap-2.5 sm:gap-3">
          <Link
            href="/garage"
            className="apple-btn inline-flex items-center gap-1.5 rounded-[10px] border border-white/[0.08] bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <Plus className="h-4 w-4 text-emerald-400" />
            Add Vehicle
          </Link>
          <Link
            href="/fuel"
            className="apple-btn inline-flex items-center gap-1.5 rounded-[10px] border border-white/[0.08] bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <Fuel className="h-4 w-4 text-teal-400" />
            Log Fuel
          </Link>
          <Link
            href="/trips/calculator"
            className="apple-btn inline-flex items-center gap-1.5 rounded-[10px] border border-white/[0.08] bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <Calculator className="h-4 w-4 text-emerald-400" />
            Calculator
          </Link>
          <Link
            href="/trips"
            className="apple-btn inline-flex items-center gap-1.5 rounded-[10px] bg-emerald-500 px-3.5 py-2 text-xs font-semibold text-slate-950 shadow-sm hover:bg-emerald-400 transition-colors"
          >
            <Compass className="h-4 w-4" />
            Plan Trip
          </Link>
        </div>
      </div>

      {/* 4 Metric Cards (Apple Large Cards 16px, Concentric Inner Icon 8px) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Vehicles */}
        <div className="rounded-[16px] border border-white/[0.08] bg-slate-900/50 p-5 backdrop-blur-md shadow-[0_2px_8px_rgba(0,0,0,0.35)]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Garage Vehicles</span>
            <div className="rounded-[8px] bg-emerald-500/10 border border-emerald-500/20 p-2 text-emerald-400">
              <Car className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-3xl font-extrabold text-white tracking-tight">
            {loading ? '-' : data?.vehiclesCount ?? 0}
          </div>
          <div className="mt-2 text-xs text-slate-400 flex items-center justify-between">
            <span>Vehicles tracked</span>
            <Link href="/garage" className="text-emerald-400 hover:underline flex items-center gap-0.5">
              View <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>

        {/* Fuel Spend */}
        <div className="rounded-[16px] border border-white/[0.08] bg-slate-900/50 p-5 backdrop-blur-md shadow-[0_2px_8px_rgba(0,0,0,0.35)]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Fuel & Energy Spend</span>
            <div className="rounded-[8px] bg-teal-500/10 border border-teal-500/20 p-2 text-teal-400">
              <Fuel className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-3xl font-extrabold text-white tracking-tight">
            ₹{loading ? '-' : (data?.fuelSummary?.totalSpend ?? 0).toLocaleString('en-IN')}
          </div>
          <div className="mt-2 text-xs text-slate-400 flex items-center justify-between">
            <span>{data?.fuelSummary?.entriesCount ?? 0} entries logged</span>
            <Link href="/fuel" className="text-teal-400 hover:underline flex items-center gap-0.5">
              Log <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>

        {/* Maintenance */}
        <div className="rounded-[16px] border border-white/[0.08] bg-slate-900/50 p-5 backdrop-blur-md shadow-[0_2px_8px_rgba(0,0,0,0.35)]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Maintenance Spend</span>
            <div className="rounded-[8px] bg-cyan-500/10 border border-cyan-500/20 p-2 text-cyan-400">
              <Wrench className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-3xl font-extrabold text-white tracking-tight">
            ₹{loading ? '-' : (data?.serviceSummary?.totalSpend ?? 0).toLocaleString('en-IN')}
          </div>
          <div className="mt-2 text-xs text-slate-400 flex items-center justify-between">
            <span>{data?.serviceSummary?.recordsCount ?? 0} services performed</span>
            <Link href="/services" className="text-cyan-400 hover:underline flex items-center gap-0.5">
              History <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>

        {/* Trips */}
        <div className="rounded-[16px] border border-white/[0.08] bg-slate-900/50 p-5 backdrop-blur-md shadow-[0_2px_8px_rgba(0,0,0,0.35)]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Road Trips</span>
            <div className="rounded-[8px] bg-indigo-500/10 border border-indigo-500/20 p-2 text-indigo-400">
              <Compass className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-3xl font-extrabold text-white tracking-tight">
            {loading ? '-' : data?.tripSummary?.totalTrips ?? 0}
          </div>
          <div className="mt-2 text-xs text-slate-400 flex items-center justify-between">
            <span>
              {data?.tripSummary?.inProgressTrips ?? 0} active, {data?.tripSummary?.plannedTrips ?? 0} planned
            </span>
            <Link href="/trips" className="text-indigo-400 hover:underline flex items-center gap-0.5">
              Split <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* Upcoming Reminders Box (Apple 16px Container) */}
      <div className="rounded-[16px] border border-white/[0.08] bg-slate-900/60 p-6 backdrop-blur-md shadow-[0_4px_16px_rgba(0,0,0,0.3)]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-emerald-400" />
            <h2 className="text-base font-semibold text-white tracking-tight">Upcoming Maintenance & Reminders</h2>
          </div>
          <span className="text-xs text-slate-400">Automated odometer & date triggers</span>
        </div>

        {data?.upcomingServices && data.upcomingServices.length > 0 ? (
          <div className="divide-y divide-white/[0.06]">
            {data.upcomingServices.map((srv: any, idx: number) => (
              <div key={idx} className="py-3.5 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-sm text-slate-200">{srv.vehicleName}</span>
                  <p className="text-xs text-slate-400 mt-0.5">{srv.reminderNotes || 'Scheduled inspection'}</p>
                </div>
                <div className="text-right">
                  <div className="text-xs font-medium text-emerald-400">
                    {srv.nextServiceDate ? new Date(srv.nextServiceDate).toLocaleDateString('en-GB') : 'By mileage'}
                  </div>
                  {srv.nextServiceOdometer && (
                    <div className="text-[11px] text-slate-500">at {srv.nextServiceOdometer.toLocaleString()} km</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center text-xs text-slate-500">
            No upcoming maintenance deadlines. Keep logging services to set automated reminders.
          </div>
        )}
      </div>
    </div>
  );
}
