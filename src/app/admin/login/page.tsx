'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('goldenpearlnews@gmail.com');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    // 🛡️ DIRECT MASTER CREDENTIALS CHECK (Bypasses Firebase Auth restrictions)
    const validEmails = ['goldenpearlnews@gmail.com', 'admin@goldenpearlnews.com', 'admin@thelocalleader.in'];
    const validPasswords = ['GoldenPearl@2026', 'Admin@123', 'admin123', 'goldenpearl@2026', 'pankaj@123'];

    if (validEmails.includes(cleanEmail) && validPasswords.includes(cleanPassword)) {
      const adminData = {
        uid: 'golden-pearl-superadmin',
        email: cleanEmail,
        role: 'superadmin',
        name: 'Golden Pearl Administrator',
        authenticatedAt: new Date().toISOString()
      };

      // 1. Save in localStorage
      localStorage.setItem('admin_user', JSON.stringify(adminData));

      // 2. Save in sessionStorage
      sessionStorage.setItem('admin_user', JSON.stringify(adminData));

      // 3. Save Cookie for Next.js middleware / layout check
      document.cookie = `admin_session=true; path=/; max-age=86400`;
      document.cookie = `admin_user=${encodeURIComponent(JSON.stringify(adminData))}; path=/; max-age=86400`;

      // 4. Direct hard reload to Admin Dashboard
      window.location.href = '/admin';
      return;
    }

    setError('अमान्य ईमेल या पासवर्ड। कृपया पासवर्ड सही दर्ज करें (GoldenPearl@2026)');
    setLoading(false);
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '13px',
    fontWeight: 600,
    color: '#cbd5e1',
    marginBottom: '6px'
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#020617',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '420px',
          backgroundColor: '#1e293b',
          border: '1px solid #334155',
          borderRadius: '18px',
          padding: '28px',
          boxShadow: '0 25px 60px -20px rgba(0,0,0,0.6)'
        }}
      >
        {/* Logo / Header */}
        <div style={{ textAlign: 'center', marginBottom: '22px' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '16px',
              backgroundColor: '#0f172a',
              border: '1px solid #334155',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '28px',
              margin: '0 auto 12px'
            }}
          >
            🛡️
          </div>
          <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: '#fff' }}>गोल्डन पर्ल न्यूज़ एडमिन</h1>
          <p style={{ margin: '6px 0 0', fontSize: '13px', color: '#94a3b8' }}>
            सेंट्रलाइज्ड नेटवर्क प्रबंधन व संपादकीय नियंत्रण कक्ष
          </p>
        </div>

        {error && (
          <div
            style={{
              backgroundColor: 'rgba(239,68,68,0.12)',
              border: '1px solid rgba(239,68,68,0.4)',
              color: '#fca5a5',
              borderRadius: '10px',
              padding: '10px 12px',
              fontSize: '13px',
              marginBottom: '16px'
            }}
          >
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleAdminLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={labelStyle}>एडमिन ईमेल आईडी (Email)</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="goldenpearlnews@gmail.com"
              style={{ width: '100%', padding: '12px 14px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '10px', color: '#fff', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>

          <div>
            <label style={labelStyle}>एडमिन पासवर्ड (Password)</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="GoldenPearl@2026 दर्ज करें"
              style={{ width: '100%', padding: '12px 14px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '10px', color: '#fff', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '13px',
              backgroundColor: '#2563eb',
              color: '#fff',
              border: 'none',
              borderRadius: '10px',
              fontSize: '15px',
              fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? 'सत्यापित हो रहा है...' : 'एडमिन पैनल में प्रवेश करें →'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '18px' }}>
          <Link href="/" style={{ fontSize: '13px', color: '#94a3b8', textDecoration: 'none' }}>
            ← वापस मुख्य पोर्टल पर जाएं
          </Link>
        </div>
      </div>
    </div>
  );
}