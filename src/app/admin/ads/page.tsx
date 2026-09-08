'use client';
import { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function AdminAdsPage() {
  const [activeTab, setActiveTab] = useState<'ads' | 'advertisers'>('ads');
  const [ads, setAds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'ads'), (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setAds(list);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleStatus = async (id: string, newStatus: string) => {
    setActionLoading(id);
    try {
      await updateDoc(doc(db, 'ads', id), { 
        status: newStatus 
      });
    } catch (e: any) {
      alert('Status update error: ' + e.message);
    }
    setActionLoading(null);
  };

  const handleDelete = async (id: string) => {
    if (confirm('क्या आप वाकई इस विज्ञापन को डिलीट करना चाहते हैं?')) {
      await deleteDoc(doc(db, 'ads', id));
    }
  };

  return (
    <div style={{ padding: '24px', color: '#fff', background: '#0b1329', minHeight: '100vh', fontFamily: 'system-ui, sans-serif' }}>
      
      {/* Page Header */}
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 800, margin: '0 0 6px 0' }}>
          Ads & Revenue Management
        </h1>
        <p style={{ margin: 0, fontSize: '13px', color: '#94a3b8' }}>
          Review advertiser registrations and approve sponsored banners
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button
          onClick={() => setActiveTab('ads')}
          style={{
            background: activeTab === 'ads' ? '#2563eb' : '#1e293b',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            padding: '8px 16px',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer'
          }}
        >
          Ads ({ads.length})
        </button>
      </div>

      {/* Table Card */}
      <div style={{ background: '#111c38', borderRadius: '12px', border: '1px solid #1e293b', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #1e293b', background: '#0b1120', color: '#94a3b8' }}>
                <th style={{ padding: '14px 16px' }}>Ad Name</th>
                <th style={{ padding: '14px 16px' }}>Zone</th>
                <th style={{ padding: '14px 16px' }}>Budget</th>
                <th style={{ padding: '14px 16px' }}>Status</th>
                <th style={{ padding: '14px 16px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} style={{ padding: '24px', textAlign: 'center', color: '#94a3b8' }}>
                    विज्ञापन लोड हो रहे हैं...
                  </td>
                </tr>
              ) : ads.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: '24px', textAlign: 'center', color: '#94a3b8' }}>
                    कोई विज्ञापन नहीं मिला।
                  </td>
                </tr>
              ) : (
                ads.map((ad) => {
                  const rawStatus = (ad.status || '').toLowerCase().trim();
                  const isActive = rawStatus === 'active';

                  return (
                    <tr key={ad.id} style={{ borderBottom: '1px solid #1e293b' }}>
                      <td style={{ padding: '14px 16px', fontWeight: 600, color: '#f8fafc' }}>
                        {ad.name || 'Ad Banner'}
                      </td>

                      <td style={{ padding: '14px 16px', color: '#38bdf8' }}>
                        {ad.zone || 'Leaderboard'}
                      </td>

                      <td style={{ padding: '14px 16px' }}>
                        ₹{ad.budget || 5000}
                      </td>

                      <td style={{ padding: '14px 16px' }}>
                        <span style={{
                          padding: '3px 10px',
                          borderRadius: '12px',
                          fontSize: '11px',
                          fontWeight: 700,
                          background: isActive ? '#064e3b' : '#451a03',
                          color: isActive ? '#34d399' : '#fbbf24'
                        }}>
                          {isActive ? 'active' : 'paused'}
                        </span>
                      </td>

                      <td style={{ padding: '14px 16px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                        {!isActive ? (
                          <button
                            onClick={() => handleStatus(ad.id, 'active')}
                            disabled={actionLoading === ad.id}
                            style={{
                              background: 'transparent',
                              color: '#22c55e',
                              border: '1px solid #22c55e',
                              padding: '5px 12px',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontWeight: 700,
                              fontSize: '12px',
                              marginRight: '10px'
                            }}
                          >
                            {actionLoading === ad.id ? '...' : 'Approve Ad'}
                          </button>
                        ) : (
                          <button
                            onClick={() => handleStatus(ad.id, 'paused')}
                            disabled={actionLoading === ad.id}
                            style={{
                              background: 'transparent',
                              color: '#f97316',
                              border: '1px solid #f97316',
                              padding: '5px 12px',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontWeight: 700,
                              fontSize: '12px',
                              marginRight: '10px'
                            }}
                          >
                            {actionLoading === ad.id ? '...' : 'Pause Ad'}
                          </button>
                        )}

                        <button
                          onClick={() => handleDelete(ad.id)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#ef4444',
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontWeight: 600
                          }}
                        >
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

    </div>
  );
}