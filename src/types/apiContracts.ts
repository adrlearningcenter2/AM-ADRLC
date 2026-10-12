/**
 * Unified API Contracts for AM Digital ADR V2
 * 
 * Defines standard JSON-RPC request and response payloads between:
 * - Frontend React V2
 * - Node.js Express Proxy (/api/*)
 * - Google Apps Script Backend (doPost)
 * - Google Sheets (Spreadsheet ID: 1R0sNA6dVgrI59HFAJUwqPhr2EbxMuyiXyguOosAX6gY)
 */

import {
  AssetUnit,
  ChecklistPoint,
  ExecutiveKPI,
  Finding,
  Followup,
  InspectionRecord,
  OperatorRequest,
  RoomSummary,
  User,
  InspectionSubmissionPayload
} from './adr';

/**
 * Standard JSON-RPC Request Envelope
 */
export interface GasRpcRequest<T = unknown> {
  action: string;
  token?: string;
  params?: T;
  testMode?: boolean; // When true, prevents persistent writes to production sheets
}

/**
 * Standard JSON-RPC Response Envelope
 */
export interface GasRpcResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  testMode?: boolean;
  timestamp?: string;
}

// ---------------------------------------------------------------------------
// 1. Auth: Login & Session
// ---------------------------------------------------------------------------
export interface LoginParams {
  nip: string;
  password: string;
}

export interface SafeUser {
  user_id: string;
  nip: string;
  name: string;
  role: 'ADMIN' | 'OPERATOR';
  active: boolean;
  created_at: string;
  updated_at: string;
  // NOTE: password_salt and password_hash are NEVER sent to the client
}

export interface LoginResult {
  token: string;
  user: SafeUser;
  expiresAt: string;
}

// ---------------------------------------------------------------------------
// 2. Overview & KPI
// ---------------------------------------------------------------------------
export interface GetOverviewParams {
  weekKey?: string; // Format YYYY-MM-DD (Defaults to current week Monday)
}

export interface GetOverviewResult {
  weekKey: string;
  kpi: ExecutiveKPI;
  rooms: RoomSummary[];
}

// ---------------------------------------------------------------------------
// 3. Rooms & Room Details
// ---------------------------------------------------------------------------
export interface RoomInfo {
  name: string;
  totalAssets: number;
  activeAssets: number;
  assignedMainNip?: string;
  assignedSubstituteNip?: string;
}

export interface GetRoomsResult {
  rooms: RoomInfo[];
}

export interface GetRoomDetailsParams {
  room: string;
  weekKey?: string;
}

export interface RoomUnitWithChecklist {
  unit: AssetUnit;
  checklists: ChecklistPoint[];
  inspectedThisWeek: boolean;
  inspectionRecord?: InspectionRecord;
  hasAbnormality: boolean;
}

export interface GetRoomDetailsResult {
  room: string;
  weekKey: string;
  units: RoomUnitWithChecklist[];
  completedCount: number;
  totalCount: number;
  isFullyInspected: boolean;
}

// ---------------------------------------------------------------------------
// 4. Inspections: Fetch & Save
// ---------------------------------------------------------------------------
export interface GetInspectionsParams {
  room?: string;
  weekKey?: string;
  status?: string;
  limit?: number;
}

export interface GetInspectionsResult {
  inspections: InspectionRecord[];
  total: number;
}

export interface SaveInspectionParams {
  payload: InspectionSubmissionPayload;
}

export interface SaveInspectionResult {
  inspection_id: string;
  week_key: string;
  asset_id: string;
  room_id: string;
  findingsCreated: number;
  findingIds: string[];
  status: 'COMPLETED';
  completed_at: string;
  dryRun?: boolean;
}

// ---------------------------------------------------------------------------
// 5. Findings (Abnormalities)
// ---------------------------------------------------------------------------
export interface GetFindingsParams {
  status?: 'ALL' | 'OPEN' | 'COORDINATED' | 'CLOSED' | 'CANCELLED';
  room?: string;
  priority?: string;
  weekKey?: string;
}

export interface GetFindingsResult {
  findings: Finding[];
  total: number;
}

export interface MarkCoordinatedParams {
  findingId: string;
  note: string;
  picNip?: string;
}

export interface MarkCoordinatedResult {
  findingId: string;
  status: 'COORDINATED';
  coord_by: string;
  coord_at: string;
}

// ---------------------------------------------------------------------------
// 6. Followups & Closing Findings
// ---------------------------------------------------------------------------
export interface GetFollowupsParams {
  findingId: string;
}

export interface GetFollowupsResult {
  findingId: string;
  followups: Followup[];
}

export interface CloseFindingParams {
  findingId: string;
  note: string;
  photo?: {
    mime: string;
    base64: string;
  } | null;
}

export interface CloseFindingResult {
  findingId: string;
  status: 'CLOSED';
  closed_by: string;
  closed_at: string;
  completionPhotoDriveId?: string;
}

// ---------------------------------------------------------------------------
// 7. Requests (Dispensations & Approvals)
// ---------------------------------------------------------------------------
export interface GetRequestsParams {
  status?: 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED';
}

export interface GetRequestsResult {
  requests: OperatorRequest[];
  total: number;
}

export interface DecideRequestParams {
  requestId: string;
  decision: 'APPROVE' | 'REJECT';
  reviewNote?: string;
}

export interface DecideRequestResult {
  requestId: string;
  status: 'APPROVED' | 'REJECTED';
  reviewer_nip: string;
  reviewed_at: string;
}

// ---------------------------------------------------------------------------
// 8. Management Reports
// ---------------------------------------------------------------------------
export interface GetReportsParams {
  month?: number; // 1 - 12
  year?: number;  // e.g. 2026
  room?: string;
}

export interface MonthlyRoomStat {
  room: string;
  totalAssets: number;
  totalInspections: number;
  totalFindings: number;
  closedFindings: number;
  openFindings: number;
  complianceRate: number;
}

export interface GetReportsResult {
  periodLabel: string;
  kpi: ExecutiveKPI;
  roomStats: MonthlyRoomStat[];
  executiveSummary: string;
}
