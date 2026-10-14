import React, { useState, useEffect } from 'react';
import {
  X,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  RefreshCw,
  ExternalLink,
  ImageOff,
  Building2,
  Calendar,
  User,
  ShieldCheck,
  Eye,
  Loader2
} from 'lucide-react';
import {
  resolveEvidenceUrl,
  resolveEvidenceDriveLink,
  resolveEvidenceDrivePreview,
  extractDriveFileId,
  getPhotoCandidateUrls
} from '../../utils/evidence';
import { formatIndonesianDate } from '../../utils/dateUtils';

export interface FullscreenPhotoViewerProps {
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

export const FullscreenPhotoViewer: React.FC<FullscreenPhotoViewerProps> = ({
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

  const cleanDriveId = extractDriveFileId(imageUrl);
  const driveLink = resolveEvidenceDriveLink(imageUrl);
  const drivePreview = resolveEvidenceDrivePreview(imageUrl);
  const candidateUrls = getPhotoCandidateUrls(imageUrl);
  const isSafeMode =
    cleanDriveId.startsWith('SAFE-MODE') ||
    cleanDriveId.startsWith('MOCK') ||
    cleanDriveId.startsWith('SAFE_MODE');

  const currentSrc = candidateUrls[candidateIndex] || resolveEvidenceUrl(imageUrl);

  useEffect(() => {
    if (isOpen) {
      setCandidateIndex(0);
      setLoading(Boolean(currentSrc));
      setFailed(!currentSrc);
      setZoom(1);
      setShowEmbedPreview(false);
    }
  }, [imageUrl, isOpen, currentSrc]);

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

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-[200] bg-stone-950/90 backdrop-blur-md flex flex-col justify-between animate-fadeIn text-white overflow-hidden"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Top Header Bar */}
      <header className="px-4 py-3 sm:px-6 bg-stone-900/90 border-b border-stone-800 flex items-center justify-between gap-3 shrink-0 pt-[env(safe-area-inset-top,12px)]">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-sm sm:text-base font-bold text-white truncate max-w-xs sm:max-w-md">
              {title}
            </h2>
            {meta?.unitId && (
              <span className="font-mono text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded bg-rose-900/60 text-rose-200 border border-rose-700/50">
                {meta.unitId}
              </span>
            )}
            {meta?.priority && (
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                  meta.priority === 'TINGGI'
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    : meta.priority === 'SEDANG'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'bg-stone-800 text-stone-300'
                }`}
              >
                {meta.priority}
              </span>
            )}
            {meta?.status && (
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                  meta.status === 'COMPLETED' || meta.status === 'CLOSED'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                }`}
              >
                {meta.status}
              </span>
            )}
          </div>

          <div className="text-[11px] text-stone-400 mt-1 flex items-center gap-3 flex-wrap">
            {meta?.room && (
              <span className="inline-flex items-center gap-1">
                <Building2 className="w-3 h-3 text-stone-400" />
                {meta.room}
              </span>
            )}
            {meta?.date && (
              <span className="inline-flex items-center gap-1 font-mono">
                <Calendar className="w-3 h-3 text-stone-400" />
                {formatIndonesianDate(meta.date)}
              </span>
            )}
            {meta?.operatorNip && (
              <span className="inline-flex items-center gap-1">
                <User className="w-3 h-3 text-stone-400" />
                NIP: {meta.operatorNip}
              </span>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Tutup penampil foto"
          className="w-11 h-11 rounded-xl bg-white/10 hover:bg-white/20 active:bg-white/30 text-white flex items-center justify-center transition-colors touch-press cursor-pointer shrink-0"
        >
          <X className="w-6 h-6" />
        </button>
      </header>

      {/* Main Viewport */}
      <div className="relative flex-1 flex items-center justify-center p-2 sm:p-4 overflow-hidden select-none">
        {/* Loading Spinner */}
        {loading && !failed && !showEmbedPreview && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2.5 z-10 bg-stone-950/60">
            <Loader2 className="w-10 h-10 animate-spin text-rose-500" />
            <span className="text-xs font-semibold text-stone-300">Memuat foto bukti temuan...</span>
          </div>
        )}

        {/* Embedded Google Drive Iframe Mode */}
        {showEmbedPreview && drivePreview ? (
          <div className="w-full h-full max-w-4xl flex flex-col items-center justify-center relative p-2">
            <iframe
              src={drivePreview}
              title={title}
              className="w-full h-[65vh] rounded-2xl border border-stone-800 bg-stone-900"
              allow="autoplay"
            />
            <button
              type="button"
              onClick={() => setShowEmbedPreview(false)}
              className="absolute top-4 right-4 px-3 py-1.5 text-xs font-semibold bg-stone-900/90 text-stone-200 rounded-xl shadow-lg border border-stone-700 cursor-pointer touch-press"
            >
              Kembali ke Mode Normal
            </button>
          </div>
        ) : failed || !currentSrc ? (
          /* Fallback Informational View (No browser broken image icon) */
          <div role="alert" className="max-w-md text-center p-6 space-y-3.5 my-auto">
            {isSafeMode ? (
              <>
                <ShieldCheck className="mx-auto w-12 h-12 text-emerald-400" />
                <h3 className="font-bold text-base text-stone-100">Dokumentasi Mode Simulasi (Safe Mode)</h3>
                <p className="text-xs text-stone-300 leading-relaxed">
                  Temuan ini tercatat dengan ID simulasi{' '}
                  <code className="font-mono text-emerald-300 bg-emerald-950/80 px-1.5 py-0.5 rounded">
                    {cleanDriveId}
                  </code>
                  . Pada mode pengujian Safe Mode, file tidak diunggah ke Google Drive publik untuk melindungi kuota penyimpanan.
                </p>
              </>
            ) : (
              <>
                <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto text-rose-400">
                  <ImageOff className="w-7 h-7" />
                </div>
                <h3 className="font-bold text-base text-white">Foto Tersimpan di Google Drive</h3>
                <p className="text-xs text-stone-300 leading-relaxed">
                  File bukti foto temuan ini tersimpan di Google Drive organisasi. Jika memerlukan akses, buka tautan langsung melalui akun Google Anda.
                </p>
                {cleanDriveId && (
                  <div className="text-[11px] font-mono text-stone-400 bg-stone-900/80 px-2 py-1 rounded-lg inline-block border border-stone-800">
                    File ID: {cleanDriveId}
                  </div>
                )}
                <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2">
                  {driveLink && (
                    <a
                      href={driveLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#651D2A] hover:bg-[#7e2939] text-white text-xs font-bold transition-all shadow-md touch-press"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span>Buka di Google Drive</span>
                    </a>
                  )}
                  {drivePreview && (
                    <button
                      type="button"
                      onClick={() => setShowEmbedPreview(true)}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-colors cursor-pointer touch-press"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Pratinjau Drive</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleRetry}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-stone-300 text-xs font-semibold transition-colors cursor-pointer touch-press"
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
            className="max-h-[68vh] max-w-full object-contain transition-all duration-200"
          />
        )}
      </div>

      {/* Bottom Controls & Description Footer */}
      <footer className="px-4 py-3 sm:px-6 bg-stone-900/90 border-t border-stone-800 space-y-2.5 shrink-0 pb-[env(safe-area-inset-bottom,12px)]">
        {description && (
          <div className="max-w-3xl mx-auto">
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block mb-0.5">
              Keterangan Temuan:
            </span>
            <p className="text-xs text-stone-200 leading-relaxed max-h-16 overflow-y-auto">
              {description}
            </p>
          </div>
        )}

        {/* Zoom & Action Controls */}
        <div className="flex items-center justify-between gap-3 max-w-3xl mx-auto pt-1">
          {!failed && !showEmbedPreview && currentSrc ? (
            <div className="flex items-center gap-1 bg-stone-800/90 border border-stone-700 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setZoom((v) => Math.max(1, v - 0.25))}
                disabled={zoom <= 1}
                aria-label="Perkecil"
                className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-white/10 text-stone-300 disabled:opacity-30 cursor-pointer touch-press"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="text-xs font-mono font-bold text-stone-300 px-2 min-w-12 text-center">
                {Math.round(zoom * 100)}%
              </span>
              <button
                type="button"
                onClick={() => setZoom((v) => Math.min(3, v + 0.25))}
                disabled={zoom >= 3}
                aria-label="Perbesar"
                className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-white/10 text-stone-300 disabled:opacity-30 cursor-pointer touch-press"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              {zoom > 1 && (
                <button
                  type="button"
                  onClick={() => setZoom(1)}
                  aria-label="Reset zoom"
                  className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-white/10 text-stone-400 cursor-pointer touch-press"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            {driveLink && (
              <a
                href={driveLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-colors touch-press"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Buka di Drive</span>
              </a>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-[#651D2A] hover:bg-[#7e2939] text-white text-xs font-bold transition-all shadow-md touch-press cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};
