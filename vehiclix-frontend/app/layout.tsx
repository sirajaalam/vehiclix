import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '../context/AuthContext';
import { AppShell } from '../components/AppShell';

export const metadata: Metadata = {
  title: 'Vehiclix — Vehicle & Fuel Intelligence',
  description: 'Production-ready platform for garage management, fuel & EV logging, maintenance tracking, and deterministic trip splitting.',
};

import { Toaster } from 'sonner';
import { Syne, DM_Sans } from 'next/font/google';

const syne = Syne({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-body',
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`dark h-full ${syne.variable} ${dmSans.variable}`}>
      <body className="flex min-h-full flex-col bg-slate-950 text-slate-100 antialiased selection:bg-emerald-500/30 selection:text-emerald-300">
        <AuthProvider>
          <AppShell>{children}</AppShell>
        </AuthProvider>
        <Toaster
          richColors
          position="top-right"
          theme="dark"
          closeButton
          toastOptions={{
            className: '!border !border-white/[0.1] !bg-slate-900/95 !backdrop-blur-xl !shadow-lg',
          }}
        />
      </body>
    </html>
  );
}
