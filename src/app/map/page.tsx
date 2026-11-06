'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { Bus as BusType, getCrowdInfo } from '@/types';
import { Bus, Filter, RefreshCw, Layers, MapPin, Radio, Search } from 'lucide-react';
import CrowdIndicator from '@/components/CrowdIndicator';

// Dynamically import Leaflet map to prevent SSR issues
const ChennaiLiveMap = dynamic(() => import('@/components/Map/ChennaiLiveMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[600px] flex items-center justify-center bg-slate-950 text-slate-400">
      <div className="flex flex-col items-center gap-3">
        <RefreshCw className="w-8 h-8 animate-spin text-amber-400" />
        <span className="text-sm font-semibold">Loading Chennai Live Map...</span>
      </div>
    </div>
  )
});

export default function MapPage() {
  const [buses, setBuses] = useState<BusType[]>([]);
  const [selectedBusId, setSelectedBusId] = useState<string | null>(null);
  const [filterRoute, setFilterRoute] = useState<string>('all');
  const [filterCrowd, setFilterCrowd] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchBuses = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch('/api/buses');
      const data = await res.json();
      if (data.buses) {
        setBuses(data.buses);
        setLastUpdated(new Date());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchBuses();
    // Auto refresh every 3 seconds for live parallel sync across tabs
    const interval = setInterval(fetchBuses, 3000);
    return () => clearInterval(interval);
  }, []);

  // Filter logic
  const filteredBuses = buses.filter(bus => {
    if (filterRoute !== 'all' && bus.route_number !== filterRoute) return false;
    if (filterCrowd !== 'all' && bus.crowd_status.toString() !== filterCrowd) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        bus.bus_number.toLowerCase().includes(q) ||
        bus.route_name.toLowerCase().includes(q) ||
        bus.route_number.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const routes = Array.from(new Set(buses.map(b => b.route_number)));

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-4rem)] overflow-hidden bg-slate-100">
      {/* Sidebar Controls & Bus List */}
      <div className="w-full lg:w-96 bg-white border-r border-slate-200 flex flex-col h-full z-10 shadow-xs">
        <div className="p-4 border-b border-slate-200 space-y-3 bg-slate-50/70">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Bus className="w-5 h-5 text-blue-700" />
                <span>Chennai Live Fleet</span>
              </h1>
              <p className="text-[11px] text-slate-500" suppressHydrationWarning>
                Updated {mounted ? lastUpdated.toLocaleTimeString('en-IN') : 'Live'} &bull; <span className="text-emerald-700 font-semibold">Live Sync (3s)</span>
              </p>
            </div>
            <button
              onClick={fetchBuses}
              disabled={isRefreshing}
              className="p-2 rounded-xl bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 transition-colors shadow-2xs"
              title="Refresh buses"
            >
              <RefreshCw className={`w-4 h-4 text-blue-600 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Search box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search bus number, route or stop..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 shadow-2xs"
            />
          </div>

          {/* Filters */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <label className="text-[10px] text-slate-500 font-semibold block mb-1">Route</label>
              <select
                value={filterRoute}
                onChange={e => setFilterRoute(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-xs text-slate-700 shadow-2xs"
              >
                <option value="all">All Routes</option>
                {routes.map(r => (
                  <option key={r} value={r}>
                    Route {r}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] text-slate-500 font-semibold block mb-1">Crowd Status</label>
              <select
                value={filterCrowd}
                onChange={e => setFilterCrowd(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-xs text-slate-700 shadow-2xs"
              >
                <option value="all">All Crowd Levels</option>
                <option value="0">Empty (0-30%)</option>
                <option value="1">Normal (31-70%)</option>
                <option value="2">Crowded (&gt;70%)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Bus List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/30">
          {filteredBuses.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-xs">
              No buses matching filter criteria
            </div>
          ) : (
            filteredBuses.map(bus => {
              const isSelected = selectedBusId === bus.id;
              const crowd = getCrowdInfo(bus.current_occupancy, bus.capacity);

              return (
                <div
                  key={bus.id}
                  onClick={() => setSelectedBusId(bus.id)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-blue-50/80 border-blue-500 shadow-sm ring-1 ring-blue-500/20'
                      : 'bg-white border-slate-200 hover:border-blue-300 hover:bg-slate-50/70 shadow-2xs'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sm text-slate-900">
                        {bus.bus_number}
                      </span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                        {bus.route_number}
                      </span>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${crowd.badgeClass}`}
                    >
                      {crowd.label}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-600 truncate mb-2">{bus.route_name}</p>

                  <CrowdIndicator
                    occupancy={bus.current_occupancy}
                    capacity={bus.capacity}
                    showBar={true}
                    size="sm"
                  />

                  <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500 pt-1.5 border-t border-slate-100">
                    <span className="flex items-center gap-1 truncate">
                      <MapPin className="w-3 h-3 text-emerald-600 shrink-0" />
                      <span className="truncate text-slate-700 font-medium">
                        {bus.current_trip?.current_stop_name || 'Terminal'}
                      </span>
                    </span>
                    <span className="font-mono text-emerald-700 font-bold">
                      {bus.status === 'active' ? '● Live' : 'Idle'}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Map View */}
      <div className="flex-1 h-full relative">
        <ChennaiLiveMap
          buses={filteredBuses}
          selectedBusId={selectedBusId}
          onBusSelect={bus => setSelectedBusId(bus ? bus.id : null)}
          className="w-full h-full"
        />
      </div>
    </div>
  );
}
