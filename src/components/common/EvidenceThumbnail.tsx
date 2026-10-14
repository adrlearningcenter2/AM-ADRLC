import React, { useState } from 'react';
import { Eye, ImageOff, ShieldCheck, Camera } from 'lucide-react';
import { resolveEvidenceUrl, extractDriveFileId } from '../../utils/evidence';

interface EvidenceThumbnailProps {
  photoId: string;
  alt?: string;
  onClick?: () => void;
  className?: string;
}

export const EvidenceThumbnail: React.FC<EvidenceThumbnailProps> = ({
  photoId,
  alt = 'Foto Bukti Abnormalitas',
  onClick,
  className = '',
}) => {
  const [hasError, setHasError] = useState(false);
  const url = resolveEvidenceUrl(photoId);
  const rawId = extractDriveFileId(photoId) || photoId;
  const isSafeMode = rawId.startsWith('SAFE-MODE') || rawId.startsWith('MOCK');

  if (!url) {
    return (
      <div
        className={`rounded-xl border border-dashed border-stone-300 bg-stone-50 flex flex-col items-center justify-center p-3 text-stone-400 text-center ${className}`}
      >
        <Camera className="w-5 h-5 mb-1 text-stone-300" />
        <span className="text-[10px] font-medium">Tanpa Lampiran Foto</span>
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onClick?.();
        }
      }}
      className={`cursor-pointer group relative rounded-xl overflow-hidden border border-stone-200 bg-stone-900 aspect-video flex items-center justify-center hover:opacity-95 shadow-inner touch-press ${className}`}
    >
      {hasError ? (
        <div className="flex flex-col items-center justify-center p-2 text-center text-stone-300">
          {isSafeMode ? (
            <>
              <ShieldCheck className="w-6 h-6 text-emerald-400 mb-1" />
              <span className="text-[10px] font-bold">Simulasi Safe Mode</span>
            </>
          ) : (
            <>
              <ImageOff className="w-6 h-6 text-rose-400 mb-1" />
              <span className="text-[10px] font-bold">Akses Foto Privat</span>
            </>
          )}
          <span className="text-[9px] text-stone-400 mt-0.5">Ketuk untuk membuka</span>
        </div>
      ) : (
        <img
          src={url}
          alt={alt}
          onError={() => setHasError(true)}
          className="w-full h-full object-cover transition-transform group-hover:scale-105"
        />
      )}

      {/* Hover / Tap overlay */}
      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 group-active:opacity-100 flex items-center justify-center text-white text-xs font-semibold transition-opacity">
        <Eye className="w-4 h-4 mr-1" /> Buka Foto
      </div>
    </div>
  );
};
