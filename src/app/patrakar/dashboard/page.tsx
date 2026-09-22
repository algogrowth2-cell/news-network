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

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface ReporterArticle {
  id: string;
  title: string;
  category: string;
  siteId: string;
  status: string;
  createdAt?: any;
  views?: number;
}

// Complete list of all 8 network websites (Sirf Hindi naam display ke liye)
const NETWORK_WEBSITES = [
  { name: 'द लोकल लीडर', slug: 'the-local-leader' },
  { name: 'बाज़ार कारोबार', slug: 'bazar-karobar' },
  { name: 'गोल्डन पर्ल क्रॉनिकल्स', slug: 'golden-pearl-chronicles' },
  { name: 'द प्रोव्यू टाइम्स', slug: 'state-express' },
  { name: 'देश की आवाज़', slug: 'desh-ki-aawaz' },
  { name: 'जन भारत न्यूज़', slug: 'jan-chetna-news' },
  { name: 'NEWS INFO 24', slug: 'city-bulletin' },
  { name: 'डिफेंस न्यूज़', slug: 'national-spotlight' }
];

export default function PatrakarDashboard() {
  const [reporter, setReporter] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'create-article' | 'id-card' | 'membership' | 'delivery'>('create-article');
  const [articles, setArticles] = useState<ReporterArticle[]>([]);
  const [loading, setLoading] = useState(true);

  // Dynamic Site Theme
  const [themeColor, setThemeColor] = useState<string>('#ea580c');
  const [siteName, setSiteName] = useState<string>('द लोकल लीडर');
  const [siteLogo, setSiteLogo] = useState<string>('/logos/the-local-leader.jpeg');

  // Article Form State
  const [artTitle, setArtTitle] = useState('');
  const [artCategory, setArtCategory] = useState('राजनीति');
  const [artSiteId, setArtSiteId] = useState('the-local-leader');
  const [artSummary, setArtSummary] = useState('');
  const [artContent, setArtContent] = useState('');
  const [artImage, setArtImage] = useState('');
  const [submittingArticle, setSubmittingArticle] = useState(false);

  // Delivery Form State
  const [delName, setDelName] = useState('');
  const [delPhone, setDelPhone] = useState('');
  const [delAddress, setDelAddress] = useState('');
  const [delPincode, setDelPincode] = useState('');
  const [payingDelivery, setPayingDelivery] = useState(false);

  // Razorpay Test Key Config
  const RAZORPAY_KEY = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_TZSA6UoKATong0';

  // 1. Fetch Dynamic Site Color & Config
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

  // 2. Persistent Login Session
  useEffect(() => {
    const cached = localStorage.getItem('patrakar_user');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        setReporter(parsed);
      } catch (e) {
        console.error(e);
      }
    } else {
      const defaultReporter = {
        name: 'pankaj patidar',
        phone: '8839287421',
        email: 'reporter@thelocalleader.in',
        membershipActive: true,
        idNumber: 'LL-PRESS-7821',
        designation: 'वरिष्ठ संवाददाता (Chief Bureau)',
        validTill: '31 Dec 2027',
        photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400'
      };
      setReporter(defaultReporter);
      localStorage.setItem('patrakar_user', JSON.stringify(defaultReporter));
    }
  }, []);

  // 3. Fetch real-time articles submitted by this reporter
  useEffect(() => {
    if (!reporter?.phone && !reporter?.email) return;

    setLoading(true);
    const identifier = reporter.phone || reporter.email;
    const q = query(
      collection(db, 'articles'),
      where('authorIdentifier', '==', identifier)
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const list: ReporterArticle[] = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          title: data.title || data.titleHi || 'शीर्षक रहित खबर',
          category: data.category || 'सामान्य',
          siteId: data.siteId || 'the-local-leader',
          status: String(data.status || 'pending').toLowerCase(),
          views: Number(data.views || 0),
          createdAt: data.createdAt
        };
      });
      setArticles(list);
      setLoading(false);
    }, (err) => {
      console.error('Error fetching reporter articles:', err);
      setLoading(false);
    });

    return () => unsub();
  }, [reporter]);

  // Load Razorpay Script
  useEffect(() => {
    if (!document.getElementById('razorpay-checkout-js')) {
      const script = document.createElement('script');
      script.id = 'razorpay-checkout-js';
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('patrakar_user');
    window.location.href = '/patrakar/login';
  };

  // 4. Membership Payment (₹499)
  const handleBuyMembership = () => {
    if (!window.Razorpay) {
      alert('Razorpay gateway load ho raha hai, kripya 2 second rukiye...');
      return;
    }

    const options = {
      key: RAZORPAY_KEY,
      amount: 499 * 100,
      currency: 'INR',
      name: siteName,
      description: 'वार्षिक पत्रकार सदस्यता (Unlimited Articles Publishing)',
      handler: async function (response: any) {
        alert('सदस्यता भुगतान सफल! अब आप असीमित खबरें सबमिट कर सकते हैं।');
        const updated = { ...reporter, membershipActive: true };
        setReporter(updated);
        localStorage.setItem('patrakar_user', JSON.stringify(updated));

        await addDoc(collection(db, 'membership_transactions'), {
          reporterPhone: reporter.phone,
          reporterName: reporter.name,
          paymentId: response.razorpay_payment_id || 'test_pay_' + Date.now(),
          amount: 499,
          status: 'success',
          createdAt: serverTimestamp()
        });

        setActiveTab('create-article');
      },
      prefill: {
        name: reporter?.name,
        contact: reporter?.phone,
        email: reporter?.email
      },
      theme: {
        color: themeColor
      }
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
  };

  // 5. ID Card & Certificate Home Delivery (₹299)
  const handleDeliveryPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!delAddress || !delPincode || !delPhone) {
      alert('कृपया पूरा पता, पिनकोड और फ़ोन नंबर दर्ज करें।');
      return;
    }

    if (!window.Razorpay) {
      alert('Razorpay gateway load ho raha hai...');
      return;
    }

    setPayingDelivery(true);
    const options = {
      key: RAZORPAY_KEY,
      amount: 299 * 100,
      currency: 'INR',
      name: siteName,
      description: 'प्रेस आईडी कार्ड एवं प्रमाणपत्र होम डिलीवरी शुल्क',
      handler: async function (response: any) {
        setPayingDelivery(false);
        alert('डिलीवरी शुल्क ₹299 का भुगतान सफल! आपकी किट 5-7 कार्यदिवसों में भेज दी जाएगी।');

        await addDoc(collection(db, 'delivery_requests'), {
          reporterName: delName || reporter.name,
          reporterPhone: delPhone,
          address: delAddress,
          pincode: delPincode,
          idNumber: reporter.idNumber || 'LL-PRESS-7821',
          amountPaid: 299,
          paymentId: response.razorpay_payment_id || 'test_del_' + Date.now(),
          status: 'pending_dispatch',
          createdAt: serverTimestamp()
        });

        setActiveTab('overview');
      },
      prefill: {
        name: delName || reporter.name,
        contact: delPhone || reporter.phone
      },
      theme: {
        color: themeColor
      }
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
    setPayingDelivery(false);
  };

  // 6. Submit Article to Admin for Approval
  const handleSubmitArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!artTitle.trim()) {
      alert('कृपया खबर का शीर्षक दर्ज करें।');
      return;
    }

    try {
      setSubmittingArticle(true);

      await addDoc(collection(db, 'articles'), {
        title: artTitle.trim(),
        titleHi: artTitle.trim(),
        category: artCategory,
        siteId: artSiteId,
        summary: artSummary.trim(),
        content: artContent.trim(),
        image: artImage.trim() || 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=1200',
        authorName: reporter.name,
        authorIdentifier: reporter.phone || reporter.email,
        status: 'pending',
        views: 0,
        createdAt: serverTimestamp()
      });

      alert('खबर सबमिट हो चुकी है! एडमिन द्वारा सत्यापन के बाद यह वेबसाइट पर लाइव दिखेगी।');
      setArtTitle('');
      setArtSummary('');
      setArtContent('');
      setArtImage('');
      setSubmittingArticle(false);
      setActiveTab('overview');
    } catch (err: any) {
      setSubmittingArticle(false);
      alert('खबर भेजने में त्रुटि: ' + err.message);
    }
  };

  const totalArticles = articles.length;
  const approvedArticles = articles.filter(a => a.status === 'published' || a.status === 'approved').length;
  const pendingArticles = articles.filter(a => a.status === 'pending').length;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f1f5f9', color: '#1e293b', fontFamily: '"Mukta", system-ui, -apple-system, sans-serif' }}>
      
      {/* Top Header */}
      <header style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #e2e8f0', padding: '14px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {siteLogo && (
            <img src={siteLogo} alt={siteName} style={{ height: '36px', width: 'auto', borderRadius: '4px', objectFit: 'contain' }} />
          )}
          <div>
            <b style={{ fontSize: '18px', color: '#0f172a' }}>पत्रकार संवाददाता पोर्टल</b>
            <div style={{ fontSize: '12px', color: '#64748b' }}>
              संवाददाता: <b style={{ color: themeColor }}>{reporter?.name}</b> · {reporter?.phone} · आईडी: <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{reporter?.idNumber}</span>
            </div>
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
            <span style={{ fontSize: '12.5px', color: '#64748b', fontWeight: 600 }}>कुल सबमिट की गई खबरें</span>
            <div style={{ fontSize: '30px', fontWeight: 800, color: '#0f172a', marginTop: '4px' }}>{totalArticles}</div>
            <span style={{ fontSize: '11px', color: '#94a3b8' }}>आपके द्वारा भेजी गई कुल खबरें</span>
          </div>

          <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '18px', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
            <span style={{ fontSize: '12.5px', color: '#64748b', fontWeight: 600 }}>लाइव / स्वीकृत (Published)</span>
            <div style={{ fontSize: '30px', fontWeight: 800, color: '#16a34a', marginTop: '4px' }}>{approvedArticles}</div>
            <span style={{ fontSize: '11px', color: '#94a3b8' }}>संपादक द्वारा सत्यापित एवं लाइव</span>
          </div>

          <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '18px', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
            <span style={{ fontSize: '12.5px', color: '#64748b', fontWeight: 600 }}>समीक्षा हेतु लंबित (Pending)</span>
            <div style={{ fontSize: '30px', fontWeight: 800, color: '#d97706', marginTop: '4px' }}>{pendingArticles}</div>
            <span style={{ fontSize: '11px', color: '#94a3b8' }}>एडमिन सत्यापन की प्रतीक्षा में</span>
          </div>

          <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '18px', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
            <span style={{ fontSize: '12.5px', color: '#64748b', fontWeight: 600 }}>सदस्यता स्थिति (Plan)</span>
            <div style={{ fontSize: '19px', fontWeight: 800, color: reporter?.membershipActive ? '#16a34a' : '#dc2626', marginTop: '8px' }}>
              {reporter?.membershipActive ? '✓ सक्रिय (Active)' : 'अक्रिय (Inactive)'}
            </div>
            <span style={{ fontSize: '11px', color: '#94a3b8' }}>
              {reporter?.membershipActive ? 'असीमित खबर प्रकाशन चालू' : 'खबर भेजने हेतु प्लान आवश्यक'}
            </span>
          </div>

        </div>

        {/* Tab Navigation */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
          <button
            onClick={() => setActiveTab('overview')}
            style={{
              backgroundColor: activeTab === 'overview' ? themeColor : '#ffffff',
              color: activeTab === 'overview' ? '#ffffff' : '#475569',
              border: `1.5px solid ${activeTab === 'overview' ? themeColor : '#cbd5e1'}`,
              borderRadius: '8px',
              padding: '9px 18px',
              fontSize: '13.5px',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: activeTab === 'overview' ? '0 2px 8px rgba(0,0,0,0.1)' : 'none'
            }}
          >
            मेरी खबरें ({articles.length})
          </button>

          <button
            onClick={() => {
              if (!reporter?.membershipActive) {
                alert('खबर सबमिट करने के लिए आपको पहले पत्रकार सदस्यता प्लान लेना होगा।');
                setActiveTab('membership');
              } else {
                setActiveTab('create-article');
              }
            }}
            style={{
              backgroundColor: activeTab === 'create-article' ? themeColor : '#ffffff',
              color: activeTab === 'create-article' ? '#ffffff' : '#475569',
              border: `1.5px solid ${activeTab === 'create-article' ? themeColor : '#cbd5e1'}`,
              borderRadius: '8px',
              padding: '9px 18px',
              fontSize: '13.5px',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: activeTab === 'create-article' ? '0 2px 8px rgba(0,0,0,0.1)' : 'none'
            }}
          >
            + नई खबर भेजें
          </button>

          <button
            onClick={() => setActiveTab('id-card')}
            style={{
              backgroundColor: activeTab === 'id-card' ? themeColor : '#ffffff',
              color: activeTab === 'id-card' ? '#ffffff' : '#475569',
              border: `1.5px solid ${activeTab === 'id-card' ? themeColor : '#cbd5e1'}`,
              borderRadius: '8px',
              padding: '9px 18px',
              fontSize: '13.5px',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: activeTab === 'id-card' ? '0 2px 8px rgba(0,0,0,0.1)' : 'none'
            }}
          >
            🪪 प्रेस आईडी कार्ड & प्रमाणपत्र
          </button>

          <button
            onClick={() => setActiveTab('delivery')}
            style={{
              backgroundColor: activeTab === 'delivery' ? themeColor : '#ffffff',
              color: activeTab === 'delivery' ? '#ffffff' : '#475569',
              border: `1.5px solid ${activeTab === 'delivery' ? themeColor : '#cbd5e1'}`,
              borderRadius: '8px',
              padding: '9px 18px',
              fontSize: '13.5px',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: activeTab === 'delivery' ? '0 2px 8px rgba(0,0,0,0.1)' : 'none'
            }}
          >
            📦 होम डिलीवरी किट (₹299)
          </button>

          {!reporter?.membershipActive && (
            <button
              onClick={() => setActiveTab('membership')}
              style={{
                backgroundColor: activeTab === 'membership' ? '#16a34a' : '#ecfdf5',
                color: activeTab === 'membership' ? '#ffffff' : '#15803d',
                border: '1.5px solid #16a34a',
                borderRadius: '8px',
                padding: '9px 18px',
                fontSize: '13.5px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              ★ सदस्यता अपग्रेड करें
            </button>
          )}
        </div>

        {/* TAB 1: MY ARTICLES */}
        {activeTab === 'overview' && (
          <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.04)' }}>
            {loading ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>डेटा लोड हो रहा है...</div>
            ) : articles.length === 0 ? (
              <div style={{ padding: '60px 20px', textAlign: 'center', color: '#64748b' }}>
                <p style={{ fontSize: '17px', color: '#0f172a', fontWeight: 600, marginBottom: '6px' }}>आपने अभी तक कोई खबर सबमिट नहीं की है</p>
                <p style={{ fontSize: '13.5px', margin: 0, color: '#64748b' }}>खबर भेजने के लिए ऊपर "+ नई खबर भेजें" बटन पर क्लिक करें।</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13.5px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                      <th style={{ padding: '14px 18px' }}>शीर्षक (Title)</th>
                      <th style={{ padding: '14px 18px' }}>श्रेणी</th>
                      <th style={{ padding: '14px 18px' }}>पोर्टल</th>
                      <th style={{ padding: '14px 18px' }}>सत्यापन स्थिति (Status)</th>
                      <th style={{ padding: '14px 18px' }}>रीडर व्यूज़</th>
                    </tr>
                  </thead>
                  <tbody>
                    {articles.map((art, idx) => (
                      <tr key={art.id} style={{ borderBottom: idx === articles.length - 1 ? 'none' : '1px solid #f1f5f9' }}>
                        <td style={{ padding: '14px 18px', color: '#0f172a', fontWeight: 600 }}>
                          {art.title}
                        </td>
                        <td style={{ padding: '14px 18px', color: '#475569' }}>
                          {art.category}
                        </td>
                        <td style={{ padding: '14px 18px', color: themeColor, fontWeight: 600 }}>
                          {NETWORK_WEBSITES.find(w => w.slug === art.siteId)?.name || art.siteId}
                        </td>
                        <td style={{ padding: '14px 18px' }}>
                          <span
                            style={{
                              display: 'inline-block',
                              padding: '3px 12px',
                              borderRadius: '20px',
                              fontSize: '11.5px',
                              fontWeight: 600,
                              backgroundColor: art.status === 'published' || art.status === 'approved' ? '#dcfce7' : '#fef3c7',
                              color: art.status === 'published' || art.status === 'approved' ? '#15803d' : '#b45309',
                              border: `1px solid ${art.status === 'published' || art.status === 'approved' ? '#bbf7d0' : '#fde68a'}`
                            }}
                          >
                            {art.status === 'published' || art.status === 'approved' ? '✓ लाइव (Approved)' : '⏳ समीक्षाधीन (Pending)'}
                          </span>
                        </td>
                        <td style={{ padding: '14px 18px', color: '#0284c7', fontWeight: 600 }}>
                          👁️ {art.views || 0}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: CREATE & SUBMIT ARTICLE (Sirf Hindi Names Dropdown me) */}
        {activeTab === 'create-article' && (
          <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '32px', maxWidth: '820px', margin: '0 auto', boxShadow: '0 4px 14px rgba(0,0,0,0.04)' }}>
            <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#0f172a', margin: '0 0 6px 0' }}>नई खबर सबमिट करें (सत्यापन हेतु)</h2>
            <p style={{ fontSize: '13.5px', color: '#64748b', margin: '0 0 24px 0' }}>
              आपके द्वारा भेजी गई खबर संपादक की समीक्षा के बाद पोर्टल पर आपके नाम से लाइव प्रकाशित होगी।
            </p>

            <form onSubmit={handleSubmitArticle} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>खबर का मुख्य शीर्षक (Headline) *</label>
                <input
                  type="text"
                  required
                  placeholder="उदा. भरूच में विकास योजनाओं का शुभारंभ, जनता में भारी उत्साह..."
                  value={artTitle}
                  onChange={(e) => setArtTitle(e.target.value)}
                  style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#f8fafc', border: '1.5px solid #cbd5e1', borderRadius: '8px', padding: '11px 14px', color: '#0f172a', fontSize: '14px', outline: 'none' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>पोर्टल चयन (किस वेबसाइट पर लगाना है) *</label>
                  <select
                    value={artSiteId}
                    onChange={(e) => setArtSiteId(e.target.value)}
                    style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#f8fafc', border: '1.5px solid #cbd5e1', borderRadius: '8px', padding: '11px 14px', color: '#0f172a', fontSize: '13.5px', outline: 'none', cursor: 'pointer' }}
                  >
                    {NETWORK_WEBSITES.map(w => (
                      <option key={w.slug} value={w.slug}>
                        {w.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>श्रेणी (Category)</label>
                  <select
                    value={artCategory}
                    onChange={(e) => setArtCategory(e.target.value)}
                    style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#f8fafc', border: '1.5px solid #cbd5e1', borderRadius: '8px', padding: '11px 14px', color: '#0f172a', fontSize: '13.5px', outline: 'none', cursor: 'pointer' }}
                  >
                    <option value="राजनीति">राजनीति</option>
                    <option value="अपराध">अपराध</option>
                    <option value="व्यापार">व्यापार</option>
                    <option value="राज्य">राज्य / ज़िला</option>
                    <option value="खेल">खेल</option>
                    <option value="स्वास्थ्य">स्वास्थ्य</option>
                    <option value="जीवनशैली">जीवनशैली</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>संक्षिप्त विवरण (Summary)</label>
                <textarea
                  rows={2}
                  placeholder="खबर का 1-2 लाइन का मुख्य सार लिखें..."
                  value={artSummary}
                  onChange={(e) => setArtSummary(e.target.value)}
                  style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#f8fafc', border: '1.5px solid #cbd5e1', borderRadius: '8px', padding: '11px 14px', color: '#0f172a', fontSize: '13.5px', outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>पूरी खबर का विवरण (Full Content) *</label>
                <textarea
                  rows={6}
                  required
                  placeholder="विस्तार से पूरी खबर लिखें..."
                  value={artContent}
                  onChange={(e) => setArtContent(e.target.value)}
                  style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#f8fafc', border: '1.5px solid #cbd5e1', borderRadius: '8px', padding: '11px 14px', color: '#0f172a', fontSize: '14px', lineHeight: 1.6, outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>फ़ोटो इमेज लिंक (Image URL)</label>
                <input
                  type="url"
                  placeholder="https://example.com/news-photo.jpg"
                  value={artImage}
                  onChange={(e) => setArtImage(e.target.value)}
                  style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#f8fafc', border: '1.5px solid #cbd5e1', borderRadius: '8px', padding: '11px 14px', color: '#0f172a', fontSize: '13.5px', outline: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setActiveTab('overview')}
                  style={{ backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', color: '#475569', padding: '10px 20px', borderRadius: '8px', fontSize: '13.5px', fontWeight: 600, cursor: 'pointer' }}
                >
                  रद्द करें
                </button>
                <button
                  type="submit"
                  disabled={submittingArticle}
                  style={{ backgroundColor: themeColor, border: 'none', color: '#ffffff', padding: '11px 26px', borderRadius: '8px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
                >
                  {submittingArticle ? 'सबमिट हो रहा है...' : 'सबमिट करें (सत्यापन हेतु)'}
                </button>
              </div>

            </form>
          </div>
        )}

        {/* TAB 3: ID CARD & CERTIFICATE */}
        {activeTab === 'id-card' && (
          <div style={{ maxWidth: '900px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#0f172a', margin: 0 }}>पत्रकार प्रेस आईडी कार्ड & प्रमाणपत्र</h2>
                <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0 0' }}>डिजिटल डाउनलोड करें या घर बैठे ओरिजिनल लैमिनेटेड किट मंगवाएं।</p>
              </div>
              <button
                onClick={() => window.print()}
                style={{ backgroundColor: themeColor, color: '#fff', border: 'none', padding: '10px 18px', borderRadius: '8px', fontWeight: 700, fontSize: '13.5px', cursor: 'pointer' }}
              >
                📥 डिजिटल डाउनलोड / प्रिंट
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '24px' }}>
              
              {/* ID Card */}
              <div style={{ backgroundColor: '#ffffff', color: '#0f172a', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 8px 24px rgba(0,0,0,0.06)', border: `2px solid ${themeColor}` }}>
                <div style={{ backgroundColor: themeColor, padding: '16px', textAlign: 'center', color: '#ffffff' }}>
                  <b style={{ fontSize: '18px', letterSpacing: '0.5px' }}>{siteName} डिजिटल मीडिया</b>
                  <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.9 }}>Official Press Identity Card</div>
                </div>

                <div style={{ padding: '22px', textAlign: 'center' }}>
                  <img 
                    src={reporter?.photo || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400'} 
                    alt={reporter?.name} 
                    style={{ width: '92px', height: '92px', borderRadius: '50%', objectFit: 'cover', border: `3px solid ${themeColor}`, margin: '0 auto 12px' }} 
                  />
                  <h3 style={{ fontSize: '19px', fontWeight: 700, margin: '0 0 2px 0', color: '#0f172a' }}>{reporter?.name}</h3>
                  <div style={{ fontSize: '12.5px', color: themeColor, fontWeight: 700 }}>{reporter?.designation}</div>

                  <div style={{ marginTop: '18px', borderTop: '1px dashed #cbd5e1', paddingTop: '14px', textAlign: 'left', fontSize: '12.5px', color: '#334155', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div><b>प्रेस आईडी सं:</b> <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{reporter?.idNumber}</span></div>
                    <div><b>संपर्क:</b> +91 {reporter?.phone}</div>
                    <div><b>वैधता (Validity):</b> {reporter?.validTill}</div>
                    <div><b>मुख्यालय:</b> स्टेशन रोड, भरूच (गुजरात)</div>
                  </div>

                  <div style={{ marginTop: '16px', background: '#f8fafc', padding: '10px', borderRadius: '8px', fontSize: '10.5px', color: '#64748b' }}>
                    यह कार्ड अधिकृत समाचार संकलन हेतु मान्य है। कानून व्यवस्था के अनुपालन में सहयोग अपेक्षित है।
                  </div>
                </div>
              </div>

              {/* Certificate */}
              <div style={{ backgroundColor: '#fffdfa', color: '#1e293b', borderRadius: '16px', padding: '26px', border: `6px double ${themeColor}`, boxShadow: '0 8px 24px rgba(0,0,0,0.06)', textAlign: 'center' }}>
                <div style={{ fontSize: '11.5px', color: themeColor, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase' }}>
                  Certificate of Accreditation
                </div>
                <h3 style={{ fontSize: '22px', fontWeight: 700, margin: '10px 0', color: '#78350f', fontFamily: 'Georgia, serif' }}>
                  प्रमाणपत्र एवं अधिमान्यता
                </h3>
                <p style={{ fontSize: '14px', lineHeight: 1.7, color: '#451a03', margin: '16px 0' }}>
                  प्रमाणित किया जाता है कि <b>श्री/श्रीमती {reporter?.name}</b> हमारे डिजिटल मीडिया नेटवर्क '{siteName}' के अधिकृत पत्रकार के रूप में पंजीकृत हैं।
                </p>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '32px', borderTop: `1px solid ${themeColor}`, paddingTop: '12px', fontSize: '11.5px', color: '#78350f' }}>
                  <div>
                    <b>आईडी सं:</b> <span style={{ fontFamily: 'monospace' }}>{reporter?.idNumber}</span>
                  </div>
                  <div>
                    <b>हस्ताक्षर:</b> मुख्य संपादक
                  </div>
                </div>
              </div>

            </div>

            {/* Delivery CTA */}
            <div style={{ marginTop: '24px', backgroundColor: '#ffffff', border: `1.5px solid ${themeColor}`, borderRadius: '14px', padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px', boxShadow: '0 4px 12px rgba(0,0,0,0.04)' }}>
              <div>
                <b style={{ color: '#0f172a', fontSize: '16px' }}>क्या आपको ओरिजिनल लैमिनेटेड कार्ड + डोरी + सील प्रमाणपत्र घर पर चाहिए?</b>
                <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>मात्र ₹299 डिलीवरी व प्रिंटिंग शुल्क में स्पीड पोस्ट द्वारा आपके पते पर भेज दिया जाएगा।</p>
              </div>
              <button
                onClick={() => setActiveTab('delivery')}
                style={{ backgroundColor: themeColor, color: '#fff', border: 'none', padding: '11px 22px', borderRadius: '8px', fontWeight: 700, fontSize: '13.5px', cursor: 'pointer' }}
              >
                घर मंगवाएं (₹299)
              </button>
            </div>

          </div>
        )}

        {/* TAB 4: DELIVERY FORM (₹299) */}
        {activeTab === 'delivery' && (
          <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '32px', maxWidth: '650px', margin: '0 auto', boxShadow: '0 4px 14px rgba(0,0,0,0.04)' }}>
            <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#0f172a', margin: '0 0 6px 0' }}>प्रेस किट होम डिलीवरी ऑर्डर (₹299)</h2>
            <p style={{ fontSize: '13.5px', color: '#64748b', margin: '0 0 22px 0' }}>
              किट में शामिल: हार्ड लैमिनेटेड प्रेस कार्ड, ब्रांडेड नेक डोरी (Lanyard), आधिकारिक अधिमान्यता प्रमाणपत्र व वाहन प्रेस स्टिकर।
            </p>

            <form onSubmit={handleDeliveryPayment} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>पत्रकार का पूरा नाम *</label>
                <input
                  type="text"
                  required
                  defaultValue={reporter?.name}
                  onChange={(e) => setDelName(e.target.value)}
                  style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#f8fafc', border: '1.5px solid #cbd5e1', borderRadius: '8px', padding: '11px 14px', color: '#0f172a', fontSize: '13.5px', outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>डिलीवरी संपर्क नंबर (WhatsApp) *</label>
                <input
                  type="tel"
                  required
                  defaultValue={reporter?.phone}
                  onChange={(e) => setDelPhone(e.target.value)}
                  style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#f8fafc', border: '1.5px solid #cbd5e1', borderRadius: '8px', padding: '11px 14px', color: '#0f172a', fontSize: '13.5px', outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>पूरा कूरियर पता (मकान नं, गली, लैंडमार्क, तहसील व ज़िला) *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="उदा. मकान नं 45, पटेल नगर, नज़दीक बस स्टैंड, भरूच, गुजरात"
                  value={delAddress}
                  onChange={(e) => setDelAddress(e.target.value)}
                  style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#f8fafc', border: '1.5px solid #cbd5e1', borderRadius: '8px', padding: '11px 14px', color: '#0f172a', fontSize: '13.5px', outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>पिनकोड (Pincode) *</label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  placeholder="392001"
                  value={delPincode}
                  onChange={(e) => setDelPincode(e.target.value)}
                  style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#f8fafc', border: '1.5px solid #cbd5e1', borderRadius: '8px', padding: '11px 14px', color: '#0f172a', fontSize: '13.5px', outline: 'none' }}
                />
              </div>

              <div style={{ backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', padding: '14px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '14px', color: '#334155', fontWeight: 600 }}>कुल डिलीवरी व प्रिंटिंग शुल्क:</span>
                <b style={{ fontSize: '20px', color: '#16a34a' }}>₹299</b>
              </div>

              <button
                type="submit"
                disabled={payingDelivery}
                style={{ backgroundColor: themeColor, border: 'none', color: '#ffffff', padding: '13px', borderRadius: '8px', fontSize: '15px', fontWeight: 700, cursor: 'pointer', marginTop: '6px' }}
              >
                {payingDelivery ? 'पेमेंट शुरू हो रहा है...' : '₹299 का ऑनलाइन भुगतान करें'}
              </button>
            </form>
          </div>
        )}

        {/* TAB 5: MEMBERSHIP PURCHASE (₹499) */}
        {activeTab === 'membership' && (
          <div style={{ maxWidth: '600px', margin: '0 auto', backgroundColor: '#ffffff', border: `2px solid ${themeColor}`, borderRadius: '16px', padding: '36px', textAlign: 'center', boxShadow: '0 8px 24px rgba(0,0,0,0.06)' }}>
            <span style={{ backgroundColor: '#fff7ed', color: themeColor, border: `1px solid ${themeColor}`, padding: '4px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: 700 }}>
              वार्षिक पत्रकार सदस्यता (ANNUAL PLAN)
            </span>
            <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', margin: '16px 0 6px 0' }}>असीमित खबर प्रकाशन सदस्यता</h2>
            <div style={{ fontSize: '38px', fontWeight: 800, color: themeColor, margin: '14px 0' }}>₹499 <small style={{ fontSize: '14px', color: '#64748b' }}>/ वर्ष</small></div>

            <div style={{ textAlign: 'left', margin: '22px 0', borderTop: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0', padding: '18px 0', fontSize: '14px', color: '#334155', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div>✓ सभी 8 न्यूज़ नेटवर्क वेबसाइट्स पर खबरें पोस्ट करने की अनुमति</div>
              <div>✓ डिजिटल प्रेस आईडी कार्ड एवं अधिकृत रिपोर्टर प्रमाणपत्र</div>
              <div>✓ लाइव न्यूज़ फीड में लेखक के नाम से बायलाइन (Byline)</div>
              <div>✓ 24/7 एडिटोरियल डेस्क सपोर्ट</div>
            </div>

            <button
              onClick={handleBuyMembership}
              style={{ backgroundColor: themeColor, color: '#ffffff', border: 'none', padding: '13px 28px', borderRadius: '8px', fontSize: '15px', fontWeight: 700, cursor: 'pointer', width: '100%' }}
            >
              सदस्यता लें एवं ₹499 भुगतान करें
            </button>
          </div>
        )}

      </div>
    </div>
  );
}