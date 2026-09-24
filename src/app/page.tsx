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
  tags?: string[];
  videoUrl?: string;
}

interface AdItem {
  id: string;
  name: string;
  zone: string;
  imageUrl: string;
  targetUrl?: string;
  status: string;
}

interface ClassifiedItem {
  id: string;
  title: string;
  category?: string;
  city?: string;
  price?: string;
  contactNumber?: string;
  imageUrl?: string;
  status?: string;
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

interface LiveBlogData {
  title: string;
  siteId: string;
  youtubeId: string;
  isActive: boolean;
  updates?: { id: string; time: string; update: string }[];
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
  { key: 'लाइव', icon: '🔴' },
  { key: 'वीडियो', icon: '📹' },
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
  const [inFeedAds, setInFeedAds] = useState<AdItem[]>([]);
  const [classifiedAds, setClassifiedAds] = useState<ClassifiedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('होम');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTrendTag, setActiveTrendTag] = useState('');
  const [readerUser, setReaderUser] = useState<any>(null);

  // Live Stream Session State
  const [liveSession, setLiveSession] = useState<LiveBlogData | null>(null);

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

  // Dedicated routing for external pages like /videos, /epaper, /shok-sandesh
  const handleCategoryClick = (cat: string) => {
    if (cat === 'वीडियो') { router.push(`/videos?site=${currentSlug}`); return; }
    if (cat === 'ई-पेपर') { router.push(`/epaper?site=${currentSlug}`); return; }
    if (cat === 'शोक संदेश') { router.push(`/shok-sandesh?site=${currentSlug}`); return; }
    if (cat === 'सर्च') { setSearchModalOpen(true); return; }
    setActiveCategory(cat);
    setActiveTrendTag('');
    setSearchTerm('');
    setDrawerOpen(false);
  };

  const handleTrendTagClick = (tag: string) => {
    if (activeTrendTag === tag) {
      setActiveTrendTag('');
    } else {
      setActiveTrendTag(tag);
      setActiveCategory('होम');
      setSearchTerm('');
    }
  };

  useEffect(() => {
    const updateDate = () => {
      const days = ['रविवार', 'सोमवार', 'मंगलवार', 'बुधवार', 'गुरुवार', 'शुक्रवार', 'शनिवार'];
      const months = ['जनवरी','फरवरी','मार्च','अप्रैल','मई','जून','जुलाई','अगस्त','सितंबर','अक्टूबर','नवंबर','दिसंबर'];
      const now = new Date();
      setCurrentHindiDate(`${days[now.getDay()]}, ${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`);
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
          diesel: data.diesel || '₹95.20', petrol: data.petrol || '₹102.12',
          nifty: data.nifty || '23,897.7 points', niftyChange: data.niftyChange || '-16.70', niftyPositive: data.niftyPositive ?? false,
          sensex: data.sensex || '76,642.81 points', sensexChange: data.senseChange || '+72.41', sensexPositive: data.sensexPositive ?? true,
          silver: data.silver || '₹2,50,000', gold: data.gold || '₹1,56,810'
        });
      }
    });
    return () => unsubMarket();
  }, []);

  useEffect(() => {
    const cached = localStorage.getItem('reader_user');
    if (cached) { try { setReaderUser(JSON.parse(cached)); } catch (e) { console.error(e); } }
  }, []);

  const handleReaderLogout = () => { localStorage.removeItem('reader_user'); setReaderUser(null); };

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const activeSiteSlug = urlParams.get('site') || 'the-local-leader';
    setCurrentSlug(activeSiteSlug);

    const unsubSite = onSnapshot(doc(db, 'sites', activeSiteSlug), (snap) => {
      if (snap.exists()) { setSiteConfig({ slug: activeSiteSlug, ...snap.data() }); }
      else {
        setSiteConfig({ slug: activeSiteSlug, name: 'The Local Leader', primaryColor: '#ea580c', secondaryColor: '#1e242b', headerBg: '#ffffff', logoUrl: `/logos/${activeSiteSlug}.jpeg`, description: '— जनता की आवाज़, सच्चाई के साथ —' });
      }
    });

    // Live Stream check for this portal or all network
    const unsubLive = onSnapshot(doc(db, 'live_blogs', activeSiteSlug), (snap) => {
      if (snap.exists() && snap.data().isActive) {
        setLiveSession(snap.data() as LiveBlogData);
      } else {
        onSnapshot(doc(db, 'live_blogs', 'all'), (allSnap) => {
          if (allSnap.exists() && allSnap.data().isActive) {
            setLiveSession(allSnap.data() as LiveBlogData);
          } else {
            setLiveSession(null);
          }
        });
      }
    });

    async function loadData() {
      setLoading(true);
      try {
        const qArt = query(collection(db, 'articles'), where('siteId', 'in', [activeSiteSlug, activeSiteSlug.toLowerCase()]));
        const artSnap = await getDocs(qArt);
        const approvedArticles = artSnap.docs
          .map(d => ({ id: d.id, ...d.data() } as ArticleItem))
          .filter(art => { const s = String(art.status || '').trim().toLowerCase(); return s === 'published' || s === 'approved'; });
        setArticles(approvedArticles);

        const qAds = query(collection(db, 'ads'));
        const adSnap = await getDocs(qAds);
        setHeaderAd(null); setSidebarAd(null);
        const feedAdsList: AdItem[] = [];

        adSnap.docs.forEach(docSnap => {
          const rawData = docSnap.data();
          const adStatus = String(rawData.status || '').trim().toLowerCase();
          if (adStatus === 'active') {
            const cleanAd: AdItem = { id: docSnap.id, name: rawData.name || '', zone: rawData.zone || '', imageUrl: rawData.imageUrl || '', targetUrl: rawData.targetUrl || '', status: adStatus };
            const adRef = doc(db, 'ads', docSnap.id);
            updateDoc(adRef, { impressions: increment(1) }).catch(() => { updateDoc(doc(db, 'advertisements', docSnap.id), { impressions: increment(1) }).catch(() => {}); });
            if (cleanAd.zone?.includes('728') || cleanAd.zone?.includes('हेडर') || cleanAd.zone?.includes('header')) { 
              setHeaderAd(cleanAd); 
            } else if (cleanAd.zone?.includes('300') || cleanAd.zone?.includes('साइडबार') || cleanAd.zone?.includes('sidebar')) { 
              setSidebarAd(cleanAd); 
            } else {
              feedAdsList.push(cleanAd);
            }
          }
        });
        setInFeedAds(feedAdsList);
      } catch (err) { console.error('Error loading home data:', err); }
      setLoading(false);
    }
    loadData();

    const unsubClassifieds = onSnapshot(collection(db, 'classifieds'), (snap) => {
      const list: ClassifiedItem[] = [];
      snap.forEach((d) => {
        const data = d.data();
        const st = String(data.status || 'active').toLowerCase();
        if (st === 'active' || st === 'approved') {
          list.push({ id: d.id, ...data } as ClassifiedItem);
        }
      });
      setClassifiedAds(list.slice(0, 4));
    });

    const unsubRashifal = onSnapshot(collection(db, 'rashifal'), (snap) => {
      const map: Record<string, any> = {};
      snap.docs.forEach(d => { map[d.id] = d.data(); });
      setRashifalData(map);
    });

    return () => { unsubSite(); unsubLive(); unsubRashifal(); unsubClassifieds(); };
  }, []);

  const primary = siteConfig?.primaryColor || '#ea580c';
  const headerBg = siteConfig?.headerBg || '#ffffff';
  const siteFont = siteConfig?.fontFamily || '"Mukta", system-ui, -apple-system, sans-serif';

  // ── Articles Filtering Logic ──
  const filteredArticles = articles.filter(art => {
    const rawStatus = String(art.status || '').trim().toLowerCase();
    if (rawStatus !== 'published' && rawStatus !== 'approved') return false;

    // 'लाइव' tab par niche normal news feed nahi aayegi
    if (activeCategory === 'लाइव') {
      return false;
    }

    // Trending Tag Filter
    if (activeTrendTag) {
      const tag = activeTrendTag.trim();
      const contentStr = `${art.title || ''} ${art.titleHi || ''} ${art.summary || ''} ${art.category || ''}`.toLowerCase();
      
      if (tag === 'बजट सत्र') return contentStr.includes('बजट') || contentStr.includes('सत्र') || art.category === 'व्यापार' || art.category === 'राजनीति';
      if (tag === 'पंचायत चुनाव') return contentStr.includes('चुनाव') || contentStr.includes('पंचायत') || art.category === 'राजनीति';
      if (tag === 'बारिश का मौसम') return contentStr.includes('बारिश') || contentStr.includes('मौसम') || art.category === 'राज्य' || art.category === 'जीवनशैली';
      if (tag === 'मंडी भाव') return contentStr.includes('मंडी') || contentStr.includes('भाव') || contentStr.includes('बाजार') || art.category === 'व्यापार';
      if (tag === 'भर्ती परिणाम') return contentStr.includes('भर्ती') || contentStr.includes('परीक्षा') || contentStr.includes('परिणाम') || art.category === 'शिक्षा' || art.category === 'राज्य';
      if (tag === 'बिजली दर') return contentStr.includes('बिजली') || contentStr.includes('दर') || art.category === 'राज्य' || art.category === 'व्यापार';
      if (tag === 'क्रिकेट लीग') return contentStr.includes('क्रिकेट') || contentStr.includes('मैच') || contentStr.includes('लीग') || art.category === 'खेल';
      return contentStr.includes(tag.toLowerCase());
    }

    // Normal Category Filter
    const matchesCategory =
      activeCategory === 'होम' || activeCategory === 'ताज़ा खबरें' || activeCategory === 'राशिफल' ||
      art.category?.toLowerCase() === activeCategory.toLowerCase() ||
      (activeCategory === 'राजनीति' && (art.category === 'Politics' || art.category === 'राजनीति')) ||
      (activeCategory === 'व्यापार' && (art.category === 'Business' || art.category === 'व्यापार')) ||
      (activeCategory === 'स्वास्थ्य' && (art.category === 'Health' || art.category === 'स्वास्थ्य')) ||
      (activeCategory === 'जीवनशैली' && (art.category === 'Lifestyle' || art.category === 'जीवनशैली')) ||
      (activeCategory === 'अपराध' && (art.category === 'Crime' || art.category === 'अपराध')) ||
      (activeCategory === 'खेल' && (art.category === 'Sports' || art.category === 'खेल')) ||
      (activeCategory === 'राज्य' && (art.category === 'National' || art.category === 'राज्य'));

    const cleanSearch = searchTerm.trim().toLowerCase();
    const matchesSearch = !cleanSearch || (art.title && art.title.toLowerCase().includes(cleanSearch)) || (art.titleHi && art.titleHi.toLowerCase().includes(cleanSearch)) || (art.summary && art.summary.toLowerCase().includes(cleanSearch));
    return matchesCategory && matchesSearch;
  });

  // Live video player will display in Home news feed and in Live dedicated category
  const showLiveInFeed = Boolean(liveSession && liveSession.isActive && liveSession.youtubeId && 
    (activeCategory === 'होम' || activeCategory === 'ताज़ा खबरें' || activeCategory === 'लाइव'));

  const activeRashiItem = DEFAULT_RASHI_LIST.find(r => r.id === selectedRashi) || DEFAULT_RASHI_LIST[0];
  const activeRashiInfo = rashifalData[selectedRashi];

  const tint = (hex: string, op: number) => {
    const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${op})`;
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f4f3f0', color: '#1a1a1a', fontFamily: siteFont, fontSize: '15px', lineHeight: 1.6, display: 'flex', flexDirection: 'column', width: '100%', overflowX: 'hidden' }}>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Tiro+Devanagari+Hindi:ital@0;1&family=Mukta:wght@300;400;500;600;700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { max-width: 100vw; overflow-x: hidden; top: 0 !important; }
        a { text-decoration: none; color: inherit; }
        button { font-family: inherit; }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* ── PREVENT GOOGLE TRANSLATE BANNER SHIFT ── */
        body { top: 0px !important; position: static !important; }
        .goog-te-banner-frame { display: none !important; }
        .skiptranslate { display: none !important; }
        body > .skiptranslate { display: none !important; }
        #goog-gt-tt { display: none !important; top: 0px !important; }

        /* ── 3-COLUMN SHELL ── */
        .shell {
          max-width: 1400px; margin: 0 auto; display: grid;
          grid-template-columns: 230px minmax(0, 1fr) 310px;
          gap: 22px; padding: 20px 24px 48px; width: 100%;
        }
        .col-left { position: sticky; top: 76px; align-self: start; max-height: calc(100vh - 90px); overflow-y: auto; }
        .col-right { position: sticky; top: 76px; align-self: start; max-height: calc(100vh - 90px); overflow-y: auto; }

        .card { background: #fff; border: 1px solid #eae8e4; border-radius: 14px; overflow: hidden; transition: box-shadow .2s ease; }
        .card:hover { box-shadow: 0 4px 20px rgba(0,0,0,.06); }
        .art-row { transition: background .15s ease; }
        .art-row:hover { background: #fafaf8 !important; }

        .cat-btn {
          display: flex; align-items: center; gap: 12px; width: 100%;
          padding: 10px 14px; border-radius: 10px; font-size: 14px; font-weight: 500;
          border: none; text-align: left; cursor: pointer; transition: background .15s ease, color .15s ease;
        }
        .cat-btn:hover { background: #f5f4f1; }

        .burger { display: none; background: none; border: none; padding: 6px; cursor: pointer; color: #1a1a1a; flex-shrink: 0; }

        /* ── DESKTOP HEADER ROW ── */
        .header-row {
          max-width: 1400px; margin: 0 auto; display: flex; align-items: center;
          justify-content: space-between; gap: 10px; padding: 0 20px; height: 68px; width: 100%;
        }
        .nav-pills { 
          display: flex; align-items: center; gap: 4px; margin: 0 10px; 
          flex: 1; justify-content: center; min-width: 0; overflow-x: auto;
        }
        .nav-pill {
          display: flex; align-items: center; gap: 4px; background: none; border: none;
          font-size: 13px; font-weight: 600; padding: 6px 11px; border-radius: 20px;
          cursor: pointer; white-space: nowrap; transition: background .15s ease, color .15s ease;
          flex-shrink: 0;
        }
        .nav-pill:hover { background: #f5f4f1; }

        .ad-leader {
          width: 100%; height: 96px; border-radius: 12px; overflow: hidden;
          margin-bottom: 18px; background: #1a1a1a; position: relative;
        }
        .ad-leader a, .ad-leader img { display: block; width: 100%; height: 100%; object-fit: cover; }

        .infeed-ad-banner {
          background: #fafaf8;
          border-top: 1px dashed #e2e8f0;
          border-bottom: 1px dashed #e2e8f0;
          padding: 12px 18px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }

        .portal-link {
          display: inline-flex; align-items: center; gap: 4px; font-size: 11px;
          font-weight: 600; padding: 5px 10px; border-radius: 20px; white-space: nowrap;
          transition: opacity .15s ease;
        }
        .portal-link:hover { opacity: .85; }

        .hero-img { transition: transform .4s ease; }
        .hero-img:hover { transform: scale(1.03); }

        /* ── RESPONSIVE RULES ── */
        @media (max-width: 1280px) {
          .portal-links-wrap { display: none !important; }
        }
        @media (max-width: 1100px) {
          .nav-pills { display: none !important; }
        }
        
        /* ── MOBILE VIEW: FULLY SCROLLABLE NAVBAR ── */
        @media (max-width: 900px) {
          .shell { 
            grid-template-columns: 1fr !important; 
            padding: 14px 12px 36px !important;
            gap: 20px !important;
          }
          .col-left {
            position: fixed; top: 0; bottom: 0; left: 0; width: min(80vw, 300px);
            background: #fff; z-index: 400; padding: 20px 16px; max-height: none;
            box-shadow: 6px 0 30px rgba(0,0,0,.15); transform: translateX(-100%);
            transition: transform .25s cubic-bezier(.4,0,.2,1); border-radius: 0 18px 18px 0;
          }
          .col-left.open { transform: translateX(0); }
          .burger { display: block; }
          .desktop-tools { display: none !important; }
          .mobile-tools { display: flex !important; }
          
          .header-row { 
            padding: 0 8px !important; 
            height: 56px !important; 
            gap: 6px !important; 
            overflow: hidden !important;
            width: 100vw !important;
            max-width: 100vw !important;
          }

          .site-name { font-size: 13.5px !important; max-width: 90px; }
          .site-tag { display: none !important; }

          .col-right {
            display: block !important;
            position: static !important;
            max-height: none !important;
            overflow: visible !important;
            margin-top: 10px;
          }
        }

        @media (min-width: 901px) { 
          .mobile-tools { display: none !important; } 
        }
      `}</style>

      {/* ═══ 1. MARKET TICKER ═══ */}
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

      {/* ═══ 2. HEADER ═══ */}
      <header style={{ position: 'sticky', top: 0, zIndex: 200, background: headerBg, borderBottom: '1px solid #e8e6e2', boxShadow: '0 1px 4px rgba(0,0,0,.04)', width: '100%' }}>
        <div className="header-row">

          {/* Left: Brand Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
            <button className="burger" onClick={() => setDrawerOpen(true)} aria-label="मेनू">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M4 6h16M4 12h16M4 18h16"/></svg>
            </button>
            <Link href={`/?site=${currentSlug}`} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <img src={siteConfig?.logoUrl || `/logos/${currentSlug}.jpeg`} alt={siteConfig?.name || 'The Local Leader'} style={{ height: '32px', width: 'auto', objectFit: 'contain', borderRadius: '5px' }} />
              <div style={{ minWidth: 0 }}>
                <span className="site-name" style={{ fontFamily: '"Tiro Devanagari Hindi", Georgia, serif', fontSize: '16px', fontWeight: 600, color: '#1a1a1a', lineHeight: 1.15, display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {siteConfig?.name || 'द लोकल लीडर'}
                </span>
                <span className="site-tag" style={{ display: 'block', fontSize: '9px', color: '#999', whiteSpace: 'nowrap', letterSpacing: '.02em' }}>
                  {siteConfig?.description || 'जनता की आवाज़, सच्चाई के साथ'}
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Nav Pills */}
          <nav className="nav-pills hide-scrollbar">
            {[
              { key: 'होम', emoji: '🏠' },
              { key: 'लाइव', emoji: '🔴' },
              { key: 'वीडियो', emoji: '📹' },
              { key: 'ताज़ा खबरें', emoji: '⚡' },
              { key: 'शोक संदेश', emoji: '🕯️' },
              { key: 'ई-पेपर', emoji: '📄' },
            ].map(({ key, emoji }) => {
              const isActive = activeCategory === key && !activeTrendTag;
              return (
                <button key={key} className="nav-pill" onClick={() => handleCategoryClick(key)}
                  style={{ 
                    color: isActive ? primary : key === 'लाइव' && liveSession?.isActive ? '#ef4444' : '#555', 
                    background: isActive ? tint(primary, 0.08) : 'transparent', 
                    fontWeight: isActive ? 700 : 500 
                  }}>
                  <span style={{ fontSize: '13px' }}>{emoji}</span>{key}
                </button>
              );
            })}
          </nav>

          {/* Desktop Tools */}
          <div className="desktop-tools" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto', flexShrink: 0 }}>
            <div className="portal-links-wrap" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Link href="/patrakar/login" className="portal-link" style={{ color: '#444', background: '#f3f3f1', border: '1px solid #ddd' }}>
                ✍️ पत्रकार
              </Link>
              <Link href="/advertiser/login" className="portal-link" style={{ color: '#444', background: '#f3f3f1', border: '1px solid #ddd' }}>
                📢 विज्ञापन
              </Link>
            </div>

            <button onClick={() => setSearchModalOpen(true)}
              style={{ background: '#f5f4f1', border: '1px solid #e5e3df', borderRadius: '22px', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', color: '#777', fontSize: '12px', flexShrink: 0 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.35-4.35"/></svg>
              खोजें
            </button>

            <div style={{ position: 'relative', zIndex: 999, overflow: 'visible', flexShrink: 0 }}>
              <SiteSwitcher currentSlug={currentSlug} primaryColor={primary} />
            </div>
            
            <div style={{ position: 'relative', zIndex: 999, overflow: 'visible', flexShrink: 0 }}>
              <LanguageTranslator />
            </div>

            {readerUser ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: tint(primary, 0.06), border: `1px solid ${tint(primary, 0.25)}`, borderRadius: '22px', padding: '5px 12px', flexShrink: 0 }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: primary }}>👤 {readerUser.name ? readerUser.name.slice(0, 6) : 'यूज़र'}</span>
                <button onClick={handleReaderLogout} style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '11px', cursor: 'pointer', fontWeight: 800, lineHeight: 1 }}>✕</button>
              </div>
            ) : (
              <Link href="/login" style={{ background: primary, color: '#fff', borderRadius: '22px', padding: '7px 16px', fontSize: '12.5px', fontWeight: 600, whiteSpace: 'nowrap', display: 'inline-block', flexShrink: 0 }}>
                लॉगिन
              </Link>
            )}
          </div>

          {/* Mobile Tools */}
          <div 
            className="mobile-tools hide-scrollbar" 
            style={{ 
              display: 'none', 
              alignItems: 'center', 
              gap: '6px', 
              flex: 1, 
              minWidth: 0, 
              overflowX: 'auto', 
              WebkitOverflowScrolling: 'touch', 
              touchAction: 'pan-x', 
              padding: '4px 2px 4px 6px' 
            }}
          >
            <button onClick={() => setSearchModalOpen(true)} aria-label="सर्च"
              style={{ background: '#f5f4f1', border: '1px solid #e5e3df', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#777" strokeWidth="2.2" strokeLinecap="round"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.35-4.35"/></svg>
            </button>
            
            <div style={{ flexShrink: 0 }}>
              <SiteSwitcher currentSlug={currentSlug} primaryColor={primary} />
            </div>

            <div style={{ flexShrink: 0 }}>
              <LanguageTranslator />
            </div>

            {readerUser ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '3px', background: tint(primary, 0.08), border: `1px solid ${tint(primary, 0.2)}`, borderRadius: '18px', padding: '4px 8px', flexShrink: 0 }}>
                <span style={{ fontSize: '11px', fontWeight: 600, color: primary }}>👤</span>
                <button onClick={handleReaderLogout} style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '10px', cursor: 'pointer', fontWeight: 800 }}>✕</button>
              </div>
            ) : (
              <Link href="/login" style={{ background: primary, color: '#fff', borderRadius: '18px', padding: '5px 12px', fontSize: '11.5px', fontWeight: 600, whiteSpace: 'nowrap', flexShrink: 0 }}>
                लॉगिन
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* ═══ SEARCH MODAL ═══ */}
      {searchModalOpen && (
        <div onClick={(e) => { if (e.target === e.currentTarget) setSearchModalOpen(false); }}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', backdropFilter: 'blur(4px)', zIndex: 500, display: 'flex', justifyContent: 'center', padding: '90px 16px 0' }}>
          <div style={{ width: '100%', maxWidth: '580px', background: '#fff', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 24px 60px rgba(0,0,0,.2)', alignSelf: 'flex-start' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 18px', borderBottom: '1px solid #eee' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.35-4.35"/></svg>
              <input type="search" placeholder="खबर, विषय या कीवर्ड लिखें..." value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setActiveTrendTag(''); }} autoFocus
                style={{ width: '100%', border: 'none', outline: 'none', fontSize: '15px', color: '#1a1a1a', background: 'transparent' }} />
              <button onClick={() => setSearchModalOpen(false)}
                style={{ background: '#f5f4f1', border: '1px solid #e5e3df', borderRadius: '8px', padding: '4px 12px', fontSize: '11.5px', color: '#888', cursor: 'pointer', whiteSpace: 'nowrap', fontWeight: 500 }}>
                Esc
              </button>
            </div>
            {searchTerm && <div style={{ padding: '12px 18px', fontSize: '13px', color: '#999' }}>&ldquo;{searchTerm}&rdquo; के लिए परिणाम देखें…</div>}
          </div>
        </div>
      )}

      {drawerOpen && <div onClick={() => setDrawerOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.35)', backdropFilter: 'blur(2px)', zIndex: 390 }} />}

      {/* ═══ 3. THREE-COLUMN SHELL ═══ */}
      <div className="shell">

        {/* ── LEFT SIDEBAR ── */}
        <aside className={`col-left ${drawerOpen ? 'open' : ''}`}>
          <div style={{ display: drawerOpen ? 'flex' : 'none', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
            <span style={{ fontFamily: '"Tiro Devanagari Hindi", Georgia, serif', fontSize: '16px', fontWeight: 600 }}>श्रेणियाँ</span>
            <button onClick={() => setDrawerOpen(false)} style={{ background: '#f5f4f1', border: '1px solid #e5e3df', borderRadius: '8px', width: '30px', height: '30px', display: 'grid', placeItems: 'center', cursor: 'pointer', fontSize: '14px', color: '#888' }}>✕</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {CATEGORY_LIST.map(({ key, icon }) => {
              const isActive = activeCategory === key && !activeTrendTag;
              return (
                <button key={key} className="cat-btn" onClick={() => handleCategoryClick(key)}
                  style={{ color: isActive ? primary : key === 'लाइव' && liveSession?.isActive ? '#ef4444' : '#555', background: isActive ? tint(primary, 0.07) : 'transparent', fontWeight: 600 }}>
                  <span style={{ width: '30px', height: '30px', borderRadius: '8px', background: isActive ? primary : key === 'लाइव' && liveSession?.isActive ? '#ef444422' : '#f0efec', color: isActive ? '#fff' : key === 'लाइव' && liveSession?.isActive ? '#ef4444' : '#888', display: 'grid', placeItems: 'center', fontSize: '14px', flexShrink: 0, transition: 'background .15s ease, color .15s ease' }}>
                    {icon}
                  </span>
                  {key}
                </button>
              );
            })}
          </div>

          <div style={{ marginTop: '28px', paddingTop: '20px', borderTop: '1px solid #eae8e4' }}>
            <div style={{ fontSize: '11px', color: '#aaa', fontWeight: 600, marginBottom: '10px', textAlign: 'center', letterSpacing: '.04em' }}>ऐप डाउनलोड करें</div>
            <a href="#" onClick={(e) => { e.preventDefault(); alert('Google Play Store लिंक जल्द उपलब्ध होगा!'); }}
              style={{ display: 'flex', alignItems: 'center', gap: '10px', border: '1px solid #eae8e4', borderRadius: '10px', padding: '8px 12px', marginBottom: '6px', background: '#fafaf8' }}>
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
            <a href="#" onClick={(e) => { e.preventDefault(); alert('Apple App Store लिंक जल्द उपलब्ध होगा!'); }}
              style={{ display: 'flex', alignItems: 'center', gap: '10px', border: '1px solid #eae8e4', borderRadius: '10px', padding: '8px 12px', marginBottom: '6px', background: '#fafaf8' }}>
              <svg width="20" height="24" viewBox="0 0 170 170" fill="#1a1a1a">
                <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.2-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.28 2.13-9.54 3.24-12.8 3.35-4.92.21-9.84-1.96-14.75-6.52-3.13-2.73-7.04-7.41-11.75-14.04-5.03-7.08-9.17-15.29-12.41-24.65-3.47-10.2-5.21-20.07-5.21-29.59 0-10.95 2.36-20.4 7.09-28.32 3.72-6.36 8.67-11.39 14.87-15.08 6.2-3.7 12.9-5.58 20.12-5.73 3.92 0 9.06 1.21 15.43 3.59 6.35 2.39 10.43 3.61 12.22 3.61 1.34 0 5.87-1.43 13.56-4.29 7.27-2.65 13.41-3.75 18.44-3.32 13.62 1.1 23.85 6.47 30.65 16.15-12.19 7.39-18.22 17.73-18.1 31.01.11 10.34 3.86 18.95 11.23 25.8 3.34 3.17 7.07 5.62 11.22 7.36-.9 2.61-1.85 5.11-2.86 7.51zM119.11 7.24c0 8.1-2.96 15.67-8.86 22.67-7.12 8.32-15.73 13.13-25.07 12.37a25.2 25.2 0 01-.19-3.07c0-7.78 3.39-16.1 9.4-22.9 3-3.44 6.82-6.31 11.45-8.6 4.62-2.26 8.99-3.51 13.1-3.71.12 1.1.17 2.2.17 3.24z"/>
              </svg>
              <div>
                <div style={{ fontSize: '9px', color: '#aaa', lineHeight: 1.2 }}>Download on the</div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#1a1a1a' }}>App Store</div>
              </div>
            </a>
          </div>
        </aside>

        {/* ── CENTER COLUMN (MAIN NEWS FEED & LIVE FEED) ── */}
        <main style={{ minWidth: 0 }}>

          <div className="ad-leader">
            {headerAd ? (
              <a href={headerAd.targetUrl || '#'} target="_blank" rel="noopener noreferrer" onClick={() => handleAdClick(headerAd)}>
                <img src={headerAd.imageUrl} alt={headerAd.name} />
              </a>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#555', fontSize: '11px' }}>
                विज्ञापन · 728 × 90
              </div>
            )}
          </div>

          {/* 🔴 LIVE VIDEO FEED CARD */}
          {showLiveInFeed && (
            <div className="card" style={{ marginBottom: '20px', border: '2px solid #ef4444', overflow: 'hidden', boxShadow: '0 4px 22px rgba(239, 68, 68, 0.18)' }}>
              
              <div style={{ backgroundColor: '#ef4444', color: '#fff', padding: '10px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#fff', animation: 'spin 1.2s linear infinite' }} />
                  <b style={{ fontSize: '12px', letterSpacing: '1px', textTransform: 'uppercase' }}>
                    🔴 LIVE STREAM NOW PLAYING
                  </b>
                </div>
                <span style={{ fontSize: '11px', fontWeight: 700, backgroundColor: 'rgba(0,0,0,0.3)', padding: '3px 10px', borderRadius: '12px' }}>
                  {siteConfig?.name || 'द लोकल लीडर'}
                </span>
              </div>

              <div style={{ width: '100%', aspectRatio: '16/9', backgroundColor: '#000' }}>
                <iframe
                  width="100%"
                  height="100%"
                  src={`https://www.youtube.com/embed/${liveSession!.youtubeId}?autoplay=1&mute=0`}
                  title={liveSession!.title || 'YouTube Live News'}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>

              <div style={{ padding: '14px 18px', backgroundColor: '#fff' }}>
                <h3 style={{ fontSize: '17px', fontWeight: 800, margin: '0 0 8px', color: '#0f172a', lineHeight: 1.35 }}>
                  {liveSession!.title}
                </h3>

                {liveSession!.updates && liveSession!.updates.length > 0 && (
                  <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px dashed #e2e8f0' }}>
                    <span style={{ fontSize: '11px', fontWeight: 800, color: '#ef4444', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '6px' }}>
                      ⚡ ताज़ा लाइव अपडेट्स (Live Updates):
                    </span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {[...liveSession!.updates].slice(-3).reverse().map((u) => (
                        <div key={u.id} style={{ fontSize: '13px', color: '#334155', display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                          <span style={{ color: '#ef4444', fontWeight: 800, flexShrink: 0 }}>[{u.time}]</span>
                          <span>{u.update}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── TRENDING TAGS (HOME MODE) ── */}
          {activeCategory !== 'लाइव' && (
            <div style={{ background: '#fff', border: '1px solid #eae8e4', borderRadius: '14px', display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 16px', marginBottom: '18px' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: primary, flexShrink: 0, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={primary} strokeWidth="2.5" strokeLinecap="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
                ट्रेंडिंग
              </span>
              <div className="hide-scrollbar" style={{ display: 'flex', gap: '6px', overflowX: 'auto', whiteSpace: 'nowrap', flex: 1 }}>
                {TRENDING_TAGS.map((t) => {
                  const isTagActive = activeTrendTag === t;
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => handleTrendTagClick(t)}
                      style={{
                        fontSize: '12.5px',
                        fontWeight: isTagActive ? 600 : 500,
                        border: `1px solid ${isTagActive ? primary : '#eae8e4'}`,
                        borderRadius: '20px',
                        padding: '5px 14px',
                        color: isTagActive ? '#fff' : '#555',
                        background: isTagActive ? primary : '#fff',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        outline: 'none',
                        transition: 'all .15s ease',
                      }}
                    >
                      {t}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Section Heading for Live Mode */}
          {activeCategory === 'लाइव' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', padding: '0 4px' }}>
              <span style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#ef4444' }} />
              <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#ef4444', margin: 0 }}>
                लाइव प्रसारण (Live Stream)
              </h2>
            </div>
          )}

          {/* ── ARTICLES FEED (Hidden in 'लाइव' tab so that only Live Stream is visible) ── */}
          {activeCategory === 'लाइव' ? (
            !showLiveInFeed && (
              <div className="card" style={{ padding: '60px 20px', textAlign: 'center' }}>
                <span style={{ fontSize: '42px', display: 'block', marginBottom: '12px', opacity: 0.5 }}>📡</span>
                <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#1e293b', marginBottom: '6px' }}>
                  वर्तमान में कोई लाइव प्रसारण सक्रिय नहीं है
                </h3>
                <p style={{ fontSize: '13px', color: '#94a3b8' }}>
                  जैसे ही कोई विशेष लाइव कवरेज शुरू होगी, वह यहाँ प्रदर्शित हो जाएगी।
                </p>
              </div>
            )
          ) : loading ? (
            <div className="card" style={{ padding: '60px 20px', textAlign: 'center' }}>
              <div style={{ width: '32px', height: '32px', border: `3px solid ${tint(primary, 0.2)}`, borderTopColor: primary, borderRadius: '50%', animation: 'spin .7s linear infinite', margin: '0 auto 14px' }} />
              <span style={{ color: '#999', fontSize: '14px' }}>खबरें लोड हो रही हैं…</span>
            </div>
          ) : filteredArticles.length === 0 && !showLiveInFeed ? (
            <div className="card" style={{ padding: '50px 24px', textAlign: 'center' }}>
              <div style={{ fontSize: '36px', marginBottom: '12px', opacity: .4 }}>📭</div>
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#1a1a1a', marginBottom: '6px' }}>
                {activeTrendTag ? `"${activeTrendTag}" के लिए कोई खबर नहीं मिली` : searchTerm ? `"${searchTerm}" के लिए कोई खबर नहीं मिली` : 'अभी कोई स्वीकृत खबर उपलब्ध नहीं है'}
              </h3>
              <p style={{ color: '#999', fontSize: '13px' }}>संपादक द्वारा समीक्षा एवं अनुमोदन के बाद ही खबरें यहां प्रदर्शित होती हैं।</p>
            </div>
          ) : (
            <div className="card" style={{ overflow: 'hidden' }}>
              {filteredArticles[0] && (
                <article style={{ borderBottom: '1px solid #eae8e4' }}>
                  <Link href={`/article/${filteredArticles[0].id}?site=${currentSlug}`}>
                    <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', overflow: 'hidden', background: '#e8e6e2' }}>
                      <img className="hero-img" src={filteredArticles[0].image || 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=1200'} alt={filteredArticles[0].title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      
                      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(transparent, rgba(0,0,0,.7))', padding: '40px 20px 16px' }}>
                        <span style={{ display: 'inline-block', background: primary, color: '#fff', fontSize: '10.5px', fontWeight: 700, padding: '3px 10px', borderRadius: '4px', marginBottom: '8px' }}>
                          {filteredArticles[0].category || 'ताज़ा खबर'}
                        </span>
                        <h2 style={{ fontFamily: '"Tiro Devanagari Hindi", Georgia, serif', fontSize: '22px', fontWeight: 500, lineHeight: 1.45, color: '#fff', margin: 0 }}>
                          {filteredArticles[0].title}
                        </h2>
                      </div>
                    </div>
                    <div style={{ padding: '14px 20px 16px' }}>
                      {filteredArticles[0].summary && <p style={{ fontSize: '14px', color: '#666', lineHeight: 1.65, margin: '0 0 12px' }}>{filteredArticles[0].summary}</p>}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px', color: '#aaa' }}>
                        <span>{filteredArticles[0].createdAt ? String(filteredArticles[0].createdAt).split('T')[0] : currentHindiDate}</span>
                        <span style={{ width: '3px', height: '3px', borderRadius: '50%', background: '#ccc', flexShrink: 0 }} />
                        <span>👁 {filteredArticles[0].views || 0} बार पढ़ा गया</span>
                      </div>
                    </div>
                  </Link>
                </article>
              )}

              {filteredArticles.slice(1).map((item, index) => {
                const showAd = (index + 1) % 3 === 0;
                const adIndex = Math.floor(index / 3) % (inFeedAds.length || 1);
                const currentInFeedAd = inFeedAds[adIndex];

                return (
                  <div key={item.id}>
                    <article className="art-row" style={{ borderBottom: '1px solid #eae8e4' }}>
                      <Link href={`/article/${item.id}?site=${currentSlug}`} style={{ display: 'flex', gap: '14px', alignItems: 'flex-start', padding: '14px 20px' }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <span style={{ fontSize: '10px', fontWeight: 700, color: primary, letterSpacing: '.03em' }}>{item.category}</span>
                          <h4 style={{ fontFamily: '"Tiro Devanagari Hindi", Georgia, serif', fontSize: '16px', fontWeight: 500, margin: '3px 0 8px', color: '#1a1a1a', lineHeight: 1.45 }}>{item.title}</h4>
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

                    {showAd && (
                      <div className="infeed-ad-banner">
                        <span style={{ fontSize: '9.5px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px', alignSelf: 'flex-start' }}>
                          प्रायोजित / विज्ञापन
                        </span>
                        {currentInFeedAd ? (
                          <a 
                            href={currentInFeedAd.targetUrl || '#'} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            onClick={() => handleAdClick(currentInFeedAd)}
                            style={{ display: 'block', width: '100%', maxHeight: '110px', overflow: 'hidden', borderRadius: '8px' }}
                          >
                            <img src={currentInFeedAd.imageUrl} alt={currentInFeedAd.name} style={{ width: '100%', height: 'auto', maxHeight: '110px', objectFit: 'cover', borderRadius: '8px' }} />
                          </a>
                        ) : (
                          <div style={{ width: '100%', height: '80px', background: '#f1f5f9', border: '1px dashed #cbd5e1', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', color: '#64748b', fontSize: '12px' }}>
                            <span>📢</span>
                            <b>विज्ञापन स्थान (In-Feed Sponsored Ad)</b>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </main>

        {/* ── RIGHT SIDEBAR ── */}
        <aside className="col-right">

          <div className="card" style={{ marginBottom: '18px' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid #eae8e4', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={primary} strokeWidth="2" strokeLinecap="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
              <h3 style={{ fontFamily: '"Tiro Devanagari Hindi", Georgia, serif', fontSize: '16px', fontWeight: 600, margin: 0 }}>सबसे ज़्यादा पढ़ी गईं</h3>
            </div>
            <div>
              {filteredArticles.slice(0, 5).map((art, idx) => (
                <Link key={art.id} href={`/article/${art.id}?site=${currentSlug}`} className="art-row"
                  style={{ display: 'flex', gap: '12px', padding: '12px 18px', borderBottom: idx < 4 ? '1px solid #f0efec' : 'none', alignItems: 'flex-start' }}>
                  <span style={{ fontFamily: '"Mukta", sans-serif', fontSize: '22px', fontWeight: 800, color: tint(primary, 0.25), lineHeight: 1, flexShrink: 0, width: '24px' }}>{idx + 1}</span>
                  <div style={{ minWidth: 0 }}>
                    <h4 style={{ fontSize: '13px', fontWeight: 500, margin: '0 0 3px', color: '#1a1a1a', lineHeight: 1.45, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' } as any}>{art.title}</h4>
                    <span style={{ fontSize: '10.5px', color: '#bbb' }}>👁 {art.views || 0} बार पढ़ा गया</span>
                  </div>
                </Link>
              ))}
              {filteredArticles.length === 0 && <div style={{ padding: '24px', textAlign: 'center', fontSize: '13px', color: '#ccc' }}>कोई खबर नहीं</div>}
            </div>
          </div>

          <div className="card" style={{ marginBottom: '18px', border: `1.5px solid ${tint(primary, 0.2)}` }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #eae8e4', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: tint(primary, 0.04) }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '15px' }}>📋</span>
                <h3 style={{ fontFamily: '"Tiro Devanagari Hindi", Georgia, serif', fontSize: '15px', fontWeight: 700, margin: 0, color: primary }}>
                  क्लासिफाइड विज्ञापन
                </h3>
              </div>
              <Link href={`/classifieds?site=${currentSlug}`} style={{ fontSize: '11px', color: primary, fontWeight: 700 }}>
                सभी देखें →
              </Link>
            </div>

            <div style={{ padding: '12px 16px' }}>
              {classifiedAds.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '18px 12px', background: '#fafaf8', border: '1px dashed #d1d5db', borderRadius: '10px' }}>
                  <span style={{ fontSize: '24px', display: 'block', marginBottom: '6px', opacity: 0.6 }}>📢</span>
                  <p style={{ margin: '0 0 4px', fontSize: '12.5px', fontWeight: 600, color: '#475569' }}>
                    अभी कोई सक्रिय क्लासिफाइड विज्ञापन नहीं है
                  </p>
                  <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                    विज्ञापन हेतु विज्ञापनदाता पोर्टल से संपर्क करें
                  </span>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {classifiedAds.map((c) => (
                    <Link key={c.id} href={`/classifieds?site=${currentSlug}`} style={{ display: 'flex', gap: '10px', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid #f5f4f1' }}>
                      <div style={{ width: '42px', height: '42px', borderRadius: '6px', background: '#f1f5f9', display: 'grid', placeItems: 'center', flexShrink: 0, overflow: 'hidden' }}>
                        {c.imageUrl ? (
                          <img src={c.imageUrl} alt={c.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <span style={{ fontSize: '16px' }}>🏷️</span>
                        )}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '10px', color: primary, fontWeight: 700, textTransform: 'uppercase' }}>
                          {c.category || 'वर्गीकृत'} {c.city ? `· ${c.city}` : ''}
                        </div>
                        <h5 style={{ fontSize: '12.5px', fontWeight: 600, color: '#1a1a1a', margin: '1px 0', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                          {c.title}
                        </h5>
                        {c.price && <span style={{ fontSize: '11px', color: '#059669', fontWeight: 700 }}>₹{c.price}</span>}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="card" style={{ marginBottom: '18px', padding: '16px 18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <span style={{ width: '40px', height: '40px', borderRadius: '50%', background: `linear-gradient(135deg, ${tint(primary, 0.12)}, ${tint(primary, 0.04)})`, display: 'grid', placeItems: 'center', fontSize: '20px', flexShrink: 0 }}>{activeRashiItem.sign}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: '"Tiro Devanagari Hindi", Georgia, serif', fontSize: '15px', fontWeight: 600, lineHeight: 1.2 }}>{activeRashiItem.name} राशिफल</div>
                <div style={{ fontSize: '11px', color: '#aaa', marginTop: '2px' }}>शुभ अंक: {activeRashiInfo?.luckyNumber || '7'} · रंग: {activeRashiInfo?.luckyColor || 'केसरिया'}</div>
              </div>
              <select value={selectedRashi} onChange={(e) => setSelectedRashi(e.target.value)}
                style={{ background: '#f5f4f1', border: '1px solid #e5e3df', color: '#555', borderRadius: '8px', padding: '5px 8px', fontSize: '11.5px', outline: 'none', cursor: 'pointer' }}>
                {DEFAULT_RASHI_LIST.map(r => <option key={r.id} value={r.id}>{r.name} {r.sign}</option>)}
              </select>
            </div>
            <p style={{ fontSize: '13px', color: '#666', margin: 0, lineHeight: 1.7 }}>
              {activeRashiInfo?.prediction || `आज ${activeRashiItem.name} राशि के जातकों के लिए नए अवसर खुलेंगे। वाणी में मधुरता बनाए रखें।`}
            </p>
          </div>

          <div className="card" style={{ height: '260px', display: 'grid', placeItems: 'center' }}>
            {sidebarAd ? (
              <a href={sidebarAd.targetUrl || '#'} target="_blank" rel="noopener noreferrer" onClick={() => handleAdClick(sidebarAd)} style={{ display: 'block', width: '100%', height: '100%' }}>
                <img src={sidebarAd.imageUrl} alt={sidebarAd.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </a>
            ) : (
              <span style={{ color: '#ccc', fontSize: '11px' }}>विज्ञापन · 300 × 250</span>
            )}
          </div>
        </aside>
      </div>

      <Footer siteName={siteConfig?.name || 'द लोकल लीडर'} primaryColor={primary} logoUrl={siteConfig?.logoUrl || `/logos/${currentSlug}.jpeg`} tagline={siteConfig?.description || '— जनता की आवाज़, सच्चाई के साथ —'} currentSlug={currentSlug} />
    </div>
  );
}