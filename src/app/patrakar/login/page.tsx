'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function PatrakarLoginPage() {
  const router = useRouter();

  // 1. Check if already logged in -> Immediately Redirect to Dashboard
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    try {
      const cached = localStorage.getItem('patrakar_user');
      if (cached) {
        const user = JSON.parse(cached);
        if (user && (user.phone || user.email)) {
          // Already logged in! Redirect instantly
          router.replace('/patrakar/dashboard');
          return;
        }
      }
    } catch (e) {
      console.error(e);
    }
    setCheckingAuth(false);
  }, [router]);

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [step, setStep] = useState<'details' | 'otp'>('details');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // 2. Send SMS OTP
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    const cleanPhone = phone.replace(/[^0-9]/g, '').slice(-10);
    if (cleanPhone.length !== 10) {
      setError('कृपया 10 अंकों का सही मोबाइल नंबर दर्ज करें।');
      return;
    }

    if (!name.trim()) {
      setError('कृपया अपना पूरा नाम दर्ज करें।');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch('/api/auth/otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'send', phone: cleanPhone })
      });
      const data = await res.json();

      if (data.success) {
        setSessionId(data.sessionId);
        setStep('otp');
        setMessage('मोबाइल नंबर पर SMS द्वारा OTP भेज दिया गया है।');
      } else {
        setError(data.message || 'OTP भेजने में विफलता हुई।');
      }
    } catch (err: any) {
      setError('सर्वर से संपर्क नहीं हो पाया: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // 3. Verify OTP & Save Session
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!otp.trim()) {
      setError('कृपया 6 अंकों का OTP दर्ज करें।');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch('/api/auth/otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'verify', sessionId, otp: otp.trim() })
      });
      const data = await res.json();

      if (data.success) {
        // Save reporter session permanently in localStorage
        const reporterData = {
          name: name.trim() || 'संवाददाता',
          email: email.trim() || 'reporter@thelocalleader.in',
          phone: phone.replace(/[^0-9]/g, '').slice(-10),
          membershipActive: false,
          idNumber: 'LL-PRESS-' + Math.floor(1000 + Math.random() * 9000),
          designation: 'अधिकृत संवाददाता (Reporter)',
          validTill: '31 Dec 2027',
          photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400'
        };

        localStorage.setItem('patrakar_user', JSON.stringify(reporterData));
        setMessage('लॉगिन सफल! डैशबोर्ड पर भेजा जा रहा है...');

        // Direct go to dashboard
        setTimeout(() => {
          router.replace('/patrakar/dashboard');
        }, 300);
      } else {
        setError(data.message || 'गलत OTP दर्ज किया गया है।');
      }
    } catch (err: any) {
      setError('सत्यापन त्रुटि: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (checkingAuth) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f1f5f9', color: '#64748b', fontSize: '14px' }}>
        सत्र की जांच की जा रही है...
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#eef2f6', padding: '20px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div style={{ width: '100%', maxWidth: '440px', background: '#ffffff', borderRadius: '16px', padding: '36px 30px', boxShadow: '0 10px 30px rgba(0,0,0,0.06)', boxSizing: 'border-box' }}>
        
        {/* Header Icon & Title */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ width: '48px', height: '48px', margin: '0 auto 12px', background: '#fff7ed', borderRadius: '12px', display: 'grid', placeItems: 'center', fontSize: '24px' }}>
            ✍️
          </div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#0f172a', margin: '0 0 6px 0' }}>
            पत्रकार लॉगिन (Reporter Portal)
          </h1>
          <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
            {step === 'details' ? 'खबरें और लेख सबमिट करने हेतु OTP लॉगिन' : 'मोबाइल पर प्राप्त OTP दर्ज करें'}
          </p>
        </div>

        {/* Notifications */}
        {message && (
          <div style={{ backgroundColor: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', marginBottom: '16px', textAlign: 'center' }}>
            {message}
          </div>
        )}
        {error && (
          <div style={{ backgroundColor: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', marginBottom: '16px', textAlign: 'center' }}>
            {error}
          </div>
        )}

        {/* STEP 1: DETAILS FORM */}
        {step === 'details' && (
          <form onSubmit={handleSendOtp} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#1e293b', marginBottom: '6px' }}>
                पूरा नाम *
              </label>
              <input
                type="text"
                required
                placeholder="उदा. पंकज पाटीदार"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{ width: '100%', boxSizing: 'border-box', border: '1.5px solid #cbd5e1', borderRadius: '8px', padding: '11px 14px', fontSize: '14px', outline: 'none' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#1e293b', marginBottom: '6px' }}>
                ईमेल आईडी *
              </label>
              <input
                type="email"
                required
                placeholder="reporter@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ width: '100%', boxSizing: 'border-box', border: '1.5px solid #cbd5e1', borderRadius: '8px', padding: '11px 14px', fontSize: '14px', outline: 'none' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#1e293b', marginBottom: '6px' }}>
                मोबाइल नंबर (Text SMS OTP हेतु) *
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <span style={{ display: 'flex', alignItems: 'center', padding: '0 12px', background: '#f8fafc', border: '1.5px solid #cbd5e1', borderRadius: '8px', color: '#475569', fontSize: '14px', fontWeight: 600 }}>
                  +91
                </span>
                <input
                  type="tel"
                  required
                  maxLength={10}
                  placeholder="10 अंकों का मोबाइल नंबर"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  style={{ width: '100%', boxSizing: 'border-box', border: '1.5px solid #cbd5e1', borderRadius: '8px', padding: '11px 14px', fontSize: '14px', outline: 'none' }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                backgroundColor: '#ea580c',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                padding: '13px',
                fontSize: '15px',
                fontWeight: 600,
                cursor: 'pointer',
                marginTop: '6px',
                opacity: loading ? 0.7 : 1
              }}
            >
              {loading ? 'OTP भेजा जा रहा है...' : '💬 SMS द्वारा OTP प्राप्त करें'}
            </button>
          </form>
        )}

        {/* STEP 2: VERIFY OTP FORM */}
        {step === 'otp' && (
          <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#1e293b', marginBottom: '6px' }}>
                6 अंकों का SMS OTP दर्ज करें *
              </label>
              <input
                type="text"
                required
                maxLength={6}
                placeholder="उदा. 482910"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                style={{ width: '100%', boxSizing: 'border-box', border: '1.5px solid #cbd5e1', borderRadius: '8px', padding: '12px 14px', fontSize: '16px', letterSpacing: '4px', textAlign: 'center', outline: 'none' }}
                autoFocus
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                backgroundColor: '#ea580c',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                padding: '13px',
                fontSize: '15px',
                fontWeight: 600,
                cursor: 'pointer',
                opacity: loading ? 0.7 : 1
              }}
            >
              {loading ? 'सत्यापित हो रहा है...' : 'सत्यापित करें एवं डैशबोर्ड खोलें'}
            </button>

            <button
              type="button"
              onClick={() => { setStep('details'); setError(''); }}
              style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '12.5px', cursor: 'pointer', textDecoration: 'underline' }}
            >
              ← नंबर या विवरण बदलें
            </button>
          </form>
        )}

        <div style={{ textAlign: 'center', marginTop: '24px' }}>
          <Link href="/" style={{ fontSize: '12.5px', color: '#64748b', textDecoration: 'none' }}>
            ← होम पेज पर वापस जाएं
          </Link>
        </div>

      </div>
    </div>
  );
}