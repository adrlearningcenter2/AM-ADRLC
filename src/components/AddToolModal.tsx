import React, { useState } from 'react';
import { X, Plus, Wrench } from 'lucide-react';
import { Tool, ToolCategory, ToolStatus, ToolCriticality } from '../types/tool';

interface AddToolModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (newTool: Omit<Tool, 'lastUpdated'>) => void;
}

export const AddToolModal: React.FC<AddToolModalProps> = ({
  isOpen,
  onClose,
  onAdd,
}) => {
  if (!isOpen) return null;

  const [id, setId] = useState(`TL-USR-${Math.floor(100 + Math.random() * 900)}`);
  const [name, setName] = useState('');
  const [category, setCategory] = useState<ToolCategory>('CNC Machining');
  const [status, setStatus] = useState<ToolStatus>('Available');
  const [location, setLocation] = useState('Tool Crib A · Rack 01-A');
  const [assignedTo, setAssignedTo] = useState('Unassigned');
  const [cyclesMax, setCyclesMax] = useState(5000);
  const [cyclesCurrent, setCyclesCurrent] = useState(0);
  const [serialNumber, setSerialNumber] = useState(`SN-${Date.now().toString().slice(-6)}`);
  const [manufacturer, setManufacturer] = useState('Sandvik Coromant');
  const [criticality, setCriticality] = useState<ToolCriticality>('Medium');
  const [notes, setNotes] = useState('Newly commissioned asset.');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Tool name is required');
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    const wear = Math.min(100, Math.round((cyclesCurrent / cyclesMax) * 100));

    onAdd({
      id: id.trim().toUpperCase(),
      name: name.trim(),
      category,
      status,
      location: location.trim(),
      assignedTo: assignedTo.trim() || 'Unassigned',
      cyclesCurrent,
      cyclesMax,
      wearPercent: wear,
      serialNumber: serialNumber.trim(),
      manufacturer: manufacturer.trim(),
      criticality,
      lastMaintenanceDate: today,
      nextMaintenanceDue: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      notes: notes.trim(),
    });

    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="relative max-w-lg w-full bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-2">
            <Plus className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-bold text-white">Register New Industrial Tool</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs text-slate-300 flex-1">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-400 mb-1">Tool Identifier (ID)</label>
              <input
                type="text"
                required
                value={id}
                onChange={(e) => setId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono uppercase focus:ring-1 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-400 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ToolCategory)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:ring-1 focus:ring-amber-500"
              >
                <option value="CNC Machining">CNC Machining</option>
                <option value="Stamping & Press">Stamping &amp; Press</option>
                <option value="Molding & Injection">Molding &amp; Injection</option>
                <option value="Assembly & Torque">Assembly &amp; Torque</option>
                <option value="Metrology & Inspection">Metrology &amp; Inspection</option>
                <option value="Welding & Fab">Welding &amp; Fab</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-400 mb-1">Tool Description / Name</label>
            <input
              type="text"
              required
              placeholder="e.g. 5-Axis Indexable Face Mill Ø50mm"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:ring-1 focus:ring-amber-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-400 mb-1">Initial Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ToolStatus)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:ring-1 focus:ring-amber-500"
              >
                <option value="Available">Available (Ready)</option>
                <option value="In Use">In Use (Active)</option>
                <option value="Maintenance">Maintenance</option>
                <option value="Offline">Offline</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-400 mb-1">Criticality</label>
              <select
                value={criticality}
                onChange={(e) => setCriticality(e.target.value as ToolCriticality)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:ring-1 focus:ring-amber-500"
              >
                <option value="Standard">Standard</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-400 mb-1">Location / Crib Rack</label>
              <input
                type="text"
                required
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:ring-1 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-400 mb-1">Assigned Target</label>
              <input
                type="text"
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                placeholder="Unassigned or Machine ID"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:ring-1 focus:ring-amber-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-400 mb-1">Manufacturer</label>
              <input
                type="text"
                value={manufacturer}
                onChange={(e) => setManufacturer(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:ring-1 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-400 mb-1">Serial Number</label>
              <input
                type="text"
                value={serialNumber}
                onChange={(e) => setSerialNumber(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono focus:ring-1 focus:ring-amber-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-400 mb-1">Current Cycles</label>
              <input
                type="number"
                min={0}
                value={cyclesCurrent}
                onChange={(e) => setCyclesCurrent(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono focus:ring-1 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-400 mb-1">Max Rated Cycles</label>
              <input
                type="number"
                min={100}
                value={cyclesMax}
                onChange={(e) => setCyclesMax(parseInt(e.target.value) || 1000)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono focus:ring-1 focus:ring-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-400 mb-1">Notes</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:ring-1 focus:ring-amber-500"
            />
          </div>

          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 font-medium text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl shadow-md transition-all cursor-pointer"
            >
              Register Tool
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
