import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  Calendar,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Eye,
  ChevronDown,
  Layers,
  ArrowRight,
  UserCheck
} from 'lucide-react';
import { AssetUnit, ChecklistPoint, InspectionRecord, Finding } from '../../types/adr';
import { MockDatabase } from '../../services/mockData';
import { getCurrentWeekKey, getWeekKeysList, formatWeekLabel, formatIndonesianDate } from '../../utils/dateUtils';
import { StatusBadge } from '../common/StatusBadge';

interface InspectionMonitoringProps {
  initialRoom?: string;
  onViewPhoto: (photoUrl: string, title: string, desc: string) => void;
}

export const InspectionMonitoring: React.FC<InspectionMonitoringProps> = ({
  initialRoom,
  onViewPhoto,
}) => {
  const currentWeek = getCurrentWeekKey();
  const availableWeeks = getWeekKeysList(6);

  const [selectedWeek, setSelectedWeek] = useState<string>(currentWeek);
  const [selectedRoom, setSelectedRoom] = useState<string>(initialRoom || 'Semua Ruangan');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'DONE' | 'PENDING' | 'ABNORMAL'>('ALL');

  const assets = MockDatabase.getAssets().filter((a) => a.active);
  const allChecklists = MockDatabase.getChecklists().filter((c) => c.active);
  const allInspections = MockDatabase.getInspections().filter((i) => i.week_key === selectedWeek);
  const allFindings = MockDatabase.getFindings().filter((f) => f.week_key === selectedWeek);
  const assignments = MockDatabase.getAssignments().filter((a) => a.active);

  const roomsList = Array.from(new Set(assets.map((a) => a.room))).sort();

  // Filter assets
  const filteredAssets = assets.filter((asset) => {
    if (selectedRoom !== 'Semua Ruangan' && asset.room !== selectedRoom) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        asset.name.toLowerCase().includes(q) ||
        asset.label.toLowerCase().includes(q) ||
        asset.id.toLowerCase().includes(q);
      if (!match) return false;
    }

    const unitInspections = allInspections.filter((i) => i.unit_id === asset.id);
    const isDone = unitInspections.length > 0;
    const hasAbnormal = unitInspections.some((i) => i.answer === 'ABNORMAL');

    if (statusFilter === 'DONE' && !isDone) return false;
    if (statusFilter === 'PENDING' && isDone) return false;
    if (statusFilter === 'ABNORMAL' && (!isDone || !hasAbnormal)) return false;

    return true;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-stone-900">
            Monitoring Pemeriksaan Fasilitas
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Pantau kepatuhan checklist mingguan per ruangan dan unit inventaris secara rinci.
          </p>
        </div>

        {/* Filter controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Week Selector */}
          <div className="flex items-center gap-1.5 bg-stone-50 border border-stone-300 rounded-xl px-3 py-1.5 text-xs">
            <Calendar className="w-3.5 h-3.5 text-stone-500" />
            <select
              value={selectedWeek}
              onChange={(e) => setSelectedWeek(e.target.value)}
              className="bg-transparent font-semibold text-stone-800 focus:outline-none cursor-pointer"
            >
              {availableWeeks.map((w) => (
                <option key={w} value={w}>
                  {w === currentWeek ? `Minggu Ini (${w})` : `Minggu ${w}`}
                </option>
              ))}
            </select>
          </div>

          {/* Room Selector */}
          <div className="flex items-center gap-1.5 bg-stone-50 border border-stone-300 rounded-xl px-3 py-1.5 text-xs">
            <MapPin className="w-3.5 h-3.5 text-stone-500" />
            <select
              value={selectedRoom}
              onChange={(e) => setSelectedRoom(e.target.value)}
              className="bg-transparent font-semibold text-stone-800 focus:outline-none cursor-pointer"
            >
              <option value="Semua Ruangan">Semua Ruangan ({roomsList.length})</option>
              {roomsList.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
        {/* Status segmented filters */}
        <div className="flex items-center gap-1 p-1 bg-stone-100 rounded-lg w-full sm:w-auto">
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
              statusFilter === 'ALL'
                ? 'bg-white text-stone-900 shadow-xs font-semibold'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Semua ({assets.length})
          </button>
          <button
            onClick={() => setStatusFilter('DONE')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
              statusFilter === 'DONE'
                ? 'bg-white text-emerald-800 shadow-xs font-semibold'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Sudah Diperiksa
          </button>
          <button
            onClick={() => setStatusFilter('ABNORMAL')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
              statusFilter === 'ABNORMAL'
                ? 'bg-white text-rose-800 shadow-xs font-semibold'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Ada Abnormalitas
          </button>
          <button
            onClick={() => setStatusFilter('PENDING')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
              statusFilter === 'PENDING'
                ? 'bg-white text-stone-900 shadow-xs font-semibold'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Belum Diperiksa
          </button>
        </div>

        {/* Search input */}
        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Cari ID, nama unit, atau label..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 border border-stone-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-[#651D2A]"
          />
        </div>
      </div>

      {/* Units List */}
      <div className="space-y-4">
        {filteredAssets.map((asset) => {
          const unitChecks = allChecklists.filter((c) => c.unit_id === asset.id);
          const unitInspections = allInspections.filter((i) => i.unit_id === asset.id);
          const isInspected = unitInspections.length > 0;
          const abnormalFindings = allFindings.filter((f) => f.unit_id === asset.id);
          const hasAbnormal = unitInspections.some((i) => i.answer === 'ABNORMAL');

          const roomAssignment = assignments.find((a) => a.room === asset.room);

          return (
            <div
              key={asset.id}
              className={`bg-white rounded-2xl border transition-all shadow-xs ${
                hasAbnormal
                  ? 'border-rose-200 ring-1 ring-rose-100'
                  : isInspected
                  ? 'border-emerald-200'
                  : 'border-stone-200'
              } p-5 space-y-4`}
            >
              {/* Unit Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-stone-500 bg-stone-100 px-2 py-0.5 rounded">
                      {asset.id}
                    </span>
                    <span className="text-xs text-stone-500">· {asset.room}</span>
                    <span className="text-xs text-stone-400">· Model {asset.model}</span>
                  </div>
                  <h3 className="text-base font-bold text-stone-900 mt-1">
                    {asset.label}
                  </h3>
                  <p className="text-xs text-stone-600 mt-0.5">{asset.name}</p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {isInspected ? (
                    hasAbnormal ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 text-rose-800 text-xs font-bold border border-rose-200">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Abnormal ({abnormalFindings.length} Temuan)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Seluruh Poin Normal
                      </span>
                    )
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-stone-100 text-stone-600 text-xs font-medium border border-stone-200">
                      <Clock className="w-3.5 h-3.5" />
                      Belum Diperiksa
                    </span>
                  )}
                </div>
              </div>

              {/* Quantity metadata for 'Kelompok' model */}
              {asset.model === 'Kelompok' && isInspected && (
                <div className="grid grid-cols-3 gap-3 bg-stone-50 p-3 rounded-xl text-xs text-stone-700 border border-stone-100">
                  <div>
                    <span className="text-stone-400 block text-[11px]">Standar Qty:</span>
                    <span className="font-bold text-stone-900">{asset.qty} unit</span>
                  </div>
                  <div>
                    <span className="text-stone-400 block text-[11px]">Jumlah Fisik:</span>
                    <span className="font-bold text-stone-900">
                      {unitInspections[0]?.physical_qty || '-'} unit
                    </span>
                  </div>
                  <div>
                    <span className="text-stone-400 block text-[11px]">Layak Pakai:</span>
                    <span
                      className={`font-bold ${
                        Number(unitInspections[0]?.usable_qty) < asset.qty
                          ? 'text-rose-700'
                          : 'text-emerald-700'
                      }`}
                    >
                      {unitInspections[0]?.usable_qty || '-'} unit
                    </span>
                  </div>
                </div>
              )}

              {/* Checklist Inspection Details */}
              <div className="space-y-2">
                <div className="text-xs font-semibold uppercase tracking-wider text-stone-400">
                  Hasil Poin Checklist ({unitChecks.length} Poin)
                </div>

                <div className="divide-y divide-stone-100 border border-stone-100 rounded-xl overflow-hidden">
                  {unitChecks.map((point, idx) => {
                    const record = unitInspections.find((i) => i.checklist_id === point.id);
                    const isPointAbnormal = record?.answer === 'ABNORMAL';
                    const finding = allFindings.find(
                      (f) => f.unit_id === asset.id && f.checklist_id === point.id
                    );

                    return (
                      <div
                        key={point.id}
                        className={`p-3 text-xs flex flex-col md:flex-row md:items-center justify-between gap-2 ${
                          isPointAbnormal ? 'bg-rose-50/40' : 'bg-white'
                        }`}
                      >
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-stone-400">{idx + 1}.</span>
                            <span className="text-stone-800 font-medium">{point.question}</span>
                          </div>

                          {record?.note && (
                            <p className="text-rose-900 bg-rose-50 p-2 rounded-lg border border-rose-200 mt-1 text-[11px] font-medium">
                              <strong>Catatan Temuan:</strong> {record.note}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          {record ? (
                            isPointAbnormal ? (
                              <span className="text-xs font-bold text-rose-700 flex items-center gap-1">
                                <AlertTriangle className="w-3.5 h-3.5" />
                                Abnormal
                              </span>
                            ) : (
                              <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Normal
                              </span>
                            )
                          ) : (
                            <span className="text-xs text-stone-400 italic">Belum diperiksa</span>
                          )}

                          {finding?.photo_file_id && (
                            <button
                              onClick={() =>
                                onViewPhoto(
                                  finding.photo_file_id,
                                  `Bukti: ${asset.label} - Poin #${idx + 1}`,
                                  finding.description
                                )
                              }
                              className="px-2 py-1 text-[11px] font-semibold text-[#651D2A] bg-rose-100 hover:bg-rose-200 rounded-lg flex items-center gap-1 transition-colors"
                            >
                              <Eye className="w-3 h-3" />
                              Foto Bukti
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Inspector footer info */}
              {isInspected && (
                <div className="pt-2 flex flex-wrap items-center justify-between text-[11px] text-stone-400 border-t border-stone-100">
                  <div className="flex items-center gap-2">
                    <UserCheck className="w-3.5 h-3.5 text-stone-400" />
                    <span>
                      Diperiksa oleh: <strong>NIP {unitInspections[0].operator_nip}</strong>
                    </span>
                  </div>
                  <div>
                    Waktu: {formatIndonesianDate(unitInspections[0].created_at)}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {filteredAssets.length === 0 && (
          <div className="p-12 text-center bg-white rounded-2xl border border-stone-200 text-stone-500 text-sm">
            Tidak ada inventaris yang cocok dengan filter yang dipilih.
          </div>
        )}
      </div>
    </div>
  );
};
