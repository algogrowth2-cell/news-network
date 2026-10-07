'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { collection, doc, getDoc, onSnapshot, query, where } from 'firebase/firestore';
import { activatePendingReward, ensureReferralCode, REFERRAL_REWARD_MONTHS } from '@/lib/referralService';
import { fallbackFor, isEnglishSlug, resolveSiteSlug } from '@/lib/siteTheme';
import { AdLayout } from '@/components/SiteAds';
import PortalLogo from '@/components/PortalLogo';

interface ReaderSession {
  uid?: string;
  name?: string;
  email?: string;
  phone?: string;
}

interface ReferralEntry {
  id: string;
  name: string;
  phone: string;
  joinedAt: Date | null;
  rewardStatus: 'granted' | 'pending_selection' | 'claimed' | 'none';
  validTill: Date | null;
}

const M = REFERRAL_REWARD_MONTHS;

// Portal ki default bhasha ke hisaab se saara text
const TEXT = {
  hi: {
    home: '← होम',
    pageTitle: '🎁 रेफर करें और कमाएं',
    loginTitle: `रेफर करें, ${M} महीने ई-पेपर फ्री पाएं`,
    loginDesc: `अपना रेफरल कोड और लिंक पाने के लिए पहले लॉगिन करें। हर सफल रेफरल पर आपको ${M} महीने का ई-पेपर बिल्कुल मुफ़्त मिलेगा।`,
    loginBtn: 'लॉगिन / साइन अप करें',
    heroTitle: `दोस्तों को जोड़ें, हर सफल रेफरल पर ${M} महीने का ई-पेपर फ्री`,
    heroDesc: (name: string) =>
      `नमस्ते ${name} जी! अपना कोड या लिंक शेयर करें। जैसे ही कोई नया पाठक आपके कोड से साइन अप करेगा, आपका ${M} महीने का फ्री ई-पेपर अपने-आप सक्रिय हो जाएगा — जितने ज़्यादा रेफरल, उतने ज़्यादा महीने।`,
    defaultName: 'पाठक',
    statsAria: 'आपकी रेफरल जानकारी',
    statReferrals: 'सफल रेफरल',
    statReferralsSub: 'नए पाठक जुड़े',
    statMonths: 'कमाए गए फ्री महीने',
    statMonthsSub: 'ई-पेपर ऐक्सेस',
    statEpaper: 'ई-पेपर ऐक्सेस',
    activeTill: (d: string) => `✓ ${d} तक`,
    notActive: 'अभी सक्रिय नहीं',
    readEpaper: 'ई-पेपर पढ़ें →',
    pendingTitle: (n: number) => `🎉 आपके ${n} रिवार्ड सक्रिय होने बाकी हैं`,
    pendingLine: (p: string) => `सफल रेफरल: ${p} — ${M} महीने का फ्री ई-पेपर`,
    activating: 'सक्रिय हो रहा है…',
    activateNow: 'अभी सक्रिय करें',
    activatedOk: (d: string) => `🎉 ${M} महीने का फ्री ई-पेपर सक्रिय हो गया — ${d} तक।`,
    alreadyActive: 'यह रिवार्ड पहले ही सक्रिय हो चुका है।',
    activateFail: 'रिवार्ड सक्रिय नहीं हो पाया, कृपया पुनः प्रयास करें।',
    shareTitle: 'अपना कोड या लिंक शेयर करें',
    codeError: 'रेफरल कोड लोड नहीं हो पाया। कृपया पेज रीफ़्रेश करें।',
    yourCode: 'आपका रेफरल कोड',
    copy: 'कॉपी',
    copied: '✓ कॉपी हुआ',
    codeHint: 'दोस्त साइन अप करते समय “रेफरल कोड” में ये कोड डालें',
    yourLink: 'आपका रेफरल लिंक',
    loadingLink: 'लोड हो रहा है…',
    linkAria: 'रेफरल लिंक',
    copyLink: 'लिंक कॉपी करें',
    linkHint: 'लिंक खोलते ही आपका कोड अपने-आप भर जाएगा',
    moreOptions: '↗ और विकल्प',
    copyPrompt: 'कॉपी करें:',
    shareMsg: (site: string, code: string, link: string) =>
      `📰 मैं ${site} पर ताज़ा खबरें और ई-पेपर पढ़ता/पढ़ती हूँ। आप भी जुड़ें!\n\n🎁 मेरा रेफरल कोड: *${code}*\nइस लिंक से मुफ़्त साइन अप करें:\n${link}`,
    tweet: (code: string) => `🎁 मेरा रेफरल कोड: ${code}`,
    howTitle: 'कैसे काम करता है?',
    steps: [
      ['कोड / लिंक शेयर करें', 'WhatsApp, Facebook या SMS से अपना रेफरल कोड या लिंक दोस्तों और परिवार को भेजें।'],
      ['दोस्त साइन अप करें', 'दोस्त आपके लिंक से या साइन अप के समय आपका कोड डालकर, अपने मोबाइल OTP से नया खाता बनाएं।'],
      [`${M} महीने ई-पेपर फ्री`, 'साइन अप होते ही रेफरल अपने-आप सत्यापित होता है और आपका फ्री ई-पेपर तुरंत सक्रिय हो जाता है।']
    ],
    historyTitle: (n: number) => `मेरे रेफरल (${n})`,
    historyEmpty: `अभी तक कोई रेफरल नहीं। अपना कोड शेयर करें — पहला दोस्त जुड़ते ही आपको ${M} महीने का फ्री ई-पेपर मिलेगा! 🎁`,
    joinedOn: (d: string) => `${d} को जुड़े`,
    rewardGranted: (till: string) => `✓ +${M} माह ई-पेपर${till ? ` · ${till} तक` : ''}`,
    rewardPending: 'सक्रिय करना बाकी',
    rewardDone: '✓ सफल रेफरल',
    termsTitle: 'नियम व शर्तें',
    terms: [
      'रेफरल तभी सफल माना जाएगा जब नया पाठक पहली बार अपने मोबाइल नंबर (OTP) से खाता बनाए।',
      'अपने ही नंबर से खुद को रेफर करना, या पहले से पंजीकृत नंबर, मान्य नहीं है।',
      `हर सफल रेफरल पर ${M} महीने (90 दिन) का ई-पेपर फ्री मिलता है; पहले से सक्रिय ई-पेपर हो तो उसकी अवधि आगे बढ़ जाती है।`,
      'फ्री ई-पेपर इसी खाते से लॉगिन करने पर सभी संस्करणों के लिए मान्य है।'
    ]
  },
  en: {
    home: '← Home',
    pageTitle: '🎁 Refer & Earn',
    loginTitle: `Refer friends, get ${M} months of e-paper free`,
    loginDesc: `Please log in to get your referral code and link. For every successful referral you get ${M} months of e-paper absolutely free.`,
    loginBtn: 'Login / Sign up',
    heroTitle: `Invite friends — get ${M} months of free e-paper for every successful referral`,
    heroDesc: (name: string) =>
      `Hello ${name}! Share your code or link. As soon as a new reader signs up with your code, your ${M}-month free e-paper is activated automatically — more referrals, more months.`,
    defaultName: 'Reader',
    statsAria: 'Your referral summary',
    statReferrals: 'Successful referrals',
    statReferralsSub: 'New readers joined',
    statMonths: 'Free months earned',
    statMonthsSub: 'E-paper access',
    statEpaper: 'E-paper access',
    activeTill: (d: string) => `✓ Till ${d}`,
    notActive: 'Not active yet',
    readEpaper: 'Read e-paper →',
    pendingTitle: (n: number) => `🎉 ${n} reward${n > 1 ? 's' : ''} waiting to be activated`,
    pendingLine: (p: string) => `Successful referral: ${p} — ${M} months free e-paper`,
    activating: 'Activating…',
    activateNow: 'Activate now',
    activatedOk: (d: string) => `🎉 Your ${M}-month free e-paper is active — till ${d}.`,
    alreadyActive: 'This reward is already active.',
    activateFail: 'Could not activate the reward, please try again.',
    shareTitle: 'Share your code or link',
    codeError: 'Could not load your referral code. Please refresh the page.',
    yourCode: 'Your referral code',
    copy: 'Copy',
    copied: '✓ Copied',
    codeHint: 'Friends enter this code in “Referral code” while signing up',
    yourLink: 'Your referral link',
    loadingLink: 'Loading…',
    linkAria: 'Referral link',
    copyLink: 'Copy link',
    linkHint: 'Your code is filled in automatically when the link is opened',
    moreOptions: '↗ More options',
    copyPrompt: 'Copy:',
    shareMsg: (site: string, code: string, link: string) =>
      `📰 I read the latest news and e-paper on ${site}. Join me!\n\n🎁 My referral code: *${code}*\nSign up free with this link:\n${link}`,
    tweet: (code: string) => `🎁 My referral code: ${code}`,
    howTitle: 'How it works',
    steps: [
      ['Share your code / link', 'Send your referral code or link to friends and family on WhatsApp, Facebook or SMS.'],
      ['Friend signs up', 'Your friend opens your link, or enters your code while signing up, and creates a new account with mobile OTP.'],
      [`${M} months e-paper free`, 'The referral is verified automatically at sign-up and your free e-paper is activated instantly.']
    ],
    historyTitle: (n: number) => `My referrals (${n})`,
    historyEmpty: `No referrals yet. Share your code — you get ${M} months of free e-paper as soon as your first friend joins! 🎁`,
    joinedOn: (d: string) => `Joined ${d}`,
    rewardGranted: (till: string) => `✓ +${M} months e-paper${till ? ` · till ${till}` : ''}`,
    rewardPending: 'Activation pending',
    rewardDone: '✓ Successful referral',
    termsTitle: 'Terms & conditions',
    terms: [
      'A referral counts only when a new reader creates an account with their mobile number (OTP) for the first time.',
      'Referring yourself, or an already registered number, is not valid.',
      `Every successful referral gives ${M} months (90 days) of free e-paper; if your e-paper is already active, its validity is extended.`,
      'The free e-paper is valid for all editions when you log in with this same account.'
    ]
  }
};

const toDate = (v: any): Date | null => (v?.toDate ? v.toDate() : v ? new Date(v) : null);
// Doosre user ka pura number referrer ko nahi dikhta
const maskPhone = (p: string) => (p.length === 10 ? `${p.slice(0, 2)}XXXXXX${p.slice(-2)}` : p);

// Saare rang --brand se — har portal ka apna rang
const RF_CSS = `
.rf{min-height:100vh;background:#f6f4f0;font-family:'Noto Sans Devanagari',system-ui,sans-serif;color:#1c1917;
  --brand-soft:color-mix(in srgb,var(--brand) 9%,#fff);--brand-line:color-mix(in srgb,var(--brand) 32%,#fff);--brand-deep:color-mix(in srgb,var(--brand) 72%,#000)}
.rf-top{position:sticky;top:0;z-index:5;background:#fff;border-bottom:1px solid #ebe7e0;display:flex;align-items:center;gap:12px;padding:12px 16px}
.rf-top a{color:#57534e;text-decoration:none;font-size:14px;font-weight:600}
.rf-top b{font-size:15px;color:var(--brand)}
.rf-wrap{max-width:960px;margin:0 auto;padding:20px 16px 48px;display:grid;gap:18px}
.sa-main .rf-wrap{max-width:none;padding:20px 0 48px}
.rf-hero{position:relative;overflow:hidden;border-radius:20px;padding:28px 24px;color:#fff;background:linear-gradient(135deg,var(--brand) 0%,var(--brand-deep) 100%)}
.rf-hero::after{content:'';position:absolute;right:-60px;top:-60px;width:220px;height:220px;border-radius:50%;background:rgba(255,255,255,.08)}
.rf-hero-badge{display:inline-flex;align-items:center;gap:6px;background:rgba(255,255,255,.18);border-radius:99px;padding:5px 12px;font-size:12.5px;font-weight:700}
.rf-hero h1{margin:12px 0 8px;font-size:28px;line-height:1.35;font-weight:800}
.rf-hero p{margin:0;max-width:560px;font-size:14.5px;line-height:1.7;opacity:.95}
.rf-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}
.rf-stat{background:#fff;border:1px solid #ebe7e0;border-radius:16px;padding:16px}
.rf-stat-label{font-size:12.5px;color:#78716c;font-weight:600}
.rf-stat-value{margin-top:6px;font-size:26px;font-weight:800;line-height:1.3}
.rf-stat-sub{font-size:12px;color:#78716c;margin-top:2px}
.rf-card{background:#fff;border:1px solid #ebe7e0;border-radius:18px;padding:20px}
.rf-card.hl{border-color:var(--brand-line);background:var(--brand-soft)}
.rf-card h2{margin:0 0 14px;font-size:17px;font-weight:800;line-height:1.4}
.rf-share{display:grid;grid-template-columns:1fr 1.4fr;gap:16px}
.rf-label{font-size:12.5px;font-weight:700;color:#57534e;margin-bottom:6px}
.rf-code{display:flex;align-items:center;justify-content:space-between;gap:10px;border:2px dashed var(--brand-line);background:var(--brand-soft);border-radius:14px;padding:12px 14px}
.rf-code-text{font-family:ui-monospace,Menlo,Consolas,monospace;font-size:24px;font-weight:800;letter-spacing:3px;color:var(--brand-deep)}
.rf-link{display:flex;gap:8px}
.rf-link input{flex:1;min-width:0;border:1.5px solid #e7e5e4;border-radius:12px;padding:12px;font-size:13px;color:#44403c;background:#fafaf9;font-family:inherit}
.rf-btn{border:0;border-radius:12px;padding:11px 16px;font-size:13.5px;font-weight:700;cursor:pointer;font-family:inherit;white-space:nowrap;background:var(--brand);color:#fff}
.rf-btn.ok{background:#16a34a}
.rf-btn.ghost{background:#fff;color:var(--brand);border:1.5px solid var(--brand-line)}
.rf-btn:disabled{opacity:.6;cursor:not-allowed}
.rf-btn:focus-visible{outline:3px solid var(--brand-line);outline-offset:2px}
.rf-socials{display:flex;flex-wrap:wrap;gap:8px;margin-top:14px}
.rf-social{display:inline-flex;align-items:center;gap:7px;border-radius:10px;padding:9px 14px;font-size:13px;font-weight:700;color:#fff;text-decoration:none;border:0;cursor:pointer;font-family:inherit}
.rf-steps{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}
.rf-step{background:#fafaf9;border:1px solid #f0ece6;border-radius:14px;padding:16px}
.rf-step-num{width:32px;height:32px;border-radius:50%;display:grid;place-items:center;background:var(--brand-soft);color:var(--brand-deep);font-weight:800;margin-bottom:10px}
.rf-step b{display:block;font-size:14.5px;margin-bottom:4px}
.rf-step span{font-size:13px;color:#57534e;line-height:1.6}
.rf-list{display:grid;gap:10px}
.rf-item{display:flex;align-items:center;justify-content:space-between;gap:12px;border:1px solid #f0ece6;border-radius:14px;padding:12px 14px;flex-wrap:wrap;background:#fff}
.rf-avatar{width:38px;height:38px;border-radius:50%;background:var(--brand-soft);color:var(--brand-deep);display:grid;place-items:center;font-weight:800;flex-shrink:0}
.rf-item-main{display:flex;align-items:center;gap:12px;min-width:0}
.rf-item-name{font-weight:700;font-size:14px}
.rf-item-sub{font-size:12px;color:#78716c;margin-top:2px}
.rf-pill{display:inline-block;border-radius:99px;padding:5px 11px;font-size:12px;font-weight:700;white-space:nowrap}
.rf-empty{text-align:center;padding:26px 12px;color:#78716c;font-size:13.5px;line-height:1.7;background:#fafaf9;border:1px dashed #e7e5e4;border-radius:14px}
.rf-terms{margin:0;padding-left:18px;font-size:13px;color:#57534e;line-height:1.9}
.rf-login{max-width:460px;margin:40px auto;text-align:center}
.rf-msg{border-radius:12px;padding:11px 14px;font-size:13.5px;font-weight:600}
@media(max-width:760px){
  .rf-share{grid-template-columns:1fr}
  .rf-steps{grid-template-columns:1fr}
  .rf-hero h1{font-size:22px}
}
@media(max-width:520px){
  .rf-stats{grid-template-columns:1fr 1fr}
  .rf-stats .rf-stat:last-child{grid-column:span 2}
  .rf-stat-value{font-size:22px}
  .rf-code-text{font-size:20px;letter-spacing:2px}
  .rf-link{flex-direction:column}
}
`;

export default function ReferPage() {
  const [ready, setReady] = useState(false);
  const [siteSlug, setSiteSlug] = useState('');
  const [brand, setBrand] = useState('');
  const [siteName, setSiteName] = useState('');
  const [session, setSession] = useState<ReaderSession | null>(null);
  const [profile, setProfile] = useState<{ name: string; email: string; count: number; months: number } | null>(null);
  const [code, setCode] = useState('');
  const [codeError, setCodeError] = useState(false);
  const [entries, setEntries] = useState<ReferralEntry[]>([]);
  const [rewardsMap, setRewardsMap] = useState<Map<string, { status: string; validTill: Date | null }>>(new Map());
  const [epaperTill, setEpaperTill] = useState<Date | null>(null);
  const [copied, setCopied] = useState<'code' | 'link' | ''>('');
  const [activating, setActivating] = useState('');
  const [notice, setNotice] = useState<{ text: string; ok: boolean } | null>(null);
  const [origin, setOrigin] = useState('');

  const isEnglish = isEnglishSlug(siteSlug);
  const t = isEnglish ? TEXT.en : TEXT.hi;
  const fmtDate = (d: Date | null) =>
    d ? d.toLocaleDateString(isEnglish ? 'en-IN' : 'hi-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : '—';
  const withSite = (path: string) => (siteSlug ? `${path}${path.includes('?') ? '&' : '?'}site=${siteSlug}` : path);

  const phone = session?.phone || '';
  const userId = session?.uid || (phone ? `u_${phone}` : '');

  // Portal (?site= ya domain) + reader session
  useEffect(() => {
    setOrigin(window.location.origin);
    const slug = resolveSiteSlug(new URLSearchParams(window.location.search).get('site'));
    const fb = fallbackFor(slug);
    setSiteSlug(slug);
    setBrand(fb.primaryColor);
    setSiteName(fb.name);
    try {
      const raw = localStorage.getItem('reader_user');
      if (raw) setSession(JSON.parse(raw));
    } catch {
      /* session na mile toh login card */
    }
    setReady(true);
  }, []);

  // Admin me set kiya portal ka rang/naam (homepage jaisa)
  useEffect(() => {
    if (!siteSlug) return;
    return onSnapshot(
      doc(db, 'sites', siteSlug),
      (snap) => {
        const d = snap.data();
        if (d?.primaryColor) setBrand(d.primaryColor);
        if (d?.name) setSiteName(d.name);
      },
      (err) => console.error('Site config load error:', err)
    );
  }, [siteSlug]);

  // Profile + apna referral code (purane users ka code pehli baar yahin banta hai)
  useEffect(() => {
    if (!phone) return;
    let cancelled = false;
    getDoc(doc(db, 'users', userId))
      .then(async (snap) => {
        const d = snap.data() || {};
        if (cancelled) return;
        setProfile({
          name: d.name || session?.name || '',
          email: d.email || session?.email || `${phone}@news.local`,
          count: Number(d.successfulReferralsCount || 0),
          months: Number(d.referralRewardMonths || 0)
        });
        const c = d.referralCode || (await ensureReferralCode(userId, phone));
        if (!cancelled) setCode(c);
      })
      .catch((err) => {
        console.error('Referral profile load error:', err);
        if (!cancelled) setCodeError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [phone, userId, session?.name, session?.email]);

  // Mere referrals + rewards (live)
  useEffect(() => {
    if (!phone) return;
    const unsubReferrals = onSnapshot(query(collection(db, 'referrals'), where('referrerPhone', '==', phone)), (snap) => {
      setEntries(
        snap.docs
          .map((d) => {
            const x = d.data();
            return {
              id: d.id,
              name: x.referredUserName || '',
              phone: x.referredUserPhone || '',
              joinedAt: toDate(x.completedAt || x.createdAt) || new Date(),
              rewardStatus: x.rewardStatus || 'none',
              validTill: toDate(x.rewardValidTill)
            } as ReferralEntry;
          })
          .sort((a, b) => (b.joinedAt?.getTime() || 0) - (a.joinedAt?.getTime() || 0))
      );
    });
    const unsubRewards = onSnapshot(query(collection(db, 'referral_rewards'), where('referrerPhone', '==', phone)), (snap) => {
      const m = new Map<string, { status: string; validTill: Date | null }>();
      snap.docs.forEach((d) => m.set(d.id, { status: d.data().status, validTill: toDate(d.data().validTill) }));
      setRewardsMap(m);
    });
    return () => {
      unsubReferrals();
      unsubRewards();
    };
  }, [phone]);

  // E-paper kab tak free/active hai
  useEffect(() => {
    if (!profile?.email) return;
    return onSnapshot(doc(db, 'epaper_subscriptions', profile.email), (snap) => {
      const d = snap.data();
      const exp = d?.status === 'active' ? toDate(d.expiresAt) : null;
      setEpaperTill(exp && exp.getTime() > Date.now() ? exp : null);
    });
  }, [profile?.email]);

  const referralLink = code && origin ? `${origin}/login?ref=${code}` : '';
  const shareText = code ? t.shareMsg(siteName, code, referralLink) : '';
  const displayName = profile?.name || session?.name || t.defaultName;

  const pendingIds = useMemo(
    () => Array.from(rewardsMap.entries()).filter(([, r]) => r.status === 'pending_selection').map(([id]) => id),
    [rewardsMap]
  );
  const successCount = Math.max(profile?.count || 0, entries.length);
  const monthsEarned = Math.max(
    profile?.months || 0,
    Array.from(rewardsMap.values()).filter((r) => r.status === 'granted' || r.status === 'claimed').length * M
  );

  const copy = async (what: 'code' | 'link') => {
    const value = what === 'code' ? code : referralLink;
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      window.prompt(t.copyPrompt, value);
    }
    setCopied(what);
    setTimeout(() => setCopied(''), 2200);
  };

  const nativeShare = async () => {
    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({ title: `${siteName} — Refer & Earn`, text: shareText.replace(referralLink, '').trim(), url: referralLink });
      } catch {
        /* user ne cancel kiya */
      }
      return;
    }
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`, '_blank', 'noopener,noreferrer');
  };

  const handleActivate = async (rewardId: string) => {
    if (!profile || !phone) return;
    setActivating(rewardId);
    setNotice(null);
    try {
      const till = await activatePendingReward(rewardId, { userId, phone, email: profile.email, name: displayName });
      setNotice({ text: till ? t.activatedOk(fmtDate(till)) : t.alreadyActive, ok: true });
    } catch (err) {
      console.error(err);
      setNotice({ text: t.activateFail, ok: false });
    } finally {
      setActivating('');
    }
  };

  const enc = encodeURIComponent;

  return (
    <div className="rf" lang={isEnglish ? 'en' : 'hi'} style={{ ['--brand' as any]: brand || '#ea580c' }}>
      <style dangerouslySetInnerHTML={{ __html: RF_CSS }} />
      {/* Portal pata chalne tak kuch nahi — warna galat rang/bhasha ki jhalak dikhti */}
      {!ready ? null : (
        <>
          <header className="rf-top">
            <PortalLogo height={50} />
            <Link href={withSite('/')}>{t.home}</Link>
            <b>{t.pageTitle}</b>
          </header>

          {!phone ? (
            <div className="rf-wrap">
              <div className="rf-card rf-login">
                <div style={{ fontSize: '40px' }}>🎁</div>
                <h2 style={{ marginTop: '8px' }}>{t.loginTitle}</h2>
                <p style={{ fontSize: '14px', color: '#57534e', lineHeight: 1.7, margin: '0 0 18px' }}>{t.loginDesc}</p>
                <Link href={`/login?redirect=${enc(withSite('/refer'))}`} className="rf-btn" style={{ display: 'inline-block', textDecoration: 'none' }}>
                  {t.loginBtn}
                </Link>
              </div>
            </div>
          ) : (
            <AdLayout color={brand || undefined}>
            <main className="rf-wrap">
              <section className="rf-hero">
                <span className="rf-hero-badge">🎁 Refer &amp; Earn · {siteName}</span>
                <h1>{t.heroTitle}</h1>
                <p>{t.heroDesc(displayName)}</p>
              </section>

              <section className="rf-stats" aria-label={t.statsAria}>
                <div className="rf-stat">
                  <div className="rf-stat-label">{t.statReferrals}</div>
                  <div className="rf-stat-value" style={{ color: 'var(--brand)' }}>{successCount}</div>
                  <div className="rf-stat-sub">{t.statReferralsSub}</div>
                </div>
                <div className="rf-stat">
                  <div className="rf-stat-label">{t.statMonths}</div>
                  <div className="rf-stat-value" style={{ color: '#16a34a' }}>{monthsEarned}</div>
                  <div className="rf-stat-sub">{t.statMonthsSub}</div>
                </div>
                <div className="rf-stat">
                  <div className="rf-stat-label">{t.statEpaper}</div>
                  <div className="rf-stat-value" style={{ fontSize: epaperTill ? '17px' : '20px', color: epaperTill ? '#16a34a' : '#a8a29e' }}>
                    {epaperTill ? t.activeTill(fmtDate(epaperTill)) : t.notActive}
                  </div>
                  {epaperTill && (
                    <Link href={withSite('/epaper')} style={{ fontSize: '12.5px', color: 'var(--brand)', fontWeight: 700, textDecoration: 'none' }}>
                      {t.readEpaper}
                    </Link>
                  )}
                </div>
              </section>

              {notice && (
                <div
                  className="rf-msg"
                  style={{ background: notice.ok ? '#f0fdf4' : '#fef2f2', color: notice.ok ? '#166534' : '#b91c1c', border: `1px solid ${notice.ok ? '#bbf7d0' : '#fecaca'}` }}
                >
                  {notice.text}
                </div>
              )}

              {pendingIds.length > 0 && (
                <section className="rf-card hl">
                  <h2>{t.pendingTitle(pendingIds.length)}</h2>
                  <div className="rf-list">
                    {pendingIds.map((id) => (
                      <div key={id} className="rf-item">
                        <div className="rf-item-sub" style={{ fontSize: '13.5px', color: '#44403c' }}>
                          {t.pendingLine(maskPhone(id.split('_')[1] || ''))}
                        </div>
                        <button className="rf-btn" disabled={!!activating} onClick={() => handleActivate(id)}>
                          {activating === id ? t.activating : t.activateNow}
                        </button>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              <section className="rf-card">
                <h2>{t.shareTitle}</h2>
                {codeError ? (
                  <div className="rf-msg" style={{ background: '#fef2f2', color: '#b91c1c' }}>{t.codeError}</div>
                ) : (
                  <>
                    <div className="rf-share">
                      <div>
                        <div className="rf-label">{t.yourCode}</div>
                        <div className="rf-code">
                          <span className="rf-code-text">{code || '••••••••'}</span>
                          <button className={`rf-btn ${copied === 'code' ? 'ok' : 'ghost'}`} onClick={() => copy('code')} disabled={!code}>
                            {copied === 'code' ? t.copied : t.copy}
                          </button>
                        </div>
                        <div className="rf-item-sub" style={{ marginTop: '6px' }}>{t.codeHint}</div>
                      </div>
                      <div>
                        <div className="rf-label">{t.yourLink}</div>
                        <div className="rf-link">
                          <input readOnly value={referralLink || t.loadingLink} aria-label={t.linkAria} onFocus={(e) => e.target.select()} />
                          <button className={`rf-btn ${copied === 'link' ? 'ok' : ''}`} onClick={() => copy('link')} disabled={!referralLink}>
                            {copied === 'link' ? t.copied : t.copyLink}
                          </button>
                        </div>
                        <div className="rf-item-sub" style={{ marginTop: '6px' }}>{t.linkHint}</div>
                      </div>
                    </div>

                    {code && (
                      <div className="rf-socials">
                        <a className="rf-social" style={{ background: '#25D366' }} href={`https://api.whatsapp.com/send?text=${enc(shareText)}`} target="_blank" rel="noopener noreferrer">
                          WhatsApp
                        </a>
                        <a className="rf-social" style={{ background: '#1877F2' }} href={`https://www.facebook.com/sharer/sharer.php?u=${enc(referralLink)}`} target="_blank" rel="noopener noreferrer">
                          Facebook
                        </a>
                        <a
                          className="rf-social"
                          style={{ background: '#229ED9' }}
                          href={`https://t.me/share/url?url=${enc(referralLink)}&text=${enc(shareText.replace(referralLink, '').trim())}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Telegram
                        </a>
                        <a className="rf-social" style={{ background: '#000' }} href={`https://twitter.com/intent/tweet?text=${enc(t.tweet(code))}&url=${enc(referralLink)}`} target="_blank" rel="noopener noreferrer">
                          X
                        </a>
                        <a className="rf-social" style={{ background: '#475569' }} href={`sms:?body=${enc(shareText)}`}>
                          SMS
                        </a>
                        <button type="button" className="rf-social" style={{ background: 'var(--brand)' }} onClick={nativeShare}>
                          {t.moreOptions}
                        </button>
                      </div>
                    )}
                  </>
                )}
              </section>

              <section className="rf-card">
                <h2>{t.howTitle}</h2>
                <div className="rf-steps">
                  {t.steps.map(([title, desc], i) => (
                    <div key={title} className="rf-step">
                      <div className="rf-step-num">{i + 1}</div>
                      <b>{title}</b>
                      <span>{desc}</span>
                    </div>
                  ))}
                </div>
              </section>

              <section className="rf-card">
                <h2>{t.historyTitle(entries.length)}</h2>
                {entries.length === 0 ? (
                  <div className="rf-empty">{t.historyEmpty}</div>
                ) : (
                  <div className="rf-list">
                    {entries.map((e) => {
                      const reward = rewardsMap.get(e.id);
                      const status = reward?.status || e.rewardStatus;
                      const till = reward?.validTill || e.validTill;
                      const granted = status === 'granted' || status === 'claimed';
                      const name = e.name || t.defaultName;
                      return (
                        <div key={e.id} className="rf-item">
                          <div className="rf-item-main">
                            <div className="rf-avatar">{name.trim().charAt(0).toUpperCase()}</div>
                            <div style={{ minWidth: 0 }}>
                              <div className="rf-item-name">{name}</div>
                              <div className="rf-item-sub">
                                {maskPhone(e.phone)} · {t.joinedOn(fmtDate(e.joinedAt))}
                              </div>
                            </div>
                          </div>
                          {granted ? (
                            <span className="rf-pill" style={{ background: '#dcfce7', color: '#166534' }}>
                              {t.rewardGranted(till ? fmtDate(till) : '')}
                            </span>
                          ) : status === 'pending_selection' ? (
                            <span className="rf-pill" style={{ background: 'var(--brand-soft)', color: 'var(--brand-deep)' }}>{t.rewardPending}</span>
                          ) : (
                            <span className="rf-pill" style={{ background: '#f5f5f4', color: '#57534e' }}>{t.rewardDone}</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>

              <section className="rf-card">
                <h2>{t.termsTitle}</h2>
                <ul className="rf-terms">
                  {t.terms.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              </section>
            </main>
            </AdLayout>
          )}
        </>
      )}
    </div>
  );
}
