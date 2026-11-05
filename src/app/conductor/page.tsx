'use client';

import React, { useState, useEffect } from 'react';
import { Bus, Route, Stop, RouteStop, Conductor, Ticket } from '@/types';
import CrowdIndicator from '@/components/CrowdIndicator';
import TicketCard from '@/components/Ticket/TicketCard';
import {
  Bus as BusIcon,
  Play,
  Square,
  Ticket as TicketIcon,
  MapPin,
  Users,
  UserPlus,
  UserMinus,
  Navigation,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Radio,
  Clock,
  Sparkles
} from 'lucide-react';

export default function ConductorPage() {
  // Auth state
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('cnd_570');
  const [password, setPassword] = useState('password123');
  const [conductor, setConductor] = useState<Conductor | null>(null);

  // Workflow state
  const [buses, setBuses] = useState<Bus[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [allStops, setAllStops] = useState<Stop[]>([]);
  const [selectedRouteId, setSelectedRouteId] = useState('');
  const [selectedBusId, setSelectedBusId] = useState('');
  const [currentStartingStopId, setCurrentStartingStopId] = useState('');
  const [tripEndingStopId, setTripEndingStopId] = useState('');
  const [currentStopId, setCurrentStopId] = useState('');
  const [visitedStopIds, setVisitedStopIds] = useState<string[]>([]);
  const [selectedNextStopId, setSelectedNextStopId] = useState('');
  const [routeStops, setRouteStops] = useState<RouteStop[]>([]);

  // Active Trip & Bus state
  const [currentBus, setCurrentBus] = useState<Bus | null>(null);
  const [isTripActive, setIsTripActive] = useState(false);
  const [tripId, setTripId] = useState<string | null>(null);

  // Ticket issuing form
  const [sourceStopId, setSourceStopId] = useState('');
  const [destinationStopId, setDestinationStopId] = useState('');
  const [gender, setGender] = useState<'Male' | 'Female'>('Female'); // Default to Vidiyal Payanam Free Pass for demo!
  const [issuedTickets, setIssuedTickets] = useState<Ticket[]>([]);
  const [latestTicket, setLatestTicket] = useState<Ticket | null>(null);

  // GPS Simulation
  const [isGpsAutoBroadcast, setIsGpsAutoBroadcast] = useState(true);
  const [lastGpsUpdate, setLastGpsUpdate] = useState<string | null>(null);

  // Feedback messages
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [loading, setLoading] = useState(false);

  // Load initial bus & route definitions
  useEffect(() => {
    fetch('/api/buses')
      .then(res => res.json())
      .then(data => {
        if (data.buses) setBuses(data.buses);
      });

    fetch('/api/routes')
      .then(res => res.json())
      .then(data => {
        if (data.routes) setRoutes(data.routes);
        if (data.stops) setAllStops(data.stops);
      });
  }, []);

  // When route changes, fetch sequenced route stops
  useEffect(() => {
    if (!selectedRouteId) return;
    fetch(`/api/routes?routeId=${selectedRouteId}`)
      .then(res => res.json())
      .then(data => {
        if (data.stops && data.stops.length > 0) {
          setRouteStops(data.stops);
          setCurrentStartingStopId(data.stops[0].stop_id);
          setCurrentStopId(data.stops[0].stop_id);
          setSourceStopId(data.stops[0].stop_id);
          if (data.stops.length > 1) {
            setTripEndingStopId(data.stops[data.stops.length - 1].stop_id);
            setDestinationStopId(data.stops[data.stops.length - 1].stop_id);
            setSelectedNextStopId(data.stops[1].stop_id);
          }
        }
      });
  }, [selectedRouteId]);

  // Sync current bus state
  const refreshCurrentBus = async (busIdToFetch: string) => {
    try {
      const res = await fetch(`/api/buses/${busIdToFetch}`);
      const data = await res.json();
      if (data.bus) {
        setCurrentBus(data.bus);
        if (data.bus.current_trip && data.bus.status === 'active') {
          setIsTripActive(true);
          setTripId(data.bus.current_trip.id);
          if (data.bus.current_trip.current_stop_id) {
            setCurrentStopId(data.bus.current_trip.current_stop_id);
            setSourceStopId(data.bus.current_trip.current_stop_id);
          }
          if (data.bus.current_trip.end_stop_id) {
            setTripEndingStopId(data.bus.current_trip.end_stop_id);
          }
        } else {
          setIsTripActive(false);
          setTripId(null);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Login handler
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch('/api/auth/conductor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();

      if (!res.ok) {
        setMessage({ text: data.error || 'Login failed', type: 'error' });
        setLoading(false);
        return;
      }

      setConductor(data.conductor);
      setIsLoggedIn(true);

      // Pre-select assigned bus and route if present
      if (data.assignedBus) {
        setSelectedBusId(data.assignedBus.id);
        setSelectedRouteId(data.assignedBus.route_id);
        setCurrentBus(data.assignedBus);
        if (data.assignedBus.status === 'active' && data.assignedBus.current_trip) {
          setIsTripActive(true);
          setTripId(data.assignedBus.current_trip.id);
          if (data.assignedBus.current_trip.current_stop_id) {
            setCurrentStopId(data.assignedBus.current_trip.current_stop_id);
            setSourceStopId(data.assignedBus.current_trip.current_stop_id);
          }
          if (data.assignedBus.current_trip.end_stop_id) {
            setTripEndingStopId(data.assignedBus.current_trip.end_stop_id);
          }
        }
      }
    } catch (err: any) {
      setMessage({ text: err.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // STEP 3: START TRIP
  const handleStartTrip = async () => {
    if (!selectedBusId) {
      setMessage({ text: 'Please select Route and Bus Number first (Step 1)', type: 'error' });
      return;
    }
    const startStop = currentStartingStopId || (routeStops.length > 0 ? routeStops[0].stop_id : '');
    const endStop = tripEndingStopId || (routeStops.length > 1 ? routeStops[routeStops.length - 1].stop_id : '');

    if (!startStop) {
      setMessage({ text: 'Please select Starting Board (Step 2)', type: 'error' });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/buses/${selectedBusId}/trip`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'start',
          startStopId: startStop,
          endStopId: endStop
        })
      });
      const data = await res.json();

      if (!res.ok) {
        setMessage({ text: data.error || 'Failed to start trip', type: 'error' });
        return;
      }

      setIsTripActive(true);
      setTripId(data.trip.id);
      setCurrentBus(data.bus);
      setCurrentStopId(startStop);
      setSourceStopId(startStop);
      setVisitedStopIds([startStop]);

      const startIdx = routeStops.findIndex(rs => rs.stop_id === startStop);
      if (startIdx >= 0 && startIdx + 1 < routeStops.length) {
        setSelectedNextStopId(routeStops[startIdx + 1].stop_id);
      }

      setMessage({
        text: `Trip started successfully from ${data.trip.start_stop_name || 'Origin'}! You can now advance stops and issue tickets.`,
        type: 'success'
      });
    } catch (err: any) {
      setMessage({ text: err.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // ADVANCE CURRENT STOP (Anytime, Anywhere during active trip)
  const handleAdvanceStop = async (targetStopId: string) => {
    if (!selectedBusId || !targetStopId) return;
    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch(`/api/buses/${selectedBusId}/trip`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_stop',
          stopId: targetStopId
        })
      });
      const data = await res.json();

      if (!res.ok) {
        setMessage({ text: data.error || 'Failed to update stop', type: 'error' });
        return;
      }

      setCurrentBus(data.bus);
      setCurrentStopId(targetStopId);
      setSourceStopId(targetStopId);

      const targetIdx = routeStops.findIndex(rs => rs.stop_id === targetStopId);
      if (targetIdx >= 0) {
        const newlyVisited = routeStops.slice(0, targetIdx + 1).map(rs => rs.stop_id);
        setVisitedStopIds(newlyVisited);

        if (targetIdx + 1 < routeStops.length) {
          setSelectedNextStopId(routeStops[targetIdx + 1].stop_id);
          setDestinationStopId(routeStops[routeStops.length - 1].stop_id);
        } else {
          setSelectedNextStopId('');
        }
      }

      setMessage({
        text: data.message || `Arrived at stop! Bus location and live occupancy updated in database.`,
        type: 'success'
      });
    } catch (err: any) {
      setMessage({ text: err.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // End Trip
  const handleEndTrip = async () => {
    if (!selectedBusId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/buses/${selectedBusId}/trip`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'end' })
      });
      const data = await res.json();
      setIsTripActive(false);
      setTripId(null);
      setCurrentBus(data.bus);
      setVisitedStopIds([]);
      setMessage({ text: 'Trip completed and bus set to Idle.', type: 'success' });
    } catch (err: any) {
      setMessage({ text: err.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Issue Ticket
  const handleIssueTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isTripActive) {
      setMessage({ text: 'Trip has not started! Conductor must click START TRIP before issuing tickets.', type: 'error' });
      return;
    }
    if (!sourceStopId || !destinationStopId) {
      setMessage({ text: 'Select both Source Stop and Destination Stop', type: 'error' });
      return;
    }
    if (sourceStopId === destinationStopId) {
      setMessage({ text: 'Destination Stop must be different from Source Stop', type: 'error' });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bus_id: selectedBusId,
          source_stop_id: sourceStopId,
          destination_stop_id: destinationStopId,
          gender,
          booked_by: 'conductor',
          payment_mode: gender === 'Female' ? 'Free' : 'Cash'
        })
      });
      const data = await res.json();

      if (!res.ok) {
        setMessage({ text: data.error || 'Failed to issue ticket', type: 'error' });
        return;
      }

      setLatestTicket(data.ticket);
      setIssuedTickets(prev => [data.ticket, ...prev]);
      setCurrentBus(data.bus);
      setMessage({
        text: `Ticket #${data.ticket.id.slice(0, 8)} generated (${gender === 'Female' ? 'FREE Vidiyal Payanam' : `₹${data.ticket.fare}`}). Occupancy increased to ${data.bus.current_occupancy}!`,
        type: 'success'
      });
    } catch (err: any) {
      setMessage({ text: err.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Record Passenger Entering / Exiting
  const handleUpdateOccupancy = async (action: 'enter' | 'exit', count: number = 1) => {
    if (!selectedBusId) return;

    try {
      const res = await fetch(`/api/buses/${selectedBusId}/occupancy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, count })
      });
      const data = await res.json();
      if (data.bus) {
        setCurrentBus(data.bus);
        setMessage({
          text: `${count} Passenger ${action === 'enter' ? 'entered' : 'exited'}. Current occupancy: ${data.bus.current_occupancy}`,
          type: 'success'
        });
      }
    } catch (err: any) {
      setMessage({ text: err.message, type: 'error' });
    }
  };

  // Periodic GPS location update (simulated every 30s)
  const broadcastGPS = async () => {
    if (!selectedBusId || !currentBus) return;

    // Simulate small realistic route progression along Chennai coordinates
    const baseLat = currentBus.current_location?.latitude || 13.06918;
    const baseLon = currentBus.current_location?.longitude || 80.20572;
    const jitterLat = baseLat + (Math.random() - 0.48) * 0.002;
    const jitterLon = baseLon + (Math.random() - 0.48) * 0.002;

    try {
      const res = await fetch(`/api/buses/${selectedBusId}/location`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          latitude: jitterLat,
          longitude: jitterLon,
          speed: Math.floor(20 + Math.random() * 25)
        })
      });
      const data = await res.json();
      if (data.bus) {
        setCurrentBus(data.bus);
        setLastGpsUpdate(new Date().toLocaleTimeString('en-IN'));
      }
    } catch (e) {
      console.error('GPS broadcast error:', e);
    }
  };

  useEffect(() => {
    if (!isTripActive || !isGpsAutoBroadcast || !selectedBusId) return;
    const interval = setInterval(broadcastGPS, 30000); // 30 seconds
    return () => clearInterval(interval);
  }, [isTripActive, isGpsAutoBroadcast, selectedBusId, currentBus]);

  // LOGIN SCREEN
  if (!isLoggedIn) {
    return (
      <div className="max-w-md mx-auto px-4 py-16">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl">
          <div className="text-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto mb-3">
              <BusIcon className="w-8 h-8" />
            </div>
            <h1 className="text-xl font-black text-white">Conductor Login</h1>
            <p className="text-xs text-slate-400 mt-1">Chennai MTC Electronic Ticketing Terminal</p>
          </div>

          {message && (
            <div
              className={`p-3 rounded-xl text-xs mb-4 flex items-center gap-2 ${
                message.type === 'error'
                  ? 'bg-rose-500/15 border border-rose-500/30 text-rose-300'
                  : 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300'
              }`}
            >
              {message.type === 'error' ? <AlertCircle className="w-4 h-4 shrink-0" /> : <CheckCircle2 className="w-4 h-4 shrink-0" />}
              <span>{message.text}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Conductor Username
              </label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="e.g. cnd_570, cnd_21g, cnd_5e"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors shadow-lg shadow-amber-500/20 disabled:opacity-50"
            >
              {loading ? 'Authenticating...' : 'Sign In to Bus Terminal'}
            </button>
          </form>

          {/* Quick Demo Acccount Switcher */}
          <div className="mt-6 pt-5 border-t border-slate-800">
            <div className="text-[11px] font-bold text-slate-400 mb-2 uppercase tracking-wider">
              Quick One-Click Demo Conductors:
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <button
                type="button"
                onClick={() => {
                  setUsername('cnd_570');
                  setPassword('password123');
                }}
                className="p-2 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-left text-slate-300"
              >
                <div className="font-bold text-amber-400">Bus 5701</div>
                <div>cnd_570</div>
              </button>
              <button
                type="button"
                onClick={() => {
                  setUsername('cnd_21g');
                  setPassword('password123');
                }}
                className="p-2 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-left text-slate-300"
              >
                <div className="font-bold text-amber-400">Bus 2101 (21G)</div>
                <div>cnd_21g</div>
              </button>
              <button
                type="button"
                onClick={() => {
                  setUsername('cnd_5e');
                  setPassword('password123');
                }}
                className="p-2 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-left text-slate-300"
              >
                <div className="font-bold text-amber-400">Bus 0051 (5E)</div>
                <div>cnd_5e</div>
              </button>
              <button
                type="button"
                onClick={() => {
                  setUsername('cnd_102');
                  setPassword('password123');
                }}
                className="p-2 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-left text-slate-300"
              >
                <div className="font-bold text-amber-400">Bus 1021 (102)</div>
                <div>cnd_102</div>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Stop sequence and navigation calculations
  const effectiveCurrentStopId = currentStopId || currentStartingStopId;
  const currentStopObj = routeStops.find(rs => rs.stop_id === effectiveCurrentStopId) || routeStops[0];
  const currentStopIndex = routeStops.findIndex(rs => rs.stop_id === effectiveCurrentStopId);

  const endingStopObj = routeStops.find(rs => rs.stop_id === tripEndingStopId) || (routeStops.length > 0 ? routeStops[routeStops.length - 1] : undefined);
  const endingStopIndex = tripEndingStopId
    ? routeStops.findIndex(rs => rs.stop_id === tripEndingStopId)
    : routeStops.length - 1;

  // STRICTLY Forward & Unvisited Stops (Cannot select past/visited stops)
  const forwardStops = routeStops.filter((rs, idx) => {
    return idx > currentStopIndex && (endingStopIndex === -1 || idx <= endingStopIndex);
  });

  const immediateNextStop = forwardStops.length > 0 ? forwardStops[0] : null;
  const visitedStops = routeStops.filter((rs, idx) => idx <= currentStopIndex);

  // CONDUCTOR DASHBOARD
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Conductor Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold">
            <BusIcon className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-black text-white">{conductor?.name}</h1>
              <span className="font-mono text-xs px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                {conductor?.employee_code}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Assigned Bus: <span className="text-amber-400 font-bold">{currentBus?.bus_number || 'Select Bus'}</span> &bull; Status:{' '}
              <span className={`font-bold ${isTripActive ? 'text-emerald-400' : 'text-slate-400'}`}>
                {isTripActive ? '● Trip in Progress' : 'Idle'}
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* GPS Status Indicator */}
          <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-xs text-slate-400">
            <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span>GPS Beacon (30s)</span>
            <button
              onClick={broadcastGPS}
              className="text-[10px] px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-amber-300 font-semibold transition-colors"
            >
              Ping Now
            </button>
          </div>

          <button
            onClick={() => setIsLoggedIn(false)}
            className="text-xs px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
          >
            Logout
          </button>
        </div>
      </div>

      {message && (
        <div
          className={`p-3 rounded-xl text-xs flex items-center justify-between gap-2 ${
            message.type === 'error'
              ? 'bg-rose-500/15 border border-rose-500/30 text-rose-300'
              : 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {message.type === 'error' ? <AlertCircle className="w-4 h-4 shrink-0" /> : <CheckCircle2 className="w-4 h-4 shrink-0" />}
            <span>{message.text}</span>
          </div>
          <button onClick={() => setMessage(null)} className="text-xs font-bold opacity-60 hover:opacity-100">
            &times;
          </button>
        </div>
      )}

      {/* SYSTEM FLOW: STEP 1, STEP 2, STEP 3 */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-amber-500 text-slate-950 font-black text-xs flex items-center justify-center">
              1-2-3
            </span>
            <h2 className="text-base font-bold text-white">Trip Initiation Protocol</h2>
          </div>
          <span className="text-xs text-slate-400">Mandatory Conductor Flow</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* STEP 1: Select Route & Bus Number */}
          <div className={`p-4 rounded-2xl border ${isTripActive ? 'bg-slate-950/40 border-slate-800 opacity-70' : 'bg-slate-950 border-amber-500/40'}`}>
            <div className="text-[11px] font-bold uppercase tracking-wider text-amber-400 mb-2">
              Step 1: Route &amp; Bus
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Select Route</label>
                <select
                  disabled={isTripActive}
                  value={selectedRouteId}
                  onChange={e => {
                    const newRouteId = e.target.value;
                    setSelectedRouteId(newRouteId);
                    const matchingBus = buses.find(b => b.route_id === newRouteId);
                    if (matchingBus) {
                      setSelectedBusId(matchingBus.id);
                      refreshCurrentBus(matchingBus.id);
                    }
                  }}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-xs text-white"
                >
                  <option value="">-- Choose Route --</option>
                  {routes.map(r => (
                    <option key={r.id} value={r.id}>
                      Route {r.route_number} - {r.route_name.slice(0, 30)}...
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Select Bus Number</label>
                <select
                  disabled={isTripActive}
                  value={selectedBusId}
                  onChange={e => {
                    const newBusId = e.target.value;
                    setSelectedBusId(newBusId);
                    const matching = buses.find(b => b.id === newBusId);
                    if (matching && matching.route_id !== selectedRouteId) {
                      setSelectedRouteId(matching.route_id);
                    }
                    refreshCurrentBus(newBusId);
                  }}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-xs text-white font-mono"
                >
                  <option value="">-- Choose Bus --</option>
                  {buses
                    .filter(b => !selectedRouteId || b.route_id === selectedRouteId)
                    .map(b => (
                      <option key={b.id} value={b.id}>
                        {b.bus_number} ({b.fleet_code}) - Capacity: {b.capacity}
                      </option>
                    ))}
                </select>
              </div>
            </div>
          </div>

          {/* STEP 2: Select Starting Board & Ending Board */}
          <div className={`p-4 rounded-2xl border ${isTripActive ? 'bg-slate-950/40 border-slate-800 opacity-70' : 'bg-slate-950 border-amber-500/40'}`}>
            <div className="text-[11px] font-bold uppercase tracking-wider text-amber-400 mb-2">
              Step 2: Journey Boards (Start &amp; End)
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">
                  Starting Board (Origin Stop)
                </label>
                <select
                  disabled={isTripActive || routeStops.length === 0}
                  value={currentStartingStopId}
                  onChange={e => {
                    const startId = e.target.value;
                    setCurrentStartingStopId(startId);
                    setCurrentStopId(startId);
                    setSourceStopId(startId);
                  }}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-xs text-white"
                >
                  {routeStops.length === 0 ? (
                    <option value="">(Select Route first in Step 1)</option>
                  ) : (
                    routeStops.map(rs => (
                      <option key={rs.stop_id} value={rs.stop_id}>
                        #{rs.stop_sequence}: {rs.stop_name}
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block mb-1">
                  Ending Board (Destination Terminus)
                </label>
                <select
                  disabled={isTripActive || routeStops.length === 0}
                  value={tripEndingStopId}
                  onChange={e => setTripEndingStopId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-xs text-white"
                >
                  {routeStops.length === 0 ? (
                    <option value="">(Select Route first in Step 1)</option>
                  ) : (
                    routeStops
                      .filter((rs, idx) => {
                        const startIdx = routeStops.findIndex(s => s.stop_id === currentStartingStopId);
                        return idx > (startIdx >= 0 ? startIdx : 0);
                      })
                      .map(rs => (
                        <option key={rs.stop_id} value={rs.stop_id}>
                          #{rs.stop_sequence}: {rs.stop_name}
                        </option>
                      ))
                  )}
                </select>
              </div>
            </div>
          </div>

          {/* STEP 3: Click START TRIP */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col justify-between">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-amber-400 mb-2">
                Step 3: Execute Trip
              </div>
              <p className="text-xs text-slate-300">
                {isTripActive
                  ? 'Trip is currently in progress. Conductor can advance stops and issue tickets.'
                  : 'Only after trip starts can conductor advance stops and issue tickets.'}
              </p>
            </div>

            <div className="pt-4">
              {!isTripActive ? (
                <button
                  type="button"
                  onClick={handleStartTrip}
                  disabled={loading || !selectedBusId || (!currentStartingStopId && routeStops.length === 0)}
                  className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs tracking-wider uppercase transition-colors flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                >
                  <Play className="w-4 h-4 fill-current" />
                  START TRIP
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleEndTrip}
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs tracking-wider uppercase transition-colors flex items-center justify-center gap-2 shadow-lg shadow-rose-600/20"
                >
                  <Square className="w-4 h-4 fill-current" />
                  END TRIP
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* DYNAMIC LIVE BUS LOCATION & FORWARD STOP CONTROLLER (ACTIVE TRIP ONLY) */}
      {isTripActive && (
        <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/40 border-2 border-emerald-500/40 rounded-3xl p-6 shadow-2xl space-y-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </span>
                <h2 className="text-base font-black text-white">Live Bus Location &amp; Stop Progression Controller</h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Live Map Sync
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Advance bus to any forward stop. Automatically deboards destination passengers, updates live GPS coordinates, and reflects immediately on the live map and crowd count.
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs font-mono text-slate-300 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
              <span className="text-slate-500">Trip:</span>
              <span className="text-amber-400 font-bold">{routeStops.find(s => s.stop_id === currentStartingStopId)?.stop_name || 'Origin'}</span>
              <span className="text-slate-600">&rarr;</span>
              <span className="text-blue-400 font-bold">{endingStopObj?.stop_name || 'Terminus'}</span>
            </div>
          </div>

          {/* Current Stop Display & Next Stop Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Current Active Stop */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                <span>Current Bus Location</span>
                <span className="text-emerald-400 font-mono font-bold">● Active Now</span>
              </div>
              <div className="flex items-start gap-3 pt-1">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-black text-sm shrink-0 border border-amber-500/30">
                  #{currentStopObj?.stop_sequence || 1}
                </div>
                <div className="min-w-0">
                  <h3 className="text-base font-black text-white truncate">
                    {currentStopObj?.stop_name || 'Starting Board'}
                  </h3>
                  <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3 text-amber-400 shrink-0" />
                    <span>GPS: {currentStopObj?.latitude ? Number(currentStopObj.latitude).toFixed(4) : '--'}, {currentStopObj?.longitude ? Number(currentStopObj.longitude).toFixed(4) : '--'}</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Quick 1-Click: Arrive at Next Stop */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col justify-between">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center justify-between">
                <span>Immediate Next Stop</span>
                <span className="text-blue-400 font-mono">#{immediateNextStop?.stop_sequence || '--'}</span>
              </div>
              {immediateNextStop ? (
                <>
                  <p className="text-sm font-bold text-slate-200 truncate mb-3">
                    {immediateNextStop.stop_name}
                  </p>
                  <button
                    type="button"
                    onClick={() => handleAdvanceStop(immediateNextStop.stop_id)}
                    disabled={loading}
                    className="w-full py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition-colors flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                  >
                    <Navigation className="w-4 h-4 fill-current" />
                    <span>Arrive at Next Stop (#{immediateNextStop.stop_sequence})</span>
                  </button>
                </>
              ) : (
                <div className="text-xs text-amber-400 font-bold py-2 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Reached Destination Terminus!</span>
                </div>
              )}
            </div>

            {/* Jump to Any Forward Stop (Unvisited Only!) */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col justify-between">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center justify-between">
                  <span>Jump to Forward Stop</span>
                  <span className="text-[10px] text-slate-500">(Unvisited only)</span>
                </div>
                <select
                  disabled={loading || forwardStops.length === 0}
                  value={selectedNextStopId}
                  onChange={e => setSelectedNextStopId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-xs text-white"
                >
                  {forwardStops.length === 0 ? (
                    <option value="">(No more forward stops)</option>
                  ) : (
                    forwardStops.map(rs => (
                      <option key={rs.stop_id} value={rs.stop_id}>
                        #{rs.stop_sequence}: {rs.stop_name}
                      </option>
                    ))
                  )}
                </select>
              </div>
              <button
                type="button"
                onClick={() => handleAdvanceStop(selectedNextStopId)}
                disabled={loading || !selectedNextStopId || forwardStops.length === 0}
                className="w-full mt-2 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold text-xs border border-slate-700 transition-colors disabled:opacity-40"
              >
                Update Bus to Selected Stop
              </button>
            </div>
          </div>

          {/* Interactive Route Stop Progression Bar */}
          <div className="pt-2">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>Route Stop Sequence (Click any forward stop to jump)</span>
              <span className="text-xs font-mono text-slate-400">
                {visitedStops.length} of {routeStops.length} Visited
              </span>
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-thin">
              {routeStops.map((rs, idx) => {
                const isVisited = idx < currentStopIndex;
                const isCurrent = idx === currentStopIndex;
                const isNext = idx === currentStopIndex + 1;

                return (
                  <button
                    key={rs.stop_id}
                    type="button"
                    disabled={isVisited || isCurrent || loading}
                    onClick={() => handleAdvanceStop(rs.stop_id)}
                    className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border ${
                      isCurrent
                        ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/30'
                        : isVisited
                        ? 'bg-slate-950/80 text-slate-600 border-slate-800 line-through cursor-not-allowed opacity-60'
                        : isNext
                        ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/25'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                    }`}
                    title={
                      isCurrent
                        ? 'Current Bus Stop'
                        : isVisited
                        ? 'Already visited (locked)'
                        : `Click to advance bus to ${rs.stop_name}`
                    }
                  >
                    <span>#{rs.stop_sequence}</span>
                    <span className="truncate max-w-[120px]">{rs.stop_name}</span>
                    {isCurrent && <span className="text-[10px]">🚌</span>}
                    {isVisited && <span className="text-[10px]">✓</span>}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* LIVE OCCUPANCY & TICKETING DESK (ACTIVE TRIP ONLY) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Ticket Issuer & Occupancy Counter */}
        <div className="lg:col-span-2 space-y-6">
          {/* Live Occupancy Counter Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-amber-400" />
                  <span>Live Passenger Count Logic</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Every ticket increases occupancy &bull; Reaching passenger destination stop automatically deboards them
                </p>
              </div>

              {currentBus && (
                <div className="w-full sm:w-64 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                  <CrowdIndicator
                    occupancy={currentBus.current_occupancy}
                    capacity={currentBus.capacity}
                    showBar={true}
                  />
                </div>
              )}
            </div>

            {/* Quick Increment / Decrement Counters */}
            <div className="grid grid-cols-2 gap-4 mt-4">
              <button
                type="button"
                onClick={() => handleUpdateOccupancy('enter', 1)}
                disabled={!isTripActive || Boolean(currentBus && currentBus.current_occupancy >= currentBus.capacity)}
                className="py-3 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-emerald-400 font-bold text-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-40"
              >
                <UserPlus className="w-4 h-4" />
                <span>Record Passenger Entry (+1)</span>
              </button>

              <button
                type="button"
                onClick={() => handleUpdateOccupancy('exit', 1)}
                disabled={!isTripActive || Boolean(currentBus && currentBus.current_occupancy <= 0)}
                className="py-3 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-rose-400 font-bold text-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-40"
              >
                <UserMinus className="w-4 h-4" />
                <span>Record Passenger Exit (-1)</span>
              </button>
            </div>
          </div>

          {/* Ticket Generation Flow */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <TicketIcon className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white">Issue Ticket</h3>
              </div>
              <span className="text-xs font-mono text-amber-400">
                {isTripActive ? '● ETM Terminal Ready' : 'Locked - Start Trip First'}
              </span>
            </div>

            <form onSubmit={handleIssueTicket} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Source Stop */}
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Source Stop (Boarding Point)
                  </label>
                  <select
                    disabled={!isTripActive}
                    value={sourceStopId}
                    onChange={e => {
                      const newSource = e.target.value;
                      setSourceStopId(newSource);
                      const srcIdx = routeStops.findIndex(rs => rs.stop_id === newSource);
                      const destIdx = routeStops.findIndex(rs => rs.stop_id === destinationStopId);
                      if (destIdx <= srcIdx && srcIdx + 1 < routeStops.length) {
                        setDestinationStopId(routeStops[routeStops.length - 1].stop_id);
                      }
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
                    required
                  >
                    <option value="">-- Select Source Stop --</option>
                    {routeStops
                      .filter((rs, idx) => idx >= currentStopIndex)
                      .map(rs => (
                        <option key={rs.stop_id} value={rs.stop_id}>
                          #{rs.stop_sequence}: {rs.stop_name} {rs.stop_id === currentStopId ? '(Current Location)' : ''}
                        </option>
                      ))}
                  </select>
                </div>

                {/* Destination Stop */}
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Destination Stop (Deboarding Point)
                  </label>
                  <select
                    disabled={!isTripActive}
                    value={destinationStopId}
                    onChange={e => setDestinationStopId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
                    required
                  >
                    <option value="">-- Select Destination Stop --</option>
                    {routeStops
                      .filter((rs, idx) => {
                        const srcIdx = routeStops.findIndex(s => s.stop_id === sourceStopId);
                        return idx > (srcIdx >= 0 ? srcIdx : currentStopIndex);
                      })
                      .map(rs => (
                        <option key={rs.stop_id} value={rs.stop_id}>
                          #{rs.stop_sequence}: {rs.stop_name}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              {/* Gender Selection & Vidiyal Payanam Free Travel Scheme */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-2">
                  Gender (Tamil Nadu Vidiyal Payanam Scheme)
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label
                    className={`flex items-center justify-between p-3 rounded-2xl border cursor-pointer transition-all ${
                      gender === 'Female'
                        ? 'bg-pink-500/10 border-pink-500 text-pink-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="gender"
                        value="Female"
                        checked={gender === 'Female'}
                        onChange={() => setGender('Female')}
                        className="accent-pink-500"
                      />
                      <span className="font-bold text-xs">Female (Women Pass)</span>
                    </div>
                    <span className="text-[11px] font-black px-2 py-0.5 rounded bg-pink-500/20 text-pink-300">
                      ₹0.00 FREE
                    </span>
                  </label>

                  <label
                    className={`flex items-center justify-between p-3 rounded-2xl border cursor-pointer transition-all ${
                      gender === 'Male'
                        ? 'bg-blue-500/10 border-blue-500 text-blue-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="gender"
                        value="Male"
                        checked={gender === 'Male'}
                        onChange={() => setGender('Male')}
                        className="accent-blue-500"
                      />
                      <span className="font-bold text-xs">Male</span>
                    </div>
                    <span className="text-[11px] font-black px-2 py-0.5 rounded bg-blue-500/20 text-blue-300">
                      Standard Fare
                    </span>
                  </label>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !isTripActive}
                className="w-full py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs tracking-wider uppercase transition-colors shadow-lg shadow-amber-500/20 disabled:opacity-40"
              >
                {loading ? 'Printing...' : 'GENERATE & ISSUE TICKET'}
              </button>
            </form>
          </div>
        </div>

        {/* Right Col: Latest Printed Ticket & ETM Simulation */}
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
            <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Latest ETM Digital Receipt</span>
            </h3>

            {latestTicket ? (
              <TicketCard ticket={latestTicket} />
            ) : (
              <div className="border-2 border-dashed border-slate-800 rounded-2xl p-8 text-center text-slate-500 text-xs">
                <TicketIcon className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                Tickets generated will print and appear here instantly.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
