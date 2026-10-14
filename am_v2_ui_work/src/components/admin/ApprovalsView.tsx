import React, { useState } from 'react';
import {
  CheckSquare,
  CheckCircle,
  XCircle,
  Clock,
  User,
  MapPin,
  Calendar,
  AlertCircle,
  MessageSquare
} from 'lucide-react';
import { OperatorRequest } from '../../types/adr';
import { MockDatabase } from '../../services/mockData';
import { ApiService } from '../../services/apiService';
import { useAuth } from '../../context/AuthContext';
import { StatusBadge } from '../common/StatusBadge';
import { formatIndonesianDate } from '../../utils/dateUtils';

interface ApprovalsViewProps {
  onRefresh: () => void;
}

export const ApprovalsView: React.FC<ApprovalsViewProps> = ({ onRefresh }) => {
  const { user, token } = useAuth();
  const [requests, setRequests] = useState<OperatorRequest[]>(MockDatabase.getRequests());
  const [activeTab, setActiveTab] = useState<'PENDING' | 'DECIDED' | 'ALL'>('PENDING');

  const [decisionModal, setDecisionModal] = useState<{
    request: OperatorRequest;
    decision: 'APPROVED' | 'REJECTED';
  } | null>(null);
  const [reviewNote, setReviewNote] = useState('');

  const refreshList = async () => {
    if (token && !ApiService.isMockMode()) {
      try {
        const liveReqs = await ApiService.getRequests(token);
        if (Array.isArray(liveReqs)) {
          setRequests(liveReqs);
        }
        onRefresh();
        return;
      } catch (err) {
        console.warn('Gagal memuat pengajuan live, menggunakan mock:', err);
      }
    }
    setRequests(MockDatabase.getRequests());
    onRefresh();
  };

  React.useEffect(() => {
    refreshList();
  }, [token]);

  const handleOpenDecision = (request: OperatorRequest, decision: 'APPROVED' | 'REJECTED') => {
    setDecisionModal({ request, decision });
    setReviewNote(decision === 'APPROVED' ? 'Disetujui. Silakan ditindaklanjuti sesuai instruksi.' : '');
  };

  const handleConfirmDecision = async () => {
    if (!decisionModal) return;
    try {
      await ApiService.decideRequest(
        token || '',
        user?.nip || '26010007',
        decisionModal.request.request_id,
        decisionModal.decision,
        reviewNote
      );
      setDecisionModal(null);
      await refreshList();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Gagal memproses keputusan');
    }
  };

  const filteredRequests = requests.filter((r) => {
    if (activeTab === 'PENDING') return r.status === 'PENDING';
    if (activeTab === 'DECIDED') return r.status !== 'PENDING';
    return true;
  });

  const getRequestTypeLabel = (type: string) => {
    switch (type) {
      case 'LATE_INSPECTION':
        return 'Izin Inspeksi Terlambat (Susulan)';
      case 'ADD_ASSET':
        return 'Permohonan Tambah Master Aset';
      case 'CANCEL_FINDING':
        return 'Pembatalan Temuan Abnormalitas';
      case 'REOPEN_FINDING':
        return 'Buka Kembali Temuan (Reopen)';
      default:
        return type;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-stone-900">
            Approval Pengajuan Izin &amp; Fasilitas Operator
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Verifikasi dispensasi jadwal inspeksi, penambahan inventaris baru, dan pembatalan temuan.
          </p>
        </div>

        {/* Tab filters */}
        <div className="flex items-center gap-1 p-1 bg-stone-100 rounded-lg text-xs">
          <button
            onClick={() => setActiveTab('PENDING')}
            className={`px-3 py-1.5 rounded-md font-semibold transition-colors ${
              activeTab === 'PENDING'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Menunggu Review ({requests.filter((r) => r.status === 'PENDING').length})
          </button>
          <button
            onClick={() => setActiveTab('DECIDED')}
            className={`px-3 py-1.5 rounded-md font-semibold transition-colors ${
              activeTab === 'DECIDED'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Riwayat Keputusan
          </button>
          <button
            onClick={() => setActiveTab('ALL')}
            className={`px-3 py-1.5 rounded-md font-semibold transition-colors ${
              activeTab === 'ALL'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Semua ({requests.length})
          </button>
        </div>
      </div>

      {/* Requests List */}
      <div className="space-y-4">
        {filteredRequests.map((req) => (
          <div
            key={req.request_id}
            className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs space-y-4 hover:border-stone-300 transition-all"
          >
            {/* Card Top */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-100">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-stone-500 bg-stone-100 px-2 py-0.5 rounded">
                    {req.request_id}
                  </span>
                  <span className="text-sm font-bold text-stone-900">
                    {getRequestTypeLabel(req.type)}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-stone-500">
                  <MapPin className="w-3.5 h-3.5 text-stone-400" />
                  <span>Ruangan: <strong>{req.room}</strong></span>
                  <span>· Pemohon: NIP {req.requester_nip}</span>
                  <span>· {formatIndonesianDate(req.created_at)}</span>
                </div>
              </div>

              <div>
                <StatusBadge status={req.status} />
              </div>
            </div>

            {/* Reason */}
            <div className="space-y-2">
              <div className="text-xs font-semibold uppercase tracking-wider text-stone-400">
                Alasan Pengajuan:
              </div>
              <p className="text-xs text-stone-800 bg-stone-50 p-3.5 rounded-xl border border-stone-200 leading-relaxed font-medium">
                {req.reason}
              </p>
            </div>

            {/* Payload metadata if present */}
            {req.payload && Object.keys(req.payload).length > 0 && (
              <div className="text-xs text-stone-600 bg-amber-50/50 p-3 rounded-xl border border-amber-200/60 flex flex-wrap gap-4">
                {req.payload.deadline && (
                  <div>
                    <span className="text-amber-800 font-semibold">Tenggat Waktu Susulan:</span>{' '}
                    {req.payload.deadline}
                  </div>
                )}
                {req.payload.assetName && (
                  <div>
                    <span className="text-amber-800 font-semibold">Nama Inventaris Usulan:</span>{' '}
                    {req.payload.assetName} (Qty: {req.payload.qty || 1})
                  </div>
                )}
                {req.payload.findingId && (
                  <div>
                    <span className="text-amber-800 font-semibold">Target ID Temuan:</span>{' '}
                    {req.payload.findingId}
                  </div>
                )}
              </div>
            )}

            {/* Decision note if decided */}
            {req.status !== 'PENDING' && (
              <div className="text-xs text-stone-600 pt-2 border-t border-stone-100 flex items-start gap-2">
                <MessageSquare className="w-4 h-4 text-stone-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-stone-800">
                    Catatan Reviewer (NIP {req.reviewer_nip}):
                  </span>{' '}
                  {req.review_note || 'Tidak ada catatan tambahan.'}
                  <div className="text-[11px] text-stone-400 mt-0.5">
                    Diputuskan pada {formatIndonesianDate(req.reviewed_at)}
                  </div>
                </div>
              </div>
            )}

            {/* Actions if pending */}
            {req.status === 'PENDING' && (
              <div className="pt-3 border-t border-stone-100 flex items-center justify-end gap-3">
                <button
                  onClick={() => handleOpenDecision(req, 'REJECTED')}
                  className="px-3.5 py-1.5 text-xs font-semibold text-rose-800 hover:text-rose-900 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  Tolak Pengajuan
                </button>
                <button
                  onClick={() => handleOpenDecision(req, 'APPROVED')}
                  className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  Setujui Pengajuan
                </button>
              </div>
            )}
          </div>
        ))}

        {filteredRequests.length === 0 && (
          <div className="p-12 text-center bg-white rounded-2xl border border-stone-200 text-stone-500 text-sm">
            Tidak ada pengajuan pada tab ini.
          </div>
        )}
      </div>

      {/* Decision Modal */}
      {decisionModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-sm animate-fadeIn"
          onClick={() => setDecisionModal(null)}
        >
          <div
            className="relative max-w-md w-full bg-white rounded-2xl overflow-hidden shadow-2xl border border-stone-200 p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <h3 className="text-base font-bold text-stone-900">
                {decisionModal.decision === 'APPROVED' ? 'Setujui Pengajuan' : 'Tolak Pengajuan'}
              </h3>
              <p className="text-xs text-stone-500 mt-0.5">
                {getRequestTypeLabel(decisionModal.request.type)} · {decisionModal.request.room}
              </p>
            </div>

            <div className="space-y-2 text-xs">
              <label className="block font-semibold text-stone-700">
                Catatan Keputusan Reviewer
              </label>
              <textarea
                rows={3}
                value={reviewNote}
                onChange={(e) => setReviewNote(e.target.value)}
                placeholder="Tuliskan catatan alasan persetujuan atau penolakan..."
                className="w-full px-3 py-2 border border-stone-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-[#651D2A]"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-200">
              <button
                type="button"
                onClick={() => setDecisionModal(null)}
                className="px-3 py-2 text-xs font-semibold text-stone-600 hover:text-stone-900"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDecision}
                className={`px-4 py-2 text-xs font-bold text-white rounded-lg shadow-sm transition-colors ${
                  decisionModal.decision === 'APPROVED'
                    ? 'bg-emerald-700 hover:bg-emerald-800'
                    : 'bg-rose-700 hover:bg-rose-800'
                }`}
              >
                Konfirmasi {decisionModal.decision === 'APPROVED' ? 'Setujui' : 'Tolak'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
