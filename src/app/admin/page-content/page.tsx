'use client';
import { useEffect, useState } from 'react';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { DEFAULT_FOR, PAGE_DOC, normalizeFor, type PageKey } from '@/lib/pageContent';

const TABS: { key: PageKey; label: string }[] = [
  { key: 'janta', label: '📣 जनता दरबार' },
  { key: 'patrakar', label: '✍️ पत्रकार' },
  { key: 'advertiser', label: '📢 विज्ञापन' },
  { key: 'matrimony', label: '💍 विवाह' },
  { key: 'shok', label: '🕯️ शोक संदेश' }
];

const CSS = `
.pc{min-height:100vh;background:var(--bg-020617,#020617);color:var(--fg-e2e8f0,#e2e8f0);padding:24px;font-family:system-ui,-apple-system,sans-serif}
.pc-wrap{max-width:900px;margin:0 auto}
.pc-h{font-size:23px;font-weight:800;color:var(--fg-fff,#fff);margin:0}
.pc-sub{color:var(--fg-94a3b8,#94a3b8);font-size:13px;margin:4px 0 0}
.pc-tabs{display:flex;gap:8px;margin:18px 0;flex-wrap:wrap}
.pc-tab{background:var(--bg-0f172a,#0f172a);border:1px solid var(--bd-1e293b,#1e293b);color:var(--fg-cbd5e1,#cbd5e1);border-radius:10px;padding:9px 18px;font-size:14px;font-weight:600;cursor:pointer}
.pc-tab.on{background:#ea580c;border-color:#ea580c;color:#fff}
.pc-card{background:var(--bg-0f172a,#0f172a);border:1px solid var(--bd-1e293b,#1e293b);border-radius:14px;padding:20px;margin-bottom:16px}
.pc-lbl{display:block;font-size:12.5px;font-weight:700;color:var(--fg-94a3b8,#94a3b8);margin:0 0 6px;letter-spacing:.03em}
.pc-in,.pc-ta{width:100%;background:var(--bg-162238,#0b1220);color:var(--fg-ffffff,#fff);border:1px solid var(--bd-27354f,#334155);border-radius:9px;padding:10px 12px;font-size:14px;outline:none;box-sizing:border-box;font-family:inherit}
.pc-in:focus,.pc-ta:focus{border-color:#ea580c}
.pc-ta{resize:vertical;line-height:1.6;min-height:70px}
.pc-field{margin-bottom:16px}
.pc-sec{font-size:13px;font-weight:800;color:#fff;margin:0 0 10px;display:flex;justify-content:space-between;align-items:center}
.pc-row{display:grid;grid-template-columns:70px 1fr 2fr auto;gap:8px;align-items:start;margin-bottom:8px}
.pc-row2{display:grid;grid-template-columns:1fr 2fr auto;gap:8px;align-items:start;margin-bottom:8px}
.pc-row3{display:flex;gap:8px;margin-bottom:8px}
.pc-del{background:#7f1d1d;color:#fff;border:none;border-radius:8px;padding:0 12px;font-size:16px;cursor:pointer;height:38px}
.pc-add{background:transparent;border:1px dashed var(--bd-475569,#94a3b8);color:var(--fg-cbd5e1,#334155);border-radius:8px;padding:8px 14px;font-size:13px;cursor:pointer;font-weight:600}
.pc-bar{position:sticky;bottom:0;background:var(--bg-020617,#f8fafc);border-top:1px solid var(--bd-1e293b,#e2e8f0);padding:14px 4px;margin-top:6px;display:flex;gap:12px;align-items:center;flex-wrap:wrap}
.pc-save{background:#10b981;color:#fff;border:none;border-radius:10px;padding:12px 28px;font-weight:800;font-size:14.5px;cursor:pointer}
.pc-save:disabled{opacity:.6;cursor:not-allowed}
.pc-reset{background:transparent;color:var(--fg-94a3b8,#64748b);border:1px solid var(--bd-334155,#cbd5e1);border-radius:10px;padding:12px 18px;font-weight:600;font-size:13.5px;cursor:pointer}
.pc-msg{font-size:13.5px;font-weight:600}
.pc-note{font-size:12px;color:#64748b;margin-top:6px}
`;

export default function AdminPageContent() {
  const [tab, setTab] = useState<PageKey>('janta');
  const [data, setData] = useState<any>(DEFAULT_FOR.janta);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setMsg('');
    getDoc(doc(db, 'settings', PAGE_DOC[tab]))
      .then((snap) => alive && setData(normalizeFor(tab, snap.exists() ? snap.data() : {})))
      .catch(() => alive && setData(DEFAULT_FOR[tab]))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [tab]);

  // Tab badalte hi us page ke sahi shape ka default + loading — warna purana data naye layout me crash karta tha
  const switchTab = (key: PageKey) => {
    if (key === tab) return;
    setData(DEFAULT_FOR[key]);
    setLoading(true);
    setMsg('');
    setTab(key);
  };

  const set = (k: string, v: any) => setData((d: any) => ({ ...d, [k]: v }));
  const setArr = (k: string, i: number, patch: any) =>
    setData((d: any) => ({ ...d, [k]: d[k].map((x: any, j: number) => (j === i ? (typeof x === 'string' ? patch : { ...x, ...patch }) : x)) }));
  const addArr = (k: string, blank: any) => setData((d: any) => ({ ...d, [k]: [...(d[k] || []), blank] }));
  const delArr = (k: string, i: number) => setData((d: any) => ({ ...d, [k]: d[k].filter((_: any, j: number) => j !== i) }));

  const save = async () => {
    setSaving(true); setMsg('');
    try {
      const clean = normalizeFor(tab, data);
      await setDoc(doc(db, 'settings', PAGE_DOC[tab]), { ...clean, updatedAt: serverTimestamp() }, { merge: true });
      setMsg('✓ सेव हो गया — वेबसाइट पर ~1 मिनट में दिख जाएगा।');
    } catch (e: any) {
      setMsg('✕ सेव नहीं हुआ: ' + (e?.message || ''));
    }
    setSaving(false);
  };

  const resetDefault = () => { if (confirm('इस पेज का कंटेंट डिफ़ॉल्ट पर लौटाएं? (सेव करने पर लागू होगा)')) setData(DEFAULT_FOR[tab]); };

  const kind: 'janta' | 'section' | 'intro' = tab === 'janta' ? 'janta' : tab === 'matrimony' || tab === 'shok' ? 'section' : 'intro';

  // Benefit cards editor (intro + section dono me use hota hai)
  const benefitsEditor = (
    <div className="pc-card">
      <div className="pc-sec">
        <span>फायदे (Benefit Cards)</span>
        <button className="pc-add" onClick={() => addArr('benefits', { icon: '⭐', h: '', p: '' })}>+ कार्ड जोड़ें</button>
      </div>
      {(data.benefits || []).map((b: any, i: number) => (
        <div className="pc-row" key={i}>
          <input className="pc-in" placeholder="आइकन" value={b.icon} onChange={(e) => setArr('benefits', i, { icon: e.target.value })} style={{ textAlign: 'center' }} />
          <input className="pc-in" placeholder="शीर्षक" value={b.h} onChange={(e) => setArr('benefits', i, { h: e.target.value })} />
          <textarea className="pc-ta" placeholder="विवरण" rows={2} value={b.p} onChange={(e) => setArr('benefits', i, { p: e.target.value })} />
          <button className="pc-del" onClick={() => delArr('benefits', i)}>×</button>
        </div>
      ))}
      <p className="pc-note">आइकन में इमोजी डालें (जैसे 🪪 📝 🌐 📊). छोटा रखें।</p>
    </div>
  );

  return (
    <div className="pc">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="pc-wrap">
        <h1 className="pc-h">📝 पेज कंटेंट</h1>
        <p className="pc-sub">जनता दरबार · पत्रकार · विज्ञापन · विवाह · शोक संदेश — इन पेजों का टेक्स्ट यहाँ से बदलें। कोड छूने की ज़रूरत नहीं, हर पोर्टल पर लागू।</p>

        <div className="pc-tabs">
          {TABS.map((t) => (
            <button key={t.key} className={`pc-tab ${tab === t.key ? 'on' : ''}`} onClick={() => switchTab(t.key)}>{t.label}</button>
          ))}
        </div>

        {loading ? (
          <div className="pc-card">लोड हो रहा है...</div>
        ) : (
          <>
            {/* Hero — janta/intro ke liye (section ka apna heading alag) */}
            {kind !== 'section' && (
              <div className="pc-card">
                <div className="pc-sec">ऊपर का हिस्सा (Hero)</div>
                <div className="pc-field"><label className="pc-lbl">बैज (छोटा लेबल)</label><input className="pc-in" value={data.badge} onChange={(e) => set('badge', e.target.value)} /></div>
                <div className="pc-field"><label className="pc-lbl">मुख्य शीर्षक</label><input className="pc-in" value={data.title} onChange={(e) => set('title', e.target.value)} /></div>
                <div className="pc-field"><label className="pc-lbl">उप-शीर्षक / विवरण</label><textarea className="pc-ta" rows={3} value={data.subtitle} onChange={(e) => set('subtitle', e.target.value)} /></div>
              </div>
            )}

            {kind === 'section' ? (
              <>
                <div className="pc-card">
                  <div className="pc-sec">सेक्शन का हिस्सा</div>
                  <div className="pc-field"><label className="pc-lbl">सेक्शन शीर्षक</label><input className="pc-in" value={data.heading} onChange={(e) => set('heading', e.target.value)} /></div>
                  <div className="pc-field"><label className="pc-lbl">छोटा विवरण (शीर्षक के नीचे)</label><textarea className="pc-ta" rows={2} value={data.intro} onChange={(e) => set('intro', e.target.value)} /></div>
                </div>
                {benefitsEditor}
              </>
            ) : kind === 'janta' ? (
              <>
                <div className="pc-card">
                  <div className="pc-sec">जानकारी (लॉगिन से पहले)</div>
                  <div className="pc-field"><label className="pc-lbl">जानकारी शीर्षक</label><input className="pc-in" value={data.aboutTitle} onChange={(e) => set('aboutTitle', e.target.value)} /></div>
                  <div className="pc-field"><label className="pc-lbl">जानकारी टेक्स्ट</label><textarea className="pc-ta" rows={4} value={data.aboutText} onChange={(e) => set('aboutText', e.target.value)} /></div>
                </div>

                <div className="pc-card">
                  <div className="pc-sec"><span>स्टेप्स (1-2-3)</span><button className="pc-add" onClick={() => addArr('steps', { h: '', p: '' })}>+ स्टेप जोड़ें</button></div>
                  {(data.steps || []).map((st: any, i: number) => (
                    <div className="pc-row2" key={i}>
                      <input className="pc-in" placeholder="शीर्षक" value={st.h} onChange={(e) => setArr('steps', i, { h: e.target.value })} />
                      <input className="pc-in" placeholder="विवरण" value={st.p} onChange={(e) => setArr('steps', i, { p: e.target.value })} />
                      <button className="pc-del" onClick={() => delArr('steps', i)}>×</button>
                    </div>
                  ))}
                </div>

                <div className="pc-card">
                  <div className="pc-sec">लॉगिन बॉक्स</div>
                  <div className="pc-field"><label className="pc-lbl">शीर्षक</label><input className="pc-in" value={data.loginTitle} onChange={(e) => set('loginTitle', e.target.value)} /></div>
                  <div className="pc-field"><label className="pc-lbl">टेक्स्ट</label><textarea className="pc-ta" rows={2} value={data.loginText} onChange={(e) => set('loginText', e.target.value)} /></div>
                </div>
              </>
            ) : (
              <>
                <div className="pc-card">
                  <div className="pc-sec"><span>ट्रस्ट बैज (ऊपर की छोटी चिप्स)</span><button className="pc-add" onClick={() => addArr('trust', '')}>+ जोड़ें</button></div>
                  {(data.trust || []).map((t: string, i: number) => (
                    <div className="pc-row3" key={i}>
                      <input className="pc-in" value={t} onChange={(e) => setArr('trust', i, e.target.value)} />
                      <button className="pc-del" onClick={() => delArr('trust', i)}>×</button>
                    </div>
                  ))}
                </div>

                <div className="pc-card">
                  <div className="pc-sec">
                    <span>फायदे (Benefit Cards)</span>
                    <button className="pc-add" onClick={() => addArr('benefits', { icon: '⭐', h: '', p: '' })}>+ कार्ड जोड़ें</button>
                  </div>
                  <div className="pc-field"><label className="pc-lbl">सेक्शन शीर्षक</label><input className="pc-in" value={data.benefitsHeading} onChange={(e) => set('benefitsHeading', e.target.value)} /></div>
                  {(data.benefits || []).map((b: any, i: number) => (
                    <div className="pc-row" key={i}>
                      <input className="pc-in" placeholder="आइकन" value={b.icon} onChange={(e) => setArr('benefits', i, { icon: e.target.value })} style={{ textAlign: 'center' }} />
                      <input className="pc-in" placeholder="शीर्षक" value={b.h} onChange={(e) => setArr('benefits', i, { h: e.target.value })} />
                      <textarea className="pc-ta" placeholder="विवरण" rows={2} value={b.p} onChange={(e) => setArr('benefits', i, { p: e.target.value })} />
                      <button className="pc-del" onClick={() => delArr('benefits', i)}>×</button>
                    </div>
                  ))}
                  <p className="pc-note">आइकन में इमोजी डालें (जैसे 🪪 📝 🌐 📊). छोटा रखें।</p>
                </div>

                <div className="pc-card">
                  <div className="pc-sec">नीचे का CTA बॉक्स</div>
                  <div className="pc-field"><label className="pc-lbl">शीर्षक</label><input className="pc-in" value={data.ctaTitle} onChange={(e) => set('ctaTitle', e.target.value)} /></div>
                  <div className="pc-field"><label className="pc-lbl">टेक्स्ट</label><textarea className="pc-ta" rows={2} value={data.ctaText} onChange={(e) => set('ctaText', e.target.value)} /></div>
                </div>
              </>
            )}

            <div className="pc-bar">
              <button className="pc-save" onClick={save} disabled={saving}>{saving ? 'सेव हो रहा है...' : '💾 सेव करें'}</button>
              <button className="pc-reset" onClick={resetDefault}>डिफ़ॉल्ट पर लौटाएं</button>
              {msg && <span className="pc-msg" style={{ color: msg.startsWith('✓') ? '#10b981' : '#f87171' }}>{msg}</span>}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
