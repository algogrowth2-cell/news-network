'use client';
import { useState } from 'react';
import Link from 'next/link';

const primary = '#ea580c';

const RSS_FEEDS = [
  { id: 'all', name: 'मुख्य समाचार', nameEn: 'All News', desc: 'सभी श्रेणियों की ताज़ा खबरें', url: '/api/rss/feed.xml', icon: '📰' },
  { id: 'politics', name: 'राजनीति', nameEn: 'Politics', desc: 'राजनीतिक घटनाक्रम एवं विश्लेषण', url: '/api/rss/politics.xml', icon: '🏛️' },
  { id: 'business', name: 'व्यापार', nameEn: 'Business', desc: 'बाज़ार, अर्थव्यवस्था और उद्योग', url: '/api/rss/business.xml', icon: '📈' },
  { id: 'sports', name: 'खेल', nameEn: 'Sports', desc: 'क्रिकेट, फुटबॉल और अन्य खेल', url: '/api/rss/sports.xml', icon: '🏏' },
  { id: 'crime', name: 'अपराध', nameEn: 'Crime', desc: 'अपराध समाचार एवं न्यायिक अपडेट', url: '/api/rss/crime.xml', icon: '🚨' },
  { id: 'lifestyle', name: 'जीवनशैली', nameEn: 'Lifestyle', desc: 'स्वास्थ्य, फैशन और संस्कृति', url: '/api/rss/lifestyle.xml', icon: '🌿' },
  { id: 'national', name: 'राज्य / देश', nameEn: 'National', desc: 'राष्ट्रीय एवं राज्य स्तरीय समाचार', url: '/api/rss/national.xml', icon: '🇮🇳' },
];

export default function RssPage() {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = async (id: string, url: string) => {
    const fullUrl = `${window.location.origin}${url}`;
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = fullUrl;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f4f3f0', color: '#1a1a1a', fontFamily: '"Mukta", system-ui, -apple-system, sans-serif' }}>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Tiro+Devanagari+Hindi:ital@0;1&family=Mukta:wght@300;400;500;600;700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .rss-feed-card {
          display: flex; align-items: center; justify-content: space-between;
          gap: 14px; padding: 16px 20px;
          border: 1px solid #eae8e4; border-radius: 12px;
          background: #fff; transition: all 0.15s ease;
          flex-wrap: wrap;
        }
        .rss-feed-card:hover {
          border-color: ${primary}40;
          box-shadow: 0 2px 12px rgba(0,0,0,0.04);
        }

        .rss-copy-btn {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 7px 14px; border-radius: 8px; font-size: 12.5px;
          font-weight: 600; cursor: pointer; border: 1.5px solid ${primary}30;
          background: ${primary}08; color: ${primary};
          font-family: "Mukta", system-ui, sans-serif;
          transition: all 0.15s ease; white-space: nowrap;
        }
        .rss-copy-btn:hover {
          background: ${primary}; color: #fff; border-color: ${primary};
        }
        .rss-copy-btn.copied {
          background: #16a34a; color: #fff; border-color: #16a34a;
        }

        .rss-url-tag {
          font-size: 11.5px; font-family: "SF Mono", "Fira Code", monospace;
          background: #fafaf8; border: 1px solid #eae8e4; border-radius: 6px;
          padding: 4px 10px; color: #888; word-break: break-all;
          line-height: 1.5;
        }

        .rss-reader-card {
          display: flex; align-items: center; gap: 14px;
          padding: 14px 18px; background: #fafaf8;
          border: 1px solid #eae8e4; border-radius: 10px;
          transition: box-shadow 0.15s ease;
        }
        .rss-reader-card:hover { box-shadow: 0 2px 10px rgba(0,0,0,0.04); }
        .rss-reader-icon {
          width: 38px; height: 38px; border-radius: 10px;
          display: grid; place-items: center; flex-shrink: 0;
          font-size: 18px; background: ${primary}0d;
        }

        .rss-step {
          display: flex; align-items: flex-start; gap: 14px;
        }
        .rss-step-num {
          width: 28px; height: 28px; border-radius: 50%;
          background: ${primary}; color: #fff;
          font-size: 13px; font-weight: 700;
          display: grid; place-items: center; flex-shrink: 0;
          margin-top: 1px;
        }

        .rss-section-head {
          display: flex; align-items: center; gap: 14px;
          margin-bottom: 16px; padding-bottom: 12px;
          border-bottom: 1px solid #eae8e4;
        }
        .rss-section-icon {
          width: 36px; height: 36px; border-radius: 10px;
          background: ${primary}0d; display: grid; place-items: center;
          flex-shrink: 0;
        }
        .rss-section-title {
          font-family: "Tiro Devanagari Hindi", Georgia, serif;
          font-size: 20px; font-weight: 600; color: #0f172a;
          line-height: 1.3;
        }

        @media (max-width: 640px) {
          .rss-main-card { padding: 24px 18px !important; }
          .rss-feed-card { padding: 14px 16px; }
          .rss-section-title { font-size: 18px; }
        }
      `}</style>

      {/* ── HEADER ── */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: '#ffffff', borderBottom: '1px solid #e8e6e2',
        boxShadow: '0 1px 4px rgba(0,0,0,0.04)'
      }}>
        <div style={{
          maxWidth: '860px', margin: '0 auto',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 24px', height: '62px'
        }}>
          <Link href="/" style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            textDecoration: 'none', color: '#1a1a1a'
          }}>
            <div style={{
              width: '34px', height: '34px', borderRadius: '8px',
              background: `${primary}0d`, display: 'grid', placeItems: 'center'
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 18l-6-6 6-6"/>
              </svg>
            </div>
            <span style={{
              fontFamily: '"Tiro Devanagari Hindi", Georgia, serif',
              fontSize: '17px', fontWeight: 600
            }}>
              द लोकल लीडर
            </span>
          </Link>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill={primary} stroke="none">
              <path d="M6.503 20.752c0 1.794-1.456 3.248-3.251 3.248-1.796 0-3.252-1.454-3.252-3.248 0-1.794 1.456-3.248 3.252-3.248 1.795.001 3.251 1.454 3.251 3.248zm-6.503-12.572v4.811c6.05.062 10.96 4.966 11.022 11.009h4.817c-.062-8.71-7.118-15.758-15.839-15.82zm0-8.18v4.819c12.951.117 23.424 10.602 23.5 23.5h4.5c-.076-15.673-12.828-28.428-28-28.319z" transform="scale(0.85) translate(2,2)"/>
            </svg>
            <span style={{ fontSize: '13px', fontWeight: 600, color: primary, letterSpacing: '0.3px' }}>
              RSS फ़ीड्स
            </span>
          </div>
        </div>
      </header>

      {/* ── HERO ── */}
      <div style={{
        background: '#ffffff', borderBottom: '1px solid #eae8e4',
        padding: '36px 24px 32px'
      }}>
        <div style={{ maxWidth: '860px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
            <div style={{
              width: '44px', height: '44px', borderRadius: '12px',
              background: `linear-gradient(135deg, ${primary}15, ${primary}08)`,
              display: 'grid', placeItems: 'center'
            }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill={primary} stroke="none">
                <path d="M6.503 20.752c0 1.794-1.456 3.248-3.251 3.248-1.796 0-3.252-1.454-3.252-3.248 0-1.794 1.456-3.248 3.252-3.248 1.795.001 3.251 1.454 3.251 3.248zm-6.503-12.572v4.811c6.05.062 10.96 4.966 11.022 11.009h4.817c-.062-8.71-7.118-15.758-15.839-15.82zm0-8.18v4.819c12.951.117 23.424 10.602 23.5 23.5h4.5c-.076-15.673-12.828-28.428-28-28.319z" transform="scale(0.75) translate(3,3)"/>
              </svg>
            </div>
            <div>
              <h1 style={{
                fontFamily: '"Tiro Devanagari Hindi", Georgia, serif',
                fontSize: '26px', fontWeight: 600, color: '#0f172a',
                margin: 0, lineHeight: 1.2
              }}>
                RSS फ़ीड्स
              </h1>
              <span style={{ fontSize: '13px', color: '#94a3b8' }}>Really Simple Syndication</span>
            </div>
          </div>
          <p style={{
            fontSize: '14.5px', color: '#64748b', lineHeight: 1.7,
            maxWidth: '620px', margin: 0
          }}>
            अपने RSS रीडर या न्यूज़ एग्रीगेटर ऐप में हमारे फ़ीड्स जोड़कर ताज़ा
            खबरें सीधे प्राप्त करें — बिना वेबसाइट खोले, बिना विज्ञापनों के।
          </p>
          <div style={{
            marginTop: '14px', display: 'flex', alignItems: 'center', gap: '16px',
            fontSize: '12px', color: '#94a3b8', flexWrap: 'wrap'
          }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: '5px',
              background: '#f8f7f5', border: '1px solid #eae8e4',
              borderRadius: '6px', padding: '4px 10px'
            }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
              </svg>
              रियल-टाइम अपडेट
            </span>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: '5px',
              background: '#f8f7f5', border: '1px solid #eae8e4',
              borderRadius: '6px', padding: '4px 10px'
            }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
                <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
              </svg>
              {RSS_FEEDS.length} फ़ीड्स उपलब्ध
            </span>
          </div>
        </div>
      </div>

      {/* ── CONTENT ── */}
      <div style={{ maxWidth: '860px', margin: '0 auto', padding: '28px 24px 60px' }}>
        <div className="rss-main-card" style={{
          background: '#ffffff', border: '1px solid #eae8e4',
          borderRadius: '14px', padding: '32px 36px',
          boxShadow: '0 1px 4px rgba(0,0,0,0.03)',
          display: 'flex', flexDirection: 'column', gap: '36px'
        }}>

          {/* ── FEEDS LIST ── */}
          <section>
            <div className="rss-section-head">
              <span className="rss-section-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 11a9 9 0 019 9"/><path d="M4 4a16 16 0 0116 16"/>
                  <circle cx="5" cy="19" r="1"/>
                </svg>
              </span>
              <h2 className="rss-section-title">उपलब्ध फ़ीड्स</h2>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {RSS_FEEDS.map(feed => (
                <div key={feed.id} className="rss-feed-card">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
                    <span style={{
                      width: '38px', height: '38px', borderRadius: '10px',
                      background: `${primary}0a`, display: 'grid', placeItems: 'center',
                      fontSize: '18px', flexShrink: 0
                    }}>
                      {feed.icon}
                    </span>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: '15px', fontWeight: 600, color: '#1a1a1a', lineHeight: 1.25 }}>
                        {feed.name}
                        <span style={{ fontWeight: 400, color: '#aaa', fontSize: '12px', marginLeft: '6px' }}>
                          {feed.nameEn}
                        </span>
                      </div>
                      <div style={{ fontSize: '12.5px', color: '#888', marginTop: '2px' }}>{feed.desc}</div>
                      <div className="rss-url-tag" style={{ marginTop: '6px', display: 'inline-block' }}>{feed.url}</div>
                    </div>
                  </div>
                  <button
                    className={`rss-copy-btn ${copiedId === feed.id ? 'copied' : ''}`}
                    onClick={() => handleCopy(feed.id, feed.url)}
                  >
                    {copiedId === feed.id ? (
                      <>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                        कॉपी हुआ
                      </>
                    ) : (
                      <>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                          <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
                        </svg>
                        URL कॉपी करें
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* ── HOW TO USE ── */}
          <section>
            <div className="rss-section-head">
              <span className="rss-section-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/>
                  <line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
              </span>
              <h2 className="rss-section-title">RSS कैसे उपयोग करें?</h2>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {[
                { num: '1', title: 'RSS रीडर ऐप चुनें', desc: 'Feedly, Inoreader, या NewsBlur जैसा कोई RSS रीडर ऐप या वेब सर्विस चुनें।' },
                { num: '2', title: 'फ़ीड URL कॉपी करें', desc: 'ऊपर दी गई सूची से अपनी पसंदीदा श्रेणी का "URL कॉपी करें" बटन दबाएं।' },
                { num: '3', title: 'ऐप में जोड़ें', desc: 'अपने RSS रीडर में "Add Feed" या "Subscribe" पर जाएं और कॉपी किया गया URL पेस्ट करें।' },
                { num: '4', title: 'खबरें प्राप्त करें', desc: 'अब जैसे ही कोई नई खबर प्रकाशित होगी, वह स्वतः आपके रीडर में दिखाई देगी।' },
              ].map(step => (
                <div key={step.num} className="rss-step">
                  <span className="rss-step-num">{step.num}</span>
                  <div>
                    <div style={{
                      fontFamily: '"Tiro Devanagari Hindi", Georgia, serif',
                      fontSize: '15px', fontWeight: 600, color: '#1a1a1a',
                      marginBottom: '2px'
                    }}>
                      {step.title}
                    </div>
                    <div style={{ fontSize: '13.5px', color: '#666', lineHeight: 1.65 }}>
                      {step.desc}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ── RECOMMENDED READERS ── */}
          <section>
            <div className="rss-section-head">
              <span className="rss-section-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                </svg>
              </span>
              <h2 className="rss-section-title">लोकप्रिय RSS रीडर</h2>
            </div>

            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '10px'
            }}>
              {[
                { name: 'Feedly', desc: 'वेब + मोबाइल, निःशुल्क', icon: '🟢', tag: 'सबसे लोकप्रिय' },
                { name: 'Inoreader', desc: 'वेब + मोबाइल, निःशुल्क', icon: '🔵', tag: 'पॉवर यूज़र्स' },
                { name: 'NewsBlur', desc: 'ओपन सोर्स, वेब + मोबाइल', icon: '🟠', tag: 'ओपन सोर्स' },
                { name: 'Flipboard', desc: 'मैगज़ीन स्टाइल, मोबाइल', icon: '🔴', tag: 'विज़ुअल' },
              ].map(r => (
                <div key={r.name} className="rss-reader-card">
                  <span className="rss-reader-icon">{r.icon}</span>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: '#1a1a1a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {r.name}
                      <span style={{
                        fontSize: '10px', fontWeight: 600, color: primary,
                        background: `${primary}0d`, borderRadius: '4px',
                        padding: '1px 6px'
                      }}>
                        {r.tag}
                      </span>
                    </div>
                    <div style={{ fontSize: '12px', color: '#888', marginTop: '2px' }}>{r.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>

        </div>

        {/* ── BOTTOM BAR ── */}
        <div style={{
          marginTop: '24px', display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px'
        }}>
          <Link href="/" style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            fontSize: '13.5px', color: primary, textDecoration: 'none',
            fontWeight: 600, padding: '8px 16px', borderRadius: '8px',
            background: `${primary}0a`, border: `1px solid ${primary}20`,
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M15 18l-6-6 6-6"/>
            </svg>
            मुख्य पृष्ठ पर वापस जाएं
          </Link>

          <div style={{
            fontSize: '12px', color: '#aaa',
            display: 'flex', alignItems: 'center', gap: '14px'
          }}>
            <Link href="/privacy-policy" style={{ color: '#888', textDecoration: 'none' }}>
              गोपनीयता नीति
            </Link>
            <span style={{ color: '#ddd' }}>·</span>
            <Link href="/terms" style={{ color: '#888', textDecoration: 'none' }}>
              उपयोग की शर्तें
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}