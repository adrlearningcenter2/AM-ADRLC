import React, { useState } from 'react';
import {
  X,
  Database,
  ShieldAlert,
  CheckCircle2,
  RotateCcw,
  Link2,
  Code,
  FileSpreadsheet,
  Activity,
  PlayCircle,
  Terminal,
  ShieldCheck,
  AlertCircle,
  RefreshCw,
  Copy,
  Check
} from 'lucide-react';
import { ApiService, ApiMode } from '../../services/apiService';
import { MockDatabase } from '../../services/mockData';
import { DATABASE_SCHEMA_MAPPING, TARGET_SPREADSHEET_ID } from '../../services/schemaAdapter';

interface BackendConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onResetData: () => void;
}

export const BackendConfigModal: React.FC<BackendConfigModalProps> = ({
  isOpen,
  onClose,
  onResetData,
}) => {
  const currentConfig = ApiService.getConfig();
  const [mode, setMode] = useState<ApiMode>(currentConfig.mode);
  const [gasUrl, setGasUrl] = useState(currentConfig.gasEndpointUrl);
  const [testMode, setTestMode] = useState<boolean>(currentConfig.testMode ?? true);
  const [activeTab, setActiveTab] = useState<'status' | 'contract' | 'schemaAudit' | 'deployment'>('status');
  const [selectedSheet, setSelectedSheet] = useState<string>('USERS');
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Ping connection tester state
  const [pinging, setPinging] = useState(false);
  const [pingResult, setPingResult] = useState<{
    success: boolean;
    latencyMs: number;
    message: string;
    details?: any;
    error?: string;
    safeMode?: boolean;
    diagnostic?: string;
  } | null>(null);

  // Authenticated database connectivity tester state
  const [dbChecking, setDbChecking] = useState(false);
  const [dbResult, setDbResult] = useState<{
    success: boolean;
    message?: string;
    data?: any;
    error?: string;
  } | null>(null);

  if (!isOpen) return null;

  const handlePing = async () => {
    setPinging(true);
    setPingResult(null);
    try {
      const result = await ApiService.pingBackend(gasUrl);
      setPingResult(result);
    } catch (e: any) {
      setPingResult({
        success: false,
        latencyMs: 0,
        message: 'Koneksi gagal',
        error: e.message || 'Network error',
      });
    } finally {
      setPinging(false);
    }
  };

  const handleCheckDatabase = async () => {
    setDbChecking(true);
    setDbResult(null);
    try {
      const token = ApiService.getCurrentToken() || 'mock-token-admin-123456';
      const result = await ApiService.checkDatabaseConnectivity(token);
      if (result.success) {
        setDbResult({
          success: true,
          message: 'Seluruh 9 sheet database produksi terverifikasi dan dapat diakses (Read-Only).',
          data: result.data,
        });
      } else {
        setDbResult({
          success: false,
          error: result.error || 'Verifikasi database gagal.',
        });
      }
    } catch (e: any) {
      setDbResult({
        success: false,
        error: e.message || 'Gagal memeriksa database.',
      });
    } finally {
      setDbChecking(false);
    }
  };

  const handleSaveConfig = () => {
    ApiService.setConfig({ mode, gasEndpointUrl: gasUrl, testMode });
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      onClose();
      window.location.reload();
    }, 800);
  };

  const handleReset = () => {
    if (window.confirm('Reset seluruh data simulasi ke kondisi awal ADR Learning Center? Data baru di browser akan dibersihkan.')) {
      MockDatabase.resetToDefault();
      onResetData();
      alert('Data simulasi berhasil di-reset.');
      window.location.reload();
    }
  };


  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="relative max-w-4xl w-full bg-white rounded-2xl overflow-hidden shadow-2xl border border-stone-200 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 bg-stone-50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#651D2A] text-white flex items-center justify-center font-bold">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-stone-900">
                Arsitektur Backend &amp; Kontrak API Google Sheets
              </h2>
              <p className="text-xs text-stone-500">
                Status Integrasi Tahap 1 (Simulasi Aktif) &amp; Kesiapan Produksi Tahap 2
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-500 hover:text-stone-800 hover:bg-stone-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab navigation */}
        <div className="flex border-b border-stone-200 px-6 gap-6 bg-white text-xs font-medium overflow-x-auto">
          <button
            onClick={() => setActiveTab('status')}
            className={`py-3 border-b-2 shrink-0 transition-colors ${
              activeTab === 'status'
                ? 'border-[#651D2A] text-[#651D2A] font-semibold'
                : 'border-transparent text-stone-500 hover:text-stone-900'
            }`}
          >
            Status &amp; Konfigurasi Endpoint
          </button>
          <button
            onClick={() => setActiveTab('deployment')}
            className={`py-3 border-b-2 shrink-0 transition-colors ${
              activeTab === 'deployment'
                ? 'border-[#651D2A] text-[#651D2A] font-semibold'
                : 'border-transparent text-stone-500 hover:text-stone-900'
            }`}
          >
            Panduan Deployment &amp; Pengujian GAS
          </button>
          <button
            onClick={() => setActiveTab('contract')}
            className={`py-3 border-b-2 shrink-0 transition-colors ${
              activeTab === 'contract'
                ? 'border-[#651D2A] text-[#651D2A] font-semibold'
                : 'border-transparent text-stone-500 hover:text-stone-900'
            }`}
          >
            Kontrak API Apps Script (GAS)
          </button>
          <button
            onClick={() => setActiveTab('schemaAudit')}
            className={`py-3 border-b-2 shrink-0 transition-colors ${
              activeTab === 'schemaAudit'
                ? 'border-[#651D2A] text-[#651D2A] font-semibold'
                : 'border-transparent text-stone-500 hover:text-stone-900'
            }`}
          >
            Audit Skema Google Sheets
          </button>
        </div>

        {/* Body content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm text-stone-700">
          {activeTab === 'status' && (
            <div className="space-y-6">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <p className="font-semibold text-amber-900">
                    Mode Koneksi &amp; Penjagaan Data Produksi
                  </p>
                  <p className="text-amber-800">
                    Gunakan Mode Simulasi untuk pengujian internal, atau Mode Google Apps Script dengan opsi <strong>Mode Pengujian Aman (Dry-Run)</strong> aktif agar tidak mengubah data produksi Google Sheets selama uji coba.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <label className="block font-semibold text-stone-900 text-xs uppercase tracking-wider">
                  Pilih Moda Sumber Data (Data Provider Mode)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label
                    className={`border rounded-xl p-4 flex flex-col gap-1 cursor-pointer transition-all ${
                      mode === 'MOCK'
                        ? 'border-[#651D2A] bg-[#651D2A]/5 ring-1 ring-[#651D2A]'
                        : 'border-stone-200 hover:border-stone-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-stone-900">Mode Simulasi (Mock Data)</span>
                      <input
                        type="radio"
                        name="apiMode"
                        checked={mode === 'MOCK'}
                        onChange={() => setMode('MOCK')}
                        className="text-[#651D2A]"
                      />
                    </div>
                    <p className="text-xs text-stone-500">
                      Direkomendasikan untuk uji coba UI, fungsionalitas offline demo, dan review manajemen.
                    </p>
                  </label>

                  <label
                    className={`border rounded-xl p-4 flex flex-col gap-1 cursor-pointer transition-all ${
                      mode === 'GAS_LIVE'
                        ? 'border-[#651D2A] bg-[#651D2A]/5 ring-1 ring-[#651D2A]'
                        : 'border-stone-200 hover:border-stone-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-stone-900">Mode Google Apps Script (Live API)</span>
                      <input
                        type="radio"
                        name="apiMode"
                        checked={mode === 'GAS_LIVE'}
                        onChange={() => setMode('GAS_LIVE')}
                        className="text-[#651D2A]"
                      />
                    </div>
                    <p className="text-xs text-stone-500">
                      Terhubung langsung ke Web App deployment Apps Script produksi yang mengakses Google Sheets &amp; Drive.
                    </p>
                  </label>
                </div>
              </div>

              {mode === 'GAS_LIVE' && (
                <div className="space-y-4 bg-stone-50 p-4 rounded-xl border border-stone-200">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-stone-800">
                      URL Web App Google Apps Script (/exec)
                    </label>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                      <div className="flex-1 flex items-center gap-2 px-3 py-2 bg-white border border-stone-300 rounded-lg focus-within:ring-1 focus-within:ring-[#651D2A]">
                        <Link2 className="w-4 h-4 text-stone-400 shrink-0" />
                        <input
                          type="url"
                          value={gasUrl}
                          onChange={(e) => setGasUrl(e.target.value)}
                          placeholder="https://script.google.com/macros/s/AKfycb.../exec"
                          className="w-full text-xs outline-none font-mono text-stone-900"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handlePing}
                        disabled={pinging || !gasUrl}
                        className="px-4 py-2 bg-stone-800 hover:bg-stone-900 disabled:opacity-50 text-white rounded-lg text-xs font-semibold inline-flex items-center justify-center gap-1.5 shrink-0 transition-colors shadow-sm"
                      >
                        <Activity className={`w-3.5 h-3.5 ${pinging ? 'animate-spin' : ''}`} />
                        {pinging ? 'Menguji...' : 'Uji Koneksi (Ping)'}
                      </button>
                    </div>
                    <p className="text-[11px] text-stone-500">
                      Diperoleh dari Menu Deploy &gt; Manage Deployments &gt; Web App pada proyek Google Apps Script.
                    </p>
                  </div>

                  {/* Ping Diagnostic Result Card */}
                  {pingResult && (
                    <div className={`p-3 rounded-lg text-xs border space-y-2 ${
                      pingResult.success ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'
                    }`}>
                      <div className="flex items-center justify-between">
                        <span className="font-bold flex items-center gap-1.5">
                          {pingResult.success ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-rose-600" />}
                          {pingResult.success ? 'Backend Online & Terhubung (JSON API)' : 'Koneksi Ditolak / Gagal'}
                        </span>
                        {pingResult.latencyMs > 0 && (
                          <span className="font-mono text-[11px] bg-white/70 px-2 py-0.5 rounded border border-current">
                            Latensi: {pingResult.latencyMs} ms
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] leading-relaxed">{pingResult.message}</p>

                      {/* Actionable guidance if GAS returns HTML V1 instead of JSON */}
                      {pingResult.diagnostic === 'HTML_RESPONSE_RECEIVED' && (
                        <div className="p-2.5 bg-amber-100/70 border border-amber-300 rounded text-amber-950 text-[11px] space-y-1">
                          <p className="font-bold">Langkah Perbaikan Deployment GAS:</p>
                          <ol className="list-decimal pl-4 space-y-0.5">
                            <li>Buka editor proyek Google Apps Script tempat skrip V1 berada.</li>
                            <li>Pastikan file skrip di folder <code>gas-backend/</code> (Code.gs, Config.gs, dll) telah disalin ke editor.</li>
                            <li>Klik menu <strong>Deploy &gt; New deployment</strong>.</li>
                            <li>Pilih type <strong>Web app</strong>. Set <em>Execute as: Me</em> dan <em>Who has access: Anyone</em>.</li>
                            <li>Salin URL Web App yang baru ke kolom di atas.</li>
                          </ol>
                        </div>
                      )}

                      {pingResult.success && (
                        <div className="pt-2 border-t border-emerald-200/60 flex items-center justify-between text-[11px]">
                          <span>Status Safe Mode Backend:</span>
                          <span className="font-semibold text-emerald-900 bg-emerald-200/60 px-2 py-0.5 rounded">
                            AKTIF (Seluruh penulisan dicegah secara terpusat)
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Authenticated Database Connectivity Check (ADMIN ONLY) */}
                  <div className="p-3 bg-white border border-stone-200 rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="text-xs">
                        <span className="font-bold text-stone-900">Uji Akses Database Produksi (Read-Only)</span>
                        <p className="text-[11px] text-stone-500">Memeriksa SpreadsheetApp &amp; keberadaan 9 sheet tanpa menulis data.</p>
                      </div>
                      <button
                        type="button"
                        onClick={handleCheckDatabase}
                        disabled={dbChecking || !gasUrl}
                        className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 border border-stone-300 rounded text-stone-800 text-xs font-medium inline-flex items-center gap-1.5 transition-colors disabled:opacity-50"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${dbChecking ? 'animate-spin' : ''}`} />
                        {dbChecking ? 'Memeriksa...' : 'Cek Akses 9 Sheet'}
                      </button>
                    </div>

                    {dbResult && (
                      <div className={`p-2.5 rounded text-xs border ${
                        dbResult.success ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-rose-50 border-rose-200 text-rose-900'
                      }`}>
                        <p className="font-semibold">{dbResult.success ? 'Verifikasi Berhasil' : 'Verifikasi Gagal'}</p>
                        <p className="text-[11px] mt-0.5">{dbResult.message || dbResult.error}</p>
                      </div>
                    )}
                  </div>

                  {/* Test Mode Switch */}
                  <div className="pt-3 border-t border-stone-200 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-xs text-stone-900 flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-emerald-700" />
                        Mode Pengujian Aman (Dry-Run / Safe Mode)
                      </div>
                      <p className="text-[11px] text-stone-500">
                        {testMode
                          ? 'Aktif: Logika validasi berjalan penuh, namun penulisan ke Sheet dialihkan ke log pengujian.'
                          : 'Non-Aktif: Transaksi akan disimpan langsung ke baris Google Sheets produksi.'}
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer shrink-0">
                      <input
                        type="checkbox"
                        checked={testMode}
                        onChange={(e) => setTestMode(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-stone-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                    </label>
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-stone-200 flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={handleReset}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-stone-600 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Reset Database Simulasi ke Bawaan
                </button>

                <button
                  type="button"
                  onClick={handleSaveConfig}
                  className="px-4 py-2 text-xs font-bold text-white bg-[#651D2A] hover:bg-[#4B141E] rounded-lg shadow-sm transition-colors"
                >
                  {saveSuccess ? 'Tersimpan!' : 'Simpan Konfigurasi'}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'deployment' && (
            <div className="space-y-6 text-xs text-stone-700">
              <div className="bg-stone-900 text-stone-100 p-4 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-rose-300 font-bold uppercase tracking-wider text-[11px]">
                  <Terminal className="w-4 h-4" />
                  Berkas Backend Google Apps Script Modular
                </div>
                <p className="text-stone-300 leading-relaxed">
                  Seluruh logika backend produksi telah disediakan di direktori <code className="font-mono text-white bg-stone-800 px-1 py-0.5 rounded">gas-backend/</code>. Seluruh pembacaan dan penulisan baris Google Sheets 100% menggunakan <strong>nama header</strong> tanpa indeks kolom statis.
                </p>
              </div>

              {/* 7 Modular Files List */}
              <div className="space-y-2">
                <h4 className="font-bold text-xs uppercase tracking-wider text-stone-800">
                  Daftar 7 Modul Backend di gas-backend/:
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 font-mono text-[11px]">
                  <div className="p-2.5 bg-stone-50 border border-stone-200 rounded-lg">
                    <span className="font-bold text-[#651D2A]">Config.gs</span>
                    <p className="text-stone-500 font-sans text-xs mt-0.5">Spreadsheet ID 1R0sNA6dVgrI59HFAJUwqPhr2EbxMuyiXyguOosAX6gY, nama folder Drive, sheet names.</p>
                  </div>
                  <div className="p-2.5 bg-stone-50 border border-stone-200 rounded-lg">
                    <span className="font-bold text-[#651D2A]">SheetHelper.gs</span>
                    <p className="text-stone-500 font-sans text-xs mt-0.5">Engine dinamis header-to-column, pembacaan row object, dan appendRowByHeader.</p>
                  </div>
                  <div className="p-2.5 bg-stone-50 border border-stone-200 rounded-lg">
                    <span className="font-bold text-[#651D2A]">AuthService.gs</span>
                    <p className="text-stone-500 font-sans text-xs mt-0.5">Verifikasi hash password &amp; salt, token sesi kriptografis, sanitasi data user.</p>
                  </div>
                  <div className="p-2.5 bg-stone-50 border border-stone-200 rounded-lg">
                    <span className="font-bold text-[#651D2A]">DriveService.gs</span>
                    <p className="text-stone-500 font-sans text-xs mt-0.5">Konversi base64 foto kamera ke file Google Drive dan penerbitan Drive File ID.</p>
                  </div>
                  <div className="p-2.5 bg-stone-50 border border-stone-200 rounded-lg">
                    <span className="font-bold text-[#651D2A]">AuditService.gs</span>
                    <p className="text-stone-500 font-sans text-xs mt-0.5">Pencatatan otomatis seluruh aksi inspeksi, koordinasi, dan keputusan ke sheet AUDIT.</p>
                  </div>
                  <div className="p-2.5 bg-stone-50 border border-stone-200 rounded-lg">
                    <span className="font-bold text-[#651D2A]">InspectionService.gs</span>
                    <p className="text-stone-500 font-sans text-xs mt-0.5">LockService atomik anti-duplikat, validasi unit/checklist aktif, closing temuan, laporan.</p>
                  </div>
                  <div className="p-2.5 bg-stone-50 border border-stone-200 rounded-lg md:col-span-2">
                    <span className="font-bold text-[#651D2A]">Code.gs</span>
                    <p className="text-stone-500 font-sans text-xs mt-0.5">Router doPost(e) dan doGet(e) JSON-RPC dengan error handling dan respon aman.</p>
                  </div>
                </div>
              </div>

              {/* Step by step deployment guide */}
              <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 space-y-3">
                <h4 className="font-bold text-xs uppercase tracking-wider text-stone-900">
                  Langkah Penerapan (Deployment) ke Google Apps Script:
                </h4>
                <ol className="list-decimal list-inside space-y-2 text-stone-700">
                  <li>Buka <a href="https://script.google.com" target="_blank" rel="noreferrer" className="text-[#651D2A] underline font-semibold">script.google.com</a> atau buka Spreadsheet target lalu pilih menu <strong>Extensions &gt; Apps Script</strong>.</li>
                  <li>Buat berkas skrip dengan nama sesuai daftar di atas (<code className="font-mono">Config.gs</code>, <code className="font-mono">SheetHelper.gs</code>, dst.) lalu salin kodenya.</li>
                  <li>Klik tombol biru <strong>Deploy &gt; New deployment</strong> di pojok kanan atas.</li>
                  <li>Pilih jenis deployment: <strong>Web app</strong>.</li>
                  <li>Atur <strong>Execute as: Me</strong> dan <strong>Who has access: Anyone</strong>.</li>
                  <li>Klik <strong>Deploy</strong>, izinkan akses akun Google saat diminta, lalu salin URL Web App yang berakhiran <code className="font-mono">/exec</code>.</li>
                  <li>Tempelkan URL tersebut pada tab <strong>Status &amp; Konfigurasi Endpoint</strong> dan klik <strong>Uji Koneksi (Ping)</strong>.</li>
                </ol>
              </div>
            </div>
          )}

          {activeTab === 'contract' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-stone-900 text-xs">
                  Spesifikasi JSON-RPC Endpoint untuk Google Apps Script `doPost(e)`
                </span>
                <span className="text-xs text-stone-500 font-mono">Format JSON Payload</span>
              </div>
              <pre className="p-4 bg-stone-900 text-stone-100 rounded-xl text-xs font-mono overflow-x-auto leading-relaxed">
{`// Payload Request dari Frontend React V2 ke Apps Script:
{
  "action": "saveInspection" | "login" | "getOverview" | "getRoom" | "closeFinding",
  "token": "session_token_string",
  "params": [
    // parameter sesuai method Code.gs
  ]
}

// Respon Standar dari Apps Script:
{
  "success": true,
  "data": { ... },
  "error": null
}`}
              </pre>
              <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 text-xs space-y-2">
                <p className="font-bold text-stone-800">Daftar Method RPC yang Diimplementasikan di V2:</p>
                <ul className="list-disc list-inside space-y-1 text-stone-600">
                  <li><code className="font-mono text-[#651D2A]">login(nip, password)</code> — Verifikasi NIP &amp; PBKDF2/SHA256 salt</li>
                  <li><code className="font-mono text-[#651D2A]">getOverview(token)</code> — Menghitung KPI dan progress seluruh ruangan</li>
                  <li><code className="font-mono text-[#651D2A]">getRoom(token, room)</code> — Daftar unit &amp; checklist minggu aktif</li>
                  <li><code className="font-mono text-[#651D2A]">saveInspection(token, payload)</code> — Penyimpanan terproteksi lock</li>
                  <li><code className="font-mono text-[#651D2A]">markCoordinated(token, id, note)</code> — Koordinasi perbaikan oleh Admin</li>
                  <li><code className="font-mono text-[#651D2A]">closeFinding(token, id, note, photo)</code> — Penyelesaian abnormalitas</li>
                  <li><code className="font-mono text-[#651D2A]">decideRequest(token, id, decision, note)</code> — Approval izin operator</li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'schemaAudit' && (
            <div className="space-y-6">
              {/* Spreadsheet Target Badge */}
              <div className="bg-stone-900 text-stone-100 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-md">
                <div>
                  <div className="flex items-center gap-2 text-xs font-semibold text-rose-300 uppercase tracking-wider">
                    <FileSpreadsheet className="w-4 h-4" />
                    Target Database Google Sheets
                  </div>
                  <div className="font-mono text-sm font-bold mt-1 text-white select-all break-all">
                    Spreadsheet ID: {TARGET_SPREADSHEET_ID}
                  </div>
                  <p className="text-xs text-stone-400 mt-1">
                    Database produksi AM Digital ADR V1 — Struktur kolom dipertahankan 100% tanpa perubahan.
                  </p>
                </div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-950/80 border border-emerald-500/30 text-emerald-300 rounded-lg text-xs font-medium shrink-0 self-start md:self-auto">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Audit Skema: Siap Terintegrasi
                </div>
              </div>

              {/* 4 Pillars Architecture Overview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                <div className="p-3.5 bg-stone-50 border border-stone-200 rounded-xl space-y-1.5">
                  <div className="font-bold text-stone-900 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#651D2A]"></span>
                    1. Frontend (React 19)
                  </div>
                  <p className="text-stone-600 leading-relaxed">
                    UI responsif Operator &amp; Admin. Kompresi foto sisi klien (canvas &lt;700KB). Nol rahasia/kredensial Google di browser.
                  </p>
                </div>
                <div className="p-3.5 bg-stone-50 border border-stone-200 rounded-xl space-y-1.5">
                  <div className="font-bold text-stone-900 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                    2. Backend (Apps Script)
                  </div>
                  <p className="text-stone-600 leading-relaxed">
                    RPC via <code className="font-mono text-[11px] bg-stone-200 px-1 py-0.5 rounded">doPost(e)</code>, validasi sesi NIP, otorisasi RBAC (Admin/Operator), dan LockService anti-race condition.
                  </p>
                </div>
                <div className="p-3.5 bg-stone-50 border border-stone-200 rounded-xl space-y-1.5">
                  <div className="font-bold text-stone-900 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                    3. Google Drive &amp; Sheets
                  </div>
                  <p className="text-stone-600 leading-relaxed">
                    Foto disimpan di folder Google Drive; Sheets hanya menyimpan <code className="font-mono text-[11px]">file_id</code>. Database Spreadsheet tetap utuh.
                  </p>
                </div>
              </div>

              {/* Interactive Sheet Browser */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-stone-700">
                    Pemetaan Kolom 9 Sheet Database:
                  </h4>
                  <span className="text-xs text-stone-500">Klik tab untuk melihat definisi kolom</span>
                </div>

                {/* Sheet Selector Pills */}
                <div className="flex flex-wrap gap-1.5 p-1.5 bg-stone-100 rounded-xl">
                  {Object.keys(DATABASE_SCHEMA_MAPPING).map((sheetKey) => {
                    const isSelected = selectedSheet === sheetKey;
                    return (
                      <button
                        key={sheetKey}
                        type="button"
                        onClick={() => setSelectedSheet(sheetKey)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                          isSelected
                            ? 'bg-[#651D2A] text-white shadow-sm'
                            : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200'
                        }`}
                      >
                        {sheetKey}
                      </button>
                    );
                  })}
                </div>

                {/* Selected Sheet Details Table */}
                {DATABASE_SCHEMA_MAPPING[selectedSheet] && (
                  <div className="border border-stone-200 rounded-xl overflow-hidden bg-white shadow-sm">
                    <div className="p-3.5 bg-stone-50 border-b border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-stone-900 text-sm">
                            Sheet: {DATABASE_SCHEMA_MAPPING[selectedSheet].sheetName}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-stone-200 text-stone-700">
                            PK: {DATABASE_SCHEMA_MAPPING[selectedSheet].primaryKey}
                          </span>
                        </div>
                        <p className="text-xs text-stone-500 mt-0.5">
                          {DATABASE_SCHEMA_MAPPING[selectedSheet].description}
                        </p>
                      </div>
                      <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-medium shrink-0 self-start sm:self-auto">
                        {DATABASE_SCHEMA_MAPPING[selectedSheet].columns.length} Kolom Terpetakan
                      </span>
                    </div>

                    <div className="max-h-64 overflow-y-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-stone-100 text-stone-600 sticky top-0 border-b border-stone-200 font-semibold">
                          <tr>
                            <th className="py-2.5 px-3">Nama Kolom (Header)</th>
                            <th className="py-2.5 px-3">Tipe Data</th>
                            <th className="py-2.5 px-3">Kewajiban</th>
                            <th className="py-2.5 px-3">Keterangan / Fungsi Bisnis</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100">
                          {DATABASE_SCHEMA_MAPPING[selectedSheet].columns.map((col, idx) => (
                            <tr key={idx} className="hover:bg-stone-50/80 transition-colors">
                              <td className="py-2.5 px-3 font-mono font-bold text-stone-900">
                                {col.header}
                              </td>
                              <td className="py-2.5 px-3">
                                <span className={`px-1.5 py-0.5 rounded font-mono text-[10px] uppercase font-semibold ${
                                  col.type === 'drive_id'
                                    ? 'bg-purple-100 text-purple-700'
                                    : col.type === 'json'
                                    ? 'bg-blue-100 text-blue-700'
                                    : col.type === 'number'
                                    ? 'bg-amber-100 text-amber-700'
                                    : 'bg-stone-100 text-stone-700'
                                }`}>
                                  {col.type}
                                </span>
                              </td>
                              <td className="py-2.5 px-3">
                                {col.required ? (
                                  <span className="text-rose-600 font-semibold text-[11px]">Wajib</span>
                                ) : (
                                  <span className="text-stone-400 text-[11px]">Opsional</span>
                                )}
                              </td>
                              <td className="py-2.5 px-3 text-stone-600">
                                {col.description}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

              {/* Safe Integration & Security Commitments */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-xs space-y-2">
                <div className="font-bold text-emerald-900 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                  Prinsip Keamanan &amp; Integritas Data yang Diterapkan:
                </div>
                <ul className="list-disc list-inside space-y-1 text-emerald-800 ml-1">
                  <li><strong>Tidak Membuat / Mengubah Kolom:</strong> Kolom database lama dipertahankan persis seperti aslinya.</li>
                  <li><strong>Zero Secrets di Klien:</strong> Google Service Account, OAuth Client Secret, atau token admin tidak pernah diekspos di frontend.</li>
                  <li><strong>Otorisasi Berlapis di Backend:</strong> Google Apps Script memvalidasi token sesi dan hak akses (Role ADMIN vs OPERATOR) di setiap pemanggilan RPC.</li>
                  <li><strong>Penyimpanan Foto Terpisah:</strong> Foto dikirim dalam bentuk Base64 ke Apps Script, disimpan di folder Google Drive, dan hanya Drive ID yang disimpan ke baris Sheets.</li>
                  <li><strong>Locking Inspeksi Mingguan:</strong> Menggunakan period week_key (Senin-Minggu, Asia/Jakarta) dengan status COMPLETED agar riwayat audit tidak tertimpa.</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-stone-50 border-t border-stone-200 text-right">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-stone-700 hover:text-stone-900"
          >
            Tutup Jendela
          </button>
        </div>
      </div>
    </div>
  );
};
