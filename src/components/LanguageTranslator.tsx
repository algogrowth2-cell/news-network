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

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
      
      {/* Hidden Google Translate container */}
      <div id="google_translate_element" style={{ display: 'none' }} />

      {/* Button */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="notranslate"
        translate="no"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          backgroundColor: '#f1f5f9',
          border: '1px solid #cbd5e1',
          borderRadius: '20px',
          padding: '6px 12px',
          fontSize: '12.5px',
          fontWeight: 600,
          color: '#334155',
          cursor: 'pointer',
          whiteSpace: 'nowrap'
        }}
      >
        <span>🌐</span>
        <span>{currentLangObj.native}</span>
        <span style={{ fontSize: '10px', color: '#94a3b8' }}>▼</span>
      </button>

      {/* Dropdown Menu (Mobile + Desktop friendly overlay) */}
      {isOpen && (
        <>
          {/* Mobile backdrop to easily close */}
          <div 
            onClick={() => setIsOpen(false)}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 9998,
              background: 'transparent'
            }}
          />

          <div
            style={{
              position: 'absolute',
              right: 0,
              top: 'calc(100% + 6px)',
              width: '230px',
              maxHeight: '340px',
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              boxShadow: '0 12px 36px rgba(0,0,0,0.18)',
              zIndex: 99999,
              overflowY: 'auto',
              padding: '6px 0'
            }}
          >
            <div 
              className="notranslate"
              translate="no"
              style={{ 
                padding: '8px 16px', 
                borderBottom: '1px solid #f1f5f9', 
                fontSize: '11px', 
                fontWeight: 700, 
                color: '#64748b', 
                textTransform: 'uppercase', 
                letterSpacing: '0.5px' 
              }}
            >
              Select Language
            </div>

            <div style={{ display: 'flex', flexDirection: 'column' }}>
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
                      padding: '9px 16px',
                      border: 'none',
                      backgroundColor: isSelected ? '#f8fafc' : 'transparent',
                      cursor: 'pointer',
                      width: '100%',
                      textAlign: 'left'
                    }}
                  >
                    <span style={{ fontSize: '13.5px', fontWeight: isSelected ? 700 : 500, color: isSelected ? '#ea580c' : '#1e293b' }}>
                      {lang.native}
                    </span>
                    <span
                      className="notranslate"
                      translate="no"
                      style={{ fontSize: '12px', color: '#64748b', fontWeight: 600, letterSpacing: '0.2px' }}
                    >
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