'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  DemandSupplyResponse,
  RouteDemandSupplyAnalysis,
  TimeSlotDemandSupplyBreakdown
} from '@/types/demandSupply';
import {
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Bus,
  Users,
  Layers,
  ArrowRight,
  Filter,
  RefreshCw,
  Sliders,
  Scale,
  Sparkles,
  Info,
  Printer,
  MinusCircle,
  PlusCircle,
  ArrowRightLeft,
  Calendar,
  Zap,
  TrendingDown,
  ShieldCheck
} from 'lucide-react';

export default function DemandSupplyIntelligencePage() {
  const [data, setData] = useState<DemandSupplyResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Applied Filter State (what is currently active in the API call)
  const [appliedRouteId, setAppliedRouteId] = useState<string>('all');
  const [appliedTimeSlot, setAppliedTimeSlot] = useState<string>('all_day');
  const [appliedDateRange, setAppliedDateRange] = useState<string>('all');
  const [appliedCriticalThreshold, setAppliedCriticalThreshold] = useState<number>(100);
  const [appliedHighThreshold, setAppliedHighThreshold] = useState<number>(70);
  const [appliedModerateThreshold, setAppliedModerateThreshold] = useState<number>(50);

  // Draft Filter State (user selections before clicking Apply Filters)
  const [draftRouteId, setDraftRouteId] = useState<string>('all');
  const [draftTimeSlot, setDraftTimeSlot] = useState<string>('all_day');
  const [draftDateRange, setDraftDateRange] = useState<string>('all');
  const [draftCriticalThreshold, setDraftCriticalThreshold] = useState<number>(100);
  const [draftHighThreshold, setDraftHighThreshold] = useState<number>(70);
  const [draftModerateThreshold, setDraftModerateThreshold] = useState<number>(50);

  const [showThresholdConfig, setShowThresholdConfig] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'comparison' | 'reduction_augmentation' | 'timeslots'>('overview');
  const [planSyncedWithAdmin, setPlanSyncedWithAdmin] = useState(false);

  // Check if draft differs from applied
  const isDirty = useMemo(() => {
    return (
      draftRouteId !== appliedRouteId ||
      draftTimeSlot !== appliedTimeSlot ||
      draftDateRange !== appliedDateRange ||
      draftCriticalThreshold !== appliedCriticalThreshold ||
      draftHighThreshold !== appliedHighThreshold ||
      draftModerateThreshold !== appliedModerateThreshold
    );
  }, [
    draftRouteId, appliedRouteId,
    draftTimeSlot, appliedTimeSlot,
    draftDateRange, appliedDateRange,
    draftCriticalThreshold, appliedCriticalThreshold,
    draftHighThreshold, appliedHighThreshold,
    draftModerateThreshold, appliedModerateThreshold
  ]);

  const fetchData = async (routeId = appliedRouteId, slot = appliedTimeSlot, range = appliedDateRange, crit = appliedCriticalThreshold, high = appliedHighThreshold, mod = appliedModerateThreshold) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (routeId !== 'all') params.set('routeId', routeId);
      if (slot !== 'all_day') params.set('timeSlot', slot);
      if (range !== 'all') params.set('dateRange', range);
      params.set('criticalThreshold', crit.toString());
      params.set('highThreshold', high.toString());
      params.set('moderateThreshold', mod.toString());

      const res = await fetch(`/api/demand-supply?${params.toString()}`);
      const json: DemandSupplyResponse = await res.json();

      if (!res.ok || !json.success) {
        throw new Error((json as any).error || 'Failed to fetch demand supply analytics');
      }

      setData(json);
    } catch (err: any) {
      console.error('Error loading intelligence data:', err);
      setError(err.message || 'Error communicating with analytics engine');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Handle Apply Filters Click
  const handleApplyFilters = () => {
    setAppliedRouteId(draftRouteId);
    setAppliedTimeSlot(draftTimeSlot);
    setAppliedDateRange(draftDateRange);
    setAppliedCriticalThreshold(draftCriticalThreshold);
    setAppliedHighThreshold(draftHighThreshold);
    setAppliedModerateThreshold(draftModerateThreshold);
    fetchData(draftRouteId, draftTimeSlot, draftDateRange, draftCriticalThreshold, draftHighThreshold, draftModerateThreshold);
  };

  // Reset Filters to default
  const handleResetFilters = () => {
    setDraftRouteId('all');
    setDraftTimeSlot('all_day');
    setDraftDateRange('all');
    setDraftCriticalThreshold(100);
    setDraftHighThreshold(70);
    setDraftModerateThreshold(50);

    setAppliedRouteId('all');
    setAppliedTimeSlot('all_day');
    setAppliedDateRange('all');
    setAppliedCriticalThreshold(100);
    setAppliedHighThreshold(70);
    setAppliedModerateThreshold(50);
    fetchData('all', 'all_day', 'all', 100, 70, 50);
  };

  const summary = data?.summary;
  const routes = data?.routeAnalyses || [];
  const timeSlots = data?.timeSlotBreakdowns || [];

  // Group recommendations by operational action (Reduce vs Augment vs Maintain)
  const reductionRoutes = useMemo(() => routes.filter(r => r.serviceAction === 'reduce'), [routes]);
  const augmentationRoutes = useMemo(() => routes.filter(r => r.serviceAction === 'augment'), [routes]);
  const maintainRoutes = useMemo(() => routes.filter(r => r.serviceAction === 'maintain'), [routes]);

  // Helper for Status Badge Styling
  const getStatusBadge = (status: RouteDemandSupplyAnalysis['imbalanceStatus'], ratio: number | null) => {
    switch (status) {
      case 'critical':
        return {
          bg: 'bg-rose-50 border-rose-300 text-rose-800',
          dot: 'bg-rose-600',
          label: 'Critical Shortage',
          icon: AlertTriangle
        };
      case 'high':
        return {
          bg: 'bg-amber-50 border-amber-300 text-amber-800',
          dot: 'bg-amber-500',
          label: 'High Utilisation',
          icon: Clock
        };
      case 'moderate':
        return {
          bg: 'bg-blue-50 border-blue-200 text-blue-800',
          dot: 'bg-blue-600',
          label: 'Balanced',
          icon: CheckCircle2
        };
      case 'underutilized':
        return {
          bg: 'bg-emerald-50 border-emerald-300 text-emerald-800',
          dot: 'bg-emerald-600',
          label: 'Service Reduction Advised',
          icon: TrendingDown
        };
      default:
        return {
          bg: 'bg-slate-100 border-slate-300 text-slate-700',
          dot: 'bg-slate-400',
          label: 'Insufficient Supply Data',
          icon: Info
        };
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner / Intelligence Header */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-blue-500/10 to-transparent pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-200 text-xs font-bold tracking-wider uppercase">
              <Scale className="w-4 h-4 text-amber-300" />
              <span>NAMMAMOVE Phase 2 &bull; Operational Intelligence</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Demand &amp; Supply Intelligence
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
              Real-time route-wise passenger demand vs bus capacity analysis.
              Generates specific operational suggestions on <strong>when to reduce trips</strong> during off-peak lulls, <strong>when to augment buses</strong> during rush hour, and connects directly with Admin Dispatch Planning.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={() => setShowThresholdConfig(!showThresholdConfig)}
              className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-white text-xs font-bold transition-all flex items-center gap-2 shadow-2xs"
            >
              <Sliders className="w-4 h-4 text-amber-300" />
              <span>Thresholds</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-400 text-slate-950 font-black">
                {draftCriticalThreshold}%
              </span>
            </button>

            <Link
              href="/admin"
              className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Admin Dispatch Sync</span>
            </Link>

            <button
              onClick={() => window.print()}
              className="px-3.5 py-2 rounded-xl bg-white text-slate-900 hover:bg-slate-100 text-xs font-bold transition-all flex items-center gap-2 shadow-2xs"
            >
              <Printer className="w-4 h-4 text-slate-700" />
              <span>Export Report</span>
            </button>
          </div>
        </div>
      </div>

      {/* Threshold Configuration Drawer */}
      {showThresholdConfig && (
        <div className="bg-white border border-amber-300 rounded-3xl p-6 shadow-md space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Sliders className="w-5 h-5 text-amber-600" />
              <h3 className="text-sm font-bold text-slate-900">
                Operational Classification Benchmarks (Configurable)
              </h3>
            </div>
            <button
              onClick={() => setShowThresholdConfig(false)}
              className="text-xs text-slate-400 hover:text-slate-700 font-bold"
            >
              ✕ Close
            </button>
          </div>

          <p className="text-xs text-slate-500">
            Tune the Demand-to-Capacity ratio boundaries to align with MTC peak policy. Click &quot;Apply Filters&quot; to compute.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-2">
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-rose-700 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-rose-600"></span>
                  Critical Demand Threshold
                </span>
                <span className="font-mono font-black text-rose-700">{draftCriticalThreshold}%</span>
              </div>
              <input
                type="range"
                min="80"
                max="150"
                step="5"
                value={draftCriticalThreshold}
                onChange={e => setDraftCriticalThreshold(Number(e.target.value))}
                className="w-full accent-rose-600 cursor-pointer"
              />
              <span className="text-[10px] text-slate-400">Demand exceeds capacity when ratio &gt; {draftCriticalThreshold}%</span>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-amber-700 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                  High Utilisation Benchmark
                </span>
                <span className="font-mono font-black text-amber-700">{draftHighThreshold}%</span>
              </div>
              <input
                type="range"
                min="60"
                max="95"
                step="5"
                value={draftHighThreshold}
                onChange={e => setDraftHighThreshold(Number(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
              <span className="text-[10px] text-slate-400">Monitor route when utilisation is {draftHighThreshold}% to {draftCriticalThreshold}%</span>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-emerald-700 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                  Underutilised Cutoff
                </span>
                <span className="font-mono font-black text-emerald-700">&lt; {draftModerateThreshold}%</span>
              </div>
              <input
                type="range"
                min="30"
                max="65"
                step="5"
                value={draftModerateThreshold}
                onChange={e => setDraftModerateThreshold(Number(e.target.value))}
                className="w-full accent-emerald-600 cursor-pointer"
              />
              <span className="text-[10px] text-slate-400">Potential fleet surplus flagged when demand &lt; {draftModerateThreshold}%</span>
            </div>
          </div>
        </div>
      )}

      {/* Interactive Filters Bar with APPLY FILTERS BUTTON */}
      <div className="bg-white border-2 border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 shrink-0">
            <Filter className="w-4 h-4 text-blue-700" />
            <span>Filters:</span>
          </div>

          {/* Route filter */}
          <div>
            <select
              value={draftRouteId}
              onChange={e => setDraftRouteId(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-semibold focus:bg-white focus:border-blue-500 shadow-2xs"
            >
              <option value="all">All Routes (Corridors)</option>
              {routes.map(r => (
                <option key={r.routeId} value={r.routeId}>
                  Route {r.routeNumber}: {r.routeName.slice(0, 30)}...
                </option>
              ))}
            </select>
          </div>

          {/* Time Slot filter */}
          <div>
            <select
              value={draftTimeSlot}
              onChange={e => setDraftTimeSlot(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-semibold focus:bg-white focus:border-blue-500 shadow-2xs"
            >
              <option value="all_day">All Operating Hours (24h)</option>
              <option value="morning_peak">08:00 - 11:00 (Morning Peak)</option>
              <option value="midday">11:00 - 16:00 (Midday Off-Peak)</option>
              <option value="evening_peak">16:00 - 20:00 (Evening Peak)</option>
              <option value="night">20:00 - 08:00 (Night / Early)</option>
            </select>
          </div>

          {/* Date Range filter */}
          <div>
            <select
              value={draftDateRange}
              onChange={e => setDraftDateRange(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-semibold focus:bg-white focus:border-blue-500 shadow-2xs"
            >
              <option value="all">All Recorded History</option>
              <option value="today">Today Only</option>
              <option value="7days">Past 7 Days</option>
              <option value="30days">Past 30 Days</option>
            </select>
          </div>
        </div>

        {/* APPLY BUTTON & RESET BUTTON */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={handleApplyFilters}
            disabled={loading}
            className={`px-5 py-2.5 rounded-xl text-xs font-black tracking-wide uppercase transition-all flex items-center justify-center gap-2 shadow-md ${
              isDirty
                ? 'bg-blue-600 hover:bg-blue-700 text-white animate-pulse'
                : 'bg-blue-700 hover:bg-blue-800 text-white'
            } disabled:opacity-50`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'Applying...' : 'Apply Filters'}</span>
          </button>

          {isDirty && (
            <button
              onClick={handleResetFilters}
              disabled={loading}
              className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold transition-all"
            >
              Reset
            </button>
          )}

          <div className="text-[11px] text-slate-500 font-mono hidden xl:flex items-center gap-1.5 pl-2 border-l border-slate-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Live Sync</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
          <button onClick={() => fetchData()} className="font-bold underline">
            Retry
          </button>
        </div>
      )}

      {/* 5 Summary KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {/* Total Routes Analysed */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1 font-semibold">
            <span>Routes Analysed</span>
            <Layers className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{summary?.totalRoutesAnalysed ?? 0}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Active corridors</div>
        </div>

        {/* Total Passenger Demand */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1 font-semibold">
            <span>Passenger Demand</span>
            <Users className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-indigo-700">{summary?.totalPassengerDemand ?? 0}</div>
          <div className="text-[10px] text-slate-500 mt-0.5 truncate">
            {summary?.studentDemandCount ?? 0} stu &bull; {summary?.femaleDemandCount ?? 0} fem &bull; {summary?.paidDemandCount ?? 0} paid
          </div>
        </div>

        {/* Total Available Capacity */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1 font-semibold">
            <span>Available Capacity</span>
            <Bus className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-600">{summary?.totalAvailableCapacity ?? 0}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Total seat supply</div>
        </div>

        {/* Overcrowded Corridors */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1 font-semibold">
            <span>Overcrowded Corridors</span>
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-black text-rose-600">
            {(summary?.criticalRoutesCount ?? 0) + (summary?.highUtilisationRoutesCount ?? 0)}
          </div>
          <div className="text-[11px] text-rose-700 font-semibold mt-0.5">Augment trips needed</div>
        </div>

        {/* Potentially Underutilised Routes */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs col-span-2 md:col-span-1">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1 font-semibold">
            <span>Underutilised Routes</span>
            <TrendingDown className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-600">{reductionRoutes.length}</div>
          <div className="text-[11px] text-emerald-700 font-semibold mt-0.5">Reduce frequency &amp; save fuel</div>
        </div>
      </div>

      {/* Quick Admin Planning Link Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
            <Zap className="w-5 h-5 fill-current" />
          </div>
          <div>
            <div className="font-bold text-xs text-blue-900">
              Admin Planning Link: {augmentationRoutes.length} Route(s) need extra trips &bull; {reductionRoutes.length} Route(s) can be reduced
            </div>
            <div className="text-[11px] text-blue-700">
              Synchronize operational headway adjustments directly with the MTC Central Operations Admin panel.
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => {
              setPlanSyncedWithAdmin(true);
              setTimeout(() => setPlanSyncedWithAdmin(false), 3000);
            }}
            className="px-3 py-1.5 rounded-lg bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs transition-colors shadow-2xs flex items-center gap-1.5"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{planSyncedWithAdmin ? 'Plan Synced to Admin!' : 'Sync Plan to Admin'}</span>
          </button>
          <Link
            href="/admin"
            className="px-3 py-1.5 rounded-lg bg-white border border-blue-200 text-blue-800 font-bold text-xs hover:bg-blue-100 transition-colors"
          >
            Open Admin &rarr;
          </Link>
        </div>
      </div>

      {/* Tabs navigation for Visual sections */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3 overflow-x-auto">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'overview'
              ? 'bg-blue-700 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          Corridor Comparison Table
        </button>

        <button
          onClick={() => setActiveTab('reduction_augmentation')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'reduction_augmentation'
              ? 'bg-blue-700 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Scale className="w-3.5 h-3.5" />
          <span>Route Reduction &amp; Augmentation Guide</span>
          <span className="px-1.5 py-0.2 rounded text-[10px] bg-amber-400 text-slate-950 font-black">
            Actionable
          </span>
        </button>

        <button
          onClick={() => setActiveTab('comparison')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'comparison'
              ? 'bg-blue-700 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          Demand vs Supply Charts
        </button>

        <button
          onClick={() => setActiveTab('timeslots')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'timeslots'
              ? 'bg-blue-700 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          Time-Slot Load Curve
        </button>
      </div>

      {/* TAB 1: ROUTE COMPARISON TABLE */}
      {activeTab === 'overview' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-black text-slate-900">
                Route-wise Demand &amp; Supply Imbalance Matrix
              </h2>
              <p className="text-xs text-slate-500">
                Identifies routes exceeding 100% capacity (Critical) and routes under 50% capacity (Reduce service).
              </p>
            </div>
            <div className="text-xs font-mono text-slate-500 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
              Peak Corridor: <strong className="text-blue-700">{summary?.peakDemandRoute || 'None'}</strong>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50/80 text-slate-600 font-bold border-b border-slate-200">
                  <th className="py-3 px-3">Route</th>
                  <th className="py-3 px-3">Corridor</th>
                  <th className="py-3 px-3 text-center">Time Slot</th>
                  <th className="py-3 px-3 text-right">Passenger Demand</th>
                  <th className="py-3 px-3 text-center">Bus Trips</th>
                  <th className="py-3 px-3 text-right">Available Capacity</th>
                  <th className="py-3 px-3 text-center">Demand/Capacity Ratio</th>
                  <th className="py-3 px-3 text-center">Action</th>
                  <th className="py-3 px-4">Operational Recommendation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {routes.map(r => {
                  const badge = getStatusBadge(r.imbalanceStatus, r.demandToCapacityRatio);
                  const ratio = r.demandToCapacityRatio;

                  return (
                    <tr key={r.routeId} className="hover:bg-slate-50/60 transition-colors">
                      {/* Route Number */}
                      <td className="py-3.5 px-3">
                        <span className="font-mono font-black text-sm text-slate-900 px-2 py-1 rounded bg-blue-50 border border-blue-200">
                          {r.routeNumber}
                        </span>
                      </td>

                      {/* Route Name & Corridor */}
                      <td className="py-3.5 px-3">
                        <div className="font-bold text-slate-800">{r.routeName}</div>
                        <div className="text-[10px] text-slate-500 truncate max-w-[180px]">{r.corridor}</div>
                      </td>

                      {/* Time Slot */}
                      <td className="py-3.5 px-3 text-center">
                        <span className="font-semibold text-[11px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                          {r.timeSlot}
                        </span>
                      </td>

                      {/* Passenger Demand */}
                      <td className="py-3.5 px-3 text-right">
                        <span className="font-mono font-black text-sm text-slate-900">{r.passengerDemand}</span>
                        <div className="text-[9px] text-slate-400">
                          {r.studentPassCount > 0 && <span className="text-blue-700 font-semibold">{r.studentPassCount} stu </span>}
                          {r.femaleFreeCount > 0 && <span className="text-pink-600 font-semibold">{r.femaleFreeCount} fem </span>}
                          {r.malePaidCount > 0 && <span className="text-slate-600">{r.malePaidCount} gen</span>}
                        </div>
                      </td>

                      {/* Bus Trips */}
                      <td className="py-3.5 px-3 text-center">
                        <span className="font-mono font-bold text-slate-800 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded">
                          {r.busTripsCount} trips
                        </span>
                        <div className="text-[9px] text-slate-400">{r.busesAssignedCount} fleet bus</div>
                      </td>

                      {/* Available Capacity */}
                      <td className="py-3.5 px-3 text-right">
                        <span className="font-mono font-bold text-slate-800">
                          {r.totalAvailableCapacity}
                        </span>
                        <div className="text-[9px] text-slate-400">({r.busCapacity} seats)</div>
                      </td>

                      {/* Demand-to-Capacity Ratio */}
                      <td className="py-3.5 px-3 text-center">
                        {ratio !== null ? (
                          <div className="space-y-1">
                            <span
                              className={`font-mono font-black text-sm ${
                                ratio > appliedCriticalThreshold
                                  ? 'text-rose-600'
                                  : ratio >= appliedHighThreshold
                                  ? 'text-amber-600'
                                  : ratio >= appliedModerateThreshold
                                  ? 'text-blue-700'
                                  : 'text-emerald-700'
                              }`}
                            >
                              {ratio}%
                            </span>
                            <div className="w-16 mx-auto bg-slate-100 rounded-full h-1.5 overflow-hidden">
                              <div
                                className={`h-full ${
                                  ratio > appliedCriticalThreshold
                                    ? 'bg-rose-600'
                                    : ratio >= appliedHighThreshold
                                    ? 'bg-amber-500'
                                    : ratio >= appliedModerateThreshold
                                    ? 'bg-blue-600'
                                    : 'bg-emerald-500'
                                }`}
                                style={{ width: `${Math.min(100, ratio)}%` }}
                              />
                            </div>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 font-semibold">N/A</span>
                        )}
                      </td>

                      {/* Action Tag */}
                      <td className="py-3.5 px-3 text-center">
                        {r.serviceAction === 'reduce' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                            <MinusCircle className="w-3 h-3 text-emerald-600" />
                            <span>Reduce Frequency</span>
                          </span>
                        ) : r.serviceAction === 'augment' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-300">
                            <PlusCircle className="w-3 h-3 text-rose-600" />
                            <span>Augment Trips</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-blue-50 text-blue-800 border border-blue-200">
                            <CheckCircle2 className="w-3 h-3 text-blue-600" />
                            <span>Maintain Schedule</span>
                          </span>
                        )}
                      </td>

                      {/* Recommendation */}
                      <td className="py-3.5 px-4">
                        <div className="text-[11px] font-medium text-slate-700 max-w-[280px]">
                          {r.recommendation}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: ROUTE REDUCTION & AUGMENTATION GUIDE */}
      {activeTab === 'reduction_augmentation' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-3">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Sparkles className="w-5 h-5 text-amber-500" />
              <h2 className="text-base font-black text-slate-900">
                Operational Dispatch Planning: When to Reduce vs When to Augment
              </h2>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Provides actionable timetabling guidance for MTC schedulers.
              Identifies specific time windows when bus frequencies should be curtailed to conserve operating costs, and rush hour windows when extra shuttle trips must be injected.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Section A: Corridors Where Service Should Be REDUCED */}
            <div className="bg-white border-2 border-emerald-300 rounded-3xl p-6 shadow-xs space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                    <MinusCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900">
                      Service Reduction Suggestions ({reductionRoutes.length} Corridors)
                    </h3>
                    <p className="text-[11px] text-emerald-800 font-semibold">
                      Underutilised supply during off-peak windows &bull; Cut dead-mileage
                    </p>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                  Cost Saver
                </span>
              </div>

              {reductionRoutes.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  No routes currently flagged for reduction in this filter.
                </div>
              ) : (
                <div className="space-y-4">
                  {reductionRoutes.map(r => (
                    <div
                      key={r.routeId}
                      className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200 space-y-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-xs px-2 py-0.5 rounded bg-white text-emerald-900 border border-emerald-300">
                            Route {r.routeNumber}
                          </span>
                          <span className="font-bold text-xs text-slate-900">{r.routeName}</span>
                        </div>
                        <span className="font-mono text-xs font-black text-emerald-700">
                          {r.demandToCapacityRatio}% utilisation
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[11px] bg-white p-3 rounded-xl border border-emerald-100">
                        <div>
                          <span className="text-slate-400 font-semibold block uppercase text-[9px]">When to Reduce:</span>
                          <strong className="text-slate-800">{r.reductionDetails?.offPeakWindow || 'Midday 11:30 - 15:30 & Night'}</strong>
                        </div>
                        <div>
                          <span className="text-slate-400 font-semibold block uppercase text-[9px]">Headway Adjustment:</span>
                          <strong className="text-emerald-800">{r.reductionDetails?.headwayAdjustment || 'Widen headway to 20-25 min'}</strong>
                        </div>
                        <div>
                          <span className="text-slate-400 font-semibold block uppercase text-[9px]">Fleet Action:</span>
                          <strong className="text-blue-700">{r.reductionDetails?.fleetReallocationTarget || 'Reallocate 1 bus to peak corridors'}</strong>
                        </div>
                        <div>
                          <span className="text-slate-400 font-semibold block uppercase text-[9px]">Est. Cost Savings:</span>
                          <strong className="text-emerald-700">{r.reductionDetails?.estimatedCostSavings || '₹8,400 / day'}</strong>
                        </div>
                      </div>

                      <div className="text-[11px] text-slate-600 italic">
                        &quot;{r.recommendation}&quot;
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Section B: Corridors Where Service Should Be AUGMENTED */}
            <div className="bg-white border-2 border-rose-300 rounded-3xl p-6 shadow-xs space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-800 flex items-center justify-center font-bold">
                    <PlusCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900">
                      Service Augmentation Suggestions ({augmentationRoutes.length} Corridors)
                    </h3>
                    <p className="text-[11px] text-rose-800 font-semibold">
                      High passenger overcrowding &bull; Add peak shuttle trips
                    </p>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-rose-50 text-rose-800 border border-rose-200">
                  Peak Priority
                </span>
              </div>

              {augmentationRoutes.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  No routes currently experiencing overcrowding shortage.
                </div>
              ) : (
                <div className="space-y-4">
                  {augmentationRoutes.map(r => (
                    <div
                      key={r.routeId}
                      className="p-4 rounded-2xl bg-rose-50/50 border border-rose-200 space-y-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-xs px-2 py-0.5 rounded bg-white text-rose-900 border border-rose-300">
                            Route {r.routeNumber}
                          </span>
                          <span className="font-bold text-xs text-slate-900">{r.routeName}</span>
                        </div>
                        <span className="font-mono text-xs font-black text-rose-700">
                          {r.demandToCapacityRatio}% ratio
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[11px] bg-white p-3 rounded-xl border border-rose-100">
                        <div>
                          <span className="text-slate-400 font-semibold block uppercase text-[9px]">When to Augment:</span>
                          <strong className="text-slate-800">{r.augmentationDetails?.peakWindow || '08:00 - 10:30 & 17:00 - 19:30'}</strong>
                        </div>
                        <div>
                          <span className="text-slate-400 font-semibold block uppercase text-[9px]">Headway Adjustment:</span>
                          <strong className="text-rose-800">{r.augmentationDetails?.headwayAdjustment || 'Shorten to 7-8 min headway'}</strong>
                        </div>
                        <div>
                          <span className="text-slate-400 font-semibold block uppercase text-[9px]">Additional Trips:</span>
                          <strong className="text-indigo-700">+{r.augmentationDetails?.recommendedExtraTrips || 1} Extra Shuttle Trips</strong>
                        </div>
                        <div>
                          <span className="text-slate-400 font-semibold block uppercase text-[9px]">Relief Impact:</span>
                          <strong className="text-rose-700">{r.augmentationDetails?.reliefImpact || 'Clears queue backlog'}</strong>
                        </div>
                      </div>

                      <div className="text-[11px] text-slate-600 italic">
                        &quot;{r.recommendation}&quot;
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: DEMAND VS SUPPLY CHARTS */}
      {activeTab === 'comparison' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">
                1. Passenger Demand vs Available Capacity
              </h3>
              <p className="text-xs text-slate-500">
                Corridor passenger volume (Indigo) compared directly with bus capacity supply (Amber).
              </p>
            </div>

            <div className="space-y-4 pt-2">
              {routes.map(r => {
                const maxVal = Math.max(1, ...routes.map(x => Math.max(x.passengerDemand, x.totalAvailableCapacity)));
                const demandPct = (r.passengerDemand / maxVal) * 100;
                const capacityPct = (r.totalAvailableCapacity / maxVal) * 100;

                return (
                  <div key={r.routeId} className="space-y-1.5 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-slate-900 px-1.5 py-0.5 rounded bg-white border border-slate-200">
                          Route {r.routeNumber}
                        </span>
                        <span className="text-slate-600 truncate max-w-[180px]">{r.routeName}</span>
                      </div>
                      <span className="font-mono text-[11px] text-slate-500">
                        {r.passengerDemand} pax / {r.totalAvailableCapacity} cap
                      </span>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-[10px]">
                        <span className="w-12 text-indigo-700 font-bold shrink-0">Demand</span>
                        <div className="flex-1 bg-slate-200 h-3 rounded-full overflow-hidden">
                          <div
                            className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                            style={{ width: `${Math.max(4, demandPct)}%` }}
                          />
                        </div>
                        <span className="font-mono font-bold text-indigo-800 w-8 text-right shrink-0">
                          {r.passengerDemand}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-[10px]">
                        <span className="w-12 text-amber-700 font-bold shrink-0">Supply</span>
                        <div className="flex-1 bg-slate-200 h-3 rounded-full overflow-hidden">
                          <div
                            className="bg-amber-500 h-full rounded-full transition-all duration-500"
                            style={{ width: `${Math.max(4, capacityPct)}%` }}
                          />
                        </div>
                        <span className="font-mono font-bold text-amber-800 w-8 text-right shrink-0">
                          {r.totalAvailableCapacity}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">
                2. Route Utilisation Ratio (%) vs 100% Capacity Ceiling
              </h3>
              <p className="text-xs text-slate-500">
                Ratios breaking past 100% suffer passenger overcrowding and need extra bus trips.
              </p>
            </div>

            <div className="space-y-4 pt-2">
              {routes.map(r => {
                const ratio = r.demandToCapacityRatio || 0;
                const isOver = ratio > appliedCriticalThreshold;

                return (
                  <div key={r.routeId} className="space-y-1 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-900">
                        Route {r.routeNumber} ({r.corridor})
                      </span>
                      <span className={`font-mono font-black ${isOver ? 'text-rose-600' : 'text-slate-800'}`}>
                        {r.demandToCapacityRatio !== null ? `${r.demandToCapacityRatio}%` : 'No Trips'}
                      </span>
                    </div>

                    <div className="relative w-full bg-slate-200 h-4 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          ratio > appliedCriticalThreshold
                            ? 'bg-rose-600'
                            : ratio >= appliedHighThreshold
                            ? 'bg-amber-500'
                            : ratio >= appliedModerateThreshold
                            ? 'bg-blue-600'
                            : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.min(100, (ratio / 150) * 100)}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                      <span>0%</span>
                      <span className="text-amber-600 font-semibold">70% Monitor</span>
                      <span className="text-rose-600 font-bold">100% Ceiling</span>
                      <span>150%+</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: TIME-SLOT LOAD CURVE */}
      {activeTab === 'timeslots' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <div>
              <h3 className="text-base font-black text-slate-900">
                Time-Slot-wise Passenger Demand vs Supply Curve
              </h3>
              <p className="text-xs text-slate-500">
                Hourly and peak analysis across morning rush, midday lull, and evening traffic.
              </p>
            </div>
            <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded bg-blue-50 text-blue-700 border border-blue-200">
              Peak Slot: {summary?.peakDemandTimeSlot}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {timeSlots.map(slot => {
              const ratio = slot.ratio;
              return (
                <div
                  key={slot.timeSlotId}
                  className={`p-5 rounded-2xl border transition-all ${
                    slot.status === 'critical'
                      ? 'bg-rose-50/70 border-rose-300'
                      : slot.status === 'high'
                      ? 'bg-amber-50/70 border-amber-300'
                      : slot.status === 'moderate'
                      ? 'bg-blue-50/70 border-blue-300'
                      : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-xs text-slate-900">{slot.timeSlotLabel}</span>
                    {slot.isPeak && (
                      <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-200 uppercase">
                        Peak
                      </span>
                    )}
                  </div>

                  <div className="space-y-2 mt-3">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">Demand:</span>
                      <strong className="text-indigo-900 font-mono text-sm">{slot.passengerDemand} pax</strong>
                    </div>

                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">Supply:</span>
                      <strong className="text-amber-800 font-mono text-sm">{slot.availableCapacity} seats</strong>
                    </div>

                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">Trips:</span>
                      <strong className="text-slate-700 font-mono">{slot.tripsCount} trips</strong>
                    </div>

                    <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-semibold">Utilisation:</span>
                      <span
                        className={`font-mono font-black ${
                          ratio !== null && ratio > appliedCriticalThreshold
                            ? 'text-rose-700'
                            : ratio !== null && ratio >= appliedHighThreshold
                            ? 'text-amber-700'
                            : 'text-emerald-700'
                        }`}
                      >
                        {ratio !== null ? `${ratio}%` : 'N/A'}
                      </span>
                    </div>
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
