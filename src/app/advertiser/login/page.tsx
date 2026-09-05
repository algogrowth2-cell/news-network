'use client';
import { useState } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AdvertiserLogin() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const q = query(
        collection(db, 'advertisers'),
        where('email', '==', email.trim()),
        where('password', '==', password.trim())
      );
      const snap = await getDocs(q);

      if (snap.empty) {
        alert('अमान्य ईमेल या पासवर्ड');
        setLoading(false);
        return;
      }

      const docItem = snap.docs[0];
      const data = docItem.data();

      localStorage.setItem('advertiser_user', JSON.stringify({
        id: docItem.id,
        name: data.contactPerson || data.companyName || 'Advertiser',
        email: data.email,
        status: data.status || 'pending'
      }));

      router.push('/advertiser/dashboard');
    } catch (err: any) {
      alert('Login Error: ' + err.message);
    }
    setLoading(false);
  };

  const handleForgotPassword = (e: React.FormEvent) => {
    e.preventDefault();
    alert(`पासवर्ड रीसेट लिंक आपके ईमेल (${forgotEmail}) पर भेज दिया गया है।`);
    setShowForgotModal(false);
    setForgotEmail('');
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px 16px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div style={{ background: '#ffffff', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', width: '100%', maxWidth: '440px', padding: '36px', position: 'relative' }}>
        
        <div style={{ position: 'absolute', top: '24px', right: '24px' }}>
          <button type="button" style={{ border: '1px solid #ea580c', color: '#ea580c', background: '#fff', borderRadius: '20px', padding: '4px 12px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
            文A English
          </button>
        </div>

        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ width: '48px', height: '48px', background: '#fff7ed', borderRadius: '12px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#ea580c', fontSize: '22px', marginBottom: '10px' }}>
            📢
          </div>
          <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#1e293b', margin: 0 }}>विज्ञापनदाता पोर्टल</h2>
          <div style={{ fontSize: '13px', color: '#ea580c', fontWeight: 600, marginTop: '2px' }}>Advertiser Portal</div>
          <p style={{ fontSize: '12.5px', color: '#64748b', margin: '4px 0 0 0' }}>अपने खाते में लॉगिन करें</p>
        </div>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>ईमेल पता</label>
            <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0 12px' }}>
              <span style={{ color: '#94a3b8' }}>✉️</span>
              <input 
                type="email" 
                required 
                placeholder="you@example.com" 
                value={email} 
                onChange={e => setEmail(e.target.value)}
                style={{ width: '100%', padding: '11px', border: 'none', outline: 'none', fontSize: '13.5px' }}
              />
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>पासवर्ड</label>
              <span onClick={() => setShowForgotModal(true)} style={{ fontSize: '11.5px', color: '#ea580c', cursor: 'pointer', fontWeight: 600 }}>
                पासवर्ड भूल गए?
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0 12px' }}>
              <span style={{ color: '#94a3b8' }}>🔒</span>
              <input 
                type="password" 
                required 
                placeholder="••••••••" 
                value={password} 
                onChange={e => setPassword(e.target.value)}
                style={{ width: '100%', padding: '11px', border: 'none', outline: 'none', fontSize: '13.5px' }}
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            style={{ marginTop: '8px', background: '#ea580c', color: '#fff', border: 'none', borderRadius: '8px', padding: '12px', fontWeight: 700, fontSize: '14px', cursor: 'pointer' }}
          >
            {loading ? 'लॉगिन हो रहा है...' : 'लॉगिन करें'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '13px' }}>
          नया विज्ञापनदाता हैं? <Link href="/advertiser/register" style={{ color: '#ea580c', textDecoration: 'none', fontWeight: 700 }}>रजिस्टर करें</Link>
          <div style={{ marginTop: '12px' }}>
            <Link href="/" style={{ color: '#64748b', textDecoration: 'none', fontSize: '12px' }}>
              ← समाचार साइट पर वापस जाएं
            </Link>
          </div>
        </div>

      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <form onSubmit={handleForgotPassword} style={{ background: '#fff', padding: '28px', borderRadius: '12px', width: '100%', maxWidth: '380px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 8px 0', color: '#1e293b' }}>पासवर्ड रीसेट करें</h3>
            <p style={{ fontSize: '12.5px', color: '#64748b', margin: '0 0 16px 0' }}>अपना पंजीकृत ईमेल पता दर्ज करें, हम आपको रीसेट लिंक भेजेंगे।</p>
            <input 
              type="email" 
              required 
              placeholder="you@example.com" 
              value={forgotEmail} 
              onChange={e => setForgotEmail(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13.5px', outline: 'none', marginBottom: '16px', boxSizing: 'border-box' }}
            />
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setShowForgotModal(false)} style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', padding: '8px 14px', borderRadius: '6px', fontSize: '13px', cursor: 'pointer' }}>रद्द करें</button>
              <button type="submit" style={{ background: '#ea580c', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>लिंक भेजें</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}