import React, { useState, useEffect } from 'react';
import {
  Wrench,
  Activity,
  Play,
  Square,
  Plus,
  Download,
  RotateCcw,
  Clock,
  Sparkles,
  Radio,
  FileSpreadsheet
} from 'lucide-react';
import { Tool } from '../types/tool';

interface HeaderProps {
  tools: Tool[];
  isSimulating: boolean;
  onToggleSimulation: () => void;
  onTriggerPing: () => void;
  onOpenAddModal: () => void;
  onExportCSV: () => void;
  onResetData: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  tools,
  isSimulating,
  onToggleSimulation,
  onTriggerPing,
  onOpenAddModal,
  onExportCSV,
  onResetData,
}) => {
  const [time, setTime] = useState<string>('');

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString('en-US', {
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
    };
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, []);

  const availableCount = tools.filter((t) => t.status === 'Available').length;
  const inUseCount = tools.filter((t) => t.status === 'In Use').length;
  const maintCount = tools.filter((t) => t.status === 'Maintenance').length;
  const offlineCount = tools.filter((t) => t.status === 'Offline').length;

  return (
    <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Logo & Subtitle */}
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-slate-950 shadow-lg shadow-amber-500/20 font-black">
              <Wrench className="w-5 h-5 text-slate-950 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
                  TOOLTRACK
                  <span className="text-[10px] font-mono uppercase tracking-widest px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                    RT-MES v3.4
                  </span>
                </h1>
                {isSimulating && (
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[11px] font-semibold text-emerald-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    LIVE TELEMETRY
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                Real-Time Tooling Management, Dynamic Status Monitoring &amp; Life Cycle Tracking
              </p>
            </div>
          </div>

          {/* Quick status summary ticker & Clock */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs">
            <div className="hidden lg:flex items-center gap-1.5 bg-slate-950/60 border border-slate-800 px-3 py-1.5 rounded-lg text-slate-300 font-mono">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>{time} UTC</span>
            </div>

            {/* Simulation Controller */}
            <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800">
              <button
                onClick={onToggleSimulation}
                title={isSimulating ? 'Pause dynamic simulation' : 'Start live shopfloor simulation'}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all ${
                  isSimulating
                    ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-500/20'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {isSimulating ? (
                  <>
                    <Radio className="w-3.5 h-3.5 animate-pulse" />
                    <span>Sim Active</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5" />
                    <span>Auto Sim</span>
                  </>
                )}
              </button>

              <button
                onClick={onTriggerPing}
                title="Trigger a simulated status change right now"
                className="px-2.5 py-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-slate-800 font-medium transition-colors flex items-center gap-1"
              >
                <Activity className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sim Ping</span>
              </button>
            </div>

            {/* Action Buttons */}
            <button
              onClick={onOpenAddModal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition-colors shadow-sm shadow-amber-500/10 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Add Tool</span>
            </button>

            <button
              onClick={onExportCSV}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
              title="Export tools report to CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export</span>
            </button>

            <button
              onClick={onResetData}
              className="p-1.5 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
              title="Reset inventory to default sample data"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
