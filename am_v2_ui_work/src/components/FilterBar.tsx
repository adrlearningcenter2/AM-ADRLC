import React from 'react';
import {
  Search,
  Filter,
  LayoutGrid,
  List,
  Layers,
  X,
  SlidersHorizontal
} from 'lucide-react';
import { ToolCategory, ToolStatus } from '../types/tool';

interface FilterBarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  statusFilter: ToolStatus | 'ALL' | 'HIGH_WEAR';
  onStatusFilterChange: (status: ToolStatus | 'ALL' | 'HIGH_WEAR') => void;
  categoryFilter: ToolCategory | 'ALL';
  onCategoryFilterChange: (cat: ToolCategory | 'ALL') => void;
  viewMode: 'table' | 'grid';
  onViewModeChange: (mode: 'table' | 'grid') => void;
  selectedCount: number;
  onOpenBatchModal: () => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  categoryFilter,
  onCategoryFilterChange,
  viewMode,
  onViewModeChange,
  selectedCount,
  onOpenBatchModal,
}) => {
  const statusOptions: { label: string; value: ToolStatus | 'ALL' }[] = [
    { label: 'All Tools', value: 'ALL' },
    { label: 'Available', value: 'Available' },
    { label: 'In Use', value: 'In Use' },
    { label: 'Maintenance', value: 'Maintenance' },
    { label: 'Offline', value: 'Offline' },
  ];

  const categories: ToolCategory[] = [
    'CNC Machining',
    'Stamping & Press',
    'Molding & Injection',
    'Assembly & Torque',
    'Metrology & Inspection',
    'Welding & Fab',
  ];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3.5">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 text-xs">
        {/* Status Tabs Segmented Control */}
        <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-xl border border-slate-800/80 overflow-x-auto">
          {statusOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => onStatusFilterChange(opt.value)}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all whitespace-nowrap cursor-pointer ${
                statusFilter === opt.value
                  ? 'bg-slate-800 text-white shadow-sm ring-1 ring-slate-700'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              {opt.label}
            </button>
          ))}
          {statusFilter === 'HIGH_WEAR' && (
            <span className="px-3 py-1.5 rounded-lg font-semibold bg-amber-500 text-slate-950 flex items-center gap-1">
              <span>High Wear Only</span>
              <button
                onClick={() => onStatusFilterChange('ALL')}
                className="hover:opacity-80"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
        </div>

        {/* Right side controls: Search, Category & View toggle */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Category Dropdown */}
          <select
            value={categoryFilter}
            onChange={(e) => onCategoryFilterChange(e.target.value as ToolCategory | 'ALL')}
            className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-300 font-medium focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer"
          >
            <option value="ALL">All Categories (6)</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          {/* Search bar */}
          <div className="relative flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search ID, tool name, serial..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500 text-xs"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-2.5 top-2.5 text-slate-500 hover:text-slate-300"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-0.5 p-1 bg-slate-950 rounded-xl border border-slate-800">
            <button
              onClick={() => onViewModeChange('table')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'table' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-300'
              }`}
              title="Table View"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => onViewModeChange('grid')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'grid' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-300'
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>

          {/* Batch Action Button (Appears when tools are selected) */}
          {selectedCount > 0 && (
            <button
              onClick={onOpenBatchModal}
              className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5 animate-fadeIn cursor-pointer"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Batch Update ({selectedCount})</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
