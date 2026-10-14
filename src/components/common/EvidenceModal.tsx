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
  AlertTriangle,
  ShieldCheck,
  Building2,
  Calendar,
  User
} from 'lucide-react';
import { resolveEvidenceUrl, resolveEvidenceDriveLink, extractDriveFileId } from '../../utils/evidence';
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
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [retryKey, setRetryKey] = useState(0);

  const resolvedSrc = resolveEvidenceUrl(imageUrl);
  const driveLink = resolveEvidenceDriveLink(imageUrl);
  const rawId = extractDriveFileId(imageUrl) || imageUrl;
  const isSafeMode = rawId.startsWith('SAFE-MODE') || rawId.startsWith('MOCK') || rawId.startsWith('SAFE_MODE');

  useEffect(() => {
    if (isOpen) {
      setLoading(Boolean(resolvedSrc));
      setFailed(!resolvedSrc);
      setZoom(1);
    }
  }, [imageUrl, isOpen, retryKey]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleRetry = () => {
    setLoading(true);
    setFailed(false);
    setRetryKey((k) => k + 1);
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
            className="w-11 h-11 rounded-xl flex items-center justify-center text-stone-500 hover:text-stone-900 hover:bg-stone-100 transition-colors focus-visible:outline-2 focus-visible:outline-rose-600 touch-press shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        {/* Image Viewport */}
        <div className="relative flex-1 min-h-[240px] sm:min-h-[360px] max-h-[58vh] flex items-center justify-center overflow-hidden bg-stone-950 p-2 sm:p-4 select-none">
          {/* Loading Indicator */}
          {loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-stone-950/80 z-10 text-stone-300">
              <Loader2 className="w-8 h-8 animate-spin text-rose-500" />
              <span className="text-xs font-medium">Memuat foto bukti temuan...</span>
            </div>
          )}

          {/* Fallback & Error State */}
          {failed || !resolvedSrc ? (
            <div role="alert" className="max-w-md text-center text-white p-6 my-auto">
              {isSafeMode ? (
                <>
                  <ShieldCheck className="mx-auto mb-3 text-emerald-400 w-12 h-12" />
                  <p className="font-bold text-base text-stone-100">
                    Dokumentasi Simulasi (Safe Mode)
                  </p>
                  <p className="mt-2 text-xs text-stone-300 leading-relaxed">
                    Temuan ini tercatat dengan ID simulasi <code className="font-mono text-emerald-300 bg-emerald-950/60 px-1.5 py-0.5 rounded">{rawId}</code>.
                    Pada mode Safe Mode, file tidak diunggah ke Google Drive publik untuk melindungi kuota penyimpanan.
                  </p>
                </>
              ) : (
                <>
                  <ImageOff className="mx-auto mb-3 text-rose-400 w-12 h-12" />
                  <p className="font-bold text-base text-stone-100">
                    Foto Belum Dapat Ditampilkan
                  </p>
                  <p className="mt-2 text-xs text-stone-300 leading-relaxed">
                    {rawId
                      ? `File ID: "${rawId}". Foto privat Google Drive memerlukan izin akses akun atau file telah dipindahkan/dihapus.`
                      : 'Belum ada bukti foto yang dilampirkan pada catatan abnormalitas ini.'}
                  </p>
                  <div className="mt-4 flex items-center justify-center gap-3 flex-wrap">
                    <button
                      type="button"
                      onClick={handleRetry}
                      className="inline-flex items-center gap-1.5 px-4 py-2 min-h-[44px] rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-colors cursor-pointer touch-press"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Coba Muat Ulang</span>
                    </button>
                    {driveLink && (
                      <a
                        href={driveLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-4 py-2 min-h-[44px] rounded-xl bg-[#651D2A] hover:bg-[#7e2939] text-white text-xs font-semibold transition-colors touch-press"
                      >
                        <span>Buka di Google Drive</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </>
              )}
            </div>
          ) : (
            <img
              key={retryKey}
              src={resolvedSrc}
              alt={title}
              onLoad={() => setLoading(false)}
              onError={() => {
                setLoading(false);
                setFailed(true);
              }}
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
            {!failed && resolvedSrc && (
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
            <div className="flex items-center gap-2 ml-auto">
              {driveLink && (
                <a
                  href={driveLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 min-h-[44px] px-3.5 py-2 text-xs font-bold text-[#651D2A] bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-colors touch-press"
                >
                  <span>Lihat di Drive</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
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
