'use client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RestrictedAdvertiserPage() {
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem('advertiser_user');
    router.push('/advertiser/login');
  };

  return (
    <div style={{ minHeight: '100vh', background: '#ffffff', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      
      {/* Header */}
      <header style={{ background: '#ffffff', borderBottom: '1px solid #e2e8f0', padding: '12px 24px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '38px', height: '38px', background: '#fff7ed', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ea580c', fontSize: '18px' }}>
              📢
            </div>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#1e293b' }}>विज्ञापनदाता पोर्टल</div>
              <div style={{ fontSize: '11px', color: '#94a3b8' }}>User</div>
            </div>
          </div>

          <button onClick={handleLogout} style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '13px', cursor: 'pointer' }}>
            [→ लॉग आउट
          </button>
        </div>
      </header>

      {/* Sub Nav */}
      <div style={{ background: '#ffffff', borderBottom: '1px solid #e2e8f0', padding: '8px 24px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', gap: '12px' }}>
          <Link href="/advertiser/dashboard" style={{ color: '#64748b', textDecoration: 'none', padding: '6px 14px', fontSize: '13px' }}>
            🪟 डैशबोर्ड
          </Link>
          <button style={{ background: '#ea580c', color: '#fff', border: 'none', borderRadius: '6px', padding: '6px 14px', fontSize: '13px', fontWeight: 600 }}>
            + नया विज्ञापन
          </button>
        </div>
      </div>

      {/* Restriction Notice Box (Matching Screenshot aaa85e) */}
      <main style={{ maxWidth: '800px', margin: '60px auto', padding: '0 20px' }}>
        <div style={{ border: '1px solid #cbd5e1', borderRadius: '12px', padding: '48px 24px', textAlign: 'center' }}>
          <p style={{ fontSize: '14.5px', color: '#334155', margin: '0 0 16px 0', fontWeight: 500 }}>
            विज्ञापन जमा करने के लिए आपके खाते की स्वीकृति आवश्यक है।
          </p>
          <Link href="/advertiser/dashboard" style={{ color: '#ea580c', textDecoration: 'none', fontSize: '13.5px', fontWeight: 700 }}>
            डैशबोर्ड पर वापस जाएं
          </Link>
        </div>
      </main>

    </div>
  );
}