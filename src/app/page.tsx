'use client';
import { Fragment, useEffect, useState } from 'react';
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
  format?: string;
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
  siteId?: string;
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
  id: string;
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

const TRENDING_TAGS = ['बजट सत्र', 'पंचायत चुनाव', 'बारिश का मौसम', 'मंडी भाव', 'भर्ती परिणाम', 'बिजली दर', 'क्रिकेट लीग'];

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
  { key: 'खेल', icon: '🏏' }
];

/* ─────────────── Styles (sirf design) ─────────────── */
const HP_STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Mukta:wght@400;500;600;700;800&display=swap');
.hp-root{min-height:100vh;background:#f7f6f3;color:#1a1a1a;-webkit-font-smoothing:antialiased}
.hp-root *{box-sizing:border-box}
.hp-root button{font-family:inherit}

.hp-ticker{background:#111;color:#cbd5e1;font-size:12px}
.hp-ticker-in{max-width:1320px;margin:0 auto;padding:7px 16px;display:flex;align-items:center;justify-content:space-between;gap:16px}
.hp-ticker-items{display:flex;align-items:center;gap:10px;overflow-x:auto;white-space:nowrap;scrollbar-width:none}
.hp-ticker-items::-webkit-scrollbar{display:none}
.hp-ticker-sep{color:#444}
.hp-ticker-label{color:#94a3b8;margin-right:4px}
.hp-ticker-date{white-space:nowrap;flex-shrink:0;color:#e2e8f0;font-weight:600}

.hp-header{position:sticky;top:0;z-index:300;border-bottom:1px solid #eae8e4;box-shadow:0 1px 8px rgba(0,0,0,.04)}
.hp-header-in{max-width:1320px;margin:0 auto;padding:10px 16px;display:flex;align-items:center;justify-content:space-between;gap:16px}
.hp-brand-wrap{display:flex;align-items:center;gap:8px;min-width:0}
.hp-menu-btn{display:none;background:none;border:0;padding:6px;cursor:pointer;color:#333;flex-shrink:0}
.hp-brand{display:flex;align-items:center;gap:10px;min-width:0;text-decoration:none;color:inherit}
.hp-logo{height:40px;width:auto;max-width:130px;object-fit:contain;flex-shrink:0}
.hp-site-name{font-size:17px;font-weight:800;margin:0;line-height:1.2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.hp-tagline{font-size:11px;color:#777;margin:2px 0 0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.hp-nav{display:flex;gap:2px}
.hp-nav-btn{border:0;padding:6px 10px;border-radius:20px;font-size:12.5px;cursor:pointer;display:flex;align-items:center;gap:5px;white-space:nowrap;transition:background .15s}
.hp-tools{display:flex;align-items:center;gap:6px;flex-shrink:0}
.hp-tool-link{font-size:12px;font-weight:600;color:#555;text-decoration:none;padding:5px 9px;border-radius:8px;border:1px solid #e5e3df;background:#fff;white-space:nowrap}
.hp-tool-link:hover{background:#f5f4f1}
.hp-login{color:#fff;text-decoration:none;font-size:12px;font-weight:700;padding:6px 14px;border-radius:20px;white-space:nowrap}
.hp-user{display:flex;align-items:center;gap:6px;background:#f5f4f1;border:1px solid #e5e3df;border-radius:20px;padding:4px 5px 4px 12px;font-size:12.5px;font-weight:600;white-space:nowrap}
.hp-user button{background:#fff;border:1px solid #e5e3df;border-radius:50%;width:22px;height:22px;cursor:pointer;font-size:10px;color:#888;display:flex;align-items:center;justify-content:center}
.hp-mobile-tools{display:none;align-items:center;gap:8px}

.hp-shell{max-width:1320px;margin:0 auto;padding:20px 16px 40px;display:grid;grid-template-columns:220px minmax(0,1fr) 300px;gap:24px;align-items:start}
.hp-side{position:sticky;top:90px;display:flex;flex-direction:column;gap:16px}
.hp-box{background:#fff;border:1px solid #eae8e4;border-radius:14px;padding:14px}
.hp-box-title{font-size:13.5px;font-weight:800;margin:0 0 10px;padding-bottom:8px;border-bottom:2px solid}
.hp-cat{display:flex;align-items:center;gap:8px;width:100%;border:0;background:transparent;padding:7px 10px;border-radius:8px;font-size:13px;cursor:pointer;text-align:left;color:#333;transition:background .15s}
.hp-cat:hover{background:#f5f4f1}

.hp-main{min-width:0;display:flex;flex-direction:column;gap:18px}
.hp-ad-slot{display:flex;align-items:center;justify-content:center;background:#fff;border:1px dashed #d6d3cd;border-radius:10px;color:#aaa;font-size:12px;min-height:90px;text-align:center;padding:10px}
.hp-ad-img{display:block;width:100%;height:auto;border-radius:10px}

.hp-live{background:#fff;border:1px solid #fecaca;border-radius:16px;padding:16px}
.hp-live-head{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:14px;flex-wrap:wrap}
.hp-live-title{font-size:15px;font-weight:800;margin:0;color:#b91c1c}
.hp-live-pill{background:#ef4444;color:#fff;font-size:11.5px;font-weight:700;padding:4px 10px;border-radius:20px;animation:hpPulse 1.6s infinite}
.hp-live-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:14px}
.hp-live-card{border:1px solid #f1f0ec;border-radius:12px;overflow:hidden;background:#fafaf8}
.hp-video{position:relative;aspect-ratio:16/9;background:#000}
.hp-video iframe{position:absolute;inset:0;width:100%;height:100%;border:0}
.hp-live-body{padding:12px}
.hp-live-tag{display:flex;align-items:center;justify-content:space-between;gap:6px;font-size:11px;font-weight:700;margin-bottom:6px}
.hp-live-card-title{font-size:14px;font-weight:700;line-height:1.4;margin:0 0 8px}
.hp-updates{background:#fff7ed;border-radius:8px;padding:8px 10px;font-size:12.5px;color:#444}
.hp-updates p{margin:4px 0 0;line-height:1.5}

.hp-tags{display:flex;align-items:center;gap:8px;overflow-x:auto;scrollbar-width:none;padding-bottom:2px}
.hp-tags::-webkit-scrollbar{display:none}
.hp-tags-label{display:flex;align-items:center;gap:4px;font-size:13px;font-weight:800;white-space:nowrap;flex-shrink:0}

.hp-section-title{font-size:17px;font-weight:800;margin:0;padding-bottom:8px;border-bottom:2px solid}

.hp-hero{display:block;background:#fff;border:1px solid #eae8e4;border-radius:16px;overflow:hidden;text-decoration:none;color:inherit;transition:box-shadow .2s}
.hp-hero:hover{box-shadow:0 14px 32px -18px rgba(0,0,0,.3)}
.hp-hero-img{width:100%;aspect-ratio:16/9;object-fit:cover;display:block;background:#eee}
.hp-hero-body{padding:18px}
.hp-hero-title{font-size:20px;font-weight:800;line-height:1.35;margin:10px 0 8px}
.hp-hero-summary{font-size:14px;color:#555;line-height:1.6;margin:0 0 12px}
.hp-badge{display:inline-block;font-size:11.5px;font-weight:700;color:#fff;padding:3px 10px;border-radius:6px}

.hp-list{display:flex;flex-direction:column;gap:12px}
.hp-item{display:flex;gap:14px;background:#fff;border:1px solid #eae8e4;border-radius:14px;padding:12px;text-decoration:none;color:inherit;transition:box-shadow .2s}
.hp-item:hover{box-shadow:0 8px 20px -12px rgba(0,0,0,.25)}
.hp-item-body{flex:1;min-width:0;display:flex;flex-direction:column}
.hp-item-cat{font-size:11.5px;font-weight:700}
.hp-item-title{font-size:14.5px;font-weight:700;line-height:1.45;margin:4px 0 8px;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
.hp-item-img{width:104px;height:78px;object-fit:cover;border-radius:10px;flex-shrink:0;background:#eee}
.hp-meta{display:flex;gap:12px;font-size:12px;color:#888;margin-top:auto}

.hp-feed-ad{background:#fff;border:1px solid #eae8e4;border-radius:14px;padding:10px}
.hp-feed-ad-label{font-size:10.5px;color:#999;letter-spacing:.04em;margin-bottom:6px}

.hp-empty{background:#fff;border:1px dashed #d6d3cd;border-radius:14px;padding:40px 16px;text-align:center;color:#777}
.hp-empty-ic{font-size:34px;margin-bottom:8px}
.hp-empty h3{margin:0 0 6px;font-size:16px;color:#333}
.hp-empty p{margin:0;font-size:13px}
.hp-loading{text-align:center;padding:40px;color:#888;font-size:14px}

.hp-rashi-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-bottom:12px}
.hp-rashi{border:1px solid #eae8e4;border-radius:8px;padding:6px 2px;font-size:11px;cursor:pointer;background:#fff;display:flex;flex-direction:column;align-items:center;gap:2px;color:#444}
.hp-rashi-sign{font-size:16px}
.hp-rashi-text{font-size:13px;line-height:1.6;color:#444;margin:0}

.hp-classified{display:flex;gap:10px;padding:10px 0;border-bottom:1px solid #f0eee9}
.hp-classified:last-child{border-bottom:0;padding-bottom:0}
.hp-classified-img{width:54px;height:54px;border-radius:8px;object-fit:cover;flex-shrink:0;background:#f1f0ec}
.hp-classified-title{font-size:13.5px;font-weight:700;margin:0 0 3px;line-height:1.35}
.hp-classified-meta{font-size:11.5px;color:#888}
.hp-classified-call{display:inline-block;margin-top:4px;font-size:12px;font-weight:700;text-decoration:none}

.hp-drawer{position:fixed;top:0;left:0;bottom:0;width:280px;max-width:85vw;background:#fff;z-index:400;overflow-y:auto;padding:16px;box-shadow:4px 0 24px rgba(0,0,0,.15);animation:hpSlide .22s ease}
.hp-drawer-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;padding-bottom:10px;border-bottom:1px solid #eee}
.hp-drawer-close{background:#f5f4f1;border:1px solid #e5e3df;border-radius:50%;width:32px;height:32px;cursor:pointer}
.hp-drawer-links{display:flex;flex-direction:column;gap:8px;margin-top:14px;padding-top:14px;border-top:1px solid #eee}

.hp-search-box{background:#fff;border-radius:16px;width:100%;max-width:560px;height:fit-content;padding:14px 16px;box-shadow:0 24px 60px -20px rgba(0,0,0,.4)}
.hp-search-row{display:flex;align-items:center;gap:10px}
.hp-search-result{margin-top:12px;width:100%;text-align:left;background:#f7f6f3;border:0;border-radius:10px;padding:10px 12px;font-size:13.5px;cursor:pointer;color:#333}

@keyframes hpPulse{0%,100%{opacity:1}50%{opacity:.6}}
@keyframes hpSlide{from{transform:translateX(-100%)}to{transform:translateX(0)}}

@media(max-width:1100px){
  .hp-shell{grid-template-columns:minmax(0,1fr) 300px}
  .hp-left{display:none}
  .hp-nav{display:none}
  .hp-menu-btn{display:block}
}
@media(max-width:820px){
  .hp-shell{grid-template-columns:1fr}
  .hp-side{position:static}
  .hp-desktop-tools{display:none}
  .hp-mobile-tools{display:flex}
  .hp-hero-title{font-size:18px}
}
@media(max-width:560px){
  .hp-ticker-date{display:none}
  .hp-header-in{padding:8px 12px;gap:10px}
  .hp-logo{height:38px;max-width:100px}
  .hp-site-name{font-size:15px}
  .hp-tagline{display:none}
  .hp-shell{padding:14px 12px 32px;gap:16px}
  .hp-hero-body{padding:14px}
  .hp-hero-title{font-size:17px}
  .hp-hero-summary{font-size:13.5px}
  .hp-item{padding:10px;gap:10px}
  .hp-item-img{width:96px;height:72px}
  .hp-item-title{font-size:13.5px}
  .hp-live-grid{grid-template-columns:1fr}
}
`;

export default function HomePage() {
  const router = useRouter();
  const [currentSlug, setCurrentSlug] = useState('the-local-leader');
  const [siteConfig, setSiteConfig] = useState<Record<string, any> | null>(null);
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

  // Multiple Live Streams State
  const [liveSessions, setLiveSessions] = useState<LiveBlogData[]>([]);

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
      const months = ['जनवरी', 'फरवरी', 'मार्च', 'अप्रैल', 'मई', 'जून', 'जुलाई', 'अगस्त', 'सितंबर', 'अक्टूबर', 'नवंबर', 'दिसंबर'];
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
      try {
        setReaderUser(JSON.parse(cached));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const handleReaderLogout = () => {
    localStorage.removeItem('reader_user');
    setReaderUser(null);
  };

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const rawSiteSlug = urlParams.get('site') || 'the-local-leader';
    const activeSiteSlug = decodeURIComponent(rawSiteSlug).trim().toLowerCase().replace(/\s+/g, '-');
    setCurrentSlug(activeSiteSlug);

    const unsubSite = onSnapshot(doc(db, 'sites', activeSiteSlug), (snap) => {
      if (snap.exists()) {
        setSiteConfig({ slug: activeSiteSlug, ...snap.data() });
      } else {
        // Exact filenames present in public/logos/
        let fallbackName = 'The Local Leader';
        let fallbackDesc = '— जनता की आवाज़, सच्चाई के साथ —';
        let fallbackLogo = '/logos/the-local-leader.jpeg';
        let fallbackColor = '#ea580c';

        if (activeSiteSlug === 'the-proview-times' || activeSiteSlug === 'the-provue-times' || activeSiteSlug === 'the-pro-times') {
          fallbackName = 'द प्रोव्यू टाइम्स';
          fallbackDesc = '— पेशेवर नज़र, सच्ची खबर —';
          fallbackLogo = '/logos/the-provue-times.jpeg';
          fallbackColor = '#b91c1c';
        } else if (activeSiteSlug === 'jan-bharat-news' || activeSiteSlug === 'jan-chetna-news') {
          fallbackName = 'जन भारत न्यूज़';
          fallbackDesc = '— भारत की आवाज़ —';
          fallbackLogo = '/logos/jan-bharat-news.jpeg';
          fallbackColor = '#1d4ed8';
        } else if (activeSiteSlug === 'news-info-24' || activeSiteSlug === 'city-bulletin') {
          fallbackName = 'NEWS INFO 24';
          fallbackDesc = '— Stay Informed, Stay Ahead —';
          fallbackLogo = '/logos/news-info-24.jpeg';
          fallbackColor = '#dc2626';
        } else if (activeSiteSlug === 'national-defence-network' || activeSiteSlug === 'ndn-defence' || activeSiteSlug === 'state-express') {
          fallbackName = 'डिफेंस न्यूज़';
          fallbackDesc = '— Defence Beyond Headlines —';
          fallbackLogo = '/logos/ndn-defence.jpeg';
          fallbackColor = '#15803d';
        }

        setSiteConfig({
          slug: activeSiteSlug,
          name: fallbackName,
          primaryColor: fallbackColor,
          secondaryColor: '#1e242b',
          headerBg: '#ffffff',
          logoUrl: fallbackLogo,
          description: fallbackDesc
        });
      }
    });

    // Fetch all active live streams for this portal or 'all'
    const unsubLive = onSnapshot(collection(db, 'live_blogs'), (snap) => {
      const activeList: LiveBlogData[] = [];
      snap.forEach((d) => {
        const data = d.data();
        const liveSite = String(data.siteId || '').trim().toLowerCase().replace(/\s+/g, '-');
        if (data.isActive && (liveSite === activeSiteSlug || data.siteId === 'all')) {
          activeList.push({ id: d.id, ...data } as LiveBlogData);
        }
      });
      setLiveSessions(activeList);
    });

    async function loadData() {
      setLoading(true);
      try {
        const qArt = query(collection(db, 'articles'), where('siteId', 'in', [activeSiteSlug, activeSiteSlug.toLowerCase(), rawSiteSlug]));
        const artSnap = await getDocs(qArt);
        const approvedArticles = artSnap.docs
          .map((d) => ({ id: d.id, ...d.data() } as ArticleItem))
          .filter((art) => {
            const s = String(art.status || '').trim().toLowerCase();
            return s === 'published' || s === 'approved';
          });
        setArticles(approvedArticles);

        // ── ADS LOAD LOGIC (PROPER ISOLATION OF CLASSIFIEDS) ──
        const qAds = query(collection(db, 'ads'));
        const adSnap = await getDocs(qAds);
        setHeaderAd(null);
        setSidebarAd(null);
        const feedAdsList: AdItem[] = [];

        adSnap.docs.forEach((docSnap) => {
          const rawData = docSnap.data();
          const adStatus = String(rawData.status || '').trim().toLowerCase();

          if (adStatus === 'active') {
            const cleanAd: AdItem = {
              id: docSnap.id,
              name: rawData.name || rawData.title || '',
              zone: rawData.zone || '',
              imageUrl: rawData.imageUrl || '',
              targetUrl: rawData.targetUrl || '',
              status: adStatus,
              format: rawData.format || ''
            };

            const zoneStr = String(cleanAd.zone || '').toLowerCase();
            const formatStr = String(cleanAd.format || '').toLowerCase();
            const typeStr = String(rawData.type || '').toLowerCase();

            // 🛑 STOP: Classified ads must NOT enter the news feed banner list!
            if (zoneStr.includes('classified') || formatStr.includes('classified') || typeStr.includes('classified')) {
              return;
            }

            const adRef = doc(db, 'ads', docSnap.id);
            updateDoc(adRef, { impressions: increment(1) }).catch(() => {});

            // Header Banner
            if (zoneStr.includes('728') || zoneStr.includes('header') || zoneStr.includes('हेडर')) {
              setHeaderAd(cleanAd);
            }
            // Sidebar Banner
            else if (zoneStr.includes('300') || zoneStr.includes('sidebar') || zoneStr.includes('साइडबार')) {
              setSidebarAd(cleanAd);
            }
            // Feed Banner (Only genuine feed/banner ads)
            else if (zoneStr.includes('feed') || zoneStr.includes('banner') || zoneStr.includes('in-article')) {
              feedAdsList.push(cleanAd);
            }
          }
        });
        setInFeedAds(feedAdsList);
      } catch (err) {
        console.error('Error loading home data:', err);
      }
      setLoading(false);
    }
    loadData();

    // ── LIVE CLASSIFIEDS LISTENER (SIDEBAR WIDGET) ──
    let directClassifieds: ClassifiedItem[] = [];
    let adsClassifieds: ClassifiedItem[] = [];

    const updateCombinedClassifieds = () => {
      const combined = [...directClassifieds, ...adsClassifieds];
      const unique = Array.from(new Map(combined.map((item) => [item.id, item])).values());
      setClassifiedAds(unique.slice(0, 4));
    };

    const unsubClassifieds = onSnapshot(collection(db, 'classifieds'), (snap) => {
      directClassifieds = [];
      snap.forEach((d) => {
        const data = d.data();
        const st = String(data.status || 'active').toLowerCase();
        const cSite = String(data.siteId || '').trim().toLowerCase().replace(/\s+/g, '-');
        if (st === 'active' || st === 'approved') {
          if (!data.siteId || cSite === activeSiteSlug || data.siteId === 'all') {
            directClassifieds.push({ id: d.id, ...data } as ClassifiedItem);
          }
        }
      });
      updateCombinedClassifieds();
    });

    const unsubAdsForClassifieds = onSnapshot(collection(db, 'ads'), (snap) => {
      adsClassifieds = [];
      snap.forEach((d) => {
        const data = d.data();
        const st = String(data.status || '').toLowerCase();
        const fmt = String(data.format || '').toLowerCase();
        const zn = String(data.zone || '').toLowerCase();
        const aSite = String(data.siteId || '').trim().toLowerCase().replace(/\s+/g, '-');

        if ((st === 'active' || st === 'approved') && (fmt === 'classified' || zn.includes('classified'))) {
          if (!data.siteId || aSite === activeSiteSlug || data.siteId === 'all') {
            adsClassifieds.push({
              id: d.id,
              title: data.name || data.title || 'क्लासिफाइड विज्ञापन',
              category: data.category || 'वर्गीकृत',
              city: data.city || '',
              price: data.price || data.budget || '',
              contactNumber: data.contactNumber || '',
              imageUrl: data.imageUrl || '',
              status: 'active'
            });
          }
        }
      });
      updateCombinedClassifieds();
    });

    const unsubRashifal = onSnapshot(collection(db, 'rashifal'), (snap) => {
      const map: Record<string, any> = {};
      snap.docs.forEach((d) => {
        map[d.id] = d.data();
      });
      setRashifalData(map);
    });

    return () => {
      unsubSite();
      unsubLive();
      unsubRashifal();
      unsubClassifieds();
      unsubAdsForClassifieds();
    };
  }, []);

  const primary = siteConfig?.primaryColor || '#ea580c';
  const headerBg = siteConfig?.headerBg || '#ffffff';
  const siteFont = siteConfig?.fontFamily || '"Mukta", system-ui, -apple-system, sans-serif';

  // Articles Filtering Logic
  const filteredArticles = articles.filter((art) => {
    const rawStatus = String(art.status || '').trim().toLowerCase();
    if (rawStatus !== 'published' && rawStatus !== 'approved') return false;

    if (activeCategory === 'लाइव') return false;

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

    const matchesCategory =
      activeCategory === 'होम' ||
      activeCategory === 'ताज़ा खबरें' ||
      activeCategory === 'राशिफल' ||
      art.category?.toLowerCase() === activeCategory.toLowerCase() ||
      (activeCategory === 'राजनीति' && (art.category === 'Politics' || art.category === 'राजनीति')) ||
      (activeCategory === 'व्यापार' && (art.category === 'Business' || art.category === 'व्यापार')) ||
      (activeCategory === 'स्वास्थ्य' && (art.category === 'Health' || art.category === 'स्वास्थ्य')) ||
      (activeCategory === 'जीवनशैली' && (art.category === 'Lifestyle' || art.category === 'जीवनशैली')) ||
      (activeCategory === 'अपराध' && (art.category === 'Crime' || art.category === 'अपराध')) ||
      (activeCategory === 'खेल' && (art.category === 'Sports' || art.category === 'खेल')) ||
      (activeCategory === 'राज्य' && (art.category === 'National' || art.category === 'राज्य'));

    const cleanSearch = searchTerm.trim().toLowerCase();
    const matchesSearch =
      !cleanSearch ||
      (art.title && art.title.toLowerCase().includes(cleanSearch)) ||
      (art.titleHi && art.titleHi.toLowerCase().includes(cleanSearch)) ||
      (art.summary && art.summary.toLowerCase().includes(cleanSearch));
    return matchesCategory && matchesSearch;
  });

  const hasLiveStreams = liveSessions.length > 0;
  const showLiveInFeed = hasLiveStreams && (activeCategory === 'होम' || activeCategory === 'ताज़ा खबरें' || activeCategory === 'लाइव');

  const activeRashiItem = DEFAULT_RASHI_LIST.find((r) => r.id === selectedRashi) || DEFAULT_RASHI_LIST[0];
  const activeRashiInfo = rashifalData[selectedRashi];

  const tint = (hex: string, op: number) => {
    const r = parseInt(hex.slice(1, 3), 16),
      g = parseInt(hex.slice(3, 5), 16),
      b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${op})`;
  };

  // Article link (apne article route ke hisaab se badal sakte hain)
  const articleHref = (a: ArticleItem) => `/article/${a.slug || a.id}?site=${currentSlug}`;

  const SearchIcon = ({ size = 16 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="7" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );

  const categoryButtons = (
    <>
      {CATEGORY_LIST.map(({ key, icon }) => {
        const isActive = activeCategory === key && !activeTrendTag;
        return (
          <button
            key={key}
            className="hp-cat"
            onClick={() => handleCategoryClick(key)}
            style={{
              color: isActive ? primary : key === 'लाइव' && hasLiveStreams ? '#ef4444' : '#333',
              background: isActive ? tint(primary, 0.08) : undefined,
              fontWeight: isActive ? 700 : 500
            }}
          >
            <span style={{ fontSize: '16px', width: '22px', textAlign: 'center' }}>{icon}</span>
            {key}
          </button>
        );
      })}
    </>
  );

  return (
    <div className="hp-root" style={{ fontFamily: siteFont }}>
      <style dangerouslySetInnerHTML={{ __html: HP_STYLES }} />

      {/* ═══ 1. MARKET TICKER ═══ */}
      <div className="hp-ticker">
        <div className="hp-ticker-in">
          <div className="hp-ticker-items">
            {[
              { label: 'पेट्रोल', value: marketRates.petrol, color: '#fff' },
              { label: 'डीज़ल', value: marketRates.diesel, color: '#fff' },
              {
                label: 'निफ्टी',
                value: `${marketRates.nifty} ${marketRates.niftyPositive ? '▲' : '▼'} ${marketRates.niftyChange}`,
                color: marketRates.niftyPositive ? '#34d399' : '#f87171'
              },
              {
                label: 'सेंसेक्स',
                value: `${marketRates.sensex} ${marketRates.sensexPositive ? '▲' : '▼'} ${marketRates.sensexChange}`,
                color: marketRates.sensexPositive ? '#34d399' : '#f87171'
              },
              { label: 'सोना', value: marketRates.gold, color: '#fbbf24' },
              { label: 'चांदी', value: marketRates.silver, color: '#cbd5e1' }
            ].map((item, i) => (
              <span key={item.label} style={{ display: 'inline-flex', alignItems: 'center', gap: '10px' }}>
                {i > 0 && <span className="hp-ticker-sep">│</span>}
                <span>
                  <span className="hp-ticker-label">{item.label}</span>
                  <span style={{ color: item.color, fontWeight: 600 }}>{item.value}</span>
                </span>
              </span>
            ))}
          </div>
          <div className="hp-ticker-date">
            <span style={{ marginRight: '5px' }}>📅</span>
            {currentHindiDate || '...'}
          </div>
        </div>
      </div>

      {/* ═══ 2. HEADER ═══ */}
      <header className="hp-header" style={{ background: headerBg, borderTop: `3px solid ${primary}` }}>
        <div className="hp-header-in">
          {/* Left: Brand Logo & Title */}
          <div className="hp-brand-wrap">
            <button className="hp-menu-btn" onClick={() => setDrawerOpen(true)} aria-label="मेनू">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
            <Link href={`/?site=${currentSlug}`} className="hp-brand">
              {siteConfig?.logoUrl && (
                <img src={siteConfig.logoUrl} alt={siteConfig?.name || 'लोगो'} className="hp-logo" />
              )}
              <div style={{ minWidth: 0 }}>
                <h1 className="hp-site-name" style={{ color: primary }}>
                  {siteConfig?.name || 'द लोकल लीडर'}
                </h1>
                <p className="hp-tagline">{siteConfig?.description || 'जनता की आवाज़, सच्चाई के साथ'}</p>
              </div>
            </Link>
          </div>

          {/* Desktop Nav Pills */}
          <nav className="hp-nav">
            {[
              { key: 'होम', emoji: '🏠' },
              { key: 'लाइव', emoji: '🔴' },
              { key: 'वीडियो', emoji: '📹' },
              { key: 'ताज़ा खबरें', emoji: '⚡' },
              { key: 'शोक संदेश', emoji: '🕯️' },
              { key: 'ई-पेपर', emoji: '📄' }
            ].map(({ key, emoji }) => {
              const isActive = activeCategory === key && !activeTrendTag;
              return (
                <button
                  key={key}
                  className="hp-nav-btn"
                  onClick={() => handleCategoryClick(key)}
                  style={{
                    color: isActive ? primary : key === 'लाइव' && hasLiveStreams ? '#ef4444' : '#555',
                    background: isActive ? tint(primary, 0.08) : 'transparent',
                    fontWeight: isActive ? 700 : 500
                  }}
                >
                  <span>{emoji}</span>
                  {key}
                </button>
              );
            })}
          </nav>

          {/* Desktop Tools */}
          <div className="hp-tools hp-desktop-tools">
            <Link href={`/journalist?site=${currentSlug}`} className="hp-tool-link">
              ✍️ पत्रकार
            </Link>
            <Link href={`/advertise?site=${currentSlug}`} className="hp-tool-link">
              📢 विज्ञापन
            </Link>
            <SiteSwitcher />
            <LanguageTranslator />
            <button
              onClick={() => setSearchModalOpen(true)}
              style={{ background: '#f5f4f1', border: '1px solid #e5e3df', borderRadius: '22px', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', color: '#777', fontSize: '12px', flexShrink: 0 }}
            >
              <SearchIcon size={14} />
              खोजें
            </button>
            {readerUser ? (
              <div className="hp-user">
                👤 {readerUser.name ? readerUser.name.slice(0, 6) : 'यूज़र'}
                <button onClick={handleReaderLogout} aria-label="लॉगआउट" title="लॉगआउट">
                  ✕
                </button>
              </div>
            ) : (
              <Link href="/login" className="hp-login" style={{ background: primary }}>
                लॉगिन
              </Link>
            )}
          </div>

          {/* Mobile Tools */}
          <div className="hp-mobile-tools">
            <SiteSwitcher />
            <button
              onClick={() => setSearchModalOpen(true)}
              aria-label="सर्च"
              style={{ background: '#f5f4f1', border: '1px solid #e5e3df', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, color: '#555' }}
            >
              <SearchIcon size={15} />
            </button>
            {readerUser ? (
              <div className="hp-user" style={{ paddingLeft: '8px' }}>
                👤
                <button onClick={handleReaderLogout} aria-label="लॉगआउट">
                  ✕
                </button>
              </div>
            ) : (
              <Link href="/login" className="hp-login" style={{ background: primary, padding: '6px 12px', fontSize: '12px' }}>
                लॉगिन
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* ═══ SEARCH MODAL ═══ */}
      {searchModalOpen && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setSearchModalOpen(false);
          }}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', backdropFilter: 'blur(4px)', zIndex: 500, display: 'flex', justifyContent: 'center', padding: '90px 16px 0' }}
        >
          <div className="hp-search-box">
            <div className="hp-search-row">
              <span style={{ color: '#999', display: 'flex' }}>
                <SearchIcon size={18} />
              </span>
              <input
                type="text"
                placeholder="खबरें खोजें..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setActiveTrendTag('');
                }}
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
              <button className="hp-search-result" onClick={() => setSearchModalOpen(false)}>
                “{searchTerm}” के लिए परिणाम देखें…
              </button>
            )}
          </div>
        </div>
      )}

      {/* ═══ MOBILE DRAWER ═══ */}
      {drawerOpen && (
        <div
          onClick={() => setDrawerOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.35)', backdropFilter: 'blur(2px)', zIndex: 390 }}
        />
      )}
      {drawerOpen && (
        <aside className="hp-drawer">
          <div className="hp-drawer-head">
            <strong style={{ color: primary, fontSize: '16px' }}>{siteConfig?.name || 'द लोकल लीडर'}</strong>
            <button className="hp-drawer-close" onClick={() => setDrawerOpen(false)} aria-label="बंद करें">
              ✕
            </button>
          </div>
          {categoryButtons}
          <div className="hp-drawer-links">
            <Link href={`/journalist?site=${currentSlug}`} className="hp-tool-link">
              ✍️ पत्रकार
            </Link>
            <Link href={`/advertise?site=${currentSlug}`} className="hp-tool-link">
              📢 विज्ञापन
            </Link>
          </div>
        </aside>
      )}

      {/* ═══ 3. THREE-COLUMN SHELL ═══ */}
      <div className="hp-shell">
        {/* ── LEFT SIDEBAR ── */}
        <aside className="hp-side hp-left">
          <div className="hp-box">
            <h3 className="hp-box-title" style={{ borderColor: primary }}>श्रेणियाँ</h3>
            {categoryButtons}
          </div>
        </aside>

        {/* ── CENTER COLUMN (MAIN NEWS FEED & LIVE FEED) ── */}
        <main className="hp-main">
          {headerAd ? (
            <a href={headerAd.targetUrl || '#'} target="_blank" rel="noopener noreferrer" onClick={() => handleAdClick(headerAd)}>
              <img src={headerAd.imageUrl} alt={headerAd.name || 'विज्ञापन'} className="hp-ad-img" />
            </a>
          ) : (
            <div className="hp-ad-slot">विज्ञापन · 728 × 90</div>
          )}

          {/* 🔴 MULTIPLE LIVE STREAMS GRID */}
          {showLiveInFeed && (
            <section className="hp-live">
              <div className="hp-live-head">
                <h2 className="hp-live-title">🔴 लाइव कवरेज प्रसारण ({liveSessions.length} Live)</h2>
                <span className="hp-live-pill">सीधा प्रसारण</span>
              </div>
              <div className="hp-live-grid">
                {liveSessions.map((session) => (
                  <div key={session.id} className="hp-live-card">
                    <div className="hp-video">
                      <iframe
                        src={`https://www.youtube.com/embed/${session.youtubeId}`}
                        title={session.title}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                    <div className="hp-live-body">
                      <div className="hp-live-tag">
                        <span style={{ color: '#ef4444' }}>● LIVE STREAM</span>
                        <span style={{ color: '#888', fontWeight: 600 }}>
                          {session.siteId === 'all' ? siteConfig?.name || 'द लोकल लीडर' : session.siteId}
                        </span>
                      </div>
                      <h3 className="hp-live-card-title">{session.title}</h3>
                      {session.updates && session.updates.length > 0 && (
                        <div className="hp-updates">
                          <strong style={{ color: '#c2410c' }}>⚡ ताज़ा अपडेट:</strong>
                          {[...session.updates].slice(-2).reverse().map((u) => (
                            <p key={u.id}>
                              <strong>[{u.time}]</strong> {u.update}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ── TRENDING TAGS ── */}
          {activeCategory !== 'लाइव' && (
            <div className="hp-tags">
              <span className="hp-tags-label" style={{ color: primary }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                  <polyline points="17 6 23 6 23 12" />
                </svg>
                ट्रेंडिंग
              </span>
              {TRENDING_TAGS.map((t) => {
                const isTagActive = activeTrendTag === t;
                return (
                  <button
                    key={t}
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
                      transition: 'all .15s ease'
                    }}
                  >
                    {t}
                  </button>
                );
              })}
            </div>
          )}

          {/* Live Section Heading */}
          {activeCategory === 'लाइव' && (
            <h2 className="hp-section-title" style={{ borderColor: primary }}>
              लाइव प्रसारण कवरेज (Live Streams)
            </h2>
          )}

          {/* ── ARTICLES FEED ── */}
          {activeCategory === 'लाइव' ? (
            !hasLiveStreams && (
              <div className="hp-empty">
                <div className="hp-empty-ic">📡</div>
                <h3>वर्तमान में कोई लाइव प्रसारण सक्रिय नहीं है</h3>
                <p>जैसे ही कोई विशेष लाइव कवरेज शुरू होगी, वह यहाँ प्रदर्शित हो जाएगी।</p>
              </div>
            )
          ) : loading ? (
            <div className="hp-loading">खबरें लोड हो रही हैं…</div>
          ) : filteredArticles.length === 0 && !showLiveInFeed ? (
            <div className="hp-empty">
              <div className="hp-empty-ic">📭</div>
              <h3>
                {activeTrendTag
                  ? `"${activeTrendTag}" के लिए कोई खबर नहीं मिली`
                  : searchTerm
                    ? `"${searchTerm}" के लिए कोई खबर नहीं मिली`
                    : 'अभी कोई स्वीकृत खबर उपलब्ध नहीं है'}
              </h3>
              <p>संपादक द्वारा समीक्षा एवं अनुमोदन के बाद ही खबरें यहां प्रदर्शित होती हैं।</p>
            </div>
          ) : (
            <div className="hp-list">
              {filteredArticles[0] && (
                <Link href={articleHref(filteredArticles[0])} className="hp-hero">
                  {filteredArticles[0].image && (
                    <img src={filteredArticles[0].image} alt={filteredArticles[0].title} className="hp-hero-img" />
                  )}
                  <div className="hp-hero-body">
                    <span className="hp-badge" style={{ background: primary }}>
                      {filteredArticles[0].category || 'ताज़ा खबर'}
                    </span>
                    <h2 className="hp-hero-title">{filteredArticles[0].title}</h2>
                    {filteredArticles[0].summary && <p className="hp-hero-summary">{filteredArticles[0].summary}</p>}
                    <div className="hp-meta">
                      <span>
                        {filteredArticles[0].createdAt ? String(filteredArticles[0].createdAt).split('T')[0] : currentHindiDate}
                      </span>
                      <span>👁 {filteredArticles[0].views || 0} बार पढ़ा गया</span>
                    </div>
                  </div>
                </Link>
              )}

              {filteredArticles.slice(1).map((item, index) => {
                const showAd = (index + 1) % 3 === 0;
                const adIndex = Math.floor(index / 3) % (inFeedAds.length || 1);
                const currentInFeedAd = inFeedAds[adIndex];

                return (
                  <Fragment key={item.id}>
                    <Link href={articleHref(item)} className="hp-item">
                      <div className="hp-item-body">
                        <span className="hp-item-cat" style={{ color: primary }}>
                          {item.category}
                        </span>
                        <h3 className="hp-item-title">{item.title}</h3>
                        <div className="hp-meta">
                          <span>{item.createdAt ? String(item.createdAt).split('T')[0] : 'आज'}</span>
                          <span>👁 {item.views || 0}</span>
                        </div>
                      </div>
                      {item.image && <img src={item.image} alt={item.title} className="hp-item-img" loading="lazy" />}
                    </Link>

                    {showAd && (
                      <div className="hp-feed-ad">
                        <div className="hp-feed-ad-label">प्रायोजित / विज्ञापन</div>
                        {currentInFeedAd ? (
                          <a
                            href={currentInFeedAd.targetUrl || '#'}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => handleAdClick(currentInFeedAd)}
                            style={{ display: 'block', width: '100%', maxHeight: '110px', overflow: 'hidden', borderRadius: '8px' }}
                          >
                            <img
                              src={currentInFeedAd.imageUrl}
                              alt={currentInFeedAd.name || 'विज्ञापन'}
                              style={{ width: '100%', height: '110px', objectFit: 'cover', display: 'block' }}
                            />
                          </a>
                        ) : (
                          <div className="hp-ad-slot" style={{ minHeight: '80px' }}>
                            📢 विज्ञापन स्थान (In-Feed Sponsored Ad)
                          </div>
                        )}
                      </div>
                    )}
                  </Fragment>
                );
              })}
            </div>
          )}
        </main>

        {/* ── RIGHT SIDEBAR ── */}
        <aside className="hp-side hp-right">
          {/* Sidebar Ad (300) */}
          {sidebarAd ? (
            <a href={sidebarAd.targetUrl || '#'} target="_blank" rel="noopener noreferrer" onClick={() => handleAdClick(sidebarAd)}>
              <img src={sidebarAd.imageUrl} alt={sidebarAd.name || 'विज्ञापन'} className="hp-ad-img" />
            </a>
          ) : (
            <div className="hp-ad-slot" style={{ minHeight: '250px' }}>विज्ञापन · 300 × 250</div>
          )}

          {/* 🔮 RASHIFAL WIDGET */}
          <div className="hp-box">
            <h3 className="hp-box-title" style={{ borderColor: primary }}>🔮 आज का राशिफल</h3>
            <div className="hp-rashi-grid">
              {DEFAULT_RASHI_LIST.map((r) => {
                const isSel = selectedRashi === r.id;
                return (
                  <button
                    key={r.id}
                    className="hp-rashi"
                    onClick={() => setSelectedRashi(r.id)}
                    style={{
                      borderColor: isSel ? primary : undefined,
                      background: isSel ? tint(primary, 0.08) : undefined,
                      color: isSel ? primary : undefined,
                      fontWeight: isSel ? 700 : 500
                    }}
                  >
                    <span className="hp-rashi-sign">{r.sign}</span>
                    {r.name}
                  </button>
                );
              })}
            </div>
            <div style={{ background: '#faf9f6', borderRadius: '10px', padding: '12px' }}>
              <strong style={{ fontSize: '14px', color: primary }}>
                {activeRashiItem.sign} {activeRashiItem.name}
              </strong>
              <p className="hp-rashi-text" style={{ marginTop: '6px' }}>
                {activeRashiInfo?.prediction ||
                  activeRashiInfo?.text ||
                  activeRashiInfo?.description ||
                  'आज का राशिफल जल्द ही अपडेट किया जाएगा।'}
              </p>
            </div>
          </div>

          {/* 📋 CLASSIFIED ADS WIDGET */}
          <div className="hp-box">
            <h3 className="hp-box-title" style={{ borderColor: primary }}>📋 क्लासिफाइड विज्ञापन</h3>
            {classifiedAds.length === 0 ? (
              <p style={{ fontSize: '13px', color: '#888', margin: 0 }}>अभी कोई क्लासिफाइड विज्ञापन उपलब्ध नहीं है।</p>
            ) : (
              classifiedAds.map((c) => (
                <div key={c.id} className="hp-classified">
                  {c.imageUrl ? (
                    <img src={c.imageUrl} alt={c.title} className="hp-classified-img" />
                  ) : (
                    <div className="hp-classified-img" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
                      📋
                    </div>
                  )}
                  <div style={{ minWidth: 0 }}>
                    <p className="hp-classified-title">{c.title}</p>
                    <div className="hp-classified-meta">
                      {[c.category, c.city, c.price].filter(Boolean).join(' · ')}
                    </div>
                    {c.contactNumber && (
                      <a href={`tel:${c.contactNumber}`} className="hp-classified-call" style={{ color: primary }}>
                        📞 {c.contactNumber}
                      </a>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </aside>
      </div>

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