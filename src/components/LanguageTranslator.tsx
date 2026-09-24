'use client';

import React, { useState, useEffect, useRef } from 'react';

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

export default function LanguageTranslator() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedLang, setSelectedLang] = useState('hi');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 1. Check existing cookie & init Google Translate
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const match = document.cookie.match(/googtrans=\/([^/]+)\/([^;]+)/);
      if (match && match[2]) {
        setSelectedLang(match[2]);
      }
    }

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

  // 2. Click outside listener for desktop
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 3. Switch Language
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
    <div ref={dropdownRef} style={{ position: 'relative', display: 'inline-block' }}>
      
      {/* Hidden container for Google Translate widget */}
      <div id="google_translate_element" style={{ display: 'none' }} />

      {/* Trigger Button */}
      <button
        type="button"
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
        <span style={{ fontSize: '14px' }}>🌐</span>
        <span>{currentLangObj.native}</span>
        <span style={{ fontSize: '9px', color: '#94a3b8' }}>▼</span>
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
          <div
            className="lang-modal-box"
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              boxShadow: '0 20px 50px rgba(0,0,0,0.25)',
              zIndex: 99999,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden'
            }}
          >
            {/* Header */}
            <div
              className="notranslate"
              translate="no"
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '14px 18px',
                borderBottom: '1px solid #f1f5f9',
                backgroundColor: '#fafaf9'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '16px' }}>🌐</span>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b' }}>
                  भाषा चुनें / Select Language
                </span>
              </div>
              <button
                type="button"
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
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                overflowY: 'auto',
                maxHeight: '360px',
                padding: '6px 0'
              }}
            >
              {LANGUAGES.map((lang) => {
                const isSelected = selectedLang === lang.code;
                return (
                  <button
                    key={lang.code}
                    type="button"
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      {isSelected ? (
                        <span style={{ color: '#ea580c', fontWeight: 800, fontSize: '13px' }}>✓</span>
                      ) : (
                        <span style={{ width: '12px' }} />
                      )}
                      <span
                        style={{
                          fontSize: '14.5px',
                          fontWeight: isSelected ? 700 : 500,
                          color: isSelected ? '#ea580c' : '#1e293b'
                        }}
                      >
                        {lang.native}
                      </span>
                    </div>

                    {/* Right Column: English Strictly Locked */}
                    <span
                      className="notranslate"
                      translate="no"
                      style={{
                        fontSize: '12.5px',
                        color: isSelected ? '#ea580c' : '#64748b',
                        fontWeight: 600,
                        letterSpacing: '0.3px'
                      }}
                    >
                      {lang.english}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <style jsx>{`
            /* Desktop View: Normal Anchor Dropdown */
            @media (min-width: 769px) {
              .lang-modal-box {
                position: absolute !important;
                right: 0 !important;
                top: calc(100% + 8px) !important;
                width: 250px !important;
              }
            }

            /* Mobile View: Centered / Bottom Sheet Modal */
            @media (max-width: 768px) {
              .lang-modal-box {
                position: fixed !important;
                left: 12px !important;
                right: 12px !important;
                bottom: 16px !important;
                max-height: 80vh !important;
                animation: slideUp 0.25s ease-out !important;
              }
            }

            @keyframes slideUp {
              from {
                transform: translateY(100%);
                opacity: 0;
              }
              to {
                transform: translateY(0);
                opacity: 1;
              }
            }
          `}</style>
        </>
      )}
    </div>
  );
}