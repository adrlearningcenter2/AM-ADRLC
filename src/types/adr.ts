/**
 * Data contracts and type definitions for AM Digital ADR V2
 * Based on Google Sheets schema: USERS, MASTER_UNIT_REVIEW, CHECKLIST_DRAFT,
 * INSPECTIONS, FINDINGS, FOLLOWUPS, REQUESTS, ASSIGNMENTS, AUDIT.
 */

export type UserRole = 'ADMIN' | 'OPERATOR';

export interface User {
  user_id: string;
  nip: string;
  name: string;
  role: UserRole;
  password_salt?: string;
  password_hash?: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export type UnitModel = 'Tunggal' | 'Kelompok';

export interface AssetUnit {
  id: string;           // ID Unit
  room: string;         // Ruangan
  label: string;        // Label Pemeriksaan
  name: string;         // Nama Unit
  qty: number;          // Jumlah Standar Sementara
  model: UnitModel;     // Model: Tunggal atau Kelompok
  active: boolean;      // Aktif (TRUE/FALSE)
}

export interface ChecklistPoint {
  id: string;           // Checklist ID (e.g. CHK-101)
  unit_id: string;      // ID Unit
  order: number;        // Urutan
  question: string;     // Poin Pemeriksaan
  active: boolean;      // Aktif
}

export type InspectionAnswer = 'NORMAL' | 'ABNORMAL';

export interface InspectionRecord {
  inspection_id: string;
  week_key: string;      // Format YYYY-MM-DD (Monday of week)
  room: string;
  unit_id: string;
  checklist_id: string;
  answer: InspectionAnswer;
  physical_qty?: number | string;
  usable_qty?: number | string;
  note?: string;
  operator_nip: string;
  created_at: string;
}

export type FindingStatus = 'OPEN' | 'COORDINATED' | 'CLOSED' | 'CANCELLED';
export type FindingPriority = 'TINGGI' | 'SEDANG' | 'RENDAH';

export interface Finding {
  finding_id: string;
  inspection_id: string;
  week_key: string;
  room: string;
  unit_id: string;
  checklist_id: string;
  description: string;
  photo_file_id: string; // Base64 data URI in mock, Drive file ID in production
  status: FindingStatus;
  priority: FindingPriority;
  created_by: string;    // Operator NIP
  created_at: string;
  assigned_to?: string;  // PIC Penanggung Jawab
}

export interface Followup {
  followup_id: string;
  finding_id: string;
  note: string;
  photo_file_id?: string;
  status: string;        // 'CLOSED' | 'COORDINATED' | 'RECHECK'
  operator_nip: string;
  created_at: string;
}

export type RequestType = 'LATE_INSPECTION' | 'ADD_ASSET' | 'CANCEL_FINDING' | 'REOPEN_FINDING';
export type RequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface OperatorRequest {
  request_id: string;
  type: RequestType;
  requester_nip: string;
  room: string;
  reason: string;
  payload: {
    findingId?: string;
    deadline?: string;
    assetName?: string;
    qty?: number;
    [key: string]: unknown;
  };
  status: RequestStatus;
  reviewer_nip?: string;
  review_note?: string;
  created_at: string;
  reviewed_at?: string;
}

export interface RoomAssignment {
  assignment_id: string;
  room: string;
  main_nip: string;
  substitute_nip: string;
  active: boolean;
  created_at: string;
  ended_at?: string;
}

export interface AuditLog {
  audit_id: string;
  action: string;
  actor_nip: string;
  detail: Record<string, unknown> | string;
  created_at: string;
}

export interface RoomSummary {
  name: string;
  totalAssets: number;
  activeAssets: number;
  inspectedThisWeek: number;
  openFindingsCount: number;
  isCompleteThisWeek: boolean;
  assignedOperatorNip?: string;
}

export interface ExecutiveKPI {
  totalAssets: number;
  activeAssets: number;
  totalRooms: number;
  completedRoomsThisWeek: number;
  inspectionProgressPercent: number;
  totalInspectionsThisWeek: number;
  openFindings: number;
  coordinatedFindings: number;
  closedFindings: number;
  complianceRate: number; // Persentase unit normal vs total
  pendingRequests: number;
}

export interface InspectionSubmissionItem {
  id: string; // checklist_id
  answer: InspectionAnswer;
  note?: string;
  photo?: {
    mime: string;
    base64: string;
  } | null;
}

export interface InspectionSubmissionPayload {
  week: string;
  room: string;
  unitId: string;
  answers: InspectionSubmissionItem[];
  physical?: number | null;
  usable?: number | null;
}

/**
 * -------------------------------------------------------------
 * EXACT RAW GOOGLE SHEETS SCHEMAS
 * Spreadsheet ID: 1R0sNA6dVgrI59HFAJUwqPhr2EbxMuyiXyguOosAX6gY
 * -------------------------------------------------------------
 */

export interface SheetUserRow {
  user_id: string;
  nip: string;
  name: string;
  role: 'ADMIN' | 'OPERATOR';
  password_salt: string;
  password_hash: string;
  active: boolean | string | number;
  created_at: string;
  updated_at: string;
}

export interface SheetMasterUnitRow {
  'ID Unit': string;
  'ID Sumber'?: string;
  'Ruangan': string;
  'Nama': string;
  'Label Pemeriksaan': string;
  'Jumlah Standar Sementara': number | string;
  'Kategori'?: string;
  'Model': 'Tunggal' | 'Kelompok' | string;
  'Status Validasi'?: string;
  'Baris Sumber'?: number | string;
  'Aktif': boolean | string;
}

export interface SheetChecklistDraftRow {
  'Checklist ID': string;
  'ID Unit': string;
  'Label Pemeriksaan'?: string;
  'Ruangan'?: string;
  'Inventaris'?: string;
  'Urutan': number | string;
  'Poin Pemeriksaan': string;
  'Jawaban'?: string;
  'Status'?: string;
  'Aktif': boolean | string;
  'Versi'?: string | number;
}

export interface SheetInspectionRow {
  inspection_id: string;
  week_key: string;
  asset_id: string;
  room_id: string;
  checklist_snapshot: string;
  answers_json: string;
  physical_qty: number | string;
  usable_qty: number | string;
  status: string;
  last_actor_nip: string;
  started_at: string;
  updated_at: string;
  completed_at: string;
}

export interface SheetFindingRow {
  finding_id: string;
  inspection_id: string;
  asset_id: string;
  room_id: string;
  point_id: string;
  description: string;
  priority: 'TINGGI' | 'SEDANG' | 'RENDAH' | string;
  team: string;
  status: 'OPEN' | 'COORDINATED' | 'CLOSED' | 'CANCELLED' | string;
  initial_photo_id: string;
  completion_photo_id: string;
  physical_qty: number | string;
  usable_qty: number | string;
  created_by: string;
  created_at: string;
  closed_by: string;
  closed_at: string;
  coord_by: string;
  coord_at: string;
}

export interface SheetFollowupRow {
  followup_id: string;
  finding_id: string;
  actor_nip: string;
  result: string;
  notes: string;
  physical_qty: number | string;
  usable_qty: number | string;
  photo_id: string;
  created_at: string;
}

export interface SheetAssignmentRow {
  assignment_id: string;
  room: string;
  main_nip: string;
  substitute_nip: string;
  active: boolean | string;
  created_at: string;
  ended_at?: string;
}

export interface SheetRequestRow {
  request_id: string;
  type: string;
  requester_nip: string;
  room: string;
  reason: string;
  payload: string;
  status: string;
  reviewer_nip?: string;
  review_note?: string;
  created_at: string;
  reviewed_at?: string;
}

export interface SheetAuditRow {
  audit_id: string;
  action: string;
  actor_nip: string;
  detail: string;
  created_at: string;
}

