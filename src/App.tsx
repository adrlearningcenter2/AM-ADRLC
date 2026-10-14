/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Header } from './components/common/Header';
import { SimulationBanner } from './components/common/SimulationBanner';
import { EvidenceModal } from './components/common/EvidenceModal';
import { BackendConfigModal } from './components/common/BackendConfigModal';
import { LoginView } from './components/auth/LoginView';

// Admin Components
import { AdminSidebar, AdminViewType } from './components/admin/AdminSidebar';
import { ExecutiveDashboard } from './components/admin/ExecutiveDashboard';
import { InspectionMonitoring } from './components/admin/InspectionMonitoring';
import { AbnormalitiesManager } from './components/admin/AbnormalitiesManager';
import { ManagementReport } from './components/admin/ManagementReport';
import { ApprovalsView } from './components/admin/ApprovalsView';
import { UsersAndAssignments } from './components/admin/UsersAndAssignments';
import { AuditTrailView } from './components/admin/AuditTrailView';

// Operator Components
import { OperatorBottomNav, OperatorTab } from './components/operator/OperatorBottomNav';
import { OperatorRoomsView } from './components/operator/OperatorRoomsView';
import { OperatorFollowupsView } from './components/operator/OperatorFollowupsView';
import { OperatorRequestModal } from './components/operator/OperatorRequestModal';
import { OperatorHistoryView } from './components/operator/OperatorHistoryView';
import { OperatorProfileView } from './components/operator/OperatorProfileView';

// Services & Types
import { ApiService } from './services/apiService';
import { LiveRoomsView } from './components/operator/LiveRoomsView';
import { ExecutiveKPI, RoomSummary, Finding } from './types/adr';

function AppContent() {
  const { user, token, isAuthenticated, isAdmin, isOperator } = useAuth();

  // Admin View State
  const [adminView, setAdminView] = useState<AdminViewType>('dashboard');
  const [monitoringInitialRoom, setMonitoringInitialRoom] = useState<string | undefined>(undefined);

  // Operator Tab State
  const [operatorTab, setOperatorTab] = useState<OperatorTab>('rooms');
  const [showRequestModal, setShowRequestModal] = useState(false);

  // Common Modals State
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [evidenceModal, setEvidenceModal] = useState<{
    isOpen: boolean;
    imageUrl: string;
    title: string;
    desc: string;
    meta?: {
      room?: string;
      unitId?: string;
      operatorNip?: string;
      date?: string;
      status?: string;
      priority?: string;
    };
  }>({
    isOpen: false,
    imageUrl: '',
    title: '',
    desc: '',
  });

  const [showBackendConfig, setShowBackendConfig] = useState(false);

  // Overview Data Cache
  const [kpi, setKpi] = useState<ExecutiveKPI | null>(null);
  const [roomsSummary, setRoomsSummary] = useState<RoomSummary[]>([]);
  const [recentFindings, setRecentFindings] = useState<Finding[]>([]);
  const [liveError, setLiveError] = useState('');
  const [lastSync, setLastSync] = useState('');

  const loadDashboardData = async () => {
    try {
      if (!token) return;
      const overview = await ApiService.getOverview(token);
      setKpi(overview.kpi);
      setRoomsSummary(overview.rooms);
      const allFindings = await ApiService.getFindings(token);
      setRecentFindings(allFindings.filter((f) => f.status === 'OPEN' || f.status === 'COORDINATED'));
      setLiveError(''); setLastSync(new Date().toLocaleTimeString('id-ID'));
    } catch (e) {
      console.error('Gagal memuat data overview:', e);
      setLiveError(e instanceof Error ? e.message : 'Gagal memuat data asli');
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadDashboardData();
    }
    if (!isAuthenticated || !token) return;
    const id = setInterval(() => { if (document.visibilityState === 'visible') loadDashboardData(); }, 30000);
    return () => clearInterval(id);
  }, [isAuthenticated, token, user?.role]);

  const handleOpenPhoto = (
    imageUrl: string,
    title: string,
    desc: string,
    meta?: {
      room?: string;
      unitId?: string;
      operatorNip?: string;
      date?: string;
      status?: string;
      priority?: string;
    }
  ) => {
    setEvidenceModal({
      isOpen: true,
      imageUrl,
      title,
      desc,
      meta,
    });
  };

  const handleAdminNavigate = (view: AdminViewType, filterRoom?: string) => {
    setAdminView(view);
    setMobileNavOpen(false);
    if (filterRoom) {
      setMonitoringInitialRoom(filterRoom);
    }
  };

  if (!isAuthenticated) {
    return <LoginView />;
  }

  const openFindingsCount = recentFindings.length;
  const pendingRequestsCount = kpi?.pendingRequests ?? 0;

  return (
    <div className="min-h-screen bg-[#F8F6F7] text-stone-900 flex flex-col font-sans max-w-full overflow-x-hidden">
      {/* Brand Header with Instant Role Switcher & Mobile Drawer Trigger */}
      <Header
        onRefreshData={loadDashboardData}
        onToggleMobileNav={() => setMobileNavOpen((prev) => !prev)}
        isMobileNavOpen={mobileNavOpen}
      />

      {/* Simulation Banner (Safe mode reminder) */}
      <SimulationBanner onOpenConfig={() => setShowBackendConfig(true)} />

      {/* Main Persona Workspaces */}
      {isAdmin ? (
        // ADMIN RESPONSIVE LAYOUT (Drawer on <1024px, Sidebar on >=1024px)
        <div className="flex-1 flex flex-col lg:flex-row min-w-0 max-w-full">
          {/* Desktop Sidebar (Only >=1024px) */}
          <div className="no-print hidden lg:block shrink-0">
            <AdminSidebar
              currentView={adminView}
              onSelectView={(v) => {
                setAdminView(v);
                setMonitoringInitialRoom(undefined);
              }}
              openFindingsCount={openFindingsCount}
              pendingRequestsCount={pendingRequestsCount}
              isMobileDrawer={false}
            />
          </div>

          {/* Mobile Drawer (Only <1024px) */}
          <AdminSidebar
            currentView={adminView}
            onSelectView={(v) => {
              setAdminView(v);
              setMonitoringInitialRoom(undefined);
              setMobileNavOpen(false);
            }}
            openFindingsCount={openFindingsCount}
            pendingRequestsCount={pendingRequestsCount}
            isMobileDrawer={true}
            isOpen={mobileNavOpen}
            onClose={() => setMobileNavOpen(false)}
          />

          <main className="flex-1 p-3.5 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full min-w-0">
            {liveError && <div role="alert" className="mb-4 p-4 bg-rose-50 border border-rose-300 text-rose-800 rounded-xl text-xs font-medium">Koneksi LIVE gagal: {liveError}. Data simulasi tidak ditampilkan.</div>}
            <div className="text-[11px] sm:text-xs text-stone-500 mb-3 flex items-center justify-between gap-2 flex-wrap">
              <span>Sumber: Google Sheets via API</span>
              <span>Sinkronisasi: {lastSync || 'Belum berhasil'}</span>
            </div>
            {adminView === 'dashboard' && kpi && (
              <ExecutiveDashboard
                kpi={kpi}
                rooms={roomsSummary}
                recentFindings={recentFindings}
                onNavigate={handleAdminNavigate}
                onViewPhoto={handleOpenPhoto}
              />
            )}

            {adminView === 'monitoring' && (
              <LiveRoomsView />
            )}

            {adminView === 'findings' && (
              <AbnormalitiesManager
                onViewPhoto={handleOpenPhoto}
                onRefresh={loadDashboardData}
              />
            )}

            {adminView === 'reports' && <ManagementReport />}

            {adminView === 'approvals' && (
              <ApprovalsView onRefresh={loadDashboardData} />
            )}

            {adminView === 'users' && (
              <UsersAndAssignments onRefresh={loadDashboardData} />
            )}

            {adminView === 'audit' && <AuditTrailView />}
          </main>
        </div>
      ) : (
        // OPERATOR MOBILE-FIRST LAYOUT
        <div className="flex-1 flex flex-col">
          {/* Desktop Subnav for Operator */}
          <div className="hidden md:block bg-white border-b border-stone-200 shadow-2xs">
            <div className="max-w-5xl mx-auto px-4 flex gap-8 text-xs font-bold">
              <button
                onClick={() => setOperatorTab('rooms')}
                className={`py-4 border-b-2 transition-all cursor-pointer ${
                  operatorTab === 'rooms'
                    ? 'border-[#651D2A] text-[#651D2A]'
                    : 'border-transparent text-stone-500 hover:text-stone-900'
                }`}
              >
                Ruangan &amp; Checklist
              </button>
              <button
                onClick={() => setOperatorTab('findings')}
                className={`py-4 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                  operatorTab === 'findings'
                    ? 'border-[#651D2A] text-[#651D2A]'
                    : 'border-transparent text-stone-500 hover:text-stone-900'
                }`}
              >
                <span>Temuan Abnormal</span>
                {openFindingsCount > 0 && (
                  <span className="bg-rose-100 text-rose-800 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                    {openFindingsCount}
                  </span>
                )}
              </button>
              <button
                onClick={() => setShowRequestModal(true)}
                className="py-4 border-b-2 border-transparent text-stone-500 hover:text-[#651D2A] cursor-pointer"
              >
                + Ajukan Permintaan
              </button>
              <button
                onClick={() => setOperatorTab('history')}
                className={`py-4 border-b-2 transition-all cursor-pointer ${
                  operatorTab === 'history'
                    ? 'border-[#651D2A] text-[#651D2A]'
                    : 'border-transparent text-stone-500 hover:text-stone-900'
                }`}
              >
                Riwayat Pemeriksaan
              </button>
              <button
                onClick={() => setOperatorTab('profile')}
                className={`py-4 border-b-2 transition-all cursor-pointer ${
                  operatorTab === 'profile'
                    ? 'border-[#651D2A] text-[#651D2A]'
                    : 'border-transparent text-stone-500 hover:text-stone-900'
                }`}
              >
                Profil Akun
              </button>
            </div>
          </div>

          <main className="flex-1 p-4 sm:p-6 max-w-4xl mx-auto w-full">
            {operatorTab === 'rooms' && <LiveRoomsView />}

            {operatorTab === 'findings' && (
              <OperatorFollowupsView
                onViewPhoto={handleOpenPhoto}
                onRefresh={loadDashboardData}
              />
            )}

            {operatorTab === 'history' && <OperatorHistoryView />}

            {operatorTab === 'profile' && <OperatorProfileView />}
          </main>

          {/* Mobile Bottom Navigation */}
          <OperatorBottomNav
            activeTab={operatorTab}
            onTabChange={(tab) => {
              if (tab === 'request') {
                setShowRequestModal(true);
              } else {
                setOperatorTab(tab);
              }
            }}
            openFindingsCount={openFindingsCount}
          />
        </div>
      )}

      {/* Shared Evidence Lightbox Modal */}
      <EvidenceModal
        isOpen={evidenceModal.isOpen}
        onClose={() => setEvidenceModal((prev) => ({ ...prev, isOpen: false }))}
        imageUrl={evidenceModal.imageUrl}
        title={evidenceModal.title}
        description={evidenceModal.desc}
        meta={evidenceModal.meta}
      />

      {/* Shared Backend Config & Schema Audit Modal */}
      <BackendConfigModal
        isOpen={showBackendConfig}
        onClose={() => setShowBackendConfig(false)}
        onResetData={loadDashboardData}
      />

      {/* Operator Request Submission Modal */}
      <OperatorRequestModal
        isOpen={showRequestModal}
        onClose={() => setShowRequestModal(false)}
        onSuccess={loadDashboardData}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
