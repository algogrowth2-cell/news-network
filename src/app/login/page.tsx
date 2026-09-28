'use client';
import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

function LoginAndSignupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Mode: 'login' for existing users, 'signup' for new registrations
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [step, setStep] = useState<'input' | 'otp'>('input');

  // Input states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [otp, setOtp] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ text: '', type: '' });

  // Detect referral code from URL parameter (?ref=...)
  useEffect(() => {
    const refParam = searchParams.get('ref');
    if (refParam) {
      setReferralCode(refParam.trim());
      setAuthMode('signup'); // Agar referral link se aaya hai toh direct signup mode open karein
    }
  }, [searchParams]);

  // Reset error & OTP step on mode switch
  const switchMode = (mode: 'login' | 'signup') => {
    setAuthMode(mode);
    setStep('input');
    setOtp('');
    setMsg({ text: '', type: '' });
  };

  // 1. Send SMS OTP via 2Factor Endpoint
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
      setMsg({ text: 'सर्वर से संपर्क नहीं हो पाया।', type: 'error' });
    }
    setLoading(false);
  };

  // 2. Verify OTP and Create/Authenticate User + Track Referral Reward
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
        let isNewUser = false;

        // Firestore user profile save/sync
        try {
          const userRef = doc(db, 'users', userId);
          const userSnap = await getDoc(userRef);

          if (userSnap.exists()) {
            const existingData = userSnap.data();
            finalName = existingData.name || finalName || 'पाठक';
            finalEmail = existingData.email || finalEmail || `${phone}@news.local`;
          } else {
            isNewUser = true;
            await setDoc(
              userRef,
              {
                name: finalName || 'पाठक',
                email: finalEmail || `${phone}@news.local`,
                phone: phone,
                role: 'reader',
                verified: true,
                referredBy: referralCode || null,
                createdAt: serverTimestamp()
              },
              { merge: true }
            );
          }

          // -------------------------------------------------------------
          // Process Referral and Generate Reward for the Referrer
          // -------------------------------------------------------------
          if (isNewUser && referralCode && referralCode !== phone) {
            const refDocId = `${referralCode}_${phone}`;
            const refDocRef = doc(db, 'referrals', refDocId);
            const refDocSnap = await getDoc(refDocRef);

            if (!refDocSnap.exists()) {
              // 1. Admin analytics collection
              await setDoc(refDocRef, {
                referrerPhone: referralCode,
                referredUserPhone: phone,
                referredUserName: finalName || 'पाठक',
                status: 'successful_signup',
                createdAt: serverTimestamp()
              });

              // 2. Reward choice creation for referrer (2 Options: 3 Month E-Paper OR 3 Month All Portals)
              await setDoc(doc(db, 'referral_rewards', refDocId), {
                referrerPhone: referralCode,
                referredUserPhone: phone,
                status: 'pending_selection', // Referrer can choose option 1 or option 2
                optionsAvailable: ['epaper_3_months', 'all_portals_3_months'],
                createdAt: serverTimestamp()
              });
            }
          }
        } catch (dbErr) {
          console.error('Firestore sync error:', dbErr);
        }

        const userObj = {
          uid: userId,
          name: finalName || 'पाठक',
          email: finalEmail || `${phone}@news.local`,
          phone: phone,
          role: 'reader',
          verified: true
        };

        // Save session in local storage for navbar & portal
        localStorage.setItem('reader_user', JSON.stringify(userObj));
        localStorage.setItem('shok_user', JSON.stringify(userObj));

        setMsg({
          text: authMode === 'signup' ? '🎉 नया खाता बन गया! लॉगिन हो रहे हैं...' : '✓ OTP सत्यापित! लॉगिन सफल रहा...',
          type: 'success'
        });

        const redirectUrl = searchParams.get('redirect') || '/';
        setTimeout(() => {
          router.push(redirectUrl);
        }, 1100);
      } else {
        setMsg({ text: data.message || 'अमान्य OTP! कृपया दोबारा जांचें।', type: 'error' });
      }
    } catch (err) {
      setMsg({ text: 'सत्यापन विफल रहा।', type: 'error' });
    }
    setLoading(false);
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '13px',
    fontWeight: 600,
    color: '#334155',
    marginBottom: '6px'
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 12px',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box'
  };

  const tabStyle = (active: boolean): React.CSSProperties => ({
    background: active ? '#ea580c' : 'transparent',
    color: active ? '#ffffff' : '#475569',
    border: 'none',
    padding: '9px',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'all 0.2s',
    boxShadow: active ? '0 2px 4px rgba(234,88,12,0.25)' : 'none'
  });

  const submitStyle: React.CSSProperties = {
    width: '100%',
    backgroundColor: '#ea580c',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    padding: '12px',
    fontSize: '15px',
    fontWeight: 700,
    cursor: loading ? 'not-allowed' : 'pointer',
    opacity: loading ? 0.7 : 1
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#f8fafc',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
    >
      <div
        style={{
          backgroundColor: '#fff',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 10px 30px -12px rgba(15,23,42,0.18)',
          maxWidth: '420px',
          width: '100%',
          padding: '24px'
        }}
      >
        {/* Portal Header */}
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '14px',
              backgroundColor: '#ea580c',
              color: '#fff',
              fontSize: '26px',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 12px'
            }}
          >
            द
          </div>
          <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: '#0f172a' }}>
            {authMode === 'login' ? 'पाठक लॉगिन (Sign In)' : 'नया खाता बनाएं (Sign Up)'}
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748b' }}>
            द लोकल लीडर डिजिटल न्यूज़ नेटवर्क
          </p>
        </div>

        {/* MODE SWITCH TABS (LOGIN / SIGNUP) */}
        {step === 'input' && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '4px',
              backgroundColor: '#f1f5f9',
              padding: '4px',
              borderRadius: '10px',
              marginBottom: '16px'
            }}
          >
            <button type="button" onClick={() => switchMode('login')} style={tabStyle(authMode === 'login')}>
              लॉगिन (Sign In)
            </button>
            <button type="button" onClick={() => switchMode('signup')} style={tabStyle(authMode === 'signup')}>
              साइनअप (Sign Up)
            </button>
          </div>
        )}

        {/* Referral Active Banner (if user came via referral link) */}
        {referralCode && authMode === 'signup' && step === 'input' && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: '#fff7ed',
              border: '1px solid #fed7aa',
              color: '#9a3412',
              borderRadius: '8px',
              padding: '10px 12px',
              fontSize: '13px',
              fontWeight: 600,
              marginBottom: '14px'
            }}
          >
            <span>🎁</span>
            <span>रेफरल आमंत्रण लागू: {referralCode}</span>
          </div>
        )}

        {/* Notification Alert Message */}
        {msg.text && (
          <div
            style={{
              backgroundColor: msg.type === 'error' ? '#fef2f2' : '#f0fdf4',
              border: `1px solid ${msg.type === 'error' ? '#fecaca' : '#bbf7d0'}`,
              color: msg.type === 'error' ? '#b91c1c' : '#166534',
              borderRadius: '8px',
              padding: '10px 12px',
              fontSize: '13px',
              marginBottom: '14px'
            }}
          >
            {msg.text}
          </div>
        )}

        {step === 'input' ? (
          <form onSubmit={handleSendOtp} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* SIGNUP EXTRA REQUIRED FIELDS */}
            {authMode === 'signup' && (
              <>
                <div>
                  <label style={labelStyle}>पूरा नाम (Full Name) *</label>
                  <input
                    type="text"
                    placeholder="अपना नाम लिखें"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={labelStyle}>ईमेल आईडी (Email Address) *</label>
                  <input
                    type="email"
                    placeholder="example@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={labelStyle}>रेफरल कोड (वैकल्पिक / Optional)</label>
                  <input
                    type="text"
                    placeholder="रेफरल कोड (यदि हो)"
                    value={referralCode}
                    onChange={(e) => setReferralCode(e.target.value.trim())}
                    style={inputStyle}
                  />
                </div>
              </>
            )}

            {/* MOBILE NUMBER FIELD FOR BOTH */}
            <div>
              <label style={labelStyle}>मोबाइल नंबर (Text SMS OTP हेतु) *</label>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  overflow: 'hidden'
                }}
              >
                <span
                  style={{
                    padding: '10px 12px',
                    backgroundColor: '#f1f5f9',
                    color: '#475569',
                    fontSize: '15px',
                    fontWeight: 600,
                    borderRight: '1px solid #cbd5e1'
                  }}
                >
                  +91
                </span>
                <input
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  placeholder="10 अंकों का मोबाइल नंबर"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ''))}
                  required
                  style={{ width: '100%', padding: '10px 12px', border: 'none', fontSize: '15px', outline: 'none' }}
                />
              </div>
            </div>

            <button type="submit" disabled={loading} style={submitStyle}>
              {loading
                ? 'SMS OTP भेजा जा रहा है...'
                : authMode === 'signup'
                  ? '💬 साइनअप हेतु SMS OTP भेजें'
                  : '💬 लॉगिन हेतु SMS OTP भेजें'}
            </button>

            {/* In-form toggle helper link */}
            <div style={{ textAlign: 'center', fontSize: '13px', color: '#64748b' }}>
              {authMode === 'login' ? (
                <span>
                  खाता नहीं है?{' '}
                  <button
                    type="button"
                    onClick={() => switchMode('signup')}
                    style={{ background: 'none', border: 'none', color: '#ea580c', fontWeight: 700, cursor: 'pointer', padding: 0 }}
                  >
                    नया खाता बनाएं (Sign Up)
                  </button>
                </span>
              ) : (
                <span>
                  पहले से खाता मौजूद है?{' '}
                  <button
                    type="button"
                    onClick={() => switchMode('login')}
                    style={{ background: 'none', border: 'none', color: '#ea580c', fontWeight: 700, cursor: 'pointer', padding: 0 }}
                  >
                    लॉगिन करें (Sign In)
                  </button>
                </span>
              )}
            </div>
          </form>
        ) : (
          /* OTP STEP */
          <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ textAlign: 'center' }}>
              <p style={{ margin: 0, fontSize: '13.5px', color: '#334155' }}>
                नंबर +91 {phone} पर प्राप्त 6 अंकों का SMS OTP दर्ज करें
              </p>
              <button
                type="button"
                onClick={() => setStep('input')}
                style={{ display: 'block', margin: '4px auto 0', background: 'none', border: 'none', color: '#ea580c', fontSize: '12px', cursor: 'pointer', fontWeight: 600 }}
              >
                नंबर / विवरण बदलें
              </button>
            </div>

            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder="● ● ● ● ● ●"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
              autoFocus
              required
              style={{ width: '100%', padding: '12px', textAlign: 'center', letterSpacing: '8px', fontSize: '22px', fontWeight: 700, borderRadius: '8px', border: '2px solid #ea580c', outline: 'none', boxSizing: 'border-box' }}
            />

            <button type="submit" disabled={loading} style={submitStyle}>
              {loading
                ? 'सत्यापन जारी है...'
                : authMode === 'signup'
                  ? '✓ खाता बनाएं और लॉगिन हों'
                  : '✓ OTP सत्यापित करें'}
            </button>

            <button
              type="button"
              disabled={loading}
              onClick={(e) => handleSendOtp(e as unknown as React.FormEvent)}
              style={{ background: 'none', border: 'none', color: '#475569', fontSize: '13px', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', textDecoration: 'underline' }}
            >
              पुनः SMS भेजें (Resend SMS OTP)
            </button>
          </form>
        )}

        <div style={{ textAlign: 'center', marginTop: '18px' }}>
          <Link href="/" style={{ fontSize: '13px', color: '#64748b', textDecoration: 'none', fontWeight: 600 }}>
            ← होम पेज पर वापस जाएं
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#64748b',
            fontSize: '15px'
          }}
        >
          लोड हो रहा है...
        </div>
      }
    >
      <LoginAndSignupContent />
    </Suspense>
  );
}