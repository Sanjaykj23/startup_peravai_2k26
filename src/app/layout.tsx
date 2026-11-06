import type { Metadata } from 'next';
import './globals.css';
import Link from 'next/link';
import { Bus, Map, Users, ShieldAlert, BarChart3, Radio, GraduationCap, Scale } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Chennai Smart Bus Crowd Tracking System | MTC Chennai',
  description: 'Simulates the Chennai MTC bus ecosystem with live crowd tracking, GPS updates, and conductor ticketing.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen flex flex-col bg-slate-50 text-slate-900 antialiased" suppressHydrationWarning>
        {/* Navigation Bar */}
        <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-700 to-indigo-800 border border-blue-600 flex items-center justify-center text-amber-300 font-black shadow-sm group-hover:scale-105 transition-transform">
                <Bus className="w-5 h-5 text-amber-300" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-sm sm:text-base tracking-tight text-slate-900">
                    CHENNAI <span className="text-blue-700">ONE</span> <span className="text-amber-500 font-bold">BUS</span>
                  </span>
                  <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
                    <Radio className="w-2.5 h-2.5 animate-pulse text-emerald-600" />
                    LIVE GTFS
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 hidden sm:block font-medium">
                  Metropolitan Transport Corporation &bull; Greater Chennai Smart Mobility
                </p>
              </div>
            </Link>

            {/* Navigation links */}
            <nav className="flex items-center gap-1 sm:gap-2">
              <Link
                href="/map"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-blue-700 hover:bg-blue-50/70 transition-colors"
              >
                <Map className="w-4 h-4 text-blue-600" />
                <span className="hidden md:inline">Live</span> Map
              </Link>
              <Link
                href="/passenger"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-blue-700 hover:bg-blue-50/70 transition-colors"
              >
                <Users className="w-4 h-4 text-indigo-600" />
                Passenger
              </Link>
              <Link
                href="/conductor"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-blue-700 hover:bg-blue-50/70 transition-colors"
              >
                <Bus className="w-4 h-4 text-amber-600" />
                Conductor
              </Link>
              <Link
                href="/demand-supply"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-blue-700 hover:bg-blue-50/70 transition-colors"
              >
                <Scale className="w-4 h-4 text-blue-700" />
                <span className="hidden lg:inline">Demand &amp; Supply</span>
                <span className="lg:hidden">D&amp;S</span>
              </Link>
              <Link
                href="/admin"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-blue-700 hover:bg-blue-50/70 transition-colors"
              >
                <BarChart3 className="w-4 h-4 text-purple-600" />
                Admin
              </Link>
            </nav>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1">
          {children}
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-slate-200 py-6 text-xs text-slate-500 shadow-xs">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span className="font-medium text-slate-700">Chennai MTC GTFS Normalized Engine &bull; Chennai One Transit Portal</span>
            </div>
            <div>
              <span className="text-slate-600 font-medium">Vidiyal Payanam Scheme &bull; 100% Free Female Commute Enabled</span>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
