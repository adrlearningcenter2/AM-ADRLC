import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  Shield,
  MapPin,
  CheckCircle,
  XCircle,
  UserCheck,
  Plus,
  Trash2,
  Lock,
  ArrowRight
} from 'lucide-react';
import { User, RoomAssignment } from '../../types/adr';
import { MockDatabase } from '../../services/mockData';
import { ApiService } from '../../services/apiService';
import { useAuth } from '../../context/AuthContext';
import { formatIndonesianDate } from '../../utils/dateUtils';

interface UsersAndAssignmentsProps {
  onRefresh: () => void;
}

export const UsersAndAssignments: React.FC<UsersAndAssignmentsProps> = ({ onRefresh }) => {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>(MockDatabase.getUsers());
  const [assignments, setAssignments] = useState<RoomAssignment[]>(MockDatabase.getAssignments());
  const [activeTab, setActiveTab] = useState<'users' | 'assignments'>('users');

  // Create User Modal
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [newNip, setNewNip] = useState('');
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState<'OPERATOR' | 'ADMIN'>('OPERATOR');
  const [newPassword, setNewPassword] = useState('');

  // Create Assignment Modal
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignRoom, setAssignRoom] = useState('Ruang Teori 1');
  const [assignMainNip, setAssignMainNip] = useState('26010006');
  const [assignSubNip, setAssignSubNip] = useState('26010008');

  const assets = MockDatabase.getAssets();
  const roomsList = Array.from(new Set(assets.map((a) => a.room))).sort();
  const operators = users.filter((u) => u.active && u.role === 'OPERATOR');

  const refreshData = () => {
    setUsers(MockDatabase.getUsers());
    setAssignments(MockDatabase.getAssignments());
    onRefresh();
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!/^[0-9]{4,20}$/.test(newNip)) {
        throw new Error('NIP wajib berupa 4–20 digit angka');
      }
      if (newPassword.length < 12) {
        throw new Error('Password wajib minimal 12 karakter');
      }

      await ApiService.createUser('', user?.nip || '26010007', {
        nip: newNip,
        name: newName,
        role: newRole,
        password: newPassword,
      });

      setShowCreateUserModal(false);
      setNewNip('');
      setNewName('');
      setNewPassword('');
      refreshData();
      alert('Akun berhasil dibuat dan siap digunakan login.');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Gagal membuat akun');
    }
  };

  const handleToggleUser = async (targetNip: string) => {
    try {
      await ApiService.toggleUserStatus('', user?.nip || '26010007', targetNip);
      refreshData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Gagal mengubah status akun');
    }
  };

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await ApiService.assignSubstitute('', user?.nip || '26010007', assignRoom, assignMainNip, assignSubNip);
      setShowAssignModal(false);
      refreshData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Gagal membuat penugasan');
    }
  };

  const handleRevokeAssignment = async (id: string) => {
    if (window.confirm('Cabut penugasan delegasi ini?')) {
      try {
        await ApiService.revokeAssignment('', user?.nip || '26010007', id);
        refreshData();
      } catch (err) {
        alert(err instanceof Error ? err.message : 'Gagal mencabut penugasan');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-stone-900">
            Manajemen Pengguna &amp; Penugasan Ruangan
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Pengelolaan hak akses akun NIP dan delegasi operator penanggung jawab inspeksi.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 p-1 bg-stone-100 rounded-lg text-xs font-semibold">
            <button
              onClick={() => setActiveTab('users')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                activeTab === 'users'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Akun Pengguna ({users.length})
            </button>
            <button
              onClick={() => setActiveTab('assignments')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                activeTab === 'assignments'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Penugasan Delegasi ({assignments.filter((a) => a.active).length})
            </button>
          </div>

          {activeTab === 'users' ? (
            <button
              onClick={() => setShowCreateUserModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-[#651D2A] hover:bg-[#4B141E] rounded-xl shadow-xs transition-colors"
            >
              <UserPlus className="w-3.5 h-3.5" />
              Buat Akun Baru
            </button>
          ) : (
            <button
              onClick={() => setShowAssignModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-[#651D2A] hover:bg-[#4B141E] rounded-xl shadow-xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Tambah Delegasi
            </button>
          )}
        </div>
      </div>

      {/* Tab 1: Users Table */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
          <table className="w-full text-xs text-left">
            <thead className="bg-stone-50 text-stone-600 uppercase tracking-wider text-[11px] border-b border-stone-200">
              <tr>
                <th className="p-4">NIP &amp; Pengguna</th>
                <th className="p-4">Role Akses</th>
                <th className="p-4">Status Akun</th>
                <th className="p-4">Terdaftar</th>
                <th className="p-4 text-right">Tindakan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {users.map((u) => (
                <tr key={u.user_id} className="hover:bg-stone-50/70">
                  <td className="p-4">
                    <div className="font-bold text-stone-900 text-sm">{u.name}</div>
                    <div className="text-stone-500 font-mono text-[11px]">NIP: {u.nip}</div>
                  </td>
                  <td className="p-4">
                    <span
                      className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                        u.role === 'ADMIN'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-stone-100 text-stone-700'
                      }`}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td className="p-4">
                    {u.active ? (
                      <span className="text-emerald-700 font-medium flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5" /> Aktif
                      </span>
                    ) : (
                      <span className="text-stone-400 font-medium flex items-center gap-1">
                        <XCircle className="w-3.5 h-3.5" /> Non-Aktif
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-stone-500">
                    {formatIndonesianDate(u.created_at)}
                  </td>
                  <td className="p-4 text-right">
                    {u.nip !== user?.nip && (
                      <button
                        onClick={() => handleToggleUser(u.nip)}
                        className={`text-xs font-semibold px-2.5 py-1 rounded-lg transition-colors ${
                          u.active
                            ? 'text-rose-700 hover:bg-rose-50'
                            : 'text-emerald-700 hover:bg-emerald-50'
                        }`}
                      >
                        {u.active ? 'Nonaktifkan' : 'Aktifkan'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 2: Assignments Table */}
      {activeTab === 'assignments' && (
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
          <table className="w-full text-xs text-left">
            <thead className="bg-stone-50 text-stone-600 uppercase tracking-wider text-[11px] border-b border-stone-200">
              <tr>
                <th className="p-4">Ruangan</th>
                <th className="p-4">Operator Utama</th>
                <th className="p-4">Operator Pengganti (Delegasi)</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {assignments.map((asg) => {
                const main = users.find((u) => u.nip === asg.main_nip);
                const sub = users.find((u) => u.nip === asg.substitute_nip);
                return (
                  <tr key={asg.assignment_id} className="hover:bg-stone-50/70">
                    <td className="p-4 font-bold text-stone-900">{asg.room}</td>
                    <td className="p-4">
                      <div className="font-semibold text-stone-800">
                        {main?.name || asg.main_nip}
                      </div>
                      <div className="text-stone-400 font-mono text-[11px]">
                        NIP {asg.main_nip}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="font-semibold text-amber-800">
                        {sub?.name || asg.substitute_nip}
                      </div>
                      <div className="text-stone-400 font-mono text-[11px]">
                        NIP {asg.substitute_nip}
                      </div>
                    </td>
                    <td className="p-4">
                      {asg.active ? (
                        <span className="text-emerald-700 font-bold">Aktif Berlaku</span>
                      ) : (
                        <span className="text-stone-400">Dicabut ({formatIndonesianDate(asg.ended_at)})</span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      {asg.active && (
                        <button
                          onClick={() => handleRevokeAssignment(asg.assignment_id)}
                          className="text-xs font-semibold text-rose-700 hover:text-rose-900 hover:bg-rose-50 px-2 py-1 rounded-lg transition-colors"
                        >
                          Cabut Delegasi
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Create User */}
      {showCreateUserModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-sm animate-fadeIn"
          onClick={() => setShowCreateUserModal(false)}
        >
          <div
            className="max-w-md w-full bg-white rounded-2xl p-6 border border-stone-200 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <h3 className="text-base font-bold text-stone-900">Buat Akun Petugas Baru</h3>
              <p className="text-xs text-stone-500">
                Pendaftaran NIP dan hak akses aplikasi AM Digital ADR
              </p>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  Nomor Induk Pegawai (NIP)
                </label>
                <input
                  type="text"
                  required
                  pattern="[0-9]{4,20}"
                  placeholder="Contoh: 26010010"
                  value={newNip}
                  onChange={(e) => setNewNip(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#651D2A]"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Nama Lengkap</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Hendra Kurniawan"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#651D2A]"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Peran / Role</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as 'OPERATOR' | 'ADMIN')}
                  className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#651D2A]"
                >
                  <option value="OPERATOR">OPERATOR (Pemeriksaan &amp; Follow-up)</option>
                  <option value="ADMIN">ADMIN (Dashboard &amp; Manajemen Penuh)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  Password Awal (Min 12 Karakter)
                </label>
                <input
                  type="password"
                  required
                  minLength={12}
                  placeholder="Minimal 12 karakter aman..."
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#651D2A]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setShowCreateUserModal(false)}
                  className="px-3 py-2 text-xs font-semibold text-stone-600 hover:text-stone-900"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-[#651D2A] hover:bg-[#4B141E] rounded-lg shadow-sm"
                >
                  Simpan Akun
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Create Assignment */}
      {showAssignModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-sm animate-fadeIn"
          onClick={() => setShowAssignModal(false)}
        >
          <div
            className="max-w-md w-full bg-white rounded-2xl p-6 border border-stone-200 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <h3 className="text-base font-bold text-stone-900">Tambah Delegasi Ruangan</h3>
              <p className="text-xs text-stone-500">
                Tugaskan operator pengganti untuk menjalankan inspeksi ruangan tertentu
              </p>
            </div>

            <form onSubmit={handleCreateAssignment} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Ruangan</label>
                <select
                  value={assignRoom}
                  onChange={(e) => setAssignRoom(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#651D2A]"
                >
                  {roomsList.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Operator Utama</label>
                <select
                  value={assignMainNip}
                  onChange={(e) => setAssignMainNip(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#651D2A]"
                >
                  {operators.map((o) => (
                    <option key={o.nip} value={o.nip}>
                      {o.name} (NIP {o.nip})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  Operator Pengganti (Delegasi)
                </label>
                <select
                  value={assignSubNip}
                  onChange={(e) => setAssignSubNip(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#651D2A]"
                >
                  {operators
                    .filter((o) => o.nip !== assignMainNip)
                    .map((o) => (
                      <option key={o.nip} value={o.nip}>
                        {o.name} (NIP {o.nip})
                      </option>
                    ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="px-3 py-2 text-xs font-semibold text-stone-600 hover:text-stone-900"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-[#651D2A] hover:bg-[#4B141E] rounded-lg shadow-sm"
                >
                  Tetapkan Delegasi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
