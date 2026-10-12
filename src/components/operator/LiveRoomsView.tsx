import React, { useEffect, useState } from 'react';
import { ApiService } from '../../services/apiService';
import { useAuth } from '../../context/AuthContext';

export const LiveRoomsView: React.FC = () => {
  const { token } = useAuth();
  const [rooms, setRooms] = useState<any[]>([]);
  const [room, setRoom] = useState('');
  const [detail, setDetail] = useState<any>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [updated, setUpdated] = useState('');
  useEffect(() => {
    if (!token) return;
    let active = true;
    const refresh = async () => {
      try {
        const result = await ApiService.getRooms(token);
        if (active) { setRooms(result); setError(''); setUpdated(new Date().toLocaleTimeString('id-ID')); }
      } catch (e: any) { if (active) setError(e.message || 'Gagal membaca ruangan dari server'); }
      finally { if (active) setLoading(false); }
    };
    refresh(); const id = setInterval(refresh, 30000);
    return () => { active = false; clearInterval(id); };
  }, [token]);
  useEffect(() => {
    if (!room || !token) return;
    let active = true;
    const refresh = async () => {
      try { const r = await ApiService.getRoomData(token, room); if (active) { setDetail(r); setError(''); } }
      catch(e:any) { if (active) setError(e.message || 'Gagal memuat checklist'); }
    };
    refresh(); const id = setInterval(refresh,30000);
    return () => {active=false;clearInterval(id)};
  }, [room,token]);
  return <div className="space-y-5 pb-24">
    <div className="bg-white border rounded-2xl p-5"><h2 className="text-xl font-bold">Pemeriksaan Ruangan — Data Google Sheets</h2><p className="text-xs text-stone-500">Pembaruan terakhir: {updated || 'Belum tersedia'} · Otomatis setiap 30 detik</p></div>
    {error && <div role="alert" className="bg-rose-50 border border-rose-200 text-rose-800 rounded-xl p-4">{error}. Tidak ada data simulasi yang ditampilkan.</div>}
    {loading && <p>Memuat data asli dari backend...</p>}
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">{rooms.map((r:any) => <button key={r.name} onClick={()=>{setRoom(r.name);setDetail(null)}} className={'text-left p-4 rounded-xl border '+(room===r.name?'border-rose-700 bg-rose-50':'bg-white')}><strong>{r.name}</strong><p className="text-sm text-stone-500">{r.activeAssets} unit aktif</p></button>)}</div>
    {room && <section className="bg-white rounded-2xl border p-5 space-y-3"><h3 className="font-bold text-lg">{room}</h3>{!detail?<p>Memuat checklist...</p>:<><p className="text-sm">Selesai: {detail.inspectedCount}/{detail.totalCount}</p>{detail.assets.map((a:any)=><div key={a.id} className="border rounded-xl p-4"><div className="flex justify-between"><strong>{a.label || a.name}</strong><span className="text-xs">{a.isInspectedThisWeek?'Sudah diperiksa':'Belum diperiksa'}</span></div><p className="text-xs text-stone-500">{a.id} · {a.name}</p><ol className="list-decimal ml-5 mt-2 text-sm">{a.checks.map((c:any)=><li key={c.id}>{c.question}</li>)}</ol></div>)}</>}<p className="text-xs text-amber-700">Penyimpanan belum diaktifkan pada tampilan LIVE ini selama Safe Mode backend aktif.</p></section>}
  </div>;
};
