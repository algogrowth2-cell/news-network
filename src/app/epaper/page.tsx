'use client';

import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, where, doc } from 'firebase/firestore';
import Link from 'next/link';

interface EPaperEdition {
  id: string;
  cityName: string;
  editionName: string;
  date: string;
  thumbnailUrl: string;
  pdfUrl: string;
  pages: string[];
  totalPages: number;
}

// Default Fallback Editions
const DEFAULT_EDITIONS: EPaperEdition[] = [
  {
    id: 'bhopal-ed',
    cityName: 'भोपाल',
    editionName: 'द लोकल लीडर मुख्य संस्करण',
    date: '22-09-2026',
    thumbnailUrl: 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=700',
    pdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    pages: [
      'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=1200',
      'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=1200'
    ],
    totalPages: 12
  },
  {
    id: 'indore-ed',
    cityName: 'इंदौर',
    editionName: 'द लोकल लीडर इंदौर',
    date: '22-09-2026',
    thumbnailUrl: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=700',
    pdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    pages: [
      'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=1200'
    ],
    totalPages: 14
  },
  {
    id: 'indore-city',
    cityName: 'इंदौर सिटी विशेष',
    editionName: 'सिटी हलचल संस्करण',
    date: '22-09-2026',
    thumbnailUrl: 'https://images.unsplash.com/photo-1526470608268-f674ce90ebd4?w=700',
    pdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    pages: [
      'https://images.unsplash.com/photo-1526470608268-f674ce90ebd4?w=1200'
    ],
    totalPages: 8
  },
  {
    id: 'ujjain-ed',
    cityName: 'उज्जैन',
    editionName: 'महाकाल नगरी संस्करण',
    date: '22-09-2026',
    thumbnailUrl: 'https://images.unsplash.com/photo-1586339949916-3e9457bef6d3?w=700',
    pdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    pages: [
      'https://images.unsplash.com/photo-1586339949916-3e9457bef6d3?w=1200'
    ],
    totalPages: 10
  },
  {
    id: 'dewas-ed',
    cityName: 'देवास',
    editionName: 'चामुंडा नगरी विशेष',
    date: '22-09-2026',
    thumbnailUrl: 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=700',
    pdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    pages: [
      'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=1200'
    ],
    totalPages: 10
  }
];

export default function EPaperPage() {
  const [editions, setEditions] = useState<EPaperEdition[]>(DEFAULT_EDITIONS);
  const [selectedCity, setSelectedCity] = useState<string>('सभी');
  const [selectedDate, setSelectedDate] = useState<string>('2026-09-22');
  
  // Theme & Branding
  const [themeColor, setThemeColor] = useState<string>('#ea580c');
  const [siteName, setSiteName] = useState<string>('द लोकल लीडर');
  const [siteLogo, setSiteLogo] = useState<string>('/logos/the-local-leader.jpeg');

  // Reader Modal State
  const [readingEdition, setReadingEdition] = useState<EPaperEdition | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [zoomLevel, setZoomLevel] = useState<number>(1);

  // 1. Fetch Dynamic Site Branding
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'sites', 'the-local-leader'), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data.primaryColor) setThemeColor(data.primaryColor);
        if (data.name) setSiteName(data.name);
        if (data.logoUrl) setSiteLogo(data.logoUrl);
      }
    });
    return () => unsub();
  }, []);

  // 2. Fetch Live E-papers from Firestore
  useEffect(() => {
    const q = query(collection(db, 'epaper'));
    const unsub = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const list: EPaperEdition[] = snapshot.docs.map((docSnap) => {
          const d = docSnap.data();
          return {
            id: docSnap.id,
            cityName: d.cityName || d.city || 'मुख्य',
            editionName: d.editionName || d.title || `${siteName} ई-पेपर`,
            date: d.date || '22-09-2026',
            thumbnailUrl: d.thumbnailUrl || d.coverImage || 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=700',
            pdfUrl: d.pdfUrl || '',
            pages: Array.isArray(d.pages) && d.pages.length > 0 ? d.pages : [d.thumbnailUrl || 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=1200'],
            totalPages: Number(d.totalPages || d.pages?.length || 10)
          };
        });
        setEditions(list);
      }
    }, (err) => {
      console.error(err);
    });
    return () => unsub();
  }, [siteName]);

  const filteredEditions = editions.filter((ed) => {
    if (selectedCity === 'सभी') return true;
    return ed.cityName.includes(selectedCity);
  });

  const handleShare = async (edition: EPaperEdition) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${siteName} - ${edition.cityName} ई-पेपर`,
          text: `आज का ई-पेपर ऑनलाइन पढ़ें: ${edition.cityName} संस्करण (${edition.date})`,
          url: window.location.href
        });
      } catch (err) {
        console.error(err);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('ई-पेपर लिंक कॉपी हो गया है!');
    }
  };

  const handleOpenReader = (edition: EPaperEdition) => {
    setReadingEdition(edition);
    setCurrentPage(0);
    setZoomLevel(1);
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#ffffff', color: '#0f172a', fontFamily: '"Mukta", system-ui, sans-serif' }}>
      
      {/* Top Header */}
      <header style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #e2e8f0', padding: '14px 24px', position: 'sticky', top: 0, zIndex: 40, boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
        <div style={{ maxWidth: '1380px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {siteLogo && (
              <img src={siteLogo} alt={siteName} style={{ height: '38px', width: 'auto', borderRadius: '4px', objectFit: 'contain' }} />
            )}
            <div>
              <b style={{ fontSize: '20px', color: '#0f172a' }}>{siteName} ई-पेपर</b>
              <div style={{ fontSize: '11.5px', color: '#64748b' }}>डिजिटल दैनिक समाचार पत्र (Digital Replica Edition)</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <Link href="/" style={{ fontSize: '13.5px', color: themeColor, textDecoration: 'none', fontWeight: 600 }}>
              ← मुख्य वेबसाइट
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main style={{ maxWidth: '1380px', margin: '0 auto', padding: '24px 20px' }}>
        
        {/* Date and City Filter Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '28px', backgroundColor: '#f8fafc', padding: '14px 18px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '13.5px', fontWeight: 700, color: '#334155' }}>शहर चुनें:</span>
            {['सभी', 'भोपाल', 'इंदौर', 'उज्जैन', 'देवास'].map((city) => (
              <button
                key={city}
                type="button"
                onClick={() => setSelectedCity(city)}
                style={{
                  backgroundColor: selectedCity === city ? themeColor : '#ffffff',
                  color: selectedCity === city ? '#ffffff' : '#475569',
                  border: `1px solid ${selectedCity === city ? themeColor : '#cbd5e1'}`,
                  borderRadius: '20px',
                  padding: '5px 14px',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                {city}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '13px', color: '#64748b' }}>दिनांक:</span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', outline: 'none', backgroundColor: '#ffffff' }}
            />
          </div>
        </div>

        {/* Section Title */}
        <div style={{ marginBottom: '20px' }}>
          <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', margin: '0 0 4px 0' }}>मेरे पसंदीदा शहर</h2>
          <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>अपने शहर का आज का संपूर्ण ई-पेपर पढ़ें या पूरी पीडीएफ डाउनलोड करें</p>
        </div>

        {/* Grid Layout Matching Screenshot */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '22px' }}>
          {filteredEditions.map((edition) => (
            <div
              key={edition.id}
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: '16px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 0.15s ease, box-shadow 0.15s ease'
              }}
            >
              {/* City Name Header */}
              <div style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', marginBottom: '12px' }}>
                {edition.cityName}
              </div>

              {/* Newspaper Replica Front Page with Website Masthead */}
              <div
                onClick={() => handleOpenReader(edition)}
                style={{
                  cursor: 'pointer',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  overflow: 'hidden',
                  position: 'relative',
                  backgroundColor: '#f1f5f9',
                  aspectRatio: '3/4',
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                {/* Dynamic Newspaper Masthead Banner */}
                <div style={{ backgroundColor: '#ffffff', borderBottom: '2px solid #0f172a', padding: '8px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '14px' }}>🗞️</span>
                    <b style={{ fontSize: '15px', color: '#b91c1c', letterSpacing: '0.5px', fontFamily: 'Georgia, serif' }}>
                      {siteName}
                    </b>
                  </div>
                  <span style={{ fontSize: '9.5px', color: '#64748b' }}>{edition.cityName}</span>
                </div>

                {/* Cover Image */}
                <img
                  src={edition.thumbnailUrl}
                  alt={edition.cityName}
                  style={{ width: '100%', flex: 1, objectFit: 'cover' }}
                />

                {/* Hover Read Overlay */}
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundColor: 'rgba(15, 23, 42, 0.4)',
                    opacity: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    color: '#ffffff',
                    transition: 'opacity 0.2s ease',
                    fontWeight: 600,
                    fontSize: '14px'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                  onMouseLeave={(e) => (e.currentTarget.style.opacity = '0')}
                >
                  <span style={{ backgroundColor: themeColor, padding: '8px 16px', borderRadius: '20px' }}>
                    📖 ई-पेपर पढ़ें
                  </span>
                </div>
              </div>

              {/* Footer Meta: Date & Share Button */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '14px', paddingTop: '10px', borderTop: '1px solid #f1f5f9' }}>
                <span style={{ fontSize: '12.5px', color: '#64748b', fontWeight: 500 }}>
                  {edition.date}
                </span>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => handleShare(edition)}
                    title="शेयर करें"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: '4px' }}
                  >
                    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                    </svg>
                  </button>

                  <a
                    href={edition.pdfUrl}
                    download={`${edition.cityName}-epaper-${edition.date}.pdf`}
                    target="_blank"
                    rel="noreferrer"
                    title="PDF डाउनलोड करें"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: themeColor, display: 'flex', alignItems: 'center', padding: '4px' }}
                  >
                    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                  </a>
                </div>
              </div>

              {/* Action Buttons Row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => handleOpenReader(edition)}
                  style={{
                    backgroundColor: '#0f172a',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '8px',
                    fontSize: '12.5px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  पढ़ें
                </button>

                <a
                  href={edition.pdfUrl}
                  download
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    backgroundColor: '#f1f5f9',
                    color: '#334155',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    padding: '8px',
                    fontSize: '12.5px',
                    fontWeight: 600,
                    textAlign: 'center',
                    textDecoration: 'none',
                    display: 'block'
                  }}
                >
                  PDF डाउनलोड
                </a>
              </div>

            </div>
          ))}
        </div>

      </main>

      {/* ── FULLSCREEN E-PAPER READER MODAL ── */}
      {readingEdition && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 100, display: 'flex', flexDirection: 'column' }}>
          
          {/* Reader Top Controls */}
          <div style={{ backgroundColor: '#0f172a', color: '#ffffff', padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <b style={{ fontSize: '16px' }}>{siteName} ({readingEdition.cityName} संस्करण)</b>
              <span style={{ fontSize: '13px', color: '#94a3b8' }}>दिनांक: {readingEdition.date}</span>
            </div>

            {/* Page & Zoom Controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button
                type="button"
                disabled={currentPage === 0}
                onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
                style={{ backgroundColor: '#1e293b', color: '#ffffff', border: '1px solid #334155', borderRadius: '4px', padding: '6px 12px', cursor: currentPage === 0 ? 'not-allowed' : 'pointer', fontSize: '13px' }}
              >
                ◀ पिछला पेज
              </button>

              <span style={{ fontSize: '13px', color: '#cbd5e1' }}>
                पेज <b>{currentPage + 1}</b> / {readingEdition.pages.length || 1}
              </span>

              <button
                type="button"
                disabled={currentPage >= (readingEdition.pages.length - 1)}
                onClick={() => setCurrentPage(prev => Math.min(readingEdition.pages.length - 1, prev + 1))}
                style={{ backgroundColor: '#1e293b', color: '#ffffff', border: '1px solid #334155', borderRadius: '4px', padding: '6px 12px', cursor: currentPage >= (readingEdition.pages.length - 1) ? 'not-allowed' : 'pointer', fontSize: '13px' }}
              >
                अगला पेज ▶
              </button>

              <button
                type="button"
                onClick={() => setZoomLevel(prev => (prev === 1 ? 1.5 : 1))}
                style={{ backgroundColor: '#1e293b', color: '#ffffff', border: '1px solid #334155', borderRadius: '4px', padding: '6px 12px', cursor: 'pointer', fontSize: '13px' }}
              >
                {zoomLevel === 1 ? '🔍 ज़ूम इन' : '🔍 ज़ूम रीसेट'}
              </button>

              <a
                href={readingEdition.pdfUrl}
                download
                target="_blank"
                rel="noreferrer"
                style={{ backgroundColor: themeColor, color: '#ffffff', padding: '6px 14px', borderRadius: '4px', textDecoration: 'none', fontSize: '13px', fontWeight: 600 }}
              >
                📥 PDF डाउनलोड
              </a>

              <button
                type="button"
                onClick={() => setReadingEdition(null)}
                style={{ backgroundColor: '#ef4444', color: '#ffffff', border: 'none', borderRadius: '4px', padding: '6px 14px', cursor: 'pointer', fontWeight: 700 }}
              >
                ✕ बंद करें
              </button>
            </div>
          </div>

          {/* Reader View Body */}
          <div style={{ flex: 1, overflow: 'auto', padding: '20px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <img
              src={readingEdition.pages[currentPage] || readingEdition.thumbnailUrl}
              alt={`Page ${currentPage + 1}`}
              style={{
                maxWidth: zoomLevel === 1 ? '90%' : '140%',
                maxHeight: zoomLevel === 1 ? '85vh' : 'none',
                objectFit: 'contain',
                boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
                borderRadius: '4px',
                transition: 'transform 0.2s ease',
                transform: `scale(${zoomLevel})`
              }}
            />
          </div>

        </div>
      )}

    </div>
  );
}