import React, { useState } from 'react';
import { User, Lock, ShieldCheck, LogOut, KeyRound } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { formatIndonesianDate } from '../../utils/dateUtils';
import { ApiService } from '../../services/apiService';

export const OperatorProfileView: React.FC = () => {
  const { user, logout } = useAuth();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (newPassword.length < 12) {
      setMessage({ type: 'error', text: 'Password baru wajib minimal 12 karakter' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'Konfirmasi password baru tidak cocok' });
      return;
    }

    setIsUpdating(true);
    try {
      await ApiService.changePassword('', oldPassword, newPassword, user?.nip || '26010006');
      setMessage({ type: 'success', text: 'Password berhasil diperbarui dan tersimpan di sistem!' });
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Gagal memperbarui password',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-6 pb-20 md:pb-6 max-w-xl mx-auto">
      {/* Account Info Card */}
      <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[#651D2A] text-white flex items-center justify-center font-bold text-xl">
            {user?.name.charAt(0)}
          </div>
          <div>
            <h2 className="text-lg font-bold text-stone-900">{user?.name}</h2>
            <div className="text-xs text-stone-500 font-mono">NIP: {user?.nip}</div>
            <div className="text-xs text-rose-800 font-semibold mt-0.5">
              Role: {user?.role} (ADR Learning Center)
            </div>
          </div>
        </div>

        <div className="pt-3 border-t border-stone-100 text-xs text-stone-500 flex justify-between">
          <span>Status Akun: <strong className="text-emerald-700">Aktif</strong></span>
          <span>Terdaftar: {formatIndonesianDate(user?.created_at)}</span>
        </div>
      </div>

      {/* Change Password Card */}
      <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-4 text-xs">
        <div className="flex items-center gap-2">
          <KeyRound className="w-4 h-4 text-[#651D2A]" />
          <h3 className="text-sm font-bold text-stone-900">Ubah Password Akun</h3>
        </div>
        <p className="text-stone-500">
          Sesuai kebijakan keamanan ADR, password baru wajib memiliki panjang minimal 12 karakter.
        </p>

        {message && (
          <div
            className={`p-3 rounded-xl ${
              message.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}
          >
            {message.text}
          </div>
        )}

        <form onSubmit={handleUpdatePassword} className="space-y-3">
          <div>
            <label className="block font-semibold text-stone-700 mb-1">Password Saat Ini</label>
            <input
              type="password"
              required
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              placeholder="Masukkan password lama"
              className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#651D2A]"
            />
          </div>

          <div>
            <label className="block font-semibold text-stone-700 mb-1">Password Baru</label>
            <input
              type="password"
              required
              minLength={12}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Minimal 12 karakter"
              className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#651D2A]"
            />
          </div>

          <div>
            <label className="block font-semibold text-stone-700 mb-1">Konfirmasi Password Baru</label>
            <input
              type="password"
              required
              minLength={12}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Ulangi password baru"
              className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#651D2A]"
            />
          </div>

          <button
            type="submit"
            disabled={isUpdating}
            className="w-full py-2.5 font-bold text-white bg-[#651D2A] hover:bg-[#4B141E] rounded-xl shadow-xs transition-colors"
          >
            {isUpdating ? 'Menyimpan...' : 'Perbarui Password'}
          </button>
        </form>
      </div>

      {/* Logout button */}
      <button
        onClick={logout}
        className="w-full py-3 bg-stone-100 hover:bg-stone-200 text-rose-800 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors"
      >
        <LogOut className="w-4 h-4" />
        Keluar dari Sesi Aplikasi
      </button>
    </div>
  );
};
