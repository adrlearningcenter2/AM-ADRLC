import React, { useState } from 'react';
import {
  LogOut,
  Calendar,
  Layers,
  ChevronDown,
  UserCheck,
  Sparkles,
  SlidersHorizontal,
  Building2,
  Shield,
  Smartphone,
  Menu,
  X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getCurrentWeekKey, formatWeekLabel } from '../../utils/dateUtils';
import { ApiService } from '../../services/apiService';
import { BackendConfigModal } from './BackendConfigModal';

interface HeaderProps {
  onRefreshData?: () => void;
  onToggleMobileNav?: () => void;
  isMobileNavOpen?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onRefreshData,
  onToggleMobileNav,
  isMobileNavOpen = false,
}) => {
  const { user, isAdmin, isOperator, switchDemoRole, logout } = useAuth();
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);

  const currentWeek = getCurrentWeekKey();
  const weekRange = formatWeekLabel(currentWeek);
  const isMock = ApiService.isMockMode();

  return (
    <>
      <header className="sticky top-0 z-40 bg-[#651D2A] text-white shadow-md border-b border-rose-950/40 pt-[env(safe-area-inset-top,0px)]">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16 gap-2">
            {/* Left Section: Mobile Menu Button (Admin) & Brand Logo */}
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              {isAdmin && onToggleMobileNav && (
                <button
                  type="button"
                  onClick={onToggleMobileNav}
                  aria-label={isMobileNavOpen ? 'Tutup navigasi' : 'Buka menu admin'}
                  className="lg:hidden min-w-[44px] min-h-[44px] w-11 h-11 rounded-xl bg-white/10 hover:bg-white/20 active:bg-white/30 border border-white/15 flex items-center justify-center text-white touch-press shrink-0 cursor-pointer"
                >
                  {isMobileNavOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
              )}

              <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center font-black text-white tracking-wider text-sm shadow-inner shrink-0">
                ADR
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <span className="font-extrabold tracking-tight text-sm sm:text-base lg:text-lg truncate">
                    AM DIGITAL ADR
                  </span>
                  <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider bg-amber-400 text-[#43121B] px-1.5 py-0.5 rounded shadow-2xs shrink-0">
                    V2.0
                  </span>
                </div>
                <div className="text-[10px] sm:text-[11px] text-rose-200 hidden md:block truncate">
                  ADR Learning Center · Sistem Kontrol Inventaris &amp; 5S
                </div>
              </div>
            </div>

            {/* Center Info: Week Period (Asia/Jakarta) */}
            <div className="hidden lg:flex items-center gap-2 bg-black/25 px-3 py-1.5 rounded-xl border border-white/10 text-xs">
              <Calendar className="w-3.5 h-3.5 text-rose-300" />
              <span className="text-rose-200">Periode:</span>
              <span className="font-semibold text-white">{weekRange}</span>
            </div>

            {/* Right Controls: Fast Role Switcher & Config */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Simulation Mode Indicator */}
              <button
                onClick={() => setShowConfigModal(true)}
                title="Status konfigurasi API & skema database"
                className="flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-xl bg-amber-400/20 text-amber-200 border border-amber-300/30 hover:bg-amber-400/30 transition-colors"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-amber-300" />
                <span className="hidden md:inline font-medium">
                  {isMock ? 'Data Simulasi' : 'GAS Live'}
                </span>
              </button>

              {/* Account Dropdown & Mobile Role Badge */}
              <div className="relative">
                <button
                  onClick={() => setShowRoleDropdown(!showRoleDropdown)}
                  className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-xs text-white transition-colors cursor-pointer"
                >
                  <div className="w-6 h-6 rounded-lg bg-amber-400 text-stone-950 flex items-center justify-center font-bold text-xs shrink-0">
                    {user?.name.charAt(0) || 'U'}
                  </div>
                  <div className="text-left">
                    <span className="font-bold text-[10px] sm:text-[11px] text-amber-200 block leading-tight uppercase tracking-wider">
                      {user?.role === 'ADMIN' ? 'Admin' : 'Operator'}
                    </span>
                    <span className="font-semibold text-xs leading-none hidden sm:block">
                      {user?.name.split(' ')[0]}
                    </span>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-white/70 ml-0.5" />
                </button>

                {showRoleDropdown && (
                  <div
                    className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-stone-200 p-2 text-stone-800 z-50 text-xs animate-fadeIn space-y-1.5"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="px-3 py-2 bg-stone-50 rounded-xl border border-stone-100">
                      <div className="font-bold text-stone-900 text-xs truncate">
                        {user?.name}
                      </div>
                      <div className="text-[11px] text-stone-500 font-mono mt-0.5">
                        NIP: {user?.nip}
                      </div>
                      <div className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-rose-100 text-rose-900">
                        Peran Aktif: {user?.role}
                      </div>
                    </div>

                    {/* Quick Role Switcher for Mobile & Preview Testing */}
                    <div className="pt-1 space-y-1">
                      <div className="text-[10px] font-bold text-stone-400 uppercase tracking-wider px-2">
                        Ganti Peran Tampilan
                      </div>
                      {isAdmin ? (
                        <button
                          type="button"
                          onClick={async () => {
                            setShowRoleDropdown(false);
                            await switchDemoRole('26010006');
                          }}
                          className="w-full text-left p-2.5 rounded-xl hover:bg-emerald-50 text-stone-800 hover:text-emerald-900 border border-stone-200/60 hover:border-emerald-300 transition-colors flex items-center gap-2 cursor-pointer touch-press"
                        >
                          <Smartphone className="w-4 h-4 text-emerald-600 shrink-0" />
                          <div>
                            <div className="font-bold text-xs text-emerald-900">
                              Mode Operator (Rahmat)
                            </div>
                            <div className="text-[10px] text-stone-500">
                              Buka checklist inspeksi &amp; 5 tab tombol bawah
                            </div>
                          </div>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={async () => {
                            setShowRoleDropdown(false);
                            await switchDemoRole('26010007');
                          }}
                          className="w-full text-left p-2.5 rounded-xl hover:bg-rose-50 text-stone-800 hover:text-[#651D2A] border border-stone-200/60 hover:border-rose-300 transition-colors flex items-center gap-2 cursor-pointer touch-press"
                        >
                          <Shield className="w-4 h-4 text-rose-700 shrink-0" />
                          <div>
                            <div className="font-bold text-xs text-[#651D2A]">
                              Mode Admin (ADR LC)
                            </div>
                            <div className="text-[10px] text-stone-500">
                              Monitoring, approval &amp; executive dashboard
                            </div>
                          </div>
                        </button>
                      )}
                    </div>

                    <div className="border-t border-stone-100 pt-1">
                      <button
                        onClick={() => {
                          setShowRoleDropdown(false);
                          logout();
                        }}
                        className="w-full text-left px-3 py-2 text-rose-700 hover:bg-rose-50 rounded-xl flex items-center gap-2 font-semibold cursor-pointer touch-press"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        Keluar dari Sesi
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Backend Config & Schema Modal */}
      <BackendConfigModal
        isOpen={showConfigModal}
        onClose={() => setShowConfigModal(false)}
        onResetData={onRefreshData || (() => {})}
      />
    </>
  );
};
