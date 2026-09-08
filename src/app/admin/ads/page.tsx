'use client';
import { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function AdminAdsPage() {
  const [ads, setAds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'ads'), (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setAds(list);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleStatus = async (id: string, status: string) => {
    try {
      await updateDoc(doc(db, 'ads', id), { status });
      alert(`विज्ञापन स्थिति बदलकर "${status}" कर दी गई है!`);
    } catch (e: any) {
      alert('Error: ' + e.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('क्या आप वाकई इस विज्ञापन को डिलीट करना चाहते हैं?')) {
      await deleteDoc(doc(db, 'ads', id));
    }
  };

  return (
    <div style={{ padding: '24px', color: '#fff', background: '#0b1329', minHeight: '100vh' }}>
      <h1 style={{ fontSize: '22px', fontWeight: 800, marginBottom: '18px' }}>
        विज्ञापन प्रबंधन (Ads & Revenue) - {ads.length}
      </h1>

      <div style={{ background: '#111c38', borderRadius: '12px', border: '1px solid #1e293b', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #1e293b', background: '#0b1120', color: '#94a3b8' }}>
              <th style={{ padding: '14px 16px' }}>Banner</th>
              <th style={{ padding: '14px 16px' }}>Ad Name / Client</th>
              <th style={{ padding: '14px 16px' }}>Zone</th>
              <th style={{ padding: '14px 16px' }}>Status</th>
              <th style={{ padding: '14px 16px' }}>Target Link</th>
              <th style={{ padding: '14px 16px', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ padding: '24px', textAlign: 'center', color: '#94a3b8' }}>Loading Ads...</td></tr>
            ) : ads.length === 0 ? (
              <tr><td colSpan={6} style={{ padding: '24px', textAlign: 'center', color: '#94a3b8' }}>No ads found.</td></tr>
            ) : (
              ads.map((ad) => {
                const isActive = (ad.status || '').toLowerCase() === 'active';
                return (
                  <tr key={ad.id} style={{ borderBottom: '1px solid #1e293b' }}>
                    <td style={{ padding: '12px 16px' }}>
                      <img src={ad.imageUrl} alt={ad.name} style={{ height: '40px', maxWidth: '100px', objectFit: 'cover', borderRadius: '4px' }} />
                    </td>
                    <td style={{ padding: '12px 16px', fontWeight: 600 }}>{ad.name || 'Ad Banner'}</td>
                    <td style={{ padding: '12px 16px', color: '#38bdf8' }}>{ad.zone || 'Leaderboard'}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        padding: '3px 10px',
                        borderRadius: '12px',
                        fontSize: '11px',
                        fontWeight: 700,
                        background: isActive ? '#064e3b' : '#451a03',
                        color: isActive ? '#34d399' : '#fbbf24'
                      }}>
                        {isActive ? 'Active (Live)' : 'Pending Approval'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', color: '#94a3b8', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {ad.targetUrl || '-'}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      {!isActive ? (
                        <button
                          onClick={() => handleStatus(ad.id, 'active')}
                          style={{ background: '#15803d', color: '#fff', border: 'none', padding: '5px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 700, marginRight: '8px' }}
                        >
                          ✓ Approve Ad
                        </button>
                      ) : (
                        <button
                          onClick={() => handleStatus(ad.id, 'paused')}
                          style={{ background: '#475569', color: '#fff', border: 'none', padding: '5px 10px', borderRadius: '6px', cursor: 'pointer', marginRight: '8px' }}
                        >
                          Pause
                        </button>
                      )}
                      <button onClick={() => handleDelete(ad.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontWeight: 600 }}>
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}