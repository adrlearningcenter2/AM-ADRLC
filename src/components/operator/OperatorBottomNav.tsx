import React from 'react';
import {
  Building2,
  AlertTriangle,
  FileQuestion,
  History,
  User,
  CheckCircle2
} from 'lucide-react';

export type OperatorTab = 'rooms' | 'findings' | 'request' | 'history' | 'profile';

interface OperatorBottomNavProps {
  activeTab: OperatorTab;
  onTabChange: (tab: OperatorTab) => void;
  openFindingsCount?: number;
}

export const OperatorBottomNav: React.FC<OperatorBottomNavProps> = ({
  activeTab,
  onTabChange,
  openFindingsCount = 0,
}) => {
  const tabs: {
    id: OperatorTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
  }[] = [
    { id: 'rooms', label: 'Ruangan', icon: Building2 },
    {
      id: 'findings',
      label: 'Temuan',
      icon: AlertTriangle,
      badge: openFindingsCount > 0 ? openFindingsCount : undefined,
    },
    { id: 'request', label: 'Pengajuan', icon: FileQuestion },
    { id: 'history', label: 'Riwayat', icon: History },
    { id: 'profile', label: 'Profil', icon: User },
  ];

  return (
    <nav
      aria-label="Navigasi Bawah Operator"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-stone-200 shadow-2xl pb-[env(safe-area-inset-bottom,0px)]"
    >
      <div className="grid grid-cols-5 h-16 max-w-lg mx-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center justify-center relative transition-colors ${
                isActive ? 'text-[#651D2A]' : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
                {tab.badge !== undefined && (
                  <span className="absolute -top-1 -right-2 w-4 h-4 bg-rose-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center ring-2 ring-white">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span
                className={`text-[10px] mt-1 ${
                  isActive ? 'font-bold text-[#651D2A]' : 'font-medium'
                }`}
              >
                {tab.label}
              </span>
              {isActive && (
                <span className="absolute top-0 left-4 right-4 h-0.5 bg-[#651D2A] rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
