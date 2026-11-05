'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Bus,
  MapPin,
  Users,
  Navigation,
  ShieldCheck,
  BarChart3,
  Radio,
  ArrowRight,
  Database,
  Cpu,
  Clock,
  Sparkles
} from 'lucide-react';
import { Bus as BusType } from '@/types';

export default function HomePage() {
  const [buses, setBuses] = useState<BusType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/buses')
      .then(res => res.json())
      .then(data => {
        if (data.buses) setBuses(data.buses);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const activeBuses = buses.filter(b => b.status === 'active');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-blue-950/40 to-slate-900 border border-slate-800 p-8 sm:p-12 shadow-2xl">
        <div className="relative z-10 max-w-3xl space-y-5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold tracking-wide uppercase">
            <Radio className="w-3.5 h-3.5 animate-pulse text-emerald-400" />
            Phase 1 &bull; Live Chennai MTC Ecosystem
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
            Chennai Smart Bus <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500">
              Crowd Tracking System
            </span>
          </h1>

          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            Real-time occupancy tracking, conductor ticketing with Tamil Nadu Vidiyal Payanam Free Female Pass simulation, periodic GPS broadcasting, and passenger crowd discovery for Chennai MTC buses.
          </p>

          {/* Quick Action Buttons */}
          <div className="pt-2 flex flex-wrap gap-3">
            <Link
              href="/map"
              className="px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm transition-all duration-200 flex items-center gap-2 shadow-lg shadow-amber-500/20"
            >
              <Navigation className="w-4 h-4" />
              Explore Live Map
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/passenger"
              className="px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-sm border border-slate-700 transition-all flex items-center gap-2"
            >
              <Users className="w-4 h-4 text-blue-400" />
              Passenger Portal
            </Link>
            <Link
              href="/conductor"
              className="px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-sm border border-slate-700 transition-all flex items-center gap-2"
            >
              <Bus className="w-4 h-4 text-amber-400" />
              Conductor Terminal
            </Link>
            <Link
              href="/admin"
              className="px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-sm border border-slate-700 transition-all flex items-center gap-2"
            >
              <BarChart3 className="w-4 h-4 text-purple-400" />
              Admin &amp; ML Dataset
            </Link>
          </div>
        </div>

        {/* Ambient decorative glow */}
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-amber-500/10 to-transparent pointer-events-none" />
      </div>

      {/* Real-time Fleet Status Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Active Buses</span>
            <Bus className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-white">{activeBuses.length}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Simulating live trips</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Crowd Engine</span>
            <Cpu className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400">0 - 1 - 2</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Empty &bull; Normal &bull; Crowded</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>GPS Tracking</span>
            <Clock className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-black text-blue-400">30s Interval</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Periodic beacon</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>ML Data Asset</span>
            <Database className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-black text-purple-400">Historical Log</div>
          <div className="text-[11px] text-slate-500 mt-0.5">occupancy_history table</div>
        </div>
      </div>

      {/* Four Core Module Portals */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white tracking-tight">System Portals &amp; Workflows</h2>
          <span className="text-xs text-slate-400">Choose a portal to interact</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Conductor Card */}
          <div className="bg-slate-900/90 border border-slate-800 hover:border-amber-500/50 rounded-2xl p-6 transition-all duration-300 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Bus className="w-6 h-6" />
                </div>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  Conductor Workflow
                </span>
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Conductor Terminal</h3>
              <p className="text-slate-400 text-xs leading-relaxed mb-4">
                Log in with assigned bus accounts (21G, 570, 5E, 102, A70). Execute mandatory 3-step trip initiation: Select Route &amp; Bus &rarr; Select Starting Stop &rarr; START TRIP. Issue tickets with Free Female travel simulation and record passenger board/alight counts.
              </p>
              <div className="space-y-1.5 text-xs text-slate-300 font-mono mb-4 bg-slate-950 p-3 rounded-xl border border-slate-800">
                <div className="text-[11px] text-amber-400 font-bold mb-1">Demo Accounts:</div>
                <div>cnd_570 / password123 (Bus 5701)</div>
                <div>cnd_21g / password123 (Bus 2101)</div>
                <div>cnd_5e / password123 (Bus 0051)</div>
              </div>
            </div>
            <Link
              href="/conductor"
              className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs text-center transition-colors flex items-center justify-center gap-1.5"
            >
              Open Conductor Terminal
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Passenger Card */}
          <div className="bg-slate-900/90 border border-slate-800 hover:border-blue-500/50 rounded-2xl p-6 transition-all duration-300 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
                  <Users className="w-6 h-6" />
                </div>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  Passenger Workflow
                </span>
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Passenger Portal</h3>
              <p className="text-slate-400 text-xs leading-relaxed mb-4">
                Log in via Mobile Number OTP. Discover nearby buses within a configurable GPS radius (default 5 KM). Check live crowd levels (Green/Yellow/Red) and book tickets with Razorpay or Cash simulation.
              </p>
              <div className="space-y-1.5 text-xs text-slate-300 font-mono mb-4 bg-slate-950 p-3 rounded-xl border border-slate-800">
                <div className="text-[11px] text-blue-400 font-bold mb-1">Features:</div>
                <div>&bull; Mobile Number OTP (Universal demo code: 1234)</div>
                <div>&bull; Haversine 5 KM Nearby Bus Discovery</div>
                <div>&bull; Razorpay / Cash Checkout Simulation</div>
              </div>
            </div>
            <Link
              href="/passenger"
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs text-center transition-colors flex items-center justify-center gap-1.5"
            >
              Open Passenger Portal
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Live Map Card */}
          <div className="bg-slate-900/90 border border-slate-800 hover:border-emerald-500/50 rounded-2xl p-6 transition-all duration-300 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <MapPin className="w-6 h-6" />
                </div>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Interactive Map
                </span>
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Chennai Live Map</h3>
              <p className="text-slate-400 text-xs leading-relaxed mb-4">
                Full-screen interactive Leaflet &amp; OpenStreetMap dashboard visualizing all active buses in Chennai. Markers change colors dynamically: Green (Empty), Yellow (Normal), and Red (Overcrowded). Clicking any bus opens detailed occupancy stats and route progress.
              </p>
            </div>
            <Link
              href="/map"
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs text-center transition-colors flex items-center justify-center gap-1.5"
            >
              Launch Live Map
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Admin & ML Analytics Card */}
          <div className="bg-slate-900/90 border border-slate-800 hover:border-purple-500/50 rounded-2xl p-6 transition-all duration-300 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
                  <BarChart3 className="w-6 h-6" />
                </div>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  Central Operations &amp; ML
                </span>
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Admin Dashboard &amp; ML Training Data</h3>
              <p className="text-slate-400 text-xs leading-relaxed mb-4">
                Real-time fleet monitoring, crowd distribution analytics, ticket revenue audit, and the continuous <code className="text-purple-300 font-mono">occupancy_history</code> table that persists every occupancy shift to build future ML crowd prediction models.
              </p>
            </div>
            <Link
              href="/admin"
              className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs text-center transition-colors flex items-center justify-center gap-1.5"
            >
              Open Admin Dashboard
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
