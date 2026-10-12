import React from 'react';
import {
  Wrench,
  Clock,
  MapPin,
  User,
  SlidersHorizontal,
  ChevronRight,
  Eye,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles
} from 'lucide-react';
import { Tool, ToolStatus } from '../types/tool';
import { StatusBadge } from './StatusBadge';

interface ToolTableProps {
  tools: Tool[];
  selectedToolIds: string[];
  onToggleSelectTool: (toolId: string) => void;
  onToggleSelectAll: () => void;
  onOpenStatusModal: (tool: Tool) => void;
  onOpenDetailModal: (tool: Tool) => void;
  onQuickToggleStatus: (tool: Tool) => void;
}

export const ToolTable: React.FC<ToolTableProps> = ({
  tools,
  selectedToolIds,
  onToggleSelectTool,
  onToggleSelectAll,
  onOpenStatusModal,
  onOpenDetailModal,
  onQuickToggleStatus,
}) => {
  const allSelected = tools.length > 0 && selectedToolIds.length === tools.length;
  const someSelected = selectedToolIds.length > 0 && selectedToolIds.length < tools.length;

  const formatRelativeTime = (isoString: string) => {
    try {
      const past = new Date(isoString).getTime();
      const diffMs = Date.now() - past;
      const diffSec = Math.floor(diffMs / 1000);
      if (diffSec < 60) return `${diffSec}s ago`;
      const diffMin = Math.floor(diffSec / 60);
      if (diffMin < 60) return `${diffMin}m ago`;
      const diffHours = Math.floor(diffMin / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays}d ago`;
    } catch {
      return isoString;
    }
  };

  const getWearColor = (wearPercent: number) => {
    if (wearPercent >= 85) return 'bg-rose-500 text-rose-400';
    if (wearPercent >= 65) return 'bg-amber-500 text-amber-400';
    return 'bg-emerald-500 text-emerald-400';
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          {/* Table Header */}
          <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
            <tr>
              <th className="p-4 w-10 text-center">
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={(input) => {
                    if (input) input.indeterminate = someSelected;
                  }}
                  onChange={onToggleSelectAll}
                  className="rounded border-slate-700 bg-slate-900 text-amber-500 focus:ring-0 focus:ring-offset-0 cursor-pointer"
                />
              </th>
              <th className="p-4">Tool Identifier</th>
              <th className="p-4">Equipment &amp; Specs</th>
              <th className="p-4">Real-Time Status</th>
              <th className="p-4">Location / Station</th>
              <th className="p-4">Assigned Target</th>
              <th className="p-4">Wear &amp; Cycle Life</th>
              <th className="p-4">Last Updated</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-slate-800/80">
            {tools.map((tool) => {
              const isSelected = selectedToolIds.includes(tool.id);
              const wearClass = getWearColor(tool.wearPercent);

              return (
                <tr
                  key={tool.id}
                  className={`transition-colors group hover:bg-slate-800/50 ${
                    isSelected ? 'bg-amber-500/5' : ''
                  }`}
                >
                  {/* Checkbox */}
                  <td className="p-4 text-center">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => onToggleSelectTool(tool.id)}
                      className="rounded border-slate-700 bg-slate-900 text-amber-500 focus:ring-0 focus:ring-offset-0 cursor-pointer"
                    />
                  </td>

                  {/* Tool Identifier */}
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
                        {tool.id}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400 mt-1 block">
                      {tool.category}
                    </span>
                  </td>

                  {/* Tool Name & Manufacturer */}
                  <td className="p-4 max-w-xs">
                    <button
                      onClick={() => onOpenDetailModal(tool)}
                      className="font-bold text-white hover:text-amber-400 transition-colors text-left line-clamp-1 cursor-pointer"
                      title={tool.name}
                    >
                      {tool.name}
                    </button>
                    <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-2">
                      <span>{tool.manufacturer}</span>
                      <span className="text-slate-600">·</span>
                      <span className="font-mono text-slate-500">{tool.serialNumber}</span>
                    </div>
                  </td>

                  {/* Status Badge */}
                  <td className="p-4 whitespace-nowrap">
                    <StatusBadge status={tool.status} size="sm" />
                  </td>

                  {/* Location */}
                  <td className="p-4 max-w-[180px]">
                    <div className="flex items-center gap-1.5 text-slate-300 font-medium truncate" title={tool.location}>
                      <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span className="truncate">{tool.location}</span>
                    </div>
                  </td>

                  {/* Assigned Target */}
                  <td className="p-4 max-w-[200px]">
                    <div className="text-slate-300 font-medium truncate" title={tool.assignedTo}>
                      {tool.assignedTo === 'Unassigned' ? (
                        <span className="text-slate-500 italic">Unassigned (Ready)</span>
                      ) : (
                        <span className="text-cyan-300">{tool.assignedTo}</span>
                      )}
                    </div>
                  </td>

                  {/* Wear & Cycle Bar */}
                  <td className="p-4 min-w-[140px]">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-mono text-slate-400">
                          {tool.cyclesCurrent.toLocaleString()} / {tool.cyclesMax.toLocaleString()}
                        </span>
                        <span className={`font-mono font-bold ${wearClass.split(' ')[1]}`}>
                          {tool.wearPercent}%
                        </span>
                      </div>
                      <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-1.5 rounded-full transition-all duration-300 ${wearClass.split(' ')[0]}`}
                          style={{ width: `${tool.wearPercent}%` }}
                        />
                      </div>
                    </div>
                  </td>

                  {/* Last Updated */}
                  <td className="p-4 whitespace-nowrap">
                    <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                      <Clock className="w-3 h-3 text-slate-500" />
                      <span>{formatRelativeTime(tool.lastUpdated)}</span>
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="p-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      {/* Primary Change Status Button */}
                      <button
                        onClick={() => onOpenStatusModal(tool)}
                        className="px-2.5 py-1.5 bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-200 border border-slate-700 hover:border-amber-500 rounded-lg font-semibold text-xs transition-all flex items-center gap-1 cursor-pointer"
                        title="Update Status dynamically"
                      >
                        <SlidersHorizontal className="w-3.5 h-3.5" />
                        <span>Update</span>
                      </button>

                      {/* Detail passport modal trigger */}
                      <button
                        onClick={() => onOpenDetailModal(tool)}
                        className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                        title="View tool passport & history"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {tools.length === 0 && (
        <div className="p-12 text-center text-slate-400 space-y-2">
          <Wrench className="w-8 h-8 text-slate-600 mx-auto" />
          <div className="font-semibold text-slate-300">No matching tools found</div>
          <p className="text-xs text-slate-500">
            Try resetting your search query or switching active status filters.
          </p>
        </div>
      )}
    </div>
  );
};
