'use client';
import { useEffect, useState } from 'react';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { DEFAULT_CLASSIFIED_CATEGORIES, normalizeCategories } from '@/lib/useClassifiedCategories';

/* Classified ki श्रेणियाँ — admin yahan badlता hai (settings/classified_categories). Har pankti = ek श्रेणी. */

export default function AdminClassifiedCategories() {
  const [list, setList] = useState<string[]>(DEFAULT_CLASSIFIED_CATEGORIES);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    getDoc(doc(db, 'settings', 'classified_categories'))
      .then((s) => setList(normalizeCategories(s.exists() ? s.data() : null)))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true); setMsg('');
    try {
      const clean = normalizeCategories({ list });
      await setDoc(doc(db, 'settings', 'classified_categories'), { list: clean, updatedAt: serverTimestamp() }, { merge: true });
      setList(clean);
      setMsg('✓ सहेज दिया गया। क्लासिफाइड फॉर्म व फ़िल्टर में लागू (पेज रिफ्रेश पर दिखेगा)।');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (e: any) { setMsg('सहेजा नहीं जा सका: ' + e.message); }
    setSaving(false);
  };

  const ta: React.CSSProperties = { width: '100%', maxWidth: 480, minHeight: 240, boxSizing: 'border-box', background: 'var(--bg-162238)', border: '1px solid var(--bd-27354f)', borderRadius: 8, padding: '12px 14px', color: 'var(--fg-ffffff,#fff)', fontSize: 14, fontFamily: 'inherit', lineHeight: 1.8, resize: 'vertical' };

  if (loading) return <div style={{ color: 'var(--fg-94a3b8)', padding: 20 }}>लोड हो रहा है…</div>;

  return (
    <div style={{ color: 'var(--fg-fff,#fff)', maxWidth: 560 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 14, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>📋 क्लासिफाइड श्रेणियाँ</h1>
          <p style={{ fontSize: 13, color: 'var(--fg-94a3b8)', margin: '6px 0 0' }}>हर पंक्ति में एक श्रेणी। यहाँ बदलें — विज्ञापनदाता फॉर्म और वेबसाइट फ़िल्टर दोनों में लागू।</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setList(DEFAULT_CLASSIFIED_CATEGORIES)} style={{ background: 'transparent', border: '1px solid var(--bd-334155)', color: 'var(--fg-cbd5e1)', borderRadius: 8, padding: '9px 14px', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>डिफ़ॉल्ट</button>
          <button onClick={save} disabled={saving} style={{ background: '#ea580c', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 22px', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', opacity: saving ? 0.7 : 1 }}>{saving ? 'सहेज रहे…' : 'सहेजें'}</button>
        </div>
      </div>

      {msg && <div style={{ marginTop: 14, background: 'rgba(16,185,129,.12)', border: '1px solid rgba(16,185,129,.35)', color: '#34d399', borderRadius: 8, padding: '9px 12px', fontSize: 13 }}>{msg}</div>}

      <label style={{ display: 'block', fontSize: 13, color: 'var(--fg-cbd5e1)', fontWeight: 600, margin: '18px 0 6px' }}>श्रेणियाँ ({list.length})</label>
      <textarea style={ta} value={list.join('\n')} onChange={(e) => setList(e.target.value.split('\n').map((x) => x.trim()).filter(Boolean))} />
      <p style={{ fontSize: 11.5, color: 'var(--fg-64748b)', marginTop: 6 }}>“सभी” अपने आप फ़िल्टर में जुड़ जाता है — उसे यहाँ न लिखें।</p>
    </div>
  );
}
