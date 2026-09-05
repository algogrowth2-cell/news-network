'use client';
import { useEffect, useState } from 'react';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AdvertiserDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [ads, setAds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const cached = localStorage.getItem('advertiser_user');
      if (!cached) {
        router.push('/advertiser/login');
        return;
      }
      const parsed = JSON.parse(cached);

      try {
        const snap = await getDoc(doc(db, 'advertisers', parsed.id));
        if (snap.exists()) {
          const freshData = snap.data();
          const updatedUser = { id: snap.id, ...freshData };
          setUser(updatedUser);
          localStorage.setItem('advertiser_user', JSON.stringify(updatedUser));

          // Fetch advertiser's ad listings
          const adSnap = await getDocs(query(collection(db, 'ads'), where('advertiserId', '==', snap.id)));
          setAds(adSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        } else {
          setUser(parsed);
        }
      } catch (e) {
        setUser(parsed);
      }
      setLoading(false);
    }
    loadData();
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('advertiser_user');
    router.push('/advertiser/login');
  };

  const handleNewAdClick = () => {
    if (user?.status !== 'active') {
      router.push('/advertiser/requests/restricted');
    } else {
      router.push('/advertiser/requests/new');
    }
  };

  if (loading) return <div style={{ padding: '60px', textAlign: 'center' }}>लोड हो रहा है...</div>;

  return (
    <div style={{ minHeight: '100vh', background: '#ffffff', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      
      {/* Top Header */}
      <header style={{ background: '#ffffff', borderBottom: '1px solid #e2e8f0', padding: '12px 24px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '38px', height: '38px', background: '#fff7ed', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ea580c', fontSize: '18px' }}>
              📢
            </div>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#1e293b' }}>विज्ञापनदाता पोर्टल</div>
              <div style={{ fontSize: '11px', color: '#94a3b8' }}>{user?.name || 'User'}</div>
            </div>
          </div>

          <button onClick={handleLogout} style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
            [→ लॉग आउट
          </button>
        </div>
      </header>

      {/* Sub Navigation Bar */}
      <div style={{ background: '#ffffff', borderBottom: '1px solid #e2e8f0', padding: '8px 24px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', gap: '12px' }}>
          <button style={{ background: '#ea580c', color: '#fff', border: 'none', borderRadius: '6px', padding: '6px 14px', fontSize: '13px', fontWeight: 600 }}>
            🪟 डैशबोर्ड
          </button>
          <button onClick={handleNewAdClick} style={{ background: 'none', border: 'none', color: '#64748b', padding: '6px 14px', fontSize: '13px', cursor: 'pointer' }}>
            + नया विज्ञापन
          </button>
        </div>
      </div>

      {/* Main Content */}
      <main style={{ maxWidth: '1100px', margin: '28px auto', padding: '0 20px' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#1e293b', margin: 0 }}>नमस्ते, {user?.name || 'User'}</h1>
          <button onClick={handleNewAdClick} style={{ background: '#ea580c', color: '#fff', border: 'none', borderRadius: '6px', padding: '10px 18px', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}>
            + नया विज्ञापन जमा करें
          </button>
        </div>

        {/* 4 Metric Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '18px', display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '42px', height: '42px', background: '#eff6ff', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6', fontSize: '18px' }}>📢</div>
            <div>
              <div style={{ fontSize: '20px', fontWeight: 800, color: '#1e293b' }}>{ads.filter(a => a.status === 'active').length}/{ads.length}</div>
              <div style={{ fontSize: '11.5px', color: '#64748b' }}>सक्रिय/कुल विज्ञापन</div>
            </div>
          </div>

          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '18px', display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '42px', height: '42px', background: '#f5f3ff', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8b5cf6', fontSize: '18px' }}>👁️</div>
            <div>
              <div style={{ fontSize: '20px', fontWeight: 800, color: '#1e293b' }}>{ads.reduce((acc, curr) => acc + (curr.impressions || 0), 0)}</div>
              <div style={{ fontSize: '11.5px', color: '#64748b' }}>इंप्रेशन</div>
            </div>
          </div>

          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '18px', display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '42px', height: '42px', background: '#ecfdf5', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981', fontSize: '18px' }}>👆</div>
            <div>
              <div style={{ fontSize: '20px', fontWeight: 800, color: '#1e293b' }}>{ads.reduce((acc, curr) => acc + (curr.clicks || 0), 0)}</div>
              <div style={{ fontSize: '11.5px', color: '#64748b' }}>क्लिक्स</div>
            </div>
          </div>

          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '18px', display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '42px', height: '42px', background: '#fff7ed', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ea580c', fontSize: '18px' }}>%</div>
            <div>
              <div style={{ fontSize: '20px', fontWeight: 800, color: '#1e293b' }}>3.51%</div>
              <div style={{ fontSize: '11.5px', color: '#64748b' }}>CTR</div>
            </div>
          </div>
        </div>

        {/* Ad List Card */}
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
          {ads.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>
              अभी कोई सक्रिय विज्ञापन नहीं है। नया विज्ञापन जमा करने के लिए ऊपर दिए बटन पर क्लिक करें।
            </div>
          ) : (
            ads.map(ad => (
              <div key={ad.id} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', borderBottom: '1px solid #f1f5f9' }}>
                <img src={ad.imageUrl || 'https://via.placeholder.com/80x50'} alt={ad.name} style={{ width: '80px', height: '50px', objectFit: 'cover', borderRadius: '6px' }} />
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '10px', background: ad.status === 'active' ? '#ecfdf5' : '#fef3c7', color: ad.status === 'active' ? '#059669' : '#d97706', fontWeight: 700 }}>
                      {ad.status === 'active' ? 'स्वीकृत' : 'समीक्षा में'}
                    </span>
                    <span style={{ fontSize: '12px', color: '#64748b' }}>{ad.zone}</span>
                  </div>
                  <h4 style={{ margin: '4px 0', fontSize: '15px', color: '#1e293b' }}>{ad.name}</h4>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>बजट: ₹{ad.budget || '5000.00'} · {ad.startDate || '03 सित 2026'}</div>
                </div>
              </div>
            ))
          )}
        </div>

      </main>
    </div>
  );
}