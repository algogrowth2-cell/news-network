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

  // Form State for "Create Ad"
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

  // 1. Dynamic Firestore Fetch (Auto-detects ads or advertisements collection)
  useEffect(() => {
    setLoading(true);

    // Primary check on 'advertisements'
    const unsubscribe1 = onSnapshot(
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
              impressions: Number(data.impressions || data.views || 0),
              clicks: Number(data.clicks || 0),
              advertiserName: data.advertiserName || data.clientName || '',
              budget: data.budget || 5000,
              targetUrl: data.targetUrl || '',
              imageUrl: data.imageUrl || ''
            };
          });
          setAds(list);
          setLoading(false);
        } else {
          // Fallback check on 'ads' collection
          const unsubscribe2 = onSnapshot(collection(db, 'ads'), (snap2) => {
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
                impressions: Number(data.impressions || data.views || 0),
                clicks: Number(data.clicks || 0),
                advertiserName: data.advertiserName || data.clientName || '',
                budget: data.budget || 5000,
                targetUrl: data.targetUrl || '',
                imageUrl: data.imageUrl || ''
              };
            });
            setAds(list2);
            setLoading(false);
          });
          return () => unsubscribe2();
        }
      },
      (error) => {
        console.error('Firestore Read Error:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe1();
  }, []);

  // 2. Toggle Status (Active / Paused)
  const handleToggleStatus = async (id: string, currentStatus: 'active' | 'paused') => {
    try {
      const nextStatus = currentStatus === 'active' ? 'paused' : 'active';
      // Pehle advertisements try karega
      try {
        await updateDoc(doc(db, 'advertisements', id), { status: nextStatus });
      } catch {
        await updateDoc(doc(db, 'ads', id), { status: nextStatus });
      }
    } catch (err: any) {
      alert('Status change error: ' + err.message);
    }
  };

  // 3. Delete Ad
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

  // 4. Create New Ad
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
    <div style={{ backgroundColor: '#090e17', minHeight: '100vh' }} className="w-full text-slate-200 p-6">
      {/* Title */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white tracking-wide">Ads & Revenue</h1>
        <p className="text-xs text-slate-400 mt-1">Review advertiser registrations and approve sponsored banners</p>
      </div>

      {/* Tabs Header */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        <button
          type="button"
          onClick={() => setActiveTab('ads')}
          style={{ backgroundColor: activeTab === 'ads' ? '#1d4ed8' : '#111827' }}
          className={`px-4 py-2 text-sm font-semibold rounded-md transition ${
            activeTab === 'ads' ? 'text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          Ads ({ads.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('create')}
          style={{ backgroundColor: activeTab === 'create' ? '#1d4ed8' : '#111827' }}
          className={`px-4 py-2 text-sm font-semibold rounded-md transition ${
            activeTab === 'create' ? 'text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          Create Ad
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('advertisers')}
          style={{ backgroundColor: activeTab === 'advertisers' ? '#1d4ed8' : '#111827' }}
          className={`px-4 py-2 text-sm font-semibold rounded-md transition ${
            activeTab === 'advertisers' ? 'text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          Advertisers ({uniqueAdvertisers.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('requests')}
          style={{ backgroundColor: activeTab === 'requests' ? '#1d4ed8' : '#111827' }}
          className={`px-4 py-2 text-sm font-semibold rounded-md transition ${
            activeTab === 'requests' ? 'text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          Requests (0)
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('revenue')}
          style={{ backgroundColor: activeTab === 'revenue' ? '#1d4ed8' : '#111827' }}
          className={`px-4 py-2 text-sm font-semibold rounded-md transition ${
            activeTab === 'revenue' ? 'text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          Revenue Config
        </button>
      </div>

      {/* Tab 1: Ads Table */}
      {activeTab === 'ads' && (
        <div style={{ backgroundColor: '#0f172a', borderColor: '#1e293b' }} className="w-full border rounded-lg overflow-hidden shadow-xl">
          {loading ? (
            <div className="p-12 text-center text-slate-400 text-sm">
              <p>Firebase se data load ho raha hai...</p>
            </div>
          ) : ads.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-sm">
              <p>Koi ad nahi mila. Create Ad tab se pehla Ad create karein.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr style={{ backgroundColor: '#090e17', borderColor: '#1e293b' }} className="border-b text-slate-400 text-xs font-semibold">
                    <th className="py-3 px-5">Name</th>
                    <th className="py-3 px-5">Zone</th>
                    <th className="py-3 px-5">Type</th>
                    <th className="py-3 px-5">Device</th>
                    <th className="py-3 px-5">Status</th>
                    <th className="py-3 px-5 text-center">Priority</th>
                    <th className="py-3 px-5">Served</th>
                    <th className="py-3 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {ads.map((ad) => (
                    <tr key={ad.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3 px-5 font-medium text-white whitespace-nowrap">
                        <div>{ad.name}</div>
                        {ad.advertiserName && (
                          <span className="text-[11px] text-slate-500">{ad.advertiserName}</span>
                        )}
                      </td>
                      <td className="py-3 px-5 text-slate-400 font-mono text-xs whitespace-nowrap">
                        {ad.zone}
                      </td>
                      <td className="py-3 px-5 text-slate-300 capitalize">
                        {ad.type}
                      </td>
                      <td className="py-3 px-5 text-slate-400 capitalize">
                        {ad.device}
                      </td>
                      <td className="py-3 px-5 whitespace-nowrap">
                        <span
                          style={{
                            backgroundColor: ad.status === 'active' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                            color: ad.status === 'active' ? '#34d399' : '#fbbf24',
                            border: `1px solid ${ad.status === 'active' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`
                          }}
                          className="px-2.5 py-0.5 rounded text-xs font-medium"
                        >
                          {ad.status}
                        </span>
                      </td>
                      <td className="py-3 px-5 text-center text-slate-300">
                        {ad.priority}
                      </td>
                      <td className="py-3 px-5 text-xs text-slate-400 whitespace-nowrap">
                        <div>{ad.impressions} impr</div>
                        <div className="text-slate-500">{ad.clicks} clicks</div>
                      </td>
                      <td className="py-3 px-5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-3">
                          {/* Edit */}
                          <button
                            type="button"
                            onClick={() => alert(`Edit config for: ${ad.name}`)}
                            title="Edit Ad"
                            className="text-sky-400 hover:text-sky-300"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>

                          {/* Pause / Play */}
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(ad.id, ad.status)}
                            title={ad.status === 'active' ? 'Pause Ad' : 'Activate Ad'}
                            className="text-amber-400 hover:text-amber-300"
                          >
                            {ad.status === 'active' ? (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <rect x="6" y="4" width="4" height="16" rx="1" />
                                <rect x="14" y="4" width="4" height="16" rx="1" />
                              </svg>
                            ) : (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            )}
                          </button>

                          {/* Delete */}
                          <button
                            type="button"
                            onClick={() => handleDeleteAd(ad.id, ad.name)}
                            title="Delete Ad"
                            className="text-rose-400 hover:text-rose-300"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
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

      {/* Tab 2: Create Ad Form */}
      {activeTab === 'create' && (
        <div style={{ backgroundColor: '#0f172a', borderColor: '#1e293b' }} className="border rounded-lg p-6 max-w-2xl mx-auto shadow-xl">
          <h2 className="text-lg font-bold text-white mb-4">Naya Advertisement Banayein</h2>
          <form onSubmit={handleCreateAd} className="space-y-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Ad Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Business Promotion - Header Ad"
                style={{ backgroundColor: '#1e293b' }}
                className="w-full border border-slate-700 rounded px-3 py-2 text-sm text-white focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Placement Zone</label>
                <select
                  value={formData.zone}
                  onChange={(e) => setFormData({ ...formData, zone: e.target.value })}
                  style={{ backgroundColor: '#1e293b' }}
                  className="w-full border border-slate-700 rounded px-3 py-2 text-sm text-white focus:outline-none"
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
                <label className="block text-xs text-slate-400 mb-1">Device Targeting</label>
                <select
                  value={formData.device}
                  onChange={(e) => setFormData({ ...formData, device: e.target.value })}
                  style={{ backgroundColor: '#1e293b' }}
                  className="w-full border border-slate-700 rounded px-3 py-2 text-sm text-white focus:outline-none"
                >
                  <option value="all">all</option>
                  <option value="mobile">mobile</option>
                  <option value="desktop">desktop</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  style={{ backgroundColor: '#1e293b' }}
                  className="w-full border border-slate-700 rounded px-3 py-2 text-sm text-white focus:outline-none"
                >
                  <option value="image">image</option>
                  <option value="google-adsense">google-adsense</option>
                  <option value="custom-html">custom-html</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Priority (1 to 10)</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: Number(e.target.value) })}
                  style={{ backgroundColor: '#1e293b' }}
                  className="w-full border border-slate-700 rounded px-3 py-2 text-sm text-white focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Target Click URL</label>
              <input
                type="url"
                value={formData.targetUrl}
                onChange={(e) => setFormData({ ...formData, targetUrl: e.target.value })}
                placeholder="https://clientwebsite.com"
                style={{ backgroundColor: '#1e293b' }}
                className="w-full border border-slate-700 rounded px-3 py-2 text-sm text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Banner Image URL</label>
              <input
                type="text"
                value={formData.imageUrl}
                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                placeholder="https://..."
                style={{ backgroundColor: '#1e293b' }}
                className="w-full border border-slate-700 rounded px-3 py-2 text-sm text-white focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={() => setActiveTab('ads')}
                className="px-4 py-2 text-sm rounded bg-slate-800 text-slate-300 hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 text-sm font-semibold rounded bg-blue-600 text-white hover:bg-blue-500 transition disabled:opacity-50"
              >
                {submitting ? 'Save ho raha hai...' : 'Save & Publish Ad'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tab 3: Advertisers */}
      {activeTab === 'advertisers' && (
        <div style={{ backgroundColor: '#0f172a', borderColor: '#1e293b' }} className="border rounded-lg p-6 shadow-xl">
          <h2 className="text-lg font-bold text-white mb-4">Registered Advertisers ({uniqueAdvertisers.length})</h2>
          {uniqueAdvertisers.length === 0 ? (
            <p className="text-sm text-slate-400">Abhi koi advertiser data registered nahi hai.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {uniqueAdvertisers.map((adv, idx) => (
                <div key={idx} style={{ backgroundColor: '#1e293b' }} className="p-4 rounded border border-slate-700">
                  <p className="font-semibold text-white">{adv}</p>
                  <p className="text-xs text-slate-400 mt-1">Active campaign linked</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Requests */}
      {activeTab === 'requests' && (
        <div style={{ backgroundColor: '#0f172a', borderColor: '#1e293b' }} className="border rounded-lg p-8 text-center text-slate-400 shadow-xl">
          <p className="text-base font-semibold text-white">Pending Ad Approvals</p>
          <p className="text-xs text-slate-500 mt-1">Sabhi live requests approve ho chuki hain.</p>
        </div>
      )}

      {/* Tab 5: Revenue Config */}
      {activeTab === 'revenue' && (
        <div style={{ backgroundColor: '#0f172a', borderColor: '#1e293b' }} className="border rounded-lg p-6 max-w-xl shadow-xl">
          <h2 className="text-lg font-bold text-white mb-4">Banner Slot Pricing Settings</h2>
          <div className="space-y-4 text-sm">
            <div className="flex justify-between items-center py-2 border-b border-slate-800">
              <span className="text-slate-300">Header Leaderboard (Monthly)</span>
              <span className="font-semibold text-emerald-400">₹15,000</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-slate-800">
              <span className="text-slate-300">Sidebar Top Slot</span>
              <span className="font-semibold text-emerald-400">₹8,000</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-slate-800">
              <span className="text-slate-300">In-Article Inline Ad</span>
              <span className="font-semibold text-emerald-400">₹5,000</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}