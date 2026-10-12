import React from 'react';
import {
  Wrench,
  Clock,
  MapPin,
  User,
  SlidersHorizontal,
  Eye,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Tag
} from 'lucide-react';
import { Tool } from '../types/tool';
import { StatusBadge } from './StatusBadge';

interface ToolGridProps {
  tools: Tool[];
  selectedToolIds: string[];
  onToggleSelectTool: (toolId: string) => void;
  onOpenStatusModal: (tool: Tool) => void;
  onOpenDetailModal: (tool: Tool) => void;
}

export const ToolGrid: React.FC<ToolGridProps> = ({
  tools,
  selectedToolIds,
  onToggleSelectTool,
  onOpenStatusModal,
  onOpenDetailModal,
}) => {
  const getWearColor = (wearPercent: number) => {
    if (wearPercent >= 85) return 'bg-rose-500 text-rose-400';
    if (wearPercent >= 65) return 'bg-amber-500 text-amber-400';
    return 'bg-emerald-500 text-emerald-400';
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {tools.map((tool) => {
        const isSelected = selectedToolIds.includes(tool.id);
        const wearClass = getWearColor(tool.wearPercent);

        return (
          <div
            key={tool.id}
            className={`bg-slate-900 border rounded-2xl p-5 flex flex-col justify-between transition-all hover:border-slate-700 shadow-md ${
              isSelected ? 'border-amber-500/80 bg-amber-500/5 ring-1 ring-amber-500/30' : 'border-slate-800'
            }`}
          >
            {/* Top row */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => onToggleSelectTool(tool.id)}
                    className="rounded border-slate-700 bg-slate-950 text-amber-500 focus:ring-0 cursor-pointer"
                  />
                  <span className="font-mono text-xs font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
                    {tool.id}
                  </span>
                </div>
                <StatusBadge status={tool.status} size="sm" />
              </div>

              <div>
                <button
                  onClick={() => onOpenDetailModal(tool)}
                  className="font-bold text-white hover:text-amber-400 text-left line-clamp-2 transition-colors cursor-pointer text-sm"
                >
                  {tool.name}
                </button>
                <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-2">
                  <span>{tool.category}</span>
                  <span className="text-slate-600">·</span>
                  <span>{tool.manufacturer}</span>
                </div>
              </div>

              {/* Station & Assignment */}
              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 space-y-1.5 text-xs">
                <div className="flex items-center gap-2 text-slate-300">
                  <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span className="truncate">{tool.location}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-400">
                  <User className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span className={`truncate ${tool.status === 'In Use' ? 'text-cyan-300 font-semibold' : ''}`}>
                    {tool.assignedTo}
                  </span>
                </div>
              </div>

              {/* Wear indicator */}
              <div className="space-y-1 text-xs">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400 font-mono">
                    {tool.cyclesCurrent.toLocaleString()} / {tool.cyclesMax.toLocaleString()} cycles
                  </span>
                  <span className={`font-mono font-bold ${wearClass.split(' ')[1]}`}>
                    {tool.wearPercent}%
                  </span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-1.5 rounded-full ${wearClass.split(' ')[0]}`}
                    style={{ width: `${tool.wearPercent}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-4 mt-4 border-t border-slate-800 flex items-center justify-between gap-2">
              <button
                onClick={() => onOpenDetailModal(tool)}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer flex items-center gap-1"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Passport</span>
              </button>

              <button
                onClick={() => onOpenStatusModal(tool)}
                className="px-3 py-1.5 text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl transition-all shadow-sm shadow-amber-500/10 cursor-pointer flex items-center gap-1.5"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Update Status</span>
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};
