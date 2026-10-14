import React, { useEffect } from 'react';
import {
  LayoutDashboard,
  ClipboardCheck,
  AlertTriangle,
  FileBarChart2,
  CheckSquare,
  Users2,
  History,
  Building,
  Calendar,
  Sparkles,
  DatabaseBackup,
  X
} from 'lucide-react';
import { getCurrentWeekKey, formatWeekLabel } from '../../utils/dateUtils';
import { ApiService } from '../../services/apiService';

export type AdminViewType =
  | 'dashboard'
  | 'monitoring'
  | 'findings'
  | 'reports'
  | 'approvals'
  | 'users'
  | 'audit';

interface AdminSidebarProps {
  currentView: AdminViewType;
  onSelectView: (view: AdminViewType) => void;
  openFindingsCount?: number;
  pendingRequestsCount?: number;
  isMobileDrawer?: boolean;
  isOpen?: boolean;
  onClose?: () => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  currentView,
  onSelectView,
  openFindingsCount = 0,
  pendingRequestsCount = 0,
  isMobileDrawer = false,
  isOpen = false,
  onClose,
}) => {
  const currentWeek = getCurrentWeekKey();

  // Close on Escape key for mobile drawer
  useEffect(() => {
    if (!isMobileDrawer || !isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isMobileDrawer, isOpen, onClose]);

  const navItems: {
    id: AdminViewType;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
    badgeColor?: string;
  }[] = [
    {
      id: 'dashboard',
      label: 'Executive Dashboard',
      icon: LayoutDashboard,
    },
    {
      id: 'monitoring',
      label: 'Monitoring Pemeriksaan',
      icon: ClipboardCheck,
    },
    {
      id: 'findings',
      label: 'Manajemen Abnormalitas',
      icon: AlertTriangle,
      badge: openFindingsCount > 0 ? openFindingsCount : undefined,
      badgeColor: 'bg-rose-700 text-white',
    },
    {
      id: 'reports',
      label: 'Management Reporting',
      icon: FileBarChart2,
    },
    {
      id: 'approvals',
      label: 'Approval Pengajuan',
      icon: CheckSquare,
      badge: pendingRequestsCount > 0 ? pendingRequestsCount : undefined,
      badgeColor: 'bg-amber-600 text-white',
    },
    {
      id: 'users',
      label: 'Akun & Penugasan',
      icon: Users2,
    },
    {
      id: 'audit',
      label: 'Audit Trail Aktivitas',
      icon: History,
    },
  ];

  const handleItemClick = (id: AdminViewType) => {
    onSelectView(id);
    if (isMobileDrawer && onClose) {
      onClose();
    }
  };

  const navContent = (
    <div className="flex flex-col h-full">
      {/* Scope info & Close Button */}
      <div className="p-4 border-b border-stone-800 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs text-rose-400 font-semibold tracking-wider uppercase">
            <Building className="w-3.5 h-3.5" />
            <span>Fasilitas &amp; Diklat</span>
          </div>
          <div className="text-sm font-bold text-white mt-1">ADR Learning Center</div>
          <div className="text-xs text-stone-400 mt-0.5">Ruang Teori, Workshop &amp; Lab</div>
        </div>

        {isMobileDrawer && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup navigasi"
            className="w-11 h-11 rounded-xl bg-stone-800 text-stone-400 hover:text-white flex items-center justify-center touch-press cursor-pointer ml-2 shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation links */}
      <nav className="p-3 space-y-1.5 flex-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleItemClick(item.id)}
              className={`w-full min-h-[44px] flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer touch-press ${
                isActive
                  ? 'bg-[#651D2A] text-white font-semibold shadow-sm'
                  : 'text-stone-300 hover:text-white hover:bg-stone-800/80 active:bg-stone-800'
              }`}
            >
              <div className="flex items-center gap-3 truncate">
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    isActive ? 'text-white' : 'text-stone-400'
                  }`}
                />
                <span className="truncate">{item.label}</span>
              </div>
              {item.badge !== undefined && (
                <span
                  className={`ml-2 px-2 py-0.5 text-[10px] font-bold rounded-full shrink-0 ${
                    item.badgeColor || 'bg-stone-700 text-stone-200'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Backup Spreadsheet */}
      <div className="p-3 border-t border-stone-800">
        <button
          onClick={async () => {
            if (window.confirm('Buat salinan backup Google Sheets ke Google Drive sekarang?')) {
              try {
                const res = await ApiService.backupNow('', '26010007');
                alert(`Backup berhasil dibuat!\nNama: ${res.name}\nID: ${res.id}`);
              } catch (e) {
                alert('Gagal membuat backup: ' + (e instanceof Error ? e.message : String(e)));
              }
            }
          }}
          className="w-full min-h-[44px] flex items-center justify-center gap-2 px-3 py-2.5 text-xs font-semibold rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 transition-colors touch-press cursor-pointer"
        >
          <DatabaseBackup className="w-3.5 h-3.5 text-rose-400" />
          <span>Backup Spreadsheet</span>
        </button>
      </div>

      {/* Bottom week info */}
      <div className="p-4 border-t border-stone-800/80 text-xs text-stone-400 bg-stone-950/40">
        <div className="flex items-center gap-1.5 text-stone-300 font-medium mb-1">
          <Calendar className="w-3.5 h-3.5 text-rose-400" />
          <span>Minggu Aktif ({currentWeek})</span>
        </div>
        <div className="text-[11px] text-stone-400 leading-relaxed">
          {formatWeekLabel(currentWeek)}
        </div>
      </div>
    </div>
  );

  // If Mobile Drawer Mode
  if (isMobileDrawer) {
    if (!isOpen) return null;
    return (
      <div className="fixed inset-0 z-50 lg:hidden">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-stone-950/75 backdrop-blur-xs transition-opacity animate-fadeIn"
          onClick={onClose}
          aria-hidden="true"
        />

        {/* Offcanvas Drawer */}
        <aside
          role="dialog"
          aria-modal="true"
          aria-label="Navigasi Menu Admin"
          className="fixed inset-y-0 left-0 w-72 max-w-[85vw] bg-stone-900 text-stone-200 flex flex-col shadow-2xl border-r border-stone-800 z-50 animate-slideInLeft"
        >
          {navContent}
        </aside>
      </div>
    );
  }

  // Desktop Sidebar Mode: Strictly hidden below 1024px (hidden lg:flex)
  return (
    <aside className="hidden lg:flex w-64 bg-stone-900 text-stone-200 flex-col shrink-0 min-h-[calc(100vh-4rem)] border-r border-stone-800">
      {navContent}
    </aside>
  );
};
