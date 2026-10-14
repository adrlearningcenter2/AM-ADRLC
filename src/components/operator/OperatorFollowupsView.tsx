import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Camera,
  Trash2,
  Calendar,
  Eye,
  MapPin,
  Clock,
  Sparkles,
  Check,
  MessageSquare,
  Plus,
  X,
  Send,
  Building2,
  AlertCircle,
  FileCheck
} from 'lucide-react';
import { Finding, Followup } from '../../types/adr';
import { MockDatabase } from '../../services/mockData';
import { ApiService } from '../../services/apiService';
import { useAuth } from '../../context/AuthContext';
import { compressImage, CompressedImageResult, formatBytes } from '../../utils/imageCompressor';
import { formatIndonesianDate } from '../../utils/dateUtils';
import { StatusBadge, PriorityBadge } from '../common/StatusBadge';
import { EvidenceThumbnail } from '../common/EvidenceThumbnail';

interface OperatorFollowupsViewProps {
  onViewPhoto: (
    photoUrl: string,
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
  onRefresh: () => void;
}

export const OperatorFollowupsView: React.FC<OperatorFollowupsViewProps> = ({
  onViewPhoto,
  onRefresh,
}) => {
  const { user, token } = useAuth();
  const [findings, setFindings] = useState<Finding[]>([]);
  const [followups, setFollowups] = useState<Followup[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Recheck / Followup Note Modal
  const [recheckingFinding, setRecheckingFinding] = useState<Finding | null>(null);
  const [recheckNote, setRecheckNote] = useState('');
  const [isSubmittingRecheck, setIsSubmittingRecheck] = useState(false);

  // Close Finding Modal
  const [closingFinding, setClosingFinding] = useState<Finding | null>(null);
  const [closeNote, setCloseNote] = useState('');
  const [closePhoto, setClosePhoto] = useState<CompressedImageResult | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [isSubmittingClose, setIsSubmittingClose] = useState(false);

  const refreshList = async () => {
    setLoading(true);
    try {
      if (token && !ApiService.isMockMode()) {
        const live = await ApiService.getFindings(token);
        if (Array.isArray(live)) {
          setFindings(live);
        }
        const liveFols = await ApiService.getFollowups(token);
        if (Array.isArray(liveFols)) {
          setFollowups(liveFols);
        }
        setErrorMsg('');
        onRefresh();
        return;
      }
      setFindings(MockDatabase.getFindings());
      setFollowups(MockDatabase.getFollowups());
      setErrorMsg('');
      onRefresh();
    } catch (err: any) {
      console.error('Gagal memuat temuan live untuk operator:', err);
      setErrorMsg(err.message || 'Gagal memuat daftar temuan');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshList();
  }, [token]);

  const handlePhotoUpload = async (file: File) => {
    setIsCompressing(true);
    try {
      const res = await compressImage(file, 1200, 0.65);
      setClosePhoto(res);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Gagal kompresi foto bukti');
    } finally {
      setIsCompressing(false);
    }
  };

  const handleSubmitRecheck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recheckingFinding) return;
    if (!recheckNote.trim()) {
      alert('Catatan tindak lanjut / recheck wajib diisi.');
      return;
    }

    setIsSubmittingRecheck(true);
    try {
      await ApiService.addFollowup(
        token || '',
        user?.nip || '26010006',
        recheckingFinding.finding_id,
        recheckNote.trim()
      );

      setSuccessMsg(`Catatan tindak lanjut berhasil ditambahkan untuk ${recheckingFinding.unit_id}`);
      setTimeout(() => setSuccessMsg(''), 4000);
      setRecheckingFinding(null);
      setRecheckNote('');
      await refreshList();
    } catch (err: any) {
      alert(err.message || 'Gagal menambahkan catatan tindak lanjut');
    } finally {
      setIsSubmittingRecheck(false);
    }
  };

  const handleSubmitResolution = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!closingFinding) return;

    if (!closeNote.trim()) {
      alert('Catatan tindakan perbaikan wajib diisi');
      return;
    }

    setIsSubmittingClose(true);
    try {
      await ApiService.closeFinding(
        token || '',
        user?.nip || '26010006',
        closingFinding.finding_id,
        closeNote.trim(),
        closePhoto?.dataUrl
      );

      setSuccessMsg(`Abnormalitas ${closingFinding.unit_id} berhasil diselesaikan (CLOSED)!`);
      setTimeout(() => setSuccessMsg(''), 4000);
      setClosingFinding(null);
      setCloseNote('');
      setClosePhoto(null);
      await refreshList();
    } catch (err: any) {
      alert(err.message || 'Gagal menyelesaikan temuan');
    } finally {
      setIsSubmittingClose(false);
    }
  };

  const openFindings = findings.filter((f) => f.status === 'OPEN' || f.status === 'COORDINATED');
  const closedFindings = findings.filter((f) => f.status === 'CLOSED');

  return (
    <div className="space-y-6 pb-20 md:pb-6 animate-fadeIn">
      {/* Top Banner */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-stone-200 shadow-sm space-y-1">
        <div className="flex items-center gap-2 text-xs font-bold text-[#651D2A] mb-1">
          <AlertTriangle className="w-4 h-4" />
          <span>Tindak Lanjut &amp; Penyelesaian Abnormalitas</span>
        </div>
        <h1 className="text-xl font-extrabold text-stone-900">
          Daftar Temuan Abnormalitas
        </h1>
        <p className="text-xs text-stone-500">
          Operator melaksanakan recheck, mencatat tindakan perbaikan, mengunggah bukti fisik, dan menyelesaikan abnormalitas.
        </p>
      </div>

      {/* Success Notification */}
      {successMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl text-xs font-semibold flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 bg-rose-50 border border-rose-300 text-rose-900 rounded-xl text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-700 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Active Abnormalities List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between text-xs text-stone-500 px-1">
          <span className="font-bold text-stone-800">
            Temuan Aktif ({openFindings.length})
          </span>
          <span>Selesai: {closedFindings.length}</span>
        </div>

        {loading && findings.length === 0 ? (
          <div className="p-10 text-center text-xs text-stone-500 bg-white rounded-2xl border border-stone-200">
            Memuat daftar abnormalitas...
          </div>
        ) : openFindings.length === 0 ? (
          <div className="p-10 text-center bg-white rounded-2xl border border-stone-200 text-stone-600 space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
            <h3 className="font-bold text-stone-900">Tidak Ada Abnormalitas Aktif</h3>
            <p className="text-xs text-stone-500">
              Semua fasilitas &amp; unit inventaris berada dalam kondisi normal atau sudah diselesaikan.
            </p>
          </div>
        ) : (
          openFindings.map((finding) => {
            const findingFollowups = followups.filter((f) => f.finding_id === finding.finding_id);

            return (
              <div
                key={finding.finding_id}
                className="bg-white p-5 sm:p-6 rounded-2xl border border-stone-200 shadow-xs space-y-4 hover:border-stone-300 transition-all"
              >
                {/* Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-stone-100">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-bold text-stone-600 bg-stone-100 px-2 py-0.5 rounded border border-stone-200">
                        {finding.finding_id}
                      </span>
                      <span className="font-bold text-xs text-stone-900">{finding.room}</span>
                      <span className="text-xs text-stone-500">· Unit: {finding.unit_id}</span>
                    </div>
                    <div className="text-[11px] text-stone-400 mt-1 flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Dilaporkan: {formatIndonesianDate(finding.created_at)}</span>
                      <span>· Pelapor NIP: {finding.created_by}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <PriorityBadge priority={finding.priority} />
                    <StatusBadge status={finding.status} />
                  </div>
                </div>

                {/* Problem Description & Photo */}
                <div className="flex flex-col md:flex-row gap-4 items-start">
                  <div className="flex-1 space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block">
                      Deskripsi Temuan:
                    </span>
                    <p className="text-xs text-stone-800 bg-stone-50 p-3.5 rounded-xl border border-stone-200 leading-relaxed font-medium">
                      {finding.description}
                    </p>

                    {finding.assigned_to && (
                      <div className="text-xs text-stone-600 flex items-center gap-1.5 pt-1">
                        <span className="font-semibold text-stone-500">Koordinasi Admin / PIC:</span>
                        <span className="font-bold text-stone-800">{finding.assigned_to}</span>
                      </div>
                    )}
                  </div>

                  {finding.photo_file_id && (
                    <div className="shrink-0 w-full sm:w-44">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block mb-1">
                        Foto Bukti Awal:
                      </span>
                      <EvidenceThumbnail
                        photoId={finding.photo_file_id}
                        alt={`Bukti temuan ${finding.unit_id}`}
                        onClick={() =>
                          onViewPhoto(
                            finding.photo_file_id,
                            `Bukti Temuan: ${finding.unit_id} (${finding.room})`,
                            finding.description,
                            {
                              room: finding.room,
                              unitId: finding.unit_id,
                              operatorNip: finding.created_by,
                              date: finding.created_at,
                              priority: finding.priority,
                              status: finding.status,
                            }
                          )
                        }
                      />
                    </div>
                  )}
                </div>

                {/* Followup timeline if present */}
                {findingFollowups.length > 0 && (
                  <div className="pt-2 border-t border-stone-100 space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block">
                      Riwayat Tindak Lanjut Lapangan ({findingFollowups.length}):
                    </span>
                    <div className="space-y-1.5">
                      {findingFollowups.map((fol) => (
                        <div
                          key={fol.followup_id}
                          className="bg-stone-50/80 p-2.5 rounded-xl border border-stone-200 text-xs text-stone-700 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5"
                        >
                          <div>
                            <span className="font-medium text-stone-900 block">{fol.note}</span>
                            <span className="text-[10px] text-stone-500">
                              Oleh NIP {fol.operator_nip} · {formatIndonesianDate(fol.created_at)}
                            </span>
                          </div>
                          {fol.photo_file_id && (
                            <button
                              onClick={() =>
                                onViewPhoto(
                                  fol.photo_file_id!,
                                  `Bukti Selesai (${fol.followup_id})`,
                                  fol.note
                                )
                              }
                              className="px-2 py-0.5 text-[10px] font-bold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 rounded self-start sm:self-auto cursor-pointer"
                            >
                              Lihat Bukti Foto
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Operator Action Buttons */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-end gap-2.5 pt-3 border-t border-stone-100">
                  <button
                    onClick={() => {
                      setRecheckingFinding(finding);
                      setRecheckNote('');
                    }}
                    className="min-h-[44px] px-3.5 py-2 text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-xl transition-colors cursor-pointer touch-press flex items-center justify-center gap-1.5"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>+ Tindak Lanjut / Recheck</span>
                  </button>

                  <button
                    onClick={() => {
                      setClosingFinding(finding);
                      setCloseNote('');
                      setClosePhoto(null);
                    }}
                    className="min-h-[44px] px-4 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer touch-press"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Selesaikan Abnormalitas</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal: Add Recheck Note */}
      {recheckingFinding && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-sm animate-fadeIn"
          onClick={() => setRecheckingFinding(null)}
        >
          <div
            className="max-w-md w-full bg-white rounded-2xl p-6 border border-stone-200 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-stone-100">
              <div>
                <h3 className="text-base font-bold text-stone-900">
                  Tambah Catatan Tindak Lanjut
                </h3>
                <p className="text-xs text-stone-500">
                  {recheckingFinding.room} · Unit {recheckingFinding.unit_id}
                </p>
              </div>
              <button
                onClick={() => setRecheckingFinding(null)}
                className="p-1.5 text-stone-400 hover:text-stone-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitRecheck} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  Catatan Progres Lapangan <span className="text-rose-600">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Contoh: Telah diperiksa kembali. Sparepart sedang dipesan oleh bagian logistik..."
                  value={recheckNote}
                  onChange={(e) => setRecheckNote(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-[#651D2A]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setRecheckingFinding(null)}
                  className="px-3.5 py-2 text-xs font-semibold text-stone-600 hover:text-stone-900"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingRecheck}
                  className="min-h-[44px] px-4 py-2 text-xs font-bold text-white bg-[#651D2A] hover:bg-[#4B141E] rounded-xl shadow-sm transition-all"
                >
                  {isSubmittingRecheck ? 'Menyimpan...' : 'Simpan Tindak Lanjut'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Close Finding */}
      {closingFinding && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-sm animate-fadeIn"
          onClick={() => setClosingFinding(null)}
        >
          <div
            className="max-w-md w-full bg-white rounded-2xl p-6 border border-stone-200 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-stone-100">
              <div>
                <h3 className="text-base font-bold text-stone-900">
                  Konfirmasi Penyelesaian Temuan
                </h3>
                <p className="text-xs text-stone-500">
                  {closingFinding.room} · Unit {closingFinding.unit_id}
                </p>
              </div>
              <button
                onClick={() => setClosingFinding(null)}
                className="p-1.5 text-stone-400 hover:text-stone-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitResolution} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  Catatan Tindakan Perbaikan <span className="text-rose-600">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Contoh: Kabel telah diganti baru, konektor terpasang kuat, dan tes fungsi audio/video normal."
                  value={closeNote}
                  onChange={(e) => setCloseNote(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-[#651D2A]"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  Foto Bukti Kondisi Selesai / Bagus (Disarankan)
                </label>

                {closePhoto ? (
                  <div className="flex items-center gap-3 p-2.5 bg-stone-50 border border-stone-200 rounded-xl">
                    <img
                      src={closePhoto.dataUrl}
                      alt="Bukti selesai"
                      className="w-14 h-14 object-cover rounded-lg border border-stone-200"
                    />
                    <div className="flex-1 text-[11px] text-stone-600">
                      <span className="font-bold block text-stone-900">Foto Bukti Terlampir</span>
                      <span>Ukuran: {formatBytes(closePhoto.compressedSizeBytes)}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setClosePhoto(null)}
                      className="p-1.5 text-rose-700 hover:bg-rose-50 rounded"
                      title="Hapus foto"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-stone-300 hover:border-[#651D2A] rounded-xl cursor-pointer bg-stone-50/50 transition-colors">
                    {isCompressing ? (
                      <span className="text-stone-600 font-semibold">Mengompresi foto...</span>
                    ) : (
                      <>
                        <Camera className="w-5 h-5 text-stone-500 mb-1" />
                        <span className="font-semibold text-stone-700">Pilih / Ambil Foto</span>
                        <span className="text-[10px] text-stone-400">Kompresi otomatis JPEG</span>
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handlePhotoUpload(f);
                      }}
                    />
                  </label>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setClosingFinding(null)}
                  className="px-3.5 py-2 text-xs font-semibold text-stone-600 hover:text-stone-900"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingClose}
                  className="min-h-[44px] px-4 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl shadow-sm transition-all"
                >
                  {isSubmittingClose ? 'Memproses...' : 'Tandai Selesai (Closed)'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
