'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function AdvertiserLoginPage() {
  const [isEnglish, setIsEnglish] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const router = useRouter();

  const t = {
    toggleBtn: isEnglish ? '文A हिंदी' : '文A English',
    heading: isEnglish ? 'Advertiser Login' : 'विज्ञापनदाता लॉगिन',
    subHeading: isEnglish ? 'Business & Brand Portal' : 'Business & Brand Portal',
    tagline: isEnglish ? 'Log in to book and manage digital ad banners' : 'विज्ञापन बुकिंग एवं अभियान प्रबंधन के लिए लॉगिन करें',
    emailLabel: isEnglish ? 'Registered Business Email' : 'पंजीकृत बिजनेस ईमेल',
    emailPh: 'company@domain.com',
    passLabel: isEnglish ? 'Password' : 'पासवर्ड',
    passPh: '••••••••••••',
    loginBtn: isEnglish ? 'Log In to Ad Dashboard' : 'विज्ञापन डैशबोर्ड में लॉगिन करें',
    loggingIn: isEnglish ? 'Logging in...' : 'प्रवेश किया जा रहा है...',
    noAccount: isEnglish ? "New advertiser?" : 'नया खाता बनाना है?',
    registerLink: isEnglish ? 'Register business' : 'पंजीकरण करें',
    backLink: isEnglish ? '← Go Back' : '← वापस जाएं',
    errorInvalid: isEnglish ? 'Invalid email or password!' : 'गलत ईमेल या पासवर्ड दर्ज किया गया है।'
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      const q = query(
        collection(db, 'advertisers'),
        where('email', '==', email.trim().toLowerCase())
      );
      const snap = await getDocs(q);

      if (snap.empty) {
        setErrorMsg(t.errorInvalid);
      } else {
        const advData = snap.docs[0].data();
        if (advData.password === password) {
          localStorage.setItem('advertiser_user', JSON.stringify({ id: snap.docs[0].id, ...advData }));
          router.push('/advertiser/dashboard');
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
        
        {/* Toggle Language Button */}
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

        <div style={{ textAlign: 'center', marginBottom: '24px', marginTop: '6px' }}>
          <div style={{ width: '48px', height: '48px', background: '#fff7ed', borderRadius: '12px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', marginBottom: '10px' }}>
            📢
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

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '22px', fontSize: '12px', color: '#64748b' }}>
          <div>
            {t.noAccount}{' '}
            <Link href="/advertiser/register" style={{ color: '#ea580c', fontWeight: 700, textDecoration: 'none' }}>
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