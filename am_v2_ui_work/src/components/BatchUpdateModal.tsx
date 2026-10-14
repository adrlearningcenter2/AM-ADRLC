import React, { useState } from 'react';
import { X, Layers, CheckCircle2, SlidersHorizontal } from 'lucide-react';
import { ToolStatus } from '../types/tool';

interface BatchUpdateModalProps {
  selectedToolIds: string[];
  isOpen: boolean;
  onClose: () => void;
  onBatchUpdate: (newStatus: ToolStatus, reason: string) => void;
}

export const BatchUpdateModal: React.FC<BatchUpdateModalProps> = ({
  selectedToolIds,
  isOpen,
  onClose,
  onBatchUpdate,
}) => {
  if (!isOpen || selectedToolIds.length === 0) return null;

  const [newStatus, setNewStatus] = useState<ToolStatus>('Available');
  const [reason, setReason] = useState<string>('Batch status update performed by floor supervisor.');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onBatchUpdate(newStatus, reason);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-4 text-xs"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-bold text-white">
              Batch Status Update ({selectedToolIds.length} Tools)
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block font-semibold text-slate-400 mb-1">
              Apply New Status to All Selected Tools
            </label>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value as ToolStatus)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-semibold focus:ring-1 focus:ring-amber-500"
            >
              <option value="Available">Set to Available (Return to Storage)</option>
              <option value="In Use">Set to In Use (Active on Floor)</option>
              <option value="Maintenance">Set to Maintenance (Service / Regrind)</option>
              <option value="Offline">Set to Offline (Quarantine)</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-400 mb-1">
              Batch Reason / Audit Note
            </label>
            <textarea
              rows={3}
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:ring-1 focus:ring-amber-500"
            />
          </div>

          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-slate-400 text-[11px]">
            Selected Tools: <span className="font-mono text-amber-300">{selectedToolIds.join(', ')}</span>
          </div>

          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-400 hover:text-white font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl shadow-md transition-all cursor-pointer"
            >
              Apply Batch Update
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
