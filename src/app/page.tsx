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
  Sparkles,
  GraduationCap
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
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 border border-blue-800 p-8 sm:p-12 shadow-xl text-white">
        <div className="relative z-10 max-w-3xl space-y-5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-amber-300 text-xs font-bold tracking-wide uppercase backdrop-blur-xs">
            <Radio className="w-3.5 h-3.5 animate-pulse text-emerald-400" />
            Phase 1 &bull; Chennai One Live GTFS Ecosystem
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
            Chennai Smart Bus <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400">
              Crowd &amp; Fleet Transit Portal
            </span>
          </h1>

          <p className="text-blue-100/90 text-sm sm:text-base leading-relaxed">
            Real-time occupancy tracking, conductor ticketing with Tamil Nadu Vidiyal Payanam Free Female Pass simulation, periodic GPS broadcasting, and live commuter discovery for Chennai MTC buses.
          </p>

          {/* Quick Action Buttons */}
          <div className="pt-2 flex flex-wrap gap-3">
            <Link
              href="/map"
              className="px-5 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-sm transition-all duration-200 flex items-center gap-2 shadow-lg shadow-amber-500/20"
            >
              <Navigation className="w-4 h-4" />
              Explore Live Map
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/passenger"
              className="px-5 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-sm border border-white/20 transition-all flex items-center gap-2 backdrop-blur-xs"
            >
              <Users className="w-4 h-4 text-blue-300" />
              Passenger Portal
            </Link>
            <Link
              href="/conductor"
              className="px-5 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-sm border border-white/20 transition-all flex items-center gap-2 backdrop-blur-xs"
            >
              <Bus className="w-4 h-4 text-amber-300" />
              Conductor Terminal
            </Link>
            <Link
              href="/admin"
              className="px-5 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-sm border border-white/20 transition-all flex items-center gap-2 backdrop-blur-xs"
            >
              <BarChart3 className="w-4 h-4 text-purple-300" />
              Admin &amp; ML Dataset
            </Link>
          </div>
        </div>

        {/* Ambient decorative glow */}
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-amber-400/15 to-transparent pointer-events-none" />
      </div>

      {/* Real-time Fleet Status Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1 font-medium">
            <span>Active Buses</span>
            <Bus className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-slate-900">{activeBuses.length}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Simulating live trips</div>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1 font-medium">
            <span>Crowd Engine</span>
            <Cpu className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-600">0 - 1 - 2</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Empty &bull; Normal &bull; Crowded</div>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1 font-medium">
            <span>GPS Tracking</span>
            <Clock className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-blue-600">30s Interval</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Periodic beacon</div>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1 font-medium">
            <span>ML Data Asset</span>
            <Database className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-black text-purple-600">Historical Log</div>
          <div className="text-[11px] text-slate-400 mt-0.5">occupancy_history table</div>
        </div>
      </div>

      {/* Four Core Module Portals */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Chennai Transit Portals &amp; Workflows</h2>
          <span className="text-xs text-slate-500">Choose a portal to interact</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Student Card */}
          <div className="bg-white border border-slate-200 hover:border-blue-500 hover:shadow-md rounded-2xl p-6 transition-all duration-300 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700 font-bold">
                  <GraduationCap className="w-6 h-6" />
                </div>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  Student Welfare
                </span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Student Digital Portal</h3>
              <p className="text-slate-600 text-xs leading-relaxed mb-4">
                Dedicated digital portal for school and college students under Tamil Nadu Free Bus Pass scheme. Generate digital student smart passes, claim ₹0.00 tickets, and track live college corridor buses.
              </p>
              <div className="space-y-1 text-xs text-slate-700 font-mono mb-4 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div className="text-[11px] text-blue-700 font-bold mb-1">Highlights:</div>
                <div>&bull; 100% Free Concession Commute</div>
                <div>&bull; Digital Smart Card with QR Code</div>
                <div>&bull; Instant ₹0.00 E-Ticket Issuance</div>
              </div>
            </div>
            <Link
              href="/student"
              className="w-full py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs text-center transition-colors flex items-center justify-center gap-1.5 shadow-xs"
            >
              Open Student Portal
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Conductor Card */}
          <div className="bg-white border border-slate-200 hover:border-amber-400 hover:shadow-md rounded-2xl p-6 transition-all duration-300 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 font-bold">
                  <Bus className="w-6 h-6" />
                </div>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                  Conductor Workflow
                </span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Conductor Terminal</h3>
              <p className="text-slate-600 text-xs leading-relaxed mb-4">
                Log in with assigned bus accounts (21G, 570, 5E, 102, A70). Execute trip initiation: Select Route &amp; Bus &rarr; Select Starting Stop &rarr; START TRIP. Issue tickets with Free Female travel simulation and record passenger board/alight counts.
              </p>
              <div className="space-y-1.5 text-xs text-slate-700 font-mono mb-4 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div className="text-[11px] text-amber-700 font-bold mb-1">Demo Accounts:</div>
                <div>cnd_570 / password123 (Bus 5701)</div>
                <div>cnd_21g / password123 (Bus 2101)</div>
                <div>cnd_5e / password123 (Bus 0051)</div>
              </div>
            </div>
            <Link
              href="/conductor"
              className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs text-center transition-colors flex items-center justify-center gap-1.5 shadow-xs"
            >
              Open Conductor Terminal
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Passenger Card */}
          <div className="bg-white border border-slate-200 hover:border-blue-400 hover:shadow-md rounded-2xl p-6 transition-all duration-300 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700 font-bold">
                  <Users className="w-6 h-6" />
                </div>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  Passenger Workflow
                </span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Passenger Portal</h3>
              <p className="text-slate-600 text-xs leading-relaxed mb-4">
                Log in via Mobile Number OTP. Discover nearby buses within a configurable GPS radius (default 5 KM). Check live crowd levels (Green/Yellow/Red) and book tickets with Razorpay or Cash simulation.
              </p>
              <div className="space-y-1.5 text-xs text-slate-700 font-mono mb-4 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div className="text-[11px] text-blue-700 font-bold mb-1">Features:</div>
                <div>&bull; Mobile Number OTP (Universal demo code: 1234)</div>
                <div>&bull; Haversine 5 KM Nearby Bus Discovery</div>
                <div>&bull; Razorpay / Cash Checkout Simulation</div>
              </div>
            </div>
            <Link
              href="/passenger"
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs text-center transition-colors flex items-center justify-center gap-1.5 shadow-xs"
            >
              Open Passenger Portal
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Live Map Card */}
          <div className="bg-white border border-slate-200 hover:border-emerald-400 hover:shadow-md rounded-2xl p-6 transition-all duration-300 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 font-bold">
                  <MapPin className="w-6 h-6" />
                </div>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Interactive Transit Map
                </span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Chennai Live Map</h3>
              <p className="text-slate-600 text-xs leading-relaxed mb-4">
                Full-screen interactive Leaflet &amp; OpenStreetMap dashboard visualizing all active buses in Chennai. Markers change colors dynamically: Green (Empty), Yellow (Normal), and Red (Overcrowded). Clicking any bus highlights its transit path with Google Maps-style directional animations.
              </p>
            </div>
            <Link
              href="/map"
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs text-center transition-colors flex items-center justify-center gap-1.5 shadow-xs"
            >
              Launch Live Map
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Admin & ML Analytics Card */}
          <div className="bg-white border border-slate-200 hover:border-purple-400 hover:shadow-md rounded-2xl p-6 transition-all duration-300 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-700 font-bold">
                  <BarChart3 className="w-6 h-6" />
                </div>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                  Central Operations &amp; ML
                </span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Admin Dashboard &amp; ML Training Data</h3>
              <p className="text-slate-600 text-xs leading-relaxed mb-4">
                Real-time fleet monitoring, crowd distribution analytics, ticket revenue audit, and the continuous <code className="text-purple-700 font-mono font-semibold">occupancy_history</code> table that persists every occupancy shift to build future ML crowd prediction models.
              </p>
            </div>
            <Link
              href="/admin"
              className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs text-center transition-colors flex items-center justify-center gap-1.5 shadow-xs"
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
