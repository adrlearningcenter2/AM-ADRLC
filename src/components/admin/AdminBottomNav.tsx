import React from 'react';
import {
  LayoutDashboard,
  ClipboardCheck,
  AlertTriangle,
  CheckSquare,
  Menu
} from 'lucide-react';
import { AdminViewType } from './AdminSidebar';

interface AdminBottomNavProps {
  currentView: AdminViewType;
  onSelectView: (view: AdminViewType) => void;
  onOpenDrawer: () => void;
  openFindingsCount?: number;
  pendingRequestsCount?: number;
}

export const AdminBottomNav: React.FC<AdminBottomNavProps> = ({
  currentView,
  onSelectView,
  onOpenDrawer,
  openFindingsCount = 0,
  pendingRequestsCount = 0,
}) => {
  const isDrawerSubView =
    currentView === 'reports' || currentView === 'users' || currentView === 'audit';

  return (
    <nav
      aria-label="Navigasi Bawah Admin"
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-stone-200 shadow-2xl pb-[env(safe-area-inset-bottom,0px)]"
    >
      <div className="grid grid-cols-5 h-16 max-w-lg mx-auto">
        {/* 1. Dashboard */}
        <button
          type="button"
          onClick={() => onSelectView('dashboard')}
          className={`flex flex-col items-center justify-center relative transition-colors touch-press cursor-pointer ${
            currentView === 'dashboard'
              ? 'text-[#651D2A]'
              : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          <LayoutDashboard
            className={`w-5 h-5 ${
              currentView === 'dashboard' ? 'stroke-[2.5]' : 'stroke-2'
            }`}
          />
          <span
            className={`text-[10px] mt-1 truncate max-w-[64px] ${
              currentView === 'dashboard' ? 'font-bold text-[#651D2A]' : 'font-medium'
            }`}
          >
            Dashboard
          </span>
          {currentView === 'dashboard' && (
            <span className="absolute top-0 left-3 right-3 h-0.5 bg-[#651D2A] rounded-full" />
          )}
        </button>

        {/* 2. Monitoring Ruangan */}
        <button
          type="button"
          onClick={() => onSelectView('monitoring')}
          className={`flex flex-col items-center justify-center relative transition-colors touch-press cursor-pointer ${
            currentView === 'monitoring'
              ? 'text-[#651D2A]'
              : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          <ClipboardCheck
            className={`w-5 h-5 ${
              currentView === 'monitoring' ? 'stroke-[2.5]' : 'stroke-2'
            }`}
          />
          <span
            className={`text-[10px] mt-1 truncate max-w-[64px] ${
              currentView === 'monitoring' ? 'font-bold text-[#651D2A]' : 'font-medium'
            }`}
          >
            Monitoring
          </span>
          {currentView === 'monitoring' && (
            <span className="absolute top-0 left-3 right-3 h-0.5 bg-[#651D2A] rounded-full" />
          )}
        </button>

        {/* 3. Abnormalitas */}
        <button
          type="button"
          onClick={() => onSelectView('findings')}
          className={`flex flex-col items-center justify-center relative transition-colors touch-press cursor-pointer ${
            currentView === 'findings'
              ? 'text-[#651D2A]'
              : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          <div className="relative">
            <AlertTriangle
              className={`w-5 h-5 ${
                currentView === 'findings' ? 'stroke-[2.5]' : 'stroke-2'
              }`}
            />
            {openFindingsCount > 0 && (
              <span className="absolute -top-1 -right-2.5 min-w-4 h-4 px-1 bg-rose-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center ring-2 ring-white">
                {openFindingsCount}
              </span>
            )}
          </div>
          <span
            className={`text-[10px] mt-1 truncate max-w-[64px] ${
              currentView === 'findings' ? 'font-bold text-[#651D2A]' : 'font-medium'
            }`}
          >
            Temuan
          </span>
          {currentView === 'findings' && (
            <span className="absolute top-0 left-3 right-3 h-0.5 bg-[#651D2A] rounded-full" />
          )}
        </button>

        {/* 4. Approval Pengajuan */}
        <button
          type="button"
          onClick={() => onSelectView('approvals')}
          className={`flex flex-col items-center justify-center relative transition-colors touch-press cursor-pointer ${
            currentView === 'approvals'
              ? 'text-[#651D2A]'
              : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          <div className="relative">
            <CheckSquare
              className={`w-5 h-5 ${
                currentView === 'approvals' ? 'stroke-[2.5]' : 'stroke-2'
              }`}
            />
            {pendingRequestsCount > 0 && (
              <span className="absolute -top-1 -right-2.5 min-w-4 h-4 px-1 bg-amber-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center ring-2 ring-white">
                {pendingRequestsCount}
              </span>
            )}
          </div>
          <span
            className={`text-[10px] mt-1 truncate max-w-[64px] ${
              currentView === 'approvals' ? 'font-bold text-[#651D2A]' : 'font-medium'
            }`}
          >
            Approval
          </span>
          {currentView === 'approvals' && (
            <span className="absolute top-0 left-3 right-3 h-0.5 bg-[#651D2A] rounded-full" />
          )}
        </button>

        {/* 5. Menu Lainnya (Drawer: Laporan, Users, Audit) */}
        <button
          type="button"
          onClick={onOpenDrawer}
          className={`flex flex-col items-center justify-center relative transition-colors touch-press cursor-pointer ${
            isDrawerSubView
              ? 'text-[#651D2A]'
              : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          <Menu
            className={`w-5 h-5 ${isDrawerSubView ? 'stroke-[2.5]' : 'stroke-2'}`}
          />
          <span
            className={`text-[10px] mt-1 truncate max-w-[64px] ${
              isDrawerSubView ? 'font-bold text-[#651D2A]' : 'font-medium'
            }`}
          >
            Menu Lain
          </span>
          {isDrawerSubView && (
            <span className="absolute top-0 left-3 right-3 h-0.5 bg-[#651D2A] rounded-full" />
          )}
        </button>
      </div>
    </nav>
  );
};
