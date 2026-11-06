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
    <div className="bg-white hover:bg-slate-50/70 border border-slate-200 hover:border-blue-400 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-300">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700 font-bold shadow-2xs">
            <BusIcon className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-lg font-black text-slate-900">
                {bus.bus_number}
              </span>
              <span className="px-2 py-0.5 rounded text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                Route {bus.route_number}
              </span>
            </div>
            <p className="text-xs text-slate-600 font-medium line-clamp-1 mt-0.5">
              {bus.route_name}
            </p>
          </div>
        </div>

        {bus.distance_km !== undefined && (
          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 font-mono">
            <Navigation className="w-3 h-3 text-blue-600" />
            {bus.distance_km} km
          </span>
        )}
      </div>

      {/* Crowd Indicator */}
      <div className="mt-3 bg-slate-50 p-3 rounded-xl border border-slate-200/80">
        <CrowdIndicator
          occupancy={bus.current_occupancy}
          capacity={bus.capacity}
          showBar={true}
        />
      </div>

      {/* Meta info */}
      <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-100 text-xs text-slate-500">
        <div className="flex items-center gap-1.5 truncate">
          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="truncate font-medium text-slate-700">
            {bus.current_trip?.current_stop_name || 'Terminal'}
          </span>
        </div>
        <div className="flex items-center gap-1.5 truncate justify-end">
          <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="truncate text-slate-600">{bus.conductor_name || 'Conductor on Duty'}</span>
        </div>
      </div>

      {/* Action buttons */}
      <div className="mt-4 flex items-center gap-2">
        <Link
          href={`/map?bus=${bus.id}`}
          className="flex-1 py-2 px-3 text-center text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 transition-colors flex items-center justify-center gap-1"
        >
          <Navigation className="w-3.5 h-3.5 text-slate-600" />
          Track on Map
        </Link>
        {showBookButton && onBookClick && (
          <button
            onClick={() => onBookClick(bus)}
            className="flex-1 py-2 px-3 text-center text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-colors flex items-center justify-center gap-1 shadow-sm"
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
