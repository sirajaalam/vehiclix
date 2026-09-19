'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Car, Fuel, Compass, Menu } from 'lucide-react';

interface MobileBottomNavProps {
  onOpenMenu: () => void;
}

export function MobileBottomNav({ onOpenMenu }: MobileBottomNavProps) {
  const pathname = usePathname();
  const [isCompact, setIsCompact] = useState(false);

  // Instagram/Safari scroll-driven dynamic size listener
  useEffect(() => {
    let lastScrollY = window.scrollY;
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;
          const diff = currentScrollY - lastScrollY;

          // Instagram style:
          // When scrolling down past 35px -> shrink into compact dock
          // When scrolling up (diff < -5) or back near top (<= 25px) -> restore actual full size
          if (currentScrollY > 35 && diff > 2) {
            setIsCompact(true);
          } else if (diff < -5 || currentScrollY <= 25) {
            setIsCompact(false);
          }

          lastScrollY = currentScrollY;
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const items = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Garage', href: '/garage', icon: Car },
    { name: 'Fuel', href: '/fuel', icon: Fuel },
    { name: 'Trips', href: '/trips', icon: Compass },
  ];

  return (
    <div
      className={`md:hidden fixed z-40 left-0 right-0 mx-auto transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] safe-area-inset-bottom ${
        isCompact
          ? 'bottom-2.5 max-w-[310px] rounded-full border border-white/[0.16] bg-slate-950/80 backdrop-blur-3xl px-2 py-1 shadow-[0_12px_40px_rgba(0,0,0,0.8),inset_0_1px_0_0_rgba(255,255,255,0.22)] scale-[0.98]'
          : 'bottom-3 sm:bottom-4 max-w-md rounded-full border border-white/[0.13] bg-slate-950/85 backdrop-blur-3xl px-3 py-1.5 shadow-[0_12px_36px_rgba(0,0,0,0.7),inset_0_1px_0_0_rgba(255,255,255,0.18)] scale-100'
      } flex items-center justify-around`}
    >
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
            className={`flex flex-col items-center justify-center rounded-full transition-all duration-200 ${
              isCompact ? 'py-0.5 px-2' : 'py-1 px-2.5'
            } ${
              isActive
                ? 'text-emerald-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <div
              className={`rounded-full transition-all ${
                isCompact ? 'p-1' : 'p-1.5'
              } ${
                isActive
                  ? 'bg-emerald-500/20 text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.35)] scale-105'
                  : 'hover:bg-white/[0.06]'
              }`}
            >
              <Icon className={isCompact ? 'h-4 w-4' : 'h-5 w-5'} />
            </div>
            {!isCompact && <span className="text-[10px] mt-0.5 font-medium leading-tight">{item.name}</span>}
          </Link>
        );
      })}

      <button
        onClick={onOpenMenu}
        className={`flex flex-col items-center justify-center rounded-full text-slate-400 hover:text-slate-200 transition-all duration-200 ${
          isCompact ? 'py-0.5 px-2' : 'py-1 px-2.5'
        }`}
        aria-label="Open navigation menu"
      >
        <div className={`rounded-full hover:bg-white/[0.06] transition-all ${isCompact ? 'p-1' : 'p-1.5'}`}>
          <Menu className={isCompact ? 'h-4 w-4' : 'h-5 w-5'} />
        </div>
        {!isCompact && <span className="text-[10px] mt-0.5 font-medium leading-tight">More</span>}
      </button>
    </div>
  );
}

