# Panduan Keamanan & Deployment Backend Google Apps Script (GAS)
## AM Digital ADR V2 · ADR Learning Center

API Gateway ini menghubungkan frontend web **AM Digital ADR V2** dengan **Google Sheets** (`Spreadsheet ID: 1R0sNA6dVgrI59HFAJUwqPhr2EbxMuyiXyguOosAX6gY`) dan **Google Drive** bukti foto abnormalitas dengan standar keamanan enterprise, fail-closed access control, dan perlindungan penuh integritas database produksi.

---

### Arsitektur Keamanan Terverifikasi (Final Hardening)

1. **FAIL-CLOSED PROXY AUTHENTICATION**
   - Komunikasi server-to-server diverifikasi via `ADR_PROXY_SECRET`.
   - **Zero Hardcoded Secrets**: Tidak ada secret fallback yang ditulis dalam kode sumber.
   - Rahasia hanya disimpan di server environment (`.env`) dan Google Apps Script **Script Properties** (`Project Settings > Script Properties`).
   - Jika `REQUIRE_PROXY_AUTH = true` dan secret belum diset di Script Properties, seluruh permintaan `POST` langsung ditolak (`fail-closed`).

2. **SAFE MODE WRITE GUARD TERPUSAT (`CONFIG.SAFE_MODE = true`)**
   - Safe Mode dikendalikan 100% oleh konfigurasi backend, **tidak pernah mempercayai flag dari frontend**.
   - Router memiliki centralized write guard yang mengawasi seluruh aksi mutasi (`saveInspection`, `markCoordinated`, `addFollowup`, `closeFinding`, `submitRequest`, `decideRequest`).
   - Setiap service tetap melakukan validasi skema dan data master secara penuh sebelum pemblokiran.
   - Saat Safe Mode aktif: **Seluruh operasi mutasi mengembalikan `success: false` dan `code: WRITE_BLOCKED_BY_SAFE_MODE`**. Tidak pernah mengembalikan pesan sukses.
   - **Zero Write**: Tidak ada baris yang ditulis ke Google Sheets, tidak ada file diunggah ke Google Drive, dan tidak ada baris yang ditambahkan ke sheet `AUDIT`.

3. **PEMISAHAN HEALTH CHECK & DATABASE CONNECTIVITY**
   - **Public Health Check (`doGet` / `ping`)**: Hanya mengembalikan status online dan server time. **Nol paparan Spreadsheet ID, sheet names, atau kredensial internal**.
   - **Database Connectivity Check (`checkDatabase`)**: Wajib token autentikasi dengan **Role ADMIN**. Memeriksa akses ke `SpreadsheetApp.openById()` dan memverifikasi keberadaan 9 sheet tanpa melakukan operasi penulisan apapun (Strictly Read-Only).

4. **SANITASI ERROR HANDLING & CORRELATION ID**
   - Tidak pernah mengirimkan raw stack trace, exception class names, atau nama file internal ke klien.
   - Setiap error menghasilkan `errorId` unik (`ERR-YYYYMMDDHHmmss-xxxxxx`) yang dicatat bersama stack trace lengkap di `Logger.log` server Google Apps Script untuk memudahkan pelacakan oleh administrator.
   - Klien hanya menerima error code terstruktur dan pesan pengguna yang aman.

5. **VALIDASI PARAMETER & PERLINDUNGAN RESOURCE**
   - Parameter `params` divalidasi ketat: harus berupa objek biasa (bukan array atau null).
   - Pengambilan riwayat audit (`getAuditTrail`) dibatasi maksimal 100 baris untuk mencegah kehabisan memori.
   - Node.js server proxy menerapkan pembatasan ukuran payload (maksimal 10MB) dan rate limiting (120 req/menit untuk RPC, 60 req/menit untuk Health check) dengan HTTP 429 Retry-After.

---

### Berkas di Direktori `gas-backend/`

| Berkas | Fungsi Utama |
| :--- | :--- |
| **`Config.gs`** | Konfigurasi spreadsheet ID, nama sheet, `SAFE_MODE: true`, `REQUIRE_PROXY_AUTH: true`, dan batas brute force. Bebas rahasia plaintext. |
| **`SheetHelper.gs`** | Akses Google Sheets berbasis nama header dengan pengaman Safe Mode pada level primitif IO. |
| **`AuthService.gs`** | Validasi NIP/Password (SHA-256 + salt), RBAC (ADMIN vs OPERATOR), token sesi TTL 12 jam, dan lockout brute-force via CacheService. |
| **`DriveService.gs`** | Pengunggahan foto bukti ke folder Google Drive dengan pencegahan mutasi Safe Mode. |
| **`AuditService.gs`** | Pencatatan riwayat aktivitas sistem ke sheet `AUDIT` (dicegah saat Safe Mode aktif) dan pembatasan maksimal 100 log. |
| **`InspectionService.gs`** | Logika inspeksi mingguan, LockService atomik, validasi unit master & checklist, pengecekan konektivitas database (ADMIN), dan penanganan Safe Mode. |
| **`Code.gs`** | Router HTTP `doPost(e)` dan `doGet(e)` dengan output JSON terstruktur, centralized write guard, fail-closed proxy auth, dan sanitasi error dengan `errorId`. |

---

### Panduan Deployment ke Google Apps Script

1. **Buka Spreadsheet Produksi**:
   - Buka Google Sheets `1R0sNA6dVgrI59HFAJUwqPhr2EbxMuyiXyguOosAX6gY`.
   - Klik menu **Extensions > Apps Script**.

2. **Buat File Script**:
   - Salin setiap file dari folder `gas-backend/` (`Config.gs`, `SheetHelper.gs`, `AuthService.gs`, `DriveService.gs`, `AuditService.gs`, `InspectionService.gs`, `Code.gs`) ke editor Apps Script.

3. **Konfigurasi Script Properties (Proxy Secret)**:
   - Di panel kiri Apps Script, klik **Project Settings (ikon gerigi)**.
   - Gulir ke bagian **Script Properties** dan klik **Add script property**.
   - **Property**: `ADR_PROXY_SECRET`
   - **Value**: Masukkan shared secret yang kuat (misal string acak 32 karakter).
   - Simpan Script Properties.
   - Masukkan nilai yang sama ke variabel `ADR_PROXY_SECRET` pada file `.env` server web AM Digital ADR V2.

4. **Deploy Web App Baru**:
   - Klik tombol biru **Deploy > New deployment**.
   - Pilih jenis: **Web app**.
   - **Description**: `AM Digital ADR V2 API Gateway - Hardened`
   - **Execute as**: `Me` (akun Google pemilik spreadsheet)
   - **Who has access**: `Anyone`
   - Klik **Deploy**.
   - Berikan izin otorisasi Google Sheets & Drive jika diminta pertama kali.
   - Salin URL Web App yang dihasilkan (format: `https://script.google.com/macros/s/AKfycb.../exec`).

5. **Hubungkan ke AM Digital ADR V2**:
   - Simpan URL ke `GAS_WEB_APP_URL` pada server environment atau menu **Pengaturan Koneksi Backend** di antarmuka web.
   - Lakukan uji koneksi (**Ping**) dan pemeriksaan database melalui tombol diagnostik.
