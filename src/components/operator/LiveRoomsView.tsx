import React, { useEffect, useState } from 'react';
import { ApiService } from '../../services/apiService';
import { useAuth } from '../../context/AuthContext';
import { InspectionFormModal } from './InspectionFormModal';
import { 
  Building2, 
  CheckCircle2, 
  Clock, 
  ClipboardCheck, 
  ChevronRight, 
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { AssetUnit, ChecklistPoint } from '../../types/adr';

export const LiveRoomsView: React.FC = () => {
  const { token } = useAuth();
  const [rooms, setRooms] = useState<any[]>([]);
  const [room, setRoom] = useState('');
  const [detail, setDetail] = useState<any>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [updated, setUpdated] = useState('');
  
  // State for inspecting asset modal
  const [inspectingAsset, setInspectingAsset] = useState<
    (AssetUnit & { checks: ChecklistPoint[]; isInspectedThisWeek: boolean }) | null
  >(null);

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
          </div>
          <h2 className="text-xl font-extrabold text-stone-900">
            Form Inspeksi Operator
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Sinkronisasi data Google Sheets · Pembaruan: {updated || 'Memuat...'}
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

      {/* Daftar Ruangan */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-3">
          1. Pilih Ruangan Kerja
        </h3>
        {loading && rooms.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-stone-200 text-stone-500 text-xs">
            Memuat daftar ruangan dari database Google Sheets...
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {rooms.map((r: any) => {
              const isSelected = room === r.name;
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
                      : 'border-stone-200 bg-white hover:border-stone-300 hover:shadow-xs'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Building2 className={`w-4 h-4 ${isSelected ? 'text-[#651D2A]' : 'text-stone-400'}`} />
                    <strong className="text-sm text-stone-900 leading-tight">
                      {r.name}
                    </strong>
                  </div>
                  <div className="flex items-center justify-between text-xs text-stone-500">
                    <span>{r.activeAssets} unit inventaris</span>
                    <span className="font-semibold text-[11px] text-[#651D2A]">
                      {isSelected ? 'Terpilih' : 'Pilih Ruangan →'}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Detail Checklist Unit Dalam Ruangan */}
      {room && (
        <section className="bg-white rounded-2xl border border-stone-200/90 p-5 sm:p-6 shadow-sm space-y-5 animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-stone-100 pb-4 gap-3">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#651D2A]">
                2. Daftar Unit & Inventaris
              </span>
              <h3 className="font-extrabold text-xl text-stone-900">
                {room}
              </h3>
            </div>
            {detail && (
              <div className="flex items-center gap-2 text-xs bg-stone-50 px-3 py-1.5 rounded-xl border border-stone-200">
                <span className="text-stone-500">Progres Minggu Berjalan:</span>
                <span className="font-bold text-stone-900 font-mono">
                  {detail.inspectedCount} / {detail.totalCount} Selesai
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

                return (
                  <div
                    key={a.id}
                    className="border border-stone-200/90 rounded-2xl p-4 sm:p-5 hover:border-stone-300 transition-all bg-white"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-base text-stone-900">
                            {a.label || a.name}
                          </h4>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-stone-100 text-stone-600 border border-stone-200">
                            {a.id}
                          </span>
                        </div>
                        <p className="text-xs text-stone-500 mt-0.5">
                          {a.name} · {checksCount} Poin Standar 5S
                        </p>
                      </div>

                      {/* Status / Aksi */}
                      <div className="shrink-0">
                        {isInspected ? (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span>Sudah Diperiksa</span>
                          </div>
                        ) : (
                          <button
                            onClick={() => setInspectingAsset(a)}
                            className="w-full sm:w-auto px-4 py-2 text-xs font-bold text-white bg-[#651D2A] hover:bg-[#4B141E] rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer touch-press"
                          >
                            <ClipboardCheck className="w-4 h-4" />
                            <span>Mulai Periksa</span>
                            <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                          </button>
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

      {/* Form Modal Inspeksi Lengkap */}
      {inspectingAsset && (
        <InspectionFormModal
          isOpen={true}
          onClose={() => setInspectingAsset(null)}
          asset={inspectingAsset}
          roomName={room}
          onSuccess={() => {
            setInspectingAsset(null);
            if (room) refreshRoomDetail(room);
          }}
        />
      )}
    </div>
  );
};
