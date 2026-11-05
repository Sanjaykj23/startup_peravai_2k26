import type { Metadata } from 'next';
import './globals.css';
import Link from 'next/link';
import { Bus, Map, Users, ShieldAlert, BarChart3, Radio } from 'lucide-react';

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
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="min-h-screen flex flex-col bg-slate-950 text-slate-100 antialiased" suppressHydrationWarning>
        {/* Navigation Bar */}
        <header className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-slate-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-black group-hover:scale-105 transition-transform">
                <Bus className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-sm sm:text-base tracking-tight text-white">
                    CHENNAI <span className="text-amber-400">SMART BUS</span>
                  </span>
                  <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    <Radio className="w-2.5 h-2.5 animate-pulse text-emerald-400" />
                    LIVE
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 hidden sm:block">
                  Metropolitan Transport Corporation (MTC) Chennai
                </p>
              </div>
            </Link>

            {/* Navigation links */}
            <nav className="flex items-center gap-1 sm:gap-2">
              <Link
                href="/map"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <Map className="w-4 h-4 text-emerald-400" />
                <span className="hidden md:inline">Live</span> Map
              </Link>
              <Link
                href="/passenger"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <Users className="w-4 h-4 text-blue-400" />
                Passenger
              </Link>
              <Link
                href="/conductor"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <Bus className="w-4 h-4 text-amber-400" />
                Conductor
              </Link>
              <Link
                href="/admin"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <BarChart3 className="w-4 h-4 text-purple-400" />
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
        <footer className="bg-slate-950 border-t border-slate-900 py-6 text-xs text-slate-500">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>Chennai MTC GTFS Normalized Engine &bull; Phase 1 Platform</span>
            </div>
            <div>
              <span>Vidiyal Payanam Scheme Free Female Commute Supported</span>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
