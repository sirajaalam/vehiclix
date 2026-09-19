'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import {
  Car,
  Fuel,
  Wrench,
  Compass,
  Calculator,
  ShieldCheck,
  Zap,
  ArrowRight,
  TrendingUp,
  Receipt,
  FileText,
  Download,
  Smartphone,
  LayoutDashboard,
} from 'lucide-react';

export default function HomePage() {
  const { user } = useAuth();

  return (
    <div className="relative overflow-hidden">
      {/* Glow gradient background */}
      <div className="absolute top-0 left-1/2 -z-10 -translate-x-1/2 blur-3xl opacity-20 pointer-events-none">
        <div className="h-[500px] w-[900px] bg-gradient-to-tr from-emerald-500 via-teal-500 to-indigo-500 rounded-full" />
      </div>

      {/* Hero Section */}
      <section className="mx-auto max-w-7xl px-4 pt-28 pb-16 sm:pt-36 sm:pb-20 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-xs font-semibold text-emerald-400 mb-6"
        >
          <Zap className="h-3.5 w-3.5" />
          Production-Ready Vehicle Management
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-tight"
        >
          Master Your Vehicles, Fuel & Road Trips with{' '}
          <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
            Precision Intelligence
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="mt-6 text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed"
        >
          Vehiclix delivers end-to-end garage tracking, exact paise fuel expenditure, maintenance history, and comprehensive trip expense tracking.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="mt-10 flex flex-wrap items-center justify-center gap-4"
        >
          {user ? (
            <>
              <Link
                href="/dashboard"
                className="apple-btn inline-flex items-center gap-2 rounded-full bg-emerald-500 px-7 py-3.5 text-sm font-semibold text-slate-950 shadow-[0_2px_12px_rgba(16,185,129,0.3)] hover:bg-emerald-400 transition-all cursor-pointer active:scale-95"
              >
                Go to Dashboard <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/garage"
                className="apple-btn inline-flex items-center gap-2 rounded-full border border-white/[0.12] bg-slate-900/60 px-7 py-3.5 text-sm font-medium text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Manage Vehicles
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/register"
                className="apple-btn inline-flex items-center gap-2 rounded-full bg-emerald-500 px-7 py-3.5 text-sm font-semibold text-slate-950 shadow-[0_2px_12px_rgba(16,185,129,0.3)] hover:bg-emerald-400 transition-all cursor-pointer active:scale-95"
              >
                Get Started Free <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/login"
                className="apple-btn inline-flex items-center gap-2 rounded-full border border-white/[0.12] bg-slate-900/60 px-7 py-3.5 text-sm font-medium text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Sign In
              </Link>
            </>
          )}
        </motion.div>

        {/* Floating Quick Metric Badges (Apple Minimalist Row) */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="mt-14 grid grid-cols-2 gap-3 sm:grid-cols-4 max-w-3xl mx-auto"
        >
          <div className="rounded-[14px] border border-white/[0.08] bg-slate-900/50 p-4 text-center backdrop-blur-md shadow-[0_1px_3px_rgba(0,0,0,0.3)]">
            <div className="text-2xl font-bold text-emerald-400">100%</div>
            <div className="text-xs text-slate-400 mt-1">Audit Trail Integrity</div>
          </div>
          <div className="rounded-[14px] border border-white/[0.08] bg-slate-900/50 p-4 text-center backdrop-blur-md shadow-[0_1px_3px_rgba(0,0,0,0.3)]">
            <div className="text-2xl font-bold text-teal-400">EV + ICE</div>
            <div className="text-xs text-slate-400 mt-1">Litre, Gallon, KG & kWh</div>
          </div>
          <div className="rounded-[14px] border border-white/[0.08] bg-slate-900/50 p-4 text-center backdrop-blur-md shadow-[0_1px_3px_rgba(0,0,0,0.3)]">
            <div className="text-2xl font-bold text-cyan-400">Itemized</div>
            <div className="text-xs text-slate-400 mt-1">Trip Expenses</div>
          </div>
          <div className="rounded-[14px] border border-white/[0.08] bg-slate-900/50 p-4 text-center backdrop-blur-md shadow-[0_1px_3px_rgba(0,0,0,0.3)]">
            <div className="text-2xl font-bold text-indigo-400">PDF</div>
            <div className="text-xs text-slate-400 mt-1">On-Demand Reports</div>
          </div>
        </motion.div>
      </section>

      {/* Feature Grid (Apple Large Cards 16px, Concentric Inner Icon 10px) */}
      <section id="features" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Built for Complete Vehicle Intelligence</h2>
          <p className="mt-3 text-slate-400 text-sm">
            Every feature is engineered with strict type safety, zero floating-point errors, and defense-in-depth security.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="rounded-[16px] border border-white/[0.08] bg-slate-900/50 p-6 shadow-[0_2px_8px_rgba(0,0,0,0.35)] hover:border-emerald-500/30 transition-all">
            <div className="flex h-11 w-11 items-center justify-center rounded-[10px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mb-5">
              <Car className="h-5 w-5" />
            </div>
            <h3 className="text-base font-semibold text-white tracking-tight">Garage & Vehicle Lifecycle</h3>
            <p className="mt-2 text-sm text-slate-400 leading-relaxed">
              Manage cars, bikes, trucks, and personal vehicles. Track baseline and continuous odometer readings with automated continuity validation.
            </p>
          </div>

          {/* Card 2 */}
          <div className="rounded-[16px] border border-white/[0.08] bg-slate-900/50 p-6 shadow-[0_2px_8px_rgba(0,0,0,0.35)] hover:border-teal-500/30 transition-all">
            <div className="flex h-11 w-11 items-center justify-center rounded-[10px] bg-teal-500/10 border border-teal-500/20 text-teal-400 mb-5">
              <Fuel className="h-5 w-5" />
            </div>
            <h3 className="text-base font-semibold text-white tracking-tight">Fuel & Energy Tracking</h3>
            <p className="mt-2 text-sm text-slate-400 leading-relaxed">
              Comprehensive fuel logging supporting Petrol, Diesel, CNG (KG), and Electric (kWh). Computes consumption statistics and spend trends.
            </p>
          </div>

          {/* Card 3 */}
          <div className="rounded-[16px] border border-white/[0.08] bg-slate-900/50 p-6 shadow-[0_2px_8px_rgba(0,0,0,0.35)] hover:border-cyan-500/30 transition-all">
            <div className="flex h-11 w-11 items-center justify-center rounded-[10px] bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 mb-5">
              <Wrench className="h-5 w-5" />
            </div>
            <h3 className="text-base font-semibold text-white tracking-tight">Maintenance & Itemized Parts</h3>
            <p className="mt-2 text-sm text-slate-400 leading-relaxed">
              Track labor, replacement parts, tax, and miscellaneous costs with scheduled service dates and mileage reminders.
            </p>
          </div>

          {/* Card 4 */}
          <div className="rounded-[16px] border border-white/[0.08] bg-slate-900/50 p-6 shadow-[0_2px_8px_rgba(0,0,0,0.35)] hover:border-indigo-500/30 transition-all">
            <div className="flex h-11 w-11 items-center justify-center rounded-[10px] bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 mb-5">
              <Receipt className="h-5 w-5" />
            </div>
            <h3 className="text-base font-semibold text-white tracking-tight">Itemized Trip Expenses</h3>
            <p className="mt-2 text-sm text-slate-400 leading-relaxed">
              Coordinate multi-destination road trips. Log multi-category expenses including fuel, food, toll, stay, and other costs with live totals.
            </p>
          </div>

          {/* Card 5 */}
          <div className="rounded-[16px] border border-white/[0.08] bg-slate-900/50 p-6 shadow-[0_2px_8px_rgba(0,0,0,0.35)] hover:border-amber-500/30 transition-all">
            <div className="flex h-11 w-11 items-center justify-center rounded-[10px] bg-amber-500/10 border border-amber-500/20 text-amber-400 mb-5">
              <FileText className="h-5 w-5" />
            </div>
            <h3 className="text-base font-semibold text-white tracking-tight">On-Demand PDF Reports</h3>
            <p className="mt-2 text-sm text-slate-400 leading-relaxed">
              Generate formatted vehicle financial audits and trip expense reports on demand without bloating the database.
            </p>
          </div>

          {/* Card 6 */}
          <div className="rounded-[16px] border border-white/[0.08] bg-slate-900/50 p-6 shadow-[0_2px_8px_rgba(0,0,0,0.35)] hover:border-emerald-500/30 transition-all">
            <div className="flex h-11 w-11 items-center justify-center rounded-[10px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mb-5">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h3 className="text-base font-semibold text-white tracking-tight">Defense-in-Depth Security</h3>
            <p className="mt-2 text-sm text-slate-400 leading-relaxed">
              Cloudflare edge proxy, Helmet headers, strict CORS, Zod validation, Supabase JWT verification, and parameterized SQL queries.
            </p>
          </div>
        </div>
      </section>

      {/* Mobile Download Section (Concentric: Outer Sheet 22px -> Inner Card 12px -> Inner Icon 8px) */}
      <section id="download" className="mx-auto max-w-5xl px-4 py-10 sm:py-12 sm:px-6 lg:px-8 scroll-mt-24">
        <div className="relative overflow-hidden rounded-[22px] border border-white/[0.08] bg-slate-900/40 p-6 sm:p-8 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
          {/* Subtle Ambient Radial Glow */}
          <div className="absolute top-0 right-0 -z-10 h-64 w-64 rounded-full bg-emerald-500/5 blur-3xl pointer-events-none" />

          {/* Badge: Capsule/Pill */}
          <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">
            <Download className="h-3 w-3" />
            Download
          </div>

          {/* Heading & Subtitle */}
          <h2 className="mt-3 text-xl sm:text-2xl font-bold tracking-tight text-white">
            Start on web today and get ready for mobile access
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-slate-400">
            Start on web today. Mobile apps for iPhone and Android are coming soon.
          </p>

          {/* Cards Grid: iOS & Android (Concentric 12px inner cards) */}
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* iOS App Card */}
            <div className="rounded-[12px] border border-white/[0.07] bg-slate-950/50 p-4 sm:p-5 flex flex-col justify-between hover:border-white/[0.12] transition-colors">
              <div>
                {/* Concentric inner icon: 8px */}
                <div className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mb-3 shadow-inner">
                  <Smartphone className="h-4 w-4" />
                </div>
                <h3 className="text-sm font-semibold text-white tracking-tight">iOS App</h3>
                <p className="mt-1 text-xs text-slate-400 leading-relaxed">
                  Quick fuel, trip, and reminder access for iPhone users.
                </p>
              </div>
              <div>
                <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-slate-900 text-slate-400 border border-white/[0.06] mt-4">
                  Coming soon
                </span>
              </div>
            </div>

            {/* Android App Card */}
            <div className="rounded-[12px] border border-white/[0.07] bg-slate-950/50 p-4 sm:p-5 flex flex-col justify-between hover:border-white/[0.12] transition-colors">
              <div>
                {/* Concentric inner icon: 8px */}
                <div className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mb-3 shadow-inner">
                  <Smartphone className="h-4 w-4" />
                </div>
                <h3 className="text-sm font-semibold text-white tracking-tight">Android App</h3>
                <p className="mt-1 text-xs text-slate-400 leading-relaxed">
                  Fast access to logs, reminders, and analytics on Android.
                </p>
              </div>
              <div>
                <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-slate-900 text-slate-400 border border-white/[0.06] mt-4">
                  Coming soon
                </span>
              </div>
            </div>
          </div>

          {/* Bottom Bar Divider & Action */}
          <div className="mt-6 pt-4 border-t border-white/[0.08] flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-slate-400 text-center sm:text-left">
              Use Vehiclix on the web today while mobile apps are in progress.
            </p>
            <Link
              href="/dashboard"
              className="apple-btn inline-flex items-center gap-1.5 rounded-[10px] bg-slate-900 hover:bg-slate-800 border border-white/[0.08] text-white px-3.5 py-1.5 text-xs font-medium transition-all shadow-sm shrink-0 active:scale-95"
            >
              <span>Start on web</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
