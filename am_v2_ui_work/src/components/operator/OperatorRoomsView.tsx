import React, { useState } from 'react';
import {
  Building2,
  CheckCircle2,
  Clock,
  ChevronRight,
  AlertTriangle,
  ArrowLeft,
  Calendar,
  Layers,
  Sparkles,
  Search,
  Filter,
  CheckCheck
} from 'lucide-react';
import { AssetUnit, ChecklistPoint } from '../../types/adr';
import { MockDatabase } from '../../services/mockData';
import { getCurrentWeekKey, formatWeekLabel } from '../../utils/dateUtils';
import { InspectionFormModal } from './InspectionFormModal';

interface OperatorRoomsViewProps {
  onRefresh: () => void;
  onOpenRequest: () => void;
  onViewPhoto?: (url: string, title: string, desc: string) => void;
}

export const OperatorRoomsView: React.FC<OperatorRoomsViewProps> = ({
  onRefresh,
  onOpenRequest,
  onViewPhoto,
}) => {
  const currentWeek = getCurrentWeekKey();
  const assets = MockDatabase.getAssets().filter((a) => a.active);
  const inspections = MockDatabase.getInspections().filter((i) => i.week_key === currentWeek);
  const checklists = MockDatabase.getChecklists().filter((c) => c.active);
  const findings = MockDatabase.getFindings().filter((f) => f.week_key === currentWeek);

  const roomsList = Array.from(new Set(assets.map((a) => a.room))).sort();

  // Active selected room state
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);

  // Filter & Search inside rooms list
  const [roomFilterTab, setRoomFilterTab] = useState<'ALL' | 'PENDING' | 'DONE'>('ALL');
  const [unitSearch, setUnitSearch] = useState('');

  // Active inspecting unit state
  const [inspectingAsset, setInspectingAsset] = useState<
    (AssetUnit & { checks: ChecklistPoint[]; isInspectedThisWeek: boolean }) | null
  >(null);

  const inspectedUnitIds = new Set(inspections.map((i) => i.unit_id));

  // IF OPERATOR IS INSIDE A SPECIFIC ROOM
  if (selectedRoom) {
    const roomAssets = assets.filter((a) => a.room === selectedRoom);
    const roomInspectedCount = roomAssets.filter((a) => inspectedUnitIds.has(a.id)).length;
    const isRoomComplete = roomInspectedCount >= roomAssets.length && roomAssets.length > 0;
    const roomProgressPercent = roomAssets.length > 0 ? Math.round((roomInspectedCount / roomAssets.length) * 100) : 0;

    const filteredUnits = roomAssets.filter((unit) => {
      if (unitSearch.trim()) {
        const q = unitSearch.toLowerCase();
        return (
          unit.label.toLowerCase().includes(q) ||
          unit.name.toLowerCase().includes(q) ||
          unit.id.toLowerCase().includes(q)
        );
      }
      return true;
    });

    return (
      <div className="space-y-4 pb-24 md:pb-8 animate-fadeIn">
        {/* Navigation & Room Header */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200/90 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => {
                setSelectedRoom(null);
                setUnitSearch('');
              }}
              className="inline-flex items-center gap-2 text-xs font-bold text-stone-700 hover:text-[#651D2A] bg-stone-100 hover:bg-stone-200 px-3 py-1.5 rounded-xl transition-all touch-press cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Daftar Ruangan</span>
            </button>
            <span className="text-[11px] font-mono font-semibold text-stone-500 bg-stone-50 px-2.5 py-1 rounded-lg border border-stone-200">
              Minggu {currentWeek}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-[#651D2A]">
                <Building2 className="w-4 h-4" />
                <span>Pemeriksaan Ruangan</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-stone-900 mt-0.5">
                {selectedRoom}
              </h1>
              <p className="text-xs text-stone-500 mt-0.5">
                {roomInspectedCount} dari {roomAssets.length} unit inventaris telah selesai diperiksa
              </p>
            </div>

            <div className="flex items-center gap-2">
              {isRoomComplete ? (
                <span className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200 flex items-center gap-1.5 shadow-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Seluruh Unit Selesai
                </span>
              ) : (
                <span className="px-3 py-1.5 rounded-xl bg-amber-50 text-amber-800 text-xs font-bold border border-amber-200 flex items-center gap-1.5 shadow-xs">
                  <Clock className="w-4 h-4 text-amber-600" />
                  Sisa {roomAssets.length - roomInspectedCount} Unit Lagi
                </span>
              )}
            </div>
          </div>

          {/* Visual Progress Bar */}
          <div className="space-y-1.5 pt-1">
            <div className="flex justify-between text-xs text-stone-600 font-semibold">
              <span>Kemajuan Pemeriksaan Ruangan</span>
              <span className="text-[#651D2A] font-bold">{roomProgressPercent}%</span>
            </div>
            <div className="w-full bg-stone-100 rounded-full h-2.5 overflow-hidden">
              <div
                className={`h-2.5 rounded-full transition-all duration-500 ${
                  isRoomComplete ? 'bg-emerald-600' : 'bg-[#651D2A]'
                }`}
                style={{ width: `${roomProgressPercent}%` }}
              />
            </div>
          </div>

          {/* Search unit input if room has many units */}
          {roomAssets.length > 2 && (
            <div className="pt-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="Cari nama atau kode unit inventaris..."
                  value={unitSearch}
                  onChange={(e) => setUnitSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-stone-200 rounded-xl bg-stone-50 focus:outline-none focus:ring-2 focus:ring-[#651D2A]/20 focus:border-[#651D2A]"
                />
              </div>
            </div>
          )}
        </div>

        {/* Units Cards List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-stone-500 px-1 font-semibold uppercase tracking-wider">
            <span>Daftar Unit Inventaris ({filteredUnits.length})</span>
            <span>Status</span>
          </div>

          {filteredUnits.map((asset, index) => {
            const isDone = inspectedUnitIds.has(asset.id);
            const unitChecks = checklists.filter((c) => c.unit_id === asset.id);
            const unitFindings = findings.filter((f) => f.unit_id === asset.id);
            const hasAbnormal = unitFindings.length > 0;

            return (
              <div
                key={asset.id}
                className={`bg-white p-5 rounded-2xl border transition-all ${
                  isDone
                    ? hasAbnormal
                      ? 'border-rose-300 ring-1 ring-rose-200 shadow-xs'
                      : 'border-emerald-200 bg-emerald-50/10 shadow-xs'
                    : 'border-stone-200 shadow-sm hover:border-[#651D2A]/40'
                } flex flex-col sm:flex-row sm:items-center justify-between gap-4`}
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold text-[#651D2A] bg-[#651D2A]/10 px-2.5 py-0.5 rounded-lg border border-[#651D2A]/20">
                      {asset.id}
                    </span>
                    <span className="text-xs text-stone-500 font-medium">· Model {asset.model}</span>
                    {asset.model === 'Kelompok' && (
                      <span className="text-xs text-stone-700 bg-stone-100 px-2 py-0.5 rounded font-semibold">
                        Standar: {asset.qty} Unit
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-bold text-stone-900 leading-snug">
                    {asset.label}
                  </h3>
                  <p className="text-xs text-stone-600">{asset.name}</p>

                  <div className="text-[11px] text-stone-400 flex items-center gap-2 pt-1">
                    <span className="font-medium text-stone-600">
                      {unitChecks.length} Poin Checklist Standar 5S
                    </span>
                  </div>
                </div>

                <div className="shrink-0 flex items-center justify-end">
                  {isDone ? (
                    <div className="flex flex-col sm:items-end gap-1.5">
                      {hasAbnormal ? (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 text-rose-800 text-xs font-bold border border-rose-200 shadow-xs">
                          <AlertTriangle className="w-4 h-4 text-rose-600" />
                          <span>Ada {unitFindings.length} Abnormalitas</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200 shadow-xs">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>Tersimpan Normal</span>
                        </div>
                      )}
                      <span className="text-[10px] text-stone-400">
                        Sudah terkunci untuk minggu ini
                      </span>
                    </div>
                  ) : (
                    <button
                      onClick={() =>
                        setInspectingAsset({
                          ...asset,
                          checks: unitChecks,
                          isInspectedThisWeek: false,
                        })
                      }
                      className="w-full sm:w-auto px-5 py-2.5 text-xs font-bold text-white bg-[#651D2A] hover:bg-[#4B141E] rounded-xl shadow-md transition-all touch-press flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <span>Mulai Periksa</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Modal Form Inspeksi */}
        {inspectingAsset && (
          <InspectionFormModal
            isOpen={true}
            onClose={() => setInspectingAsset(null)}
            asset={inspectingAsset}
            roomName={selectedRoom}
            onSuccess={() => {
              onRefresh();
            }}
          />
        )}
      </div>
    );
  }

  // OPERATOR ROOMS LIST OVERVIEW VIEW (MOBILE-FIRST)
  const totalAssetsCount = assets.length;
  const inspectedTotalCount = inspectedUnitIds.size;
  const totalProgressPercent = totalAssetsCount > 0 ? Math.round((inspectedTotalCount / totalAssetsCount) * 100) : 0;

  const filteredRooms = roomsList.filter((roomName) => {
    const roomAssets = assets.filter((a) => a.room === roomName);
    const count = roomAssets.filter((a) => inspectedUnitIds.has(a.id)).length;
    const isDone = count >= roomAssets.length && roomAssets.length > 0;

    if (roomFilterTab === 'PENDING') return !isDone;
    if (roomFilterTab === 'DONE') return isDone;
    return true;
  });

  return (
    <div className="space-y-5 pb-24 md:pb-8 animate-fadeIn">
      {/* Friendly Welcome Card for Operator */}
      <div className="bg-gradient-to-br from-[#651D2A] to-[#43121B] text-white p-6 rounded-3xl shadow-lg space-y-4">
        <div className="flex items-center justify-between text-xs text-rose-200">
          <span className="font-bold uppercase tracking-wider bg-white/10 px-2.5 py-1 rounded-lg backdrop-blur-xs">
            Inspeksi Mingguan 5S
          </span>
          <span className="font-medium flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-rose-300" />
            {formatWeekLabel(currentWeek)}
          </span>
        </div>

        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
            Pemeriksaan Fasilitas ADR
          </h1>
          <p className="text-xs text-rose-100/90 mt-1 max-w-xl leading-relaxed">
            Periksa checklist inventaris di setiap ruangan pelatihan. Pilih ruangan di bawah ini untuk memulai.
          </p>
        </div>

        {/* Overall Progress meter */}
        <div className="bg-black/20 p-4 rounded-2xl border border-white/10 space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-rose-100">
            <span>Total Progres Seluruh Fasilitas</span>
            <span className="text-white font-bold">{totalProgressPercent}% Selesai</span>
          </div>
          <div className="w-full bg-black/40 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-amber-400 h-2.5 rounded-full transition-all duration-500 shadow-sm"
              style={{ width: `${totalProgressPercent}%` }}
            />
          </div>
          <div className="text-[11px] text-rose-200/80 flex items-center justify-between pt-0.5">
            <span>{inspectedTotalCount} dari {totalAssetsCount} unit terinspeksi</span>
            <span>{roomsList.length} Total Ruangan</span>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 p-1 bg-stone-200/70 rounded-xl text-xs font-bold text-stone-700">
          <button
            onClick={() => setRoomFilterTab('ALL')}
            className={`px-3 py-1.5 rounded-lg transition-all touch-press cursor-pointer ${
              roomFilterTab === 'ALL'
                ? 'bg-white text-[#651D2A] shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Semua ({roomsList.length})
          </button>
          <button
            onClick={() => setRoomFilterTab('PENDING')}
            className={`px-3 py-1.5 rounded-lg transition-all touch-press cursor-pointer ${
              roomFilterTab === 'PENDING'
                ? 'bg-white text-amber-800 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Perlu Dikerjakan
          </button>
          <button
            onClick={() => setRoomFilterTab('DONE')}
            className={`px-3 py-1.5 rounded-lg transition-all touch-press cursor-pointer ${
              roomFilterTab === 'DONE'
                ? 'bg-white text-emerald-800 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Selesai Lengkap
          </button>
        </div>

        <button
          onClick={onOpenRequest}
          className="text-xs font-bold text-[#651D2A] hover:underline hidden sm:block"
        >
          + Ajukan Izin / Permintaan
        </button>
      </div>

      {/* Big Touch-Friendly Room Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredRooms.map((roomName) => {
          const roomAssets = assets.filter((a) => a.room === roomName);
          const roomInspectedCount = roomAssets.filter((a) => inspectedUnitIds.has(a.id)).length;
          const isComplete = roomInspectedCount >= roomAssets.length && roomAssets.length > 0;
          const percent = roomAssets.length > 0 ? Math.round((roomInspectedCount / roomAssets.length) * 100) : 0;
          const roomFindingsCount = findings.filter((f) => f.room === roomName).length;

          return (
            <div
              key={roomName}
              onClick={() => setSelectedRoom(roomName)}
              className="bg-white p-5 rounded-2xl border border-stone-200/90 shadow-sm hover:border-[#651D2A] hover:shadow-md transition-all cursor-pointer flex flex-col justify-between space-y-4 touch-press group"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-[#651D2A]/10 text-[#651D2A] group-hover:bg-[#651D2A] group-hover:text-white flex items-center justify-center transition-all shadow-xs">
                    <Building2 className="w-6 h-6" />
                  </div>

                  <div>
                    {isComplete ? (
                      <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 flex items-center gap-1 shadow-2xs">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Selesai
                      </span>
                    ) : roomInspectedCount > 0 ? (
                      <span className="text-[11px] font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200 flex items-center gap-1 shadow-2xs">
                        <Clock className="w-3.5 h-3.5 text-amber-600" />
                        {roomInspectedCount}/{roomAssets.length} Unit
                      </span>
                    ) : (
                      <span className="text-[11px] font-semibold text-stone-500 bg-stone-100 px-2.5 py-1 rounded-full border border-stone-200">
                        Belum Mulai
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-base font-extrabold text-stone-900 group-hover:text-[#651D2A] transition-colors">
                    {roomName}
                  </h3>
                  <p className="text-xs text-stone-500 mt-0.5">
                    {roomAssets.length} unit inventaris aktif terdaftar
                  </p>
                </div>
              </div>

              {/* Progress and Action Button */}
              <div className="space-y-2.5 pt-3 border-t border-stone-100">
                <div className="flex items-center justify-between text-xs font-semibold text-stone-600">
                  <span>Progres</span>
                  <span className="font-bold text-stone-900">{percent}%</span>
                </div>
                <div className="w-full bg-stone-100 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-2 rounded-full transition-all duration-500 ${
                      isComplete ? 'bg-emerald-600' : 'bg-[#651D2A]'
                    }`}
                    style={{ width: `${percent}%` }}
                  />
                </div>

                <div className="flex items-center justify-between pt-1">
                  {roomFindingsCount > 0 ? (
                    <span className="text-[11px] font-bold text-rose-700 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      {roomFindingsCount} Temuan Abnormal
                    </span>
                  ) : (
                    <span className="text-[11px] text-stone-400">
                      {isComplete ? 'Kondisi Prima 5S' : 'Ketuk untuk memeriksa'}
                    </span>
                  )}

                  <div className="text-xs font-bold text-[#651D2A] group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                    <span>Buka</span>
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {filteredRooms.length === 0 && (
          <div className="col-span-full p-12 text-center bg-white rounded-2xl border border-stone-200 text-stone-500 text-xs">
            Tidak ada ruangan pada tab filter ini.
          </div>
        )}
      </div>
    </div>
  );
};
