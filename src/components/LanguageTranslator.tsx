'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';

const LANGUAGES = [
  { code: 'hi', native: 'हिंदी', english: 'Hindi' },
  { code: 'en', native: 'English', english: 'English' },
  { code: 'pa', native: 'ਪੰਜਾਬੀ', english: 'Punjabi' },
  { code: 'gu', native: 'ગુજરાતી', english: 'Gujarati' },
  { code: 'mr', native: 'मराठी', english: 'Marathi' },
  { code: 'bn', native: 'বাংলা', english: 'Bengali' },
  { code: 'ta', native: 'தமிழ்', english: 'Tamil' },
  { code: 'te', native: 'తెలుగు', english: 'Telugu' },
  { code: 'kn', native: 'ಕನ್ನಡ', english: 'Kannada' },
  { code: 'ml', native: 'മലയാളം', english: 'Malayalam' },
  { code: 'ur', native: 'اردو', english: 'Urdu' },
  { code: 'or', native: 'ଓଡ଼ିଆ', english: 'Odia' }
];

declare global {
  interface Window {
    google: any;
    googleTranslateElementInit: any;
  }
}

/* Sirf layout: mobile me bottom drawer, desktop me dropdown */
const LT_STYLES = `
.lt-panel{position:absolute;top:calc(100% + 8px);right:0;width:280px;max-height:420px;background:#fff;border:1px solid #e2e8f0;border-radius:14px;box-shadow:0 18px 44px -14px rgba(0,0,0,.3);z-index:99999;display:flex;flex-direction:column;overflow:hidden}
.lt-list{overflow-y:auto;flex:1}
@media (max-width:640px){
  .lt-panel{position:fixed;top:auto;left:0;right:0;bottom:0;width:100%;max-height:75vh;border-radius:18px 18px 0 0;border:0;padding-bottom:env(safe-area-inset-bottom)}
}
`;

export default function LanguageTranslator() {
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedLang, setSelectedLang] = useState('hi');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 1. Detect site & set default language (news-info-24 & ndn-defence -> en, others -> hi)
  useEffect(() => {
    const rawSite = searchParams.get('site') || 'the-local-leader';
    const siteSlug = decodeURIComponent(rawSite).trim().toLowerCase().replace(/\s+/g, '-');

    const isEnglishPortal =
      siteSlug === 'news-info-24' ||
      siteSlug === 'city-bulletin' ||
      siteSlug === 'ndn-defence' ||
      siteSlug === 'national-defence-network' ||
      siteSlug === 'national-spotlight';

    const portalDefault = isEnglishPortal ? 'en' : 'hi';

    // Check if user has explicitly saved cookie, otherwise use portalDefault
    let activeLang = portalDefault;
    if (typeof document !== 'undefined') {
      const match = document.cookie.match(/googtrans=\/([^/]+)\/([^;]+)/);
      if (match && match[2]) {
        activeLang = match[2];
      } else {
        // Apply default cookie for current portal
        const host = window.location.hostname;
        document.cookie = `googtrans=/auto/${portalDefault}; path=/;`;
        document.cookie = `googtrans=/auto/${portalDefault}; path=/; domain=${host};`;
      }
    }

    setSelectedLang(activeLang);

    // Apply to Google combo if already rendered
    const applyToCombo = () => {
      const combo = document.querySelector('.goog-te-combo') as HTMLSelectElement;
      if (combo && combo.value !== activeLang) {
        combo.value = activeLang;
        combo.dispatchEvent(new Event('change', { bubbles: true }));
      }
    };

    applyToCombo();
    const t = setTimeout(applyToCombo, 600);
    return () => clearTimeout(t);
  }, [searchParams]);

  // 2. Initialize Google Translate Script
  useEffect(() => {
    window.googleTranslateElementInit = () => {
      if (window.google && window.google.translate) {
        new window.google.translate.TranslateElement(
          {
            pageLanguage: 'hi',
            includedLanguages: 'hi,en,pa,gu,mr,bn,ta,te,kn,ml,ur,or',
            autoDisplay: false
          },
          'google_translate_element'
        );
      }
    };

    if (!document.getElementById('google-translate-script')) {
      const script = document.createElement('script');
      script.id = 'google-translate-script';
      script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
      script.async = true;
      document.body.appendChild(script);
    } else if (window.google && window.google.translate) {
      window.googleTranslateElementInit();
    }
  }, []);

  // 3. Click outside listener for desktop
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 4. Switch Language manually
  const changeLanguage = (langCode: string) => {
    setSelectedLang(langCode);
    setIsOpen(false);

    if (typeof window === 'undefined') return;

    const host = window.location.hostname;
    document.cookie = `googtrans=/hi/${langCode}; path=/;`;
    document.cookie = `googtrans=/auto/${langCode}; path=/;`;
    document.cookie = `googtrans=/hi/${langCode}; path=/; domain=${host};`;
    document.cookie = `googtrans=/auto/${langCode}; path=/; domain=${host};`;

    if (host.includes('.')) {
      const rootDomain = '.' + host.split('.').slice(-2).join('.');
      document.cookie = `googtrans=/hi/${langCode}; path=/; domain=${rootDomain};`;
      document.cookie = `googtrans=/auto/${langCode}; path=/; domain=${rootDomain};`;
    }

    const combo = document.querySelector('.goog-te-combo') as HTMLSelectElement;
    if (combo) {
      combo.value = langCode;
      combo.dispatchEvent(new Event('change', { bubbles: true }));
    } else {
      window.location.reload();
    }
  };

  const currentLangObj = LANGUAGES.find((l) => l.code === selectedLang) || LANGUAGES[0];

  return (
    <div
      ref={dropdownRef}
      className="notranslate"
      translate="no"
      style={{ position: 'relative', display: 'inline-block', flexShrink: 0 }}
    >
      <style dangerouslySetInnerHTML={{ __html: LT_STYLES }} />

      {/* Hidden container for Google Translate widget */}
      <div id="google_translate_element" style={{ display: 'none' }} />

      {/* Trigger Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="notranslate"
        translate="no"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '5px',
          backgroundColor: '#f1f5f9',
          border: '1px solid #cbd5e1',
          borderRadius: '20px',
          padding: '6px 12px',
          fontSize: '12px',
          fontWeight: 600,
          color: '#334155',
          cursor: 'pointer',
          whiteSpace: 'nowrap',
          userSelect: 'none',
          WebkitTapHighlightColor: 'transparent'
        }}
      >
        <span>🌐</span>
        <span>{currentLangObj.native}</span>
        <span style={{ fontSize: '9px', color: '#64748b' }}>▼</span>
      </button>

      {/* POPUP & MOBILE MODAL */}
      {isOpen && (
        <>
          {/* Full Screen Dim Backdrop */}
          <div
            onClick={() => setIsOpen(false)}
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.4)',
              backdropFilter: 'blur(2px)',
              zIndex: 99998
            }}
          />

          {/* Modal Container: Mobile me Bottom Drawer, Desktop me Dropdown */}
          <div className="lt-panel notranslate" translate="no">
            {/* Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '8px',
                padding: '14px 20px',
                borderBottom: '1px solid #f1f5f9'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '16px' }}>🌐</span>
                <span style={{ fontSize: '13.5px', fontWeight: 700, color: '#0f172a' }}>
                  भाषा चुनें / Select Language
                </span>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                style={{
                  background: '#f1f5f9',
                  border: 'none',
                  borderRadius: '50%',
                  width: '26px',
                  height: '26px',
                  display: 'grid',
                  placeItems: 'center',
                  fontSize: '13px',
                  color: '#64748b',
                  cursor: 'pointer'
                }}
              >
                ✕
              </button>
            </div>

            {/* Language Items List */}
            <div className="lt-list">
              {LANGUAGES.map((lang) => {
                const isSelected = selectedLang === lang.code;
                return (
                  <button
                    key={lang.code}
                    onClick={() => changeLanguage(lang.code)}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '12px 20px',
                      border: 'none',
                      backgroundColor: isSelected ? '#fff7ed' : 'transparent',
                      cursor: 'pointer',
                      width: '100%',
                      textAlign: 'left',
                      borderBottom: '1px solid #f8fafc',
                      transition: 'background 0.15s ease'
                    }}
                  >
                    {/* Left Column: Native */}
                    <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      {isSelected ? (
                        <span style={{ width: '16px', color: '#ea580c', fontWeight: 800, fontSize: '14px' }}>✓</span>
                      ) : (
                        <span style={{ width: '16px' }} />
                      )}
                      <span
                        style={{
                          fontSize: '14px',
                          fontWeight: isSelected ? 700 : 500,
                          color: isSelected ? '#c2410c' : '#1e293b'
                        }}
                      >
                        {lang.native}
                      </span>
                    </span>

                    {/* Right Column: English Strictly Locked */}
                    <span className="notranslate" translate="no" style={{ fontSize: '12px', color: '#94a3b8' }}>
                      {lang.english}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}