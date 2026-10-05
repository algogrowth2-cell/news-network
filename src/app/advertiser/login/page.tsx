'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import RoleAuthLayout, { authButton, authLabel, authLinkButton, OtpInput, PhoneInput } from '@/components/RoleAuthLayout';
import { cleanPhone, findProfileByPhone, getRoleSession, setRoleSession } from '@/lib/roleSession';
import { sendOtp, verifyOtp } from '@/lib/otpClient';
import { isValidIndianMobile, VALIDATION_MSG } from '@/lib/validation';
import ConsentNotice, { consentError, EMPTY_CONSENT, type ConsentValue } from '@/components/ConsentNotice';
import { CONSENT_VERSION, recordConsent } from '@/lib/consent';

// Sirf registered advertiser ka OTP login; session me sirf advertiser ka doc id + phone
export default function AdvertiserLoginPage() {
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [profileId, setProfileId] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [errorAction, setErrorAction] = useState<{ href: string; label: string } | null>(null);
  // DPDP: jinki profile me is notice-version ki sahmati nahi (purane users), unse ek baar
  const [needConsent, setNeedConsent] = useState(false);
  const [consent, setConsent] = useState<ConsentValue>(EMPTY_CONSENT);
  const [consentProfileId, setConsentProfileId] = useState('');

  useEffect(() => {
    if (getRoleSession('advertiser')) {
      router.replace('/advertiser/dashboard');
      return;
    }
    setCheckingAuth(false);
  }, [router]);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setErrorAction(null);
    setMessage('');
    const mobile = cleanPhone(phone);
    if (!isValidIndianMobile(mobile)) return setError(VALIDATION_MSG.mobile);

    setLoading(true);
    try {
      const profile = await findProfileByPhone('advertiser', mobile);
      if (!profile) {
        setError('यह मोबाइल नंबर पंजीकृत नहीं है। कृपया नया खाता बनाएं।');
        setErrorAction({ href: '/advertiser/signup', label: 'खाता बनाएं / साइन अप करें' });
      } else if (profile.data.consent?.version !== CONSENT_VERSION && consentError(consent, 'signup')) {
        setNeedConsent(true);
        setError('आपकी सुरक्षा के लिए, आगे बढ़ने से पहले कृपया नीचे दी गई गोपनीयता सूचना पढ़कर सहमति दें।');
      } else {
        if (profile.data.consent?.version !== CONSENT_VERSION) setConsentProfileId(profile.id);
        const res = await sendOtp(mobile);
        if (res.ok && res.sessionId) {
          setProfileId(profile.id);
          setSessionId(res.sessionId);
          setStep('otp');
          setMessage(res.message);
        } else setError(res.message);
      }
    } catch (err) {
      console.error(err);
      setError('पंजीकरण की जांच नहीं हो पाई, कृपया पुनः प्रयास करें।');
    }
    setLoading(false);
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    if (otp.length < 4) return setError('कृपया सही OTP दर्ज करें।');

    setLoading(true);
    const res = await verifyOtp(sessionId, otp);
    if (!res.ok) {
      setError(res.message);
      setLoading(false);
      return;
    }
    if (consentProfileId) {
      await recordConsent({ role: 'advertiser', phone: cleanPhone(phone), profilePath: ['advertisers', consentProfileId], marketing: consent.marketing, ageConfirmed: consent.age, action: 'login' }).catch(
        (e) => console.error('Consent log error:', e)
      );
    }
    setRoleSession('advertiser', profileId, cleanPhone(phone));
    setMessage('लॉगिन सफल! डैशबोर्ड खोला जा रहा है...');
    router.replace('/advertiser/dashboard');
  };

  if (checkingAuth) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f1f5f9', color: '#64748b', fontSize: '14px' }}>
        सत्र की जांच की जा रही है...
      </div>
    );
  }

  return (
    <RoleAuthLayout
      icon="📢"
      title="विज्ञापनदाता लॉगिन (Advertiser Portal)"
      subtitle={step === 'phone' ? 'पंजीकृत मोबाइल नंबर से OTP लॉगिन' : 'मोबाइल पर प्राप्त OTP दर्ज करें'}
      message={message}
      error={error}
      errorAction={errorAction}
      footer={
        <div>
          नया विज्ञापनदाता खाता?{' '}
          <Link href="/advertiser/signup" style={{ color: '#ea580c', fontWeight: 700, textDecoration: 'none' }}>
            साइनअप करें
          </Link>
        </div>
      }
    >
      {step === 'phone' ? (
        <form onSubmit={handleSendOtp} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={authLabel}>पंजीकृत मोबाइल नंबर *</label>
            <PhoneInput value={phone} onChange={setPhone} />
          </div>
          {needConsent && <ConsentNotice role="advertiser" mode="signup" value={consent} onChange={setConsent} />}
          <button type="submit" disabled={loading} style={authButton(loading)}>
            {loading ? 'जांच की जा रही है...' : '💬 SMS द्वारा OTP प्राप्त करें'}
          </button>
        </form>
      ) : (
        <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={authLabel}>6 अंकों का SMS OTP *</label>
            <OtpInput value={otp} onChange={setOtp} />
          </div>
          <button type="submit" disabled={loading} style={authButton(loading)}>
            {loading ? 'सत्यापित हो रहा है...' : 'सत्यापित करें एवं डैशबोर्ड खोलें'}
          </button>
          <button type="button" onClick={() => { setStep('phone'); setOtp(''); setError(''); setMessage(''); }} style={authLinkButton}>
            ← नंबर बदलें
          </button>
        </form>
      )}
    </RoleAuthLayout>
  );
}
