'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import RoleAuthLayout, { authButton, authLabel, authLinkButton, OtpInput, PhoneInput } from '@/components/RoleAuthLayout';
import { cleanPhone, findProfileByPhone, getRoleSession, isReporterApproved, setRoleSession } from '@/lib/roleSession';
import { sendOtp, verifyOtp } from '@/lib/otpClient';

const PENDING_MSG = 'आपका अकाउंट एडमिन वेरिफिकेशन के लिए पेंडिंग है। स्वीकृति के बाद ही डैशबोर्ड खुलेगा।';

// Registered + approved reporter ka hi OTP login; pending/rejected ko dashboard access nahi
export default function PatrakarLoginPage() {
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    // Valid session hai toh dashboard (wahan approval dobara check hota hai)
    if (getRoleSession('patrakar')) {
      router.replace('/patrakar/dashboard');
      return;
    }
    // Dashboard ne pending account ki wajah se wapas bheja ho
    if (new URLSearchParams(window.location.search).get('status') === 'pending') setError(PENDING_MSG);
    setCheckingAuth(false);
  }, [router]);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    const mobile = cleanPhone(phone);
    if (mobile.length !== 10) return setError('कृपया 10 अंकों का सही मोबाइल नंबर दर्ज करें।');

    setLoading(true);
    try {
      // OTP bhejne se pehle hi registration/approval check — bina registration SMS kharch nahi
      const profile = await findProfileByPhone('patrakar', mobile);
      if (!profile) {
        setError('यह नंबर पत्रकार के रूप में पंजीकृत नहीं है। कृपया पहले साइनअप करें।');
      } else if (String(profile.data.status || '').toLowerCase() === 'rejected') {
        setError('आपका पत्रकार आवेदन अस्वीकृत किया गया है। अधिक जानकारी के लिए संपादकीय टीम से संपर्क करें।');
      } else if (!isReporterApproved(profile.data)) {
        setError(PENDING_MSG);
      } else {
        const res = await sendOtp(mobile);
        if (res.ok && res.sessionId) {
          setSessionId(res.sessionId);
          setStep('otp');
          setMessage(res.message);
        } else setError(res.message);
      }
    } catch (err: any) {
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
    const mobile = cleanPhone(phone);
    const res = await verifyOtp(sessionId, otp);
    if (!res.ok) {
      setError(res.message);
      setLoading(false);
      return;
    }
    try {
      // OTP ke baad dobara taaza status — beech me admin ne badla ho toh bhi sahi rahe
      const profile = await findProfileByPhone('patrakar', mobile);
      if (!profile || !isReporterApproved(profile.data)) {
        setError(PENDING_MSG);
        setStep('phone');
      } else {
        setRoleSession('patrakar', profile.id, mobile);
        setMessage('लॉगिन सफल! डैशबोर्ड खोला जा रहा है...');
        router.replace('/patrakar/dashboard');
        return;
      }
    } catch (err: any) {
      console.error(err);
      setError('लॉगिन पूरा नहीं हो पाया, कृपया पुनः प्रयास करें।');
    }
    setLoading(false);
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
      icon="✍️"
      title="पत्रकार लॉगिन (Reporter Portal)"
      subtitle={step === 'phone' ? 'पंजीकृत मोबाइल नंबर से OTP लॉगिन' : 'मोबाइल पर प्राप्त OTP दर्ज करें'}
      message={message}
      error={error}
      footer={
        <div>
          नए पत्रकार हैं?{' '}
          <Link href="/patrakar/signup" style={{ color: '#ea580c', fontWeight: 700, textDecoration: 'none' }}>
            साइनअप / आवेदन करें
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
