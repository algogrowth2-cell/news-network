'use client';

import React, { useState } from 'react';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import Link from 'next/link';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const cleanEmail = email.trim().toLowerCase();

    try {
      // 1. Sirf pehle se bane Firebase account se login (koi auto-create nahi)
      const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, password);
      const user = userCredential.user;

      // 2. Admin role check: 'admins' collection me uid ya email ka document hona zaroori hai
      let isAdmin = false;
      const byUid = await getDoc(doc(db, 'admins', user.uid));
      if (byUid.exists()) {
        isAdmin = true;
      } else if (user.email) {
        const byEmail = await getDoc(doc(db, 'admins', user.email.toLowerCase()));
        if (byEmail.exists()) isAdmin = true;
      }

      if (!isAdmin) {
        await signOut(auth);
        setError('इस खाते को एडमिन पैनल का ऐक्सेस नहीं है।');
        setLoading(false);
        return;
      }

      // 3. Admin session
      const adminData = {
        uid: user.uid,
        email: user.email,
        role: 'superadmin',
        name: 'Golden Pearl Administrator',
        authenticatedAt: new Date().toISOString()
      };

      localStorage.setItem('admin_user', JSON.stringify(adminData));
      sessionStorage.setItem('admin_user', JSON.stringify(adminData));
      document.cookie = `admin_session=true; path=/; max-age=86400`;

      // 4. Force full page reload into Admin Dashboard
      window.location.href = '/admin';
    } catch (err: any) {
      console.error('Login error:', err);
      if (err.code === 'auth/too-many-requests') {
        setError('बहुत सारे असफल प्रयास। कृपया कुछ देर बाद प्रयास करें।');
      } else {
        setError('अमान्य ईमेल या पासवर्ड।');
      }
      setLoading(false);
    }
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
              placeholder="admin@example.com"
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
              placeholder="पासवर्ड दर्ज करें"
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