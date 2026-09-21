'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

const primary = '#ea580c';

const SECTIONS = [
  { id: 'accuracy', num: '1', title: 'सटीकता एवं तथ्य-जांच' },
  { id: 'impartiality', num: '2', title: 'निष्पक्षता और संतुलन' },
  { id: 'sources', num: '3', title: 'स्रोत सुरक्षा एवं पारदर्शिता' },
  { id: 'corrections', num: '4', title: 'सुधार नीति' },
  { id: 'separation', num: '5', title: 'विज्ञापन और समाचार का पृथक्करण' },
  { id: 'sensitivity', num: '6', title: 'संवेदनशील विषय एवं भाषा' },
  { id: 'digital', num: '7', title: 'डिजिटल एवं सोशल मीडिया' },
  { id: 'accountability', num: '8', title: 'उत्तरदायित्व' },
];

export default function EditorialGuidelinesPage() {
  const [activeSection, setActiveSection] = useState('accuracy');

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

        .eg-toc-item {
          display: flex; align-items: center; gap: 10px;
          padding: 8px 12px; border-radius: 8px; font-size: 13.5px;
          color: #666; cursor: pointer; border: none; background: none;
          width: 100%; text-align: left; transition: all 0.15s ease;
          font-family: "Mukta", system-ui, sans-serif;
        }
        .eg-toc-item:hover { background: #f0efec; color: #1a1a1a; }
        .eg-toc-item.active {
          background: ${primary}0d; color: ${primary}; font-weight: 600;
        }
        .eg-toc-num {
          width: 24px; height: 24px; border-radius: 6px; font-size: 11px;
          font-weight: 700; display: grid; place-items: center; flex-shrink: 0;
          background: #f0efec; color: #999; transition: all 0.15s ease;
        }
        .eg-toc-item.active .eg-toc-num {
          background: ${primary}; color: #fff;
        }

        .eg-section { scroll-margin-top: 130px; }
        .eg-section-head {
          display: flex; align-items: center; gap: 14px;
          margin-bottom: 14px; padding-bottom: 12px;
          border-bottom: 1px solid #eae8e4;
        }
        .eg-section-num {
          width: 36px; height: 36px; border-radius: 10px;
          background: ${primary}0d; color: ${primary};
          font-size: 15px; font-weight: 700;
          display: grid; place-items: center; flex-shrink: 0;
        }
        .eg-section-title {
          font-family: "Tiro Devanagari Hindi", Georgia, serif;
          font-size: 20px; font-weight: 600; color: #0f172a;
          line-height: 1.3;
        }
        .eg-body { font-size: 15px; line-height: 1.85; color: #444; }
        .eg-body p { margin: 0 0 10px 0; }
        .eg-body p:last-child { margin-bottom: 0; }
        .eg-body ul {
          list-style: none; padding: 0; margin: 8px 0 0 0;
          display: flex; flex-direction: column; gap: 6px;
        }
        .eg-body li {
          padding-left: 20px; position: relative; line-height: 1.75;
        }
        .eg-body li::before {
          content: ''; position: absolute; left: 0; top: 11px;
          width: 7px; height: 7px; border-radius: 50%;
          background: ${primary}33; border: 1.5px solid ${primary};
        }

        .eg-principle-card {
          display: flex; align-items: flex-start; gap: 14px;
          padding: 14px 18px; background: #fafaf8;
          border: 1px solid #eae8e4; border-radius: 10px;
          transition: box-shadow 0.15s ease;
        }
        .eg-principle-card:hover { box-shadow: 0 2px 10px rgba(0,0,0,0.04); }
        .eg-principle-icon {
          width: 34px; height: 34px; border-radius: 9px;
          background: ${primary}0d; display: grid; place-items: center;
          flex-shrink: 0; font-size: 16px;
        }

        .eg-shell {
          max-width: 1120px; margin: 0 auto; display: grid;
          grid-template-columns: 230px minmax(0, 1fr);
          gap: 32px; padding: 28px 24px 60px;
        }
        .eg-sidebar {
          position: sticky; top: 100px; align-self: start;
          max-height: calc(100vh - 120px); overflow-y: auto;
        }

        @media (max-width: 860px) {
          .eg-shell {
            grid-template-columns: 1fr;
            padding: 16px 14px 40px; gap: 0;
          }
          .eg-sidebar { display: none; }
          .eg-section-title { font-size: 18px; }
          .eg-main-card { padding: 24px 18px !important; }
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
              <path d="M12 20h9"/>
              <path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/>
            </svg>
            <span style={{ fontSize: '13px', fontWeight: 600, color: primary, letterSpacing: '0.3px' }}>
              संपादकीय दिशानिर्देश
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
            <div style={{
              width: '44px', height: '44px', borderRadius: '12px',
              background: `linear-gradient(135deg, ${primary}15, ${primary}08)`,
              display: 'grid', placeItems: 'center'
            }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={primary} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/>
                <path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/>
              </svg>
            </div>
            <div>
              <h1 style={{
                fontFamily: '"Tiro Devanagari Hindi", Georgia, serif',
                fontSize: '26px', fontWeight: 600, color: '#0f172a',
                margin: 0, lineHeight: 1.2
              }}>
                संपादकीय दिशानिर्देश
              </h1>
              <span style={{ fontSize: '13px', color: '#94a3b8' }}>Editorial Guidelines</span>
            </div>
          </div>
          <p style={{
            fontSize: '14.5px', color: '#64748b', lineHeight: 1.7,
            maxWidth: '620px', margin: 0
          }}>
            स्वतंत्र, निष्पक्ष और जिम्मेदार पत्रकारिता के मानक। ये दिशानिर्देश हमारी
            संपादकीय टीम, पत्रकारों और योगदानकर्ताओं पर समान रूप से लागू होते हैं।
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

      {/* ── CORE PRINCIPLES STRIP ── */}
      <div style={{
        background: '#ffffff', borderBottom: '1px solid #eae8e4',
        padding: '20px 24px'
      }}>
        <div style={{
          maxWidth: '1120px', margin: '0 auto', padding: '0 24px',
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '10px'
        }}>
          {[
            { icon: '🎯', label: 'सटीकता', sub: 'तथ्य-आधारित रिपोर्टिंग' },
            { icon: '⚖️', label: 'निष्पक्षता', sub: 'संतुलित दृष्टिकोण' },
            { icon: '🛡️', label: 'जवाबदेही', sub: 'पारदर्शी सुधार नीति' },
            { icon: '🤝', label: 'सम्मान', sub: 'संवेदनशील भाषा' },
          ].map(p => (
            <div key={p.label} className="eg-principle-card">
              <span className="eg-principle-icon">{p.icon}</span>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: '#1a1a1a', lineHeight: 1.2 }}>{p.label}</div>
                <div style={{ fontSize: '12px', color: '#888', marginTop: '2px' }}>{p.sub}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── TWO-COLUMN: SIDEBAR + CONTENT ── */}
      <div className="eg-shell">

        {/* ── SIDEBAR TOC ── */}
        <aside className="eg-sidebar">
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
                  className={`eg-toc-item ${activeSection === s.id ? 'active' : ''}`}
                >
                  <span className="eg-toc-num">{s.num}</span>
                  <span>{s.title}</span>
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* ── MAIN CONTENT ── */}
        <main style={{ minWidth: 0 }}>
          <div className="eg-main-card" style={{
            background: '#ffffff', border: '1px solid #eae8e4',
            borderRadius: '14px', padding: '32px 36px',
            boxShadow: '0 1px 4px rgba(0,0,0,0.03)',
            display: 'flex', flexDirection: 'column', gap: '36px'
          }}>

            {/* 1 */}
            <section id="accuracy" className="eg-section">
              <div className="eg-section-head">
                <span className="eg-section-num">1</span>
                <h2 className="eg-section-title">सटीकता एवं तथ्य-जांच</h2>
              </div>
              <div className="eg-body">
                <p>
                  प्रत्येक समाचार को प्रकाशित करने से पूर्व विश्वसनीय स्रोतों, आधिकारिक
                  बयानों और साक्ष्यों के आधार पर प्रमाणित किया जाता है। अपुष्ट अफवाहों
                  अथवा वायरल संदेशों को बिना जांच के प्रकाशित नहीं किया जाता।
                </p>
                <ul>
                  <li>प्रत्येक तथ्य को कम से कम दो स्वतंत्र स्रोतों से सत्यापित किया जाता है</li>
                  <li>आधिकारिक आंकड़े केवल सरकारी या मान्यता प्राप्त संस्थाओं से लिए जाते हैं</li>
                  <li>वायरल दावों की जांच के लिए रिवर्स इमेज सर्च और मेटाडेटा विश्लेषण का उपयोग किया जाता है</li>
                  <li>संदिग्ध सूचना को "अपुष्ट" या "दावा" के रूप में स्पष्ट चिह्नित किया जाता है</li>
                </ul>
              </div>
            </section>

            {/* 2 */}
            <section id="impartiality" className="eg-section">
              <div className="eg-section-head">
                <span className="eg-section-num">2</span>
                <h2 className="eg-section-title">निष्पक्षता और संतुलन</h2>
              </div>
              <div className="eg-body">
                <p>
                  हम सभी पक्षों को अपनी बात रखने का समान अवसर प्रदान करने हेतु प्रतिबद्ध
                  हैं। समाचार रिपोर्टिंग में व्यक्तिगत या राजनीतिक पूर्वाग्रह से मुक्त
                  दृष्टिकोण बनाए रखा जाता है।
                </p>
                <ul>
                  <li>विवादित विषयों पर सभी संबंधित पक्षों का दृष्टिकोण प्रस्तुत किया जाता है</li>
                  <li>समाचार और संपादकीय टिप्पणी को स्पष्ट रूप से अलग रखा जाता है</li>
                  <li>शीर्षक सनसनीखेज़ नहीं, बल्कि तथ्यपरक और सटीक रखे जाते हैं</li>
                  <li>चुनावी रिपोर्टिंग में सभी प्रमुख उम्मीदवारों को समान कवरेज दिया जाता है</li>
                </ul>
              </div>
            </section>

            {/* 3 */}
            <section id="sources" className="eg-section">
              <div className="eg-section-head">
                <span className="eg-section-num">3</span>
                <h2 className="eg-section-title">स्रोत सुरक्षा एवं पारदर्शिता</h2>
              </div>
              <div className="eg-body">
                <p>
                  समाचार स्रोतों की गोपनीयता का सम्मान करना हमारी प्राथमिकता है।
                  गुमनाम स्रोतों का उपयोग केवल तभी किया जाता है जब सार्वजनिक हित
                  में आवश्यक हो और स्रोत की सुरक्षा दांव पर हो।
                </p>
                <ul>
                  <li>गुमनाम स्रोतों का उपयोग केवल वरिष्ठ संपादक की स्वीकृति से होता है</li>
                  <li>जब भी संभव हो, स्रोत का नाम और पदनाम प्रकाशित किया जाता है</li>
                  <li>व्हिसलब्लोअर की पहचान सुरक्षित रखी जाती है</li>
                </ul>
              </div>
            </section>

            {/* 4 */}
            <section id="corrections" className="eg-section">
              <div className="eg-section-head">
                <span className="eg-section-num">4</span>
                <h2 className="eg-section-title">सुधार नीति</h2>
              </div>
              <div className="eg-body">
                <p>
                  यदि किसी रिपोर्ट में तथ्यात्मक त्रुटि पाई जाती है, तो उसे त्वरित रूप
                  से संशोधित किया जाता है और पाठकों की स्पष्टता हेतु सुधार नोट प्रकाशित
                  किया जाता है।
                </p>
                <ul>
                  <li>छोटी त्रुटियां (वर्तनी, तिथि) तुरंत सुधारी जाती हैं और लेख में "अपडेटेड" चिह्न लगाया जाता है</li>
                  <li>महत्वपूर्ण तथ्यात्मक त्रुटि पर लेख के शीर्ष पर "सुधार नोट" प्रकाशित किया जाता है</li>
                  <li>गंभीर मामलों में लेख वापस लिया जा सकता है, जिसकी सूचना पाठकों को दी जाती है</li>
                  <li>पाठक editorial@thelocalleader.in पर त्रुटि की सूचना दे सकते हैं</li>
                </ul>
              </div>
            </section>

            {/* 5 */}
            <section id="separation" className="eg-section">
              <div className="eg-section-head">
                <span className="eg-section-num">5</span>
                <h2 className="eg-section-title">विज्ञापन और समाचार का पृथक्करण</h2>
              </div>
              <div className="eg-body">
                <p>
                  प्रायोजित लेखों अथवा विज्ञापनों को स्पष्ट रूप से &ldquo;विज्ञापन&rdquo;
                  अथवा &ldquo;प्रायोजित&rdquo; लेबल द्वारा चिह्नित किया जाता है ताकि पाठक
                  समाचार और विज्ञापन में अंतर स्पष्ट समझ सकें।
                </p>
                <ul>
                  <li>विज्ञापनदाता का संपादकीय सामग्री पर कोई प्रभाव नहीं होता</li>
                  <li>प्रायोजित सामग्री पर स्पष्ट &ldquo;प्रायोजित&rdquo; या &ldquo;विज्ञापन&rdquo; टैग अनिवार्य है</li>
                  <li>संपादकीय निर्णय व्यावसायिक दबावों से स्वतंत्र रहते हैं</li>
                </ul>
              </div>
            </section>

            {/* 6 */}
            <section id="sensitivity" className="eg-section">
              <div className="eg-section-head">
                <span className="eg-section-num">6</span>
                <h2 className="eg-section-title">संवेदनशील विषय एवं भाषा</h2>
              </div>
              <div className="eg-body">
                <p>
                  संवेदनशील विषयों — जैसे जातीय हिंसा, आत्महत्या, यौन अपराध, सांप्रदायिक
                  तनाव — की रिपोर्टिंग में विशेष सावधानी बरती जाती है।
                </p>
                <ul>
                  <li>यौन अपराध पीड़ितों की पहचान कानूनी प्रावधानों के अनुसार गोपनीय रखी जाती है</li>
                  <li>नाबालिगों से संबंधित मामलों में नाम, फोटो या पहचान योग्य विवरण प्रकाशित नहीं किया जाता</li>
                  <li>आत्महत्या की रिपोर्टिंग WHO मीडिया दिशानिर्देशों के अनुरूप की जाती है</li>
                  <li>हिंसक या आपत्तिजनक छवियां बिना उचित संपादकीय कारण के प्रकाशित नहीं की जातीं</li>
                  <li>जाति, धर्म, लिंग या क्षेत्र के आधार पर भेदभावपूर्ण भाषा वर्जित है</li>
                </ul>
              </div>
            </section>

            {/* 7 */}
            <section id="digital" className="eg-section">
              <div className="eg-section-head">
                <span className="eg-section-num">7</span>
                <h2 className="eg-section-title">डिजिटल एवं सोशल मीडिया</h2>
              </div>
              <div className="eg-body">
                <p>
                  सोशल मीडिया प्लेटफ़ॉर्म पर साझा की गई सामग्री को समाचार स्रोत के रूप
                  में उपयोग करते समय अतिरिक्त सतर्कता बरती जाती है।
                </p>
                <ul>
                  <li>सोशल मीडिया पोस्ट को स्वतंत्र रूप से सत्यापित किए बिना समाचार नहीं बनाया जाता</li>
                  <li>स्क्रीनशॉट को प्रामाणिक स्रोत नहीं माना जाता; मूल लिंक की जांच अनिवार्य है</li>
                  <li>हमारे आधिकारिक सोशल मीडिया खातों पर भी यही संपादकीय मानक लागू होते हैं</li>
                </ul>
              </div>
            </section>

            {/* 8 */}
            <section id="accountability" className="eg-section">
              <div className="eg-section-head">
                <span className="eg-section-num">8</span>
                <h2 className="eg-section-title">उत्तरदायित्व</h2>
              </div>
              <div className="eg-body">
                <p>
                  हमारी संपादकीय टीम इन दिशानिर्देशों के पालन के लिए पूर्णतः उत्तरदायी है।
                  किसी भी उल्लंघन की सूचना पाठक हमारे शिकायत निवारण तंत्र के माध्यम से
                  दे सकते हैं।
                </p>
              </div>

              {/* Contact card */}
              <div style={{
                marginTop: '16px', background: '#fafaf8',
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