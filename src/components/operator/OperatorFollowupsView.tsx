import React, { useState } from 'react';
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
  Check
} from 'lucide-react';
import { Finding } from '../../types/adr';
import { MockDatabase } from '../../services/mockData';
import { ApiService } from '../../services/apiService';
import { useAuth } from '../../context/AuthContext';
import { compressImage, CompressedImageResult, formatBytes } from '../../utils/imageCompressor';
import { formatIndonesianDate } from '../../utils/dateUtils';
import { StatusBadge, PriorityBadge } from '../common/StatusBadge';

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
  const [findings, setFindings] = useState<Finding[]>(ApiService.isMockMode() ? MockDatabase.getFindings() : []);

  const [closingFinding, setClosingFinding] = useState<Finding | null>(null);
  const [closeNote, setCloseNote] = useState('');
  const [closePhoto, setClosePhoto] = useState<CompressedImageResult | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const refreshList = async () => {
    if (token && !ApiService.isMockMode()) {
      try {
        const live = await ApiService.getFindings(token);
        if (Array.isArray(live)) {
          setFindings(live);
        }
        onRefresh();
        return;
      } catch (err) {
        console.error('Gagal memuat temuan live untuk operator:', err);
        setFindings([]); return;
      }
    }
    setFindings(MockDatabase.getFindings());
    onRefresh();
  };

  React.useEffect(() => {
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

  const handleSubmitResolution = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!closingFinding) return;

    if (!closeNote.trim()) {
      alert('Catatan penjelasan perbaikan wajib diisi');
      return;
    }

    setIsSubmitting(true);
    try {
      await ApiService.closeFinding(
        token || '',
        user?.nip || '26010006',
        closingFinding.finding_id,
        closeNote,
        closePhoto?.dataUrl
      );

      alert('Abnormalitas berhasil ditandai selesai (CLOSED)!');
      setClosingFinding(null);
      setCloseNote('');
      setClosePhoto(null);
      await refreshList();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Gagal menyelesaikan temuan');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-1">
        <h1 className="text-xl font-bold text-stone-900">
          Tindak Lanjut &amp; Monitoring Abnormalitas
        </h1>
        <p className="text-xs text-stone-500">
          Daftar temuan abnormalitas aktif. Unggah bukti perbaikan untuk menyelesaikan status temuan.
        </p>
      </div>

      <div className="space-y-4">
        {findings.map((finding) => (
          <div
            key={finding.finding_id}
            className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-3"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-stone-100">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-stone-500 bg-stone-100 px-2 py-0.5 rounded">
                    {finding.finding_id}
                  </span>
                  <span className="font-bold text-xs text-stone-900">{finding.room}</span>
                  <span className="text-xs text-stone-500">· {finding.unit_id}</span>
                </div>
                <div className="text-[11px] text-stone-400 mt-1">
                  Dilaporkan: {formatIndonesianDate(finding.created_at)}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <PriorityBadge priority={finding.priority} />
                <StatusBadge status={finding.status} />
              </div>
            </div>

            <p className="text-xs text-stone-800 bg-stone-50 p-3 rounded-xl border border-stone-200 leading-relaxed">
              {finding.description}
            </p>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-stone-100">
              <div>
                {finding.photo_file_id && (
                  <button
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
                    className="min-h-[44px] px-3 py-2 text-xs font-bold text-[#651D2A] bg-rose-50 hover:bg-rose-100 rounded-xl transition-colors flex items-center gap-1.5 touch-press cursor-pointer"
                  >
                    <Eye className="w-4 h-4" />
                    <span>Lihat Foto Bukti</span>
                  </button>
                )}
              </div>

              {finding.status !== 'CLOSED' && finding.status !== 'CANCELLED' && (
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => {
                      const note = prompt('Masukkan catatan recheck / pengecekan lapangan:');
                      if (note && note.trim()) {
                        ApiService.addFollowup(token || '', user?.nip || '26010006', finding.finding_id, note)
                          .then(() => {
                            alert('Catatan recheck berhasil ditambahkan ke riwayat!');
                            refreshList();
                          })
                          .catch((err) => alert(err.message));
                      }
                    }}
                    className="min-h-[44px] px-3.5 py-2 text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-xl transition-colors cursor-pointer touch-press"
                  >
                    + Catatan Recheck
                  </button>

                  <button
                    onClick={() => {
                      setClosingFinding(finding);
                      setCloseNote('');
                      setClosePhoto(null);
                    }}
                    className="min-h-[44px] px-4 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer touch-press"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Selesaikan Temuan</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Close Finding Modal */}
      {closingFinding && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-sm animate-fadeIn"
          onClick={() => setClosingFinding(null)}
        >
          <div
            className="max-w-md w-full bg-white rounded-2xl p-6 border border-stone-200 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <h3 className="text-base font-bold text-stone-900">Konfirmasi Penyelesaian Temuan</h3>
              <p className="text-xs text-stone-500 mt-0.5">
                {closingFinding.room} · Unit {closingFinding.unit_id}
              </p>
            </div>

            <form onSubmit={handleSubmitResolution} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  Catatan Tindakan Perbaikan <span className="text-rose-600">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Contoh: Baut telah diganti unit baru dan dikencangkan; fungsi normal."
                  value={closeNote}
                  onChange={(e) => setCloseNote(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-[#651D2A]"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  Foto Bukti Kondisi Selesai / Bagus (Opsional)
                </label>

                {closePhoto ? (
                  <div className="flex items-center gap-3 p-2 bg-stone-50 border border-stone-200 rounded-xl">
                    <img
                      src={closePhoto.dataUrl}
                      alt="Bukti selesai"
                      className="w-14 h-14 object-cover rounded-lg border"
                    />
                    <div className="flex-1 text-[11px] text-stone-600">
                      <span className="font-semibold block text-stone-900">Foto Siap Diunggah</span>
                      <span>Ukuran: {formatBytes(closePhoto.compressedSizeBytes)}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setClosePhoto(null)}
                      className="p-1.5 text-rose-700 hover:bg-rose-50 rounded"
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

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setClosingFinding(null)}
                  className="px-3 py-2 text-xs font-semibold text-stone-600 hover:text-stone-900"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-sm"
                >
                  {isSubmitting ? 'Memproses...' : 'Tandai Selesai (Closed)'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
