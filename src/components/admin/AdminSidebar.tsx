import React from 'react';
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
  DatabaseBackup
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
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  currentView,
  onSelectView,
  openFindingsCount = 0,
  pendingRequestsCount = 0,
}) => {
  const currentWeek = getCurrentWeekKey();

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

  return (
    <aside className="w-64 bg-stone-900 text-stone-200 flex flex-col shrink-0 min-h-[calc(100vh-4rem)] border-r border-stone-800">
      {/* Scope info */}
      <div className="p-4 border-b border-stone-800">
        <div className="flex items-center gap-2 text-xs text-rose-400 font-semibold tracking-wider uppercase">
          <Building className="w-3.5 h-3.5" />
          <span>Fasilitas &amp; Diklat</span>
        </div>
        <div className="text-sm font-bold text-white mt-1">ADR Learning Center</div>
        <div className="text-xs text-stone-400 mt-0.5">Ruang Teori, Workshop &amp; Lab</div>
      </div>

      {/* Navigation links */}
      <nav className="p-3 space-y-1 flex-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectView(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                isActive
                  ? 'bg-[#651D2A] text-white font-semibold shadow-sm'
                  : 'text-stone-300 hover:text-white hover:bg-stone-800/80'
              }`}
            >
              <div className="flex items-center gap-3 truncate">
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    isActive ? 'text-white' : 'text-stone-400 group-hover:text-stone-200'
                  }`}
                />
                <span className="truncate">{item.label}</span>
              </div>
              {item.badge !== undefined && (
                <span
                  className={`ml-2 px-1.5 py-0.5 text-[10px] font-bold rounded-full ${
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

      {/* Backup Spreadsheet (Preserved from initial Code.gs backupNow) */}
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
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 transition-colors touch-press cursor-pointer"
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
    </aside>
  );
};
