'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<'details' | 'otp'>('details');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ text: '', type: '' });

  // 1. Send OTP via 2Factor API
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg({ text: '', type: '' });

    if (!phone || phone.length < 10) {
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
        setMsg({ text: 'SMS द्वारा 6 अंकों का OTP भेज दिया गया है।', type: 'success' });
      } else {
        setMsg({ text: data.message || 'OTP भेजने में विफलता हुई।', type: 'error' });
      }
    } catch (err: any) {
      setMsg({ text: 'सर्वर से कनेक्ट करने में त्रुटि।', type: 'error' });
    }
    setLoading(false);
  };

  // 2. Verify OTP & Log In
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg({ text: '', type: '' });

    if (!otp || otp.length < 4) {
      setMsg({ text: 'कृपया सही OTP दर्ज करें।', type: 'error' });
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
        const userObj = {
          uid: 'u_' + phone,
          name: name.trim() || 'यूज़र',
          email: email.trim() || `${phone}@news.local`,
          phone: phone.trim(),
          verified: true
        };

        // Cache session for navbar & portal
        localStorage.setItem('reader_user', JSON.stringify(userObj));
        localStorage.setItem('shok_user', JSON.stringify(userObj));

        setMsg({ text: 'सफलतापूर्वक लॉगिन हो गया! रीडायरेक्ट किया जा रहा है...', type: 'success' });
        setTimeout(() => {
          router.push('/');
        }, 1200);
      } else {
        setMsg({ text: data.message || 'अमान्य OTP, कृपया पुनः प्रयास करें।', type: 'error' });
      }
    } catch (err: any) {
      setMsg({ text: 'सत्यापन में समस्या आई।', type: 'error' });
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f2f1ee', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', fontFamily: '"Mukta", system-ui, sans-serif' }}>
      <div style={{ background: '#ffffff', width: '100%', maxWidth: '440px', borderRadius: '14px', border: '1px solid #e3e0da', padding: '32px', boxShadow: '0 8px 30px rgba(0,0,0,0.06)' }}>
        
        {/* Brand Top Header */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <Link href="/" style={{ textDecoration: 'none', color: '#ea580c', fontSize: '24px', fontWeight: 800 }}>
            द लोकल लीडर
          </Link>
          <p style={{ fontSize: '13px', color: '#8d897f', marginTop: '4px' }}>
            सुरक्षित OTP आधारित लॉगिन एवं पंजीकरण
          </p>
        </div>

        {msg.text && (
          <div style={{
            background: msg.type === 'success' ? '#f0fdf4' : '#fef2f2',
            color: msg.type === 'success' ? '#166534' : '#991b1b',
            border: `1px solid ${msg.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
            borderRadius: '8px',
            padding: '10px 14px',
            fontSize: '13.5px',
            marginBottom: '16px',
            textAlign: 'center'
          }}>
            {msg.text}
          </div>
        )}

        {step === 'details' ? (
          <form onSubmit={handleSendOtp} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#16150f', marginBottom: '4px' }}>
                पूरा नाम (वैकल्पिक)
              </label>
              <input
                type="text"
                placeholder="उदा. पंकज पाटीदार"
                value={name}
                onChange={e => setName(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#16150f', marginBottom: '4px' }}>
                ईमेल आईडी (वैकल्पिक)
              </label>
              <input
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#16150f', marginBottom: '4px' }}>
                मोबाइल नंबर (Text OTP हेतु) *
              </label>
              <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #cbd5e1', borderRadius: '8px', overflow: 'hidden' }}>
                <span style={{ background: '#f8fafc', padding: '10px 12px', fontSize: '14px', fontWeight: 600, color: '#475569', borderRight: '1px solid #cbd5e1' }}>+91</span>
                <input
                  type="tel"
                  maxLength={10}
                  placeholder="10 अंकों का नंबर"
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
                fontWeight: 600,
                cursor: 'pointer',
                marginTop: '6px'
              }}
            >
              {loading ? 'SMS भेजा जा रहा है...' : '💬 SMS द्वारा OTP प्राप्त करें'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ textAlign: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '13.5px', color: '#64748b' }}>
                नंबर <b>+91 {phone}</b> पर भेजा गया OTP दर्ज करें
              </span>
              <button
                type="button"
                onClick={() => setStep('details')}
                style={{ display: 'block', margin: '4px auto 0', background: 'none', border: 'none', color: '#ea580c', fontSize: '12px', cursor: 'pointer', fontWeight: 600 }}
              >
                नंबर बदलें
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
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              {loading ? 'जाँच की जा रही है...' : '✓ OTP सत्यापित करें और लॉगिन हों'}
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
            ← वापस होमपेज पर जाएं
          </Link>
        </div>

      </div>
    </div>
  );
}