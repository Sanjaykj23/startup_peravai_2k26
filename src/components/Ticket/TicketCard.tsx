'use client';

import React from 'react';
import { Ticket } from '@/types';
import { Bus, CheckCircle2, GraduationCap, ShieldCheck, Ticket as TicketIcon } from 'lucide-react';

interface TicketCardProps {
  ticket: Ticket;
  compact?: boolean;
}

export const TicketCard: React.FC<TicketCardProps> = ({ ticket, compact = false }) => {
  const isFemaleFree = ticket.gender === 'Female';
  const isStudent = ticket.gender === 'Student';
  const isFree = isFemaleFree || isStudent;

  return (
    <div className="relative bg-white border-2 border-dashed border-blue-400 rounded-2xl p-5 shadow-xl text-slate-800 max-w-sm mx-auto overflow-hidden">
      {/* Top watermark / background stamp */}
      {isFemaleFree && (
        <div className="absolute -right-8 -top-8 w-32 h-32 bg-pink-50 rounded-full flex items-center justify-center pointer-events-none transform rotate-12 border border-pink-200">
          <span className="text-[10px] uppercase font-bold text-pink-700 tracking-widest text-center px-4">
            Vidiyal Payanam Free Pass
          </span>
        </div>
      )}
      {isStudent && (
        <div className="absolute -right-8 -top-8 w-32 h-32 bg-blue-50 rounded-full flex items-center justify-center pointer-events-none transform rotate-12 border border-blue-200">
          <span className="text-[10px] uppercase font-bold text-blue-700 tracking-widest text-center px-4">
            Student Free Bus Pass
          </span>
        </div>
      )}

      {/* Header */}
      <div className="text-center border-b border-slate-200 pb-3 mb-3">
        <div className="flex items-center justify-center gap-2 text-blue-900 font-black tracking-wide text-xs uppercase">
          <Bus className="w-4 h-4 text-blue-700" />
          <span>MTC CHENNAI &bull; CHENNAI ONE ETM</span>
        </div>
        <p className="text-[11px] text-slate-500 mt-0.5">Metropolitan Transport Corporation Ltd.</p>

        {isFemaleFree ? (
          <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-50 border border-pink-200 text-pink-700 text-xs font-bold shadow-2xs">
            <ShieldCheck className="w-3.5 h-3.5 text-pink-600" />
            <span>VIDIYAL PAYANAM (FREE COMMUTE)</span>
          </div>
        ) : isStudent ? (
          <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold shadow-2xs">
            <GraduationCap className="w-3.5 h-3.5 text-blue-600" />
            <span>STUDENT CONCESSION PASS (FREE COMMUTE)</span>
          </div>
        ) : (
          <div className="mt-2 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span>PAID TICKET - {ticket.payment_mode}</span>
          </div>
        )}
      </div>

      {/* Main Details */}
      <div className="space-y-2.5 text-xs">
        <div className="flex justify-between items-center py-1 border-b border-slate-100">
          <span className="text-slate-500 font-medium">Bus Number:</span>
          <span className="font-mono font-bold text-slate-900 text-sm">
            {ticket.bus_number || 'MTC BUS'}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 py-1 border-b border-slate-100">
          <div>
            <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">From</div>
            <div className="font-bold text-slate-800 truncate">{ticket.source_stop_name}</div>
          </div>
          <div className="text-right">
            <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">To</div>
            <div className="font-bold text-slate-800 truncate">{ticket.destination_stop_name}</div>
          </div>
        </div>

        <div className="flex justify-between items-center py-1 border-b border-slate-100">
          <span className="text-slate-500 font-medium">Passenger Category:</span>
          <span className="font-semibold text-slate-800">
            {isStudent ? 'Student Concession (₹0.00)' : ticket.gender}
            {ticket.student_id ? ` [ID: ${ticket.student_id}]` : ticket.passenger_phone ? ` (${ticket.passenger_phone})` : ''}
          </span>
        </div>

        {ticket.institution_name && (
          <div className="flex justify-between items-center py-1 border-b border-slate-100">
            <span className="text-slate-500 font-medium">Institution:</span>
            <span className="font-semibold text-blue-700 truncate max-w-[200px]">
              {ticket.institution_name}
            </span>
          </div>
        )}

        <div className="flex justify-between items-center py-1 border-b border-slate-100">
          <span className="text-slate-500 font-medium">Booked Via:</span>
          <span className="capitalize px-2 py-0.5 rounded bg-slate-100 text-[11px] font-semibold text-slate-700 border border-slate-200">
            {ticket.booked_by} Portal
          </span>
        </div>

        {/* Fare Section */}
        <div className="bg-slate-50 rounded-xl p-3 flex items-center justify-between mt-3 border border-slate-200">
          <div>
            <div className="text-[10px] text-slate-500 uppercase font-bold">Total Fare</div>
            <div className="text-xs text-slate-600 font-medium">{ticket.payment_mode} Mode</div>
          </div>
          <div className="text-right">
            <div className={`text-xl font-black font-mono ${isFemaleFree ? 'text-pink-600' : isStudent ? 'text-blue-700' : 'text-emerald-700'}`}>
              ₹{Number(ticket.fare).toFixed(2)}
            </div>
            {isFemaleFree && <span className="text-[10px] text-pink-600 font-bold">100% TN Gov. Subsidy</span>}
            {isStudent && <span className="text-[10px] text-blue-600 font-bold">100% Student Concession</span>}
          </div>
        </div>
      </div>

      {/* Barcode & Footer */}
      <div className="mt-4 pt-3 border-t border-dashed border-slate-200 text-center">
        <div className="font-mono text-[9px] text-slate-500 tracking-wider mb-2 font-medium">
          TKT: {ticket.id.toUpperCase().slice(0, 18)}
        </div>

        {/* Simulated Barcode */}
        <div className="flex justify-center items-center gap-[2px] h-8 bg-slate-50 border border-slate-200 p-1 rounded">
          {Array.from({ length: 32 }).map((_, i) => (
            <div
              key={i}
              className={`h-full bg-slate-900 ${i % 3 === 0 ? 'w-1' : i % 2 === 0 ? 'w-0.5' : 'w-1.5'}`}
            />
          ))}
        </div>

        <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500 font-mono font-medium" suppressHydrationWarning>
          <span suppressHydrationWarning>{new Date(ticket.created_at).toLocaleTimeString('en-IN')}</span>
          <span suppressHydrationWarning>{new Date(ticket.created_at).toLocaleDateString('en-IN')}</span>
        </div>
      </div>
    </div>
  );
};

export default TicketCard;
