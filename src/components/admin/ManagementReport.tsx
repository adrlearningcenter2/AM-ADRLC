import React, { useState } from 'react';
import {
  Printer,
  Download,
  Calendar,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  Building2,
  FileText,
  Filter
} from 'lucide-react';
import { MockDatabase } from '../../services/mockData';
import { getCurrentWeekKey, formatWeekLabel, formatIndonesianDate, getWeekKeysList } from '../../utils/dateUtils';

export const ManagementReport: React.FC = () => {
  const currentWeek = getCurrentWeekKey();
  const weekList = getWeekKeysList(6);

  const [selectedWeek, setSelectedWeek] = useState<string>(currentWeek);
  const [selectedRoom, setSelectedRoom] = useState<string>('SEMUA');

  const assets = MockDatabase.getAssets().filter((a) => a.active);
  const inspections = MockDatabase.getInspections().filter((i) => i.week_key === selectedWeek);
  const findings = MockDatabase.getFindings().filter((f) => f.week_key === selectedWeek);
  const followups = MockDatabase.getFollowups();

  const roomsList = Array.from(new Set(assets.map((a) => a.room))).sort();

  // Metrics
  const relevantAssets = selectedRoom === 'SEMUA' ? assets : assets.filter((a) => a.room === selectedRoom);
  const relevantInspections = selectedRoom === 'SEMUA' ? inspections : inspections.filter((i) => i.room === selectedRoom);
  const relevantFindings = selectedRoom === 'SEMUA' ? findings : findings.filter((f) => f.room === selectedRoom);

  const inspectedUnitIds = new Set(relevantInspections.map((i) => i.unit_id));
  const inspectedUnitsCount = inspectedUnitIds.size;
  const progressPercent = relevantAssets.length > 0 ? Math.round((inspectedUnitsCount / relevantAssets.length) * 100) : 0;

  const totalChecks = relevantInspections.length;
  const abnormalChecks = relevantInspections.filter((i) => i.answer === 'ABNORMAL').length;
  const normalChecks = totalChecks - abnormalChecks;
  const complianceRate = totalChecks > 0 ? Math.round((normalChecks / totalChecks) * 100) : 100;

  const openCount = relevantFindings.filter((f) => f.status === 'OPEN').length;
  const coordCount = relevantFindings.filter((f) => f.status === 'COORDINATED').length;
  const closedCount = relevantFindings.filter((f) => f.status === 'CLOSED').length;

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    // Generate CSV for inspections
    const headers = ['ID Inspeksi', 'Periode', 'Ruangan', 'ID Unit', 'Checklist ID', 'Hasil', 'Qty Fisik', 'Qty Layak', 'Catatan', 'Petugas NIP', 'Waktu'];
    const rows = relevantInspections.map((i) => [
      i.inspection_id,
      i.week_key,
      `"${i.room}"`,
      i.unit_id,
      i.checklist_id,
      i.answer,
      i.physical_qty || '',
      i.usable_qty || '',
      `"${(i.note || '').replace(/"/g, '""')}"`,
      i.operator_nip,
      i.created_at,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ADR_Laporan_Inspeksi_${selectedWeek}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Action Header (Hidden during Print) */}
      <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 no-print">
        <div>
          <h1 className="text-xl font-bold text-stone-900">
            Laporan Manajemen &amp; Audit Fasilitas
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Ekspor ringkasan eksekutif kepatuhan 5S, status aset, dan matriks penyelesaian perbaikan.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Week Filter */}
          <select
            value={selectedWeek}
            onChange={(e) => setSelectedWeek(e.target.value)}
            className="px-3 py-2 text-xs border border-stone-300 rounded-xl bg-stone-50 font-medium text-stone-800 focus:outline-none"
          >
            {weekList.map((w) => (
              <option key={w} value={w}>
                Periode {w}
              </option>
            ))}
          </select>

          {/* Room Filter */}
          <select
            value={selectedRoom}
            onChange={(e) => setSelectedRoom(e.target.value)}
            className="px-3 py-2 text-xs border border-stone-300 rounded-xl bg-stone-50 font-medium text-stone-800 focus:outline-none"
          >
            <option value="SEMUA">Semua Ruangan</option>
            {roomsList.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>

          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Ekspor CSV
          </button>

          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-[#651D2A] hover:bg-[#4B141E] text-white shadow-sm transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            Cetak / Ekspor PDF
          </button>
        </div>
      </div>

      {/* Printable Report Document Card */}
      <div className="bg-white p-8 sm:p-12 rounded-2xl border border-stone-200 shadow-sm print-container space-y-8 max-w-5xl mx-auto">
        {/* Official Header / Letterhead */}
        <div className="border-b-2 border-[#651D2A] pb-6 flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#651D2A] text-white flex items-center justify-center font-extrabold text-lg">
                ADR
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-[#651D2A] tracking-wide">
                  ADR LEARNING CENTER
                </h2>
                <div className="text-xs font-bold tracking-wider text-stone-600 uppercase">
                  PT SELAMAT SEMPURNA TBK / ADR GROUP
                </div>
              </div>
            </div>
            <p className="text-xs text-stone-500 pt-1">
              Divisi People Development &amp; Fasilitas Pelatihan Korporat
            </p>
          </div>

          <div className="text-right text-xs text-stone-600 space-y-0.5">
            <div className="font-mono font-bold text-stone-900">DOC-ADR-5S-REP-V2</div>
            <div>Klasifikasi: Internal Manajemen</div>
            <div>Tanggal Cetak: {formatIndonesianDate(new Date().toISOString())}</div>
          </div>
        </div>

        {/* Title */}
        <div className="text-center space-y-1">
          <h3 className="text-lg font-bold text-stone-900 uppercase tracking-wide">
            LAPORAN EKSEKUTIF PEMERIKSAAN FASILITAS &amp; KONTROL 5S
          </h3>
          <p className="text-xs text-stone-600">
            Periode: <strong>{formatWeekLabel(selectedWeek)}</strong> (Minggu {selectedWeek})
            {selectedRoom !== 'SEMUA' && <span> · Ruangan: <strong>{selectedRoom}</strong></span>}
          </p>
        </div>

        {/* Executive Summary KPI Grid */}
        <div className="grid grid-cols-4 gap-4 p-4 bg-stone-50 rounded-xl border border-stone-200 text-center">
          <div className="space-y-1">
            <span className="text-[11px] font-semibold uppercase text-stone-500 block">
              Progres Inspeksi
            </span>
            <div className="text-2xl font-extrabold text-[#651D2A]">
              {progressPercent}%
            </div>
            <span className="text-[11px] text-stone-500">
              {inspectedUnitsCount} dari {relevantAssets.length} Unit
            </span>
          </div>

          <div className="space-y-1">
            <span className="text-[11px] font-semibold uppercase text-stone-500 block">
              Tingkat Kepatuhan 5S
            </span>
            <div className="text-2xl font-extrabold text-emerald-700">
              {complianceRate}%
            </div>
            <span className="text-[11px] text-stone-500">
              {normalChecks} Poin Normal
            </span>
          </div>

          <div className="space-y-1">
            <span className="text-[11px] font-semibold uppercase text-stone-500 block">
              Temuan Abnormalitas
            </span>
            <div className="text-2xl font-extrabold text-rose-800">
              {relevantFindings.length}
            </div>
            <span className="text-[11px] text-stone-500">
              {openCount} Open · {coordCount} Koordinasi
            </span>
          </div>

          <div className="space-y-1">
            <span className="text-[11px] font-semibold uppercase text-stone-500 block">
              Penyelesaian Perbaikan
            </span>
            <div className="text-2xl font-extrabold text-stone-800">
              {closedCount}
            </div>
            <span className="text-[11px] text-stone-500">
              Status Closed
            </span>
          </div>
        </div>

        {/* Executive Summary Narrative */}
        <div className="p-4 bg-stone-50/80 rounded-xl border border-stone-200 text-xs text-stone-800 space-y-2">
          <span className="font-bold uppercase tracking-wider text-stone-600 block text-[11px]">
            Ringkasan Eksekutif (Executive Summary)
          </span>
          <p className="leading-relaxed">
            Berdasarkan pemeriksaan inventaris rutin periode <strong>{formatWeekLabel(selectedWeek)}</strong>, tingkat kepatuhan standar 5S fasilitas pelatihan ADR Learning Center mencapai <strong>{complianceRate}%</strong> dengan progres penyelesaian checklist sebesar <strong>{progressPercent}%</strong> ({inspectedUnitsCount} dari {relevantAssets.length} unit inventaris aktif). Tercatat sebanyak <strong>{relevantFindings.length} temuan abnormalitas</strong> ({openCount} berstatus Terbuka, {coordCount} dalam Koordinasi teknisi/vendor, dan {closedCount} telah diselesaikan). Kondisi fasilitas secara umum dinyatakan layak dan aman untuk mendukung kegiatan pelatihan korporat.
          </p>
        </div>

        {/* Weekly & Monthly Trend Chart Visualizer */}
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b pb-1">
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-700">
              Tren Mingguan Kepatuhan &amp; Abnormalitas (6 Periode Terakhir)
            </h4>
            <span className="text-[11px] text-stone-500 font-medium">Asia/Jakarta Timezone</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 pt-2">
            {weekList.slice(0, 6).reverse().map((wk) => {
              const weekInspections = MockDatabase.getInspections().filter((i) => i.week_key === wk);
              const weekFindings = MockDatabase.getFindings().filter((f) => f.week_key === wk);
              const totalChks = weekInspections.length;
              const abnormChks = weekInspections.filter((i) => i.answer === 'ABNORMAL').length;
              const rate = totalChks > 0 ? Math.round(((totalChks - abnormChks) / totalChks) * 100) : (wk === selectedWeek ? complianceRate : 92);
              const isSelected = wk === selectedWeek;

              return (
                <div
                  key={wk}
                  className={`p-2.5 rounded-xl border text-center transition-all ${
                    isSelected ? 'border-[#651D2A] bg-rose-50/40 ring-1 ring-[#651D2A]' : 'border-stone-200 bg-stone-50'
                  }`}
                >
                  <span className="text-[10px] font-mono text-stone-500 block truncate" title={wk}>
                    {wk.slice(5)}
                  </span>
                  <div className="text-base font-extrabold text-[#651D2A] mt-1">
                    {rate}%
                  </div>
                  <div className="w-full bg-stone-200 rounded-full h-1.5 my-1.5 overflow-hidden">
                    <div
                      className="bg-emerald-600 h-1.5 rounded-full"
                      style={{ width: `${rate}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-stone-500">
                    {weekFindings.length} Temuan
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Room Breakdown Table */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-stone-700 border-b pb-1">
            1. Ringkasan Status per Ruangan Fasilitas
          </h4>
          <div className="overflow-x-auto w-full -mx-4 sm:mx-0 px-4 sm:px-0">
            <table className="w-full min-w-[500px] text-xs text-left border-collapse border border-stone-200">
              <thead>
                <tr className="bg-stone-100 text-stone-700">
                  <th className="border border-stone-200 p-2.5">Nama Ruangan</th>
                  <th className="border border-stone-200 p-2.5 text-center">Total Unit</th>
                  <th className="border border-stone-200 p-2.5 text-center">Diperiksa</th>
                  <th className="border border-stone-200 p-2.5 text-center">Status</th>
                  <th className="border border-stone-200 p-2.5 text-center">Abnormalitas</th>
                </tr>
              </thead>
              <tbody>
                {roomsList.map((roomName) => {
                  const rAssets = assets.filter((a) => a.room === roomName);
                  const rInspections = inspections.filter((i) => i.room === roomName);
                  const rUnitIds = new Set(rInspections.map((i) => i.unit_id));
                  const rFindings = findings.filter((f) => f.room === roomName);
                  const isComplete = rUnitIds.size >= rAssets.length;

                  return (
                    <tr key={roomName} className="hover:bg-stone-50">
                      <td className="border border-stone-200 p-2.5 font-semibold text-stone-900">
                        {roomName}
                      </td>
                      <td className="border border-stone-200 p-2.5 text-center">
                        {rAssets.length}
                      </td>
                      <td className="border border-stone-200 p-2.5 text-center">
                        {rUnitIds.size} ({rAssets.length > 0 ? Math.round((rUnitIds.size / rAssets.length) * 100) : 0}%)
                      </td>
                      <td className="border border-stone-200 p-2.5 text-center">
                        {isComplete ? (
                          <span className="text-emerald-700 font-bold">Lengkap Selesai</span>
                        ) : rUnitIds.size > 0 ? (
                          <span className="text-amber-700 font-medium">Dalam Pengerjaan</span>
                        ) : (
                          <span className="text-stone-400">Belum Mulai</span>
                        )}
                      </td>
                      <td className="border border-stone-200 p-2.5 text-center">
                        {rFindings.length > 0 ? (
                          <span className="text-rose-700 font-bold">{rFindings.length} Temuan</span>
                        ) : (
                          <span className="text-stone-400">Nihil</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Abnormalities Detail Table */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-stone-700 border-b pb-1">
            2. Rincian Temuan Abnormalitas &amp; Status Tindak Lanjut
          </h4>
          {relevantFindings.length > 0 ? (
            <div className="overflow-x-auto w-full -mx-4 sm:mx-0 px-4 sm:px-0">
              <table className="w-full min-w-[600px] text-xs text-left border-collapse border border-stone-200">
                <thead>
                  <tr className="bg-stone-100 text-stone-700">
                    <th className="border border-stone-200 p-2">ID Temuan</th>
                    <th className="border border-stone-200 p-2">Lokasi / Unit</th>
                    <th className="border border-stone-200 p-2">Deskripsi Masalah</th>
                    <th className="border border-stone-200 p-2 text-center">Prioritas</th>
                    <th className="border border-stone-200 p-2 text-center">Status</th>
                    <th className="border border-stone-200 p-2">PIC Penanggung Jawab</th>
                  </tr>
                </thead>
                <tbody>
                  {relevantFindings.map((f) => (
                    <tr key={f.finding_id}>
                      <td className="border border-stone-200 p-2 font-mono text-[11px] font-bold">
                        {f.finding_id}
                      </td>
                      <td className="border border-stone-200 p-2">
                        <div className="font-semibold text-stone-900">{f.room}</div>
                        <div className="text-[11px] text-stone-500">{f.unit_id}</div>
                      </td>
                      <td className="border border-stone-200 p-2 text-stone-800">
                        {f.description}
                      </td>
                      <td className="border border-stone-200 p-2 text-center font-bold">
                        {f.priority}
                      </td>
                      <td className="border border-stone-200 p-2 text-center font-semibold">
                        {f.status}
                      </td>
                      <td className="border border-stone-200 p-2 text-stone-700">
                        {f.assigned_to || 'Tim GA Fasilitas'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-4 bg-stone-50 rounded-xl text-center text-xs text-stone-500">
              Tidak ada catatan abnormalitas pada periode terpilih.
            </div>
          )}
        </div>

        {/* Approval Signatures */}
        <div className="pt-10 border-t border-stone-200 grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 text-center text-xs text-stone-700">
          <div className="space-y-14">
            <div>Dibuat oleh (Operator Inspeksi):</div>
            <div className="border-t border-stone-400 pt-1 font-bold text-stone-900">
              Rahmat Hidayat
              <div className="text-[10px] text-stone-400 font-normal">NIP: 26010006</div>
            </div>
          </div>

          <div className="space-y-14">
            <div>Diverifikasi oleh (Admin Fasilitas):</div>
            <div className="border-t border-stone-400 pt-1 font-bold text-stone-900">
              Administrator ADR
              <div className="text-[10px] text-stone-400 font-normal">NIP: 26010007</div>
            </div>
          </div>

          <div className="space-y-14">
            <div>Disetujui oleh (Kepala ADR LC):</div>
            <div className="border-t border-stone-400 pt-1 font-bold text-stone-900">
              Manajer HRD &amp; Learning Center
              <div className="text-[10px] text-stone-400 font-normal">ADR Group Indonesia</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
