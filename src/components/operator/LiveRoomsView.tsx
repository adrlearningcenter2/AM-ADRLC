import React, { useEffect, useState } from 'react';
import { ApiService } from '../../services/apiService';
import { useAuth } from '../../context/AuthContext';
import { InspectionFormModal } from './InspectionFormModal';
import { InspectionDetailModal } from './InspectionDetailModal';
import { 
  Building2, 
  CheckCircle2, 
  Clock, 
  ClipboardCheck, 
  ChevronRight, 
  RefreshCw,
  AlertCircle,
  Eye,
  ShieldCheck,
  Calendar,
  AlertTriangle,
  User,
  Check
} from 'lucide-react';
import { AssetUnit, ChecklistPoint } from '../../types/adr';
import { formatIndonesianDate, formatWeekLabel } from '../../utils/dateUtils';

interface LiveRoomsViewProps {
  onViewPhoto?: (
    url: string,
    title: string,
    desc: string,
    meta?: {
      room?: string;
      unitId?: string;
      operatorNip?: string;
      date?: string;
      status?: string;
      priority?: string;
    }
  ) => void;
}

export const LiveRoomsView: React.FC<LiveRoomsViewProps> = ({ onViewPhoto }) => {
  const { token, user, isAdmin } = useAuth();
  const [rooms, setRooms] = useState<any[]>([]);
  const [room, setRoom] = useState('');
  const [detail, setDetail] = useState<any>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [updated, setUpdated] = useState('');
  
  // State for inspecting asset modal (fill form)
  const [inspectingAsset, setInspectingAsset] = useState<
    (AssetUnit & { checks: ChecklistPoint[]; isInspectedThisWeek: boolean }) | null
  >(null);

  // State for viewing completed inspection details (READ-ONLY)
  const [viewingAsset, setViewingAsset] = useState<any | null>(null);

  const refreshRooms = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const result = await ApiService.getRooms(token);
      setRooms(result);
      setError('');
      setUpdated(new Date().toLocaleTimeString('id-ID'));
    } catch (e: any) {
      setError(e.message || 'Gagal membaca ruangan dari server');
    } finally {
      setLoading(false);
    }
  };

  const refreshRoomDetail = async (targetRoom: string) => {
    if (!targetRoom || !token) return;
    try {
      setLoadingDetail(true);
      const r = await ApiService.getRoomData(token, targetRoom);
      setDetail(r);
      setError('');
    } catch (e: any) {
      setError(e.message || 'Gagal memuat detail checklist');
    } finally {
      setLoadingDetail(false);
    }
  };

  useEffect(() => {
    refreshRooms();
    const id = setInterval(refreshRooms, 30000);
    return () => clearInterval(id);
  }, [token]);

  useEffect(() => {
    if (room) {
      refreshRoomDetail(room);
      const id = setInterval(() => refreshRoomDetail(room), 30000);
      return () => clearInterval(id);
    }
  }, [room, token]);

  return (
    <div className="space-y-6 pb-24">
      {/* Header Info */}
      <div className="bg-white border border-stone-200/90 rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-[#651D2A] mb-1">
            <ClipboardCheck className="w-4 h-4" />
            <span>Pemeriksaan Ruangan & Checklist 5S</span>
            {isAdmin && (
              <span className="bg-amber-100 text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-300">
                Mode Monitoring Admin (View-Only)
              </span>
            )}
          </div>
          <h2 className="text-xl font-extrabold text-stone-900">
            {isAdmin ? 'Monitoring Checklist & Ruangan' : 'Form & Riwayat Inspeksi Operator'}
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            {isAdmin
              ? 'Monitoring kepatuhan inspeksi & verifikasi hasil ceksit. Pengisian formulir inspeksi dilaksanakan oleh Operator.'
              : 'Siklus mingguan Autonomous Maintenance · Sinkronisasi Google Sheets: ' + (updated || 'Memuat...')}
          </p>
        </div>
        <button
          onClick={() => {
            refreshRooms();
            if (room) refreshRoomDetail(room);
          }}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-xl transition-all self-start sm:self-center cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Segarkan Data</span>
        </button>
      </div>

      {error && (
        <div role="alert" className="bg-rose-50 border border-rose-200 text-rose-800 rounded-xl p-4 text-xs font-medium flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Autonomous Maintenance Cycle Info Banner */}
      <div className="bg-gradient-to-r from-stone-900 via-stone-800 to-[#651D2A] text-white rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-emerald-400 shrink-0 border border-white/10 mt-0.5 sm:mt-0">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded border border-emerald-400/30">
                SOP Autonomous Maintenance
              </span>
              <span className="text-xs text-stone-300">Berlaku 1 Minggu Penuh</span>
            </div>
            <h3 className="font-extrabold text-sm sm:text-base text-white mt-1">
              Pemeriksaan Berlaku Selama 1 Minggu (Senin – Minggu)
            </h3>
            <p className="text-xs text-stone-300 mt-0.5 leading-relaxed">
              Unit yang telah diisi oleh operator akan berstatus <strong>"Sudah Diperiksa"</strong> dan data terkunci dapat dibaca kembali melalui tombol <em>"Baca / Lihat Hasil Inspeksi"</em>.
            </p>
          </div>
        </div>
      </div>

      {/* 1. Daftar Ruangan */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500">
            1. Pilih Ruangan Kerja
          </h3>
          <span className="text-xs text-stone-500">
            {rooms.length} Ruangan Terdaftar
          </span>
        </div>

        {loading && rooms.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-stone-200 text-stone-500 text-xs">
            Memuat daftar ruangan dari database Google Sheets...
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {rooms.map((r: any) => {
              const isSelected = room === r.name;
              const total = r.totalAssets || r.activeAssets || 0;
              const inspected = r.inspectedThisWeek || 0;
              const isComplete = Boolean(r.isCompleteThisWeek || (total > 0 && inspected >= total));
              const progressPct = total > 0 ? Math.round((inspected / total) * 100) : 0;

              return (
                <button
                  key={r.name}
                  onClick={() => {
                    setRoom(r.name);
                    setDetail(null);
                  }}
                  className={`text-left p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'border-[#651D2A] bg-rose-50/70 shadow-sm ring-1 ring-[#651D2A]'
                      : isComplete
                      ? 'border-emerald-200 bg-emerald-50/30 hover:border-emerald-300'
                      : 'border-stone-200 bg-white hover:border-stone-300 hover:shadow-xs'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Building2
                          className={`w-4 h-4 ${
                            isSelected
                              ? 'text-[#651D2A]'
                              : isComplete
                              ? 'text-emerald-600'
                              : 'text-stone-400'
                          }`}
                        />
                        <strong className="text-sm text-stone-900 leading-tight">
                          {r.name}
                        </strong>
                      </div>

                      {/* Status Badge */}
                      {isComplete ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                          <Check className="w-3 h-3 text-emerald-600" />
                          Selesai
                        </span>
                      ) : inspected > 0 ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                          {inspected}/{total} Unit
                        </span>
                      ) : (
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-stone-100 text-stone-500">
                          Belum Diperiksa
                        </span>
                      )}
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-stone-100 h-1.5 rounded-full overflow-hidden my-2">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          isComplete ? 'bg-emerald-500' : inspected > 0 ? 'bg-amber-500' : 'bg-stone-300'
                        }`}
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-stone-500 pt-1">
                    <span>{total} unit inventaris</span>
                    <span
                      className={`font-semibold text-[11px] ${
                        isSelected ? 'text-[#651D2A]' : 'text-stone-600'
                      }`}
                    >
                      {isSelected ? 'Terpilih ✓' : 'Pilih Ruangan →'}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 2. Detail Checklist Unit Dalam Ruangan */}
      {room && (
        <section className="bg-white rounded-2xl border border-stone-200/90 p-5 sm:p-6 shadow-sm space-y-5 animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-stone-100 pb-4 gap-3">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#651D2A]">
                2. Daftar Unit & Inventaris Ruangan
              </span>
              <h3 className="font-extrabold text-xl text-stone-900">
                {room}
              </h3>
            </div>
            {detail && (
              <div className="flex items-center gap-2 text-xs bg-stone-50 px-3.5 py-2 rounded-xl border border-stone-200">
                <span className="text-stone-500">Progres Minggu Ini:</span>
                <span className="font-bold text-stone-900 font-mono">
                  {detail.inspectedCount} / {detail.totalCount} Selesai
                </span>
                <span className="text-stone-300">|</span>
                <span className="text-stone-500 font-mono text-[11px]">
                  {formatWeekLabel(detail.week)}
                </span>
              </div>
            )}
          </div>

          {loadingDetail && !detail ? (
            <div className="p-8 text-center text-xs text-stone-500">
              Memuat checklist unit untuk {room}...
            </div>
          ) : !detail || !detail.assets || detail.assets.length === 0 ? (
            <div className="p-8 text-center text-xs text-stone-500 bg-stone-50 rounded-xl">
              Belum ada unit inventaris aktif di ruangan ini.
            </div>
          ) : (
            <div className="space-y-4">
              {detail.assets.map((a: any) => {
                const isInspected = Boolean(a.isInspectedThisWeek);
                const checksCount = a.checks?.length || 0;
                const record = a.inspectionRecord;
                const hasAbnormal = Boolean(a.hasAbnormality || (record?.findings && record.findings.length > 0));

                return (
                  <div
                    key={a.id}
                    className={`border rounded-2xl p-4 sm:p-5 transition-all ${
                      isInspected
                        ? 'border-emerald-200/90 bg-emerald-50/20 hover:border-emerald-300'
                        : 'border-stone-200/90 bg-white hover:border-stone-300'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-bold text-base text-stone-900">
                            {a.label || a.name}
                          </h4>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-stone-100 text-stone-600 border border-stone-200">
                            {a.id}
                          </span>
                          {isInspected && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              SUDAH DIINSPEKSI (MINGGU INI)
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-stone-500 mt-1">
                          {a.name} · {checksCount} Poin Standar 5S · Model: {a.model || 'Tunggal'}
                        </p>

                        {/* Completed info preview if already inspected */}
                        {isInspected && record && (
                          <div className="mt-2 text-xs flex flex-wrap items-center gap-2 text-stone-600">
                            {record.completed_at && (
                              <span className="inline-flex items-center gap-1 bg-white px-2 py-0.5 rounded border border-emerald-200 text-emerald-900 font-medium text-[11px]">
                                <Clock className="w-3 h-3 text-emerald-600" />
                                {formatIndonesianDate(record.completed_at)}
                              </span>
                            )}
                            {record.operator_nip && (
                              <span className="inline-flex items-center gap-1 bg-white px-2 py-0.5 rounded border border-stone-200 text-stone-700 text-[11px]">
                                <User className="w-3 h-3 text-stone-400" />
                                Operator NIP: {record.operator_nip}
                              </span>
                            )}
                            {hasAbnormal ? (
                              <span className="inline-flex items-center gap-1 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 text-rose-800 font-semibold text-[11px]">
                                <AlertTriangle className="w-3 h-3 text-rose-600" />
                                Ada Temuan Abnormal
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-emerald-800 font-semibold text-[11px]">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                100% Normal
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Status / Aksi */}
                      <div className="shrink-0 flex items-center gap-2 flex-wrap">
                        {isInspected && (
                          <button
                            onClick={() => setViewingAsset(a)}
                            className="w-full sm:w-auto px-3.5 py-2 text-xs font-bold text-emerald-900 bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer touch-press"
                          >
                            <Eye className="w-4 h-4 text-emerald-700" />
                            <span>Baca Hasil Ceksit</span>
                          </button>
                        )}

                        {isAdmin ? (
                          !isInspected && (
                            <span className="w-full sm:w-auto px-3 py-1.5 text-[11px] font-semibold text-stone-500 bg-stone-100 border border-stone-200 rounded-xl flex items-center justify-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-stone-400" />
                              <span>Menunggu Pemeriksaan Operator</span>
                            </span>
                          )
                        ) : (
                          <>
                            {isInspected && hasAbnormal ? (
                              <button
                                onClick={() => setInspectingAsset(a)}
                                className="w-full sm:w-auto px-3.5 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer touch-press"
                                title="Unit berstatus abnormal. Operator dapat melakukan pengisian ulang/pemeriksaan kembali."
                              >
                                <RefreshCw className="w-3.5 h-3.5" />
                                <span>Isi Ulang (Ada Abnormal)</span>
                              </button>
                            ) : !isInspected ? (
                              <button
                                onClick={() => setInspectingAsset(a)}
                                className="w-full sm:w-auto px-4 py-2 text-xs font-bold text-white bg-[#651D2A] hover:bg-[#4B141E] rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer touch-press"
                              >
                                <ClipboardCheck className="w-4 h-4" />
                                <span>Mulai Periksa</span>
                                <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                              </button>
                            ) : null}
                          </>
                        )}
                      </div>
                    </div>

                    {/* Preview Poin Pertanyaan Checklist */}
                    {a.checks && a.checks.length > 0 && (
                      <div className="mt-3.5 pt-3 border-t border-stone-100">
                        <span className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider block mb-1.5">
                          Butir Checklist 5S:
                        </span>
                        <ul className="grid sm:grid-cols-2 gap-1.5 text-xs text-stone-600">
                          {a.checks.map((c: any, idx: number) => (
                            <li key={c.id || idx} className="flex items-start gap-1.5">
                              <span className="text-stone-400 font-mono text-[10px] mt-0.5">
                                {idx + 1}.
                              </span>
                              <span className="line-clamp-1">{c.question}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* Form Modal Inspeksi Lengkap (WRITE - Operator Only) */}
      {inspectingAsset && !isAdmin && (
        <InspectionFormModal
          isOpen={true}
          onClose={() => setInspectingAsset(null)}
          asset={inspectingAsset}
          roomName={room}
          onSuccess={() => {
            setInspectingAsset(null);
            refreshRooms();
            if (room) refreshRoomDetail(room);
          }}
        />
      )}

      {/* Detail Modal Inspeksi Selesai (READ-ONLY) */}
      {viewingAsset && (
        <InspectionDetailModal
          isOpen={true}
          onClose={() => setViewingAsset(null)}
          asset={viewingAsset}
          roomName={room}
          weekKey={detail?.week || ''}
          onViewPhoto={onViewPhoto}
        />
      )}
    </div>
  );
};
