'use client';

import React from 'react';
import { Ticket } from '@/types';
import { Bus, CheckCircle2, QrCode, ShieldCheck, Ticket as TicketIcon } from 'lucide-react';

interface TicketCardProps {
  ticket: Ticket;
  compact?: boolean;
}

export const TicketCard: React.FC<TicketCardProps> = ({ ticket, compact = false }) => {
  const isFemaleFree = ticket.gender === 'Female';

  return (
    <div className="relative bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border-2 border-dashed border-amber-500/40 rounded-2xl p-5 shadow-2xl text-slate-100 max-w-sm mx-auto overflow-hidden">
      {/* Top watermark / background stamp */}
      {isFemaleFree && (
        <div className="absolute -right-8 -top-8 w-32 h-32 bg-pink-500/10 rounded-full flex items-center justify-center pointer-events-none transform rotate-12 border border-pink-500/20">
          <span className="text-[10px] uppercase font-bold text-pink-400 tracking-widest text-center px-4">
            Vidiyal Payanam Free Pass
          </span>
        </div>
      )}

      {/* Header */}
      <div className="text-center border-b border-slate-700/80 pb-3 mb-3">
        <div className="flex items-center justify-center gap-2 text-amber-400 font-black tracking-wide text-xs uppercase">
          <Bus className="w-4 h-4" />
          <span>MTC CHENNAI - ETM TICKET</span>
        </div>
        <p className="text-[11px] text-slate-400 mt-0.5">Metropolitan Transport Corporation Ltd.</p>

        {isFemaleFree ? (
          <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-500/20 border border-pink-500/40 text-pink-300 text-xs font-bold animate-pulse">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>VIDIYAL PAYANAM (FREE TICKET)</span>
          </div>
        ) : (
          <div className="mt-2 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
            <CheckCircle2 className="w-3 h-3" />
            <span>PAID TICKET - {ticket.payment_mode}</span>
          </div>
        )}
      </div>

      {/* Main Details */}
      <div className="space-y-2.5 text-xs">
        <div className="flex justify-between items-center py-1 border-b border-slate-800">
          <span className="text-slate-400">Bus Number:</span>
          <span className="font-mono font-bold text-amber-300 text-sm">
            {ticket.bus_number || 'MTC BUS'}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 py-1 border-b border-slate-800">
          <div>
            <div className="text-[10px] text-slate-400 uppercase tracking-wider">From</div>
            <div className="font-semibold text-slate-100 truncate">{ticket.source_stop_name}</div>
          </div>
          <div className="text-right">
            <div className="text-[10px] text-slate-400 uppercase tracking-wider">To</div>
            <div className="font-semibold text-slate-100 truncate">{ticket.destination_stop_name}</div>
          </div>
        </div>

        <div className="flex justify-between items-center py-1 border-b border-slate-800">
          <span className="text-slate-400">Passenger / Gender:</span>
          <span className="font-medium text-slate-200">
            {ticket.gender} {ticket.passenger_phone ? `(${ticket.passenger_phone})` : ''}
          </span>
        </div>

        <div className="flex justify-between items-center py-1 border-b border-slate-800">
          <span className="text-slate-400">Booked Via:</span>
          <span className="capitalize px-2 py-0.5 rounded bg-slate-800 text-[11px] font-medium text-slate-300">
            {ticket.booked_by} App
          </span>
        </div>

        {/* Fare Section */}
        <div className="bg-slate-800/60 rounded-xl p-3 flex items-center justify-between mt-3 border border-slate-700/50">
          <div>
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Total Fare</div>
            <div className="text-xs text-slate-400">{ticket.payment_mode} Mode</div>
          </div>
          <div className="text-right">
            <div className={`text-xl font-black font-mono ${isFemaleFree ? 'text-pink-400' : 'text-emerald-400'}`}>
              ₹{Number(ticket.fare).toFixed(2)}
            </div>
            {isFemaleFree && <span className="text-[10px] text-pink-400 font-semibold">100% Gov. Subsidy</span>}
          </div>
        </div>
      </div>

      {/* Barcode & Footer */}
      <div className="mt-4 pt-3 border-t border-dashed border-slate-700/80 text-center">
        <div className="font-mono text-[9px] text-slate-500 tracking-wider mb-2">
          TKT: {ticket.id.toUpperCase().slice(0, 18)}
        </div>

        {/* Simulated Barcode */}
        <div className="flex justify-center items-center gap-[2px] h-8 bg-white/90 p-1 rounded">
          {Array.from({ length: 32 }).map((_, i) => (
            <div
              key={i}
              className={`h-full bg-black ${i % 3 === 0 ? 'w-1' : i % 2 === 0 ? 'w-0.5' : 'w-1.5'}`}
            />
          ))}
        </div>

        <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500 font-mono" suppressHydrationWarning>
          <span suppressHydrationWarning>{new Date(ticket.created_at).toLocaleTimeString('en-IN')}</span>
          <span suppressHydrationWarning>{new Date(ticket.created_at).toLocaleDateString('en-IN')}</span>
        </div>
      </div>
    </div>
  );
};

export default TicketCard;
