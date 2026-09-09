'use client';
import { useState } from 'react';
import Link from 'next/link';

interface FooterProps {
  siteName?: string;
  primaryColor?: string;
  logoUrl?: string;
  tagline?: string;
}

const NETWORK_PORTALS = [
  { name: 'द लोकल लीडर', slug: 'the-local-leader', color: '#f26522' },
  { name: 'बाज़ार कारोबार', slug: 'bazar-karobar', color: '#e8541f' },
  { name: 'गोल्डन पर्ल क्रॉनिकल्स', slug: 'golden-pearl-chronicles', color: '#b08b1e' },
  { name: 'द प्रोव्यू टाइम्स', slug: 'state-express', color: '#8a3b8f' },
  { name: 'देश की आवाज़', slug: 'desh-ki-aawaz', color: '#c0392b' },
  { name: 'जन भारत न्यूज़', slug: 'jan-chetna-news', color: '#1d6fa5' },
  { name: 'NEWS INFO 24', slug: 'city-bulletin', color: '#d12b2b' },
  { name: 'डिफेंस न्यूज़', slug: 'national-spotlight', color: '#4a6741' }
];

export default function Footer({ 
  siteName = 'द लोकल लीडर', 
  primaryColor = '#ea580c',
  logoUrl = '/logos/the-local-leader.jpeg',
  tagline = '— जनता की आवाज़, सच्चाई के साथ —'
}: FooterProps) {
  const [logoErr, setLogoErr] = useState(false);

  const cleanDomain = siteName.toLowerCase().replace(/[^a-z0-9]/g, '') || 'thelocalleader';

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer style={{ background: '#ffffff', color: '#16150f', borderTop: '1px solid #e3e0da', marginTop: 'auto', fontFamily: '"Mukta", system-ui, sans-serif' }}>
      
      <style jsx>{`
        .fwrap {
          max-width: 1560px;
          margin: 0 auto;
          padding: 0 22px;
          box-sizing: border-box;
          width: 100%;
        }

        .footer-top-grid {
          display: grid;
          grid-template-columns: 1.6fr 1fr 1fr 1.3fr;
          gap: 42px;
          padding-top: 38px;
          padding-bottom: 34px;
        }

        .fcol-title {
          display: block;
          font-family: "Tiro Devanagari Hindi", Georgia, serif;
          font-size: 18px;
          font-weight: 600;
          margin-bottom: 14px;
          padding-bottom: 6px;
          border-bottom: 2px solid ${primaryColor};
          width: fit-content;
          color: #16150f;
        }

        .fcol-list {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .fcol-btn {
          background: none;
          border: none;
          color: #5a574f;
          font-size: 14.5px;
          padding: 3px 0;
          text-align: left;
          cursor: pointer;
          font-family: inherit;
          text-decoration: none;
          display: block;
          transition: color 0.15s;
        }

        .fcol-btn:hover {
          color: ${primaryColor};
        }

        .social-circle-btn {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          border: 1px solid #e3e0da;
          background: #f6f5f2;
          display: grid;
          place-items: center;
          font-size: 14px;
          color: #5a574f;
          text-decoration: none;
          cursor: pointer;
          transition: all 0.2s;
        }

        .social-circle-btn:hover {
          border-color: ${primaryColor};
          color: ${primaryColor};
          background: #ffffff;
        }

        .fnetband {
          background: #f6f5f2;
          border-top: 1px solid #e3e0da;
          border-bottom: 1px solid #e3e0da;
          padding: 14px 0;
        }

        .fnetin {
          display: flex;
          align-items: center;
          gap: 16px;
          flex-wrap: wrap;
        }

        .fnetlist {
          display: flex;
          flex-wrap: wrap;
          gap: 9px;
          flex: 1;
        }

        .fnet-pill {
          display: flex;
          align-items: center;
          gap: 8px;
          border: 1px solid #e3e0da;
          border-radius: 20px;
          padding: 6px 14px;
          font-size: 13.5px;
          background: #ffffff;
          color: #5a574f;
          text-decoration: none;
          cursor: pointer;
          transition: border-color 0.15s;
        }

        .fnet-pill:hover {
          border-color: ${primaryColor};
          color: #16150f;
        }

        .fbottom-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 16px;
          padding: 18px 0 22px;
          font-size: 12.5px;
          color: #8d897f;
        }

        .scroll-top-btn {
          width: 42px;
          height: 42px;
          border-radius: 50%;
          border: 1px solid #e3e0da;
          background: #ffffff;
          display: grid;
          place-items: center;
          cursor: pointer;
          color: #5a574f;
          box-shadow: 0 2px 8px rgba(0,0,0,0.06);
          transition: all 0.2s;
        }

        .scroll-top-btn:hover {
          border-color: ${primaryColor};
          color: ${primaryColor};
        }

        @media (max-width: 1100px) {
          .footer-top-grid {
            grid-template-columns: 1.4fr 1fr 1fr;
            gap: 32px;
          }
        }

        @media (max-width: 800px) {
          .footer-top-grid {
            grid-template-columns: 1fr 1fr;
            gap: 28px;
          }
        }

        @media (max-width: 600px) {
          .fwrap {
            padding: 0 16px;
          }
          .footer-top-grid {
            grid-template-columns: 1fr;
            gap: 26px;
            padding-top: 28px;
          }
          .fbottom-bar {
            flex-direction: column;
            align-items: flex-start;
            gap: 12px;
          }
        }
      `}</style>

      {/* 1. MAIN FOUR COLUMN SECTION */}
      <div className="fwrap">
        <div className="footer-top-grid">
          
          {/* Column 1: Brand, Tagline, Social & App Stores */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              {!logoErr ? (
                <img 
                  src={logoUrl} 
                  alt={siteName} 
                  onError={() => setLogoErr(true)}
                  style={{ height: '48px', width: 'auto', objectFit: 'contain', display: 'block' }}
                />
              ) : (
                <span style={{ fontFamily: '"Tiro Devanagari Hindi", Georgia, serif', fontSize: '22px', fontWeight: 600, color: '#16150f' }}>
                  {siteName}
                </span>
              )}
            </div>

            <p style={{ fontSize: '13.5px', color: '#5a574f', lineHeight: 1.6, margin: '0 0 16px 0', maxWidth: '340px' }}>
              {tagline || `${siteName} — निष्पक्ष, सटीक और जनसरोकार की खबरें निरंतर आप तक पहुंचाने के लिए प्रतिबद्ध।`}
            </p>

            {/* Circular Social Icons */}
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '18px' }}>
              {['f', '𝕏', '◎', '▶'].map((icon, i) => (
                <span key={i} className="social-circle-btn">
                  {icon}
                </span>
              ))}
              <span className="social-circle-btn" style={{ color: '#25913f' }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2a10 10 0 00-8.6 15L2 22l5.2-1.4A10 10 0 1012 2zm0 18a8 8 0 01-4.1-1.1l-.3-.2-3 .8.8-2.9-.2-.3A8 8 0 1112 20zm4.4-5.8c-.2-.1-1.4-.7-1.6-.8s-.4-.1-.5.1l-.7.9c-.1.2-.3.2-.5.1a6.5 6.5 0 01-3.2-2.8c-.1-.2 0-.4.1-.5l.4-.5.2-.4v-.4l-.7-1.7c-.2-.4-.4-.4-.5-.4h-.5a1 1 0 00-.7.3 3 3 0 00-.9 2.2 5.2 5.2 0 001.1 2.7 11.9 11.9 0 004.5 4 5 5 0 002.3.5 2.7 2.7 0 001.8-1.2 2.2 2.2 0 00.2-1.2c-.1-.1-.2-.2-.4-.3z"/>
                </svg>
              </span>
            </div>

            {/* App Store Cards */}
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <a 
                href="#" 
                onClick={(e) => { e.preventDefault(); alert('Google Play Store लिंक जल्द आ रहा है!'); }}
                style={{
                  border: '1px solid #e3e0da',
                  borderRadius: '8px',
                  padding: '7px 14px',
                  background: '#f6f5f2',
                  textDecoration: 'none',
                  color: '#16150f',
                  display: 'block'
                }}
              >
                <small style={{ display: 'block', fontSize: '9.5px', color: '#8d897f', lineHeight: 1.1 }}>यहाँ से पाएँ</small>
                <b style={{ fontSize: '13.5px', fontWeight: 600 }}>Google Play</b>
              </a>

              <a 
                href="#" 
                onClick={(e) => { e.preventDefault(); alert('Apple App Store लिंक जल्द आ रहा है!'); }}
                style={{
                  border: '1px solid #e3e0da',
                  borderRadius: '8px',
                  padding: '7px 14px',
                  background: '#f6f5f2',
                  textDecoration: 'none',
                  color: '#16150f',
                  display: 'block'
                }}
              >
                <small style={{ display: 'block', fontSize: '9.5px', color: '#8d897f', lineHeight: 1.1 }}>डाउनलोड करें</small>
                <b style={{ fontSize: '13.5px', fontWeight: 600 }}>App Store</b>
              </a>
            </div>
          </div>

          {/* Column 2: खबरें */}
          <div>
            <span className="fcol-title">खबरें</span>
            <ul className="fcol-list">
              {['टॉप न्यूज़', 'राजनीति', 'गुजरात', 'देश', 'व्यापार', 'खेल'].map(cat => (
                <li key={cat}>
                  <Link href={`/?category=${encodeURIComponent(cat)}`} className="fcol-btn">
                    {cat}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: सेवाएं */}
          <div>
            <span className="fcol-title">सेवाएं</span>
            <ul className="fcol-list">
              <li><Link href="/epaper" className="fcol-btn">ई-पेपर</Link></li>
              <li><Link href="/shok-sandesh" className="fcol-btn">शोक संदेश</Link></li>
              <li><Link href="/classifieds" className="fcol-btn">क्लासिफाइड</Link></li>
              <li><Link href="/rashifal" className="fcol-btn">राशिफल</Link></li>
              <li><Link href="/mandi-bhav" className="fcol-btn">मंडी भाव</Link></li>
              <li><Link href="/breaking-alerts" className="fcol-btn">ब्रेकिंग अलर्ट</Link></li>
            </ul>
          </div>

          {/* Column 4: संपर्क */}
          <div>
            <span className="fcol-title">संपर्क</span>
            <div style={{ fontSize: '13.5px', color: '#5a574f', lineHeight: 1.65, display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px' }}>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                <span style={{ color: primaryColor }}>📍</span>
                <span>{siteName} भवन,<br />स्टेशन रोड, भरूच — 392001</span>
              </div>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <span style={{ color: primaryColor }}>✉️</span>
                <span style={{ wordBreak: 'break-all' }}>editorial@{cleanDomain}.in</span>
              </div>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <span style={{ color: primaryColor }}>📞</span>
                <span>+91 2642 220 145</span>
              </div>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <span style={{ color: primaryColor }}>🕐</span>
                <span>सोम–शनि · सुबह 9 से रात 8</span>
              </div>
            </div>

            {/* Tip Button */}
            <Link 
              href="/patrakar/login"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                background: '#fdeee6',
                border: '1px solid #f3ddcb',
                color: primaryColor,
                borderRadius: '8px',
                padding: '10px 16px',
                fontSize: '14px',
                fontWeight: 600,
                textDecoration: 'none',
                textAlign: 'center',
                width: '100%',
                boxSizing: 'border-box'
              }}
            >
              <span>📩</span> <span>हमें खबर भेजें</span>
            </Link>
          </div>

        </div>
      </div>

      {/* 2. NETWORK PORTALS STRIP */}
      <div className="fnetband">
        <div className="fwrap fnetin">
          <span style={{ fontSize: '12.5px', letterSpacing: '0.8px', color: '#8d897f', fontWeight: 600, flexShrink: 0 }}>
            नेटवर्क के अन्य पोर्टल
          </span>
          <div className="fnetlist">
            {NETWORK_PORTALS.filter(p => p.name !== siteName).map(portal => (
              <Link 
                key={portal.slug} 
                href={`/?site=${portal.slug}`} 
                className="fnet-pill"
              >
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: portal.color, flexShrink: 0 }} />
                <span>{portal.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* 3. BOTTOM POLICY BAR & SCROLL-TOP BUTTON */}
      <div className="fwrap">
        <div className="fbottom-bar">
          <div>
            © 2026 {siteName} न्यूज़ मीडिया · सर्वाधिकार सुरक्षित
          </div>

          <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'center' }}>
            <Link href="/privacy-policy" style={{ color: '#8d897f', textDecoration: 'none' }}>गोपनीयता नीति</Link>
            <Link href="/terms" style={{ color: '#8d897f', textDecoration: 'none' }}>उपयोग की शर्तें</Link>
            <Link href="/editorial-guidelines" style={{ color: '#8d897f', textDecoration: 'none' }}>संपादकीय दिशानिर्देश</Link>
            <Link href="/grievance" style={{ color: '#8d897f', textDecoration: 'none' }}>शिकायत निवारण</Link>
            <Link href="/rss" style={{ color: '#8d897f', textDecoration: 'none' }}>RSS</Link>
            <span style={{ color: '#e3e0da' }}>|</span>
            <Link href="/admin/login" style={{ color: primaryColor, textDecoration: 'none', fontWeight: 600 }}>स्टाफ़ मोड</Link>
          </div>

          {/* Scroll to Top floating arrow button */}
          <button onClick={scrollToTop} className="scroll-top-btn" aria-label="ऊपर जाएँ" title="ऊपर जाएँ">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 19V5M5 12l7-7 7 7"/>
            </svg>
          </button>
        </div>
      </div>

    </footer>
  );
}