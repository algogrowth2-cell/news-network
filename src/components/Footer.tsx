'use client';
import { useState } from 'react';
import Link from 'next/link';

interface FooterProps {
  siteName?: string;
  primaryColor?: string;
  logoUrl?: string;
  tagline?: string;
  currentSlug?: string;
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

const SOCIAL_LINKS = [
  {
    label: 'Facebook',
    href: '#',
    hoverBg: '#1877F2',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3V2z"/>
      </svg>
    )
  },
  {
    label: 'X (Twitter)',
    href: '#',
    hoverBg: '#000000',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
      </svg>
    )
  },
  {
    label: 'Instagram',
    href: '#',
    hoverBg: '#E4405F',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
        <circle cx="12" cy="12" r="5"/>
        <circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" stroke="none"/>
      </svg>
    )
  },
  {
    label: 'YouTube',
    href: '#',
    hoverBg: '#FF0000',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
      </svg>
    )
  },
  {
    label: 'WhatsApp',
    href: '#',
    hoverBg: '#25D366',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347zm-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884zm8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
      </svg>
    )
  }
];

const ContactIcon = {
  location: (color: string) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
      <circle cx="12" cy="10" r="3"/>
    </svg>
  ),
  email: (color: string) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2"/>
      <path d="M22 4l-10 8L2 4"/>
    </svg>
  ),
  phone: (color: string) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/>
    </svg>
  ),
  clock: (color: string) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <polyline points="12 6 12 12 16 14"/>
    </svg>
  )
};

export default function Footer({
  siteName = 'द लोकल लीडर',
  primaryColor = '#ea580c',
  logoUrl = '/logos/the-local-leader.jpeg',
  tagline = '— जनता की आवाज़, सच्चाई के साथ —',
  currentSlug = 'the-local-leader'
}: FooterProps) {
  const [logoErr, setLogoErr] = useState(false);

  const cleanDomain = siteName.toLowerCase().replace(/[^a-z0-9]/g, '') || 'thelocalleader';

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer style={{ background: '#ffffff', color: '#16150f', marginTop: 'auto', fontFamily: '"Mukta", system-ui, sans-serif', width: '100%', boxSizing: 'border-box', position: 'relative' }}>

      {/* Dynamic hover styles */}
      <style>{`
        .gp-ft-cat-link {
          color: #5a574f; font-size: 14px; text-decoration: none; display: flex;
          align-items: center; gap: 0; transition: all 0.2s ease; padding: 3px 0;
        }
        .gp-ft-cat-link::before {
          content: ''; display: inline-block; width: 0; height: 1.5px;
          background: ${primaryColor}; transition: width 0.25s ease; margin-right: 0;
        }
        .gp-ft-cat-link:hover {
          color: ${primaryColor};
        }
        .gp-ft-cat-link:hover::before {
          width: 12px; margin-right: 8px;
        }

        .gp-ft-social {
          width: 36px; height: 36px; border-radius: 50%;
          border: 1.5px solid #e3e0da; background: #f9f8f6;
          display: grid; place-items: center; color: #6b6860;
          cursor: pointer; transition: all 0.25s ease;
        }
        .gp-ft-social:hover {
          border-color: transparent; color: #ffffff; transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }
        .gp-ft-social-facebook:hover { background: #1877F2; }
        .gp-ft-social-x:hover { background: #000000; }
        .gp-ft-social-instagram:hover { background: #E4405F; }
        .gp-ft-social-youtube:hover { background: #FF0000; }
        .gp-ft-social-whatsapp:hover { background: #25D366; }

        .gp-ft-app-badge {
          border: 1.5px solid #e3e0da; border-radius: 10px; padding: 8px 14px;
          background: #f9f8f6; text-decoration: none; color: #16150f;
          display: flex; align-items: center; gap: 10px;
          transition: all 0.2s ease; cursor: pointer;
        }
        .gp-ft-app-badge:hover {
          border-color: #c4c0b8; background: #f0efec;
          box-shadow: 0 2px 8px rgba(0,0,0,0.06); transform: translateY(-1px);
        }

        .gp-ft-portal-chip {
          display: inline-flex; align-items: center; gap: 8px;
          border: 1.5px solid #e3e0da; border-radius: 22px;
          padding: 6px 14px; font-size: 13px; background: #ffffff;
          color: #5a574f; text-decoration: none; cursor: pointer;
          flex-shrink: 0; transition: all 0.2s ease;
        }
        .gp-ft-portal-chip:hover {
          border-color: ${primaryColor}; background: #fef7f3;
          color: #16150f; transform: translateY(-1px);
          box-shadow: 0 2px 8px rgba(0,0,0,0.06);
        }

        .gp-ft-policy-link {
          color: #8d897f; text-decoration: none; transition: color 0.2s ease;
          position: relative;
        }
        .gp-ft-policy-link:hover { color: #16150f; }

        .gp-ft-scroll-top {
          width: 40px; height: 40px; border-radius: 50%;
          border: 1.5px solid #e3e0da; background: #ffffff;
          display: grid; place-items: center; cursor: pointer;
          color: #5a574f; transition: all 0.25s ease;
          box-shadow: 0 2px 8px rgba(0,0,0,0.04);
        }
        .gp-ft-scroll-top:hover {
          background: ${primaryColor}; border-color: ${primaryColor};
          color: #ffffff; transform: translateY(-2px);
          box-shadow: 0 4px 14px rgba(0,0,0,0.12);
        }

        .gp-ft-cta-btn {
          display: flex; align-items: center; justify-content: center;
          gap: 10px; border: 1.5px solid transparent; border-radius: 10px;
          padding: 11px 16px; font-size: 14px; font-weight: 600;
          text-decoration: none; text-align: center; width: 100%;
          box-sizing: border-box; transition: all 0.25s ease; cursor: pointer;
          background: ${primaryColor}; color: #ffffff;
        }
        .gp-ft-cta-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 16px ${primaryColor}44;
          filter: brightness(1.08);
        }

        .gp-ft-section-title {
          display: block; font-family: "Tiro Devanagari Hindi", Georgia, serif;
          font-size: 17px; font-weight: 600; margin-bottom: 14px;
          color: #16150f; position: relative; padding-bottom: 8px;
        }
        .gp-ft-section-title::after {
          content: ''; position: absolute; bottom: 0; left: 0;
          width: 28px; height: 2.5px; background: ${primaryColor};
          border-radius: 2px;
        }

        .gp-ft-hide-scrollbar::-webkit-scrollbar { display: none; }
        .gp-ft-hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

        .gp-ft-contact-row {
          display: flex; gap: 10px; align-items: flex-start;
          padding: 6px 0; transition: all 0.15s ease;
        }
        .gp-ft-contact-row:hover { padding-left: 4px; }

        .gp-ft-accent-bar {
          height: 3px; width: 100%;
          background: linear-gradient(90deg, ${primaryColor} 0%, ${primaryColor}cc 40%, ${primaryColor}33 100%);
        }
      `}</style>

      {/* TOP ACCENT BAR */}
      <div className="gp-ft-accent-bar" />

      <div style={{ maxWidth: '1560px', margin: '0 auto', padding: '0 20px', boxSizing: 'border-box', width: '100%' }}>

        {/* ── 1. MAIN FOUR COLUMN SECTION ── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '36px',
          paddingTop: '42px',
          paddingBottom: '38px',
          borderBottom: '1px solid #eae8e3'
        }}>

          {/* Column 1 — Brand, Social, App Badges */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              {logoUrl && !logoErr ? (
                <img
                  key={logoUrl}
                  src={logoUrl}
                  alt={siteName}
                  onError={() => setLogoErr(true)}
                  style={{ height: '46px', width: 'auto', objectFit: 'contain', display: 'block' }}
                />
              ) : (
                <span style={{ fontFamily: '"Tiro Devanagari Hindi", Georgia, serif', fontSize: '23px', fontWeight: 600, color: '#16150f' }}>
                  {siteName}
                </span>
              )}
            </div>

            <p style={{ fontSize: '13.5px', color: '#6b6860', lineHeight: 1.7, margin: '0 0 20px 0', maxWidth: '340px' }}>
              {tagline || 'भरूच और आसपास के ज़िलों की निष्पक्ष, सटीक और जनसरोकार की खबरें। 2014 से लगातार।'}
            </p>

            {/* Social Icons */}
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap' }}>
              {SOCIAL_LINKS.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  aria-label={s.label}
                  className={`gp-ft-social gp-ft-social-${s.label.toLowerCase().replace(/[^a-z]/g, '')}`}
                  onClick={(e) => { e.preventDefault(); }}
                >
                  {s.icon}
                </a>
              ))}
            </div>

            {/* App Badges */}
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <a
                href="#"
                onClick={(e) => { e.preventDefault(); alert('Google Play Store लिंक जल्द उपलब्ध होगा!'); }}
                className="gp-ft-app-badge"
              >
                <svg width="20" height="22" viewBox="0 0 24 24" fill="none">
                  <path d="M3.609 1.814L13.792 12 3.61 22.186a1.076 1.076 0 01-.609-.964V2.778c0-.398.224-.744.609-.964z" fill="#4285F4"/>
                  <path d="M17.727 8.273L13.793 12l3.934 3.727 4.43-2.479c.73-.407.73-1.09 0-1.496l-4.43-2.479z" fill="#FBBC04"/>
                  <path d="M3.609 22.186c.28.26.638.33.988.166l13.13-7.352-3.934-3.727L3.609 22.186z" fill="#EA4335"/>
                  <path d="M3.609 1.814L13.793 12l3.934-3.727L4.597 1.648c-.35-.163-.709-.094-.988.166z" fill="#34A853"/>
                </svg>
                <div>
                  <small style={{ display: 'block', fontSize: '9px', color: '#8d897f', lineHeight: 1.1, letterSpacing: '0.2px' }}>यहाँ से पाएँ</small>
                  <b style={{ fontSize: '14px', fontWeight: 700, letterSpacing: '-0.2px' }}>Google Play</b>
                </div>
              </a>

              <a
                href="#"
                onClick={(e) => { e.preventDefault(); alert('Apple App Store लिंक जल्द उपलब्ध होगा!'); }}
                className="gp-ft-app-badge"
              >
                <svg width="18" height="22" viewBox="0 0 17 20" fill="#16150f">
                  <path d="M13.545 10.239c-.022-2.234 1.823-3.31 1.907-3.362-1.037-1.518-2.655-1.726-3.23-1.75-1.374-.14-2.685.81-3.384.81-.697 0-1.778-.79-2.921-.769A4.292 4.292 0 002.3 7.591c-1.546 2.68-.395 6.651 1.11 8.826.737 1.065 1.614 2.261 2.767 2.218 1.11-.045 1.53-.718 2.872-.718 1.342 0 1.718.718 2.893.696 1.194-.02 1.95-1.085 2.682-2.153.846-1.236 1.194-2.432 1.215-2.494-.027-.012-2.33-.894-2.354-3.548l.06-.179zM11.34 4.21c.612-.742 1.025-1.773.912-2.8-.882.036-1.949.587-2.581 1.329-.567.656-1.063 1.703-.93 2.71.985.076 1.99-.5 2.599-1.239z"/>
                </svg>
                <div>
                  <small style={{ display: 'block', fontSize: '9px', color: '#8d897f', lineHeight: 1.1, letterSpacing: '0.2px' }}>डाउनलोड करें</small>
                  <b style={{ fontSize: '14px', fontWeight: 700, letterSpacing: '-0.2px' }}>App Store</b>
                </div>
              </a>
            </div>
          </div>

          {/* Column 2 — खबरें */}
          <div>
            <span className="gp-ft-section-title">खबरें</span>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {['टॉप न्यूज़', 'राजनीति', 'गुजरात', 'देश', 'व्यापार', 'खेल'].map(cat => (
                <li key={cat}>
                  <Link href={`/?site=${currentSlug}&category=${encodeURIComponent(cat)}`} className="gp-ft-cat-link">
                    {cat}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3 — सेवाएं */}
          <div>
            <span className="gp-ft-section-title">सेवाएं</span>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <li>
                <Link href={`/epaper?site=${currentSlug}`} className="gp-ft-cat-link">
                  ई-पेपर
                </Link>
              </li>
              <li>
                <Link href={`/?site=${currentSlug}#shok-sandesh`} className="gp-ft-cat-link">
                  शोक संदेश
                </Link>
              </li>
              <li>
                <Link href={`/?site=${currentSlug}#classifieds`} onClick={(e) => { e.preventDefault(); alert('क्लासिफाइड बुकिंग पेज जल्द खुलेगा!'); }} className="gp-ft-cat-link">
                  क्लासिफाइड
                </Link>
              </li>
              <li>
                <Link href={`/?site=${currentSlug}#rashifal`} className="gp-ft-cat-link">
                  राशिफल
                </Link>
              </li>
              <li>
                <Link href={`/?site=${currentSlug}#mandi-bhav`} onClick={(e) => { e.preventDefault(); alert('मंडी भाव अपडेट जल्द लाइव होंगे!'); }} className="gp-ft-cat-link">
                  मंडी भाव
                </Link>
              </li>
              <li>
                <Link href={`/?site=${currentSlug}#breaking`} onClick={(e) => { e.preventDefault(); alert('ब्रेकिंग न्यूज़ अलर्ट सब्स्क्रिप्शन सक्रिय है!'); }} className="gp-ft-cat-link">
                  ब्रेकिंग अलर्ट
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4 — संपर्क */}
          <div>
            <span className="gp-ft-section-title">संपर्क</span>

            <div style={{ fontSize: '13.5px', color: '#5a574f', lineHeight: 1.65, display: 'flex', flexDirection: 'column', gap: '2px', marginBottom: '18px' }}>
              <div className="gp-ft-contact-row">
                <span style={{ flexShrink: 0, marginTop: '2px' }}>{ContactIcon.location(primaryColor)}</span>
                <span>द लोकल लीडर भवन,<br />स्टेशन रोड, भरूच — 392001</span>
              </div>
              <div className="gp-ft-contact-row">
                <span style={{ flexShrink: 0, marginTop: '2px' }}>{ContactIcon.email(primaryColor)}</span>
                <span style={{ wordBreak: 'break-all' }}>editorial@{cleanDomain}.in</span>
              </div>
              <div className="gp-ft-contact-row">
                <span style={{ flexShrink: 0, marginTop: '2px' }}>{ContactIcon.phone(primaryColor)}</span>
                <span>+91 2642 220 145</span>
              </div>
              <div className="gp-ft-contact-row">
                <span style={{ flexShrink: 0, marginTop: '2px' }}>{ContactIcon.clock(primaryColor)}</span>
                <span>सोम–शनि · सुबह 9 से रात 8</span>
              </div>
            </div>

            <Link href="/patrakar/login" className="gp-ft-cta-btn">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
              <span>हमें खबर भेजें</span>
            </Link>
          </div>
        </div>
      </div>

      {/* ── 2. NETWORK PORTAL STRIP ── */}
      <div style={{ background: '#f9f8f6', borderTop: '1px solid #eae8e3', borderBottom: '1px solid #eae8e3', padding: '14px 0', width: '100%' }}>
        <div style={{ maxWidth: '1560px', margin: '0 auto', padding: '0 20px', display: 'flex', alignItems: 'center', gap: '18px', boxSizing: 'border-box', width: '100%' }}>
          <span style={{ fontSize: '11px', letterSpacing: '1px', textTransform: 'uppercase', color: '#9e9a91', fontWeight: 700, flexShrink: 0, whiteSpace: 'nowrap' }}>
            नेटवर्क
          </span>
          <div className="gp-ft-hide-scrollbar" style={{ display: 'flex', alignItems: 'center', gap: '8px', overflowX: 'auto', whiteSpace: 'nowrap', flex: 1, paddingBottom: '2px', WebkitOverflowScrolling: 'touch' as any }}>
            {NETWORK_PORTALS.filter(p => p.name !== siteName).map(portal => (
              <Link key={portal.slug} href={`/?site=${portal.slug}`} className="gp-ft-portal-chip">
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: portal.color, flexShrink: 0, boxShadow: `0 0 0 2px ${portal.color}33` }} />
                <span>{portal.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* ── 3. BOTTOM POLICY BAR ── */}
      <div style={{ maxWidth: '1560px', margin: '0 auto', padding: '0 20px', boxSizing: 'border-box', width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px', padding: '18px 0 22px', fontSize: '12px', color: '#8d897f' }}>

          <div style={{ fontWeight: 500 }}>
            © 2026 {siteName} न्यूज़ मीडिया · सर्वाधिकार सुरक्षित
          </div>

          <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'center' }}>
            <Link href="/privacy-policy" className="gp-ft-policy-link">गोपनीयता नीति</Link>
            <span style={{ color: '#e3e0da' }}>·</span>
            <Link href="/terms" className="gp-ft-policy-link">उपयोग की शर्तें</Link>
            <span style={{ color: '#e3e0da' }}>·</span>
            <Link href="/editorial-guidelines" className="gp-ft-policy-link">संपादकीय दिशानिर्देश</Link>
            <span style={{ color: '#e3e0da' }}>·</span>
            <Link href="/grievance" className="gp-ft-policy-link">शिकायत निवारण</Link>
            <span style={{ color: '#e3e0da' }}>·</span>
            <Link href="/rss" className="gp-ft-policy-link">RSS</Link>
            <span style={{ color: '#ddd9d1', margin: '0 2px' }}>|</span>
            <Link href="/admin/login" style={{ color: primaryColor, textDecoration: 'none', fontWeight: 700, fontSize: '12px', letterSpacing: '0.3px', transition: 'opacity 0.2s' }}>
              स्टाफ़ मोड
            </Link>
          </div>

          <button onClick={scrollToTop} className="gp-ft-scroll-top" aria-label="ऊपर जाएँ" title="ऊपर जाएँ">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 19V5"/>
              <path d="M5 12l7-7 7 7"/>
            </svg>
          </button>
        </div>
      </div>

    </footer>
  );
}