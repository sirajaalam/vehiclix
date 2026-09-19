import React from 'react';
import Link from 'next/link';
import { Car, ShieldCheck, Zap } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-slate-800 bg-slate-950 text-slate-400">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div className="space-y-4 md:col-span-2">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500 text-slate-950">
                <Car className="h-4 w-4" />
              </div>
              <span className="text-lg font-bold text-white">Vehiclix</span>
            </div>
            <p className="max-w-md text-sm text-slate-400">
              Vehicle & Fuel Intelligence platform. Comprehensive vehicle lifecycle management, exact expense tracking, maintenance logs, and deterministic trip splitting.
            </p>
            <div className="flex items-center gap-4 text-xs text-slate-500">
              <span className="flex items-center gap-1"><ShieldCheck className="h-3.5 w-3.5 text-emerald-400" /> Defense-in-Depth Security</span>
              <span className="flex items-center gap-1"><Zap className="h-3.5 w-3.5 text-amber-400" /> Sub-millisecond Redis cache</span>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-200">Modules</h3>
            <ul className="mt-4 space-y-2 text-sm">
              <li><Link href="/garage" className="hover:text-emerald-400">Garage Management</Link></li>
              <li><Link href="/fuel" className="hover:text-emerald-400">Fuel & Energy Tracking</Link></li>
              <li><Link href="/services" className="hover:text-emerald-400">Maintenance & Reminders</Link></li>
              <li><Link href="/trips" className="hover:text-emerald-400">Trips & Equal Split</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-200">Resources</h3>
            <ul className="mt-4 space-y-2 text-sm">
              <li><Link href="/calculator" className="hover:text-emerald-400">Trip Fuel Calculator</Link></li>
              <li><Link href="/help" className="hover:text-emerald-400">Documentation & Help</Link></li>
              <li><Link href="/faq" className="hover:text-emerald-400">Frequently Asked Questions</Link></li>
              <li><a href="http://localhost:9090/api/docs" target="_blank" rel="noreferrer" className="hover:text-emerald-400">API Documentation (Swagger)</a></li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-slate-900 pt-6 text-center text-xs text-slate-600">
          © {new Date().getFullYear()} Vehiclix. All rights reserved. Vehicle & Fuel Intelligence.
        </div>
      </div>
    </footer>
  );
}
