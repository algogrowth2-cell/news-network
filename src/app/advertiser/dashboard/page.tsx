'use client';

import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  serverTimestamp,
  doc 
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
  city?: string;
  price?: string;
}

const NETWORK_PORTALS = [
  { slug: 'all', name: 'सभी नेटवर्क (All Portals)' },
  { slug: 'the-local-leader', name: 'द लोकल लीडर' },
  { slug: 'bazar-karobar', name: 'बाज़ार कारोबार' },
  { slug: 'golden-pearl-chronicles', name: 'गोल्डन पर्ल क्रॉनिकल्स' },
  { slug: 'state-express', name: 'द प्रोव्यू टाइम्स' },
  { slug: 'desh-ki-aawaz', name: 'देश की आवाज़' },
  { slug: 'jan-chetna-news', name: 'जन भारत न्यूज़' },
  { slug: 'city-bulletin', name: 'NEWS INFO 24' },
  { slug: 'national-spotlight', name: 'डिफेंस न्यूज़' }
];

const CLASSIFIED_CATEGORIES = [
  'प्रॉपर्टी / ज़मीन',
  'वाहन (गाड़ियां)',
  'नौकरी / रोजगार',
  'इलेक्ट्रॉनिक्स',
  'सेवाएं / बिजनेस',
  'शिक्षा / कोचिंग',
  'अन्य'
];

export default function AdvertiserDashboard() {
  const [activeTab, setActiveTab] = useState<'my-ads' | 'create-ad'>('my-ads');
  const [ads, setAds] = useState<AdvertiserAd[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Dynamic Site Theme Brand Color
  const [themeColor, setThemeColor] = useState<string>('#ea580c');
  const [siteName, setSiteName] = useState<string>('द लोकल लीडर');
  const [siteLogo, setSiteLogo] = useState<string>('/logos/the-local-leader.jpeg');

  // User session state
  const [currentUser, setCurrentUser] = useState<{ email: string; name: string } | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [format, setFormat] = useState<'banner' | 'sidebar' | 'classified' | 'popup'>('classified');
  const [zone, setZone] = useState('classifieds-feed');
  const [selectedSite, setSelectedSite] = useState('the-local-leader');
  const [classifiedCategory, setClassifiedCategory] = useState(CLASSIFIED_CATEGORIES[0]);
  const [city, setCity] = useState('');
  const [price, setPrice] = useState('');
  const [contactPhone, setContactPhone] = useState('8103333381');
  const [targetUrl, setTargetUrl] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [budget, setBudget] = useState('5000');
  
  // Image Upload State
  const [imageUploadType, setImageUploadType] = useState<'url' | 'file'>('url');
  const [imageUrl, setImageUrl] = useState('');
  const [selectedFilePreview, setSelectedFilePreview] = useState<string>('');

  // 1. Fetch Site Config for Brand Color matching Logo
  useEffect(() => {
    const unsubSite = onSnapshot(doc(db, 'sites', 'the-local-leader'), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data.primaryColor) setThemeColor(data.primaryColor);
        if (data.name) setSiteName(data.name);
        if (data.logoUrl) setSiteLogo(data.logoUrl);
      }
    });
    return () => unsubSite();
  }, []);

  // 2. Check logged in advertiser session
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
      setCurrentUser({
        email: 'algogrowth2@gmail.com',
        name: 'pankaj'
      });
    }
  }, []);

  // 3. Fetch advertiser's ads in real-time (Dono: 'ads' aur 'classifieds' collections se)
  useEffect(() => {
    if (!currentUser?.email) return;

    setLoading(true);

    // Banner Ads query
    const qAds = query(
      collection(db, 'ads'),
      where('advertiserEmail', '==', currentUser.email)
    );

    // Classified Ads query
    const qClassifieds = query(
      collection(db, 'classifieds'),
      where('advertiserEmail', '==', currentUser.email)
    );

    let bannerList: AdvertiserAd[] = [];
    let classifiedList: AdvertiserAd[] = [];

    const unsubAds = onSnapshot(qAds, (snapshot) => {
      bannerList = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          name: data.name || data.title || 'Untitled Banner',
          zone: data.zone || '728x90 Header Leaderboard',
          type: data.type || 'image',
          format: (data.format || 'banner') as any,
          imageUrl: data.imageUrl || '',
          targetUrl: data.targetUrl || '',
          startDate: data.startDate || 'तत्काल',
          endDate: data.endDate || 'खुला',
          status: data.status || 'pending',
          impressions: Number(data.impressions || data.views || 0),
          clicks: Number(data.clicks || 0),
          budget: data.budget || 5000,
          advertiserEmail: data.advertiserEmail || '',
          advertiserName: data.advertiserName || ''
        };
      });
      setAds([...classifiedList, ...bannerList]);
      setLoading(false);
    });

    const unsubCls = onSnapshot(qClassifieds, (snapshot) => {
      classifiedList = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          name: data.title || data.name || 'Untitled Classified',
          zone: 'साइडबार क्लासिफाइड विजेट (Sidebar Widget)',
          type: 'classified',
          format: 'classified',
          imageUrl: data.imageUrl || '',
          targetUrl: data.targetUrl || '#',
          startDate: data.startDate || 'तत्काल',
          endDate: data.endDate || 'खुला',
          status: (data.status === 'active' || data.status === 'approved' ? 'active' : data.status || 'pending') as any,
          impressions: Number(data.impressions || data.views || 0),
          clicks: Number(data.clicks || 0),
          budget: data.price ? `₹${data.price}` : 0,
          advertiserEmail: data.advertiserEmail || '',
          advertiserName: data.advertiserName || '',
          city: data.city || '',
          price: data.price || ''
        };
      });
      setAds([...classifiedList, ...bannerList]);
      setLoading(false);
    });

    return () => {
      unsubAds();
      unsubCls();
    };
  }, [currentUser?.email]);

  const handleLocalImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('कृपया 2 MB से छोटी इमेज चुनें।');
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

  const handleFormatChange = (selected: 'banner' | 'sidebar' | 'classified' | 'popup') => {
    setFormat(selected);
    if (selected === 'banner') setZone('728x90 Header Leaderboard');
    if (selected === 'sidebar') setZone('300x250 (साइडबार)');
    if (selected === 'classified') setZone('classifieds-feed');
    if (selected === 'popup') setZone('popup');
  };

  // Submit Ad request to Firestore
  const handleSubmitAd = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      alert('विज्ञापन का शीर्षक/नाम दर्ज करना आवश्यक है।');
      return;
    }

    try {
      setSubmitting(true);

      // 👉 1. CLASSIFIED ADS: Seede 'classifieds' collection mein jayega taaki Sidebar Widget mein display ho!
      if (format === 'classified') {
        await addDoc(collection(db, 'classifieds'), {
          title: name.trim(),
          category: classifiedCategory,
          city: city.trim() || 'इंदौर/महू',
          price: price.trim() || '',
          contactNumber: contactPhone.trim() || '8103333381',
          imageUrl: imageUrl.trim() || '',
          siteId: selectedSite,
          status: 'active', // Direct active for sidebar classifieds
          format: 'classified',
          type: 'classified',
          advertiserEmail: currentUser?.email || 'algogrowth2@gmail.com',
          advertiserName: currentUser?.name || 'pankaj',
          createdAt: new Date().toISOString(),
          timestamp: serverTimestamp()
        });

        alert('✅ आपका क्लासिफाइड विज्ञापन सफलतापूर्वक दर्ज हो गया है aur वेबसाइट के साइडबार विजेट में लाइव हो गया है!');
      } else {
        // 👉 2. BANNER ADS: 'ads' collection mein jayega (Header / Sidebar Square Banner)
        await addDoc(collection(db, 'ads'), {
          name: name.trim(),
          title: name.trim(),
          format,
          zone,
          siteId: selectedSite,
          type: 'image',
          device: 'all',
          imageUrl,
          targetUrl: targetUrl.trim() || '#',
          startDate: startDate || 'तत्काल',
          endDate: endDate || 'खुला',
          budget: budget || '5000',
          status: 'active',
          priority: 1,
          impressions: 0,
          clicks: 0,
          contactNumber: contactPhone.trim(),
          advertiserEmail: currentUser?.email || 'algogrowth2@gmail.com',
          advertiserName: currentUser?.name || 'pankaj',
          createdAt: serverTimestamp()
        });

        alert('✅ आपका बैनर विज्ञापन सफलतापूर्वक लाइव हो गया है!');
      }

      setName('');
      setImageUrl('');
      setSelectedFilePreview('');
      setTargetUrl('');
      setCity('');
      setPrice('');
      setStartDate('');
      setEndDate('');
      setSubmitting(false);
      setActiveTab('my-ads');
    } catch (err: any) {
      setSubmitting(false);
      alert('Error: ' + err.message);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('advertiser_user');
    window.location.href = '/advertiser/login';
  };

  const activeCount = ads.filter(a => a.status === 'active').length;
  const pendingCount = ads.filter(a => a.status === 'pending').length;
  const totalViews = ads.reduce((acc, curr) => acc + (curr.impressions || 0), 0);
  const totalClicks = ads.reduce((acc, curr) => acc + (curr.clicks || 0), 0);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f1f5f9', color: '#1e293b', fontFamily: '"Mukta", system-ui, -apple-system, sans-serif' }}>
      
      {/* Top Navbar */}
      <header style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #e2e8f0', padding: '14px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {siteLogo && (
            <img src={siteLogo} alt={siteName} style={{ height: '36px', width: 'auto', borderRadius: '4px', objectFit: 'contain' }} />
          )}
          <div>
            <span style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>विज्ञापनदाता पोर्टल</span>
            <span style={{ fontSize: '12px', color: '#64748b', marginLeft: '10px' }}>
              {currentUser?.name} ({currentUser?.email})
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <Link href="/" style={{ fontSize: '13.5px', color: themeColor, textDecoration: 'none', fontWeight: 600 }}>
            ← मुख्य वेबसाइट देखें
          </Link>
          <button 
            onClick={handleLogout}
            style={{ backgroundColor: '#fee2e2', border: '1px solid #fecaca', color: '#dc2626', padding: '6px 14px', borderRadius: '6px', fontSize: '12.5px', fontWeight: 600, cursor: 'pointer' }}
          >
            लॉगआउट
          </button>
        </div>
      </header>

      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '24px' }}>
        
        {/* Metric Cards Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          
          <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '18px', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
            <span style={{ fontSize: '12.5px', color: '#64748b', fontWeight: 600 }}>लाइव / सक्रिय विज्ञापन</span>
            <div style={{ fontSize: '30px', fontWeight: 800, color: '#16a34a', marginTop: '4px' }}>{activeCount}</div>
            <span style={{ fontSize: '11px', color: '#94a3b8' }}>वर्तमान में पोर्टल पर लाइव</span>
          </div>

          <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '18px', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
            <span style={{ fontSize: '12.5px', color: '#64748b', fontWeight: 600 }}>स्वीकृति हेतु लंबित (Pending)</span>
            <div style={{ fontSize: '30px', fontWeight: 800, color: '#d97706', marginTop: '4px' }}>{pendingCount}</div>
            <span style={{ fontSize: '11px', color: '#94a3b8' }}>एडमिन अप्रूवल की प्रतीक्षा में</span>
          </div>

          <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '18px', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
            <span style={{ fontSize: '12.5px', color: '#64748b', fontWeight: 600 }}>कुल इम्प्रेशन्स (Views)</span>
            <div style={{ fontSize: '30px', fontWeight: 800, color: '#0284c7', marginTop: '4px' }}>{totalViews}</div>
            <span style={{ fontSize: '11px', color: '#94a3b8' }}>पाठकों द्वारा देखे गए</span>
          </div>

          <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '18px', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
            <span style={{ fontSize: '12.5px', color: '#64748b', fontWeight: 600 }}>कुल क्लिक्स (Clicks)</span>
            <div style={{ fontSize: '30px', fontWeight: 800, color: '#7c3aed', marginTop: '4px' }}>{totalClicks}</div>
            <span style={{ fontSize: '11px', color: '#94a3b8' }}>वेबसाइट ट्रैफ़िक एंगेजमेंट</span>
          </div>

        </div>

        {/* Navigation Tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
          <button
            type="button"
            onClick={() => setActiveTab('my-ads')}
            style={{
              backgroundColor: activeTab === 'my-ads' ? themeColor : '#ffffff',
              color: activeTab === 'my-ads' ? '#ffffff' : '#475569',
              border: `1.5px solid ${activeTab === 'my-ads' ? themeColor : '#cbd5e1'}`,
              borderRadius: '8px',
              padding: '9px 18px',
              fontSize: '13.5px',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: activeTab === 'my-ads' ? '0 2px 8px rgba(0,0,0,0.1)' : 'none'
            }}
          >
            मेरे सभी विज्ञापन ({ads.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('create-ad')}
            style={{
              backgroundColor: activeTab === 'create-ad' ? themeColor : '#ffffff',
              color: activeTab === 'create-ad' ? '#ffffff' : '#475569',
              border: `1.5px solid ${activeTab === 'create-ad' ? themeColor : '#cbd5e1'}`,
              borderRadius: '8px',
              padding: '9px 18px',
              fontSize: '13.5px',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: activeTab === 'create-ad' ? '0 2px 8px rgba(0,0,0,0.1)' : 'none'
            }}
          >
            + नया विज्ञापन अनुरोध भेजें
          </button>
        </div>

        {/* TAB 1: MY ADS LIST */}
        {activeTab === 'my-ads' && (
          <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.04)' }}>
            {loading ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#64748b', fontSize: '14px' }}>
                डेटा लोड हो रहा है...
              </div>
            ) : ads.length === 0 ? (
              <div style={{ padding: '60px 20px', textAlign: 'center', color: '#64748b' }}>
                <p style={{ fontSize: '17px', color: '#0f172a', fontWeight: 600, marginBottom: '6px' }}>कोई विज्ञापन उपलब्ध नहीं है</p>
                <p style={{ fontSize: '13.5px', margin: 0, color: '#64748b' }}>नया विज्ञापन बनाने के लिए ऊपर "+ नया विज्ञापन अनुरोध भेजें" बटन पर क्लिक करें।</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13.5px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                      <th style={{ padding: '14px 18px' }}>विज्ञापन विवरण</th>
                      <th style={{ padding: '14px 18px' }}>प्रारूप (Format)</th>
                      <th style={{ padding: '14px 18px' }}>प्लेसमेंट ज़ोन</th>
                      <th style={{ padding: '14px 18px' }}>समय सीमा / विवरण</th>
                      <th style={{ padding: '14px 18px' }}>स्थिति (Status)</th>
                      <th style={{ padding: '14px 18px' }}>प्रदर्शन (Performance)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ads.map((ad, idx) => (
                      <tr 
                        key={ad.id} 
                        style={{ 
                          borderBottom: idx === ads.length - 1 ? 'none' : '1px solid #f1f5f9'
                        }}
                      >
                        <td style={{ padding: '14px 18px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            {ad.imageUrl ? (
                              <img 
                                src={ad.imageUrl} 
                                alt={ad.name} 
                                style={{ width: '48px', height: '36px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #cbd5e1' }} 
                              />
                            ) : (
                              <div style={{ width: '48px', height: '36px', backgroundColor: '#f1f5f9', borderRadius: '4px', display: 'grid', placeItems: 'center', fontSize: '16px' }}>
                                📋
                              </div>
                            )}
                            <div>
                              <div style={{ fontWeight: 600, color: '#0f172a' }}>{ad.name}</div>
                              {ad.city && <span style={{ fontSize: '11px', color: '#64748b' }}>📍 {ad.city} {ad.price ? `· ₹${ad.price}` : ''}</span>}
                              {ad.targetUrl && ad.targetUrl !== '#' && (
                                <a href={ad.targetUrl} target="_blank" rel="noreferrer" style={{ fontSize: '11.5px', color: '#0284c7', textDecoration: 'none', display: 'block' }}>
                                  {ad.targetUrl.slice(0, 30)}...
                                </a>
                              )}
                            </div>
                          </div>
                        </td>

                        <td style={{ padding: '14px 18px', color: '#475569' }}>
                          {ad.format === 'classified' ? (
                            <span style={{ backgroundColor: '#fef3c7', color: '#b45309', padding: '3px 8px', borderRadius: '4px', fontSize: '11.5px', fontWeight: 600 }}>
                              क्लासिफाइड
                            </span>
                          ) : (
                            <span style={{ textTransform: 'capitalize' }}>{ad.format} Banner</span>
                          )}
                        </td>

                        <td style={{ padding: '14px 18px', fontSize: '12px', color: '#64748b' }}>
                          {ad.zone}
                        </td>

                        <td style={{ padding: '14px 18px', fontSize: '12.5px', color: '#64748b' }}>
                          {ad.format === 'classified' ? (
                            <div>स्थान: {ad.city || 'MP'}</div>
                          ) : (
                            <>
                              <div>शुरू: {ad.startDate}</div>
                              <div style={{ color: '#dc2626' }}>समाप्त: {ad.endDate}</div>
                            </>
                          )}
                        </td>

                        <td style={{ padding: '14px 18px' }}>
                          <span
                            style={{
                              display: 'inline-block',
                              padding: '3px 12px',
                              borderRadius: '20px',
                              fontSize: '11.5px',
                              fontWeight: 600,
                              textTransform: 'capitalize',
                              backgroundColor: 
                                ad.status === 'active' ? '#dcfce7' :
                                ad.status === 'pending' ? '#fef3c7' : '#fee2e2',
                              color: 
                                ad.status === 'active' ? '#15803d' :
                                ad.status === 'pending' ? '#b45309' : '#dc2626',
                              border: `1px solid ${
                                ad.status === 'active' ? '#bbf7d0' :
                                ad.status === 'pending' ? '#fde68a' : '#fecaca'
                              }`
                            }}
                          >
                            {ad.status === 'pending' ? '⏳ विचाराधीन' : ad.status === 'active' ? '✓ लाइव' : ad.status}
                          </span>
                        </td>

                        <td style={{ padding: '14px 18px', fontSize: '12.5px' }}>
                          <div style={{ color: '#0284c7', fontWeight: 600 }}>{ad.impressions} Views</div>
                          <div style={{ color: '#7c3aed', fontWeight: 600 }}>{ad.clicks} Clicks</div>
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
          <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '32px', maxWidth: '780px', margin: '0 auto', boxShadow: '0 4px 14px rgba(0,0,0,0.04)' }}>
            <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#0f172a', margin: '0 0 6px 0' }}>नया विज्ञापन अनुरोध सबमिट करें</h2>
            <p style={{ fontSize: '13.5px', color: '#64748b', margin: '0 0 24px 0' }}>
              क्लासिफाइड विज्ञापन सीधे साइडबार में दिखेंगे, और बैनर विज्ञापन संबंधित स्लॉट में लाइव होंगे।
            </p>

            <form onSubmit={handleSubmitAd} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>विज्ञापन का प्रकार (Format) *</label>
                <select
                  value={format}
                  onChange={(e) => handleFormatChange(e.target.value as any)}
                  style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#f8fafc', border: `2px solid ${themeColor}`, borderRadius: '8px', padding: '11px 14px', color: '#0f172a', fontSize: '14px', outline: 'none', cursor: 'pointer', fontWeight: 600 }}
                >
                  <option value="classified">📋 क्लासिफाइड विज्ञापन (साइडबार विजेट और क्लासिफाइड पेज)</option>
                  <option value="banner">🔝 हेडर / लीडरबोर्ड बैनर (728 × 90)</option>
                  <option value="sidebar">🔲 साइडबार इमेज बैनर (300 × 250)</option>
                  <option value="popup">🛑 पॉप-अप विज्ञापन</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>टारगेट पोर्टल (Site)</label>
                  <select
                    value={selectedSite}
                    onChange={(e) => setSelectedSite(e.target.value)}
                    style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#f8fafc', border: '1.5px solid #cbd5e1', borderRadius: '8px', padding: '11px 14px', color: '#0f172a', fontSize: '13.5px', outline: 'none', cursor: 'pointer' }}
                  >
                    {NETWORK_PORTALS.map(p => (
                      <option key={p.slug} value={p.slug}>{p.name}</option>
                    ))}
                  </select>
                </div>

                {format === 'classified' ? (
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>क्लासिफाइड श्रेणी *</label>
                    <select
                      value={classifiedCategory}
                      onChange={(e) => setClassifiedCategory(e.target.value)}
                      style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#f8fafc', border: '1.5px solid #cbd5e1', borderRadius: '8px', padding: '11px 14px', color: '#0f172a', fontSize: '13.5px', outline: 'none', cursor: 'pointer' }}
                    >
                      {CLASSIFIED_CATEGORIES.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>प्लेसमेंट ज़ोन (Slot)</label>
                    <select
                      value={zone}
                      onChange={(e) => setZone(e.target.value)}
                      style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#f8fafc', border: '1.5px solid #cbd5e1', borderRadius: '8px', padding: '11px 14px', color: '#0f172a', fontSize: '13.5px', outline: 'none', cursor: 'pointer' }}
                    >
                      <option value="728x90 Header Leaderboard">728x90 Header Leaderboard</option>
                      <option value="300x250 (साइडबार)">300x250 (साइडबार)</option>
                      <option value="popup">popup</option>
                    </select>
                  </div>
                )}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>विज्ञापन का शीर्षक / नाम *</label>
                <input
                  type="text"
                  required
                  placeholder={format === 'classified' ? 'उदा. 2 BHK मकान बिकाऊ है स्टेशन रोड पर' : 'उदा. व्यापार महासेल - हेडर बैनर'}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#f8fafc', border: '1.5px solid #cbd5e1', borderRadius: '8px', padding: '11px 14px', color: '#0f172a', fontSize: '14px', outline: 'none' }}
                />
              </div>

              {/* Classified specific fields */}
              {format === 'classified' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>शहर / कस्बा (City)</label>
                    <input
                      type="text"
                      placeholder="उदा. महू / इंदौर"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#f8fafc', border: '1.5px solid #cbd5e1', borderRadius: '8px', padding: '11px 14px', color: '#0f172a', fontSize: '13.5px', outline: 'none' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>कीमत / दर (₹ Price)</label>
                    <input
                      type="text"
                      placeholder="उदा. 25,00,000 या 5000"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#f8fafc', border: '1.5px solid #cbd5e1', borderRadius: '8px', padding: '11px 14px', color: '#0f172a', fontSize: '13.5px', outline: 'none' }}
                    />
                  </div>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>संपर्क मोबाइल नंबर *</label>
                  <input
                    type="tel"
                    required
                    placeholder="8103333381"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#f8fafc', border: '1.5px solid #cbd5e1', borderRadius: '8px', padding: '11px 14px', color: '#0f172a', fontSize: '13.5px', outline: 'none' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>क्लिक लिंक (Target URL)</label>
                  <input
                    type="url"
                    placeholder="https://yourwebsite.com/offer"
                    value={targetUrl}
                    onChange={(e) => setTargetUrl(e.target.value)}
                    style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#f8fafc', border: '1.5px solid #cbd5e1', borderRadius: '8px', padding: '11px 14px', color: '#0f172a', fontSize: '13.5px', outline: 'none' }}
                  />
                </div>
              </div>

              {format !== 'classified' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>प्रसारण शुरू तारीख *</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#f8fafc', border: '1.5px solid #cbd5e1', borderRadius: '8px', padding: '11px 14px', color: '#0f172a', fontSize: '13.5px', outline: 'none' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>समाप्ति तारीख *</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#f8fafc', border: '1.5px solid #cbd5e1', borderRadius: '8px', padding: '11px 14px', color: '#0f172a', fontSize: '13.5px', outline: 'none' }}
                    />
                  </div>
                </div>
              )}

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>
                    विज्ञापन फोटो / बैनर {format === 'classified' ? '(वैकल्पिक)' : '*'}
                  </label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={() => setImageUploadType('url')}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: imageUploadType === 'url' ? themeColor : '#64748b',
                        fontSize: '12.5px',
                        cursor: 'pointer',
                        fontWeight: imageUploadType === 'url' ? 700 : 500
                      }}
                    >
                      वेब लिंक (URL)
                    </button>
                    <span style={{ color: '#cbd5e1' }}>|</span>
                    <button
                      type="button"
                      onClick={() => setImageUploadType('file')}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: imageUploadType === 'file' ? themeColor : '#64748b',
                        fontSize: '12.5px',
                        cursor: 'pointer',
                        fontWeight: imageUploadType === 'file' ? 700 : 500
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
                    style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#f8fafc', border: '1.5px solid #cbd5e1', borderRadius: '8px', padding: '11px 14px', color: '#0f172a', fontSize: '13.5px', outline: 'none' }}
                  />
                ) : (
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLocalImageSelect}
                    style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#f8fafc', border: '1.5px solid #cbd5e1', borderRadius: '8px', padding: '9px 14px', color: '#0f172a', fontSize: '13.5px', outline: 'none' }}
                  />
                )}

                {selectedFilePreview && (
                  <div style={{ marginTop: '14px', padding: '12px', border: '1px dashed #cbd5e1', borderRadius: '8px', textAlign: 'center', backgroundColor: '#f8fafc' }}>
                    <span style={{ fontSize: '11.5px', color: '#64748b', display: 'block', marginBottom: '8px', fontWeight: 600 }}>इमेज पूर्वावलोकन</span>
                    <img 
                      src={selectedFilePreview} 
                      alt="Banner Preview" 
                      style={{ maxWidth: '100%', maxHeight: '150px', objectFit: 'contain', borderRadius: '6px' }} 
                    />
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setActiveTab('my-ads')}
                  style={{
                    backgroundColor: '#f1f5f9',
                    border: '1px solid #cbd5e1',
                    color: '#475569',
                    padding: '10px 20px',
                    borderRadius: '8px',
                    fontSize: '13.5px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  रद्द करें
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    backgroundColor: themeColor,
                    border: 'none',
                    color: '#ffffff',
                    padding: '11px 26px',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    opacity: submitting ? 0.6 : 1
                  }}
                >
                  {submitting ? 'दर्ज हो रहा है...' : '🚀 विज्ञापन तुरंत प्रकाशित करें'}
                </button>
              </div>

            </form>
          </div>
        )}

      </div>
    </div>
  );
}