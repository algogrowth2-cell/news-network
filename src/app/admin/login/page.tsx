'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('admin@news.com');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Agar pehle se logged in hai toh direct dashboard par bhej do
    if (typeof window !== 'undefined') {
      const user = localStorage.getItem('admin_user');
      const token = localStorage.getItem('admin_token');
      if (user && token) {
        router.replace('/admin');
      }
    }
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    // Super Admin Credentials Check (Aap is password ko yahan se customize bhi kar sakte hain)
    const validEmail = 'admin@news.com';
    const validPassword = 'admin@password123'; // Super Admin Master Password

    setTimeout(() => {
      if (email.trim().toLowerCase() === validEmail && password === validPassword) {
        // Success: Store Session & Token
        localStorage.setItem('admin_token', 'admin-session-' + Date.now());
        localStorage.setItem(
          'admin_user',
          JSON.stringify({
            email: email.trim().toLowerCase(),
            role: 'SUPER_ADMIN',
            name: 'Super Admin',
            loggedInAt: new Date().toISOString()
          })
        );
        router.push('/admin');
      } else {
        setErrorMsg('गलत ईमेल आईडी या पासवर्ड! कृपया सही क्रेडेंशियल्स दर्ज करें।');
        setLoading(false);
      }
    }, 600);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#090d16', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      
      <div style={{ width: '100%', maxWidth: '420px', background: '#0d1322', border: '1px solid #1e293b', borderRadius: '14px', padding: '32px 28px', boxShadow: '0 20px 40px rgba(0,0,0,0.6)' }}>
        
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ width: '48px', height: '48px', background: '#2563eb', borderRadius: '12px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '24px', fontWeight: 800, marginBottom: '12px', boxShadow: '0 8px 16px rgba(37,99,235,0.3)' }}>
            ✎
          </div>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#ffffff', margin: '0 0 6px 0', letterSpacing: '0.5px' }}>
            NewsAdmin Panel
          </h1>
          <p style={{ fontSize: '12.5px', color: '#94a3b8', margin: 0 }}>
            Enter your credentials to access the CMS
          </p>
        </div>

        {/* Error Notification */}
        {errorMsg && (
          <div style={{ background: '#450a0a', border: '1px solid #991b1b', color: '#fca5a5', padding: '10px 14px', borderRadius: '8px', fontSize: '12px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>⚠️</span>
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#cbd5e1', marginBottom: '6px' }}>
              Admin Email ID
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@news.com"
              style={{
                width: '100%',
                padding: '11px 14px',
                background: '#131b2e',
                border: '1px solid #334155',
                borderRadius: '8px',
                color: '#ffffff',
                fontSize: '13.5px',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label style={{ fontSize: '12px', fontWeight: 700, color: '#cbd5e1' }}>
                Password
              </label>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ background: 'none', border: 'none', color: '#38bdf8', fontSize: '11px', cursor: 'pointer', padding: 0 }}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              style={{
                width: '100%',
                padding: '11px 14px',
                background: '#131b2e',
                border: '1px solid #334155',
                borderRadius: '8px',
                color: '#ffffff',
                fontSize: '13.5px',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Quick Default Credential Hint Box */}
          <div style={{ background: '#1e293b', padding: '10px 12px', borderRadius: '6px', fontSize: '11.5px', color: '#94a3b8', lineHeight: '1.5' }}>
            <span style={{ color: '#38bdf8', fontWeight: 700 }}>Default Login:</span><br />
            ID: <b style={{ color: '#fff' }}>admin@news.com</b><br />
            Password: <b style={{ color: '#fff' }}>admin@password123</b>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px',
              background: loading ? '#1d4ed8' : '#2563eb',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 800,
              cursor: loading ? 'not-allowed' : 'pointer',
              marginTop: '4px',
              boxShadow: '0 4px 12px rgba(37,99,235,0.4)',
              transition: 'background 0.2s'
            }}
          >
            {loading ? 'Authenticating...' : 'Sign In to Dashboard →'}
          </button>
        </form>

        <div style={{ marginTop: '24px', textAlign: 'center', borderTop: '1px solid #1e293b', paddingTop: '16px' }}>
          <Link href="/" style={{ color: '#64748b', fontSize: '12px', textDecoration: 'none' }}>
            ← Return to Public Portal
          </Link>
        </div>

      </div>

    </div>
  );
}