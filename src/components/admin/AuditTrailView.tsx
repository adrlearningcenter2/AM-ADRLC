import React, { useState } from 'react';
import {
  History,
  Search,
  Filter,
  User,
  Clock,
  Shield,
  FileCheck,
  AlertTriangle,
  FileText,
  UserCheck
} from 'lucide-react';
import { AuditLog } from '../../types/adr';
import { MockDatabase } from '../../services/mockData';
import { formatIndonesianDate } from '../../utils/dateUtils';

export const AuditTrailView: React.FC = () => {
  const [logs] = useState<AuditLog[]>(MockDatabase.getAudit());
  const [actionFilter, setActionFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredLogs = logs.filter((log) => {
    if (actionFilter !== 'ALL' && log.action !== actionFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const strDetail = typeof log.detail === 'string' ? log.detail : JSON.stringify(log.detail);
      const match =
        log.actor_nip.includes(q) ||
        log.action.toLowerCase().includes(q) ||
        strDetail.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'INSPECTION_SAVE':
        return (
          <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
            Simpan Inspeksi
          </span>
        );
      case 'FINDING_COORDINATED':
        return (
          <span className="text-[11px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
            Koordinasi Temuan
          </span>
        );
      case 'CLOSE_FINDING':
        return (
          <span className="text-[11px] font-bold text-blue-800 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
            Penyelesaian Temuan
          </span>
        );
      case 'REQUEST_SUBMIT':
        return (
          <span className="text-[11px] font-bold text-purple-800 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
            Pengajuan Operator
          </span>
        );
      case 'REQUEST_DECISION':
        return (
          <span className="text-[11px] font-bold text-stone-800 bg-stone-100 px-2 py-0.5 rounded border border-stone-300">
            Keputusan Approval
          </span>
        );
      case 'CREATE_USER':
        return (
          <span className="text-[11px] font-bold text-rose-800 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
            Pembuatan Akun
          </span>
        );
      default:
        return (
          <span className="text-[11px] font-bold text-stone-600 bg-stone-100 px-2 py-0.5 rounded">
            {action}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-stone-900">
            Audit Trail &amp; Log Aktivitas Sistem
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Rekam jejak kepatuhan dan integritas data tanpa modifikasi (immutable logging).
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="px-3 py-2 border border-stone-200 rounded-xl bg-stone-50 text-xs font-medium text-stone-700 focus:outline-none"
          >
            <option value="ALL">Semua Jenis Aksi</option>
            <option value="INSPECTION_SAVE">Simpan Inspeksi</option>
            <option value="FINDING_COORDINATED">Koordinasi Temuan</option>
            <option value="CLOSE_FINDING">Penyelesaian Temuan</option>
            <option value="REQUEST_SUBMIT">Pengajuan Operator</option>
            <option value="REQUEST_DECISION">Keputusan Approval</option>
            <option value="CREATE_USER">Pembuatan Akun</option>
          </select>

          <div className="relative w-56">
            <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Cari NIP, detail..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 border border-stone-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-[#651D2A]"
            />
          </div>
        </div>
      </div>

      {/* Log list */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm divide-y divide-stone-100 overflow-hidden">
        {filteredLogs.map((log) => {
          const detailObj = typeof log.detail === 'object' ? log.detail : {};

          return (
            <div
              key={log.audit_id}
              className="p-4 sm:p-5 hover:bg-stone-50/70 transition-colors flex flex-col sm:flex-row sm:items-start justify-between gap-3 text-xs"
            >
              <div className="space-y-1.5 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  {getActionBadge(log.action)}
                  <span className="font-mono text-[11px] text-stone-400 font-medium">
                    {log.audit_id}
                  </span>
                  <span className="text-stone-300">·</span>
                  <span className="text-stone-700 font-semibold flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-stone-400" />
                    Aktor: NIP {log.actor_nip}
                  </span>
                </div>

                <div className="bg-stone-50 p-2.5 rounded-lg border border-stone-100 font-mono text-[11px] text-stone-700 overflow-x-auto">
                  {JSON.stringify(log.detail, null, 2)}
                </div>
              </div>

              <div className="text-[11px] text-stone-400 shrink-0 sm:text-right flex items-center sm:block gap-1">
                <Clock className="w-3 h-3 inline sm:hidden" />
                {formatIndonesianDate(log.created_at)}
              </div>
            </div>
          );
        })}

        {filteredLogs.length === 0 && (
          <div className="p-12 text-center text-xs text-stone-400">
            Tidak ada riwayat audit log yang cocok.
          </div>
        )}
      </div>
    </div>
  );
};
