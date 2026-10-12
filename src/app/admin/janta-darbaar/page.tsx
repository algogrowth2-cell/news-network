'use client';
import { useEffect, useState, useCallback } from 'react';

interface Sub {
  id: string;
  title: string;
  description: string;
  category: string;
  location: string;
  city: string;
  state: string;
  photos: string[];
  videos: string[];
  site: string;
  submitterName: string;
  submitterPhone: string;
  status: string;
  articleId: string;
  createdAtMs: number;
}

const CSS = `
.jx{min-height:100vh;background:var(--bg-020617,#020617);color:var(--fg-e2e8f0,#e2e8f0);padding:24px;font-family:system-ui,-apple-system,sans-serif}
.jx-wrap{max-width:1100px;margin:0 auto}
.jx-h{font-size:24px;font-weight:800;color:var(--fg-fff,#fff);margin:0}
.jx-sub{color:var(--fg-94a3b8,#94a3b8);font-size:13px;margin:4px 0 0}
.jx-tabs{display:flex;gap:8px;margin:18px 0}
.jx-tab{background:var(--bg-0f172a,#0f172a);border:1px solid var(--bd-1e293b,#1e293b);color:var(--fg-cbd5e1,#cbd5e1);border-radius:10px;padding:8px 16px;font-size:13px;font-weight:600;cursor:pointer}
.jx-tab.on{background:#ea580c;border-color:#ea580c;color:#fff}
.jx-card{background:var(--bg-0f172a,#0f172a);border:1px solid var(--bd-1e293b,#1e293b);border-radius:14px;padding:18px;margin-bottom:16px}
.jx-top{display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap}
.jx-title{font-size:17px;font-weight:700;color:var(--fg-fff,#fff);margin:0}
.jx-meta{font-size:12.5px;color:var(--fg-94a3b8,#94a3b8);margin:6px 0 0}
.jx-pill{display:inline-block;font-size:11px;font-weight:700;padding:3px 10px;border-radius:20px}
.jx-pending{background:rgba(234,179,8,.15);color:#eab308}
.jx-approved{background:rgba(16,185,129,.15);color:#10b981}
.jx-rejected{background:rgba(248,113,113,.15);color:#f87171}
.jx-desc{margin:12px 0;font-size:14px;color:var(--fg-cbd5e1,#cbd5e1);line-height:1.6;white-space:pre-wrap}
.jx-media{display:flex;flex-wrap:wrap;gap:10px;margin:12px 0}
.jx-m{width:120px;height:120px;border-radius:10px;overflow:hidden;border:1px solid var(--bd-1e293b,#1e293b);background:#000}
.jx-m img,.jx-m video{width:100%;height:100%;object-fit:cover}
.jx-btns{display:flex;gap:10px;margin-top:8px}
.jx-approve{background:#10b981;color:#fff;border:none;border-radius:9px;padding:10px 20px;font-weight:700;font-size:13.5px;cursor:pointer}
.jx-reject{background:transparent;color:#f87171;border:1px solid #7f1d1d;border-radius:9px;padding:10px 20px;font-weight:700;font-size:13.5px;cursor:pointer}
.jx-btns button:disabled{opacity:.5;cursor:not-allowed}
.jx-empty{text-align:center;color:#64748b;padding:50px 10px;font-size:14px}
.jx-link{color:#ea580c;font-size:12.5px;text-decoration:none}
@media(max-width:560px){.jx{padding:14px}.jx-m{width:90px;height:90px}}
`;

export default function AdminJantaDarbaar() {
  const [items, setItems] = useState<Sub[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setErr('');
    try {
      const r = await fetch('/api/admin/janta');
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || 'failed');
      setItems(j.items || []);
    } catch (e: any) {
      setErr('डेटा लोड नहीं हुआ' + (e?.message ? ` (${e.message})` : ''));
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const act = async (id: string, action: 'approve' | 'reject') => {
    if (action === 'reject' && !confirm('यह खबर अस्वीकार करें? यह वेबसाइट पर कभी नहीं दिखेगी।')) return;
    setBusy(id);
    try {
      const r = await fetch('/api/admin/janta', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, action }) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || 'failed');
      setItems((list) => list.map((x) => (x.id === id ? { ...x, status: action === 'approve' ? 'approved' : 'rejected', articleId: j.articleId || x.articleId } : x)));
    } catch (e: any) {
      alert('नहीं हो पाया: ' + (e?.message || ''));
    }
    setBusy(null);
  };

  const shown = items.filter((x) => x.status === tab);
  const counts = {
    pending: items.filter((x) => x.status === 'pending').length,
    approved: items.filter((x) => x.status === 'approved').length,
    rejected: items.filter((x) => x.status === 'rejected').length
  };

  return (
    <div className="jx">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="jx-wrap">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <h1 className="jx-h">📢 जनता दरबार — नागरिक खबरें</h1>
            <p className="jx-sub">उपयोगकर्ताओं द्वारा भेजी गई खबरें। सत्यापित करें — स्वीकृत खबर वेबसाइट पर लाइव हो जाएगी।</p>
          </div>
          <button className="jx-tab" onClick={load}>↻ रिफ्रेश</button>
        </div>

        <div className="jx-tabs">
          {(['pending', 'approved', 'rejected'] as const).map((t) => (
            <button key={t} className={`jx-tab ${tab === t ? 'on' : ''}`} onClick={() => setTab(t)}>
              {t === 'pending' ? 'समीक्षा में' : t === 'approved' ? 'स्वीकृत' : 'अस्वीकृत'} ({counts[t]})
            </button>
          ))}
        </div>

        {err && <div className="jx-card" style={{ color: '#f87171' }}>{err}</div>}

        {loading ? (
          <div className="jx-empty">लोड हो रहा है...</div>
        ) : shown.length === 0 ? (
          <div className="jx-empty">इस सूची में अभी कोई खबर नहीं है।</div>
        ) : (
          shown.map((s) => (
            <div className="jx-card" key={s.id}>
              <div className="jx-top">
                <div style={{ flex: 1, minWidth: 240 }}>
                  <h3 className="jx-title">{s.title}</h3>
                  <p className="jx-meta">
                    भेजा: <b>{s.submitterName || 'नागरिक'}</b> ({s.submitterPhone || '—'}) • पोर्टल: {s.site}
                    {s.category ? ` • ${s.category}` : ''}
                    {(s.city || s.state || s.location) ? ` • ${[s.location, s.city, s.state].filter(Boolean).join(', ')}` : ''}
                  </p>
                </div>
                <span className={`jx-pill ${s.status === 'pending' ? 'jx-pending' : s.status === 'approved' ? 'jx-approved' : 'jx-rejected'}`}>
                  {s.status === 'pending' ? 'समीक्षा में' : s.status === 'approved' ? 'स्वीकृत ✓' : 'अस्वीकृत'}
                </span>
              </div>

              <div className="jx-desc">{s.description}</div>

              {(s.photos.length > 0 || s.videos.length > 0) && (
                <div className="jx-media">
                  {s.photos.map((p) => (
                    <a className="jx-m" key={p} href={p} target="_blank" rel="noreferrer"><img src={p} alt="" /></a>
                  ))}
                  {s.videos.map((v) => (
                    <a className="jx-m" key={v} href={v} target="_blank" rel="noreferrer"><video src={v} muted /></a>
                  ))}
                </div>
              )}

              {s.status === 'pending' ? (
                <div className="jx-btns">
                  <button className="jx-approve" disabled={busy === s.id} onClick={() => act(s.id, 'approve')}>
                    {busy === s.id ? '...' : '✓ स्वीकार करें और प्रकाशित करें'}
                  </button>
                  <button className="jx-reject" disabled={busy === s.id} onClick={() => act(s.id, 'reject')}>✕ अस्वीकार</button>
                </div>
              ) : s.status === 'approved' && s.articleId ? (
                <a className="jx-link" href={`/article/${s.articleId}`} target="_blank" rel="noreferrer">प्रकाशित खबर देखें →</a>
              ) : null}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
