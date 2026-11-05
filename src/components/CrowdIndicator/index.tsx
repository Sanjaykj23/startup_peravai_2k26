'use client';

import React from 'react';
import { getCrowdInfo, CrowdStatusCode } from '@/types';
import { Users, AlertTriangle, CheckCircle, ShieldAlert } from 'lucide-react';

interface CrowdIndicatorProps {
  occupancy: number;
  capacity: number;
  showBar?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const CrowdIndicator: React.FC<CrowdIndicatorProps> = ({
  occupancy,
  capacity,
  showBar = true,
  size = 'md',
  className = ''
}) => {
  const crowd = getCrowdInfo(occupancy, capacity);

  const getStatusIcon = (status: CrowdStatusCode) => {
    switch (status) {
      case 0:
        return <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />;
      case 1:
        return <Users className="w-3.5 h-3.5 text-amber-400" />;
      case 2:
        return <ShieldAlert className="w-3.5 h-3.5 text-rose-400 animate-pulse" />;
    }
  };

  const getStatusBg = (status: CrowdStatusCode) => {
    switch (status) {
      case 0:
        return 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400';
      case 1:
        return 'bg-amber-500/15 border-amber-500/30 text-amber-400';
      case 2:
        return 'bg-rose-500/15 border-rose-500/30 text-rose-400';
    }
  };

  const getBarColor = (status: CrowdStatusCode) => {
    switch (status) {
      case 0:
        return 'bg-emerald-500';
      case 1:
        return 'bg-amber-500';
      case 2:
        return 'bg-rose-500';
    }
  };

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <div className="flex items-center justify-between gap-2">
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getStatusBg(
            crowd.status
          )}`}
        >
          {getStatusIcon(crowd.status)}
          <span>{crowd.label}</span>
          <span className="opacity-70 font-mono text-[10px]">({crowd.percentage}%)</span>
        </span>
        <span className="text-xs text-slate-400 font-mono">
          {occupancy} / {capacity} seats
        </span>
      </div>

      {showBar && (
        <div className="w-full bg-slate-700/60 rounded-full h-1.5 overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ease-out ${getBarColor(crowd.status)}`}
            style={{ width: `${Math.min(100, crowd.percentage)}%` }}
          />
        </div>
      )}
    </div>
  );
};

export default CrowdIndicator;
