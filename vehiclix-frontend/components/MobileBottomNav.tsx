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
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 w-full border-t border-white/[0.08] bg-slate-950/85 backdrop-blur-xl supports-[backdrop-filter]:bg-slate-950/80 pt-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom,0px))] transition-colors"
    >
      <div className="grid grid-cols-5 items-center max-w-md mx-auto px-1">
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
              className={`flex flex-col items-center justify-center py-1 transition-colors duration-150 ${
                isActive
                  ? 'text-emerald-400 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="relative flex items-center justify-center">
                <Icon className="h-5 w-5 transition-transform duration-150" strokeWidth={isActive ? 2.2 : 1.75} />
              </div>
              <span className="text-[10px] tracking-tight mt-1 font-medium leading-none">
                {item.name}
              </span>
            </Link>
          );
        })}

        <button
          type="button"
          onClick={onOpenMenu}
          className="flex flex-col items-center justify-center py-1 text-slate-400 hover:text-slate-200 transition-colors duration-150"
          aria-label="Open navigation menu"
        >
          <div className="relative flex items-center justify-center">
            <Menu className="h-5 w-5" strokeWidth={1.75} />
          </div>
          <span className="text-[10px] tracking-tight mt-1 font-medium leading-none">
            More
          </span>
        </button>
      </div>
    </nav>
  );
}
