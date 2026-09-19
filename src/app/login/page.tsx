'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [step, setStep] = useState<'form' | 'otp'>('form');

  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ text: '', type: '' });

  useEffect(() => {
    if (searchParams?.get('mode') === 'signup') {
      setAuthMode('signup');
    }
  }, [searchParams]);

  // Tab Switcher Reset
  const handleTabSwitch = (mode: 'login' | 'signup') => {
    setAuthMode(mode);
    setStep('form');
    setOtp('');
    setMsg({ text: '', type: '' });
  };

  // 1. Send SMS OTP via 2Factor API
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg({ text: '', type: '' });

    if (authMode === 'signup') {
      if (!name.trim()) {
        setMsg({ text: 'कृपया अपना पूरा नाम दर्ज करें।', type: 'error' });
        return;
      }
      if (!email.trim() || !email.includes('@')) {
        setMsg({ text: 'कृपया सही ईमेल आईडी दर्ज करें।', type: 'error' });
        return;
      }
    }

    if (!phone || phone.length !== 10) {
      setMsg({ text: 'कृपया 10 अंकों का सही मोबाइल नंबर दर्ज करें।', type: 'error' });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'send', phone })
      });
      const data = await res.json();

      if (data.success) {
        setSessionId(data.sessionId);
        setStep('otp');
        setMsg({ text: `+91 ${phone} पर SMS द्वारा 6 अंकों का OTP भेज दिया गया है।`, type: 'success' });
      } else {
        setMsg({ text: data.message || 'OTP भेजने में समस्या आई, कृपया नंबर जांचें।', type: 'error' });
      }
    } catch (err) {
      setMsg({ text: 'सर्वर कनेक्शन में समस्या आई।', type: 'error' });
    }
    setLoading(false);
  };

  // 2. Verify SMS OTP & Create/Load User Account
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg({ text: '', type: '' });

    if (!otp || otp.length < 4) {
      setMsg({ text: 'कृपया सही 6 अंकों का OTP दर्ज करें।', type: 'error' });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'verify', sessionId, otp })
      });
      const data = await res.json();

      if (data.success) {
        const userId = 'u_' + phone;
        let finalName = name.trim();
        let finalEmail = email.trim();

        // Check if user exists in Firestore
        try {
          const userRef = doc(db, 'users', userId);
          const userSnap = await getDoc(userRef);

          if (userSnap.exists()) {
            const existingData = userSnap.data();
            finalName = existingData.name || finalName || 'पाठक';
            finalEmail = existingData.email || finalEmail || `${phone}@news.local`;
          } else {
            // New user registration in Firestore
            await setDoc(userRef, {
              name: finalName || 'पाठक',
              email: finalEmail || `${phone}@news.local`,
              phone: phone,
              role: 'reader',
              verified: true,
              createdAt: serverTimestamp()
            }, { merge: true });
          }
        } catch (dbErr) {
          console.error('Firestore save optional error:', dbErr);
        }

        const userObj = {
          uid: userId,
          name: finalName || 'पाठक',
          email: finalEmail || `${phone}@news.local`,
          phone: phone,
          role: 'reader',
          verified: true
        };

        // Cache session for Navbar, Comments & Shok Sandesh
        localStorage.setItem('reader_user', JSON.stringify(userObj));
        localStorage.setItem('shok_user', JSON.stringify(userObj));

        setMsg({
          text: authMode === 'signup' ? '🎉 खाता सफलतापूर्वक बन गया! लॉगिन हो रहा है...' : '✓ OTP सत्यापित! लॉगिन सफल रहा...',
          type: 'success'
        });

        setTimeout(() => {
          router.push('/');
        }, 1100);
      } else {
        setMsg({ text: data.message || 'गलत OTP दर्ज किया गया है।', type: 'error' });
      }
    } catch (err) {
      setMsg({ text: 'सत्यापन विफल रहा।', type: 'error' });
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f2f1ee', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', fontFamily: '"Mukta", system-ui, sans-serif' }}>
      <div style={{ background: '#ffffff', width: '100%', maxWidth: '440px', borderRadius: '14px', border: '1px solid #e3e0da', padding: '32px', boxShadow: '0 8px 30px rgba(0,0,0,0.06)' }}>
        
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div style={{ width: '48px', height: '48px', background: '#fff7ed', borderRadius: '12px', display: 'grid', placeItems: 'center', margin: '0 auto 10px', fontSize: '22px', color: '#ea580c', fontWeight: 800 }}>
            द
          </div>
          <h2 style={{ fontSize: '22px', fontWeight: 700, margin: '0 0 4px', color: '#16150f' }}>
            {authMode === 'login' ? 'पाठक लॉगिन (Reader Login)' : 'नया खाता बनाएं (Reader Sign Up)'}
          </h2>
          <p style={{ fontSize: '13px', color: '#8d897f', margin: 0 }}>
            द लोकल लीडर डिजिटल न्यूज़ नेटवर्क
          </p>
        </div>

        {/* Tab Switcher: Login / Sign Up */}
        {step === 'form' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', background: '#f8fafc', padding: '4px', borderRadius: '10px', marginBottom: '20px', border: '1px solid #e2e8f0' }}>
            <button
              type="button"
              onClick={() => handleTabSwitch('login')}
              style={{
                background: authMode === 'login' ? '#ffffff' : 'transparent',
                color: authMode === 'login' ? '#ea580c' : '#64748b',
                border: 'none',
                padding: '8px',
                borderRadius: '8px',
                fontSize: '13.5px',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: authMode === 'login' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                transition: 'all 0.2s'
              }}
            >
              लॉगिन करें
            </button>
            <button
              type="button"
              onClick={() => handleTabSwitch('signup')}
              style={{
                background: authMode === 'signup' ? '#ffffff' : 'transparent',
                color: authMode === 'signup' ? '#ea580c' : '#64748b',
                border: 'none',
                padding: '8px',
                borderRadius: '8px',
                fontSize: '13.5px',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: authMode === 'signup' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                transition: 'all 0.2s'
              }}
            >
              साइनअप (नया खाता)
            </button>
          </div>
        )}

        {/* Status / Error Message Banner */}
        {msg.text && (
          <div style={{
            background: msg.type === 'success' ? '#f0fdf4' : '#fef2f2',
            color: msg.type === 'success' ? '#166534' : '#991b1b',
            border: `1px solid ${msg.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
            borderRadius: '8px',
            padding: '10px 14px',
            fontSize: '13px',
            marginBottom: '16px',
            textAlign: 'center'
          }}>
            {msg.text}
          </div>
        )}

        {step === 'form' ? (
          <form onSubmit={handleSendOtp} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            
            {authMode === 'signup' && (
              <>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '4px', color: '#16150f' }}>
                    पूरा नाम (Full Name) *
                  </label>
                  <input
                    type="text"
                    placeholder="अपना पूरा नाम लिखें"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    required
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '4px', color: '#16150f' }}>
                    ईमेल आईडी (Email Address) *
                  </label>
                  <input
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none' }}
                  />
                </div>
              </>
            )}

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '4px', color: '#16150f' }}>
                मोबाइल नंबर (Text SMS OTP प्राप्त करने हेतु) *
              </label>
              <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #cbd5e1', borderRadius: '8px', overflow: 'hidden' }}>
                <span style={{ background: '#f8fafc', padding: '10px 12px', fontSize: '14px', fontWeight: 600, color: '#475569', borderRight: '1px solid #cbd5e1' }}>+91</span>
                <input
                  type="tel"
                  maxLength={10}
                  placeholder="10 अंकों का मोबाइल नंबर"
                  value={phone}
                  onChange={e => setPhone(e.target.value.replace(/[^0-9]/g, ''))}
                  required
                  style={{ width: '100%', padding: '10px 12px', border: 'none', fontSize: '15px', outline: 'none' }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                background: '#ea580c',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                padding: '12px',
                fontSize: '15px',
                fontWeight: 700,
                cursor: 'pointer',
                marginTop: '6px'
              }}
            >
              {loading ? 'SMS OTP भेजा जा रहा है...' : '💬 Text SMS द्वारा OTP प्राप्त करें'}
            </button>

            <div style={{ textAlign: 'center', marginTop: '6px', fontSize: '13px', color: '#64748b' }}>
              {authMode === 'login' ? (
                <span>
                  खाता नहीं है?{' '}
                  <button
                    type="button"
                    onClick={() => handleTabSwitch('signup')}
                    style={{ background: 'none', border: 'none', color: '#ea580c', fontWeight: 700, cursor: 'pointer', padding: 0 }}
                  >
                    साइनअप करें
                  </button>
                </span>
              ) : (
                <span>
                  पहले से खाता है?{' '}
                  <button
                    type="button"
                    onClick={() => handleTabSwitch('login')}
                    style={{ background: 'none', border: 'none', color: '#ea580c', fontWeight: 700, cursor: 'pointer', padding: 0 }}
                  >
                    लॉगिन करें
                  </button>
                </span>
              )}
            </div>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ textAlign: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '13.5px', color: '#64748b' }}>
                नंबर <b>+91 {phone}</b> पर भेजा गया 6 अंकों का OTP दर्ज करें
              </span>
              <button
                type="button"
                onClick={() => setStep('form')}
                style={{ display: 'block', margin: '4px auto 0', background: 'none', border: 'none', color: '#ea580c', fontSize: '12px', cursor: 'pointer', fontWeight: 600 }}
              >
                नंबर / विवरण बदलें
              </button>
            </div>

            <div>
              <input
                type="text"
                maxLength={6}
                placeholder="• • • • • •"
                value={otp}
                onChange={e => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                autoFocus
                required
                style={{ width: '100%', padding: '12px', textAlign: 'center', letterSpacing: '8px', fontSize: '22px', fontWeight: 700, borderRadius: '8px', border: '2px solid #ea580c', outline: 'none' }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                background: '#16a34a',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                padding: '12px',
                fontSize: '15px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              {loading ? 'जाँच की जा रही है...' : (authMode === 'signup' ? '✓ खाता बनाएं और लॉगिन हों' : '✓ OTP सत्यापित करें और लॉगिन हों')}
            </button>

            <div style={{ textAlign: 'center', marginTop: '6px' }}>
              <button
                type="button"
                onClick={handleSendOtp}
                disabled={loading}
                style={{ background: 'none', border: 'none', color: '#ea580c', fontSize: '13px', cursor: 'pointer', fontWeight: 600 }}
              >
                पुनः OTP भेजें (Resend SMS)
              </button>
            </div>
          </form>
        )}

        <div style={{ marginTop: '24px', textAlign: 'center', borderTop: '1px solid #e3e0da', paddingTop: '16px' }}>
          <Link href="/" style={{ color: '#64748b', fontSize: '13px', textDecoration: 'none' }}>
            ← होम पेज पर वापस जाएं
          </Link>
        </div>

      </div>
    </div>
  );
}