'use client';
import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';

interface ArticleData {
  id: string;
  title: string;
  category?: string;
  views?: number;
  siteId?: string;
  status?: string;
  authorName?: string;
  createdAt?: any;
}

interface AdData {
  id: string;
  status?: string;
  siteId?: string;
  revenue?: number;
}

interface ReporterData {
  id: string;
  name?: string;
  role?: string;
  siteId?: string;
}

export default function AdminDashboardPage() {
  const [selectedSite, setSelectedSite] = useState('all');
  const [articles, setArticles] = useState<ArticleData[]>([]);
  const [ads, setAds] = useState<AdData[]>([]);
  const [reporters, setReporters] = useState<ReporterData[]>([]);
  const [loading, setLoading] = useState(true);

  // Realtime Firestore Listeners
  useEffect(() => {
    setLoading(true);

    // 1. Live Articles Listener
    const qArticles = query(collection(db, 'articles'), orderBy('createdAt', 'desc'), limit(100));
    const unsubArticles = onSnapshot(qArticles, (snapshot) => {
      const artList: ArticleData[] = [];
      snapshot.forEach((doc) => {
        artList.push({ id: doc.id, ...doc.data() } as ArticleData);
      });
      setArticles(artList);
      setLoading(false);
    }, (err) => {
      console.error("Articles sync error:", err);
      setLoading(false);
    });

    // 2. Live Ads Listener
    const unsubAds = onSnapshot(collection(db, 'ads'), (snapshot) => {
      const adList: AdData[] = [];
      snapshot.forEach((doc) => {
        adList.push({ id: doc.id, ...doc.data() } as AdData);
      });
      setAds(adList);
    }, (err) => console.error("Ads sync error:", err));

    // 3. Live Reporters / Users Listener
    const unsubReporters = onSnapshot(collection(db, 'reporters'), (snapshot) => {
      const repList: ReporterData[] = [];
      snapshot.forEach((doc) => {
        repList.push({ id: doc.id, ...doc.data() } as ReporterData);
      });
      setReporters(repList);
    }, () => {
      // Fallback agar 'reporters' collection na ho toh 'users' check karein
      onSnapshot(collection(db, 'users'), (snap) => {
        const uList: ReporterData[] = [];
        snap.forEach((doc) => uList.push({ id: doc.id, ...doc.data() } as ReporterData));
        setReporters(uList);
      });
    });

    return () => {
      unsubArticles();
      unsubAds();
      unsubReporters();
    };
  }, []);

  // Filter Data based on Selected Site
  const filteredArticles = selectedSite === 'all'
    ? articles
    : articles.filter(a => (a.siteId || '').toLowerCase() === selectedSite.toLowerCase());

  const filteredAds = selectedSite === 'all'
    ? ads
    : ads.filter(ad => !ad.siteId || ad.siteId === 'all' || ad.siteId.toLowerCase() === selectedSite.toLowerCase());

  const filteredReporters = selectedSite === 'all'
    ? reporters
    : reporters.filter(r => !r.siteId || r.siteId === 'all' || r.siteId.toLowerCase() === selectedSite.toLowerCase());

  // Dynamic Calculated Metrics
  const totalArticlesCount = filteredArticles.length;
  const publishedArticlesCount = filteredArticles.filter(a => a.status !== 'draft').length;
  const draftArticlesCount = filteredArticles.filter(a => a.status === 'draft').length;
  
  const totalViews = filteredArticles.reduce((sum, item) => sum + (Number(item.views) || 0), 0);
  const pendingAdsCount = filteredAds.filter(a => a.status === 'pending' || a.status === 'review').length;
  const activeAdsCount = filteredAds.filter(a => a.status === 'active').length;

  const networkSites = [
    { slug: 'all', name: '🌐 All Sites (Network View)' },
    { slug: 'the-local-leader', name: 'द लोकल लीडर' },
    { slug: 'bazar-karobar', name: 'बाजार कारोबार' },
    { slug: 'golden-pearl-chronicles', name: 'गोल्डन पर्ल क्रॉनिकल्स' },
    { slug: 'the-provue-times', name: 'द प्रोव्यू टाइम्स' },
    { slug: 'desh-ki-aawaz', name: 'देश की आवाज़' },
    { slug: 'jan-bharat-news', name: 'जन भारत न्यूज़' },
    { slug: 'news-info-24', name: 'NEWS INFO 24' },
    { slug: 'ndn-defence', name: 'National Defence Network' },
  ];

  return (
    <div style={{ maxWidth: '1300px', margin: '0 auto' }}>
      
      {/* Responsive Styles */}
      <style jsx>{`
        .dashboard-header-flex {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
          margin-bottom: 24px;
          flex-wrap: wrap;
        }
        .stats-grid-4 {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          margin-bottom: 24px;
        }
        .main-dashboard-grid {
          display: grid;
          grid-template-columns: 2fr 1.2fr;
          gap: 20px;
          margin-bottom: 24px;
        }
        .quick-actions-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
        }

        @media (max-width: 1024px) {
          .stats-grid-4 {
            grid-template-columns: repeat(2, 1fr);
          }
          .main-dashboard-grid {
            grid-template-columns: 1fr;
          }
          .quick-actions-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 600px) {
          .stats-grid-4 {
            grid-template-columns: 1fr;
          }
          .quick-actions-grid {
            grid-template-columns: 1fr;
          }
          .dashboard-header-flex {
            flex-direction: column;
            align-items: flex-start;
          }
        }
      `}</style>

      {/* 1. TOP HEADER & SITE SELECTOR */}
      <div className="dashboard-header-flex">
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 900, color: '#ffffff', margin: 0 }}>
            Network Dashboard
          </h1>
          <p style={{ fontSize: '13px', color: '#94a3b8', margin: '4px 0 0 0' }}>
            Multi-portal real-time synchronization & live analytics
          </p>
        </div>

        {/* Dynamic Site Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#1e293b', padding: '6px 12px', borderRadius: '8px', border: '1px solid #334155' }}>
          <span style={{ fontSize: '13px', color: '#94a3b8' }}>Select Portal:</span>
          <select
            value={selectedSite}
            onChange={(e) => setSelectedSite(e.target.value)}
            style={{
              background: '#0f172a',
              color: '#ffffff',
              border: '1px solid #475569',
              padding: '6px 12px',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: 700,
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            {networkSites.map((site) => (
              <option key={site.slug} value={site.slug}>
                {site.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 2. STATS CARDS (LIVE DATA) */}
      <div className="stats-grid-4">
        
        {/* Total Articles */}
        <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', padding: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#94a3b8', fontSize: '12.5px', fontWeight: 600 }}>
            <span>TOTAL ARTICLES</span>
            <span style={{ background: '#1e3a8a', color: '#93c5fd', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 800 }}>LIVE</span>
          </div>
          <div style={{ fontSize: '30px', fontWeight: 900, color: '#ffffff', marginTop: '10px' }}>
            {loading ? '...' : totalArticlesCount}
          </div>
          <div style={{ fontSize: '11.5px', color: '#10b981', marginTop: '6px', fontWeight: 600 }}>
            ✓ {publishedArticlesCount} Published &bull; {draftArticlesCount} Drafts
          </div>
        </div>

        {/* Total Views */}
        <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', padding: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#94a3b8', fontSize: '12.5px', fontWeight: 600 }}>
            <span>TOTAL PAGEVIEWS</span>
            <span style={{ fontSize: '14px' }}>👁️</span>
          </div>
          <div style={{ fontSize: '30px', fontWeight: 900, color: '#38bdf8', marginTop: '10px' }}>
            {loading ? '...' : totalViews.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '11.5px', color: '#94a3b8', marginTop: '6px' }}>
            Realtime views accumulation
          </div>
        </div>

        {/* Active Reporters */}
        <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', padding: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#94a3b8', fontSize: '12.5px', fontWeight: 600 }}>
            <span>ACTIVE REPORTERS</span>
            <span style={{ fontSize: '14px' }}>🪪</span>
          </div>
          <div style={{ fontSize: '30px', fontWeight: 900, color: '#f59e0b', marginTop: '10px' }}>
            {loading ? '...' : filteredReporters.length}
          </div>
          <div style={{ fontSize: '11.5px', color: '#94a3b8', marginTop: '6px' }}>
            Verified ground journalists
          </div>
        </div>

        {/* Ads Status */}
        <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', padding: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#94a3b8', fontSize: '12.5px', fontWeight: 600 }}>
            <span>ADVERTISEMENTS</span>
            <span style={{ fontSize: '14px' }}>📢</span>
          </div>
          <div style={{ fontSize: '30px', fontWeight: 900, color: '#ec4899', marginTop: '10px' }}>
            {loading ? '...' : activeAdsCount}
          </div>
          <div style={{ fontSize: '11.5px', color: pendingAdsCount > 0 ? '#f87171' : '#10b981', marginTop: '6px', fontWeight: 600 }}>
            {pendingAdsCount > 0 ? `⚠️ ${pendingAdsCount} Pending Approval` : '✓ All Ads Active'}
          </div>
        </div>

      </div>

      {/* 3. MAIN SECTION: RECENT ARTICLES & QUICK STATUS */}
      <div className="main-dashboard-grid">
        
        {/* Recent Realtime Articles Table */}
        <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#ffffff', margin: 0 }}>
              Recent Live Articles
            </h3>
            <Link href="/admin/articles" style={{ color: '#38bdf8', fontSize: '12.5px', textDecoration: 'none', fontWeight: 700 }}>
              View All ({filteredArticles.length}) →
            </Link>
          </div>

          {loading ? (
            <div style={{ padding: '30px', textAlign: 'center', color: '#64748b' }}>Syncing database...</div>
          ) : filteredArticles.length === 0 ? (
            <div style={{ padding: '30px', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>
              Is portal ke liye abhi koi article published nahi hai.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #1e293b', color: '#64748b', fontSize: '11.5px' }}>
                    <th style={{ padding: '8px 10px' }}>TITLE</th>
                    <th style={{ padding: '8px 10px' }}>CATEGORY</th>
                    <th style={{ padding: '8px 10px' }}>PORTAL</th>
                    <th style={{ padding: '8px 10px', textAlign: 'right' }}>VIEWS</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredArticles.slice(0, 7).map((art) => (
                    <tr key={art.id} style={{ borderBottom: '1px solid #1e293b' }}>
                      <td style={{ padding: '10px', color: '#f1f5f9', fontWeight: 600, maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        <Link href={`/admin/articles`} style={{ color: 'inherit', textDecoration: 'none' }}>
                          {art.title || 'Untitled Article'}
                        </Link>
                      </td>
                      <td style={{ padding: '10px', color: '#94a3b8' }}>
                        <span style={{ background: '#1e293b', padding: '3px 8px', borderRadius: '4px', fontSize: '11px' }}>
                          {art.category || 'General'}
                        </span>
                      </td>
                      <td style={{ padding: '10px', color: '#ea580c', fontWeight: 600, fontSize: '12px' }}>
                        {art.siteId || 'the-local-leader'}
                      </td>
                      <td style={{ padding: '10px', color: '#38bdf8', fontWeight: 700, textAlign: 'right' }}>
                        {(art.views || 0).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right Side: Network Sites Breakdown */}
        <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', padding: '20px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#ffffff', margin: '0 0 16px 0' }}>
            Portal Coverage
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {networkSites.filter(s => s.slug !== 'all').map((site) => {
              const count = articles.filter(a => (a.siteId || '').toLowerCase() === site.slug.toLowerCase()).length;
              const isSelected = selectedSite === site.slug;
              return (
                <div 
                  key={site.slug}
                  onClick={() => setSelectedSite(site.slug)}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    background: isSelected ? '#1e293b' : '#090d16',
                    border: isSelected ? '1px solid #ea580c' : '1px solid #1e293b',
                    cursor: 'pointer'
                  }}
                >
                  <span style={{ fontSize: '13px', fontWeight: 600, color: isSelected ? '#ffffff' : '#cbd5e1' }}>
                    {site.name}
                  </span>
                  <span style={{ background: '#2563eb', color: '#fff', fontSize: '11px', fontWeight: 800, padding: '2px 8px', borderRadius: '12px' }}>
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* 4. QUICK ACTIONS */}
      <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', padding: '20px' }}>
        <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#ffffff', margin: '0 0 14px 0' }}>
          Quick Management Actions
        </h3>
        <div className="quick-actions-grid">
          <Link href="/admin/articles/create" style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#1e293b', padding: '12px', borderRadius: '8px', textDecoration: 'none', color: '#fff', fontSize: '13px', fontWeight: 600 }}>
            <span>➕</span> <span>New Article</span>
          </Link>
          <Link href="/admin/epaper" style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#1e293b', padding: '12px', borderRadius: '8px', textDecoration: 'none', color: '#fff', fontSize: '13px', fontWeight: 600 }}>
            <span>📰</span> <span>Upload E-Paper</span>
          </Link>
          <Link href="/admin/ads" style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#1e293b', padding: '12px', borderRadius: '8px', textDecoration: 'none', color: '#fff', fontSize: '13px', fontWeight: 600 }}>
            <span>📢</span> <span>Manage Ads</span>
          </Link>
          <Link href="/admin/rashifal" style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#1e293b', padding: '12px', borderRadius: '8px', textDecoration: 'none', color: '#fff', fontSize: '13px', fontWeight: 600 }}>
            <span>🔮</span> <span>Update Rashifal</span>
          </Link>
        </div>
      </div>

    </div>
  );
}