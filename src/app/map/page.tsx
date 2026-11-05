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
    // Auto refresh every 15 seconds
    const interval = setInterval(fetchBuses, 15000);
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
    <div className="flex flex-col lg:flex-row h-[calc(100vh-4rem)] overflow-hidden bg-slate-950">
      {/* Sidebar Controls & Bus List */}
      <div className="w-full lg:w-96 bg-slate-900 border-r border-slate-800 flex flex-col h-full z-10">
        <div className="p-4 border-b border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-base font-black text-white flex items-center gap-2">
                <Bus className="w-5 h-5 text-amber-400" />
                <span>Chennai Live Fleet</span>
              </h1>
              <p className="text-[11px] text-slate-400">
                Updated {lastUpdated.toLocaleTimeString('en-IN')}
              </p>
            </div>
            <button
              onClick={fetchBuses}
              disabled={isRefreshing}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
              title="Refresh buses"
            >
              <RefreshCw className={`w-4 h-4 text-amber-400 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Search box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search bus number, route or stop..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Filters */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <label className="text-[10px] text-slate-400 block mb-1">Route</label>
              <select
                value={filterRoute}
                onChange={e => setFilterRoute(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-1.5 text-xs text-slate-200"
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
              <label className="text-[10px] text-slate-400 block mb-1">Crowd Status</label>
              <select
                value={filterCrowd}
                onChange={e => setFilterCrowd(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-1.5 text-xs text-slate-200"
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
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filteredBuses.length === 0 ? (
            <div className="text-center py-10 text-slate-500 text-xs">
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
                      ? 'bg-amber-500/10 border-amber-500 shadow-md'
                      : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sm text-white">
                        {bus.bus_number}
                      </span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-300">
                        {bus.route_number}
                      </span>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${crowd.badgeClass}`}
                    >
                      {crowd.label}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-400 truncate mb-2">{bus.route_name}</p>

                  <CrowdIndicator
                    occupancy={bus.current_occupancy}
                    capacity={bus.capacity}
                    showBar={true}
                    size="sm"
                  />

                  <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500 pt-1.5 border-t border-slate-800">
                    <span className="flex items-center gap-1 truncate">
                      <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="truncate">
                        {bus.current_trip?.current_stop_name || 'Terminal'}
                      </span>
                    </span>
                    <span className="font-mono text-amber-400 font-semibold">
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
          onBusSelect={bus => setSelectedBusId(bus.id)}
          className="w-full h-full"
        />
      </div>
    </div>
  );
}
