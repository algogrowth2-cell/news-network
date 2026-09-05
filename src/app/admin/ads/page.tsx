'use client';
import { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import styles from '../Admin.module.css';

export default function AdsAdminPage() {
  const [activeTab, setActiveTab] = useState<'ads' | 'advertisers'>('ads');
  const [ads, setAds] = useState<any[]>([]);
  const [advertisers, setAdvertisers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const adSnap = await getDocs(collection(db, 'ads'));
      setAds(adSnap.docs.map(d => ({ id: d.id, ...d.data() })));

      const advSnap = await getDocs(collection(db, 'advertisers'));
      setAdvertisers(advSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAdvertiserStatus = async (id: string, newStatus: string) => {
    await updateDoc(doc(db, 'advertisers', id), { status: newStatus });
    alert(`Advertiser status updated to ${newStatus}`);
    loadData();
  };

  const handleAdStatus = async (id: string, newStatus: string) => {
    await updateDoc(doc(db, 'ads', id), { status: newStatus });
    alert(`Ad status updated to ${newStatus}. Approved ads will now show on live website!`);
    loadData();
  };

  return (
    <div style={{ color: '#fff' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700 }}>Ads & Revenue Management</h1>
          <p style={{ fontSize: '13px', color: '#94a3b8' }}>Review advertiser registrations and approve sponsored banners[cite: 1]</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', borderBottom: '1px solid #1e293b', paddingBottom: '8px' }}>
        <button
          onClick={() => setActiveTab('ads')}
          style={{ padding: '6px 14px', borderRadius: '6px', border: 'none', background: activeTab === 'ads' ? '#2563eb' : '#0b1120', color: '#fff', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}
        >
          Ads ({ads.length})
        </button>
        <button
          onClick={() => setActiveTab('advertisers')}
          style={{ padding: '6px 14px', borderRadius: '6px', border: 'none', background: activeTab === 'advertisers' ? '#2563eb' : '#0b1120', color: '#fff', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}
        >
          Advertisers ({advertisers.length})
        </button>
      </div>

      {activeTab === 'ads' && (
        <div className={styles.formCard} style={{ overflowX: 'auto', padding: 0 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13.5px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #1e293b', background: '#0b1120', color: '#94a3b8' }}>
                <th style={{ padding: '14px 16px' }}>Ad Name</th>
                <th style={{ padding: '14px 16px' }}>Zone</th>
                <th style={{ padding: '14px 16px' }}>Budget</th>
                <th style={{ padding: '14px 16px' }}>Status</th>
                <th style={{ padding: '14px 16px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {ads.length === 0 ? (
                <tr><td colSpan={5} style={{ padding: '24px', textAlign: 'center', color: '#94a3b8' }}>No ad requests submitted yet.</td></tr>
              ) : (
                ads.map(ad => (
                  <tr key={ad.id} style={{ borderBottom: '1px solid #1e293b' }}>
                    <td style={{ padding: '12px 16px', fontWeight: 600 }}>{ad.name}</td>
                    <td style={{ padding: '12px 16px', color: '#38bdf8' }}>{ad.zone}</td>
                    <td style={{ padding: '12px 16px' }}>₹{ad.budget || 5000}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '12px', background: ad.status === 'active' ? '#065f46' : '#854d0e', color: ad.status === 'active' ? '#34d399' : '#fde047' }}>
                        {ad.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      {ad.status !== 'active' ? (
                        <button onClick={() => handleAdStatus(ad.id, 'active')} style={{ color: '#22c55e', background: 'none', border: '1px solid #22c55e', padding: '4px 10px', borderRadius: '4px', cursor: 'pointer' }}>
                          Approve Ad
                        </button>
                      ) : (
                        <button onClick={() => handleAdStatus(ad.id, 'paused')} style={{ color: '#f59e0b', background: 'none', border: '1px solid #f59e0b', padding: '4px 10px', borderRadius: '4px', cursor: 'pointer' }}>
                          Pause Ad
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'advertisers' && (
        <div className={styles.formCard} style={{ overflowX: 'auto', padding: 0 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13.5px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #1e293b', background: '#0b1120', color: '#94a3b8' }}>
                <th style={{ padding: '14px 16px' }}>Company</th>
                <th style={{ padding: '14px 16px' }}>Contact Person</th>
                <th style={{ padding: '14px 16px' }}>Email</th>
                <th style={{ padding: '14px 16px' }}>Status</th>
                <th style={{ padding: '14px 16px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {advertisers.length === 0 ? (
                <tr><td colSpan={5} style={{ padding: '24px', textAlign: 'center', color: '#94a3b8' }}>No advertisers registered yet.</td></tr>
              ) : (
                advertisers.map(adv => (
                  <tr key={adv.id} style={{ borderBottom: '1px solid #1e293b' }}>
                    <td style={{ padding: '12px 16px', fontWeight: 600 }}>{adv.companyName}</td>
                    <td style={{ padding: '12px 16px' }}>{adv.contactPerson}</td>
                    <td style={{ padding: '12px 16px', color: '#38bdf8' }}>{adv.email}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '12px', background: adv.status === 'active' ? '#065f46' : '#854d0e', color: adv.status === 'active' ? '#34d399' : '#fde047' }}>
                        {adv.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      {adv.status !== 'active' ? (
                        <button onClick={() => handleAdvertiserStatus(adv.id, 'active')} style={{ color: '#22c55e', background: 'none', border: '1px solid #22c55e', padding: '4px 10px', borderRadius: '4px', cursor: 'pointer' }}>
                          Approve Account
                        </button>
                      ) : (
                        <button onClick={() => handleAdvertiserStatus(adv.id, 'suspended')} style={{ color: '#ef4444', background: 'none', border: '1px solid #ef4444', padding: '4px 10px', borderRadius: '4px', cursor: 'pointer' }}>
                          Suspend
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}