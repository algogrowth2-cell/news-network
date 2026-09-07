'use client';
import { useState } from 'react';
import Link from 'next/link';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';

export default function PatrakarRegisterPage() {
  const [isEnglish, setIsEnglish] = useState(false);
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    mobile: '',
    designation: '',
    beat: '',
    city: '',
    state: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const t = {
    toggleBtn: isEnglish ? '文A हिंदी' : '文A English',
    heading: isEnglish ? 'Journalist Registration' : 'पत्रकार पंजीकरण',
    subHeading: isEnglish ? 'Journalist Registration' : 'Journalist Registration',
    tagline: isEnglish ? 'Apply to become a local accredited reporter' : 'स्थानीय पत्रकार के रूप में आवेदन करें',
    nameLabel: isEnglish ? 'Full Name' : 'पूरा नाम',
    namePh: isEnglish ? 'Enter your full name' : 'अपना पूरा नाम लिखें',
    emailLabel: isEnglish ? 'Email' : 'ईमेल',
    emailPh: isEnglish ? 'Enter email address' : 'admin@news.com',
    passLabel: isEnglish ? 'Password' : 'पासवर्ड',
    passPh: '••••••••••••',
    mobileLabel: isEnglish ? 'Mobile Number' : 'मोबाइल',
    mobilePh: isEnglish ? '10 digit mobile number' : '10 अंकों का नंबर',
    desigLabel: isEnglish ? 'Designation' : 'पदनाम',
    desigPh: isEnglish ? 'Journalist, Correspondent...' : 'पत्रकार, संवाददाता...',
    beatLabel: isEnglish ? 'Beat' : 'बीट',
    beatSelect: isEnglish ? 'Select Beat' : 'बीट चुनें',
    beatCrime: isEnglish ? 'Crime' : 'अपराध (Crime)',
    beatPolitics: isEnglish ? 'Politics' : 'राजनीति (Politics)',
    beatAdmin: isEnglish ? 'Administration' : 'प्रशासन (Administration)',
    beatSports: isEnglish ? 'Sports' : 'खेल (Sports)',
    beatBusiness: isEnglish ? 'Business' : 'व्यापार (Business)',
    cityLabel: isEnglish ? 'City' : 'शहर',
    cityPh: isEnglish ? 'City' : 'शहर',
    stateLabel: isEnglish ? 'State' : 'राज्य',
    statePh: isEnglish ? 'State' : 'राज्य',
    submitBtn: isEnglish ? 'Submit Application' : 'आवेदन जमा करें',
    submitting: isEnglish ? 'Submitting Application...' : 'आवेदन जमा हो रहा है...',
    alreadyAcc: isEnglish ? 'Already have an account?' : 'पहले से खाता है?',
    loginLink: isEnglish ? 'Log in' : 'लॉगिन करें',
    backLink: isEnglish ? '← Go Back' : '← वापस जाएं',
    successMsg: isEnglish ? 'Application submitted! Waiting for Admin verification.' : 'आवेदन सफलतापूर्वक जमा हुआ! एडमिन स्वीकृति की प्रतीक्षा करें।'
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      await addDoc(collection(db, 'reporters'), {
        ...formData,
        role: 'reporter',
        status: 'pending',
        appliedAt: new Date().toISOString()
      });
      setMessage(t.successMsg);
      setTimeout(() => {
        router.push('/patrakar/login');
      }, 2000);
    } catch (err) {
      console.error(err);
      setMessage(isEnglish ? 'Submission error, please try again.' : 'त्रुटि: कृपया पुनः प्रयास करें।');
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 16px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      
      <div style={{ width: '100%', maxWidth: '460px', background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '32px 28px', boxShadow: '0 10px 30px rgba(0,0,0,0.04)', position: 'relative' }}>
        
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
            📰
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

        {message && (
          <div style={{ background: '#f0fdf4', border: '1px solid #86efac', color: '#15803d', padding: '10px', borderRadius: '8px', fontSize: '12px', marginBottom: '16px', textAlign: 'center' }}>
            {message}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
              {t.nameLabel}
            </label>
            <input
              type="text"
              required
              placeholder={t.namePh}
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
              {t.emailLabel}
            </label>
            <input
              type="email"
              required
              placeholder={t.emailPh}
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                {t.passLabel}
              </label>
              <input
                type="password"
                required
                placeholder={t.passPh}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                {t.mobileLabel}
              </label>
              <input
                type="tel"
                required
                placeholder={t.mobilePh}
                value={formData.mobile}
                onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                {t.desigLabel}
              </label>
              <input
                type="text"
                placeholder={t.desigPh}
                value={formData.designation}
                onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                {t.beatLabel}
              </label>
              <select
                value={formData.beat}
                onChange={(e) => setFormData({ ...formData, beat: e.target.value })}
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '13px', outline: 'none', background: '#fff', boxSizing: 'border-box' }}
              >
                <option value="">{t.beatSelect}</option>
                <option value="crime">{t.beatCrime}</option>
                <option value="politics">{t.beatPolitics}</option>
                <option value="admin">{t.beatAdmin}</option>
                <option value="sports">{t.beatSports}</option>
                <option value="business">{t.beatBusiness}</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                {t.cityLabel}
              </label>
              <input
                type="text"
                placeholder={t.cityPh}
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                {t.stateLabel}
              </label>
              <input
                type="text"
                placeholder={t.statePh}
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
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
              marginTop: '8px'
            }}
          >
            {loading ? t.submitting : t.submitBtn}
          </button>
        </form>

        {/* Footer Links */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', fontSize: '12px', color: '#64748b' }}>
          <div>
            {t.alreadyAcc}{' '}
            <Link href="/patrakar/login" style={{ color: '#ea580c', fontWeight: 700, textDecoration: 'none' }}>
              {t.loginLink}
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