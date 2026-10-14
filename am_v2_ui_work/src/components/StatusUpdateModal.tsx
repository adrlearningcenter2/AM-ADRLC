import React, { useState, useEffect } from 'react';
import {
  X,
  CheckCircle2,
  AlertTriangle,
  Wrench,
  Ban,
  ArrowRight,
  User,
  MapPin,
  FileText,
  Clock,
  Plus
} from 'lucide-react';
import { Tool, ToolStatus, StatusUpdatePayload } from '../types/tool';
import { StatusBadge } from './StatusBadge';

interface StatusUpdateModalProps {
  tool: Tool | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (toolId: string, payload: StatusUpdatePayload) => void;
}

export const StatusUpdateModal: React.FC<StatusUpdateModalProps> = ({
  tool,
  isOpen,
  onClose,
  onUpdate,
}) => {
  if (!isOpen || !tool) return null;

  const [selectedStatus, setSelectedStatus] = useState<ToolStatus>(tool.status);
  const [operatorName, setOperatorName] = useState<string>('');
  const [assignedTo, setAssignedTo] = useState<string>(tool.assignedTo);
  const [location, setLocation] = useState<string>(tool.location);
  const [reason, setReason] = useState<string>('');
  const [maintenanceType, setMaintenanceType] = useState<string>('Preventive Regrind / Inspection');
  const [cycleIncrement, setCycleIncrement] = useState<number>(0);

  // Pre-fill smart defaults when switching status buttons
  const handleSelectStatus = (newStatus: ToolStatus) => {
    setSelectedStatus(newStatus);
    if (newStatus === 'Available') {
      setAssignedTo('Unassigned');
      setLocation(tool.location.includes('Crib') ? tool.location : 'Tool Crib A · Rack 02-B');
      setReason('Returned to crib in clean, inspected condition.');
    } else if (newStatus === 'In Use') {
      setAssignedTo('DMG Mori NHX-5000 (Op. Marcus V.)');
      setLocation('CNC Production Cell 02');
      setReason('Checked out for high-priority production batch.');
    } else if (newStatus === 'Maintenance') {
      setAssignedTo('Toolmaker Hendra Kusuma');
      setLocation('Tool Room · Bay 3 Maintenance Bench');
      setReason('Scheduled regrind & dimensional calibration.');
    } else if (newStatus === 'Offline') {
      setAssignedTo('QA Metrology Hold');
      setLocation('Quarantine Cabinet Q-1');
      setReason('Defect or micro-wear detected during shift check.');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate(tool.id, {
      newStatus: selectedStatus,
      operatorName: operatorName.trim() || 'Shopfloor Operator',
      assignedTo: assignedTo.trim() || (selectedStatus === 'Available' ? 'Unassigned' : tool.assignedTo),
      location: location.trim() || tool.location,
      reason: reason.trim() || `Status updated to ${selectedStatus}`,
      maintenanceType: selectedStatus === 'Maintenance' ? maintenanceType : undefined,
      cycleIncrement: cycleIncrement > 0 ? cycleIncrement : undefined,
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="relative max-w-xl w-full bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
                {tool.id}
              </span>
              <span className="text-xs text-slate-400">· {tool.category}</span>
            </div>
            <h2 className="text-base font-bold text-white mt-1 line-clamp-1">{tool.name}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current status vs Target status banner */}
        <div className="px-6 py-3 bg-slate-950/60 border-b border-slate-800/80 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Current Status:</span>
            <StatusBadge status={tool.status} size="sm" />
          </div>
          <ArrowRight className="w-4 h-4 text-slate-500" />
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Target:</span>
            <StatusBadge status={selectedStatus} size="sm" />
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 text-xs text-slate-300 flex-1">
          {/* Status Selection Buttons */}
          <div className="space-y-2">
            <label className="block font-semibold uppercase tracking-wider text-slate-400 text-[11px]">
              Select New Dynamic Status:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {/* Available button */}
              <button
                type="button"
                onClick={() => handleSelectStatus('Available')}
                className={`py-3 px-2 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  selectedStatus === 'Available'
                    ? 'bg-emerald-950/70 border-emerald-500 text-emerald-300 ring-2 ring-emerald-500/20 font-bold'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-emerald-500/40 hover:text-emerald-400'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Available</span>
              </button>

              {/* In Use button */}
              <button
                type="button"
                onClick={() => handleSelectStatus('In Use')}
                className={`py-3 px-2 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  selectedStatus === 'In Use'
                    ? 'bg-cyan-950/70 border-cyan-500 text-cyan-300 ring-2 ring-cyan-500/20 font-bold'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-cyan-500/40 hover:text-cyan-400'
                }`}
              >
                <Clock className="w-4 h-4" />
                <span>In Use</span>
              </button>

              {/* Maintenance button */}
              <button
                type="button"
                onClick={() => handleSelectStatus('Maintenance')}
                className={`py-3 px-2 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  selectedStatus === 'Maintenance'
                    ? 'bg-amber-950/70 border-amber-500 text-amber-300 ring-2 ring-amber-500/20 font-bold'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-amber-500/40 hover:text-amber-400'
                }`}
              >
                <Wrench className="w-4 h-4" />
                <span>Maintenance</span>
              </button>

              {/* Offline button */}
              <button
                type="button"
                onClick={() => handleSelectStatus('Offline')}
                className={`py-3 px-2 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  selectedStatus === 'Offline'
                    ? 'bg-rose-950/70 border-rose-500 text-rose-300 ring-2 ring-rose-500/20 font-bold'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-rose-500/40 hover:text-rose-400'
                }`}
              >
                <Ban className="w-4 h-4" />
                <span>Offline</span>
              </button>
            </div>
          </div>

          {/* Contextual Fields: When In Use */}
          {selectedStatus === 'In Use' && (
            <div className="bg-cyan-950/20 border border-cyan-900/50 p-4 rounded-xl space-y-3">
              <span className="font-semibold text-cyan-300 block text-xs">
                Check-Out Assignment Details:
              </span>
              <div>
                <label className="block text-slate-400 mb-1">Target Machine / Workstation</label>
                <input
                  type="text"
                  required
                  value={assignedTo}
                  onChange={(e) => setAssignedTo(e.target.value)}
                  placeholder="e.g. DMG Mori CNC-01 (Op. Marcus Vance)"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Floor Location / Cell Bay</label>
                <input
                  type="text"
                  required
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. CNC Cell 02 (Line 1)"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />
              </div>
            </div>
          )}

          {/* Contextual Fields: When Maintenance */}
          {selectedStatus === 'Maintenance' && (
            <div className="bg-amber-950/20 border border-amber-900/50 p-4 rounded-xl space-y-3">
              <span className="font-semibold text-amber-300 block text-xs">
                Maintenance &amp; Service Work Order:
              </span>

              <div>
                <label className="block text-slate-400 mb-1">Maintenance Type</label>
                <select
                  value={maintenanceType}
                  onChange={(e) => setMaintenanceType(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                >
                  <option value="Preventive Regrind / Inspection">Preventive Regrind / Inspection</option>
                  <option value="Precision Metrology Recalibration">Precision Metrology Recalibration</option>
                  <option value="Die Sharpening & Punch Clearance Polish">Die Sharpening &amp; Punch Clearance Polish</option>
                  <option value="Ejector Pin & Mold Core Overhaul">Ejector Pin &amp; Mold Core Overhaul</option>
                  <option value="Emergency Breakdown Repair">Emergency Breakdown Repair</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Assigned Toolmaker / Tech</label>
                  <input
                    type="text"
                    required
                    value={assignedTo}
                    onChange={(e) => setAssignedTo(e.target.value)}
                    placeholder="e.g. Toolmaker Hendra K."
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Maintenance Location</label>
                  <input
                    type="text"
                    required
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Tool Room · Bay 3"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Contextual Fields: When Available */}
          {selectedStatus === 'Available' && (
            <div className="bg-emerald-950/20 border border-emerald-900/50 p-4 rounded-xl space-y-3">
              <span className="font-semibold text-emerald-300 block text-xs">
                Check-In / Return Storage Target:
              </span>
              <div>
                <label className="block text-slate-400 mb-1">Storage Crib &amp; Rack ID</label>
                <input
                  type="text"
                  required
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Tool Crib A · Rack 02-B"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>
          )}

          {/* Contextual Fields: When Offline */}
          {selectedStatus === 'Offline' && (
            <div className="bg-rose-950/20 border border-rose-900/50 p-4 rounded-xl space-y-3">
              <span className="font-semibold text-rose-300 block text-xs">
                Quarantine &amp; Hold Reason:
              </span>
              <div>
                <label className="block text-slate-400 mb-1">Hold Department / Custodian</label>
                <input
                  type="text"
                  required
                  value={assignedTo}
                  onChange={(e) => setAssignedTo(e.target.value)}
                  placeholder="e.g. QA Quality Hold / Safety Quarantine"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-rose-500"
                />
              </div>
            </div>
          )}

          {/* Cycle increment option */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800">
            <div>
              <span className="font-semibold text-white block">Increment Tool Stroke / Cycle Count:</span>
              <span className="text-[11px] text-slate-400">
                Current: {tool.cyclesCurrent.toLocaleString()} / {tool.cyclesMax.toLocaleString()} cycles ({tool.wearPercent}% wear)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={0}
                step={50}
                value={cycleIncrement}
                onChange={(e) => setCycleIncrement(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-24 px-2 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-right font-mono"
              />
              <span className="text-slate-400">cycles</span>
            </div>
          </div>

          {/* Reason / Remarks Log */}
          <div>
            <label className="block font-semibold text-slate-400 mb-1">
              Transition Reason &amp; Audit Remarks <span className="text-rose-400">*</span>
            </label>
            <textarea
              rows={2}
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Provide reason for this status change..."
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>

          {/* Operator Name */}
          <div>
            <label className="block font-semibold text-slate-400 mb-1">
              Operator / Tool Crib Specialist
            </label>
            <div className="relative">
              <User className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                value={operatorName}
                onChange={(e) => setOperatorName(e.target.value)}
                placeholder="Your name or NIP / badge ID..."
                className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* Action Footer */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 font-medium text-slate-400 hover:text-white rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-xl shadow-lg shadow-amber-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <span>Save Status Change</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
