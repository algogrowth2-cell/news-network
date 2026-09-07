'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function PatrakarLoginPage() {
  const [isEnglish, setIsEnglish] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const router = useRouter();

  const t = {
    toggleBtn: isEnglish ? '文A हिंदी' : '文A English',
    heading: isEnglish ? 'Journalist Login' : 'पत्रकार लॉगिन',
    subHeading: isEnglish ? 'Journalist Portal' : 'Journalist Portal',
    tagline: isEnglish ? 'Log in to submit and track news reports' : 'खबरें प्रेषित और ट्रैक करने के लिए लॉगिन करें',
    emailLabel: isEnglish ? 'Registered Email' : 'पंजीकृत ईमेल',
    emailPh: isEnglish ? 'Enter registered email' : 'reporter@news.com',
    passLabel: isEnglish ? 'Password' : 'पासवर्ड',
    passPh: '••••••••••••',
    loginBtn: isEnglish ? 'Log In to Portal' : 'पोर्टल में प्रवेश करें',
    loggingIn: isEnglish ? 'Logging in...' : 'प्रवेश किया जा रहा है...',
    noAccount: isEnglish ? "Don't have an account?" : 'नया खाता बनाना है?',
    registerLink: isEnglish ? 'Register here' : 'पंजीकरण करें',
    backLink: isEnglish ? '← Go Back' : '← वापस जाएं',
    errorInvalid: isEnglish ? 'Invalid email or password!' : 'गलत ईमेल या पासवर्ड दर्ज किया गया है।',
    errorPending: isEnglish ? 'Your account is under admin verification.' : 'आपका आवेदन अभी एडमिन सत्यापन के अधीन है।'
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      const q = query(
        collection(db, 'reporters'),
        where('email', '==', email.trim().toLowerCase())
      );
      const snap = await getDocs(q);

      if (snap.empty) {
        setErrorMsg(t.errorInvalid);
      } else {
        const reporterData = snap.docs[0].data();
        if (reporterData.password === password) {
          if (reporterData.status === 'pending') {
            setErrorMsg(t.errorPending);
          } else {
            localStorage.setItem('patrakar_user', JSON.stringify({ id: snap.docs[0].id, ...reporterData }));
            router.push('/patrakar/dashboard');
          }
        } else {
          setErrorMsg(t.errorInvalid);
        }
      }
    } catch (err) {
      console.error(err);
      setErrorMsg(t.errorInvalid);
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 16px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      
      <div style={{ width: '100%', maxWidth: '420px', background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '32px 28px', boxShadow: '0 10px 30px rgba(0,0,0,0.04)', position: 'relative' }}>
        
        {/* Language Toggle Button */}
        <button
          type="button"
          onClick={() => setIsEnglish(!isEnglish)}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: '#fff',
            border: '1px solid #ea580c',
            color: '#ea580c',
            borderRadius: '20px',
            padding: '4px 12px',
            fontSize: '11.5px',
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 2px 4px rgba(234, 88, 12, 0.1)'
          }}
        >
          {t.toggleBtn}
        </button>

        {/* Center Icon & Titles */}
        <div style={{ textAlign: 'center', marginBottom: '24px', marginTop: '6px' }}>
          <div style={{ width: '48px', height: '48px', background: '#f1f5f9', borderRadius: '12px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', marginBottom: '10px' }}>
            🪪
          </div>
          <h1 style={{ fontSize: '21px', fontWeight: 900, color: '#0f172a', margin: '0 0 4px 0' }}>
            {t.heading}
          </h1>
          <div style={{ fontSize: '11.5px', color: '#ea580c', fontWeight: 700 }}>
            {t.subHeading}
          </div>
          <p style={{ fontSize: '12px', color: '#64748b', margin: '4px 0 0 0' }}>
            {t.tagline}
          </p>
        </div>

        {errorMsg && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '10px', borderRadius: '8px', fontSize: '12px', marginBottom: '16px', textAlign: 'center' }}>
            {errorMsg}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
              {t.emailLabel}
            </label>
            <input
              type="email"
              required
              placeholder={t.emailPh}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ width: '100%', padding: '11px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
              {t.passLabel}
            </label>
            <input
              type="password"
              required
              placeholder={t.passPh}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ width: '100%', padding: '11px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px',
              background: '#ea580c',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 800,
              fontSize: '14px',
              cursor: loading ? 'not-allowed' : 'pointer',
              marginTop: '6px'
            }}
          >
            {loading ? t.loggingIn : t.loginBtn}
          </button>
        </form>

        {/* Footer Links */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '22px', fontSize: '12px', color: '#64748b' }}>
          <div>
            {t.noAccount}{' '}
            <Link href="/patrakar/register" style={{ color: '#ea580c', fontWeight: 700, textDecoration: 'none' }}>
              {t.registerLink}
            </Link>
          </div>
          <Link href="/" style={{ color: '#64748b', textDecoration: 'none' }}>
            {t.backLink}
          </Link>
        </div>

      </div>

    </div>
  );
}