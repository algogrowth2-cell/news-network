'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { collection, getDocs, limit, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import PortalLogo from '@/components/PortalLogo';
import Footer from '@/components/Footer';
import { AdInline, AdLayout } from '@/components/SiteAds';
import { fallbackFor, getActivePortal, logoFor } from '@/lib/siteTheme';
import { authFetch, firebasePhone } from '@/lib/phoneAuth';
import {
  ageFromDob, DIETS, GENDERS, heightLabel, HEIGHT_OPTIONS, INCOME_RANGES,
  MARITAL_STATUS, MOTHER_TONGUES, RELIGIONS, type Gender, type MatrimonyProfile
} from '@/lib/matrimony';

type Tab = 'browse' | 'profile' | 'interests';

/* Portal ke apne rang se theme (har site par us site jaisा dikhe) */
const hexToRgb = (hex: string) => {
  const h = hex.replace('#', '');
  const n = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const i = parseInt(n || 'be185d', 16);
  return { r: (i >> 16) & 255, g: (i >> 8) & 255, b: i & 255 };
};
const tint = (hex: string, a: number) => { const { r, g, b } = hexToRgb(hex); return `rgba(${r},${g},${b},${a})`; };
const darken = (hex: string, f = 0.78) => { const { r, g, b } = hexToRgb(hex); return `rgb(${Math.round(r * f)},${Math.round(g * f)},${Math.round(b * f)})`; };

interface Theme { primary: string; deep: string; soft: string; softer: string; line: string; muted: string; }
const mkTheme = (primary: string): Theme => ({
  primary, deep: darken(primary, 0.72), soft: tint(primary, 0.1), softer: tint(primary, 0.045),
  line: tint(primary, 0.22), muted: '#6b7280'
});

const EMPTY = {
  name: '', gender: '' as Gender | '', dob: '', heightCm: 0, maritalStatus: '', religion: '',
  community: '', motherTongue: '', city: '', state: '', education: '', occupation: '',
  annualIncome: '', diet: '', about: '', family: '', partnerPreference: '', photoUrl: ''
};

function fileToSmallDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const max = 800;
      let { width, height } = img;
      if (width > max || height > max) { const r = Math.min(max / width, max / height); width = Math.round(width * r); height = Math.round(height * r); }
      const c = document.createElement('canvas');
      c.width = width; c.height = height;
      c.getContext('2d')!.drawImage(img, 0, 0, width, height);
      URL.revokeObjectURL(url);
      resolve(c.toDataURL('image/jpeg', 0.82));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('photo')); };
    img.src = url;
  });
}

export default function MatrimonyPage() {
  const [slug, setSlug] = useState('the-local-leader');
  const [cfg, setCfg] = useState(fallbackFor('the-local-leader'));
  const [phone, setPhone] = useState<string | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [tab, setTab] = useState<Tab>('browse');

  const th = mkTheme(cfg.primaryColor || '#be185d');

  useEffect(() => {
    const s = getActivePortal(new URLSearchParams(window.location.search).get('site'));
    setSlug(s); setCfg(fallbackFor(s));
    firebasePhone().then((p) => { setPhone(p); setAuthReady(true); });
  }, []);

  const loginUrl = `/login?redirect=${encodeURIComponent(`/matrimony?site=${slug}`)}`;

  return (
    <div style={{ minHeight: '100vh', background: th.softer }}>
      <header style={{ background: '#fff', borderBottom: `1px solid ${th.line}`, position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 1px 8px rgba(0,0,0,0.05)' }}>
        <div style={{ height: 4, background: `linear-gradient(90deg, ${th.primary}, ${th.deep})` }} />
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '9px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <PortalLogo slug={slug} />
            <div>
              <div style={{ fontWeight: 800, fontSize: 18, color: th.primary, letterSpacing: 0.2 }}>विवाह <span style={{ color: th.deep, fontWeight: 700 }}>· Matrimony</span></div>
              <div style={{ fontSize: 11.5, color: th.muted }} className="notranslate">{cfg.name} · सुरक्षित व सत्यापित रिश्ते</div>
            </div>
          </div>
          <Link href={`/?site=${slug}`} style={{ color: th.primary, fontWeight: 700, fontSize: 13, textDecoration: 'none' }}>← मुख्य वेबसाइट</Link>
        </div>
        <nav style={{ maxWidth: 1200, margin: '0 auto', padding: '0 16px 10px', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {([['browse', '🔍 प्रोफ़ाइल देखें'], ['profile', '📝 मेरी प्रोफ़ाइल'], ['interests', '💌 रुचि']] as [Tab, string][]).map(([t, label]) => {
            const on = tab === t;
            return (
              <button key={t} onClick={() => setTab(t)} style={{
                padding: '8px 16px', borderRadius: 999, border: `1px solid ${on ? th.primary : th.line}`,
                background: on ? th.primary : '#fff', color: on ? '#fff' : th.deep, fontWeight: 700, fontSize: 13, cursor: 'pointer',
                boxShadow: on ? `0 2px 8px ${tint(th.primary, 0.35)}` : 'none', transition: 'all .15s'
              }}>{label}</button>
            );
          })}
        </nav>
      </header>

      <AdLayout color={th.primary}>
        {!authReady ? <Center th={th}>लोड हो रहा है…</Center>
          : !phone ? <LoginGate loginUrl={loginUrl} th={th} />
          : (
            <>
              {tab === 'browse' && <Browse th={th} onCreate={() => setTab('profile')} />}
              {tab === 'profile' && <MyProfile slug={slug} th={th} />}
              {tab === 'interests' && <Interests th={th} onCreate={() => setTab('profile')} />}
              <div style={{ marginTop: 20 }}><AdInline /></div>
            </>
          )}
      </AdLayout>

      <Footer siteName={cfg.name} primaryColor={th.primary} logoUrl={logoFor(slug, cfg.logoUrl)} tagline={cfg.tagline} currentSlug={slug} />
    </div>
  );
}

const Center = ({ th, children }: { th: Theme; children: React.ReactNode }) => (
  <div style={{ padding: 60, textAlign: 'center', color: th.deep, fontSize: 14 }}>{children}</div>
);

/* ---------------- Login gate ---------------- */
function LoginGate({ loginUrl, th }: { loginUrl: string; th: Theme }) {
  return (
    <div style={{ maxWidth: 560, margin: '36px auto', background: '#fff', border: `1px solid ${th.line}`, borderRadius: 18, padding: 34, textAlign: 'center', boxShadow: '0 8px 30px rgba(0,0,0,0.06)' }}>
      <div style={{ width: 72, height: 72, margin: '0 auto', borderRadius: '50%', background: `linear-gradient(135deg, ${th.primary}, ${th.deep})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 34 }}>💍</div>
      <h2 style={{ color: th.deep, margin: '14px 0 8px', fontSize: 21 }}>विवाह प्रोफ़ाइल — लॉगिन करें</h2>
      <p style={{ color: th.muted, fontSize: 14, lineHeight: 1.7 }}>
        सुरक्षा के लिए, प्रोफ़ाइल देखना और बनाना दोनों सिर्फ़ लॉगिन के बाद। <b style={{ color: th.deep }}>किसी का मोबाइल नंबर किसी को नहीं दिखता</b> — रुचि स्वीकृत होने पर ही संपर्क साझा होता है।
      </p>
      <Link href={loginUrl} style={{ display: 'inline-block', marginTop: 16, background: `linear-gradient(135deg, ${th.primary}, ${th.deep})`, color: '#fff', padding: '12px 30px', borderRadius: 12, fontWeight: 700, textDecoration: 'none', boxShadow: `0 4px 14px ${tint(th.primary, 0.4)}` }}>
        लॉगिन / रजिस्टर करें →
      </Link>
    </div>
  );
}

/* ---------------- Browse ---------------- */
function Browse({ th, onCreate }: { th: Theme; onCreate: () => void }) {
  const [list, setList] = useState<MatrimonyProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [genderWant, setGenderWant] = useState<'' | Gender>('');
  const [cityQ, setCityQ] = useState('');
  const [active, setActive] = useState<MatrimonyProfile | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true); setErr('');
      try {
        const snap = await getDocs(query(collection(db, 'matrimony_profiles'), where('status', '==', 'approved'), limit(200)));
        setList(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));
      } catch { setErr('प्रोफ़ाइल लोड नहीं हो पाईं। कृपया दोबारा लॉगिन करें।'); }
      setLoading(false);
    })();
  }, []);

  const filtered = list.filter((p) =>
    (!genderWant || p.gender === genderWant) &&
    (!cityQ || (p.city || '').toLowerCase().includes(cityQ.toLowerCase()) || (p.state || '').toLowerCase().includes(cityQ.toLowerCase())));

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      {/* Hero */}
      <div style={{ background: `linear-gradient(135deg, ${th.primary}, ${th.deep})`, borderRadius: 18, padding: '22px 24px', color: '#fff', marginBottom: 18, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14, boxShadow: `0 8px 24px ${tint(th.primary, 0.3)}` }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800 }}>अपने लिए सही जीवनसाथी खोजें</div>
          <div style={{ fontSize: 13, opacity: 0.92, marginTop: 4 }}>सत्यापित प्रोफ़ाइल · नंबर पूरी तरह सुरक्षित · रुचि स्वीकृत होने पर ही संपर्क</div>
        </div>
        <button onClick={onCreate} style={{ background: '#fff', color: th.deep, border: 'none', borderRadius: 12, padding: '11px 20px', fontWeight: 800, fontSize: 14, cursor: 'pointer', whiteSpace: 'nowrap' }}>+ अपनी प्रोफ़ाइल बनाएं</button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 18, alignItems: 'center' }}>
        <select value={genderWant} onChange={(e) => setGenderWant(e.target.value as any)} style={chip(th)}>
          <option value="">सभी (वर/वधू)</option>
          {GENDERS.map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}
        </select>
        <input value={cityQ} onChange={(e) => setCityQ(e.target.value)} placeholder="🔍 शहर / राज्य खोजें" style={{ ...chip(th), minWidth: 200 }} />
        <span style={{ fontSize: 12.5, color: th.muted, marginLeft: 'auto' }}>{filtered.length} प्रोफ़ाइल</span>
      </div>

      {loading ? <Center th={th}>लोड हो रहा है…</Center>
        : err ? <div style={{ textAlign: 'center', color: '#dc2626', padding: 40 }}>{err}</div>
        : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '50px 20px', background: '#fff', borderRadius: 16, border: `1px solid ${th.line}` }}>
            <div style={{ fontSize: 44 }}>💍</div>
            <p style={{ color: th.muted, fontSize: 14, marginTop: 8 }}>अभी कोई प्रोफ़ाइल उपलब्ध नहीं है। सबसे पहले अपनी प्रोफ़ाइल बनाएं!</p>
            <button onClick={onCreate} style={{ marginTop: 12, background: th.primary, color: '#fff', border: 'none', borderRadius: 10, padding: '10px 22px', fontWeight: 700, cursor: 'pointer' }}>+ प्रोफ़ाइल बनाएं</button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: 16 }}>
            {filtered.map((p) => (
              <button key={p.id} onClick={() => setActive(p)} style={{ textAlign: 'left', background: '#fff', border: `1px solid ${th.line}`, borderRadius: 16, padding: 0, cursor: 'pointer', overflow: 'hidden', boxShadow: '0 3px 14px rgba(0,0,0,0.05)', transition: 'transform .15s, box-shadow .15s' }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = `0 10px 26px ${tint(th.primary, 0.22)}`; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 3px 14px rgba(0,0,0,0.05)'; }}>
                <div style={{ position: 'relative', height: 180, background: th.soft, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {p.photoUrl ? <img src={p.photoUrl} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 54 }}>{p.gender === 'female' ? '👰' : '🤵'}</span>}
                  <span style={{ position: 'absolute', top: 10, right: 10, background: tint(th.deep, 0.92), color: '#fff', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 999 }}>{ageFromDob(p.dob)} वर्ष</span>
                </div>
                <div style={{ padding: 13 }}>
                  <div style={{ fontWeight: 800, color: th.deep, fontSize: 15.5 }}>{p.name}</div>
                  <div style={{ fontSize: 12.5, color: th.muted, marginTop: 4, display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                    <span style={pill(th)}>{heightLabel(p.heightCm)}</span>
                    <span style={pill(th)}>{p.religion}</span>
                  </div>
                  <div style={{ fontSize: 12.5, color: th.muted, marginTop: 7 }}>📍 {p.city}, {p.state}</div>
                  <div style={{ fontSize: 12.5, color: th.deep, marginTop: 3, fontWeight: 600 }}>💼 {p.occupation}</div>
                </div>
              </button>
            ))}
          </div>
        )}

      {active && <ProfileModal p={active} th={th} onClose={() => setActive(null)} />}
    </div>
  );
}

/* ---------------- Profile modal ---------------- */
function ProfileModal({ p, th, onClose }: { p: MatrimonyProfile; th: Theme; onClose: () => void }) {
  const [sending, setSending] = useState(false);
  const [msg, setMsg] = useState('');
  const [contact, setContact] = useState('');

  const sendInterest = async () => {
    setSending(true); setMsg('');
    try {
      const r = await authFetch('/api/matrimony/interest', { method: 'POST', body: JSON.stringify({ action: 'send', toProfileId: p.id }) });
      const j = await r.json();
      setMsg(r.ok ? (j.already ? 'आप पहले ही रुचि भेज चुके हैं।' : '💌 रुचि भेज दी गई। स्वीकृत होने पर संपर्क मिलेगा।') : (j.message || 'रुचि नहीं भेजी जा सकी।'));
    } catch { setMsg('कुछ गड़बड़ हुई, दोबारा प्रयास करें।'); }
    setSending(false);
  };
  const viewContact = async () => {
    const r = await authFetch(`/api/matrimony/contact?profileId=${encodeURIComponent(p.id)}`);
    const j = await r.json();
    if (r.ok) setContact(j.contactPhone); else setMsg(j.message || 'संपर्क अभी उपलब्ध नहीं है।');
  };

  const row = (k: string, v?: string) => v ? (
    <div style={{ display: 'flex', gap: 10, padding: '7px 0', borderBottom: `1px solid ${th.softer}`, fontSize: 13.5 }}>
      <span style={{ color: th.primary, minWidth: 118, fontWeight: 700 }}>{k}</span><span style={{ color: '#374151' }}>{v}</span>
    </div>) : null;

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(17,17,17,0.55)', zIndex: 200, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: 16, overflowY: 'auto' }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: '#fff', borderRadius: 20, maxWidth: 580, width: '100%', margin: '20px 0', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
        <div style={{ position: 'relative', height: 260, background: th.soft, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {p.photoUrl ? <img src={p.photoUrl} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 90 }}>{p.gender === 'female' ? '👰' : '🤵'}</span>}
          <button onClick={onClose} style={{ position: 'absolute', top: 12, right: 12, width: 34, height: 34, borderRadius: '50%', border: 'none', background: 'rgba(0,0,0,0.5)', color: '#fff', fontSize: 16, cursor: 'pointer' }}>✕</button>
        </div>
        <div style={{ padding: 22 }}>
          <h2 style={{ margin: 0, color: th.deep, fontSize: 23 }}>{p.name}, {ageFromDob(p.dob)} वर्ष</h2>
          <p style={{ margin: '4px 0 16px', color: th.muted, fontSize: 13.5 }}>{heightLabel(p.heightCm)} · {p.maritalStatus} · {p.city}, {p.state}</p>
          {row('धर्म', p.religion)}{row('समुदाय', p.community)}{row('मातृभाषा', p.motherTongue)}
          {row('शिक्षा', p.education)}{row('व्यवसाय', p.occupation)}{row('आय', p.annualIncome)}{row('आहार', p.diet)}
          {row('परिवार', p.family)}{row('अपने बारे में', p.about)}{row('जीवनसाथी में', p.partnerPreference)}

          {contact ? (
            <div style={{ marginTop: 16, background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: 12, padding: 14, textAlign: 'center' }}>
              <div style={{ fontSize: 12, color: '#047857' }}>संपर्क नंबर</div>
              <a href={`tel:${contact}`} style={{ fontSize: 22, fontWeight: 800, color: '#065f46', textDecoration: 'none' }}>📞 {contact}</a>
            </div>
          ) : (
            <div style={{ marginTop: 18, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button disabled={sending} onClick={sendInterest} style={{ flex: 1, minWidth: 170, background: `linear-gradient(135deg, ${th.primary}, ${th.deep})`, color: '#fff', border: 'none', borderRadius: 12, padding: '12px 16px', fontWeight: 800, fontSize: 14.5, cursor: 'pointer' }}>
                {sending ? 'भेज रहे…' : '💌 रुचि भेजें'}
              </button>
              <button onClick={viewContact} style={{ background: '#fff', color: th.primary, border: `1px solid ${th.primary}`, borderRadius: 12, padding: '12px 16px', fontWeight: 700, cursor: 'pointer' }}>संपर्क देखें</button>
            </div>
          )}
          {msg && <p style={{ marginTop: 12, color: th.deep, fontSize: 13, textAlign: 'center' }}>{msg}</p>}
          <p style={{ marginTop: 12, fontSize: 11.5, color: '#9ca3af', textAlign: 'center' }}>🔒 नंबर तभी दिखता है जब रुचि स्वीकृत हो।</p>
        </div>
      </div>
    </div>
  );
}

/* ---------------- My profile ---------------- */
function MyProfile({ slug, th }: { slug: string; th: Theme }) {
  const [f, setF] = useState<any>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [status, setStatus] = useState<string>('');

  useEffect(() => {
    (async () => {
      try { const r = await authFetch('/api/matrimony/profile'); const j = await r.json(); if (j.profile) { setF({ ...EMPTY, ...j.profile }); setStatus(j.profile.status); } } catch {}
      setLoading(false);
    })();
  }, []);

  const set = (k: string, v: any) => setF((p: any) => ({ ...p, [k]: v }));
  const onPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    if (file.size > 8 * 1024 * 1024) { setMsg('फोटो 8MB से छोटी चुनें।'); return; }
    try { set('photoUrl', await fileToSmallDataUrl(file)); } catch { setMsg('फोटो लोड नहीं हुई।'); }
  };
  const save = async () => {
    setSaving(true); setMsg('');
    try {
      const r = await authFetch('/api/matrimony/profile', { method: 'POST', body: JSON.stringify({ ...f, siteId: slug }) });
      const j = await r.json();
      if (r.ok) { setStatus('pending'); setMsg('✅ प्रोफ़ाइल सहेज दी गई। एडमिन स्वीकृति के बाद यह वेबसाइट पर दिखेगी।'); window.scrollTo({ top: 0, behavior: 'smooth' }); }
      else setMsg(j.message || 'सहेजा नहीं जा सका।');
    } catch { setMsg('कुछ गड़बड़ हुई, दोबारा प्रयास करें।'); }
    setSaving(false);
  };

  if (loading) return <Center th={th}>लोड हो रहा है…</Center>;
  const card: React.CSSProperties = { background: '#fff', border: `1px solid ${th.line}`, borderRadius: 16, padding: 20, marginBottom: 16 };
  const sec = (t: string) => <div style={{ fontSize: 13, fontWeight: 800, color: th.primary, margin: '2px 0 10px', borderLeft: `3px solid ${th.primary}`, paddingLeft: 8 }}>{t}</div>;

  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>
      <h2 style={{ color: th.deep, margin: '0 0 14px', fontSize: 22 }}>मेरी विवाह प्रोफ़ाइल</h2>
      {status && (
        <div style={{ background: status === 'approved' ? '#ecfdf5' : status === 'rejected' ? '#fef2f2' : th.softer, border: `1px solid ${status === 'approved' ? '#a7f3d0' : status === 'rejected' ? '#fecaca' : th.line}`, borderRadius: 10, padding: '10px 14px', fontSize: 13, color: status === 'approved' ? '#047857' : status === 'rejected' ? '#b91c1c' : th.deep, marginBottom: 14, fontWeight: 600 }}>
          स्थिति: {status === 'approved' ? '✅ स्वीकृत — वेबसाइट पर live' : status === 'rejected' ? '❌ अस्वीकृत — कृपया सही जानकारी भरें' : '⏳ समीक्षा में — एडमिन स्वीकृति के बाद दिखेगी'}
        </div>
      )}
      {msg && <div style={{ background: th.softer, border: `1px solid ${th.line}`, borderRadius: 10, padding: '10px 14px', fontSize: 13.5, color: th.deep, marginBottom: 14 }}>{msg}</div>}

      <div style={card}>
        {sec('मूल जानकारी')}
        <div style={grid2}>
          <Field th={th} label="पूरा नाम *"><input style={inp(th)} value={f.name} onChange={(e) => set('name', e.target.value)} /></Field>
          <Field th={th} label="लिंग *"><select style={inp(th)} value={f.gender} onChange={(e) => set('gender', e.target.value)}><option value="">चुनें</option>{GENDERS.map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}</select></Field>
          <Field th={th} label="जन्मतिथि *"><input type="date" style={inp(th)} value={f.dob} onChange={(e) => set('dob', e.target.value)} /></Field>
          <Field th={th} label="लंबाई *"><select style={inp(th)} value={f.heightCm} onChange={(e) => set('heightCm', Number(e.target.value))}><option value={0}>चुनें</option>{HEIGHT_OPTIONS.map((h) => <option key={h.cm} value={h.cm}>{h.label}</option>)}</select></Field>
          <Field th={th} label="वैवाहिक स्थिति *"><select style={inp(th)} value={f.maritalStatus} onChange={(e) => set('maritalStatus', e.target.value)}><option value="">चुनें</option>{MARITAL_STATUS.map((m) => <option key={m} value={m}>{m}</option>)}</select></Field>
          <Field th={th} label="आहार"><select style={inp(th)} value={f.diet} onChange={(e) => set('diet', e.target.value)}><option value="">चुनें (वैकल्पिक)</option>{DIETS.map((d) => <option key={d} value={d}>{d}</option>)}</select></Field>
        </div>
      </div>

      <div style={card}>
        {sec('धर्म व समुदाय')}
        <div style={grid2}>
          <Field th={th} label="धर्म *"><select style={inp(th)} value={f.religion} onChange={(e) => set('religion', e.target.value)}><option value="">चुनें</option>{RELIGIONS.map((r) => <option key={r} value={r}>{r}</option>)}</select></Field>
          <Field th={th} label="समुदाय / जाति"><input style={inp(th)} value={f.community} onChange={(e) => set('community', e.target.value)} placeholder="(वैकल्पिक)" /></Field>
          <Field th={th} label="मातृभाषा *"><select style={inp(th)} value={f.motherTongue} onChange={(e) => set('motherTongue', e.target.value)}><option value="">चुनें</option>{MOTHER_TONGUES.map((m) => <option key={m} value={m}>{m}</option>)}</select></Field>
        </div>
      </div>

      <div style={card}>
        {sec('स्थान, शिक्षा व कार्य')}
        <div style={grid2}>
          <Field th={th} label="शहर *"><input style={inp(th)} value={f.city} onChange={(e) => set('city', e.target.value)} /></Field>
          <Field th={th} label="राज्य *"><input style={inp(th)} value={f.state} onChange={(e) => set('state', e.target.value)} /></Field>
          <Field th={th} label="शिक्षा *"><input style={inp(th)} value={f.education} onChange={(e) => set('education', e.target.value)} placeholder="जैसे B.A., B.Tech" /></Field>
          <Field th={th} label="व्यवसाय *"><input style={inp(th)} value={f.occupation} onChange={(e) => set('occupation', e.target.value)} placeholder="जैसे शिक्षक, व्यापार" /></Field>
          <Field th={th} label="वार्षिक आय"><select style={inp(th)} value={f.annualIncome} onChange={(e) => set('annualIncome', e.target.value)}><option value="">चुनें (वैकल्पिक)</option>{INCOME_RANGES.map((i) => <option key={i} value={i}>{i}</option>)}</select></Field>
        </div>
      </div>

      <div style={card}>
        {sec('परिवार व अपेक्षा')}
        <Field th={th} label="परिवार (संक्षेप में)"><textarea style={{ ...inp(th), minHeight: 60 }} value={f.family} onChange={(e) => set('family', e.target.value)} placeholder="पिता/माता का कार्य, भाई-बहन…" /></Field>
        <Field th={th} label="अपने बारे में"><textarea style={{ ...inp(th), minHeight: 70 }} value={f.about} onChange={(e) => set('about', e.target.value)} /></Field>
        <Field th={th} label="कैसा जीवनसाथी चाहिए"><textarea style={{ ...inp(th), minHeight: 60 }} value={f.partnerPreference} onChange={(e) => set('partnerPreference', e.target.value)} /></Field>
      </div>

      <div style={card}>
        {sec('फोटो')}
        <div style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
          {f.photoUrl && <img src={f.photoUrl} alt="" style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 12, border: `1px solid ${th.line}` }} />}
          <input type="file" accept="image/*" onChange={onPhoto} style={{ fontSize: 13 }} />
          {f.photoUrl && <button onClick={() => set('photoUrl', '')} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: 12.5 }}>हटाएं</button>}
        </div>
      </div>

      <p style={{ fontSize: 11.5, color: '#9ca3af', margin: '0 0 12px' }}>🔒 आपका मोबाइल नंबर प्रोफ़ाइल में कहीं नहीं दिखेगा। किसी की रुचि स्वीकृत करने पर ही आपका संपर्क उस तक पहुँचेगा।</p>
      <button disabled={saving} onClick={save} style={{ width: '100%', background: `linear-gradient(135deg, ${th.primary}, ${th.deep})`, color: '#fff', border: 'none', borderRadius: 12, padding: 14, fontWeight: 800, fontSize: 15.5, cursor: 'pointer', boxShadow: `0 4px 16px ${tint(th.primary, 0.35)}` }}>
        {saving ? 'सहेज रहे…' : status ? 'प्रोफ़ाइल अपडेट करें' : 'प्रोफ़ाइल सहेजें'}
      </button>
    </div>
  );
}

/* ---------------- Interests ---------------- */
function Interests({ th, onCreate }: { th: Theme; onCreate: () => void }) {
  const [data, setData] = useState<{ sent: any[]; received: any[]; hasProfile: boolean } | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try { const r = await authFetch('/api/matrimony/interest'); setData(await r.json()); } catch {}
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  const respond = async (interestId: string, accept: boolean) => {
    setBusy(interestId);
    await authFetch('/api/matrimony/interest', { method: 'POST', body: JSON.stringify({ action: 'respond', interestId, accept }) });
    await load(); setBusy('');
  };
  const viewContact = async (profileId: string, interestId: string) => {
    setBusy(interestId);
    const r = await authFetch(`/api/matrimony/contact?profileId=${encodeURIComponent(profileId)}`);
    const j = await r.json();
    alert(r.ok ? `संपर्क नंबर: ${j.contactPhone}` : (j.message || 'संपर्क उपलब्ध नहीं।'));
    setBusy('');
  };

  if (loading) return <Center th={th}>लोड हो रहा है…</Center>;

  const Item = ({ it, incoming }: { it: any; incoming: boolean }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#fff', border: `1px solid ${th.line}`, borderRadius: 14, padding: 13, marginBottom: 10, boxShadow: '0 2px 10px rgba(0,0,0,0.04)' }}>
      <div style={{ width: 54, height: 54, borderRadius: 12, background: th.soft, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {it.profile.photoUrl ? <img src={it.profile.photoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 26 }}>💍</span>}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 800, color: th.deep, fontSize: 14.5 }}>{it.profile.name || 'प्रोफ़ाइल'}{it.profile.age ? `, ${it.profile.age}` : ''}</div>
        <div style={{ fontSize: 12, color: th.muted }}>{[it.profile.city, it.profile.occupation].filter(Boolean).join(' · ')}</div>
        <div style={{ fontSize: 11.5, marginTop: 3, fontWeight: 700, color: it.status === 'accepted' ? '#047857' : it.status === 'declined' ? '#dc2626' : '#b45309' }}>
          {it.status === 'accepted' ? '✅ स्वीकृत' : it.status === 'declined' ? '❌ अस्वीकृत' : '⏳ प्रतीक्षा में'}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
        {incoming && it.status === 'pending' && (
          <>
            <button disabled={busy === it.interestId} onClick={() => respond(it.interestId, true)} style={{ background: '#059669', color: '#fff', border: 'none', borderRadius: 9, padding: '8px 13px', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>स्वीकारें</button>
            <button disabled={busy === it.interestId} onClick={() => respond(it.interestId, false)} style={{ background: '#fff', color: '#dc2626', border: '1px solid #fecaca', borderRadius: 9, padding: '8px 13px', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>मना</button>
          </>
        )}
        {it.canSeeContact && it.profile.id && (
          <button disabled={busy === it.interestId} onClick={() => viewContact(it.profile.id, it.interestId)} style={{ background: th.primary, color: '#fff', border: 'none', borderRadius: 9, padding: '8px 13px', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>📞 संपर्क</button>
        )}
      </div>
    </div>
  );

  return (
    <div style={{ maxWidth: 700, margin: '0 auto' }}>
      {!data?.hasProfile && (
        <div style={{ background: th.softer, border: `1px solid ${th.line}`, borderRadius: 12, padding: 14, fontSize: 13, color: th.deep, marginBottom: 18, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <span>रुचि भेजने/पाने के लिए पहले अपनी प्रोफ़ाइल बनाएं।</span>
          <button onClick={onCreate} style={{ background: th.primary, color: '#fff', border: 'none', borderRadius: 9, padding: '8px 16px', fontWeight: 700, fontSize: 12.5, cursor: 'pointer' }}>+ प्रोफ़ाइल बनाएं</button>
        </div>
      )}
      <h3 style={{ color: th.deep, fontSize: 16.5, margin: '6px 0 12px' }}>💌 मेरे पास आई रुचि</h3>
      {data?.received?.length ? data.received.map((it) => <Item key={it.interestId} it={it} incoming />) : <p style={{ color: '#9ca3af', fontSize: 13 }}>अभी कोई रुचि नहीं आई।</p>}
      <h3 style={{ color: th.deep, fontSize: 16.5, margin: '24px 0 12px' }}>📤 मेरी भेजी रुचि</h3>
      {data?.sent?.length ? data.sent.map((it) => <Item key={it.interestId} it={it} incoming={false} />) : <p style={{ color: '#9ca3af', fontSize: 13 }}>आपने अभी तक कोई रुचि नहीं भेजी।</p>}
    </div>
  );
}

/* ---------------- shared styles ---------------- */
const grid2: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 12 };
const inp = (th: Theme): React.CSSProperties => ({ width: '100%', padding: '10px 12px', border: `1px solid ${th.line}`, borderRadius: 9, fontSize: 14, background: '#fff', color: '#111', outline: 'none' });
const chip = (th: Theme): React.CSSProperties => ({ padding: '9px 14px', border: `1px solid ${th.line}`, borderRadius: 999, fontSize: 13.5, background: '#fff', color: th.deep, fontWeight: 600, outline: 'none' });
const pill = (th: Theme): React.CSSProperties => ({ background: th.soft, color: th.deep, fontSize: 11.5, fontWeight: 600, padding: '2px 9px', borderRadius: 999 });
function Field({ label, children, th }: { label: string; children: React.ReactNode; th: Theme }) {
  return <label style={{ display: 'block', margin: '10px 0 0' }}><span style={{ display: 'block', fontSize: 12.5, color: th.deep, fontWeight: 600, marginBottom: 5 }}>{label}</span>{children}</label>;
}
