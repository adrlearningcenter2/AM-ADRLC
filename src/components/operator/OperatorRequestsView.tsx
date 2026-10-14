import React, { useState, useEffect } from 'react';
import {
  FileQuestion,
  Plus,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Calendar,
  Building2,
  RefreshCw,
  Search,
  Filter,
  UserCheck,
  MessageSquare
} from 'lucide-react';
import { OperatorRequest } from '../../types/adr';
import { MockDatabase } from '../../services/mockData';
import { ApiService } from '../../services/apiService';
import { useAuth } from '../../context/AuthContext';
import { formatIndonesianDate } from '../../utils/dateUtils';
import { StatusBadge } from '../common/StatusBadge';

interface OperatorRequestsViewProps {
  onOpenNewRequest: () => void;
}

export const OperatorRequestsView: React.FC<OperatorRequestsViewProps> = ({
  onOpenNewRequest,
}) => {
  const { user, token } = useAuth();
  const [requests, setRequests] = useState<OperatorRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL');
  const [search, setSearch] = useState('');

  const loadRequests = async () => {
    setLoading(true);
    try {
      if (token && !ApiService.isMockMode()) {
        const live = await ApiService.getRequests(token);
        if (Array.isArray(live)) {
          // Filter to user's requests if operator
          const myRequests = live.filter(
            (r) => !user?.nip || r.requester_nip === user.nip || r.requester_nip === String(user.nip)
          );
          setRequests(myRequests);
          setError('');
          setLoading(false);
          return;
        }
      }
      const mockList = MockDatabase.getRequests();
      const myMock = mockList.filter(
        (r) => !user?.nip || r.requester_nip === user.nip || r.requester_nip === '26010006'
      );
      setRequests(myMock);
      setError('');
    } catch (e: any) {
      setError(e.message || 'Gagal memuat daftar pengajuan');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, [token, user?.nip]);

  const filtered = requests.filter((r) => {
    if (activeTab !== 'ALL' && r.status !== activeTab) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        r.request_id.toLowerCase().includes(q) ||
        r.room.toLowerCase().includes(q) ||
        r.reason.toLowerCase().includes(q) ||
        (r.review_note || '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  const getRequestTypeLabel = (type: string) => {
    switch (type) {
      case 'LATE_INSPECTION':
        return 'Dispensasi Waktu / Inspeksi Susulan';
      case 'ADD_ASSET':
        return 'Usulan Tambah Master Inventaris';
      case 'CANCEL_FINDING':
        return 'Permohonan Pembatalan Temuan';
      case 'REOPEN_FINDING':
        return 'Permohonan Buka Kembali Temuan';
      default:
        return type;
    }
  };

  const pendingCount = requests.filter((r) => r.status === 'PENDING').length;
  const approvedCount = requests.filter((r) => r.status === 'APPROVED').length;
  const rejectedCount = requests.filter((r) => r.status === 'REJECTED').length;

  return (
    <div className="space-y-6 pb-20 md:pb-6 animate-fadeIn">
      {/* Top Header Card */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-stone-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-[#651D2A] mb-1">
            <FileQuestion className="w-4 h-4" />
            <span>Alur Pengajuan &amp; Persetujuan Operator</span>
          </div>
          <h1 className="text-xl font-extrabold text-stone-900">
            Daftar Pengajuan Saya
          </h1>
          <p className="text-xs text-stone-500 mt-0.5">
            Operator mengajukan permohonan ke Admin · Keputusan Admin dicatat dan termonitor secara transparan.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={loadRequests}
            className="p-2.5 text-stone-600 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 rounded-xl transition-all cursor-pointer"
            title="Segarkan data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={onOpenNewRequest}
            className="min-h-[44px] px-4 py-2.5 text-xs font-bold text-white bg-[#651D2A] hover:bg-[#4B141E] rounded-xl shadow-sm transition-all flex items-center gap-2 cursor-pointer touch-press"
          >
            <Plus className="w-4 h-4" />
            <span>Buat Pengajuan Baru</span>
          </button>
        </div>
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 p-1 bg-stone-100 rounded-xl overflow-x-auto text-xs">
          <button
            onClick={() => setActiveTab('ALL')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer shrink-0 ${
              activeTab === 'ALL'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Semua ({requests.length})
          </button>
          <button
            onClick={() => setActiveTab('PENDING')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer shrink-0 flex items-center gap-1 ${
              activeTab === 'PENDING'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <span>Menunggu</span>
            {pendingCount > 0 && (
              <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                {pendingCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('APPROVED')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer shrink-0 ${
              activeTab === 'APPROVED'
                ? 'bg-white text-emerald-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Disetujui ({approvedCount})
          </button>
          <button
            onClick={() => setActiveTab('REJECTED')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer shrink-0 ${
              activeTab === 'REJECTED'
                ? 'bg-white text-rose-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Ditolak ({rejectedCount})
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Cari ID, ruangan, atau alasan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-stone-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-1 focus:ring-[#651D2A]"
          />
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs">
          {error}
        </div>
      )}

      {/* Requests List */}
      <div className="space-y-4">
        {loading && requests.length === 0 ? (
          <div className="p-12 text-center text-xs text-stone-500 bg-white rounded-2xl border border-stone-200">
            Memuat daftar pengajuan...
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-stone-500 bg-white rounded-2xl border border-stone-200 space-y-3">
            <FileQuestion className="w-10 h-10 text-stone-300 mx-auto" />
            <p className="text-sm font-medium">Belum ada pengajuan dengan filter ini.</p>
            <button
              onClick={onOpenNewRequest}
              className="px-4 py-2 text-xs font-bold text-white bg-[#651D2A] hover:bg-[#4B141E] rounded-xl shadow-xs inline-flex items-center gap-1.5 cursor-pointer touch-press"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Buat Pengajuan Baru</span>
            </button>
          </div>
        ) : (
          filtered.map((req) => {
            const isPending = req.status === 'PENDING';
            const isApproved = req.status === 'APPROVED';
            const isRejected = req.status === 'REJECTED';

            return (
              <div
                key={req.request_id}
                className={`bg-white rounded-2xl border p-5 sm:p-6 shadow-xs transition-all space-y-4 ${
                  isPending
                    ? 'border-amber-200 bg-amber-50/10'
                    : isApproved
                    ? 'border-emerald-200 bg-emerald-50/10'
                    : 'border-rose-200 bg-rose-50/10'
                }`}
              >
                {/* Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-stone-100">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-bold text-stone-600 bg-stone-100 px-2 py-0.5 rounded border border-stone-200">
                        {req.request_id}
                      </span>
                      <span className="text-xs font-extrabold text-stone-900">
                        {getRequestTypeLabel(req.type)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-stone-500 flex-wrap">
                      <span className="inline-flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5 text-stone-400" />
                        {req.room}
                      </span>
                      <span>·</span>
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-stone-400" />
                        Diajukan: {formatIndonesianDate(req.created_at)}
                      </span>
                    </div>
                  </div>

                  <div>
                    {isPending ? (
                      <span className="inline-flex items-center gap-1 text-xs font-bold px-3 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                        <Clock className="w-3.5 h-3.5 text-amber-700 animate-pulse" />
                        Menunggu Keputusan Admin
                      </span>
                    ) : isApproved ? (
                      <span className="inline-flex items-center gap-1 text-xs font-bold px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-700" />
                        Disetujui Admin
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-bold px-3 py-1 rounded-full bg-rose-100 text-rose-900 border border-rose-300">
                        <XCircle className="w-3.5 h-3.5 text-rose-700" />
                        Ditolak Admin
                      </span>
                    )}
                  </div>
                </div>

                {/* Reason Section */}
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block mb-1">
                    Alasan &amp; Keperluan Pengajuan:
                  </span>
                  <p className="text-xs text-stone-800 bg-stone-50 p-3 rounded-xl border border-stone-200 leading-relaxed font-medium">
                    {req.reason}
                  </p>
                </div>

                {/* Payload specifics */}
                {req.payload && Object.keys(req.payload).length > 0 && (
                  <div className="bg-stone-50/70 p-3 rounded-xl border border-stone-100 text-xs text-stone-600 space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block">
                      Detail Lampiran Permohonan:
                    </span>
                    {req.payload.deadline && (
                      <div>
                        Tenggat Waktu Susulan: <strong>{req.payload.deadline}</strong>
                      </div>
                    )}
                    {req.payload.assetName && (
                      <div>
                        Inventaris Baru: <strong>{req.payload.assetName}</strong>
                      </div>
                    )}
                    {req.payload.findingId && (
                      <div>
                        ID Temuan Terkait: <strong>{req.payload.findingId}</strong>
                      </div>
                    )}
                  </div>
                )}

                {/* Admin Review Result Box */}
                {!isPending && (
                  <div
                    className={`p-3.5 rounded-xl border text-xs space-y-1.5 ${
                      isApproved
                        ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                        : 'bg-rose-50/70 border-rose-200 text-rose-950'
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold">
                      <div className="flex items-center gap-1.5">
                        <UserCheck className="w-4 h-4" />
                        <span>Keputusan Admin (Reviewer NIP: {req.reviewer_nip || 'Administrator'})</span>
                      </div>
                      {req.reviewed_at && (
                        <span className="text-[11px] font-normal opacity-80">
                          {formatIndonesianDate(req.reviewed_at)}
                        </span>
                      )}
                    </div>
                    {req.review_note ? (
                      <p className="text-xs leading-relaxed bg-white/60 p-2.5 rounded-lg border border-black/5 font-medium">
                        "{req.review_note}"
                      </p>
                    ) : (
                      <p className="text-xs italic opacity-75">
                        Tidak ada catatan tambahan dari Admin.
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
