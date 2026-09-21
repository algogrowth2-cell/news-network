'use client';

import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import Link from 'next/link';

interface AdvertiserAd {
  id: string;
  name: string;
  zone: string;
  type: string;
  format: 'banner' | 'sidebar' | 'classified' | 'popup';
  imageUrl: string;
  targetUrl: string;
  startDate: string;
  endDate: string;
  status: 'pending' | 'active' | 'paused' | 'rejected' | 'expired';
  impressions: number;
  clicks: number;
  budget: string | number;
  advertiserEmail: string;
  advertiserName: string;
  createdAt?: any;
}

export default function AdvertiserDashboard() {
  const [activeTab, setActiveTab] = useState<'my-ads' | 'create-ad'>('my-ads');
  const [ads, setAds] = useState<AdvertiserAd[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // User session state
  const [currentUser, setCurrentUser] = useState<{ email: string; name: string } | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [format, setFormat] = useState<'banner' | 'sidebar' | 'classified' | 'popup'>('banner');
  const [zone, setZone] = useState('header-leaderboard');
  const [targetUrl, setTargetUrl] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [budget, setBudget] = useState('5000');
  
  // Image Upload State (URL or Local File)
  const [imageUploadType, setImageUploadType] = useState<'url' | 'file'>('url');
  const [imageUrl, setImageUrl] = useState('');
  const [selectedFilePreview, setSelectedFilePreview] = useState<string>('');

  // 1. Check logged in advertiser session
  useEffect(() => {
    const cachedUser = localStorage.getItem('advertiser_user');
    if (cachedUser) {
      try {
        const parsed = JSON.parse(cachedUser);
        setCurrentUser(parsed);
      } catch (e) {
        console.error(e);
      }
    } else {
      // Default fallback advertiser profile for direct access
      setCurrentUser({
        email: 'advertiser@thelocalleader.in',
        name: 'विज्ञापनदाता'
      });
    }
  }, []);

  // 2. Fetch only this advertiser's ads in real-time
  useEffect(() => {
    if (!currentUser?.email) return;

    setLoading(true);
    const q = query(
      collection(db, 'ads'),
      where('advertiserEmail', '==', currentUser.email)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: AdvertiserAd[] = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          name: data.name || 'Untitled Ad',
          zone: data.zone || 'header-leaderboard',
          type: data.type || 'image',
          format: data.format || 'banner',
          imageUrl: data.imageUrl || '',
          targetUrl: data.targetUrl || '',
          startDate: data.startDate || '',
          endDate: data.endDate || '',
          status: data.status || 'pending',
          impressions: Number(data.impressions || data.views || 0),
          clicks: Number(data.clicks || 0),
          budget: data.budget || 0,
          advertiserEmail: data.advertiserEmail || '',
          advertiserName: data.advertiserName || ''
        };
      });

      setAds(list);
      setLoading(false);
    }, (err) => {
      console.error('Error fetching ads:', err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser?.email]);

  // Handle local image file selection and conversion to Base64
  const handleLocalImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('कृपया 2 MB से छोटी इमेज अपलोड करें।');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setSelectedFilePreview(base64String);
      setImageUrl(base64String);
    };
    reader.readAsDataURL(file);
  };

  // Format change handler (Auto updates placement zone)
  const handleFormatChange = (selected: 'banner' | 'sidebar' | 'classified' | 'popup') => {
    setFormat(selected);
    if (selected === 'banner') setZone('header-leaderboard');
    if (selected === 'sidebar') setZone('sidebar-top');
    if (selected === 'classified') setZone('classifieds-feed');
    if (selected === 'popup') setZone('popup');
  };

  // 3. Submit New Ad Request for Admin Approval
  const handleSubmitAd = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      alert('विज्ञापन का नाम दर्ज करना आवश्यक है।');
      return;
    }

    if (!imageUrl) {
      alert('कृपया विज्ञापन इमेज URL दर्ज करें या डिवाइस से फाइल चुनें।');
      return;
    }

    if (!startDate || !endDate) {
      alert('कृपया विज्ञापन की शुरू और समाप्त होने की तारीख चुनें।');
      return;
    }

    try {
      setSubmitting(true);

      await addDoc(collection(db, 'ads'), {
        name: name.trim(),
        format,
        zone,
        type: 'image',
        device: 'all',
        imageUrl,
        targetUrl: targetUrl.trim() || '#',
        startDate,
        endDate,
        budget: budget || '5000',
        status: 'pending', // Sent for Admin approval
        priority: 1,
        impressions: 0,
        clicks: 0,
        advertiserEmail: currentUser?.email || 'advertiser@thelocalleader.in',
        advertiserName: currentUser?.name || 'विज्ञापनदाता',
        createdAt: serverTimestamp()
      });

      alert('विज्ञापन अनुरोध सफलतापूर्वक भेज दिया गया है! एडमिन द्वारा अप्रूवल मिलते ही यह वेबसाइट पर लाइव हो जाएगा।');

      // Reset form
      setName('');
      setImageUrl('');
      setSelectedFilePreview('');
      setTargetUrl('');
      setStartDate('');
      setEndDate('');
      setSubmitting(false);
      setActiveTab('my-ads');
    } catch (err: any) {
      setSubmitting(false);
      alert('विज्ञापन अनुरोध भेजने में त्रुटि: ' + err.message);
    }
  };

  // Calculate Metrics
  const activeCount = ads.filter(a => a.status === 'active').length;
  const pendingCount = ads.filter(a => a.status === 'pending').length;
  const totalViews = ads.reduce((acc, curr) => acc + (curr.impressions || 0), 0);
  const totalClicks = ads.reduce((acc, curr) => acc + (curr.clicks || 0), 0);

  return (
    <div style={{ backgroundColor: '#070b14', minHeight: '100vh', color: '#e2e8f0', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      
      {/* Top Navbar */}
      <header style={{ backgroundColor: '#0e1626', borderBottom: '1px solid #1e293b', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <span style={{ fontSize: '18px', fontWeight: 700, color: '#ffffff' }}>विज्ञापनदाता पोर्टल</span>
          <span style={{ fontSize: '12px', color: '#94a3b8', marginLeft: '12px' }}>{currentUser?.name} ({currentUser?.email})</span>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <Link href="/" style={{ fontSize: '13px', color: '#38bdf8', textDecoration: 'none' }}>
            ← मुख्य वेबसाइट देखें
          </Link>
        </div>
      </header>

      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '24px' }}>
        
        {/* Metric Cards Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          
          <div style={{ backgroundColor: '#0e1626', border: '1px solid #1e293b', borderRadius: '12px', padding: '18px' }}>
            <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>लाइव / सक्रिय विज्ञापन</span>
            <div style={{ fontSize: '26px', fontWeight: 700, color: '#34d399', marginTop: '6px' }}>{activeCount}</div>
            <span style={{ fontSize: '11px', color: '#64748b' }}>वर्तमान में पोर्टल पर लाइव</span>
          </div>

          <div style={{ backgroundColor: '#0e1626', border: '1px solid #1e293b', borderRadius: '12px', padding: '18px' }}>
            <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>स्वीकृति हेतु लंबित (Pending)</span>
            <div style={{ fontSize: '26px', fontWeight: 700, color: '#fbbf24', marginTop: '6px' }}>{pendingCount}</div>
            <span style={{ fontSize: '11px', color: '#64748b' }}>एडमिन अप्रूवल की प्रतीक्षा में</span>
          </div>

          <div style={{ backgroundColor: '#0e1626', border: '1px solid #1e293b', borderRadius: '12px', padding: '18px' }}>
            <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>कुल इम्प्रेशन्स (Views)</span>
            <div style={{ fontSize: '26px', fontWeight: 700, color: '#38bdf8', marginTop: '6px' }}>{totalViews}</div>
            <span style={{ fontSize: '11px', color: '#64748b' }}>पाठकों द्वारा देखे गए</span>
          </div>

          <div style={{ backgroundColor: '#0e1626', border: '1px solid #1e293b', borderRadius: '12px', padding: '18px' }}>
            <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>कुल क्लिक्स (Clicks)</span>
            <div style={{ fontSize: '26px', fontWeight: 700, color: '#a78bfa', marginTop: '6px' }}>{totalClicks}</div>
            <span style={{ fontSize: '11px', color: '#64748b' }}>वेबसाइट ट्रैफ़िक एंगेजमेंट</span>
          </div>

        </div>

        {/* Navigation Tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
          <button
            type="button"
            onClick={() => setActiveTab('my-ads')}
            style={{
              backgroundColor: activeTab === 'my-ads' ? '#2563eb' : '#0e1626',
              color: activeTab === 'my-ads' ? '#ffffff' : '#94a3b8',
              border: '1px solid #1e293b',
              borderRadius: '8px',
              padding: '9px 18px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            मेरे सभी विज्ञापन ({ads.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('create-ad')}
            style={{
              backgroundColor: activeTab === 'create-ad' ? '#2563eb' : '#0e1626',
              color: activeTab === 'create-ad' ? '#ffffff' : '#94a3b8',
              border: '1px solid #1e293b',
              borderRadius: '8px',
              padding: '9px 18px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            + नया विज्ञापन अनुरोध भेजें
          </button>
        </div>

        {/* TAB 1: MY ADS LIST */}
        {activeTab === 'my-ads' && (
          <div style={{ backgroundColor: '#0e1626', border: '1px solid #1e293b', borderRadius: '12px', overflow: 'hidden' }}>
            {loading ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>
                डेटा लोड हो रहा है...
              </div>
            ) : ads.length === 0 ? (
              <div style={{ padding: '50px 20px', textAlign: 'center', color: '#94a3b8' }}>
                <p style={{ fontSize: '15px', color: '#ffffff', marginBottom: '8px' }}>कोई विज्ञापन उपलब्ध नहीं है</p>
                <p style={{ fontSize: '13px', margin: 0 }}>अपना पहला विज्ञापन लाइव करने के लिए ऊपर "+ नया विज्ञापन अनुरोध भेजें" बटन पर क्लिक करें।</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#0a101d', borderBottom: '1px solid #1e293b', color: '#94a3b8', fontSize: '11px', textTransform: 'uppercase' }}>
                      <th style={{ padding: '14px 18px' }}>विज्ञापन विवरण</th>
                      <th style={{ padding: '14px 18px' }}>प्रारूप (Format)</th>
                      <th style={{ padding: '14px 18px' }}>प्लेसमेंट ज़ोन</th>
                      <th style={{ padding: '14px 18px' }}>समय सीमा (Dates)</th>
                      <th style={{ padding: '14px 18px' }}>स्थिति (Status)</th>
                      <th style={{ padding: '14px 18px' }}>प्रदर्शन (Performance)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ads.map((ad, idx) => (
                      <tr 
                        key={ad.id} 
                        style={{ 
                          borderBottom: idx === ads.length - 1 ? 'none' : '1px solid #162238'
                        }}
                      >
                        <td style={{ padding: '14px 18px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            {ad.imageUrl && (
                              <img 
                                src={ad.imageUrl} 
                                alt={ad.name} 
                                style={{ width: '48px', height: '36px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #334155' }} 
                              />
                            )}
                            <div>
                              <div style={{ fontWeight: 600, color: '#ffffff' }}>{ad.name}</div>
                              {ad.targetUrl && (
                                <a href={ad.targetUrl} target="_blank" rel="noreferrer" style={{ fontSize: '11px', color: '#38bdf8', textDecoration: 'none' }}>
                                  {ad.targetUrl.slice(0, 30)}...
                                </a>
                              )}
                            </div>
                          </div>
                        </td>

                        <td style={{ padding: '14px 18px', textTransform: 'capitalize', color: '#cbd5e1' }}>
                          {ad.format} Ad
                        </td>

                        <td style={{ padding: '14px 18px', fontFamily: 'monospace', fontSize: '12px', color: '#94a3b8' }}>
                          {ad.zone}
                        </td>

                        <td style={{ padding: '14px 18px', fontSize: '12px', color: '#94a3b8' }}>
                          <div>शुरू: {ad.startDate || 'तत्काल'}</div>
                          <div style={{ color: '#f87171' }}>समाप्त: {ad.endDate || 'खुला'}</div>
                        </td>

                        <td style={{ padding: '14px 18px' }}>
                          <span
                            style={{
                              display: 'inline-block',
                              padding: '3px 10px',
                              borderRadius: '20px',
                              fontSize: '11px',
                              fontWeight: 600,
                              textTransform: 'capitalize',
                              backgroundColor: 
                                ad.status === 'active' ? 'rgba(16, 185, 129, 0.15)' :
                                ad.status === 'pending' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                              color: 
                                ad.status === 'active' ? '#34d399' :
                                ad.status === 'pending' ? '#fbbf24' : '#f87171',
                              border: `1px solid ${
                                ad.status === 'active' ? 'rgba(16, 185, 129, 0.3)' :
                                ad.status === 'pending' ? 'rgba(245, 158, 11, 0.3)' : 'rgba(239, 68, 68, 0.3)'
                              }`
                            }}
                          >
                            {ad.status === 'pending' ? '⏳ विचाराधीन' : ad.status === 'active' ? '✓ लाइव' : ad.status}
                          </span>
                        </td>

                        <td style={{ padding: '14px 18px', fontSize: '12px' }}>
                          <div style={{ color: '#38bdf8', fontWeight: 600 }}>{ad.impressions} Views</div>
                          <div style={{ color: '#a78bfa' }}>{ad.clicks} Clicks</div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: CREATE AD FORM */}
        {activeTab === 'create-ad' && (
          <div style={{ backgroundColor: '#0e1626', border: '1px solid #1e293b', borderRadius: '12px', padding: '28px', maxWidth: '750px', margin: '0 auto' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#ffffff', margin: '0 0 8px 0' }}>नया विज्ञापन अनुरोध सबमिट करें</h2>
            <p style={{ fontSize: '13px', color: '#94a3b8', margin: '0 0 24px 0' }}>
              अनुरोध सबमिट करने के बाद नेटवर्क एडमिनिस्ट्रेटर द्वारा समीक्षा की जाएगी। अप्रूवल के बाद आपका विज्ञापन चयनित तिथियों में वेबसाइट पर लाइव प्रदर्शित होगा।
            </p>

            <form onSubmit={handleSubmitAd} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              
              {/* Ad Name */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '6px' }}>विज्ञापन का शीर्षक / नाम *</label>
                <input
                  type="text"
                  required
                  placeholder="उदा. व्यापार महासेल - हेडर बैनर"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#162238', border: '1px solid #27354f', borderRadius: '6px', padding: '10px 14px', color: '#ffffff', fontSize: '13px' }}
                />
              </div>

              {/* Format & Placement Selection */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '6px' }}>विज्ञापन प्रारूप (Format)</label>
                  <select
                    value={format}
                    onChange={(e) => handleFormatChange(e.target.value as any)}
                    style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#162238', border: '1px solid #27354f', borderRadius: '6px', padding: '10px 14px', color: '#ffffff', fontSize: '13px' }}
                  >
                    <option value="banner">हेडर / लीडरबोर्ड बैनर</option>
                    <option value="sidebar">साइडबार स्क्वायर (300×250)</option>
                    <option value="classified">क्लासिफाइड विज्ञापन</option>
                    <option value="popup">पॉप-अप विज्ञापन</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '6px' }}>प्लेसमेंट ज़ोन (Slot)</label>
                  <select
                    value={zone}
                    onChange={(e) => setZone(e.target.value)}
                    style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#162238', border: '1px solid #27354f', borderRadius: '6px', padding: '10px 14px', color: '#ffffff', fontSize: '13px' }}
                  >
                    <option value="header-leaderboard">हेडर मुख्य बैनर (728×90)</option>
                    <option value="sidebar-top">साइडबार ऊपरी भाग (300×250)</option>
                    <option value="sidebar-middle">साइडबार मध्य भाग</option>
                    <option value="in-article-1">खबर के अंदर (In-Article)</option>
                    <option value="classifieds-feed">क्लासिफाइड सूची</option>
                    <option value="popup">पॉप-अप स्लॉट</option>
                  </select>
                </div>
              </div>

              {/* Start and End Dates */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '6px' }}>प्रसारण शुरू होने की तारीख *</label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#162238', border: '1px solid #27354f', borderRadius: '6px', padding: '10px 14px', color: '#ffffff', fontSize: '13px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '6px' }}>समाप्ति तारीख *</label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#162238', border: '1px solid #27354f', borderRadius: '6px', padding: '10px 14px', color: '#ffffff', fontSize: '13px' }}
                  />
                </div>
              </div>

              {/* Target Landing URL */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '6px' }}>विज्ञापन क्लिक लिंक (Target URL)</label>
                <input
                  type="url"
                  placeholder="https://yourwebsite.com/offer"
                  value={targetUrl}
                  onChange={(e) => setTargetUrl(e.target.value)}
                  style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#162238', border: '1px solid #27354f', borderRadius: '6px', padding: '10px 14px', color: '#ffffff', fontSize: '13px' }}
                />
              </div>

              {/* Image Input Selection (URL or Local Upload) */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label style={{ fontSize: '12px', color: '#94a3b8' }}>विज्ञापन इमेज *</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={() => setImageUploadType('url')}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: imageUploadType === 'url' ? '#38bdf8' : '#64748b',
                        fontSize: '12px',
                        cursor: 'pointer',
                        fontWeight: imageUploadType === 'url' ? 700 : 400
                      }}
                    >
                      वेब लिंक (URL)
                    </button>
                    <span style={{ color: '#475569' }}>|</span>
                    <button
                      type="button"
                      onClick={() => setImageUploadType('file')}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: imageUploadType === 'file' ? '#38bdf8' : '#64748b',
                        fontSize: '12px',
                        cursor: 'pointer',
                        fontWeight: imageUploadType === 'file' ? 700 : 400
                      }}
                    >
                      डिवाइस से अपलोड करें
                    </button>
                  </div>
                </div>

                {imageUploadType === 'url' ? (
                  <input
                    type="url"
                    placeholder="https://example.com/banner.jpg"
                    value={imageUrl}
                    onChange={(e) => {
                      setImageUrl(e.target.value);
                      setSelectedFilePreview(e.target.value);
                    }}
                    style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#162238', border: '1px solid #27354f', borderRadius: '6px', padding: '10px 14px', color: '#ffffff', fontSize: '13px' }}
                  />
                ) : (
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLocalImageSelect}
                    style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#162238', border: '1px solid #27354f', borderRadius: '6px', padding: '8px 14px', color: '#ffffff', fontSize: '13px' }}
                  />
                )}

                {/* Preview */}
                {selectedFilePreview && (
                  <div style={{ marginTop: '12px', padding: '8px', border: '1px dashed #334155', borderRadius: '8px', textAlign: 'center' }}>
                    <span style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>इमेज पूर्वावलोकन (Preview)</span>
                    <img 
                      src={selectedFilePreview} 
                      alt="Banner Preview" 
                      style={{ maxWidth: '100%', maxHeight: '140px', objectFit: 'contain', borderRadius: '4px' }} 
                    />
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setActiveTab('my-ads')}
                  style={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    color: '#94a3b8',
                    padding: '10px 20px',
                    borderRadius: '6px',
                    fontSize: '13px',
                    cursor: 'pointer'
                  }}
                >
                  रद्द करें
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    backgroundColor: '#2563eb',
                    border: 'none',
                    color: '#ffffff',
                    padding: '10px 24px',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    opacity: submitting ? 0.6 : 1
                  }}
                >
                  {submitting ? 'अनुरोध भेजा जा रहा है...' : 'अनुरोध सबमिट करें (Admin Review)'}
                </button>
              </div>

            </form>
          </div>
        )}

      </div>
    </div>
  );
}