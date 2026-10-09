'use client';
import { useEffect, useState } from 'react';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { DEFAULT_MATRIMONY_OPTIONS, type MatrimonyOptions, normalizeMatrimonyOptions } from '@/lib/matrimony';

/* Matrimony form ke dropdown options — admin yahan badlता hai (settings/matrimony_options). Har pankti = ek option. */

const FIELDS: { key: keyof MatrimonyOptions; label: string; hint?: string }[] = [
  { key: 'religions', label: 'धर्म' },
  { key: 'motherTongues', label: 'मातृभाषा' },
  { key: 'maritalStatus', label: 'वैवाहिक स्थिति' },
  { key: 'diets', label: 'आहार' },
  { key: 'incomeRanges', label: 'वार्षिक आय (रेंज)' },
  { key: 'workFields', label: 'कार्य क्षेत्र' },
  { key: 'roleOptions', label: 'पद / भूमिका (सुझाव — उपयोगकर्ता खुद भी लिख सकता है)' },
  { key: 'postedBy', label: 'रिश्ता किसने डाला (संबंधी)' },
  { key: 'aboutSuggestions', label: '“अपने बारे में” के सुझाव (chips)' },
  { key: 'partnerSuggestions', label: '“कैसा जीवनसाथी” के सुझाव (chips)' }
];

export default function AdminMatrimonyOptions() {
  const [o, setO] = useState<MatrimonyOptions>(DEFAULT_MATRIMONY_OPTIONS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    getDoc(doc(db, 'settings', 'matrimony_options'))
      .then((s) => setO(normalizeMatrimonyOptions(s.exists() ? s.data() : {})))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const setField = (k: keyof MatrimonyOptions, text: string) =>
    setO((p) => ({ ...p, [k]: text.split('\n').map((x) => x.trim()).filter(Boolean) }));

  const save = async () => {
    setSaving(true); setMsg('');
    try {
      const clean = normalizeMatrimonyOptions(o);
      await setDoc(doc(db, 'settings', 'matrimony_options'), { ...clean, updatedAt: serverTimestamp() }, { merge: true });
      setO(clean);
      setMsg('✓ सहेज दिया गया। विवाह फॉर्म में तुरंत लागू (पेज रिफ्रेश पर दिखेगा)।');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (e: any) { setMsg('सहेजा नहीं जा सका: ' + e.message); }
    setSaving(false);
  };

  const reset = () => { if (confirm('सभी सूचियाँ डिफ़ॉल्ट पर लौटाएँ?')) setO(DEFAULT_MATRIMONY_OPTIONS); };

  const ta: React.CSSProperties = { width: '100%', minHeight: 120, boxSizing: 'border-box', background: 'var(--bg-162238)', border: '1px solid var(--bd-27354f)', borderRadius: 8, padding: '10px 12px', color: 'var(--fg-ffffff,#fff)', fontSize: 13.5, fontFamily: 'inherit', lineHeight: 1.6, resize: 'vertical' };

  if (loading) return <div style={{ color: 'var(--fg-94a3b8)', padding: 20 }}>लोड हो रहा है…</div>;

  return (
    <div style={{ color: 'var(--fg-fff,#fff)', maxWidth: 820 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 14, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>💍 विवाह फॉर्म के विकल्प</h1>
          <p style={{ fontSize: 13, color: 'var(--fg-94a3b8)', margin: '6px 0 0' }}>हर पंक्ति (line) में एक विकल्प लिखें। यहाँ बदलें — विवाह प्रोफ़ाइल फॉर्म में लागू होगा।</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={reset} style={{ background: 'transparent', border: '1px solid var(--bd-334155)', color: 'var(--fg-cbd5e1)', borderRadius: 8, padding: '9px 14px', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>डिफ़ॉल्ट</button>
          <button onClick={save} disabled={saving} style={{ background: '#ea580c', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 22px', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', opacity: saving ? 0.7 : 1 }}>{saving ? 'सहेज रहे…' : 'सहेजें'}</button>
        </div>
      </div>

      {msg && <div style={{ marginTop: 14, background: 'rgba(16,185,129,.12)', border: '1px solid rgba(16,185,129,.35)', color: '#34d399', borderRadius: 8, padding: '9px 12px', fontSize: 13 }}>{msg}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(320px,1fr))', gap: 16, marginTop: 18 }}>
        {FIELDS.map((f) => (
          <div key={f.key}>
            <label style={{ display: 'block', fontSize: 13, color: 'var(--fg-cbd5e1)', fontWeight: 600, marginBottom: 6 }}>{f.label} <span style={{ color: 'var(--fg-64748b)', fontWeight: 400 }}>({o[f.key].length})</span></label>
            <textarea style={ta} value={o[f.key].join('\n')} onChange={(e) => setField(f.key, e.target.value)} />
          </div>
        ))}
      </div>

      <p style={{ fontSize: 12, color: 'var(--fg-64748b)', marginTop: 16 }}>नोट: लिंग, लंबाई, जाति-पसंद और “आप क्या करते हैं” सुरक्षा कारणों से तय (fixed) हैं — उन पर फ़ीचर की लॉजिक निर्भर करती है।</p>
    </div>
  );
}
