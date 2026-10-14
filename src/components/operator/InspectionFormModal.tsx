import React, { useState } from 'react';
import {
  X,
  Camera,
  CheckCircle2,
  AlertTriangle,
  Trash2,
  CheckCheck,
  Plus,
  Minus,
  Sparkles,
  Info,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import { AssetUnit, ChecklistPoint, InspectionSubmissionItem } from '../../types/adr';
import { compressImage, CompressedImageResult, formatBytes } from '../../utils/imageCompressor';
import { ApiService } from '../../services/apiService';
import { useAuth } from '../../context/AuthContext';
import { getCurrentWeekKey, formatWeekLabel } from '../../utils/dateUtils';

interface InspectionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  asset: AssetUnit & { 
    checks: ChecklistPoint[]; 
    isInspectedThisWeek: boolean;
    hasAbnormality?: boolean;
    inspectionRecord?: any;
  };
  roomName: string;
  onSuccess: () => void;
}

interface ItemAnswerState {
  answer: 'NORMAL' | 'ABNORMAL' | '';
  note: string;
  photoResult: CompressedImageResult | null;
  isCompressing: boolean;
}

export const InspectionFormModal: React.FC<InspectionFormModalProps> = ({
  isOpen,
  onClose,
  asset,
  roomName,
  onSuccess,
}) => {
  const { user, token } = useAuth();
  const currentWeek = getCurrentWeekKey();

  const isGroup = asset.model === 'Kelompok';
  const [physicalQty, setPhysicalQty] = useState<number>(asset.qty);
  const [usableQty, setUsableQty] = useState<number>(asset.qty);

  // Initialize answer states for each checklist point
  const [answers, setAnswers] = useState<Record<string, ItemAnswerState>>(() => {
    const init: Record<string, ItemAnswerState> = {};
    asset.checks.forEach((c) => {
      init[c.id] = {
        answer: '',
        note: '',
        photoResult: null,
        isCompressing: false,
      };
    });
    return init;
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  // Real-time completion progress
  const totalPoints = asset.checks.length;
  const answeredPoints = Object.values(answers).filter((a) => a.answer !== '').length;
  const abnormalPointsCount = Object.values(answers).filter((a) => a.answer === 'ABNORMAL').length;
  const isAllAnswered = answeredPoints === totalPoints;
  const progressPercent = totalPoints > 0 ? Math.round((answeredPoints / totalPoints) * 100) : 0;

  // Quick Action: Fill all unanswered as Normal
  const handleMarkAllNormal = () => {
    setAnswers((prev) => {
      const updated = { ...prev };
      asset.checks.forEach((c) => {
        if (!updated[c.id].answer) {
          updated[c.id] = {
            ...updated[c.id],
            answer: 'NORMAL',
          };
        }
      });
      return updated;
    });
    setErrorMessage(null);
  };

  const handleSetAnswer = (checklistId: string, answer: 'NORMAL' | 'ABNORMAL') => {
    setAnswers((prev) => ({
      ...prev,
      [checklistId]: {
        ...prev[checklistId],
        answer,
      },
    }));
    setErrorMessage(null);
  };

  const handleSetNote = (checklistId: string, note: string) => {
    setAnswers((prev) => ({
      ...prev,
      [checklistId]: {
        ...prev[checklistId],
        note,
      },
    }));
  };

  const handlePhotoUpload = async (checklistId: string, file: File) => {
    setAnswers((prev) => ({
      ...prev,
      [checklistId]: {
        ...prev[checklistId],
        isCompressing: true,
      },
    }));

    try {
      const result = await compressImage(file, 1200, 0.65);
      setAnswers((prev) => ({
        ...prev,
        [checklistId]: {
          ...prev[checklistId],
          photoResult: result,
          isCompressing: false,
        },
      }));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Gagal memproses foto');
      setAnswers((prev) => ({
        ...prev,
        [checklistId]: {
          ...prev[checklistId],
          isCompressing: false,
        },
      }));
    }
  };

  const handleRemovePhoto = (checklistId: string) => {
    setAnswers((prev) => ({
      ...prev,
      [checklistId]: {
        ...prev[checklistId],
        photoResult: null,
      },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Allow re-submission if re-inspecting an abnormal unit or updating
    // Only block if inspected and 100% normal without abnormal
    if (asset.isInspectedThisWeek && !asset.hasAbnormality && !(asset.inspectionRecord?.findings && asset.inspectionRecord.findings.length > 0)) {
      setErrorMessage('Inventaris ini sudah diperiksa dan 100% Normal untuk minggu berjalan. Hanya unit berstatus Abnormal yang dapat diisi kembali.');
      return;
    }

    if (isGroup) {
      if (physicalQty < 0 || usableQty < 0) {
        setErrorMessage('Jumlah fisik atau layak pakai tidak valid.');
        return;
      }
      if (usableQty > physicalQty) {
        setErrorMessage('Jumlah layak pakai tidak boleh melebihi jumlah fisik aktual.');
        return;
      }
    }

    // Verify all points answered
    for (const c of asset.checks) {
      const a = answers[c.id];
      if (!a || !a.answer) {
        setErrorMessage(`Harap jawab poin pemeriksaan nomor ${c.order}: "${c.question.slice(0, 40)}..."`);
        return;
      }
      if (a.answer === 'ABNORMAL') {
        if (!a.note.trim()) {
          setErrorMessage(`Catatan wajib diisi untuk poin abnormal nomor ${c.order}.`);
          return;
        }
        if (!a.photoResult) {
          setErrorMessage(`Foto bukti wajib diunggah untuk poin abnormal nomor ${c.order}.`);
          return;
        }
      }
    }

    // If usable < standard on Kelompok model, at least one point must be abnormal
    const hasAbnormalPoint = Object.values(answers).some((a) => a.answer === 'ABNORMAL');
    if (isGroup && (usableQty < asset.qty || physicalQty > usableQty) && !hasAbnormalPoint) {
      setErrorMessage(
        `Jumlah layak pakai (${usableQty}) kurang dari standar (${asset.qty}). Wajib tandai setidaknya satu poin sebagai Abnormal beserta catatan dan foto.`
      );
      return;
    }

    // Prepare payload
    const submissionItems: InspectionSubmissionItem[] = asset.checks.map((c) => {
      const a = answers[c.id];
      return {
        id: c.id,
        answer: a.answer as 'NORMAL' | 'ABNORMAL',
        note: a.note,
        photo: a.photoResult
          ? {
              mime: a.photoResult.mime,
              base64: a.photoResult.base64,
            }
          : null,
      };
    });

    setIsSubmitting(true);
    try {
      const res = await ApiService.saveInspection(token || '', user?.nip || '26010006', {
        week: currentWeek,
        room: roomName,
        unitId: asset.id,
        answers: submissionItems,
        physical: isGroup ? physicalQty : null,
        usable: isGroup ? usableQty : null,
      });

      alert(
        `Hasil inspeksi berhasil disimpan!\n${
          res.findingsCount > 0
            ? `Tercatat ${res.findingsCount} temuan abnormal baru untuk ditindaklanjuti.`
            : 'Seluruh poin berstatus Normal.'
        }`
      );
      onSuccess();
      onClose();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Gagal menyimpan inspeksi');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-950/80 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="relative max-w-2xl w-full bg-white rounded-3xl overflow-hidden shadow-2xl border border-stone-200 flex flex-col max-h-[94vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Header */}
        <div className="px-6 py-4.5 bg-[#651D2A] text-white flex items-center justify-between border-b border-rose-900/40">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono font-bold bg-white/20 px-2 py-0.5 rounded-md text-white/90">
                {asset.id}
              </span>
              <span className="text-xs text-rose-200 font-medium">{roomName}</span>
            </div>
            <h2 className="text-base sm:text-lg font-black text-white mt-1 leading-snug">
              {asset.label}
            </h2>
            <p className="text-xs text-rose-100/90">{asset.name}</p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors touch-press cursor-pointer"
            title="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sticky Real-Time Checklist Progress Bar */}
        <div className="bg-stone-50 border-b border-stone-200 px-6 py-3 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-stone-700">
              Progres Checklist:
            </span>
            <span className="font-bold text-[#651D2A]">
              {answeredPoints} / {totalPoints} Poin ({progressPercent}%)
            </span>
            {abnormalPointsCount > 0 && (
              <span className="text-[11px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-md">
                {abnormalPointsCount} Abnormal
              </span>
            )}
          </div>

          {/* Quick Helper Button: Mark All Normal */}
          {!isAllAnswered && (
            <button
              type="button"
              onClick={handleMarkAllNormal}
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold text-xs rounded-lg transition-all touch-press cursor-pointer shadow-2xs"
            >
              <CheckCheck className="w-3.5 h-3.5 text-emerald-700" />
              <span>Tandai Semua Normal</span>
            </button>
          )}
        </div>

        {/* Modal Form Scroll Area */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 text-xs">
          {/* Group Quantities (Model Kelompok) with Touch Steppers */}
          {isGroup && (
            <div className="p-4 sm:p-5 bg-rose-50/40 border border-rose-200/80 rounded-2xl space-y-3.5 shadow-2xs">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-bold text-stone-900 text-sm block">
                    Pencatatan Jumlah Fisik &amp; Kelayakan
                  </span>
                  <span className="text-stone-500 text-xs">
                    Model Kelompok · Standar Resmi: <strong>{asset.qty} Unit</strong>
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Physical Qty Stepper */}
                <div className="bg-white p-3.5 rounded-xl border border-stone-200 space-y-2">
                  <label className="block font-semibold text-stone-700 text-xs">
                    Jumlah Fisik di Ruangan
                  </label>
                  <div className="flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => setPhysicalQty((prev) => Math.max(0, prev - 1))}
                      className="w-10 h-10 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 flex items-center justify-center font-bold text-base touch-press"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <input
                      type="number"
                      min={0}
                      required
                      value={physicalQty}
                      onChange={(e) => setPhysicalQty(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-20 text-center text-lg font-bold text-stone-900 border border-stone-200 rounded-lg py-1.5 focus:outline-none focus:ring-2 focus:ring-[#651D2A]/20"
                    />
                    <button
                      type="button"
                      onClick={() => setPhysicalQty((prev) => prev + 1)}
                      className="w-10 h-10 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 flex items-center justify-center font-bold text-base touch-press"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Usable Qty Stepper */}
                <div className="bg-white p-3.5 rounded-xl border border-stone-200 space-y-2">
                  <label className="block font-semibold text-stone-700 text-xs">
                    Jumlah Layak Pakai (Kondisi Baik)
                  </label>
                  <div className="flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => setUsableQty((prev) => Math.max(0, prev - 1))}
                      className="w-10 h-10 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 flex items-center justify-center font-bold text-base touch-press"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <input
                      type="number"
                      min={0}
                      max={physicalQty}
                      required
                      value={usableQty}
                      onChange={(e) => setUsableQty(Math.min(physicalQty, Math.max(0, parseInt(e.target.value) || 0)))}
                      className={`w-20 text-center text-lg font-bold rounded-lg py-1.5 border focus:outline-none focus:ring-2 focus:ring-[#651D2A]/20 ${
                        usableQty < asset.qty ? 'text-rose-700 border-rose-300 bg-rose-50' : 'text-emerald-700 border-stone-200'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setUsableQty((prev) => Math.min(physicalQty, prev + 1))}
                      className="w-10 h-10 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 flex items-center justify-center font-bold text-base touch-press"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {usableQty < asset.qty && (
                <div className="p-3 bg-rose-100/80 border border-rose-200 rounded-xl text-rose-900 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-700 shrink-0" />
                  <span>
                    Jumlah layak pakai ({usableQty}) di bawah standar ({asset.qty}). Wajib menandai poin abnormal dan melampirkan foto bukti kondisi fisik.
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Error Message Callout */}
          {errorMessage && (
            <div className="p-4 bg-rose-50 border-2 border-rose-300 rounded-2xl text-rose-900 text-xs flex items-start gap-3 animate-shake">
              <AlertTriangle className="w-5 h-5 text-rose-700 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="font-bold block">Pemeriksaan Belum Lengkap:</span>
                <p className="leading-relaxed">{errorMessage}</p>
              </div>
            </div>
          )}

          {/* Checklist Items List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs font-bold text-stone-900 uppercase tracking-wider">
              <span>Poin Checklist Pemeriksaan 5S</span>
              <span className="text-stone-400 font-normal">Pilih Normal atau Abnormal</span>
            </div>

            {asset.checks.map((chk, index) => {
              const state = answers[chk.id] || {
                answer: '',
                note: '',
                photoResult: null,
                isCompressing: false,
              };

              const isNormal = state.answer === 'NORMAL';
              const isAbnormal = state.answer === 'ABNORMAL';

              return (
                <div
                  key={chk.id}
                  className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                    isAbnormal
                      ? 'border-rose-400 bg-rose-50/40 ring-1 ring-rose-200 shadow-xs'
                      : isNormal
                      ? 'border-emerald-300 bg-emerald-50/20'
                      : 'border-stone-200 bg-white hover:border-stone-300'
                  } space-y-3.5`}
                >
                  {/* Point Question */}
                  <div className="flex items-start gap-3">
                    <span
                      className={`w-6 h-6 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${
                        isNormal
                          ? 'bg-emerald-600 text-white'
                          : isAbnormal
                          ? 'bg-rose-700 text-white'
                          : 'bg-stone-100 text-stone-600'
                      }`}
                    >
                      {index + 1}
                    </span>
                    <div className="text-sm font-bold text-stone-900 leading-snug">
                      {chk.question}
                    </div>
                  </div>

                  {/* Ergonomic Big Touch Buttons for Normal vs Abnormal */}
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <button
                      type="button"
                      onClick={() => handleSetAnswer(chk.id, 'NORMAL')}
                      className={`py-3 px-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all touch-press cursor-pointer text-xs sm:text-sm ${
                        isNormal
                          ? 'bg-emerald-700 text-white shadow-md ring-2 ring-emerald-600 scale-[1.01]'
                          : 'bg-stone-50 border-2 border-stone-200 text-stone-700 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-300'
                      }`}
                    >
                      <CheckCircle2 className={`w-5 h-5 ${isNormal ? 'text-white' : 'text-emerald-600'}`} />
                      <span>NORMAL</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSetAnswer(chk.id, 'ABNORMAL')}
                      className={`py-3 px-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all touch-press cursor-pointer text-xs sm:text-sm ${
                        isAbnormal
                          ? 'bg-[#651D2A] text-white shadow-md ring-2 ring-rose-700 scale-[1.01]'
                          : 'bg-stone-50 border-2 border-stone-200 text-stone-700 hover:bg-rose-50 hover:text-rose-800 hover:border-rose-300'
                      }`}
                    >
                      <AlertTriangle className={`w-5 h-5 ${isAbnormal ? 'text-white' : 'text-rose-600'}`} />
                      <span>ABNORMAL</span>
                    </button>
                  </div>

                  {/* Abnormal Details Expansion (Mandatory Note & Photo) */}
                  {isAbnormal && (
                    <div className="pt-3 border-t border-rose-200 space-y-3 bg-white p-4 rounded-xl border border-rose-200 animate-fadeIn">
                      <div>
                        <label className="block font-bold text-rose-950 mb-1 text-xs">
                          Deskripsi Temuan Masalah <span className="text-rose-600">*</span>
                        </label>
                        <textarea
                          rows={2}
                          required
                          value={state.note}
                          onChange={(e) => handleSetNote(chk.id, e.target.value)}
                          placeholder="Jelaskan kondisi abnormal secara spesifik (misal: kabel terkelupas, baut patah, kotoran oli tebal)..."
                          className="w-full px-3 py-2.5 border-2 border-rose-200 rounded-xl text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#651D2A]/20 focus:border-[#651D2A]"
                        />
                      </div>

                      {/* Photo Upload with Friendly Compression Preview */}
                      <div>
                        <label className="block font-bold text-rose-950 mb-1 text-xs">
                          Foto Bukti Pemeriksaan <span className="text-rose-600">* (Wajib)</span>
                        </label>

                        {state.photoResult ? (
                          <div className="flex items-center gap-3 p-3 bg-rose-50/50 border border-rose-200 rounded-xl">
                            <img
                              src={state.photoResult.dataUrl}
                              alt="Bukti foto"
                              className="w-16 h-16 object-cover rounded-lg border border-rose-200 shadow-xs shrink-0"
                            />
                            <div className="flex-1 space-y-0.5 text-xs">
                              <span className="font-bold text-stone-900 block">
                                Foto Siap Disimpan
                              </span>
                              <div className="text-[11px] text-stone-500">
                                Ukuran: <strong className="text-emerald-700">{formatBytes(state.photoResult.compressedSizeBytes)}</strong> (Otomatis dikompresi)
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemovePhoto(chk.id)}
                              className="p-2 text-rose-700 hover:bg-rose-100 rounded-xl touch-press"
                              title="Hapus foto"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <label className="flex flex-col items-center justify-center p-4 sm:p-5 border-2 border-dashed border-rose-300 hover:border-rose-500 rounded-2xl cursor-pointer bg-rose-50/30 transition-colors touch-press">
                            {state.isCompressing ? (
                              <div className="text-center space-y-1">
                                <span className="text-rose-800 font-bold">Mengompresi gambar...</span>
                              </div>
                            ) : (
                              <>
                                <div className="w-10 h-10 rounded-full bg-rose-100 text-[#651D2A] flex items-center justify-center mb-1.5 shadow-2xs">
                                  <Camera className="w-5 h-5" />
                                </div>
                                <span className="font-bold text-[#651D2A] text-xs">
                                  Ambil Foto Kamera / Pilih File
                                </span>
                                <span className="text-[11px] text-stone-400 mt-0.5">
                                  Otomatis dikompresi &lt; 700 KB JPEG agar cepat terkirim
                                </span>
                              </>
                            )}
                            <input
                              type="file"
                              accept="image/*"
                              capture="environment"
                              className="hidden"
                              disabled={state.isCompressing}
                              onChange={(e) => {
                                const f = e.target.files?.[0];
                                if (f) handlePhotoUpload(chk.id, f);
                              }}
                            />
                          </label>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Bottom Save Action Controls */}
          <div className="pt-4 border-t border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-3 sticky bottom-0 bg-white/95 backdrop-blur-xs py-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="w-full sm:w-auto px-5 py-2.5 font-bold text-stone-600 hover:text-stone-900 rounded-xl touch-press"
            >
              Batal
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto px-8 py-3.5 font-extrabold text-white bg-[#651D2A] hover:bg-[#4B141E] rounded-xl shadow-lg shadow-[#651D2A]/20 disabled:opacity-50 transition-all touch-press flex items-center justify-center gap-2 cursor-pointer text-sm"
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>{isSubmitting ? 'Menyimpan...' : 'Simpan Hasil Inspeksi'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
