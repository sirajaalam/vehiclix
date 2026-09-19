'use client';

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { MobileBottomNav } from './MobileBottomNav';
import { Footer } from './Footer';

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading } = useAuth();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Close mobile sidebar automatically on navigation
  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [pathname]);

  const isAppRoute =
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/garage') ||
    pathname.startsWith('/fuel') ||
    pathname.startsWith('/services') ||
    pathname.startsWith('/trips') ||
    pathname.startsWith('/profile') ||
    pathname.startsWith('/admin');

  // Route protection for Fleet App routes
  useEffect(() => {
    if (!loading && !user && isAppRoute) {
      router.replace('/login');
    }
  }, [loading, user, isAppRoute, router]);

  if (isAppRoute && loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-400">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
          <p className="text-xs text-slate-500">Checking authentication...</p>
        </div>
      </div>
    );
  }

  if (isAppRoute && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-400">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
          <p className="text-xs text-slate-500">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      {/* Top Navigation Bar */}
      <Navbar
        isAppRoute={isAppRoute}
        onOpenSidebar={() => setMobileSidebarOpen(true)}
      />

      {isAppRoute ? (
        <div className="flex flex-1 relative">
          {/* Left Sidebar (Desktop Fixed + Mobile Slide Drawer) */}
          <Sidebar
            mobileOpen={mobileSidebarOpen}
            setMobileOpen={setMobileSidebarOpen}
          />

          {/* Main App Content Area shifted by md:pl-64 on desktop */}
          <div className="flex-1 md:pl-64 flex flex-col min-w-0">
            <main className="flex-1 pb-28 md:pb-12">{children}</main>
          </div>

          {/* Mobile Bottom Navigation Bar (Hidden on desktop) */}
          <MobileBottomNav onOpenMenu={() => setMobileSidebarOpen(true)} />
        </div>
      ) : (
        <>
          <main className="flex-1">{children}</main>
          <Footer />
        </>
      )}
    </div>
  );
}
