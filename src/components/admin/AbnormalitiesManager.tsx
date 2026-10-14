import React, { useState } from 'react';
import {
  AlertTriangle,
  Search,
  Filter,
  Eye,
  CheckCircle,
  MessageSquare,
  User,
  MapPin,
  Calendar,
  Send,
  X,
  FileCheck2,
  Clock
} from 'lucide-react';
import { Finding, FindingStatus, FindingPriority, Followup } from '../../types/adr';
import { MockDatabase } from '../../services/mockData';
import { ApiService } from '../../services/apiService';
import { useAuth } from '../../context/AuthContext';
import { StatusBadge, PriorityBadge } from '../common/StatusBadge';
import { formatIndonesianDate } from '../../utils/dateUtils';
import { resolveEvidenceUrl } from '../../utils/evidence';
import { EvidenceThumbnail } from '../common/EvidenceThumbnail';

interface AbnormalitiesManagerProps {
  onViewPhoto: (
    photoUrl: string,
    title: string,
    desc: string,
    meta?: {
      room?: string;
      unitId?: string;
      operatorNip?: string;
      date?: string;
      status?: string;
      priority?: string;
    }
  ) => void;
  onRefresh: () => void;
}

export const AbnormalitiesManager: React.FC<AbnormalitiesManagerProps> = ({
  onViewPhoto,
  onRefresh,
}) => {
  const { user, token } = useAuth();
  const [findings, setFindings] = useState<Finding[]>(ApiService.isMockMode() ? MockDatabase.getFindings() : []);
  const [followups, setFollowups] = useState<Followup[]>(ApiService.isMockMode() ? MockDatabase.getFollowups() : []);

  const [statusFilter, setStatusFilter] = useState<FindingStatus | 'ALL'>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<FindingPriority | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [loadError, setLoadError] = useState('');

  // Coordination Modal State
  const [coordinatingFinding, setCoordinatingFinding] = useState<Finding | null>(null);
  const [coordNote, setCoordNote] = useState('');
  const [assignedPIC, setAssignedPIC] = useState('');
  const [newPriority, setNewPriority] = useState<FindingPriority>('SEDANG');

  const refreshLocalData = async () => {
    if (token && !ApiService.isMockMode()) {
      try {
        const liveFindings = await ApiService.getFindings(token);
        if (Array.isArray(liveFindings)) {
          setLoadError('');
          setFindings(liveFindings);
        }
        const liveFollowups = await ApiService.getFollowups(token);
        if (Array.isArray(liveFollowups)) {
          setFollowups(liveFollowups);
        }
        onRefresh();
        return;
      } catch (err) {
        setLoadError(err instanceof Error ? err.message : 'Gagal memuat data temuan');
        setFindings([]); setFollowups([]); return;
      }
    }
    setFindings(MockDatabase.getFindings());
    setFollowups(MockDatabase.getFollowups());
    onRefresh();
  };

  React.useEffect(() => {
    refreshLocalData();
  }, [token]);

  const handleOpenCoordModal = (f: Finding) => {
    setCoordinatingFinding(f);
    setCoordNote('');
    setAssignedPIC(f.assigned_to || 'Tim Fasilitas & GA');
    setNewPriority(f.priority);
  };

  const handleSaveCoordination = async () => {
    if (!coordinatingFinding) return;
    try {
      if (newPriority !== coordinatingFinding.priority) {
        await ApiService.updateFindingPriority(
          token || '',
          user?.nip || '26010007',
          coordinatingFinding.finding_id,
          newPriority
        );
      }

      if (coordNote.trim()) {
        await ApiService.markCoordinated(
          token || '',
          user?.nip || '26010007',
          coordinatingFinding.finding_id,
          coordNote,
          assignedPIC
        );
      }

      await refreshLocalData();
      setCoordinatingFinding(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Gagal menyimpan koordinasi');
    }
  };

  const filteredFindings = findings.filter((f) => {
    if (statusFilter !== 'ALL' && f.status !== statusFilter) return false;
    if (priorityFilter !== 'ALL' && f.priority !== priorityFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        f.description.toLowerCase().includes(q) ||
        f.unit_id.toLowerCase().includes(q) ||
        f.room.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {loadError && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">Gagal memuat abnormalitas dari database: {loadError}. Data dummy tidak ditampilkan. <button type="button" onClick={refreshLocalData} className="ml-2 font-bold underline">Coba lagi</button></div>}
      {/* Top Header */}
      <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-stone-900">
            Manajemen Abnormalitas &amp; Tindak Lanjut
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Penugasan perbaikan, koordinasi PIC, monitoring prioritas, dan verifikasi penyelesaian temuan.
          </p>
        </div>

        {/* Quick summary stats */}
        <div className="flex items-center gap-3 text-xs">
          <div className="px-3 py-1.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800">
            <span className="font-bold">{findings.filter((f) => f.status === 'OPEN').length}</span> Open
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800">
            <span className="font-bold">
              {findings.filter((f) => f.status === 'COORDINATED').length}
            </span>{' '}
            Koordinasi
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800">
            <span className="font-bold">
              {findings.filter((f) => f.status === 'CLOSED').length}
            </span>{' '}
            Selesai
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Status selector */}
          <div className="flex items-center gap-1 p-1 bg-stone-100 rounded-lg">
            {(['ALL', 'OPEN', 'COORDINATED', 'CLOSED'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                  statusFilter === s
                    ? 'bg-white text-stone-900 shadow-xs font-semibold'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                {s === 'ALL'
                  ? 'Semua'
                  : s === 'OPEN'
                  ? 'Terbuka'
                  : s === 'COORDINATED'
                  ? 'Koordinasi'
                  : 'Selesai'}
              </button>
            ))}
          </div>

          {/* Priority selector */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value as FindingPriority | 'ALL')}
            className="px-3 py-2 border border-stone-200 rounded-lg bg-stone-50 font-medium text-stone-700 focus:outline-none"
          >
            <option value="ALL">Semua Prioritas</option>
            <option value="TINGGI">Prioritas Tinggi</option>
            <option value="SEDANG">Prioritas Sedang</option>
            <option value="RENDAH">Prioritas Rendah</option>
          </select>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Cari deskripsi, unit, ruangan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 border border-stone-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-[#651D2A]"
          />
        </div>
      </div>

      {/* Findings List */}
      <div className="space-y-4">
        {filteredFindings.map((finding) => {
          const findingFollowups = followups.filter((fol) => fol.finding_id === finding.finding_id);

          return (
            <div
              key={finding.finding_id}
              className="bg-white rounded-2xl border border-stone-200 shadow-xs p-6 space-y-4 hover:border-stone-300 transition-all"
            >
              {/* Card Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-100">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-stone-600 bg-stone-100 px-2 py-0.5 rounded">
                      {finding.finding_id}
                    </span>
                    <span className="text-xs font-bold text-stone-900">{finding.room}</span>
                    <span className="text-xs text-stone-500">· Unit: {finding.unit_id}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-stone-500">
                    <Calendar className="w-3.5 h-3.5 text-stone-400" />
                    <span>Dilaporkan: {formatIndonesianDate(finding.created_at)}</span>
                    <span>· Oleh: NIP {finding.created_by}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <PriorityBadge priority={finding.priority} />
                  <StatusBadge status={finding.status} />
                </div>
              </div>

              {/* Description & Photo Section */}
              <div className="flex flex-col md:flex-row gap-5 items-start">
                <div className="flex-1 space-y-2">
                  <div className="text-xs font-semibold uppercase tracking-wider text-stone-400">
                    Deskripsi Masalah Abnormalitas
                  </div>
                  <p className="text-sm text-stone-800 bg-stone-50 p-3.5 rounded-xl border border-stone-200 leading-relaxed">
                    {finding.description}
                  </p>

                  {finding.assigned_to && (
                    <div className="flex items-center gap-2 text-xs text-stone-600 pt-1">
                      <User className="w-3.5 h-3.5 text-stone-400" />
                      <span>
                        PIC Penanggung Jawab: <strong>{finding.assigned_to}</strong>
                      </span>
                    </div>
                  )}
                </div>

                {finding.photo_file_id && (
                  <div className="shrink-0 w-full sm:w-52">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-stone-400 mb-1.5">
                      Foto Bukti
                    </div>
                    <EvidenceThumbnail
                      photoId={finding.photo_file_id}
                      alt={`Bukti temuan ${finding.unit_id}`}
                      onClick={() =>
                        onViewPhoto(
                          finding.photo_file_id,
                          `Bukti Temuan: ${finding.unit_id} (${finding.room})`,
                          finding.description,
                          {
                            room: finding.room,
                            unitId: finding.unit_id,
                            operatorNip: finding.created_by,
                            date: finding.created_at,
                            priority: finding.priority,
                            status: finding.status,
                          }
                        )
                      }
                    />
                  </div>
                )}
              </div>

              {/* Followups timeline if present */}
              {findingFollowups.length > 0 && (
                <div className="pt-3 border-t border-stone-100 space-y-2">
                  <div className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                    Riwayat Tindak Lanjut &amp; Koordinasi ({findingFollowups.length})
                  </div>
                  <div className="space-y-2">
                    {findingFollowups.map((fol) => (
                      <div
                        key={fol.followup_id}
                        className="bg-stone-50 p-3 rounded-xl border border-stone-200 text-xs text-stone-700 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                      >
                        <div className="space-y-0.5">
                          <p className="font-medium text-stone-900">{fol.note}</p>
                          <div className="text-[11px] text-stone-500">
                            Petugas: NIP {fol.operator_nip} · {formatIndonesianDate(fol.created_at)}
                          </div>
                        </div>
                        {fol.photo_file_id && (
                          <button
                            onClick={() =>
                              onViewPhoto(
                                fol.photo_file_id!,
                                `Bukti Tindak Lanjut (${fol.followup_id})`,
                                fol.note
                              )
                            }
                            className="px-2.5 py-1 text-[11px] font-semibold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 rounded-lg flex items-center gap-1 transition-colors self-start sm:self-auto"
                          >
                            <Eye className="w-3 h-3" /> Bukti Selesai
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons for Admin */}
              <div className="pt-3 border-t border-stone-100 flex flex-wrap items-center justify-end gap-2.5">
                <button
                  onClick={() => handleOpenCoordModal(finding)}
                  className="px-3.5 py-1.5 text-xs font-semibold text-stone-700 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  Koordinasi &amp; Ubah Prioritas
                </button>
              </div>
            </div>
          );
        })}

        {filteredFindings.length === 0 && (
          <div className="p-12 text-center bg-white rounded-2xl border border-stone-200 text-stone-500 text-sm">
            Tidak ada abnormalitas yang cocok dengan filter.
          </div>
        )}
      </div>

      {/* Coordination & Priority Modal */}
      {coordinatingFinding && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-sm animate-fadeIn"
          onClick={() => setCoordinatingFinding(null)}
        >
          <div
            className="relative max-w-lg w-full bg-white rounded-2xl overflow-hidden shadow-2xl border border-stone-200 p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <div>
                <h3 className="text-base font-bold text-stone-900">
                  Koordinasi Tindak Lanjut Temuan
                </h3>
                <p className="text-xs text-stone-500">
                  {coordinatingFinding.room} · Unit {coordinatingFinding.unit_id}
                </p>
              </div>
              <button
                onClick={() => setCoordinatingFinding(null)}
                className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  Prioritas Penanganan
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['TINGGI', 'SEDANG', 'RENDAH'] as const).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setNewPriority(p)}
                      className={`py-2 rounded-lg font-bold border transition-colors ${
                        newPriority === p
                          ? 'border-[#651D2A] bg-[#651D2A] text-white shadow-xs'
                          : 'border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  PIC / Tim Penanggung Jawab
                </label>
                <input
                  type="text"
                  value={assignedPIC}
                  onChange={(e) => setAssignedPIC(e.target.value)}
                  placeholder="Contoh: Teknisi GA / Vendor IT / Workshop Maintenance"
                  className="w-full px-3 py-2 border border-stone-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-[#651D2A]"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  Catatan Instruksi / Koordinasi
                </label>
                <textarea
                  rows={3}
                  value={coordNote}
                  onChange={(e) => setCoordNote(e.target.value)}
                  placeholder="Tuliskan arahan tindak lanjut, tanggal perbaikan yang dijadwalkan, atau nomor PO penggantian komponen..."
                  className="w-full px-3 py-2 border border-stone-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-[#651D2A]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-200">
              <button
                type="button"
                onClick={() => setCoordinatingFinding(null)}
                className="px-3 py-2 text-xs font-semibold text-stone-600 hover:text-stone-900"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveCoordination}
                className="px-4 py-2 text-xs font-bold text-white bg-[#651D2A] hover:bg-[#4B141E] rounded-lg shadow-sm transition-colors"
              >
                Simpan Koordinasi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
