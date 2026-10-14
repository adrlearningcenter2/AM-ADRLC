import React from 'react';
import {
  X,
  SlidersHorizontal,
  MapPin,
  User,
  Clock,
  Wrench,
  Calendar,
  ShieldCheck,
  QrCode,
  History,
  AlertTriangle,
  Layers,
  Sparkles
} from 'lucide-react';
import { Tool, StatusLogEntry } from '../types/tool';
import { StatusBadge } from './StatusBadge';

interface ToolDetailModalProps {
  tool: Tool | null;
  logs: StatusLogEntry[];
  isOpen: boolean;
  onClose: () => void;
  onOpenStatusModal: (tool: Tool) => void;
}

export const ToolDetailModal: React.FC<ToolDetailModalProps> = ({
  tool,
  logs,
  isOpen,
  onClose,
  onOpenStatusModal,
}) => {
  if (!isOpen || !tool) return null;

  const toolLogs = logs.filter((l) => l.toolId === tool.id);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="relative max-w-2xl w-full bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 font-bold">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-amber-400">
                  {tool.id}
                </span>
                <span className="text-xs text-slate-500">· Tool Passport</span>
              </div>
              <h2 className="text-base font-bold text-white mt-0.5 line-clamp-1">{tool.name}</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scroll Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-300 flex-1">
          {/* Status & Quick Action Hero */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Current Active Status
              </span>
              <div className="flex items-center gap-3">
                <StatusBadge status={tool.status} size="lg" />
                <span className="text-slate-400">·</span>
                <span className="text-slate-300 font-medium">{tool.location}</span>
              </div>
              <div className="text-[11px] text-slate-400">
                Assigned Target: <strong className="text-white">{tool.assignedTo}</strong>
              </div>
            </div>

            <button
              onClick={() => {
                onClose();
                onOpenStatusModal(tool);
              }}
              className="px-4 py-2 font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer self-start sm:self-auto"
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span>Change Status</span>
            </button>
          </div>

          {/* Technical Specifications Grid */}
          <div className="space-y-2">
            <span className="font-bold text-white text-xs uppercase tracking-wider">
              Asset Metadata &amp; Specification
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-500 text-[10px] uppercase block">Category</span>
                <span className="font-semibold text-white">{tool.category}</span>
              </div>
              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-500 text-[10px] uppercase block">Manufacturer</span>
                <span className="font-semibold text-white">{tool.manufacturer}</span>
              </div>
              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-500 text-[10px] uppercase block">Serial Number</span>
                <span className="font-mono font-semibold text-amber-300">{tool.serialNumber}</span>
              </div>
              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-500 text-[10px] uppercase block">Criticality</span>
                <span className="font-semibold text-white">{tool.criticality} Priority</span>
              </div>
              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-500 text-[10px] uppercase block">Last Maintenance</span>
                <span className="font-semibold text-white">{tool.lastMaintenanceDate}</span>
              </div>
              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-500 text-[10px] uppercase block">Next Service Due</span>
                <span className="font-semibold text-amber-400">{tool.nextMaintenanceDue}</span>
              </div>
            </div>
          </div>

          {/* Cycle & Wear telemetry */}
          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white">Tool Life Utilization</span>
              <span className="font-mono font-bold text-amber-400">{tool.wearPercent}% Wear</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
              <div
                className={`h-2 rounded-full transition-all duration-500 ${
                  tool.wearPercent >= 85
                    ? 'bg-rose-500'
                    : tool.wearPercent >= 65
                    ? 'bg-amber-400'
                    : 'bg-emerald-400'
                }`}
                style={{ width: `${tool.wearPercent}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>Executed: {tool.cyclesCurrent.toLocaleString()} cycles / strokes</span>
              <span>Max Rated: {tool.cyclesMax.toLocaleString()} cycles</span>
            </div>
          </div>

          {/* Operational Notes */}
          {tool.notes && (
            <div className="space-y-1">
              <span className="font-bold text-slate-400 text-[11px] uppercase tracking-wider">
                Operational Log Notes
              </span>
              <p className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-slate-300 leading-relaxed">
                {tool.notes}
              </p>
            </div>
          )}

          {/* Transition History Timeline */}
          <div className="space-y-3 pt-2 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white flex items-center gap-1.5">
                <History className="w-4 h-4 text-amber-400" />
                Status Transition Audit Trail ({toolLogs.length})
              </span>
            </div>

            <div className="space-y-2">
              {toolLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1.5 text-[11px]"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400">{log.previousStatus}</span>
                      <span className="text-slate-600">→</span>
                      <StatusBadge status={log.newStatus} size="sm" />
                    </div>
                    <span className="text-slate-500 font-mono">
                      {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-slate-300">{log.reason}</p>
                  <div className="text-slate-500 flex items-center justify-between pt-1 border-t border-slate-900">
                    <span>Logged by: {log.updatedBy}</span>
                    <span>{log.location}</span>
                  </div>
                </div>
              ))}

              {toolLogs.length === 0 && (
                <div className="p-4 text-center text-slate-500 italic bg-slate-950/40 rounded-xl">
                  No previous transition events recorded for this tool yet.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-950 border-t border-slate-800 text-right">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
          >
            Close Passport
          </button>
        </div>
      </div>
    </div>
  );
};
