'use client';

import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, doc } from 'firebase/firestore';
import Link from 'next/link';

interface NewsVideo {
  id: string;
  title: string;
  category: string;
  cityName: string;
  videoType: 'youtube' | 'direct' | 'shorts';
  videoUrl: string;
  thumbnailUrl: string;
  duration?: string;
  views?: number;
}

export default function PublicVideosPage() {
  const [videos, setVideos] = useState<NewsVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [playingVideo, setPlayingVideo] = useState<NewsVideo | null>(null);

  // Dynamic Theme
  const [themeColor, setThemeColor] = useState('#ea580c');
  const [siteName, setSiteName] = useState('द लोकल लीडर');

  useEffect(() => {
    const unsubSite = onSnapshot(doc(db, 'sites', 'the-local-leader'), (snap) => {
      if (snap.exists()) {
        const d = snap.data();
        if (d.primaryColor) setThemeColor(d.primaryColor);
        if (d.name) setSiteName(d.name);
      }
    });
    return () => unsubSite();
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'news_videos'));
    const unsub = onSnapshot(q, (snapshot) => {
      const list: NewsVideo[] = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data()
      } as NewsVideo));
      setVideos(list);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const getEmbedUrl = (url: string) => {
    if (!url) return '';
    if (url.includes('youtube.com/watch?v=')) return url.replace('watch?v=', 'embed/');
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
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', color: '#0f172a', fontFamily: '"Mukta", system-ui, sans-serif' }}>
      
      {/* Header */}
      <header style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #e2e8f0', padding: '14px 24px', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
        <div style={{ maxWidth: '1380px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '24px' }}>📹</span>
            <b style={{ fontSize: '20px', color: '#0f172a' }}>{siteName} वीडियो बुलेटिन</b>
          </div>
          <Link href="/" style={{ fontSize: '13.5px', color: themeColor, textDecoration: 'none', fontWeight: 600 }}>
            ← होम पेज
          </Link>
        </div>
      </header>

      <main style={{ maxWidth: '1380px', margin: '0 auto', padding: '28px 20px' }}>
        <div style={{ marginBottom: '22px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', margin: '0 0 6px 0' }}>ताज़ा न्यूज़ वीडियो एवं रिपोर्ट</h1>
          <p style={{ fontSize: '13.5px', color: '#64748b', margin: 0 }}>ग्राउंड रिपोर्ट, एक्सक्लूसिव इंटरव्यू और बड़ी खबरों के वीडियो बुलेटिन</p>
        </div>

        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>वीडियो लोड हो रहे हैं...</div>
        ) : videos.length === 0 ? (
          <div style={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '60px 20px', textAlign: 'center', color: '#64748b' }}>
            अभी कोई वीडियो उपलब्ध नहीं है।
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))', gap: '22px' }}>
            {videos.map((vid) => (
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
                  transition: 'transform 0.15s ease'
                }}
              >
                <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', backgroundColor: '#000' }}>
                  <img src={vid.thumbnailUrl} alt={vid.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.3)' }}>
                    <div style={{ width: '46px', height: '46px', borderRadius: '50%', backgroundColor: themeColor, display: 'grid', placeItems: 'center', color: '#fff', fontSize: '18px' }}>
                      ▶
                    </div>
                  </div>
                  {vid.duration && (
                    <span style={{ position: 'absolute', bottom: '8px', right: '8px', backgroundColor: 'rgba(0,0,0,0.8)', color: '#fff', fontSize: '11px', padding: '2px 6px', borderRadius: '4px' }}>
                      {vid.duration}
                    </span>
                  )}
                </div>

                <div style={{ padding: '16px' }}>
                  <div style={{ fontSize: '12px', color: themeColor, fontWeight: 700, marginBottom: '6px' }}>
                    {vid.category} {vid.cityName ? `· ${vid.cityName}` : ''}
                  </div>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', margin: 0, lineHeight: 1.4 }}>
                    {vid.title}
                  </h3>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Video Modal Player */}
      {playingVideo && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '16px' }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', padding: '18px', width: '100%', maxWidth: '800px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <b style={{ color: '#0f172a', fontSize: '16px' }}>{playingVideo.title}</b>
              <button
                onClick={() => setPlayingVideo(null)}
                style={{ backgroundColor: '#fee2e2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '6px', padding: '4px 12px', cursor: 'pointer', fontWeight: 700 }}
              >
                ✕ बंद करें
              </button>
            </div>

            <div style={{ width: '100%', aspectRatio: playingVideo.videoType === 'shorts' ? '9/16' : '16/9', maxHeight: '75vh', backgroundColor: '#000', margin: '0 auto', overflow: 'hidden', borderRadius: '8px' }}>
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