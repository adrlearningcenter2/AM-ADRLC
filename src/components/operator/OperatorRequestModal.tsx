import React, { useState } from 'react';
import { X, Send, AlertCircle, FileQuestion, Calendar, MapPin } from 'lucide-react';
import { RequestType } from '../../types/adr';
import { ApiService } from '../../services/apiService';
import { useAuth } from '../../context/AuthContext';
import { MockDatabase } from '../../services/mockData';
import { getCurrentWeekKey } from '../../utils/dateUtils';

interface OperatorRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const OperatorRequestModal: React.FC<OperatorRequestModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { user, token } = useAuth();
  const currentWeek = getCurrentWeekKey();

  const [type, setType] = useState<RequestType>('LATE_INSPECTION');
  const [room, setRoom] = useState('Ruang Teori 1');
  const [reason, setReason] = useState('');
  const [deadline, setDeadline] = useState(currentWeek);
  const [assetName, setAssetName] = useState('');
  const [findingId, setFindingId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const assets = MockDatabase.getAssets();
  const roomsList = Array.from(new Set(assets.map((a) => a.room))).sort();
  const findings = MockDatabase.getFindings();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (user?.role === 'ADMIN') {
      alert('Akses Ditolak: Fitur pengajuan permohonan hanya diperuntukkan bagi Operator pelaksana. Admin bertugas meninjau dan memutuskan (Approval).');
      return;
    }
    if (reason.trim().length < 8) {
      alert('Alasan pengajuan wajib diisi minimal 8 karakter');
      return;
    }

    setIsSubmitting(true);
    try {
      await ApiService.submitRequest(token || '', user?.nip || '26010006', type, room, reason, {
        deadline: type === 'LATE_INSPECTION' ? deadline : undefined,
        assetName: type === 'ADD_ASSET' ? assetName : undefined,
        findingId: type === 'CANCEL_FINDING' || type === 'REOPEN_FINDING' ? findingId : undefined,
      });

      alert('Permohonan berhasil dikirim ke Admin untuk ditinjau.');
      onSuccess();
      onClose();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Gagal mengirim pengajuan');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="max-w-lg w-full bg-white rounded-2xl p-6 border border-stone-200 shadow-2xl space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-2 border-b border-stone-200">
          <div>
            <h3 className="text-base font-bold text-stone-900">Ajukan Permintaan ke Admin</h3>
            <p className="text-xs text-stone-500">
              Pengajuan izin dispensasi, usulan inventaris, atau pembatalan temuan
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 text-stone-400 hover:text-stone-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="block font-semibold text-stone-700 mb-1">Jenis Permohonan</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as RequestType)}
              className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#651D2A] font-semibold text-stone-800"
            >
              <option value="LATE_INSPECTION">Inspeksi Terlambat / Susulan (Dispensasi Waktu)</option>
              <option value="ADD_ASSET">Usulan Penambahan Master Inventaris</option>
              <option value="CANCEL_FINDING">Pembatalan Temuan Abnormalitas</option>
              <option value="REOPEN_FINDING">Buka Kembali Temuan yang Telah Ditutup</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-stone-700 mb-1">Ruangan Terkait</label>
            <select
              value={room}
              onChange={(e) => setRoom(e.target.value)}
              className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#651D2A]"
            >
              {roomsList.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          {type === 'LATE_INSPECTION' && (
            <div>
              <label className="block font-semibold text-stone-700 mb-1">
                Tenggat Waktu Susulan (YYYY-MM-DD)
              </label>
              <input
                type="date"
                required
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#651D2A]"
              />
            </div>
          )}

          {type === 'ADD_ASSET' && (
            <div>
              <label className="block font-semibold text-stone-700 mb-1">
                Nama &amp; Spesifikasi Inventaris Baru
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: Digital Clamp Meter Hioki 3280-10F"
                value={assetName}
                onChange={(e) => setAssetName(e.target.value)}
                className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#651D2A]"
              />
            </div>
          )}

          {(type === 'CANCEL_FINDING' || type === 'REOPEN_FINDING') && (
            <div>
              <label className="block font-semibold text-stone-700 mb-1">
                Pilih Temuan Terkait
              </label>
              <select
                value={findingId}
                onChange={(e) => setFindingId(e.target.value)}
                className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#651D2A]"
              >
                <option value="">-- Pilih ID Temuan --</option>
                {findings.map((f) => (
                  <option key={f.finding_id} value={f.finding_id}>
                    {f.finding_id} ({f.room} - {f.unit_id}): {f.description.slice(0, 30)}...
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block font-semibold text-stone-700 mb-1">
              Alasan Pengajuan (Min 8 Karakter) <span className="text-rose-600">*</span>
            </label>
            <textarea
              rows={3}
              required
              minLength={8}
              placeholder="Jelaskan kendala operasional, jadwal kelas pelatihan yang bentrok, atau alasan lainnya..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#651D2A]"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-200">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 text-xs font-semibold text-stone-600 hover:text-stone-900"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-bold text-white bg-[#651D2A] hover:bg-[#4B141E] rounded-lg shadow-sm flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              {isSubmitting ? 'Mengirim...' : 'Kirim Pengajuan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
