'use client';
import { useEffect, useState } from 'react';
import { collection, query, where, getDocs, doc, onSnapshot } from 'firebase/firestore';
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

  const handleCategoryClick = (cat: string) => {
    if (cat === 'ई-पेपर') {
      router.push(`/epaper?site=${currentSlug}`);
      return;
    }
    setActiveCategory(cat);
    setDrawerOpen(false);
  };

  useEffect(() => {
    const updateDate = () => {
      const days = ['रविवार', 'सोमवार', 'मंगलवार', 'बुधवार', 'गुरुवार', 'शुक्रवार', 'शनिवार'];
      const months = [
        'जनवरी', 'फरवरी', 'मार्च', 'अप्रैल', 'मई', 'जून',
        'जुलाई', 'अगस्त', 'सितंबर', 'अक्टूबर', 'नवंबर', 'दिसंबर'
      ];
      const now = new Date();
      const dayName = days[now.getDay()];
      const dateNum = now.getDate();
      const monthName = months[now.getMonth()];
      const year = now.getFullYear();

      setCurrentHindiDate(`${dayName}, ${dateNum} ${monthName} ${year}`);
    };

    updateDate();
    const interval = setInterval(updateDate, 60000);
    return () => clearInterval(interval);
  }, []);

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
        
        // STRICT DOUBLE-GUARD: Pending news is completely eliminated here
        const approvedArticles = artSnap.docs
          .map(d => ({ id: d.id, ...d.data() } as ArticleItem))
          .filter(art => {
            const rawStatus = String(art.status || '').trim().toLowerCase();
            return rawStatus === 'published' || rawStatus === 'approved';
          });

        setArticles(approvedArticles);

        // Strict ads approval guard
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
            if (cleanAd.zone?.includes('728') || cleanAd.zone?.includes('हेडर')) {
              setHeaderAd(cleanAd);
            } else if (cleanAd.zone?.includes('300') || cleanAd.zone?.includes('साइडबार')) {
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

  const primary = siteConfig?.primaryColor || '#ea580c';
  const headerBg = siteConfig?.headerBg || '#ffffff';
  const siteFont = siteConfig?.fontFamily || '"Mukta", system-ui, -apple-system, sans-serif';

  const filteredArticles = articles.filter(art => {
    const rawStatus = String(art.status || '').trim().toLowerCase();
    if (rawStatus !== 'published' && rawStatus !== 'approved') {
      return false;
    }

    const matchesCategory = 
      activeCategory === 'होम' || 
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

  return (
    <div style={{ minHeight: '100vh', background: '#f2f1ee', color: '#16150f', fontFamily: siteFont, fontSize: '16px', lineHeight: 1.6, display: 'flex', flexDirection: 'column', width: '100%', overflowX: 'hidden' }}>
      
      <style jsx global>{`
        html, body {
          max-width: 100vw;
          overflow-x: hidden;
          margin: 0;
          padding: 0;
        }

        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

        .shell-container {
          max-width: 1560px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 240px minmax(0, 1fr) 320px;
          gap: 20px;
          padding: 16px 20px 40px;
          box-sizing: border-box;
          width: 100%;
        }

        .side-col {
          position: sticky;
          top: 80px;
          align-self: start;
          max-height: calc(100vh - 96px);
          overflow-y: auto;
        }

        .rail-col {
          position: sticky;
          top: 80px;
          align-self: start;
          max-height: calc(100vh - 96px);
          overflow-y: auto;
        }

        .burger-toggle-btn {
          display: none;
          background: none;
          border: none;
          padding: 4px;
          cursor: pointer;
          color: #1e242b;
          flex-shrink: 0;
        }

        .header-main-row {
          max-width: 1560px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          padding: 0 16px;
          height: 62px;
          width: 100%;
          box-sizing: border-box;
        }

        /* 🎯 FULL-COVER HEADER LEADERBOARD BANNER */
        .ad-leaderboard-box {
          background: #16150f;
          border: 1px solid #e3e0da;
          border-radius: 8px;
          width: 100%;
          height: 100px;
          display: block;
          margin-bottom: 16px;
          overflow: hidden;
          position: relative;
        }

        .ad-leaderboard-box a {
          display: block;
          width: 100%;
          height: 100%;
          text-decoration: none;
        }

        .ad-leaderboard-box img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center;
          display: block;
        }

        @media (max-width: 1360px) {
          .shell-container {
            grid-template-columns: 220px minmax(0, 1fr);
            gap: 16px;
            padding: 14px 16px;
          }
          .rail-col {
            display: none;
          }
        }

        @media (max-width: 1100px) {
          .nav-portal-links {
            display: none !important;
          }
          .hide-nav-desktop {
            display: none !important;
          }
        }

        @media (max-width: 900px) {
          .shell-container {
            grid-template-columns: 1fr;
            padding: 12px;
          }
          .side-col {
            position: fixed;
            top: 0;
            bottom: 0;
            left: 0;
            width: min(82vw, 320px);
            background: #ffffff;
            z-index: 300;
            padding: 18px;
            max-height: none;
            box-shadow: 4px 0 24px rgba(22,21,15,.2);
            transform: ${drawerOpen ? 'translateX(0)' : 'translateX(-100%)'};
            transition: transform 0.25s ease;
          }
          .burger-toggle-btn {
            display: block;
          }
          .ad-leaderboard-box {
            height: 80px;
          }
        }

        /* 📱 CLEAN MOBILE VIEW: ZERO OVERFLOW & GUARANTEED LOGIN BUTTON VISIBILITY */
        @media (max-width: 768px) {
          .header-portal-switchers {
            display: none !important;
          }
          .mobile-drawer-top-switchers {
            display: flex !important;
            flex-direction: column;
            gap: 10px;
            margin-bottom: 16px;
            padding-bottom: 14px;
            border-bottom: 1px solid #e3e0da;
          }
          .header-main-row {
            padding: 0 10px !important;
            gap: 6px !important;
            height: 56px !important;
          }
          .site-title-text {
            font-size: 15px !important;
            max-width: 130px;
          }
          .site-sub-text {
            display: none !important;
          }
          .search-btn-label {
            display: none !important;
          }
          .nav-tools-group {
            gap: 6px !important;
            margin-left: auto !important;
          }
          .login-btn-header {
            padding: 6px 14px !important;
            font-size: 12.5px !important;
            flex-shrink: 0 !important;
          }
          .ad-leaderboard-box {
            height: 75px;
          }
        }

        @media (max-width: 380px) {
          .site-title-text {
            max-width: 95px;
          }
        }
      `}</style>

      {/* 1. SCROLLABLE TOP LIVE MARKET TICKER (SWIPABLE ON MOBILE) */}
      <div style={{ background: '#16150f', color: '#cbd5e1', fontSize: '11.5px', padding: '6px 0', borderBottom: '1px solid #282721', width: '100%', overflow: 'hidden' }}>
        <div style={{ maxWidth: '1560px', margin: '0 auto', padding: '0 12px', boxSizing: 'border-box' }}>
          <div 
            className="hide-scrollbar" 
            style={{ 
              display: 'flex', 
              gap: '16px', 
              alignItems: 'center', 
              overflowX: 'auto', 
              whiteSpace: 'nowrap', 
              WebkitOverflowScrolling: 'touch',
              touchAction: 'pan-x',
              cursor: 'grab',
              paddingRight: '16px'
            }}
          >
            <span>Diesel: <b style={{ color: '#fff' }}>{marketRates.diesel}</b></span>
            <span>Petrol: <b style={{ color: '#fff' }}>{marketRates.petrol}</b></span>
            <span>
              Nifty: <b style={{ color: marketRates.niftyPositive ? '#4ade80' : '#f87171' }}>
                {marketRates.nifty} {marketRates.niftyPositive ? '↗' : '↘'} {marketRates.niftyChange}
              </b>
            </span>
            <span>
              Sensex: <b style={{ color: marketRates.sensexPositive ? '#4ade80' : '#f87171' }}>
                {marketRates.sensex} {marketRates.sensexPositive ? '↗' : '↘'} {marketRates.sensexChange}
              </b>
            </span>
            <span>Silver: <b style={{ color: '#fff' }}>{marketRates.silver}</b></span>
            <span>Gold: <b style={{ color: '#fff' }}>{marketRates.gold}</b></span>
            <span style={{ color: '#94a3b8', paddingLeft: '8px', borderLeft: '1px solid #334155' }}>
              🗓️ {currentHindiDate || 'लोड हो रहा है...'}
            </span>
          </div>
        </div>
      </div>

      {/* 2. MAIN HEADER & RESPONSIVE NAVBAR */}
      <header style={{ position: 'sticky', top: 0, zIndex: 200, background: headerBg, borderBottom: '1px solid #e3e0da', boxShadow: '0 1px 3px rgba(22,21,15,.05)', width: '100%' }}>
        <div className="header-main-row">
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
            {/* Mobile Drawer Trigger */}
            <button className="burger-toggle-btn" onClick={() => setDrawerOpen(true)} aria-label="Menu">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 6h16M4 12h16M4 18h16"/></svg>
            </button>

            {/* Site Branding Logo */}
            <Link href={`/?site=${currentSlug}`} style={{ display: 'flex', alignItems: 'center', gap: '6px', textDecoration: 'none', color: 'inherit' }}>
              <img 
                src={siteConfig?.logoUrl || `/logos/${currentSlug}.jpeg`} 
                alt={siteConfig?.name || 'The Local Leader'} 
                style={{ height: '34px', width: 'auto', objectFit: 'contain', borderRadius: '4px' }}
              />
              <div style={{ minWidth: 0 }}>
                <span className="site-title-text" style={{ fontFamily: '"Tiro Devanagari Hindi", Georgia, serif', fontSize: '18px', fontWeight: 600, color: '#16150f', lineHeight: 1.15, display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {siteConfig?.name || 'द लोकल लीडर'}
                </span>
                <small className="site-sub-text" style={{ display: 'block', fontSize: '9px', color: '#8d897f', whiteSpace: 'nowrap' }}>
                  {siteConfig?.description || 'जनता की आवाज़, सच्चाई के साथ'}
                </small>
              </div>
            </Link>
          </div>

          {/* Category Navigation Bar (Desktop) */}
          <nav className="hide-scrollbar hide-nav-desktop" style={{ display: 'flex', alignItems: 'center', gap: '2px', margin: '0 auto', overflowX: 'auto' }}>
            {['होम', 'राजनीति', 'व्यापार', 'स्वास्थ्य', 'जीवनशैली', 'राज्य', 'ई-पेपर', 'खेल'].map((cat) => {
              const isActive = activeCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => handleCategoryClick(cat)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '8px 10px',
                    fontSize: '14px',
                    fontWeight: 500,
                    color: isActive ? primary : '#5a574f',
                    background: 'none',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {cat}
                </button>
              );
            })}
          </nav>

          {/* Right Action Tools & Portals */}
          <div className="nav-tools-group" style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: 'auto', flexShrink: 0 }}>
            
            {/* Desktop Portal Links */}
            <div className="nav-portal-links" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Link 
                href="/patrakar/login" 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '4px', 
                  fontSize: '11.5px', 
                  fontWeight: 600, 
                  color: '#334155', 
                  background: '#f1f5f9', 
                  border: '1px solid #cbd5e1', 
                  padding: '5px 9px', 
                  borderRadius: '18px', 
                  textDecoration: 'none',
                  whiteSpace: 'nowrap'
                }}
              >
                <span>✍️</span> <span>पत्रकार</span>
              </Link>
              <Link 
                href="/advertiser/login" 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '4px', 
                  fontSize: '11.5px', 
                  fontWeight: 600, 
                  color: '#fff', 
                  background: '#1e293b', 
                  border: '1px solid #1e293b', 
                  padding: '5px 10px', 
                  borderRadius: '18px', 
                  textDecoration: 'none',
                  whiteSpace: 'nowrap'
                }}
              >
                <span>📢</span> <span>विज्ञापन</span>
              </Link>
            </div>

            {/* Search Trigger */}
            <button 
              onClick={() => setSearchModalOpen(true)}
              style={{ background: '#f0eee9', border: '1px solid #e3e0da', borderRadius: '18px', padding: '5px 9px', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', color: '#5a574f', fontSize: '12px' }}
            >
              <span>🔍</span>
              <span className="search-btn-label">खोजें</span>
            </button>

            {/* Desktop Switchers: Hidden on mobile header to avoid cut-off, placed in drawer */}
            <div className="header-portal-switchers" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <SiteSwitcher currentSlug={currentSlug} primaryColor={primary} />
              <LanguageTranslator />
            </div>

            {/* Reader Auth - Always in View! */}
            {readerUser ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#fff7ed', border: `1px solid ${primary}`, borderRadius: '18px', padding: '4px 8px', flexShrink: 0 }}>
                <span style={{ fontSize: '11.5px', fontWeight: 600, color: primary }}>👤 {readerUser.name ? readerUser.name.slice(0, 5) : 'यूज़र'}</span>
                <button onClick={handleReaderLogout} style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '10px', cursor: 'pointer', fontWeight: 700 }}>✕</button>
              </div>
            ) : (
              <Link 
                href="/login" 
                className="login-btn-header"
                style={{
                  background: primary,
                  color: '#fff',
                  border: 'none',
                  borderRadius: '18px',
                  padding: '6px 14px',
                  fontSize: '13px',
                  fontWeight: 600,
                  textDecoration: 'none',
                  whiteSpace: 'nowrap',
                  display: 'inline-block'
                }}
              >
                लॉगिन
              </Link>
            )}

          </div>
        </div>
      </header>

      {/* SEARCH MODAL OVERLAY */}
      {searchModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(22,21,15,0.45)', zIndex: 350, display: 'flex', justifyContent: 'center', paddingTop: '80px', paddingLeft: '14px', paddingRight: '14px' }}>
          <div style={{ width: '100%', maxWidth: '600px', background: '#ffffff', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 20px 50px rgba(22,21,15,.25)', alignSelf: 'flex-start' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', borderBottom: '1px solid #e3e0da' }}>
              <span style={{ fontSize: '18px', color: '#8d897f' }}>🔍</span>
              <input 
                type="search" 
                placeholder="खबर, विषय या कीवर्ड लिखें..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                autoFocus
                style={{ width: '100%', border: 'none', outline: 'none', fontSize: '15px', color: '#16150f' }}
              />
              <button onClick={() => setSearchModalOpen(false)} style={{ background: 'none', border: '1px solid #e3e0da', borderRadius: '5px', padding: '2px 8px', fontSize: '11.5px', color: '#8d897f', cursor: 'pointer' }}>Esc</button>
            </div>
          </div>
        </div>
      )}

      {/* MOBILE DRAWER BACKDROP */}
      {drawerOpen && (
        <div onClick={() => setDrawerOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(22,21,15,0.45)', zIndex: 290 }} />
      )}

      {/* 3. RESPONSIVE THREE-COLUMN SHELL */}
      <div className="shell-container">
        
        {/* LEFT COLUMN: CATEGORIES & APP DOWNLOAD */}
        <aside className="side-col">
          
          {/* Mobile Direct Switchers & Portal Desks inside drawer[cite: 1] */}
          <div className="mobile-drawer-top-switchers" style={{ display: 'none' }}>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', width: '100%' }}>
              <div style={{ flex: 1 }}><SiteSwitcher currentSlug={currentSlug} primaryColor={primary} /></div>
              <div style={{ flex: 1 }}><LanguageTranslator /></div>
            </div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
              <Link href="/patrakar/login" style={{ flex: 1, textAlign: 'center', fontSize: '12.5px', color: '#1e293b', textDecoration: 'none', padding: '7px 8px', borderRadius: '8px', background: '#f6f5f2', border: '1px solid #e3e0da' }}>
                ✍️ <b>पत्रकार पोर्टल</b>
              </Link>
              <Link href="/advertiser/login" style={{ flex: 1, textAlign: 'center', fontSize: '12.5px', color: '#1e293b', textDecoration: 'none', padding: '7px 8px', borderRadius: '8px', background: '#f6f5f2', border: '1px solid #e3e0da' }}>
                📢 <b>विज्ञापन डेस्क</b>
              </Link>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {['होम', 'राजनीति', 'व्यापार', 'स्वास्थ्य', 'जीवनशैली', 'राज्य', 'ई-पेपर', 'अपराध', 'खेल'].map((cat) => {
              const isActive = activeCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => handleCategoryClick(cat)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    fontSize: '14.5px',
                    fontWeight: 500,
                    color: isActive ? primary : '#5a574f',
                    background: isActive ? '#fdeee6' : 'transparent',
                    border: 'none',
                    textAlign: 'left',
                    cursor: 'pointer'
                  }}
                >
                  <span style={{ width: '28px', height: '28px', borderRadius: '8px', background: isActive ? primary : '#f0ede8', color: isActive ? '#fff' : '#8d897f', display: 'grid', placeItems: 'center', fontSize: '13px', flexShrink: 0 }}>
                    📰
                  </span>
                  <span>{cat}</span>
                </button>
              );
            })}
          </div>

          {/* APP DOWNLOAD BOX[cite: 1, 2] */}
          <div style={{ textAlign: 'center', marginTop: '22px', paddingTop: '18px', borderTop: '1px solid #e3e0da' }}>
            <div style={{ fontSize: '12.5px', color: '#8d897f', marginBottom: '10px' }}>ऐप डाउनलोड करें[cite: 1, 2]</div>
            
            <a 
              href="#" 
              onClick={(e) => { e.preventDefault(); alert('Google Play Store लिंक जल्द उपलब्ध होगा!'); }}
              style={{
                display: 'block',
                border: '1px solid #e3e0da',
                borderRadius: '8px',
                padding: '8px 12px',
                margin: '0 auto 8px',
                maxWidth: '180px',
                textAlign: 'left',
                background: '#f6f5f2',
                textDecoration: 'none',
                color: '#16150f'
              }}
            >
              <small style={{ display: 'block', fontSize: '9px', color: '#8d897f', lineHeight: 1.2 }}>GET IT ON[cite: 1, 2]</small>
              <b style={{ fontSize: '14px', fontWeight: 600 }}>Google Play[cite: 1, 2]</b>
            </a>

            <a 
              href="#" 
              onClick={(e) => { e.preventDefault(); alert('Apple App Store लिंक जल्द उपलब्ध होगा!'); }}
              style={{
                display: 'block',
                border: '1px solid #e3e0da',
                borderRadius: '8px',
                padding: '8px 12px',
                margin: '0 auto 8px',
                maxWidth: '180px',
                textAlign: 'left',
                background: '#f6f5f2',
                textDecoration: 'none',
                color: '#16150f'
              }}
            >
              <small style={{ display: 'block', fontSize: '9px', color: '#8d897f', lineHeight: 1.2 }}>Download on the[cite: 1, 2]</small>
              <b style={{ fontSize: '14px', fontWeight: 600 }}>App Store[cite: 1, 2]</b>
            </a>

            <div style={{ fontSize: '12px', color: '#8d897f', marginTop: '16px', marginBottom: '8px' }}>हमें फ़ॉलो करें[cite: 1, 2]</div>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
              {['f', '𝕏', '◎', '▶'].map((icon, i) => (
                <span 
                  key={i} 
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: '#f6f5f2',
                    border: '1px solid #e3e0da',
                    display: 'grid',
                    placeItems: 'center',
                    fontSize: '13px',
                    color: '#5a574f',
                    cursor: 'pointer'
                  }}
                >
                  {icon}
                </span>
              ))}
            </div>
          </div>
        </aside>

        {/* CENTER COLUMN: MAIN CONTENT FEED */}
        <main style={{ minWidth: 0 }}>
          
          {/* HEADER LEADERBOARD AD - FULL CONTAINER COVER */}
          <div className="ad-leaderboard-box">
            {headerAd ? (
              <a href={headerAd.targetUrl || '#'} target="_blank" rel="noopener noreferrer">
                <img src={headerAd.imageUrl} alt={headerAd.name} />
              </a>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#8d897f', fontSize: '12px' }}>
                Responsive Header Leaderboard Ad (728 × 90)
              </div>
            )}
          </div>

          {/* DYNAMIC ARTICLE LIST */}
          {loading ? (
            <div style={{ padding: '60px', textAlign: 'center', color: '#8d897f', background: '#fff', borderRadius: '10px', border: '1px solid #e3e0da' }}>
              लाइव अपडेट लोड हो रहे हैं...
            </div>
          ) : filteredArticles.length === 0 ? (
            <div style={{ background: '#fff', border: '1px solid #e3e0da', padding: '50px 20px', borderRadius: '10px', textAlign: 'center' }}>
              <h3 style={{ fontSize: '17px', fontWeight: 600, color: '#16150f' }}>
                {searchTerm ? `"${searchTerm}" के लिए कोई खबर नहीं मिली` : 'अभी कोई स्वीकृत खबर उपलब्ध नहीं है'}
              </h3>
              <p style={{ color: '#8d897f', fontSize: '13px', marginTop: '6px' }}>
                संपादक द्वारा समीक्षा एवं अनुमोदन के बाद ही खबरें यहां लाइव प्रदर्शित होती हैं।
              </p>
            </div>
          ) : (
            <div style={{ background: '#ffffff', border: '1px solid #e3e0da', borderRadius: '10px', overflow: 'hidden' }}>
              
              {/* Featured Lead Hero Article */}
              {filteredArticles[0] && (
                <article style={{ padding: '18px 20px', borderBottom: '1px solid #e3e0da' }}>
                  <Link href={`/article/${filteredArticles[0].id}?site=${currentSlug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                    <h3 style={{ fontFamily: '"Tiro Devanagari Hindi", Georgia, serif', fontSize: '23px', fontWeight: 500, lineHeight: 1.45, margin: '0 0 12px 0', color: '#16150f' }}>
                      <span style={{ color: primary }}>{filteredArticles[0].title}</span>
                    </h3>

                    <div style={{ width: '100%', aspectRatio: '16/9', borderRadius: '8px', overflow: 'hidden', background: '#e9e6e0', marginBottom: '14px' }}>
                      <img 
                        src={filteredArticles[0].image || 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=1200'} 
                        alt={filteredArticles[0].title} 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                      />
                    </div>

                    {filteredArticles[0].summary && (
                      <p style={{ fontSize: '15px', color: '#5a574f', margin: '0 0 14px 0', lineHeight: 1.6 }}>
                        {filteredArticles[0].summary}
                      </p>
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', fontWeight: 500, border: '1px solid #e3e0da', borderRadius: '20px', padding: '3px 10px', color: '#5a574f' }}>
                        {filteredArticles[0].category || 'ताज़ा खबर'}
                      </span>
                      <span style={{ fontSize: '12px', color: '#8d897f' }}>
                        {filteredArticles[0].createdAt ? String(filteredArticles[0].createdAt).split('T')[0] : currentHindiDate}
                      </span>
                      <span style={{ fontSize: '12px', color: '#8d897f', marginLeft: 'auto' }}>
                        👁️ {filteredArticles[0].views || 0} बार पढ़ा गया
                      </span>
                    </div>
                  </Link>
                </article>
              )}

              {/* Remaining Articles in Feed */}
              {filteredArticles.slice(1).map((item) => (
                <article key={item.id} style={{ padding: '16px 20px', borderBottom: '1px solid #e3e0da' }}>
                  <Link href={`/article/${item.id}?site=${currentSlug}`} style={{ textDecoration: 'none', color: 'inherit', display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: primary, textTransform: 'uppercase' }}>
                        {item.category}
                      </span>
                      <h4 style={{ fontFamily: '"Tiro Devanagari Hindi", Georgia, serif', fontSize: '17px', fontWeight: 500, margin: '4px 0 6px 0', color: '#16150f', lineHeight: 1.4 }}>
                        {item.title}
                      </h4>
                      <div style={{ fontSize: '11.5px', color: '#8d897f', display: 'flex', gap: '12px' }}>
                        <span>{item.createdAt ? String(item.createdAt).split('T')[0] : 'आज'}</span>
                        <span>👁️ {item.views || 0} बार पढ़ा गया</span>
                      </div>
                    </div>

                    {item.image && (
                      <div style={{ width: '110px', height: '75px', borderRadius: '6px', overflow: 'hidden', flexShrink: 0, background: '#e9e6e0' }}>
                        <img src={item.image} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                    )}
                  </Link>
                </article>
              ))}

            </div>
          )}

        </main>

        {/* RIGHT COLUMN: TRENDING BADGES + RASHIFAL + SIDEBAR AD */}
        <aside className="rail-col">
          
          {/* Trending 01 to 05 Ranking Badges */}
          <div style={{ background: '#ffffff', border: '1px solid #e3e0da', borderRadius: '10px', overflow: 'hidden', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid #e3e0da' }}>
              <h3 style={{ fontFamily: '"Tiro Devanagari Hindi", Georgia, serif', fontSize: '17px', fontWeight: 600, margin: 0 }}>
                सबसे ज़्यादा पढ़ी गईं
              </h3>
            </div>
            <div>
              {filteredArticles.slice(0, 5).map((art, idx) => (
                <Link key={art.id} href={`/article/${art.id}?site=${currentSlug}`} style={{ textDecoration: 'none', color: 'inherit', display: 'flex', gap: '12px', padding: '11px 16px', borderBottom: idx !== 4 ? '1px solid #e3e0da' : 'none' }}>
                  <span style={{ fontSize: '15px', fontWeight: 800, color: primary, flexShrink: 0, width: '20px' }}>
                    0{idx + 1}
                  </span>
                  <div>
                    <h4 style={{ fontSize: '13.5px', fontWeight: 500, margin: '0 0 4px 0', color: '#16150f', lineHeight: 1.4 }}>
                      {art.title}
                    </h4>
                    <span style={{ fontSize: '11px', color: '#8d897f' }}>
                      👁️ {art.views || 0} बार पढ़ा गया
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Daily Rashifal Card */}
          <div style={{ background: '#ffffff', border: '1px solid #e3e0da', borderRadius: '10px', overflow: 'hidden', marginBottom: '14px', padding: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
              <span style={{ width: '38px', height: '38px', borderRadius: '50%', background: '#fdeee6', display: 'grid', placeItems: 'center', fontSize: '18px', flexShrink: 0 }}>
                {activeRashiItem.sign}
              </span>
              <div>
                <b style={{ fontFamily: '"Tiro Devanagari Hindi", Georgia, serif', fontSize: '15.5px' }}>{activeRashiItem.name} राशिफल</b>
                <div style={{ fontSize: '11px', color: '#8d897f' }}>
                  शुभ अंक: {activeRashiInfo?.luckyNumber || '7'} | रंग: {activeRashiInfo?.luckyColor || 'केसरिया'}
                </div>
              </div>
              <select 
                value={selectedRashi} 
                onChange={(e) => setSelectedRashi(e.target.value)}
                style={{ marginLeft: 'auto', background: '#fff', border: '1px solid #e3e0da', color: '#5a574f', borderRadius: '6px', padding: '4px 6px', fontSize: '12px', outline: 'none' }}
              >
                {DEFAULT_RASHI_LIST.map(r => (
                  <option key={r.id} value={r.id}>{r.name} ({r.sign})</option>
                ))}
              </select>
            </div>
            <p style={{ fontSize: '13.5px', color: '#5a574f', margin: 0, lineHeight: 1.65 }}>
              {activeRashiInfo?.prediction || `आज ${activeRashiItem.name} राशि के जातकों के लिए नए अवसर खुलेंगे। वाणी में मधुरता बनाए रखें।`}
            </p>
          </div>

          {/* Sidebar 300x250 Ad */}
          <div style={{ background: '#ffffff', border: '1px solid #e3e0da', borderRadius: '10px', height: '260px', display: 'grid', placeItems: 'center', overflow: 'hidden' }}>
            {sidebarAd ? (
              <a href={sidebarAd.targetUrl || '#'} target="_blank" rel="noopener noreferrer" style={{ display: 'block', width: '100%', height: '100%' }}>
                <img src={sidebarAd.imageUrl} alt={sidebarAd.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </a>
            ) : (
              <span style={{ color: '#8d897f', fontSize: '12px' }}>विज्ञापन · 300 × 250</span>
            )}
          </div>

        </aside>

      </div>

      {/* 4. DYNAMIC FOOTER */}
      <Footer 
        siteName={siteConfig?.name || 'द लोकल लीडर'} 
        primaryColor={primary}
        logoUrl={siteConfig?.logoUrl || `/logos/${currentSlug}.jpeg`}
        tagline={siteConfig?.description || '— जनता की आवाज़, सच्चाई के साथ —'}
      />

    </div>
  );
}