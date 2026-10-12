/**
 * Unified API Service layer for AM Digital ADR V2.
 * Decouples Mock Data provider and live Google Apps Script (GAS) Web App integration.
 */

import {
  User,
  AssetUnit,
  ChecklistPoint,
  InspectionRecord,
  Finding,
  Followup,
  OperatorRequest,
  RoomAssignment,
  AuditLog,
  InspectionSubmissionPayload,
  RoomSummary,
  ExecutiveKPI
} from '../types/adr';
import { MockDatabase } from './mockData';
import { getCurrentWeekKey } from '../utils/dateUtils';

export type ApiMode = 'MOCK' | 'GAS_LIVE';

interface ApiConfig {
  mode: ApiMode;
  gasEndpointUrl: string; // e.g. https://script.google.com/macros/s/.../exec
  testMode?: boolean;     // When true, dry-run mode prevents modifying production sheets
}

const CONFIG_STORAGE_KEY = 'am_digital_adr_api_config';

const DEFAULT_CONFIG: ApiConfig = {
  mode: 'GAS_LIVE',
  gasEndpointUrl: '',
  testMode: true,
};

function loadInitialConfig(): ApiConfig {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(CONFIG_STORAGE_KEY) : null;
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        mode: parsed.mode || DEFAULT_CONFIG.mode,
        gasEndpointUrl: parsed.gasEndpointUrl || DEFAULT_CONFIG.gasEndpointUrl,
        testMode: parsed.testMode !== undefined ? Boolean(parsed.testMode) : DEFAULT_CONFIG.testMode,
      };
    }
  } catch {
    // ignore
  }
  return { ...DEFAULT_CONFIG };
}

export class ApiService {
  private static config: ApiConfig = loadInitialConfig();

  static getConfig(): ApiConfig {
    return { ...this.config };
  }

  static setConfig(newConfig: Partial<ApiConfig>): void {
    this.config = { ...this.config, ...newConfig };
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(this.config));
      }
    } catch {
      // ignore
    }
  }

  static isMockMode(): boolean {
    return this.config.mode === 'MOCK';
  }

  static isTestMode(): boolean {
    return Boolean(this.config.testMode);
  }

  static getCurrentToken(): string {
    try {
      const stored = localStorage.getItem('am_digital_adr_auth_session');
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed.token || '';
      }
    } catch {
      // ignore
    }
    return '';
  }

  static async pingBackend(overrideUrl?: string): Promise<{
    success: boolean;
    latencyMs: number;
    message: string;
    details?: any;
    error?: string;
    safeMode?: boolean;
    diagnostic?: string;
  }> {
    const targetUrl = overrideUrl || this.config.gasEndpointUrl;
    const start = Date.now();

    // 1. Primary: Secure Server-Side Proxy /api/rpc
    try {
      const res = await fetch('/api/rpc', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          
        },
        body: JSON.stringify({ action: 'ping', targetUrl: targetUrl || undefined }),
      });
      const latencyMs = Date.now() - start;
      const json = await res.json();

      if (res.ok && json.success) {
        return {
          success: true,
          latencyMs,
          message: 'Koneksi ke backend (Proxy -> Google Apps Script) berhasil.',
          details: json.data,
          safeMode: json.safeMode ?? true,
        };
      } else {
        // Return clear diagnostic from proxy
        return {
          success: false,
          latencyMs,
          message: json.error || 'Proxy mengembalikan respon non-OK.',
          error: json.error,
          diagnostic: json.diagnostic,
          details: json,
        };
      }
    } catch (proxyErr: any) {
      const latencyMs = Date.now() - start;
      if (!targetUrl) {
        return {
          success: false,
          latencyMs,
          message: 'URL Google Apps Script belum dikonfigurasi.',
          error: 'URL kosong',
        };
      }

      return {
        success: false,
        latencyMs,
        message: `Koneksi ke server proxy gagal: ${proxyErr.message}`,
        error: proxyErr.message,
      };
    }
  }

  /**
   * Authenticated Database Connectivity Check (ADMIN ONLY, READ-ONLY)
   * Verifies SpreadsheetApp.openById() and existence of all 9 sheets.
   */
  static async checkDatabaseConnectivity(token: string): Promise<{
    success: boolean;
    data?: any;
    error?: string;
  }> {
    try {
      const res = await fetch('/api/rpc', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          
        },
        body: JSON.stringify({ action: 'checkDatabase', token, targetUrl: this.config.gasEndpointUrl || undefined }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        return { success: true, data: json.data };
      } else {
        return { success: false, error: json.error || 'Pemeriksaan database gagal.' };
      }
    } catch (err: any) {
      return { success: false, error: err.message || 'Gagal menghubungi server proxy.' };
    }
  }

  // --- Auth Methods ---

  static async login(nip: string, password: string): Promise<{ token: string; user: User }> {
    if (this.config.mode === 'GAS_LIVE') {
      return this.callGas('login', { nip, password });
    }

    // Mock Login Logic
    const users = MockDatabase.getUsers();
    const cleanNip = String(nip || '').trim();

    // Default test accounts check
    const user = users.find((u) => u.nip === cleanNip && u.active);
    if (!user) {
      throw new Error(`Akun dengan NIP "${cleanNip}" tidak ditemukan atau tidak aktif.`);
    }

    // Allow mock demo passwords or exact NIP for quick evaluation
    if (password && password.length < 4) {
      throw new Error('Password minimal 4 karakter (atau 12 karakter pada backend produksi).');
    }

    const token = `mock-token-${user.nip}-${Date.now()}`;
    return { token, user };
  }

  static async logout(_token: string): Promise<boolean> {
    if (!this.isMockMode() && _token) {
      try {
        await this.callGas('logout', {}, _token);
      } catch (err) {
        // Silently swallow network / backend unreachable errors during logout
        // so user's client session is always safely cleared without crashing or uncaught errors
        console.warn('Backend logout notification skipped or failed:', err);
      }
      return true;
    }
    return true;
  }

  // --- Overview & Dashboard KPI ---

  static async getOverview(_token: string): Promise<{
    userRole: string;
    kpi: ExecutiveKPI;
    rooms: RoomSummary[];
    weekKey: string;
  }> {
    if (!this.isMockMode()) { return this.callGas('getOverview', {}, _token).then((r: any) => ({ userRole: r.userRole || '', kpi: r.kpi, rooms: r.rooms || [], weekKey: r.weekKey || r.week_key || '' })); }
    const weekKey = getCurrentWeekKey();
    const assets = MockDatabase.getAssets().filter((a) => a.active);
    const inspections = MockDatabase.getInspections().filter((i) => i.week_key === weekKey);
    const findings = MockDatabase.getFindings();
    const requests = MockDatabase.getRequests();

    const distinctRooms = Array.from(new Set(assets.map((a) => a.room))).sort();

    // Calculate completed units per room
    const inspectedUnitIds = new Set(inspections.map((i) => i.unit_id));

    const roomsSummary: RoomSummary[] = distinctRooms.map((roomName) => {
      const roomAssets = assets.filter((a) => a.room === roomName);
      const inspectedAssetsInRoom = roomAssets.filter((a) => inspectedUnitIds.has(a.id)).length;
      const openFindingsInRoom = findings.filter(
        (f) => f.room === roomName && (f.status === 'OPEN' || f.status === 'COORDINATED')
      ).length;

      return {
        name: roomName,
        totalAssets: roomAssets.length,
        activeAssets: roomAssets.length,
        inspectedThisWeek: inspectedAssetsInRoom,
        openFindingsCount: openFindingsInRoom,
        isCompleteThisWeek: inspectedAssetsInRoom >= roomAssets.length && roomAssets.length > 0,
      };
    });

    const completedRoomsCount = roomsSummary.filter((r) => r.isCompleteThisWeek).length;
    const totalAssetsCount = assets.length;
    const inspectedTotalCount = inspectedUnitIds.size;
    const progressPercent = totalAssetsCount > 0 ? Math.round((inspectedTotalCount / totalAssetsCount) * 100) : 0;

    const openCount = findings.filter((f) => f.status === 'OPEN').length;
    const coordCount = findings.filter((f) => f.status === 'COORDINATED').length;
    const closedCount = findings.filter((f) => f.status === 'CLOSED').length;

    // Normal vs Total compliance
    const abnormalChecksCount = inspections.filter((i) => i.answer === 'ABNORMAL').length;
    const totalChecksCount = inspections.length;
    const complianceRate =
      totalChecksCount > 0 ? Math.round(((totalChecksCount - abnormalChecksCount) / totalChecksCount) * 100) : 100;

    const kpi: ExecutiveKPI = {
      totalAssets: totalAssetsCount,
      activeAssets: totalAssetsCount,
      totalRooms: distinctRooms.length,
      completedRoomsThisWeek: completedRoomsCount,
      inspectionProgressPercent: progressPercent,
      totalInspectionsThisWeek: inspectedTotalCount,
      openFindings: openCount,
      coordinatedFindings: coordCount,
      closedFindings: closedCount,
      complianceRate,
      pendingRequests: requests.filter((r) => r.status === 'PENDING').length,
    };

    return {
      userRole: 'ADMIN',
      kpi,
      rooms: roomsSummary,
      weekKey,
    };
  }

  static async getRooms(token: string): Promise<any[]> {
    const result = await this.callGas('getRooms', {}, token);
    return result.rooms || [];
  }

  // --- Room & Units Inspection ---

  static async getRoomData(
    _token: string,
    room: string
  ): Promise<{
    room: string;
    week: string;
    assets: (AssetUnit & { checks: ChecklistPoint[]; isInspectedThisWeek: boolean })[];
    inspectedCount: number;
    totalCount: number;
  }> {
    if (!this.isMockMode()) { return this.callGas('getRoomDetails', {room}, _token).then((r: any) => ({room:r.room,week:r.weekKey,assets:(r.units||[]).map((x:any)=>({...x.unit,checks:x.checklists||[],isInspectedThisWeek:!!x.inspectedThisWeek})),inspectedCount:r.completedCount||0,totalCount:r.totalCount||0})); }
    const week = getCurrentWeekKey();
    const allAssets = MockDatabase.getAssets().filter((a) => a.room === room && a.active);
    const allChecks = MockDatabase.getChecklists().filter((c) => c.active);
    const currentInspections = MockDatabase.getInspections().filter(
      (i) => i.week_key === week && i.room === room
    );

    const inspectedUnitIds = new Set(currentInspections.map((i) => i.unit_id));

    const assetsWithChecks = allAssets.map((asset) => {
      const checks = allChecks
        .filter((c) => c.unit_id === asset.id)
        .sort((a, b) => a.order - b.order);

      return {
        ...asset,
        checks,
        isInspectedThisWeek: inspectedUnitIds.has(asset.id),
      };
    });

    return {
      room,
      week,
      assets: assetsWithChecks,
      inspectedCount: inspectedUnitIds.size,
      totalCount: allAssets.length,
    };
  }

  // --- Save Inspection (Strict validation & lock) ---

  static async saveInspection(
    _token: string,
    operatorNip: string,
    payload: InspectionSubmissionPayload
  ): Promise<{ inspectionId: string; findingsCount: number }> {
    if (!this.isMockMode()) { return this.callGas('saveInspection', {payload}, _token); }
    const currentWeek = getCurrentWeekKey();
    if (payload.week !== currentWeek) {
      throw new Error(`Periode inspeksi telah berganti ke ${currentWeek}. Muat ulang halaman.`);
    }

    const inspections = MockDatabase.getInspections();
    const alreadySaved = inspections.some(
      (x) => x.week_key === payload.week && x.unit_id === payload.unitId
    );
    if (alreadySaved) {
      throw new Error(
        'Inventaris ini sudah disimpan untuk minggu berjalan. Sesuai aturan bisnis, inspeksi tidak dapat ditimpa.'
      );
    }

    const assets = MockDatabase.getAssets();
    const asset = assets.find((a) => a.id === payload.unitId && a.room === payload.room && a.active);
    if (!asset) {
      throw new Error('Inventaris tidak ditemukan atau tidak aktif.');
    }

    const allChecklists = MockDatabase.getChecklists().filter((c) => c.unit_id === payload.unitId && c.active);
    if (payload.answers.length !== allChecklists.length) {
      throw new Error('Semua poin checklist wajib dijawab.');
    }

    // Validate Kelompok physical vs usable
    if (asset.model === 'Kelompok') {
      const p = Number(payload.physical);
      const u = Number(payload.usable);
      if (isNaN(p) || isNaN(u) || p < 0 || u < 0 || u > p) {
        throw new Error('Jumlah fisik dan layak pakai tidak valid (layak pakai tidak boleh melebihi jumlah fisik).');
      }
    }

    const inspectionId = `INSP-${Date.now().toString(36).toUpperCase()}`;
    const nowTimestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);

    const newRecords: InspectionRecord[] = [];
    const newFindings: Finding[] = [];

    for (const answerItem of payload.answers) {
      const isAbnormal = answerItem.answer === 'ABNORMAL';
      if (isAbnormal) {
        if (!answerItem.note || !answerItem.note.trim()) {
          throw new Error('Hasil abnormal wajib menyertakan catatan deskripsi masalah.');
        }
        if (!answerItem.photo || !answerItem.photo.base64) {
          throw new Error('Hasil abnormal wajib mengunggah foto bukti.');
        }
      }

      newRecords.push({
        inspection_id: inspectionId,
        week_key: payload.week,
        room: payload.room,
        unit_id: payload.unitId,
        checklist_id: answerItem.id,
        answer: answerItem.answer,
        physical_qty: asset.model === 'Kelompok' ? payload.physical ?? '' : '',
        usable_qty: asset.model === 'Kelompok' ? payload.usable ?? '' : '',
        note: answerItem.note || '',
        operator_nip: operatorNip,
        created_at: nowTimestamp,
      });

      if (isAbnormal) {
        const findingId = `FND-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 100)}`;
        newFindings.push({
          finding_id: findingId,
          inspection_id: inspectionId,
          week_key: payload.week,
          room: payload.room,
          unit_id: payload.unitId,
          checklist_id: answerItem.id,
          description: answerItem.note || '',
          photo_file_id: answerItem.photo?.base64
            ? `data:${answerItem.photo.mime};base64,${answerItem.photo.base64}`
            : '',
          status: 'OPEN',
          priority: 'SEDANG',
          created_by: operatorNip,
          created_at: nowTimestamp,
          assigned_to: 'Tim Fasilitas / GA',
        });
      }
    }

    // Save to Mock DB
    MockDatabase.setInspections([...inspections, ...newRecords]);

    if (newFindings.length > 0) {
      const existingFindings = MockDatabase.getFindings();
      MockDatabase.setFindings([...existingFindings, ...newFindings]);
    }

    // Log Audit
    const audit = MockDatabase.getAudit();
    MockDatabase.setAudit([
      {
        audit_id: `AUD-${Date.now().toString(36).toUpperCase()}`,
        action: 'INSPECTION_SAVE',
        actor_nip: operatorNip,
        detail: {
          inspectionId,
          room: payload.room,
          unitId: payload.unitId,
          abnormalCount: newFindings.length,
        },
        created_at: nowTimestamp,
      },
      ...audit,
    ]);

    return { inspectionId, findingsCount: newFindings.length };
  }

  // --- Findings & Followups ---

  static async getFindings(_token: string): Promise<Finding[]> {
    if (!this.isMockMode()) { return this.callGas('getFindings', {}, _token).then((r:any)=>(Array.isArray(r)?r:(r.findings||[])).map((f:any)=>({ ...f, room:f.room_id || f.room || '', unit_id:f.asset_id || f.unit_id || '', checklist_id:f.point_id || f.checklist_id || '', photo_file_id:f.initial_photo_id || f.photo_file_id || '', week_key:f.week_key || '' })));  }
    return MockDatabase.getFindings();
  }

  static async getFollowups(_token: string, findingId?: string): Promise<Followup[]> {
    if (!this.isMockMode()) { return this.callGas('getFollowups', {findingId}, _token).then((r:any)=>Array.isArray(r)?r:(r.followups||[])); }
    const list = MockDatabase.getFollowups();
    return findingId ? list.filter((f) => f.finding_id === findingId) : list;
  }

  static async closeFinding(
    _token: string,
    operatorNip: string,
    id: string,
    note: string,
    photoDataUrl?: string
  ): Promise<boolean> {
    if (!this.isMockMode()) { return this.callGas('closeFinding', {findingId:id,note,photo:photoDataUrl}, _token); }
    if (!note || !note.trim()) {
      throw new Error('Catatan penyelesaian abnormalitas wajib diisi.');
    }

    const findings = MockDatabase.getFindings();
    const findingIndex = findings.findIndex((f) => f.finding_id === id);
    if (findingIndex === -1) {
      throw new Error('Temuan abnormalitas tidak ditemukan.');
    }

    findings[findingIndex].status = 'CLOSED';
    MockDatabase.setFindings([...findings]);

    const followups = MockDatabase.getFollowups();
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

    MockDatabase.setFollowups([
      ...followups,
      {
        followup_id: `FOL-${Date.now().toString(36).toUpperCase()}`,
        finding_id: id,
        note,
        photo_file_id: photoDataUrl || '',
        status: 'CLOSED',
        operator_nip: operatorNip,
        created_at: now,
      },
    ]);

    // Audit
    const audit = MockDatabase.getAudit();
    MockDatabase.setAudit([
      {
        audit_id: `AUD-${Date.now().toString(36).toUpperCase()}`,
        action: 'CLOSE_FINDING',
        actor_nip: operatorNip,
        detail: { findingId: id, note },
        created_at: now,
      },
      ...audit,
    ]);

    return true;
  }

  static async markCoordinated(
    _token: string,
    adminNip: string,
    id: string,
    note: string,
    assignedTo?: string
  ): Promise<boolean> {
    if (!this.isMockMode()) { return this.callGas('markCoordinated', {findingId:id,note,picNip:assignedTo}, _token); }
    if (!note || !note.trim()) {
      throw new Error('Catatan koordinasi wajib diisi.');
    }

    const findings = MockDatabase.getFindings();
    const item = findings.find((f) => f.finding_id === id);
    if (!item) {
      throw new Error('Temuan tidak ditemukan.');
    }

    item.status = 'COORDINATED';
    if (assignedTo) item.assigned_to = assignedTo;
    MockDatabase.setFindings([...findings]);

    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const followups = MockDatabase.getFollowups();
    MockDatabase.setFollowups([
      ...followups,
      {
        followup_id: `FOL-${Date.now().toString(36).toUpperCase()}`,
        finding_id: id,
        note: `[Koordinasi Admin] ${note}`,
        status: 'COORDINATED',
        operator_nip: adminNip,
        created_at: now,
      },
    ]);

    const audit = MockDatabase.getAudit();
    MockDatabase.setAudit([
      {
        audit_id: `AUD-${Date.now().toString(36).toUpperCase()}`,
        action: 'FINDING_COORDINATED',
        actor_nip: adminNip,
        detail: { findingId: id, note, assignedTo },
        created_at: now,
      },
      ...audit,
    ]);

    return true;
  }

  static async updateFindingPriority(
    _token: string,
    adminNip: string,
    id: string,
    priority: Finding['priority']
  ): Promise<boolean> {
    if (!this.isMockMode()) throw new Error('Fitur updateFindingPriority belum tersedia pada API LIVE. Data simulasi tidak digunakan.');
    const findings = MockDatabase.getFindings();
    const item = findings.find((f) => f.finding_id === id);
    if (!item) throw new Error('Temuan tidak ditemukan.');
    item.priority = priority;
    MockDatabase.setFindings([...findings]);

    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const audit = MockDatabase.getAudit();
    MockDatabase.setAudit([
      {
        audit_id: `AUD-${Date.now().toString(36).toUpperCase()}`,
        action: 'UPDATE_PRIORITY',
        actor_nip: adminNip,
        detail: { findingId: id, priority },
        created_at: now,
      },
      ...audit,
    ]);
    return true;
  }

  // --- Requests & Approvals ---

  static async getRequests(_token: string): Promise<OperatorRequest[]> {
    if (!this.isMockMode()) { return this.callGas('getRequests', {}, _token).then((r:any)=>Array.isArray(r)?r:(r.requests||[])); }
    return MockDatabase.getRequests();
  }

  static async submitRequest(
    _token: string,
    requesterNip: string,
    type: OperatorRequest['type'],
    room: string,
    reason: string,
    payload: OperatorRequest['payload'] = {}
  ): Promise<string> {
    if (!this.isMockMode()) throw new Error('Fitur submitRequest menunggu penyelarasan kontrak API LIVE; tidak menggunakan data dummy.');
    if (!reason || reason.trim().length < 8) {
      throw new Error('Alasan pengajuan wajib diisi minimal 8 karakter.');
    }

    const id = `REQ-${Date.now().toString(36).toUpperCase()}`;
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

    const newReq: OperatorRequest = {
      request_id: id,
      type,
      requester_nip: requesterNip,
      room,
      reason,
      payload,
      status: 'PENDING',
      created_at: now,
    };

    const requests = MockDatabase.getRequests();
    MockDatabase.setRequests([newReq, ...requests]);

    const audit = MockDatabase.getAudit();
    MockDatabase.setAudit([
      {
        audit_id: `AUD-${Date.now().toString(36).toUpperCase()}`,
        action: 'REQUEST_SUBMIT',
        actor_nip: requesterNip,
        detail: { id, type, room, reason },
        created_at: now,
      },
      ...audit,
    ]);

    return id;
  }

  static async decideRequest(
    _token: string,
    adminNip: string,
    id: string,
    decision: 'APPROVED' | 'REJECTED',
    note: string
  ): Promise<boolean> {
    if (!this.isMockMode()) throw new Error('Fitur decideRequest menunggu penyelarasan kontrak API LIVE; tidak menggunakan data dummy.');
    const requests = MockDatabase.getRequests();
    const req = requests.find((r) => r.request_id === id);
    if (!req) {
      throw new Error('Pengajuan tidak ditemukan.');
    }
    if (req.status !== 'PENDING') {
      throw new Error('Pengajuan sudah memiliki keputusan.');
    }

    req.status = decision;
    req.reviewer_nip = adminNip;
    req.review_note = note || '';
    req.reviewed_at = new Date().toISOString().replace('T', ' ').substring(0, 19);

    // Business side effects
    if (decision === 'APPROVED') {
      const findings = MockDatabase.getFindings();
      if (req.type === 'CANCEL_FINDING' && req.payload.findingId) {
        const target = findings.find((f) => f.finding_id === req.payload.findingId);
        if (target) target.status = 'CANCELLED';
      }
      if (req.type === 'REOPEN_FINDING' && req.payload.findingId) {
        const target = findings.find((f) => f.finding_id === req.payload.findingId);
        if (target) target.status = 'OPEN';
      }
      MockDatabase.setFindings([...findings]);
    }

    MockDatabase.setRequests([...requests]);

    const audit = MockDatabase.getAudit();
    MockDatabase.setAudit([
      {
        audit_id: `AUD-${Date.now().toString(36).toUpperCase()}`,
        action: 'REQUEST_DECISION',
        actor_nip: adminNip,
        detail: { id, decision, note },
        created_at: req.reviewed_at,
      },
      ...audit,
    ]);

    return true;
  }

  // --- Users & Assignments ---

  static async getUsers(_token: string): Promise<User[]> {
    if (!this.isMockMode()) throw new Error('Fitur getUsers belum tersedia pada API LIVE. Data simulasi tidak digunakan.');
    return MockDatabase.getUsers();
  }

  static async createUser(
    _token: string,
    adminNip: string,
    userData: { nip: string; name: string; role: 'ADMIN' | 'OPERATOR'; password?: string }
  ): Promise<boolean> {
    if (!this.isMockMode()) throw new Error('Fitur createUser belum tersedia pada API LIVE. Data simulasi tidak digunakan.');
    const nip = String(userData.nip || '').trim();
    if (!/^[0-9]{4,20}$/.test(nip)) {
      throw new Error('NIP wajib terdiri dari 4 sampai 20 digit angka.');
    }

    const users = MockDatabase.getUsers();
    if (users.some((u) => u.nip === nip)) {
      throw new Error(`NIP ${nip} sudah terdaftar dalam sistem.`);
    }

    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const newUser: User = {
      user_id: `USR-${Date.now().toString(36).toUpperCase()}`,
      nip,
      name: userData.name || `Operator ${nip}`,
      role: userData.role || 'OPERATOR',
      active: true,
      created_at: now,
      updated_at: now,
    };

    MockDatabase.setUsers([...users, newUser]);

    const audit = MockDatabase.getAudit();
    MockDatabase.setAudit([
      {
        audit_id: `AUD-${Date.now().toString(36).toUpperCase()}`,
        action: 'CREATE_USER',
        actor_nip: adminNip,
        detail: { nip, role: newUser.role, name: newUser.name },
        created_at: now,
      },
      ...audit,
    ]);

    return true;
  }

  static async toggleUserStatus(_token: string, adminNip: string, nip: string): Promise<boolean> {
    if (!this.isMockMode()) throw new Error('Fitur toggleUserStatus belum tersedia pada API LIVE. Data simulasi tidak digunakan.');
    const users = MockDatabase.getUsers();
    const user = users.find((u) => u.nip === nip);
    if (!user) throw new Error('Pengguna tidak ditemukan.');
    if (user.nip === adminNip) throw new Error('Tidak dapat menonaktifkan akun sendiri.');

    user.active = !user.active;
    user.updated_at = new Date().toISOString().replace('T', ' ').substring(0, 19);
    MockDatabase.setUsers([...users]);

    const audit = MockDatabase.getAudit();
    MockDatabase.setAudit([
      {
        audit_id: `AUD-${Date.now().toString(36).toUpperCase()}`,
        action: user.active ? 'USER_ACTIVATED' : 'USER_DEACTIVATED',
        actor_nip: adminNip,
        detail: { targetNip: nip },
        created_at: user.updated_at,
      },
      ...audit,
    ]);
    return true;
  }

  static async getAssignments(_token: string): Promise<RoomAssignment[]> {
    if (!this.isMockMode()) throw new Error('Fitur getAssignments belum tersedia pada API LIVE. Data simulasi tidak digunakan.');
    return MockDatabase.getAssignments();
  }

  static async assignSubstitute(
    _token: string,
    adminNip: string,
    room: string,
    mainNip: string,
    subNip: string
  ): Promise<boolean> {
    if (!this.isMockMode()) throw new Error('Fitur assignSubstitute belum tersedia pada API LIVE. Data simulasi tidak digunakan.');
    if (mainNip === subNip) {
      throw new Error('Operator pengganti harus berbeda dari operator utama.');
    }

    const assignments = MockDatabase.getAssignments();
    const activeOne = assignments.find((a) => a.room === room && a.active);
    if (activeOne) {
      throw new Error(`Sudah ada penugasan delegasi aktif untuk ${room}. Revoke terlebih dahulu.`);
    }

    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const newAssignment: RoomAssignment = {
      assignment_id: `ASG-${Date.now().toString(36).toUpperCase()}`,
      room,
      main_nip: mainNip,
      substitute_nip: subNip,
      active: true,
      created_at: now,
    };

    MockDatabase.setAssignments([...assignments, newAssignment]);

    const audit = MockDatabase.getAudit();
    MockDatabase.setAudit([
      {
        audit_id: `AUD-${Date.now().toString(36).toUpperCase()}`,
        action: 'ASSIGNMENT_CREATE',
        actor_nip: adminNip,
        detail: { room, mainNip, subNip },
        created_at: now,
      },
      ...audit,
    ]);

    return true;
  }

  static async revokeAssignment(_token: string, adminNip: string, assignmentId: string): Promise<boolean> {
    if (!this.isMockMode()) throw new Error('Fitur revokeAssignment belum tersedia pada API LIVE. Data simulasi tidak digunakan.');
    const assignments = MockDatabase.getAssignments();
    const item = assignments.find((a) => a.assignment_id === assignmentId);
    if (!item) throw new Error('Penugasan tidak ditemukan.');

    item.active = false;
    item.ended_at = new Date().toISOString().replace('T', ' ').substring(0, 19);
    MockDatabase.setAssignments([...assignments]);

    const audit = MockDatabase.getAudit();
    MockDatabase.setAudit([
      {
        audit_id: `AUD-${Date.now().toString(36).toUpperCase()}`,
        action: 'ASSIGNMENT_REVOKE',
        actor_nip: adminNip,
        detail: { assignmentId },
        created_at: item.ended_at,
      },
      ...audit,
    ]);

    return true;
  }

  // --- Audit Trail & History ---

  static async getAuditLogs(_token: string): Promise<AuditLog[]> {
    if (!this.isMockMode()) { return this.callGas('getAuditTrail', {limit:100}, _token).then((r:any)=>r.logs||[]); }
    return MockDatabase.getAudit();
  }

  // --- Additional Original Backend Operations (from Code.gs & Operations.gs) ---

  static async changePassword(
    _token: string,
    oldPassword: string,
    newPassword: string,
    userNip: string
  ): Promise<boolean> {
    if (!this.isMockMode()) throw new Error('Fitur changePassword belum tersedia pada API LIVE. Data simulasi tidak digunakan.');
    if (String(newPassword || '').length < 12) {
      throw new Error('Password baru wajib minimal 12 karakter.');
    }
    const users = MockDatabase.getUsers();
    const target = users.find((u) => u.nip === userNip);
    if (!target) throw new Error('Akun pengguna tidak ditemukan.');

    target.updated_at = new Date().toISOString().replace('T', ' ').substring(0, 19);
    MockDatabase.setUsers([...users]);

    const audit = MockDatabase.getAudit();
    MockDatabase.setAudit([
      {
        audit_id: `AUD-${Date.now().toString(36).toUpperCase()}`,
        action: 'PASSWORD_CHANGE',
        actor_nip: userNip,
        detail: { message: 'Password berhasil diperbarui' },
        created_at: target.updated_at,
      },
      ...audit,
    ]);

    return true;
  }

  static async backupNow(_token: string, adminNip: string): Promise<{ id: string; name: string }> {
    if (!this.isMockMode()) throw new Error('Fitur backupNow belum tersedia pada API LIVE. Data simulasi tidak digunakan.');
    const timestamp = new Date().toISOString().replace(/[-:T.]/g, '').substring(0, 14);
    const backupName = `AM-Digital-ADR-Backup-${timestamp}`;
    const backupId = `BKP-${Date.now().toString(36).toUpperCase()}`;

    const audit = MockDatabase.getAudit();
    MockDatabase.setAudit([
      {
        audit_id: `AUD-${Date.now().toString(36).toUpperCase()}`,
        action: 'BACKUP',
        actor_nip: adminNip,
        detail: { fileId: backupId, name: backupName },
        created_at: new Date().toISOString().replace('T', ' ').substring(0, 19),
      },
      ...audit,
    ]);

    return { id: backupId, name: backupName };
  }

  static async addFollowup(
    _token: string,
    operatorNip: string,
    findingId: string,
    note: string
  ): Promise<boolean> {
    if (!this.isMockMode()) throw new Error('Fitur addFollowup menunggu penyelarasan kontrak API LIVE; tidak menggunakan data dummy.');
    if (!note || !note.trim()) {
      throw new Error('Catatan tindak lanjut wajib diisi.');
    }
    const findings = MockDatabase.getFindings();
    const f = findings.find((x) => x.finding_id === findingId);
    if (!f || f.status !== 'OPEN') {
      throw new Error('Temuan tidak terbuka atau tidak ditemukan.');
    }

    const followups = MockDatabase.getFollowups();
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

    MockDatabase.setFollowups([
      ...followups,
      {
        followup_id: `FOL-${Date.now().toString(36).toUpperCase()}`,
        finding_id: findingId,
        note: `[Recheck Operator] ${note}`,
        status: 'RECHECK',
        operator_nip: operatorNip,
        created_at: now,
      },
    ]);

    const audit = MockDatabase.getAudit();
    MockDatabase.setAudit([
      {
        audit_id: `AUD-${Date.now().toString(36).toUpperCase()}`,
        action: 'FOLLOWUP_NOTE',
        actor_nip: operatorNip,
        detail: { findingId, note },
        created_at: now,
      },
      ...audit,
    ]);

    return true;
  }

  // --- GAS HTTP RPC helper ---
  private static async callGas(
    functionName: string,
    params: Record<string, unknown> = {},
    token: string = ''
  ): Promise<any> {
    const url = this.config.gasEndpointUrl;
    const isTestMode = this.config.testMode ?? false;

    // 1. Primary: Server-side API Proxy /api/rpc
    try {
      const proxyRes = await fetch('/api/rpc', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          
        },
        body: JSON.stringify({
          action: functionName,
          token,
          params,
          targetUrl: url || undefined,
        }),
      });

      const json = await proxyRes.json();

      if (proxyRes.ok && json.success) {
        return json.data;
      }

      if (json.code === 'WRITE_BLOCKED_BY_SAFE_MODE') {
        const safeError = new Error(
          json.error || 'Operasi penulisan diblokir karena Safe Mode backend aktif (database produksi terlindungi).'
        );
        (safeError as any).code = 'WRITE_BLOCKED_BY_SAFE_MODE';
        (safeError as any).safeMode = true;
        (safeError as any).errorId = json.errorId;
        (safeError as any).data = json.data;
        throw safeError;
      }

      if (json.message === 'GAS_NOT_CONFIGURED') {
        throw new Error('Endpoint Google Apps Script belum dikonfigurasi di server proxy.');
      }

      if (json.error) {
        const errorMsg = json.errorId ? `${json.error} (Kode: ${json.errorId})` : json.error;
        const apiError = new Error(errorMsg);
        if (json.code) (apiError as any).code = json.code;
        if (json.errorId) (apiError as any).errorId = json.errorId;
        throw apiError;
      }

      throw new Error(`Permintaan API gagal dengan HTTP ${proxyRes.status}`);
    } catch (proxyErr: any) {
      throw proxyErr;
    }
  }
}

