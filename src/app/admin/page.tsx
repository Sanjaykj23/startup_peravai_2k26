'use client';

import React, { useEffect, useState } from 'react';
import CrowdDistributionChart from '@/components/Charts/CrowdDistributionChart';
import CrowdIndicator from '@/components/CrowdIndicator';
import {
  BarChart3,
  Bus,
  Users,
  Ticket as TicketIcon,
  IndianRupee,
  Download,
  RotateCcw,
  RefreshCw,
  Database,
  Radio,
  Server,
  Layers,
  ArrowUpRight,
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import { Bus as BusType, OccupancyHistory } from '@/types';

export default function AdminPage() {
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const fetchAnalytics = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch('/api/analytics');
      const data = await res.json();
      if (data.analytics) {
        setAnalytics(data.analytics);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsRefreshing(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
    const interval = setInterval(fetchAnalytics, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleResetData = async () => {
    if (!confirm('Are you sure you want to reset the fleet to GTFS seed state?')) return;
    setResetting(true);
    try {
      await fetch('/api/seed/reset', { method: 'POST' });
      await fetchAnalytics();
      setMessage('Fleet data successfully restored to fresh Chennai GTFS seed state.');
    } catch (e) {
      console.error(e);
    } finally {
      setResetting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[500px] flex items-center justify-center text-slate-400">
        <RefreshCw className="w-8 h-8 animate-spin text-amber-400" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white border border-slate-200 p-6 rounded-3xl shadow-xs">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-700 shadow-2xs">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-slate-900">MTC Central Operations Admin</h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                Phase 1 Command Hub
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Fleet Occupancy Monitoring &bull; Vidiyal Payanam Subsidy Audit &bull; ML Dataset Pipeline
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Export ML Dataset CSV */}
          <a
            href="/api/analytics?format=csv"
            download="chennai_mtc_occupancy_history_ml_dataset.csv"
            className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs transition-colors flex items-center gap-2 shadow-sm"
          >
            <Download className="w-4 h-4" />
            <span>Export ML Dataset (CSV)</span>
          </a>

          {/* Reset GTFS Seed */}
          <button
            onClick={handleResetData}
            disabled={resetting}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-semibold transition-colors flex items-center gap-1.5"
            title="Reset to fresh GTFS state"
          >
            <RotateCcw className={`w-3.5 h-3.5 text-blue-600 ${resetting ? 'animate-spin' : ''}`} />
            <span>Reset GTFS</span>
          </button>

          <button
            onClick={fetchAnalytics}
            disabled={isRefreshing}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 text-slate-700 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {message && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-2xl text-xs flex items-center justify-between font-medium">
          <span>{message}</span>
          <button onClick={() => setMessage(null)} className="font-bold opacity-60 hover:opacity-100">
            &times;
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Active Buses */}
        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1 font-medium">
            <span>Active Fleet</span>
            <Bus className="w-4 h-4 text-blue-700" />
          </div>
          <div className="text-2xl font-black text-slate-900">
            {analytics?.totalActiveBuses}{' '}
            <span className="text-xs font-normal text-slate-400">/ {analytics?.totalBuses}</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Buses on live route</div>
        </div>

        {/* Total Tickets */}
        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1 font-medium">
            <span>Total Tickets</span>
            <TicketIcon className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{analytics?.totalTickets}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Generated this session</div>
        </div>

        {/* Ticket Revenue */}
        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1 font-medium">
            <span>Fare Revenue</span>
            <IndianRupee className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-700">
            ₹{Number(analytics?.ticketRevenue || 0).toFixed(2)}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Paid male tickets</div>
        </div>

        {/* Female Free Tickets */}
        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1 font-medium">
            <span>Vidiyal Payanam</span>
            <ShieldCheck className="w-4 h-4 text-pink-600" />
          </div>
          <div className="text-2xl font-black text-pink-700">
            {analytics?.femaleFreeTickets}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">100% Free Women Passes</div>
        </div>

        {/* ML History Records */}
        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1 font-medium">
            <span>ML Log Records</span>
            <Database className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-black text-purple-700">
            {analytics?.recentOccupancyHistory?.length || 0}+
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">In occupancy_history</div>
        </div>
      </div>

      {/* Visual Charts: Fleet Crowd Distribution & Vidiyal Payanam Breakdown */}
      {analytics && (
        <CrowdDistributionChart
          crowdDistribution={analytics.crowdDistribution}
          totalBuses={analytics.totalActiveBuses}
          femaleFreeTickets={analytics.femaleFreeTickets}
          malePaidTickets={analytics.malePaidTickets}
          ticketRevenue={analytics.ticketRevenue}
        />
      )}

      {/* Real-time Fleet Occupancy Per Bus Table */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Bus className="w-5 h-5 text-blue-700" />
            <h2 className="text-base font-bold text-slate-900">Current Occupancy Per Bus</h2>
          </div>
          <span className="text-xs text-slate-500 font-medium">Real-time occupancy classification</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 uppercase text-[10px] tracking-wider font-semibold">
                <th className="py-3 px-3">Bus Number</th>
                <th className="py-3 px-3">Route</th>
                <th className="py-3 px-3">Capacity</th>
                <th className="py-3 px-3">Current Occupancy</th>
                <th className="py-3 px-3">Crowd Status</th>
                <th className="py-3 px-3">Conductor</th>
                <th className="py-3 px-3">Trip Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {(analytics?.buses || []).map((bus: BusType) => (
                <tr key={bus.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-3">
                    <span className="font-mono font-bold text-slate-900">{bus.bus_number}</span>
                    <div className="text-[10px] text-slate-400 font-mono">{bus.fleet_code}</div>
                  </td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                      Route {bus.route_number}
                    </span>
                    <div className="text-[11px] text-slate-600 truncate max-w-xs mt-0.5 font-normal">
                      {bus.route_name}
                    </div>
                  </td>
                  <td className="py-3 px-3 font-mono text-slate-600">{bus.capacity} seats</td>
                  <td className="py-3 px-3 w-48">
                    <CrowdIndicator
                      occupancy={bus.current_occupancy}
                      capacity={bus.capacity}
                      showBar={true}
                      size="sm"
                    />
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        bus.crowd_status === 0
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                          : bus.crowd_status === 1
                          ? 'bg-amber-50 border-amber-200 text-amber-800'
                          : 'bg-rose-50 border-rose-200 text-rose-700'
                      }`}
                    >
                      {bus.crowd_status === 0
                        ? '0 = Empty'
                        : bus.crowd_status === 1
                        ? '1 = Normal'
                        : '2 = Overcrowded'}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-slate-700">
                    <div>{bus.conductor_name}</div>
                    <div className="text-[10px] text-slate-400 font-normal">MTC Conductor</div>
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className={`inline-flex items-center gap-1 font-mono text-[11px] font-bold ${
                        bus.status === 'active' ? 'text-emerald-700' : 'text-slate-400'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          bus.status === 'active' ? 'bg-emerald-600 animate-pulse' : 'bg-slate-300'
                        }`}
                      />
                      {bus.status === 'active' ? 'Active Trip' : 'Idle'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* CRITICAL DATA ASSET: OCCUPANCY HISTORY TABLE FOR ML TRAINING */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-purple-600" />
              <h2 className="text-base font-bold text-slate-900">Occupancy History (ML Training Asset)</h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Every occupancy change is logged to train intelligent crowd prediction models
            </p>
          </div>

          <a
            href="/api/analytics?format=csv"
            download="chennai_mtc_occupancy_history_ml_dataset.csv"
            className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs transition-colors flex items-center gap-1.5 shadow-2xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Dataset</span>
          </a>
        </div>

        <div className="overflow-x-auto max-h-96">
          <table className="w-full text-left text-xs">
            <thead className="sticky top-0 bg-slate-50">
              <tr className="border-b border-slate-200 text-slate-500 uppercase text-[10px] tracking-wider font-semibold">
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3">Bus ID</th>
                <th className="py-2.5 px-3">Occupancy</th>
                <th className="py-2.5 px-3">Crowd Status</th>
                <th className="py-2.5 px-3">Trigger Event</th>
                <th className="py-2.5 px-3">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
              {(analytics?.recentOccupancyHistory || []).map((h: OccupancyHistory) => (
                <tr key={h.id} className="hover:bg-slate-50/70">
                  <td className="py-2 px-3 text-slate-600" suppressHydrationWarning>
                    <span suppressHydrationWarning>{new Date(h.recorded_at).toLocaleTimeString('en-IN')}</span>{' '}
                    <span className="text-[9px] text-slate-400" suppressHydrationWarning>
                      {new Date(h.recorded_at).toLocaleDateString('en-IN')}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-slate-900 font-bold">{h.bus_id.slice(0, 16)}</td>
                  <td className="py-2 px-3 font-bold text-slate-800">{h.occupancy} passengers</td>
                  <td className="py-2 px-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        h.crowd_status === 0
                          ? 'text-emerald-700 bg-emerald-50 border border-emerald-200'
                          : h.crowd_status === 1
                          ? 'text-amber-800 bg-amber-50 border border-amber-200'
                          : 'text-rose-700 bg-rose-50 border border-rose-200'
                      }`}
                    >
                      Status {h.crowd_status}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-blue-700 font-semibold">{h.trigger_event}</td>
                  <td className="py-2 px-3 text-slate-600 font-sans truncate max-w-xs font-normal">
                    {h.notes || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Real-time Redis Key Monitor */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-3">
        <div className="flex items-center gap-2 text-slate-800 text-xs font-bold uppercase tracking-wider">
          <Server className="w-4 h-4 text-emerald-600" />
          <span>Redis Real-Time Cache Keys Inspection</span>
        </div>
        <p className="text-xs text-slate-500">
          In Phase 1, live bus states are cached under the standardized Redis keys:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-mono">
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
            <span className="text-blue-700 font-bold">bus:BUS001:occupancy</span>
            <div className="text-[11px] text-slate-500 mt-1 font-sans">Tracks live passenger count (e.g. 46)</div>
          </div>
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
            <span className="text-blue-700 font-bold">bus:BUS001:crowd_status</span>
            <div className="text-[11px] text-slate-500 mt-1 font-sans">Tracks 0 (Empty), 1 (Normal), 2 (Crowded)</div>
          </div>
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
            <span className="text-blue-700 font-bold">bus:BUS001:location</span>
            <div className="text-[11px] text-slate-500 mt-1 font-sans">Stores latest 30s lat/long beacon</div>
          </div>
        </div>
      </div>
    </div>
  );
}
