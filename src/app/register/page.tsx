'use client';
import { useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ReaderRegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    mobile: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await addDoc(collection(db, 'readers'), {
        ...formData,
        email: formData.email.trim().toLowerCase(),
        role: 'reader',
        createdAt: serverTimestamp()
      });

      localStorage.setItem('reader_user', JSON.stringify({
        name: formData.name,
        email: formData.email
      }));

      alert('आपका खाता सफलतापूर्वक बन गया है!');
      router.push('/');
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 16px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div style={{ background: '#ffffff', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', width: '100%', maxWidth: '420px', padding: '36px', border: '1px solid #e2e8f0' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ width: '48px', height: '48px', background: '#fff7ed', borderRadius: '12px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#ea580c', fontSize: '24px', fontWeight: 900, marginBottom: '10px' }}>
            द
          </div>
          <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#1e293b', margin: 0 }}>पाठक पंजीकरण (Sign Up)</h2>
          <p style={{ fontSize: '12.5px', color: '#64748b', margin: '4px 0 0 0' }}>ताज़ा खबरों और पसंदीदा लेखों के लिए रजिस्टर करें</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>Full Name</label>
            <input 
              type="text" 
              required 
              placeholder="आपका पूरा नाम" 
              value={formData.name} 
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px', outline: 'none', background: '#f8fafc', boxSizing: 'border-box' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>Email Address</label>
            <input 
              type="email" 
              required 
              placeholder="you@example.com" 
              value={formData.email} 
              onChange={e => setFormData({ ...formData, email: e.target.value })}
              style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px', outline: 'none', background: '#f8fafc', boxSizing: 'border-box' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>Password</label>
            <input 
              type="password" 
              required 
              placeholder="न्यूनतम 6 अक्षर" 
              value={formData.password} 
              onChange={e => setFormData({ ...formData, password: e.target.value })}
              style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px', outline: 'none', background: '#f8fafc', boxSizing: 'border-box' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>Mobile (Optional)</label>
            <input 
              type="tel" 
              placeholder="10 अंकों का मोबाइल नंबर" 
              value={formData.mobile} 
              onChange={e => setFormData({ ...formData, mobile: e.target.value })}
              style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px', outline: 'none', background: '#f8fafc', boxSizing: 'border-box' }}
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            style={{ 
              marginTop: '8px', 
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
            {loading ? 'अकाउंट बन रहा है...' : 'Create Account'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '13px', color: '#475569' }}>
          Already have an account? <Link href="/login" style={{ color: '#ea580c', textDecoration: 'none', fontWeight: 700 }}>Sign In</Link>
        </div>

      </div>
    </div>
  );
}