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
  ageFromDob, CASTE_PREFERENCES, DIETS, GENDERS, heightLabel, HEIGHT_OPTIONS, INCOME_RANGES,
  MARITAL_STATUS, MOTHER_TONGUES, RELIGIONS, type Gender, type MatrimonyProfile
} from '@/lib/matrimony';

type Tab = 'browse' | 'profile' | 'interests';

/* ---- Portal ke apne rang se theme ---- */
const hexToRgb = (hex: string) => {
  const h = (hex || '#be185d').replace('#', '');
  const n = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const i = parseInt(n || 'be185d', 16);
  return { r: (i >> 16) & 255, g: (i >> 8) & 255, b: i & 255 };
};
const tint = (hex: string, a: number) => { const { r, g, b } = hexToRgb(hex); return `rgba(${r},${g},${b},${a})`; };
const darken = (hex: string, f = 0.72) => { const { r, g, b } = hexToRgb(hex); return `rgb(${Math.round(r * f)},${Math.round(g * f)},${Math.round(b * f)})`; };

const isIntercaste = (v?: string) => !!v && v.includes('कोई भी');

const EMPTY = {
  name: '', gender: '' as Gender | '', dob: '', heightCm: 0, maritalStatus: '', religion: '',
  community: '', castePreference: '', motherTongue: '', city: '', state: '', education: '', occupation: '',
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

const STYLE = `
@import url('https://fonts.googleapis.com/css2?family=Mukta:wght@400;500;600;700;800&display=swap');
.mx-root{font-family:'Mukta',system-ui,sans-serif;min-height:100vh;background:var(--mx-ss);color:#1f2937}
.mx-root *{box-sizing:border-box}
.mx-head{background:#fff;border-bottom:1px solid var(--mx-l);position:sticky;top:0;z-index:100;box-shadow:0 1px 10px rgba(0,0,0,.05)}
.mx-head-bar{height:4px;background:linear-gradient(90deg,var(--mx-p),var(--mx-d))}
.mx-head-in{max-width:1200px;margin:0 auto;padding:9px 16px;display:flex;align-items:center;justify-content:space-between;gap:12px}
.mx-title{font-weight:800;font-size:19px;color:var(--mx-p);letter-spacing:.2px}
.mx-title span{color:var(--mx-d);font-weight:700}
.mx-sub{font-size:11.5px;color:var(--mx-m)}
.mx-back{color:var(--mx-p);font-weight:700;font-size:13px;text-decoration:none;white-space:nowrap}
.mx-tabs{max-width:1200px;margin:0 auto;padding:0 16px 11px;display:flex;gap:8px;flex-wrap:wrap}
.mx-tab{padding:8px 17px;border-radius:999px;border:1px solid var(--mx-l);background:#fff;color:var(--mx-d);font-weight:700;font-size:13px;cursor:pointer;transition:.15s;font-family:inherit}
.mx-tab:hover{border-color:var(--mx-p)}
.mx-tab.on{background:var(--mx-p);color:#fff;border-color:var(--mx-p);box-shadow:0 3px 10px var(--mx-sh)}
.mx-wrap{max-width:1120px;margin:0 auto}
.mx-body{padding:18px 0 10px}
.mx-hero{background:linear-gradient(135deg,var(--mx-p),var(--mx-d));border-radius:22px;padding:28px 28px;color:#fff;margin-bottom:20px;box-shadow:0 14px 34px var(--mx-sh);position:relative;overflow:hidden}
.mx-hero::after{content:'💍';position:absolute;right:20px;bottom:-14px;font-size:120px;opacity:.14;transform:rotate(-12deg)}
.mx-hero::before{content:'';position:absolute;right:-40px;top:-40px;width:200px;height:200px;border-radius:50%;background:rgba(255,255,255,.08)}
.mx-hero h1{margin:0;font-size:23px;font-weight:800;position:relative}
.mx-hero p{margin:6px 0 0;font-size:13.5px;opacity:.93;position:relative;max-width:560px}
.mx-trust{display:flex;gap:16px;flex-wrap:wrap;margin-top:14px;position:relative}
.mx-trust span{font-size:12px;background:rgba(255,255,255,.16);padding:5px 12px;border-radius:999px;font-weight:600}
.mx-hero-btn{margin-top:16px;background:#fff;color:var(--mx-d);border:none;border-radius:12px;padding:11px 22px;font-weight:800;font-size:14px;cursor:pointer;position:relative;font-family:inherit}
.mx-filter{display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin-bottom:18px}
.mx-chip{padding:10px 15px;border:1px solid var(--mx-l);border-radius:999px;font-size:13.5px;background:#fff;color:var(--mx-d);font-weight:600;outline:none;font-family:inherit;transition:.15s}
.mx-chip:focus{border-color:var(--mx-p);box-shadow:0 0 0 3px var(--mx-sh)}
.mx-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(236px,1fr));gap:16px}
.mx-card{text-align:left;background:#fff;border:1px solid var(--mx-l);border-radius:18px;padding:0;cursor:pointer;overflow:hidden;box-shadow:0 3px 14px rgba(0,0,0,.05);transition:transform .16s,box-shadow .16s;font-family:inherit}
.mx-card:hover{transform:translateY(-4px);box-shadow:0 14px 30px var(--mx-sh)}
.mx-photo{position:relative;height:210px;background:var(--mx-s);display:flex;align-items:center;justify-content:center}
.mx-photo img{width:100%;height:100%;object-fit:cover}
.mx-photo .emoji{font-size:58px}
.mx-ov{position:absolute;left:0;right:0;bottom:0;padding:26px 13px 11px;background:linear-gradient(transparent,rgba(0,0,0,.72));color:#fff}
.mx-ov .n{font-weight:800;font-size:16px;line-height:1.15}
.mx-ov .m{font-size:12px;opacity:.92;margin-top:2px}
.mx-badge{position:absolute;top:10px;right:10px;background:var(--mx-d);color:#fff;font-size:10.5px;font-weight:700;padding:3px 10px;border-radius:999px}
.mx-badge.ic{left:10px;right:auto;background:#047857}
.mx-cbody{padding:12px 13px}
.mx-pills{display:flex;flex-wrap:wrap;gap:5px;margin-bottom:6px}
.mx-pill{background:var(--mx-s);color:var(--mx-d);font-size:11px;font-weight:600;padding:3px 9px;border-radius:999px}
.mx-cmeta{font-size:12.5px;color:var(--mx-m);margin-top:2px}
.mx-empty{text-align:center;padding:52px 20px;background:#fff;border-radius:18px;border:1px solid var(--mx-l)}
/* form */
.mx-fcard{background:#fff;border:1px solid var(--mx-l);border-radius:18px;padding:20px;margin-bottom:16px;box-shadow:0 2px 12px rgba(0,0,0,.04)}
.mx-sec{display:flex;align-items:center;gap:8px;font-size:14px;font-weight:800;color:var(--mx-d);margin:0 0 14px}
.mx-sec i{width:30px;height:30px;border-radius:9px;background:var(--mx-s);display:flex;align-items:center;justify-content:center;font-style:normal;font-size:15px}
.mx-fgrid{display:grid;grid-template-columns:repeat(auto-fit,minmax(205px,1fr));gap:13px}
.mx-field{display:block}
.mx-field>span{display:block;font-size:12.5px;color:var(--mx-d);font-weight:600;margin-bottom:5px}
.mx-in{width:100%;padding:10px 12px;border:1px solid var(--mx-l);border-radius:10px;font-size:14px;background:#fff;color:#111;outline:none;font-family:inherit;transition:.15s}
.mx-in:focus{border-color:var(--mx-p);box-shadow:0 0 0 3px var(--mx-sh)}
textarea.mx-in{min-height:64px;resize:vertical}
.mx-save{width:100%;background:linear-gradient(135deg,var(--mx-p),var(--mx-d));color:#fff;border:none;border-radius:12px;padding:14px;font-weight:800;font-size:15.5px;cursor:pointer;box-shadow:0 5px 18px var(--mx-sh);font-family:inherit}
.mx-save:disabled{opacity:.7}
.mx-note{background:var(--mx-ss);border:1px solid var(--mx-l);border-radius:12px;padding:11px 14px;font-size:12.5px;color:var(--mx-d);display:flex;gap:8px;align-items:flex-start;margin-bottom:14px}
.mx-status{border-radius:12px;padding:11px 15px;font-size:13px;font-weight:600;margin-bottom:14px}
/* modal */
.mx-mask{position:fixed;inset:0;background:rgba(17,17,17,.58);z-index:200;display:flex;align-items:flex-start;justify-content:center;padding:16px;overflow-y:auto}
.mx-modal{background:#fff;border-radius:22px;max-width:580px;width:100%;margin:20px 0;overflow:hidden;box-shadow:0 24px 70px rgba(0,0,0,.35);font-family:inherit}
.mx-mphoto{position:relative;height:280px;background:var(--mx-s);display:flex;align-items:center;justify-content:center}
.mx-mphoto img{width:100%;height:100%;object-fit:cover}
.mx-x{position:absolute;top:12px;right:12px;width:34px;height:34px;border-radius:50%;border:none;background:rgba(0,0,0,.5);color:#fff;font-size:16px;cursor:pointer}
.mx-mrow{display:flex;gap:10px;padding:8px 0;border-bottom:1px solid var(--mx-ss);font-size:13.5px}
.mx-mrow b{color:var(--mx-p);min-width:120px;font-weight:700}
.mx-btn-p{background:linear-gradient(135deg,var(--mx-p),var(--mx-d));color:#fff;border:none;border-radius:12px;padding:12px 16px;font-weight:800;font-size:14.5px;cursor:pointer;font-family:inherit}
.mx-btn-o{background:#fff;color:var(--mx-p);border:1px solid var(--mx-p);border-radius:12px;padding:12px 16px;font-weight:700;cursor:pointer;font-family:inherit}
/* interests */
.mx-it{display:flex;align-items:center;gap:12px;background:#fff;border:1px solid var(--mx-l);border-radius:15px;padding:13px;margin-bottom:10px;box-shadow:0 2px 10px rgba(0,0,0,.04)}
.mx-it-av{width:56px;height:56px;border-radius:13px;background:var(--mx-s);overflow:hidden;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.mx-it-av img{width:100%;height:100%;object-fit:cover}
.mx-center{padding:56px;text-align:center;color:var(--mx-d);font-size:14px}
@media(max-width:560px){.mx-hero h1{font-size:20px}.mx-photo{height:180px}.mx-mphoto{height:230px}}
`;

export default function MatrimonyPage() {
  const [slug, setSlug] = useState('the-local-leader');
  const [cfg, setCfg] = useState(fallbackFor('the-local-leader'));
  const [phone, setPhone] = useState<string | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [tab, setTab] = useState<Tab>('browse');

  const primary = cfg.primaryColor || '#be185d';
  const deep = darken(primary, 0.68);

  useEffect(() => {
    const s = getActivePortal(new URLSearchParams(window.location.search).get('site'));
    setSlug(s); setCfg(fallbackFor(s));
    firebasePhone().then((p) => { setPhone(p); setAuthReady(true); });
  }, []);

  const loginUrl = `/login?redirect=${encodeURIComponent(`/matrimony?site=${slug}`)}`;
  const cssVars = {
    ['--mx-p' as any]: primary, ['--mx-d' as any]: deep, ['--mx-s' as any]: tint(primary, 0.1),
    ['--mx-ss' as any]: tint(primary, 0.045), ['--mx-l' as any]: tint(primary, 0.2),
    ['--mx-sh' as any]: tint(primary, 0.28), ['--mx-m' as any]: '#6b7280'
  } as React.CSSProperties;

  return (
    <div className="mx-root" style={cssVars}>
      <style>{STYLE}</style>
      <header className="mx-head">
        <div className="mx-head-bar" />
        <div className="mx-head-in">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <PortalLogo slug={slug} />
            <div>
              <div className="mx-title">विवाह <span>· Matrimony</span></div>
              <div className="mx-sub notranslate">{cfg.name} · सुरक्षित व सत्यापित रिश्ते</div>
            </div>
          </div>
          <Link href={`/?site=${slug}`} className="mx-back">← मुख्य वेबसाइट</Link>
        </div>
        <nav className="mx-tabs">
          {([['browse', '🔍 प्रोफ़ाइल देखें'], ['profile', '📝 मेरी प्रोफ़ाइल'], ['interests', '💌 रुचि']] as [Tab, string][]).map(([t, label]) => (
            <button key={t} className={`mx-tab${tab === t ? ' on' : ''}`} onClick={() => setTab(t)}>{label}</button>
          ))}
        </nav>
      </header>

      <AdLayout color={primary}>
        <div className="mx-body">
          {!authReady ? <div className="mx-center">लोड हो रहा है…</div>
            : !phone ? <LoginGate loginUrl={loginUrl} />
            : (
              <>
                {tab === 'browse' && <Browse onCreate={() => setTab('profile')} />}
                {tab === 'profile' && <MyProfile slug={slug} />}
                {tab === 'interests' && <Interests onCreate={() => setTab('profile')} />}
                <div style={{ marginTop: 22 }}><AdInline /></div>
              </>
            )}
        </div>
      </AdLayout>

      <Footer siteName={cfg.name} primaryColor={primary} logoUrl={logoFor(slug, cfg.logoUrl)} tagline={cfg.tagline} currentSlug={slug} />
    </div>
  );
}

/* ---------------- Login gate ---------------- */
function LoginGate({ loginUrl }: { loginUrl: string }) {
  return (
    <div style={{ maxWidth: 560, margin: '36px auto', background: '#fff', border: '1px solid var(--mx-l)', borderRadius: 20, padding: 34, textAlign: 'center', boxShadow: '0 10px 34px rgba(0,0,0,0.06)' }}>
      <div style={{ width: 74, height: 74, margin: '0 auto', borderRadius: '50%', background: 'linear-gradient(135deg,var(--mx-p),var(--mx-d))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 34 }}>💍</div>
      <h2 style={{ color: 'var(--mx-d)', margin: '14px 0 8px', fontSize: 21 }}>विवाह प्रोफ़ाइल — लॉगिन करें</h2>
      <p style={{ color: 'var(--mx-m)', fontSize: 14, lineHeight: 1.7 }}>
        सुरक्षा के लिए, प्रोफ़ाइल देखना और बनाना दोनों सिर्फ़ लॉगिन के बाद। <b style={{ color: 'var(--mx-d)' }}>किसी का मोबाइल नंबर किसी को नहीं दिखता</b> — रुचि स्वीकृत होने पर ही संपर्क साझा होता है।
      </p>
      <Link href={loginUrl} className="mx-btn-p" style={{ display: 'inline-block', marginTop: 16, textDecoration: 'none' }}>लॉगिन / रजिस्टर करें →</Link>
    </div>
  );
}

/* ---------------- Browse ---------------- */
function Browse({ onCreate }: { onCreate: () => void }) {
  const [list, setList] = useState<MatrimonyProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [genderWant, setGenderWant] = useState<'' | Gender>('');
  const [cityQ, setCityQ] = useState('');
  const [onlyIntercaste, setOnlyIntercaste] = useState(false);
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
    (!onlyIntercaste || isIntercaste(p.castePreference)) &&
    (!cityQ || (p.city || '').toLowerCase().includes(cityQ.toLowerCase()) || (p.state || '').toLowerCase().includes(cityQ.toLowerCase())));

  return (
    <div className="mx-wrap">
      <div className="mx-hero">
        <h1>अपने लिए सही जीवनसाथी खोजें</h1>
        <p>सत्यापित प्रोफ़ाइल · मोबाइल नंबर पूरी तरह सुरक्षित · रुचि स्वीकृत होने पर ही संपर्क साझा होता है।</p>
        <div className="mx-trust"><span>✅ सत्यापित</span><span>🔒 नंबर सुरक्षित</span><span>🆓 निःशुल्क</span></div>
        <button className="mx-hero-btn" onClick={onCreate}>+ अपनी प्रोफ़ाइल बनाएं</button>
      </div>

      <div className="mx-filter">
        <select value={genderWant} onChange={(e) => setGenderWant(e.target.value as any)} className="mx-chip">
          <option value="">सभी (वर/वधू)</option>
          {GENDERS.map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}
        </select>
        <input value={cityQ} onChange={(e) => setCityQ(e.target.value)} placeholder="🔍 शहर / राज्य खोजें" className="mx-chip" style={{ minWidth: 190 }} />
        <button onClick={() => setOnlyIntercaste((v) => !v)} className="mx-chip" style={{ cursor: 'pointer', background: onlyIntercaste ? 'var(--mx-p)' : '#fff', color: onlyIntercaste ? '#fff' : 'var(--mx-d)', borderColor: onlyIntercaste ? 'var(--mx-p)' : 'var(--mx-l)' }}>
          🤝 अंतरजातीय
        </button>
        <span style={{ fontSize: 12.5, color: 'var(--mx-m)', marginLeft: 'auto' }}>{filtered.length} प्रोफ़ाइल</span>
      </div>

      {loading ? <div className="mx-center">लोड हो रहा है…</div>
        : err ? <div style={{ textAlign: 'center', color: '#dc2626', padding: 40 }}>{err}</div>
        : filtered.length === 0 ? (
          <div className="mx-empty">
            <div style={{ fontSize: 44 }}>💍</div>
            <p style={{ color: 'var(--mx-m)', fontSize: 14, marginTop: 8 }}>इस खोज में कोई प्रोफ़ाइल नहीं मिली। सबसे पहले अपनी प्रोफ़ाइल बनाएं!</p>
            <button className="mx-btn-p" onClick={onCreate} style={{ marginTop: 12 }}>+ प्रोफ़ाइल बनाएं</button>
          </div>
        ) : (
          <div className="mx-grid">
            {filtered.map((p) => (
              <button key={p.id} className="mx-card" onClick={() => setActive(p)}>
                <div className="mx-photo">
                  {p.photoUrl ? <img src={p.photoUrl} alt={p.name} /> : <span className="emoji">{p.gender === 'female' ? '👰' : '🤵'}</span>}
                  <span className="mx-badge">{ageFromDob(p.dob)} वर्ष</span>
                  {isIntercaste(p.castePreference) && <span className="mx-badge ic">अंतरजातीय ✓</span>}
                  <div className="mx-ov">
                    <div className="n">{p.name}</div>
                    <div className="m">{heightLabel(p.heightCm)} · {p.city}</div>
                  </div>
                </div>
                <div className="mx-cbody">
                  <div className="mx-pills">
                    <span className="mx-pill">{p.religion}</span>
                    {p.community && <span className="mx-pill">{p.community}</span>}
                    <span className="mx-pill">{p.maritalStatus}</span>
                  </div>
                  <div className="mx-cmeta">🎓 {p.education}</div>
                  <div className="mx-cmeta" style={{ color: 'var(--mx-d)', fontWeight: 600 }}>💼 {p.occupation}</div>
                </div>
              </button>
            ))}
          </div>
        )}

      {active && <ProfileModal p={active} onClose={() => setActive(null)} />}
    </div>
  );
}

/* ---------------- Modal ---------------- */
function ProfileModal({ p, onClose }: { p: MatrimonyProfile; onClose: () => void }) {
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
  const row = (k: string, v?: string) => v ? <div className="mx-mrow"><b>{k}</b><span style={{ color: '#374151' }}>{v}</span></div> : null;

  return (
    <div className="mx-mask" onClick={onClose}>
      <div className="mx-modal" onClick={(e) => e.stopPropagation()}>
        <div className="mx-mphoto">
          {p.photoUrl ? <img src={p.photoUrl} alt={p.name} /> : <span style={{ fontSize: 92 }}>{p.gender === 'female' ? '👰' : '🤵'}</span>}
          <button className="mx-x" onClick={onClose}>✕</button>
          {isIntercaste(p.castePreference) && <span className="mx-badge ic" style={{ bottom: 12, left: 12, top: 'auto' }}>अंतरजातीय स्वीकार्य ✓</span>}
        </div>
        <div style={{ padding: 22 }}>
          <h2 style={{ margin: 0, color: 'var(--mx-d)', fontSize: 23 }}>{p.name}, {ageFromDob(p.dob)} वर्ष</h2>
          <p style={{ margin: '4px 0 16px', color: 'var(--mx-m)', fontSize: 13.5 }}>{heightLabel(p.heightCm)} · {p.maritalStatus} · {p.city}, {p.state}</p>
          {row('धर्म', p.religion)}{row('जाति / समुदाय', p.community)}{row('जाति पसंद', p.castePreference)}{row('मातृभाषा', p.motherTongue)}
          {row('शिक्षा', p.education)}{row('व्यवसाय', p.occupation)}{row('आय', p.annualIncome)}{row('आहार', p.diet)}
          {row('परिवार', p.family)}{row('अपने बारे में', p.about)}{row('जीवनसाथी में', p.partnerPreference)}

          {contact ? (
            <div style={{ marginTop: 16, background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: 12, padding: 14, textAlign: 'center' }}>
              <div style={{ fontSize: 12, color: '#047857' }}>संपर्क नंबर</div>
              <a href={`tel:${contact}`} style={{ fontSize: 22, fontWeight: 800, color: '#065f46', textDecoration: 'none' }}>📞 {contact}</a>
            </div>
          ) : (
            <div style={{ marginTop: 18, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button disabled={sending} onClick={sendInterest} className="mx-btn-p" style={{ flex: 1, minWidth: 170 }}>{sending ? 'भेज रहे…' : '💌 रुचि भेजें'}</button>
              <button onClick={viewContact} className="mx-btn-o">संपर्क देखें</button>
            </div>
          )}
          {msg && <p style={{ marginTop: 12, color: 'var(--mx-d)', fontSize: 13, textAlign: 'center' }}>{msg}</p>}
          <p style={{ marginTop: 12, fontSize: 11.5, color: '#9ca3af', textAlign: 'center' }}>🔒 नंबर तभी दिखता है जब रुचि स्वीकृत हो।</p>
        </div>
      </div>
    </div>
  );
}

/* ---------------- My profile ---------------- */
function MyProfile({ slug }: { slug: string }) {
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

  if (loading) return <div className="mx-center">लोड हो रहा है…</div>;

  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>
      <h2 style={{ color: 'var(--mx-d)', margin: '0 0 14px', fontSize: 22 }}>मेरी विवाह प्रोफ़ाइल</h2>
      {status && (
        <div className="mx-status" style={{ background: status === 'approved' ? '#ecfdf5' : status === 'rejected' ? '#fef2f2' : 'var(--mx-ss)', border: `1px solid ${status === 'approved' ? '#a7f3d0' : status === 'rejected' ? '#fecaca' : 'var(--mx-l)'}`, color: status === 'approved' ? '#047857' : status === 'rejected' ? '#b91c1c' : 'var(--mx-d)' }}>
          स्थिति: {status === 'approved' ? '✅ स्वीकृत — वेबसाइट पर live' : status === 'rejected' ? '❌ अस्वीकृत — कृपया सही जानकारी भरें' : '⏳ समीक्षा में — एडमिन स्वीकृति के बाद दिखेगी'}
        </div>
      )}
      {msg && <div className="mx-note" style={{ color: 'var(--mx-d)' }}>{msg}</div>}

      <div className="mx-fcard">
        <div className="mx-sec"><i>👤</i> मूल जानकारी</div>
        <div className="mx-fgrid">
          <Field label="पूरा नाम *"><input className="mx-in" value={f.name} onChange={(e) => set('name', e.target.value)} /></Field>
          <Field label="लिंग *"><select className="mx-in" value={f.gender} onChange={(e) => set('gender', e.target.value)}><option value="">चुनें</option>{GENDERS.map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}</select></Field>
          <Field label="जन्मतिथि *"><input type="date" className="mx-in" value={f.dob} onChange={(e) => set('dob', e.target.value)} /></Field>
          <Field label="लंबाई *"><select className="mx-in" value={f.heightCm} onChange={(e) => set('heightCm', Number(e.target.value))}><option value={0}>चुनें</option>{HEIGHT_OPTIONS.map((h) => <option key={h.cm} value={h.cm}>{h.label}</option>)}</select></Field>
          <Field label="वैवाहिक स्थिति *"><select className="mx-in" value={f.maritalStatus} onChange={(e) => set('maritalStatus', e.target.value)}><option value="">चुनें</option>{MARITAL_STATUS.map((m) => <option key={m} value={m}>{m}</option>)}</select></Field>
          <Field label="आहार"><select className="mx-in" value={f.diet} onChange={(e) => set('diet', e.target.value)}><option value="">चुनें (वैकल्पिक)</option>{DIETS.map((d) => <option key={d} value={d}>{d}</option>)}</select></Field>
        </div>
      </div>

      <div className="mx-fcard">
        <div className="mx-sec"><i>🛕</i> धर्म, जाति व भाषा</div>
        <div className="mx-fgrid">
          <Field label="धर्म *"><select className="mx-in" value={f.religion} onChange={(e) => set('religion', e.target.value)}><option value="">चुनें</option>{RELIGIONS.map((r) => <option key={r} value={r}>{r}</option>)}</select></Field>
          <Field label="जाति / समुदाय *"><input className="mx-in" value={f.community} onChange={(e) => set('community', e.target.value)} placeholder="अपनी जाति / समुदाय" /></Field>
          <Field label="मातृभाषा *"><select className="mx-in" value={f.motherTongue} onChange={(e) => set('motherTongue', e.target.value)}><option value="">चुनें</option>{MOTHER_TONGUES.map((m) => <option key={m} value={m}>{m}</option>)}</select></Field>
        </div>
        <Field label="विवाह किस जाति में करना चाहते हैं? *">
          <select className="mx-in" value={f.castePreference} onChange={(e) => set('castePreference', e.target.value)}>
            <option value="">चुनें</option>{CASTE_PREFERENCES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </Field>
      </div>

      <div className="mx-fcard">
        <div className="mx-sec"><i>🎓</i> स्थान, शिक्षा व कार्य</div>
        <div className="mx-fgrid">
          <Field label="शहर *"><input className="mx-in" value={f.city} onChange={(e) => set('city', e.target.value)} /></Field>
          <Field label="राज्य *"><input className="mx-in" value={f.state} onChange={(e) => set('state', e.target.value)} /></Field>
          <Field label="शिक्षा *"><input className="mx-in" value={f.education} onChange={(e) => set('education', e.target.value)} placeholder="जैसे B.A., B.Tech" /></Field>
          <Field label="व्यवसाय *"><input className="mx-in" value={f.occupation} onChange={(e) => set('occupation', e.target.value)} placeholder="जैसे शिक्षक, व्यापार" /></Field>
          <Field label="वार्षिक आय"><select className="mx-in" value={f.annualIncome} onChange={(e) => set('annualIncome', e.target.value)}><option value="">चुनें (वैकल्पिक)</option>{INCOME_RANGES.map((i) => <option key={i} value={i}>{i}</option>)}</select></Field>
        </div>
      </div>

      <div className="mx-fcard">
        <div className="mx-sec"><i>👨‍👩‍👧</i> परिवार व अपेक्षा</div>
        <Field label="परिवार (संक्षेप में)"><textarea className="mx-in" value={f.family} onChange={(e) => set('family', e.target.value)} placeholder="पिता/माता का कार्य, भाई-बहन…" /></Field>
        <Field label="अपने बारे में"><textarea className="mx-in" value={f.about} onChange={(e) => set('about', e.target.value)} /></Field>
        <Field label="कैसा जीवनसाथी चाहिए"><textarea className="mx-in" value={f.partnerPreference} onChange={(e) => set('partnerPreference', e.target.value)} /></Field>
      </div>

      <div className="mx-fcard">
        <div className="mx-sec"><i>📷</i> फोटो</div>
        <div style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
          {f.photoUrl && <img src={f.photoUrl} alt="" style={{ width: 82, height: 82, objectFit: 'cover', borderRadius: 12, border: '1px solid var(--mx-l)' }} />}
          <input type="file" accept="image/*" onChange={onPhoto} style={{ fontSize: 13 }} />
          {f.photoUrl && <button onClick={() => set('photoUrl', '')} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: 12.5 }}>हटाएं</button>}
        </div>
      </div>

      <div className="mx-note">🔒 <span>आपका मोबाइल नंबर प्रोफ़ाइल में कहीं नहीं दिखेगा। किसी की रुचि स्वीकार करने पर ही आपका संपर्क उस तक पहुँचेगा।</span></div>
      <button disabled={saving} onClick={save} className="mx-save">{saving ? 'सहेज रहे…' : status ? 'प्रोफ़ाइल अपडेट करें' : 'प्रोफ़ाइल सहेजें'}</button>
    </div>
  );
}

/* ---------------- Interests ---------------- */
function Interests({ onCreate }: { onCreate: () => void }) {
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

  if (loading) return <div className="mx-center">लोड हो रहा है…</div>;

  const Item = ({ it, incoming }: { it: any; incoming: boolean }) => (
    <div className="mx-it">
      <div className="mx-it-av">{it.profile.photoUrl ? <img src={it.profile.photoUrl} alt="" /> : <span style={{ fontSize: 26 }}>💍</span>}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 800, color: 'var(--mx-d)', fontSize: 14.5 }}>{it.profile.name || 'प्रोफ़ाइल'}{it.profile.age ? `, ${it.profile.age}` : ''}</div>
        <div style={{ fontSize: 12, color: 'var(--mx-m)' }}>{[it.profile.city, it.profile.occupation].filter(Boolean).join(' · ')}</div>
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
          <button disabled={busy === it.interestId} onClick={() => viewContact(it.profile.id, it.interestId)} className="mx-btn-p" style={{ padding: '8px 13px', fontSize: 12 }}>📞 संपर्क</button>
        )}
      </div>
    </div>
  );

  return (
    <div style={{ maxWidth: 700, margin: '0 auto' }}>
      {!data?.hasProfile && (
        <div className="mx-note" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <span>रुचि भेजने/पाने के लिए पहले अपनी प्रोफ़ाइल बनाएं।</span>
          <button className="mx-btn-p" onClick={onCreate} style={{ padding: '8px 16px', fontSize: 12.5 }}>+ प्रोफ़ाइल बनाएं</button>
        </div>
      )}
      <h3 style={{ color: 'var(--mx-d)', fontSize: 16.5, margin: '6px 0 12px' }}>💌 मेरे पास आई रुचि</h3>
      {data?.received?.length ? data.received.map((it) => <Item key={it.interestId} it={it} incoming />) : <p style={{ color: '#9ca3af', fontSize: 13 }}>अभी कोई रुचि नहीं आई।</p>}
      <h3 style={{ color: 'var(--mx-d)', fontSize: 16.5, margin: '24px 0 12px' }}>📤 मेरी भेजी रुचि</h3>
      {data?.sent?.length ? data.sent.map((it) => <Item key={it.interestId} it={it} incoming={false} />) : <p style={{ color: '#9ca3af', fontSize: 13 }}>आपने अभी तक कोई रुचि नहीं भेजी।</p>}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="mx-field" style={{ marginTop: 10 }}><span>{label}</span>{children}</label>;
}
