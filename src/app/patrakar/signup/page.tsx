'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import RoleAuthLayout, { authButton, authInput, authLabel, authLinkButton, OtpInput, PhoneInput } from '@/components/RoleAuthLayout';
import { cleanPhone, findProfileByPhone, profileDocId } from '@/lib/roleSession';
import { sendOtp, verifyOtp } from '@/lib/otpClient';
import { isValidIndianMobile, isValidName, VALIDATION_MSG } from '@/lib/validation';


// Naya patrakar: OTP se mobile verify -> reporters/{rp_phone} (status: pending, admin approve karega)
export default function PatrakarSignupPage() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');

  const [step, setStep] = useState<'form' | 'otp' | 'save' | 'done'>('form');
  const [otp, setOtp] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [errorAction, setErrorAction] = useState<{ href: string; label: string } | null>(null);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setErrorAction(null);
    setMessage('');
    const mobile = cleanPhone(phone);
    if (!isValidName(name)) return setError(VALIDATION_MSG.name);
    if (!isValidIndianMobile(mobile)) return setError(VALIDATION_MSG.mobile);
    if (!city.trim()) return setError('कृपया शहर / जिला दर्ज करें।');

    setLoading(true);
    try {
      if (await findProfileByPhone('patrakar', mobile)) {
        setError('यह मोबाइल नंबर पहले से पंजीकृत है। कृपया लॉगिन करें।');
        setErrorAction({ href: '/patrakar/login', label: 'लॉगिन करें' });
      } else {
        const res = await sendOtp(mobile);
        if (res.ok && res.sessionId) {
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

  // OTP verify hone ke baad hi Firestore profile (fail ho toh bina OTP dobara try)
  const saveApplication = async () => {
    const mobile = cleanPhone(phone);
    setLoading(true);
    setError('');
    try {
      await setDoc(doc(db, 'reporters', profileDocId('patrakar', mobile)), {
        name: name.trim(),
        phone: mobile,
        city: city.trim(),
        status: 'pending',
        role: 'reporter',
        phoneVerified: true,
        createdAt: serverTimestamp()
      });
      setStep('done');
      setMessage('');
    } catch (err: any) {
      console.error('Reporter signup save error:', err);
      setStep('save');
      setError('आवेदन सेव नहीं हो पाया, कृपया पुनः प्रयास करें।');
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
    setLoading(false);
    if (!res.ok) return setError(res.message);
    await saveApplication();
  };

  if (step === 'done') {
    return (
      <RoleAuthLayout icon="✅" title="आवेदन जमा हो गया" subtitle="पत्रकार पंजीकरण">
        <p style={{ fontSize: '14px', color: '#334155', lineHeight: 1.6, textAlign: 'center', margin: '0 0 18px' }}>
          आपका मोबाइल नंबर सत्यापित हो गया है और आवेदन एडमिन वेरिफिकेशन के लिए भेज दिया गया है। स्वीकृति के बाद आप इसी नंबर से लॉगिन कर सकेंगे — पहली बार लॉगिन करने पर आपकी प्रेस ID अपने आप बन जाएगी।
        </p>
        <Link href="/patrakar/login" style={{ ...authButton(false), display: 'block', textAlign: 'center', textDecoration: 'none', boxSizing: 'border-box' }}>
          लॉगिन पेज पर जाएं
        </Link>
      </RoleAuthLayout>
    );
  }

  return (
    <RoleAuthLayout
      icon="📰"
      title="पत्रकार पंजीकरण (Reporter Signup)"
      subtitle={step === 'form' ? 'मोबाइल OTP से सत्यापित आवेदन' : step === 'otp' ? 'मोबाइल पर प्राप्त OTP दर्ज करें' : 'आवेदन सेव करें'}
      message={message}
      error={error}
      errorAction={errorAction}
      footer={
        <div>
          पहले से पंजीकृत हैं?{' '}
          <Link href="/patrakar/login" style={{ color: '#ea580c', fontWeight: 700, textDecoration: 'none' }}>
            लॉगिन करें
          </Link>
        </div>
      }
    >
      {step === 'form' && (
        <form onSubmit={handleSendOtp} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={authLabel}>पूरा नाम *</label>
            <input type="text" required value={name} onChange={(e) => setName(e.target.value)} style={authInput} placeholder="अपना पूरा नाम लिखें" />
          </div>
          <div>
            <label style={authLabel}>मोबाइल नंबर *</label>
            <PhoneInput value={phone} onChange={setPhone} />
          </div>
          <div>
            <label style={authLabel}>शहर / जिला *</label>
            <input type="text" required value={city} onChange={(e) => setCity(e.target.value)} style={authInput} placeholder="उदा. इंदौर" />
          </div>
          <button type="submit" disabled={loading} style={authButton(loading)}>
            {loading ? 'जांच की जा रही है...' : '💬 OTP भेजें और आवेदन करें'}
          </button>
        </form>
      )}

      {step === 'otp' && (
        <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={authLabel}>6 अंकों का SMS OTP *</label>
            <OtpInput value={otp} onChange={setOtp} />
          </div>
          <button type="submit" disabled={loading} style={authButton(loading)}>
            {loading ? 'आवेदन जमा हो रहा है...' : 'सत्यापित करें एवं आवेदन जमा करें'}
          </button>
          <button type="button" onClick={() => { setStep('form'); setOtp(''); setError(''); setMessage(''); }} style={authLinkButton}>
            ← विवरण बदलें
          </button>
        </form>
      )}

      {step === 'save' && (
        <button type="button" disabled={loading} onClick={saveApplication} style={authButton(loading)}>
          {loading ? 'सेव हो रहा है...' : '🔁 आवेदन दोबारा सेव करें'}
        </button>
      )}
    </RoleAuthLayout>
  );
}
