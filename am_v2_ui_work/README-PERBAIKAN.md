# AM Digital ADR V2 — Paket Koreksi Integrasi LIVE (Tahap Baca)

## Perubahan yang telah diterapkan
- Mode default frontend `GAS_LIVE`; tidak lagi memuat mode dari localStorage.
- Login wajib menggunakan GAS melalui `/api/rpc`; auto-login dummy dan fallback token mock di GAS dihapus.
- Password plaintext dan password demo fallback di AuthService GAS dihapus.
- Proxy tidak menerima target GAS dari header browser; endpoint hanya dari environment server.
- Proxy mengembalikan kegagalan 503 jika GAS belum dikonfigurasi.
- Dashboard Admin membaca `getOverview` dan `getFindings` dengan token aktual, refresh 30 detik.
- Operator memiliki tampilan baru `LiveRoomsView` untuk membaca ruangan/unit/checklist dari `getRooms` dan `getRoomDetails`, refresh 30 detik.
- Modul yang belum dimigrasikan tidak ditampilkan menggunakan data dummy: tampil pesan bahwa integrasi belum tersedia.
- Safe Mode Apps Script tetap `true`.

## BELUM SELESAI — JANGAN DIPAKAI SEBAGAI SISTEM PRODUKSI
1. Inspeksi operator LIVE belum memiliki formulir simpan/foto di `LiveRoomsView`.
2. Modul Admin selain dashboard (monitoring, abnormalitas, approval, akun, audit, laporan) masih ditahan karena komponen aslinya memakai `MockDatabase`.
3. Modul Operator selain daftar ruangan/checklist masih ditahan.
4. Skema historis `INSPECTIONS`/`FINDINGS` yang sempat tertulis pada kolom salah belum dimigrasikan. Angka KPI belum boleh dipakai sebagai laporan final.
5. Belum ada pengujian integrasi end-to-end dengan deployment GAS V2 dan Google Sheets. Jangan ubah `SAFE_MODE` menjadi false.
6. Session GAS disimpan dalam cache, dan penggunaan `sessionStorage` di browser masih perlu penguatan keamanan untuk produksi.
7. Folder Tool Tracking lama disimpan dalam arsip agar tidak menghilangkan kode pengguna; tidak dipakai oleh jalur aplikasi ADR V2.

## Cara memakai di Google AI Studio
1. Simpan backup proyek yang sekarang.
2. Unggah ZIP ini sebagai versi proyek baru, jangan menimpa deployment V1.
3. Isi environment server `GAS_WEB_APP_URL` (URL /exec API V2), `ADR_PROXY_SECRET` (secret yang sama dengan Script Properties GAS), `REQUIRE_PROXY_AUTH=true`.
4. Jangan menaruh secret di React, browser, atau prompt publik.
5. Deploy GAS V2 dari folder `gas-backend` ke proyek Apps Script terpisah dan pertahankan `SAFE_MODE:true`.
6. Uji `/api/health`, Ping, login, dashboard, daftar ruangan, dan checklist.
7. Jika data historis masih salah, lakukan audit/backup/migrasi terlebih dahulu sebelum menggunakan KPI sebagai laporan.

## Verifikasi
- Pemeriksaan sintaks TypeScript/TSX dilakukan dengan TypeScript transpiler (tanpa error parsing).
- Build Vite/TypeScript lengkap **belum dapat dijalankan** karena dependency npm tidak tersedia secara offline.
- Uji koneksi GAS dan database aktual **belum dilakukan**.
