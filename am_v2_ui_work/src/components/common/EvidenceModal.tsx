import React, { useEffect, useState } from 'react';
import { X, ExternalLink, ImageOff, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { resolveEvidenceUrl, resolveEvidenceDriveLink } from '../../utils/evidence';
import { formatIndonesianDate } from '../../utils/dateUtils';

interface EvidenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  title?: string;
  description?: string;
  meta?: { room?: string; unitId?: string; operatorNip?: string; date?: string };
}

export const EvidenceModal: React.FC<EvidenceModalProps> = ({ isOpen, onClose, imageUrl, title = 'Foto Bukti Abnormalitas', description, meta }) => {
  const [failed, setFailed] = useState(false);
  const [zoom, setZoom] = useState(1);
  const src = resolveEvidenceUrl(imageUrl);
  const driveLink = resolveEvidenceDriveLink(imageUrl);
  useEffect(() => { setFailed(false); setZoom(1); }, [imageUrl, isOpen]);
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);
  if (!isOpen) return null;
  return (
    <div role="presentation" className="fixed inset-0 z-[100] bg-stone-950/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <section role="dialog" aria-modal="true" aria-label={title} className="w-full max-w-5xl max-h-[94vh] overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <header className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-stone-200 bg-white px-4 sm:px-6 py-4">
          <div className="min-w-0"><h2 className="text-base sm:text-lg font-bold text-stone-900 truncate">{title}</h2><p className="text-xs text-stone-500 mt-1">{[meta?.room, meta?.unitId && `Unit ${meta.unitId}`, meta?.date && formatIndonesianDate(meta.date)].filter(Boolean).join(' · ') || 'Dokumentasi pemeriksaan'}</p></div>
          <button type="button" onClick={onClose} aria-label="Tutup foto" className="rounded-xl p-2 hover:bg-stone-100 focus-visible:outline-2 focus-visible:outline-rose-600"><X size={21}/></button>
        </header>
        <div className="relative flex min-h-[260px] sm:min-h-[420px] max-h-[65vh] items-center justify-center overflow-auto bg-stone-950 p-4">
          {src && !failed ? <img src={src} alt={title} onError={() => setFailed(true)} style={{ transform: `scale(${zoom})` }} className="max-h-[57vh] max-w-full object-contain transition-transform duration-150"/> :
            <div role="alert" className="max-w-sm text-center text-white"><ImageOff className="mx-auto mb-3 text-stone-400" size={42}/><p className="font-semibold">Foto belum dapat ditampilkan</p><p className="mt-2 text-sm text-stone-300">Periksa ID foto, izin akses Google Drive, atau koneksi internet. Foto privat memerlukan mekanisme akses gambar yang terautentikasi.</p></div>}
        </div>
        <footer className="flex flex-col gap-3 border-t border-stone-200 px-4 sm:px-6 py-4">
          {description && <div><p className="text-xs font-bold uppercase tracking-wide text-stone-500 mb-1">Keterangan temuan</p><p className="text-sm leading-relaxed text-stone-700">{description}</p></div>}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2"><button type="button" onClick={() => setZoom(v => Math.max(1, v - 0.25))} disabled={zoom <= 1} aria-label="Perkecil foto" className="rounded-lg border p-2 disabled:opacity-40"><ZoomOut size={17}/></button><span className="text-sm tabular-nums text-stone-600">{Math.round(zoom*100)}%</span><button type="button" onClick={() => setZoom(v => Math.min(2.5, v + 0.25))} disabled={zoom >= 2.5} aria-label="Perbesar foto" className="rounded-lg border p-2 disabled:opacity-40"><ZoomIn size={17}/></button><button type="button" onClick={() => setZoom(1)} aria-label="Atur ulang zoom" className="rounded-lg border p-2"><RotateCcw size={17}/></button></div>
            {driveLink && <a href={driveLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-[#651D2A] px-4 py-2 text-sm font-semibold text-white hover:bg-[#7e2939]">Buka di Google Drive <ExternalLink size={16}/></a>}
          </div>
        </footer>
      </section>
    </div>
  );
};
