'use client';

import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  doc 
} from 'firebase/firestore';
import Link from 'next/link';

interface NewsVideo {
  id: string;
  title: string;
  category: string;
  siteId: string;
  cityName: string;
  videoType: 'youtube' | 'direct' | 'shorts';
  videoUrl: string;
  thumbnailUrl: string;
  duration?: string;
  views?: number;
  status?: string;
  createdAt?: any;
}

const CATEGORIES = [
  'सभी',
  'राजनीति',
  'अपराध',
  'शहर हलचल',
  'व्यापार',
  'विशेष रिपोर्ट',
  'खेल'
];

export default function PublicVideosPage() {
  const [videos, setVideos] = useState<NewsVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('सभी');
  const [playingVideo, setPlayingVideo] = useState<NewsVideo | null>(null);

  // Dynamic Theme State
  const [themeColor, setThemeColor] = useState<string>('#ea580c');
  const [siteName, setSiteName] = useState<string>('द लोकल लीडर');
  const [siteLogo, setSiteLogo] = useState<string>('/logos/the-local-leader.jpeg');

  // 1. Fetch Dynamic Site Config
  useEffect(() => {
    const unsubSite = onSnapshot(doc(db, 'sites', 'the-local-leader'), (snap) => {
      if (snap.exists()) {
        const d = snap.data();
        if (d.primaryColor) setThemeColor(d.primaryColor);
        if (d.name) setSiteName(d.name);
        if (d.logoUrl) setSiteLogo(d.logoUrl);
      }
    });
    return () => unsubSite();
  }, []);

  // 2. Fetch Live Published Videos from news_videos collection
  useEffect(() => {
    setLoading(true);
    const q = query(
      collection(db, 'news_videos'),
      where('status', '==', 'published')
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const list: NewsVideo[] = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data()
      } as NewsVideo));

      setVideos(list);
      setLoading(false);
    }, (err) => {
      console.error('Error fetching news videos:', err);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  // 3. Category Filter logic
  const filteredVideos = videos.filter((vid) => {
    if (selectedCategory === 'सभी') return true;
    return vid.category?.trim().toLowerCase() === selectedCategory.trim().toLowerCase();
  });

  // 4. Safe Embed URL generator
  const getEmbedUrl = (url: string) => {
    if (!url) return '';
    if (url.includes('youtube.com/watch?v=')) {
      const id = url.split('watch?v=')[1]?.split('&')[0];
      return `https://www.youtube.com/embed/${id}?autoplay=1`;
    }
    if (url.includes('youtu.be/')) {
      const id = url.split('youtu.be/')[1]?.split('?')[0];
      return `https://www.youtube.com/embed/${id}?autoplay=1`;
    }
    if (url.includes('youtube.com/shorts/')) {
      const id = url.split('youtube.com/shorts/')[1]?.split('?')[0];
      return `https://www.youtube.com/embed/${id}?autoplay=1`;
    }
    return url;
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', color: '#0f172a', fontFamily: '"Mukta", system-ui, -apple-system, sans-serif' }}>
      
      {/* Top Header */}
      <header style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #e2e8f0', padding: '14px 24px', position: 'sticky', top: 0, zIndex: 40, boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
        <div style={{ maxWidth: '1380px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {siteLogo && (
              <img src={siteLogo} alt={siteName} style={{ height: '36px', width: 'auto', borderRadius: '4px', objectFit: 'contain' }} />
            )}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ backgroundColor: '#dc2626', color: '#ffffff', fontSize: '11px', fontWeight: 800, padding: '2px 8px', borderRadius: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  ● LIVE
                </span>
                <b style={{ fontSize: '20px', color: '#0f172a' }}>{siteName} वीडियो बुलेटिन</b>
              </div>
              <div style={{ fontSize: '11.5px', color: '#64748b' }}>ताज़ा ग्राउंड रिपोर्ट, ब्रेकिंग न्यूज़ एवं वीडियो खबरें</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Link href="/" style={{ fontSize: '13.5px', color: themeColor, textDecoration: 'none', fontWeight: 700 }}>
              ← मुख्य वेबसाइट
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main style={{ maxWidth: '1380px', margin: '0 auto', padding: '26px 20px' }}>
        
        {/* Category Navigation Bar */}
        <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '14px 18px', marginBottom: '24px', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#334155' }}>कैटेगरी चुनें:</span>
            {CATEGORIES.map((cat) => {
              const count = cat === 'सभी' ? videos.length : videos.filter(v => v.category === cat).length;
              const isActive = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  style={{
                    backgroundColor: isActive ? themeColor : '#f1f5f9',
                    color: isActive ? '#ffffff' : '#475569',
                    border: `1.5px solid ${isActive ? themeColor : '#cbd5e1'}`,
                    borderRadius: '20px',
                    padding: '6px 16px',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    boxShadow: isActive ? '0 2px 8px rgba(0,0,0,0.1)' : 'none'
                  }}
                >
                  {cat} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {/* Page Section Title */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', margin: '0 0 4px 0' }}>
              {selectedCategory === 'सभी' ? 'सभी ताज़ा वीडियो बुलेटिन' : `${selectedCategory} के वीडियो`}
            </h1>
            <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
              {filteredVideos.length} वीडियो उपलब्ध हैं
            </p>
          </div>
        </div>

        {/* Video Cards Grid */}
        {loading ? (
          <div style={{ padding: '80px', textAlign: 'center', color: '#64748b', fontSize: '14px' }}>
            वीडियो लोड हो रहे हैं...
          </div>
        ) : filteredVideos.length === 0 ? (
          <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '70px 20px', textAlign: 'center' }}>
            <span style={{ fontSize: '36px' }}>📹</span>
            <h3 style={{ fontSize: '18px', color: '#0f172a', margin: '12px 0 6px 0', fontWeight: 700 }}>
              इस श्रेणी में अभी कोई वीडियो उपलब्ध नहीं है
            </h3>
            <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 16px 0' }}>
              अन्य श्रेणी देखने के लिए ऊपर "सभी" पर क्लिक करें।
            </p>
            <button
              onClick={() => setSelectedCategory('सभी')}
              style={{ backgroundColor: themeColor, color: '#fff', border: 'none', padding: '8px 18px', borderRadius: '6px', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}
            >
              सभी वीडियो देखें
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))', gap: '22px' }}>
            {filteredVideos.map((vid) => (
              <div
                key={vid.id}
                onClick={() => setPlayingVideo(vid)}
                style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'transform 0.15s ease, box-shadow 0.15s ease'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-3px)')}
                onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
              >
                {/* Video Thumbnail */}
                <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', backgroundColor: '#000', overflow: 'hidden' }}>
                  <img
                    src={vid.thumbnailUrl || 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=800'}
                    alt={vid.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />

                  {/* Play Button Overlay */}
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.28)' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: themeColor, display: 'grid', placeItems: 'center', color: '#ffffff', fontSize: '18px', boxShadow: '0 4px 14px rgba(0,0,0,0.35)' }}>
                      ▶
                    </div>
                  </div>

                  {/* Duration Badge */}
                  {vid.duration && (
                    <span style={{ position: 'absolute', bottom: '8px', right: '8px', backgroundColor: 'rgba(0,0,0,0.85)', color: '#ffffff', fontSize: '11px', padding: '2px 7px', borderRadius: '4px', fontWeight: 600 }}>
                      {vid.duration}
                    </span>
                  )}

                  {/* Video Type Badge */}
                  <span style={{ position: 'absolute', top: '8px', left: '8px', backgroundColor: 'rgba(15,23,42,0.85)', color: '#38bdf8', fontSize: '10px', padding: '3px 8px', borderRadius: '4px', fontWeight: 700, textTransform: 'uppercase' }}>
                    {vid.videoType}
                  </span>
                </div>

                {/* Card Content */}
                <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: themeColor, fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px' }}>
                      <span>{vid.category}</span>
                      {vid.cityName && <span style={{ color: '#94a3b8' }}>• {vid.cityName}</span>}
                    </div>

                    <h3 style={{ fontSize: '15.5px', fontWeight: 700, color: '#0f172a', margin: 0, lineHeight: 1.45, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {vid.title}
                    </h3>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '14px', paddingTop: '10px', borderTop: '1px solid #f1f5f9', fontSize: '12px', color: '#64748b' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      👁️ {vid.views || 0} व्यूज़
                    </span>
                    <span style={{ color: themeColor, fontWeight: 600 }}>
                      अभी देखें →
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

      </main>

      {/* ── FULLSCREEN POPUP VIDEO PLAYER MODAL ── */}
      {playingVideo && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '16px' }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '14px', padding: '18px', width: '100%', maxWidth: '820px', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', gap: '12px' }}>
              <div>
                <span style={{ fontSize: '11px', color: themeColor, fontWeight: 700, textTransform: 'uppercase' }}>
                  {playingVideo.category} {playingVideo.cityName ? `· ${playingVideo.cityName}` : ''}
                </span>
                <h3 style={{ color: '#0f172a', fontSize: '16px', fontWeight: 700, margin: '2px 0 0 0' }}>
                  {playingVideo.title}
                </h3>
              </div>

              <button
                onClick={() => setPlayingVideo(null)}
                style={{ backgroundColor: '#fee2e2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '6px', padding: '6px 14px', cursor: 'pointer', fontWeight: 700, fontSize: '12.5px' }}
              >
                ✕ बंद करें
              </button>
            </div>

            <div style={{ width: '100%', aspectRatio: playingVideo.videoType === 'shorts' ? '9/16' : '16/9', maxHeight: '72vh', backgroundColor: '#000', margin: '0 auto', overflow: 'hidden', borderRadius: '8px' }}>
              {playingVideo.videoType === 'direct' ? (
                <video src={playingVideo.videoUrl} controls autoPlay style={{ width: '100%', height: '100%' }} />
              ) : (
                <iframe
                  src={getEmbedUrl(playingVideo.videoUrl)}
                  title={playingVideo.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  style={{ width: '100%', height: '100%', border: 'none' }}
                />
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
}