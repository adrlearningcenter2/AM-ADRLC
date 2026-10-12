import React from 'react';
import { X, ExternalLink, Calendar, MapPin, User as UserIcon } from 'lucide-react';
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
  };
}

export const EvidenceModal: React.FC<EvidenceModalProps> = ({
  isOpen,
  onClose,
  imageUrl,
  title = 'Bukti Foto Pemeriksaan',
  description,
  meta,
}) => {
  if (!isOpen || !imageUrl) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="relative max-w-3xl w-full bg-white rounded-2xl overflow-hidden shadow-2xl border border-stone-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-200 bg-stone-50">
          <div>
            <h3 className="text-base font-bold text-stone-900">{title}</h3>
            {meta?.room && (
              <p className="text-xs text-stone-500 mt-0.5">
                {meta.room} {meta.unitId ? `· Unit: ${meta.unitId}` : ''}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-500 hover:text-stone-800 hover:bg-stone-200 transition-colors"
            title="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 bg-stone-900 flex items-center justify-center min-h-[300px] max-h-[65vh] overflow-hidden">
          <img
            src={imageUrl}
            alt={title}
            className="max-h-[60vh] max-w-full object-contain rounded shadow"
          />
        </div>

        <div className="p-5 bg-white space-y-3">
          {description && (
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">Keterangan / Catatan</span>
              <p className="text-sm text-stone-800 mt-1 bg-stone-50 p-3 rounded-lg border border-stone-200">
                {description}
              </p>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-y-2 gap-x-6 text-xs text-stone-600 pt-2 border-t border-stone-100">
            {meta?.date && (
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-stone-400" />
                {formatIndonesianDate(meta.date)}
              </span>
            )}
            {meta?.operatorNip && (
              <span className="flex items-center gap-1.5">
                <UserIcon className="w-3.5 h-3.5 text-stone-400" />
                Petugas: NIP {meta.operatorNip}
              </span>
            )}
            {meta?.room && (
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-stone-400" />
                {meta.room}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
