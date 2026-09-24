'use client';
import { useEffect, useState } from 'react';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import styles from '../Admin.module.css';

interface ArticleItem {
  id: string;
  title: string;
  views?: number;
  category?: string;
  siteId?: string;
}

interface AdItem {
  id: string;
  name?: string;
  status?: string;
  impressions?: number;
  clicks?: number;
  price?: number;
}

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [totalArticles, setTotalArticles] = useState(0);
  const [totalArticleViews, setTotalArticleViews] = useState(0);
  const [topArticles, setTopArticles] = useState<ArticleItem[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [activeSubscriptions, setActiveSubscriptions] = useState(0);
  const [activeAdsCount, setActiveAdsCount] = useState(0);
  const [totalImpressions, setTotalImpressions] = useState(0);
  const [totalClicks, setTotalClicks] = useState(0);
  const [estRevenue, setEstRevenue] = useState('₹0.00');

  useEffect(() => {
    setLoading(true);

    // 1. Live Articles & Views calculation
    const unsubArticles = onSnapshot(collection(db, 'articles'), (snap) => {
      setTotalArticles(snap.size);
      let viewsSum = 0;
      const list: ArticleItem[] = [];

      snap.forEach((d) => {
        const data = d.data();
        const v = Number(data.views) || 0;
        viewsSum += v;
        list.push({
          id: d.id,
          title: data.title || data.titleHi || 'शीर्षक उपलब्ध नहीं',
          views: v,
          category: data.category || 'सामान्य',
          siteId: data.siteId || 'all'
        });
      });

      setTotalArticleViews(viewsSum);
      // Top 5 most viewed articles
      list.sort((a, b) => (b.views || 0) - (a.views || 0));
      setTopArticles(list.slice(0, 5));
    });

    // 2. Live Users / Readers calculation
    const unsubUsers = onSnapshot(collection(db, 'users'), (snap) => {
      setTotalUsers(snap.size);
    }, () => {
      // Fallback agar 'users' collection ka direct read na ho
      setTotalUsers(0);
    });

    // 3. Live Active Subscriptions
    const unsubSubs = onSnapshot(collection(db, 'subscriptions'), (snap) => {
      let activeCount = 0;
      snap.forEach((d) => {
        const st = String(d.data().status || '').toLowerCase();
        if (st === 'active') activeCount++;
      });
      setActiveSubscriptions(activeCount);
    }, () => {
      setActiveSubscriptions(0);
    });

    // 4. Live Ads, Impressions, Clicks & Revenue
    const unsubAds = onSnapshot(collection(db, 'ads'), (snap) => {
      let active = 0;
      let imps = 0;
      let clks = 0;
      let rev = 0;

      snap.forEach((d) => {
        const data = d.data();
        const st = String(data.status || '').toLowerCase();
        if (st === 'active') {
          active++;
        }
        const imp = Number(data.impressions) || 0;
        const clk = Number(data.clicks) || 0;
        imps += imp;
        clks += clk;

        // Agar ad ki fixed price dali ho ya per-click/impression calculate karein
        if (data.price) {
          rev += Number(data.price) || 0;
        } else {
          // Standard estimate: ₹2.00 per click + ₹0.05 per impression
          rev += clk * 2.0 + imp * 0.05;
        }
      });

      setActiveAdsCount(active);
      setTotalImpressions(imps);
      setTotalClicks(clks);
      setEstRevenue(`₹${rev.toFixed(2)}`);
      setLoading(false);
    }, (err) => {
      console.error('Error fetching ads analytics:', err);
      setLoading(false);
    });

    return () => {
      unsubArticles();
      unsubUsers();
      unsubSubs();
      unsubAds();
    };
  }, []);

  // Conversion rate calculation
  const conversionRate =
    totalImpressions > 0
      ? `${((totalClicks / totalImpressions) * 100).toFixed(1)}%`
      : '0.0%';

  const cards = [
    { label: 'Total Articles', val: totalArticles.toLocaleString(), color: '#3b82f6' },
    { label: 'Total Article Views', val: totalArticleViews.toLocaleString(), color: '#0ea5e9' },
    { label: 'Total Users / Readers', val: totalUsers.toLocaleString(), color: '#a855f7' },
    { label: 'Active Subscriptions', val: activeSubscriptions.toLocaleString(), color: '#10b981' },
    { label: 'Active Ads', val: activeAdsCount.toLocaleString(), color: '#f97316' },
    { label: 'Est. Ad Revenue', val: estRevenue, color: '#14b8a6' },
    { label: 'Total Impressions', val: totalImpressions.toLocaleString(), color: '#06b6d4' },
    { label: 'Total Clicks', val: totalClicks.toLocaleString(), color: '#8b5cf6' },
    { label: 'Click Through Rate (CTR)', val: conversionRate, color: '#ec4899' }
  ];

  return (
    <div style={{ color: '#fff', width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, margin: 0 }}>Performance Analytics</h1>
          <p style={{ fontSize: '13px', color: '#94a3b8', margin: '4px 0 0' }}>
            Firebase Firestore se real-time dynamic data live sync ho raha hai.
          </p>
        </div>
        {loading && (
          <span style={{ fontSize: '12px', color: '#38bdf8', backgroundColor: 'rgba(56, 189, 248, 0.1)', padding: '4px 10px', borderRadius: '12px' }}>
            डेटा लोड हो रहा है…
          </span>
        )}
      </div>

      {/* METRIC CARDS GRID */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '28px' }}>
        {cards.map((c) => (
          <div key={c.label} className={styles.formCard} style={{ borderLeft: `4px solid ${c.color}`, backgroundColor: '#1e242b', borderRadius: '10px', padding: '16px' }}>
            <div style={{ fontSize: '12.5px', color: '#94a3b8', fontWeight: 500 }}>{c.label}</div>
            <div style={{ fontSize: '26px', fontWeight: 800, marginTop: '6px', color: '#f8fafc' }}>
              {loading ? '...' : c.val}
            </div>
          </div>
        ))}
      </div>

      {/* TOP VIEWED ARTICLES TABLE */}
      <div className={styles.formCard} style={{ backgroundColor: '#1e242b', borderRadius: '12px', padding: '20px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '14px', color: '#f8fafc' }}>
          🔥 सबसे ज़्यादा पढ़ी गईं खबरें (Top Performing Articles)
        </h3>

        {topArticles.length === 0 ? (
          <div style={{ color: '#94a3b8', fontSize: '13px', textAlign: 'center', padding: '20px 0' }}>
            अभी कोई खबर उपलब्ध नहीं है
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #334155', color: '#94a3b8' }}>
                  <th style={{ padding: '10px 8px' }}>रैंक</th>
                  <th style={{ padding: '10px 8px' }}>खबर का शीर्षक</th>
                  <th style={{ padding: '10px 8px' }}>श्रेणी</th>
                  <th style={{ padding: '10px 8px' }}>पोर्टल (Site)</th>
                  <th style={{ padding: '10px 8px', textAlign: 'right' }}>कुल व्यूज</th>
                </tr>
              </thead>
              <tbody>
                {topArticles.map((art, idx) => (
                  <tr key={art.id} style={{ borderBottom: '1px solid #242c35' }}>
                    <td style={{ padding: '12px 8px', fontWeight: 700, color: '#f97316' }}>#{idx + 1}</td>
                    <td style={{ padding: '12px 8px', color: '#f8fafc', fontWeight: 500, maxWidth: '380px' }}>
                      {art.title}
                    </td>
                    <td style={{ padding: '12px 8px', color: '#94a3b8' }}>
                      <span style={{ backgroundColor: '#334155', padding: '3px 8px', borderRadius: '4px', fontSize: '11px' }}>
                        {art.category}
                      </span>
                    </td>
                    <td style={{ padding: '12px 8px', color: '#cbd5e1', fontSize: '12px' }}>
                      {art.siteId}
                    </td>
                    <td style={{ padding: '12px 8px', textAlign: 'right', fontWeight: 700, color: '#38bdf8' }}>
                      👁 {art.views?.toLocaleString() || 0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}