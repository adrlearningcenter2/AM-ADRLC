import React, { useState } from 'react';
import { LogIn, Shield, Building2, KeyRound, AlertCircle, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const LoginView: React.FC = () => {
  const { login } = useAuth();
  const [nip, setNip] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    try {
      await login(nip, password);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Login gagal');
    } finally {
      setIsLoading(false);
    }
  };

  const fillQuickDemo = (demoNip: string) => {
    setNip(demoNip);
    setPassword('');
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-2">
        {/* Brand Icon */}
        <div className="inline-flex w-16 h-16 rounded-2xl bg-[#651D2A] text-white items-center justify-center font-extrabold text-2xl shadow-xl border border-rose-900/40">
          ADR
        </div>

        <h1 className="text-2xl font-extrabold text-stone-900 tracking-tight">
          AM DIGITAL ADR V2
        </h1>
        <p className="text-xs font-semibold uppercase tracking-wider text-rose-800">
          ADR Learning Center · Sistem Kontrol Inventaris &amp; 5S
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-xl rounded-2xl border border-stone-200 sm:px-10 space-y-6">
          {errorMessage && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-700 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-stone-700 mb-1">
                Nomor Induk Pegawai (NIP)
              </label>
              <input
                type="text"
                required
                placeholder="Masukkan NIP Anda (Contoh: 26010007)"
                value={nip}
                onChange={(e) => setNip(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-stone-300 rounded-xl text-stone-900 text-xs focus:outline-none focus:ring-2 focus:ring-[#651D2A] focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">
                Kata Sandi / Password
              </label>
              <input
                type="password"
                required
                placeholder="Masukkan password akun"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-stone-300 rounded-xl text-stone-900 text-xs focus:outline-none focus:ring-2 focus:ring-[#651D2A] focus:border-transparent transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 font-bold text-white bg-[#651D2A] hover:bg-[#4B141E] rounded-xl shadow-md disabled:opacity-50 transition-all flex items-center justify-center gap-2 text-xs"
            >
              <LogIn className="w-4 h-4" />
              {isLoading ? 'Memverifikasi...' : 'Masuk ke Sistem'}
            </button>
          </form>

        </div>

        {/* Footer Note */}
        <div className="text-center mt-6 text-xs text-stone-500 space-y-1">
          <p>ADR Learning Center · PT Selamat Sempurna Tbk</p>
          <p className="text-[11px] text-stone-400">
            Zona Waktu: Asia/Jakarta · Periode Inspeksi: Senin – Minggu
          </p>
        </div>
      </div>
    </div>
  );
};
