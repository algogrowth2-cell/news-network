'use client';
import { useEffect, useState } from 'react';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { DEFAULT_CONTACT, normalizeContact, type SiteContact } from '@/lib/useSiteContact';

/* Footer ka sampark — Gmail, WhatsApp number, timing. Yahan badlo, poori website ke footer me turant lagu. */

export default function AdminSiteContact() {
  const [c, setC] = useState<SiteContact>(DEFAULT_CONTACT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    getDoc(doc(db, 'settings', 'contact'))
      .then((s) => setC(normalizeContact(s.exists() ? s.data() : {})))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const set = (k: keyof SiteContact, v: string) => setC((p) => ({ ...p, [k]: v }));

  const save = async () => {
    setSaving(true); setMsg('');
    try {
      const clean = normalizeContact(c);
      await setDoc(doc(db, 'settings', 'contact'), { ...clean, updatedAt: serverTimestamp() }, { merge: true });
      setC(clean);
      setMsg('✓ सहेज दिया गया। फुटर में अपने आप लागू हो जाएगा (पेज रिफ्रेश पर दिखेगा)।');
    } catch (e: any) { setMsg('सहेजा नहीं जा सका: ' + e.message); }
    setSaving(false);
  };

  const input: React.CSSProperties = { width: '100%', maxWidth: 440, boxSizing: 'border-box', background: 'var(--bg-162238)', border: '1px solid var(--bd-27354f)', borderRadius: 8, padding: '10px 12px', color: 'var(--fg-ffffff,#fff)', fontSize: 14, fontFamily: 'inherit' };
  const label: React.CSSProperties = { display: 'block', fontSize: 13, color: 'var(--fg-94a3b8)', fontWeight: 600, margin: '16px 0 6px' };

  if (loading) return <div style={{ color: 'var(--fg-94a3b8)', padding: 20 }}>लोड हो रहा है…</div>;

  return (
    <div style={{ color: 'var(--fg-fff,#fff)', maxWidth: 560 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>📞 संपर्क व फुटर जानकारी</h1>
      <p style={{ fontSize: 13, color: 'var(--fg-94a3b8)', margin: '6px 0 0' }}>Gmail, WhatsApp नंबर और काम के घंटे — यहाँ बदलें, सभी पोर्टल के फुटर में लागू होगा।</p>

      {msg && <div style={{ marginTop: 14, background: 'rgba(16,185,129,.12)', border: '1px solid rgba(16,185,129,.35)', color: '#34d399', borderRadius: 8, padding: '9px 12px', fontSize: 13 }}>{msg}</div>}

      <label style={label}>Gmail / ईमेल</label>
      <input style={input} value={c.email} onChange={(e) => set('email', e.target.value)} placeholder="example@gmail.com" />

      <label style={label}>WhatsApp नंबर (देश कोड सहित, सिर्फ़ अंक)</label>
      <input style={input} value={c.whatsapp} onChange={(e) => set('whatsapp', e.target.value)} placeholder="918103333381" />
      <div style={{ fontSize: 11.5, color: 'var(--fg-64748b)', marginTop: 4 }}>जैसे भारत के लिए 91 + 10 अंकों का नंबर → 918103333381</div>

      <label style={label}>काम के घंटे (हिंदी)</label>
      <input style={input} value={c.hoursHi} onChange={(e) => set('hoursHi', e.target.value)} placeholder="सोम–शनि · सुबह 10 से शाम 6" />

      <label style={label}>काम के घंटे (English — अंग्रेज़ी पोर्टल के लिए)</label>
      <input style={input} value={c.hoursEn} onChange={(e) => set('hoursEn', e.target.value)} placeholder="Mon–Sat · 10 AM to 6 PM" />

      <div style={{ marginTop: 22 }}>
        <button onClick={save} disabled={saving} style={{ background: '#ea580c', color: '#fff', border: 'none', borderRadius: 9, padding: '11px 26px', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', opacity: saving ? 0.7 : 1 }}>
          {saving ? 'सहेज रहे…' : 'सहेजें'}
        </button>
      </div>
    </div>
  );
}
