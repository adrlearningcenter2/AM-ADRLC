import React from 'react';
import { FindingStatus, FindingPriority, RequestStatus } from '../../types/adr';

export const StatusBadge: React.FC<{
  status: FindingStatus | RequestStatus | string;
  size?: 'sm' | 'md';
}> = ({ status, size = 'sm' }) => {
  const textSize = size === 'sm' ? 'text-xs' : 'text-sm';

  switch (status) {
    case 'OPEN':
      return (
        <span className={`inline-flex items-center gap-1.5 font-semibold text-rose-700 ${textSize}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse" />
          Temuan Terbuka (Open)
        </span>
      );
    case 'COORDINATED':
      return (
        <span className={`inline-flex items-center gap-1.5 font-medium text-amber-700 ${textSize}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
          Dikoordinasikan
        </span>
      );
    case 'CLOSED':
    case 'APPROVED':
      return (
        <span className={`inline-flex items-center gap-1.5 font-medium text-emerald-700 ${textSize}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
          {status === 'APPROVED' ? 'Disetujui' : 'Selesai (Closed)'}
        </span>
      );
    case 'CANCELLED':
    case 'REJECTED':
      return (
        <span className={`inline-flex items-center gap-1.5 font-medium text-stone-500 ${textSize}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-stone-400" />
          {status === 'REJECTED' ? 'Ditolak' : 'Dibatalkan'}
        </span>
      );
    case 'PENDING':
      return (
        <span className={`inline-flex items-center gap-1.5 font-medium text-amber-700 ${textSize}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
          Menunggu Review
        </span>
      );
    default:
      return <span className={`text-stone-600 ${textSize}`}>{status}</span>;
  }
};

export const PriorityBadge: React.FC<{ priority: FindingPriority }> = ({ priority }) => {
  switch (priority) {
    case 'TINGGI':
      return <span className="text-xs font-semibold text-rose-800">Prioritas Tinggi</span>;
    case 'SEDANG':
      return <span className="text-xs font-medium text-amber-800">Prioritas Sedang</span>;
    case 'RENDAH':
      return <span className="text-xs font-normal text-stone-600">Prioritas Rendah</span>;
    default:
      return <span className="text-xs text-stone-500">{priority}</span>;
  }
};
