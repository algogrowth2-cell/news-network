'use client';
import { useEffect, useState } from 'react';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { NETWORK_SITES } from '@/lib/portals';
import { EMPTY_SOCIAL, normalizeSocial, socialFor, type SocialSet } from '@/lib/useSiteSocial';

type FieldKey = keyof SocialSet;

const FIELDS: { key: FieldKey; label: string; ph: string; color: string; icon: string }[] = [
  { key: 'facebook', label: 'Facebook पेज', ph: 'https://facebook.com/yourpage', color: '#1877F2', icon: 'f' },
  { key: 'instagram', label: 'Instagram', ph: 'https://instagram.com/yourpage', color: '#E4405F', icon: '📷' },
  { key: 'twitter', label: 'X (Twitter)', ph: 'https://x.com/yourpage', color: '#000000', icon: '𝕏' },
  { key: 'youtube', label: 'YouTube चैनल', ph: 'https://youtube.com/@yourchannel', color: '#FF0000', icon: '▶' },
  { key: 'whatsappChannel', label: 'WhatsApp चैनल / ब्रॉडकास्ट', ph: 'https://whatsapp.com/channel/xxxx', color: '#25D366', icon: '💬' },
  { key: 'telegram', label: 'Telegram चैनल', ph: 'https://t.me/yourchannel', color: '#229ED9', icon: '✈' }
];

const CSS = `
.sl{min-height:100vh;background:var(--bg-020617);color:var(--fg-e2e8f0);padding:24px;font-family:system-ui,-apple-system,'Noto Sans Devanagari',sans-serif}
.sl-wrap{max-width:820px;margin:0 auto}
.sl-h{font-size:23px;font-weight:800;color:var(--fg-fff,#fff);margin:0}
.sl-sub{color:var(--fg-94a3b8);font-size:13px;margin:5px 0 0;line-height:1.55}
.sl-portal{background:var(--bg-0f172a);border:1px solid var(--bd-1e293b);border-radius:14px;padding:16px 18px;margin:18px 0}
.sl-portal label{display:block;font-size:12px;font-weight:700;letter-spacing:.05em;color:var(--fg-94a3b8);margin:0 0 8px;text-transform:uppercase}
.sl-sel{width:100%;background:var(--bg-162238);color:var(--fg-ffffff,#fff);border:1.5px solid var(--bd-27354f);border-radius:10px;padding:12px 14px;font-size:15px;font-weight:700;outline:none;cursor:pointer}
.sl-card{background:var(--bg-0f172a);border:1px solid var(--bd-1e293b);border-radius:14px;padding:8px 18px 18px}
.sl-row{display:flex;align-items:center;gap:12px;padding:14px 0;border-bottom:1px solid var(--bd-1e293b)}
.sl-row:last-child{border-bottom:none}
.sl-ic{width:42px;height:42px;border-radius:11px;display:flex;align-items:center;justify-content:center;color:#fff;font-size:18px;font-weight:800;flex-shrink:0}
.sl-body{flex:1;min-width:0}
.sl-lbl{font-size:13.5px;font-weight:700;color:var(--fg-fff,#fff);margin:0 0 5px}
.sl-in{width:100%;background:var(--bg-162238);color:var(--fg-ffffff,#fff);border:1px solid var(--bd-27354f);border-radius:9px;padding:9px 12px;font-size:13.5px;outline:none;box-sizing:border-box;font-family:inherit}
.sl-in:focus{border-color:#ea580c}
.sl-open{color:#ea580c;font-size:12px;text-decoration:none;white-space:nowrap;flex-shrink:0;font-weight:600}
.sl-open.off{color:#475569;pointer-events:none}
.sl-bar{position:sticky;bottom:0;background:var(--bg-020617);border-top:1px solid var(--bd-1e293b);padding:14px 2px;margin-top:8px;display:flex;gap:12px;align-items:center;flex-wrap:wrap}
.sl-save{background:#10b981;color:#fff;border:none;border-radius:10px;padding:12px 28px;font-weight:800;font-size:14.5px;cursor:pointer}
.sl-save:disabled{opacity:.6;cursor:not-allowed}
.sl-copy{background:transparent;color:var(--fg-94a3b8);border:1px solid var(--bd-334155);border-radius:10px;padding:12px 16px;font-weight:600;font-size:13px;cursor:pointer}
.sl-msg{font-size:13.5px;font-weight:600}
@media(max-width:560px){.sl{padding:14px}.sl-row{flex-wrap:wrap}.sl-open{order:3}}
`;

export default function AdminSocialLinks() {
  const [slug, setSlug] = useState(NETWORK_SITES[0].slug);
  const [data, setData] = useState<SocialSet>(EMPTY_SOCIAL);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    let alive = true;
    setLoading(true); setMsg('');
    getDoc(doc(db, 'settings', 'social'))
      .then((snap) => { if (alive) setData(socialFor(slug, (snap.exists() ? (snap.data() as any) : {})?.[slug])); })
      .catch(() => alive && setData(EMPTY_SOCIAL))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [slug]);

  const set = (k: FieldKey, v: string) => setData((d) => ({ ...d, [k]: v }));

  const save = async () => {
    setSaving(true); setMsg('');
    try {
      const clean = normalizeSocial(data);
      await setDoc(doc(db, 'settings', 'social'), { [slug]: clean, updatedAt: serverTimestamp() }, { merge: true });
      setMsg('✓ सेव हो गया — इस पोर्टल के फुटर में ~1 मिनट में लागू।');
    } catch (e: any) {
      setMsg('✕ सेव नहीं हुआ: ' + (e?.message || ''));
    }
    setSaving(false);
  };

  // Doosre portal se copy (jaise ek jaise links jaldi bhar sakein)
  const copyFrom = async () => {
    const from = prompt('किस पोर्टल से कॉपी करें? slug डालें:\n' + NETWORK_SITES.map((s) => s.slug).join(', '));
    if (!from) return;
    try {
      const snap = await getDoc(doc(db, 'settings', 'social'));
      const all: any = snap.exists() ? snap.data() : {};
      if (!all[from]) { setMsg('✕ उस पोर्टल के लिंक नहीं मिले।'); return; }
      setData(normalizeSocial(all[from]));
      setMsg('↧ कॉपी हो गया — अब सेव करें।');
    } catch { setMsg('✕ कॉपी नहीं हुआ।'); }
  };

  const portalName = NETWORK_SITES.find((s) => s.slug === slug)?.name || slug;

  return (
    <div className="sl">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="sl-wrap">
        <h1 className="sl-h">🔗 सोशल मीडिया व चैनल लिंक</h1>
        <p className="sl-sub">हर पोर्टल के अपने अलग लिंक। जो पोर्टल चुनेंगे, उसके फुटर में वही लिंक खुलेंगे। पूरा URL डालें (https:// के साथ)।</p>

        <div className="sl-portal">
          <label>पोर्टल चुनें</label>
          <select className="sl-sel" value={slug} onChange={(e) => setSlug(e.target.value)}>
            {NETWORK_SITES.map((s) => <option key={s.slug} value={s.slug}>{s.name}</option>)}
          </select>
        </div>

        {loading ? (
          <div className="sl-card" style={{ padding: 24 }}>लोड हो रहा है…</div>
        ) : (
          <div className="sl-card">
            {FIELDS.map((f) => (
              <div className="sl-row" key={f.key}>
                <div className="sl-ic" style={{ background: f.color }}>{f.icon}</div>
                <div className="sl-body">
                  <div className="sl-lbl">{f.label}</div>
                  <input className="sl-in" value={data[f.key]} onChange={(e) => set(f.key, e.target.value)} placeholder={f.ph} />
                </div>
                <a className={`sl-open ${data[f.key] ? '' : 'off'}`} href={data[f.key] || '#'} target="_blank" rel="noreferrer">खोलें ↗</a>
              </div>
            ))}
          </div>
        )}

        <div className="sl-bar">
          <button className="sl-save" onClick={save} disabled={saving || loading}>{saving ? 'सेव हो रहा है…' : `💾 ${portalName} के लिंक सेव करें`}</button>
          <button className="sl-copy" onClick={copyFrom}>दूसरे पोर्टल से कॉपी करें</button>
          {msg && <span className="sl-msg" style={{ color: msg.startsWith('✓') || msg.startsWith('↧') ? '#10b981' : '#f87171' }}>{msg}</span>}
        </div>
      </div>
    </div>
  );
}
