'use client';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState('');
  const { resetPassword } = useAuth();

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await resetPassword(email);
      setMsg('Password reset link sent! Check your inbox.');
    } catch (err: any) {
      setMsg(err.message || 'Error sending link');
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '60px auto', padding: '24px', background: '#fff', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
      <h1 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>Reset Password</h1>
      <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '16px' }}>Enter your registered email to get a reset link.</p>
      
      {msg && <p style={{ color: '#059669', fontSize: '13px', marginBottom: '12px' }}>{msg}</p>}

      <form onSubmit={handleReset}>
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '13px', marginBottom: '4px' }}>Email Address</label>
          <input 
            type="email" 
            required 
            style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '4px' }}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <button type="submit" style={{ width: '100%', padding: '10px', background: '#1f2937', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}>
          Send Reset Link
        </button>
      </form>

      <p style={{ fontSize: '13px', textAlign: 'center', marginTop: '16px' }}>
        Back to <Link href="/login" style={{ color: '#2563eb' }}>Sign In</Link>
      </p>
    </div>
  );
}