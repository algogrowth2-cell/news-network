'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { collection, doc, getDocs, limit, query, setDoc, serverTimestamp, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import RoleAuthLayout, { authButton, authInput, authLabel, authLinkButton, OtpInput, PhoneInput } from '@/components/RoleAuthLayout';
import { cleanPhone, findProfileByPhone, profileDocId, setRoleSession } from '@/lib/roleSession';
import { sendOtp, verifyOtp } from '@/lib/otpClient';
import { isValidEmail, isValidIndianMobile, isValidName, VALIDATION_MSG } from '@/lib/validation';

// Naya advertiser: OTP se mobile verify -> advertisers/{adv_phone} -> session -> dashboard
export default function AdvertiserSignupPage() {
  const router = useRouter();
  const [businessName, setBusinessName] = useState('');
  const [contactName, setContactName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  const [step, setStep] = useState<'form' | 'otp' | 'save'>('form');
  const [otp, setOtp] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    const mobile = cleanPhone(phone);
    if (!businessName.trim()) return setError('कृपया व्यापार / एजेंसी का नाम दर्ज करें।');
    if (!isValidName(contactName)) return setError(VALIDATION_MSG.name);
    if (!isValidIndianMobile(mobile)) return setError(VALIDATION_MSG.mobile);
    if (!isValidEmail(email)) return setError(VALIDATION_MSG.email);

    setLoading(true);
    try {
      // Dashboard ads email se dikhata hai — isliye ek email ek hi advertiser ka ho
      const emailTaken = !(
        await getDocs(query(collection(db, 'advertisers'), where('email', '==', email.trim().toLowerCase()), limit(1)))
      ).empty;
      if (await findProfileByPhone('advertiser', mobile)) {
        setError('यह नंबर पहले से पंजीकृत है। कृपया लॉगिन करें।');
      } else if (emailTaken) {
        setError('यह ईमेल पहले से किसी विज्ञापनदाता खाते से जुड़ा है। कृपया दूसरा ईमेल दें या लॉगिन करें।');
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

  // OTP verify hone ke baad profile save (fail ho toh bina OTP dobara try)
  const saveAccount = async () => {
    const mobile = cleanPhone(phone);
    const id = profileDocId('advertiser', mobile);
    setLoading(true);
    setError('');
    try {
      await setDoc(doc(db, 'advertisers', id), {
        businessName: businessName.trim(),
        contactName: contactName.trim(),
        phone: mobile,
        email: email.trim().toLowerCase(),
        role: 'advertiser',
        phoneVerified: true,
        createdAt: serverTimestamp()
      });
      setRoleSession('advertiser', id, mobile);
      setMessage('खाता बन गया! डैशबोर्ड खोला जा रहा है...');
      router.replace('/advertiser/dashboard');
      return;
    } catch (err) {
      console.error('Advertiser signup save error:', err);
      setStep('save');
      setError('खाता सेव नहीं हो पाया, कृपया पुनः प्रयास करें।');
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
    await saveAccount();
  };

  return (
    <RoleAuthLayout
      icon="📢"
      title="विज्ञापनदाता पंजीकरण (Advertiser Signup)"
      subtitle={step === 'form' ? 'मोबाइल OTP से सत्यापित खाता' : step === 'otp' ? 'मोबाइल पर प्राप्त OTP दर्ज करें' : 'खाता सेव करें'}
      message={message}
      error={error}
      footer={
        <div>
          पहले से खाता है?{' '}
          <Link href="/advertiser/login" style={{ color: '#ea580c', fontWeight: 700, textDecoration: 'none' }}>
            लॉगिन करें
          </Link>
        </div>
      }
    >
      {step === 'form' && (
        <form onSubmit={handleSendOtp} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={authLabel}>व्यापार / एजेंसी का नाम *</label>
            <input type="text" required value={businessName} onChange={(e) => setBusinessName(e.target.value)} style={authInput} placeholder="उदा. शर्मा ट्रेडर्स" />
          </div>
          <div>
            <label style={authLabel}>संपर्क व्यक्ति का नाम *</label>
            <input type="text" required value={contactName} onChange={(e) => setContactName(e.target.value)} style={authInput} placeholder="पूरा नाम" />
          </div>
          <div>
            <label style={authLabel}>मोबाइल नंबर *</label>
            <PhoneInput value={phone} onChange={setPhone} />
          </div>
          <div>
            <label style={authLabel}>ईमेल आईडी *</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} style={authInput} placeholder="business@email.com" />
          </div>
          <button type="submit" disabled={loading} style={authButton(loading)}>
            {loading ? 'जांच की जा रही है...' : '💬 OTP भेजें और खाता बनाएं'}
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
            {loading ? 'खाता बन रहा है...' : 'सत्यापित करें एवं खाता बनाएं'}
          </button>
          <button type="button" onClick={() => { setStep('form'); setOtp(''); setError(''); setMessage(''); }} style={authLinkButton}>
            ← विवरण बदलें
          </button>
        </form>
      )}

      {step === 'save' && (
        <button type="button" disabled={loading} onClick={saveAccount} style={authButton(loading)}>
          {loading ? 'सेव हो रहा है...' : '🔁 खाता दोबारा सेव करें'}
        </button>
      )}
    </RoleAuthLayout>
  );
}
