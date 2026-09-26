'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import Footer from '@/components/Footer';

interface EPaperEdition {
  id: string;
  cityName: string;
  editionName: string;
  date: string;
  thumbnailUrl: string;
  pdfUrl: string;
  pages: string[];
  totalPages: number;
}

const DEFAULT_EDITIONS: EPaperEdition[] = [
  {
    id: 'bhopal-ed',
    cityName: 'भोपाल',
    editionName: 'मुख्य संस्करण',
    date: '22-09-2026',
    thumbnailUrl: 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=700',
    pdfUrl: '',
    pages: ['https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=1200'],
    totalPages: 12
  },
  {
    id: 'indore-ed',
    cityName: 'इंदौर',
    editionName: 'इंदौर संस्करण',
    date: '22-09-2026',
    thumbnailUrl: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=700',
    pdfUrl: '',
    pages: ['https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=1200'],
    totalPages: 14
  }
];

const EPAPER_PLANS = [
  { id: 'epaper_1_month', name: '1 महीना प्लान (1 Month)', price: 21, durationDays: 30, desc: '₹21 में 30 दिनों का ई-पेपर ऐक्सेस' },
  { id: 'epaper_1_year', name: '1 साल का वार्षिक प्लान (1 Year)', price: 132, durationDays: 365, desc: '₹132 (मात्र ₹11/माह) में 365 दिनों का ऐक्सेस' }
];

const RAZORPAY_KEY = 'rzp_test_TZSA6UoKATong0';

/* ------------------------------------------------------------------ */
/*  Styles (sirf design — koi logic nahi)                              */
/* ------------------------------------------------------------------ */
const EP_STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Mukta:wght@400;500;600;700;800&family=Noto+Serif+Devanagari:wght@600;700;800&display=swap');

.ep-root{
  --brand:#ea580c; --ink:#14110f; --paper:#faf7f2; --line:#e7e1d8; --muted:#6b645c;
  min-height:100vh; background:var(--paper); color:var(--ink);
  font-family:'Mukta',system-ui,-apple-system,sans-serif; -webkit-font-smoothing:antialiased;
}
.ep-root *{box-sizing:border-box}
.ep-serif{font-family:'Noto Serif Devanagari',Georgia,serif}

/* Buttons */
.ep-btn{border:0;cursor:pointer;font-family:inherit;font-weight:700;transition:transform .15s ease,box-shadow .2s ease,background .2s ease,opacity .2s ease}
.ep-btn:active:not(:disabled){transform:scale(.97)}
.ep-btn:focus-visible,.ep-chip:focus-visible,.ep-plan:focus-visible,.ep-cover:focus-visible{outline:3px solid var(--brand);outline-offset:2px}

/* Header */
.ep-topbar{height:4px;background:var(--brand)}
.ep-header{position:sticky;top:0;z-index:50;background:rgba(250,247,242,.92);backdrop-filter:saturate(1.4) blur(12px);-webkit-backdrop-filter:saturate(1.4) blur(12px);border-bottom:1px solid var(--line)}
.ep-header-in{max-width:1200px;margin:0 auto;padding:10px 16px;display:flex;align-items:center;justify-content:space-between;gap:12px}
.ep-brand{display:flex;align-items:center;gap:11px;min-width:0}
.ep-logo{width:44px;height:44px;border-radius:12px;object-fit:cover;border:1px solid var(--line);background:#fff;flex-shrink:0}
.ep-title{font-weight:800;font-size:19px;line-height:1.2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin:0}
.ep-sub{font-size:12px;color:var(--muted);display:flex;align-items:center;gap:6px}
.ep-live{width:7px;height:7px;border-radius:50%;background:#16a34a;box-shadow:0 0 0 3px rgba(22,163,74,.18)}
.ep-actions{display:flex;align-items:center;gap:6px;flex-shrink:0}
.ep-cta{background:var(--brand);color:#fff;padding:10px 16px;font-size:13.5px;border-radius:999px;box-shadow:0 8px 20px -10px var(--brand)}
.ep-cta:hover{box-shadow:0 10px 24px -8px var(--brand)}
.ep-vip{display:inline-flex;align-items:center;gap:6px;background:#ecfdf3;color:#067647;border:1px solid #abefc6;padding:7px 13px;border-radius:999px;font-size:12.5px;font-weight:700;white-space:nowrap}
.ep-home{font-size:13.5px;color:var(--muted);text-decoration:none;font-weight:600;padding:9px 10px;border-radius:10px;white-space:nowrap}
.ep-home:hover{color:var(--ink);background:#f0ebe3}

/* Main */
.ep-main{max-width:1200px;margin:0 auto;padding:22px 16px 56px}

/* Hero */
.ep-hero{position:relative;overflow:hidden;background:var(--ink);color:#fff;border-radius:22px;padding:32px;display:grid;grid-template-columns:1.35fr 1fr;gap:28px;align-items:center;margin-bottom:32px}
.ep-hero::before{content:'';position:absolute;width:420px;height:420px;right:-140px;top:-180px;border-radius:50%;background:radial-gradient(circle,var(--brand) 0%,transparent 65%);opacity:.35;pointer-events:none}
.ep-hero > *{position:relative}
.ep-kicker{display:inline-flex;align-items:center;gap:6px;font-size:11.5px;font-weight:700;letter-spacing:.08em;color:#fff;background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.15);padding:5px 12px;border-radius:999px;margin-bottom:14px}
.ep-hero h2{font-size:30px;line-height:1.35;margin:0 0 10px;font-weight:800}
.ep-hero p{margin:0 0 22px;color:#d6cfc6;font-size:15.5px;line-height:1.6}
.ep-hero-cta{background:var(--brand);color:#fff;padding:13px 24px;font-size:15px;border-radius:12px}
.ep-hero-cta:hover{filter:brightness(1.08)}
.ep-hero-plans{display:grid;gap:12px}
.ep-mini{background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.14);border-radius:16px;padding:16px 18px;display:flex;justify-content:space-between;align-items:center;gap:12px}
.ep-mini-name{font-weight:700;font-size:14.5px}
.ep-mini-desc{font-size:12.5px;color:#b8b0a6;margin-top:2px}
.ep-mini-price{font-size:26px;font-weight:800;color:#fff;white-space:nowrap}

/* Section */
.ep-sec{display:flex;align-items:flex-end;justify-content:space-between;gap:12px;border-bottom:2px solid var(--ink);padding-bottom:10px;margin-bottom:14px}
.ep-sec h3{font-size:24px;margin:0;font-weight:800;line-height:1.3}
.ep-count{font-size:13px;color:var(--muted);white-space:nowrap}

/* City chips */
.ep-chips{display:flex;gap:8px;overflow-x:auto;padding:4px 2px 16px;margin:0 -2px 8px;scrollbar-width:none;-webkit-overflow-scrolling:touch}
.ep-chips::-webkit-scrollbar{display:none}
.ep-chip{flex-shrink:0;padding:8px 18px;border-radius:999px;border:1px solid var(--line);background:#fff;color:#4a443e;font-size:14px;font-weight:600;cursor:pointer;font-family:inherit;transition:all .2s ease}
.ep-chip:hover{border-color:#cfc6ba}
.ep-chip.on{background:var(--brand);border-color:var(--brand);color:#fff;box-shadow:0 6px 16px -8px var(--brand)}

/* Grid + Cards */
.ep-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:24px}
.ep-card{display:flex;flex-direction:column;background:#fff;border:1px solid var(--line);border-radius:18px;padding:12px;transition:transform .25s ease,box-shadow .25s ease}
.ep-card:hover{transform:translateY(-4px);box-shadow:0 22px 44px -24px rgba(20,17,15,.4)}
.ep-card-head{display:flex;align-items:baseline;justify-content:space-between;gap:8px;padding:2px 4px 10px}
.ep-city{font-weight:800;font-size:17px;line-height:1.3}
.ep-edname{font-size:12px;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:55%}
.ep-cover{position:relative;aspect-ratio:3/4;border-radius:10px;overflow:hidden;background:#efe9e0;cursor:pointer;border:1px solid var(--line);box-shadow:5px 5px 0 -1px #fff,5px 5px 0 0 var(--line),10px 10px 0 -1px #fff,10px 10px 0 0 var(--line);margin-right:10px;margin-bottom:10px}
.ep-cover img{width:100%;height:100%;object-fit:cover;display:block;transition:transform .5s ease}
.ep-card:hover .ep-cover img{transform:scale(1.04)}
.ep-lock{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;background:linear-gradient(180deg,rgba(20,17,15,.1) 0%,rgba(20,17,15,.78) 100%);color:#fff;text-align:center;padding:12px}
.ep-lock-ic{width:48px;height:48px;border-radius:50%;background:rgba(255,255,255,.16);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);display:grid;place-items:center;font-size:20px;border:1px solid rgba(255,255,255,.3)}
.ep-lock-t{font-size:13px;font-weight:700}
.ep-meta{display:flex;align-items:center;justify-content:space-between;gap:6px;font-size:12.5px;color:var(--muted);padding:6px 4px 0}
.ep-meta b{color:var(--ink);font-weight:600}
.ep-read{margin-top:12px;width:100%;padding:12px;border-radius:12px;font-size:14.5px;color:#fff}
.ep-read.dark{background:var(--ink)}
.ep-read.dark:hover{background:#2a2522}
.ep-read.brand{background:var(--brand)}
.ep-read.brand:hover{filter:brightness(1.07)}

.ep-empty{text-align:center;padding:56px 16px;border:1.5px dashed var(--line);border-radius:18px;color:var(--muted);background:#fff}
.ep-empty-ic{font-size:34px;margin-bottom:8px}

.ep-foot{text-align:center;color:var(--muted);font-size:12.5px;padding:24px 16px 32px;border-top:1px solid var(--line)}

/* Reader */
.ep-reader{position:fixed;inset:0;z-index:1000;background:#0d0b0a;display:flex;flex-direction:column;animation:epFade .2s ease}
.ep-rbar{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:10px 14px;padding-top:calc(10px + env(safe-area-inset-top));background:#171412;color:#fff;border-bottom:1px solid #2a2522}
.ep-rtitle{min-width:0}
.ep-rtitle strong{display:block;font-size:15px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ep-rtitle small{display:block;color:#a39a90;font-size:12px}
.ep-close{background:#ef4444;color:#fff;padding:9px 16px;font-size:13.5px;border-radius:10px;flex-shrink:0}
.ep-close:hover{background:#dc2626}
.ep-rstage{flex:1;overflow:auto;display:flex;justify-content:center;align-items:flex-start;padding:18px 12px}
.ep-rstage img{width:100%;max-width:920px;height:auto;background:#fff;border-radius:4px;box-shadow:0 24px 70px rgba(0,0,0,.55)}
.ep-rnav{display:flex;align-items:center;justify-content:center;gap:12px;padding:12px 16px;padding-bottom:calc(12px + env(safe-area-inset-bottom));background:#171412;border-top:1px solid #2a2522}
.ep-nav{background:#2a2522;color:#fff;padding:11px 22px;border-radius:12px;font-size:14.5px;min-width:104px}
.ep-nav:hover:not(:disabled){background:#3a332f}
.ep-nav:disabled{opacity:.35;cursor:not-allowed}
.ep-pageno{color:#fff;font-weight:700;font-size:15px;min-width:72px;text-align:center;font-variant-numeric:tabular-nums}
.ep-pageno span{color:#a39a90;font-weight:500}

/* Paywall */
.ep-overlay{position:fixed;inset:0;background:rgba(13,11,10,.62);backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px);z-index:1000;display:flex;align-items:center;justify-content:center;padding:16px;animation:epFade .2s ease}
.ep-sheet{background:#fff;border-radius:22px;max-width:450px;width:100%;padding:26px;max-height:92vh;overflow:auto;animation:epUp .28s cubic-bezier(.2,.8,.2,1);box-shadow:0 30px 80px -20px rgba(0,0,0,.45)}
.ep-grab{display:none;width:44px;height:5px;border-radius:999px;background:#e2dcd3;margin:-6px auto 14px}
.ep-sheet-head{display:flex;justify-content:space-between;align-items:flex-start;gap:12px}
.ep-sheet h3{font-size:21px;margin:0;font-weight:800;line-height:1.35}
.ep-x{background:#f3efe9;width:36px;height:36px;border-radius:50%;font-size:14px;color:#4a443e;flex-shrink:0;display:grid;place-items:center}
.ep-x:hover{background:#e9e3da}
.ep-sheet-sub{color:var(--muted);font-size:14px;margin:6px 0 22px;line-height:1.5}
.ep-plans{display:grid;gap:14px}
.ep-plan{position:relative;display:flex;align-items:center;gap:14px;border:2px solid var(--line);border-radius:16px;padding:16px;cursor:pointer;background:#fff;transition:border-color .2s ease,background .2s ease}
.ep-plan:hover{border-color:#d6cdc1}
.ep-plan.on{border-color:var(--brand);background:color-mix(in srgb,var(--brand) 6%,#fff)}
.ep-radio{width:22px;height:22px;border-radius:50%;border:2px solid #cfc8bf;flex-shrink:0;display:grid;place-items:center;transition:border-color .2s}
.ep-plan.on .ep-radio{border-color:var(--brand)}
.ep-plan.on .ep-radio::after{content:'';width:11px;height:11px;border-radius:50%;background:var(--brand)}
.ep-plan-body{min-width:0;flex:1}
.ep-plan-name{font-weight:700;font-size:15px;line-height:1.35}
.ep-plan-desc{font-size:12.5px;color:var(--muted);margin-top:3px;line-height:1.45}
.ep-plan-price{font-weight:800;font-size:24px;color:var(--brand);white-space:nowrap}
.ep-badge{position:absolute;top:-11px;right:16px;background:var(--ink);color:#fff;font-size:11px;font-weight:700;padding:3px 11px;border-radius:999px}
.ep-pay{width:100%;margin-top:22px;background:var(--brand);color:#fff;padding:15px;border-radius:14px;font-size:16px;box-shadow:0 12px 24px -12px var(--brand)}
.ep-pay:hover:not(:disabled){filter:brightness(1.06)}
.ep-pay:disabled{opacity:.7;cursor:not-allowed}
.ep-secure{text-align:center;font-size:12.5px;color:var(--muted);margin-top:12px}

@keyframes epFade{from{opacity:0}to{opacity:1}}
@keyframes epUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}

/* Tablet */
@media (max-width:860px){
  .ep-hero{grid-template-columns:1fr;padding:26px;gap:22px}
  .ep-hero h2{font-size:25px}
}

/* Mobile */
@media (max-width:640px){
  .ep-hide-sm{display:none !important}
  .ep-header-in{padding:9px 12px}
  .ep-logo{width:38px;height:38px;border-radius:10px}
  .ep-title{font-size:16px}
  .ep-sub{font-size:11px}
  .ep-cta{padding:9px 13px;font-size:12.5px}
  .ep-vip{padding:6px 10px;font-size:11.5px}
  .ep-home{padding:8px;font-size:16px}
  .ep-main{padding:16px 12px 40px}
  .ep-hero{padding:22px 18px;border-radius:18px;margin-bottom:26px}
  .ep-hero h2{font-size:21px}
  .ep-hero p{font-size:14px;margin-bottom:18px}
  .ep-hero-cta{width:100%;padding:14px}
  .ep-mini{padding:13px 14px}
  .ep-mini-price{font-size:22px}
  .ep-sec h3{font-size:20px}
  .ep-chip{padding:7px 15px;font-size:13.5px}
  .ep-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
  .ep-card{padding:8px;border-radius:14px}
  .ep-card:hover{transform:none}
  .ep-card-head{padding:2px 2px 8px}
  .ep-city{font-size:14.5px}
  .ep-edname{display:none}
  .ep-cover{box-shadow:3px 3px 0 -1px #fff,3px 3px 0 0 var(--line);margin-right:4px;margin-bottom:4px;border-radius:8px}
  .ep-lock-ic{width:40px;height:40px;font-size:17px}
  .ep-lock-t{font-size:11.5px}
  .ep-meta{font-size:11px;padding:6px 2px 0}
  .ep-read{padding:10px 6px;font-size:13px;border-radius:10px;margin-top:10px}
  .ep-rbar{padding:8px 10px;padding-top:calc(8px + env(safe-area-inset-top))}
  .ep-rstage{padding:10px 6px}
  .ep-nav{min-width:0;flex:1;padding:12px 10px}
  .ep-overlay{align-items:flex-end;padding:0}
  .ep-sheet{max-width:100%;border-radius:22px 22px 0 0;padding:18px 18px calc(20px + env(safe-area-inset-bottom))}
  .ep-grab{display:block}
  .ep-sheet h3{font-size:19px}
  .ep-plan{padding:14px;gap:12px}
  .ep-plan-price{font-size:21px}
}
`;

function EPaperComponent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Dynamic Site Slug from URL
  const siteSlug = (searchParams.get('site') || 'the-local-leader').toLowerCase();

  const [editions, setEditions] = useState(DEFAULT_EDITIONS);
  const [selectedCity, setSelectedCity] = useState('सभी');
  const [themeColor, setThemeColor] = useState('#ea580c');
  const [siteName, setSiteName] = useState('द लोकल लीडर');
  const [siteLogo, setSiteLogo] = useState(`/logos/${siteSlug}.jpeg`);
  const [readingEdition, setReadingEdition] = useState<EPaperEdition | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [currentUser, setCurrentUser] = useState<{ email: string; name?: string } | null>(null);
  const [hasSubscribed, setHasSubscribed] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(EPAPER_PLANS[0]);
  const [showPayModal, setShowPayModal] = useState(false);
  const [processing, setProcessing] = useState(false);

  // 1. Dynamic Site Fetching from Firestore
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'sites', siteSlug), (snap) => {
      if (snap.exists()) {
        const d = snap.data();
        if (d.primaryColor) setThemeColor(d.primaryColor);
        if (d.name) setSiteName(d.name);
        if (d.logoUrl) setSiteLogo(d.logoUrl);
      } else {
        if (siteSlug === 'the-local-leader') {
          setSiteName('द लोकल लीडर');
        } else {
          setSiteName(siteSlug.replace(/-/g, ' ').toUpperCase());
        }
        setSiteLogo(`/logos/${siteSlug}.jpeg`);
      }
    });
    return () => unsub();
  }, [siteSlug]);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
    return () => {
      if (document.body.contains(script)) document.body.removeChild(script);
    };
  }, []);

  useEffect(() => {
    const cached = localStorage.getItem('reader_user');
    if (cached) {
      try {
        const u = JSON.parse(cached);
        setCurrentUser(u);
        getDoc(doc(db, 'epaper_subscriptions', u.email))
          .then((snap) => {
            if (snap.exists() && snap.data().status === 'active') {
              const exp = snap.data().expiresAt?.toDate
                ? snap.data().expiresAt.toDate()
                : new Date(snap.data().expiresAt);
              if (new Date() < exp) setHasSubscribed(true);
            }
          })
          .catch(console.error);
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(
      query(collection(db, 'epaper')),
      (snapshot) => {
        if (!snapshot.empty) {
          const list: EPaperEdition[] = [];
          snapshot.docs.forEach((docSnap) => {
            const d = docSnap.data();
            const targetSite = String(d.siteId || 'the-local-leader').toLowerCase();
            if (targetSite === siteSlug || targetSite === 'all') {
              list.push({
                id: docSnap.id,
                cityName: d.cityName || d.city || 'मुख्य',
                editionName: d.editionName || d.title || `${siteName} ई-पेपर`,
                date: d.date || '22-09-2026',
                thumbnailUrl: d.thumbnailUrl || d.coverImage || 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=700',
                pdfUrl: d.pdfUrl || '',
                pages:
                  Array.isArray(d.pages) && d.pages.length > 0
                    ? d.pages
                    : [d.thumbnailUrl || 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=1200'],
                totalPages: Number(d.totalPages || d.pages?.length || 10)
              });
            }
          });
          if (list.length > 0) setEditions(list);
        }
      },
      console.error
    );
    return () => unsub();
  }, [siteSlug, siteName]);

  const filteredEditions = editions.filter(
    (ed) => selectedCity === 'सभी' || ed.cityName.includes(selectedCity)
  );

  const handleOpenSubscribe = () => {
    if (!currentUser) {
      alert('ई-पेपर सब्सक्रिप्शन लेने के लिए कृपया पहले लॉगिन करें!');
      router.push(`/login?redirect=${encodeURIComponent(`/epaper?site=${siteSlug}`)}`);
      return;
    }
    setShowPayModal(true);
  };

  const handleOpenReader = (ed: EPaperEdition) => {
    if (!hasSubscribed) {
      handleOpenSubscribe();
      return;
    }
    setReadingEdition(ed);
    setCurrentPage(0);
  };

  const handlePayment = () => {
    if (!currentUser?.email) {
      router.push(`/login?redirect=${encodeURIComponent(`/epaper?site=${siteSlug}`)}`);
      return;
    }
    if (!(window as any).Razorpay) {
      alert('Razorpay लोड हो रहा है, कृपया 2 सेकंड बाद पुनः प्रयास करें।');
      return;
    }

    setProcessing(true);
    const rzp = new (window as any).Razorpay({
      key: RAZORPAY_KEY,
      amount: selectedPlan.price * 100,
      currency: 'INR',
      name: `${siteName} ई-पेपर`,
      description: selectedPlan.name,
      image: siteLogo,
      handler: async function (response: any) {
        try {
          const expiresAt = new Date(Date.now() + selectedPlan.durationDays * 24 * 60 * 60 * 1000);
          await setDoc(
            doc(db, 'epaper_subscriptions', currentUser.email),
            {
              userEmail: currentUser.email,
              userName: currentUser.name || 'Reader',
              planId: selectedPlan.id,
              planName: selectedPlan.name,
              amount: selectedPlan.price,
              paymentId: response.razorpay_payment_id || 'test_id',
              status: 'active',
              startedAt: serverTimestamp(),
              expiresAt,
              siteId: siteSlug
            },
            { merge: true }
          );

          alert(`🎉 भुगतान सफल! ${selectedPlan.name} सक्रिय हो गया है।`);
          setHasSubscribed(true);
          setShowPayModal(false);
        } catch (err: any) {
          alert('त्रुटि: ' + err.message);
        } finally {
          setProcessing(false);
        }
      },
      prefill: { name: currentUser.name || '', email: currentUser.email || '' },
      theme: { color: themeColor },
      modal: { ondismiss: () => setProcessing(false) }
    });
    rzp.open();
  };

  return (
    <div className="ep-root" style={{ ['--brand' as any]: themeColor }}>
      <style dangerouslySetInnerHTML={{ __html: EP_STYLES }} />

      {/* Header */}
      <div className="ep-topbar" />
      <header className="ep-header">
        <div className="ep-header-in">
          <div className="ep-brand">
            {siteLogo && <img src={siteLogo} alt={siteName} className="ep-logo" />}
            <div style={{ minWidth: 0 }}>
              <h1 className="ep-title ep-serif">{siteName} ई-पेपर</h1>
              <div className="ep-sub">
                <span className="ep-live" />
                दैनिक डिजिटल संस्करण
              </div>
            </div>
          </div>

          <div className="ep-actions">
            {hasSubscribed ? (
              <span className="ep-vip">✓ VIP एक्टिव</span>
            ) : (
              <button className="ep-btn ep-cta" onClick={handleOpenSubscribe}>
                ⭐ प्लान चुनें<span className="ep-hide-sm"> (₹21 से शुरू)</span>
              </button>
            )}
            <Link href="/" className="ep-home" aria-label="मुख्य वेबसाइट">
              ←<span className="ep-hide-sm"> मुख्य वेबसाइट</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="ep-main">
        {/* Banner */}
        {!hasSubscribed && (
          <section className="ep-hero">
            <div>
              <span className="ep-kicker">📰 डिजिटल सदस्यता</span>
              <h2 className="ep-serif">दैनिक डिजिटल ई-पेपर संपूर्ण ऐक्सेस</h2>
              <p>₹21 (1 माह) या ₹132 (1 वर्ष - ₹11/माह) में सभी संस्करण अनलॉक करें।</p>
              <button className="ep-btn ep-hero-cta" onClick={handleOpenSubscribe}>
                सब्सक्रिप्शन लें →
              </button>
            </div>
            <div className="ep-hero-plans">
              {EPAPER_PLANS.map((plan) => (
                <div key={plan.id} className="ep-mini">
                  <div style={{ minWidth: 0 }}>
                    <div className="ep-mini-name">{plan.name}</div>
                    <div className="ep-mini-desc">{plan.desc}</div>
                  </div>
                  <div className="ep-mini-price ep-serif">₹{plan.price}</div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Section heading */}
        <div className="ep-sec">
          <h3 className="ep-serif">आज के संस्करण</h3>
          <span className="ep-count">{filteredEditions.length} संस्करण</span>
        </div>

        {/* City Filter */}
        <div className="ep-chips" role="tablist">
          {['सभी', 'भोपाल', 'इंदौर', 'उज्जैन', 'देवास'].map((city) => (
            <button
              key={city}
              role="tab"
              aria-selected={selectedCity === city}
              className={`ep-chip${selectedCity === city ? ' on' : ''}`}
              onClick={() => setSelectedCity(city)}
            >
              {city}
            </button>
          ))}
        </div>

        {/* Editions Grid */}
        {filteredEditions.length === 0 ? (
          <div className="ep-empty">
            <div className="ep-empty-ic">🗞️</div>
            इस शहर का संस्करण अभी उपलब्ध नहीं है।
          </div>
        ) : (
          <div className="ep-grid">
            {filteredEditions.map((edition) => (
              <article key={edition.id} className="ep-card">
                <div className="ep-card-head">
                  <span className="ep-city ep-serif">{edition.cityName}</span>
                  <span className="ep-edname">{edition.editionName}</span>
                </div>

                <div
                  className="ep-cover"
                  role="button"
                  tabIndex={0}
                  onClick={() => handleOpenReader(edition)}
                  onKeyDown={(e) => e.key === 'Enter' && handleOpenReader(edition)}
                >
                  <img src={edition.thumbnailUrl} alt={edition.editionName} loading="lazy" />
                  {!hasSubscribed && (
                    <div className="ep-lock">
                      <div className="ep-lock-ic">🔒</div>
                      <span className="ep-lock-t">सब्सक्रिप्शन आवश्यक</span>
                    </div>
                  )}
                </div>

                <div className="ep-meta">
                  <b>{edition.date}</b>
                  <span>{edition.totalPages} पृष्ठ</span>
                </div>

                <button
                  className={`ep-btn ep-read ${hasSubscribed ? 'brand' : 'dark'}`}
                  onClick={() => handleOpenReader(edition)}
                >
                  {hasSubscribed ? 'ई-पेपर पढ़ें' : '🔒 अनलॉक करें'}
                </button>
              </article>
            ))}
          </div>
        )}
      </main>

      <Footer
        siteName={siteName || 'द लोकल लीडर'}
        primaryColor={themeColor}
        logoUrl={siteLogo || `/logos/${siteSlug}.jpeg`}
        tagline="— जनता की आवाज़, सच्चाई के साथ —"
        currentSlug={siteSlug}
      />

      {/* Reader Modal */}
      {readingEdition && (
        <div className="ep-reader" role="dialog" aria-modal="true">
          <div className="ep-rbar">
            <div className="ep-rtitle">
              <strong className="ep-serif">
                {siteName} ({readingEdition.cityName})
              </strong>
              <small>{readingEdition.date}</small>
            </div>
            <button className="ep-btn ep-close" onClick={() => setReadingEdition(null)}>
              बंद करें
            </button>
          </div>

          <div className="ep-rstage">
            <img
              src={readingEdition.pages[currentPage]}
              alt={`पृष्ठ ${currentPage + 1}`}
            />
          </div>

          <div className="ep-rnav">
            <button
              className="ep-btn ep-nav"
              disabled={currentPage === 0}
              onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
            >
              ← पिछला
            </button>
            <div className="ep-pageno">
              {currentPage + 1} <span>/ {readingEdition.pages.length}</span>
            </div>
            <button
              className="ep-btn ep-nav"
              disabled={currentPage >= readingEdition.pages.length - 1}
              onClick={() => setCurrentPage((p) => Math.min(readingEdition.pages.length - 1, p + 1))}
            >
              अगला →
            </button>
          </div>
        </div>
      )}

      {/* Paywall Modal */}
      {showPayModal && (
        <div className="ep-overlay" onClick={() => !processing && setShowPayModal(false)}>
          <div
            className="ep-sheet"
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="ep-grab" />
            <div className="ep-sheet-head">
              <h3 className="ep-serif">{siteName} ई-पेपर प्लान चुनें</h3>
              <button
                className="ep-btn ep-x"
                aria-label="बंद करें"
                onClick={() => setShowPayModal(false)}
              >
                ✕
              </button>
            </div>
            <p className="ep-sheet-sub">सभी शहरों के संस्करण, हर सुबह आपके फ़ोन पर।</p>

            <div className="ep-plans" role="radiogroup">
              {EPAPER_PLANS.map((plan) => (
                <div
                  key={plan.id}
                  role="radio"
                  tabIndex={0}
                  aria-checked={selectedPlan.id === plan.id}
                  className={`ep-plan${selectedPlan.id === plan.id ? ' on' : ''}`}
                  onClick={() => setSelectedPlan(plan)}
                  onKeyDown={(e) => e.key === 'Enter' && setSelectedPlan(plan)}
                >
                  {plan.id === 'epaper_1_year' && <span className="ep-badge">सबसे किफ़ायती</span>}
                  <span className="ep-radio" />
                  <div className="ep-plan-body">
                    <div className="ep-plan-name">{plan.name}</div>
                    <div className="ep-plan-desc">{plan.desc}</div>
                  </div>
                  <div className="ep-plan-price ep-serif">₹{plan.price}</div>
                </div>
              ))}
            </div>

            <button className="ep-btn ep-pay" onClick={handlePayment} disabled={processing}>
              {processing ? 'प्रक्रिया जारी है...' : `₹${selectedPlan.price} का भुगतान करें`}
            </button>
            <div className="ep-secure">🔐 Razorpay द्वारा सुरक्षित भुगतान</div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function EPaperPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#faf7f2',
            color: '#6b645c',
            fontFamily: 'system-ui, sans-serif',
            fontSize: '15px'
          }}
        >
          ई-पेपर लोड हो रहा है...
        </div>
      }
    >
      <EPaperComponent />
    </Suspense>
  );
}