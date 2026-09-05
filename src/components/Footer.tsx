'use client';
import { useState } from 'react';
import Link from 'next/link';

interface FooterProps {
  siteName?: string;
  primaryColor?: string;
  logoUrl?: string;
  tagline?: string;
}

export default function Footer({ 
  siteName = 'द लोकल लीडर', 
  primaryColor = '#ea580c',
  logoUrl = '/logos/the-local-leader.jpeg',
  tagline = '— जनता की आवाज़, सच्चाई के साथ —'
}: FooterProps) {
  const [logoErr, setLogoErr] = useState(false);

  return (
    <footer style={{ background: '#0b0f19', color: '#cbd5e1', borderTop: `4px solid ${primaryColor}`, marginTop: 'auto' }}>
      
      <style jsx>{`
        .footer-grid-container {
          display: grid;
          grid-template-columns: minmax(280px, 1.4fr) minmax(170px, 1fr) minmax(190px, 1.1fr) minmax(210px, 1.2fr);
          gap: 32px;
          margin-bottom: 40px;
        }
        .footer-bottom-bar {
          border-top: 1px solid #1e293b;
          padding-top: 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 12px;
          font-size: 12px;
          color: #64748b;
        }

        @media (max-width: 900px) {
          .footer-grid-container {
            grid-template-columns: repeat(2, 1fr);
            gap: 24px;
          }
        }

        @media (max-width: 600px) {
          .footer-grid-container {
            grid-template-columns: 1fr;
            gap: 28px;
          }
          .footer-bottom-bar {
            flex-direction: column;
            align-items: flex-start;
          }
        }
      `}</style>

      <div style={{ maxWidth: '1240px', margin: '0 auto', padding: '40px 16px 24px 16px' }}>
        
        <div className="footer-grid-container">
          
          {/* Column 1: Site Logo, Tagline & About */}
          <div>
            <div style={{ marginBottom: '12px' }}>
              {!logoErr ? (
                <div style={{ background: '#ffffff', padding: '6px 12px', borderRadius: '8px', display: 'inline-block', boxShadow: '0 2px 6px rgba(0,0,0,0.2)' }}>
                  <img 
                    key={logoUrl}
                    src={logoUrl} 
                    alt={siteName} 
                    onError={() => setLogoErr(true)}
                    style={{ height: '48px', width: 'auto', objectFit: 'contain', display: 'block' }} 
                  />
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ background: primaryColor, color: '#fff', padding: '4px 10px', borderRadius: '6px', fontSize: '18px', fontWeight: 900 }}>
                    {siteName.charAt(0)}
                  </span>
                  <span style={{ fontSize: '20px', fontWeight: 900, color: '#fff' }}>{siteName}</span>
                </div>
              )}
            </div>
            
            <div style={{ fontSize: '12px', fontWeight: 700, color: primaryColor, marginBottom: '10px' }}>
              {tagline}
            </div>

            <p style={{ fontSize: '13px', color: '#94a3b8', lineHeight: '1.6', margin: '0 0 16px 0', maxWidth: '320px' }}>
              {siteName} डिजिटल न्यूज़ नेटवर्क का प्रमुख पोर्टल है। हम निष्पक्ष, सटीक और जनसरोकार की खबरें आप तक पहुंचाने के लिए प्रतिबद्ध हैं।
            </p>
            
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', maxWidth: '320px' }}>
              {['Facebook', 'Twitter', 'YouTube', 'Instagram', 'Telegram'].map((s) => (
                <span 
                  key={s} 
                  style={{ 
                    fontSize: '11px', 
                    background: '#1e293b', 
                    padding: '5px 10px', 
                    borderRadius: '4px', 
                    cursor: 'pointer', 
                    color: '#e2e8f0',
                    border: '1px solid #334155'
                  }}
                >
                  {s}
                </span>
              ))}
            </div>
          </div>

          {/* Column 2: Categories */}
          <div>
            <h4 style={{ fontSize: '14.5px', fontWeight: 700, color: '#fff', borderBottom: `2px solid ${primaryColor}`, display: 'inline-block', paddingBottom: '4px', marginBottom: '14px' }}>
              प्रमुख श्रेणियां
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '10px', color: '#94a3b8' }}>
              {['राष्ट्रीय समाचार', 'व्यापार और शेयर बाजार', 'राजनीति और चुनाव', 'खेल और क्रिकेट स्कोर', 'तकनीक और ऑटोमोबाइल'].map(cat => (
                <li key={cat}>
                  <Link href={`/?category=${encodeURIComponent(cat)}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                    › {cat}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Digital Modules */}
          <div>
            <h4 style={{ fontSize: '14.5px', fontWeight: 700, color: '#fff', borderBottom: `2px solid ${primaryColor}`, display: 'inline-block', paddingBottom: '4px', marginBottom: '14px' }}>
              डिजिटल सेवाएं
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '10px', color: '#94a3b8' }}>
              <li><Link href="/epaper" style={{ color: 'inherit', textDecoration: 'none' }}>› आज का ई-पेपर (डिजिटल संस्करण)</Link></li>
              <li><Link href="/rashifal" style={{ color: 'inherit', textDecoration: 'none' }}>› दैनिक राशिफल एवं पंचांग</Link></li>
              <li><Link href="/obituaries" style={{ color: 'inherit', textDecoration: 'none' }}>› शोक संदेश एवं श्रद्धांजलि</Link></li>
              <li><Link href="/classifieds" style={{ color: 'inherit', textDecoration: 'none' }}>› क्लासिफाइड विज्ञापन बुकिंग</Link></li>
              <li><Link href="/live-blogs" style={{ color: 'inherit', textDecoration: 'none' }}>› लाइव ब्लॉग अपडेट्स</Link></li>
            </ul>
          </div>

          {/* Column 4: Contact & Staff */}
          <div>
            <h4 style={{ fontSize: '14.5px', fontWeight: 700, color: '#fff', borderBottom: `2px solid ${primaryColor}`, display: 'inline-block', paddingBottom: '4px', marginBottom: '14px' }}>
              नेटवर्क एवं संपर्क
            </h4>
            <div style={{ fontSize: '13px', color: '#94a3b8', lineHeight: '1.7', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <p style={{ margin: 0 }}>📍 केंद्रीय कार्यालय: नई दिल्ली, भारत</p>
              <p style={{ margin: 0 }}>📧 editorial@{siteName.toLowerCase().replace(/[^a-z0-9]/g, '') + '.in'}</p>
              <p style={{ margin: 0 }}>📞 +91 11 2345 6789</p>
              <div style={{ marginTop: '8px' }}>
                <Link href="/admin/login" style={{ color: primaryColor, textDecoration: 'none', fontWeight: 700, fontSize: '12px' }}>
                  Staff Login (NewsAdmin Network) →
                </Link>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Strip */}
        <div className="footer-bottom-bar">
          <div>
            © 2026 {siteName} News Media Group. All Rights Reserved.
          </div>
          <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
            <span style={{ cursor: 'pointer' }}>Privacy Policy</span>
            <span style={{ cursor: 'pointer' }}>Terms of Service</span>
            <span style={{ cursor: 'pointer' }}>Editorial Guidelines</span>
          </div>
        </div>

      </div>
    </footer>
  );
}