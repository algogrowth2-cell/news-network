'use client';
import { useEffect, useState } from 'react';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { DEFAULT_TRENDING_TAGS, normalizeTrendingTags, type TrendingTags } from '@/lib/useTrendingTags';

/* Homepage ke "ट्रेंडिंग" tags — admin (settings/trending_tags). Hindi portals + English portals alag. Har pankti = ek tag. */

export default function AdminTrendingTags() {
  const [t, setT] = useState<TrendingTags>(DEFAULT_TRENDING_TAGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    getDoc(doc(db, 'settings', 'trending_tags'))
      .then((s) => setT(normalizeTrendingTags(s.exists() ? s.data() : {})))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true); setMsg('');
    try {
      const clean = normalizeTrendingTags(t);
      await setDoc(doc(db, 'settings', 'trending_tags'), { ...clean, updatedAt: serverTimestamp() }, { merge: true });
      setT(clean);
      setMsg('✓ सहेज दिया गया। होमपेज पर लागू (पेज रिफ्रेश पर दिखेगा)।');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (e: any) { setMsg('सहेजा नहीं जा सका: ' + e.message); }
    setSaving(false);
  };

  const ta: React.CSSProperties = { width: '100%', minHeight: 200, boxSizing: 'border-box', background: 'var(--bg-162238)', border: '1px solid var(--bd-27354f)', borderRadius: 8, padding: '12px 14px', color: 'var(--fg-ffffff,#fff)', fontSize: 14, fontFamily: 'inherit', lineHeight: 1.8, resize: 'vertical' };

  if (loading) return <div style={{ color: 'var(--fg-94a3b8)', padding: 20 }}>लोड हो रहा है…</div>;

  return (
    <div style={{ color: 'var(--fg-fff,#fff)', maxWidth: 760 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 14, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>🔥 ट्रेंडिंग टैग (होमपेज)</h1>
          <p style={{ fontSize: 13, color: 'var(--fg-94a3b8)', margin: '6px 0 0' }}>हर पंक्ति में एक टैग। टैग पर क्लिक करने पर उससे जुड़ी खबरें दिखती हैं।</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setT(DEFAULT_TRENDING_TAGS)} style={{ background: 'transparent', border: '1px solid var(--bd-334155)', color: 'var(--fg-cbd5e1)', borderRadius: 8, padding: '9px 14px', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>डिफ़ॉल्ट</button>
          <button onClick={save} disabled={saving} style={{ background: '#ea580c', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 22px', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', opacity: saving ? 0.7 : 1 }}>{saving ? 'सहेज रहे…' : 'सहेजें'}</button>
        </div>
      </div>

      {msg && <div style={{ marginTop: 14, background: 'rgba(16,185,129,.12)', border: '1px solid rgba(16,185,129,.35)', color: '#34d399', borderRadius: 8, padding: '9px 12px', fontSize: 13 }}>{msg}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 16, marginTop: 18 }}>
        <div>
          <label style={{ display: 'block', fontSize: 13, color: 'var(--fg-cbd5e1)', fontWeight: 600, marginBottom: 6 }}>हिंदी पोर्टल ({t.hi.filter((x) => x.trim()).length})</label>
          <textarea style={ta} value={t.hi.join('\n')} onChange={(e) => setT((p) => ({ ...p, hi: e.target.value.split('\n') }))} />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 13, color: 'var(--fg-cbd5e1)', fontWeight: 600, marginBottom: 6 }}>English पोर्टल ({t.en.filter((x) => x.trim()).length})</label>
          <textarea style={ta} value={t.en.join('\n')} onChange={(e) => setT((p) => ({ ...p, en: e.target.value.split('\n') }))} />
        </div>
      </div>
    </div>
  );
}
