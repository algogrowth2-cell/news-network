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
  serverTimestamp, 
  query, 
  orderBy 
} from 'firebase/firestore';

interface AdItem {
  id: string;
  name: string;
  zone: string;
  type: string;
  device: string;
  status: 'active' | 'paused';
  priority: number;
  impressions?: number;
  clicks?: number;
  imageUrl?: string;
  targetUrl?: string;
  advertiserName?: string;
  budget?: number | string;
  createdAt?: any;
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

  // 1. Dynamic Real-time Fetch from Firestore
  useEffect(() => {
    setLoading(true);
    const q = query(collection(db, 'advertisements'), orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetchedAds: AdItem[] = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            name: data.name || 'Untitled Ad',
            zone: data.zone || 'header-leaderboard',
            type: data.type || 'image',
            device: data.device || 'all',
            status: data.status === 'paused' ? 'paused' : 'active',
            priority: Number(data.priority) || 1,
            impressions: Number(data.impressions) || 0,
            clicks: Number(data.clicks) || 0,
            imageUrl: data.imageUrl || '',
            targetUrl: data.targetUrl || '',
            advertiserName: data.advertiserName || '',
            budget: data.budget || 0
          };
        });
        setAds(fetchedAds);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching ads:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // 2. Toggle Status (Active / Paused) in Firestore
  const handleToggleStatus = async (id: string, currentStatus: 'active' | 'paused') => {
    try {
      const nextStatus = currentStatus === 'active' ? 'paused' : 'active';
      const adRef = doc(db, 'advertisements', id);
      await updateDoc(adRef, { status: nextStatus });
    } catch (err: any) {
      alert('Status update karne me samasya aayi: ' + err.message);
    }
  };

  // 3. Delete Ad from Firestore
  const handleDeleteAd = async (id: string, name: string) => {
    if (!confirm(`Kya aap "${name}" ko delete karna chahte hain?`)) return;
    try {
      await deleteDoc(doc(db, 'advertisements', id));
    } catch (err: any) {
      alert('Delete karne me truti hui: ' + err.message);
    }
  };

  // 4. Create New Ad Submit Handler
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

      // Reset form & redirect back to table
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
      alert('Ad create karne me error: ' + err.message);
    }
  };

  // Extract unique advertisers dynamically
  const uniqueAdvertisers = Array.from(
    new Set(ads.map((a) => a.advertiserName).filter(Boolean))
  );

  return (
    <div className="w-full min-h-screen bg-[#080d19] text-slate-200 p-6">
      {/* Top Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-wide text-white">Ads & Revenue</h1>
        <p className="text-xs text-slate-400 mt-1">Review advertiser registrations and manage sponsored banners dynamically</p>
      </div>

      {/* Tabs Header */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        <button
          onClick={() => setActiveTab('ads')}
          className={`px-4 py-2 text-sm font-semibold rounded-lg transition ${
            activeTab === 'ads'
              ? 'bg-[#1e5eff] text-white shadow-md'
              : 'bg-[#111827] text-slate-400 hover:text-white hover:bg-[#162035]'
          }`}
        >
          Ads ({ads.length})
        </button>

        <button
          onClick={() => setActiveTab('create')}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition ${
            activeTab === 'create'
              ? 'bg-[#1e5eff] text-white'
              : 'bg-[#111827] text-slate-400 hover:text-white hover:bg-[#162035]'
          }`}
        >
          Create Ad
        </button>

        <button
          onClick={() => setActiveTab('advertisers')}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition ${
            activeTab === 'advertisers'
              ? 'bg-[#1e5eff] text-white'
              : 'bg-[#111827] text-slate-400 hover:text-white hover:bg-[#162035]'
          }`}
        >
          Advertisers ({uniqueAdvertisers.length})
        </button>

        <button
          onClick={() => setActiveTab('requests')}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition ${
            activeTab === 'requests'
              ? 'bg-[#1e5eff] text-white'
              : 'bg-[#111827] text-slate-400 hover:text-white hover:bg-[#162035]'
          }`}
        >
          Requests (0)
        </button>

        <button
          onClick={() => setActiveTab('revenue')}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition ${
            activeTab === 'revenue'
              ? 'bg-[#1e5eff] text-white'
              : 'bg-[#111827] text-slate-400 hover:text-white hover:bg-[#162035]'
          }`}
        >
          Revenue Config
        </button>
      </div>

      {/* Tab 1: Ads Table (Dynamic Data) */}
      {activeTab === 'ads' && (
        <div className="w-full bg-[#0d1424] border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
          {loading ? (
            <div className="p-16 text-center text-slate-400 text-sm">
              <div className="inline-block w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3"></div>
              <p>Dynamic Ads data load ho raha hai...</p>
            </div>
          ) : ads.length === 0 ? (
            <div className="p-16 text-center text-slate-400 text-sm">
              <p>Koi Ads uplabdh nahi hain. 'Create Ad' par click karke naya ad banayein.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-800/80 bg-[#0a101f] text-slate-400 text-xs font-semibold uppercase tracking-wider">
                    <th className="py-4 px-6">Name</th>
                    <th className="py-4 px-6">Zone</th>
                    <th className="py-4 px-6">Type</th>
                    <th className="py-4 px-6">Device</th>
                    <th className="py-4 px-6">Status</th>
                    <th className="py-4 px-6 text-center">Priority</th>
                    <th className="py-4 px-6">Served</th>
                    <th className="py-4 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {ads.map((ad) => (
                    <tr key={ad.id} className="hover:bg-[#131d33] transition duration-150">
                      {/* Name */}
                      <td className="py-4 px-6 font-medium text-white whitespace-nowrap">
                        <div className="flex flex-col">
                          <span>{ad.name}</span>
                          {ad.advertiserName && (
                            <span className="text-[11px] text-slate-500">{ad.advertiserName}</span>
                          )}
                        </div>
                      </td>

                      {/* Zone */}
                      <td className="py-4 px-6 text-slate-400 font-mono text-xs whitespace-nowrap">
                        {ad.zone}
                      </td>

                      {/* Type */}
                      <td className="py-4 px-6 text-slate-300 capitalize">
                        {ad.type}
                      </td>

                      {/* Device */}
                      <td className="py-4 px-6 text-slate-400 capitalize">
                        {ad.device}
                      </td>

                      {/* Status */}
                      <td className="py-4 px-6 whitespace-nowrap">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            ad.status === 'active'
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                              : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                          }`}
                        >
                          {ad.status}
                        </span>
                      </td>

                      {/* Priority */}
                      <td className="py-4 px-6 text-center font-medium text-slate-300">
                        {ad.priority}
                      </td>

                      {/* Served */}
                      <td className="py-4 px-6 whitespace-nowrap text-xs text-slate-400 leading-relaxed">
                        <div>{ad.impressions || 0} impr</div>
                        {(ad.clicks || 0) > 0 && (
                          <div className="text-slate-500">{ad.clicks} clicks</div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-6 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-3">
                          {/* Edit */}
                          <button
                            onClick={() => alert(`Edit config for: ${ad.name}`)}
                            title="Edit Ad"
                            className="text-sky-400 hover:text-sky-300 p-1 rounded transition"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>

                          {/* Pause / Play */}
                          <button
                            onClick={() => handleToggleStatus(ad.id, ad.status)}
                            title={ad.status === 'active' ? 'Pause Ad' : 'Activate Ad'}
                            className="text-amber-400 hover:text-amber-300 p-1 rounded transition"
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
                            onClick={() => handleDeleteAd(ad.id, ad.name)}
                            title="Delete Ad"
                            className="text-rose-400 hover:text-rose-300 p-1 rounded transition"
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
        <div className="bg-[#0d1424] border border-slate-800 rounded-xl p-6 max-w-2xl mx-auto shadow-xl">
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
                className="w-full bg-[#162035] border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Placement Zone</label>
                <select
                  value={formData.zone}
                  onChange={(e) => setFormData({ ...formData, zone: e.target.value })}
                  className="w-full bg-[#162035] border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
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
                  className="w-full bg-[#162035] border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
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
                  className="w-full bg-[#162035] border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
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
                  className="w-full bg-[#162035] border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
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
                className="w-full bg-[#162035] border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Banner Image URL</label>
              <input
                type="text"
                value={formData.imageUrl}
                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                placeholder="https://..."
                className="w-full bg-[#162035] border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Advertiser Name (Optional)</label>
              <input
                type="text"
                value={formData.advertiserName}
                onChange={(e) => setFormData({ ...formData, advertiserName: e.target.value })}
                placeholder="e.g. Acme Corp"
                className="w-full bg-[#162035] border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={() => setActiveTab('ads')}
                className="px-4 py-2 text-sm rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 text-sm font-semibold rounded-lg bg-[#1e5eff] text-white hover:bg-blue-600 transition disabled:opacity-50"
              >
                {submitting ? 'Save ho raha hai...' : 'Save & Publish Ad'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tab 3: Advertisers */}
      {activeTab === 'advertisers' && (
        <div className="bg-[#0d1424] border border-slate-800 rounded-xl p-8 shadow-xl">
          <h2 className="text-lg font-bold text-white mb-4">Registered Advertisers ({uniqueAdvertisers.length})</h2>
          {uniqueAdvertisers.length === 0 ? (
            <p className="text-sm text-slate-400">Abhi koi advertiser data registered nahi hai.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {uniqueAdvertisers.map((adv, idx) => (
                <div key={idx} className="bg-[#162035] border border-slate-700 p-4 rounded-lg">
                  <p className="font-semibold text-white">{adv}</p>
                  <p className="text-xs text-slate-400 mt-1">Active campaigns linked</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Requests */}
      {activeTab === 'requests' && (
        <div className="bg-[#0d1424] border border-slate-800 rounded-xl p-8 text-center text-slate-400 shadow-xl">
          <p className="text-base font-semibold text-white">Pending Ad Approvals</p>
          <p className="text-xs text-slate-500 mt-1">Sabhi live sponsored requests approve ho chuki hain.</p>
        </div>
      )}

      {/* Tab 5: Revenue Config */}
      {activeTab === 'revenue' && (
        <div className="bg-[#0d1424] border border-slate-800 rounded-xl p-8 max-w-xl shadow-xl">
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