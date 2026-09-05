'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import styles from '../Admin.module.css';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { login } = useAuth();

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await login(email, password);
      const userRef = await getDoc(doc(db, 'users', res.user.uid));
      
      if (userRef.exists() && (userRef.data().role === 'super_admin' || userRef.data().role === 'admin')) {
        router.push('/admin');
      } else {
        setError('Access Denied: You do not have Super Admin permissions.');
      }
    } catch (err: any) {
      setError(err.message || 'Invalid admin credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', background: '#0f172a' }}>
      <form onSubmit={handleAdminLogin} className={styles.formCard} style={{ width: '380px' }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div className={styles.logoBadge} style={{ width: '42px', height: '42px', margin: '0 auto 12px', fontSize: '20px' }}>N</div>
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#fff' }}>NewsAdmin Control Panel</h2>
          <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>Restricted access for network staff only</p>
        </div>

        {error && <div style={{ color: '#ef4444', fontSize: '13px', background: '#450a0a', padding: '8px 12px', borderRadius: '4px', marginBottom: '16px' }}>{error}</div>}

        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>Admin Email ID</label>
          <input 
            type="email" 
            required 
            className={styles.inputControl} 
            value={email} 
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@newsnetwork.com" 
          />
        </div>

        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>Password</label>
          <input 
            type="password" 
            required 
            className={styles.inputControl} 
            value={password} 
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••" 
          />
        </div>

        <button type="submit" disabled={loading} className={styles.btnPrimary} style={{ width: '100%', marginTop: '8px' }}>
          {loading ? 'Authenticating...' : 'Sign In to Portal'}
        </button>
      </form>
    </div>
  );
}