import React, { useState } from 'react';
import { Info, X, SlidersHorizontal, ShieldCheck } from 'lucide-react';
import { ApiService } from '../../services/apiService';

interface SimulationBannerProps {
  onOpenConfig: () => void;
}

export const SimulationBanner: React.FC<SimulationBannerProps> = ({ onOpenConfig }) => {
  const [isDismissed, setIsDismissed] = useState(false);
  const isMock = ApiService.isMockMode();

  if (!isMock || isDismissed) return null;

  return (
    <div className="bg-amber-50 border-b border-amber-200/80 text-amber-900 text-xs px-4 py-2 no-print">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0" />
          <span>
            <strong>Tahap 1 — Mode Simulasi Aktif:</strong> Berjalan di atas data simulasi mandiri. Database Google Sheets &amp; Drive produksi <strong>tidak disentuh</strong>.
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onOpenConfig}
            className="font-semibold underline hover:text-amber-950 flex items-center gap-1"
          >
            <SlidersHorizontal className="w-3 h-3" />
            Kontrak API &amp; Audit Skema
          </button>
          <button
            onClick={() => setIsDismissed(true)}
            className="p-1 text-amber-700 hover:text-amber-950 rounded"
            title="Sembunyikan pesan"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
