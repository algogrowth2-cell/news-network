'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function ReaderLoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<'details' | 'otp'>('details');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ text: '', type: '' });

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg({ text: '', type: '' });

    if (!name.trim()) {
      setMsg({ text: 'Kripya apna naam likhein.', type: 'error' });
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setMsg({ text: 'Kripya sahi email ID darj karein.', type: 'error' });
      return;
    }
    if (!phone || phone.length !== 10) {
      setMsg({ text: 'Kripya 10 ankon ka mobile number darj karein.', type: 'error' });
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
        setMsg({ text: 'Mobile par Text SMS dwara OTP bhej diya gaya hai.', type: 'success' });
      } else {
        setMsg({ text: data.message || 'OTP bhejne me samasya aayi.', type: 'error' });
      }
    } catch (err) {
      setMsg({ text: 'Server connection error.', type: 'error' });
    }
    setLoading(false);
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg({ text: '', type: '' });

    if (!otp || otp.length < 4) {
      setMsg({ text: 'Kripya sahi 6 ankon ka OTP darj karein.', type: 'error' });
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
          uid: 'reader_' + phone,
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          role: 'reader',
          verified: true
        };

        localStorage.setItem('reader_user', JSON.stringify(userObj));
        localStorage.setItem('shok_user', JSON.stringify(userObj));

        setMsg({ text: 'OTP satyapit! Login safal...', type: 'success' });
        setTimeout(() => {
          router.push('/');
        }, 1000);
      } else {
        setMsg({ text: data.message || 'Galat OTP darj kiya gaya hai.', type: 'error' });
      }
    } catch (err) {
      setMsg({ text: 'Satypan vifal raha.', type: 'error' });
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f2f1ee', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', fontFamily: '"Mukta", system-ui, sans-serif' }}>
      <div style={{ background: '#ffffff', width: '100%', maxWidth: '440px', borderRadius: '14px', border: '1px solid #e3e0da', padding: '32px', boxShadow: '0 8px 30px rgba(0,0,0,0.06)' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ width: '48px', height: '48px', background: '#fff7ed', borderRadius: '12px', display: 'grid', placeItems: 'center', margin: '0 auto 10px', fontSize: '22px', color: '#ea580c', fontWeight: 800 }}>
            द
          </div>
          <h2 style={{ fontSize: '22px', fontWeight: 700, margin: '0 0 4px', color: '#16150f' }}>
            पाठक लॉगिन (Reader Login)
          </h2>
          <p style={{ fontSize: '13px', color: '#8d897f', margin: 0 }}>
            द लोकल लीडर डिजिटल न्यूज़ नेटवर्क
          </p>
        </div>

        {msg.text && (
          <div style={{
            background: msg.type === 'success' ? '#f0fdf4' : '#fef2f2',
            color: msg.type === 'success' ? '#166534' : '#991b1b',
            border: `1px solid ${msg.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
            borderRadius: '8px',
            padding: '10px 14px',
            fontSize: '13px',
            marginBottom: '16px',
            textAlign: 'center'
          }}>
            {msg.text}
          </div>
        )}

        {step === 'details' ? (
          <form onSubmit={handleSendOtp} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '4px' }}>
                पूरा नाम (Full Name) *
              </label>
              <input
                type="text"
                placeholder="अपना पूरा नाम लिखें"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '4px' }}>
                ईमेल आईडी (Email Address) *
              </label>
              <input
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '4px' }}>
                मोबाइल नंबर (Text SMS OTP प्राप्त करने हेतु) *
              </label>
              <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #cbd5e1', borderRadius: '8px', overflow: 'hidden' }}>
                <span style={{ background: '#f8fafc', padding: '10px 12px', fontSize: '14px', fontWeight: 600, color: '#475569', borderRight: '1px solid #cbd5e1' }}>+91</span>
                <input
                  type="tel"
                  maxLength={10}
                  placeholder="10 अंकों का मोबाइल नंबर"
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
                fontWeight: 700,
                cursor: 'pointer',
                marginTop: '6px'
              }}
            >
              {loading ? 'SMS OTP भेजा जा रहा है...' : '💬 Text SMS द्वारा OTP प्राप्त करें'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ textAlign: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '13.5px', color: '#64748b' }}>
                नंबर <b>+91 {phone}</b> पर प्राप्त 6 अंकों का OTP दर्ज करें
              </span>
              <button
                type="button"
                onClick={() => setStep('details')}
                style={{ display: 'block', margin: '4px auto 0', background: 'none', border: 'none', color: '#ea580c', fontSize: '12px', cursor: 'pointer', fontWeight: 600 }}
              >
                नंबर / विवरण बदलें
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
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              {loading ? 'जाँच की जा रही है...' : '✓ OTP सत्यापित करें और लॉगिन हों'}
            </button>
          </form>
        )}

        <div style={{ marginTop: '24px', textAlign: 'center', borderTop: '1px solid #e3e0da', paddingTop: '16px' }}>
          <Link href="/" style={{ color: '#64748b', fontSize: '13px', textDecoration: 'none' }}>
            ← होम पेज पर वापस जाएं
          </Link>
        </div>

      </div>
    </div>
  );
}