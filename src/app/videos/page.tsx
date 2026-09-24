'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { collection, query, onSnapshot, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';
import Footer from '@/components/Footer';

interface VideoItem {
  id: string;
  title: string;
  youtubeUrl: string;
  youtubeId: string;
  category?: string;
  siteId?: string;
  description?: string;
  createdAt?: any;
}

const VIDEO_CATEGORIES = [
  'सभी',
  'ताज़ा बुलेटिन',
  'ग्राउंड रिपोर्ट',
  'राजनीति',
  'व्यापार',
  'अपराध',
  'खेलकूद',
  'विशेष इंटरव्यू'
];

function VideosContent() {
  const searchParams = useSearchParams();
  const [siteSlug, setSiteSlug] = useState('the-local-leader');
  const [siteConfig, setSiteConfig] = useState<any>(null);
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('सभी');
  const [searchQuery, setSearchQuery] = useState('');

  // 1. Identify current site
  useEffect(() => {
    const qSite = searchParams.get('site') || 'the-local-leader';
    setSiteSlug(qSite.toLowerCase());
  }, [searchParams]);

  // 2. Fetch site config for Logo and Theme Color
  useEffect(() => {
    if (!siteSlug) return;
    const unsub = onSnapshot(doc(db, 'sites', siteSlug), (snap) => {
      if (snap.exists()) {
        setSiteConfig({ slug: siteSlug, ...snap.data() });
      } else {
        setSiteConfig({
          slug: siteSlug,
          name: 'द लोकल लीडर',
          primaryColor: '#ea580c',
          logoUrl: `/logos/${siteSlug}.jpeg`,
          description: '— जनता की आवाज़, सच्चाई के साथ —'
        });
      }
    });
    return () => unsub();
  }, [siteSlug]);

  // 3. Fetch ONLY videos that belong to this portal or 'all'
  useEffect(() => {
    setLoading(true);
    const qVideos = query(collection(db, 'videos'));

    const unsubscribe = onSnapshot(
      qVideos,
      (snapshot) => {
        const list: VideoItem[] = [];
        snapshot.forEach((d) => {
          const data = d.data();
          const targetSite = String(data.siteId || 'all').toLowerCase();

          // Strict site filter
          if (targetSite === siteSlug || targetSite === 'all' || !data.siteId) {
            list.push({ id: d.id, ...data } as VideoItem);
          }
        });

        // Newest first
        list.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
        setVideos(list);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching videos:', err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [siteSlug]);

  const primary = siteConfig?.primaryColor || '#ea580c';
  const siteName = siteConfig?.name || 'द लोकल लीडर';
  const siteLogo = siteConfig?.logoUrl || `/logos/${siteSlug}.jpeg`;
  const siteTagline = siteConfig?.description || '— जनता की आवाज़, सच्चाई के साथ —';

  // Category & Search Filter
  const filteredVideos = videos.filter((vid) => {
    const matchesCat =
      selectedCategory === 'सभी' ||
      (vid.category && vid.category.toLowerCase().includes(selectedCategory.toLowerCase()));

    const cleanSearch = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !cleanSearch ||
      vid.title?.toLowerCase().includes(cleanSearch) ||
      vid.description?.toLowerCase().includes(cleanSearch);

    return matchesCat && matchesSearch;
  });

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f4f3f0', color: '#1a1a1a', fontFamily: '"Mukta", system-ui, sans-serif', display: 'flex', flexDirection: 'column' }}>
      
      {/* ── TOP HEADER (CLEAN WHITE LIGHT THEME) ── */}
      <header style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #e2e8f0', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Link href={`/?site=${siteSlug}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: primary, textDecoration: 'none', fontWeight: 700, fontSize: '14px' }}>
              <span style={{ fontSize: '18px' }}>←</span>
              <span>{siteName}</span>
            </Link>
            <span style={{ color: '#cbd5e1' }}>|</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {siteLogo && (
                <img src={siteLogo} alt={siteName} style={{ height: '28px', width: 'auto', borderRadius: '4px', objectFit: 'contain' }} />
              )}
              <h1 style={{ fontSize: '17px', fontWeight: 800, margin: 0, color: '#0f172a' }}>
                वीडियो बुलेटिन (Video Gallery)
              </h1>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Link
              href={`/?site=${siteSlug}`}
              style={{
                backgroundColor: '#f1f5f9',
                color: '#334155',
                border: '1px solid #cbd5e1',
                padding: '6px 14px',
                borderRadius: '8px',
                fontSize: '12.5px',
                fontWeight: 600,
                textDecoration: 'none'
              }}
            >
              मुख्य पृष्ठ
            </Link>
            <span style={{ fontSize: '11.5px', fontWeight: 700, color: primary, backgroundColor: `${primary}15`, padding: '5px 12px', borderRadius: '20px', border: `1px solid ${primary}33` }}>
              {siteName} विशेष
            </span>
          </div>

        </div>
      </header>

      {/* ── MAIN CONTENT ── */}
      <main style={{ maxWidth: '1400px', width: '100%', margin: '0 auto', padding: '24px 16px 48px', flex: 1 }}>
        
        {/* Banner Section */}
        <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '22px 24px', marginBottom: '22px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <span style={{ backgroundColor: `${primary}15`, color: primary, fontSize: '11px', fontWeight: 800, padding: '4px 10px', borderRadius: '4px', textTransform: 'uppercase' }}>
                वीडियो समाचार एवं बुलेटिन
              </span>
              <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', margin: '8px 0 4px' }}>
                {siteName} के ताज़ा वीडियो एवं ग्राउंड रिपोर्ट्स
              </h2>
              <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
                क्षेत्र की हर बड़ी हलचल और विशेष इंटरव्यू सीधे वीडियो के माध्यम से देखें।
              </p>
            </div>

            {/* Search Box */}
            <div style={{ minWidth: '260px' }}>
              <input
                type="text"
                placeholder="वीडियो खोजें..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 14px',
                  borderRadius: '8px',
                  border: '1.5px solid #cbd5e1',
                  fontSize: '13px',
                  outline: 'none',
                  backgroundColor: '#f8fafc',
                  color: '#0f172a'
                }}
              />
            </div>
          </div>
        </div>

        {/* ── CATEGORY FILTER TABS ── */}
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', whiteSpace: 'nowrap', marginBottom: '24px', paddingBottom: '4px' }}>
          {VIDEO_CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                style={{
                  backgroundColor: isSelected ? primary : '#ffffff',
                  color: isSelected ? '#ffffff' : '#475569',
                  border: `1px solid ${isSelected ? primary : '#e2e8f0'}`,
                  borderRadius: '20px',
                  padding: '7px 16px',
                  fontSize: '13px',
                  fontWeight: isSelected ? 700 : 500,
                  cursor: 'pointer',
                  flexShrink: 0,
                  transition: 'all 0.15s ease',
                  boxShadow: isSelected ? `0 2px 8px ${primary}40` : 'none'
                }}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* ── VIDEOS GRID ── */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '70px 20px', color: '#64748b' }}>
            <div style={{ width: '32px', height: '32px', border: `3px solid ${primary}30`, borderTopColor: primary, borderRadius: '50%', animation: 'spin 0.7s linear infinite', margin: '0 auto 12px' }} />
            <style jsx global>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            <span>वीडियो लोड हो रहे हैं…</span>
          </div>
        ) : filteredVideos.length === 0 ? (
          <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px dashed #cbd5e1', padding: '60px 20px', textAlign: 'center' }}>
            <span style={{ fontSize: '46px', display: 'block', marginBottom: '10px', opacity: 0.5 }}>📹</span>
            <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#0f172a', marginBottom: '6px' }}>
              {selectedCategory !== 'सभी' 
                ? `"${selectedCategory}" श्रेणी में अभी कोई वीडियो नहीं है` 
                : `वर्तमान में "${siteName}" के लिए कोई वीडियो बुलेटिन उपलब्ध नहीं है`}
            </h3>
            <p style={{ fontSize: '13px', color: '#64748b', maxWidth: '420px', margin: '0 auto 18px' }}>
              एडमिन द्वारा इस पोर्टल के लिए नए वीडियो अपलोड करने के बाद वे यहाँ प्रदर्शित होंगे।
            </p>
            <Link
              href={`/?site=${siteSlug}`}
              style={{
                backgroundColor: primary,
                color: '#fff',
                textDecoration: 'none',
                padding: '9px 22px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 700,
                display: 'inline-block',
                boxShadow: `0 2px 8px ${primary}40`
              }}
            >
              मुख्य समाचार देखें
            </Link>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '22px' }}>
            {filteredVideos.map((vid) => (
              <div
                key={vid.id}
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '14px',
                  border: '1px solid #e2e8f0',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                  transition: 'transform 0.15s ease, box-shadow 0.15s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.06)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.03)';
                }}
              >
                {/* YouTube Iframe Player */}
                <div style={{ width: '100%', aspectRatio: '16/9', backgroundColor: '#000' }}>
                  <iframe
                    width="100%"
                    height="100%"
                    src={`https://www.youtube.com/embed/${vid.youtubeId}`}
                    title={vid.title}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>

                {/* Content Box */}
                <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ backgroundColor: `${primary}15`, color: primary, fontSize: '11px', fontWeight: 800, padding: '3px 8px', borderRadius: '4px', textTransform: 'uppercase' }}>
                      {vid.category || 'वीडियो'}
                    </span>
                    <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                      {siteName}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '15.5px', fontWeight: 700, color: '#0f172a', margin: '0 0 6px', lineHeight: 1.4 }}>
                    {vid.title}
                  </h3>

                  {vid.description && (
                    <p style={{ fontSize: '12.5px', color: '#64748b', margin: 0, lineHeight: 1.5 }}>
                      {vid.description}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

      </main>

      <Footer siteName={siteName} primaryColor={primary} logoUrl={siteLogo} tagline={siteTagline} />
    </div>
  );
}

export default function VideosPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', backgroundColor: '#f4f3f0', color: '#64748b' }}>
        वीडियो लोड हो रहे हैं…
      </div>
    }>
      <VideosContent />
    </Suspense>
  );
}