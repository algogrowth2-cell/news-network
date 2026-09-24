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

export default function LanguageTranslator() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedLang, setSelectedLang] = useState('hi');
  const dropdownRef = useRef<HTMLDivElement>(null);

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

    // Google Translate Trigger
    if (typeof window !== 'undefined') {
      const select = document.querySelector('.goog-te-combo') as HTMLSelectElement;
      if (select) {
        select.value = langCode;
        select.dispatchEvent(new Event('change'));
      }
    }
  };

  const currentLangObj = LANGUAGES.find(l => l.code === selectedLang) || LANGUAGES[0];

  return (
    <div ref={dropdownRef} className="notranslate" translate="no" style={{ position: 'relative', display: 'inline-block' }}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          backgroundColor: '#f1f5f9',
          border: '1px solid #cbd5e1',
          borderRadius: '20px',
          padding: '6px 14px',
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

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className="notranslate"
          translate="no"
          style={{
            position: 'absolute',
            right: 0,
            top: 'calc(100% + 8px)',
            width: '240px',
            maxHeight: '340px',
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
            zIndex: 9999,
            overflowY: 'auto',
            padding: '8px 0'
          }}
        >
          <div style={{ padding: '8px 16px', borderBottom: '1px solid #f1f5f9', fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            भाषा चुनें / Select Language
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
                    textAlign: 'left',
                    transition: 'background 0.15s ease'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f1f5f9')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = isSelected ? '#f8fafc' : 'transparent')}
                >
                  {/* Left Column: Regional Language */}
                  <span style={{ fontSize: '13.5px', fontWeight: isSelected ? 700 : 500, color: isSelected ? '#ea580c' : '#1e293b' }}>
                    {lang.native}
                  </span>

                  {/* Right Column: STRICT LOCKED ENGLISH (translate="no") */}
                  <span
                    translate="no"
                    className="notranslate"
                    style={{ fontSize: '12px', color: '#64748b', fontWeight: 600, letterSpacing: '0.2px' }}
                  >
                    {lang.english}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}