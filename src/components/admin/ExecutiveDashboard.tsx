import React from 'react';
import {
  Boxes,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowUpRight,
  TrendingUp,
  MapPin,
  ShieldCheck,
  ChevronRight,
  Eye,
  FileText,
  Bell,
  Sparkles,
  Users2
} from 'lucide-react';
import { ExecutiveKPI, RoomSummary, Finding } from '../../types/adr';
import { StatusBadge, PriorityBadge } from '../common/StatusBadge';
import { formatIndonesianDate } from '../../utils/dateUtils';
import { AdminViewType } from './AdminSidebar';

interface ExecutiveDashboardProps {
  kpi: ExecutiveKPI;
  rooms: RoomSummary[];
  recentFindings: Finding[];
  onNavigate: (view: AdminViewType, filterRoom?: string) => void;
  onViewPhoto: (photoUrl: string, title: string, desc: string) => void;
}

export const ExecutiveDashboard: React.FC<ExecutiveDashboardProps> = ({
  kpi,
  rooms,
  recentFindings,
  onNavigate,
  onViewPhoto,
}) => {
  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Welcome & KPI Header */}
      <div className="bg-white p-6 sm:p-7 rounded-3xl border border-stone-200/90 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#651D2A]">
            <span className="w-2 h-2 rounded-full bg-[#651D2A] animate-pulse" />
            <span>ADR Learning Center · Executive Facilities Control</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-stone-900 mt-1 tracking-tight">
            Executive Facilities Dashboard
          </h1>
          <p className="text-xs text-stone-500 mt-1 max-w-2xl leading-relaxed">
            Ringkasan pemantauan real-time kepatuhan 5S inventaris pelatihan, progres checklist mingguan, dan tindak lanjut abnormalitas.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => onNavigate('reports')}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 transition-all touch-press cursor-pointer"
          >
            <FileText className="w-4 h-4 text-[#651D2A]" />
            <span>Laporan Manajemen</span>
          </button>
          <button
            onClick={() => onNavigate('monitoring')}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold rounded-xl bg-[#651D2A] hover:bg-[#4B141E] text-white shadow-md shadow-[#651D2A]/20 transition-all touch-press cursor-pointer"
          >
            <span>Buka Monitoring</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Urgent Pending Approval Notification Banner (if any) */}
      {kpi.pendingRequests > 0 && (
        <div className="bg-amber-50 border-2 border-amber-200/80 rounded-2xl p-4.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs animate-fadeIn">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-amber-950 text-xs block">
                Terdapat {kpi.pendingRequests} Pengajuan Operator Menunggu Persetujuan
              </span>
              <p className="text-xs text-amber-900/80 mt-0.5">
                Operator mengajukan dispensasi jadwal inspeksi / penambahan inventaris yang membutuhkan approval Admin.
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('approvals')}
            className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs transition-colors shrink-0 self-start sm:self-auto touch-press cursor-pointer"
          >
            Tinjau Pengajuan Sekarang →
          </button>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Progres Minggu Ini */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-stone-200 shadow-sm flex flex-col justify-between hover:border-[#651D2A]/40 transition-all">
          <div>
            <div className="flex items-center justify-between text-xs text-stone-500 font-semibold">
              <span>Progres Inspeksi Minggu Ini</span>
              <span className="text-[#651D2A] font-bold text-sm">{kpi.inspectionProgressPercent}%</span>
            </div>
            <div className="text-3xl sm:text-4xl font-black text-stone-900 mt-2 tracking-tight">
              {kpi.completedRoomsThisWeek}{' '}
              <span className="text-base font-semibold text-stone-400">/ {kpi.totalRooms} Ruangan</span>
            </div>
            <div className="w-full bg-stone-100 rounded-full h-2 mt-3 overflow-hidden">
              <div
                className="bg-[#651D2A] h-2 rounded-full transition-all duration-500"
                style={{ width: `${kpi.inspectionProgressPercent}%` }}
              />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-stone-100 text-[11px] text-stone-500 flex items-center justify-between">
            <span>{kpi.totalInspectionsThisWeek} dari {kpi.totalAssets} unit terinspeksi</span>
            <button
              onClick={() => onNavigate('monitoring')}
              className="text-[#651D2A] font-bold hover:underline cursor-pointer"
            >
              Rincian →
            </button>
          </div>
        </div>

        {/* KPI 2: Temuan Abnormalitas Aktif */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-stone-200 shadow-sm flex flex-col justify-between hover:border-rose-300 transition-all">
          <div>
            <div className="flex items-center justify-between text-xs text-stone-500 font-semibold">
              <span>Abnormalitas Aktif</span>
              <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-pulse" />
            </div>
            <div className="text-3xl sm:text-4xl font-black text-rose-800 mt-2 tracking-tight">
              {kpi.openFindings}{' '}
              <span className="text-xs font-bold px-2 py-0.5 rounded-lg bg-rose-100 text-rose-800">
                Open
              </span>
            </div>
            <p className="text-xs text-stone-500 mt-2">
              +{kpi.coordinatedFindings} temuan dalam proses koordinasi perbaikan
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-stone-100 text-[11px] text-stone-500 flex items-center justify-between">
            <span className="text-emerald-700 font-semibold">{kpi.closedFindings} temuan selesai</span>
            <button
              onClick={() => onNavigate('findings')}
              className="text-rose-800 font-bold hover:underline cursor-pointer"
            >
              Kelola temuan →
            </button>
          </div>
        </div>

        {/* KPI 3: Kepatuhan 5S */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-stone-200 shadow-sm flex flex-col justify-between hover:border-emerald-300 transition-all">
          <div>
            <div className="flex items-center justify-between text-xs text-stone-500 font-semibold">
              <span>Tingkat Kepatuhan 5S</span>
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-3xl sm:text-4xl font-black text-emerald-800 mt-2 tracking-tight">
              {kpi.complianceRate}%
            </div>
            <p className="text-xs text-stone-500 mt-2">
              Persentase poin pemeriksaan berkondisi Normal
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-stone-100 text-[11px] text-emerald-700 font-semibold flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Target korporat (≥90%) tercapai</span>
          </div>
        </div>

        {/* KPI 4: Pending Approvals */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-stone-200 shadow-sm flex flex-col justify-between hover:border-amber-300 transition-all">
          <div>
            <div className="flex items-center justify-between text-xs text-stone-500 font-semibold">
              <span>Menunggu Approval</span>
              <Clock className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-3xl sm:text-4xl font-black text-stone-900 mt-2 tracking-tight">
              {kpi.pendingRequests}{' '}
              <span className="text-xs font-bold px-2 py-0.5 rounded-lg bg-amber-100 text-amber-800">
                Pengajuan
              </span>
            </div>
            <p className="text-xs text-stone-500 mt-2">
              Dispensasi jadwal susulan &amp; usulan aset
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-stone-100 text-[11px] text-stone-500 flex items-center justify-between">
            <span>Ditinjau oleh Admin</span>
            <button
              onClick={() => onNavigate('approvals')}
              className="text-amber-800 font-bold hover:underline cursor-pointer"
            >
              Buka approval →
            </button>
          </div>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Room Monitoring Progress Table */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-stone-200/90 shadow-sm p-6 sm:p-7 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base sm:text-lg font-black text-stone-900">
                Monitoring Progres Pemeriksaan per Ruangan
              </h2>
              <p className="text-xs text-stone-500">
                Status penyelesaian checklist fasilitas pada periode minggu berjalan
              </p>
            </div>
            <button
              onClick={() => onNavigate('monitoring')}
              className="text-xs font-bold text-[#651D2A] hover:underline cursor-pointer"
            >
              Lihat Rinci
            </button>
          </div>

          <div className="divide-y divide-stone-100">
            {rooms.map((room) => {
              const percent = Math.round((room.inspectedThisWeek / room.totalAssets) * 100);
              return (
                <div
                  key={room.name}
                  className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-stone-50/80 p-2.5 rounded-2xl transition-all"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-stone-400" />
                      <span className="text-sm font-extrabold text-stone-900">{room.name}</span>
                      {room.isCompleteThisWeek ? (
                        <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                          Selesai
                        </span>
                      ) : room.inspectedThisWeek > 0 ? (
                        <span className="text-[11px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                          {room.inspectedThisWeek}/{room.totalAssets} Unit
                        </span>
                      ) : (
                        <span className="text-[11px] font-semibold text-stone-500 bg-stone-100 px-2 py-0.5 rounded-md">
                          Belum Mulai
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-stone-500">
                      {room.inspectedThisWeek} dari {room.totalAssets} unit terinspeksi
                      {room.openFindingsCount > 0 && (
                        <span className="text-rose-700 font-bold ml-2">
                          · {room.openFindingsCount} temuan aktif
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 w-full sm:w-auto sm:min-w-[180px]">
                    <div className="flex-1">
                      <div className="w-full bg-stone-100 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            room.isCompleteThisWeek ? 'bg-emerald-600' : 'bg-[#651D2A]'
                          }`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                      <div className="text-right text-[11px] font-bold text-stone-600 mt-1">
                        {percent}%
                      </div>
                    </div>

                    <button
                      onClick={() => onNavigate('monitoring', room.name)}
                      className="px-3 py-1.5 text-xs font-bold text-stone-700 bg-stone-100 hover:bg-[#651D2A] hover:text-white rounded-xl transition-all shrink-0 cursor-pointer touch-press"
                    >
                      Pantau
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 1 Col: Urgent Abnormalities requiring attention */}
        <div className="bg-white rounded-3xl border border-stone-200/90 shadow-sm p-6 sm:p-7 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base sm:text-lg font-black text-stone-900">
                Temuan Butuh Perhatian
              </h2>
              <p className="text-xs text-stone-500">Daftar abnormalitas yang belum terselesaikan</p>
            </div>
            <button
              onClick={() => onNavigate('findings')}
              className="text-xs font-bold text-[#651D2A] hover:underline cursor-pointer"
            >
              Lihat Semua
            </button>
          </div>

          <div className="space-y-3">
            {recentFindings.slice(0, 4).map((f) => (
              <div
                key={f.finding_id}
                className="p-3.5 rounded-2xl border border-stone-200/90 hover:border-stone-300 transition-all bg-stone-50/50 space-y-2.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-xs font-extrabold text-stone-900 block">{f.room}</span>
                    <span className="text-[11px] text-stone-500 font-mono">{f.unit_id}</span>
                  </div>
                  <PriorityBadge priority={f.priority} />
                </div>

                <p className="text-xs text-stone-700 line-clamp-2 leading-relaxed font-medium">
                  {f.description}
                </p>

                <div className="flex items-center justify-between pt-1 text-[11px] text-stone-500">
                  <StatusBadge status={f.status} size="sm" />

                  {f.photo_file_id && (
                    <button
                      onClick={() =>
                        onViewPhoto(
                          f.photo_file_id,
                          `Bukti Temuan: ${f.unit_id} (${f.room})`,
                          f.description
                        )
                      }
                      className="text-xs font-bold text-[#651D2A] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Foto
                    </button>
                  )}
                </div>
              </div>
            ))}

            {recentFindings.length === 0 && (
              <div className="p-8 text-center text-xs text-stone-400">
                Tidak ada temuan abnormalitas terbuka saat ini. Seluruh fasilitas normal.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
