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
  status: 'active' | 'paused' | 'pending' | 'rejected';
  priority: number;
  impressions: number;
  clicks: number;
  advertiserName?: string;
  advertiserEmail?: string;
  budget?: string | number;
  targetUrl?: string;
  imageUrl?: string;
  startDate?: string;
  endDate?: string;
}

export default function AdsRevenuePage() {
  const [activeTab, setActiveTab] = useState<'ads' | 'create' | 'advertisers' | 'requests' | 'revenue'>('ads');
  const [ads, setAds] = useState<AdItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const [formData, setFormData] = useState({
    name: '',
    zone: '728x90 Header Leaderboard',
    type: 'image',
    device: 'all',
    priority: 1,
    targetUrl: '',
    imageUrl: '',
    advertiserName: '',
    budget: '5000'
  });
  const [submitting, setSubmitting] = useState(false);

  // 1. Fetch Real-time Ads
  useEffect(() => {
    setLoading(true);
    const unsub = onSnapshot(collection(db, 'ads'), (snap) => {
      const list: AdItem[] = snap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          name: data.name || data.title || 'Untitled Ad',
          zone: data.zone || data.adZone || '728x90 Header Leaderboard',
          type: data.type || 'image',
          device: data.device || 'all',
          status: data.status || 'pending',
          priority: Number(data.priority) || 1,
          impressions: Number(data.impressions ?? data.views ?? 0),
          clicks: Number(data.clicks || 0),
          advertiserName: data.advertiserName || data.clientName || 'Direct Client',
          advertiserEmail: data.advertiserEmail || '',
          budget: data.budget || 5000,
          targetUrl: data.targetUrl || '',
          imageUrl: data.imageUrl || '',
          startDate: data.startDate || '',
          endDate: data.endDate || ''
        };
      });
      setAds(list);
      setLoading(false);
    }, (error) => {
      console.error('Firestore Read Error:', error);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  // 2. Approve Ad Request (Make it Live)
  const handleApproveAd = async (id: string) => {
    try {
      await updateDoc(doc(db, 'ads', id), { 
        status: 'active',
        priority: 1 
      });
      alert('विज्ञापन सफलतापूर्वक लाइव कर दिया गया है!');
    } catch (err: any) {
      alert('Approve error: ' + err.message);
    }
  };

  // 3. Reject Ad Request
  const handleRejectAd = async (id: string) => {
    if (!confirm('क्या आप इस विज्ञापन अनुरोध को अस्वीकार करना चाहते हैं?')) return;
    try {
      await updateDoc(doc(db, 'ads', id), { status: 'rejected' });
    } catch (err: any) {
      alert('Reject error: ' + err.message);
    }
  };

  // 4. Toggle Status (Active / Paused)
  const handleToggleStatus = async (id: string, currentStatus: string) => {
    try {
      const nextStatus = currentStatus === 'active' ? 'paused' : 'active';
      await updateDoc(doc(db, 'ads', id), { status: nextStatus });
    } catch (err: any) {
      alert('Status change error: ' + err.message);
    }
  };

  // 5. Delete Ad
  const handleDeleteAd = async (id: string, name: string) => {
    if (!confirm(`क्या आप "${name}" को हटाना चाहते हैं?`)) return;
    try {
      await deleteDoc(doc(db, 'ads', id));
    } catch (err: any) {
      alert('Delete error: ' + err.message);
    }
  };

  // 6. Admin Create Ad Submit
  const handleCreateAd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      alert('कृपया विज्ञापन का नाम दर्ज करें।');
      return;
    }

    try {
      setSubmitting(true);
      await addDoc(collection(db, 'ads'), {
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
        advertiserName: formData.advertiserName || 'Admin Created',
        budget: formData.budget,
        createdAt: serverTimestamp()
      });

      setFormData({
        name: '',
        zone: '728x90 Header Leaderboard',
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
      alert('Error: ' + err.message);
    }
  };

  const pendingRequests = ads.filter(a => a.status === 'pending');
  const liveAds = ads.filter(a => a.status !== 'pending');
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
          Ads ({liveAds.length})
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
            backgroundColor: activeTab === 'requests' ? '#f59e0b' : '#111827',
            color: activeTab === 'requests' ? '#000000' : '#fbbf24',
            border: '1px solid #f59e0b',
            borderRadius: '8px',
            padding: '8px 16px',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer'
          }}
        >
          Requests ({pendingRequests.length})
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

      {/* TAB 1: ALL LIVE / PAUSED ADS */}
      {activeTab === 'ads' && (
        <div style={{ backgroundColor: '#0e1626', border: '1px solid #1e293b', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 10px 25px rgba(0,0,0,0.4)' }}>
          {loading ? (
            <div style={{ padding: '60px', textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>
              डेटा लोड हो रहा है...
            </div>
          ) : liveAds.length === 0 ? (
            <div style={{ padding: '60px', textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>
              कोई लाइव विज्ञापन उपलब्ध नहीं है।
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
                  {liveAds.map((ad, idx) => (
                    <tr 
                      key={ad.id} 
                      style={{ 
                        borderBottom: idx === liveAds.length - 1 ? 'none' : '1px solid #162238'
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

      {/* TAB 4: ADVERTISER PENDING REQUESTS */}
      {activeTab === 'requests' && (
        <div style={{ backgroundColor: '#0e1626', border: '1px solid #1e293b', borderRadius: '12px', padding: '24px' }}>
          <div style={{ marginBottom: '18px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#ffffff', margin: 0 }}>विज्ञापनदाता अप्रूवल अनुरोध (Pending Requests)</h2>
            <p style={{ fontSize: '12px', color: '#94a3b8', margin: '4px 0 0 0' }}>विज्ञापनदाता पोर्टल से आए नए अनुरोधों को रिव्यू करें और वेबसाइट पर लाइव करें।</p>
          </div>

          {pendingRequests.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', background: '#0a101d', borderRadius: '8px' }}>
              ✓ कोई भी अनुरोध पेंडिंग नहीं है। सभी विज्ञापन स्वीकृत हैं।
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {pendingRequests.map((req) => (
                <div key={req.id} style={{ backgroundColor: '#131d33', border: '1px solid #27354f', borderRadius: '8px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                  
                  <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                    {req.imageUrl && (
                      <img src={req.imageUrl} alt={req.name} style={{ width: '80px', height: '55px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #475569' }} />
                    )}
                    <div>
                      <h4 style={{ margin: '0 0 4px 0', fontSize: '15px', color: '#ffffff' }}>{req.name}</h4>
                      <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                        <span>भेजने वाला: <b style={{ color: '#e2e8f0' }}>{req.advertiserName}</b> ({req.advertiserEmail})</span> · 
                        <span style={{ marginLeft: '6px', color: '#38bdf8' }}>{req.zone}</span>
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                        अवधि: {req.startDate} से {req.endDate} · लिंक: {req.targetUrl}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      type="button"
                      onClick={() => handleApproveAd(req.id)}
                      style={{
                        backgroundColor: '#10b981',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '8px 16px',
                        color: '#ffffff',
                        fontSize: '12.5px',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      ✓ Approve & Live
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRejectAd(req.id)}
                      style={{
                        backgroundColor: '#ef4444',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '8px 14px',
                        color: '#ffffff',
                        fontSize: '12.5px',
                        cursor: 'pointer'
                      }}
                    >
                      अस्वीकार करें
                    </button>
                  </div>

                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: CREATE AD */}
      {activeTab === 'create' && (
        <div style={{ backgroundColor: '#0e1626', border: '1px solid #1e293b', borderRadius: '12px', padding: '24px', maxWidth: '650px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#ffffff', margin: '0 0 18px 0' }}>नया विज्ञापन बनाएं</h2>
          <form onSubmit={handleCreateAd} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '6px' }}>Ad Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Leaderboard Header Ad"
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
                  <option value="728x90 Header Leaderboard">728x90 Header Leaderboard</option>
                  <option value="300x250 (साइडबार)">300x250 (साइडबार)</option>
                  <option value="in-article-1">in-article-1</option>
                  <option value="classifieds-feed">classifieds-feed</option>
                  <option value="popup">popup</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '6px' }}>Priority</label>
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

      {/* TAB 3: ADVERTISERS */}
      {activeTab === 'advertisers' && (
        <div style={{ backgroundColor: '#0e1626', border: '1px solid #1e293b', borderRadius: '12px', padding: '24px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#ffffff', margin: '0 0 16px 0' }}>Registered Advertisers ({uniqueAdvertisers.length})</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '16px' }}>
            {uniqueAdvertisers.map((adv, idx) => (
              <div key={idx} style={{ backgroundColor: '#162238', border: '1px solid #27354f', borderRadius: '8px', padding: '16px' }}>
                <p style={{ fontWeight: 600, color: '#ffffff', margin: '0 0 4px 0' }}>{adv}</p>
                <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0 }}>Active campaigns linked</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: REVENUE CONFIG */}
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
          </div>
        </div>
      )}

    </div>
  );
}