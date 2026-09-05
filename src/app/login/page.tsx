'use client';
import { useState } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ReaderLoginPage() {
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
        collection(db, 'readers'),
        where('email', '==', email.trim().toLowerCase()),
        where('password', '==', password.trim())
      );
      const snap = await getDocs(q);

      if (snap.empty) {
        alert('ईमेल या पासवर्ड गलत है।');
        setLoading(false);
        return;
      }

      const readerDoc = snap.docs[0];
      const data = readerDoc.data();

      localStorage.setItem('reader_user', JSON.stringify({
        id: readerDoc.id,
        name: data.name || 'Reader',
        email: data.email
      }));

      alert(`नमस्ते, ${data.name || 'पाठक'}! आपका लॉगिन सफल हुआ।`);
      router.push('/');
    } catch (err: any) {
      alert('Login Error: ' + err.message);
    }
    setLoading(false);
  };

  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert(`पासवर्ड रीसेट लिंक आपके ईमेल (${forgotEmail}) पर भेज दिया गया है।`);
    setShowForgotModal(false);
    setForgotEmail('');
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 16px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div style={{ background: '#ffffff', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', width: '100%', maxWidth: '420px', padding: '36px', border: '1px solid #e2e8f0' }}>
        
        {/* Brand Icon & Heading */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ width: '48px', height: '48px', background: '#fff7ed', borderRadius: '12px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#ea580c', fontSize: '24px', fontWeight: 900, marginBottom: '10px' }}>
            द
          </div>
          <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#1e293b', margin: 0 }}>पाठक लॉगिन (Reader Login)</h2>
          <p style={{ fontSize: '12.5px', color: '#64748b', margin: '4px 0 0 0' }}>द लोकल लीडर डिजिटल न्यूज़ नेटवर्क</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>Email Address</label>
            <input 
              type="email" 
              required 
              placeholder="algogrowth2@gmail.com" 
              value={email} 
              onChange={e => setEmail(e.target.value)}
              style={{ width: '100%', padding: '11px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px', outline: 'none', background: '#f8fafc', boxSizing: 'border-box' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>Password</label>
            <input 
              type="password" 
              required 
              placeholder="••••••••" 
              value={password} 
              onChange={e => setPassword(e.target.value)}
              style={{ width: '100%', padding: '11px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px', outline: 'none', background: '#f8fafc', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ textAlign: 'right', marginTop: '-4px' }}>
            <span 
              onClick={() => setShowForgotModal(true)} 
              style={{ fontSize: '12px', color: '#ea580c', cursor: 'pointer', fontWeight: 600 }}
            >
              Forgot Password?
            </span>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            style={{ 
              marginTop: '6px', 
              background: '#ea580c', 
              color: '#ffffff', 
              border: 'none', 
              borderRadius: '8px', 
              padding: '12px', 
              fontWeight: 700, 
              fontSize: '14px', 
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(234, 88, 12, 0.3)'
            }}
          >
            {loading ? 'प्रमाणीकरण हो रहा है...' : 'Sign In'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '13px', color: '#475569' }}>
          Don't have an account? <Link href="/register" style={{ color: '#ea580c', textDecoration: 'none', fontWeight: 700 }}>Sign Up</Link>
          <div style={{ marginTop: '12px' }}>
            <Link href="/" style={{ color: '#64748b', textDecoration: 'none', fontSize: '12px' }}>
              ← होम पेज पर वापस जाएं
            </Link>
          </div>
        </div>

      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <form onSubmit={handleForgotSubmit} style={{ background: '#fff', padding: '28px', borderRadius: '12px', width: '100%', maxWidth: '380px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 8px 0', color: '#1e293b' }}>पासवर्ड रीसेट करें</h3>
            <p style={{ fontSize: '12.5px', color: '#64748b', margin: '0 0 16px 0' }}>अपना पंजीकृत ईमेल दर्ज करें, पासवर्ड रीसेट लिंक भेज दिया जाएगा।</p>
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