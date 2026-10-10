'use client';
import { Fragment, Suspense, useEffect, useRef, useState } from 'react';
import { collection, query, where, getDocs, doc, onSnapshot, updateDoc, increment } from 'firebase/firestore';
import { getAuth, onAuthStateChanged, signInWithCustomToken, signOut } from 'firebase/auth';
import { SECURE_AUTH } from '@/lib/phoneAuth';
import { db, app } from '@/lib/firebase';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import Footer from '@/components/Footer';
import { AdBanner, AdInline, AdMedia, AdSideSlots, useStickySidebar } from '@/components/SiteAds';
import SiteSwitcher from '@/components/SiteSwitcher';
import { normalizeSiteId } from '@/lib/portals';
import { fetchPortalArticles } from '@/lib/articleQueries';
import { isArticleLive } from '@/lib/articles';
import { logoFor, rememberPortal } from '@/lib/siteTheme';
import { RASHI_LIST, todayIST, isRashifalFresh } from '@/lib/rashifal';
import LanguageTranslator from '@/components/LanguageTranslator';
import ReaderProfileMenu from '@/components/ReaderProfileMenu';
import NotificationBell from '@/components/NotificationBell';
import EmptyState, { FeedSkeleton } from '@/components/EmptyState';
import { categoryMatches, matchesTrendTag, setDynamicCategories } from '@/lib/categories';
import { categoryOnPortal, DEFAULT_CATEGORIES, fetchCategories, type CategoryItem } from '@/lib/taxonomy';
import { hasEpaper } from '@/lib/epaperSub';
import { adNotExpired } from '@/lib/plans';
import { useTrendingTags } from '@/lib/useTrendingTags';

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
  publishAt?: any;
  siteIds?: string[];
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
  videoUrl?: string;
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

// Rashifal purana ho toh background me ek hi baar auto-sync API hit karo (server khud duplicate Gemini calls rokta hai)
let rashifalSyncRequested = false;
const triggerRashifalAutoSync = () => {
  if (rashifalSyncRequested) return;
  rashifalSyncRequested = true;
  const sessionKey = `rashifal_sync_${todayIST()}`;
  try {
    if (sessionStorage.getItem(sessionKey)) return;
    sessionStorage.setItem(sessionKey, '1');
  } catch {}
  fetch('/api/rashifal/auto-sync', { method: 'POST' }).catch(() => {});
};

const formatRashifalDate = (date: string, english: boolean) => {
  const d = new Date(`${date}T00:00:00`);
  return isNaN(d.getTime()) ? date : d.toLocaleDateString(english ? 'en-IN' : 'hi-IN', { day: 'numeric', month: 'long', year: 'numeric' });
};

const PLAY_STORE_URL = 'https://play.google.com/store';
const APP_STORE_URL = 'https://apps.apple.com';

// Ye tabs koi category filter nahi lagate — saari khabrein
const HOME_TABS = ['होम', 'Home', 'ताज़ा खबरें', 'Latest News', 'राशिफल', 'टॉप न्यूज़', 'Top News'];

// Trending tags ab admin (settings/trending_tags) se — useTrendingTags()

// Menu: aage/peeche ke fixed tab + beech me admin (Categories) se aane wali categories
const MENU_HEAD_HI = [
  { key: 'होम', icon: '🏠' },
  { key: 'रेफर और कमाएं', icon: '🎁' },
  { key: 'लाइव', icon: '🔴' },
  { key: 'वीडियो', icon: '📹' }
];
const MENU_TAIL_HI = [
  { key: 'शोक संदेश', icon: '🕯️' },
  { key: 'विवाह', icon: '💍' },
  { key: 'ई-पेपर', icon: '📄' }
];
const MENU_HEAD_EN = [
  { key: 'Home', icon: '🏠' },
  { key: 'Refer & Earn', icon: '🎁' },
  { key: 'Live', icon: '🔴' },
  { key: 'Videos', icon: '📹' }
];
const MENU_TAIL_EN = [
  { key: 'Matrimony', icon: '💍' },
  { key: 'E-Paper', icon: '📄' }
];

const HP_STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Mukta:wght@400;500;600;700;800&display=swap');

/* 🚫 HIDE GOOGLE TRANSLATE BANNER, BAR & IFRAME */
.goog-te-banner-frame.skiptranslate,
iframe.goog-te-banner-frame,
.goog-te-banner-frame,
#goog-gt-tt,
.goog-te-balloon-frame {
  display: none !important;
  visibility: hidden !important;
  height: 0 !important;
  width: 0 !important;
}
body {
  top: 0px !important;
  position: static !important;
}
.skiptranslate {
  display: none !important;
}
.hp-tools .skiptranslate,
.hp-mobile-tools .skiptranslate {
  display: block !important;
}

.hp-root{min-height:100vh;background:#f7f6f3;color:#1a1a1a;-webkit-font-smoothing:antialiased}
.hp-root *{box-sizing:border-box}
.hp-root button{font-family:inherit}

.hp-ticker{background:#111;color:#cbd5e1;font-size:12px}
.hp-ticker-in{max-width:1320px;margin:0 auto;padding:7px 16px;display:flex;align-items:center;justify-content:space-between;gap:16px}
.hp-ticker-items{flex:1;min-width:0;overflow:hidden;white-space:nowrap;-webkit-mask-image:linear-gradient(90deg,transparent,#000 24px,#000 calc(100% - 24px),transparent);mask-image:linear-gradient(90deg,transparent,#000 24px,#000 calc(100% - 24px),transparent)}
.hp-ticker-track{display:inline-flex;align-items:center;gap:10px;padding-right:10px;animation:hpMarquee var(--hp-ticker-dur,60s) linear infinite}
.hp-ticker-items:hover .hp-ticker-track,.hp-ticker-items:focus-within .hp-ticker-track{animation-play-state:paused}
@keyframes hpMarquee{from{transform:translateX(0)}to{transform:translateX(-50%)}}
@media(prefers-reduced-motion:reduce){.hp-ticker-items{overflow-x:auto;scrollbar-width:none;-webkit-mask-image:none;mask-image:none}.hp-ticker-track{animation:none}.hp-ticker-track>.hp-ticker-copy{display:none}}
.hp-ticker-live{display:inline-block;background:#dc2626;color:#fff;font-size:9.5px;font-weight:800;border-radius:4px;padding:1px 5px;margin-right:5px;letter-spacing:.04em;vertical-align:1px}
.hp-ticker-sep{color:#444}
.hp-ticker-label{color:#94a3b8;margin-right:4px}
.hp-ticker-date{white-space:nowrap;flex-shrink:0;color:#e2e8f0;font-weight:600}

.hp-header{position:sticky;top:0;z-index:300;border-bottom:1px solid #eae8e4;box-shadow:0 1px 8px rgba(0,0,0,.04)}
.hp-header-in{max-width:1560px;margin:0 auto;padding:10px 16px;display:flex;align-items:center;justify-content:space-between;gap:16px}
.hp-brand-wrap{display:flex;align-items:center;gap:8px;min-width:0;flex-shrink:0}
.hp-menu-btn{display:none;background:none;border:0;padding:6px;cursor:pointer;color:#333;flex-shrink:0}
.hp-brand{display:flex;align-items:center;gap:10px;min-width:0;text-decoration:none;color:inherit}
.hp-logo{height:40px;width:auto;max-width:130px;object-fit:contain;flex-shrink:0}
.hp-site-name{font-size:17px;font-weight:800;margin:-2px 0;padding:2px 0;line-height:1.45;white-space:nowrap}
.hp-tagline{font-size:11px;color:#777;margin:2px 0 0;white-space:nowrap}
.hp-nav{display:flex;gap:2px;flex-shrink:0}
.hp-nav::-webkit-scrollbar{display:none}
.hp-nav-btn{border:0;padding:6px 10px;border-radius:20px;font-size:12.5px;cursor:pointer;display:inline-flex;align-items:center;gap:5px;white-space:nowrap;transition:background .15s;line-height:1.2}
/* Icon (emoji) aur text ek seedh me — emoji ka apna baseline alag hota hai, isliye fix dabba */
.hp-ico{display:inline-flex;align-items:center;justify-content:center;width:18px;height:18px;font-size:14px;line-height:1;flex-shrink:0}
.hp-ico-cat{width:22px;height:22px;font-size:16px}
.hp-txt{display:inline-block;line-height:1.25;padding-top:1px}
.hp-tools{display:flex;align-items:center;gap:6px;flex-shrink:0}
.hp-tool-link{font-size:12px;font-weight:600;color:#555;text-decoration:none;padding:5px 9px;border-radius:8px;border:1px solid #e5e3df;background:#fff;white-space:nowrap;display:inline-flex;align-items:center;gap:4px;line-height:1.25}
.hp-tool-link:hover{background:#f5f4f1}
.hp-login{color:#fff;text-decoration:none;font-size:12px;font-weight:700;padding:0 16px;height:32px;border-radius:20px;white-space:nowrap;display:inline-flex;align-items:center;justify-content:center;line-height:1}
.hp-mobile-tools{display:none;align-items:center;gap:8px}
/* Mobile/tablet header (≤820px): portal switcher sirf 🌐 gol icon — naam header me dikhta hai */
.hp-mobile-tools .ss-name,.hp-mobile-tools .ss-caret{display:none}
.hp-mobile-tools .ss-btn{padding:0 !important;width:34px;height:34px;justify-content:center;border-radius:50% !important}

.hp-shell{max-width:1320px;margin:0 auto;padding:20px 16px 40px;display:grid;grid-template-columns:220px minmax(0,1fr) 300px;gap:24px;align-items:start}
.hp-side{position:sticky;top:90px;display:flex;flex-direction:column;gap:16px}
.hp-box{background:#fff;border:1px solid #eae8e4;border-radius:14px;padding:14px}
.hp-box-title{font-size:13.5px;font-weight:800;margin:0 0 10px;padding-bottom:8px;border-bottom:2px solid}
.hp-cat{display:flex;align-items:center;gap:8px;width:100%;border:0;background:transparent;padding:7px 10px;border-radius:8px;font-size:13px;cursor:pointer;text-align:left;color:#333;transition:background .15s}
.hp-cat:hover{background:#f5f4f1}

.hp-main{min-width:0;display:flex;flex-direction:column;gap:18px}
.hp-ad-slot{display:flex;align-items:center;justify-content:center;background:#fff;border:1px dashed #d6d3cd;border-radius:10px;color:#aaa;font-size:12px;min-height:90px;text-align:center;padding:10px}
.hp-ad-img{display:block;width:100%;height:auto;border-radius:10px}
.hp-ad-header{height:130px;object-fit:cover;object-position:center}
.hp-ad-side{height:250px;object-fit:cover;object-position:center}

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


.hp-rashi-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-bottom:12px}
.hp-rashi{border:1px solid #eae8e4;border-radius:8px;padding:6px 2px;font-size:11px;cursor:pointer;background:#fff;display:flex;flex-direction:column;align-items:center;gap:2px;color:#444}
.hp-rashi-sign{font-size:16px}
.hp-rashi-text{font-size:13px;line-height:1.6;color:#444;margin:0}

.hp-classified{display:flex;gap:10px;padding:10px 0;border-bottom:1px solid #f0eee9}
.hp-classified:last-child{border-bottom:0;padding-bottom:0}
.hp-classified-img{width:72px;height:54px;border-radius:8px;object-fit:cover;flex-shrink:0;background:#f1f0ec}
.hp-classified-title{font-size:13.5px;font-weight:700;margin:0 0 3px;line-height:1.35}
.hp-classified-meta{font-size:11.5px;color:#888}
.hp-see-all{display:flex;align-items:center;justify-content:center;gap:6px;margin-top:12px;padding:9px;border-radius:10px;font-size:13px;font-weight:700;text-decoration:none;border:1.5px solid;transition:background .15s}
.hp-app-box{margin-top:12px;padding-top:12px;border-top:1px solid #eae8e4}
.hp-app-title{font-size:13px;font-weight:800;margin:0 0 3px;color:#1a1a1a;padding:0 4px}
.hp-app-sub{font-size:11.5px;color:#888;margin:0 0 8px;line-height:1.5;padding:0 4px}
.hp-store{display:flex;align-items:center;gap:10px;background:#f7f6f3;border:1px solid #e5e3df;border-radius:10px;padding:7px 12px;color:#1a1a1a;text-decoration:none;margin-top:8px;transition:border-color .15s,background .15s}
.hp-store:hover{background:#fff;border-color:#cfcac2}
.hp-store small{display:block;font-size:9.5px;color:#888;line-height:1.2}
.hp-store strong{display:block;font-size:13px;line-height:1.25}
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

/* Lamba portal naam (National Defence Network) ho toh menu thoda compact — naam/tagline poore dikhein */
@media(max-width:1500px){
  .hp-header-in{gap:10px}
  .hp-nav-btn{padding:6px 7px;font-size:12px;gap:4px}
  .hp-tools{gap:5px}
  .hp-tool-link{padding:5px 7px}
}
/* Jagah kam ho (lamba naam, login chip, zoom) toh poora menu ☰ me — aadhe buttons kabhi nahi chhupte (JS naapta hai) */
.hp-header.hp-nav-collapsed .hp-nav{display:none}
.hp-header.hp-tools-compact .hp-tool-text{display:none}
.hp-header.hp-tools-compact .ss-name{display:inline-block;max-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;vertical-align:bottom}
.hp-header.hp-nav-collapsed .hp-menu-btn{display:block}
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
  /* Mobile: naam logo ke saath 2 line tak, kabhi switcher par na chadhe; switcher sirf 🌐 icon */
  .hp-brand-wrap{flex:1 1 auto;min-width:0}
  .hp-brand{min-width:0;gap:8px}
  .hp-logo{height:32px;max-width:64px}
  .hp-site-name{font-size:13.5px;white-space:normal;line-height:1.15;margin:0;padding:0;word-break:keep-all;overflow-wrap:normal}
  .hp-mobile-tools{gap:6px;flex-shrink:0}
  .hp-tagline{display:none}
  .hp-shell{padding:14px 12px 32px;gap:16px}
  .hp-hero-body{padding:14px}
  .hp-hero-title{font-size:17px}
  .hp-hero-summary{font-size:13.5px}
  .hp-item{padding:10px;gap:10px}
  .hp-item-img{width:96px;height:72px}
  .hp-item-title{font-size:13.5px}
  .hp-live-grid{grid-template-columns:1fr}
  .hp-ad-header{height:95px}
  .hp-ad-side{height:200px}
}
`;

function HomePageContent({ initialArticles = [], initialSlug = 'the-local-leader' }: { initialArticles?: any[]; initialSlug?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [currentSlug, setCurrentSlug] = useState(initialSlug);
  // Admin → Categories (Firestore); load hone tak shuruaati list
  const [taxonomy, setTaxonomy] = useState<CategoryItem[]>(() => DEFAULT_CATEGORIES.map((c) => ({ ...c, id: c.slug })));
  useEffect(() => {
    fetchCategories().then((list) => {
      setDynamicCategories(list);
      setTaxonomy(list);
    });
  }, []);
  const [siteConfig, setSiteConfig] = useState<Record<string, any> | null>(null);
  const [articles, setArticles] = useState<ArticleItem[]>(initialArticles as ArticleItem[]);
  const [headerAd, setHeaderAd] = useState<AdItem | null>(null);
  const [sidebarAd, setSidebarAd] = useState<AdItem | null>(null);
  const [inFeedAds, setInFeedAds] = useState<AdItem[]>([]);
  const [classifiedAds, setClassifiedAds] = useState<ClassifiedItem[]>([]);
  const [loading, setLoading] = useState(initialArticles.length === 0);
  const [activeCategory, setActiveCategory] = useState('होम');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTrendTag, setActiveTrendTag] = useState('');
  const [readerUser, setReaderUser] = useState<any>(null);

  const [liveSessions, setLiveSessions] = useState<LiveBlogData[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [currentDisplayDate, setCurrentDisplayDate] = useState('');

  // API aane tak (ya fail ho toh) ye fallback — /api/market-rates ke FALLBACK jaise hi
  const [marketRates, setMarketRates] = useState<MarketRates>({
    diesel: '₹99.70',
    petrol: '₹114.58',
    nifty: '22,421.95',
    niftyChange: '-294.25',
    niftyPositive: false,
    sensex: '71,909.70',
    sensexChange: '-619.40',
    sensexPositive: false,
    silver: '₹1,99,900',
    gold: '₹1,37,600'
  });

  const [rashifalData, setRashifalData] = useState<Record<string, any>>({});
  const [selectedRashi, setSelectedRashi] = useState('aries');

  // Check if current site should default to English
  const isEnglishSite = currentSlug === 'news-info-24' || currentSlug === 'ndn-defence' || currentSlug === 'national-defence-network';


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
    if (cat === 'रेफर और कमाएं' || cat === 'Refer & Earn') {
      // Refer page khud login maangta hai (login ke baad wapas /refer)
      setDrawerOpen(false);
      router.push(`/refer?site=${currentSlug}`);
      return;
    }
    if (cat === 'वीडियो' || cat === 'Videos') { router.push(`/videos?site=${currentSlug}`); return; }
    if ((cat === 'ई-पेपर' || cat === 'E-Paper') && hasEpaper(currentSlug)) { router.push(`/epaper?site=${currentSlug}`); return; }
    if (cat === 'शोक संदेश') { router.push(`/shok-sandesh?site=${currentSlug}`); return; }
    if (cat === 'विवाह' || cat === 'Matrimony') { router.push(`/matrimony?site=${currentSlug}`); return; }
    if (cat === 'सर्च' || cat === 'Search') { setSearchModalOpen(true); return; }
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
      setActiveCategory(isEnglishSite ? 'Home' : 'होम');
      setSearchTerm('');
    }
  };

  // Empty state ka "सभी खबरें देखें": category / tag / search sab hata kar poora feed
  const resetNewsFilters = () => {
    setActiveCategory(isEnglishSite ? 'Home' : 'होम');
    setActiveTrendTag('');
    setSearchTerm('');
    if (searchParams?.get('category')) router.replace(`/?site=${currentSlug}`);
  };

  // Footer jaise links /?category=राजनीति bhejte hain — wahi category tab khol do
  useEffect(() => {
    const categoryParam = searchParams?.get('category');
    if (categoryParam) {
      setActiveCategory(categoryParam);
      setActiveTrendTag('');
    }
  }, [searchParams]);

  useEffect(() => {
    const updateDate = () => {
      const now = new Date();
      if (isEnglishSite) {
        const daysEn = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const monthsEn = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        setCurrentDisplayDate(`${daysEn[now.getDay()]}, ${now.getDate()} ${monthsEn[now.getMonth()]} ${now.getFullYear()}`);
      } else {
        const daysHi = ['रविवार', 'सोमवार', 'मंगलवार', 'बुधवार', 'गुरुवार', 'शुक्रवार', 'शनिवार'];
        const monthsHi = ['जनवरी', 'फरवरी', 'मार्च', 'अप्रैल', 'मई', 'जून', 'जुलाई', 'अगस्त', 'सितंबर', 'अक्टूबर', 'नवंबर', 'दिसंबर'];
        setCurrentDisplayDate(`${daysHi[now.getDay()]}, ${now.getDate()} ${monthsHi[now.getMonth()]} ${now.getFullYear()}`);
      }
    };
    updateDate();
    const interval = setInterval(updateDate, 60000);
    return () => clearInterval(interval);
  }, [isEnglishSite]);

  // Ticker: user ki location ka mausam (har 15 min) + live cricket (har 2 min)
  const [weather, setWeather] = useState<any>(null);
  const [cricket, setCricket] = useState<any[]>([]);
  useEffect(() => {
    let cancelled = false;
    const loadWeather = async () => {
      try {
        // Location ki permission pehle se di ho toh sateek jagah (bina pop-up); warna IP se shehar
        let qs = '';
        try {
          const perm = await navigator.permissions?.query({ name: 'geolocation' as PermissionName });
          if (perm?.state === 'granted') {
            const pos = await new Promise<GeolocationPosition>((ok, fail) => navigator.geolocation.getCurrentPosition(ok, fail, { timeout: 5000, maximumAge: 30 * 60 * 1000 }));
            qs = `?lat=${pos.coords.latitude.toFixed(3)}&lon=${pos.coords.longitude.toFixed(3)}`;
          }
        } catch {
          /* IP wali location */
        }
        const res = await fetch(`/api/weather${qs}`);
        if (res.ok && !cancelled) setWeather(await res.json());
      } catch (err) {
        console.warn('Weather load failed:', err);
      }
    };
    const loadCricket = async () => {
      try {
        const res = await fetch('/api/cricket');
        if (res.ok && !cancelled) setCricket((await res.json()).matches || []);
      } catch (err) {
        console.warn('Cricket load failed:', err);
      }
    };
    loadWeather();
    loadCricket();
    const w = setInterval(loadWeather, 15 * 60 * 1000);
    const c = setInterval(loadCricket, 2 * 60 * 1000);
    return () => {
      cancelled = true;
      clearInterval(w);
      clearInterval(c);
    };
  }, []);

  // Live ticker: /api/market-rates (server 1 ghante cache karta hai); har 15 min me refresh. Fail par pichhle rates bane rehte hain
  useEffect(() => {
    let cancelled = false;
    const loadRates = async () => {
      try {
        const res = await fetch('/api/market-rates');
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled && data?.nifty) {
          setMarketRates({
            diesel: data.diesel,
            petrol: data.petrol,
            nifty: data.nifty,
            niftyChange: data.niftyChange,
            niftyPositive: !!data.niftyPositive,
            sensex: data.sensex,
            sensexChange: data.sensexChange,
            sensexPositive: !!data.sensexPositive,
            silver: data.silver,
            gold: data.gold
          });
        }
      } catch (err) {
        console.warn('Market rates load failed:', err);
      }
    };
    loadRates();
    const interval = setInterval(loadRates, 15 * 60 * 1000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  // 🔐 CROSS-DOMAIN SSO TOKEN READER & AUTH PERSISTENCE LISTENER
  useEffect(() => {
    // Firebase handoff-token (portal switch se) — isse naye domain par login ho jaata hai
    const ssoFb = searchParams?.get('sso_fb');
    if (ssoFb) {
      signInWithCustomToken(getAuth(app), ssoFb).catch((e) => console.error('SSO sign-in:', e?.message || e));
      const kept = searchParams.get('site') ? `?site=${searchParams.get('site')}` : '';
      window.history.replaceState({}, '', window.location.pathname + kept); // token URL se hatao
    }
    const ssoSession = searchParams?.get('sso_session');
    if (ssoSession) {
      try {
        const decodedUser = decodeURIComponent(atob(ssoSession));
        const parsed = JSON.parse(decodedUser);
        if (parsed && (parsed.uid || parsed.phone || parsed.name || parsed.email)) {
          localStorage.setItem('reader_user', JSON.stringify(parsed));
          setReaderUser(parsed);

          const cleanUrl = window.location.pathname + (searchParams.get('site') ? `?site=${searchParams.get('site')}` : '');
          window.history.replaceState({}, '', cleanUrl);
        }
      } catch (e) {
        console.error('Failed to parse cross-domain SSO session:', e);
      }
    } else {
      const cached = localStorage.getItem('reader_user');
      if (cached) {
        try {
          setReaderUser(JSON.parse(cached));
        } catch (e) {
          console.error(e);
        }
      }
    }

    // SSO handoff ke dauraan Firebase sign-in abhi chal raha hai — is load par reader_user ko hatao mat
    // (warna sign-in se pehle null-user wali jaanch use uda deti). Agli load par normal jaanch chalegi.
    if (ssoFb) return;

    // Firebase pehchaan (OTP ke baad server token) se milaan: SECURE mode me pathak session tabhi maana jaata hai
    // jab Firebase user isi mobile ka ho — warna logout (purana/nakli localStorage session).
    // Note: Firebase user se reader_user overwrite NAHI karte (admin ya kisi aur role ka token pathak na ban jaaye).
    if (!SECURE_AUTH) return;
    try {
      const auth = getAuth(app);
      const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
        const raw = localStorage.getItem('reader_user');
        if (!raw) return;
        let phone = '';
        try {
          phone = JSON.parse(raw).phone || '';
        } catch {
          /* kharab session */
        }
        const claimPhone = user ? ((await user.getIdTokenResult()).claims.phone as string) || '' : '';
        if (!phone || claimPhone !== phone) {
          localStorage.removeItem('reader_user');
          localStorage.removeItem('shok_user');
          setReaderUser(null);
        }
      });
      return () => unsubscribeAuth();
    } catch (e) {
      console.error('Firebase Auth listener error:', e);
    }
  }, [searchParams, isEnglishSite]);

  const handleReaderLogout = async () => {
    try {
      const auth = getAuth(app);
      await signOut(auth);
    } catch (err) {
      console.error('Signout error:', err);
    }
    localStorage.removeItem('reader_user');
    localStorage.removeItem('shok_user');
    setReaderUser(null);
    // Logout ke baad usi portal ka public homepage
    router.replace(`/?site=${currentSlug}`);
  };

  useEffect(() => {
    let rawSiteSlug = searchParams?.get('site') || '';

    if (!rawSiteSlug && typeof window !== 'undefined') {
      const hostname = window.location.hostname.toLowerCase().replace('www.', '');

      if (hostname === 'goldenpearlnews.com') {
        router.push('/admin');
        return;
      }

      const domainMap: { [key: string]: string } = {
        'thelocalleader.in': 'the-local-leader',
        'theproviewtimes.com': 'the-provue-times',
        'nationaldefencenetwork.com': 'ndn-defence',
        'bazarkarobar.com': 'bazar-karobar',
        'deshkiawaz.com': 'desh-ki-aawaz',
        'janbharatnews.com': 'jan-bharat-news',
        'newsinfo24.in': 'news-info-24'
      };

      rawSiteSlug = domainMap[hostname] || 'the-local-leader';
    }

    const activeSiteSlug = normalizeSiteId(decodeURIComponent(rawSiteSlug || 'the-local-leader'));
    setCurrentSlug(activeSiteSlug);
    rememberPortal(activeSiteSlug); // patrakar portal / ID card isi portal ke bane

    const unsubSite = onSnapshot(doc(db, 'sites', activeSiteSlug), (snap) => {
      if (snap.exists()) {
        setSiteConfig({ slug: activeSiteSlug, ...snap.data() });
      } else {
        let fallbackName = 'The Local Leader';
        let fallbackDesc = '— जनता की आवाज़, सच्चाई के साथ —';
        let fallbackLogo = '/logos/the-local-leader.jpeg';
        let fallbackColor = '#ea580c';

        if (activeSiteSlug.includes('proview') || activeSiteSlug.includes('provue') || activeSiteSlug.includes('pro-times')) {
          fallbackName = 'द प्रोव्यू टाइम्स';
          fallbackDesc = '— पेशेवर नज़र, सच्ची खबर —';
          fallbackLogo = '/logos/the-provue-times.jpeg';
          fallbackColor = '#b91c1c';
        } else if (activeSiteSlug.includes('jan-bharat') || activeSiteSlug.includes('jan-chetna')) {
          fallbackName = 'जन भारत न्यूज़';
          fallbackDesc = '— भारत की आवाज़ —';
          fallbackLogo = '/logos/jan-bharat-news.png';
          fallbackColor = '#1d4ed8';
        } else if (activeSiteSlug.includes('news-info') || activeSiteSlug.includes('city-bulletin')) {
          fallbackName = 'NEWS INFO 24';
          fallbackDesc = '— Stay Informed, Stay Ahead —';
          fallbackLogo = '/logos/news-info-24.jpeg';
          fallbackColor = '#dc2626';
        } else if (activeSiteSlug.includes('national-defence') || activeSiteSlug.includes('ndn') || activeSiteSlug.includes('state-express')) {
          fallbackName = 'National Defence Network';
          fallbackDesc = '— Defence Beyond Headlines —';
          fallbackLogo = '/logos/ndn-defence.jpeg';
          fallbackColor = '#15803d';
        } else if (activeSiteSlug.includes('bazar') || activeSiteSlug.includes('karobar')) {
          fallbackName = 'बाजार कारोबार';
          fallbackDesc = '— व्यापार और अर्थव्यवस्था —';
          fallbackLogo = '/logos/bazar-karobar.jpeg';
          fallbackColor = '#059669';
        } else if (activeSiteSlug.includes('golden-pearl')) {
          fallbackName = 'गोल्डन पर्ल क्रॉनिकल्स';
          fallbackDesc = '— सच के साथ निष्पक्ष —';
          fallbackLogo = '/logos/golden-pearl-chronicles.jpeg';
          fallbackColor = '#d97706';
        } else if (activeSiteSlug.includes('desh-ki-aawaz')) {
          fallbackName = 'देश की आवाज़';
          fallbackDesc = '— हर नागरिक की बुलंद आवाज़ —';
          fallbackLogo = '/logos/desh-ki-aawaz.jpeg';
          fallbackColor = '#7c3aed';
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

    const unsubLive = onSnapshot(collection(db, 'live_blogs'), (snap) => {
      const activeList: LiveBlogData[] = [];
      snap.forEach((d) => {
        const data = d.data();
        const liveSite = normalizeSiteId(data.siteId);
        if (data.isActive && (liveSite === activeSiteSlug || data.siteId === 'all')) {
          activeList.push({ id: d.id, ...data } as LiveBlogData);
        }
      });
      setLiveSessions(activeList);
    });

    async function loadData() {
      setLoading(true);
      try {
        // Sirf isi portal ki live khabrein (siteId ya multi-portal siteIds), nayi pehle; scheduled apne samay par
        setArticles(await fetchPortalArticles<ArticleItem>(activeSiteSlug));

        const qAds = query(collection(db, 'ads'));
        const adSnap = await getDocs(qAds);
        setHeaderAd(null);
        setSidebarAd(null);
        const feedAdsList: AdItem[] = [];

        adSnap.docs.forEach((docSnap) => {
          const rawData = docSnap.data();
          const adStatus = String(rawData.status || '').trim().toLowerCase();

          // Sirf isi portal ka (ya 'all' / bina portal) vigyapan
          const adSite = rawData.siteId;
          if (adSite && adSite !== 'all' && normalizeSiteId(adSite) !== activeSiteSlug) return;

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

            if (zoneStr.includes('classified') || formatStr.includes('classified') || typeStr.includes('classified')) {
              return;
            }

            // Impression ab SiteAds ginta hai — sirf jo vigyapan sach me dikha (yahan dobara nahi)

            if (zoneStr.includes('728') || zoneStr.includes('header') || zoneStr.includes('हेडर')) {
              setHeaderAd(cleanAd);
            } else if (zoneStr.includes('300') || zoneStr.includes('sidebar') || zoneStr.includes('साइडबार')) {
              setSidebarAd(cleanAd);
            } else if (zoneStr.includes('feed') || zoneStr.includes('banner') || zoneStr.includes('in-article')) {
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
        const cSite = normalizeSiteId(data.siteId);
        if ((st === 'active' || st === 'approved') && adNotExpired(data)) {
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
        const aSite = normalizeSiteId(data.siteId);

        if ((st === 'active' || st === 'approved') && adNotExpired(data) && (fmt === 'classified' || zn.includes('classified'))) {
          if (!data.siteId || aSite === activeSiteSlug || data.siteId === 'all') {
            adsClassifieds.push({
              id: d.id,
              title: data.name || data.title || (isEnglishSite ? 'Classified Advertisement' : 'क्लासिफाइड विज्ञापन'),
              category: data.category || (isEnglishSite ? 'Classified' : 'वर्गीकृत'),
              city: data.city || '',
              price: data.price || data.budget || '',
              contactNumber: data.contactNumber || '',
              imageUrl: data.imageUrl || '',
              videoUrl: data.videoUrl || '',
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
      // Server ka data aaj ka nahi hai toh chupchaap auto-sync; update hote hi yahi listener naya data dikhayega
      if (!snap.metadata.fromCache && !isRashifalFresh(map)) triggerRashifalAutoSync();
    });

    return () => {
      unsubSite();
      unsubLive();
      unsubRashifal();
      unsubClassifieds();
      unsubAdsForClassifieds();
    };
  }, [searchParams, isEnglishSite]);

  const primary = siteConfig?.primaryColor || '#ea580c';
  const headerBg = siteConfig?.headerBg || '#ffffff';
  const siteFont = siteConfig?.fontFamily || '"Mukta", system-ui, -apple-system, sans-serif';

  const portalCats = taxonomy
    .filter((c) => c.showInMenu && categoryOnPortal(c, currentSlug))
    .map((c) => ({ key: isEnglishSite ? c.name : c.nameHi, icon: c.icon }));
  // Jan Bharat / NDN / Desh Ki Aawaz / NEWS INFO 24 par e-paper nahi
  const portalHasEpaper = hasEpaper(currentSlug);
  const noEpaper = (m: { key: string }) => portalHasEpaper || (m.key !== 'ई-पेपर' && m.key !== 'E-Paper');
  const categories = (isEnglishSite ? [...MENU_HEAD_EN, ...portalCats, ...MENU_TAIL_EN] : [...MENU_HEAD_HI, ...portalCats, ...MENU_TAIL_HI]).filter(noEpaper);
  const trendingTagsCfg = useTrendingTags();
  const trendingTags = isEnglishSite ? trendingTagsCfg.en : trendingTagsCfg.hi;

  // Ye tabs saari khabrein dikhate hain; baaki koi bhi tab category filter hai
  const isFilterCategory = !HOME_TABS.includes(activeCategory);
  const isFilterActive = isFilterCategory || !!activeTrendTag || !!searchTerm.trim();

  const filteredArticles = articles.filter((art) => {
    if (!isArticleLive(art)) return false;

    if (activeCategory === 'लाइव' || activeCategory === 'Live') return false;

    // Trending tag active ho toh sirf us topic ki khabrein (title / summary / content / category / tags me)
    if (activeTrendTag) return matchesTrendTag(activeTrendTag, art);

    // Hindi tab English category wale articles bhi dikhaye (राजनीति = Politics)
    const matchesCategory = !isFilterCategory || categoryMatches(activeCategory, art.category);

    const cleanSearch = searchTerm.trim().toLowerCase();
    const matchesSearch =
      !cleanSearch ||
      (art.title && art.title.toLowerCase().includes(cleanSearch)) ||
      (art.titleHi && art.titleHi.toLowerCase().includes(cleanSearch)) ||
      (art.summary && art.summary.toLowerCase().includes(cleanSearch));
    return matchesCategory && matchesSearch;
  });

  const hasLiveStreams = liveSessions.length > 0;
  // Live streams sirf Live tab ya bina filter wale Home par — tag/search active ho toh sirf matching khabrein
  const showLiveInFeed =
    hasLiveStreams &&
    (activeCategory === 'लाइव' || activeCategory === 'Live' || ((activeCategory === 'होम' || activeCategory === 'Home') && !activeTrendTag && !searchTerm.trim()));

  const activeRashiItem = RASHI_LIST.find((r) => r.id === selectedRashi) || RASHI_LIST[0];
  const activeRashiInfo = rashifalData[selectedRashi];

  const tint = (hex: string, op: number) => {
    const r = parseInt(hex.slice(1, 3), 16),
      g = parseInt(hex.slice(3, 5), 16),
      b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${op})`;
  };

  const articleHref = (a: ArticleItem) => `/article/${a.slug || a.id}?site=${currentSlug}`;

  const SearchIcon = ({ size = 16 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="7" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );

  const appDownloadBox = (
    <div className="hp-app-box">
      <p className="hp-app-title">📱 {isEnglishSite ? 'Download App' : 'ऐप डाउनलोड करें'}</p>
      <p className="hp-app-sub">
        {isEnglishSite
          ? `Latest news, live updates${portalHasEpaper ? ', and e-paper' : ''} on your mobile.`
          : `ताज़ा खबरें, लाइव अपडेट${portalHasEpaper ? ' और ई-पेपर' : ''} अब आपके फ़ोन पर।`}
      </p>
      <a href={PLAY_STORE_URL} target="_blank" rel="noopener noreferrer" className="hp-store">
        <svg width="20" height="20" viewBox="0 0 24 24" fill={primary} aria-hidden="true">
          <path d="M5 3.5v17a.5.5 0 0 0 .76.43l14-8.5a.5.5 0 0 0 0-.86l-14-8.5A.5.5 0 0 0 5 3.5z" />
        </svg>
        <span>
          <small>GET IT ON</small>
          <strong>Google Play</strong>
        </span>
      </a>
      <a href={APP_STORE_URL} target="_blank" rel="noopener noreferrer" className="hp-store">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={primary} strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <rect x="6" y="2" width="12" height="20" rx="2.5" />
          <line x1="11" y1="18" x2="13" y2="18" />
        </svg>
        <span>
          <small>Download on the</small>
          <strong>App Store</strong>
        </span>
      </a>
    </div>
  );

  // Header: jagah naapo — (0) sab poora, (1) Journalist/Advertise sirf icon + switcher naam chhota,
  // (2) tab bhi na aaye toh menu ☰ me. Aadha menu / kata hua button kabhi nahi.
  const headerInRef = useRef<HTMLDivElement>(null);
  const brandRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const toolsRef = useRef<HTMLDivElement>(null);
  const fitRef = useRef({ nav: 0, toolsFull: 0, toolsCompact: 0, level: 0 });
  // Lamba right sidebar: smart sticky (khabron ke saath khaali jagah nahi)
  const rightSideRef = useRef<HTMLElement>(null);
  useStickySidebar(rightSideRef, { top: 90, minWidth: 821 });
  const [headerLevel, setHeaderLevel] = useState(0);
  useEffect(() => {
    const check = () => {
      const h = headerInRef.current, b = brandRef.current, n = navRef.current, t = toolsRef.current;
      if (!h || !b || !t || t.offsetWidth === 0) return; // mobile: CSS sambhalta hai
      const m = fitRef.current;
      if (n && n.offsetWidth > 0) m.nav = n.scrollWidth;
      if (m.level === 0) {
        m.toolsFull = t.offsetWidth;
        let save = 0;
        t.querySelectorAll<HTMLElement>('.hp-tool-text').forEach((el) => (save += el.offsetWidth + 4));
        const ss = t.querySelector<HTMLElement>('.ss-name');
        if (ss && ss.offsetWidth > 120) save += ss.offsetWidth - 120;
        m.toolsCompact = m.toolsFull - save;
      } else {
        m.toolsCompact = t.offsetWidth;
      }
      if (!m.nav) return;
      const cs = getComputedStyle(h);
      const gap = parseFloat(cs.columnGap || '0') || 0;
      const brand = (b.querySelector<HTMLElement>('.hp-brand')?.offsetWidth || b.offsetWidth) + 2;
      const inner = h.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight) - brand - gap * 2;
      const level = m.nav + m.toolsFull <= inner ? 0 : m.nav + m.toolsCompact <= inner ? 1 : 2;
      if (level !== m.level) {
        m.level = level;
        setHeaderLevel(level);
      }
    };
    check();
    const ro = new ResizeObserver(check);
    [headerInRef.current, brandRef.current, toolsRef.current].forEach((el) => el && ro.observe(el));
    window.addEventListener('resize', check);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', check);
    };
  }, []);

  const categoryButtons = (
    <>
      {categories.map(({ key, icon }) => {
        const isActive = activeCategory === key && !activeTrendTag;
        return (
          <button
            key={key}
            className="hp-cat"
            onClick={() => handleCategoryClick(key)}
            style={{
              color: isActive ? primary : (key === 'लाइव' || key === 'Live') && hasLiveStreams ? '#ef4444' : '#333',
              background: isActive ? tint(primary, 0.08) : undefined,
              fontWeight: isActive ? 700 : 500
            }}
          >
            <span className="hp-ico hp-ico-cat">{icon}</span>
            <span className="hp-txt">{key}</span>
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
            {(() => {
              const shortTeam = (t: string) => t.replace(/Under-19s?/i, 'U19').replace(/\bWomen\b/i, 'W').replace(/United States of America/i, 'USA').replace(/United Arab Emirates/i, 'UAE');
              const items: { key: string; label: string; value: string; color: string; live?: boolean }[] = [];
              if (weather && !weather.error) {
                const place = isEnglishSite ? weather.city : weather.cityHi;
                items.push({
                  key: 'weather',
                  label: `${weather.icon} ${place || (isEnglishSite ? 'Weather' : 'मौसम')}`,
                  value: `${weather.temp}°C ${isEnglishSite ? weather.textEn : weather.textHi} · ${weather.max}°/${weather.min}°${weather.rainChance >= 30 ? ` · 🌧 ${weather.rainChance}%` : ''}`,
                  color: '#7dd3fc'
                });
              }
              cricket.slice(0, 2).forEach((m: any, i: number) =>
                items.push({
                  key: `cric-${i}`,
                  label: '🏏',
                  value: `${shortTeam(m.team1)} ${m.score1 || ''} vs ${shortTeam(m.team2)} ${m.score2 || ''}`.replace(/\s+/g, ' ').trim(),
                  color: m.live ? '#4ade80' : '#e2e8f0',
                  live: m.live
                })
              );
              const market: { label: string; value: string; color: string }[] = [
              { label: isEnglishSite ? 'Petrol (Indore)' : 'पेट्रोल (इंदौर)', value: marketRates.petrol, color: '#fff' },
              { label: isEnglishSite ? 'Diesel (Indore)' : 'डीज़ल (इंदौर)', value: marketRates.diesel, color: '#fff' },
              {
                label: isEnglishSite ? 'Nifty 50' : 'निफ्टी 50',
                value: `${marketRates.nifty} ${marketRates.niftyPositive ? '▲' : '▼'} ${marketRates.niftyChange}`,
                color: marketRates.niftyPositive ? '#34d399' : '#f87171'
              },
              {
                label: isEnglishSite ? 'Sensex' : 'सेंसेक्स',
                value: `${marketRates.sensex} ${marketRates.sensexPositive ? '▲' : '▼'} ${marketRates.sensexChange}`,
                color: marketRates.sensexPositive ? '#34d399' : '#f87171'
              },
              { label: isEnglishSite ? 'Gold 10g*' : 'सोना 10 ग्रा.*', value: marketRates.gold, color: '#fbbf24' },
              { label: isEnglishSite ? 'Silver 1kg*' : 'चांदी 1 किग्रा*', value: marketRates.silver, color: '#cbd5e1' }
              ];
              market.forEach((m) => items.push({ key: m.label, ...m }));
              const row = (copy: boolean) =>
                items.map((item, i) => (
                  <span key={`${copy ? 'c' : 'o'}-${item.key}`} className={copy ? 'hp-ticker-copy' : undefined} style={{ display: 'inline-flex', alignItems: 'center', gap: '10px' }} aria-hidden={copy || undefined}>
                    {(i > 0 || copy) && <span className="hp-ticker-sep">│</span>}
                    <span>
                      {item.live && <span className="hp-ticker-live">LIVE</span>}
                      <span className="hp-ticker-label">{item.label}</span>
                      <span style={{ color: item.color, fontWeight: 600 }}>{item.value}</span>
                    </span>
                  </span>
                ));
              return (
                <div className="hp-ticker-track" style={{ ['--hp-ticker-dur' as any]: `${Math.max(35, items.length * 7)}s` }}>
                  {row(false)}
                  {row(true)}
                </div>
              );
            })()}
          </div>
          <div className="hp-ticker-date">
            <span style={{ marginRight: '5px' }}>📅</span>
            {currentDisplayDate || '...'}
          </div>
        </div>
      </div>

      {/* ═══ 2. HEADER ═══ */}
      <header className={`hp-header${headerLevel >= 1 ? ' hp-tools-compact' : ''}${headerLevel === 2 ? ' hp-nav-collapsed' : ''}`} style={{ background: headerBg, borderTop: `3px solid ${primary}` }}>
        <div className="hp-header-in" ref={headerInRef}>
          {/* Left: Brand Logo & Title */}
          <div className="hp-brand-wrap" ref={brandRef}>
            <button className="hp-menu-btn" onClick={() => setDrawerOpen(true)} aria-label="मेनू">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
            <Link href={`/?site=${currentSlug}`} className="hp-brand">
              {siteConfig && (
                <img src={logoFor(currentSlug, siteConfig.logoUrl)} alt={siteConfig?.name || 'लोगो'} className="hp-logo" />
              )}
              <div style={{ minWidth: 0 }}>
                <h1 className="hp-site-name notranslate" translate="no" style={{ color: primary }}>
                  {siteConfig?.name || (isEnglishSite ? 'National Defence Network' : 'द लोकल लीडर')}
                </h1>
                <p className="hp-tagline">{siteConfig?.description || (isEnglishSite ? 'Defence Beyond Headlines' : 'जनता की आवाज़, सच्चाई के साथ')}</p>
              </div>
            </Link>
          </div>

          {/* Desktop Nav Pills */}
          <nav className="hp-nav" ref={navRef}>
            {[
              { key: isEnglishSite ? 'Home' : 'होम', emoji: '🏠' },
              { key: isEnglishSite ? 'Live' : 'लाइव', emoji: '🔴' },
              { key: isEnglishSite ? 'Videos' : 'वीडियो', emoji: '📹' },
              { key: isEnglishSite ? 'Latest News' : 'ताज़ा खबरें', emoji: '⚡' },
              ...(isEnglishSite ? [] : [{ key: 'शोक संदेश', emoji: '🕯️' }]),
              { key: isEnglishSite ? 'Matrimony' : 'विवाह', emoji: '💍' },
              { key: isEnglishSite ? 'E-Paper' : 'ई-पेपर', emoji: '📄' }
            ].filter(noEpaper).map(({ key, emoji }) => {
              const isActive = activeCategory === key && !activeTrendTag;
              return (
                <button
                  key={key}
                  className="hp-nav-btn"
                  onClick={() => handleCategoryClick(key)}
                  style={{
                    color: isActive ? primary : (key === 'लाइव' || key === 'Live') && hasLiveStreams ? '#ef4444' : '#555',
                    background: isActive ? tint(primary, 0.08) : 'transparent',
                    fontWeight: isActive ? 700 : 500
                  }}
                >
                  <span className="hp-ico">{emoji}</span>
                  <span className="hp-txt">{key}</span>
                </button>
              );
            })}
          </nav>

          {/* Desktop Tools */}
          <div className="hp-tools hp-desktop-tools" ref={toolsRef}>
            <Link href={`/patrakar/login?site=${currentSlug}`} className="hp-tool-link" title={isEnglishSite ? 'Journalist' : 'पत्रकार'}>
              ✍️<span className="hp-tool-text"> {isEnglishSite ? 'Journalist' : 'पत्रकार'}</span>
            </Link>
            <Link href={`/advertiser/login?site=${currentSlug}`} className="hp-tool-link" title={isEnglishSite ? 'Advertise' : 'विज्ञापन'}>
              📢<span className="hp-tool-text"> {isEnglishSite ? 'Advertise' : 'विज्ञापन'}</span>
            </Link>
            <SiteSwitcher currentSlug={currentSlug} primaryColor={primary} />
            <Suspense fallback={null}>
              <LanguageTranslator />
            </Suspense>
            <button
              onClick={() => setSearchModalOpen(true)}
              style={{ background: '#f5f4f1', border: '1px solid #e5e3df', borderRadius: '22px', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', color: '#777', fontSize: '12px', flexShrink: 0 }}
            >
              <SearchIcon size={14} />
              <span className="hp-tool-text">{isEnglishSite ? 'Search' : 'खोजें'}</span>
            </button>
            <NotificationBell
              portal={currentSlug}
              loggedIn={!!readerUser}
              userKey={readerUser?.phone || readerUser?.uid || 'guest'}
              primaryColor={primary}
              isEnglish={isEnglishSite}
              siteQuery={`site=${currentSlug}`}
            />
            {readerUser ? (
              <ReaderProfileMenu
                user={readerUser}
                primaryColor={primary}
                isEnglish={isEnglishSite}
                onLogout={handleReaderLogout}
                onOpenRewards={() => router.push(`/refer?site=${currentSlug}`)}
              />
            ) : (
              <Link href="/login" className="hp-login" style={{ background: primary }}>
                {isEnglishSite ? 'Login' : 'लॉगिन'}
              </Link>
            )}
          </div>

          {/* Mobile Tools */}
          <div className="hp-mobile-tools">
            <SiteSwitcher currentSlug={currentSlug} primaryColor={primary} />
            <button
              onClick={() => setSearchModalOpen(true)}
              aria-label="सर्च"
              style={{ background: '#f5f4f1', border: '1px solid #e5e3df', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, color: '#555' }}
            >
              <SearchIcon size={15} />
            </button>
            <NotificationBell
              portal={currentSlug}
              loggedIn={!!readerUser}
              userKey={readerUser?.phone || readerUser?.uid || 'guest'}
              primaryColor={primary}
              isEnglish={isEnglishSite}
              siteQuery={`site=${currentSlug}`}
            />
            {readerUser ? (
              <ReaderProfileMenu
                user={readerUser}
                primaryColor={primary}
                isEnglish={isEnglishSite}
                compact
                onLogout={handleReaderLogout}
                onOpenRewards={() => router.push(`/refer?site=${currentSlug}`)}
              />
            ) : (
              <Link href="/login" className="hp-login" style={{ background: primary, padding: '6px 12px', fontSize: '12px' }}>
                {isEnglishSite ? 'Login' : 'लॉगिन'}
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
                placeholder={isEnglishSite ? 'Search news...' : 'खबरें खोजें...'}
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
                “{searchTerm}” {isEnglishSite ? 'Search results…' : 'के लिए परिणाम देखें…'}
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
            <strong className="notranslate" translate="no" style={{ color: primary, fontSize: '16px' }}>{siteConfig?.name || 'द लोकल लीडर'}</strong>
            <button className="hp-drawer-close" onClick={() => setDrawerOpen(false)} aria-label="बंद करें">
              ✕
            </button>
          </div>
          {categoryButtons}
          <div className="hp-drawer-links">
            <Link href={`/patrakar/login?site=${currentSlug}`} className="hp-tool-link">
              ✍️ {isEnglishSite ? 'Journalist' : 'पत्रकार'}
            </Link>
            <Link href={`/advertiser/login?site=${currentSlug}`} className="hp-tool-link">
              📢 {isEnglishSite ? 'Advertise' : 'विज्ञापन'}
            </Link>
          </div>
          {appDownloadBox}
        </aside>
      )}

      {/* ═══ 3. THREE-COLUMN SHELL ═══ */}
      <div className="hp-shell">
        {/* ── LEFT SIDEBAR ── */}
        <aside className="hp-side hp-left">
          <div className="hp-box">
            <h3 className="hp-box-title" style={{ borderColor: primary }}>{isEnglishSite ? 'Categories' : 'श्रेणियाँ'}</h3>
            {categoryButtons}
            {appDownloadBox}
          </div>
        </aside>

        {/* ── CENTER COLUMN (MAIN NEWS FEED & LIVE FEED) ── */}
        <main className="hp-main">
          {/* Header banner — SiteAds (har page jaisa: rotation, repeat nahi) */}
          <AdBanner slug={currentSlug} height={130} />

          {/* ── TRENDING TAGS — banner ad ke neeche, khabron ke upar ── */}
          {activeCategory !== 'लाइव' && activeCategory !== 'Live' && (
            <div className="hp-tags">
              <span className="hp-tags-label" style={{ color: primary }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                  <polyline points="17 6 23 6 23 12" />
                </svg>
                {isEnglishSite ? 'Trending' : 'ट्रेंडिंग'}
              </span>
              {trendingTags.map((t: string) => {
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
          {(activeCategory === 'लाइव' || activeCategory === 'Live') && (
            <h2 className="hp-section-title" style={{ borderColor: primary }}>
              {isEnglishSite ? 'Live Coverage Streams' : 'लाइव प्रसारण कवरेज (Live Streams)'}
            </h2>
          )}

          {/* ── ARTICLES FEED ── */}
          {activeCategory === 'लाइव' || activeCategory === 'Live' ? (
            !hasLiveStreams && (
              <EmptyState
                primaryColor={primary}
                icon={<span style={{ fontSize: '28px' }}>📡</span>}
                title={isEnglishSite ? 'No active live stream right now' : 'वर्तमान में कोई लाइव प्रसारण सक्रिय नहीं है'}
                message={isEnglishSite ? 'Live coverage will appear here once started.' : 'जैसे ही कोई विशेष लाइव कवरेज शुरू होगी, वह यहाँ प्रदर्शित हो जाएगी।'}
                actionLabel={isEnglishSite ? 'View All News' : 'सभी खबरें देखें'}
                onAction={resetNewsFilters}
              />
            )
          ) : loading ? (
            <FeedSkeleton label={isEnglishSite ? 'Loading news…' : 'खबरें लोड हो रही हैं…'} />
          ) : filteredArticles.length === 0 && !showLiveInFeed ? (
            isFilterActive ? (
              // Category / trending tag / search me koi khabar nahi — filter hata kar saari khabrein dikhane ka button
              <EmptyState
                primaryColor={primary}
                title={
                  activeTrendTag
                    ? isEnglishSite
                      ? 'No news available on this topic yet'
                      : 'इस विषय में अभी कोई खबर उपलब्ध नहीं है'
                    : searchTerm.trim()
                      ? isEnglishSite
                        ? `No news found for "${searchTerm.trim()}"`
                        : `"${searchTerm.trim()}" से जुड़ी कोई खबर नहीं मिली`
                      : isEnglishSite
                        ? 'No news available in this category yet'
                        : 'इस श्रेणी में अभी कोई खबर उपलब्ध नहीं है'
                }
                message={
                  activeTrendTag
                    ? isEnglishSite
                      ? 'Fresh news related to this trending topic will be updated soon.'
                      : 'इस ट्रेंडिंग टॉपिक से संबंधित ताज़ा समाचार जल्द ही अपडेट किए जाएंगे।'
                    : isEnglishSite
                      ? 'We will update fresh news in this category soon. Please explore other categories or go back to the home page.'
                      : 'हम जल्द ही इस श्रेणी में ताज़ा समाचार अपडेट करेंगे। कृपया अन्य श्रेणियां देखें या मुख्य पृष्ठ पर वापस जाएं।'
                }
                actionLabel={isEnglishSite ? 'View All News' : 'सभी खबरें देखें'}
                onAction={resetNewsFilters}
              />
            ) : (
              <EmptyState
                primaryColor={primary}
                title={isEnglishSite ? 'No approved news articles available yet' : 'अभी कोई स्वीकृत खबर उपलब्ध नहीं है'}
                message={
                  isEnglishSite
                    ? 'Articles will appear here once reviewed by the editor.'
                    : 'संपादक द्वारा समीक्षा एवं अनुमोदन के बाद ही खबरें यहां प्रदर्शित होती हैं।'
                }
              />
            )
          ) : (
            <div className="hp-list">
              {filteredArticles[0] && (
                <Link href={articleHref(filteredArticles[0])} className="hp-hero">
                  {filteredArticles[0].image && (
                    <img src={filteredArticles[0].image} alt={filteredArticles[0].title} className="hp-hero-img" fetchPriority="high" decoding="async" />
                  )}
                  <div className="hp-hero-body">
                    <span className="hp-badge" style={{ background: primary }}>
                      {filteredArticles[0].category || (isEnglishSite ? 'Top Story' : 'ताज़ा खबर')}
                    </span>
                    <h2 className="hp-hero-title">{filteredArticles[0].title}</h2>
                    {filteredArticles[0].summary && <p className="hp-hero-summary">{filteredArticles[0].summary}</p>}
                    <div className="hp-meta">
                      <span>
                        {filteredArticles[0].createdAt ? String(filteredArticles[0].createdAt).split('T')[0] : currentDisplayDate}
                      </span>
                      <span>
                        👁 {filteredArticles[0].views || 0} {isEnglishSite ? 'views' : 'बार पढ़ा गया'}
                      </span>
                    </div>
                  </div>
                </Link>
              )}

              {filteredArticles.slice(1).map((item, index) => {
                const showAd = (index + 1) % 3 === 0;
                const adIndex = Math.floor(index / 3);

                return (
                  <Fragment key={item.id}>
                    <Link href={articleHref(item)} className="hp-item">
                      <div className="hp-item-body">
                        <span className="hp-item-cat" style={{ color: primary }}>
                          {item.category}
                        </span>
                        <h3 className="hp-item-title">{item.title}</h3>
                        <div className="hp-meta">
                          <span>{item.createdAt ? String(item.createdAt).split('T')[0] : isEnglishSite ? 'Today' : 'आज'}</span>
                          <span>👁 {item.views || 0}</span>
                        </div>
                      </div>
                      {item.image && <img src={item.image} alt={item.title} className="hp-item-img" loading="lazy" />}
                    </Link>

                    {/* Har 3 khabar ke baad banner — har jagah alag vigyapan, khaali ho toh sirf ek baar "यहाँ विज्ञापन दें" */}
                    {showAd && <AdInline slug={currentSlug} index={adIndex} />}
                  </Fragment>
                );
              })}
            </div>
          )}

          {/* 🔴 MULTIPLE LIVE STREAMS GRID — khabron ke neeche */}
          {showLiveInFeed && (
            <section className="hp-live">
              <div className="hp-live-head">
                <h2 className="hp-live-title">
                  🔴 {isEnglishSite ? `Live Broadcast Coverage (${liveSessions.length} Live)` : `लाइव कवरेज प्रसारण (${liveSessions.length} Live)`}
                </h2>
                <span className="hp-live-pill">{isEnglishSite ? 'LIVE' : 'सीधा प्रसारण'}</span>
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
                        <span className="notranslate" translate="no" style={{ color: '#888', fontWeight: 600 }}>
                          {session.siteId === 'all' ? siteConfig?.name || (isEnglishSite ? 'National Defence Network' : 'द लोकल लीडर') : session.siteId}
                        </span>
                      </div>
                      <h3 className="hp-live-card-title">{session.title}</h3>
                      {session.updates && session.updates.length > 0 && (
                        <div className="hp-updates">
                          <strong style={{ color: '#c2410c' }}>⚡ {isEnglishSite ? 'Latest Updates:' : 'ताज़ा अपडेट:'}</strong>
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
        </main>

        {/* ── RIGHT SIDEBAR ── */}
        <aside className="hp-side hp-right" ref={rightSideRef}>
          {/* Sidebar vigyapan (300 × 250) — 4 jagah: 2 upar, 1 rashifal ke baad, 1 classifieds ke baad */}
          <AdSideSlots slug={currentSlug} from={0} to={2} />

          {/* 🔮 RASHIFAL WIDGET */}
          <div className="hp-box" id="rashifal" style={{ scrollMarginTop: '90px' }}>
            <h3 className="hp-box-title" style={{ borderColor: primary }}>🔮 {isEnglishSite ? "Today's Horoscope" : 'आज का राशिफल'}</h3>
            <div className="hp-rashi-grid">
              {RASHI_LIST.map((r) => {
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
                    {isEnglishSite ? r.nameEn : r.name}
                  </button>
                );
              })}
            </div>
            <div style={{ background: '#faf9f6', borderRadius: '10px', padding: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '8px', flexWrap: 'wrap' }}>
                <strong style={{ fontSize: '14px', color: primary }}>
                  {activeRashiItem.sign} {isEnglishSite ? activeRashiItem.nameEn : activeRashiItem.name}
                </strong>
                {activeRashiInfo?.date && (
                  <span style={{ fontSize: '11.5px', color: '#888' }}>📅 {formatRashifalDate(activeRashiInfo.date, isEnglishSite)}</span>
                )}
              </div>
              <p className="hp-rashi-text" style={{ marginTop: '6px' }}>
                {activeRashiInfo?.prediction ||
                  activeRashiInfo?.text ||
                  activeRashiInfo?.description ||
                  (isEnglishSite ? "Today's horoscope will be updated soon." : 'आज का राशिफल जल्द ही अपडेट किया जाएगा।')}
              </p>
              {(activeRashiInfo?.luckyNumber || activeRashiInfo?.luckyColor) && (
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '10px' }}>
                  {activeRashiInfo?.luckyNumber && (
                    <span style={{ fontSize: '12px', fontWeight: 600, background: '#fff', border: '1px solid #eae8e4', borderRadius: '20px', padding: '4px 10px', color: '#444' }}>
                      🔢 {isEnglishSite ? 'Lucky No.' : 'शुभ अंक'}: <b style={{ color: primary }}>{activeRashiInfo.luckyNumber}</b>
                    </span>
                  )}
                  {activeRashiInfo?.luckyColor && (
                    <span style={{ fontSize: '12px', fontWeight: 600, background: '#fff', border: '1px solid #eae8e4', borderRadius: '20px', padding: '4px 10px', color: '#444' }}>
                      🎨 {isEnglishSite ? 'Lucky Colour' : 'शुभ रंग'}: <b style={{ color: primary }}>{activeRashiInfo.luckyColor}</b>
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          <AdSideSlots slug={currentSlug} from={2} to={3} />

          {/* 📋 CLASSIFIED ADS WIDGET */}
          <div className="hp-box">
            <h3 className="hp-box-title" style={{ borderColor: primary }}>📋 {isEnglishSite ? 'Classified Ads' : 'क्लासिफाइड विज्ञापन'}</h3>
            {classifiedAds.length === 0 ? (
              <p style={{ fontSize: '13px', color: '#888', margin: 0 }}>
                {isEnglishSite ? 'No classified ads available right now.' : 'अभी कोई क्लासिफाइड विज्ञापन उपलब्ध नहीं है।'}
              </p>
            ) : (
              classifiedAds.map((c) => (
                <div key={c.id} className="hp-classified">
                  {c.imageUrl || c.videoUrl ? (
                    <AdMedia ad={c} alt={c.title} className="hp-classified-img" />
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
            <Link
              href={`/classifieds?site=${currentSlug}`}
              className="hp-see-all"
              style={{ color: primary, borderColor: primary }}
            >
              {isEnglishSite ? 'View All Classifieds →' : 'सभी क्लासिफाइड देखें →'}
            </Link>
          </div>

          <AdSideSlots slug={currentSlug} from={3} to={4} />
        </aside>
      </div>

      <Footer
        siteName={siteConfig?.name || 'द लोकल लीडर'}
        primaryColor={primary}
        logoUrl={logoFor(currentSlug, siteConfig?.logoUrl)}
        tagline={siteConfig?.description || '— जनता की आवाज़, सच्चाई के साथ —'}
        currentSlug={currentSlug}
        showAds={false}
      />
    </div>
  );
}

export default function HomePage(props: { initialArticles?: any[]; initialSlug?: string } = {}) {
  return (
    <Suspense
      fallback={
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#f7f6f3',
            color: '#888',
            fontSize: '15px'
          }}
        >
          Loading…
        </div>
      }
    >
      <HomePageContent {...props} />
    </Suspense>
  );
}