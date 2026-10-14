import React from 'react';
import {
  CheckCircle2,
  Gauge,
  Wrench,
  AlertOctagon,
  Percent,
  Flame,
  ArrowRight
} from 'lucide-react';
import { Tool, ToolStatus } from '../types/tool';

interface MetricsOverviewProps {
  tools: Tool[];
  activeStatusFilter: ToolStatus | 'ALL' | 'HIGH_WEAR';
  onSelectStatusFilter: (status: ToolStatus | 'ALL' | 'HIGH_WEAR') => void;
}

export const MetricsOverview: React.FC<MetricsOverviewProps> = ({
  tools,
  activeStatusFilter,
  onSelectStatusFilter,
}) => {
  const total = tools.length;
  const available = tools.filter((t) => t.status === 'Available').length;
  const inUse = tools.filter((t) => t.status === 'In Use').length;
  const maintenance = tools.filter((t) => t.status === 'Maintenance').length;
  const offline = tools.filter((t) => t.status === 'Offline').length;

  const highWearCount = tools.filter((t) => t.wearPercent >= 80).length;
  const utilizationPercent = total > 0 ? Math.round((inUse / total) * 100) : 0;

  return (
    <div className="space-y-3">
      {/* 4 Core Status Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Available Card */}
        <button
          onClick={() => onSelectStatusFilter(activeStatusFilter === 'Available' ? 'ALL' : 'Available')}
          className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden group cursor-pointer ${
            activeStatusFilter === 'Available'
              ? 'bg-emerald-950/40 border-emerald-500/80 ring-2 ring-emerald-500/20'
              : 'bg-slate-900/80 border-slate-800 hover:border-emerald-500/40 hover:bg-slate-900'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Available
            </span>
            <span className="text-[11px] font-mono text-slate-500">
              {total > 0 ? Math.round((available / total) * 100) : 0}% of fleet
            </span>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white tracking-tight">{available}</span>
            <span className="text-xs text-slate-400">Ready in Cribs</span>
          </div>
          <div className="mt-3 w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-emerald-400 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${total > 0 ? (available / total) * 100 : 0}%` }}
            />
          </div>
        </button>

        {/* In Use Card */}
        <button
          onClick={() => onSelectStatusFilter(activeStatusFilter === 'In Use' ? 'ALL' : 'In Use')}
          className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden group cursor-pointer ${
            activeStatusFilter === 'In Use'
              ? 'bg-cyan-950/40 border-cyan-500/80 ring-2 ring-cyan-500/20'
              : 'bg-slate-900/80 border-slate-800 hover:border-cyan-500/40 hover:bg-slate-900'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              In Use
            </span>
            <span className="text-[11px] font-mono text-slate-500">
              {total > 0 ? Math.round((inUse / total) * 100) : 0}% of fleet
            </span>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white tracking-tight">{inUse}</span>
            <span className="text-xs text-slate-400">Mounted on Cell</span>
          </div>
          <div className="mt-3 w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-cyan-400 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${total > 0 ? (inUse / total) * 100 : 0}%` }}
            />
          </div>
        </button>

        {/* Maintenance Card */}
        <button
          onClick={() => onSelectStatusFilter(activeStatusFilter === 'Maintenance' ? 'ALL' : 'Maintenance')}
          className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden group cursor-pointer ${
            activeStatusFilter === 'Maintenance'
              ? 'bg-amber-950/40 border-amber-500/80 ring-2 ring-amber-500/20'
              : 'bg-slate-900/80 border-slate-800 hover:border-amber-500/40 hover:bg-slate-900'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              Maintenance
            </span>
            <span className="text-[11px] font-mono text-slate-500">
              {total > 0 ? Math.round((maintenance / total) * 100) : 0}% of fleet
            </span>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white tracking-tight">{maintenance}</span>
            <span className="text-xs text-slate-400">Regrind / Calib</span>
          </div>
          <div className="mt-3 w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-amber-400 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${total > 0 ? (maintenance / total) * 100 : 0}%` }}
            />
          </div>
        </button>

        {/* Offline Card */}
        <button
          onClick={() => onSelectStatusFilter(activeStatusFilter === 'Offline' ? 'ALL' : 'Offline')}
          className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden group cursor-pointer ${
            activeStatusFilter === 'Offline'
              ? 'bg-rose-950/40 border-rose-500/80 ring-2 ring-rose-500/20'
              : 'bg-slate-900/80 border-slate-800 hover:border-rose-500/40 hover:bg-slate-900'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              Offline
            </span>
            <span className="text-[11px] font-mono text-slate-500">
              {total > 0 ? Math.round((offline / total) * 100) : 0}% of fleet
            </span>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white tracking-tight">{offline}</span>
            <span className="text-xs text-slate-400">Quarantine / Scrap</span>
          </div>
          <div className="mt-3 w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-rose-500 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${total > 0 ? (offline / total) * 100 : 0}%` }}
            />
          </div>
        </button>
      </div>

      {/* Secondary Bar: Fleet Utilization & Critical Wear Alert Banner */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl px-4 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-4 text-slate-300">
          <div className="flex items-center gap-2">
            <Gauge className="w-4 h-4 text-cyan-400" />
            <span>Floor Utilization:</span>
            <strong className="text-white font-mono">{utilizationPercent}%</strong>
          </div>
          <span className="text-slate-700">|</span>
          <div className="text-slate-400">
            Total Inventory: <strong className="text-white font-mono">{total}</strong> Registered Tools
          </div>
        </div>

        {highWearCount > 0 && (
          <button
            onClick={() => onSelectStatusFilter(activeStatusFilter === 'HIGH_WEAR' ? 'ALL' : 'HIGH_WEAR')}
            className={`flex items-center gap-2 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
              activeStatusFilter === 'HIGH_WEAR'
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30'
            }`}
          >
            <Flame className="w-3.5 h-3.5 animate-pulse" />
            <span>{highWearCount} tools nearing wear limit (≥80%)</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  );
};
