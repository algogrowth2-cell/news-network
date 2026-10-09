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
  ABOUT_SUGGESTIONS, ageFromDob, careerLine, CASTE_PREFERENCES, DIETS, EMPLOYMENT_TYPES, GENDERS, heightLabel, HEIGHT_OPTIONS, INCOME_RANGES,
  MARITAL_STATUS, MAX_PHOTOS, MOTHER_TONGUES, PARTNER_SUGGESTIONS, POSTED_BY_OPTIONS, RELIGIONS, ROLE_OPTIONS, SIBLING_COUNTS, WORK_FIELDS, WORKS_FOR_PAY, type Gender, type MatrimonyProfile
} from '@/lib/matrimony';

/* ---- Modern line (SVG) icons — koi emoji nahi ---- */
const ICON_PATHS: Record<string, string> = {
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1"/>',
  faith: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  pin: '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/>',
  work: '<rect x="2.5" y="7" width="19" height="13" rx="2"/><path d="M8 7V5.5A2.5 2.5 0 0 1 10.5 3h3A2.5 2.5 0 0 1 16 5.5V7"/><path d="M2.5 12h19"/>',
  family: '<circle cx="8" cy="8" r="3.2"/><circle cx="17" cy="9" r="2.6"/><path d="M2.5 20v-1a5.5 5.5 0 0 1 11 0v1"/><path d="M15 20v-1a4.5 4.5 0 0 1 6.5-4"/>',
  chat: '<path d="M21 12a8 8 0 0 1-11.5 7.2L3 21l1.8-6.5A8 8 0 1 1 21 12z"/>',
  camera: '<path d="M4 8h3l1.5-2.2h7L17 8h3a1.5 1.5 0 0 1 1.5 1.5V18A1.5 1.5 0 0 1 20 19.5H4A1.5 1.5 0 0 1 2.5 18V9.5A1.5 1.5 0 0 1 4 8z"/><circle cx="12" cy="13" r="3.4"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>',
  heart: '<path d="M20.8 5.6a5 5 0 0 0-7.1 0l-1.7 1.7-1.7-1.7a5 5 0 0 0-7.1 7.1l1.7 1.7L12 21l8.8-6.6 1.7-1.7a5 5 0 0 0-1.7-7.1z"/>',
  edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
  shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/>',
  lock: '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
  gift: '<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7"/><path d="M12 8S10 3 7.5 4.5 10 8 12 8zM12 8s2-5 4.5-3.5S14 8 12 8z"/>',
  grad: '<path d="M22 9.5 12 5 2 9.5l10 4.5 10-4.5z"/><path d="M6 11.5V16c0 1.2 2.7 2.5 6 2.5s6-1.3 6-2.5v-4.5"/>',
  phone: '<path d="M21 16.5v2.5a2 2 0 0 1-2.2 2 19 19 0 0 1-8.3-3 18.7 18.7 0 0 1-5.7-5.7 19 19 0 0 1-3-8.4A2 2 0 0 1 3.8 2h2.5a2 2 0 0 1 2 1.7c.1.9.3 1.7.6 2.5a2 2 0 0 1-.5 2.1L7.3 9.4a15 15 0 0 0 5.7 5.7l1.1-1.1a2 2 0 0 1 2.1-.5c.8.3 1.6.5 2.5.6a2 2 0 0 1 1.7 2z"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7.5V12l3 1.8"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  send: '<path d="M22 2 11 13"/><path d="M22 2 15 22l-4-9-9-4 20-7z"/>',
  handshake: '<path d="m11 12 2-2 4 3.5a2 2 0 0 1-2.6 3L12 14"/><path d="M12 10 8.5 6.5a2 2 0 0 0-2.8 0L2.5 9.7"/><path d="m2 13 3.5 3.5a2 2 0 0 0 2.8 0L10 15"/><path d="M14 13.5 18 10l3.5 3"/>',
  plus: '<path d="M12 5v14M5 12h14"/>'
};
function Ic({ n, size = 16, sw = 2, style }: { n: string; size?: number; sw?: number; style?: React.CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, ...style }}
      dangerouslySetInnerHTML={{ __html: ICON_PATHS[n] || '' }} />
  );
}

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
  community: '', castePreference: '', motherTongue: '', city: '', state: '', education: '',
  employmentType: '', workField: '', companyName: '', designation: '', occupation: '',
  annualIncome: '', diet: '', fatherName: '', motherName: '', grandfatherName: '', brothers: '0', sisters: '0', landBigha: '',
  about: '', family: '', partnerPreference: '', postedBy: 'स्वयं', photoUrl: '', photos: [] as string[]
};

function fileToSmallDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const max = 720;
      let { width, height } = img;
      if (width > max || height > max) { const r = Math.min(max / width, max / height); width = Math.round(width * r); height = Math.round(height * r); }
      const c = document.createElement('canvas');
      c.width = width; c.height = height;
      c.getContext('2d')!.drawImage(img, 0, 0, width, height);
      URL.revokeObjectURL(url);
      resolve(c.toDataURL('image/jpeg', 0.74));
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
.mx-hero::before{content:'';position:absolute;right:-40px;top:-40px;width:200px;height:200px;border-radius:50%;background:rgba(255,255,255,.08)}
.mx-hero-wm{position:absolute;right:18px;bottom:-26px;opacity:.14;transform:rotate(-10deg);pointer-events:none}
.mx-hero h1{margin:0;font-size:23px;font-weight:800;position:relative}
.mx-hero p{margin:6px 0 0;font-size:13.5px;opacity:.93;position:relative;max-width:560px}
.mx-trust{display:flex;gap:16px;flex-wrap:wrap;margin-top:14px;position:relative}
.mx-trust span{font-size:12px;background:rgba(255,255,255,.16);padding:5px 12px;border-radius:999px;font-weight:600;display:inline-flex;align-items:center;gap:6px}
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
.mx-sg{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:8px}
.mx-sgc{font-size:12px;padding:5px 11px;border-radius:999px;border:1px dashed var(--mx-l);background:#fff;color:var(--mx-d);cursor:pointer;font-family:inherit;transition:.12s;font-weight:600}
.mx-sgc:hover{border-style:solid;border-color:var(--mx-p)}
.mx-sgc.on{background:var(--mx-p);color:#fff;border-style:solid;border-color:var(--mx-p)}
.mx-save{width:100%;background:linear-gradient(135deg,var(--mx-p),var(--mx-d));color:#fff;border:none;border-radius:12px;padding:14px;font-weight:800;font-size:15.5px;cursor:pointer;box-shadow:0 5px 18px var(--mx-sh);font-family:inherit}
.mx-save:disabled{opacity:.7}
.mx-note{background:var(--mx-ss);border:1px solid var(--mx-l);border-radius:12px;padding:11px 14px;font-size:12.5px;color:var(--mx-d);display:flex;gap:8px;align-items:flex-start;margin-bottom:14px}
.mx-status{border-radius:12px;padding:11px 15px;font-size:13px;font-weight:600;margin-bottom:14px}
/* modal */
.mx-mask{position:fixed;inset:0;background:rgba(17,17,17,.58);z-index:200;display:flex;align-items:flex-start;justify-content:center;padding:16px;overflow-y:auto}
.mx-modal{background:#fff;border-radius:22px;max-width:580px;width:100%;margin:20px 0;overflow:hidden;box-shadow:0 24px 70px rgba(0,0,0,.35);font-family:inherit}
.mx-mphoto{position:relative;background:#0f172a;display:flex;align-items:center;justify-content:center;min-height:260px;max-height:66vh;overflow:hidden}
.mx-mphoto img{max-width:100%;max-height:66vh;width:auto;height:auto;object-fit:contain;position:relative;z-index:1}
.mx-mphoto .mx-blur{position:absolute;inset:0;background-size:cover;background-position:center;filter:blur(26px) brightness(.55);transform:scale(1.15);z-index:0}
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
@media(max-width:560px){.mx-hero h1{font-size:20px}.mx-photo{height:180px}.mx-mphoto{min-height:220px;max-height:56vh}.mx-mphoto img{max-height:56vh}}
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
          {([['browse', 'search', 'प्रोफ़ाइल देखें'], ['profile', 'edit', 'मेरी प्रोफ़ाइल'], ['interests', 'heart', 'रुचि']] as [Tab, string, string][]).map(([t, ic, label]) => (
            <button key={t} className={`mx-tab${tab === t ? ' on' : ''}`} onClick={() => setTab(t)} style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}><Ic n={ic} size={15} />{label}</button>
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
      <div style={{ width: 74, height: 74, margin: '0 auto', borderRadius: '50%', background: 'linear-gradient(135deg,var(--mx-p),var(--mx-d))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}><Ic n="heart" size={34} sw={1.8} /></div>
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
        <div className="mx-trust">
          <span><Ic n="shield" size={14} /> सत्यापित</span>
          <span><Ic n="lock" size={14} /> नंबर सुरक्षित</span>
          <span><Ic n="gift" size={14} /> निःशुल्क</span>
        </div>
        <button className="mx-hero-btn" onClick={onCreate} style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}><Ic n="plus" size={16} sw={2.4} /> अपनी प्रोफ़ाइल बनाएं</button>
        <span className="mx-hero-wm"><Ic n="heart" size={132} sw={1.4} style={{ color: '#fff' }} /></span>
      </div>

      <div className="mx-filter">
        <select value={genderWant} onChange={(e) => setGenderWant(e.target.value as any)} className="mx-chip">
          <option value="">सभी (वर/वधू)</option>
          {GENDERS.map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}
        </select>
        <span style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
          <span style={{ position: 'absolute', left: 13, color: 'var(--mx-m)', display: 'inline-flex' }}><Ic n="search" size={15} /></span>
          <input value={cityQ} onChange={(e) => setCityQ(e.target.value)} placeholder="शहर / राज्य खोजें" className="mx-chip" style={{ minWidth: 190, paddingLeft: 34 }} />
        </span>
        <button onClick={() => setOnlyIntercaste((v) => !v)} className="mx-chip" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 7, background: onlyIntercaste ? 'var(--mx-p)' : '#fff', color: onlyIntercaste ? '#fff' : 'var(--mx-d)', borderColor: onlyIntercaste ? 'var(--mx-p)' : 'var(--mx-l)' }}>
          <Ic n="handshake" size={15} /> अंतरजातीय
        </button>
        <span style={{ fontSize: 12.5, color: 'var(--mx-m)', marginLeft: 'auto' }}>{filtered.length} प्रोफ़ाइल</span>
      </div>

      {loading ? <div className="mx-center">लोड हो रहा है…</div>
        : err ? <div style={{ textAlign: 'center', color: '#dc2626', padding: 40 }}>{err}</div>
        : filtered.length === 0 ? (
          <div className="mx-empty">
            <Ic n="heart" size={46} sw={1.3} style={{ color: 'var(--mx-p)', opacity: .5 }} />
            <p style={{ color: 'var(--mx-m)', fontSize: 14, marginTop: 8 }}>इस खोज में कोई प्रोफ़ाइल नहीं मिली। सबसे पहले अपनी प्रोफ़ाइल बनाएं!</p>
            <button className="mx-btn-p" onClick={onCreate} style={{ marginTop: 12, display: 'inline-flex', alignItems: 'center', gap: 7 }}><Ic n="plus" size={15} sw={2.4} /> प्रोफ़ाइल बनाएं</button>
          </div>
        ) : (
          <div className="mx-grid">
            {filtered.map((p) => (
              <button key={p.id} className="mx-card" onClick={() => setActive(p)}>
                <div className="mx-photo">
                  {p.photoUrl ? <img src={p.photoUrl} alt={p.name} /> : <Ic n="user" size={52} sw={1.3} style={{ color: 'var(--mx-p)', opacity: .5 }} />}
                  <span className="mx-badge">{ageFromDob(p.dob)} वर्ष</span>
                  {p.photos && p.photos.length > 1 && <span style={{ position: 'absolute', bottom: 8, right: 8, background: 'rgba(0,0,0,.6)', color: '#fff', fontSize: 10.5, fontWeight: 700, padding: '2px 8px', borderRadius: 999, display: 'inline-flex', alignItems: 'center', gap: 4 }}><Ic n="camera" size={11} /> {p.photos.length}</span>}
                  {isIntercaste(p.castePreference) && <span className="mx-badge ic" style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}><Ic n="check" size={12} sw={2.6} /> अंतरजातीय</span>}
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
                  <div className="mx-cmeta" style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Ic n="grad" size={14} /> {p.education}</div>
                  <div className="mx-cmeta" style={{ color: 'var(--mx-d)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}><Ic n="work" size={14} /> {careerLine(p) || p.employmentType}</div>
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
  const photos = (p.photos && p.photos.length ? p.photos : (p.photoUrl ? [p.photoUrl] : []));
  const [pi, setPi] = useState(0);

  const sendInterest = async () => {
    setSending(true); setMsg('');
    try {
      const r = await authFetch('/api/matrimony/interest', { method: 'POST', body: JSON.stringify({ action: 'send', toProfileId: p.id }) });
      const j = await r.json();
      setMsg(r.ok ? (j.already ? 'आप पहले ही रुचि भेज चुके हैं।' : 'रुचि भेज दी गई। स्वीकृत होने पर संपर्क मिलेगा।') : (j.message || 'रुचि नहीं भेजी जा सकी।'));
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
          {photos.length ? <div className="mx-blur" style={{ backgroundImage: `url("${(photos[pi] || photos[0]).replace(/"/g, '')}")` }} /> : null}
          {photos.length ? <img src={photos[pi] || photos[0]} alt={p.name} /> : <Ic n="user" size={92} sw={1.1} style={{ color: 'var(--mx-p)', opacity: .5 }} />}
          <button className="mx-x" onClick={onClose} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}><Ic n="x" size={16} /></button>
          {isIntercaste(p.castePreference) && <span className="mx-badge ic" style={{ bottom: 12, left: 12, top: 'auto', display: 'inline-flex', alignItems: 'center', gap: 4 }}><Ic n="check" size={12} sw={2.6} /> अंतरजातीय स्वीकार्य</span>}
        </div>
        {photos.length > 1 && (
          <div style={{ display: 'flex', gap: 8, padding: '10px 22px 0', flexWrap: 'wrap' }}>
            {photos.map((ph, i) => (
              <img key={i} src={ph} alt="" onClick={() => setPi(i)} style={{ width: 54, height: 54, objectFit: 'cover', borderRadius: 9, cursor: 'pointer', border: `2px solid ${i === pi ? 'var(--mx-p)' : 'transparent'}` }} />
            ))}
          </div>
        )}
        <div style={{ padding: 22 }}>
          <h2 style={{ margin: 0, color: 'var(--mx-d)', fontSize: 23 }}>{p.name}, {ageFromDob(p.dob)} वर्ष</h2>
          <p style={{ margin: '4px 0 10px', color: 'var(--mx-m)', fontSize: 13.5 }}>{heightLabel(p.heightCm)} · {p.maritalStatus} · {p.city}, {p.state}</p>
          {p.postedBy && <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--mx-d)', background: 'var(--mx-s)', padding: '4px 11px', borderRadius: 999, marginBottom: 14 }}><Ic n="user" size={12} /> यह रिश्ता {p.postedBy === 'स्वयं' ? 'स्वयं द्वारा' : `${p.postedBy} द्वारा`}</div>}
          {row('धर्म', p.religion)}{row('जाति / समुदाय', p.community)}{row('जाति पसंद', p.castePreference)}{row('मातृभाषा', p.motherTongue)}
          {row('शिक्षा', p.education)}{row('कार्य', p.employmentType)}{row('क्षेत्र', p.workField)}{row('कंपनी', p.companyName)}{row('पद', p.designation)}{row('आय', p.annualIncome)}{row('आहार', p.diet)}
          {row('पिता', p.fatherName)}{row('माता', p.motherName)}{row('दादाजी', p.grandfatherName)}
          {((p.brothers && p.brothers !== '0') || (p.sisters && p.sisters !== '0')) ? row('भाई-बहन', `${p.brothers || 0} भाई · ${p.sisters || 0} बहन`) : null}
          {row('कृषि भूमि', p.landBigha ? `${p.landBigha}${/\d$/.test(p.landBigha) ? ' बीघा' : ''}` : '')}
          {row('अन्य परिवार', p.family)}{row('अपने बारे में', p.about)}{row('जीवनसाथी में', p.partnerPreference)}

          {contact ? (
            <div style={{ marginTop: 16, background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: 12, padding: 14, textAlign: 'center' }}>
              <div style={{ fontSize: 12, color: '#047857' }}>संपर्क नंबर</div>
              <a href={`tel:${contact}`} style={{ fontSize: 22, fontWeight: 800, color: '#065f46', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8 }}><Ic n="phone" size={20} /> {contact}</a>
            </div>
          ) : (
            <div style={{ marginTop: 18, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button disabled={sending} onClick={sendInterest} className="mx-btn-p" style={{ flex: 1, minWidth: 170, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>{sending ? 'भेज रहे…' : <><Ic n="heart" size={17} /> रुचि भेजें</>}</button>
              <button onClick={viewContact} className="mx-btn-o" style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}><Ic n="phone" size={15} /> संपर्क देखें</button>
            </div>
          )}
          {msg && <p style={{ marginTop: 12, color: 'var(--mx-d)', fontSize: 13, textAlign: 'center' }}>{msg}</p>}
          <p style={{ marginTop: 12, fontSize: 11.5, color: '#9ca3af', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}><Ic n="lock" size={12} /> नंबर तभी दिखता है जब रुचि स्वीकृत हो।</p>
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
      try {
        const r = await authFetch('/api/matrimony/profile'); const j = await r.json();
        if (j.profile) {
          const pr = { ...EMPTY, ...j.profile };
          if ((!pr.photos || !pr.photos.length) && pr.photoUrl) pr.photos = [pr.photoUrl]; // purani single-photo profile
          setF(pr); setStatus(j.profile.status);
        }
      } catch {}
      setLoading(false);
    })();
  }, []);

  const [locating, setLocating] = useState(false);
  const set = (k: string, v: any) => setF((p: any) => ({ ...p, [k]: v }));

  // Current location → shahar/rajya khud bhar do (bina kisi API key — BigDataCloud free reverse-geocode)
  const detectLocation = () => {
    if (!navigator.geolocation) { setMsg('इस डिवाइस पर स्थान उपलब्ध नहीं है।'); return; }
    setLocating(true); setMsg('');
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const r = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=hi`);
          const j = await r.json();
          const city = j.city || j.locality || j.localityInfo?.administrative?.[3]?.name || '';
          const state = j.principalSubdivision || '';
          setF((p: any) => ({ ...p, city: city || p.city, state: state || p.state }));
          if (!city && !state) setMsg('स्थान नहीं मिला, कृपया हाथ से भरें।');
        } catch { setMsg('स्थान नहीं मिल पाया, कृपया हाथ से भरें।'); }
        setLocating(false);
      },
      () => { setMsg('स्थान की अनुमति नहीं मिली। कृपया हाथ से भरें।'); setLocating(false); },
      { timeout: 10000, maximumAge: 300000 }
    );
  };

  const onPhotos = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    if (!files.length) return;
    const cur: string[] = Array.isArray(f.photos) ? f.photos : [];
    const room = MAX_PHOTOS - cur.length;
    if (room <= 0) { setMsg(`अधिकतम ${MAX_PHOTOS} फोटो ही जोड़ सकते हैं।`); return; }
    const add: string[] = [];
    for (const file of files.slice(0, room)) {
      if (file.size > 10 * 1024 * 1024) continue;
      try { add.push(await fileToSmallDataUrl(file)); } catch {}
    }
    if (add.length) setF((p: any) => { const arr = [...(p.photos || []), ...add].slice(0, MAX_PHOTOS); return { ...p, photos: arr, photoUrl: arr[0] }; });
  };
  const removePhoto = (i: number) => setF((p: any) => { const arr = (p.photos || []).filter((_: string, j: number) => j !== i); return { ...p, photos: arr, photoUrl: arr[0] || '' }; });
  const save = async () => {
    setSaving(true); setMsg('');
    try {
      const r = await authFetch('/api/matrimony/profile', { method: 'POST', body: JSON.stringify({ ...f, siteId: slug }) });
      const j = await r.json();
      if (r.ok) { setStatus('pending'); setMsg('प्रोफ़ाइल सहेज दी गई। एडमिन स्वीकृति के बाद यह वेबसाइट पर दिखेगी।'); window.scrollTo({ top: 0, behavior: 'smooth' }); }
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
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Ic n={status === 'approved' ? 'check' : status === 'rejected' ? 'x' : 'clock'} size={15} /> स्थिति: {status === 'approved' ? 'स्वीकृत — वेबसाइट पर live' : status === 'rejected' ? 'अस्वीकृत — कृपया सही जानकारी भरें' : 'समीक्षा में — एडमिन स्वीकृति के बाद दिखेगी'}</span>
        </div>
      )}
      {msg && <div className="mx-note" style={{ color: 'var(--mx-d)' }}>{msg}</div>}

      <div className="mx-fcard">
        <div className="mx-sec"><i><Ic n="user"/></i> मूल जानकारी</div>
        <div className="mx-fgrid">
          <Field label="पूरा नाम *"><input className="mx-in" value={f.name} onChange={(e) => set('name', e.target.value)} /></Field>
          <Field label="लिंग *"><select className="mx-in" value={f.gender} onChange={(e) => set('gender', e.target.value)}><option value="">चुनें</option>{GENDERS.map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}</select></Field>
          <Field label="जन्मतिथि *"><input type="date" className="mx-in" value={f.dob} onChange={(e) => set('dob', e.target.value)} /></Field>
          <Field label="लंबाई *"><select className="mx-in" value={f.heightCm} onChange={(e) => set('heightCm', Number(e.target.value))}><option value={0}>चुनें</option>{HEIGHT_OPTIONS.map((h) => <option key={h.cm} value={h.cm}>{h.label}</option>)}</select></Field>
          <Field label="वैवाहिक स्थिति *"><select className="mx-in" value={f.maritalStatus} onChange={(e) => set('maritalStatus', e.target.value)}><option value="">चुनें</option>{MARITAL_STATUS.map((m) => <option key={m} value={m}>{m}</option>)}</select></Field>
          <Field label="आहार"><select className="mx-in" value={f.diet} onChange={(e) => set('diet', e.target.value)}><option value="">चुनें (वैकल्पिक)</option>{DIETS.map((d) => <option key={d} value={d}>{d}</option>)}</select></Field>
          <Field label="यह रिश्ता किसने डाला? *"><select className="mx-in" value={f.postedBy} onChange={(e) => set('postedBy', e.target.value)}>{POSTED_BY_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}</select></Field>
        </div>
      </div>

      <div className="mx-fcard">
        <div className="mx-sec"><i><Ic n="faith"/></i> धर्म, जाति व भाषा</div>
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
        <div className="mx-sec"><i><Ic n="pin"/></i> स्थान व शिक्षा</div>
        <button type="button" onClick={detectLocation} disabled={locating} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: 'var(--mx-s)', color: 'var(--mx-d)', border: '1px solid var(--mx-l)', borderRadius: 10, padding: '8px 14px', fontWeight: 700, fontSize: 12.5, cursor: 'pointer', marginBottom: 4 }}>
          <Ic n="pin" size={14} /> {locating ? 'स्थान खोज रहे…' : 'वर्तमान स्थान चुनें'}
        </button>
        <div className="mx-fgrid">
          <Field label="शहर *"><input className="mx-in" value={f.city} onChange={(e) => set('city', e.target.value)} /></Field>
          <Field label="राज्य *"><input className="mx-in" value={f.state} onChange={(e) => set('state', e.target.value)} /></Field>
          <Field label="शिक्षा *"><input className="mx-in" value={f.education} onChange={(e) => set('education', e.target.value)} placeholder="जैसे B.A., B.Tech, 12वीं" /></Field>
        </div>
      </div>

      <div className="mx-fcard">
        <div className="mx-sec"><i><Ic n="work"/></i> कार्य / रोज़गार</div>
        <div className="mx-fgrid">
          <Field label="आप क्या करते हैं? *">
            <select className="mx-in" value={f.employmentType} onChange={(e) => set('employmentType', e.target.value)}>
              <option value="">चुनें</option>{EMPLOYMENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </Field>
          {WORKS_FOR_PAY(f.employmentType) && (
            <>
              <Field label="किस क्षेत्र में?">
                <select className="mx-in" value={f.workField} onChange={(e) => set('workField', e.target.value)}>
                  <option value="">चुनें (वैकल्पिक)</option>{WORK_FIELDS.map((w) => <option key={w} value={w}>{w}</option>)}
                </select>
              </Field>
              <Field label="पद / भूमिका (Role)">
                <input className="mx-in" list="mx-roles" value={f.designation} onChange={(e) => set('designation', e.target.value)} placeholder="चुनें या लिखें — जैसे सॉफ्टवेयर इंजीनियर" />
                <datalist id="mx-roles">{ROLE_OPTIONS.map((r) => <option key={r} value={r} />)}</datalist>
              </Field>
              <Field label="कंपनी / संस्था का नाम"><input className="mx-in" value={f.companyName} onChange={(e) => set('companyName', e.target.value)} placeholder="(वैकल्पिक)" /></Field>
            </>
          )}
          <Field label="वार्षिक आय"><select className="mx-in" value={f.annualIncome} onChange={(e) => set('annualIncome', e.target.value)}><option value="">चुनें (वैकल्पिक)</option>{INCOME_RANGES.map((i) => <option key={i} value={i}>{i}</option>)}</select></Field>
        </div>
      </div>

      <div className="mx-fcard">
        <div className="mx-sec"><i><Ic n="family"/></i> परिवार की जानकारी</div>
        <div className="mx-fgrid">
          <Field label="पिता का नाम *"><input className="mx-in" value={f.fatherName} onChange={(e) => set('fatherName', e.target.value)} /></Field>
          <Field label="माता का नाम *"><input className="mx-in" value={f.motherName} onChange={(e) => set('motherName', e.target.value)} /></Field>
          <Field label="दादाजी का नाम"><input className="mx-in" value={f.grandfatherName} onChange={(e) => set('grandfatherName', e.target.value)} placeholder="(वैकल्पिक)" /></Field>
          <Field label="कितने भाई"><select className="mx-in" value={f.brothers} onChange={(e) => set('brothers', e.target.value)}>{SIBLING_COUNTS.map((n) => <option key={n} value={n}>{n}</option>)}</select></Field>
          <Field label="कितनी बहनें"><select className="mx-in" value={f.sisters} onChange={(e) => set('sisters', e.target.value)}>{SIBLING_COUNTS.map((n) => <option key={n} value={n}>{n}</option>)}</select></Field>
          <Field label="कृषि भूमि (बीघा में)"><input className="mx-in" value={f.landBigha} onChange={(e) => set('landBigha', e.target.value)} placeholder="जैसे 10 बीघा (वैकल्पिक)" /></Field>
        </div>
        <Field label="अन्य पारिवारिक जानकारी"><textarea className="mx-in" value={f.family} onChange={(e) => set('family', e.target.value)} placeholder="पिता/माता का कार्य, पारिवारिक पृष्ठभूमि…" /></Field>
      </div>

      <div className="mx-fcard">
        <div className="mx-sec"><i><Ic n="chat"/></i> अपने बारे में व अपेक्षा</div>
        <Field label="अपने बारे में">
          <ChipRow options={ABOUT_SUGGESTIONS} value={f.about} onAdd={(t) => set('about', t)} />
          <textarea className="mx-in" value={f.about} onChange={(e) => set('about', e.target.value)} placeholder="नीचे से चुनें या खुद लिखें…" />
        </Field>
        <Field label="कैसा जीवनसाथी चाहिए">
          <ChipRow options={PARTNER_SUGGESTIONS} value={f.partnerPreference} onAdd={(t) => set('partnerPreference', t)} />
          <textarea className="mx-in" value={f.partnerPreference} onChange={(e) => set('partnerPreference', e.target.value)} placeholder="नीचे से चुनें या खुद लिखें…" />
        </Field>
      </div>

      <div className="mx-fcard">
        <div className="mx-sec"><i><Ic n="camera"/></i> फोटो <span style={{ fontWeight: 500, fontSize: 12, color: 'var(--mx-m)', marginLeft: 4 }}>(कम से कम 1, अधिकतम {MAX_PHOTOS})</span></div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          {(f.photos || []).map((ph: string, i: number) => (
            <div key={i} style={{ position: 'relative', width: 86, height: 86 }}>
              <img src={ph} alt="" style={{ width: 86, height: 86, objectFit: 'cover', borderRadius: 12, border: '1px solid var(--mx-l)' }} />
              {i === 0 && <span style={{ position: 'absolute', bottom: 3, left: 3, background: 'var(--mx-p)', color: '#fff', fontSize: 9, fontWeight: 700, padding: '1px 6px', borderRadius: 999 }}>मुख्य</span>}
              <button type="button" onClick={() => removePhoto(i)} aria-label="हटाएं" style={{ position: 'absolute', top: -6, right: -6, width: 22, height: 22, borderRadius: '50%', border: 'none', background: '#dc2626', color: '#fff', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}><Ic n="x" size={12} sw={2.6} /></button>
            </div>
          ))}
          {(f.photos || []).length < MAX_PHOTOS && (
            <label style={{ width: 86, height: 86, borderRadius: 12, border: '1.5px dashed var(--mx-l)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--mx-p)', gap: 4 }}>
              <Ic n="plus" size={20} /><span style={{ fontSize: 10.5, fontWeight: 600 }}>फोटो जोड़ें</span>
              <input type="file" accept="image/*" multiple onChange={onPhotos} style={{ display: 'none' }} />
            </label>
          )}
        </div>
      </div>

      <div className="mx-note"><Ic n="lock" size={15} style={{ marginTop: 1 }} /> <span>आपका मोबाइल नंबर प्रोफ़ाइल में कहीं नहीं दिखेगा। किसी की रुचि स्वीकार करने पर ही आपका संपर्क उस तक पहुँचेगा।</span></div>
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
      <div className="mx-it-av">{it.profile.photoUrl ? <img src={it.profile.photoUrl} alt="" /> : <Ic n="user" size={26} sw={1.4} style={{ color: 'var(--mx-p)', opacity: .55 }} />}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 800, color: 'var(--mx-d)', fontSize: 14.5 }}>{it.profile.name || 'प्रोफ़ाइल'}{it.profile.age ? `, ${it.profile.age}` : ''}</div>
        <div style={{ fontSize: 12, color: 'var(--mx-m)' }}>{[it.profile.city, it.profile.occupation].filter(Boolean).join(' · ')}</div>
        <div style={{ fontSize: 11.5, marginTop: 3, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 5, color: it.status === 'accepted' ? '#047857' : it.status === 'declined' ? '#dc2626' : '#b45309' }}>
          <Ic n={it.status === 'accepted' ? 'check' : it.status === 'declined' ? 'x' : 'clock'} size={13} /> {it.status === 'accepted' ? 'स्वीकृत' : it.status === 'declined' ? 'अस्वीकृत' : 'प्रतीक्षा में'}
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
          <button disabled={busy === it.interestId} onClick={() => viewContact(it.profile.id, it.interestId)} className="mx-btn-p" style={{ padding: '8px 13px', fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 5 }}><Ic n="phone" size={13} /> संपर्क</button>
        )}
      </div>
    </div>
  );

  return (
    <div style={{ maxWidth: 700, margin: '0 auto' }}>
      {!data?.hasProfile && (
        <div className="mx-note" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <span>रुचि भेजने/पाने के लिए पहले अपनी प्रोफ़ाइल बनाएं।</span>
          <button className="mx-btn-p" onClick={onCreate} style={{ padding: '8px 16px', fontSize: 12.5, display: 'inline-flex', alignItems: 'center', gap: 6 }}><Ic n="plus" size={14} sw={2.4} /> प्रोफ़ाइल बनाएं</button>
        </div>
      )}
      <h3 style={{ color: 'var(--mx-d)', fontSize: 16.5, margin: '6px 0 12px', display: 'flex', alignItems: 'center', gap: 8 }}><Ic n="heart" size={17} /> मेरे पास आई रुचि</h3>
      {data?.received?.length ? data.received.map((it) => <Item key={it.interestId} it={it} incoming />) : <p style={{ color: '#9ca3af', fontSize: 13 }}>अभी कोई रुचि नहीं आई।</p>}
      <h3 style={{ color: 'var(--mx-d)', fontSize: 16.5, margin: '24px 0 12px', display: 'flex', alignItems: 'center', gap: 8 }}><Ic n="send" size={16} /> मेरी भेजी रुचि</h3>
      {data?.sent?.length ? data.sent.map((it) => <Item key={it.interestId} it={it} incoming={false} />) : <p style={{ color: '#9ca3af', fontSize: 13 }}>आपने अभी तक कोई रुचि नहीं भेजी।</p>}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="mx-field" style={{ marginTop: 10 }}><span>{label}</span>{children}</label>;
}

/* Quick-fill chips: click karke add/hata (comma se juda), textarea me khud bhi likh sakte hain */
function ChipRow({ options, value, onAdd }: { options: string[]; value: string; onAdd: (t: string) => void }) {
  const parts = String(value || '').split(',').map((s) => s.trim()).filter(Boolean);
  const has = (o: string) => parts.some((p) => p.toLowerCase() === o.toLowerCase());
  const toggle = (o: string) => {
    if (has(o)) onAdd(parts.filter((p) => p.toLowerCase() !== o.toLowerCase()).join(', '));
    else onAdd([...parts, o].join(', '));
  };
  return (
    <div className="mx-sg">
      {options.map((o) => (
        <button type="button" key={o} className={`mx-sgc${has(o) ? ' on' : ''}`} onClick={() => toggle(o)}>{has(o) ? '✓ ' : '+ '}{o}</button>
      ))}
    </div>
  );
}
