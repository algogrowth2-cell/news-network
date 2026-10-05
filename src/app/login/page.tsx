'use client';
import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { createReaderWithReferral, normalizeReferralInput } from '@/lib/referralService';
import { isReaderRegistered } from '@/lib/readerLookup';
import ConsentNotice, { consentError, EMPTY_CONSENT, type ConsentValue } from '@/components/ConsentNotice';
import { CONSENT_VERSION, recordConsent } from '@/lib/consent';
import { isValidEmail, isValidIndianMobile, isValidName, sanitizeName, VALIDATION_MSG } from '@/lib/validation';

const fieldErrorStyle: React.CSSProperties = { display: 'block', marginTop: '5px', fontSize: '12px', color: '#dc2626', fontWeight: 500 };

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
  const [submitAttempted, setSubmitAttempted] = useState(false);
  // Mobile number ka account check: signup me pehle se registered / login me registered nahi
  const [accountError, setAccountError] = useState<'registered' | 'unregistered' | null>(null);
  // DPDP: signup par hamesha; login par sirf jinki profile me is version ki sahmati nahi
  const [consent, setConsent] = useState<ConsentValue>(EMPTY_CONSENT);
  const [needConsent, setNeedConsent] = useState(false);
  const [recordOnVerify, setRecordOnVerify] = useState(false);

  // Strict validation: signup me naam + email + mobile, login me sirf mobile
  const nameOk = isValidName(name);
  const emailOk = isValidEmail(email);
  const phoneOk = isValidIndianMobile(phone);
  const formValid = phoneOk && (authMode === 'login' || (nameOk && emailOk));
  // Error tab dikhao jab user ne kuch likha ho ya submit dabaya ho
  const showNameError = authMode === 'signup' && (submitAttempted || name.length > 0) && !nameOk;
  const showEmailError = authMode === 'signup' && (submitAttempted || email.length > 0) && !emailOk;
  const showPhoneError = (submitAttempted || phone.length === 10) && !phoneOk;

  // Detect referral code from URL parameter (?ref=...)
  useEffect(() => {
    const refParam = searchParams.get('ref');
    if (refParam) {
      setReferralCode(normalizeReferralInput(refParam));
      setAuthMode('signup'); // Agar referral link se aaya hai toh direct signup mode open karein
    }
  }, [searchParams]);

  // Reset error & OTP step on mode switch
  const switchMode = (mode: 'login' | 'signup') => {
    setAuthMode(mode);
    setStep('input');
    setOtp('');
    setMsg({ text: '', type: '' });
    setSubmitAttempted(false);
    setAccountError(null);
  };

  // 1. Send SMS OTP via 2Factor Endpoint
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg({ text: '', type: '' });

    // Galat input par OTP nahi — errors har field ke neeche dikhte hain
    setSubmitAttempted(true);
    setAccountError(null);
    if (!formValid) return;

    setLoading(true);
    try {
      // OTP se pehle hi existence check: signup me duplicate aur login me unregistered number block (SMS kharch nahi)
      const registered = await isReaderRegistered(phone);
      if (authMode === 'signup' && registered) {
        setAccountError('registered');
        setLoading(false);
        return;
      }
      if (authMode === 'login' && !registered) {
        setAccountError('unregistered');
        setLoading(false);
        return;
      }
      if (authMode === 'signup') {
        const ce = consentError(consent, 'signup');
        if (ce) {
          setMsg({ text: ce, type: 'error' });
          setLoading(false);
          return;
        }
        setRecordOnVerify(true);
      } else {
        const prof = await getDoc(doc(db, 'users', `u_${phone}`));
        const has = prof.exists() && prof.data().consent?.version === CONSENT_VERSION;
        if (!has) {
          const ce = consentError(consent, 'signup');
          if (ce) {
            setNeedConsent(true);
            setMsg({ text: 'DPDP नियमों के अनुसार आगे बढ़ने से पहले कृपया नीचे गोपनीयता नोटिस पढ़कर सहमति दें।', type: 'error' });
            setLoading(false);
            return;
          }
        }
        setRecordOnVerify(!has);
      }
    } catch (err) {
      console.error('Reader lookup error:', err);
      setMsg({ text: 'खाते की जांच नहीं हो पाई, कृपया पुनः प्रयास करें।', type: 'error' });
      setLoading(false);
      return;
    }

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
        let referralRecorded = false;
        let referralRejected = false;

        // Firestore user profile save/sync
        try {
          const userRef = doc(db, 'users', userId);
          const userSnap = await getDoc(userRef);

          if (userSnap.exists()) {
            const existingData = userSnap.data();
            finalName = existingData.name || finalName || 'पाठक';
            finalEmail = existingData.email || finalEmail || `${phone}@news.local`;
          } else {
            const profile = {
              userId,
              name: finalName || 'पाठक',
              email: finalEmail || `${phone}@news.local`,
              phone
            };
            // Naya user + referral auto-verify ek hi transaction me (self-referral / duplicate / galat code apne aap block)
            try {
              const result = await createReaderWithReferral(profile, referralCode);
              referralRecorded = result.created && result.referral === 'recorded';
              referralRejected = result.created && !!referralCode && result.referral !== 'recorded';
            } catch (txErr) {
              // Referral transaction fail ho toh bhi signup na ruke — user bina referral ke banao
              console.error('Referral transaction failed, creating user without referral:', txErr);
              await setDoc(
                userRef,
                {
                  name: profile.name,
                  email: profile.email,
                  phone,
                  role: 'reader',
                  verified: true,
                  referredBy: null,
                  createdAt: serverTimestamp()
                },
                { merge: true }
              );
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

        // DPDP sahmati ka record (profile + log)
        if (recordOnVerify) {
          await recordConsent({ role: 'reader', phone, profilePath: ['users', userId], marketing: consent.marketing, ageConfirmed: consent.age, action: authMode === 'signup' ? 'signup' : 'login' }).catch(
            (e) => console.error('Consent log error:', e)
          );
        }

        // Save session in local storage for navbar & portal
        localStorage.setItem('reader_user', JSON.stringify(userObj));
        localStorage.setItem('shok_user', JSON.stringify(userObj));

        setMsg({
          text: referralRecorded
            ? '🎉 नया खाता बन गया और रेफरल सफलतापूर्वक जुड़ गया! लॉगिन हो रहे हैं...'
            : referralRejected
              ? '🎉 नया खाता बन गया! (रेफरल कोड मान्य नहीं था, इसलिए रेफरल नहीं जुड़ा) लॉगिन हो रहे हैं...'
              : authMode === 'signup'
              ? '🎉 नया खाता बन गया! लॉगिन हो रहे हैं...'
              : '✓ OTP सत्यापित! लॉगिन सफल रहा...',
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
                    onChange={(e) => setName(sanitizeName(e.target.value))}
                    maxLength={60}
                    required
                    aria-invalid={showNameError}
                    style={{ ...inputStyle, borderColor: showNameError ? '#dc2626' : undefined }}
                  />
                  {showNameError && <span style={fieldErrorStyle}>{VALIDATION_MSG.name}</span>}
                </div>

                <div>
                  <label style={labelStyle}>ईमेल आईडी (Email Address) *</label>
                  <input
                    type="email"
                    placeholder="example@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value.replace(/\s/g, ''))}
                    maxLength={254}
                    required
                    aria-invalid={showEmailError}
                    style={{ ...inputStyle, borderColor: showEmailError ? '#dc2626' : undefined }}
                  />
                  {showEmailError && <span style={fieldErrorStyle}>{VALIDATION_MSG.email}</span>}
                </div>

                <div>
                  <label style={labelStyle}>रेफरल कोड (वैकल्पिक / Optional)</label>
                  <input
                    type="text"
                    placeholder="उदा. GPAB12CD"
                    value={referralCode}
                    maxLength={16}
                    autoCapitalize="characters"
                    onChange={(e) => setReferralCode(normalizeReferralInput(e.target.value))}
                    style={{ ...inputStyle, textTransform: 'uppercase', letterSpacing: referralCode ? '1px' : undefined }}
                  />
                  <span style={{ display: 'block', marginTop: '4px', fontSize: '11.5px', color: '#64748b' }}>
                    किसी दोस्त ने कोड दिया है तो यहाँ डालें — उन्हें 3 महीने का ई-पेपर फ्री मिलेगा
                  </span>
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
                  border: `1px solid ${showPhoneError ? '#dc2626' : '#cbd5e1'}`,
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
                  onChange={(e) => {
                    setPhone(e.target.value.replace(/[^0-9]/g, ''));
                    setAccountError(null);
                  }}
                  required
                  aria-invalid={showPhoneError}
                  style={{ width: '100%', padding: '10px 12px', border: 'none', fontSize: '15px', outline: 'none' }}
                />
              </div>
              {showPhoneError && <span style={fieldErrorStyle}>{VALIDATION_MSG.mobile}</span>}
              {accountError && (
                <div style={{ ...fieldErrorStyle, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '6px' }} role="alert">
                  <span>
                    {accountError === 'registered'
                      ? 'यह मोबाइल नंबर पहले से पंजीकृत है। कृपया लॉगिन करें।'
                      : 'यह मोबाइल नंबर पंजीकृत नहीं है। कृपया नया खाता बनाएं।'}
                  </span>
                  <button
                    type="button"
                    onClick={() => switchMode(accountError === 'registered' ? 'login' : 'signup')}
                    style={{ background: 'none', border: 'none', padding: 0, color: '#ea580c', fontWeight: 700, fontSize: '12.5px', cursor: 'pointer', textDecoration: 'underline' }}
                  >
                    {accountError === 'registered' ? 'लॉगिन करें' : 'खाता बनाएं / साइन अप करें'}
                  </button>
                </div>
              )}
            </div>

            {(authMode === 'signup' || needConsent) && <ConsentNotice role="reader" mode="signup" value={consent} onChange={setConsent} />}

            <button
              type="submit"
              disabled={loading || !formValid}
              style={{ ...submitStyle, ...(!formValid ? { opacity: 0.55, cursor: 'not-allowed' } : {}) }}
            >
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