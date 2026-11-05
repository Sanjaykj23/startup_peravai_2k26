'use client';

import React, { useState, useEffect } from 'react';
import { Bus, Route, Stop, Ticket, getCrowdInfo } from '@/types';
import BusCard from '@/components/BusCard';
import TicketCard from '@/components/Ticket/TicketCard';
import CrowdIndicator from '@/components/CrowdIndicator';
import {
  Users,
  Phone,
  KeyRound,
  Navigation,
  MapPin,
  Ticket as TicketIcon,
  CreditCard,
  Banknote,
  CheckCircle2,
  AlertCircle,
  Search,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Compass
} from 'lucide-react';

export default function PassengerPage() {
  // Auth state
  const [phone, setPhone] = useState('9876543210');
  const [otp, setOtp] = useState('1234');
  const [demoOtp, setDemoOtp] = useState<string | null>('1234');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(true); // default logged in for smooth demo experience
  const [passengerToken, setPassengerToken] = useState<string | null>('pass_chennai_session');

  // Nearby Discovery state
  const [radiusKm, setRadiusKm] = useState(5);
  const [userLocation, setUserLocation] = useState({ latitude: 13.0827, longitude: 80.2707 }); // Chennai Central
  const [nearbyBuses, setNearbyBuses] = useState<Bus[]>([]);
  const [allBuses, setAllBuses] = useState<Bus[]>([]);
  const [loadingNearby, setLoadingNearby] = useState(false);

  // Booking state
  const [selectedBus, setSelectedBus] = useState<Bus | null>(null);
  const [busCodeInput, setBusCodeInput] = useState('5701');
  const [sourceStopId, setSourceStopId] = useState('');
  const [destinationStopId, setDestinationStopId] = useState('');
  const [passengerGender, setPassengerGender] = useState<'Male' | 'Female'>('Female');
  const [paymentMode, setPaymentMode] = useState<'Razorpay' | 'Cash'>('Razorpay');
  const [routeStops, setRouteStops] = useState<any[]>([]);

  // Tickets booked in this session
  const [bookedTickets, setBookedTickets] = useState<Ticket[]>([]);
  const [activeTicket, setActiveTicket] = useState<Ticket | null>(null);

  // UI status
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [loading, setLoading] = useState(false);

  // Load buses
  const fetchAllBuses = async () => {
    try {
      const res = await fetch('/api/buses');
      const data = await res.json();
      if (data.buses) setAllBuses(data.buses);
    } catch (e) {
      console.error(e);
    }
  };

  // Fetch Nearby Buses
  const fetchNearbyBuses = async () => {
    setLoadingNearby(true);
    try {
      const res = await fetch(
        `/api/passenger/nearby?lat=${userLocation.latitude}&lon=${userLocation.longitude}&radius=${radiusKm}`
      );
      const data = await res.json();
      if (data.buses) {
        setNearbyBuses(data.buses);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingNearby(false);
    }
  };

  useEffect(() => {
    fetchAllBuses();
    fetchNearbyBuses();
  }, [radiusKm, userLocation]);

  // When bus is selected for booking, fetch its route stops
  useEffect(() => {
    if (!selectedBus) return;
    fetch(`/api/routes?routeId=${selectedBus.route_id}`)
      .then(res => res.json())
      .then(data => {
        if (data.stops) {
          setRouteStops(data.stops);
          if (data.stops.length > 0) {
            setSourceStopId(data.stops[0].stop_id);
            if (data.stops.length > 1) {
              setDestinationStopId(data.stops[data.stops.length - 1].stop_id);
            }
          }
        }
      });
  }, [selectedBus]);

  // Auth: Send OTP
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch('/api/auth/passenger/otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'send', phone })
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ text: data.error, type: 'error' });
        return;
      }
      setIsOtpSent(true);
      if (data.demoOtp) {
        setDemoOtp(data.demoOtp);
        setOtp(data.demoOtp);
      }
      setMessage({ text: data.message, type: 'success' });
    } catch (err: any) {
      setMessage({ text: err.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Auth: Verify OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch('/api/auth/passenger/otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'verify', phone, otp })
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ text: data.error, type: 'error' });
        return;
      }
      setIsLoggedIn(true);
      setPassengerToken(data.passenger.token);
      setMessage({ text: 'Welcome to Chennai Smart Bus!', type: 'success' });
    } catch (err: any) {
      setMessage({ text: err.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Select bus by 4-digit code
  const handleSelectBusByCode = () => {
    const found = allBuses.find(
      b => b.bus_number === busCodeInput.trim() || b.fleet_code === busCodeInput.trim()
    );
    if (!found) {
      setMessage({ text: `Bus with code ${busCodeInput} not found in fleet`, type: 'error' });
      return;
    }
    setSelectedBus(found);
    setMessage({ text: `Selected Bus ${found.bus_number} (${found.route_name})`, type: 'success' });
  };

  // Passenger Book Ticket
  const handleBookTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBus) {
      setMessage({ text: 'Please select a bus first', type: 'error' });
      return;
    }
    if (!sourceStopId || !destinationStopId) {
      setMessage({ text: 'Please choose source and destination stops', type: 'error' });
      return;
    }
    if (sourceStopId === destinationStopId) {
      setMessage({ text: 'Destination cannot be the same as Source stop', type: 'error' });
      return;
    }

    setLoading(true);
    try {
      // Step 1: If Razorpay and male, simulate Razorpay order
      if (paymentMode === 'Razorpay' && passengerGender === 'Male') {
        const orderRes = await fetch('/api/payments/razorpay', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'create_order', fare: 12.0 })
        });
        const orderData = await orderRes.json();
      }

      // Step 2: Generate Ticket in Database
      const res = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bus_id: selectedBus.id,
          source_stop_id: sourceStopId,
          destination_stop_id: destinationStopId,
          gender: passengerGender,
          booked_by: 'passenger',
          payment_mode: passengerGender === 'Female' ? 'Free' : paymentMode,
          passenger_phone: phone
        })
      });
      const data = await res.json();

      if (!res.ok) {
        setMessage({ text: data.error || 'Failed to book ticket', type: 'error' });
        return;
      }

      setActiveTicket(data.ticket);
      setBookedTickets(prev => [data.ticket, ...prev]);
      fetchAllBuses();
      fetchNearbyBuses();
      setMessage({
        text: `Ticket Booked Successfully! Bus occupancy increased to ${data.bus.current_occupancy}`,
        type: 'success'
      });
    } catch (err: any) {
      setMessage({ text: err.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // GPS Simulation Locations in Chennai
  const chennaiLandmarks = [
    { name: 'Chennai Central', lat: 13.0827, lon: 80.2707 },
    { name: 'Koyambedu (CMBT)', lat: 13.0691, lon: 80.2057 },
    { name: 'Guindy Estate', lat: 13.0098, lon: 80.2131 },
    { name: 'OMR Sholinganallur', lat: 12.9011, lon: 80.2279 },
    { name: 'Tambaram West', lat: 12.9248, lon: 80.1172 }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner / Passenger Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white">Passenger Portal</h1>
            <p className="text-xs text-slate-400">
              Live Crowd Tracking &bull; Nearby Buses &bull; Instant Mobile Ticketing
            </p>
          </div>
        </div>

        {/* Auth status */}
        <div className="flex items-center gap-3">
          {isLoggedIn ? (
            <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-slate-300 font-mono">+91 {phone}</span>
              <button
                onClick={() => setIsLoggedIn(false)}
                className="text-[10px] text-slate-500 hover:text-rose-400 ml-2"
              >
                Sign out
              </button>
            </div>
          ) : (
            <span className="text-xs text-amber-400 font-medium">OTP Login Required</span>
          )}
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
          <button onClick={() => setMessage(null)} className="opacity-60 hover:opacity-100 font-bold">
            &times;
          </button>
        </div>
      )}

      {/* OTP LOGIN MODAL / BOX (If not logged in) */}
      {!isLoggedIn && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md mx-auto shadow-2xl">
          <div className="text-center mb-5">
            <h2 className="text-lg font-bold text-white">Login with Mobile OTP</h2>
            <p className="text-xs text-slate-400 mt-1">
              Enter your mobile number to view nearby buses and book tickets
            </p>
          </div>

          {!isOtpSent ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Mobile Number
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs text-slate-500 font-bold">
                    +91
                  </span>
                  <input
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="9876543210"
                    maxLength={10}
                    className="w-full pl-12 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
                    required
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-colors shadow-lg shadow-blue-500/20 disabled:opacity-50"
              >
                {loading ? 'Sending OTP...' : 'Send OTP'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-semibold text-slate-300">Enter 4-Digit OTP</label>
                  {demoOtp && (
                    <span className="text-[10px] text-amber-400 font-mono">Demo OTP: {demoOtp}</span>
                  )}
                </div>
                <input
                  type="text"
                  value={otp}
                  onChange={e => setOtp(e.target.value)}
                  placeholder="1234"
                  maxLength={4}
                  className="w-full py-2.5 px-4 bg-slate-950 border border-slate-800 rounded-xl text-center text-lg font-mono font-bold tracking-widest text-white focus:outline-none focus:border-blue-500"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors shadow-lg shadow-emerald-500/20 disabled:opacity-50"
              >
                {loading ? 'Verifying...' : 'Verify & Continue'}
              </button>
              <button
                type="button"
                onClick={() => setIsOtpSent(false)}
                className="w-full text-center text-xs text-slate-400 hover:text-white mt-2"
              >
                Change mobile number
              </button>
            </form>
          )}
        </div>
      )}

      {/* MAIN PASSENGER WORKFLOW (If logged in) */}
      {isLoggedIn && (
        <div className="space-y-8">
          {/* SECTION 1: NEARBY BUS DISCOVERY */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Navigation className="w-5 h-5 text-amber-400" />
                  <span>Nearby Bus Discovery</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Live buses within configurable GPS radius &bull; Color-coded by real-time crowd
                </p>
              </div>

              {/* Radius slider & GPS location simulator */}
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
                  <span className="text-slate-400">Radius:</span>
                  <input
                    type="range"
                    min="1"
                    max="15"
                    step="1"
                    value={radiusKm}
                    onChange={e => setRadiusKm(Number(e.target.value))}
                    className="accent-amber-500 w-24"
                  />
                  <span className="font-mono font-bold text-amber-400 w-8">{radiusKm} KM</span>
                </div>

                {/* Location selector */}
                <div className="flex items-center gap-1.5 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
                  <MapPin className="w-3.5 h-3.5 text-blue-400" />
                  <select
                    value={`${userLocation.latitude},${userLocation.longitude}`}
                    onChange={e => {
                      const [lat, lon] = e.target.value.split(',').map(Number);
                      setUserLocation({ latitude: lat, longitude: lon });
                    }}
                    className="bg-transparent text-slate-200 text-xs focus:outline-none"
                  >
                    {chennaiLandmarks.map(lm => (
                      <option key={lm.name} value={`${lm.lat},${lm.lon}`} className="bg-slate-900">
                        Near {lm.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Nearby bus cards */}
            {loadingNearby ? (
              <div className="text-center py-12 text-slate-500 text-xs">Scanning Chennai GPS radius...</div>
            ) : nearbyBuses.length === 0 ? (
              <div className="text-center py-12 bg-slate-950/60 rounded-2xl border border-slate-800/80 p-6">
                <Compass className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p className="text-slate-300 font-semibold text-xs">
                  No active buses within {radiusKm} KM of your current location.
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Try increasing the radius slider to 10-15 KM or choose another landmark above.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {nearbyBuses.map(bus => (
                  <BusCard
                    key={bus.id}
                    bus={bus}
                    showBookButton={true}
                    onBookClick={b => {
                      setSelectedBus(b);
                      setBusCodeInput(b.bus_number);
                      // Scroll smoothly to booking section
                      document.getElementById('booking-section')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* SECTION 2: TICKET BOOKING BY PASSENGER */}
          <div id="booking-section" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Booking Form (2 cols) */}
            <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <TicketIcon className="w-5 h-5 text-amber-400" />
                  <h2 className="text-base font-bold text-white">Book Bus Ticket</h2>
                </div>
                <span className="text-xs text-slate-400">Self-Booking via Mobile OTP</span>
              </div>

              <form onSubmit={handleBookTicket} className="space-y-4">
                {/* Bus Code input or selection */}
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Bus Number (4 digit bus code e.g. 5701, 2101, 0051)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={busCodeInput}
                      onChange={e => setBusCodeInput(e.target.value)}
                      placeholder="e.g. 5701"
                      className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                    />
                    <button
                      type="button"
                      onClick={handleSelectBusByCode}
                      className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors"
                    >
                      Find Bus
                    </button>
                  </div>
                  {selectedBus && (
                    <div className="mt-2 p-2.5 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                      <span className="font-bold text-amber-400">
                        Bus {selectedBus.bus_number} (Route {selectedBus.route_number})
                      </span>
                      <span className="text-slate-400 truncate max-w-xs">{selectedBus.route_name}</span>
                    </div>
                  )}
                </div>

                {/* Source & Destination Stop */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">
                      Source Stop
                    </label>
                    <select
                      value={sourceStopId}
                      onChange={e => setSourceStopId(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
                      required
                    >
                      <option value="">-- Choose Source Stop --</option>
                      {routeStops.map(rs => (
                        <option key={rs.stop_id} value={rs.stop_id}>
                          {rs.stop_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">
                      Destination Stop
                    </label>
                    <select
                      value={destinationStopId}
                      onChange={e => setDestinationStopId(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
                      required
                    >
                      <option value="">-- Choose Destination Stop --</option>
                      {routeStops.map(rs => (
                        <option key={rs.stop_id} value={rs.stop_id}>
                          {rs.stop_name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Gender - Free female pass simulation */}
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-2">
                    Passenger Gender (Vidiyal Payanam Free Travel)
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <label
                      className={`flex items-center justify-between p-3 rounded-2xl border cursor-pointer transition-all ${
                        passengerGender === 'Female'
                          ? 'bg-pink-500/10 border-pink-500 text-pink-300'
                          : 'bg-slate-950 border-slate-800 text-slate-400'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="passengerGender"
                          value="Female"
                          checked={passengerGender === 'Female'}
                          onChange={() => setPassengerGender('Female')}
                          className="accent-pink-500"
                        />
                        <span className="font-bold text-xs">Female (Free Pass)</span>
                      </div>
                      <span className="text-[11px] font-black px-2 py-0.5 rounded bg-pink-500/20 text-pink-300">
                        ₹0 Fare
                      </span>
                    </label>

                    <label
                      className={`flex items-center justify-between p-3 rounded-2xl border cursor-pointer transition-all ${
                        passengerGender === 'Male'
                          ? 'bg-blue-500/10 border-blue-500 text-blue-300'
                          : 'bg-slate-950 border-slate-800 text-slate-400'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="passengerGender"
                          value="Male"
                          checked={passengerGender === 'Male'}
                          onChange={() => setPassengerGender('Male')}
                          className="accent-blue-500"
                        />
                        <span className="font-bold text-xs">Male</span>
                      </div>
                      <span className="text-[11px] font-black px-2 py-0.5 rounded bg-blue-500/20 text-blue-300">
                        Paid Fare
                      </span>
                    </label>
                  </div>
                </div>

                {/* Payment Mode (Razorpay or Cash) */}
                {passengerGender === 'Male' && (
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-2">
                      Payment Mode
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <label
                        className={`flex items-center gap-2 p-3 rounded-2xl border cursor-pointer transition-all ${
                          paymentMode === 'Razorpay'
                            ? 'bg-blue-500/10 border-blue-500 text-blue-300'
                            : 'bg-slate-950 border-slate-800 text-slate-400'
                        }`}
                      >
                        <input
                          type="radio"
                          name="paymentMode"
                          value="Razorpay"
                          checked={paymentMode === 'Razorpay'}
                          onChange={() => setPaymentMode('Razorpay')}
                          className="accent-blue-500"
                        />
                        <CreditCard className="w-4 h-4" />
                        <span className="font-bold text-xs">Razorpay (UPI / Card)</span>
                      </label>

                      <label
                        className={`flex items-center gap-2 p-3 rounded-2xl border cursor-pointer transition-all ${
                          paymentMode === 'Cash'
                            ? 'bg-amber-500/10 border-amber-500 text-amber-300'
                            : 'bg-slate-950 border-slate-800 text-slate-400'
                        }`}
                      >
                        <input
                          type="radio"
                          name="paymentMode"
                          value="Cash"
                          checked={paymentMode === 'Cash'}
                          onChange={() => setPaymentMode('Cash')}
                          className="accent-amber-500"
                        />
                        <Banknote className="w-4 h-4" />
                        <span className="font-bold text-xs">Cash on Board</span>
                      </label>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || !selectedBus}
                  className="w-full py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs tracking-wider uppercase transition-colors shadow-lg shadow-amber-500/20 disabled:opacity-40"
                >
                  {loading
                    ? 'Processing Booking...'
                    : passengerGender === 'Female'
                    ? 'CLAIM FREE TICKET (VIDIYAL PAYANAM)'
                    : `PAY & BOOK TICKET (${paymentMode})`}
                </button>
              </form>
            </div>

            {/* Booked Ticket Receipt */}
            <div className="space-y-4">
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
                <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>Digital Ticket Receipt</span>
                </h3>

                {activeTicket ? (
                  <TicketCard ticket={activeTicket} />
                ) : (
                  <div className="border-2 border-dashed border-slate-800 rounded-2xl p-8 text-center text-slate-500 text-xs">
                    <TicketIcon className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                    Booked tickets will appear here with dynamic barcode.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
