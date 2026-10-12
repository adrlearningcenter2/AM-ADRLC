import React, { useState } from 'react';
import { History, Calendar, MapPin, CheckCircle2, AlertTriangle, Search, Filter } from 'lucide-react';
import { MockDatabase } from '../../services/mockData';
import { useAuth } from '../../context/AuthContext';
import { formatIndonesianDate } from '../../utils/dateUtils';

export const OperatorHistoryView: React.FC = () => {
  const { user } = useAuth();
  const [inspections] = useState(
    MockDatabase.getInspections().filter((i) => i.operator_nip === user?.nip)
  );
  const [search, setSearch] = useState('');

  const filtered = inspections.filter((i) => {
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        i.room.toLowerCase().includes(q) ||
        i.unit_id.toLowerCase().includes(q) ||
        (i.note || '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-stone-900">Riwayat Pemeriksaan Pribadi</h1>
          <p className="text-xs text-stone-500 mt-1">
            Daftar hasil inspeksi yang telah Anda simpan di sistem AM Digital ADR.
          </p>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Cari unit atau ruangan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 border border-stone-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-[#651D2A]"
          />
        </div>
      </div>

      <div className="space-y-3">
        {filtered.map((item, idx) => {
          const isAbnormal = item.answer === 'ABNORMAL';

          return (
            <div
              key={`${item.inspection_id}-${item.checklist_id}-${idx}`}
              className={`bg-white p-4 rounded-xl border text-xs transition-all ${
                isAbnormal ? 'border-rose-200 bg-rose-50/20' : 'border-stone-200'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-stone-900">{item.room}</span>
                    <span className="text-stone-500 font-mono text-[11px]">· {item.unit_id}</span>
                    <span className="text-stone-400 text-[11px]">· {item.checklist_id}</span>
                  </div>
                  <div className="text-[11px] text-stone-400 mt-0.5">
                    Periode: {item.week_key} · Disimpan pada {formatIndonesianDate(item.created_at)}
                  </div>
                </div>

                <div>
                  {isAbnormal ? (
                    <span className="text-xs font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> Abnormal
                    </span>
                  ) : (
                    <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Normal
                    </span>
                  )}
                </div>
              </div>

              {item.note && (
                <div className="mt-2 p-2.5 bg-white border border-stone-200 rounded-lg text-stone-800">
                  <span className="font-semibold text-stone-500 text-[10px] uppercase block">
                    Catatan:
                  </span>
                  {item.note}
                </div>
              )}
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="p-12 text-center bg-white rounded-2xl border border-stone-200 text-stone-400 text-xs">
            Belum ada data riwayat inspeksi.
          </div>
        )}
      </div>
    </div>
  );
};
