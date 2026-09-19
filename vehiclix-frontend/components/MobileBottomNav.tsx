'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
      className="md:hidden fixed z-40 left-0 right-0 mx-auto w-[calc(100%-32px)] max-w-[356px] bottom-[max(0.75rem,env(safe-area-inset-bottom,0.75rem))] rounded-full border border-white/[0.12] bg-slate-950/85 backdrop-blur-2xl supports-[backdrop-filter]:bg-slate-950/80 px-2 py-1.5 shadow-[0_10px_32px_rgba(0,0,0,0.65),inset_0_1px_0_0_rgba(255,255,255,0.14)]"
    >
      <div className="flex items-center justify-between">
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
              className={`flex-1 flex flex-col items-center justify-center py-0.5 rounded-full transition-colors duration-150 ${
                isActive
                  ? 'text-emerald-400 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div
                className={`flex items-center justify-center rounded-full transition-colors ${
                  isActive ? 'bg-emerald-500/15 text-emerald-400 px-2.5 py-1' : 'p-1'
                }`}
              >
                <Icon className="h-[18px] w-[18px]" strokeWidth={isActive ? 2.2 : 1.8} />
              </div>
              <span className="text-[9.5px] tracking-tight mt-0.5 font-medium leading-none">
                {item.name}
              </span>
            </Link>
          );
        })}

        <button
          type="button"
          onClick={onOpenMenu}
          className="flex-1 flex flex-col items-center justify-center py-0.5 rounded-full text-slate-400 hover:text-slate-200 transition-colors duration-150"
          aria-label="Open navigation menu"
        >
          <div className="flex items-center justify-center rounded-full p-1">
            <Menu className="h-[18px] w-[18px]" strokeWidth={1.8} />
          </div>
          <span className="text-[9.5px] tracking-tight mt-0.5 font-medium leading-none">
            More
          </span>
        </button>
      </div>
    </nav>
  );
}
