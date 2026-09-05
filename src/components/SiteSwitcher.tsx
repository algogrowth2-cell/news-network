'use client';
import { useState, useRef, useEffect } from 'react';

export interface SiteMeta {
  slug: string;
  name: string;
  tagline: string;
  logoUrl: string;
  primaryColor: string;
}

const ALL_NETWORK_SITES: SiteMeta[] = [
  {
    slug: 'the-local-leader',
    name: 'द लोकल लीडर',
    tagline: '— जनता की आवाज़, सच्चाई के साथ —',
    logoUrl: '/logos/the-local-leader.jpeg',
    primaryColor: '#ea580c'
  },
  {
    slug: 'bazar-karobar',
    name: 'बाजार कारोबार',
    tagline: 'व्यापार की हर बात, आपके साथ',
    logoUrl: '/logos/bazar-karobar.jpeg',
    primaryColor: '#e85023'
  },
  {
    slug: 'golden-pearl-chronicles',
    name: 'गोल्डन पर्ल क्रॉनिकल्स',
    tagline: 'आज की खबर, कल का इतिहास',
    logoUrl: '/logos/golden-pearl-chronicles.jpeg',
    primaryColor: '#b58128'
  },
  {
    slug: 'the-provue-times',
    name: 'द प्रोव्यू टाइम्स',
    tagline: 'पेशेवर नज़र, सच्ची खबर',
    logoUrl: '/logos/the-provue-times.jpeg',
    primaryColor: '#c91c1d'
  },
  {
    slug: 'desh-ki-aawaz',
    name: 'देश की आवाज़',
    tagline: 'खबरों में सच, सोच में दुनिया',
    logoUrl: '/logos/desh-ki-aawaz.jpeg',
    primaryColor: '#db0f14'
  },
  {
    slug: 'jan-bharat-news',
    name: 'जन भारत न्यूज़',
    tagline: 'भारत की आवाज़',
    logoUrl: '/logos/jan-bharat-news.jpeg',
    primaryColor: '#1e3a8a'
  },
  {
    slug: 'news-info-24',
    name: 'NEWS INFO 24',
    tagline: 'Stay Informed, Stay Ahead',
    logoUrl: '/logos/news-info-24.jpeg',
    primaryColor: '#e11d48'
  },
  {
    slug: 'ndn-defence',
    name: 'National Defence Network',
    tagline: 'DEFENCE BEYOND HEADLINES',
    logoUrl: '/logos/ndn-defence.jpeg',
    primaryColor: '#2f4f38'
  }
];

interface SiteSwitcherProps {
  currentSlug: string;
  primaryColor?: string;
}

export default function SiteSwitcher({ currentSlug, primaryColor = '#ea580c' }: SiteSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectSite = (slug: string) => {
    setIsOpen(false);
    window.location.href = `/?site=${slug}`;
  };

  const currentSite = ALL_NETWORK_SITES.find(s => s.slug === currentSlug) || ALL_NETWORK_SITES[0];

  return (
    <div style={{ position: 'relative', display: 'inline-block', zIndex: 99999 }} ref={dropdownRef}>
      
      <style jsx>{`
        .switcher-dropdown-panel {
          position: absolute;
          top: calc(100% + 8px);
          right: 0;
          width: 310px;
          max-width: 92vw;
          background: #ffffff;
          border-radius: 12px;
          box-shadow: 0 12px 36px rgba(0, 0, 0, 0.22), 0 0 0 1px rgba(0, 0, 0, 0.08);
          z-index: 999999;
          overflow: hidden;
          padding: 6px 0;
        }

        @media (max-width: 600px) {
          .switcher-dropdown-panel {
            position: fixed;
            top: auto;
            bottom: 16px;
            left: 50%;
            right: auto;
            transform: translateX(-50%);
            width: calc(100vw - 28px);
            max-width: 360px;
            border-radius: 16px;
            box-shadow: 0 -4px 30px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(0,0,0,0.1);
          }
          .switcher-backdrop {
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.45);
            backdrop-filter: blur(2px);
            z-index: 999990;
          }
        }
      `}</style>

      {/* MOBILE BACKDROP OVERLAY */}
      {isOpen && (
        <div className="switcher-backdrop" onClick={() => setIsOpen(false)} />
      )}

      {/* TRIGGER BUTTON */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '7px',
          background: '#ffffff',
          color: '#1e293b',
          border: `1.5px solid ${isOpen ? primaryColor : '#cbd5e1'}`,
          borderRadius: '24px',
          padding: '6px 12px',
          cursor: 'pointer',
          fontWeight: 700,
          fontSize: '12px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
          whiteSpace: 'nowrap',
          outline: 'none',
          position: 'relative',
          zIndex: isOpen ? 999995 : 1
        }}
      >
        <span style={{ fontSize: '14px' }}>🌐</span>
        <span style={{ maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {currentSite.name}
        </span>
        <span 
          style={{ 
            fontSize: '9px', 
            color: '#64748b', 
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', 
            transition: 'transform 0.2s ease' 
          }}
        >
          ▼
        </span>
      </button>

      {/* DROPDOWN LIST */}
      {isOpen && (
        <div className="switcher-dropdown-panel">
          
          {/* Header */}
          <div style={{ padding: '10px 14px 8px 14px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11.5px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              नेटवर्क पोर्टल्स (8 Sites)
            </span>
            <button 
              type="button" 
              onClick={() => setIsOpen(false)}
              style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '16px', cursor: 'pointer', padding: '0 4px', lineHeight: 1 }}
            >
              ✕
            </button>
          </div>

          {/* Scrollable Items */}
          <div style={{ maxHeight: 'min(380px, 60vh)', overflowY: 'auto' }}>
            {ALL_NETWORK_SITES.map((site) => {
              const isSelected = site.slug === currentSlug;
              return (
                <div
                  key={site.slug}
                  onClick={() => handleSelectSite(site.slug)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '9px 14px',
                    cursor: 'pointer',
                    background: isSelected ? '#fff7ed' : '#ffffff',
                    borderLeft: isSelected ? `4px solid ${site.primaryColor}` : '4px solid transparent',
                    transition: 'background 0.15s'
                  }}
                >
                  <div style={{ width: '36px', height: '36px', borderRadius: '6px', background: '#fff', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0, padding: '2px' }}>
                    <img 
                      src={site.logoUrl} 
                      alt={site.name} 
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: isSelected ? site.primaryColor : '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {site.name}
                      </span>
                      {isSelected && (
                        <span style={{ fontSize: '10.5px', color: site.primaryColor, fontWeight: 800, flexShrink: 0 }}>
                          ✓ सक्रिय
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: '2px' }}>
                      {site.tagline}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      )}
    </div>
  );
}