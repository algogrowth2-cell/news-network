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
  const siteFont = siteConfig?.fontFamily || 'system-ui, -apple-system, sans-serif';

  const filteredArticles = articles.filter(art => {
    // Extra safety lock on render: only allow published or approved
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
    <div style={{ minHeight: '100vh', background: '#f8fafc', color: '#0f172a', fontFamily: siteFont, display: 'flex', flexDirection: 'column' }}>
      
      <style jsx global>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        
        .main-header-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
        }
        .main-header-actions {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .home-main-grid {
          display: grid;
          grid-template-columns: minmax(0, 2.2fr) minmax(0, 1fr);
          gap: 28px;
        }
        .sub-cards-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 18px;
        }
        .lead-hero-img-box {
          width: 100%;
          height: 420px;
          background: #0f172a;
          position: relative;
        }
        .top-sub-bar-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
        }
        .header-logo-img {
          height: 60px;
          width: auto;
          object-fit: contain;
          border-radius: 4px;
        }
        .header-site-title {
          font-size: 24px;
          font-weight: 900;
          line-height: 1.1;
        }

        @media (max-width: 900px) {
          .home-main-grid {
            grid-template-columns: 1fr;
            gap: 20px;
          }
        }

        @media (max-width: 640px) {
          .main-header-row {
            flex-direction: column;
            align-items: flex-start;
          }
          .main-header-actions {
            width: 100%;
            justify-content: space-between;
            flex-wrap: wrap;
            margin-top: 4px;
          }
          .sub-cards-grid {
            grid-template-columns: 1fr;
          }
          .lead-hero-img-box {
            height: 240px;
          }
          .header-logo-img {
            height: 46px;
          }
          .header-site-title {
            font-size: 20px;
          }
          .top-sub-bar-row {
            flex-direction: column;
            align-items: flex-start;
            gap: 8px;
          }
        }
      `}</style>

      {/* 1. DYNAMIC TOP MARKET STATS TICKER & LIVE DATE */}
      <div style={{ background: '#0b0f19', color: '#cbd5e1', fontSize: '11.5px', padding: '6px 0', borderBottom: '1px solid #1e293b' }}>
        <div style={{ maxWidth: '1240px', margin: '0 auto', padding: '0 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="hide-scrollbar" style={{ display: 'flex', gap: '16px', alignItems: 'center', overflowX: 'auto', whiteSpace: 'nowrap' }}>
            <span>Diesel (Delhi) <b style={{ color: '#fff' }}>{marketRates.diesel}</b></span>
            <span>Petrol (Delhi) <b style={{ color: '#fff' }}>{marketRates.petrol}</b></span>
            <span>
              Nifty <b style={{ color: marketRates.niftyPositive ? '#4ade80' : '#f87171' }}>
                {marketRates.nifty} {marketRates.niftyPositive ? '↗' : '↘'} {marketRates.niftyChange}
              </b>
            </span>
            <span>
              Sensex <b style={{ color: marketRates.sensexPositive ? '#4ade80' : '#f87171' }}>
                {marketRates.sensex} {marketRates.sensexPositive ? '↗' : '↘'} {marketRates.sensexChange}
              </b>
            </span>
            <span>Silver <b style={{ color: '#fff' }}>{marketRates.silver}</b></span>
            <span>Gold <b style={{ color: '#fff' }}>{marketRates.gold}</b></span>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', whiteSpace: 'nowrap', paddingLeft: '12px', flexShrink: 0 }}>
            <span>{currentHindiDate || 'लोड हो रहा है...'}</span>
          </div>
        </div>
      </div>

      {/* 2. SUB-UTILITY TOP BAR */}
      <div style={{ background: '#111827', color: '#94a3b8', fontSize: '12px', padding: '6px 0', borderBottom: '1px solid #1f2937' }}>
        <div className="top-sub-bar-row" style={{ maxWidth: '1240px', margin: '0 auto', padding: '0 16px' }}>
          <div className="hide-scrollbar" style={{ display: 'flex', gap: '16px', overflowX: 'auto', whiteSpace: 'nowrap', width: '100%' }}>
            {['वीडियो', 'राशिफल', 'वेब स्टोRIES', 'फोटो गैलरी', 'ई-पेपर', 'शोक संदेश', 'क्लासिफाइड'].map((item) => (
              <span 
                key={item} 
                onClick={() => handleCategoryClick(item)} 
                style={{ 
                  cursor: 'pointer',
                  color: activeCategory === item ? primary : 'inherit',
                  fontWeight: activeCategory === item ? 700 : 400
                }}
              >
                {item}
              </span>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            <Link href="/patrakar/login" style={{ background: '#374151', color: '#fff', padding: '4px 8px', borderRadius: '4px', textDecoration: 'none', fontSize: '11px', fontWeight: 600 }}>
              पत्रकार पोर्टल
            </Link>
            <Link href="/advertiser/login" style={{ background: primary, color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600, textDecoration: 'none', display: 'inline-block' }}>
              विज्ञापन दें
            </Link>
            
            <LanguageTranslator />
            
            <span style={{ color: '#6b7280' }}>|</span>

            {readerUser ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: '#4ade80', fontSize: '11.5px', fontWeight: 600 }}>
                  👤 {readerUser.name || 'पाठक'}
                </span>
                <button 
                  onClick={handleReaderLogout} 
                  style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: '3px', padding: '2px 6px', fontSize: '10.5px', cursor: 'pointer', fontWeight: 600 }}
                >
                  लॉग आउट
                </button>
              </div>
            ) : (
              <Link href="/login" style={{ color: '#f3f4f6', textDecoration: 'none', fontSize: '11.5px', fontWeight: 600 }}>
                लॉगिन
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* 3. MAIN HEADER */}
      <header style={{ background: headerBg, borderBottom: '1px solid #e5e7eb', padding: '12px 0' }}>
        <div className="main-header-row" style={{ maxWidth: '1240px', margin: '0 auto', padding: '0 16px' }}>
          
          <Link href={`/?site=${currentSlug}`} style={{ textDecoration: 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <img 
                src={siteConfig?.logoUrl || `/logos/${currentSlug}.jpeg`} 
                alt={siteConfig?.name || 'News Portal'} 
                className="header-logo-img"
              />
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span className="header-site-title" style={{ color: headerBg === '#ffffff' ? '#1e242b' : '#ffffff' }}>
                  {siteConfig?.name || 'The Local Leader'}
                </span>
                <span style={{ fontSize: '11px', color: primary, fontWeight: 700, marginTop: '2px' }}>
                  {siteConfig?.description || '— जनता की आवाज़, सच्चाई के साथ —'}
                </span>
              </div>
            </div>
          </Link>

          <div className="main-header-actions">
            <SiteSwitcher 
              currentSlug={currentSlug} 
              primaryColor={primary} 
            />

            <div style={{ display: 'flex', alignItems: 'center', background: '#f1f5f9', borderRadius: '20px', padding: '6px 12px', border: '1px solid #e2e8f0', flex: 1, minWidth: '130px' }}>
              <input 
                type="text" 
                placeholder="खबर खोजें..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{ background: 'transparent', border: 'none', outline: 'none', fontSize: '12px', width: '100%', color: '#334155' }} 
              />
              <span style={{ cursor: 'pointer', color: '#64748b', fontSize: '13px' }}>🔍</span>
            </div>

            {readerUser ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#fff7ed', padding: '6px 10px', borderRadius: '8px', border: `1px solid ${primary}` }}>
                <div style={{ width: '24px', height: '24px', background: primary, color: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '11px' }}>
                  {readerUser.name ? readerUser.name[0].toUpperCase() : 'U'}
                </div>
                <button onClick={handleReaderLogout} style={{ background: 'none', border: 'none', color: primary, fontSize: '11px', cursor: 'pointer', fontWeight: 700, padding: 0 }}>लॉग आउट</button>
              </div>
            ) : (
              <Link 
                href="/login" 
                style={{
                  background: primary,
                  color: '#fff',
                  padding: '7px 14px',
                  borderRadius: '6px',
                  fontWeight: 700,
                  fontSize: '12px',
                  textDecoration: 'none',
                  whiteSpace: 'nowrap'
                }}
              >
                👤 लॉगिन
              </Link>
            )}

          </div>
        </div>
      </header>

      {/* 4. DYNAMIC NAVIGATION BAR */}
      <nav style={{ background: '#ffffff', borderBottom: `2px solid ${primary}`, boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
        <div className="hide-scrollbar" style={{ maxWidth: '1240px', margin: '0 auto', padding: '0 16px', display: 'flex', gap: '24px', overflowX: 'auto', whiteSpace: 'nowrap' }}>
          {['होम', 'राजनीति', 'व्यापार', 'स्वास्थ्य', 'जीवनशैली', 'राज्य', 'ई-पेपर', 'अपराध', 'खेल'].map((cat) => {
            const isActive = activeCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => handleCategoryClick(cat)}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: '11px 0',
                  fontSize: '13.5px',
                  fontWeight: 700,
                  color: isActive ? primary : '#334155',
                  borderBottom: isActive ? `3px solid ${primary}` : '3px solid transparent',
                  cursor: 'pointer'
                }}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </nav>

      {/* 5. TOP LEADERBOARD AD */}
      <div style={{ maxWidth: '1240px', margin: '14px auto 0 auto', padding: '0 16px', width: '100%', boxSizing: 'border-box' }}>
        <div style={{ minHeight: '80px', maxHeight: '100px', background: '#e2e8f0', borderRadius: '4px', border: '1px solid #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
          {headerAd ? (
            <a href={headerAd.targetUrl || '#'} target="_blank" rel="noopener noreferrer" style={{ display: 'block', width: '100%', height: '100%' }}>
              <img src={headerAd.imageUrl} alt={headerAd.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </a>
          ) : (
            <span style={{ color: '#64748b', fontSize: '12px', letterSpacing: '1px', textTransform: 'uppercase', padding: '12px', textAlign: 'center' }}>
              Responsive Header Leaderboard Ad Zone (728 x 90)
            </span>
          )}
        </div>
      </div>

      {/* 6. DYNAMIC RASHIFAL */}
      <div style={{ maxWidth: '1240px', margin: '18px auto 0 auto', padding: '0 16px', width: '100%', boxSizing: 'border-box' }}>
        <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '20px' }}>🔮</span>
              <h3 style={{ fontSize: '15px', fontWeight: 800, margin: 0, color: '#1e293b' }}>
                दैनिक राशिफल एवं पंचांग
              </h3>
            </div>
            <span style={{ fontSize: '11.5px', color: '#64748b' }}>
              {activeRashiInfo?.date || currentHindiDate}
            </span>
          </div>
          
          <div className="hide-scrollbar" style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px' }}>
            {DEFAULT_RASHI_LIST.map((r) => {
              const isSelected = selectedRashi === r.id;
              return (
                <button
                  key={r.id}
                  onClick={() => setSelectedRashi(r.id)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minWidth: '58px',
                    padding: '8px',
                    borderRadius: '8px',
                    border: isSelected ? `2px solid ${primary}` : '1px solid #e2e8f0',
                    background: isSelected ? '#fff7ed' : '#ffffff',
                    cursor: 'pointer'
                  }}
                >
                  <span style={{ fontSize: '18px', color: isSelected ? primary : '#1e293b' }}>{r.sign}</span>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: isSelected ? primary : '#475569', marginTop: '2px' }}>
                    {r.name}
                  </span>
                </button>
              );
            })}
          </div>
            
          <div style={{ background: '#f8fafc', borderRadius: '8px', padding: '12px 14px', border: '1px solid #edf2f7', marginTop: '4px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '18px' }}>{activeRashiItem.sign}</span>
                <span style={{ fontSize: '14.5px', fontWeight: 800, color: primary }}>{activeRashiItem.name} राशि आज का दिन:</span>
              </div>
              <div style={{ display: 'flex', gap: '12px', fontSize: '11.5px', color: '#475569' }}>
                <span>🎯 <b>शुभ अंक:</b> {activeRashiInfo?.luckyNumber || '7'}</span>
                <span>🎨 <b>शुभ रंग:</b> {activeRashiInfo?.luckyColor || 'केसरिया'}</span>
              </div>
            </div>
            <p style={{ fontSize: '13.5px', lineHeight: '1.6', color: '#334155', margin: 0 }}>
              {activeRashiInfo?.prediction ||
                `आज ${activeRashiItem.name} राशि के जातकों के लिए कार्यक्षेत्र में नई सफलता के अवसर मिलेंगे। वाणी में मधुरता रखें।`}
            </p>
          </div>
        </div>
      </div>

      {/* 7. MAIN CONTENT */}
      <main style={{ maxWidth: '1240px', margin: '20px auto', padding: '0 16px', width: '100%', boxSizing: 'border-box', flex: 1 }}>
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>लाइव अपडेट लोड हो रहे हैं...</div>
        ) : filteredArticles.length === 0 ? (
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', padding: '50px 20px', borderRadius: '8px', textAlign: 'center' }}>
            <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#334155' }}>
              {searchTerm ? `"${searchTerm}" के लिए कोई खबर नहीं मिली` : `${siteConfig?.name || 'इस साइट'} के लिए अभी कोई खबर उपलब्ध नहीं है`}
            </h3>
            <p style={{ color: '#64748b', fontSize: '13px', marginTop: '6px' }}>
              खबरें संपादक द्वारा समीक्षा और अनुमोदन के बाद ही यहां प्रदर्शित होंगी।
            </p>
          </div>
        ) : (
          <div className="home-main-grid">
            
            {/* Left Column */}
            <section style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {filteredArticles[0] && (
                <div style={{ background: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                  <Link href={`/article/${filteredArticles[0].id}?site=${currentSlug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                    <div className="lead-hero-img-box">
                      <img src={filteredArticles[0].image || 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=1200'} alt={filteredArticles[0].title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <span style={{ position: 'absolute', bottom: '12px', left: '12px', background: primary, color: '#fff', fontSize: '10.5px', fontWeight: 800, padding: '4px 8px', borderRadius: '3px', textTransform: 'uppercase' }}>
                        {filteredArticles[0].category || 'ताज़ा खबर'}
                      </span>
                    </div>
                    
                    <div style={{ padding: '18px' }}>
                      <div style={{ fontSize: '11.5px', color: '#64748b', marginBottom: '6px' }}>
                        {filteredArticles[0].createdAt || currentHindiDate} | 👁️ {filteredArticles[0].views || 0} बार पढ़ा गया
                      </div>
                      <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', margin: '0 0 8px 0', lineHeight: 1.3 }}>
                        {filteredArticles[0].title}
                      </h2>
                      {filteredArticles[0].summary && (
                        <p style={{ fontSize: '13.5px', color: '#475569', margin: 0, lineHeight: 1.5 }}>{filteredArticles[0].summary}</p>
                      )}
                    </div>
                  </Link>
                </div>
              )}
              
              {filteredArticles.length > 1 && (
                <div className="sub-cards-grid">
                  {filteredArticles.slice(1).map((item) => (
                    <Link key={item.id} href={`/article/${item.id}?site=${currentSlug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                      <div style={{ background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden', height: '100%' }}>
                        <div style={{ height: '160px', width: '100%', background: '#e2e8f0' }}>
                          <img src={item.image || 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=600'} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                        <div style={{ padding: '12px' }}>
                          <span style={{ fontSize: '10px', fontWeight: 700, color: primary, textTransform: 'uppercase' }}>{item.category}</span>
                          <h4 style={{ fontSize: '14px', fontWeight: 700, margin: '4px 0 6px 0', color: '#1e293b', lineHeight: 1.3 }}>{item.title}</h4>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </section>
              
            {/* Right Column */}
            <aside style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ background: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', padding: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: `2px solid ${primary}`, paddingBottom: '8px', marginBottom: '12px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444' }} />
                  <h3 style={{ fontSize: '14.5px', fontWeight: 800, margin: 0, textTransform: 'uppercase' }}>बड़ी सुर्खियां (Trending)</h3>
                </div>
                  
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {filteredArticles.map((art, idx) => (
                    <Link key={art.id} href={`/article/${art.id}?site=${currentSlug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                      <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', paddingBottom: '8px', borderBottom: idx !== filteredArticles.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                        <span style={{ fontSize: '16px', fontWeight: 800, color: '#cbd5e1' }}>0{idx + 1}</span>
                        <span style={{ fontSize: '12.5px', fontWeight: 600, color: '#334155', lineHeight: '1.4' }}>{art.title}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
              
              {/* Sidebar Ad */}
              <div style={{ height: '240px', background: '#e2e8f0', borderRadius: '6px', border: '1px solid #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                {sidebarAd ? (
                  <a href={sidebarAd.targetUrl || '#'} target="_blank" rel="noopener noreferrer" style={{ display: 'block', width: '100%', height: '100%' }}>
                    <img src={sidebarAd.imageUrl} alt={sidebarAd.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </a>
                ) : (
                  <span style={{ color: '#64748b', fontSize: '11px', letterSpacing: '1px', textTransform: 'uppercase' }}>
                    Sidebar Banner Ad (300 x 250)
                  </span>
                )}
              </div>
            </aside>

          </div>
        )}
      </main>
      
      {/* 8. DYNAMIC FOOTER */}
      <Footer 
        siteName={siteConfig?.name || 'द लोकल लीडर'} 
        primaryColor={primary}
        logoUrl={siteConfig?.logoUrl || `/logos/${currentSlug}.jpeg`}
        tagline={siteConfig?.description || '— जनता की आवाज़, सच्चाई के साथ —'}
      />
      
    </div>
  );
}