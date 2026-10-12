/**
 * Realistic Mock Data for AM Digital ADR V2.
 * Strictly maintains ADR Learning Center schema and operational data flow.
 * Saved to localStorage for interactive session persistence.
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
  AuditLog
} from '../types/adr';
import { getCurrentWeekKey } from '../utils/dateUtils';

const STORAGE_KEY_PREFIX = 'am_digital_adr_v2_';

const currentWeek = getCurrentWeekKey();

// Sample base64 placeholder photos for realistic evidence demonstration
const SAMPLE_DEFECT_PHOTO_1 = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect width="400" height="300" fill="%232b1117"/><text x="50%25" y="45%25" dominant-baseline="middle" text-anchor="middle" fill="%23f87171" font-size="16" font-family="sans-serif" font-weight="bold">FOTO TEMUAN ABNORMAL</text><text x="50%25" y="58%25" dominant-baseline="middle" text-anchor="middle" fill="%23fca5a5" font-size="13" font-family="sans-serif">Kabel HDMI Proyektor Aus &amp; Konektor Retak</text><text x="50%25" y="85%25" dominant-baseline="middle" text-anchor="middle" fill="%23991b1b" font-size="11" font-family="sans-serif">ADR Learning Center Evidence</text></svg>';

const SAMPLE_DEFECT_PHOTO_2 = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect width="400" height="300" fill="%231e293b"/><text x="50%25" y="45%25" dominant-baseline="middle" text-anchor="middle" fill="%23f87171" font-size="16" font-family="sans-serif" font-weight="bold">FOTO TEMUAN ABNORMAL</text><text x="50%25" y="58%25" dominant-baseline="middle" text-anchor="middle" fill="%23cbd5e1" font-size="13" font-family="sans-serif">Baut Sandaran Kursi Peserta Patah</text><text x="50%25" y="85%25" dominant-baseline="middle" text-anchor="middle" fill="%2364748b" font-size="11" font-family="sans-serif">ADR Learning Center Evidence</text></svg>';

const SAMPLE_FOLLOWUP_PHOTO_1 = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect width="400" height="300" fill="%23064e3b"/><text x="50%25" y="45%25" dominant-baseline="middle" text-anchor="middle" fill="%2334d399" font-size="16" font-family="sans-serif" font-weight="bold">BUKTI PERBAIKAN SELESAI</text><text x="50%25" y="58%25" dominant-baseline="middle" text-anchor="middle" fill="%23a7f3d0" font-size="13" font-family="sans-serif">Kabel diganti unit baru &amp; dites normal</text></svg>';

export const INITIAL_USERS: User[] = [
  {
    user_id: 'usr-001',
    nip: '26010007',
    name: 'Administrator ADR',
    role: 'ADMIN',
    active: true,
    created_at: '2026-01-10 08:00:00',
    updated_at: '2026-01-10 08:00:00',
  },
  {
    user_id: 'usr-002',
    nip: '26010006',
    name: 'Rahmat Hidayat (Operator)',
    role: 'OPERATOR',
    active: true,
    created_at: '2026-01-10 08:15:00',
    updated_at: '2026-01-10 08:15:00',
  },
  {
    user_id: 'usr-003',
    nip: '26010008',
    name: 'Budi Santoso (Operator)',
    role: 'OPERATOR',
    active: true,
    created_at: '2026-02-01 09:00:00',
    updated_at: '2026-02-01 09:00:00',
  },
  {
    user_id: 'usr-004',
    nip: '26010009',
    name: 'Siti Rahmawati (Operator)',
    role: 'OPERATOR',
    active: true,
    created_at: '2026-02-15 10:00:00',
    updated_at: '2026-02-15 10:00:00',
  },
];

export const INITIAL_ASSETS: AssetUnit[] = [
  // Ruang Teori 1
  {
    id: 'UNT-RT1-01',
    room: 'Ruang Teori 1',
    label: 'Meja & Kursi Peserta Pelatihan',
    name: 'Kursi Kuliah Ergonomis Chitose & Meja Panjang',
    qty: 24,
    model: 'Kelompok',
    active: true,
  },
  {
    id: 'UNT-RT1-02',
    room: 'Ruang Teori 1',
    label: 'Proyektor & Layar Gantung',
    name: 'Epson EB-X400 3300 Lumens',
    qty: 1,
    model: 'Tunggal',
    active: true,
  },
  {
    id: 'UNT-RT1-03',
    room: 'Ruang Teori 1',
    label: 'Air Conditioner Split (AC 1 & 2)',
    name: 'Daikin Inverter 2 PK R32',
    qty: 2,
    model: 'Kelompok',
    active: true,
  },
  {
    id: 'UNT-RT1-04',
    room: 'Ruang Teori 1',
    label: 'Papan Tulis Whiteboard & Spidol',
    name: 'Magnetic Whiteboard 240x120cm + Penghapus & Spidol',
    qty: 4,
    model: 'Kelompok',
    active: true,
  },

  // Ruang Teori 2
  {
    id: 'UNT-RT2-01',
    room: 'Ruang Teori 2',
    label: 'Meja & Kursi Peserta Pelatihan',
    name: 'Kursi Kuliah Chitose Putar',
    qty: 30,
    model: 'Kelompok',
    active: true,
  },
  {
    id: 'UNT-RT2-02',
    room: 'Ruang Teori 2',
    label: 'Smart TV Display 65 Inch',
    name: 'Samsung Crystal UHD 65 Inch Interactive',
    qty: 1,
    model: 'Tunggal',
    active: true,
  },
  {
    id: 'UNT-RT2-03',
    room: 'Ruang Teori 2',
    label: 'Sound System Wireless & Mic',
    name: 'Yamaha StagePas 400BT + Dual Wireless Mic',
    qty: 1,
    model: 'Tunggal',
    active: true,
  },

  // Workshop Otomotif
  {
    id: 'UNT-WKS-01',
    room: 'Workshop Otomotif',
    label: 'Engine Trainer EFI Avanza 1.3L',
    name: 'Modul Simulator Sistem Injeksi Bensin & Diagnostik OBD-II',
    qty: 1,
    model: 'Tunggal',
    active: true,
  },
  {
    id: 'UNT-WKS-02',
    room: 'Workshop Otomotif',
    label: 'Tool Cabinet Mekanik 5S',
    name: 'King Tony 7-Drawer Roller Tool Set Komplit',
    qty: 3,
    model: 'Kelompok',
    active: true,
  },
  {
    id: 'UNT-WKS-03',
    room: 'Workshop Otomotif',
    label: 'Air Compressor & Selang Spiral',
    name: 'Swan Air Compressor 3 HP 3 Phase',
    qty: 1,
    model: 'Tunggal',
    active: true,
  },
  {
    id: 'UNT-WKS-04',
    room: 'Workshop Otomotif',
    label: 'Hydraulic Two-Post Lift Car',
    name: 'Nussbaum Two-Post Lift 4.0 Ton Cap',
    qty: 1,
    model: 'Tunggal',
    active: true,
  },
  {
    id: 'UNT-WKS-05',
    room: 'Workshop Otomotif',
    label: 'Safety Equipment & Kotak P3K',
    name: 'APAR Powder 6kg, Eyewash Portable & First Aid Kit',
    qty: 2,
    model: 'Kelompok',
    active: true,
  },

  // Lab Komputer & Simulasi
  {
    id: 'UNT-LAB-01',
    room: 'Lab Komputer & Simulasi',
    label: 'Unit PC Workstation CAD/CAM',
    name: 'HP ProDesk Core i7 RAM 16GB SSD 512GB + Monitor 24 Inch',
    qty: 20,
    model: 'Kelompok',
    active: true,
  },
  {
    id: 'UNT-LAB-02',
    room: 'Lab Komputer & Simulasi',
    label: 'Server Rack & Switch Network',
    name: 'Cisco Gigabit 24-Port & APC UPS 3000VA',
    qty: 1,
    model: 'Tunggal',
    active: true,
  },
  {
    id: 'UNT-LAB-03',
    room: 'Lab Komputer & Simulasi',
    label: 'AC Precision Server Room & Lab',
    name: 'Daikin Cassette Inverter 3 PK',
    qty: 2,
    model: 'Kelompok',
    active: true,
  },

  // Auditorium Utama
  {
    id: 'UNT-AUD-01',
    room: 'Auditorium Utama',
    label: 'Videowall LED P2.5 High Definition',
    name: 'Absen LED Display Screen 4x2.5 Meter',
    qty: 1,
    model: 'Tunggal',
    active: true,
  },
  {
    id: 'UNT-AUD-02',
    room: 'Auditorium Utama',
    label: 'Sofa VIP & Kursi Auditorium Lipat',
    name: 'Kursi Teater Busa Moulded High Resilience',
    qty: 100,
    model: 'Kelompok',
    active: true,
  },
  {
    id: 'UNT-AUD-03',
    room: 'Auditorium Utama',
    label: 'Audio Mixer Digital & Line Array',
    name: 'Behringer X32 Digital Mixer + JBL Line Array',
    qty: 1,
    model: 'Tunggal',
    active: true,
  },
];

export const INITIAL_CHECKLISTS: ChecklistPoint[] = [
  // RT1-01 Meja Kursi
  { id: 'CHK-RT1-01-1', unit_id: 'UNT-RT1-01', order: 1, question: 'Kebersihan meja dan kursi bersih dari coretan dan debu (5S Seiri)', active: true },
  { id: 'CHK-RT1-01-2', unit_id: 'UNT-RT1-01', order: 2, question: 'Kondisi fisik kokoh, baut engsel tidak goyang / tidak patah', active: true },
  { id: 'CHK-RT1-01-3', unit_id: 'UNT-RT1-01', order: 3, question: 'Jumlah fisik lengkap dan seluruhnya layak pakai sesuai standar (24 unit)', active: true },

  // RT1-02 Proyektor
  { id: 'CHK-RT1-02-1', unit_id: 'UNT-RT1-02', order: 1, question: 'Lensa proyektor bersih dan bebas debu tebal', active: true },
  { id: 'CHK-RT1-02-2', unit_id: 'UNT-RT1-02', order: 2, question: 'Kabel HDMI, VGA dan power terpasang rapi, tidak terkelupas', active: true },
  { id: 'CHK-RT1-02-3', unit_id: 'UNT-RT1-02', order: 3, question: 'Kecerahan gambar tajam, warna normal, fan pendingin bekerja halus', active: true },
  { id: 'CHK-RT1-02-4', unit_id: 'UNT-RT1-02', order: 4, question: 'Remote control responsif dan baterai tidak bocor', active: true },

  // RT1-03 AC Split
  { id: 'CHK-RT1-03-1', unit_id: 'UNT-RT1-03', order: 1, question: 'Filter udara indoor bersih, hembusan dingin merata', active: true },
  { id: 'CHK-RT1-03-2', unit_id: 'UNT-RT1-03', order: 2, question: 'Tidak ada tetesan air atau kebocoran drainase pipa indoor', active: true },
  { id: 'CHK-RT1-03-3', unit_id: 'UNT-RT1-03', order: 3, question: 'Tidak ada suara berisik abnormal pada kompresor/blower', active: true },

  // RT1-04 Papan Tulis
  { id: 'CHK-RT1-04-1', unit_id: 'UNT-RT1-04', order: 1, question: 'Permukaan whiteboard bersih, dapat dihapus dengan baik', active: true },
  { id: 'CHK-RT1-04-2', unit_id: 'UNT-RT1-04', order: 2, question: 'Spidol (Hitam, Biru, Merah) memiliki tinta cukup & penghapus tersedia', active: true },

  // RT2-01 Meja Kursi
  { id: 'CHK-RT2-01-1', unit_id: 'UNT-RT2-01', order: 1, question: 'Kebersihan meja dan kursi bebas debu dan sampah', active: true },
  { id: 'CHK-RT2-01-2', unit_id: 'UNT-RT2-01', order: 2, question: 'Kondisi fisik busa utuh, rangka stabil tidak goyang', active: true },
  { id: 'CHK-RT2-01-3', unit_id: 'UNT-RT2-01', order: 3, question: 'Jumlah fisik sesuai kapasitas standar (30 unit)', active: true },

  // RT2-02 Smart TV
  { id: 'CHK-RT2-02-1', unit_id: 'UNT-RT2-02', order: 1, question: 'Layar TV bersih tidak ada goresan atau bercak debu', active: true },
  { id: 'CHK-RT2-02-2', unit_id: 'UNT-RT2-02', order: 2, question: 'Fitur screen mirroring wireless & kabel HDMI beroperasi normal', active: true },

  // RT2-03 Sound System
  { id: 'CHK-RT2-03-1', unit_id: 'UNT-RT2-03', order: 1, question: 'Mikrofon nirkabel menghasilkan suara jernih tanpa distorsi / feedback', active: true },
  { id: 'CHK-RT2-03-2', unit_id: 'UNT-RT2-03', order: 2, question: 'Kabel speaker tertata aman dan tidak menjadi hazard tersandung', active: true },

  // WKS-01 Engine Trainer
  { id: 'CHK-WKS-01-1', unit_id: 'UNT-WKS-01', order: 1, question: 'Baterai / aki 12V dalam tegangan prima (min 12.4V), klem kutub kencang', active: true },
  { id: 'CHK-WKS-01-2', unit_id: 'UNT-WKS-01', order: 2, question: 'Level oli mesin pada stik dipstick normal dan tidak ada kebocoran oli', active: true },
  { id: 'CHK-WKS-01-3', unit_id: 'UNT-WKS-01', order: 3, question: 'Semua sensor & wiring harness tersambung kokoh tanpa sobekan', active: true },
  { id: 'CHK-WKS-01-4', unit_id: 'UNT-WKS-01', order: 4, question: 'Kunci kontak & panel rpm/speedometer merespon dengan normal saat dihidupkan', active: true },

  // WKS-02 Tool Cabinet
  { id: 'CHK-WKS-02-1', unit_id: 'UNT-WKS-02', order: 1, question: 'Seluruh laci perkakas tersusun rapi dengan bayangan busa 5S (shadow board)', active: true },
  { id: 'CHK-WKS-02-2', unit_id: 'UNT-WKS-02', order: 2, question: 'Kunci laci berfungsi baik dan perkakas bersih dari oli berlebih', active: true },
  { id: 'CHK-WKS-02-3', unit_id: 'UNT-WKS-02', order: 3, question: 'Jumlah kunci pas, socket, dan tang lengkap sesuai daftar inventaris laci', active: true },

  // WKS-03 Air Compressor
  { id: 'CHK-WKS-03-1', unit_id: 'UNT-WKS-03', order: 1, question: 'Pressure gauge menunjukkan cut-off otomatis pada 8 bar', active: true },
  { id: 'CHK-WKS-03-2', unit_id: 'UNT-WKS-03', order: 2, question: 'Kran buangan air kondensat tabung telah dikuras secara rutin', active: true },
  { id: 'CHK-WKS-03-3', unit_id: 'UNT-WKS-03', order: 3, question: 'V-belt kompresor dalam tegangan standar dan safety cover terpasang', active: true },

  // WKS-04 Car Lift
  { id: 'CHK-WKS-04-1', unit_id: 'UNT-WKS-04', order: 1, question: 'Safety lock mekanik berbunyi klik dan terkunci sempurna saat naik', active: true },
  { id: 'CHK-WKS-04-2', unit_id: 'UNT-WKS-04', order: 2, question: 'Tali baja sinkronisasi seimbang dan pelumasan kolom lift memadai', active: true },
  { id: 'CHK-WKS-04-3', unit_id: 'UNT-WKS-04', order: 3, question: 'Tombol darurat (Emergency Stop) berfungsi seketika saat ditekan', active: true },

  // WKS-05 Safety APAR & P3K
  { id: 'CHK-WKS-05-1', unit_id: 'UNT-WKS-05', order: 1, question: 'Jarum indikator tekanan APAR berada di zona hijau aman', active: true },
  { id: 'CHK-WKS-05-2', unit_id: 'UNT-WKS-05', order: 2, question: 'Segel pin APAR masih utuh dan masa kadaluarsa belum terlampaui', active: true },
  { id: 'CHK-WKS-05-3', unit_id: 'UNT-WKS-05', order: 3, question: 'Isi kotak P3K lengkap sesuai checklist standar K3 ADR', active: true },

  // LAB-01 PC CAD/CAM
  { id: 'CHK-LAB-01-1', unit_id: 'UNT-LAB-01', order: 1, question: 'Seluruh unit PC menyala normal dan masuk desktop Windows tanpa error', active: true },
  { id: 'CHK-LAB-01-2', unit_id: 'UNT-LAB-01', order: 2, question: 'Keyboard dan mouse berfungsi tanpa tombol macet', active: true },
  { id: 'CHK-LAB-01-3', unit_id: 'UNT-LAB-01', order: 3, question: 'Kabel power dan LAN di bawah meja tertata rapi dalam cable tray', active: true },

  // LAB-02 Server Rack
  { id: 'CHK-LAB-02-1', unit_id: 'UNT-LAB-02', order: 1, question: 'Indikator status UPS menunjukkan beban normal dan baterai terisi 100%', active: true },
  { id: 'CHK-LAB-02-2', unit_id: 'UNT-LAB-02', order: 2, question: 'Suhu dalam rak server dingin (20°C - 22°C) dan pintu tertutup terkunci', active: true },

  // LAB-03 AC Lab
  { id: 'CHK-LAB-03-1', unit_id: 'UNT-LAB-03', order: 1, question: 'AC Cassette mendinginkan ruangan stabil pada suhu 21°C', active: true },

  // AUD-01 Videowall
  { id: 'CHK-AUD-01-1', unit_id: 'UNT-AUD-01', order: 1, question: 'Seluruh modul panel LED menyala rata tanpa ada piksel mati atau flickering', active: true },
  { id: 'CHK-AUD-01-2', unit_id: 'UNT-AUD-01', order: 2, question: 'Video processor menerima input sinyal HDMI dengan mulus', active: true },

  // AUD-02 Sofa & Kursi
  { id: 'CHK-AUD-02-1', unit_id: 'UNT-AUD-02', order: 1, question: 'Kebersihan karpet dan kursi auditorium rapi dan wangi', active: true },
  { id: 'CHK-AUD-02-2', unit_id: 'UNT-AUD-02', order: 2, question: 'Mekanisme lipat kursi bekerja tanpa bunyi decit', active: true },

  // AUD-03 Audio Mixer
  { id: 'CHK-AUD-03-1', unit_id: 'UNT-AUD-03', order: 1, question: 'Motorized fader mixer bergerak normal saat recall scene', active: true },
  { id: 'CHK-AUD-03-2', unit_id: 'UNT-AUD-03', order: 2, question: 'Kualitas suara speaker line array jernih tanpa dengung grounding', active: true },
];

export const INITIAL_INSPECTIONS: InspectionRecord[] = [
  // Inspeksi minggu ini untuk Ruang Teori 1 (selesai)
  {
    inspection_id: 'INSP-2026-W40-001',
    week_key: currentWeek,
    room: 'Ruang Teori 1',
    unit_id: 'UNT-RT1-01',
    checklist_id: 'CHK-RT1-01-1',
    answer: 'NORMAL',
    physical_qty: 24,
    usable_qty: 23,
    note: '',
    operator_nip: '26010006',
    created_at: `${currentWeek} 08:30:15`,
  },
  {
    inspection_id: 'INSP-2026-W40-001',
    week_key: currentWeek,
    room: 'Ruang Teori 1',
    unit_id: 'UNT-RT1-01',
    checklist_id: 'CHK-RT1-01-2',
    answer: 'ABNORMAL',
    physical_qty: 24,
    usable_qty: 23,
    note: 'Ada 1 unit kursi peserta baris ke-3 baut penahan sandaran lepas/patah sehingga goyang',
    operator_nip: '26010006',
    created_at: `${currentWeek} 08:30:15`,
  },
  {
    inspection_id: 'INSP-2026-W40-001',
    week_key: currentWeek,
    room: 'Ruang Teori 1',
    unit_id: 'UNT-RT1-01',
    checklist_id: 'CHK-RT1-01-3',
    answer: 'NORMAL',
    physical_qty: 24,
    usable_qty: 23,
    note: '',
    operator_nip: '26010006',
    created_at: `${currentWeek} 08:30:15`,
  },

  {
    inspection_id: 'INSP-2026-W40-002',
    week_key: currentWeek,
    room: 'Ruang Teori 1',
    unit_id: 'UNT-RT1-02',
    checklist_id: 'CHK-RT1-02-1',
    answer: 'NORMAL',
    physical_qty: 1,
    usable_qty: 1,
    note: '',
    operator_nip: '26010006',
    created_at: `${currentWeek} 08:42:00`,
  },
  {
    inspection_id: 'INSP-2026-W40-002',
    week_key: currentWeek,
    room: 'Ruang Teori 1',
    unit_id: 'UNT-RT1-02',
    checklist_id: 'CHK-RT1-02-2',
    answer: 'ABNORMAL',
    physical_qty: 1,
    usable_qty: 1,
    note: 'Kabel HDMI proyektor kendur dan display sering berkedip hitam saat laptop digerakkan',
    operator_nip: '26010006',
    created_at: `${currentWeek} 08:42:00`,
  },
  {
    inspection_id: 'INSP-2026-W40-002',
    week_key: currentWeek,
    room: 'Ruang Teori 1',
    unit_id: 'UNT-RT1-02',
    checklist_id: 'CHK-RT1-02-3',
    answer: 'NORMAL',
    physical_qty: 1,
    usable_qty: 1,
    note: '',
    operator_nip: '26010006',
    created_at: `${currentWeek} 08:42:00`,
  },
  {
    inspection_id: 'INSP-2026-W40-002',
    week_key: currentWeek,
    room: 'Ruang Teori 1',
    unit_id: 'UNT-RT1-02',
    checklist_id: 'CHK-RT1-02-4',
    answer: 'NORMAL',
    physical_qty: 1,
    usable_qty: 1,
    note: '',
    operator_nip: '26010006',
    created_at: `${currentWeek} 08:42:00`,
  },

  {
    inspection_id: 'INSP-2026-W40-003',
    week_key: currentWeek,
    room: 'Ruang Teori 1',
    unit_id: 'UNT-RT1-03',
    checklist_id: 'CHK-RT1-03-1',
    answer: 'NORMAL',
    physical_qty: 2,
    usable_qty: 2,
    note: '',
    operator_nip: '26010006',
    created_at: `${currentWeek} 08:50:10`,
  },
  {
    inspection_id: 'INSP-2026-W40-003',
    week_key: currentWeek,
    room: 'Ruang Teori 1',
    unit_id: 'UNT-RT1-03',
    checklist_id: 'CHK-RT1-03-2',
    answer: 'NORMAL',
    physical_qty: 2,
    usable_qty: 2,
    note: '',
    operator_nip: '26010006',
    created_at: `${currentWeek} 08:50:10`,
  },
  {
    inspection_id: 'INSP-2026-W40-003',
    week_key: currentWeek,
    room: 'Ruang Teori 1',
    unit_id: 'UNT-RT1-03',
    checklist_id: 'CHK-RT1-03-3',
    answer: 'NORMAL',
    physical_qty: 2,
    usable_qty: 2,
    note: '',
    operator_nip: '26010006',
    created_at: `${currentWeek} 08:50:10`,
  },

  {
    inspection_id: 'INSP-2026-W40-004',
    week_key: currentWeek,
    room: 'Ruang Teori 1',
    unit_id: 'UNT-RT1-04',
    checklist_id: 'CHK-RT1-04-1',
    answer: 'NORMAL',
    physical_qty: 4,
    usable_qty: 4,
    note: '',
    operator_nip: '26010006',
    created_at: `${currentWeek} 08:55:00`,
  },
  {
    inspection_id: 'INSP-2026-W40-004',
    week_key: currentWeek,
    room: 'Ruang Teori 1',
    unit_id: 'UNT-RT1-04',
    checklist_id: 'CHK-RT1-04-2',
    answer: 'NORMAL',
    physical_qty: 4,
    usable_qty: 4,
    note: '',
    operator_nip: '26010006',
    created_at: `${currentWeek} 08:55:00`,
  },

  // Ruang Workshop Otomotif sebagian diinspeksi minggu ini
  {
    inspection_id: 'INSP-2026-W40-005',
    week_key: currentWeek,
    room: 'Workshop Otomotif',
    unit_id: 'UNT-WKS-01',
    checklist_id: 'CHK-WKS-01-1',
    answer: 'NORMAL',
    physical_qty: 1,
    usable_qty: 1,
    note: '',
    operator_nip: '26010006',
    created_at: `${currentWeek} 09:30:00`,
  },
  {
    inspection_id: 'INSP-2026-W40-005',
    week_key: currentWeek,
    room: 'Workshop Otomotif',
    unit_id: 'UNT-WKS-01',
    checklist_id: 'CHK-WKS-01-2',
    answer: 'NORMAL',
    physical_qty: 1,
    usable_qty: 1,
    note: '',
    operator_nip: '26010006',
    created_at: `${currentWeek} 09:30:00`,
  },
  {
    inspection_id: 'INSP-2026-W40-005',
    week_key: currentWeek,
    room: 'Workshop Otomotif',
    unit_id: 'UNT-WKS-01',
    checklist_id: 'CHK-WKS-01-3',
    answer: 'NORMAL',
    physical_qty: 1,
    usable_qty: 1,
    note: '',
    operator_nip: '26010006',
    created_at: `${currentWeek} 09:30:00`,
  },
  {
    inspection_id: 'INSP-2026-W40-005',
    week_key: currentWeek,
    room: 'Workshop Otomotif',
    unit_id: 'UNT-WKS-01',
    checklist_id: 'CHK-WKS-01-4',
    answer: 'NORMAL',
    physical_qty: 1,
    usable_qty: 1,
    note: '',
    operator_nip: '26010006',
    created_at: `${currentWeek} 09:30:00`,
  },
];

export const INITIAL_FINDINGS: Finding[] = [
  {
    finding_id: 'FND-2026-001',
    inspection_id: 'INSP-2026-W40-002',
    week_key: currentWeek,
    room: 'Ruang Teori 1',
    unit_id: 'UNT-RT1-02',
    checklist_id: 'CHK-RT1-02-2',
    description: 'Kabel HDMI proyektor kendur dan display sering berkedip hitam saat laptop digerakkan.',
    photo_file_id: SAMPLE_DEFECT_PHOTO_1,
    status: 'COORDINATED',
    priority: 'TINGGI',
    created_by: '26010006',
    created_at: `${currentWeek} 08:42:00`,
    assigned_to: 'Tim GA & IT Learning Center',
  },
  {
    finding_id: 'FND-2026-002',
    inspection_id: 'INSP-2026-W40-001',
    week_key: currentWeek,
    room: 'Ruang Teori 1',
    unit_id: 'UNT-RT1-01',
    checklist_id: 'CHK-RT1-01-2',
    description: 'Ada 1 unit kursi peserta baris ke-3 baut penahan sandaran lepas/patah sehingga goyang dan rawan jatuh.',
    photo_file_id: SAMPLE_DEFECT_PHOTO_2,
    status: 'OPEN',
    priority: 'SEDANG',
    created_by: '26010006',
    created_at: `${currentWeek} 08:30:15`,
    assigned_to: 'Workshop Maintenance',
  },
  {
    finding_id: 'FND-2026-000',
    inspection_id: 'INSP-2026-PREV-01',
    week_key: '2026-09-29',
    room: 'Lab Komputer & Simulasi',
    unit_id: 'UNT-LAB-01',
    checklist_id: 'CHK-LAB-01-2',
    description: 'Keyboard PC #14 tombol spasi macet terkena tumpahan remah.',
    photo_file_id: SAMPLE_DEFECT_PHOTO_2,
    status: 'CLOSED',
    priority: 'RENDAH',
    created_by: '26010006',
    created_at: '2026-09-29 11:15:00',
    assigned_to: 'IT Support',
  },
];

export const INITIAL_FOLLOWUPS: Followup[] = [
  {
    followup_id: 'FOL-001',
    finding_id: 'FND-2026-001',
    note: 'Admin telah berkoordinasi dengan Vendor IT. Kabel HDMI pengganti Gold Plated 10m telah diajukan PO.',
    photo_file_id: '',
    status: 'COORDINATED',
    operator_nip: '26010007',
    created_at: `${currentWeek} 10:15:00`,
  },
  {
    followup_id: 'FOL-002',
    finding_id: 'FND-2026-000',
    note: 'Keyboard telah diganti dengan unit baru dari stok sparepart Lab dan dites berfungsi lancar.',
    photo_file_id: SAMPLE_FOLLOWUP_PHOTO_1,
    status: 'CLOSED',
    operator_nip: '26010006',
    created_at: '2026-09-30 14:00:00',
  },
];

export const INITIAL_REQUESTS: OperatorRequest[] = [
  {
    request_id: 'REQ-001',
    type: 'LATE_INSPECTION',
    requester_nip: '26010006',
    room: 'Auditorium Utama',
    reason: 'Ruang sedang dipakai Pelatihan Induction Karyawan Baru ADR sepanjang hari Senin-Selasa.',
    payload: {
      deadline: `${currentWeek}`,
    },
    status: 'APPROVED',
    reviewer_nip: '26010007',
    review_note: 'Disetujui. Inspeksi dapat dilakukan Rabu pagi sebelum sesi kelas dimulai.',
    created_at: `${currentWeek} 07:45:00`,
    reviewed_at: `${currentWeek} 08:15:00`,
  },
  {
    request_id: 'REQ-002',
    type: 'ADD_ASSET',
    requester_nip: '26010008',
    room: 'Workshop Otomotif',
    reason: 'Terdapat penambahan 1 unit Digital Multimeter Fluke 87V bantuan dari Plant 2.',
    payload: {
      assetName: 'Digital Multimeter Fluke 87V Industrial',
      qty: 1,
    },
    status: 'PENDING',
    created_at: `${currentWeek} 11:20:00`,
  },
];

export const INITIAL_ASSIGNMENTS: RoomAssignment[] = [
  {
    assignment_id: 'ASG-001',
    room: 'Ruang Teori 1',
    main_nip: '26010006',
    substitute_nip: '26010008',
    active: true,
    created_at: '2026-01-15 08:00:00',
  },
  {
    assignment_id: 'ASG-002',
    room: 'Workshop Otomotif',
    main_nip: '26010006',
    substitute_nip: '26010009',
    active: true,
    created_at: '2026-01-15 08:00:00',
  },
  {
    assignment_id: 'ASG-003',
    room: 'Lab Komputer & Simulasi',
    main_nip: '26010008',
    substitute_nip: '26010006',
    active: true,
    created_at: '2026-01-15 08:00:00',
  },
];

export const INITIAL_AUDIT: AuditLog[] = [
  {
    audit_id: 'AUD-001',
    action: 'INSPECTION_SAVE',
    actor_nip: '26010006',
    detail: { room: 'Ruang Teori 1', unitId: 'UNT-RT1-01', abnormalCount: 1 },
    created_at: `${currentWeek} 08:30:15`,
  },
  {
    audit_id: 'AUD-002',
    action: 'INSPECTION_SAVE',
    actor_nip: '26010006',
    detail: { room: 'Ruang Teori 1', unitId: 'UNT-RT1-02', abnormalCount: 1 },
    created_at: `${currentWeek} 08:42:00`,
  },
  {
    audit_id: 'AUD-003',
    action: 'FINDING_COORDINATED',
    actor_nip: '26010007',
    detail: { findingId: 'FND-2026-001', note: 'Vendor IT dihubungi untuk ganti kabel' },
    created_at: `${currentWeek} 10:15:00`,
  },
  {
    audit_id: 'AUD-004',
    action: 'REQUEST_DECISION',
    actor_nip: '26010007',
    detail: { requestId: 'REQ-001', decision: 'APPROVED' },
    created_at: `${currentWeek} 08:15:00`,
  },
];

// LocalStorage helpers to simulate database operations locally
export class MockDatabase {
  private static load<T>(key: string, fallback: T): T {
    try {
      const data = localStorage.getItem(STORAGE_KEY_PREFIX + key);
      return data ? JSON.parse(data) : fallback;
    } catch {
      return fallback;
    }
  }

  private static save<T>(key: string, data: T): void {
    try {
      localStorage.setItem(STORAGE_KEY_PREFIX + key, JSON.stringify(data));
    } catch (e) {
      console.warn('LocalStorage save warning:', e);
    }
  }

  static getUsers(): User[] {
    return this.load('users', INITIAL_USERS);
  }

  static setUsers(users: User[]): void {
    this.save('users', users);
  }

  static getAssets(): AssetUnit[] {
    return this.load('assets', INITIAL_ASSETS);
  }

  static setAssets(assets: AssetUnit[]): void {
    this.save('assets', assets);
  }

  static getChecklists(): ChecklistPoint[] {
    return this.load('checklists', INITIAL_CHECKLISTS);
  }

  static setChecklists(checklists: ChecklistPoint[]): void {
    this.save('checklists', checklists);
  }

  static getInspections(): InspectionRecord[] {
    return this.load('inspections', INITIAL_INSPECTIONS);
  }

  static setInspections(inspections: InspectionRecord[]): void {
    this.save('inspections', inspections);
  }

  static getFindings(): Finding[] {
    return this.load('findings', INITIAL_FINDINGS);
  }

  static setFindings(findings: Finding[]): void {
    this.save('findings', findings);
  }

  static getFollowups(): Followup[] {
    return this.load('followups', INITIAL_FOLLOWUPS);
  }

  static setFollowups(followups: Followup[]): void {
    this.save('followups', followups);
  }

  static getRequests(): OperatorRequest[] {
    return this.load('requests', INITIAL_REQUESTS);
  }

  static setRequests(requests: OperatorRequest[]): void {
    this.save('requests', requests);
  }

  static getAssignments(): RoomAssignment[] {
    return this.load('assignments', INITIAL_ASSIGNMENTS);
  }

  static setAssignments(assignments: RoomAssignment[]): void {
    this.save('assignments', assignments);
  }

  static getAudit(): AuditLog[] {
    return this.load('audit', INITIAL_AUDIT);
  }

  static setAudit(audit: AuditLog[]): void {
    this.save('audit', audit);
  }

  static resetToDefault(): void {
    localStorage.removeItem(STORAGE_KEY_PREFIX + 'users');
    localStorage.removeItem(STORAGE_KEY_PREFIX + 'assets');
    localStorage.removeItem(STORAGE_KEY_PREFIX + 'checklists');
    localStorage.removeItem(STORAGE_KEY_PREFIX + 'inspections');
    localStorage.removeItem(STORAGE_KEY_PREFIX + 'findings');
    localStorage.removeItem(STORAGE_KEY_PREFIX + 'followups');
    localStorage.removeItem(STORAGE_KEY_PREFIX + 'requests');
    localStorage.removeItem(STORAGE_KEY_PREFIX + 'assignments');
    localStorage.removeItem(STORAGE_KEY_PREFIX + 'audit');
  }
}
