import React from 'react';
import { History, Activity, Radio, Clock, User, ArrowRight, MapPin } from 'lucide-react';
import { StatusLogEntry } from '../types/tool';
import { StatusBadge } from './StatusBadge';

interface LiveActivityFeedProps {
  logs: StatusLogEntry[];
  isSimulating: boolean;
}

export const LiveActivityFeed: React.FC<LiveActivityFeedProps> = ({ logs, isSimulating }) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-amber-400" />
          <h2 className="text-sm font-bold text-white tracking-wide">
            Real-Time Activity &amp; Status Transition Stream
          </h2>
        </div>

        {isSimulating ? (
          <span className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Live Polling Active (6s)
          </span>
        ) : (
          <span className="text-[11px] text-slate-500">Live feed idle</span>
        )}
      </div>

      <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
        {logs.map((log) => {
          const formattedTime = new Date(log.timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          });

          return (
            <div
              key={log.id}
              className="p-3 bg-slate-950/80 rounded-xl border border-slate-800/80 hover:border-slate-700 transition-all text-xs space-y-2"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded text-[10px]">
                    {log.toolId}
                  </span>
                  <span className="font-semibold text-white truncate max-w-[200px]" title={log.toolName}>
                    {log.toolName}
                  </span>
                </div>
                <span className="text-[10px] font-mono text-slate-500 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-600" />
                  {formattedTime}
                </span>
              </div>

              {/* Transition badges */}
              <div className="flex items-center gap-2 text-[11px]">
                <span className="text-slate-400 font-medium">{log.previousStatus}</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-600" />
                <StatusBadge status={log.newStatus} size="sm" />
              </div>

              {/* Reason */}
              <p className="text-slate-300 text-[11px] leading-relaxed bg-slate-900/60 p-2 rounded-lg border border-slate-800/60">
                {log.reason}
              </p>

              {/* Sub-meta */}
              <div className="flex items-center justify-between text-[10px] text-slate-500 pt-0.5">
                <span className="flex items-center gap-1">
                  <User className="w-3 h-3 text-slate-600" />
                  {log.updatedBy}
                </span>
                {log.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-slate-600" />
                    {log.location}
                  </span>
                )}
              </div>
            </div>
          );
        })}

        {logs.length === 0 && (
          <div className="p-8 text-center text-slate-500 text-xs italic">
            No status transition logs yet.
          </div>
        )}
      </div>
    </div>
  );
};
