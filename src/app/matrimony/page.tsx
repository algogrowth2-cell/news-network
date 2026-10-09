'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { collection, getDocs, limit, orderBy, query, where } from 'firebase/firestore';
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

const EMPTY = {
  name: '', gender: '' as Gender | '', dob: '', heightCm: 0, maritalStatus: '', religion: '',
  community: '', motherTongue: '', city: '', state: '', education: '', occupation: '',
  annualIncome: '', diet: '', about: '', family: '', partnerPreference: '', photoUrl: ''
};

// Photo ko chhota (max 800px, jpeg) — Firestore 1MB seema me
function fileToSmallDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const max = 800;
      let { width, height } = img;
      if (width > max || height > max) {
        const r = Math.min(max / width, max / height);
        width = Math.round(width * r);
        height = Math.round(height * r);
      }
      const c = document.createElement('canvas');
      c.width = width; c.height = height;
      c.getContext('2d')!.drawImage(img, 0, 0, width, height);
      URL.revokeObjectURL(url);
      resolve(c.toDataURL('image/jpeg', 0.8));
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

  const primary = cfg.primaryColor || '#be185d';

  useEffect(() => {
    const s = getActivePortal(new URLSearchParams(window.location.search).get('site'));
    setSlug(s);
    setCfg(fallbackFor(s));
    firebasePhone().then((p) => { setPhone(p); setAuthReady(true); });
  }, []);

  const loginUrl = `/login?redirect=${encodeURIComponent(`/matrimony?site=${slug}`)}`;

  return (
    <div style={{ minHeight: '100vh', background: '#fdf2f8' }}>
      <header style={{ background: '#fff', borderBottom: '1px solid #fbcfe8', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <PortalLogo slug={slug} />
            <div>
              <div style={{ fontWeight: 800, fontSize: 18, color: primary }}>विवाह · Matrimony</div>
              <div style={{ fontSize: 11.5, color: '#9d174d' }}>{cfg.name} · सुरक्षित रिश्ते</div>
            </div>
          </div>
          <Link href={`/?site=${slug}`} style={{ color: primary, fontWeight: 700, fontSize: 13, textDecoration: 'none' }}>← मुख्य वेबसाइट</Link>
        </div>
        <nav style={{ maxWidth: 1200, margin: '0 auto', padding: '0 16px 10px', display: 'flex', gap: 8 }}>
          {([['browse', 'प्रोफ़ाइल देखें'], ['profile', 'मेरी प्रोफ़ाइल'], ['interests', 'रुचि (Interest)']] as [Tab, string][]).map(([t, label]) => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: '7px 14px', borderRadius: 999, border: `1px solid ${tab === t ? primary : '#f9a8d4'}`,
              background: tab === t ? primary : '#fff', color: tab === t ? '#fff' : '#9d174d', fontWeight: 700, fontSize: 13, cursor: 'pointer'
            }}>{label}</button>
          ))}
        </nav>
      </header>

      <AdLayout color={primary}>
        {!authReady ? (
          <div style={{ padding: 60, textAlign: 'center', color: '#9d174d' }}>लोड हो रहा है…</div>
        ) : !phone ? (
          <LoginGate loginUrl={loginUrl} primary={primary} />
        ) : (
          <>
            {tab === 'browse' && <Browse slug={slug} primary={primary} myPhone={phone} />}
            {tab === 'profile' && <MyProfile slug={slug} primary={primary} />}
            {tab === 'interests' && <Interests primary={primary} />}
            <AdInline />
          </>
        )}
      </AdLayout>

      <Footer siteName={cfg.name} primaryColor={primary} logoUrl={logoFor(slug, cfg.logoUrl)} tagline={cfg.tagline} currentSlug={slug} />
    </div>
  );
}

/* ---------------- Login zaroori ---------------- */
function LoginGate({ loginUrl, primary }: { loginUrl: string; primary: string }) {
  return (
    <div style={{ maxWidth: 520, margin: '40px auto', background: '#fff', border: '1px solid #fbcfe8', borderRadius: 16, padding: 30, textAlign: 'center' }}>
      <div style={{ fontSize: 40 }}>💍</div>
      <h2 style={{ color: primary, margin: '10px 0 6px', fontSize: 20 }}>विवाह प्रोफ़ाइल देखने के लिए लॉगिन करें</h2>
      <p style={{ color: '#6b7280', fontSize: 14, lineHeight: 1.6 }}>
        सुरक्षा के लिए — प्रोफ़ाइल देखना और बनाना, दोनों सिर्फ़ लॉगिन के बाद। किसी का मोबाइल नंबर किसी को नहीं दिखता;
        रुचि स्वीकृत होने पर ही संपर्क साझा होता है।
      </p>
      <Link href={loginUrl} style={{ display: 'inline-block', marginTop: 14, background: primary, color: '#fff', padding: '11px 26px', borderRadius: 10, fontWeight: 700, textDecoration: 'none' }}>
        लॉगिन / रजिस्टर करें
      </Link>
    </div>
  );
}

/* ---------------- Browse (approved profiles) ---------------- */
function Browse({ slug, primary, myPhone }: { slug: string; primary: string; myPhone: string }) {
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
      } catch (e) {
        setErr('प्रोफ़ाइल लोड नहीं हो पाईं। कृपया दोबारा लॉगिन करें।');
      }
      setLoading(false);
    })();
  }, []);

  const filtered = list.filter((p) =>
    (!genderWant || p.gender === genderWant) &&
    (!cityQ || (p.city || '').toLowerCase().includes(cityQ.toLowerCase()) || (p.state || '').toLowerCase().includes(cityQ.toLowerCase()))
  );

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', margin: '4px 0 16px' }}>
        <select value={genderWant} onChange={(e) => setGenderWant(e.target.value as any)} style={selStyle}>
          <option value="">सभी (वर/वधू)</option>
          {GENDERS.map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}
        </select>
        <input value={cityQ} onChange={(e) => setCityQ(e.target.value)} placeholder="शहर / राज्य खोजें" style={{ ...selStyle, minWidth: 180 }} />
      </div>

      {loading ? <p style={{ textAlign: 'center', color: '#9d174d', padding: 40 }}>लोड हो रहा है…</p>
        : err ? <p style={{ textAlign: 'center', color: '#dc2626', padding: 40 }}>{err}</p>
        : filtered.length === 0 ? <p style={{ textAlign: 'center', color: '#6b7280', padding: 40 }}>अभी कोई प्रोफ़ाइल उपलब्ध नहीं है।</p>
        : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(230px,1fr))', gap: 14 }}>
            {filtered.map((p) => (
              <button key={p.id} onClick={() => setActive(p)} style={cardStyle}>
                <div style={{ height: 150, background: '#fce7f3', borderRadius: 10, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {p.photoUrl ? <img src={p.photoUrl} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 44 }}>{p.gender === 'female' ? '👰' : '🤵'}</span>}
                </div>
                <div style={{ fontWeight: 800, color: '#831843', marginTop: 8, fontSize: 15 }}>{p.name}, {ageFromDob(p.dob)}</div>
                <div style={{ fontSize: 12.5, color: '#6b7280', marginTop: 2 }}>{heightLabel(p.heightCm)} · {p.religion}</div>
                <div style={{ fontSize: 12.5, color: '#6b7280' }}>{p.city}, {p.state}</div>
                <div style={{ fontSize: 12.5, color: '#9d174d', marginTop: 2 }}>{p.occupation}</div>
              </button>
            ))}
          </div>
        )}

      {active && <ProfileModal p={active} primary={primary} onClose={() => setActive(null)} />}
    </div>
  );
}

/* ---------------- Ek profile ka poora vivaran + Ruchi ---------------- */
function ProfileModal({ p, primary, onClose }: { p: MatrimonyProfile; primary: string; onClose: () => void }) {
  const [sending, setSending] = useState(false);
  const [msg, setMsg] = useState('');
  const [contact, setContact] = useState('');

  const sendInterest = async () => {
    setSending(true); setMsg('');
    try {
      const r = await authFetch('/api/matrimony/interest', { method: 'POST', body: JSON.stringify({ action: 'send', toProfileId: p.id }) });
      const j = await r.json();
      if (r.ok) setMsg(j.already ? 'आप पहले ही रुचि भेज चुके हैं।' : 'रुचि भेज दी गई। स्वीकृत होने पर संपर्क मिलेगा।');
      else setMsg(j.message || 'रुचि नहीं भेजी जा सकी।');
    } catch { setMsg('कुछ गड़बड़ हुई, दोबारा प्रयास करें।'); }
    setSending(false);
  };

  const viewContact = async () => {
    const r = await authFetch(`/api/matrimony/contact?profileId=${encodeURIComponent(p.id)}`);
    const j = await r.json();
    if (r.ok) setContact(j.contactPhone);
    else setMsg(j.message || 'संपर्क अभी उपलब्ध नहीं है।');
  };

  const row = (k: string, v?: string) => v ? <div style={{ display: 'flex', gap: 8, padding: '5px 0', borderBottom: '1px solid #fce7f3', fontSize: 13.5 }}><span style={{ color: '#9d174d', minWidth: 110, fontWeight: 600 }}>{k}</span><span style={{ color: '#374151' }}>{v}</span></div> : null;

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: 16, overflowY: 'auto' }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: '#fff', borderRadius: 16, maxWidth: 560, width: '100%', margin: '24px 0', overflow: 'hidden' }}>
        <div style={{ height: 230, background: '#fce7f3', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {p.photoUrl ? <img src={p.photoUrl} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 80 }}>{p.gender === 'female' ? '👰' : '🤵'}</span>}
        </div>
        <div style={{ padding: 20 }}>
          <h2 style={{ margin: 0, color: '#831843', fontSize: 22 }}>{p.name}, {ageFromDob(p.dob)} वर्ष</h2>
          <p style={{ margin: '2px 0 14px', color: '#6b7280', fontSize: 13.5 }}>{heightLabel(p.heightCm)} · {p.maritalStatus} · {p.city}, {p.state}</p>
          {row('धर्म', p.religion)}
          {row('समुदाय', p.community)}
          {row('मातृभाषा', p.motherTongue)}
          {row('शिक्षा', p.education)}
          {row('व्यवसाय', p.occupation)}
          {row('आय', p.annualIncome)}
          {row('आहार', p.diet)}
          {row('परिवार', p.family)}
          {row('अपने बारे में', p.about)}
          {row('जीवनसाथी में', p.partnerPreference)}

          {contact ? (
            <div style={{ marginTop: 14, background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: 10, padding: 12, textAlign: 'center' }}>
              <div style={{ fontSize: 12, color: '#047857' }}>संपर्क नंबर</div>
              <a href={`tel:${contact}`} style={{ fontSize: 20, fontWeight: 800, color: '#065f46', textDecoration: 'none' }}>{contact}</a>
            </div>
          ) : (
            <div style={{ marginTop: 16, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button disabled={sending} onClick={sendInterest} style={{ flex: 1, minWidth: 160, background: primary, color: '#fff', border: 'none', borderRadius: 10, padding: '11px 16px', fontWeight: 700, cursor: 'pointer' }}>
                {sending ? 'भेज रहे…' : '💌 रुचि भेजें'}
              </button>
              <button onClick={viewContact} style={{ background: '#fff', color: primary, border: `1px solid ${primary}`, borderRadius: 10, padding: '11px 16px', fontWeight: 700, cursor: 'pointer' }}>
                संपर्क देखें
              </button>
            </div>
          )}
          {msg && <p style={{ marginTop: 10, color: '#9d174d', fontSize: 13, textAlign: 'center' }}>{msg}</p>}
          <p style={{ marginTop: 12, fontSize: 11.5, color: '#9ca3af', textAlign: 'center' }}>🔒 नंबर तभी दिखता है जब दोनों की रुचि स्वीकृत हो।</p>
          <button onClick={onClose} style={{ marginTop: 10, width: '100%', background: '#f3f4f6', border: 'none', borderRadius: 10, padding: 10, fontWeight: 600, cursor: 'pointer', color: '#374151' }}>बंद करें</button>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Meri profile (banana / badalna) ---------------- */
function MyProfile({ slug, primary }: { slug: string; primary: string }) {
  const [f, setF] = useState<any>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [status, setStatus] = useState<string>('');

  useEffect(() => {
    (async () => {
      try {
        const r = await authFetch('/api/matrimony/profile');
        const j = await r.json();
        if (j.profile) { setF({ ...EMPTY, ...j.profile }); setStatus(j.profile.status); }
      } catch {}
      setLoading(false);
    })();
  }, []);

  const set = (k: string, v: any) => setF((p: any) => ({ ...p, [k]: v }));

  const onPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
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

  if (loading) return <p style={{ textAlign: 'center', color: '#9d174d', padding: 40 }}>लोड हो रहा है…</p>;

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', background: '#fff', border: '1px solid #fbcfe8', borderRadius: 16, padding: 22 }}>
      <h2 style={{ color: primary, marginTop: 0, fontSize: 20 }}>मेरी विवाह प्रोफ़ाइल</h2>
      {status && (
        <div style={{ background: status === 'approved' ? '#ecfdf5' : '#fef9c3', border: `1px solid ${status === 'approved' ? '#a7f3d0' : '#fde68a'}`, borderRadius: 8, padding: '8px 12px', fontSize: 13, color: status === 'approved' ? '#047857' : '#854d0e', marginBottom: 14 }}>
          स्थिति: {status === 'approved' ? 'स्वीकृत — वेबसाइट पर live' : status === 'rejected' ? 'अस्वीकृत — कृपया सही जानकारी भरें' : 'समीक्षा में — एडमिन स्वीकृति के बाद दिखेगी'}
        </div>
      )}
      {msg && <div style={{ background: '#fdf2f8', border: '1px solid #fbcfe8', borderRadius: 8, padding: '9px 12px', fontSize: 13.5, color: '#9d174d', marginBottom: 14 }}>{msg}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Field label="पूरा नाम *"><input style={inp} value={f.name} onChange={(e) => set('name', e.target.value)} /></Field>
        <Field label="लिंग *">
          <select style={inp} value={f.gender} onChange={(e) => set('gender', e.target.value)}>
            <option value="">चुनें</option>{GENDERS.map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}
          </select>
        </Field>
        <Field label="जन्मतिथि *"><input type="date" style={inp} value={f.dob} onChange={(e) => set('dob', e.target.value)} /></Field>
        <Field label="लंबाई *">
          <select style={inp} value={f.heightCm} onChange={(e) => set('heightCm', Number(e.target.value))}>
            <option value={0}>चुनें</option>{HEIGHT_OPTIONS.map((h) => <option key={h.cm} value={h.cm}>{h.label}</option>)}
          </select>
        </Field>
        <Field label="वैवाहिक स्थिति *">
          <select style={inp} value={f.maritalStatus} onChange={(e) => set('maritalStatus', e.target.value)}>
            <option value="">चुनें</option>{MARITAL_STATUS.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </Field>
        <Field label="धर्म *">
          <select style={inp} value={f.religion} onChange={(e) => set('religion', e.target.value)}>
            <option value="">चुनें</option>{RELIGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </Field>
        <Field label="समुदाय / जाति"><input style={inp} value={f.community} onChange={(e) => set('community', e.target.value)} placeholder="(वैकल्पिक)" /></Field>
        <Field label="मातृभाषा *">
          <select style={inp} value={f.motherTongue} onChange={(e) => set('motherTongue', e.target.value)}>
            <option value="">चुनें</option>{MOTHER_TONGUES.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </Field>
        <Field label="शहर *"><input style={inp} value={f.city} onChange={(e) => set('city', e.target.value)} /></Field>
        <Field label="राज्य *"><input style={inp} value={f.state} onChange={(e) => set('state', e.target.value)} /></Field>
        <Field label="शिक्षा *"><input style={inp} value={f.education} onChange={(e) => set('education', e.target.value)} placeholder="जैसे B.A., B.Tech" /></Field>
        <Field label="व्यवसाय *"><input style={inp} value={f.occupation} onChange={(e) => set('occupation', e.target.value)} placeholder="जैसे शिक्षक, व्यापार" /></Field>
        <Field label="वार्षिक आय">
          <select style={inp} value={f.annualIncome} onChange={(e) => set('annualIncome', e.target.value)}>
            <option value="">चुनें (वैकल्पिक)</option>{INCOME_RANGES.map((i) => <option key={i} value={i}>{i}</option>)}
          </select>
        </Field>
        <Field label="आहार">
          <select style={inp} value={f.diet} onChange={(e) => set('diet', e.target.value)}>
            <option value="">चुनें (वैकल्पिक)</option>{DIETS.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        </Field>
      </div>

      <Field label="परिवार (संक्षेप में)"><textarea style={{ ...inp, minHeight: 60 }} value={f.family} onChange={(e) => set('family', e.target.value)} placeholder="पिता/माता का कार्य, भाई-बहन…" /></Field>
      <Field label="अपने बारे में"><textarea style={{ ...inp, minHeight: 70 }} value={f.about} onChange={(e) => set('about', e.target.value)} /></Field>
      <Field label="कैसा जीवनसाथी चाहिए"><textarea style={{ ...inp, minHeight: 60 }} value={f.partnerPreference} onChange={(e) => set('partnerPreference', e.target.value)} /></Field>

      <Field label="फोटो (वैकल्पिक)">
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          {f.photoUrl && <img src={f.photoUrl} alt="" style={{ width: 70, height: 70, objectFit: 'cover', borderRadius: 10, border: '1px solid #fbcfe8' }} />}
          <input type="file" accept="image/*" onChange={onPhoto} style={{ fontSize: 13 }} />
          {f.photoUrl && <button onClick={() => set('photoUrl', '')} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: 12 }}>हटाएं</button>}
        </div>
      </Field>

      <p style={{ fontSize: 11.5, color: '#9ca3af', margin: '12px 0' }}>
        🔒 आपका मोबाइल नंबर प्रोफ़ाइल में कहीं नहीं दिखेगा। किसी की रुचि स्वीकृत करने पर ही आपका संपर्क उस तक पहुँचेगा।
      </p>
      <button disabled={saving} onClick={save} style={{ width: '100%', background: primary, color: '#fff', border: 'none', borderRadius: 10, padding: 13, fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>
        {saving ? 'सहेज रहे…' : status ? 'प्रोफ़ाइल अपडेट करें' : 'प्रोफ़ाइल सहेजें'}
      </button>
    </div>
  );
}

/* ---------------- Ruchi (sent / received) ---------------- */
function Interests({ primary }: { primary: string }) {
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

  if (loading) return <p style={{ textAlign: 'center', color: '#9d174d', padding: 40 }}>लोड हो रहा है…</p>;

  const Item = ({ it, incoming }: { it: any; incoming: boolean }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#fff', border: '1px solid #fbcfe8', borderRadius: 12, padding: 12, marginBottom: 10 }}>
      <div style={{ width: 52, height: 52, borderRadius: 10, background: '#fce7f3', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {it.profile.photoUrl ? <img src={it.profile.photoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 24 }}>💍</span>}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, color: '#831843', fontSize: 14 }}>{it.profile.name || 'प्रोफ़ाइल'}{it.profile.age ? `, ${it.profile.age}` : ''}</div>
        <div style={{ fontSize: 12, color: '#6b7280' }}>{[it.profile.city, it.profile.occupation].filter(Boolean).join(' · ')}</div>
        <div style={{ fontSize: 11.5, marginTop: 2, color: it.status === 'accepted' ? '#047857' : it.status === 'declined' ? '#dc2626' : '#b45309' }}>
          {it.status === 'accepted' ? 'स्वीकृत' : it.status === 'declined' ? 'अस्वीकृत' : 'प्रतीक्षा में'}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
        {incoming && it.status === 'pending' && (
          <>
            <button disabled={busy === it.interestId} onClick={() => respond(it.interestId, true)} style={{ background: '#059669', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 12px', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>स्वीकारें</button>
            <button disabled={busy === it.interestId} onClick={() => respond(it.interestId, false)} style={{ background: '#fff', color: '#dc2626', border: '1px solid #fecaca', borderRadius: 8, padding: '7px 12px', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>मना</button>
          </>
        )}
        {it.canSeeContact && it.profile.id && (
          <button disabled={busy === it.interestId} onClick={() => viewContact(it.profile.id, it.interestId)} style={{ background: primary, color: '#fff', border: 'none', borderRadius: 8, padding: '7px 12px', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>संपर्क</button>
        )}
      </div>
    </div>
  );

  return (
    <div style={{ maxWidth: 680, margin: '0 auto' }}>
      {!data?.hasProfile && (
        <div style={{ background: '#fef9c3', border: '1px solid #fde68a', borderRadius: 10, padding: 12, fontSize: 13, color: '#854d0e', marginBottom: 16 }}>
          रुचि भेजने/पाने के लिए पहले «मेरी प्रोफ़ाइल» बनाएं।
        </div>
      )}
      <h3 style={{ color: primary, fontSize: 16, margin: '6px 0 10px' }}>मेरे पास आई रुचि</h3>
      {data?.received?.length ? data.received.map((it) => <Item key={it.interestId} it={it} incoming />) : <p style={{ color: '#9ca3af', fontSize: 13 }}>अभी कोई रुचि नहीं आई।</p>}
      <h3 style={{ color: primary, fontSize: 16, margin: '22px 0 10px' }}>मेरी भेजी रुचि</h3>
      {data?.sent?.length ? data.sent.map((it) => <Item key={it.interestId} it={it} incoming={false} />) : <p style={{ color: '#9ca3af', fontSize: 13 }}>आपने अभी तक कोई रुचि नहीं भेजी।</p>}
    </div>
  );
}

/* ---------------- styles ---------------- */
const inp: React.CSSProperties = { width: '100%', padding: '9px 11px', border: '1px solid #f9a8d4', borderRadius: 8, fontSize: 14, background: '#fff', color: '#111' };
const selStyle: React.CSSProperties = { padding: '9px 12px', border: '1px solid #f9a8d4', borderRadius: 999, fontSize: 13.5, background: '#fff', color: '#9d174d', fontWeight: 600 };
const cardStyle: React.CSSProperties = { textAlign: 'left', background: '#fff', border: '1px solid #fbcfe8', borderRadius: 14, padding: 10, cursor: 'pointer' };
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label style={{ display: 'block', margin: '10px 0 0' }}><span style={{ display: 'block', fontSize: 12.5, color: '#9d174d', fontWeight: 600, marginBottom: 4 }}>{label}</span>{children}</label>;
}
