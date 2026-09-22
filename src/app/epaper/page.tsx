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

const DEFAULT_EDITIONS: EPaperEdition[] = [
  { id: 'bhopal-ed', cityName: 'भोपाल', editionName: 'द लोकल लीडर मुख्य संस्करण', date: '22-09-2026', thumbnailUrl: 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=700', pdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', pages: ['https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=1200','https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=1200'], totalPages: 12 },
  { id: 'indore-ed', cityName: 'इंदौर', editionName: 'द लोकल लीडर इंदौर', date: '22-09-2026', thumbnailUrl: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=700', pdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', pages: ['https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=1200'], totalPages: 14 },
  { id: 'indore-city', cityName: 'इंदौर सिटी विशेष', editionName: 'सिटी हलचल संस्करण', date: '22-09-2026', thumbnailUrl: 'https://images.unsplash.com/photo-1526470608268-f674ce90ebd4?w=700', pdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', pages: ['https://images.unsplash.com/photo-1526470608268-f674ce90ebd4?w=1200'], totalPages: 8 },
  { id: 'ujjain-ed', cityName: 'उज्जैन', editionName: 'महाकाल नगरी संस्करण', date: '22-09-2026', thumbnailUrl: 'https://images.unsplash.com/photo-1586339949916-3e9457bef6d3?w=700', pdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', pages: ['https://images.unsplash.com/photo-1586339949916-3e9457bef6d3?w=1200'], totalPages: 10 },
  { id: 'dewas-ed', cityName: 'देवास', editionName: 'चामुंडा नगरी विशेष', date: '22-09-2026', thumbnailUrl: 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=700', pdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', pages: ['https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=1200'], totalPages: 10 }
];

export default function EPaperPage() {
  const [editions, setEditions] = useState<EPaperEdition[]>(DEFAULT_EDITIONS);
  const [selectedCity, setSelectedCity] = useState<string>('सभी');
  const [selectedDate, setSelectedDate] = useState<string>('2026-09-22');
  const [themeColor, setThemeColor] = useState<string>('#ea580c');
  const [siteName, setSiteName] = useState<string>('द लोकल लीडर');
  const [siteLogo, setSiteLogo] = useState<string>('/logos/the-local-leader.jpeg');
  const [readingEdition, setReadingEdition] = useState<EPaperEdition | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [zoomLevel, setZoomLevel] = useState<number>(1);

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

  useEffect(() => {
    const q = query(collection(db, 'epaper'));
    const unsub = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const list: EPaperEdition[] = snapshot.docs.map((docSnap) => {
          const d = docSnap.data();
          return {
            id: docSnap.id, cityName: d.cityName || d.city || 'मुख्य',
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
    }, (err) => { console.error(err); });
    return () => unsub();
  }, [siteName]);

  const filteredEditions = editions.filter((ed) => {
    if (selectedCity === 'सभी') return true;
    return ed.cityName.includes(selectedCity);
  });

  const handleShare = async (edition: EPaperEdition) => {
    if (navigator.share) {
      try {
        await navigator.share({ title: `${siteName} - ${edition.cityName} ई-पेपर`, text: `आज का ई-पेपर ऑनलाइन पढ़ें: ${edition.cityName} संस्करण (${edition.date})`, url: window.location.href });
      } catch (err) { console.error(err); }
    } else { navigator.clipboard.writeText(window.location.href); alert('ई-पेपर लिंक कॉपी हो गया है!'); }
  };

  const handleOpenReader = (edition: EPaperEdition) => {
    setReadingEdition(edition);
    setCurrentPage(0);
    setZoomLevel(1);
  };

  const cv = { '--ep': themeColor } as React.CSSProperties;

  return (
    <>
      <style jsx global>{allCSS}</style>

      <div className="ep-page" style={cv}>

        {/* ════════ HEADER ════════ */}
        <header className="ep-hdr">
          <div className="ep-hdr-in">
            <div className="ep-hdr-left">
              {siteLogo && <img src={siteLogo} alt={siteName} className="ep-hdr-logo" />}
              <div className="ep-hdr-brand">
                <b className="ep-hdr-title">{siteName} <span className="ep-hdr-tag">ई-पेपर</span></b>
                <span className="ep-hdr-sub">डिजिटल दैनिक समाचार पत्र</span>
              </div>
            </div>
            <Link href="/" className="ep-hdr-back">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>
              मुख्य वेबसाइट
            </Link>
          </div>
        </header>

        {/* ════════ MAIN ════════ */}
        <main className="ep-main">

          {/* Filter Bar */}
          <div className="ep-filter">
            <div className="ep-filter-cities">
              <span className="ep-filter-label">शहर:</span>
              {['सभी', 'भोपाल', 'इंदौर', 'उज्जैन', 'देवास'].map((city) => (
                <button
                  key={city}
                  type="button"
                  onClick={() => setSelectedCity(city)}
                  className={`ep-city-btn ${selectedCity === city ? 'active' : ''}`}
                  style={selectedCity === city ? { background: themeColor, borderColor: themeColor } : {}}
                >
                  {city}
                </button>
              ))}
            </div>
            <div className="ep-filter-date">
              <svg className="ep-date-ico" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="ep-date-input" />
            </div>
          </div>

          {/* Section Title */}
          <div className="ep-sec-head">
            <div className="ep-sec-accent" style={{ background: themeColor }} />
            <div>
              <h2 className="ep-sec-h">मेरे पसंदीदा शहर</h2>
              <p className="ep-sec-p">अपने शहर का आज का संपूर्ण ई-पेपर पढ़ें या पूरी पीडीएफ डाउनलोड करें</p>
            </div>
          </div>

          {/* Edition Cards Grid */}
          <div className="ep-grid">
            {filteredEditions.map((edition) => (
              <div key={edition.id} className="ep-card">

                {/* City */}
                <div className="ep-card-city">{edition.cityName}</div>

                {/* Newspaper Replica */}
                <div className="ep-cover" onClick={() => handleOpenReader(edition)}>
                  <div className="ep-masthead">
                    <div className="ep-masthead-left">
                      <span className="ep-masthead-ico">🗞️</span>
                      <b className="ep-masthead-name">{siteName}</b>
                    </div>
                    <span className="ep-masthead-city">{edition.cityName}</span>
                  </div>
                  <img src={edition.thumbnailUrl} alt={edition.cityName} className="ep-cover-img" />
                  <div className="ep-cover-overlay">
                    <span className="ep-cover-cta" style={{ background: themeColor }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/></svg>
                      ई-पेपर पढ़ें
                    </span>
                  </div>
                </div>

                {/* Footer: Date + Actions */}
                <div className="ep-card-foot">
                  <span className="ep-card-date">{edition.date}</span>
                  <div className="ep-card-icons">
                    <button type="button" onClick={() => handleShare(edition)} title="शेयर करें" className="ep-icon-btn">
                      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"/></svg>
                    </button>
                    <a href={edition.pdfUrl} download={`${edition.cityName}-epaper-${edition.date}.pdf`} target="_blank" rel="noreferrer" title="PDF डाउनलोड करें" className="ep-icon-btn ep-icon-dl" style={{ color: themeColor }}>
                      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                    </a>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="ep-card-btns">
                  <button type="button" onClick={() => handleOpenReader(edition)} className="ep-btn-read">पढ़ें</button>
                  <a href={edition.pdfUrl} download target="_blank" rel="noreferrer" className="ep-btn-pdf">PDF डाउनलोड</a>
                </div>

              </div>
            ))}
          </div>
        </main>

        {/* ════════ FULLSCREEN READER MODAL ════════ */}
        {readingEdition && (
          <div className="ep-reader">
            <div className="ep-reader-bar">
              <div className="ep-reader-info">
                <b className="ep-reader-title">{siteName}</b>
                <span className="ep-reader-ed">{readingEdition.cityName} · {readingEdition.date}</span>
              </div>
              <div className="ep-reader-ctrls">
                <button type="button" disabled={currentPage === 0} onClick={() => setCurrentPage(p => Math.max(0, p - 1))} className="ep-r-btn">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
                  पिछला
                </button>
                <span className="ep-r-page">
                  <b>{currentPage + 1}</b> / {readingEdition.pages.length || 1}
                </span>
                <button type="button" disabled={currentPage >= (readingEdition.pages.length - 1)} onClick={() => setCurrentPage(p => Math.min(readingEdition.pages.length - 1, p + 1))} className="ep-r-btn">
                  अगला
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
                </button>
                <span className="ep-r-sep" />
                <button type="button" onClick={() => setZoomLevel(p => (p === 1 ? 1.5 : 1))} className="ep-r-btn">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>{zoomLevel === 1 ? <line x1="11" y1="8" x2="11" y2="14"/> : null}{zoomLevel === 1 ? <line x1="8" y1="11" x2="14" y2="11"/> : null}</svg>
                  {zoomLevel === 1 ? 'ज़ूम' : 'रीसेट'}
                </button>
                <a href={readingEdition.pdfUrl} download target="_blank" rel="noreferrer" className="ep-r-dl" style={{ background: themeColor }}>
                  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                  PDF
                </a>
                <button type="button" onClick={() => setReadingEdition(null)} className="ep-r-close">✕</button>
              </div>
            </div>
            <div className="ep-reader-view">
              <img
                src={readingEdition.pages[currentPage] || readingEdition.thumbnailUrl}
                alt={`Page ${currentPage + 1}`}
                className="ep-reader-img"
                style={{ maxWidth: zoomLevel === 1 ? '92%' : '140%', maxHeight: zoomLevel === 1 ? '86vh' : 'none', transform: `scale(${zoomLevel})` }}
              />
            </div>
          </div>
        )}

      </div>
    </>
  );
}


/* ══════════════════════════════════════════════════════════
   NORMAL CSS — no framework, embedded via <style jsx global>
   ══════════════════════════════════════════════════════════ */
const allCSS = `

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

.ep-page {
  min-height: 100vh;
  background: #f4f6f8;
  color: #0f172a;
  font-family: 'Noto Sans Devanagari', 'Inter', 'SF Pro Text', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
  -webkit-font-smoothing: antialiased;
}

/* ══════ HEADER ══════ */
.ep-hdr {
  background: rgba(255,255,255,.94);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  border-bottom: 1px solid #ebeef3;
  position: sticky;
  top: 0;
  z-index: 40;
}
.ep-hdr-in {
  max-width: 1380px;
  margin: 0 auto;
  padding: 12px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}
.ep-hdr-left {
  display: flex;
  align-items: center;
  gap: 12px;
}
.ep-hdr-logo {
  height: 38px;
  width: auto;
  border-radius: 6px;
  object-fit: contain;
}
.ep-hdr-brand {
  display: flex;
  flex-direction: column;
}
.ep-hdr-title {
  font-size: 18px;
  color: #0f172a;
  line-height: 1.2;
}
.ep-hdr-tag {
  font-weight: 600;
  color: var(--ep);
  font-size: 15px;
}
.ep-hdr-sub {
  font-size: 11px;
  color: #94a3b8;
  font-weight: 500;
}
.ep-hdr-back {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 13px;
  color: var(--ep);
  text-decoration: none;
  font-weight: 650;
  padding: 6px 14px 6px 10px;
  border-radius: 8px;
  transition: background .15s;
}
.ep-hdr-back:hover {
  background: rgba(0,0,0,.03);
}

/* ══════ MAIN ══════ */
.ep-main {
  max-width: 1380px;
  margin: 0 auto;
  padding: 24px 20px 52px;
}

/* ══════ FILTER BAR ══════ */
.ep-filter {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 14px;
  margin-bottom: 28px;
  background: #fff;
  padding: 14px 18px;
  border-radius: 14px;
  border: 1px solid #ebeef3;
  box-shadow: 0 1px 3px rgba(0,0,0,.02);
}
.ep-filter-cities {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.ep-filter-label {
  font-size: 13px;
  font-weight: 700;
  color: #475569;
  margin-right: 2px;
}
.ep-city-btn {
  background: #fff;
  color: #475569;
  border: 1px solid #dde2ea;
  border-radius: 20px;
  padding: 5px 15px;
  font-size: 12.5px;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  transition: background .15s, color .15s, border-color .15s;
}
.ep-city-btn:hover {
  border-color: #b0b8c4;
}
.ep-city-btn.active {
  color: #fff;
  border-color: transparent;
}
.ep-filter-date {
  display: flex;
  align-items: center;
  gap: 7px;
}
.ep-date-ico {
  color: #94a3b8;
}
.ep-date-input {
  padding: 6px 12px;
  border-radius: 8px;
  border: 1px solid #dde2ea;
  font-size: 13px;
  font-family: inherit;
  outline: none;
  background: #f8f9fb;
  color: #334155;
  transition: border-color .15s;
}
.ep-date-input:focus {
  border-color: var(--ep);
}

/* ══════ SECTION HEAD ══════ */
.ep-sec-head {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 22px;
}
.ep-sec-accent {
  width: 4px;
  height: 36px;
  border-radius: 4px;
  flex-shrink: 0;
}
.ep-sec-h {
  font-size: 20px;
  font-weight: 800;
  color: #0f172a;
  margin: 0;
  line-height: 1.2;
}
.ep-sec-p {
  font-size: 13px;
  color: #64748b;
  margin: 2px 0 0;
}

/* ══════ GRID ══════ */
.ep-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(270px, 1fr));
  gap: 20px;
}

/* ══════ EDITION CARD ══════ */
.ep-card {
  background: #fff;
  border: 1px solid #ebeef3;
  border-radius: 14px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 1px 3px rgba(0,0,0,.02);
  transition: border-color .18s, box-shadow .18s;
}
.ep-card:hover {
  border-color: #d4d9e3;
  box-shadow: 0 4px 20px rgba(0,0,0,.05);
}

/* City Name */
.ep-card-city {
  font-size: 15px;
  font-weight: 750;
  color: #0f172a;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 6px;
}

/* Cover / Newspaper Replica */
.ep-cover {
  cursor: pointer;
  border: 1px solid #e2e6ed;
  border-radius: 10px;
  overflow: hidden;
  position: relative;
  background: #f1f4f8;
  aspect-ratio: 3/4;
  display: flex;
  flex-direction: column;
}

/* Masthead */
.ep-masthead {
  background: #fff;
  border-bottom: 2px solid #1a1a2e;
  padding: 8px 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
}
.ep-masthead-left {
  display: flex;
  align-items: center;
  gap: 5px;
}
.ep-masthead-ico { font-size: 13px; }
.ep-masthead-name {
  font-size: 14px;
  color: #991b1b;
  letter-spacing: .3px;
  font-family: Georgia, 'Times New Roman', serif;
}
.ep-masthead-city {
  font-size: 9.5px;
  color: #94a3b8;
  font-weight: 500;
}

/* Cover Image */
.ep-cover-img {
  width: 100%;
  flex: 1;
  object-fit: cover;
  display: block;
}

/* Hover Overlay */
.ep-cover-overlay {
  position: absolute;
  inset: 0;
  background: rgba(10, 15, 30, 0.45);
  opacity: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: opacity .22s;
}
.ep-cover:hover .ep-cover-overlay {
  opacity: 1;
}
.ep-cover-cta {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  color: #fff;
  padding: 10px 22px;
  border-radius: 10px;
  font-size: 13.5px;
  font-weight: 700;
  box-shadow: 0 4px 16px rgba(0,0,0,.2);
  transform: translateY(6px);
  transition: transform .22s;
}
.ep-cover:hover .ep-cover-cta {
  transform: translateY(0);
}

/* Card Footer */
.ep-card-foot {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 14px;
  padding-top: 12px;
  border-top: 1px solid #f1f4f8;
}
.ep-card-date {
  font-size: 12.5px;
  color: #94a3b8;
  font-weight: 500;
  font-variant-numeric: tabular-nums;
}
.ep-card-icons {
  display: flex;
  gap: 4px;
}
.ep-icon-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: #94a3b8;
  padding: 5px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color .15s, background .15s;
  text-decoration: none;
}
.ep-icon-btn:hover {
  background: #f1f4f8;
  color: #475569;
}
.ep-icon-dl:hover {
  color: var(--ep) !important;
}

/* Action Buttons */
.ep-card-btns {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-top: 10px;
}
.ep-btn-read {
  background: #0f172a;
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 9px;
  font-size: 12.5px;
  font-weight: 650;
  cursor: pointer;
  font-family: inherit;
  transition: background .15s;
}
.ep-btn-read:hover {
  background: #1e293b;
}
.ep-btn-pdf {
  background: #f8f9fb;
  color: #334155;
  border: 1px solid #dde2ea;
  border-radius: 8px;
  padding: 9px;
  font-size: 12.5px;
  font-weight: 650;
  text-align: center;
  text-decoration: none;
  display: block;
  font-family: inherit;
  transition: background .15s;
}
.ep-btn-pdf:hover {
  background: #eef1f5;
}

/* ══════ FULLSCREEN READER ══════ */
.ep-reader {
  position: fixed;
  inset: 0;
  background: #0a0e18;
  z-index: 100;
  display: flex;
  flex-direction: column;
  animation: epFadeIn .2s ease;
}
@keyframes epFadeIn { from { opacity: 0; } to { opacity: 1; } }

/* Reader Top Bar */
.ep-reader-bar {
  background: #0f1628;
  border-bottom: 1px solid rgba(148,163,184,.1);
  color: #fff;
  padding: 10px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}
.ep-reader-info {
  display: flex;
  align-items: center;
  gap: 12px;
}
.ep-reader-title {
  font-size: 15px;
}
.ep-reader-ed {
  font-size: 12.5px;
  color: #94a3b8;
  font-weight: 500;
}
.ep-reader-ctrls {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.ep-r-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  background: #1a2038;
  color: #e2e8f0;
  border: 1px solid rgba(148,163,184,.12);
  border-radius: 7px;
  padding: 6px 12px;
  font-size: 12.5px;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  transition: background .15s;
}
.ep-r-btn:hover { background: #242e4a; }
.ep-r-btn:disabled { opacity: .35; cursor: not-allowed; }
.ep-r-page {
  font-size: 12.5px;
  color: #94a3b8;
  font-variant-numeric: tabular-nums;
  padding: 0 2px;
}
.ep-r-page b { color: #fff; }
.ep-r-sep {
  width: 1px;
  height: 18px;
  background: rgba(148,163,184,.15);
  margin: 0 2px;
}
.ep-r-dl {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  color: #fff;
  padding: 6px 14px;
  border-radius: 7px;
  text-decoration: none;
  font-size: 12.5px;
  font-weight: 700;
  transition: opacity .15s;
}
.ep-r-dl:hover { opacity: .88; }
.ep-r-close {
  background: rgba(239,68,68,.12);
  color: #f87171;
  border: 1px solid rgba(239,68,68,.15);
  border-radius: 7px;
  padding: 6px 14px;
  cursor: pointer;
  font-weight: 800;
  font-size: 14px;
  font-family: inherit;
  transition: background .15s;
}
.ep-r-close:hover {
  background: rgba(239,68,68,.2);
}

/* Reader View */
.ep-reader-view {
  flex: 1;
  overflow: auto;
  padding: 24px;
  display: flex;
  justify-content: center;
  align-items: center;
}
.ep-reader-img {
  object-fit: contain;
  box-shadow: 0 8px 40px rgba(0,0,0,.5);
  border-radius: 4px;
  transition: transform .25s ease;
}

/* ══════ RESPONSIVE ══════ */
@media (max-width: 768px) {
  .ep-hdr-in { flex-direction: column; align-items: flex-start; gap: 8px; }
  .ep-filter { flex-direction: column; align-items: flex-start; }
  .ep-filter-cities { gap: 6px; }
  .ep-grid { grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 14px; }
  .ep-reader-bar { flex-direction: column; align-items: flex-start; gap: 8px; padding: 10px 14px; }
  .ep-reader-ctrls { width: 100%; overflow-x: auto; flex-wrap: nowrap; padding-bottom: 4px; gap: 6px; }
  .ep-reader-ctrls::-webkit-scrollbar { height: 0; }
  .ep-reader-view { padding: 12px; }
}
@media (max-width: 480px) {
  .ep-main { padding: 16px 12px 40px; }
  .ep-grid { grid-template-columns: 1fr; }
  .ep-hdr-title { font-size: 16px; }
  .ep-card { padding: 14px; }
  .ep-sec-h { font-size: 18px; }
  .ep-r-btn { padding: 5px 8px; font-size: 11.5px; }
  .ep-r-dl { padding: 5px 10px; font-size: 11.5px; }
}
`;