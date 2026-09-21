'use client';
import Link from 'next/link';

const primary = '#ea580c';

export default function GrievancePage() {
  return (
    <div style={{ minHeight: '100vh', background: '#f4f3f0', color: '#1a1a1a', fontFamily: '"Mukta", system-ui, -apple-system, sans-serif' }}>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Tiro+Devanagari+Hindi:ital@0;1&family=Mukta:wght@300;400;500;600;700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .gv-section { margin-bottom: 32px; }
        .gv-section:last-child { margin-bottom: 0; }

        .gv-section-head {
          display: flex; align-items: center; gap: 14px;
          margin-bottom: 14px; padding-bottom: 12px;
          border-bottom: 1px solid #eae8e4;
        }
        .gv-section-num {
          width: 36px; height: 36px; border-radius: 10px;
          background: ${primary}0d; color: ${primary};
          font-size: 15px; font-weight: 700;
          display: grid; place-items: center; flex-shrink: 0;
        }
        .gv-section-title {
          font-family: "Tiro Devanagari Hindi", Georgia, serif;
          font-size: 20px; font-weight: 600; color: #0f172a;
          line-height: 1.3;
        }
        .gv-body { font-size: 15px; line-height: 1.85; color: #444; }
        .gv-body p { margin: 0 0 10px 0; }
        .gv-body p:last-child { margin-bottom: 0; }
        .gv-body ul {
          list-style: none; padding: 0; margin: 8px 0 0 0;
          display: flex; flex-direction: column; gap: 6px;
        }
        .gv-body li {
          padding-left: 20px; position: relative; line-height: 1.75;
        }
        .gv-body li::before {
          content: ''; position: absolute; left: 0; top: 11px;
          width: 7px; height: 7px; border-radius: 50%;
          background: ${primary}33; border: 1.5px solid ${primary};
        }

        .gv-info-card {
          background: #fafaf8; border: 1px solid #eae8e4;
          border-radius: 12px; padding: 22px 26px;
          display: flex; flex-direction: column; gap: 12px;
        }
        .gv-info-row {
          display: flex; align-items: flex-start; gap: 12px;
          font-size: 14.5px; color: #333; line-height: 1.6;
        }
        .gv-info-icon {
          width: 32px; height: 32px; border-radius: 8px;
          background: ${primary}0d; display: grid; place-items: center;
          flex-shrink: 0; margin-top: 1px;
        }
        .gv-info-label {
          font-size: 11px; font-weight: 700; color: #999;
          letter-spacing: 0.3px; margin-bottom: 1px;
        }

        .gv-step-card {
          display: flex; align-items: flex-start; gap: 16px;
          padding: 16px 20px; background: #fafaf8;
          border: 1px solid #eae8e4; border-radius: 12px;
          transition: box-shadow 0.15s ease;
        }
        .gv-step-card:hover {
          box-shadow: 0 2px 12px rgba(0,0,0,0.04);
        }
        .gv-step-num {
          width: 32px; height: 32px; border-radius: 50%;
          background: ${primary}; color: #fff;
          font-size: 14px; font-weight: 700;
          display: grid; place-items: center; flex-shrink: 0;
        }

        @media (max-width: 640px) {
          .gv-main-card { padding: 24px 18px !important; }
          .gv-section-title { font-size: 18px; }
          .gv-info-card { padding: 16px 18px; }
          .gv-step-card { padding: 14px 16px; }
        }
      `}</style>

      {/* ── HEADER BAR ── */}
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
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            <span style={{ fontSize: '13px', fontWeight: 600, color: primary, letterSpacing: '0.3px' }}>
              शिकायत निवारण
            </span>
          </div>
        </div>
      </header>

      {/* ── HERO BANNER ── */}
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
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={primary} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="12" y1="18" x2="12" y2="12"/>
                <line x1="9" y1="15" x2="15" y2="15"/>
              </svg>
            </div>
            <div>
              <h1 style={{
                fontFamily: '"Tiro Devanagari Hindi", Georgia, serif',
                fontSize: '26px', fontWeight: 600, color: '#0f172a',
                margin: 0, lineHeight: 1.2
              }}>
                शिकायत निवारण
              </h1>
              <span style={{ fontSize: '13px', color: '#94a3b8' }}>Grievance Redressal</span>
            </div>
          </div>
          <p style={{
            fontSize: '14.5px', color: '#64748b', lineHeight: 1.7,
            maxWidth: '620px', margin: 0
          }}>
            डिजिटल मीडिया आचार संहिता एवं सूचना प्रौद्योगिकी (मध्यवर्ती संदर्शिका) नियम, 2021
            के अनुपालन में शिकायत निवारण तंत्र।
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
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
              प्रतिक्रिया: 24 घंटे · निस्तारण: 15 दिन
            </span>
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
              IT नियम 2021 अनुपालित
            </span>
          </div>
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <div style={{ maxWidth: '860px', margin: '0 auto', padding: '28px 24px 60px' }}>
        <div className="gv-main-card" style={{
          background: '#ffffff', border: '1px solid #eae8e4',
          borderRadius: '14px', padding: '32px 36px',
          boxShadow: '0 1px 4px rgba(0,0,0,0.03)'
        }}>

          {/* Section 1: Officer Details */}
          <div className="gv-section">
            <div className="gv-section-head">
              <span className="gv-section-num">1</span>
              <h2 className="gv-section-title">शिकायत निवारण अधिकारी</h2>
            </div>
            <div className="gv-body">
              <p>
                सूचना प्रौद्योगिकी (मध्यवर्ती संदर्शिका और डिजिटल मीडिया आचार संहिता) नियम,
                2021 के अनुपालन में, हमारे पोर्टल पर प्रकाशित किसी भी सामग्री से संबंधित
                शिकायत हेतु शिकायत अधिकारी का विवरण:
              </p>
            </div>

            <div className="gv-info-card" style={{ marginTop: '16px' }}>
              <div className="gv-info-row">
                <div className="gv-info-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={primary} strokeWidth="2" strokeLinecap="round">
                    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                </div>
                <div>
                  <div className="gv-info-label">अधिकारी</div>
                  <div style={{ fontWeight: 600, color: '#1a1a1a' }}>संपादक / नोडल अधिकारी</div>
                </div>
              </div>

              <div className="gv-info-row">
                <div className="gv-info-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={primary} strokeWidth="2" strokeLinecap="round">
                    <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/>
                    <polyline points="9 22 9 12 15 12 15 22"/>
                  </svg>
                </div>
                <div>
                  <div className="gv-info-label">संस्थान</div>
                  <div style={{ fontWeight: 600, color: '#1a1a1a' }}>द लोकल लीडर डिजिटल न्यूज़ नेटवर्क</div>
                </div>
              </div>

              <div className="gv-info-row">
                <div className="gv-info-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={primary} strokeWidth="2" strokeLinecap="round">
                    <rect x="2" y="4" width="20" height="16" rx="2"/>
                    <path d="M22 4l-10 8L2 4"/>
                  </svg>
                </div>
                <div>
                  <div className="gv-info-label">ईमेल</div>
                  <a href="mailto:grievance@thelocalleader.in" style={{ color: primary, textDecoration: 'none', fontWeight: 600 }}>
                    grievance@thelocalleader.in
                  </a>
                </div>
              </div>

              <div className="gv-info-row">
                <div className="gv-info-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={primary} strokeWidth="2" strokeLinecap="round">
                    <circle cx="12" cy="12" r="10"/>
                    <polyline points="12 6 12 12 16 14"/>
                  </svg>
                </div>
                <div>
                  <div className="gv-info-label">प्रतिक्रिया समय</div>
                  <div style={{ color: '#1a1a1a' }}>
                    शिकायत प्राप्त होने के <strong>24 घंटे</strong> के भीतर पावती एवं
                    <strong> 15 दिनों</strong> के भीतर निस्तारण
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: How to File */}
          <div className="gv-section">
            <div className="gv-section-head">
              <span className="gv-section-num">2</span>
              <h2 className="gv-section-title">शिकायत दर्ज करने का प्रारूप</h2>
            </div>
            <div className="gv-body">
              <p>
                शिकायत दर्ज करते समय कृपया निम्नलिखित जानकारी अवश्य शामिल करें ताकि
                हम आपकी शिकायत का शीघ्र एवं उचित निस्तारण कर सकें:
              </p>
              <ul>
                <li>संबंधित समाचार लेख का शीर्षक एवं यूआरएल (Web Link)</li>
                <li>आपत्ति का विशिष्ट विवरण एवं आधार</li>
                <li>शिकायतकर्ता का पूरा नाम, वैध पहचान पत्र एवं संपर्क विवरण</li>
                <li>यदि लागू हो, तो प्रमाणित दस्तावेज़ या साक्ष्य</li>
              </ul>
            </div>
          </div>

          {/* Section 3: Process Steps */}
          <div className="gv-section">
            <div className="gv-section-head">
              <span className="gv-section-num">3</span>
              <h2 className="gv-section-title">निवारण प्रक्रिया</h2>
            </div>
            <div className="gv-body" style={{ marginBottom: '16px' }}>
              <p>
                आपकी शिकायत प्राप्त होने के बाद निम्नलिखित प्रक्रिया अपनाई जाती है:
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[
                { num: '1', title: 'शिकायत प्राप्ति', desc: 'ईमेल के माध्यम से शिकायत प्राप्त होने पर एक विशिष्ट संदर्भ संख्या आवंटित की जाती है।' },
                { num: '2', title: 'पावती (24 घंटे)', desc: 'शिकायत की प्राप्ति की पावती 24 घंटे के भीतर शिकायतकर्ता को ईमेल द्वारा भेजी जाती है।' },
                { num: '3', title: 'समीक्षा एवं जांच', desc: 'संपादकीय दल द्वारा शिकायत की विषयवस्तु, संबंधित लेख और प्रमाणों की समीक्षा की जाती है।' },
                { num: '4', title: 'निर्णय एवं कार्रवाई', desc: 'यदि शिकायत उचित पाई जाती है तो सुधार, संपादन, स्पष्टीकरण या हटाने की कार्रवाई की जाती है।' },
                { num: '5', title: 'अंतिम निस्तारण (15 दिन)', desc: 'शिकायतकर्ता को अंतिम निर्णय की सूचना 15 दिनों के भीतर दी जाती है।' },
              ].map(step => (
                <div key={step.num} className="gv-step-card">
                  <span className="gv-step-num">{step.num}</span>
                  <div>
                    <div style={{
                      fontFamily: '"Tiro Devanagari Hindi", Georgia, serif',
                      fontSize: '15px', fontWeight: 600, color: '#1a1a1a',
                      marginBottom: '3px'
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
          </div>

          {/* Section 4: Scope */}
          <div className="gv-section">
            <div className="gv-section-head">
              <span className="gv-section-num">4</span>
              <h2 className="gv-section-title">शिकायत का दायरा</h2>
            </div>
            <div className="gv-body">
              <p>
                निम्नलिखित प्रकार की शिकायतें इस तंत्र के अंतर्गत स्वीकार की जाती हैं:
              </p>
              <ul>
                <li>तथ्यात्मक अशुद्धि या भ्रामक जानकारी से संबंधित शिकायत</li>
                <li>किसी व्यक्ति, समुदाय या संस्था की मानहानि संबंधी शिकायत</li>
                <li>अश्लील, आपत्तिजनक या हिंसा भड़काने वाली सामग्री की शिकायत</li>
                <li>कॉपीराइट या बौद्धिक संपदा अधिकार उल्लंघन संबंधी शिकायत</li>
                <li>निजता के उल्लंघन से संबंधित शिकायत</li>
              </ul>
            </div>
          </div>

          {/* Section 5: Escalation */}
          <div className="gv-section">
            <div className="gv-section-head">
              <span className="gv-section-num">5</span>
              <h2 className="gv-section-title">उच्च स्तरीय समाधान</h2>
            </div>
            <div className="gv-body">
              <p>
                यदि शिकायतकर्ता शिकायत निवारण अधिकारी के निर्णय से संतुष्ट नहीं है,
                तो वह सूचना प्रौद्योगिकी अधिनियम, 2000 और संबंधित नियमों के तहत
                उपलब्ध वैधानिक उपायों का सहारा ले सकता है।
              </p>
              <p>
                इसके अतिरिक्त, प्रेस काउंसिल ऑफ इंडिया एवं इलेक्ट्रॉनिक्स और सूचना
                प्रौद्योगिकी मंत्रालय (MeitY) के पास भी शिकायत दर्ज कराई जा सकती है।
              </p>
            </div>
          </div>

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