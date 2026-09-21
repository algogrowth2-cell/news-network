'use client';
import { useEffect, useState } from 'react';
import { collection, query, where, getDocs, doc, onSnapshot, updateDoc, increment } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Footer from '@/components/Footer';
import SiteSwitcher from '@/components/SiteSwitcher';
import LanguageTranslator from '@/components/LanguageTranslator';

interface ArticleItem {
  id: string;
  title: string;
  titleHi?: string;
  summary?: string;
  image?: string;
  category?: string;
  createdAt?: string;
  views?: number;
  siteId?: string;
  slug?: string;
  status?: string;
}

interface AdItem {
  id: string;
  name: string;
  zone: string;
  imageUrl: string;
  targetUrl?: string;
  status: string;
}

interface MarketRates {
  diesel: string;
  petrol: string;
  nifty: string;
  niftyChange: string;
  niftyPositive: boolean;
  sensex: string;
  sensexChange: string;
  sensexPositive: boolean;
  gold: string;
  silver: string;
}

const DEFAULT_RASHI_LIST = [
  { id: 'aries', name: 'मेष', sign: '♈' },
  { id: 'taurus', name: 'वृषभ', sign: '♉' },
  { id: 'gemini', name: 'मिथुन', sign: '♊' },
  { id: 'cancer', name: 'कर्क', sign: '♋' },
  { id: 'leo', name: 'सिंह', sign: '♌' },
  { id: 'virgo', name: 'कन्या', sign: '♍' },
  { id: 'libra', name: 'तुला', sign: '♎' },
  { id: 'scorpio', name: 'वृश्चिक', sign: '♏' },
  { id: 'sagittarius', name: 'धनु', sign: '♐' },
  { id: 'capricorn', name: 'मकर', sign: '♑' },
  { id: 'aquarius', name: 'कुंभ', sign: '♒' },
  { id: 'pisces', name: 'मीन', sign: '♓' }
];

const TRENDING_TAGS = ["बजट सत्र", "पंचायत चुनाव", "बारिश का मौसम", "मंडी भाव", "भर्ती परिणाम", "बिजली दर", "क्रिकेट लीग"];

const CATEGORY_LIST: { key: string; icon: string }[] = [
  { key: 'होम', icon: '🏠' },
  { key: 'राजनीति', icon: '🏛️' },
  { key: 'व्यापार', icon: '📈' },
  { key: 'स्वास्थ्य', icon: '🩺' },
  { key: 'जीवनशैली', icon: '🌿' },
  { key: 'राज्य', icon: '🇮🇳' },
  { key: 'शोक संदेश', icon: '🕯️' },
  { key: 'ई-पेपर', icon: '📄' },
  { key: 'अपराध', icon: '🚨' },
  { key: 'खेल', icon: '🏏' },
];

export default function HomePage() {
  const router = useRouter();
  const [currentSlug, setCurrentSlug] = useState('the-local-leader');
  const [siteConfig, setSiteConfig] = useState<any>(null);
  const [articles, setArticles] = useState<ArticleItem[]>([]);
  const [headerAd, setHeaderAd] = useState<AdItem | null>(null);
  const [sidebarAd, setSidebarAd] = useState<AdItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('होम');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTrendTag, setActiveTrendTag] = useState('');
  const [readerUser, setReaderUser] = useState<any>(null);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [currentHindiDate, setCurrentHindiDate] = useState('');

  const [marketRates, setMarketRates] = useState<MarketRates>({
    diesel: '₹95.20',
    petrol: '₹102.12',
    nifty: '23,897.7 points',
    niftyChange: '-16.70',
    niftyPositive: false,
    sensex: '76,642.81 points',
    sensexChange: '+72.41',
    sensexPositive: true,
    silver: '₹2,50,000',
    gold: '₹1,56,810'
  });

  const [rashifalData, setRashifalData] = useState<Record<string, any>>({});
  const [selectedRashi, setSelectedRashi] = useState('aries');

  /* ─── Ad click handler ─── */
  const handleAdClick = async (ad: AdItem) => {
    if (!ad?.id) return;
    try {
      await updateDoc(doc(db, 'ads', ad.id), { clicks: increment(1) });
    } catch {
      try {
        await updateDoc(doc(db, 'advertisements', ad.id), { clicks: increment(1) });
      } catch (err) {
        console.error('Click error:', err);
      }
    }
  };

  const handleCategoryClick = (cat: string) => {
    if (cat === 'ई-पेपर') {
      router.push(`/epaper?site=${currentSlug}`);
      return;
    }
    if (cat === 'शोक संदेश') {
      router.push(`/shok-sandesh?site=${currentSlug}`);
      return;
    }
    if (cat === 'सर्च') {
      setSearchModalOpen(true);
      return;
    }
    setActiveCategory(cat);
    setActiveTrendTag('');
    setSearchTerm('');
    setDrawerOpen(false);
  };

  const handleTrendTagClick = (tag: string) => {
    if (activeTrendTag === tag) {
      setActiveTrendTag('');
      setSearchTerm('');
    } else {
      setActiveTrendTag(tag);
      setSearchTerm(tag);
    }
  };

  /* ─── Hindi date ─── */
  useEffect(() => {
    const updateDate = () => {
      const days = ['रविवार', 'सोमवार', 'मंगलवार', 'बुधवार', 'गुरुवार', 'शुक्रवार', 'शनिवार'];
      const months = [
        'जनवरी', 'फरवरी', 'मार्च', 'अप्रैल', 'मई', 'जून',
        'जुलाई', 'अगस्त', 'सितंबर', 'अक्टूबर', 'नवंबर', 'दिसंबर'
      ];
      const now = new Date();
      setCurrentHindiDate(`${days[now.getDay()]}, ${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`);
    };
    updateDate();
    const interval = setInterval(updateDate, 60000);
    return () => clearInterval(interval);
  }, []);

  /* ─── Market rates live ─── */
  useEffect(() => {
    const unsubMarket = onSnapshot(doc(db, 'settings', 'market'), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setMarketRates({
          diesel: data.diesel || '₹95.20',
          petrol: data.petrol || '₹102.12',
          nifty: data.nifty || '23,897.7 points',
          niftyChange: data.niftyChange || '-16.70',
          niftyPositive: data.niftyPositive ?? false,
          sensex: data.sensex || '76,642.81 points',
          sensexChange: data.senseChange || '+72.41',
          sensexPositive: data.sensexPositive ?? true,
          silver: data.silver || '₹2,50,000',
          gold: data.gold || '₹1,56,810'
        });
      }
    });
    return () => unsubMarket();
  }, []);

  /* ─── Reader user from localStorage ─── */
  useEffect(() => {
    const cached = localStorage.getItem('reader_user');
    if (cached) {
      try { setReaderUser(JSON.parse(cached)); } catch (e) { console.error(e); }
    }
  }, []);

  const handleReaderLogout = () => {
    localStorage.removeItem('reader_user');
    setReaderUser(null);
  };

  /* ─── Site config + articles + ads + rashifal ─── */
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const activeSiteSlug = urlParams.get('site') || 'the-local-leader';
    setCurrentSlug(activeSiteSlug);

    const unsubSite = onSnapshot(doc(db, 'sites', activeSiteSlug), (snap) => {
      if (snap.exists()) {
        setSiteConfig({ slug: activeSiteSlug, ...snap.data() });
      } else {
        setSiteConfig({
          slug: activeSiteSlug,
          name: 'The Local Leader',
          primaryColor: '#ea580c',
          secondaryColor: '#1e242b',
          headerBg: '#ffffff',
          logoUrl: `/logos/${activeSiteSlug}.jpeg`,
          description: '— जनता की आवाज़, सच्चाई के साथ —'
        });
      }
    });

    async function loadData() {
      setLoading(true);
      try {
        const qArt = query(
          collection(db, 'articles'),
          where('siteId', 'in', [activeSiteSlug, activeSiteSlug.toLowerCase()])
        );
        const artSnap = await getDocs(qArt);

        const approvedArticles = artSnap.docs
          .map(d => ({ id: d.id, ...d.data() } as ArticleItem))
          .filter(art => {
            const rawStatus = String(art.status || '').trim().toLowerCase();
            return rawStatus === 'published' || rawStatus === 'approved';
          });

        setArticles(approvedArticles);

        const qAds = query(collection(db, 'ads'));
        const adSnap = await getDocs(qAds);
        setHeaderAd(null);
        setSidebarAd(null);

        adSnap.docs.forEach(docSnap => {
          const rawData = docSnap.data();
          const adStatus = String(rawData.status || '').trim().toLowerCase();

          if (adStatus === 'active') {
            const cleanAd: AdItem = {
              id: docSnap.id,
              name: rawData.name || '',
              zone: rawData.zone || '',
              imageUrl: rawData.imageUrl || '',
              targetUrl: rawData.targetUrl || '',
              status: adStatus
            };

            const adRef = doc(db, 'ads', docSnap.id);
            updateDoc(adRef, { impressions: increment(1) }).catch(() => {
              updateDoc(doc(db, 'advertisements', docSnap.id), { impressions: increment(1) }).catch(() => {});
            });

            if (cleanAd.zone?.includes('728') || cleanAd.zone?.includes('हेडर') || cleanAd.zone?.includes('header')) {
              setHeaderAd(cleanAd);
            } else if (cleanAd.zone?.includes('300') || cleanAd.zone?.includes('साइडबार') || cleanAd.zone?.includes('sidebar')) {
              setSidebarAd(cleanAd);
            }
          }
        });
      } catch (err) {
        console.error('Error loading home data:', err);
      }
      setLoading(false);
    }
    loadData();

    const unsubRashifal = onSnapshot(collection(db, 'rashifal'), (snap) => {
      const map: Record<string, any> = {};
      snap.docs.forEach(d => { map[d.id] = d.data(); });
      setRashifalData(map);
    });

    return () => {
      unsubSite();
      unsubRashifal();
    };
  }, []);

  /* ─── Derived ─── */
  const primary = siteConfig?.primaryColor || '#ea580c';
  const headerBg = siteConfig?.headerBg || '#ffffff';
  const siteFont = siteConfig?.fontFamily || '"Mukta", system-ui, -apple-system, sans-serif';

  const filteredArticles = articles.filter(art => {
    const rawStatus = String(art.status || '').trim().toLowerCase();
    if (rawStatus !== 'published' && rawStatus !== 'approved') return false;

    const matchesCategory =
      activeCategory === 'होम' ||
      activeCategory === 'ताज़ा खबरें' ||
      activeCategory === 'राशिफल' ||
      art.category?.toLowerCase() === activeCategory.toLowerCase() ||
      (activeCategory === 'राजनीति' && art.category === 'Politics') ||
      (activeCategory === 'व्यापार' && art.category === 'Business') ||
      (activeCategory === 'स्वास्थ्य' && art.category === 'Health') ||
      (activeCategory === 'जीवनशैली' && art.category === 'Lifestyle') ||
      (activeCategory === 'अपराध' && art.category === 'Crime') ||
      (activeCategory === 'खेल' && art.category === 'Sports') ||
      (activeCategory === 'राज्य' && art.category === 'National');

    const cleanSearch = searchTerm.trim().toLowerCase();
    const matchesSearch =
      !cleanSearch ||
      (art.title && art.title.toLowerCase().includes(cleanSearch)) ||
      (art.titleHi && art.titleHi.toLowerCase().includes(cleanSearch)) ||
      (art.summary && art.summary.toLowerCase().includes(cleanSearch));

    return matchesCategory && matchesSearch;
  });

  const activeRashiItem = DEFAULT_RASHI_LIST.find(r => r.id === selectedRashi) || DEFAULT_RASHI_LIST[0];
  const activeRashiInfo = rashifalData[selectedRashi];

  const tint = (hex: string, opacity: number) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${opacity})`;
  };

  /* ================================================================
     RENDER
     ================================================================ */
  return (
    <div style={{ minHeight: '100vh', background: '#f4f3f0', color: '#1a1a1a', fontFamily: siteFont, fontSize: '15px', lineHeight: 1.6, display: 'flex', flexDirection: 'column', width: '100%', overflowX: 'hidden' }}>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Tiro+Devanagari+Hindi:ital@0;1&family=Mukta:wght@300;400;500;600;700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { max-width: 100vw; overflow-x: hidden; }
        a { text-decoration: none; color: inherit; }
        button { font-family: inherit; }

        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

        /* ── layout shell ── */
        .shell {
          max-width: 1400px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 230px minmax(0, 1fr) 310px;
          gap: 22px;
          padding: 20px 24px 48px;
          width: 100%;
        }
        .col-left {
          position: sticky;
          top: 76px;
          align-self: start;
          max-height: calc(100vh - 90px);
          overflow-y: auto;
        }
        .col-right {
          position: sticky;
          top: 76px;
          align-self: start;
          max-height: calc(100vh - 90px);
          overflow-y: auto;
        }

        /* ── card ── */
        .card {
          background: #ffffff;
          border: 1px solid #eae8e4;
          border-radius: 14px;
          overflow: hidden;
          transition: box-shadow .2s ease;
        }
        .card:hover { box-shadow: 0 4px 20px rgba(0,0,0,.06); }

        /* ── article row ── */
        .art-row { transition: background .15s ease; }
        .art-row:hover { background: #fafaf8 !important; }

        /* ── category button ── */
        .cat-btn {
          display: flex;
          align-items: center;
          gap: 12px;
          width: 100%;
          padding: 10px 14px;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 500;
          border: none;
          text-align: left;
          cursor: pointer;
          transition: background .15s ease, color .15s ease;
        }
        .cat-btn:hover { background: #f5f4f1; }

        /* ── trending tag ── */
        .trend-tag {
          font-size: 12.5px;
          font-weight: 500;
          border: 1px solid #eae8e4;
          border-radius: 20px;
          padding: 5px 14px;
          color: #555;
          background: #fff;
          cursor: pointer;
          white-space: nowrap;
          transition: border-color .15s ease, color .15s ease, background .15s ease;
        }
        .trend-tag:hover {
          border-color: ${primary};
          color: ${primary};
          background: ${tint(primary, 0.04)};
        }
        .trend-tag-active {
          border-color: ${primary} !important;
          color: #fff !important;
          background: ${primary} !important;
        }

        /* ── burger ── */
        .burger { display: none; background: none; border: none; padding: 6px; cursor: pointer; color: #1a1a1a; flex-shrink: 0; }

        /* ── header row ── */
        .header-row {
          max-width: 1400px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          padding: 0 24px;
          height: 68px;
          width: 100%;
        }

        /* ── nav pills ── */
        .nav-pills {
          display: flex;
          align-items: center;
          gap: 6px;
          margin: 0 20px;
          flex: 1;
          justify-content: center;
        }
        .nav-pill {
          display: flex;
          align-items: center;
          gap: 5px;
          background: none;
          border: none;
          font-size: 13.5px;
          font-weight: 600;
          padding: 6px 14px;
          border-radius: 20px;
          cursor: pointer;
          white-space: nowrap;
          transition: background .15s ease, color .15s ease;
        }
        .nav-pill:hover { background: #f5f4f1; }

        /* ── ad leaderboard ── */
        .ad-leader {
          width: 100%;
          height: 96px;
          border-radius: 12px;
          overflow: hidden;
          margin-bottom: 18px;
          background: #1a1a1a;
          position: relative;
        }
        .ad-leader a, .ad-leader img { display: block; width: 100%; height: 100%; object-fit: cover; }

        /* ── portal link ── */
        .portal-link {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-size: 11.5px;
          font-weight: 600;
          padding: 6px 13px;
          border-radius: 20px;
          white-space: nowrap;
          transition: opacity .15s ease;
        }
        .portal-link:hover { opacity: .85; }

        /* ── hero image zoom ── */
        .hero-img { transition: transform .4s ease; }
        .hero-img:hover { transform: scale(1.03); }

        /* ══════ LANGUAGE TRANSLATOR / SITE SWITCHER DROPDOWN FIX ══════ */
        .lang-wrap,
        .lang-wrap *,
        .site-switch-wrap,
        .site-switch-wrap * {
          position: relative;
        }
        .lang-wrap > div,
        .site-switch-wrap > div {
          z-index: 999 !important;
        }
        .lang-wrap [class*="dropdown"],
        .lang-wrap [class*="menu"],
        .lang-wrap [class*="list"],
        .lang-wrap [class*="popup"],
        .lang-wrap [class*="popover"],
        .lang-wrap ul,
        .lang-wrap select,
        .site-switch-wrap [class*="dropdown"],
        .site-switch-wrap [class*="menu"],
        .site-switch-wrap [class*="list"],
        .site-switch-wrap [class*="popup"],
        .site-switch-wrap [class*="popover"],
        .site-switch-wrap ul,
        .site-switch-wrap select {
          z-index: 9999 !important;
          position: absolute !important;
          overflow: visible !important;
        }

        /* ══════ responsive ══════ */
        @media (max-width: 1280px) {
          .shell { grid-template-columns: 210px minmax(0,1fr); gap: 18px; padding: 16px 18px 40px; }
          .col-right { display: none; }
        }
        @media (max-width: 1060px) {
          .portal-links-wrap { display: none !important; }
        }
        @media (max-width: 860px) {
          .shell { grid-template-columns: 1fr; padding: 14px 12px 36px; }
          .col-left {
            position: fixed;
            top: 0; bottom: 0; left: 0;
            width: min(80vw, 300px);
            background: #fff;
            z-index: 400;
            padding: 20px 16px;
            max-height: none;
            box-shadow: 6px 0 30px rgba(0,0,0,.15);
            transform: translateX(-100%);
            transition: transform .25s cubic-bezier(.4,0,.2,1);
            border-radius: 0 18px 18px 0;
          }
          .col-left.open { transform: translateX(0); }
          .burger { display: block; }
          .nav-pills { display: none !important; }
          .desktop-tools { display: none !important; }
          .mobile-tools { display: flex !important; }
          .header-row { padding: 0 10px; height: 58px; gap: 6px; }
          .ad-leader { height: 72px; border-radius: 10px; margin-bottom: 14px; }
          .site-name { font-size: 14px !important; max-width: 100px; }
          .site-tag { display: none !important; }
        }
        @media (min-width: 861px) {
          .mobile-tools { display: none !important; }
        }
      `}</style>

      {/* ════════════════════════════════════════════════════════════
           1 ▸ LIVE MARKET TICKER
           ════════════════════════════════════════════════════════════ */}
      <div style={{ background: 'linear-gradient(90deg,#141414,#1e1e1e)', color: '#b0b0b0', fontSize: '11px', letterSpacing: '.01em', width: '100%', overflow: 'hidden', borderBottom: '1px solid #2a2a2a' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 24px' }}>
          <div className="hide-scrollbar" style={{ display: 'flex', alignItems: 'center', gap: '4px', overflowX: 'auto', whiteSpace: 'nowrap', WebkitOverflowScrolling: 'touch', touchAction: 'pan-x', padding: '7px 0' }}>
            {[
              { label: 'पेट्रोल', value: marketRates.petrol, color: '#fff' },
              { label: 'डीज़ल', value: marketRates.diesel, color: '#fff' },
              { label: 'निफ्टी', value: `${marketRates.nifty} ${marketRates.niftyPositive ? '▲' : '▼'} ${marketRates.niftyChange}`, color: marketRates.niftyPositive ? '#34d399' : '#f87171' },
              { label: 'सेंसेक्स', value: `${marketRates.sensex} ${marketRates.sensexPositive ? '▲' : '▼'} ${marketRates.sensexChange}`, color: marketRates.sensexPositive ? '#34d399' : '#f87171' },
              { label: 'सोना', value: marketRates.gold, color: '#fbbf24' },
              { label: 'चांदी', value: marketRates.silver, color: '#cbd5e1' },
            ].map((item, i) => (
              <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                {i > 0 && <span style={{ color: '#333', margin: '0 6px' }}>│</span>}
                <span style={{ color: '#888' }}>{item.label}</span>
                <span style={{ color: item.color, fontWeight: 600 }}>{item.value}</span>
              </span>
            ))}
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', marginLeft: '14px', paddingLeft: '14px', borderLeft: '1px solid #333' }}>
              <span style={{ fontSize: '12px' }}>📅</span>
              <span style={{ color: '#999' }}>{currentHindiDate || '...'}</span>
            </span>
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════
           2 ▸ STICKY HEADER
           ════════════════════════════════════════════════════════════ */}
      <header style={{ position: 'sticky', top: 0, zIndex: 200, background: headerBg, borderBottom: '1px solid #e8e6e2', boxShadow: '0 1px 4px rgba(0,0,0,.04)', width: '100%' }}>
        <div className="header-row">

          {/* left: burger + logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
            <button className="burger" onClick={() => setDrawerOpen(true)} aria-label="मेनू">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M4 6h16M4 12h16M4 18h16"/></svg>
            </button>
            <Link href={`/?site=${currentSlug}`} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <img
                src={siteConfig?.logoUrl || `/logos/${currentSlug}.jpeg`}
                alt={siteConfig?.name || 'The Local Leader'}
                style={{ height: '38px', width: 'auto', objectFit: 'contain', borderRadius: '6px' }}
              />
              <div style={{ minWidth: 0 }}>
                <span className="site-name" style={{ fontFamily: '"Tiro Devanagari Hindi", Georgia, serif', fontSize: '18px', fontWeight: 600, color: '#1a1a1a', lineHeight: 1.15, display: 'block', whiteSpace: 'nowrap' }}>
                  {siteConfig?.name || 'द लोकल लीडर'}
                </span>
                <span className="site-tag" style={{ display: 'block', fontSize: '9px', color: '#999', whiteSpace: 'nowrap', letterSpacing: '.02em' }}>
                  {siteConfig?.description || 'जनता की आवाज़, सच्चाई के साथ'}
                </span>
              </div>
            </Link>
          </div>

          {/* center: nav pills (desktop) */}
          <nav className="nav-pills hide-scrollbar">
            {[
              { key: 'होम', emoji: '🏠' },
              { key: 'ताज़ा खबरें', emoji: '⚡' },
              { key: 'शोक संदेश', emoji: '🕯️' },
              { key: 'ई-पेपर', emoji: '📄' },
            ].map(({ key, emoji }) => {
              const isActive = activeCategory === key;
              return (
                <button
                  key={key}
                  className="nav-pill"
                  onClick={() => handleCategoryClick(key)}
                  style={{
                    color: isActive ? primary : '#555',
                    background: isActive ? tint(primary, 0.08) : 'transparent',
                    fontWeight: isActive ? 700 : 500,
                  }}
                >
                  <span style={{ fontSize: '13px' }}>{emoji}</span>
                  {key}
                </button>
              );
            })}
          </nav>

          {/* right: desktop tools */}
          <div className="desktop-tools" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto', flexShrink: 0 }}>
            <div className="portal-links-wrap" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Link href="/patrakar/login" className="portal-link" style={{ color: '#444', background: '#f3f3f1', border: '1px solid #ddd' }}>
                ✍️ पत्रकार
              </Link>
              <Link href="/advertiser/login" className="portal-link" style={{ color: '#fff', background: '#1e293b', border: '1px solid #1e293b' }}>
                📢 विज्ञापन
              </Link>
            </div>

            <button
              onClick={() => setSearchModalOpen(true)}
              style={{ background: '#f5f4f1', border: '1px solid #e5e3df', borderRadius: '22px', padding: '6px 14px', display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', color: '#777', fontSize: '12.5px', transition: 'border-color .15s ease' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.35-4.35"/></svg>
              खोजें
            </button>

            <div className="site-switch-wrap" style={{ position: 'relative', zIndex: 999, flexShrink: 0 }}>
              <SiteSwitcher currentSlug={currentSlug} primaryColor={primary} />
            </div>
            <div className="lang-wrap" style={{ position: 'relative', zIndex: 999, flexShrink: 0 }}>
              <LanguageTranslator />
            </div>

            {readerUser ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: tint(primary, 0.06), border: `1px solid ${tint(primary, 0.25)}`, borderRadius: '22px', padding: '5px 12px' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: primary }}>👤 {readerUser.name ? readerUser.name.slice(0, 6) : 'यूज़र'}</span>
                <button onClick={handleReaderLogout} style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '11px', cursor: 'pointer', fontWeight: 800, lineHeight: 1 }}>✕</button>
              </div>
            ) : (
              <Link href="/login" style={{ background: primary, color: '#fff', borderRadius: '22px', padding: '7px 18px', fontSize: '13px', fontWeight: 600, whiteSpace: 'nowrap', display: 'inline-block', transition: 'opacity .15s ease' }}>
                लॉगिन
              </Link>
            )}
          </div>

          {/* right: mobile tools */}
          <div className="mobile-tools hide-scrollbar" style={{ display: 'none', alignItems: 'center', gap: '6px', marginLeft: 'auto', overflowX: 'auto' }}>
            <button
              onClick={() => setSearchModalOpen(true)}
              aria-label="सर्च"
              style={{ background: '#f5f4f1', border: '1px solid #e5e3df', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#777" strokeWidth="2.2" strokeLinecap="round"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.35-4.35"/></svg>
            </button>
            <div className="site-switch-wrap" style={{ flexShrink: 0, position: 'relative', zIndex: 999 }}>
              <SiteSwitcher currentSlug={currentSlug} primaryColor={primary} />
            </div>
            <div className="lang-wrap" style={{ flexShrink: 0, position: 'relative', zIndex: 999 }}>
              <LanguageTranslator />
            </div>
            {readerUser ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '3px', background: tint(primary, 0.08), border: `1px solid ${tint(primary, 0.2)}`, borderRadius: '18px', padding: '4px 8px', flexShrink: 0 }}>
                <span style={{ fontSize: '11px', fontWeight: 600, color: primary }}>👤</span>
                <button onClick={handleReaderLogout} style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '10px', cursor: 'pointer', fontWeight: 800 }}>✕</button>
              </div>
            ) : (
              <Link href="/login" style={{ background: primary, color: '#fff', borderRadius: '18px', padding: '5px 12px', fontSize: '12px', fontWeight: 600, whiteSpace: 'nowrap', flexShrink: 0 }}>
                लॉगिन
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* ════════════════════════════════════════════════════════════
           SEARCH MODAL
           ════════════════════════════════════════════════════════════ */}
      {searchModalOpen && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) setSearchModalOpen(false); }}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', backdropFilter: 'blur(4px)', zIndex: 500, display: 'flex', justifyContent: 'center', paddingTop: '90px', padding: '90px 16px 0' }}
        >
          <div style={{ width: '100%', maxWidth: '580px', background: '#fff', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 24px 60px rgba(0,0,0,.2)', alignSelf: 'flex-start' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 18px', borderBottom: '1px solid #eee' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.35-4.35"/></svg>
              <input
                type="search"
                placeholder="खबर, विषय या कीवर्ड लिखें..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setActiveTrendTag(''); }}
                autoFocus
                style={{ width: '100%', border: 'none', outline: 'none', fontSize: '15px', color: '#1a1a1a', background: 'transparent' }}
              />
              <button
                onClick={() => setSearchModalOpen(false)}
                style={{ background: '#f5f4f1', border: '1px solid #e5e3df', borderRadius: '8px', padding: '4px 12px', fontSize: '11.5px', color: '#888', cursor: 'pointer', whiteSpace: 'nowrap', fontWeight: 500 }}
              >
                Esc
              </button>
            </div>
            {searchTerm && (
              <div style={{ padding: '12px 18px', fontSize: '13px', color: '#999' }}>
                &ldquo;{searchTerm}&rdquo; के लिए परिणाम देखें…
              </div>
            )}
          </div>
        </div>
      )}

      {/* MOBILE DRAWER BACKDROP */}
      {drawerOpen && (
        <div onClick={() => setDrawerOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.35)', backdropFilter: 'blur(2px)', zIndex: 390 }} />
      )}

      {/* ════════════════════════════════════════════════════════════
           3 ▸ THREE-COLUMN SHELL
           ════════════════════════════════════════════════════════════ */}
      <div className="shell">

        {/* ──── LEFT SIDEBAR ──── */}
        <aside className={`col-left ${drawerOpen ? 'open' : ''}`}>
          <div style={{ display: drawerOpen ? 'flex' : 'none', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
            <span style={{ fontFamily: '"Tiro Devanagari Hindi", Georgia, serif', fontSize: '16px', fontWeight: 600 }}>श्रेणियाँ</span>
            <button onClick={() => setDrawerOpen(false)} style={{ background: '#f5f4f1', border: '1px solid #e5e3df', borderRadius: '8px', width: '30px', height: '30px', display: 'grid', placeItems: 'center', cursor: 'pointer', fontSize: '14px', color: '#888' }}>✕</button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {CATEGORY_LIST.map(({ key, icon }) => {
              const isActive = activeCategory === key;
              return (
                <button
                  key={key}
                  className="cat-btn"
                  onClick={() => handleCategoryClick(key)}
                  style={{
                    color: isActive ? primary : '#555',
                    background: isActive ? tint(primary, 0.07) : 'transparent',
                    fontWeight: isActive ? 600 : 500,
                  }}
                >
                  <span style={{
                    width: '30px', height: '30px', borderRadius: '8px',
                    background: isActive ? primary : '#f0efec',
                    color: isActive ? '#fff' : '#888',
                    display: 'grid', placeItems: 'center', fontSize: '14px', flexShrink: 0,
                    transition: 'background .15s ease, color .15s ease'
                  }}>
                    {icon}
                  </span>
                  {key}
                </button>
              );
            })}
          </div>

          {/* App download */}
          <div style={{ marginTop: '28px', paddingTop: '20px', borderTop: '1px solid #eae8e4' }}>
            <div style={{ fontSize: '11px', color: '#aaa', fontWeight: 600, marginBottom: '10px', textAlign: 'center', letterSpacing: '.04em' }}>ऐप डाउनलोड करें</div>

            {/* Google Play */}
            <a
              href="#"
              onClick={(e) => { e.preventDefault(); alert('Google Play Store लिंक जल्द उपलब्ध होगा!'); }}
              style={{ display: 'flex', alignItems: 'center', gap: '10px', border: '1px solid #eae8e4', borderRadius: '10px', padding: '8px 12px', marginBottom: '6px', background: '#fafaf8', transition: 'background .15s ease' }}
            >
              <svg width="22" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M3.61 1.814L13.793 12 3.61 22.186A1.99 1.99 0 013 20.6V3.4c0-.586.228-1.136.61-1.586z" fill="#4285F4"/>
                <path d="M17.09 8.352L5.08.658C4.61.384 4.07.25 3.51.25L13.793 12l3.297-3.648z" fill="#EA4335"/>
                <path d="M3.51 23.75c.56 0 1.1-.134 1.57-.408l12.01-7.694L13.793 12 3.51 23.75z" fill="#34A853"/>
                <path d="M20.8 10.248l-3.71-1.896L13.793 12l3.297 3.648 3.71-1.896c1.012-.593 1.012-2.11 0-2.504z" fill="#FBBC04"/>
              </svg>
              <div>
                <div style={{ fontSize: '9px', color: '#aaa', lineHeight: 1.2 }}>GET IT ON</div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#1a1a1a' }}>Google Play</div>
              </div>
            </a>

            {/* App Store */}
            <a
              href="#"
              onClick={(e) => { e.preventDefault(); alert('Apple App Store लिंक जल्द उपलब्ध होगा!'); }}
              style={{ display: 'flex', alignItems: 'center', gap: '10px', border: '1px solid #eae8e4', borderRadius: '10px', padding: '8px 12px', marginBottom: '6px', background: '#fafaf8', transition: 'background .15s ease' }}
            >
              <svg width="20" height="24" viewBox="0 0 814 1000" fill="#1a1a1a">
                <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76.5 0-103.7 40.8-165.9 40.8s-105.6-57.8-155.5-130.3C30.9 753.7 0 googol 611.3c0-120.3 78.1-183.6 154.2-183.6 60.9 0 99.9 40.2 150.5 40.2 49.3 0 79.4-40.2 150.5-40.2 41.5 0 116.4 18.4 161.6 69.2zM554.1 159.4c31.1-36.9 53.1-88.1 53.1-139.3 0-7.1-.6-14.3-1.9-20.1-50.6 1.9-110.8 33.7-147.1 75.8-28.5 32.4-55.1 83.6-55.1 135.5 0 7.8.6 15.7 1.3 18.2 2.6.6 6.4 1.3 10.8 1.3 45.8 0 104.2-30.4 138.9-71.4z"/>
              </svg>
              <div>
                <div style={{ fontSize: '9px', color: '#aaa', lineHeight: 1.2 }}>Download on the</div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#1a1a1a' }}>App Store</div>
              </div>
            </a>
          </div>
        </aside>

        {/* ──── CENTER COLUMN ──── */}
        <main style={{ minWidth: 0 }}>

          {/* Header Ad */}
          <div className="ad-leader">
            {headerAd ? (
              <a href={headerAd.targetUrl || '#'} target="_blank" rel="noopener noreferrer" onClick={() => handleAdClick(headerAd)}>
                <img src={headerAd.imageUrl} alt={headerAd.name} />
              </a>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#555', fontSize: '11px', letterSpacing: '.02em' }}>
                विज्ञापन · 728 × 90
              </div>
            )}
          </div>

          {/* Trending tags — with active state */}
          <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 16px', marginBottom: '18px' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: primary, flexShrink: 0, display: 'flex', alignItems: 'center', gap: '4px' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={primary} strokeWidth="2.5" strokeLinecap="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
              ट्रेंडिंग
            </span>
            <div className="hide-scrollbar" style={{ display: 'flex', gap: '6px', overflowX: 'auto', whiteSpace: 'nowrap', flex: 1 }}>
              {TRENDING_TAGS.map((t) => (
                <button
                  key={t}
                  className={`trend-tag ${activeTrendTag === t ? 'trend-tag-active' : ''}`}
                  onClick={() => handleTrendTagClick(t)}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Articles */}
          {loading ? (
            <div className="card" style={{ padding: '60px 20px', textAlign: 'center' }}>
              <div style={{ width: '32px', height: '32px', border: `3px solid ${tint(primary, 0.2)}`, borderTopColor: primary, borderRadius: '50%', animation: 'spin .7s linear infinite', margin: '0 auto 14px' }} />
              <span style={{ color: '#999', fontSize: '14px' }}>खबरें लोड हो रही हैं…</span>
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          ) : filteredArticles.length === 0 ? (
            <div className="card" style={{ padding: '50px 24px', textAlign: 'center' }}>
              <div style={{ fontSize: '36px', marginBottom: '12px', opacity: .4 }}>📭</div>
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#1a1a1a', marginBottom: '6px' }}>
                {searchTerm ? `"${searchTerm}" के लिए कोई खबर नहीं मिली` : 'अभी कोई स्वीकृत खबर उपलब्ध नहीं है'}
              </h3>
              <p style={{ color: '#999', fontSize: '13px' }}>
                संपादक द्वारा समीक्षा एवं अनुमोदन के बाद ही खबरें यहां प्रदर्शित होती हैं।
              </p>
            </div>
          ) : (
            <div className="card">
              {/* Hero article */}
              {filteredArticles[0] && (
                <article style={{ borderBottom: '1px solid #eae8e4' }}>
                  <Link href={`/article/${filteredArticles[0].id}?site=${currentSlug}`}>
                    <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', overflow: 'hidden', background: '#e8e6e2' }}>
                      <img
                        className="hero-img"
                        src={filteredArticles[0].image || 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=1200'}
                        alt={filteredArticles[0].title}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(transparent, rgba(0,0,0,.7))', padding: '40px 20px 16px' }}>
                        <span style={{ display: 'inline-block', background: primary, color: '#fff', fontSize: '10.5px', fontWeight: 700, padding: '3px 10px', borderRadius: '4px', marginBottom: '8px', letterSpacing: '.02em' }}>
                          {filteredArticles[0].category || 'ताज़ा खबर'}
                        </span>
                        <h2 style={{ fontFamily: '"Tiro Devanagari Hindi", Georgia, serif', fontSize: '22px', fontWeight: 500, lineHeight: 1.45, color: '#fff', margin: 0 }}>
                          {filteredArticles[0].title}
                        </h2>
                      </div>
                    </div>
                    <div style={{ padding: '14px 20px 16px' }}>
                      {filteredArticles[0].summary && (
                        <p style={{ fontSize: '14px', color: '#666', lineHeight: 1.65, margin: '0 0 12px' }}>
                          {filteredArticles[0].summary}
                        </p>
                      )}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px', color: '#aaa' }}>
                        <span>{filteredArticles[0].createdAt ? String(filteredArticles[0].createdAt).split('T')[0] : currentHindiDate}</span>
                        <span style={{ width: '3px', height: '3px', borderRadius: '50%', background: '#ccc', flexShrink: 0 }} />
                        <span>👁 {filteredArticles[0].views || 0} बार पढ़ा गया</span>
                      </div>
                    </div>
                  </Link>
                </article>
              )}

              {/* Rest of articles */}
              {filteredArticles.slice(1).map((item) => (
                <article key={item.id} className="art-row" style={{ borderBottom: '1px solid #eae8e4' }}>
                  <Link href={`/article/${item.id}?site=${currentSlug}`} style={{ display: 'flex', gap: '14px', alignItems: 'flex-start', padding: '14px 20px' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ fontSize: '10px', fontWeight: 700, color: primary, letterSpacing: '.03em' }}>
                        {item.category}
                      </span>
                      <h4 style={{ fontFamily: '"Tiro Devanagari Hindi", Georgia, serif', fontSize: '16px', fontWeight: 500, margin: '3px 0 8px', color: '#1a1a1a', lineHeight: 1.45 }}>
                        {item.title}
                      </h4>
                      <div style={{ fontSize: '11px', color: '#aaa', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>{item.createdAt ? String(item.createdAt).split('T')[0] : 'आज'}</span>
                        <span style={{ width: '3px', height: '3px', borderRadius: '50%', background: '#ddd', flexShrink: 0 }} />
                        <span>👁 {item.views || 0}</span>
                      </div>
                    </div>
                    {item.image && (
                      <div style={{ width: '108px', height: '72px', borderRadius: '8px', overflow: 'hidden', flexShrink: 0, background: '#e8e6e2' }}>
                        <img src={item.image} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                    )}
                  </Link>
                </article>
              ))}
            </div>
          )}
        </main>

        {/* ──── RIGHT SIDEBAR ──── */}
        <aside className="col-right">

          {/* Most Read */}
          <div className="card" style={{ marginBottom: '18px' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid #eae8e4', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={primary} strokeWidth="2" strokeLinecap="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
              <h3 style={{ fontFamily: '"Tiro Devanagari Hindi", Georgia, serif', fontSize: '16px', fontWeight: 600, margin: 0 }}>
                सबसे ज़्यादा पढ़ी गईं
              </h3>
            </div>
            <div>
              {filteredArticles.slice(0, 5).map((art, idx) => (
                <Link key={art.id} href={`/article/${art.id}?site=${currentSlug}`} className="art-row" style={{ display: 'flex', gap: '12px', padding: '12px 18px', borderBottom: idx < 4 ? '1px solid #f0efec' : 'none', alignItems: 'flex-start' }}>
                  <span style={{ fontFamily: '"Mukta", sans-serif', fontSize: '22px', fontWeight: 800, color: tint(primary, 0.25), lineHeight: 1, flexShrink: 0, width: '24px' }}>
                    {idx + 1}
                  </span>
                  <div style={{ minWidth: 0 }}>
                    <h4 style={{ fontSize: '13px', fontWeight: 500, margin: '0 0 3px', color: '#1a1a1a', lineHeight: 1.45, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' } as any}>
                      {art.title}
                    </h4>
                    <span style={{ fontSize: '10.5px', color: '#bbb' }}>
                      👁 {art.views || 0} बार पढ़ा गया
                    </span>
                  </div>
                </Link>
              ))}
              {filteredArticles.length === 0 && (
                <div style={{ padding: '24px', textAlign: 'center', fontSize: '13px', color: '#ccc' }}>कोई खबर नहीं</div>
              )}
            </div>
          </div>

          {/* Rashifal */}
          <div className="card" style={{ marginBottom: '18px', padding: '16px 18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <span style={{ width: '40px', height: '40px', borderRadius: '50%', background: `linear-gradient(135deg, ${tint(primary, 0.12)}, ${tint(primary, 0.04)})`, display: 'grid', placeItems: 'center', fontSize: '20px', flexShrink: 0 }}>
                {activeRashiItem.sign}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: '"Tiro Devanagari Hindi", Georgia, serif', fontSize: '15px', fontWeight: 600, lineHeight: 1.2 }}>
                  {activeRashiItem.name} राशिफल
                </div>
                <div style={{ fontSize: '11px', color: '#aaa', marginTop: '2px' }}>
                  शुभ अंक: {activeRashiInfo?.luckyNumber || '7'} · रंग: {activeRashiInfo?.luckyColor || 'केसरिया'}
                </div>
              </div>
              <select
                value={selectedRashi}
                onChange={(e) => setSelectedRashi(e.target.value)}
                style={{ background: '#f5f4f1', border: '1px solid #e5e3df', color: '#555', borderRadius: '8px', padding: '5px 8px', fontSize: '11.5px', outline: 'none', cursor: 'pointer' }}
              >
                {DEFAULT_RASHI_LIST.map(r => (
                  <option key={r.id} value={r.id}>{r.name} {r.sign}</option>
                ))}
              </select>
            </div>
            <p style={{ fontSize: '13px', color: '#666', margin: 0, lineHeight: 1.7 }}>
              {activeRashiInfo?.prediction || `आज ${activeRashiItem.name} राशि के जातकों के लिए नए अवसर खुलेंगे। वाणी में मधुरता बनाए रखें।`}
            </p>
          </div>

          {/* Sidebar Ad */}
          <div className="card" style={{ height: '260px', display: 'grid', placeItems: 'center' }}>
            {sidebarAd ? (
              <a
                href={sidebarAd.targetUrl || '#'}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => handleAdClick(sidebarAd)}
                style={{ display: 'block', width: '100%', height: '100%' }}
              >
                <img src={sidebarAd.imageUrl} alt={sidebarAd.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </a>
            ) : (
              <span style={{ color: '#ccc', fontSize: '11px', letterSpacing: '.02em' }}>विज्ञापन · 300 × 250</span>
            )}
          </div>
        </aside>
      </div>

      {/* ════════════════════════════════════════════════════════════
           FOOTER
           ════════════════════════════════════════════════════════════ */}
      <Footer
        siteName={siteConfig?.name || 'द लोकल लीडर'}
        primaryColor={primary}
        logoUrl={siteConfig?.logoUrl || `/logos/${currentSlug}.jpeg`}
        tagline={siteConfig?.description || '— जनता की आवाज़, सच्चाई के साथ —'}
        currentSlug={currentSlug}
      />
    </div>
  );
}