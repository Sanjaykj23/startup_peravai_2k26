'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Bus, Route, RouteStop, Ticket, getCrowdInfo } from '@/types';
import TicketCard from '@/components/Ticket/TicketCard';
import CrowdIndicator from '@/components/CrowdIndicator';
import {
  GraduationCap,
  Bus as BusIcon,
  ShieldCheck,
  QrCode,
  MapPin,
  Calendar,
  Building,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowRight,
  Download,
  Search,
  Clock,
  Printer
} from 'lucide-react';

const CHENNAI_INSTITUTIONS = [
  'Anna University (CEG Campus, Guindy)',
  'Presidency College (Marina Beach)',
  'Loyola College (Nungambakkam)',
  'Madras Christian College (Tambaram)',
  'IIT Madras (Adyar / Guindy)',
  'Pachaiyappa’s College (Chetpet)',
  'Stanley Medical College (Royapuram)',
  'Chennai Govt Higher Secondary School (Saidapet)',
  'Govt College of Technology / Polytechnic (Taramani)'
];

export default function StudentPortalPage() {
  const [activeTab, setActiveTab] = useState<'ticket' | 'pass' | 'routes'>('ticket');

  // Student Profile State
  const [studentName, setStudentName] = useState('Kavitha Selvam');
  const [studentRollNo, setStudentRollNo] = useState('2024CS-9182');
  const [institution, setInstitution] = useState(CHENNAI_INSTITUTIONS[0]);
  const [studentPhone, setStudentPhone] = useState('9876543210');

  // Live Bus & Route State
  const [buses, setBuses] = useState<Bus[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [selectedRouteId, setSelectedRouteId] = useState('');
  const [routeStops, setRouteStops] = useState<RouteStop[]>([]);
  const [selectedBusId, setSelectedBusId] = useState('');
  const [sourceStopId, setSourceStopId] = useState('');
  const [destinationStopId, setDestinationStopId] = useState('');

  // Ticketing state
  const [loading, setLoading] = useState(false);
  const [latestTicket, setLatestTicket] = useState<Ticket | null>(null);
  const [myTickets, setMyTickets] = useState<Ticket[]>([]);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Load initial bus & route data
  useEffect(() => {
    fetch('/api/buses')
      .then(res => res.json())
      .then(data => {
        if (data.buses) setBuses(data.buses);
      })
      .catch(() => {});

    fetch('/api/routes')
      .then(res => res.json())
      .then(data => {
        if (data.routes && data.routes.length > 0) {
          setRoutes(data.routes);
          setSelectedRouteId(data.routes[0].id);
        }
      })
      .catch(() => {});
  }, []);

  // Fetch stops when selected route changes
  useEffect(() => {
    if (!selectedRouteId) return;

    fetch(`/api/routes?routeId=${selectedRouteId}`)
      .then(res => res.json())
      .then(data => {
        if (data.stops && data.stops.length > 0) {
          setRouteStops(data.stops);
          setSourceStopId(data.stops[0].stop_id);
          setDestinationStopId(data.stops[data.stops.length - 1].stop_id);
        }
      })
      .catch(() => {});
  }, [selectedRouteId]);

  // Update selected bus when route changes
  useEffect(() => {
    const matchingBuses = buses.filter(b => b.route_id === selectedRouteId);
    if (matchingBuses.length > 0) {
      setSelectedBusId(matchingBuses[0].id);
    } else {
      setSelectedBusId('');
    }
  }, [selectedRouteId, buses]);

  // Handle Free Student Ticket Booking
  const handleBookFreeStudentTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBusId) {
      setMessage({ text: 'Please select an active bus on this route.', type: 'error' });
      return;
    }
    if (!sourceStopId || !destinationStopId) {
      setMessage({ text: 'Please select both Boarding Stop and Destination Stop.', type: 'error' });
      return;
    }
    if (sourceStopId === destinationStopId) {
      setMessage({ text: 'Destination Stop must be different from Boarding Stop.', type: 'error' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bus_id: selectedBusId,
          source_stop_id: sourceStopId,
          destination_stop_id: destinationStopId,
          gender: 'Student',
          booked_by: 'student',
          payment_mode: 'Free',
          passenger_phone: studentPhone,
          student_id: studentRollNo,
          institution_name: institution
        })
      });

      const data = await res.json();
      if (!res.ok) {
        setMessage({ text: data.error || 'Failed to claim student ticket', type: 'error' });
        return;
      }

      setLatestTicket(data.ticket);
      setMyTickets(prev => [data.ticket, ...prev]);

      // Refresh bus data
      fetch('/api/buses')
        .then(r => r.json())
        .then(d => {
          if (d.buses) setBuses(d.buses);
        });

      setMessage({
        text: `Free Student Pass Ticket #${data.ticket.id.slice(0, 8)} generated successfully! Fare: ₹0.00.`,
        type: 'success'
      });
    } catch (err: any) {
      setMessage({ text: err.message || 'Network error claiming ticket', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const selectedBus = buses.find(b => b.id === selectedBusId);
  const selectedRoute = routes.find(r => r.id === selectedRouteId);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Tamil Nadu Govt Header & Scheme Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute -right-12 -top-12 w-64 h-64 bg-white/5 rounded-full pointer-events-none blur-xl" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/30 border border-blue-400/40 text-blue-200 text-xs font-bold tracking-wider uppercase">
              <GraduationCap className="w-4 h-4 text-amber-300" />
              <span>Tamil Nadu Free Student Bus Pass Scheme</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Student Digital Pass &amp; E-Ticket Portal
            </h1>
            <p className="text-blue-100 text-sm max-w-2xl leading-relaxed">
              Official 100% Free Commute pass for School and College Students across Chennai MTC Network.
              Instant digital verification, live bus crowd tracking, and ₹0.00 E-Ticket issuance.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl shrink-0 text-center sm:text-right">
            <div className="text-[10px] text-blue-200 uppercase font-bold tracking-wider">Fare Subsidy</div>
            <div className="text-3xl font-black text-amber-300 font-mono">₹0.00</div>
            <div className="text-[11px] text-blue-100 font-medium">100% Free for Students</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3 overflow-x-auto">
        <button
          onClick={() => setActiveTab('ticket')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'ticket'
              ? 'bg-blue-700 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <BusIcon className="w-4 h-4" />
          <span>Claim Free E-Ticket (₹0.00)</span>
        </button>

        <button
          onClick={() => setActiveTab('pass')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'pass'
              ? 'bg-blue-700 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          <span>Digital Student Smart Pass</span>
        </button>

        <button
          onClick={() => setActiveTab('routes')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'routes'
              ? 'bg-blue-700 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <MapPin className="w-4 h-4" />
          <span>Live College Bus Fleet</span>
        </button>
      </div>

      {message && (
        <div
          className={`p-4 rounded-2xl text-xs flex items-center justify-between gap-3 ${
            message.type === 'error'
              ? 'bg-rose-50 border border-rose-200 text-rose-800'
              : 'bg-emerald-50 border border-emerald-200 text-emerald-800'
          }`}
        >
          <div className="flex items-center gap-2 font-medium">
            {message.type === 'error' ? <AlertCircle className="w-4 h-4 shrink-0" /> : <CheckCircle2 className="w-4 h-4 shrink-0" />}
            <span>{message.text}</span>
          </div>
          <button onClick={() => setMessage(null)} className="font-bold opacity-60 hover:opacity-100">
            &times;
          </button>
        </div>
      )}

      {/* TAB 1: CLAIM FREE E-TICKET */}
      {activeTab === 'ticket' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form */}
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-xs space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-blue-700" />
                <span>Issue Free Student Bus Ticket</span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Select your route and stops. Your student credential authorizes 100% free travel.
              </p>
            </div>

            <form onSubmit={handleBookFreeStudentTicket} className="space-y-5">
              {/* Student Info Quick Strip */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold block uppercase">Student Name</span>
                  <input
                    type="text"
                    value={studentName}
                    onChange={e => setStudentName(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-xs text-slate-900 font-semibold mt-1"
                    required
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold block uppercase">Roll / Reg Number</span>
                  <input
                    type="text"
                    value={studentRollNo}
                    onChange={e => setStudentRollNo(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-xs text-slate-900 font-mono font-semibold mt-1"
                    required
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold block uppercase">Institution</span>
                  <select
                    value={institution}
                    onChange={e => setInstitution(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-xs text-slate-900 font-medium mt-1 truncate"
                  >
                    {CHENNAI_INSTITUTIONS.map((inst, i) => (
                      <option key={i} value={inst}>
                        {inst}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Route & Bus Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Select Route
                  </label>
                  <select
                    value={selectedRouteId}
                    onChange={e => setSelectedRouteId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 font-medium focus:bg-white focus:border-blue-500 shadow-2xs"
                  >
                    {routes.map(r => (
                      <option key={r.id} value={r.id}>
                        Route {r.route_number}: {r.route_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Select Active Bus
                  </label>
                  <select
                    value={selectedBusId}
                    onChange={e => setSelectedBusId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 font-medium focus:bg-white focus:border-blue-500 shadow-2xs"
                    required
                  >
                    {buses
                      .filter(b => b.route_id === selectedRouteId)
                      .map(b => (
                        <option key={b.id} value={b.id}>
                          Bus {b.bus_number} &bull; Occupancy: {b.current_occupancy}/{b.capacity} seats ({b.status})
                        </option>
                      ))}
                    {buses.filter(b => b.route_id === selectedRouteId).length === 0 && (
                      <option value="">No active buses on this route currently</option>
                    )}
                  </select>
                </div>
              </div>

              {/* Stops Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Boarding Stop (Source)
                  </label>
                  <select
                    value={sourceStopId}
                    onChange={e => setSourceStopId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 font-medium focus:bg-white focus:border-blue-500 shadow-2xs"
                    required
                  >
                    {routeStops.map((rs, i) => (
                      <option key={rs.stop_id} value={rs.stop_id}>
                        #{rs.stop_sequence}: {rs.stop_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    College / School Stop (Destination)
                  </label>
                  <select
                    value={destinationStopId}
                    onChange={e => setDestinationStopId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 font-medium focus:bg-white focus:border-blue-500 shadow-2xs"
                    required
                  >
                    {routeStops.map((rs, i) => (
                      <option key={rs.stop_id} value={rs.stop_id}>
                        #{rs.stop_sequence}: {rs.stop_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Fare & Subsidy Breakdown Box */}
              <div className="bg-blue-50/70 border border-blue-200 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <div className="text-[11px] font-bold text-blue-900">Tamil Nadu Free Student Commute Pass</div>
                  <div className="text-xs text-blue-700 font-medium">Valid with Student ID Card &bull; Zero Fare</div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-black text-blue-900 font-mono">₹0.00</div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                    100% Free
                  </span>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !selectedBusId}
                className="w-full py-4 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-black text-sm tracking-wider uppercase transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-40"
              >
                <GraduationCap className="w-5 h-5 text-amber-300" />
                <span>{loading ? 'Claiming Pass...' : 'CLAIM FREE STUDENT TICKET (₹0.00)'}</span>
              </button>
            </form>
          </div>

          {/* Right Col: Latest Ticket or Digital Receipt */}
          <div className="space-y-5">
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs">
              <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-700" />
                <span>Your Active Student Ticket</span>
              </h3>

              {latestTicket ? (
                <TicketCard ticket={latestTicket} />
              ) : (
                <div className="border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center text-slate-400 text-xs space-y-2">
                  <GraduationCap className="w-10 h-10 text-slate-300 mx-auto" />
                  <p className="font-semibold text-slate-600">No ticket claimed yet</p>
                  <p className="text-[11px] text-slate-400">
                    Fill the form on the left to claim your 100% Free Student Bus Ticket.
                  </p>
                </div>
              )}
            </div>

            {/* Quick Link to Map */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs flex items-center justify-between">
              <div>
                <strong className="text-slate-800 block">Want to see live bus on the road?</strong>
                <span className="text-slate-500 text-[11px]">Track bus turn-by-turn with road routing.</span>
              </div>
              <Link
                href="/map"
                className="px-3 py-1.5 rounded-lg bg-blue-700 text-white font-bold text-xs hover:bg-blue-800 transition-colors shadow-2xs shrink-0"
              >
                Open Live Map &rarr;
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: DIGITAL STUDENT SMART PASS */}
      {activeTab === 'pass' && (
        <div className="max-w-xl mx-auto">
          {/* Official Digital Smart Card */}
          <div className="bg-gradient-to-br from-blue-900 via-indigo-900 to-slate-900 rounded-3xl p-6 sm:p-7 text-white shadow-2xl border-4 border-amber-400/80 relative overflow-hidden">
            {/* Watermark seal */}
            <div className="absolute -right-10 -bottom-10 w-44 h-44 rounded-full bg-white/5 border border-white/10 flex items-center justify-center pointer-events-none transform rotate-12">
              <span className="text-[10px] uppercase font-mono font-bold text-white/20 tracking-widest text-center px-4">
                GOVT OF TAMIL NADU &bull; MTC
              </span>
            </div>

            {/* Card Header */}
            <div className="border-b border-white/15 pb-4 mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 font-black flex items-center justify-center text-sm shadow-md">
                  MTC
                </div>
                <div>
                  <div className="text-[10px] text-amber-300 font-bold uppercase tracking-wider">
                    Government of Tamil Nadu
                  </div>
                  <div className="text-sm font-black text-white tracking-wide">
                    STUDENT DIGITAL CONCESSION PASS
                  </div>
                </div>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/30 text-emerald-300 border border-emerald-400/40 font-bold">
                VALID 2025-2026
              </span>
            </div>

            {/* Card Body */}
            <div className="grid grid-cols-3 gap-4 mb-5">
              <div className="col-span-2 space-y-2 text-xs">
                <div>
                  <span className="text-[10px] text-blue-200 block uppercase">Student Name</span>
                  <span className="font-bold text-white text-sm">{studentName}</span>
                </div>
                <div>
                  <span className="text-[10px] text-blue-200 block uppercase">Roll / Register No</span>
                  <span className="font-mono font-bold text-amber-300 text-xs">{studentRollNo}</span>
                </div>
                <div>
                  <span className="text-[10px] text-blue-200 block uppercase">Institution</span>
                  <span className="font-semibold text-blue-100 text-[11px] leading-tight block">
                    {institution}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-blue-200 block uppercase">Concession Type</span>
                  <span className="font-bold text-emerald-300 text-xs">100% Free Commute Pass</span>
                </div>
              </div>

              {/* QR Code box */}
              <div className="flex flex-col items-center justify-center bg-white p-3 rounded-2xl text-slate-900 shadow-md">
                <QrCode className="w-20 h-20 text-slate-900" />
                <span className="text-[8px] font-mono font-bold mt-1 text-slate-600">VERIFIED PASS</span>
              </div>
            </div>

            {/* Card Footer */}
            <div className="border-t border-white/15 pt-3 flex items-center justify-between text-[10px] text-blue-200">
              <div className="flex items-center gap-1.5 font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Authorized by Transport Dept. TN</span>
              </div>
              <span className="font-mono text-white/60">ETM-PASS-{studentRollNo.replace(/[^a-zA-Z0-9]/g, '')}</span>
            </div>
          </div>

          <div className="mt-5 flex items-center justify-center gap-3">
            <button
              onClick={() => window.print()}
              className="px-4 py-2.5 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 text-xs font-bold transition-colors flex items-center gap-2 shadow-2xs"
            >
              <Printer className="w-4 h-4 text-slate-600" />
              <span>Print Student Smart Pass</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB 3: LIVE COLLEGE BUS FLEET */}
      {activeTab === 'routes' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">
              Active College &amp; School Corridor Buses
            </h2>
            <span className="text-xs text-slate-500 font-medium">
              Showing live occupancy so you can choose a comfortable bus
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {buses.map(bus => {
              const crowd = getCrowdInfo(bus.current_occupancy, bus.capacity);
              return (
                <div
                  key={bus.id}
                  className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sm text-slate-900">
                        {bus.bus_number}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                        Route {bus.route_number}
                      </span>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${crowd.badgeClass}`}
                    >
                      {crowd.label}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-1">{bus.route_name}</p>

                  <CrowdIndicator
                    occupancy={bus.current_occupancy}
                    capacity={bus.capacity}
                    showBar={true}
                    size="sm"
                  />

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                    <span className="text-slate-500">
                      Seats: <strong className="text-slate-800">{bus.capacity - bus.current_occupancy} available</strong>
                    </span>
                    <button
                      onClick={() => {
                        setSelectedRouteId(bus.route_id);
                        setSelectedBusId(bus.id);
                        setActiveTab('ticket');
                      }}
                      className="text-blue-700 hover:text-blue-800 font-bold hover:underline"
                    >
                      Book Free Ticket &rarr;
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}