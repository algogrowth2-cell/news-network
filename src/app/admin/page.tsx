'use client';
import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

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

/* Responsive layout (sirf design) */
const AD_STYLES = `
.ad-root{min-height:100vh;background:var(--bg-020617);color:var(--fg-e2e8f0);font-family:system-ui,-apple-system,sans-serif;padding:24px}
.ad-root *{box-sizing:border-box}
.ad-wrap{max-width:1280px;margin:0 auto;display:flex;flex-direction:column;gap:20px}
.ad-top{display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap}
.ad-title{margin:0;font-size:24px;font-weight:800;color:var(--fg-fff)}
.ad-sub{margin:4px 0 0;font-size:13px;color:var(--fg-94a3b8)}
.ad-select-wrap{display:flex;align-items:center;gap:8px}
.ad-select{background:var(--bg-0f172a);color:var(--fg-fff);border:1px solid var(--bd-334155);border-radius:10px;padding:9px 12px;font-size:13px;outline:none;cursor:pointer}
.ad-stats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:16px}
.ad-card{background:var(--bg-0f172a);border:1px solid var(--bd-1e293b);border-radius:14px;padding:18px}
.ad-card-head{display:flex;align-items:center;justify-content:space-between;font-size:11.5px;font-weight:700;letter-spacing:.06em;color:var(--fg-94a3b8)}
.ad-card-num{font-size:30px;font-weight:800;color:var(--fg-fff);margin-top:10px}
.ad-card-note{font-size:12px;color:#64748b;margin-top:6px}
.ad-live{background:rgba(16,185,129,.15);color:#10b981;font-size:10px;font-weight:800;padding:2px 8px;border-radius:10px}
.ad-main{display:grid;grid-template-columns:minmax(0,2fr) minmax(0,1fr);gap:16px;align-items:start}
.ad-panel{background:var(--bg-0f172a);border:1px solid var(--bd-1e293b);border-radius:14px;padding:18px}
.ad-panel-head{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:14px}
.ad-panel-title{margin:0;font-size:16px;font-weight:700;color:var(--fg-fff)}
.ad-link{color:#ea580c;font-size:13px;font-weight:600;text-decoration:none}
.ad-table-wrap{overflow-x:auto}
.ad-table{width:100%;border-collapse:collapse;font-size:13px;min-width:520px}
.ad-table th{text-align:left;font-size:11px;font-weight:700;letter-spacing:.06em;color:#64748b;padding:10px 8px;border-bottom:1px solid var(--bd-1e293b)}
.ad-table td{padding:11px 8px;border-bottom:1px solid var(--bd-111827);color:var(--fg-cbd5e1)}
.ad-table td.t{color:var(--fg-fff);font-weight:600;max-width:280px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ad-pill{display:inline-block;background:var(--bg-1e293b);color:var(--fg-cbd5e1);font-size:11px;padding:3px 8px;border-radius:8px}
.ad-empty{text-align:center;color:#64748b;font-size:13px;padding:30px 10px}
.ad-sites{display:flex;flex-direction:column;gap:8px}
.ad-count{background:var(--bg-1e293b);color:var(--fg-fff);font-size:12px;font-weight:700;padding:2px 10px;border-radius:10px}
.ad-actions{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}
.ad-action{display:flex;align-items:center;justify-content:center;gap:8px;background:var(--bg-0f172a);border:1px solid var(--bd-1e293b);border-radius:12px;padding:16px 12px;color:var(--fg-fff);text-decoration:none;font-size:14px;font-weight:600;transition:border-color .15s}
.ad-action:hover{border-color:#ea580c}
@media(max-width:1000px){
  .ad-stats{grid-template-columns:repeat(2,minmax(0,1fr))}
  .ad-main{grid-template-columns:1fr}
  .ad-actions{grid-template-columns:repeat(2,minmax(0,1fr))}
}
@media(max-width:560px){
  .ad-root{padding:14px}
  .ad-title{font-size:20px}
  .ad-stats{grid-template-columns:1fr}
  .ad-card-num{font-size:26px}
}
`;

export default function AdminDashboardPage() {
  const router = useRouter();
  const [selectedSite, setSelectedSite] = useState('all');
  const [articles, setArticles] = useState<ArticleData[]>([]);
  const [ads, setAds] = useState<AdData[]>([]);
  const [reporters, setReporters] = useState<ReporterData[]>([]);
  const [loading, setLoading] = useState(true);

  // 🛡️ 1. AUTH PROTECTION: Check if Admin is logged in
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const adminSession = localStorage.getItem('admin_user');
      if (!adminSession) {
        router.push('/admin/login');
      }
    }
  }, [router]);

  // Realtime Firestore Listeners
  useEffect(() => {
    setLoading(true);

    // 1. Live Articles Listener
    const qArticles = query(collection(db, 'articles'), orderBy('createdAt', 'desc'), limit(100));
    const unsubArticles = onSnapshot(
      qArticles,
      (snapshot) => {
        const artList: ArticleData[] = [];
        snapshot.forEach((doc) => {
          artList.push({ id: doc.id, ...doc.data() } as ArticleData);
        });
        setArticles(artList);
        setLoading(false);
      },
      (err) => {
        console.error('Articles sync error:', err);
        setLoading(false);
      }
    );

    // 2. Live Ads Listener
    const unsubAds = onSnapshot(
      collection(db, 'ads'),
      (snapshot) => {
        const adList: AdData[] = [];
        snapshot.forEach((doc) => {
          adList.push({ id: doc.id, ...doc.data() } as AdData);
        });
        setAds(adList);
      },
      (err) => console.error('Ads sync error:', err)
    );

    // 3. Live Reporters / Users Listener
    const unsubReporters = onSnapshot(
      collection(db, 'reporters'),
      (snapshot) => {
        const repList: ReporterData[] = [];
        snapshot.forEach((doc) => {
          repList.push({ id: doc.id, ...doc.data() } as ReporterData);
        });
        setReporters(repList);
      },
      () => {
        // Fallback agar 'reporters' collection na ho toh 'users' check karein
        onSnapshot(collection(db, 'users'), (snap) => {
          const uList: ReporterData[] = [];
          snap.forEach((doc) => uList.push({ id: doc.id, ...doc.data() } as ReporterData));
          setReporters(uList);
        });
      }
    );

    return () => {
      unsubArticles();
      unsubAds();
      unsubReporters();
    };
  }, []);

  // Filter Data based on Selected Site
  const filteredArticles =
    selectedSite === 'all'
      ? articles
      : articles.filter((a) => {
          const s = (a.siteId || '').toLowerCase().trim();
          const target = selectedSite.toLowerCase().trim();
          return s === target || s === target.replace(/-/g, ' ');
        });

  const filteredAds =
    selectedSite === 'all'
      ? ads
      : ads.filter(
          (ad) => !ad.siteId || ad.siteId === 'all' || (ad.siteId || '').toLowerCase().trim() === selectedSite.toLowerCase().trim()
        );

  const filteredReporters =
    selectedSite === 'all'
      ? reporters
      : reporters.filter(
          (r) => !r.siteId || r.siteId === 'all' || (r.siteId || '').toLowerCase().trim() === selectedSite.toLowerCase().trim()
        );

  // Dynamic Calculated Metrics
  const totalArticlesCount = filteredArticles.length;
  const publishedArticlesCount = filteredArticles.filter((a) => a.status !== 'draft').length;
  const draftArticlesCount = filteredArticles.filter((a) => a.status === 'draft').length;

  const totalViews = filteredArticles.reduce((sum, item) => sum + (Number(item.views) || 0), 0);
  const pendingAdsCount = filteredAds.filter((a) => a.status === 'pending' || a.status === 'review').length;
  const activeAdsCount = filteredAds.filter((a) => a.status === 'active').length;

  const networkSites = [
    { slug: 'all', name: '🌐 All Sites (Network View)' },
    { slug: 'the-local-leader', name: 'द लोकल लीडर' },
    { slug: 'bazar-karobar', name: 'बाजार कारोबार' },
    { slug: 'golden-pearl-chronicles', name: 'गोल्डन पर्ल क्रॉनिकल्स' },
    { slug: 'the-provue-times', name: 'द प्रोव्यू टाइम्स' },
    { slug: 'desh-ki-aawaz', name: 'देश की आवाज़' },
    { slug: 'jan-bharat-news', name: 'जन भारत न्यूज़' },
    { slug: 'news-info-24', name: 'NEWS INFO 24' },
    { slug: 'ndn-defence', name: 'National Defence Network' }
  ];

  return (
    <div className="ad-root">
      {/* Responsive Styles */}
      <style dangerouslySetInnerHTML={{ __html: AD_STYLES }} />

      <div className="ad-wrap">
        {/* 1. TOP HEADER & SITE SELECTOR */}
        <div className="ad-top">
          <div>
            <h1 className="ad-title">Network Dashboard</h1>
            <p className="ad-sub">Multi-portal real-time synchronization &amp; live analytics</p>
          </div>

          {/* Dynamic Site Selector */}
          <div className="ad-select-wrap">
            <span style={{ fontSize: '13px', color: 'var(--fg-94a3b8)' }}>Select Portal:</span>
            <select className="ad-select" value={selectedSite} onChange={(e) => setSelectedSite(e.target.value)}>
              {networkSites.map((site) => (
                <option key={site.slug} value={site.slug}>
                  {site.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 2. STATS CARDS (LIVE DATA) */}
        <div className="ad-stats">
          {/* Total Articles */}
          <div className="ad-card">
            <div className="ad-card-head">
              <span>TOTAL ARTICLES</span>
              <span className="ad-live">LIVE</span>
            </div>
            <div className="ad-card-num">{loading ? '...' : totalArticlesCount}</div>
            <div className="ad-card-note">
              ✓ {publishedArticlesCount} Published • {draftArticlesCount} Drafts
            </div>
          </div>

          {/* Total Views */}
          <div className="ad-card">
            <div className="ad-card-head">
              <span>TOTAL PAGEVIEWS</span>
              <span>👁️</span>
            </div>
            <div className="ad-card-num">{loading ? '...' : totalViews.toLocaleString('en-IN')}</div>
            <div className="ad-card-note">Realtime views accumulation</div>
          </div>

          {/* Active Reporters */}
          <div className="ad-card">
            <div className="ad-card-head">
              <span>ACTIVE REPORTERS</span>
              <span>🪪</span>
            </div>
            <div className="ad-card-num">{loading ? '...' : filteredReporters.length}</div>
            <div className="ad-card-note">Verified ground journalists</div>
          </div>

          {/* Ads Status */}
          <div className="ad-card">
            <div className="ad-card-head">
              <span>ADVERTISEMENTS</span>
              <span>📢</span>
            </div>
            <div className="ad-card-num">{loading ? '...' : activeAdsCount}</div>
            <div style={{ fontSize: '12px', color: pendingAdsCount > 0 ? 'var(--fg-f87171)' : '#10b981', marginTop: '6px', fontWeight: 600 }}>
              {pendingAdsCount > 0 ? `⚠️ ${pendingAdsCount} Pending Approval` : '✓ All Ads Active'}
            </div>
          </div>
        </div>

        {/* 3. MAIN SECTION: RECENT ARTICLES & QUICK STATUS */}
        <div className="ad-main">
          {/* Recent Realtime Articles Table */}
          <div className="ad-panel">
            <div className="ad-panel-head">
              <h2 className="ad-panel-title">Recent Live Articles</h2>
              <Link href="/admin/articles" className="ad-link">
                View All ({filteredArticles.length}) →
              </Link>
            </div>

            {loading ? (
              <div className="ad-empty">Syncing database...</div>
            ) : filteredArticles.length === 0 ? (
              <div className="ad-empty">Is portal ke liye abhi koi article published nahi hai.</div>
            ) : (
              <div className="ad-table-wrap">
                <table className="ad-table">
                  <thead>
                    <tr>
                      <th>TITLE</th>
                      <th>CATEGORY</th>
                      <th>PORTAL</th>
                      <th style={{ textAlign: 'right' }}>VIEWS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredArticles.slice(0, 7).map((art) => (
                      <tr key={art.id}>
                        <td className="t">{art.title || 'Untitled Article'}</td>
                        <td>
                          <span className="ad-pill">{art.category || 'General'}</span>
                        </td>
                        <td style={{ color: 'var(--fg-94a3b8)' }}>{art.siteId || 'the-local-leader'}</td>
                        <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--fg-fff)' }}>{(art.views || 0).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Right Side: Network Sites Breakdown */}
          <div className="ad-panel">
            <div className="ad-panel-head">
              <h2 className="ad-panel-title">Portal Coverage</h2>
            </div>
            <div className="ad-sites">
              {networkSites
                .filter((s) => s.slug !== 'all')
                .map((site) => {
                  const count = articles.filter((a) => {
                    const s = (a.siteId || '').toLowerCase().trim();
                    const target = site.slug.toLowerCase().trim();
                    return s === target || s === target.replace(/-/g, ' ');
                  }).length;
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
                        background: isSelected ? 'var(--bg-1e293b)' : 'var(--bg-090d16)',
                        border: isSelected ? '1px solid #ea580c' : '1px solid var(--bd-1e293b)',
                        cursor: 'pointer'
                      }}
                    >
                      <span style={{ fontSize: '13px', fontWeight: isSelected ? 700 : 500, color: 'var(--fg-fff)' }}>{site.name}</span>
                      <span className="ad-count">{count}</span>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>

        {/* 4. QUICK ACTIONS */}
        <div className="ad-panel">
          <div className="ad-panel-head">
            <h2 className="ad-panel-title">Quick Management Actions</h2>
          </div>
          <div className="ad-actions">
            <Link href="/admin/articles/new" className="ad-action">
              ➕ New Article
            </Link>
            <Link href="/admin/epaper" className="ad-action">
              📰 Upload E-Paper
            </Link>
            <Link href="/admin/ads" className="ad-action">
              📢 Manage Ads
            </Link>
            <Link href="/admin/rashifal" className="ad-action">
              🔮 Update Rashifal
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}