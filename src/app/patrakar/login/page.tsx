'use client';
import { useState } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function PatrakarLogin() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const q = query(
        collection(db, 'reporters'),
        where('email', '==', email.trim()),
        where('password', '==', password.trim())
      );
      const snap = await getDocs(q);

      if (snap.empty) {
        alert('अमान्य ईमेल या पासवर्ड');
        setLoading(false);
        return;
      }

      const userDoc = snap.docs[0];
      const data = userDoc.data();

      localStorage.setItem('patrakar_user', JSON.stringify({
        id: userDoc.id,
        name: data.name,
        email: data.email,
        city: data.city || '',
        status: data.status || 'pending'
      }));

      router.push('/patrakar/dashboard');
    } catch (err: any) {
      alert('Login Error: ' + err.message);
    }
    setLoading(false);
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
            📰
          </div>
          <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#1e293b', margin: 0 }}>पत्रकार पोर्टल</h2>
          <div style={{ fontSize: '13px', color: '#ea580c', fontWeight: 600, marginTop: '2px' }}>Journalist Portal</div>
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
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>पासवर्ड</label>
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
          नया पत्रकार हैं? <Link href="/patrakar/register" style={{ color: '#ea580c', textDecoration: 'none', fontWeight: 700 }}>रजिस्टर करें</Link>
          <div style={{ marginTop: '12px' }}>
            <Link href="/" style={{ color: '#64748b', textDecoration: 'none', fontSize: '12px' }}>
              ← समाचार साइट पर वापस जाएं
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}