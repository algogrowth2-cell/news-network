'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

const SECTIONS = [
  { id: 'collection', num: '1', title: 'सूचना का संग्रह' },
  { id: 'usage', num: '2', title: 'सूचना का उपयोग' },
  { id: 'cookies', num: '3', title: 'कुकीज़ एवं ट्रैकिंग' },
  { id: 'security', num: '4', title: 'डेटा सुरक्षा' },
  { id: 'thirdparty', num: '5', title: 'तृतीय पक्ष सेवाएं' },
  { id: 'rights', num: '6', title: 'आपके अधिकार' },
  { id: 'children', num: '7', title: 'बच्चों की गोपनीयता' },
  { id: 'changes', num: '8', title: 'नीति में परिवर्तन' },
  { id: 'contact', num: '9', title: 'संपर्क करें' },
];

export default function PrivacyPolicyPage() {
  const [activeSection, setActiveSection] = useState('collection');

  useEffect(() => {
    const handleScroll = () => {
      for (let i = SECTIONS.length - 1; i >= 0; i--) {
        const el = document.getElementById(SECTIONS[i].id);
        if (el && el.getBoundingClientRect().top <= 140) {
          setActiveSection(SECTIONS[i].id);
          break;
        }
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      const y = el.getBoundingClientRect().top + window.scrollY - 120;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  const primary = '#ea580c';

  return (
    <div style={{ minHeight: '100vh', background: '#f4f3f0', color: '#1a1a1a', fontFamily: '"Mukta", system-ui, -apple-system, sans-serif' }}>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Tiro+Devanagari+Hindi:ital@0;1&family=Mukta:wght@300;400;500;600;700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }

        .pp-toc-item {
          display: flex; align-items: center; gap: 10px;
          padding: 8px 12px; border-radius: 8px; font-size: 13.5px;
          color: #666; cursor: pointer; border: none; background: none;
          width: 100%; text-align: left; transition: all 0.15s ease;
          font-family: "Mukta", system-ui, sans-serif;
        }
        .pp-toc-item:hover { background: #f0efec; color: #1a1a1a; }
        .pp-toc-item.active {
          background: ${primary}0d; color: ${primary}; font-weight: 600;
        }
        .pp-toc-num {
          width: 24px; height: 24px; border-radius: 6px; font-size: 11px;
          font-weight: 700; display: grid; place-items: center; flex-shrink: 0;
          background: #f0efec; color: #999; transition: all 0.15s ease;
        }
        .pp-toc-item.active .pp-toc-num {
          background: ${primary}; color: #fff;
        }

        .pp-section { scroll-margin-top: 130px; }

        .pp-section-head {
          display: flex; align-items: center; gap: 14px;
          margin-bottom: 14px; padding-bottom: 12px;
          border-bottom: 1px solid #eae8e4;
        }
        .pp-section-num {
          width: 36px; height: 36px; border-radius: 10px;
          background: ${primary}0d; color: ${primary};
          font-size: 15px; font-weight: 700;
          display: grid; place-items: center; flex-shrink: 0;
        }
        .pp-section-title {
          font-family: "Tiro Devanagari Hindi", Georgia, serif;
          font-size: 20px; font-weight: 600; color: #0f172a;
          line-height: 1.3;
        }
        .pp-body { font-size: 15px; line-height: 1.85; color: #444; }
        .pp-body p { margin: 0 0 10px 0; }
        .pp-body p:last-child { margin-bottom: 0; }
        .pp-body ul {
          list-style: none; padding: 0; margin: 8px 0 0 0;
          display: flex; flex-direction: column; gap: 6px;
        }
        .pp-body li {
          padding-left: 20px; position: relative; line-height: 1.75;
        }
        .pp-body li::before {
          content: ''; position: absolute; left: 0; top: 11px;
          width: 7px; height: 7px; border-radius: 50%;
          background: ${primary}33; border: 1.5px solid ${primary};
        }

        .pp-shell {
          max-width: 1120px; margin: 0 auto; display: grid;
          grid-template-columns: 230px minmax(0, 1fr);
          gap: 32px; padding: 28px 24px 60px;
        }
        .pp-sidebar {
          position: sticky; top: 100px; align-self: start;
          max-height: calc(100vh - 120px); overflow-y: auto;
        }

        @media (max-width: 860px) {
          .pp-shell {
            grid-template-columns: 1fr;
            padding: 16px 14px 40px;
            gap: 0;
          }
          .pp-sidebar { display: none; }
          .pp-section-title { font-size: 18px; }
        }
      `}</style>

      {/* ── HEADER BAR ── */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: '#ffffff', borderBottom: '1px solid #e8e6e2',
        boxShadow: '0 1px 4px rgba(0,0,0,0.04)'
      }}>
        <div style={{
          maxWidth: '1120px', margin: '0 auto',
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
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0110 0v4"/>
            </svg>
            <span style={{
              fontSize: '13px', fontWeight: 600, color: primary,
              letterSpacing: '0.3px'
            }}>
              गोपनीयता नीति
            </span>
          </div>
        </div>
      </header>

      {/* ── HERO BANNER ── */}
      <div style={{
        background: '#ffffff', borderBottom: '1px solid #eae8e4',
        padding: '36px 24px 32px'
      }}>
        <div style={{ maxWidth: '1120px', margin: '0 auto', padding: '0 24px' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '12px',
            marginBottom: '10px'
          }}>
            <div style={{
              width: '44px', height: '44px', borderRadius: '12px',
              background: `linear-gradient(135deg, ${primary}15, ${primary}08)`,
              display: 'grid', placeItems: 'center'
            }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={primary} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                <path d="M9 12l2 2 4-4"/>
              </svg>
            </div>
            <div>
              <h1 style={{
                fontFamily: '"Tiro Devanagari Hindi", Georgia, serif',
                fontSize: '26px', fontWeight: 600, color: '#0f172a',
                margin: 0, lineHeight: 1.2
              }}>
                गोपनीयता नीति
              </h1>
              <span style={{ fontSize: '13px', color: '#94a3b8' }}>Privacy Policy</span>
            </div>
          </div>
          <p style={{
            fontSize: '14.5px', color: '#64748b', lineHeight: 1.7,
            maxWidth: '620px', margin: 0
          }}>
            आपकी गोपनीयता हमारे लिए अत्यंत महत्वपूर्ण है। यह नीति बताती है कि हम आपकी
            जानकारी कैसे एकत्रित, उपयोग और सुरक्षित करते हैं।
          </p>
          <div style={{
            marginTop: '14px', display: 'flex', alignItems: 'center', gap: '16px',
            fontSize: '12px', color: '#94a3b8'
          }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: '5px',
              background: '#f8f7f5', border: '1px solid #eae8e4',
              borderRadius: '6px', padding: '4px 10px'
            }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              अंतिम अद्यतन: सितंबर 2026
            </span>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: '5px',
              background: '#f8f7f5', border: '1px solid #eae8e4',
              borderRadius: '6px', padding: '4px 10px'
            }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
              पढ़ने का समय: ~4 मिनट
            </span>
          </div>
        </div>
      </div>

      {/* ── TWO-COLUMN: SIDEBAR TOC + CONTENT ── */}
      <div className="pp-shell">

        {/* ── SIDEBAR TABLE OF CONTENTS ── */}
        <aside className="pp-sidebar">
          <div style={{
            background: '#ffffff', border: '1px solid #eae8e4',
            borderRadius: '14px', padding: '16px 12px',
            boxShadow: '0 1px 4px rgba(0,0,0,0.03)'
          }}>
            <div style={{
              fontSize: '11px', fontWeight: 700, color: '#aaa',
              letterSpacing: '0.5px', padding: '0 12px 10px',
              borderBottom: '1px solid #f0efec', marginBottom: '8px'
            }}>
              विषय सूची
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {SECTIONS.map(s => (
                <button
                  key={s.id}
                  onClick={() => scrollTo(s.id)}
                  className={`pp-toc-item ${activeSection === s.id ? 'active' : ''}`}
                >
                  <span className="pp-toc-num">{s.num}</span>
                  <span>{s.title}</span>
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* ── MAIN CONTENT ── */}
        <main style={{ minWidth: 0 }}>
          <div style={{
            background: '#ffffff', border: '1px solid #eae8e4',
            borderRadius: '14px', padding: '32px 36px',
            boxShadow: '0 1px 4px rgba(0,0,0,0.03)',
            display: 'flex', flexDirection: 'column', gap: '36px'
          }}>

            {/* Section 1 */}
            <section id="collection" className="pp-section">
              <div className="pp-section-head">
                <span className="pp-section-num">1</span>
                <h2 className="pp-section-title">सूचना का संग्रह</h2>
              </div>
              <div className="pp-body">
                <p>
                  हम आपके द्वारा प्रदान की गई जानकारी केवल समाचार सेवाओं, सदस्यता प्रबंधन
                  और उपयोगकर्ता सत्यापन के उद्देश्य से एकत्रित करते हैं। इसमें शामिल हो सकते हैं:
                </p>
                <ul>
                  <li>आपका नाम, मोबाइल नंबर और ईमेल पता</li>
                  <li>डिवाइस की जानकारी जैसे ब्राउज़र का प्रकार, ऑपरेटिंग सिस्टम</li>
                  <li>IP पता एवं अनुमानित भौगोलिक स्थान</li>
                  <li>पोर्टल पर आपकी गतिविधि, जैसे पढ़ी गई खबरें और समय</li>
                </ul>
              </div>
            </section>

            {/* Section 2 */}
            <section id="usage" className="pp-section">
              <div className="pp-section-head">
                <span className="pp-section-num">2</span>
                <h2 className="pp-section-title">सूचना का उपयोग</h2>
              </div>
              <div className="pp-body">
                <p>
                  एकत्रित की गई जानकारी का उपयोग व्यक्तिगत समाचार अनुभव, महत्वपूर्ण अलर्ट्स,
                  ई-पेपर एक्सेस और विज्ञापन प्राथमिकताओं को बेहतर बनाने के लिए किया जाता है।
                </p>
                <p>
                  हम आपकी व्यक्तिगत जानकारी किसी भी तीसरे पक्ष को व्यावसायिक लाभ हेतु
                  विक्रय नहीं करते हैं। जानकारी का उपयोग निम्नलिखित उद्देश्यों से किया जाता है:
                </p>
                <ul>
                  <li>आपकी रुचि के अनुसार समाचार और सामग्री प्रदर्शित करना</li>
                  <li>ब्रेकिंग न्यूज़ अलर्ट और सूचनाएं भेजना</li>
                  <li>ई-पेपर, राशिफल और मंडी भाव जैसी सेवाएं प्रदान करना</li>
                  <li>पोर्टल के प्रदर्शन और उपयोगकर्ता अनुभव में सुधार करना</li>
                </ul>
              </div>
            </section>

            {/* Section 3 */}
            <section id="cookies" className="pp-section">
              <div className="pp-section-head">
                <span className="pp-section-num">3</span>
                <h2 className="pp-section-title">कुकीज़ एवं ट्रैकिंग तकनीक</h2>
              </div>
              <div className="pp-body">
                <p>
                  हम उपयोगकर्ता की प्राथमिकताओं को याद रखने और पोर्टल के एनालिटिक्स को
                  ट्रैक करने के लिए कुकीज़ का उपयोग करते हैं। आप अपने ब्राउज़र सेटिंग्स के
                  माध्यम से कुकीज़ को अक्षम कर सकते हैं, हालांकि इससे कुछ सुविधाएं
                  प्रभावित हो सकती हैं।
                </p>
                <ul>
                  <li>आवश्यक कुकीज़ — लॉगिन सत्र और सुरक्षा के लिए अनिवार्य</li>
                  <li>एनालिटिक्स कुकीज़ — ट्रैफ़िक पैटर्न और उपयोग विश्लेषण हेतु</li>
                  <li>विज्ञापन कुकीज़ — प्रासंगिक विज्ञापन प्रदर्शित करने के लिए</li>
                </ul>
              </div>
            </section>

            {/* Section 4 */}
            <section id="security" className="pp-section">
              <div className="pp-section-head">
                <span className="pp-section-num">4</span>
                <h2 className="pp-section-title">डेटा सुरक्षा</h2>
              </div>
              <div className="pp-body">
                <p>
                  आपकी जानकारी की सुरक्षा के लिए हमारे पास मानक एन्क्रिप्शन और प्रमाणीकरण
                  सुरक्षा प्रोटोकॉल उपलब्ध हैं। हम SSL/TLS एन्क्रिप्शन, सुरक्षित
                  Firebase प्रमाणीकरण और नियमित सुरक्षा ऑडिट के माध्यम से आपके डेटा
                  की रक्षा करते हैं।
                </p>
                <p>
                  हालांकि कोई भी ऑनलाइन प्रणाली पूर्णतः सुरक्षित होने की गारंटी नहीं दे
                  सकती, हम उद्योग मानकों के अनुरूप सर्वोत्तम प्रयास करते हैं।
                </p>
              </div>
            </section>

            {/* Section 5 */}
            <section id="thirdparty" className="pp-section">
              <div className="pp-section-head">
                <span className="pp-section-num">5</span>
                <h2 className="pp-section-title">तृतीय पक्ष सेवाएं</h2>
              </div>
              <div className="pp-body">
                <p>
                  हमारा पोर्टल कुछ तृतीय पक्ष सेवाओं का उपयोग करता है जिनकी अपनी
                  गोपनीयता नीतियां हैं:
                </p>
                <ul>
                  <li>Google Firebase — डेटा स्टोरेज और उपयोगकर्ता प्रमाणीकरण</li>
                  <li>Google Analytics — वेबसाइट ट्रैफ़िक विश्लेषण</li>
                  <li>विज्ञापन नेटवर्क — प्रासंगिक विज्ञापन वितरण</li>
                </ul>
                <p>
                  इन सेवाओं के साथ साझा किया गया डेटा उनकी संबंधित शर्तों द्वारा
                  शासित होता है।
                </p>
              </div>
            </section>

            {/* Section 6 */}
            <section id="rights" className="pp-section">
              <div className="pp-section-head">
                <span className="pp-section-num">6</span>
                <h2 className="pp-section-title">आपके अधिकार</h2>
              </div>
              <div className="pp-body">
                <p>आपके पास निम्नलिखित अधिकार हैं:</p>
                <ul>
                  <li>अपने व्यक्तिगत डेटा तक पहुंच का अनुरोध करना</li>
                  <li>गलत या अपूर्ण जानकारी में सुधार कराना</li>
                  <li>अपना खाता और संबंधित डेटा हटवाना</li>
                  <li>विपणन संचार से ऑप्ट-आउट करना</li>
                  <li>डेटा प्रोसेसिंग पर आपत्ति दर्ज कराना</li>
                </ul>
              </div>
            </section>

            {/* Section 7 */}
            <section id="children" className="pp-section">
              <div className="pp-section-head">
                <span className="pp-section-num">7</span>
                <h2 className="pp-section-title">बच्चों की गोपनीयता</h2>
              </div>
              <div className="pp-body">
                <p>
                  हमारी सेवाएं 13 वर्ष से कम उम्र के बच्चों के लिए अभिप्रेत नहीं हैं।
                  हम जानबूझकर 13 वर्ष से कम उम्र के बच्चों से व्यक्तिगत जानकारी एकत्रित
                  नहीं करते। यदि किसी अभिभावक को ऐसा लगता है कि उनके बच्चे ने हमें
                  जानकारी प्रदान की है, तो कृपया हमसे संपर्क करें।
                </p>
              </div>
            </section>

            {/* Section 8 */}
            <section id="changes" className="pp-section">
              <div className="pp-section-head">
                <span className="pp-section-num">8</span>
                <h2 className="pp-section-title">नीति में परिवर्तन</h2>
              </div>
              <div className="pp-body">
                <p>
                  हम समय-समय पर इस गोपनीयता नीति को अद्यतन कर सकते हैं। किसी भी
                  महत्वपूर्ण परिवर्तन की सूचना पोर्टल पर प्रकाशित की जाएगी। अद्यतन
                  नीति प्रकाशन की तिथि से प्रभावी होगी।
                </p>
              </div>
            </section>

            {/* Section 9 */}
            <section id="contact" className="pp-section">
              <div className="pp-section-head">
                <span className="pp-section-num">9</span>
                <h2 className="pp-section-title">संपर्क करें</h2>
              </div>
              <div className="pp-body">
                <p>
                  इस गोपनीयता नीति से संबंधित कोई प्रश्न या चिंता होने पर कृपया हमसे
                  संपर्क करें:
                </p>
              </div>

              {/* Contact card */}
              <div style={{
                marginTop: '14px', background: '#fafaf8',
                border: '1px solid #eae8e4', borderRadius: '12px',
                padding: '20px 24px',
                display: 'flex', flexDirection: 'column', gap: '10px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="4" width="20" height="16" rx="2"/>
                    <path d="M22 4l-10 8L2 4"/>
                  </svg>
                  <span style={{ fontSize: '14px', color: '#444' }}>editorial@thelocalleader.in</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/>
                  </svg>
                  <span style={{ fontSize: '14px', color: '#444' }}>+91 2642 220 145</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
                    <circle cx="12" cy="10" r="3"/>
                  </svg>
                  <span style={{ fontSize: '14px', color: '#444' }}>
                    द लोकल लीडर भवन, स्टेशन रोड, भरूच — 392001
                  </span>
                </div>
              </div>
            </section>

          </div>

          {/* ── BOTTOM BACK LINK ── */}
          <div style={{
            marginTop: '24px', display: 'flex', alignItems: 'center',
            justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px'
          }}>
            <Link href="/" style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              fontSize: '13.5px', color: primary, textDecoration: 'none',
              fontWeight: 600, padding: '8px 16px', borderRadius: '8px',
              background: `${primary}0a`, border: `1px solid ${primary}20`,
              transition: 'background 0.15s ease'
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
              <Link href="/terms" style={{ color: '#888', textDecoration: 'none' }}>
                उपयोग की शर्तें
              </Link>
              <span style={{ color: '#ddd' }}>·</span>
              <Link href="/grievance" style={{ color: '#888', textDecoration: 'none' }}>
                शिकायत निवारण
              </Link>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}