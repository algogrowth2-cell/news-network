'use client';
import { useEffect, useState } from 'react';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { daysLabel, DEFAULT_PRICING, normalizePricing, PRICE_LIMITS, type Pricing } from '@/lib/pricing';
import styles from '../Admin.module.css';

/*
 * Saare paid plans ki keemat + muddat (settings/pricing). Yahan badlo → website + server (payment jaanch) dono me lagta hai.
 * Badlaav sirf NAYE bhugtan par; pehle se chalu plan / vigyapan apni muddat tak chalte rahte hain.
 */

type Row = { key: string; label: string; hint?: string; get: (p: Pricing) => { price: number; days?: number }; set: (p: Pricing, v: { price: number; days?: number }) => Pricing; noDays?: boolean; zeroDaysOk?: boolean };

const clone = (p: Pricing): Pricing => JSON.parse(JSON.stringify(p));

const SECTIONS: { title: string; icon: string; note: string; rows: Row[] }[] = [
  {
    title: 'ई-पेपर सब्सक्रिप्शन',
    icon: '📰',
    note: 'हर पोर्टल का अलग सब्सक्रिप्शन (जिन पोर्टल पर ई-पेपर है)।',
    rows: [
      { key: 'ep-m', label: 'छोटा प्लान (मासिक)', get: (p) => p.epaper.epaper_1_month, set: (p, v) => ({ ...p, epaper: { ...p.epaper, epaper_1_month: { price: v.price, days: v.days! } } }) },
      { key: 'ep-y', label: 'बड़ा प्लान (वार्षिक)', get: (p) => p.epaper.epaper_1_year, set: (p, v) => ({ ...p, epaper: { ...p.epaper, epaper_1_year: { price: v.price, days: v.days! } } }) }
    ]
  },
  {
    title: 'पत्रकार',
    icon: '🧑‍💼',
    note: 'पत्रकार सेवा सदस्यता हर पोर्टल की अलग।',
    rows: [
      { key: 'mem', label: 'पत्रकार सेवा सदस्यता', get: (p) => p.membership, set: (p, v) => ({ ...p, membership: { price: v.price, days: v.days! } }) },
      { key: 'del', label: 'प्रेस किट होम डिलीवरी', noDays: true, get: (p) => p.delivery, set: (p, v) => ({ ...p, delivery: { price: v.price } }) }
    ]
  },
  {
    title: 'शोक संदेश',
    icon: '🕊️',
    note: 'दिन एडमिन की स्वीकृति के दिन से गिने जाते हैं।',
    rows: [
      { key: 'sk1', label: 'छोटा प्लान', get: (p) => p.shok.shok_7_days, set: (p, v) => ({ ...p, shok: { ...p.shok, shok_7_days: { price: v.price, days: v.days! } } }) },
      { key: 'sk2', label: 'बड़ा प्लान', get: (p) => p.shok.shok_30_days, set: (p, v) => ({ ...p, shok: { ...p.shok, shok_30_days: { price: v.price, days: v.days! } } }) }
    ]
  },
  {
    title: 'विज्ञापन',
    icon: '📢',
    note: 'दिन = 0 रखें तो कोई समय-सीमा नहीं। दिन एडमिन की स्वीकृति के दिन से गिने जाते हैं।',
    rows: (['banner', 'sidebar', 'classified', 'popup'] as const).map((f) => ({
      key: `ad-${f}`,
      label: { banner: 'हेडर बैनर (728 × 90)', sidebar: 'साइडबार बैनर (300 × 250)', classified: 'क्लासिफाइड', popup: 'पॉप-अप' }[f],
      zeroDaysOk: true,
      get: (p: Pricing) => p.ads[f],
      set: (p: Pricing, v: { price: number; days?: number }) => ({ ...p, ads: { ...p.ads, [f]: { price: v.price, days: v.days! } } })
    }))
  }
];

export default function PricingAdminPage() {
  const [saved, setSaved] = useState<Pricing>(DEFAULT_PRICING);
  const [draft, setDraft] = useState<Pricing>(DEFAULT_PRICING);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  useEffect(() => {
    getDoc(doc(db, 'settings', 'pricing'))
      .then((snap) => {
        const p = normalizePricing(snap.exists() ? snap.data() : {});
        setSaved(p);
        setDraft(clone(p));
        const t = snap.data()?.updatedAt;
        if (t?.toDate) setUpdatedAt(t.toDate());
      })
      .catch((e) => setMsg({ ok: false, text: 'कीमतें लोड नहीं हो पाईं: ' + e.message }))
      .finally(() => setLoading(false));
  }, []);

  const bad = (r: Row) => {
    const v = r.get(draft);
    const priceBad = !Number.isInteger(v.price) || v.price < PRICE_LIMITS.minPrice || v.price > PRICE_LIMITS.maxPrice;
    const d = v.days ?? 1;
    const daysBad = !r.noDays && (!Number.isInteger(d) || d > PRICE_LIMITS.maxDays || d < (r.zeroDaysOk ? 0 : 1));
    return priceBad || daysBad;
  };
  const anyBad = SECTIONS.some((s) => s.rows.some(bad));
  const changed = JSON.stringify(saved) !== JSON.stringify(draft);

  const update = (r: Row, field: 'price' | 'days', raw: string) => {
    const n = raw === '' ? NaN : Number(raw);
    const cur = r.get(draft);
    setDraft(r.set(clone(draft), { ...cur, [field]: n }));
    setMsg(null);
  };

  const save = async () => {
    if (anyBad) return setMsg({ ok: false, text: 'लाल रंग वाले खाने सही करें।' });
    if (!confirm('नई कीमतें सेव करें? ये सिर्फ़ नए भुगतान पर लागू होंगी — चालू प्लान पर असर नहीं।')) return;
    setSaving(true);
    try {
      const p = normalizePricing(draft);
      await setDoc(doc(db, 'settings', 'pricing'), { ...p, updatedAt: serverTimestamp() });
      setSaved(p);
      setDraft(clone(p));
      setUpdatedAt(new Date());
      setMsg({ ok: true, text: '✓ कीमतें सेव हो गईं। वेबसाइट पर तुरंत लागू (नए भुगतान पर)।' });
    } catch (e: any) {
      setMsg({ ok: false, text: 'सेव नहीं हो पाया: ' + e.message });
    }
    setSaving(false);
  };

  const input: React.CSSProperties = { width: '110px', boxSizing: 'border-box', background: 'var(--bg-162238)', border: '1px solid var(--bd-27354f)', borderRadius: '6px', padding: '8px 10px', color: 'var(--fg-ffffff)', fontSize: '14px' };

  return (
    <div style={{ color: 'var(--fg-fff)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap', marginBottom: '18px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, margin: 0 }}>💳 प्लान व कीमतें (Membership & Pricing)</h1>
          <p style={{ fontSize: '13px', color: 'var(--fg-94a3b8)', margin: '6px 0 0' }}>
            सभी पेड प्लान की कीमत और अवधि यहीं से बदलें — वेबसाइट और पेमेंट जांच दोनों में तुरंत लागू। चालू प्लान / विज्ञापन अपनी पुरानी अवधि तक चलते रहेंगे।
          </p>
          {updatedAt && <p style={{ fontSize: '12px', color: 'var(--fg-94a3b8)', margin: '4px 0 0' }}>आख़िरी बदलाव: {updatedAt.toLocaleString('hi-IN')}</p>}
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className={styles.btnPrimary} style={{ background: 'transparent', border: '1px solid var(--bd-334155)' }} disabled={!changed || saving} onClick={() => setDraft(clone(saved))}>
            बदलाव रद्द करें
          </button>
          <button className={styles.btnPrimary} disabled={!changed || saving || anyBad} onClick={save}>
            {saving ? 'सेव हो रहा है…' : '💾 कीमतें सेव करें'}
          </button>
        </div>
      </div>

      {msg && (
        <div style={{ marginBottom: '14px', padding: '10px 14px', borderRadius: '8px', fontSize: '13.5px', background: msg.ok ? 'rgba(22,163,74,.15)' : 'rgba(220,38,38,.15)', color: msg.ok ? '#4ade80' : '#f87171' }}>{msg.text}</div>
      )}

      {loading ? (
        <div style={{ padding: '30px', color: 'var(--fg-94a3b8)' }}>लोड हो रहा है…</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '18px' }}>
          {SECTIONS.map((sec) => (
            <div key={sec.title} className={styles.formCard}>
              <h3 style={{ fontSize: '17px', fontWeight: 700, margin: '0 0 4px' }}>
                {sec.icon} {sec.title}
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--fg-94a3b8)', margin: '0 0 12px' }}>{sec.note}</p>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13.5px' }}>
                <thead>
                  <tr style={{ color: 'var(--fg-94a3b8)', fontSize: '12px', textAlign: 'left' }}>
                    <th style={{ padding: '6px 4px' }}>प्लान</th>
                    <th style={{ padding: '6px 4px' }}>कीमत (₹)</th>
                    <th style={{ padding: '6px 4px' }}>अवधि (दिन)</th>
                  </tr>
                </thead>
                <tbody>
                  {sec.rows.map((r) => {
                    const v = r.get(draft);
                    const isBad = bad(r);
                    const was = r.get(saved);
                    return (
                      <tr key={r.key} style={{ borderTop: '1px solid var(--bd-1e293b)' }}>
                        <td style={{ padding: '10px 4px' }}>
                          <b>{r.label}</b>
                          <div style={{ fontSize: '11.5px', color: 'var(--fg-94a3b8)' }}>
                            अभी: ₹{was.price}
                            {!r.noDays && ` · ${was.days ? daysLabel(was.days as number) : 'कोई सीमा नहीं'}`}
                          </div>
                        </td>
                        <td style={{ padding: '10px 4px' }}>
                          <input type="number" min={1} step={1} value={Number.isNaN(v.price) ? '' : v.price} onChange={(e) => update(r, 'price', e.target.value)} style={{ ...input, borderColor: isBad && (!Number.isInteger(v.price) || v.price < 1) ? '#ef4444' : 'var(--bd-27354f)' }} />
                        </td>
                        <td style={{ padding: '10px 4px' }}>
                          {r.noDays ? (
                            <span style={{ color: 'var(--fg-94a3b8)', fontSize: '12px' }}>—</span>
                          ) : (
                            <>
                              <input type="number" min={r.zeroDaysOk ? 0 : 1} step={1} value={Number.isNaN(v.days as number) ? '' : v.days} onChange={(e) => update(r, 'days', e.target.value)} style={{ ...input, width: '90px', borderColor: isBad ? '#ef4444' : 'var(--bd-27354f)' }} />
                              <div style={{ fontSize: '11px', color: 'var(--fg-94a3b8)', marginTop: '3px' }}>{v.days ? daysLabel(v.days as number) : r.zeroDaysOk ? 'कोई सीमा नहीं' : ''}</div>
                            </>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}

      <p style={{ fontSize: '12px', color: 'var(--fg-94a3b8)', marginTop: '16px' }}>
        सीमा: कीमत ₹{PRICE_LIMITS.minPrice} – ₹{PRICE_LIMITS.maxPrice.toLocaleString('en-IN')}, अवधि अधिकतम {PRICE_LIMITS.maxDays} दिन। 365 दिन = 1 वर्ष, 30 दिन = 1 महीना।
      </p>
    </div>
  );
}
