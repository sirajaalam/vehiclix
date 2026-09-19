'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { LayoutDashboard, Car, Fuel, Compass, Menu } from 'lucide-react';

interface MobileBottomNavProps {
  onOpenMenu: () => void;
}

export function MobileBottomNav({ onOpenMenu }: MobileBottomNavProps) {
  const pathname = usePathname();

  const items = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Garage', href: '/garage', icon: Car },
    { name: 'Fuel', href: '/fuel', icon: Fuel },
    { name: 'Trips', href: '/trips', icon: Compass },
  ];

  return (
    <nav
      aria-label="Mobile navigation"
      className="md:hidden fixed z-40 left-0 right-0 mx-auto w-[calc(100%-28px)] max-w-[360px] bottom-[max(0.75rem,env(safe-area-inset-bottom,0.75rem))] rounded-full border border-white/[0.14] bg-slate-950/45 backdrop-blur-2xl supports-[backdrop-filter]:bg-slate-950/40 p-1.5 shadow-[0_12px_36px_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.18)]"
    >
      <div className="flex items-center justify-between gap-1 relative">
        {items.map((item) => {
          const isActive =
            item.href === '/dashboard'
              ? pathname === '/dashboard'
              : pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex-1 flex flex-col items-center justify-center py-1.5 px-1 rounded-full transition-colors duration-200 z-10 ${
                isActive ? 'text-emerald-300' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {/* Apple iOS Spring-Sliding Pill Indicator */}
              {isActive && (
                <motion.div
                  layoutId="active-nav-pill"
                  className="absolute inset-0 rounded-full bg-emerald-500/[0.15] border border-emerald-500/30 shadow-[inset_0_1px_0_0_rgba(52,211,153,0.25),0_2px_10px_rgba(16,185,129,0.18)] -z-10"
                  transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                />
              )}
              <Icon
                className={`h-[18px] w-[18px] transition-transform duration-200 ${isActive ? 'scale-105 text-emerald-400' : ''}`}
                strokeWidth={isActive ? 2.2 : 1.75}
              />
              <span
                className={`text-[9.5px] tracking-tight mt-0.5 leading-none transition-colors ${
                  isActive ? 'font-semibold text-emerald-300' : 'font-medium text-slate-400'
                }`}
              >
                {item.name}
              </span>
            </Link>
          );
        })}

        <button
          type="button"
          onClick={onOpenMenu}
          className="relative flex-1 flex flex-col items-center justify-center py-1.5 px-1 rounded-full text-slate-400 hover:text-slate-200 active:scale-95 transition-all duration-150"
          aria-label="Open navigation menu"
        >
          <Menu className="h-[18px] w-[18px]" strokeWidth={1.75} />
          <span className="text-[9.5px] tracking-tight mt-0.5 font-medium leading-none text-slate-400">
            More
          </span>
        </button>
      </div>
    </nav>
  );
}
