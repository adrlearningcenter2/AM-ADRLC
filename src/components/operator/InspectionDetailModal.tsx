import { resolveEvidenceUrl } from '../../utils/evidence';
import React from 'react';
import {
  X,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  Clock,
  User,
  Building2,
  Layers,
  FileText,
  ShieldCheck,
  ExternalLink,
  Info
} from 'lucide-react';
import { formatIndonesianDate, formatWeekLabel } from '../../utils/dateUtils';
import { ChecklistPoint } from '../../types/adr';

interface InspectionDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  asset: {
    id: string;
    room: string;
    label?: string;
    name: string;
    model?: string;
    qty?: number;
    checks: ChecklistPoint[];
    inspectionRecord?: {
      inspection_id?: string;
      week_key?: string;
      room_id?: string;
      asset_id?: string;
      status?: string;
      completed_at?: string;
      operator_nip?: string;
      physical_qty?: number | string;
      usable_qty?: number | string;
      answers?: Array<{
        id: string;
        answer: string;
        note?: string;
      }>;
      findings?: Array<{
        finding_id?: string;
        description?: string;
        priority?: string;
        status?: string;
        initial_photo_id?: string;
        photo_file_id?: string;
      }>;
    } | null;
  };
  roomName: string;
  weekKey: string;
  onViewPhoto?: (url: string, title: string, desc: string, meta?: any) => void;
}

export const InspectionDetailModal: React.FC<InspectionDetailModalProps> = ({
  isOpen,
  onClose,
  asset,
  roomName,
  weekKey,
  onViewPhoto,
}) => {
  if (!isOpen) return null;

  const record = asset.inspectionRecord;
  const isGroup = asset.model === 'Kelompok';

  // Map answers by checklist id as well as order index
  const answersMap: Record<string, { answer: string; note: string }> = {};
  if (record && record.answers && Array.isArray(record.answers)) {
    record.answers.forEach((ans: any, idx: number) => {
      const entry = {
        answer: String(ans.answer || 'NORMAL').toUpperCase().includes('ABNORMAL') ? 'ABNORMAL' : 'NORMAL',
        note: ans.note || ans.Catatan || ans.keterangan || '',
      };
      if (ans.id) answersMap[String(ans.id).trim()] = entry;
      answersMap[`__idx_${idx}`] = entry;
    });
  }

  const findings = record?.findings || [];
  const hasAbnormal =
    findings.length > 0 ||
    Object.values(answersMap).some((a) => a.answer === 'ABNORMAL');

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-950/80 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-stone-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-stone-900 to-[#651D2A] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white border border-white/20">
              <FileText className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-300">
                  Data Terbaca (Read-Only)
                </span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-200 px-2 py-0.5 rounded border border-emerald-400/30 font-semibold">
                  Siklus 1 Minggu
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-extrabold leading-snug">
                Hasil Inspeksi Autonomous Maintenance
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-all cursor-pointer"
            aria-label="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1 text-stone-800">
          {/* Autonomous Maintenance Weekly Cycle Banner */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <p className="font-bold text-emerald-950">
                Pemeriksaan Telah Diselesaikan untuk Siklus Minggu Ini
              </p>
              <p className="text-emerald-800 leading-relaxed">
                Pemeriksaan Autonomous Maintenance (AM / 5S) berlaku selama{' '}
                <strong>1 (satu) minggu penuh</strong> (Senin s/d Minggu). Periode aktif:{' '}
                <span className="font-semibold text-emerald-950 font-mono">
                  {formatWeekLabel(weekKey || record?.week_key || '')}
                </span>
                . Data telah terkunci untuk mencegah pengisian ganda.
              </p>
            </div>
          </div>

          {/* Unit & Metadata Overview Card */}
          <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4 sm:p-5 space-y-3.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-200/80 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
                  Unit Inventaris
                </span>
                <h4 className="text-base font-extrabold text-stone-900">
                  {asset.label || asset.name}
                </h4>
                <p className="text-xs text-stone-500">{asset.name}</p>
              </div>
              <div className="flex items-center gap-1.5 self-start sm:self-center">
                <span className="text-xs font-mono bg-white px-2.5 py-1 rounded-lg border border-stone-200 font-bold text-stone-700">
                  {asset.id}
                </span>
                <span className="text-xs font-semibold bg-[#651D2A]/10 text-[#651D2A] px-2.5 py-1 rounded-lg border border-[#651D2A]/20">
                  {roomName}
                </span>
              </div>
            </div>

            {/* Grid of Inspection Details */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div className="bg-white p-2.5 rounded-xl border border-stone-200">
                <span className="text-[10px] text-stone-500 font-medium block">Petugas Pemeriksa</span>
                <strong className="text-stone-900 font-mono flex items-center gap-1 mt-0.5">
                  <User className="w-3.5 h-3.5 text-stone-400" />
                  NIP {record?.operator_nip || '-'}
                </strong>
              </div>

              <div className="bg-white p-2.5 rounded-xl border border-stone-200">
                <span className="text-[10px] text-stone-500 font-medium block">Waktu Selesai</span>
                <strong className="text-stone-900 flex items-center gap-1 mt-0.5 text-[11px]">
                  <Clock className="w-3.5 h-3.5 text-stone-400" />
                  {formatIndonesianDate(record?.completed_at)}
                </strong>
              </div>

              <div className="bg-white p-2.5 rounded-xl border border-stone-200 col-span-2 sm:col-span-1">
                <span className="text-[10px] text-stone-500 font-medium block">Hasil Akhir</span>
                <strong
                  className={`flex items-center gap-1 mt-0.5 text-xs font-bold ${
                    hasAbnormal ? 'text-amber-700' : 'text-emerald-700'
                  }`}
                >
                  {hasAbnormal ? (
                    <>
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                      Ada Temuan Abnormal
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      100% Normal
                    </>
                  )}
                </strong>
              </div>
            </div>

            {/* Model Kelompok Specific Info */}
            {isGroup && (
              <div className="bg-white p-3 rounded-xl border border-stone-200 flex items-center justify-between text-xs">
                <span className="text-stone-600 font-medium">Kuantitas Model Kelompok:</span>
                <div className="flex items-center gap-3 font-mono font-bold">
                  <span className="text-stone-700">
                    Fisik: <span className="text-stone-900">{record?.physical_qty ?? asset.qty}</span>
                  </span>
                  <span className="text-stone-300">|</span>
                  <span className="text-emerald-700">
                    Layak Pakai: <span className="text-emerald-900">{record?.usable_qty ?? asset.qty}</span>
                  </span>
                  <span className="text-stone-300">|</span>
                  <span className="text-stone-500">Standar: {asset.qty}</span>
                </div>
              </div>
            )}
          </div>

          {/* Checklist Points Breakdown */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h5 className="text-xs font-bold uppercase tracking-wider text-stone-500">
                Poin Pemeriksaan Standar 5S ({asset.checks?.length || 0} Butir)
              </h5>
              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                Terverifikasi Lengkap
              </span>
            </div>

            <div className="space-y-2.5">
              {asset.checks && asset.checks.length > 0 ? (
                asset.checks.map((chk, index) => {
                  const ansData = answersMap[String(chk.id).trim()] || answersMap[`__idx_${index}`];
                  const isAnsAbnormal = ansData?.answer === 'ABNORMAL';

                  return (
                    <div
                      key={chk.id || index}
                      className={`p-3.5 rounded-xl border transition-all ${
                        isAnsAbnormal
                          ? 'border-rose-200 bg-rose-50/40'
                          : 'border-stone-200 bg-white hover:border-stone-300'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-2.5">
                          <span className="w-5 h-5 rounded-full bg-stone-100 text-stone-600 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                            {chk.order || index + 1}
                          </span>
                          <div>
                            <p className="text-xs font-medium text-stone-800 leading-relaxed">
                              {chk.question}
                            </p>
                            {ansData?.note && (
                              <div className="mt-2 text-xs bg-white p-2.5 rounded-lg border border-stone-200 text-stone-700">
                                <span className="font-semibold text-stone-500 text-[10px] block mb-0.5">
                                  Catatan Operator:
                                </span>
                                {ansData.note}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Status Badge */}
                        <div className="shrink-0">
                          {isAnsAbnormal ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-100 text-rose-800 text-[11px] font-extrabold border border-rose-200">
                              <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                              ABNORMAL
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 text-[11px] font-extrabold border border-emerald-200">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              NORMAL
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-4 text-center text-xs text-stone-400 bg-stone-50 rounded-xl">
                  Tidak ada data poin checklist.
                </div>
              )}
            </div>
          </div>

          {/* Findings Section if any */}
          {findings.length > 0 && (
            <div className="space-y-3 pt-2 border-t border-stone-200">
              <div className="flex items-center gap-2 text-rose-700 font-bold text-xs uppercase tracking-wider">
                <AlertTriangle className="w-4 h-4" />
                <span>Daftar Temuan Abnormalitas Yang Diteruskan</span>
              </div>

              <div className="space-y-2">
                {findings.map((f, i) => {
                  const photoUrl = f.initial_photo_id || f.photo_file_id;
                  return (
                    <div
                      key={f.finding_id || i}
                      className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-rose-900">
                          {f.finding_id || `TEMUAN #${i + 1}`}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-rose-200 text-rose-900 font-bold text-[10px]">
                          Prioritas: {f.priority || 'SEDANG'}
                        </span>
                      </div>
                      <p className="text-stone-700">{f.description || 'Tidak ada deskripsi'}</p>

                      {photoUrl && (
                        <div className="pt-2">
                          <button
                            type="button"
                            onClick={() => {
                              if (onViewPhoto) {
                                onViewPhoto(
                                  photoUrl,
                                  `Bukti Temuan: ${asset.label || asset.name} (${roomName})`,
                                  f.description || '',
                                  {
                                    room: roomName,
                                    unitId: asset.id,
                                    operatorNip: asset.inspectionRecord?.operator_nip,
                                    date: asset.inspectionRecord?.completed_at,
                                    priority: f.priority || 'SEDANG',
                                    status: f.status || 'OPEN',
                                  }
                                );
                              }
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-rose-300 text-rose-800 text-xs font-semibold hover:bg-rose-100 transition-all cursor-pointer"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>Lihat Foto Bukti Temuan</span>
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Notice box */}
          <div className="p-3 bg-stone-100 rounded-xl text-[11px] text-stone-500 flex items-start gap-2 border border-stone-200">
            <Info className="w-4 h-4 text-stone-400 shrink-0 mt-0.5" />
            <span>
              ID Inspeksi: <strong className="font-mono text-stone-700">{record?.inspection_id || '-'}</strong> · 
              Sesuai SOP Autonomous Maintenance ADR Learning Center, pemeriksaan mingguan yang telah disimpan tidak dapat ditimpa ulang untuk menjaga keaslian jejak audit operasional.
            </span>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-stone-50 border-t border-stone-200 flex items-center justify-between gap-3">
          <span className="text-xs text-stone-500 font-medium hidden sm:inline">
            Status: Lengkap & Terverifikasi
          </span>
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2.5 text-xs font-bold text-white bg-stone-900 hover:bg-stone-800 rounded-xl transition-all cursor-pointer shadow-sm ml-auto"
          >
            Tutup (Selesai Membaca)
          </button>
        </div>
      </div>
    </div>
  );
};
