'use client';
import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function PatrakarDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('सभी');

  useEffect(() => {
    async function checkStatus() {
      const cached = localStorage.getItem('patrakar_user');
      if (!cached) {
        router.push('/patrakar/login');
        return;
      }
      const parsed = JSON.parse(cached);

      try {
        const snap = await getDoc(doc(db, 'reporters', parsed.id));
        if (snap.exists()) {
          const freshData = snap.data();
          const updatedUser = { id: snap.id, ...freshData };
          setUser(updatedUser);
          localStorage.setItem('patrakar_user', JSON.stringify(updatedUser));
        } else {
          setUser(parsed);
        }
      } catch (e) {
        setUser(parsed);
      }
      setLoading(false);
    }
    checkStatus();
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('patrakar_user');
    router.push('/patrakar/login');
  };

  if (loading) {
    return <div style={{ padding: '60px', textAlign: 'center' }}>सत्यापन हो रहा है...</div>;
  }

  // 1. Pending Approval Screen (Matching Screenshot 9eece3)
  if (user?.status === 'pending') {
    return (
      <div style={{ minHeight: '100vh', background: '#ffffff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        <div style={{ textAlign: 'center', maxWidth: '400px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', border: '3px solid #ea580c', color: '#ea580c', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', marginBottom: '16px' }}>
            🕒
          </div>
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#1e293b', margin: '0 0 8px 0' }}>
            समीक्षा प्रतीक्षित
          </h2>
          <p style={{ fontSize: '13px', color: '#64748b', lineHeight: '1.6', margin: 0 }}>
            आपका आवेदन अभी समीक्षा में है। स्वीकृति मिलने पर आपको सूचित किया जाएगा।
          </p>
          <div style={{ marginTop: '24px' }}>
            <button onClick={handleLogout} style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>
              लॉग आउट करें
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 2. Approved Dashboard Screen (Matching Screenshot 9eeda1)
  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      
      {/* Top Header */}
      <header style={{ background: '#ffffff', borderBottom: '1px solid #e2e8f0', padding: '12px 24px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '38px', height: '38px', background: '#fff7ed', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ea580c', fontSize: '18px' }}>
              📰
            </div>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#1e293b' }}>पत्रकार पोर्टल</div>
              <div style={{ fontSize: '11px', color: '#94a3b8' }}>PTR260002</div>
            </div>
          </div>

          <button onClick={handleLogout} style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
            [→ लॉग आउट
          </button>
        </div>
      </header>

      {/* Navigation Sub-bar */}
      <div style={{ background: '#ffffff', borderBottom: '1px solid #e2e8f0', padding: '8px 24px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', gap: '12px' }}>
          <button style={{ background: '#ea580c', color: '#fff', border: 'none', borderRadius: '6px', padding: '6px 14px', fontSize: '13px', fontWeight: 600 }}>
            📄 डैशबोर्ड
          </button>
          <button onClick={() => router.push('/patrakar/submissions/new')} style={{ background: 'none', border: 'none', color: '#64748b', padding: '6px 14px', fontSize: '13px', cursor: 'pointer' }}>
            + नया लेख
          </button>
          <button style={{ background: 'none', border: 'none', color: '#64748b', padding: '6px 14px', fontSize: '13px', cursor: 'pointer' }}>
            🪪 ID कार्ड
          </button>
          <button style={{ background: 'none', border: 'none', color: '#64748b', padding: '6px 14px', fontSize: '13px', cursor: 'pointer' }}>
            👤 प्रोफ़ाइल
          </button>
        </div>
      </div>

      {/* Main Panel Content */}
      <main style={{ maxWidth: '1100px', margin: '28px auto', padding: '0 20px' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#1e293b', margin: 0 }}>नमस्ते, {user?.name || 'pankaj'}</h1>
            <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0 0' }}>{user?.name} · · {user?.city || 'indore'}</p>
          </div>

          <button onClick={() => router.push('/patrakar/submissions/new')} style={{ background: '#ea580c', color: '#fff', border: 'none', borderRadius: '6px', padding: '10px 18px', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}>
            + नया लेख जमा करें
          </button>
        </div>

        {/* 3 Metric Summary Boxes */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '44px', height: '44px', background: '#eff6ff', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6', fontSize: '20px' }}>
              📄
            </div>
            <div>
              <div style={{ fontSize: '22px', fontWeight: 800, color: '#1e293b' }}>0</div>
              <div style={{ fontSize: '12px', color: '#64748b' }}>कुल लेख</div>
            </div>
          </div>

          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '44px', height: '44px', background: '#ecfdf5', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981', fontSize: '20px' }}>
              ✔️
            </div>
            <div>
              <div style={{ fontSize: '22px', fontWeight: 800, color: '#1e293b' }}>0</div>
              <div style={{ fontSize: '12px', color: '#64748b' }}>स्वीकृत</div>
            </div>
          </div>

          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '44px', height: '44px', background: '#f5f3ff', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8b5cf6', fontSize: '20px' }}>
              👁️
            </div>
            <div>
              <div style={{ fontSize: '22px', fontWeight: 800, color: '#1e293b' }}>0</div>
              <div style={{ fontSize: '12px', color: '#64748b' }}>कुल व्यूज़</div>
            </div>
          </div>
        </div>

        {/* Tab Filters */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          {['सभी', 'ड्राफ्ट', 'समीक्षा में', 'स्वीकृत', 'अस्वीकृत', 'संशोधन आवश्यक'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                background: activeTab === tab ? '#ea580c' : '#ffffff',
                color: activeTab === tab ? '#fff' : '#64748b',
                border: '1px solid #e2e8f0',
                borderRadius: '6px',
                padding: '6px 14px',
                fontSize: '12.5px',
                cursor: 'pointer',
                fontWeight: activeTab === tab ? 700 : 500
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Empty State Box */}
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '60px 20px', textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>
          कोई लेख नहीं मिला
        </div>

      </main>
    </div>
  );
}