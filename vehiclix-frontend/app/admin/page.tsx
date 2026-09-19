'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { toast } from 'sonner';
import {
  ShieldAlert,
  Users,
  Car,
  Fuel,
  Wrench,
  Compass,
  Search,
  RefreshCw,
  ArrowLeft,
  Calendar,
  CheckCircle2,
} from 'lucide-react';
import Link from 'next/link';

export default function AdminPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [overview, setOverview] = useState<any>(null);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [unauthorized, setUnauthorized] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    if (user) {
      if (user.appRole !== 'admin') {
        setUnauthorized(true);
        setLoading(false);
        return;
      }
      loadAdminData();
    }
  }, [user, authLoading, router]);

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const [overviewData, usersData] = await Promise.all([
        api.getAdminOverview(),
        api.listAdminUsers(search),
      ]);

      setOverview(overviewData || null);
      setUsersList(Array.isArray(usersData) ? usersData : []);
    } catch (err: any) {
      console.error('Failed to load admin data:', err);
      toast.error(err.message || 'Failed to load admin metrics');
      setOverview(null);
      setUsersList([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadAdminData();
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-400">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-emerald-500"></div>
      </div>
    );
  }

  if (unauthorized) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center space-y-6 shadow-2xl">
          <div className="w-16 h-16 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-2xl flex items-center justify-center mx-auto">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-white">Restricted Access</h2>
            <p className="text-sm text-slate-400">
              The Admin Operations Console is restricted to authenticated users with the <span className="text-rose-400 font-mono">admin</span> role.
            </p>
          </div>
          <div className="pt-2 flex flex-col gap-3">
            <Link
              href="/dashboard"
              className="w-full py-2.5 rounded-xl text-sm font-semibold bg-slate-800 hover:bg-slate-700 text-white transition-colors"
            >
              Return to User Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const stats = [
    { label: 'Registered Users', value: overview?.totalUsers || 0, icon: Users, color: 'text-blue-400' },
    { label: 'Total Vehicles', value: overview?.totalVehicles || 0, icon: Car, color: 'text-emerald-400' },
    { label: 'Fuel Logs', value: overview?.totalFuelEntries || 0, icon: Fuel, color: 'text-amber-400' },
    { label: 'Service Audits', value: overview?.totalServices || 0, icon: Wrench, color: 'text-purple-400' },
    { label: 'Completed Trips', value: overview?.totalTrips || 0, icon: Compass, color: 'text-indigo-400' },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <Link
              href="/dashboard"
              className="inline-flex items-center text-sm font-medium text-slate-400 hover:text-white transition-colors mb-2"
            >
              <ArrowLeft className="w-4 h-4 mr-1" /> Back to Dashboard
            </Link>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight text-white">System Admin Console</h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                Operational
              </span>
            </div>
            <p className="text-sm text-slate-400 mt-1">
              Global telemetry, aggregate metrics, and authenticated user directory.
            </p>
          </div>

          <button
            onClick={loadAdminData}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors self-start sm:self-auto"
          >
            <RefreshCw className="w-4 h-4" /> Refresh Telemetry
          </button>
        </div>

        {/* Aggregate KPI Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {stats.map((s, idx) => (
            <div
              key={idx}
              className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 backdrop-blur-sm shadow-lg space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400">{s.label}</span>
                <s.icon className={`w-4 h-4 ${s.color}`} />
              </div>
              <p className="text-2xl font-bold text-white tracking-tight">{s.value.toLocaleString()}</p>
            </div>
          ))}
        </div>

        {/* User Directory */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-sm shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-white">User Directory</h2>
              <p className="text-xs text-slate-400">Search and monitor user accounts and vehicle counts.</p>
            </div>

            <form onSubmit={handleSearch} className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by email or ID..."
                  className="bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 w-64 sm:w-80"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl text-sm font-semibold bg-emerald-500 text-white hover:bg-emerald-400 transition-colors"
              >
                Search
              </button>
            </form>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="pb-3 px-4 font-semibold">User / Email</th>
                  <th className="pb-3 px-4 font-semibold">Role</th>
                  <th className="pb-3 px-4 font-semibold">Vehicles</th>
                  <th className="pb-3 px-4 font-semibold">Registered</th>
                  <th className="pb-3 px-4 font-semibold text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {usersList.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-500 text-sm">
                      No users match the search filter.
                    </td>
                  </tr>
                ) : (
                  usersList.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3.5 px-4 font-medium text-white">
                        <div>{u.email}</div>
                        <div className="text-xs font-mono text-slate-500">{u.id}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                            u.role === 'admin'
                              ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                              : 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          {u.role || 'user'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-white">{u.vehicleCount ?? 0}</span> vehicles
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-500" />
                          {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'N/A'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <span className="inline-flex items-center gap-1 text-xs text-emerald-400">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Active
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
