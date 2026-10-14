import React, { useEffect, useState } from 'react';
import {
  X,
  ExternalLink,
  ImageOff,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  RefreshCw,
  Loader2,
  ShieldCheck,
  Building2,
  Calendar,
  User,
  Copy,
  Check,
  Eye
} from 'lucide-react';
import {
  resolveEvidenceUrl,
  resolveEvidenceDriveLink,
  resolveEvidenceDrivePreview,
  extractDriveFileId,
  getPhotoCandidateUrls
} from '../../utils/evidence';
import { formatIndonesianDate } from '../../utils/dateUtils';

interface EvidenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  title?: string;
  description?: string;
  meta?: {
    room?: string;
    unitId?: string;
    operatorNip?: string;
    date?: string;
    status?: string;
    priority?: string;
  };
}

export const EvidenceModal: React.FC<EvidenceModalProps> = ({
  isOpen,
  onClose,
  imageUrl,
  title = 'Foto Bukti Abnormalitas',
  description,
  meta,
}) => {
  const [candidateIndex, setCandidateIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [showEmbedPreview, setShowEmbedPreview] = useState(false);
  const [copied, setCopied] = useState(false);

  const cleanDriveId = extractDriveFileId(imageUrl);
  const driveLink = resolveEvidenceDriveLink(imageUrl);
  const drivePreview = resolveEvidenceDrivePreview(imageUrl);
  const candidateUrls = getPhotoCandidateUrls(imageUrl);
  const isSafeMode = cleanDriveId.startsWith('SAFE-MODE') || cleanDriveId.startsWith('MOCK') || cleanDriveId.startsWith('SAFE_MODE');

  const currentSrc = candidateUrls[candidateIndex] || resolveEvidenceUrl(imageUrl);

  useEffect(() => {
    if (isOpen) {
      setCandidateIndex(0);
      setLoading(Boolean(currentSrc));
      setFailed(false);
      setZoom(1);
      setShowEmbedPreview(false);
      setCopied(false);
    }
  }, [imageUrl, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleImageError = () => {
    if (candidateIndex + 1 < candidateUrls.length) {
      // Try next candidate CDN endpoint
      setCandidateIndex((prev) => prev + 1);
      setLoading(true);
    } else {
      setLoading(false);
      setFailed(true);
    }
  };

  const handleRetry = () => {
    setCandidateIndex(0);
    setLoading(true);
    setFailed(false);
    setShowEmbedPreview(false);
  };

  const handleCopyLink = async () => {
    if (!driveLink) return;
    try {
      await navigator.clipboard.writeText(driveLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
    }
  };

  return (
    <div
      role="presentation"
      className="fixed inset-0 z-[100] bg-stone-950/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 md:p-6 animate-fadeIn"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="w-full max-w-3xl max-h-[92vh] flex flex-col rounded-2xl bg-white shadow-2xl overflow-hidden border border-stone-200"
      >
        {/* Modal Header */}
        <header className="flex items-center justify-between gap-3 border-b border-stone-200 bg-white px-4 sm:px-6 py-3.5 shrink-0">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm sm:text-base font-bold text-stone-900 truncate">
                {title}
              </h2>
              {meta?.unitId && (
                <span className="font-mono text-[11px] font-semibold px-2 py-0.5 rounded bg-rose-50 text-rose-800 border border-rose-200">
                  {meta.unitId}
                </span>
              )}
              {meta?.priority && (
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                    meta.priority === 'TINGGI'
                      ? 'bg-rose-100 text-rose-900'
                      : meta.priority === 'SEDANG'
                      ? 'bg-amber-100 text-amber-900'
                      : 'bg-stone-100 text-stone-700'
                  }`}
                >
                  {meta.priority}
                </span>
              )}
            </div>
            <div className="text-xs text-stone-500 mt-0.5 flex items-center gap-2 flex-wrap">
              {meta?.room && (
                <span className="inline-flex items-center gap-1">
                  <Building2 className="w-3 h-3 text-stone-400" />
                  {meta.room}
                </span>
              )}
              {meta?.date && (
                <span className="inline-flex items-center gap-1 font-mono text-[11px]">
                  <Calendar className="w-3 h-3 text-stone-400" />
                  {formatIndonesianDate(meta.date)}
                </span>
              )}
              {meta?.operatorNip && (
                <span className="inline-flex items-center gap-1 text-[11px]">
                  <User className="w-3 h-3 text-stone-400" />
                  NIP: {meta.operatorNip}
                </span>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup jendela foto"
            className="w-11 h-11 rounded-xl flex items-center justify-center text-stone-500 hover:text-stone-900 hover:bg-stone-100 transition-colors focus-visible:outline-2 focus-visible:outline-rose-600 touch-press shrink-0 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        {/* Image / Preview Viewport */}
        <div className="relative flex-1 min-h-[260px] sm:min-h-[380px] max-h-[60vh] flex items-center justify-center overflow-hidden bg-stone-950 p-2 sm:p-4 select-none">
          {/* Loading Indicator */}
          {loading && !failed && !showEmbedPreview && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-stone-950/80 z-10 text-stone-300">
              <Loader2 className="w-8 h-8 animate-spin text-rose-500" />
              <span className="text-xs font-medium">Memuat foto bukti temuan...</span>
            </div>
          )}

          {/* Embedded Google Drive Iframe Mode */}
          {showEmbedPreview && drivePreview ? (
            <div className="w-full h-full flex flex-col items-center justify-center relative">
              <iframe
                src={drivePreview}
                title={title}
                className="w-full h-[52vh] rounded-xl border border-stone-800 bg-stone-900"
                allow="autoplay"
              />
              <button
                type="button"
                onClick={() => setShowEmbedPreview(false)}
                className="absolute top-3 right-3 px-3 py-1.5 text-xs font-semibold bg-stone-900/90 hover:bg-stone-800 text-stone-200 rounded-lg shadow-md border border-stone-700 cursor-pointer"
              >
                Kembali ke Mode Normal
              </button>
            </div>
          ) : failed || !currentSrc ? (
            /* Fallback & Explanatory State */
            <div role="alert" className="max-w-md text-center text-white p-6 my-auto">
              {isSafeMode ? (
                <>
                  <ShieldCheck className="mx-auto mb-3 text-emerald-400 w-12 h-12" />
                  <p className="font-bold text-base text-stone-100">
                    Dokumentasi Simulasi (Safe Mode)
                  </p>
                  <p className="mt-2 text-xs text-stone-300 leading-relaxed">
                    Temuan ini tercatat dengan ID simulasi <code className="font-mono text-emerald-300 bg-emerald-950/60 px-1.5 py-0.5 rounded">{cleanDriveId}</code>.
                    Pada mode Safe Mode, file tidak diunggah ke Google Drive publik untuk melindungi kuota penyimpanan.
                  </p>
                </>
              ) : (
                <>
                  <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto mb-3.5 text-rose-400">
                    <ImageOff className="w-7 h-7" />
                  </div>
                  <h3 className="font-extrabold text-base sm:text-lg text-white">
                    Foto Tersimpan di Google Drive
                  </h3>
                  <p className="mt-2 text-xs sm:text-sm text-stone-300 leading-relaxed">
                    File bukti foto dengan ID <strong className="font-mono text-rose-300">{cleanDriveId || '-'}</strong> tersimpan secara aman di Google Drive organisasi Anda.
                  </p>

                  <div className="mt-5 flex flex-col sm:flex-row items-center justify-center gap-2.5">
                    {driveLink && (
                      <a
                        href={driveLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 min-h-[44px] rounded-xl bg-[#651D2A] hover:bg-[#7e2939] text-white text-xs font-bold transition-all shadow-md touch-press"
                      >
                        <ExternalLink className="w-4 h-4" />
                        <span>Buka Foto di Google Drive</span>
                      </a>
                    )}
                    {drivePreview && (
                      <button
                        type="button"
                        onClick={() => setShowEmbedPreview(true)}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 min-h-[44px] rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-colors cursor-pointer touch-press"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Pratinjau Drive</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleRetry}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 min-h-[44px] rounded-xl bg-white/5 hover:bg-white/10 text-stone-300 text-xs font-semibold transition-colors cursor-pointer touch-press"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Coba Lagi</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <img
              src={currentSrc}
              alt={title}
              onLoad={() => setLoading(false)}
              onError={handleImageError}
              style={{
                transform: `scale(${zoom})`,
                opacity: loading ? 0 : 1,
              }}
              className="max-h-[54vh] max-w-full object-contain transition-all duration-200"
            />
          )}
        </div>

        {/* Modal Footer */}
        <footer className="border-t border-stone-200 bg-white px-4 sm:px-6 py-3.5 shrink-0 space-y-3">
          {description && (
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block mb-1">
                Keterangan Temuan Abnormalitas:
              </span>
              <p className="text-xs sm:text-sm text-stone-800 leading-relaxed max-h-20 overflow-y-auto">
                {description}
              </p>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            {/* Zoom Controls */}
            {!failed && !showEmbedPreview && currentSrc && (
              <div className="flex items-center gap-1.5 bg-stone-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setZoom((v) => Math.max(1, v - 0.25))}
                  disabled={zoom <= 1}
                  aria-label="Perkecil foto"
                  className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-white text-stone-700 disabled:opacity-40 transition-colors cursor-pointer"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="text-xs font-mono font-bold text-stone-600 px-2 min-w-12 text-center">
                  {Math.round(zoom * 100)}%
                </span>
                <button
                  type="button"
                  onClick={() => setZoom((v) => Math.min(2.5, v + 0.25))}
                  disabled={zoom >= 2.5}
                  aria-label="Perbesar foto"
                  className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-white text-stone-700 disabled:opacity-40 transition-colors cursor-pointer"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setZoom(1)}
                  aria-label="Atur ulang zoom"
                  className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-white text-stone-700 transition-colors cursor-pointer"
                  title="Reset ukuran normal"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-2 ml-auto flex-wrap">
              {driveLink && (
                <>
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="inline-flex items-center gap-1.5 min-h-[44px] px-3.5 py-2 text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 border border-stone-300/80 rounded-xl transition-colors cursor-pointer touch-press"
                    title="Salin Tautan Google Drive"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-stone-500" />}
                    <span>{copied ? 'Tersalin' : 'Salin Link'}</span>
                  </button>

                  <a
                    href={driveLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 min-h-[44px] px-3.5 py-2 text-xs font-bold text-white bg-[#651D2A] hover:bg-[#7e2939] rounded-xl transition-colors shadow-xs touch-press"
                  >
                    <span>Buka di Google Drive</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </>
              )}
              <button
                type="button"
                onClick={onClose}
                className="min-h-[44px] px-4 py-2 text-xs font-bold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-xl transition-colors cursor-pointer touch-press"
              >
                Tutup
              </button>
            </div>
          </div>
        </footer>
      </section>
    </div>
  );
};
