'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import {
  Gauge,
  Calculator,
  HelpCircle,
  LayoutDashboard,
  LogIn,
  LogOut,
  Menu,
  X,
  ChevronRight,
  ArrowRight,
  ArrowLeft,
  Compass,
  Car,
  Fuel,
  Wrench,
  User,
  Shield,
  DollarSign,
} from 'lucide-react';
import { useHeader } from '../context/HeaderContext';

interface NavbarProps {
  isAppRoute?: boolean;
  onOpenSidebar?: () => void;
}

export function Navbar({ isAppRoute = false, onOpenSidebar }: NavbarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { headerConfig } = useHeader();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isCompact, setIsCompact] = useState(false);

  // Instagram/Safari scroll-driven dynamic size listener for responsive mode
  useEffect(() => {
    let lastScrollY = window.scrollY;
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;
          const diff = currentScrollY - lastScrollY;

          // Instagram style:
          // When scrolling down past 35px -> shrink into compact mini-capsule
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

  // Automatic module details resolution based on route
  const getModuleInfo = () => {
    if (pathname.startsWith('/trips/calculator')) {
      return {
        title: 'Trip Calculator',
        section: 'Trips',
        icon: Calculator,
        backHref: '/trips',
        backText: 'Back to Trips',
      };
    }
    if (pathname.startsWith('/trips/new')) {
      return {
        title: 'Plan Expedition',
        section: 'Trips',
        icon: Compass,
        backHref: '/trips',
        backText: 'Back to Expeditions',
      };
    }
    if (pathname.match(/^\/trips\/[^/]+\/edit/)) {
      return {
        title: 'Edit Expedition',
        section: 'Trips',
        icon: Compass,
        backHref: '/trips',
        backText: 'Back to Expeditions',
      };
    }
    if (pathname.match(/^\/trips\/[^/]+\/split/)) {
      return {
        title: 'Trip Expense Split',
        section: 'Trips',
        icon: DollarSign,
        backHref: '/trips',
        backText: 'Back to Trips',
      };
    }
    if (pathname.startsWith('/trips')) {
      return {
        title: 'Trips & Equal Split',
        section: 'Vehiclix',
        icon: Compass,
      };
    }
    if (pathname.startsWith('/garage')) {
      return {
        title: 'Garage Management',
        section: 'Vehiclix',
        icon: Car,
      };
    }
    if (pathname.startsWith('/fuel')) {
      return {
        title: 'Fuel & EV Energy',
        section: 'Vehiclix',
        icon: Fuel,
      };
    }
    if (pathname.startsWith('/services') || pathname.startsWith('/maintenance')) {
      return {
        title: 'Maintenance & Reminders',
        section: 'Vehiclix',
        icon: Wrench,
      };
    }
    if (pathname.startsWith('/profile')) {
      return {
        title: 'Account Profile',
        section: 'Vehiclix',
        icon: User,
      };
    }
    if (pathname.startsWith('/admin')) {
      return {
        title: 'Admin Operations',
        section: 'Vehiclix',
        icon: Shield,
      };
    }
    if (pathname.startsWith('/dashboard')) {
      return {
        title: 'Fleet Dashboard',
        section: 'Vehiclix',
        icon: LayoutDashboard,
      };
    }
    return {
      title: 'Vehiclix',
      section: 'Vehiclix',
      icon: Gauge,
    };
  };

  const moduleInfo = getModuleInfo();
  const currentTitle = headerConfig?.title || moduleInfo.title;
  const currentSection = headerConfig?.section || moduleInfo.section;
  const CurrentIcon = headerConfig?.icon || moduleInfo.icon;
  const backHref = headerConfig?.backHref !== undefined ? headerConfig.backHref : moduleInfo.backHref;
  const backText = headerConfig?.backText || moduleInfo.backText;

  // If in App Route (Dashboard, Garage, Fuel, Trips, etc.)
  if (isAppRoute) {
    return (
      <div
        className={`sticky top-0 md:top-0 z-30 w-full md:pl-64 transition-all duration-300 pointer-events-none ${
          isCompact ? 'pt-1.5 px-3' : 'pt-2.5 px-3 sm:pt-3'
        } md:px-0 md:pt-0`}
      >
        <header
          className={`mx-auto transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] pointer-events-auto ${
            isCompact
              ? 'max-w-[360px] sm:max-w-[440px] md:max-w-none rounded-full border border-white/[0.16] bg-slate-950/75 backdrop-blur-3xl shadow-[0_12px_36px_rgba(0,0,0,0.65),inset_0_1px_0_0_rgba(255,255,255,0.22)] md:rounded-none md:border-b md:border-t-0 md:border-x-0 md:border-white/[0.08] md:bg-slate-950/80 md:shadow-none'
              : 'max-w-[500px] sm:max-w-[580px] md:max-w-none rounded-full md:rounded-none border border-white/[0.13] md:border-b md:border-t-0 md:border-x-0 md:border-white/[0.08] bg-slate-950/80 md:bg-slate-950/80 backdrop-blur-3xl shadow-[0_8px_30px_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.18)] md:shadow-none'
          }`}
        >
          <div
            className={`flex items-center justify-between transition-all duration-300 ${
              isCompact
                ? 'h-11 sm:h-12 px-3 sm:px-4 md:h-16 md:px-8'
                : 'h-14 sm:h-15 md:h-16 px-3.5 sm:px-5 md:px-8'
            }`}
          >
            {/* Left: Dynamic Navigation & Context Breadcrumb */}
            <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
              {backHref ? (
                <Link
                  href={backHref}
                  className={`flex items-center justify-center rounded-full bg-white/[0.08] hover:bg-white/[0.14] border border-white/[0.1] text-slate-200 transition-all active:scale-95 cursor-pointer shadow-sm shrink-0 ${
                    isCompact ? 'h-7.5 w-7.5' : 'h-8.5 w-8.5'
                  }`}
                  title={backText || 'Back'}
                  aria-label={backText || 'Back'}
                >
                  <ArrowLeft className={isCompact ? 'h-3.5 w-3.5' : 'h-4 w-4'} />
                </Link>
              ) : (
                <button
                  onClick={onOpenSidebar}
                  className={`md:hidden flex items-center justify-center rounded-full bg-white/[0.08] hover:bg-white/[0.14] border border-white/[0.1] text-slate-200 transition-all active:scale-95 cursor-pointer shadow-sm shrink-0 ${
                    isCompact ? 'h-7.5 w-7.5' : 'h-8.5 w-8.5'
                  }`}
                  aria-label="Open sidebar navigation"
                >
                  <Menu className={isCompact ? 'h-3.5 w-3.5' : 'h-4 w-4'} />
                </button>
              )}

              <div className="flex items-center gap-2 min-w-0">
                {/* Dynamic module/page icon badge */}
                <div
                  className={`flex items-center justify-center rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 shrink-0 shadow-[0_0_12px_rgba(16,185,129,0.25)] ${
                    isCompact ? 'h-7 w-7' : 'h-8 w-8'
                  }`}
                >
                  <CurrentIcon className={isCompact ? 'h-3 w-3 shrink-0' : 'h-3.5 w-3.5 shrink-0'} />
                </div>

                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="hidden sm:inline-block text-[11px] font-medium text-slate-400 tracking-wider uppercase shrink-0">
                      {currentSection}
                    </span>
                    <ChevronRight className="hidden sm:inline-block h-2.5 w-2.5 text-slate-600 shrink-0" />
                    <h1
                      className={`font-semibold text-white tracking-tight transition-all truncate ${
                        isCompact ? 'text-xs sm:text-sm' : 'text-sm sm:text-base'
                      }`}
                    >
                      {currentTitle}
                    </h1>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Dynamic actions (e.g. Save & Split) or module defaults */}
            <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
              {headerConfig?.actions ? (
                headerConfig.actions
              ) : (
                <>
                  {!pathname.startsWith('/trips/calculator') && (
                    <Link
                      href="/trips/calculator"
                      className={`flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.05] text-xs font-medium text-slate-300 hover:bg-white/[0.1] hover:text-white transition-all shadow-sm ${
                        isCompact ? 'px-2 py-1' : 'px-2.5 sm:px-3 py-1.5'
                      }`}
                      title="Trip Calculator"
                    >
                      <Calculator className={isCompact ? 'h-3 w-3 text-emerald-400 shrink-0' : 'h-3.5 w-3.5 text-emerald-400 shrink-0'} />
                      <span className={isCompact ? 'hidden' : 'hidden sm:inline'}>Calculator</span>
                    </Link>
                  )}

                  <Link
                    href="/help"
                    className="hidden lg:flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors"
                  >
                    <HelpCircle className="h-3.5 w-3.5 shrink-0" />
                    <span>Help</span>
                  </Link>
                </>
              )}
            </div>
          </div>
        </header>
      </div>
    );
  }

  // Floating Header on Landing & Public Pages (Apple capsule geometry & clean responsive layout)
  return (
    <div className="sticky top-3 sm:top-5 z-50 w-full px-3 sm:px-6 pointer-events-none">
      <header className="mx-auto max-w-6xl rounded-full border border-white/[0.08] bg-slate-950/85 backdrop-blur-2xl px-3 sm:px-6 py-2 sm:py-2.5 flex items-center justify-between shadow-[0_4px_24px_rgba(0,0,0,0.5)] pointer-events-auto transition-all">
        {/* Brand: Logo + App Name + Slogan below app name */}
        <Link href="/" className="flex items-center gap-2 sm:gap-3 group shrink-0 min-w-0">
          <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shadow-inner group-hover:scale-105 transition-transform shrink-0">
            <Gauge className="h-4 w-4 sm:h-5 sm:w-5" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-sm sm:text-base font-bold text-white tracking-tight leading-tight group-hover:text-emerald-400 transition-colors">
              Vehiclix
            </span>
            <span className="text-[9px] sm:text-[11px] text-slate-400 font-medium tracking-normal leading-none mt-0.5 max-w-[140px] sm:max-w-none truncate sm:overflow-visible">
              Vehicle & Fuel Intelligence
            </span>
          </div>
        </Link>

        {/* Center Desktop Links (Home, Features, About, Trip calculator, Download) */}
        <nav className="hidden md:flex items-center gap-6 lg:gap-7 text-sm font-medium text-slate-300">
          <Link href="/" className="hover:text-white transition-colors">
            Home
          </Link>
          <Link href="/#features" className="hover:text-white transition-colors">
            Features
          </Link>
          <Link href="/help" className="hover:text-white transition-colors">
            About
          </Link>
          <Link href="/calculator" className="hover:text-white transition-colors">
            Trip calculator
          </Link>
          <Link href="/#download" className="hover:text-white transition-colors">
            Download
          </Link>
        </nav>

        {/* Auth CTA & Mobile Toggle */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {user ? (
            <div className="flex items-center gap-2 sm:gap-2.5">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-3.5 sm:px-5 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold shadow-[0_1px_2px_rgba(0,0,0,0.3),0_2px_8px_rgba(16,185,129,0.3)] transition-all active:scale-95"
              >
                <span>Dashboard</span>
                <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </Link>
              {/* Desktop-only sign out in floating header */}
              <button
                onClick={() => logout()}
                className="hidden sm:flex items-center gap-1 rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-500/20 transition-colors cursor-pointer"
                title="Sign Out"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center">
              {/* Desktop Sign in Link */}
              <Link
                href="/login"
                className="hidden sm:inline-block text-sm font-medium text-slate-300 hover:text-white transition-colors mr-3 sm:mr-5 px-1 py-1"
              >
                Sign in
              </Link>

              {/* Get started button */}
              <Link
                href="/register"
                className="inline-flex items-center gap-1 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-3.5 sm:px-5 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold shadow-[0_1px_2px_rgba(0,0,0,0.3),0_2px_8px_rgba(16,185,129,0.3)] transition-all active:scale-95"
              >
                <span>Get started</span>
                <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </Link>
            </div>
          )}

          {/* Mobile Menu Hamburger Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 border border-white/[0.08] text-slate-300 hover:text-white hover:bg-slate-800 transition-colors ml-0.5"
            aria-label="Toggle mobile menu"
          >
            {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </header>

      {/* Floating Mobile Dropdown Menu (Concentric 18px outer -> 10px inner items) */}
      {mobileMenuOpen && (
        <div className="md:hidden mt-2 mx-auto max-w-6xl rounded-[18px] border border-white/[0.09] bg-slate-950/95 backdrop-blur-2xl p-3.5 shadow-2xl shadow-black/80 pointer-events-auto transition-all animate-in fade-in slide-in-from-top-2">
          <div className="space-y-1">
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center px-3 py-2 text-sm font-medium text-slate-200 hover:bg-white/[0.06] rounded-[10px] transition-colors"
            >
              Home
            </Link>
            <Link
              href="/#features"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center px-3 py-2 text-sm font-medium text-slate-200 hover:bg-white/[0.06] rounded-[10px] transition-colors"
            >
              Features
            </Link>
            <Link
              href="/help"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center px-3 py-2 text-sm font-medium text-slate-200 hover:bg-white/[0.06] rounded-[10px] transition-colors"
            >
              About & Help
            </Link>
            <Link
              href="/calculator"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between px-3 py-2 text-sm font-medium text-slate-200 hover:bg-white/[0.06] rounded-[10px] transition-colors"
            >
              <span>Trip calculator</span>
              <span className="text-[10px] px-2 py-0.5 rounded-[6px] bg-emerald-500/15 text-emerald-400 font-semibold border border-emerald-500/20">Free</span>
            </Link>
            <Link
              href="/#download"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center px-3 py-2 text-sm font-medium text-slate-200 hover:bg-white/[0.06] rounded-[10px] transition-colors"
            >
              Download Mobile App
            </Link>

            {user ? (
              <div className="pt-2.5 mt-2 border-t border-white/[0.08] flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 px-2 min-w-0">
                  <div className={`h-2 w-2 rounded-full shrink-0 ${user.appRole === 'admin' ? 'bg-amber-400' : 'bg-emerald-400'}`} />
                  <span className="text-xs text-slate-300 truncate font-medium">
                    {user.appRole === 'admin' ? 'Administrator' : user.email}
                  </span>
                </div>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    logout();
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-xs font-medium text-rose-400 hover:bg-rose-500/10 border border-rose-500/20 transition-all shrink-0 cursor-pointer"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            ) : (
              <div className="pt-2 mt-2 border-t border-white/[0.08] flex items-center justify-between gap-2.5">
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex-1 text-center py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-900 border border-white/[0.08] rounded-[10px]"
                >
                  Sign in
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex-1 text-center py-2 text-xs font-semibold text-slate-950 bg-emerald-500 hover:bg-emerald-400 rounded-[10px] shadow-sm"
                >
                  Get started free
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
