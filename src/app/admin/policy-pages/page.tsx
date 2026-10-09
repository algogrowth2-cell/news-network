'use client';
import { useEffect, useState } from 'react';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { EMPTY_POLICIES, normalizePolicies, type PolicyKey, type SitePolicies } from '@/lib/useSitePolicy';

/*
 * Policy pages ka content — admin yahan badlता hai (settings/policies).
 * Content khali chhodo toh page ka sundar default dikhta hai; bharo toh wahi dikhega.
 */
const PAGES: { key: PolicyKey; label: string; url: string }[] = [
  { key: 'privacy', label: 'निजता नीति (Privacy Policy)', url: '/privacy-policy' },
  { key: 'terms', label: 'नियम व शर्तें (Terms)', url: '/terms' },
  { key: 'editorial', label: 'संपादकीय दिशानिर्देश', url: '/editorial-guidelines' },
  { key: 'grievance', label: 'शिकायत निवारण (Grievance)', url: '/grievance' }
];

export default function AdminPolicyPages() {
  const [p, setP] = useState<SitePolicies>(EMPTY_POLICIES);
  const [active, setActive] = useState<PolicyKey>('privacy');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    getDoc(doc(db, 'settings', 'policies'))
      .then((s) => setP(normalizePolicies(s.exists() ? s.data() : {})))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const set = (k: PolicyKey, field: 'title' | 'html', v: string) => setP((prev) => ({ ...prev, [k]: { ...prev[k], [field]: v } }));

  const save = async () => {
    setSaving(true); setMsg('');
    try {
      const clean = normalizePolicies(p);
      await setDoc(doc(db, 'settings', 'policies'), { ...clean, updatedAt: serverTimestamp() }, { merge: true });
      setP(clean);
      setMsg('✓ सहेज दिया गया। वेबसाइट पर लागू (पेज रिफ्रेश पर दिखेगा)।');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (e: any) { setMsg('सहेजा नहीं जा सका: ' + e.message); }
    setSaving(false);
  };

  const cur = p[active];
  const curPage = PAGES.find((x) => x.key === active)!;
  const input: React.CSSProperties = { width: '100%', boxSizing: 'border-box', background: 'var(--bg-162238)', border: '1px solid var(--bd-27354f)', borderRadius: 8, padding: '10px 12px', color: 'var(--fg-ffffff,#fff)', fontSize: 14, fontFamily: 'inherit' };

  if (loading) return <div style={{ color: 'var(--fg-94a3b8)', padding: 20 }}>लोड हो रहा है…</div>;

  return (
    <div style={{ color: 'var(--fg-fff,#fff)', maxWidth: 820 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 14, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>📜 नीति पेज (Policy Pages)</h1>
          <p style={{ fontSize: 13, color: 'var(--fg-94a3b8)', margin: '6px 0 0' }}>कंटेंट खाली रखें → पेज का सुंदर डिफ़ॉल्ट दिखेगा। कुछ लिखें → वही दिखेगा। HTML टैग चलते हैं: &lt;h2&gt; शीर्षक, &lt;p&gt; पैराग्राफ, &lt;ul&gt;&lt;li&gt; बुलेट, &lt;strong&gt;।</p>
        </div>
        <button onClick={save} disabled={saving} style={{ background: '#ea580c', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 24px', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', opacity: saving ? 0.7 : 1 }}>{saving ? 'सहेज रहे…' : 'सहेजें'}</button>
      </div>

      {msg && <div style={{ marginTop: 14, background: 'rgba(16,185,129,.12)', border: '1px solid rgba(16,185,129,.35)', color: '#34d399', borderRadius: 8, padding: '9px 12px', fontSize: 13 }}>{msg}</div>}

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '18px 0' }}>
        {PAGES.map((pg) => (
          <button key={pg.key} onClick={() => setActive(pg.key)} style={{ padding: '8px 14px', borderRadius: 8, border: `1px solid ${active === pg.key ? '#ea580c' : 'var(--bd-334155)'}`, background: active === pg.key ? '#ea580c' : 'transparent', color: active === pg.key ? '#fff' : 'var(--fg-cbd5e1)', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', position: 'relative' }}>
            {pg.label}{p[pg.key].html ? ' ✎' : ''}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <label style={{ fontSize: 13, color: 'var(--fg-cbd5e1)', fontWeight: 600 }}>शीर्षक (Title)</label>
        <a href={`${curPage.url}?site=the-local-leader`} target="_blank" style={{ fontSize: 12, color: '#fb923c', textDecoration: 'none' }}>पेज देखें ↗</a>
      </div>
      <input style={input} value={cur.title} onChange={(e) => set(active, 'title', e.target.value)} placeholder={curPage.label} />

      <label style={{ display: 'block', fontSize: 13, color: 'var(--fg-cbd5e1)', fontWeight: 600, margin: '16px 0 6px' }}>कंटेंट (HTML / टेक्स्ट) — खाली = डिफ़ॉल्ट पेज</label>
      <textarea style={{ ...input, minHeight: 360, lineHeight: 1.7, resize: 'vertical' }} value={cur.html} onChange={(e) => set(active, 'html', e.target.value)} placeholder={'<h2>शीर्षक</h2>\n<p>यहाँ नीति का विवरण लिखें…</p>\n<ul><li>बिंदु एक</li><li>बिंदु दो</li></ul>'} />
      <p style={{ fontSize: 11.5, color: 'var(--fg-64748b)', marginTop: 6 }}>सुरक्षा: &lt;script&gt; आदि अपने आप हटा दिए जाते हैं। इस पेज को खाली करके सहेजें तो फिर से डिफ़ॉल्ट दिखने लगेगा।</p>
    </div>
  );
}
