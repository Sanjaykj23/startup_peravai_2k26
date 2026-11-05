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
      <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400">
              <Users className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-slate-100 text-sm">Active Fleet Crowd Distribution</h3>
          </div>
          <span className="text-xs font-mono text-slate-400">{activeTotal} Active Buses</span>
        </div>

        {/* Multi-segmented bar */}
        <div className="w-full h-4 bg-slate-900 rounded-full overflow-hidden flex mb-4 border border-slate-700">
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
          <div className="bg-slate-900/60 p-2.5 rounded-xl border border-emerald-500/20">
            <div className="text-emerald-400 font-black text-lg">{crowdDistribution.empty}</div>
            <div className="text-[11px] font-semibold text-emerald-300">Empty (0-30%)</div>
            <div className="text-[10px] text-slate-400 font-mono">{emptyPct}%</div>
          </div>
          <div className="bg-slate-900/60 p-2.5 rounded-xl border border-amber-500/20">
            <div className="text-amber-400 font-black text-lg">{crowdDistribution.normal}</div>
            <div className="text-[11px] font-semibold text-amber-300">Normal (31-70%)</div>
            <div className="text-[10px] text-slate-400 font-mono">{normalPct}%</div>
          </div>
          <div className="bg-slate-900/60 p-2.5 rounded-xl border border-rose-500/20">
            <div className="text-rose-400 font-black text-lg">{crowdDistribution.crowded}</div>
            <div className="text-[11px] font-semibold text-rose-300">Crowded (&gt;70%)</div>
            <div className="text-[10px] text-slate-400 font-mono">{crowdedPct}%</div>
          </div>
        </div>
      </div>

      {/* Ticket Gender & Revenue Distribution */}
      <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-pink-500/10 flex items-center justify-center text-pink-400">
              <Award className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-slate-100 text-sm">Vidiyal Payanam vs Paid Revenue</h3>
          </div>
          <span className="text-xs font-mono text-emerald-400 font-bold">₹{ticketRevenue.toFixed(2)} Collected</span>
        </div>

        {/* Multi-segmented bar */}
        <div className="w-full h-4 bg-slate-900 rounded-full overflow-hidden flex mb-4 border border-slate-700">
          <div
            style={{ width: `${femalePct}%` }}
            className="bg-pink-500 transition-all duration-500"
            title={`Female Free Tickets: ${femaleFreeTickets} (${femalePct}%)`}
          />
          <div
            style={{ width: `${malePct}%` }}
            className="bg-blue-500 transition-all duration-500"
            title={`Male Paid Tickets: ${malePaidTickets} (${malePct}%)`}
          />
        </div>

        <div className="grid grid-cols-2 gap-3 text-center">
          <div className="bg-slate-900/60 p-3 rounded-xl border border-pink-500/20">
            <div className="text-pink-400 font-black text-lg">{femaleFreeTickets}</div>
            <div className="text-xs font-semibold text-pink-300">Female Free Passes</div>
            <div className="text-[10px] text-slate-400 font-mono">{femalePct}% of commuters (₹0 Fare)</div>
          </div>
          <div className="bg-slate-900/60 p-3 rounded-xl border border-blue-500/20">
            <div className="text-blue-400 font-black text-lg">{malePaidTickets}</div>
            <div className="text-xs font-semibold text-blue-300">Male Paid Tickets</div>
            <div className="text-[10px] text-slate-400 font-mono">{malePct}% paid fare (₹{ticketRevenue.toFixed(0)})</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CrowdDistributionChart;
