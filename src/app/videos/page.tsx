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

function VideosContent() {
  const searchParams = useSearchParams();
  const [siteSlug, setSiteSlug] = useState('the-local-leader');
  const [siteConfig, setSiteConfig] = useState<any>(null);
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState<VideoItem | null>(null);

  // 1. Identify current site
  useEffect(() => {
    const qSite = searchParams.get('site') || 'the-local-leader';
    setSiteSlug(qSite.toLowerCase());
  }, [searchParams]);

  // 2. Fetch site config
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

          // 👉 STRICT SITE FILTER: Only match this portal or all-network videos
          if (targetSite === siteSlug || targetSite === 'all' || !data.siteId) {
            list.push({ id: d.id, ...data } as VideoItem);
          }
        });

        // Newest first
        list.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
        setVideos(list);
        if (list.length > 0 && !selectedVideo) {
          setSelectedVideo(list[0]);
        }
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

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0f172a', color: '#f8fafc', fontFamily: '"Mukta", system-ui, sans-serif', display: 'flex', flexDirection: 'column' }}>
      
      {/* Header bar */}
      <header style={{ backgroundColor: '#1e242b', borderBottom: '1px solid #334155', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Link href={`/?site=${siteSlug}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: primary, textDecoration: 'none', fontWeight: 700, fontSize: '14px' }}>
              <span style={{ fontSize: '18px' }}>←</span>
              <span>{siteName}</span>
            </Link>
            <span style={{ color: '#475569' }}>|</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '16px' }}>📹</span>
              <h1 style={{ fontSize: '16px', fontWeight: 800, margin: 0, color: '#f8fafc' }}>
                वीडियो बुलेटिन (Video Gallery)
              </h1>
            </div>
          </div>

          <span style={{ fontSize: '12px', color: '#94a3b8', backgroundColor: '#0f172a', padding: '4px 10px', borderRadius: '12px', border: '1px solid #334155' }}>
            {siteName} विशेष
          </span>
        </div>
      </header>

      {/* Main Container */}
      <main style={{ maxWidth: '1400px', width: '100%', margin: '0 auto', padding: '24px 16px 48px', flex: 1 }}>
        
        {loading ? (
          <div style={{ textAlign: 'center', padding: '80px 20px', color: '#94a3b8' }}>
            वीडियो लोड हो रहे हैं…
          </div>
        ) : videos.length === 0 ? (
          <div style={{ backgroundColor: '#1e242b', borderRadius: '16px', border: '1px dashed #334155', padding: '70px 20px', textAlign: 'center' }}>
            <span style={{ fontSize: '48px', display: 'block', marginBottom: '12px', opacity: 0.5 }}>📹</span>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#f8fafc', marginBottom: '6px' }}>
              वर्तमान में &quot;{siteName}&quot; के लिए कोई वीडियो बुलेटिन उपलब्ध नहीं है
            </h3>
            <p style={{ fontSize: '13px', color: '#94a3b8', maxWidth: '420px', margin: '0 auto 20px' }}>
              एडमिन द्वारा इस पोर्टल के लिए नए वीडियो अपलोड करने के बाद वे यहाँ प्रदर्शित होंगे।
            </p>
            <Link
              href={`/?site=${siteSlug}`}
              style={{ backgroundColor: primary, color: '#fff', textDecoration: 'none', padding: '9px 20px', borderRadius: '8px', fontSize: '13px', fontWeight: 700 }}
            >
              मुख्य समाचार देखें
            </Link>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '22px' }}>
            {videos.map((vid) => (
              <div
                key={vid.id}
                style={{
                  backgroundColor: '#1e242b',
                  borderRadius: '14px',
                  border: '1px solid #334155',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  boxShadow: '0 4px 14px rgba(0,0,0,0.3)'
                }}
              >
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

                <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ backgroundColor: '#0f172a', color: primary, fontSize: '11px', fontWeight: 700, padding: '3px 8px', borderRadius: '4px', border: '1px solid #334155' }}>
                      {vid.category || 'वीडियो'}
                    </span>
                    <span style={{ fontSize: '11px', color: '#64748b' }}>
                      {siteName}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#f8fafc', margin: '0 0 8px', lineHeight: 1.4 }}>
                    {vid.title}
                  </h3>

                  {vid.description && (
                    <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0, lineHeight: 1.5 }}>
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
    <Suspense fallback={<div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', backgroundColor: '#0f172a', color: '#94a3b8' }}>वीडियो लोड हो रहे हैं…</div>}>
      <VideosContent />
    </Suspense>
  );
}