'use client';

import React from 'react';
import { Users, Ticket, Award, IndianRupee } from 'lucide-react';

interface CrowdDistributionChartProps {
  crowdDistribution: {
    empty: number;
    normal: number;
    crowded: number;
  };
  totalBuses: number;
  femaleFreeTickets: number;
  malePaidTickets: number;
  ticketRevenue: number;
}

export const CrowdDistributionChart: React.FC<CrowdDistributionChartProps> = ({
  crowdDistribution,
  totalBuses,
  femaleFreeTickets,
  malePaidTickets,
  ticketRevenue
}) => {
  const activeTotal = crowdDistribution.empty + crowdDistribution.normal + crowdDistribution.crowded || 1;
  const emptyPct = Math.round((crowdDistribution.empty / activeTotal) * 100);
  const normalPct = Math.round((crowdDistribution.normal / activeTotal) * 100);
  const crowdedPct = Math.round((crowdDistribution.crowded / activeTotal) * 100);

  const totalTickets = femaleFreeTickets + malePaidTickets || 1;
  const femalePct = Math.round((femaleFreeTickets / totalTickets) * 100);
  const malePct = Math.round((malePaidTickets / totalTickets) * 100);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      {/* Crowd Distribution */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-700">
              <Users className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm">Active Fleet Crowd Distribution</h3>
          </div>
          <span className="text-xs font-mono text-slate-500 font-medium">{activeTotal} Active Buses</span>
        </div>

        {/* Multi-segmented bar */}
        <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden flex mb-4 border border-slate-200">
          <div
            style={{ width: `${emptyPct}%` }}
            className="bg-emerald-500 transition-all duration-500"
            title={`Empty: ${crowdDistribution.empty} (${emptyPct}%)`}
          />
          <div
            style={{ width: `${normalPct}%` }}
            className="bg-amber-500 transition-all duration-500"
            title={`Normal: ${crowdDistribution.normal} (${normalPct}%)`}
          />
          <div
            style={{ width: `${crowdedPct}%` }}
            className="bg-rose-500 transition-all duration-500"
            title={`Overcrowded: ${crowdDistribution.crowded} (${crowdedPct}%)`}
          />
        </div>

        {/* Legend stats */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-emerald-50/70 p-2.5 rounded-xl border border-emerald-200">
            <div className="text-emerald-700 font-black text-lg">{crowdDistribution.empty}</div>
            <div className="text-[11px] font-bold text-emerald-800">Empty (0-30%)</div>
            <div className="text-[10px] text-slate-500 font-mono font-medium">{emptyPct}%</div>
          </div>
          <div className="bg-amber-50/70 p-2.5 rounded-xl border border-amber-200">
            <div className="text-amber-700 font-black text-lg">{crowdDistribution.normal}</div>
            <div className="text-[11px] font-bold text-amber-800">Normal (31-70%)</div>
            <div className="text-[10px] text-slate-500 font-mono font-medium">{normalPct}%</div>
          </div>
          <div className="bg-rose-50/70 p-2.5 rounded-xl border border-rose-200">
            <div className="text-rose-700 font-black text-lg">{crowdDistribution.crowded}</div>
            <div className="text-[11px] font-bold text-rose-800">Crowded (&gt;70%)</div>
            <div className="text-[10px] text-slate-500 font-mono font-medium">{crowdedPct}%</div>
          </div>
        </div>
      </div>

      {/* Ticket Gender & Revenue Distribution */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-pink-50 flex items-center justify-center text-pink-600">
              <Award className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm">Vidiyal Payanam vs Paid Revenue</h3>
          </div>
          <span className="text-xs font-mono text-emerald-700 font-bold">₹{ticketRevenue.toFixed(2)} Collected</span>
        </div>

        {/* Multi-segmented bar */}
        <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden flex mb-4 border border-slate-200">
          <div
            style={{ width: `${femalePct}%` }}
            className="bg-pink-500 transition-all duration-500"
            title={`Female Free Tickets: ${femaleFreeTickets} (${femalePct}%)`}
          />
          <div
            style={{ width: `${malePct}%` }}
            className="bg-blue-600 transition-all duration-500"
            title={`Male Paid Tickets: ${malePaidTickets} (${malePct}%)`}
          />
        </div>

        <div className="grid grid-cols-2 gap-3 text-center">
          <div className="bg-pink-50/70 p-3 rounded-xl border border-pink-200">
            <div className="text-pink-700 font-black text-lg">{femaleFreeTickets}</div>
            <div className="text-xs font-bold text-pink-800">Female Free Passes</div>
            <div className="text-[10px] text-slate-500 font-mono font-medium">{femalePct}% commuters (₹0 Fare)</div>
          </div>
          <div className="bg-blue-50/70 p-3 rounded-xl border border-blue-200">
            <div className="text-blue-700 font-black text-lg">{malePaidTickets}</div>
            <div className="text-xs font-bold text-blue-800">Male Paid Tickets</div>
            <div className="text-[10px] text-slate-500 font-mono font-medium">{malePct}% paid fare (₹{ticketRevenue.toFixed(0)})</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CrowdDistributionChart;
