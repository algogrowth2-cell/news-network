'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

const primary = '#ea580c';

const SECTIONS = [
  { id: 'acceptance', num: '1', title: 'शर्तों की स्वीकृति' },
  { id: 'usage', num: '2', title: 'पोर्टल का उपयोग' },
  { id: 'ip', num: '3', title: 'बौद्धिक संपदा अधिकार' },
  { id: 'accounts', num: '4', title: 'खाता एवं पंजीकरण' },
  { id: 'conduct', num: '5', title: 'उपयोगकर्ता आचरण' },
  { id: 'ads', num: '6', title: 'विज्ञापन एवं तृतीय पक्ष' },
  { id: 'liability', num: '7', title: 'दायित्व सीमा' },
  { id: 'termination', num: '8', title: 'समाप्ति एवं निलंबन' },
  { id: 'jurisdiction', num: '9', title: 'क्षेत्राधिकार' },
  { id: 'changes', num: '10', title: 'शर्तों में परिवर्तन' },
];

export default function TermsPage() {
  const [activeSection, setActiveSection] = useState('acceptance');

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

  return (
    <div style={{ minHeight: '100vh', background: '#f4f3f0', color: '#1a1a1a', fontFamily: '"Mukta", system-ui, -apple-system, sans-serif' }}>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Tiro+Devanagari+Hindi:ital@0;1&family=Mukta:wght@300;400;500;600;700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }

        .tos-toc-item {
          display: flex; align-items: center; gap: 10px;
          padding: 8px 12px; border-radius: 8px; font-size: 13.5px;
          color: #666; cursor: pointer; border: none; background: none;
          width: 100%; text-align: left; transition: all 0.15s ease;
          font-family: "Mukta", system-ui, sans-serif;
        }
        .tos-toc-item:hover { background: #f0efec; color: #1a1a1a; }
        .tos-toc-item.active {
          background: ${primary}0d; color: ${primary}; font-weight: 600;
        }
        .tos-toc-num {
          min-width: 24px; height: 24px; border-radius: 6px; font-size: 11px;
          font-weight: 700; display: grid; place-items: center; flex-shrink: 0;
          background: #f0efec; color: #999; transition: all 0.15s ease;
          padding: 0 4px;
        }
        .tos-toc-item.active .tos-toc-num {
          background: ${primary}; color: #fff;
        }

        .tos-section { scroll-margin-top: 130px; }
        .tos-section-head {
          display: flex; align-items: center; gap: 14px;
          margin-bottom: 14px; padding-bottom: 12px;
          border-bottom: 1px solid #eae8e4;
        }
        .tos-section-num {
          min-width: 36px; height: 36px; border-radius: 10px;
          background: ${primary}0d; color: ${primary};
          font-size: 15px; font-weight: 700;
          display: grid; place-items: center; flex-shrink: 0;
          padding: 0 6px;
        }
        .tos-section-title {
          font-family: "Tiro Devanagari Hindi", Georgia, serif;
          font-size: 20px; font-weight: 600; color: #0f172a;
          line-height: 1.3;
        }
        .tos-body { font-size: 15px; line-height: 1.85; color: #444; }
        .tos-body p { margin: 0 0 10px 0; }
        .tos-body p:last-child { margin-bottom: 0; }
        .tos-body ul {
          list-style: none; padding: 0; margin: 8px 0 0 0;
          display: flex; flex-direction: column; gap: 6px;
        }
        .tos-body li {
          padding-left: 20px; position: relative; line-height: 1.75;
        }
        .tos-body li::before {
          content: ''; position: absolute; left: 0; top: 11px;
          width: 7px; height: 7px; border-radius: 50%;
          background: ${primary}33; border: 1.5px solid ${primary};
        }

        .tos-shell {
          max-width: 1120px; margin: 0 auto; display: grid;
          grid-template-columns: 230px minmax(0, 1fr);
          gap: 32px; padding: 28px 24px 60px;
        }
        .tos-sidebar {
          position: sticky; top: 100px; align-self: start;
          max-height: calc(100vh - 120px); overflow-y: auto;
        }

        @media (max-width: 860px) {
          .tos-shell {
            grid-template-columns: 1fr;
            padding: 16px 14px 40px; gap: 0;
          }
          .tos-sidebar { display: none; }
          .tos-section-title { font-size: 18px; }
          .tos-main-card { padding: 24px 18px !important; }
        }
      `}</style>

      {/* ── HEADER ── */}
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
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
              <polyline points="10 9 9 9 8 9"/>
            </svg>
            <span style={{ fontSize: '13px', fontWeight: 600, color: primary, letterSpacing: '0.3px' }}>
              उपयोग की शर्तें
            </span>
          </div>
        </div>
      </header>

      {/* ── HERO ── */}
      <div style={{
        background: '#ffffff', borderBottom: '1px solid #eae8e4',
        padding: '36px 24px 32px'
      }}>
        <div style={{ maxWidth: '1120px', margin: '0 auto', padding: '0 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
            <div style={{
              width: '44px', height: '44px', borderRadius: '12px',
              background: `linear-gradient(135deg, ${primary}15, ${primary}08)`,
              display: 'grid', placeItems: 'center'
            }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={primary} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V8z"/>
                <polyline points="16 3 16 8 21 8"/>
                <path d="M12 12l-4 4m0-4l4 4"/>
              </svg>
            </div>
            <div>
              <h1 style={{
                fontFamily: '"Tiro Devanagari Hindi", Georgia, serif',
                fontSize: '26px', fontWeight: 600, color: '#0f172a',
                margin: 0, lineHeight: 1.2
              }}>
                उपयोग की शर्तें
              </h1>
              <span style={{ fontSize: '13px', color: '#94a3b8' }}>Terms of Service</span>
            </div>
          </div>
          <p style={{
            fontSize: '14.5px', color: '#64748b', lineHeight: 1.7,
            maxWidth: '620px', margin: 0
          }}>
            इस पोर्टल और इसकी सेवाओं का उपयोग करने से पूर्व कृपया ये शर्तें ध्यानपूर्वक
            पढ़ें। पोर्टल का उपयोग इन शर्तों की स्वीकृति मानी जाएगी।
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
              पढ़ने का समय: ~5 मिनट
            </span>
          </div>
        </div>
      </div>

      {/* ── TWO-COLUMN ── */}
      <div className="tos-shell">

        {/* ── SIDEBAR ── */}
        <aside className="tos-sidebar">
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
                  className={`tos-toc-item ${activeSection === s.id ? 'active' : ''}`}
                >
                  <span className="tos-toc-num">{s.num}</span>
                  <span>{s.title}</span>
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* ── CONTENT ── */}
        <main style={{ minWidth: 0 }}>
          <div className="tos-main-card" style={{
            background: '#ffffff', border: '1px solid #eae8e4',
            borderRadius: '14px', padding: '32px 36px',
            boxShadow: '0 1px 4px rgba(0,0,0,0.03)',
            display: 'flex', flexDirection: 'column', gap: '36px'
          }}>

            {/* 1 */}
            <section id="acceptance" className="tos-section">
              <div className="tos-section-head">
                <span className="tos-section-num">1</span>
                <h2 className="tos-section-title">शर्तों की स्वीकृति</h2>
              </div>
              <div className="tos-body">
                <p>
                  इस न्यूज़ नेटवर्क की वेबसाइट और इसकी सेवाओं का उपयोग करने का अर्थ है
                  कि आप इन शर्तों से पूर्णतः सहमत हैं। यदि आप इन शर्तों से सहमत नहीं
                  हैं, तो कृपया पोर्टल का उपयोग न करें।
                </p>
                <p>
                  ये शर्तें पोर्टल के सभी उपयोगकर्ताओं पर लागू होती हैं — चाहे वे
                  पंजीकृत सदस्य हों, पत्रकार हों, विज्ञापनदाता हों या सामान्य पाठक।
                </p>
              </div>
            </section>

            {/* 2 */}
            <section id="usage" className="tos-section">
              <div className="tos-section-head">
                <span className="tos-section-num">2</span>
                <h2 className="tos-section-title">पोर्टल का उपयोग</h2>
              </div>
              <div className="tos-body">
                <p>आप इस पोर्टल का उपयोग केवल वैध और कानूनी उद्देश्यों के लिए कर सकते हैं। निम्नलिखित गतिविधियां निषिद्ध हैं:</p>
                <ul>
                  <li>पोर्टल की सामग्री को स्वचालित स्क्रैपिंग, बॉट या क्रॉलर द्वारा एकत्रित करना</li>
                  <li>सर्वर पर अनुचित भार डालने वाले किसी भी प्रकार के हमले का प्रयास</li>
                  <li>अन्य उपयोगकर्ताओं का प्रतिरूपण (impersonation) करना</li>
                  <li>किसी भी प्रकार के मैलवेयर, वायरस या हानिकारक कोड का वितरण</li>
                </ul>
              </div>
            </section>

            {/* 3 */}
            <section id="ip" className="tos-section">
              <div className="tos-section-head">
                <span className="tos-section-num">3</span>
                <h2 className="tos-section-title">बौद्धिक संपदा अधिकार</h2>
              </div>
              <div className="tos-body">
                <p>
                  पोर्टल पर प्रकाशित सभी समाचार, लेख, तस्वीरें, वीडियो और ग्राफ़िक्स
                  नेटवर्क की संपदा हैं। बिना लिखित अनुमति के व्यावसायिक रूप से इनका
                  पुनः प्रकाशन अथवा प्रतिलिपिकरण वर्जित है।
                </p>
                <ul>
                  <li>व्यक्तिगत, गैर-व्यावसायिक उपयोग हेतु सामग्री साझा करने की अनुमति है — स्रोत का उल्लेख अनिवार्य</li>
                  <li>समाचार एग्रीगेटर या अन्य मीडिया पोर्टल द्वारा पुनः प्रकाशन हेतु लिखित अनुमति आवश्यक</li>
                  <li>पोर्टल का लोगो, ब्रांड नाम और डिज़ाइन ट्रेडमार्क सुरक्षित हैं</li>
                  <li>RSS फ़ीड के माध्यम से सिंडिकेशन की अनुमति है, बशर्ते मूल लिंक बना रहे</li>
                </ul>
              </div>
            </section>

            {/* 4 */}
            <section id="accounts" className="tos-section">
              <div className="tos-section-head">
                <span className="tos-section-num">4</span>
                <h2 className="tos-section-title">खाता एवं पंजीकरण</h2>
              </div>
              <div className="tos-body">
                <p>
                  कुछ सेवाओं (जैसे टिप्पणी, ई-पेपर, ब्रेकिंग अलर्ट) के लिए पंजीकरण
                  आवश्यक हो सकता है। पंजीकरण करते समय:
                </p>
                <ul>
                  <li>सटीक और वर्तमान जानकारी प्रदान करना आपकी ज़िम्मेदारी है</li>
                  <li>आपके खाते की सुरक्षा (पासवर्ड गोपनीयता) आपकी ज़िम्मेदारी है</li>
                  <li>एक व्यक्ति एक ही खाता रख सकता है; बहु-खाता नीति उल्लंघन माना जाएगा</li>
                  <li>आप किसी भी समय अपना खाता निष्क्रिय या हटा सकते हैं</li>
                </ul>
              </div>
            </section>

            {/* 5 */}
            <section id="conduct" className="tos-section">
              <div className="tos-section-head">
                <span className="tos-section-num">5</span>
                <h2 className="tos-section-title">उपयोगकर्ता आचरण एवं टिप्पणियां</h2>
              </div>
              <div className="tos-body">
                <p>
                  उपयोगकर्ता द्वारा की गई किसी भी टिप्पणी में निम्नलिखित की अनुमति
                  नहीं है। उल्लंघन पर खाता तुरंत निलंबित किया जा सकता है:
                </p>
                <ul>
                  <li>अभद्र, अश्लील या धमकीपूर्ण भाषा का प्रयोग</li>
                  <li>किसी धर्म, जाति, समुदाय या व्यक्ति के विरुद्ध घृणास्पद वक्तव्य</li>
                  <li>भ्रामक सूचना, फर्जी समाचार या अफवाहों का प्रसार</li>
                  <li>विज्ञापन, स्पैम या असंबंधित प्रचार सामग्री</li>
                  <li>अन्य उपयोगकर्ताओं को उत्पीड़ित या परेशान करने वाली गतिविधि</li>
                </ul>
              </div>
            </section>

            {/* 6 */}
            <section id="ads" className="tos-section">
              <div className="tos-section-head">
                <span className="tos-section-num">6</span>
                <h2 className="tos-section-title">विज्ञापन एवं तृतीय पक्ष लिंक</h2>
              </div>
              <div className="tos-body">
                <p>
                  पोर्टल पर विज्ञापन और तृतीय पक्ष लिंक प्रदर्शित हो सकते हैं। इनसे
                  संबंधित कुछ महत्वपूर्ण बातें:
                </p>
                <ul>
                  <li>विज्ञापनों की सामग्री और दावों के लिए संबंधित विज्ञापनदाता उत्तरदायी हैं</li>
                  <li>तृतीय पक्ष वेबसाइटों पर जाने पर उनकी अपनी शर्तें और गोपनीयता नीतियां लागू होंगी</li>
                  <li>हम तृतीय पक्ष सेवाओं की उपलब्धता या सटीकता की गारंटी नहीं देते</li>
                </ul>
              </div>
            </section>

            {/* 7 */}
            <section id="liability" className="tos-section">
              <div className="tos-section-head">
                <span className="tos-section-num">7</span>
                <h2 className="tos-section-title">दायित्व सीमा</h2>
              </div>
              <div className="tos-body">
                <p>
                  हम सटीक और विश्वसनीय समाचार प्रदान करने का हर संभव प्रयास करते हैं,
                  तथापि:
                </p>
                <ul>
                  <li>पोर्टल की सामग्री &ldquo;जैसी है&rdquo; (as-is) आधार पर उपलब्ध कराई जाती है</li>
                  <li>तकनीकी कारणों से सेवा में रुकावट या डेटा हानि के लिए हम उत्तरदायी नहीं हैं</li>
                  <li>समाचार पर आधारित किसी भी व्यक्तिगत या व्यावसायिक निर्णय के लिए पोर्टल उत्तरदायी नहीं होगा</li>
                  <li>ब्रेकिंग न्यूज़ की प्रकृति के कारण प्रारंभिक रिपोर्ट में बाद में अपडेट हो सकता है</li>
                </ul>
              </div>
            </section>

            {/* 8 */}
            <section id="termination" className="tos-section">
              <div className="tos-section-head">
                <span className="tos-section-num">8</span>
                <h2 className="tos-section-title">समाप्ति एवं निलंबन</h2>
              </div>
              <div className="tos-body">
                <p>
                  हम किसी भी उपयोगकर्ता की पहुंच को बिना पूर्व सूचना के निलंबित या
                  समाप्त करने का अधिकार रखते हैं, यदि:
                </p>
                <ul>
                  <li>उपयोगकर्ता इन शर्तों का उल्लंघन करता है</li>
                  <li>कोई गतिविधि पोर्टल या अन्य उपयोगकर्ताओं के लिए हानिकारक पाई जाती है</li>
                  <li>कानूनी या नियामक आवश्यकता के अनुसार ऐसा करना अनिवार्य हो</li>
                </ul>
                <p>
                  निलंबन के बाद भी उपयोगकर्ता शिकायत निवारण तंत्र के माध्यम से
                  अपील कर सकता है।
                </p>
              </div>
            </section>

            {/* 9 */}
            <section id="jurisdiction" className="tos-section">
              <div className="tos-section-head">
                <span className="tos-section-num">9</span>
                <h2 className="tos-section-title">क्षेत्राधिकार एवं शासी विधि</h2>
              </div>
              <div className="tos-body">
                <p>
                  इस पोर्टल से संबंधित किसी भी विवाद का निपटारा भारतीय कानूनों के
                  अनुसार होगा। विवाद की स्थिति में स्थानीय न्यायालय (भरूच, गुजरात)
                  का क्षेत्राधिकार लागू होगा।
                </p>
                <p>
                  दोनों पक्ष पहले सद्भावपूर्ण बातचीत द्वारा विवाद हल करने का प्रयास
                  करेंगे। असफल रहने पर मध्यस्थता और अंततः न्यायालय का सहारा
                  लिया जा सकता है।
                </p>
              </div>
            </section>

            {/* 10 */}
            <section id="changes" className="tos-section">
              <div className="tos-section-head">
                <span className="tos-section-num">10</span>
                <h2 className="tos-section-title">शर्तों में परिवर्तन</h2>
              </div>
              <div className="tos-body">
                <p>
                  हम समय-समय पर इन शर्तों को अपडेट कर सकते हैं। महत्वपूर्ण परिवर्तनों
                  की सूचना पोर्टल पर प्रकाशित की जाएगी। परिवर्तन के बाद भी पोर्टल का
                  उपयोग जारी रखना संशोधित शर्तों की स्वीकृति मानी जाएगी।
                </p>
              </div>

              {/* Contact card */}
              <div style={{
                marginTop: '16px', background: '#fafaf8',
                border: '1px solid #eae8e4', borderRadius: '12px',
                padding: '20px 24px',
                display: 'flex', flexDirection: 'column', gap: '10px'
              }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#1a1a1a', marginBottom: '2px' }}>
                  प्रश्न या स्पष्टीकरण के लिए संपर्क करें:
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="4" width="20" height="16" rx="2"/>
                    <path d="M22 4l-10 8L2 4"/>
                  </svg>
                  <span style={{ fontSize: '14px', color: '#444' }}>legal@thelocalleader.in</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                    <line x1="12" y1="18" x2="12" y2="12"/>
                    <line x1="9" y1="15" x2="15" y2="15"/>
                  </svg>
                  <Link href="/grievance" style={{ fontSize: '14px', color: primary, textDecoration: 'none', fontWeight: 600 }}>
                    शिकायत निवारण पृष्ठ पर जाएं →
                  </Link>
                </div>
              </div>
            </section>

          </div>

          {/* ── BOTTOM ── */}
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
              <Link href="/editorial-guidelines" style={{ color: '#888', textDecoration: 'none' }}>
                संपादकीय दिशानिर्देश
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