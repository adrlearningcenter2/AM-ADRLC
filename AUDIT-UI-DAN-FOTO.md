# AM Digital ADR V2 — Audit UI & Bukti Foto (14 Oktober 2026)

## Perbaikan yang diterapkan
- `src/utils/evidence.ts`: normalisasi ID file Google Drive, URL `/file/d/`, URL `?id=`, serta data URI menjadi URL preview. Menolak nilai yang bukan ID/URL gambar yang dikenali.
- `src/components/common/EvidenceModal.tsx`: modal foto responsif dengan tombol tutup, Escape, zoom, tautan Google Drive, deskripsi, dan pesan kegagalan akses foto.
- `src/services/apiService.ts`: normalisasi `initial_photo_id` untuk temuan LIVE dan `photo_id` untuk follow-up.
- `src/components/admin/AbnormalitiesManager.tsx`: thumbnail memakai URL normalisasi, pesan error LIVE dan tombol coba lagi, tidak fallback diam-diam ke mock.
- `src/components/operator/InspectionDetailModal.tsx`: preview foto memakai resolver konsisten.
- `src/components/operator/OperatorFollowupsView.tsx`: saat LIVE gagal tidak menampilkan data mock.
- `src/components/admin/AuditTrailView.tsx`: saat LIVE gagal/hasil kosong tidak menampilkan log mock, pesan error terlihat.
- `src/services/schemaAdapter.ts`: konsistensi normalisasi foto.

## Temuan audit lanjutan (belum selesai)
1. Banyak komponen lain masih mereferensikan `MockDatabase`; audit integrasi seluruh modul diperlukan sebelum klaim bebas dummy.
2. `DriveService.gs` menggunakan `ANYONE_WITH_LINK` untuk foto baru: berpotensi mengekspos foto internal; jangan aktifkan upload produksi sebelum desain akses privat disetujui.
3. `DriveService.gs` mengembalikan ID foto simulasi pada Safe Mode; lapisan write guard harus tetap aktif.
4. Foto Drive privat mungkin tidak dapat ditampilkan melalui `<img>` lintas akun. Solusi produksi memerlukan endpoint image proxy terautentikasi, otorisasi per foto, serta kontrol cache; jangan menjadikan file publik semata untuk memperbaiki preview.
5. Data historis `FINDINGS` V1 memakai kolom berbeda; sebagian ID foto lama berada pada kolom H, bukan `initial_photo_id` kolom J. Diperlukan adapter legacy di GAS agar semua foto historis tampil.
6. Pengujian integrasi ke Google Sheets, Google Drive, dan login produksi tidak dilakukan; source ini belum dinyatakan siap produksi.

## Uji penerimaan yang diperlukan
- Buka temuan dengan `initial_photo_id` berupa Drive ID, URL Drive, dan data URI.
- Uji file Drive yang tidak dapat diakses: pesan kegagalan harus tampil, bukan gambar rusak.
- Uji temuan historis V1 dengan foto pada kolom H setelah backend compatibility adapter tersedia.
- Uji temuan kosong dan error jaringan: tidak boleh berubah menjadi data dummy.
- Uji di desktop dan ponsel; modal dapat ditutup dengan Escape/tombol/klik backdrop.
- Pertahankan `CONFIG.SAFE_MODE=true` selama uji read-only.
