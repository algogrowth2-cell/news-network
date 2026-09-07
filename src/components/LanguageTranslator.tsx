'use client';
import { useState, useEffect, useRef } from 'react';

declare global {
  interface Window {
    google: any;
    googleTranslateElementInit: () => void;
  }
}

const INDIAN_LANGUAGES = [
  { code: 'hi', name: 'हिंदी', native: 'Hindi' },
  { code: 'en', name: 'English', native: 'English' },
  { code: 'pa', name: 'ਪੰਜਾਬੀ', native: 'Punjabi' },
  { code: 'gu', name: 'ગુજરાતી', native: 'Gujarati' },
  { code: 'mr', name: 'मराठी', native: 'Marathi' },
  { code: 'bn', name: 'বাংলা', native: 'Bengali' },
  { code: 'ta', name: 'தமிழ்', native: 'Tamil' },
  { code: 'te', name: 'తెలుగు', native: 'Telugu' },
  { code: 'kn', name: 'ಕನ್ನಡ', native: 'Kannada' },
  { code: 'ml', name: 'മലയാളം', native: 'Malayalam' },
  { code: 'or', name: 'ଓଡ଼ିଆ', native: 'Odia' },
  { code: 'ur', name: 'اردو', native: 'Urdu' },
];

export default function LanguageTranslator() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedLang, setSelectedLang] = useState<string>('हिंदी');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check if google script already added
    if (!document.getElementById('google-translate-script')) {
      const script = document.createElement('script');
      script.id = 'google-translate-script';
      script.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
      script.async = true;
      document.body.appendChild(script);

      window.googleTranslateElementInit = () => {
        if (window.google && window.google.translate) {
          new window.google.translate.TranslateElement(
            {
              pageLanguage: 'hi',
              includedLanguages: 'hi,en,pa,gu,mr,bn,ta,te,kn,ml,or,ur',
              autoDisplay: false,
            },
            'google_translate_hidden_element'
          );
        }
      };
    }

    // Close on outside click
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const changeLanguage = (langCode: string, langName: string) => {
    setSelectedLang(langName);
    setIsOpen(false);

    // Set cookie that Google Translate recognizes
    document.cookie = `googtrans=/hi/${langCode}; path=/; domain=${window.location.hostname}`;
    document.cookie = `googtrans=/hi/${langCode}; path=/;`;

    // Trigger select element in google hidden box
    const select = document.querySelector('.goog-te-combo') as HTMLSelectElement;
    if (select) {
      select.value = langCode;
      select.dispatchEvent(new Event('change'));
    } else {
      window.location.reload();
    }
  };

  return (
    <div ref={dropdownRef} style={{ position: 'relative', display: 'inline-block' }}>
      
      {/* Google Translate Hidden Target Container & Style Resets */}
      <div id="google_translate_hidden_element" style={{ display: 'none' }} />
      <style jsx global>{`
        .goog-te-banner-frame.skiptranslate,
        .goog-te-gadget,
        body > .skiptranslate {
          display: none !important;
        }
        body {
          top: 0px !important;
        }
      `}</style>

      {/* Main Trigger Button Matching Exact Top Bar Typography */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          background: 'none',
          border: 'none',
          color: '#94a3b8',
          fontSize: '11.5px',
          fontWeight: 600,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          padding: '2px 6px',
          borderRadius: '4px',
          transition: 'color 0.15s, background 0.15s'
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = '#ffffff')}
        onMouseLeave={(e) => (e.currentTarget.style.color = '#94a3b8')}
      >
        <span>🌐</span>
        <span>{selectedLang}</span>
        <span style={{ fontSize: '9px', opacity: 0.7 }}>{isOpen ? '▲' : '▼'}</span>
      </button>

      {/* Language Popup List */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            right: 0,
            background: '#111827',
            border: '1px solid #374151',
            borderRadius: '8px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
            zIndex: 9999,
            minWidth: '170px',
            maxHeight: '260px',
            overflowY: 'auto',
            padding: '6px'
          }}
        >
          <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 800, padding: '4px 8px', letterSpacing: '0.5px' }}>
            SELECT REGIONAL LANGUAGE
          </div>
          {INDIAN_LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              type="button"
              onClick={() => changeLanguage(lang.code, lang.name)}
              style={{
                width: '100%',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '6px 8px',
                border: 'none',
                background: selectedLang === lang.name ? '#1e293b' : 'transparent',
                color: selectedLang === lang.name ? '#38bdf8' : '#e2e8f0',
                fontSize: '12px',
                borderRadius: '5px',
                cursor: 'pointer',
                textAlign: 'left',
                fontWeight: selectedLang === lang.name ? 700 : 500
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#1f2937')}
              onMouseLeave={(e) => (e.currentTarget.style.background = selectedLang === lang.name ? '#1e293b' : 'transparent')}
            >
              <span>{lang.name}</span>
              <span style={{ fontSize: '10.5px', color: '#64748b' }}>{lang.native}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}