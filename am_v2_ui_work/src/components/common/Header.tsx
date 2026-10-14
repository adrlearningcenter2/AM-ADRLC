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
  Smartphone
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getCurrentWeekKey, formatWeekLabel } from '../../utils/dateUtils';
import { ApiService } from '../../services/apiService';
import { BackendConfigModal } from './BackendConfigModal';

interface HeaderProps {
  onRefreshData?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onRefreshData }) => {
  const { user, isAdmin, isOperator, switchDemoRole, logout } = useAuth();
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);

  const currentWeek = getCurrentWeekKey();
  const weekRange = formatWeekLabel(currentWeek);
  const isMock = ApiService.isMockMode();

  return (
    <>
      <header className="sticky top-0 z-40 bg-[#651D2A] text-white shadow-md border-b border-rose-950/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Brand Logo & Title */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center font-black text-white tracking-wider text-sm shadow-inner">
                ADR
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold tracking-tight text-base sm:text-lg">
                    AM DIGITAL ADR
                  </span>
                  <span className="text-[10px] font-black uppercase tracking-widest bg-amber-400 text-[#43121B] px-1.5 py-0.5 rounded-md shadow-2xs">
                    V2.0
                  </span>
                </div>
                <div className="text-[11px] text-rose-200 hidden sm:block">
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

              {/* Account Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowRoleDropdown(!showRoleDropdown)}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-xs text-white transition-colors cursor-pointer"
                >
                  <div className="w-6 h-6 rounded-lg bg-amber-400 text-stone-950 flex items-center justify-center font-bold text-xs">
                    {user?.name.charAt(0) || 'U'}
                  </div>
                  <div className="text-left hidden sm:block">
                    <span className="font-bold text-[11px] text-rose-200 block leading-tight">
                      {user?.role === 'ADMIN' ? 'Admin' : 'Operator'}
                    </span>
                    <span className="font-semibold text-xs leading-none">
                      {user?.name.split(' ')[0]}
                    </span>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-white/70 ml-0.5" />
                </button>

                {showRoleDropdown && (
                  <div
                    className="absolute right-0 mt-2 w-60 bg-white rounded-2xl shadow-2xl border border-stone-200 py-2 text-stone-800 z-50 text-xs animate-fadeIn"
                    onClick={() => setShowRoleDropdown(false)}
                  >
                    <div className="border-t border-stone-100 mt-1 pt-1">
                      <button
                        onClick={logout}
                        className="w-full text-left px-3.5 py-2 text-rose-700 hover:bg-rose-50 flex items-center gap-2 font-semibold cursor-pointer"
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
