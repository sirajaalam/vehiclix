'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Car,
  Gauge,
  Fuel,
  Wrench,
  Compass,
  Calculator,
  HelpCircle,
  Shield,
  User,
  LogOut,
  X,
  ChevronRight,
} from 'lucide-react';

interface SidebarProps {
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

export function Sidebar({ mobileOpen, setMobileOpen }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const mainNavItems: {
    name: string;
    href: string;
    icon: any;
    badge?: string | null;
  }[] = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      name: 'Garage',
      href: '/garage',
      icon: Car,
      // badge: 'Garage',
    },
    {
      name: 'Fuel & Energy',
      href: '/fuel',
      icon: Fuel,
      badge: null,
    },
    {
      name: 'Maintenance',
      href: '/services',
      icon: Wrench,
      badge: null,
    },
    {
      name: 'Trips & Split',
      href: '/trips',
      icon: Compass,
      // badge: 'Equal Split',
    },
  ];

  const secondaryNavItems = [
    {
      name: 'Trip Calculator',
      href: '/trips/calculator',
      icon: Calculator,
    },
    {
      name: 'Help & Docs',
      href: '/help',
      icon: HelpCircle,
    },
  ];

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    if (href === '/trips') return pathname === '/trips' || (pathname.startsWith('/trips/') && !pathname.startsWith('/trips/calculator'));
    return pathname.startsWith(href);
  };

  const NavContent = () => (
    <div className="flex h-full flex-col justify-between overflow-y-auto px-3.5 py-5 select-none">
      {/* Brand Header */}
      <div className="space-y-6">
        <div className="flex items-center justify-between px-2">
          <Link
            href="/dashboard"
            onClick={() => setMobileOpen(false)}
            className="flex items-center gap-3 group"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shadow-inner group-hover:scale-105 transition-transform shrink-0">
              <Gauge className="h-4 w-4" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-base font-bold tracking-tight text-white group-hover:text-emerald-400 transition-colors leading-tight">
                  Vehiclix
                </span>
                <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              </div>
              <span className="text-[10px] font-medium text-slate-400 leading-none mt-0.5 tracking-normal">
                Vehicle & Fuel Intelligence
              </span>
            </div>
          </Link>

          {/* Close button on mobile */}
          <button
            onClick={() => setMobileOpen(false)}
            className="md:hidden rounded-[8px] p-1.5 text-slate-400 hover:bg-slate-900 hover:text-white transition-colors"
            aria-label="Close sidebar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Main Navigation */}
        <div className="space-y-1">
          <div className="px-2.5 pb-1.5 text-[10px] font-bold tracking-wider text-slate-500 uppercase">
            Vehicle Operations
          </div>
          {mainNavItems.map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`group flex items-center justify-between px-3 py-2 rounded-[10px] text-sm font-medium transition-all ${
                  active
                    ? 'bg-white/[0.08] text-emerald-400 border border-emerald-500/20 shadow-sm font-semibold'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-white/[0.04] border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon
                    className={`h-4 w-4 transition-transform group-hover:scale-105 ${
                      active ? 'text-emerald-400' : 'text-slate-400 group-hover:text-slate-200'
                    }`}
                  />
                  <span>{item.name}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-[6px] font-semibold tracking-wide ${
                      active
                        ? 'bg-emerald-500/15 text-emerald-300'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        {/* Tools Section */}
        <div className="space-y-1 pt-3 border-t border-white/[0.06]">
          <div className="px-2.5 pb-1.5 text-[10px] font-bold tracking-wider text-slate-500 uppercase">
            Tools & Utilities
          </div>
          {secondaryNavItems.map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`group flex items-center gap-2.5 px-3 py-2 rounded-[10px] text-sm font-medium transition-all ${
                  active
                    ? 'bg-white/[0.08] text-emerald-400 border border-emerald-500/20 font-semibold'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-white/[0.04] border border-transparent'
                }`}
              >
                <Icon className="h-4 w-4 text-slate-400 group-hover:text-slate-200" />
                <span>{item.name}</span>
              </Link>
            );
          })}

          {user?.appRole === 'admin' && (
            <Link
              href="/admin"
              onClick={() => setMobileOpen(false)}
              className={`group flex items-center justify-between px-3 py-2 rounded-[10px] text-sm font-medium transition-all ${
                isActive('/admin')
                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20 font-semibold'
                  : 'text-amber-400/80 hover:text-amber-300 hover:bg-amber-500/5 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Shield className="h-4 w-4 text-amber-400" />
                <span>Admin Console</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-[6px] font-semibold bg-amber-500/15 text-amber-300">
                Staff
              </span>
            </Link>
          )}
        </div>
      </div>

      {/* User Account Footer Card */}
      <div className="pt-3 border-t border-white/[0.06] space-y-2">
        <div className="p-2.5 rounded-[14px] bg-slate-900/50 border border-white/[0.06]">
          <Link
            href="/profile"
            onClick={() => setMobileOpen(false)}
            className="flex items-center justify-between group"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              {/* Concentric avatar: 14px parent - 3px padding = ~8px inner */}
              <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] border border-white/[0.08] text-xs font-bold uppercase ${
                user?.appRole === 'admin' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-slate-800 text-emerald-400'
              }`}>
                {user?.appRole === 'admin' ? 'A' : (user?.email ? user.email.charAt(0) : 'U')}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-white truncate group-hover:text-emerald-400 transition-colors">
                  {user?.appRole === 'admin' ? 'Administrator' : (user?.email?.split('@')[0] || 'User Profile')}
                </p>
                <p className="text-[11px] text-slate-500 truncate">
                  {user?.appRole === 'admin' ? 'System Administrator' : 'Member'}
                </p>
              </div>
            </div>
            <ChevronRight className="h-3.5 w-3.5 text-slate-500 group-hover:text-emerald-400 transition-transform group-hover:translate-x-0.5 shrink-0" />
          </Link>
        </div>

        <button
          onClick={() => {
            setMobileOpen(false);
            logout();
          }}
          className="w-full flex items-center justify-center gap-2 px-3 py-1.5 rounded-[8px] text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all cursor-pointer"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* 1. Desktop Persistent Sidebar */}
      <aside className="hidden md:flex flex-col w-64 fixed inset-y-0 left-0 z-40 bg-slate-950/90 border-r border-white/[0.08] backdrop-blur-2xl">
        <NavContent />
      </aside>

      {/* 2. Mobile Drawer & Backdrop */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-50 bg-black/70 backdrop-blur-sm transition-opacity duration-300"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={`md:hidden fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] bg-slate-950/95 border-r border-white/[0.1] rounded-r-[22px] shadow-2xl transition-transform duration-300 ease-in-out ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <NavContent />
      </aside>
    </>
  );
}
