import { resolveEvidenceUrl } from '../utils/evidence';
/**
 * Schema Adapter and Architectural Mapping for AM Digital ADR V2
 * 
 * Target Google Sheets Spreadsheet ID: 1R0sNA6dVgrI59HFAJUwqPhr2EbxMuyiXyguOosAX6gY
 * 
 * Provides:
 * 1. Exact Column Definitions and Constraints matching production Google Sheets.
 * 2. Normalization functions to convert raw Sheet rows into typed UI domain models.
 * 3. Serialization functions to convert UI submissions into exact Sheet row formats.
 * 4. Google Drive photo ID to secure URL resolver.
 * 5. Architectural schema verification checks.
 */

import {
  AssetUnit,
  ChecklistPoint,
  Finding,
  Followup,
  InspectionRecord,
  OperatorRequest,
  RoomAssignment,
  User,
  SheetUserRow,
  SheetMasterUnitRow,
  SheetChecklistDraftRow,
  SheetInspectionRow,
  SheetFindingRow,
  SheetFollowupRow,
  SheetAssignmentRow,
  SheetRequestRow,
  SheetAuditRow,
  AuditLog,
  InspectionSubmissionPayload
} from '../types/adr';

export const TARGET_SPREADSHEET_ID = '1R0sNA6dVgrI59HFAJUwqPhr2EbxMuyiXyguOosAX6gY';

export interface SheetDefinition {
  sheetName: string;
  description: string;
  primaryKey: string;
  columns: {
    header: string;
    type: 'string' | 'number' | 'boolean' | 'json' | 'drive_id';
    required: boolean;
    description: string;
  }[];
}

export const DATABASE_SCHEMA_MAPPING: Record<string, SheetDefinition> = {
  USERS: {
    sheetName: 'USERS',
    description: 'Tabel pengguna sistem dengan otentikasi NIP, peran (ADMIN/OPERATOR), dan credential hash.',
    primaryKey: 'user_id',
    columns: [
      { header: 'user_id', type: 'string', required: true, description: 'Identifier unik user (UUID / USR-xxx)' },
      { header: 'nip', type: 'string', required: true, description: 'Nomor Induk Pegawai unik untuk login' },
      { header: 'name', type: 'string', required: true, description: 'Nama lengkap karyawan' },
      { header: 'role', type: 'string', required: true, description: 'Role otoritas: ADMIN atau OPERATOR' },
      { header: 'password_salt', type: 'string', required: true, description: 'Garam kriptografi (HMAC/PBKDF2/SHA256)' },
      { header: 'password_hash', type: 'string', required: true, description: 'Hash password terenkripsi, tidak boleh di-expose ke frontend' },
      { header: 'active', type: 'boolean', required: true, description: 'Status akun aktif (TRUE/FALSE)' },
      { header: 'created_at', type: 'string', required: true, description: 'Waktu pembuatan akun (YYYY-MM-DD HH:mm:ss)' },
      { header: 'updated_at', type: 'string', required: true, description: 'Waktu perubahan data akun' }
    ]
  },
  MASTER_UNIT_REVIEW: {
    sheetName: 'MASTER_UNIT_REVIEW',
    description: 'Master data unit inventaris / fasilitas tiap ruangan di ADR Learning Center.',
    primaryKey: 'ID Unit',
    columns: [
      { header: 'ID Unit', type: 'string', required: true, description: 'Kode unik inventaris (cth: AST-TR-001)' },
      { header: 'ID Sumber', type: 'string', required: false, description: 'Referensi baris / ID pada sistem inventaris lama' },
      { header: 'Ruangan', type: 'string', required: true, description: 'Nama ruangan (Ruang Teori, Simulator, dsb.)' },
      { header: 'Nama', type: 'string', required: true, description: 'Nama unit atau deskripsi inventaris' },
      { header: 'Label Pemeriksaan', type: 'string', required: true, description: 'Label barcode / display saat checklist' },
      { header: 'Jumlah Standar Sementara', type: 'number', required: true, description: 'Kuantitas standar wajib ada' },
      { header: 'Kategori', type: 'string', required: false, description: 'Klasifikasi fasilitas / perkakas' },
      { header: 'Model', type: 'string', required: true, description: 'Tunggal (kuantitas 1) atau Kelompok (hitung fisik & siap pakai)' },
      { header: 'Status Validasi', type: 'string', required: false, description: 'Status validasi master data' },
      { header: 'Baris Sumber', type: 'number', required: false, description: 'Indeks baris sumber data mentah' },
      { header: 'Aktif', type: 'boolean', required: true, description: 'Status keaktifan unit (TRUE/FALSE)' }
    ]
  },
  CHECKLIST_DRAFT: {
    sheetName: 'CHECKLIST_DRAFT',
    description: 'Daftar item pemeriksaan checklist standar per unit inventaris.',
    primaryKey: 'Checklist ID',
    columns: [
      { header: 'Checklist ID', type: 'string', required: true, description: 'Kode unik butir checklist (cth: CHK-101)' },
      { header: 'ID Unit', type: 'string', required: true, description: 'Relasi ke MASTER_UNIT_REVIEW.ID Unit' },
      { header: 'Label Pemeriksaan', type: 'string', required: false, description: 'Label display periksa' },
      { header: 'Ruangan', type: 'string', required: false, description: 'Nama ruangan terkait' },
      { header: 'Inventaris', type: 'string', required: false, description: 'Nama inventaris' },
      { header: 'Urutan', type: 'number', required: true, description: 'Nomor urut pertanyaan pemeriksaan' },
      { header: 'Poin Pemeriksaan', type: 'string', required: true, description: 'Instruksi / kriteria kondisi yang diperiksa' },
      { header: 'Jawaban', type: 'string', required: false, description: 'Opsi jawaban standar (NORMAL / ABNORMAL)' },
      { header: 'Status', type: 'string', required: false, description: 'Status status draft / active' },
      { header: 'Aktif', type: 'boolean', required: true, description: 'Status keaktifan butir (TRUE/FALSE)' },
      { header: 'Versi', type: 'string', required: false, description: 'Versi butir checklist' }
    ]
  },
  INSPECTIONS: {
    sheetName: 'INSPECTIONS',
    description: 'Catatan hasil inspeksi mingguan per unit/fasilitas per periode week_key.',
    primaryKey: 'inspection_id',
    columns: [
      { header: 'inspection_id', type: 'string', required: true, description: 'ID unik catatan inspeksi (INS-YYYYMMDD-xxx)' },
      { header: 'week_key', type: 'string', required: true, description: 'Tanggal Senin minggu periode (YYYY-MM-DD)' },
      { header: 'asset_id', type: 'string', required: true, description: 'Relasi ke MASTER_UNIT_REVIEW.ID Unit' },
      { header: 'room_id', type: 'string', required: true, description: 'Nama / ID ruangan inspeksi' },
      { header: 'checklist_snapshot', type: 'json', required: false, description: 'Snapshot butir checklist saat inspeksi dilaksanakan' },
      { header: 'answers_json', type: 'json', required: true, description: 'Array JSON seluruh jawaban butir pemeriksaan' },
      { header: 'physical_qty', type: 'number', required: false, description: 'Jumlah fisik terhitung saat inspeksi (model Kelompok)' },
      { header: 'usable_qty', type: 'number', required: false, description: 'Jumlah layak pakai saat inspeksi (model Kelompok)' },
      { header: 'status', type: 'string', required: true, description: 'Status inspeksi: COMPLETED, PARTIAL, LATE' },
      { header: 'last_actor_nip', type: 'string', required: true, description: 'NIP Operator pemeriksa terakhir' },
      { header: 'started_at', type: 'string', required: true, description: 'Waktu mulai inspeksi' },
      { header: 'updated_at', type: 'string', required: true, description: 'Waktu pembaruan terakhir' },
      { header: 'completed_at', type: 'string', required: true, description: 'Waktu finalisasi inspeksi' }
    ]
  },
  FINDINGS: {
    sheetName: 'FINDINGS',
    description: 'Daftar abnormalitas atau temuan kerusakan yang tercatat saat inspeksi.',
    primaryKey: 'finding_id',
    columns: [
      { header: 'finding_id', type: 'string', required: true, description: 'Kode unik temuan (FND-YYYYMMDD-xxx)' },
      { header: 'inspection_id', type: 'string', required: true, description: 'Relasi ke INSPECTIONS.inspection_id' },
      { header: 'asset_id', type: 'string', required: true, description: 'Relasi ke MASTER_UNIT_REVIEW.ID Unit' },
      { header: 'room_id', type: 'string', required: true, description: 'Nama / ID ruangan temuan' },
      { header: 'point_id', type: 'string', required: true, description: 'Relasi ke CHECKLIST_DRAFT.Checklist ID' },
      { header: 'description', type: 'string', required: true, description: 'Deskripsi detail kerusakan / kondisi abnormal' },
      { header: 'priority', type: 'string', required: true, description: 'Prioritas penanganan: TINGGI, SEDANG, RENDAH' },
      { header: 'team', type: 'string', required: false, description: 'Tim penanggung jawab perbaikan (Facility / IT / GA)' },
      { header: 'status', type: 'string', required: true, description: 'Status: OPEN, COORDINATED, CLOSED, CANCELLED' },
      { header: 'initial_photo_id', type: 'drive_id', required: true, description: 'Google Drive File ID foto bukti abnormalitas awal' },
      { header: 'completion_photo_id', type: 'drive_id', required: false, description: 'Google Drive File ID foto bukti setelah perbaikan' },
      { header: 'physical_qty', type: 'number', required: false, description: 'Jumlah fisik saat abnormal dicatat' },
      { header: 'usable_qty', type: 'number', required: false, description: 'Jumlah layak pakai saat abnormal dicatat' },
      { header: 'created_by', type: 'string', required: true, description: 'NIP operator yang menemukan' },
      { header: 'created_at', type: 'string', required: true, description: 'Waktu temuan dibuat' },
      { header: 'closed_by', type: 'string', required: false, description: 'NIP verifikator/pelaksana penutupan temuan' },
      { header: 'closed_at', type: 'string', required: false, description: 'Waktu penutupan temuan' },
      { header: 'coord_by', type: 'string', required: false, description: 'NIP admin yang melakukan koordinasi' },
      { header: 'coord_at', type: 'string', required: false, description: 'Waktu tindakan koordinasi' }
    ]
  },
  FOLLOWUPS: {
    sheetName: 'FOLLOWUPS',
    description: 'Log riwayat tindakan perbaikan dan tindak lanjut temuan abnormalitas.',
    primaryKey: 'followup_id',
    columns: [
      { header: 'followup_id', type: 'string', required: true, description: 'ID unik log tindak lanjut (FOL-xxx)' },
      { header: 'finding_id', type: 'string', required: true, description: 'Relasi ke FINDINGS.finding_id' },
      { header: 'actor_nip', type: 'string', required: true, description: 'NIP teknisi/operator/admin penindaklanjut' },
      { header: 'result', type: 'string', required: true, description: 'Hasil: RECHECK, REPAIRED, COORDINATED' },
      { header: 'notes', type: 'string', required: true, description: 'Catatan rinci perbaikan yang telah dilakukan' },
      { header: 'physical_qty', type: 'number', required: false, description: 'Kuantitas fisik setelah tindak lanjut' },
      { header: 'usable_qty', type: 'number', required: false, description: 'Kuantitas layak pakai setelah perbaikan' },
      { header: 'photo_id', type: 'drive_id', required: false, description: 'Google Drive File ID foto bukti tindak lanjut' },
      { header: 'created_at', type: 'string', required: true, description: 'Waktu pencatatan tindak lanjut' }
    ]
  },
  ASSIGNMENTS: {
    sheetName: 'ASSIGNMENTS',
    description: 'Penugasan operator utama dan pengganti untuk setiap ruangan.',
    primaryKey: 'assignment_id',
    columns: [
      { header: 'assignment_id', type: 'string', required: true, description: 'ID penugasan (ASG-xxx)' },
      { header: 'room', type: 'string', required: true, description: 'Nama ruangan penugasan' },
      { header: 'main_nip', type: 'string', required: true, description: 'NIP Operator Penanggung Jawab Utama' },
      { header: 'substitute_nip', type: 'string', required: false, description: 'NIP Operator Pengganti / Cadangan' },
      { header: 'active', type: 'boolean', required: true, description: 'Status penugasan berlaku (TRUE/FALSE)' },
      { header: 'created_at', type: 'string', required: true, description: 'Waktu penugasan dibuat' },
      { header: 'ended_at', type: 'string', required: false, description: 'Waktu penugasan dinonaktifkan' }
    ]
  },
  REQUESTS: {
    sheetName: 'REQUESTS',
    description: 'Pengajuan dispensasi / revisi oleh Operator ke Admin (inspeksi terlambat, tambah aset, dsb).',
    primaryKey: 'request_id',
    columns: [
      { header: 'request_id', type: 'string', required: true, description: 'ID pengajuan (REQ-xxx)' },
      { header: 'type', type: 'string', required: true, description: 'Tipe: LATE_INSPECTION, ADD_ASSET, dsb.' },
      { header: 'requester_nip', type: 'string', required: true, description: 'NIP Operator pemohon' },
      { header: 'room', type: 'string', required: true, description: 'Nama ruangan terkait' },
      { header: 'reason', type: 'string', required: true, description: 'Alasan permohonan' },
      { header: 'payload', type: 'json', required: false, description: 'Detail data pengajuan dalam JSON' },
      { header: 'status', type: 'string', required: true, description: 'Status: PENDING, APPROVED, REJECTED' },
      { header: 'reviewer_nip', type: 'string', required: false, description: 'NIP Admin pemeriksa pengajuan' },
      { header: 'review_note', type: 'string', required: false, description: 'Catatan keputusan persetujuan/penolakan' },
      { header: 'created_at', type: 'string', required: true, description: 'Waktu pengajuan dikirim' },
      { header: 'reviewed_at', type: 'string', required: false, description: 'Waktu keputusan ditetapkan' }
    ]
  },
  AUDIT: {
    sheetName: 'AUDIT',
    description: 'Catatan log audit trail aktivitas penting untuk kepatuhan tata kelola.',
    primaryKey: 'audit_id',
    columns: [
      { header: 'audit_id', type: 'string', required: true, description: 'ID log audit (AUD-xxx)' },
      { header: 'action', type: 'string', required: true, description: 'Kode aksi: INSPECTION_SUBMIT, COORDINATE_FINDING, dsb.' },
      { header: 'actor_nip', type: 'string', required: true, description: 'NIP pengguna pelaku aksi' },
      { header: 'detail', type: 'json', required: true, description: 'Rincian data objek yang diproses' },
      { header: 'created_at', type: 'string', required: true, description: 'Waktu kejadian' }
    ]
  }
};

/**
 * Resolves a Google Drive File ID into an accessible thumbnail or view URL.
 * Falls back to base64 Data URLs for simulation mode.
 */
export function resolveDrivePhotoUrl(fileIdOrDataUrl: string): string {
  if (!fileIdOrDataUrl) return '';
  if (fileIdOrDataUrl.startsWith('data:image/') || fileIdOrDataUrl.startsWith('http://') || fileIdOrDataUrl.startsWith('https://')) {
    return fileIdOrDataUrl;
  }
  // If it's a raw Google Drive File ID:
  return `https://drive.google.com/thumbnail?id=${encodeURIComponent(fileIdOrDataUrl)}&sz=w1000`;
}

/**
 * Normalizes raw Google Sheets Master Unit Row to React AssetUnit
 */
export function mapSheetToAssetUnit(row: SheetMasterUnitRow): AssetUnit {
  return {
    id: String(row['ID Unit'] || '').trim(),
    room: String(row['Ruangan'] || '').trim(),
    label: String(row['Label Pemeriksaan'] || '').trim(),
    name: String(row['Nama'] || '').trim(),
    qty: Number(row['Jumlah Standar Sementara']) || 1,
    model: (row['Model'] === 'Kelompok' ? 'Kelompok' : 'Tunggal'),
    active: row['Aktif'] === true || String(row['Aktif']).toUpperCase() === 'TRUE'
  };
}

/**
 * Normalizes raw Google Sheets Checklist Row to React ChecklistPoint
 */
export function mapSheetToChecklistPoint(row: SheetChecklistDraftRow): ChecklistPoint {
  return {
    id: String(row['Checklist ID'] || '').trim(),
    unit_id: String(row['ID Unit'] || '').trim(),
    order: Number(row['Urutan']) || 1,
    question: String(row['Poin Pemeriksaan'] || '').trim(),
    active: row['Aktif'] === true || String(row['Aktif']).toUpperCase() === 'TRUE'
  };
}

/**
 * Normalizes raw Google Sheets Finding Row to React Finding
 */
export function mapSheetToFinding(row: SheetFindingRow): Finding {
  return {
    finding_id: String(row.finding_id || '').trim(),
    inspection_id: String(row.inspection_id || '').trim(),
    week_key: '', // Joined via inspection_id
    room: String(row.room_id || '').trim(),
    unit_id: String(row.asset_id || '').trim(),
    checklist_id: String(row.point_id || '').trim(),
    description: String(row.description || '').trim(),
    photo_file_id: resolveEvidenceUrl(row.initial_photo_id),
    status: (row.status as any) || 'OPEN',
    priority: (row.priority as any) || 'SEDANG',
    created_by: String(row.created_by || '').trim(),
    created_at: String(row.created_at || '').trim(),
    assigned_to: row.coord_by ? String(row.coord_by).trim() : undefined
  };
}

/**
 * Prepares the payload for Google Apps Script saveInspection call
 * strictly keeping column constraints and avoiding schema mutation.
 */
export function serializeInspectionForGAS(
  payload: InspectionSubmissionPayload,
  operatorNip: string,
  nowIso: string
): {
  inspectionRow: Partial<SheetInspectionRow>;
  findingRows: Partial<SheetFindingRow>[];
} {
  const inspectionId = `INS-${nowIso.replace(/[-:T.]/g, '').substring(0, 14)}-${payload.unitId}`;
  
  const answersJson = JSON.stringify(
    payload.answers.map(a => ({
      checklist_id: a.id,
      answer: a.answer,
      note: a.note || ''
    }))
  );

  const inspectionRow: Partial<SheetInspectionRow> = {
    inspection_id: inspectionId,
    week_key: payload.week,
    room_id: payload.room,
    asset_id: payload.unitId,
    checklist_snapshot: '',
    answers_json: answersJson,
    physical_qty: payload.physical ?? '',
    usable_qty: payload.usable ?? '',
    status: 'COMPLETED',
    last_actor_nip: operatorNip,
    started_at: nowIso,
    updated_at: nowIso,
    completed_at: nowIso
  };

  const findingRows: Partial<SheetFindingRow>[] = [];

  payload.answers.forEach((ans, idx) => {
    if (ans.answer === 'ABNORMAL') {
      const findingId = `FND-${nowIso.replace(/[-:T.]/g, '').substring(0, 8)}-${payload.unitId}-${idx + 1}`;
      findingRows.push({
        finding_id: findingId,
        inspection_id: inspectionId,
        asset_id: payload.unitId,
        room_id: payload.room,
        point_id: ans.id,
        description: ans.note || 'Kondisi abnormal tercatat pada checklist mingguan.',
        priority: 'SEDANG',
        status: 'OPEN',
        initial_photo_id: ans.photo?.base64 ? `UPLOAD_DRIVE:${ans.photo.mime}` : '',
        physical_qty: payload.physical ?? '',
        usable_qty: payload.usable ?? '',
        created_by: operatorNip,
        created_at: nowIso
      });
    }
  });

  return { inspectionRow, findingRows };
}
