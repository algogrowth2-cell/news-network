'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { NETWORK_SITES, type SiteItem } from '@/lib/portals';

export { NETWORK_SITES, type SiteItem };

const getSsoSessionParam = () => {
  try {
    const cached = localStorage.getItem('reader_user');
    if (cached) {
      const encoded = btoa(encodeURIComponent(cached));
      return `sso_session=${encoded}`;
    }
  } catch (err) {
    console.error('SSO param generation error:', err);
  }
  return '';
};

// Portal par bhejta hai (SSO session ke saath), localhost/vercel par ?site= se
export const navigateToSite = (site: SiteItem) => {
  const ssoParam = getSsoSessionParam();
  if (typeof window !== 'undefined') {
    const currentHost = window.location.hostname.toLowerCase().replace('www.', '');
    if (currentHost.includes('localhost') || currentHost.includes('vercel.app')) {
      const queryStr = `?site=${site.slug}${ssoParam ? `&${ssoParam}` : ''}`;
      window.location.href = queryStr;
      return;
    }

    if (site.domain) {
      const targetUrl = `https://${site.domain}${ssoParam ? `?${ssoParam}` : ''}`;
      window.location.href = targetUrl;
    } else {
      window.location.href = `/?site=${site.slug}${ssoParam ? `&${ssoParam}` : ''}`;
    }
  }
};

/* Sirf layout: desktop me button ke neeche dropdown, mobile me neeche se sheet */
const SS_STYLES = `
.ss-panel{position:fixed;z-index:100001;width:270px;max-width:90vw;max-height:70vh;overflow-y:auto;background:#fff;border:1px solid #e2e8f0;border-radius:12px;box-shadow:0 16px 40px -12px rgba(0,0,0,.25);padding:8px}
@media (max-width:640px){
  .ss-panel{top:auto !important;right:0 !important;left:0;bottom:0;width:100%;max-width:100%;max-height:75vh;border-radius:18px 18px 0 0;border:0;padding:10px 10px calc(14px + env(safe-area-inset-bottom))}
  .ss-name{max-width:110px;overflow:hidden;text-overflow:ellipsis}
}
`;

// Network portal switcher — saare portals free hain, koi login/payment check nahi
export default function SiteSwitcher({
  currentSlug = 'the-local-leader',
  primaryColor = '#ea580c'
}: {
  currentSlug?: string;
  primaryColor?: string;
}) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [panelPos, setPanelPos] = useState({ top: 0, right: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleDropdown = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!dropdownOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setPanelPos({ top: rect.bottom + 8, right: Math.max(8, window.innerWidth - rect.right) });
    }
    setDropdownOpen(!dropdownOpen);
  };

  const handleSelectSite = (site: SiteItem) => {
    setDropdownOpen(false);
    if (site.slug !== currentSlug) navigateToSite(site);
  };

  const currentSiteObj = NETWORK_SITES.find((s) => s.slug === currentSlug) || NETWORK_SITES[0];

  return (
    <div className="notranslate" translate="no" style={{ position: 'relative', flexShrink: 0 }}>
      <style dangerouslySetInnerHTML={{ __html: SS_STYLES }} />
      <button
        ref={buttonRef}
        onClick={toggleDropdown}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          backgroundColor: '#f8fafc',
          border: '1.5px solid #cbd5e1',
          borderRadius: '20px',
          padding: '6px 12px',
          fontSize: '12.5px',
          fontWeight: 700,
          color: '#0f172a',
          cursor: 'pointer',
          outline: 'none',
          whiteSpace: 'nowrap'
        }}
      >
        <span>🌐</span>
        <span className="ss-name">{currentSiteObj.name}</span>
        <span style={{ fontSize: '9px', color: '#64748b' }}>▼</span>
      </button>

      {mounted && dropdownOpen && createPortal(
        <div className="notranslate" translate="no">
          <div
            onClick={() => setDropdownOpen(false)}
            style={{ position: 'fixed', inset: 0, zIndex: 100000, backgroundColor: 'rgba(0,0,0,0.25)' }}
          />

          <div className="ss-panel" style={{ top: panelPos.top, right: panelPos.right }}>
            <div
              style={{
                fontSize: '11px',
                fontWeight: 700,
                color: '#64748b',
                padding: '6px 10px 8px',
                borderBottom: '1px solid #f1f5f9',
                marginBottom: '4px'
              }}
            >
              नेटवर्क पोर्टल्स चुनें (Switch Portal)
            </div>

            {NETWORK_SITES.map((site) => {
              const isCurrent = site.slug === currentSlug;
              return (
                <button
                  key={site.slug}
                  onClick={() => handleSelectSite(site)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    padding: '9px 10px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: isCurrent ? `${primaryColor}15` : 'transparent',
                    color: isCurrent ? primaryColor : '#1e293b',
                    fontSize: '13px',
                    fontWeight: isCurrent ? 800 : 500,
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'background 0.15s'
                  }}
                  onMouseEnter={(e) => {
                    if (!isCurrent) e.currentTarget.style.backgroundColor = '#f8fafc';
                  }}
                  onMouseLeave={(e) => {
                    if (!isCurrent) e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <span>{site.name}</span>
                  {isCurrent && <span style={{ fontSize: '12px' }}>✓</span>}
                </button>
              );
            })}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
