'use client';

import React from 'react';
import { Bus } from '@/types';
import CrowdIndicator from '@/components/CrowdIndicator';
import { Bus as BusIcon, MapPin, Navigation, User, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface BusCardProps {
  bus: Bus;
  onBookClick?: (bus: Bus) => void;
  showBookButton?: boolean;
}

export const BusCard: React.FC<BusCardProps> = ({
  bus,
  onBookClick,
  showBookButton = true
}) => {
  return (
    <div className="bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 hover:border-amber-500/50 rounded-2xl p-5 shadow-lg transition-all duration-300">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold">
            <BusIcon className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-lg font-black text-amber-400">
                {bus.bus_number}
              </span>
              <span className="px-2 py-0.5 rounded text-xs font-bold bg-blue-600/20 text-blue-400 border border-blue-500/30">
                Route {bus.route_number}
              </span>
            </div>
            <p className="text-xs text-slate-300 font-medium line-clamp-1 mt-0.5">
              {bus.route_name}
            </p>
          </div>
        </div>

        {bus.distance_km !== undefined && (
          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 font-mono">
            <Navigation className="w-3 h-3 text-amber-400" />
            {bus.distance_km} km
          </span>
        )}
      </div>

      {/* Crowd Indicator */}
      <div className="mt-3 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
        <CrowdIndicator
          occupancy={bus.current_occupancy}
          capacity={bus.capacity}
          showBar={true}
        />
      </div>

      {/* Meta info */}
      <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-700/60 text-xs text-slate-400">
        <div className="flex items-center gap-1.5 truncate">
          <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <span className="truncate">
            {bus.current_trip?.current_stop_name || 'Terminal'}
          </span>
        </div>
        <div className="flex items-center gap-1.5 truncate justify-end">
          <User className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <span className="truncate">{bus.conductor_name || 'Conductor on Duty'}</span>
        </div>
      </div>

      {/* Action buttons */}
      <div className="mt-4 flex items-center gap-2">
        <Link
          href={`/map?bus=${bus.id}`}
          className="flex-1 py-2 px-3 text-center text-xs font-semibold rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 transition-colors flex items-center justify-center gap-1"
        >
          <Navigation className="w-3.5 h-3.5" />
          Track on Map
        </Link>
        {showBookButton && onBookClick && (
          <button
            onClick={() => onBookClick(bus)}
            className="flex-1 py-2 px-3 text-center text-xs font-semibold rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition-colors flex items-center justify-center gap-1 shadow-md shadow-amber-500/20"
          >
            Book Ticket
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};

export default BusCard;
