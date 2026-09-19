'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function PatrakarLoginPage() {
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
      setMsg({ text: 'Kripya apna naam darj karein.', type: 'error' });
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
        setMsg({ text: 'SMS dwara 6 ankon ka OTP bhej diya gaya hai.', type: 'success' });
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
      setMsg({ text: 'Kripya sahi OTP darj karein.', type: 'error' });
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
          uid: 'patrakar_' + phone,
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          role: 'patrakar',
          verified: true
        };

        localStorage.setItem('patrakar_user', JSON.stringify(userObj));
        setMsg({ text: 'OTP satyapit! Dashboard par bheja ja raha hai...', type: 'success' });
        setTimeout(() => {
          router.push('/patrakar/dashboard');
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
    <div style={{ minHeight: '100vh', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', fontFamily: '"Mukta", system-ui, sans-serif' }}>
      <div style={{ background: '#1e293b', width: '100%', maxWidth: '440px', borderRadius: '14px', border: '1px solid #334155', padding: '32px', color: '#f8fafc', boxShadow: '0 20px 40px rgba(0,0,0,0.3)' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ width: '48px', height: '48px', background: '#3b82f620', border: '1px solid #3b82f640', borderRadius: '12px', display: 'grid', placeItems: 'center', margin: '0 auto 10px', fontSize: '22px', color: '#60a5fa' }}>
            ✍️
          </div>
          <h2 style={{ fontSize: '22px', fontWeight: 700, margin: '0 0 4px', color: '#f8fafc' }}>
            पत्रकार लॉगिन (Reporter Portal)
          </h2>
          <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0 }}>
            खबरें और लेख सबमिट करने हेतु OTP लॉगिन
          </p>
        </div>

        {msg.text && (
          <div style={{
            background: msg.type === 'success' ? '#064e3b' : '#7f1d1d',
            color: msg.type === 'success' ? '#6ee7b7' : '#fca5a5',
            border: `1px solid ${msg.type === 'success' ? '#059669' : '#b91c1c'}`,
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
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '4px', color: '#cbd5e1' }}>
                पूरा नाम *
              </label>
              <input
                type="text"
                placeholder="उदा. पंकज पाटीदार"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', background: '#0f172a', border: '1px solid #334155', color: '#fff', fontSize: '14px', outline: 'none' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '4px', color: '#cbd5e1' }}>
                ईमेल आईडी *
              </label>
              <input
                type="email"
                placeholder="reporter@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', background: '#0f172a', border: '1px solid #334155', color: '#fff', fontSize: '14px', outline: 'none' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '4px', color: '#cbd5e1' }}>
                मोबाइल नंबर (Text SMS OTP हेतु) *
              </label>
              <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #334155', borderRadius: '8px', overflow: 'hidden', background: '#0f172a' }}>
                <span style={{ padding: '10px 12px', fontSize: '14px', fontWeight: 600, color: '#94a3b8', borderRight: '1px solid #334155' }}>+91</span>
                <input
                  type="tel"
                  maxLength={10}
                  placeholder="10 अंकों का मोबाइल नंबर"
                  value={phone}
                  onChange={e => setPhone(e.target.value.replace(/[^0-9]/g, ''))}
                  required
                  style={{ width: '100%', padding: '10px 12px', border: 'none', background: 'transparent', color: '#fff', fontSize: '15px', outline: 'none' }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                background: '#2563eb',
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
              {loading ? 'SMS OTP भेजा जा रहा है...' : '💬 SMS द्वारा OTP प्राप्त करें'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ textAlign: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '13.5px', color: '#94a3b8' }}>
                नंबर <b>+91 {phone}</b> पर भेजा गया OTP दर्ज करें
              </span>
              <button
                type="button"
                onClick={() => setStep('details')}
                style={{ display: 'block', margin: '4px auto 0', background: 'none', border: 'none', color: '#60a5fa', fontSize: '12px', cursor: 'pointer' }}
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
                style={{ width: '100%', padding: '12px', textAlign: 'center', letterSpacing: '8px', fontSize: '22px', fontWeight: 700, borderRadius: '8px', border: '2px solid #3b82f6', background: '#0f172a', color: '#fff', outline: 'none' }}
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
              {loading ? 'जाँच जारी है...' : '✓ OTP सत्यापित करें'}
            </button>
          </form>
        )}

        <div style={{ marginTop: '24px', textAlign: 'center', borderTop: '1px solid #334155', paddingTop: '16px' }}>
          <Link href="/" style={{ color: '#94a3b8', fontSize: '13px', textDecoration: 'none' }}>
            ← होम पेज पर वापस जाएं
          </Link>
        </div>

      </div>
    </div>
  );
}