'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { NETWORK_SITES } from '@/lib/portals';
import {
  DEFAULT_APP_SETTINGS, normalizeAppSettings,
  type AppSettings, type Designation, type FaqItem, type ShokTemplate
} from '@/lib/appSettings';

/*
 * Mobile app (Golden Pearl News Android) ki settings — settings/app.
 * Website par koi asar nahi; app me turant (app khulne / screen khulne par) lagu.
 */

const COLOR_FIELDS: [keyof ShokTemplate, string][] = [
  ['cardBg', 'कार्ड'], ['borderColor', 'बॉर्डर'], ['titleColor', 'शीर्षक'], ['mantraColor', 'मंत्र'], ['boxBg', 'बॉक्स'], ['boxBorder', 'बॉक्स बॉर्डर']
];

export default function AdminAppSettings() {
  const [s, setS] = useState<AppSettings>(DEFAULT_APP_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    getDoc(doc(db, 'settings', 'app'))
      .then((snap) => setS(normalizeAppSettings(snap.exists() ? snap.data() : {})))
      .catch((e) => setMsg({ ok: false, text: 'लोड नहीं हो पाया: ' + e.message }))
      .finally(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true); setMsg(null);
    try {
      const clean = normalizeAppSettings(s);
      await setDoc(doc(db, 'settings', 'app'), { ...clean, updatedAt: serverTimestamp() });
      setS(clean);
      setMsg({ ok: true, text: '✓ सहेज दिया गया। मोबाइल ऐप में अपने आप लागू हो जाएगा।' });
    } catch (e: any) {
      setMsg({ ok: false, text: 'सहेजा नहीं जा सका: ' + e.message });
    }
    setSaving(false);
  };

  const input: React.CSSProperties = { width: '100%', boxSizing: 'border-box', background: 'var(--bg-162238)', border: '1px solid var(--bd-27354f)', borderRadius: 8, padding: '9px 11px', color: 'var(--fg-ffffff,#fff)', fontSize: 14, fontFamily: 'inherit' };
  const card: React.CSSProperties = { background: 'var(--bg-0f172a, rgba(255,255,255,.03))', border: '1px solid var(--bd-27354f)', borderRadius: 12, padding: 18, marginTop: 18 };
  const h2: React.CSSProperties = { fontSize: 16, fontWeight: 700, margin: '0 0 4px' };
  const note: React.CSSProperties = { fontSize: 12.5, color: 'var(--fg-94a3b8)', margin: '0 0 12px' };
  const smallBtn: React.CSSProperties = { background: 'transparent', border: '1px solid var(--bd-27354f)', color: 'var(--fg-94a3b8)', borderRadius: 7, padding: '6px 12px', cursor: 'pointer', fontSize: 12.5, fontFamily: 'inherit' };
  const delBtn: React.CSSProperties = { ...smallBtn, color: '#f87171', borderColor: 'rgba(248,113,113,.4)' };

  const faqEditor = (key: 'faqHi' | 'faqEn', label: string) => {
    const list = s[key];
    const setList = (l: FaqItem[]) => setS((p) => ({ ...p, [key]: l }));
    return (
      <div style={{ marginTop: 12 }}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>{label} {list.length === 0 && <span style={{ color: 'var(--fg-64748b)', fontWeight: 400 }}>(खाली = ऐप के अपने सवाल-जवाब)</span>}</div>
        {list.map((f, i) => (
          <div key={i} style={{ display: 'grid', gap: 6, marginBottom: 10, paddingBottom: 10, borderBottom: '1px dashed var(--bd-27354f)' }}>
            <input style={input} value={f.q} placeholder="सवाल" onChange={(e) => setList(list.map((x, j) => (j === i ? { ...x, q: e.target.value } : x)))} />
            <textarea style={{ ...input, minHeight: 60 }} value={f.a} placeholder="जवाब" onChange={(e) => setList(list.map((x, j) => (j === i ? { ...x, a: e.target.value } : x)))} />
            <div><button style={delBtn} onClick={() => setList(list.filter((_, j) => j !== i))}>हटाएं</button></div>
          </div>
        ))}
        <button style={smallBtn} onClick={() => setList([...list, { q: '', a: '' }])}>+ सवाल जोड़ें</button>
      </div>
    );
  };

  if (loading) return <div style={{ color: 'var(--fg-94a3b8)', padding: 20 }}>लोड हो रहा है…</div>;

  return (
    <div style={{ color: 'var(--fg-fff,#fff)', maxWidth: 860 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>📱 मोबाइल ऐप सेटिंग्स</h1>
      <p style={{ fontSize: 13, color: 'var(--fg-94a3b8)', margin: '6px 0 0' }}>सिर्फ़ मोबाइल ऐप (Golden Pearl News) के लिए — वेबसाइट पर कोई असर नहीं।</p>

      <div style={{ ...card, background: 'rgba(59,130,246,.08)', borderColor: 'rgba(59,130,246,.35)' }}>
        <div style={h2}>ऐप की बाकी चीज़ें इन पेजों से बदलती हैं</div>
        <ul style={{ margin: '6px 0 0', paddingLeft: 18, fontSize: 13, lineHeight: 1.9, color: 'var(--fg-cbd5e1, #cbd5e1)' }}>
          <li>पोर्टल का नाम, टैगलाइन, रंग, लोगो → <Link href="/admin/sites" style={{ color: '#60a5fa' }}>Sites</Link></li>
          <li>ऐप स्विच पास की कीमत व दिन → <Link href="/admin/membership" style={{ color: '#60a5fa' }}>प्लान व कीमतें</Link></li>
          <li>ब्रेकिंग पट्टी → खबर में “Breaking” चुनें (<Link href="/admin/articles" style={{ color: '#60a5fa' }}>Articles</Link>)</li>
          <li>रिपोर्टर की खबर की कैटेगरी → <Link href="/admin/categories" style={{ color: '#60a5fa' }}>Categories</Link></li>
          <li>हेल्प का ईमेल, नंबर, समय, पता → <Link href="/admin/site-contact" style={{ color: '#60a5fa' }}>संपर्क व फुटर</Link></li>
          <li>प्राइवेसी पॉलिसी व सेवा नियम → <Link href="/admin/policy-pages" style={{ color: '#60a5fa' }}>Policy Pages</Link></li>
        </ul>
      </div>

      {msg && (
        <div style={{ marginTop: 14, background: msg.ok ? 'rgba(16,185,129,.12)' : 'rgba(239,68,68,.12)', border: `1px solid ${msg.ok ? 'rgba(16,185,129,.35)' : 'rgba(239,68,68,.35)'}`, color: msg.ok ? '#34d399' : '#f87171', borderRadius: 8, padding: '9px 12px', fontSize: 13 }}>{msg.text}</div>
      )}

      {/* Refer & Earn */}
      <div style={card}>
        <div style={h2}>🎁 Refer &amp; Earn इनाम</div>
        <p style={note}>हर सफल रेफरल पर कितने महीने का ई-पेपर / सभी ऐप्स मुफ़्त (1–24)।</p>
        <input type="number" min={1} max={24} style={{ ...input, width: 120 }} value={s.referralRewardMonths}
          onChange={(e) => setS((p) => ({ ...p, referralRewardMonths: Number(e.target.value) }))} /> <span style={{ fontSize: 13 }}>महीने</span>
      </div>

      {/* E-paper portals */}
      <div style={card}>
        <div style={h2}>📰 किन ऐप में ई-पेपर दिखे</div>
        <p style={note}>मोबाइल ऐप में इन पोर्टलों पर ई-पेपर सेक्शन दिखेगा (हर ऐप का पास अलग)।</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(230px,1fr))', gap: 8 }}>
          {NETWORK_SITES.map((site) => {
            const on = s.epaperPortals.includes(site.slug);
            return (
              <label key={site.slug} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13.5, cursor: 'pointer' }}>
                <input type="checkbox" checked={on} onChange={() => setS((p) => ({
                  ...p, epaperPortals: on ? p.epaperPortals.filter((x) => x !== site.slug) : [...p.epaperPortals, site.slug]
                }))} />
                {site.name}
              </label>
            );
          })}
        </div>
      </div>

      {/* About */}
      <div style={card}>
        <div style={h2}>ℹ️ ऐप का “हमारे बारे में” (About)</div>
        <p style={note}>खाली छोड़ें तो ऐप का अपना पाठ दिखेगा।</p>
        <textarea style={{ ...input, minHeight: 90 }} value={s.aboutHi} placeholder="हिंदी" onChange={(e) => setS((p) => ({ ...p, aboutHi: e.target.value }))} />
        <textarea style={{ ...input, minHeight: 90, marginTop: 8 }} value={s.aboutEn} placeholder="English (NDN, News Info 24)" onChange={(e) => setS((p) => ({ ...p, aboutEn: e.target.value }))} />
      </div>

      {/* FAQ */}
      <div style={card}>
        <div style={h2}>❓ हेल्प के सवाल-जवाब (FAQ)</div>
        {faqEditor('faqHi', 'हिंदी')}
        {faqEditor('faqEn', 'English (NDN, News Info 24)')}
      </div>

      {/* Shok templates */}
      <div style={card}>
        <div style={h2}>🕊️ शोक संदेश कार्ड डिज़ाइन</div>
        <p style={note}>नाम, रंग बदलें या डिज़ाइन बंद करें। पहले से बने कार्ड अपना डिज़ाइन रखते हैं।</p>
        {s.shokTemplates.map((t, i) => {
          const setT = (patch: Partial<ShokTemplate>) => setS((p) => ({ ...p, shokTemplates: p.shokTemplates.map((x, j) => (j === i ? { ...x, ...patch } : x)) }));
          return (
            <div key={t.id + i} style={{ border: '1px solid var(--bd-27354f)', borderRadius: 10, padding: 12, marginBottom: 10, background: t.cardBg, color: '#111' }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <input style={{ ...input, maxWidth: 240, color: '#111', background: '#fff' }} value={t.name} onChange={(e) => setT({ name: e.target.value })} />
                <label style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <input type="checkbox" checked={t.active} onChange={(e) => setT({ active: e.target.checked })} /> चालू
                </label>
                <span style={{ fontSize: 11.5, color: '#475569' }}>ID: {t.id}</span>
                {!['floral', 'golden', 'celestial', 'garland', 'silver'].includes(t.id) && (
                  <button style={delBtn} onClick={() => setS((p) => ({ ...p, shokTemplates: p.shokTemplates.filter((_, j) => j !== i) }))}>हटाएं</button>
                )}
              </div>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 10 }}>
                {COLOR_FIELDS.map(([k, label]) => (
                  <label key={k} style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 5 }}>
                    <input type="color" value={String(t[k])} onChange={(e) => setT({ [k]: e.target.value } as Partial<ShokTemplate>)} /> {label}
                  </label>
                ))}
              </div>
              <div style={{ marginTop: 8, fontWeight: 700, color: t.titleColor, border: `2px solid ${t.borderColor}`, borderRadius: 8, padding: 8, textAlign: 'center' }}>
                <span style={{ color: t.mantraColor }}>॥ ॐ शांति ॥</span> · भावपूर्ण श्रद्धांजलि
                <div style={{ marginTop: 6, background: t.boxBg, border: `1px dashed ${t.boxBorder}`, borderRadius: 6, padding: 6, fontWeight: 500, color: '#334155' }}>तेरहवीं / पगड़ी कार्यक्रम</div>
              </div>
            </div>
          );
        })}
        <button style={smallBtn} onClick={() => setS((p) => ({
          ...p, shokTemplates: [...p.shokTemplates, { ...p.shokTemplates[0], id: `tpl${Date.now().toString(36)}`, name: 'नया डिज़ाइन', active: true }]
        }))}>+ नया डिज़ाइन</button>
      </div>

      {/* Press ID */}
      <div style={card}>
        <div style={h2}>🪪 प्रेस आई-कार्ड</div>
        <p style={note}>रिपोर्टर ID का शुरुआती कोड (जैसे TLL-2026-287421) और पदनाम सूची।</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(250px,1fr))', gap: 8 }}>
          {NETWORK_SITES.map((site) => (
            <label key={site.slug} style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ flex: 1 }}>{site.name}</span>
              <input style={{ ...input, width: 90 }} value={s.pressPrefixes[site.slug] || ''}
                onChange={(e) => setS((p) => ({ ...p, pressPrefixes: { ...p.pressPrefixes, [site.slug]: e.target.value.toUpperCase() } }))} />
            </label>
          ))}
        </div>
        <div style={{ fontSize: 13, fontWeight: 600, margin: '16px 0 6px' }}>पदनाम (Designation)</div>
        {s.designations.map((d, i) => {
          const setD = (patch: Partial<Designation>) => setS((p) => ({ ...p, designations: p.designations.map((x, j) => (j === i ? { ...x, ...patch } : x)) }));
          return (
            <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
              <input style={input} value={d.en} placeholder="English (ID कार्ड)" onChange={(e) => setD({ en: e.target.value, key: e.target.value.toLowerCase() })} />
              <input style={input} value={d.hi} placeholder="हिंदी (प्राधिकरण पत्र)" onChange={(e) => setD({ hi: e.target.value })} />
              <button style={delBtn} onClick={() => setS((p) => ({ ...p, designations: p.designations.filter((_, j) => j !== i) }))}>हटाएं</button>
            </div>
          );
        })}
        <button style={smallBtn} onClick={() => setS((p) => ({ ...p, designations: [...p.designations, { key: '', en: '', hi: '' }] }))}>+ पदनाम जोड़ें</button>
      </div>

      <div style={{ margin: '22px 0 40px' }}>
        <button onClick={save} disabled={saving} style={{ background: '#ea580c', color: '#fff', border: 'none', borderRadius: 9, padding: '11px 26px', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', opacity: saving ? 0.7 : 1 }}>
          {saving ? 'सहेज रहे…' : 'सहेजें'}
        </button>
      </div>
    </div>
  );
}
