'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function AdvertiserRegisterPage() {
  const [isEnglish, setIsEnglish] = useState(false);
  const [formData, setFormData] = useState({
    businessName: '',
    contactPerson: '',
    email: '',
    password: '',
    mobile: '',
    gstNumber: '',
    city: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const router = useRouter();

  const t = {
    toggleBtn: isEnglish ? '文A हिंदी' : '文A English',
    heading: isEnglish ? 'Advertiser Registration' : 'विज्ञापनदाता पंजीकरण',
    subHeading: isEnglish ? 'Business & Brand Portal' : 'Business & Brand Portal',
    tagline: isEnglish ? 'Promote your business across news portals' : 'पोर्टल नेटवर्क पर अपना प्रचार व विज्ञापन प्रसारित करें',
    bizLabel: isEnglish ? 'Business / Agency Name' : 'व्यापार / एजेंसी का नाम',
    bizPh: isEnglish ? 'E.g., ABC Marketing' : 'उदा. एबीसी एंटरप्राइजेज',
    contactLabel: isEnglish ? 'Contact Person Name' : 'संपर्क व्यक्ति का नाम',
    contactPh: isEnglish ? 'Full Name' : 'पूरा नाम',
    emailLabel: isEnglish ? 'Official Email' : 'आधिकारिक ईमेल',
    emailPh: 'company@domain.com',
    passLabel: isEnglish ? 'Password' : 'पासवर्ड',
    passPh: '••••••••••••',
    mobileLabel: isEnglish ? 'Mobile' : 'मोबाइल',
    mobilePh: isEnglish ? '10 digit mobile' : '10 अंकों का नंबर',
    gstLabel: isEnglish ? 'GST Number (Optional)' : 'जीएसटी नंबर (ऐच्छिक)',
    gstPh: isEnglish ? 'GST Number' : 'जीएसटी नंबर',
    cityLabel: isEnglish ? 'City / State' : 'शहर / राज्य',
    cityPh: isEnglish ? 'E.g., Mumbai, MH' : 'उदा. इंदौर, म.प्र.',
    submitBtn: isEnglish ? 'Register Advertiser Account' : 'विज्ञापनदाता खाता बनाएं',
    submitting: isEnglish ? 'Creating Account...' : 'खाता बनाया जा रहा है...',
    alreadyAcc: isEnglish ? 'Already registered?' : 'पहले से खाता है?',
    loginLink: isEnglish ? 'Log in' : 'लॉगिन करें',
    backLink: isEnglish ? '← Go Back' : '← वापस जाएं',
    successMsg: isEnglish ? 'Account registered successfully!' : 'विज्ञापनदाता खाता सफलतापूर्वक पंजीकृत हुआ!'
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      await addDoc(collection(db, 'advertisers'), {
        ...formData,
        role: 'advertiser',
        createdAt: new Date().toISOString()
      });
      setMessage(t.successMsg);
      setTimeout(() => router.push('/advertiser/login'), 1800);
    } catch (err) {
      console.error(err);
      setMessage(isEnglish ? 'Error registering account' : 'पंजीकरण में समस्या आई।');
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 16px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      
      <div style={{ width: '100%', maxWidth: '460px', background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '32px 28px', boxShadow: '0 10px 30px rgba(0,0,0,0.04)', position: 'relative' }}>
        
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

        {message && (
          <div style={{ background: '#f0fdf4', border: '1px solid #86efac', color: '#15803d', padding: '10px', borderRadius: '8px', fontSize: '12px', marginBottom: '16px', textAlign: 'center' }}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
              {t.bizLabel}
            </label>
            <input
              type="text"
              required
              placeholder={t.bizPh}
              value={formData.businessName}
              onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
              style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                {t.contactLabel}
              </label>
              <input
                type="text"
                required
                placeholder={t.contactPh}
                value={formData.contactPerson}
                onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
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

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', fontSize: '12px', color: '#64748b' }}>
          <div>
            {t.alreadyAcc}{' '}
            <Link href="/advertiser/login" style={{ color: '#ea580c', fontWeight: 700, textDecoration: 'none' }}>
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