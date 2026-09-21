'use client';

import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { 
  collection, 
  onSnapshot, 
  doc, 
  updateDoc, 
  deleteDoc, 
  addDoc, 
  serverTimestamp 
} from 'firebase/firestore';

interface AdItem {
  id: string;
  name: string;
  zone: string;
  type: string;
  device: string;
  status: 'active' | 'paused';
  priority: number;
  impressions: number;
  clicks: number;
  advertiserName?: string;
  budget?: string | number;
  targetUrl?: string;
  imageUrl?: string;
}

export default function AdsRevenuePage() {
  const [activeTab, setActiveTab] = useState<'ads' | 'create' | 'advertisers' | 'requests' | 'revenue'>('ads');
  const [ads, setAds] = useState<AdItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const [formData, setFormData] = useState({
    name: '',
    zone: 'header-leaderboard',
    type: 'image',
    device: 'all',
    priority: 1,
    targetUrl: '',
    imageUrl: '',
    advertiserName: '',
    budget: '5000'
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setLoading(true);
    const unsub1 = onSnapshot(
      collection(db, 'advertisements'),
      (snapshot) => {
        if (!snapshot.empty) {
          const list: AdItem[] = snapshot.docs.map((d) => {
            const data = d.data();
            return {
              id: d.id,
              name: data.name || data.title || 'Untitled Ad',
              zone: data.zone || data.adZone || 'header-leaderboard',
              type: data.type || 'image',
              device: data.device || 'all',
              status: data.status === 'paused' ? 'paused' : 'active',
              priority: Number(data.priority) || 1,
              impressions: Number(data.impressions ?? data.views ?? data.impressionCount ?? data.viewsCount ?? 0),
              clicks: Number(data.clicks ?? data.clickCount ?? 0),
              advertiserName: data.advertiserName || data.clientName || '',
              budget: data.budget || 5000,
              targetUrl: data.targetUrl || '',
              imageUrl: data.imageUrl || ''
            };
          });
          setAds(list);
          setLoading(false);
        } else {
          const unsub2 = onSnapshot(collection(db, 'ads'), (snap2) => {
            const list2: AdItem[] = snap2.docs.map((d) => {
              const data = d.data();
              return {
                id: d.id,
                name: data.name || data.title || 'Untitled Ad',
                zone: data.zone || data.adZone || 'header-leaderboard',
                type: data.type || 'image',
                device: data.device || 'all',
                status: data.status === 'paused' ? 'paused' : 'active',
                priority: Number(data.priority) || 1,
                impressions: Number(data.impressions ?? data.views ?? data.impressionCount ?? data.viewsCount ?? 0),
                clicks: Number(data.clicks ?? data.clickCount ?? 0),
                advertiserName: data.advertiserName || data.clientName || '',
                budget: data.budget || 5000,
                targetUrl: data.targetUrl || '',
                imageUrl: data.imageUrl || ''
              };
            });
            setAds(list2);
            setLoading(false);
          });
          return () => unsub2();
        }
      },
      (error) => {
        console.error('Firestore Read Error:', error);
        setLoading(false);
      }
    );

    return () => unsub1();
  }, []);

  const handleToggleStatus = async (id: string, currentStatus: 'active' | 'paused') => {
    try {
      const nextStatus = currentStatus === 'active' ? 'paused' : 'active';
      try {
        await updateDoc(doc(db, 'advertisements', id), { status: nextStatus });
      } catch {
        await updateDoc(doc(db, 'ads', id), { status: nextStatus });
      }
    } catch (err: any) {
      alert('Status change error: ' + err.message);
    }
  };

  const handleDeleteAd = async (id: string, name: string) => {
    if (!confirm(`Kya aap "${name}" ko delete karna chahte hain?`)) return;
    try {
      try {
        await deleteDoc(doc(db, 'advertisements', id));
      } catch {
        await deleteDoc(doc(db, 'ads', id));
      }
    } catch (err: any) {
      alert('Delete error: ' + err.message);
    }
  };

  const handleCreateAd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      alert('Kripya Ad ka naam darj karein.');
      return;
    }

    try {
      setSubmitting(true);
      await addDoc(collection(db, 'advertisements'), {
        name: formData.name,
        zone: formData.zone,
        type: formData.type,
        device: formData.device,
        status: 'active',
        priority: Number(formData.priority) || 1,
        impressions: 0,
        clicks: 0,
        imageUrl: formData.imageUrl,
        targetUrl: formData.targetUrl,
        advertiserName: formData.advertiserName,
        budget: formData.budget,
        createdAt: serverTimestamp()
      });

      setFormData({
        name: '',
        zone: 'header-leaderboard',
        type: 'image',
        device: 'all',
        priority: 1,
        targetUrl: '',
        imageUrl: '',
        advertiserName: '',
        budget: '5000'
      });
      setSubmitting(false);
      setActiveTab('ads');
    } catch (err: any) {
      setSubmitting(false);
      alert('Ad create error: ' + err.message);
    }
  };

  const uniqueAdvertisers = Array.from(new Set(ads.map((a) => a.advertiserName).filter(Boolean)));

  return (
    <div style={{ backgroundColor: '#070b14', minHeight: '100vh', padding: '28px', color: '#e2e8f0', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Title */}
      <div style={{ marginBottom: '22px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#ffffff', margin: '0 0 6px 0' }}>Ads & Revenue</h1>
        <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0 }}>Review advertiser registrations and approve sponsored banners</p>
      </div>

      {/* Tabs Bar */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '24px' }}>
        <button
          type="button"
          onClick={() => setActiveTab('ads')}
          style={{
            backgroundColor: activeTab === 'ads' ? '#1d4ed8' : '#111827',
            color: activeTab === 'ads' ? '#ffffff' : '#94a3b8',
            border: '1px solid #1f293d',
            borderRadius: '8px',
            padding: '8px 16px',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          Ads ({ads.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('create')}
          style={{
            backgroundColor: activeTab === 'create' ? '#1d4ed8' : '#111827',
            color: activeTab === 'create' ? '#ffffff' : '#94a3b8',
            border: '1px solid #1f293d',
            borderRadius: '8px',
            padding: '8px 16px',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          Create Ad
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('advertisers')}
          style={{
            backgroundColor: activeTab === 'advertisers' ? '#1d4ed8' : '#111827',
            color: activeTab === 'advertisers' ? '#ffffff' : '#94a3b8',
            border: '1px solid #1f293d',
            borderRadius: '8px',
            padding: '8px 16px',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          Advertisers ({uniqueAdvertisers.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('requests')}
          style={{
            backgroundColor: activeTab === 'requests' ? '#1d4ed8' : '#111827',
            color: activeTab === 'requests' ? '#ffffff' : '#94a3b8',
            border: '1px solid #1f293d',
            borderRadius: '8px',
            padding: '8px 16px',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          Requests (0)
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('revenue')}
          style={{
            backgroundColor: activeTab === 'revenue' ? '#1d4ed8' : '#111827',
            color: activeTab === 'revenue' ? '#ffffff' : '#94a3b8',
            border: '1px solid #1f293d',
            borderRadius: '8px',
            padding: '8px 16px',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          Revenue Config
        </button>
      </div>

      {/* Main Table Content */}
      {activeTab === 'ads' && (
        <div style={{ backgroundColor: '#0e1626', border: '1px solid #1e293b', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 10px 25px rgba(0,0,0,0.4)' }}>
          {loading ? (
            <div style={{ padding: '60px', textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>
              Firebase se data load ho raha hai...
            </div>
          ) : ads.length === 0 ? (
            <div style={{ padding: '60px', textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>
              Koi ads nahi mile. 'Create Ad' tab se naya Ad banayein.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#0a101d', borderBottom: '1px solid #1e293b', color: '#94a3b8', textTransform: 'uppercase', fontSize: '11px', letterSpacing: '0.5px' }}>
                    <th style={{ padding: '14px 20px', fontWeight: 600 }}>Name</th>
                    <th style={{ padding: '14px 20px', fontWeight: 600 }}>Zone</th>
                    <th style={{ padding: '14px 20px', fontWeight: 600 }}>Type</th>
                    <th style={{ padding: '14px 20px', fontWeight: 600 }}>Device</th>
                    <th style={{ padding: '14px 20px', fontWeight: 600 }}>Status</th>
                    <th style={{ padding: '14px 20px', fontWeight: 600, textAlign: 'center' }}>Priority</th>
                    <th style={{ padding: '14px 20px', fontWeight: 600 }}>Served</th>
                    <th style={{ padding: '14px 20px', fontWeight: 600, textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {ads.map((ad, idx) => (
                    <tr 
                      key={ad.id} 
                      style={{ 
                        borderBottom: idx === ads.length - 1 ? 'none' : '1px solid #162238',
                        backgroundColor: 'transparent'
                      }}
                    >
                      <td style={{ padding: '14px 20px', color: '#ffffff', fontWeight: 500 }}>
                        <div>{ad.name}</div>
                        {ad.advertiserName && (
                          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>{ad.advertiserName}</div>
                        )}
                      </td>

                      <td style={{ padding: '14px 20px', color: '#94a3b8', fontFamily: 'monospace', fontSize: '12px' }}>
                        {ad.zone}
                      </td>

                      <td style={{ padding: '14px 20px', color: '#cbd5e1', textTransform: 'capitalize' }}>
                        {ad.type}
                      </td>

                      <td style={{ padding: '14px 20px', color: '#94a3b8', textTransform: 'capitalize' }}>
                        {ad.device}
                      </td>

                      <td style={{ padding: '14px 20px' }}>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '3px 10px',
                            borderRadius: '20px',
                            fontSize: '11px',
                            fontWeight: 600,
                            textTransform: 'capitalize',
                            backgroundColor: ad.status === 'active' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                            color: ad.status === 'active' ? '#34d399' : '#fbbf24',
                            border: `1px solid ${ad.status === 'active' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`
                          }}
                        >
                          {ad.status}
                        </span>
                      </td>

                      <td style={{ padding: '14px 20px', textAlign: 'center', color: '#cbd5e1', fontWeight: 600 }}>
                        {ad.priority}
                      </td>

                      <td style={{ padding: '14px 20px', fontSize: '12px', color: '#94a3b8', lineHeight: '1.4' }}>
                        <div style={{ fontWeight: 600, color: ad.impressions > 0 ? '#38bdf8' : '#94a3b8' }}>{ad.impressions} impr</div>
                        <div style={{ color: ad.clicks > 0 ? '#34d399' : '#64748b' }}>{ad.clicks} clicks</div>
                      </td>

                      <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', alignItems: 'center' }}>
                          <button
                            type="button"
                            onClick={() => alert(`Ad ID: ${ad.id}\nName: ${ad.name}\nZone: ${ad.zone}`)}
                            title="Edit Ad"
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#38bdf8', padding: '4px', display: 'flex' }}
                          >
                            <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleToggleStatus(ad.id, ad.status)}
                            title={ad.status === 'active' ? 'Pause Ad' : 'Activate Ad'}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#fbbf24', padding: '4px', display: 'flex' }}
                          >
                            {ad.status === 'active' ? (
                              <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <rect x="6" y="4" width="4" height="16" rx="1" />
                                <rect x="14" y="4" width="4" height="16" rx="1" />
                              </svg>
                            ) : (
                              <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteAd(ad.id, ad.name)}
                            title="Delete Ad"
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#f43f5e', padding: '4px', display: 'flex' }}
                          >
                            <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Create Ad */}
      {activeTab === 'create' && (
        <div style={{ backgroundColor: '#0e1626', border: '1px solid #1e293b', borderRadius: '12px', padding: '24px', maxWidth: '650px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#ffffff', margin: '0 0 18px 0' }}>Naya Advertisement Banayein</h2>
          <form onSubmit={handleCreateAd} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '6px' }}>Ad Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Business Promotion - Header Ad"
                style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#162238', border: '1px solid #27354f', borderRadius: '6px', padding: '9px 12px', color: '#ffffff', fontSize: '13px' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '6px' }}>Placement Zone</label>
                <select
                  value={formData.zone}
                  onChange={(e) => setFormData({ ...formData, zone: e.target.value })}
                  style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#162238', border: '1px solid #27354f', borderRadius: '6px', padding: '9px 12px', color: '#ffffff', fontSize: '13px' }}
                >
                  <option value="header-leaderboard">header-leaderboard</option>
                  <option value="sidebar-top">sidebar-top</option>
                  <option value="sidebar-middle">sidebar-middle</option>
                  <option value="in-article-1">in-article-1</option>
                  <option value="in-article-2">in-article-2</option>
                  <option value="footer-banner">footer-banner</option>
                  <option value="popup">popup</option>
                  <option value="breaking-below">breaking-below</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '6px' }}>Device Targeting</label>
                <select
                  value={formData.device}
                  onChange={(e) => setFormData({ ...formData, device: e.target.value })}
                  style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#162238', border: '1px solid #27354f', borderRadius: '6px', padding: '9px 12px', color: '#ffffff', fontSize: '13px' }}
                >
                  <option value="all">all</option>
                  <option value="mobile">mobile</option>
                  <option value="desktop">desktop</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '6px' }}>Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#162238', border: '1px solid #27354f', borderRadius: '6px', padding: '9px 12px', color: '#ffffff', fontSize: '13px' }}
                >
                  <option value="image">image</option>
                  <option value="google-adsense">google-adsense</option>
                  <option value="custom-html">custom-html</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '6px' }}>Priority (1 to 10)</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: Number(e.target.value) })}
                  style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#162238', border: '1px solid #27354f', borderRadius: '6px', padding: '9px 12px', color: '#ffffff', fontSize: '13px' }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '6px' }}>Target Click URL</label>
              <input
                type="url"
                value={formData.targetUrl}
                onChange={(e) => setFormData({ ...formData, targetUrl: e.target.value })}
                placeholder="https://clientwebsite.com"
                style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#162238', border: '1px solid #27354f', borderRadius: '6px', padding: '9px 12px', color: '#ffffff', fontSize: '13px' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '6px' }}>Banner Image URL</label>
              <input
                type="text"
                value={formData.imageUrl}
                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                placeholder="https://..."
                style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#162238', border: '1px solid #27354f', borderRadius: '6px', padding: '9px 12px', color: '#ffffff', fontSize: '13px' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
              <button
                type="button"
                onClick={() => setActiveTab('ads')}
                style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #334155', backgroundColor: '#1e293b', color: '#94a3b8', cursor: 'pointer', fontSize: '13px' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                style={{ padding: '8px 18px', borderRadius: '6px', border: 'none', backgroundColor: '#2563eb', color: '#ffffff', fontWeight: 600, cursor: 'pointer', fontSize: '13px', opacity: submitting ? 0.6 : 1 }}
              >
                {submitting ? 'Save ho raha hai...' : 'Save & Publish Ad'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tab 3: Advertisers */}
      {activeTab === 'advertisers' && (
        <div style={{ backgroundColor: '#0e1626', border: '1px solid #1e293b', borderRadius: '12px', padding: '24px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#ffffff', margin: '0 0 16px 0' }}>Registered Advertisers ({uniqueAdvertisers.length})</h2>
          {uniqueAdvertisers.length === 0 ? (
            <p style={{ color: '#94a3b8', fontSize: '13px' }}>Abhi koi advertiser data linked nahi hai.</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '16px' }}>
              {uniqueAdvertisers.map((adv, idx) => (
                <div key={idx} style={{ backgroundColor: '#162238', border: '1px solid #27354f', borderRadius: '8px', padding: '16px' }}>
                  <p style={{ fontWeight: 600, color: '#ffffff', margin: '0 0 4px 0' }}>{adv}</p>
                  <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0 }}>Active campaign linked</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Requests */}
      {activeTab === 'requests' && (
        <div style={{ backgroundColor: '#0e1626', border: '1px solid #1e293b', borderRadius: '12px', padding: '40px', textAlign: 'center' }}>
          <p style={{ fontSize: '16px', fontWeight: 600, color: '#ffffff', margin: '0 0 6px 0' }}>Pending Ad Approvals</p>
          <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0 }}>Sabhi live requests approve ho chuki hain.</p>
        </div>
      )}

      {/* Tab 5: Revenue Config */}
      {activeTab === 'revenue' && (
        <div style={{ backgroundColor: '#0e1626', border: '1px solid #1e293b', borderRadius: '12px', padding: '24px', maxWidth: '550px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#ffffff', margin: '0 0 16px 0' }}>Banner Slot Pricing Settings</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #1e293b' }}>
              <span style={{ color: '#cbd5e1' }}>Header Leaderboard (Monthly)</span>
              <span style={{ fontWeight: 600, color: '#34d399' }}>₹15,000</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #1e293b' }}>
              <span style={{ color: '#cbd5e1' }}>Sidebar Top Slot</span>
              <span style={{ fontWeight: 600, color: '#34d399' }}>₹8,000</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #1e293b' }}>
              <span style={{ color: '#cbd5e1' }}>In-Article Inline Ad</span>
              <span style={{ fontWeight: 600, color: '#34d399' }}>₹5,000</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}