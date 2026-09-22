'use client';

import React, { useState, useEffect, useRef } from 'react';
import { db } from '@/lib/firebase';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  serverTimestamp,
  doc,
  updateDoc
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

export default function PatrakarDashboard() {
  const [reporter, setReporter] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'create-article' | 'id-card' | 'membership' | 'delivery'>('overview');
  const [articles, setArticles] = useState<ReporterArticle[]>([]);
  const [loading, setLoading] = useState(true);

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

  // 1. Persistent Login Session Check
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
      // Default Reporter fallback if redirected
      const defaultReporter = {
        name: 'संवाददाता',
        phone: '9876543210',
        email: 'reporter@thelocalleader.in',
        membershipActive: false,
        idNumber: 'LL-PRESS-7821',
        designation: 'वरिष्ठ संवाददाता (Crime & Politics)',
        validTill: '31 Dec 2027',
        photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400'
      };
      setReporter(defaultReporter);
      localStorage.setItem('patrakar_user', JSON.stringify(defaultReporter));
    }
  }, []);

  // 2. Fetch reporter's submitted articles in real-time
  useEffect(() => {
    if (!reporter?.phone && !reporter?.email) return;

    setLoading(true);
    const reporterIdentifier = reporter.phone || reporter.email;
    const q = query(
      collection(db, 'articles'),
      where('authorIdentifier', '==', reporterIdentifier)
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

  // Load Razorpay Script dynamically if missing
  useEffect(() => {
    if (!document.getElementById('razorpay-script')) {
      const script = document.createElement('script');
      script.id = 'razorpay-script';
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  // Logout handler
  const handleLogout = () => {
    localStorage.removeItem('patrakar_user');
    window.location.href = '/patrakar/login';
  };

  // 3. Razorpay Membership Payment (₹499)
  const handleBuyMembership = () => {
    if (!window.Razorpay) {
      alert('Razorpay पेमेंट गेटवे लोड हो रहा है, कृपया 2 सेकंड प्रतीक्षा करें।');
      return;
    }

    const options = {
      key: 'rzp_test_YourTestKeyHere', // Replace with test key or generic test ID
      amount: 499 * 100, // amount in paisa
      currency: 'INR',
      name: 'द लोकल लीडर प्रेस नेटवर्क',
      description: 'वार्षिक पत्रकार सदस्यता (Unlimited News Publishing)',
      handler: async function (response: any) {
        alert('सदस्यता भुगतान सफल! अब आप खबरें सबमिट कर सकते हैं।');
        const updated = { ...reporter, membershipActive: true };
        setReporter(updated);
        localStorage.setItem('patrakar_user', JSON.stringify(updated));

        // Save transaction to Firebase
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
        color: '#ea580c'
      }
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
  };

  // 4. Razorpay Physical ID & Certificate Home Delivery (₹299)
  const handleDeliveryPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!delAddress || !delPincode || !delPhone) {
      alert('कृपया पूरा डिलीवरी पता, पिनकोड और संपर्क नंबर भरें।');
      return;
    }

    if (!window.Razorpay) {
      alert('पेमेंट गेटवे लोड हो रहा है...');
      return;
    }

    setPayingDelivery(true);
    const options = {
      key: 'rzp_test_YourTestKeyHere',
      amount: 299 * 100, // ₹299
      currency: 'INR',
      name: 'द लोकल लीडर प्रेस नेटवर्क',
      description: 'प्रेस आईडी कार्ड एवं प्रमाणपत्र होम डिलीवरी शुल्क',
      handler: async function (response: any) {
        setPayingDelivery(false);
        alert('डिलीवरी शुल्क ₹299 का भुगतान सफल! आपकी किट 5-7 कार्यदिवसों में आपके पते पर भेज दी जाएगी।');

        // Save delivery request to Firebase for Admin dispatch
        await addDoc(collection(db, 'delivery_requests'), {
          reporterName: delName || reporter.name,
          reporterPhone: delPhone,
          address: delAddress,
          pincode: delPincode,
          idNumber: reporter.idNumber,
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
        color: '#ea580c'
      }
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
    setPayingDelivery(false);
  };

  // 5. Submit News Article (Goes to Admin for Verification)
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
        status: 'pending', // Awaiting Admin verification
        views: 0,
        createdAt: serverTimestamp()
      });

      alert('खबर सफलतापूर्वक सबमिट कर दी गई है! एडमिन द्वारा सत्यापन (Verification) के बाद यह लाइव हो जाएगी।');
      
      // Reset form
      setArtTitle('');
      setArtSummary('');
      setArtContent('');
      setArtImage('');
      setSubmittingArticle(false);
      setActiveTab('overview');
    } catch (err: any) {
      setSubmittingArticle(false);
      alert('खबर सबमिट करने में त्रुटि: ' + err.message);
    }
  };

  // Statistics
  const totalArticles = articles.length;
  const approvedArticles = articles.filter(a => a.status === 'published' || a.status === 'approved').length;
  const pendingArticles = articles.filter(a => a.status === 'pending').length;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#070b14', color: '#e2e8f0', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      
      {/* Top Navbar */}
      <header style={{ backgroundColor: '#0e1626', borderBottom: '1px solid #1e293b', padding: '14px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '20px' }}>✍️</span>
          <div>
            <b style={{ fontSize: '17px', color: '#ffffff' }}>पत्रकार संवाददाता पोर्टल</b>
            <div style={{ fontSize: '11px', color: '#94a3b8' }}>
              संवाददाता: <b style={{ color: '#ea580c' }}>{reporter?.name}</b> · {reporter?.phone} · आईडी: {reporter?.idNumber}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <Link href="/" style={{ fontSize: '13px', color: '#ea580c', textDecoration: 'none', fontWeight: 600 }}>
            ← मुख्य वेबसाइट
          </Link>
          <button 
            onClick={handleLogout}
            style={{ backgroundColor: '#1e293b', border: '1px solid #334155', color: '#f87171', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}
          >
            लॉगआउट
          </button>
        </div>
      </header>

      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '24px' }}>
        
        {/* Metric Cards Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          
          <div style={{ backgroundColor: '#0e1626', border: '1px solid #1e293b', borderRadius: '12px', padding: '18px' }}>
            <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>कुल सबमिट की गई खबरें</span>
            <div style={{ fontSize: '28px', fontWeight: 700, color: '#ffffff', marginTop: '6px' }}>{totalArticles}</div>
            <span style={{ fontSize: '11px', color: '#64748b' }}>आपके द्वारा भेजी गई कुल खबरें</span>
          </div>

          <div style={{ backgroundColor: '#0e1626', border: '1px solid #1e293b', borderRadius: '12px', padding: '18px' }}>
            <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>लाइव / स्वीकृत (Published)</span>
            <div style={{ fontSize: '28px', fontWeight: 700, color: '#34d399', marginTop: '6px' }}>{approvedArticles}</div>
            <span style={{ fontSize: '11px', color: '#64748b' }}>संपादक द्वारा सत्यापित एवं लाइव</span>
          </div>

          <div style={{ backgroundColor: '#0e1626', border: '1px solid #1e293b', borderRadius: '12px', padding: '18px' }}>
            <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>समीक्षा हेतु लंबित (Pending)</span>
            <div style={{ fontSize: '28px', fontWeight: 700, color: '#fbbf24', marginTop: '6px' }}>{pendingArticles}</div>
            <span style={{ fontSize: '11px', color: '#64748b' }}>एडमिन सत्यापन की प्रतीक्षा में</span>
          </div>

          <div style={{ backgroundColor: '#0e1626', border: '1px solid #1e293b', borderRadius: '12px', padding: '18px' }}>
            <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>सदस्यता स्थिति (Plan)</span>
            <div style={{ fontSize: '18px', fontWeight: 700, color: reporter?.membershipActive ? '#34d399' : '#f87171', marginTop: '10px' }}>
              {reporter?.membershipActive ? '✓ सक्रिय (Active)' : 'अक्रिय (Inactive)'}
            </div>
            <span style={{ fontSize: '11px', color: '#64748b' }}>
              {reporter?.membershipActive ? 'असीमित खबर प्रकाशन चालू' : 'खबर भेजने हेतु प्लान आवश्यक'}
            </span>
          </div>

        </div>

        {/* Tab Navigation */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
          <button
            onClick={() => setActiveTab('overview')}
            style={{
              backgroundColor: activeTab === 'overview' ? '#ea580c' : '#0e1626',
              color: '#ffffff',
              border: '1px solid #1e293b',
              borderRadius: '8px',
              padding: '9px 16px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer'
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
              backgroundColor: activeTab === 'create-article' ? '#ea580c' : '#0e1626',
              color: '#ffffff',
              border: '1px solid #1e293b',
              borderRadius: '8px',
              padding: '9px 16px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            + नई खबर भेजें
          </button>

          <button
            onClick={() => setActiveTab('id-card')}
            style={{
              backgroundColor: activeTab === 'id-card' ? '#ea580c' : '#0e1626',
              color: '#ffffff',
              border: '1px solid #1e293b',
              borderRadius: '8px',
              padding: '9px 16px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            🪪 प्रेस आईडी कार्ड & प्रमाणपत्र
          </button>

          <button
            onClick={() => setActiveTab('delivery')}
            style={{
              backgroundColor: activeTab === 'delivery' ? '#ea580c' : '#0e1626',
              color: '#ffffff',
              border: '1px solid #1e293b',
              borderRadius: '8px',
              padding: '9px 16px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            📦 होम डिलीवरी किट (₹299)
          </button>

          {!reporter?.membershipActive && (
            <button
              onClick={() => setActiveTab('membership')}
              style={{
                backgroundColor: activeTab === 'membership' ? '#10b981' : '#064e3b',
                color: '#ffffff',
                border: '1px solid #10b981',
                borderRadius: '8px',
                padding: '9px 16px',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              ★ सदस्यता अपग्रेड करें
            </button>
          )}
        </div>

        {/* TAB 1: MY ARTICLES LIST */}
        {activeTab === 'overview' && (
          <div style={{ backgroundColor: '#0e1626', border: '1px solid #1e293b', borderRadius: '12px', overflow: 'hidden' }}>
            {loading ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>डेटा लोड हो रहा है...</div>
            ) : articles.length === 0 ? (
              <div style={{ padding: '60px 20px', textAlign: 'center', color: '#94a3b8' }}>
                <p style={{ fontSize: '16px', color: '#ffffff', marginBottom: '8px' }}>आपने अभी तक कोई खबर सबमिट नहीं की है</p>
                <p style={{ fontSize: '13px', margin: 0 }}>खबर भेजने के लिए ऊपर "+ नई खबर भेजें" बटन पर क्लिक करें।</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#0a101d', borderBottom: '1px solid #1e293b', color: '#94a3b8', fontSize: '11px', textTransform: 'uppercase' }}>
                      <th style={{ padding: '14px 18px' }}>शीर्षक (Title)</th>
                      <th style={{ padding: '14px 18px' }}>श्रेणी</th>
                      <th style={{ padding: '14px 18px' }}>पोर्टल (Target Site)</th>
                      <th style={{ padding: '14px 18px' }}>सत्यापन स्थिति (Status)</th>
                      <th style={{ padding: '14px 18px' }}>रीडर व्यूज़</th>
                    </tr>
                  </thead>
                  <tbody>
                    {articles.map((art, idx) => (
                      <tr key={art.id} style={{ borderBottom: idx === articles.length - 1 ? 'none' : '1px solid #162238' }}>
                        <td style={{ padding: '14px 18px', color: '#ffffff', fontWeight: 500 }}>
                          {art.title}
                        </td>
                        <td style={{ padding: '14px 18px', color: '#cbd5e1' }}>
                          {art.category}
                        </td>
                        <td style={{ padding: '14px 18px', color: '#ea580c', fontFamily: 'monospace' }}>
                          {art.siteId}
                        </td>
                        <td style={{ padding: '14px 18px' }}>
                          <span
                            style={{
                              display: 'inline-block',
                              padding: '3px 10px',
                              borderRadius: '20px',
                              fontSize: '11px',
                              fontWeight: 600,
                              backgroundColor: art.status === 'published' || art.status === 'approved' ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)',
                              color: art.status === 'published' || art.status === 'approved' ? '#34d399' : '#fbbf24',
                              border: `1px solid ${art.status === 'published' || art.status === 'approved' ? 'rgba(16,185,129,0.3)' : 'rgba(245,158,11,0.3)'}`
                            }}
                          >
                            {art.status === 'published' || art.status === 'approved' ? '✓ लाइव (Approved)' : '⏳ समीक्षाधीन (Pending)'}
                          </span>
                        </td>
                        <td style={{ padding: '14px 18px', color: '#38bdf8' }}>
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

        {/* TAB 2: CREATE & SUBMIT ARTICLE */}
        {activeTab === 'create-article' && (
          <div style={{ backgroundColor: '#0e1626', border: '1px solid #1e293b', borderRadius: '12px', padding: '28px', maxWidth: '800px', margin: '0 auto' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#ffffff', margin: '0 0 6px 0' }}>नई खबर सबमिट करें (सत्यापन हेतु)</h2>
            <p style={{ fontSize: '13px', color: '#94a3b8', margin: '0 0 20px 0' }}>
              आपके द्वारा भेजी गई खबर संपादक की समीक्षा के बाद पोर्टल पर आपके नाम से लाइव प्रकाशित होगी।
            </p>

            <form onSubmit={handleSubmitArticle} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '6px' }}>खबर का मुख्य शीर्षक (Headline) *</label>
                <input
                  type="text"
                  required
                  placeholder="उदा. भरूच में विकास योजनाओं का शुभारंभ, जनता में भारी उत्साह..."
                  value={artTitle}
                  onChange={(e) => setArtTitle(e.target.value)}
                  style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#162238', border: '1px solid #27354f', borderRadius: '6px', padding: '10px 14px', color: '#ffffff', fontSize: '14px' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '6px' }}>पोर्टल चयन (किस वेबसाइट पर लगाना है) *</label>
                  <select
                    value={artSiteId}
                    onChange={(e) => setArtSiteId(e.target.value)}
                    style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#162238', border: '1px solid #27354f', borderRadius: '6px', padding: '10px 14px', color: '#ffffff', fontSize: '13px' }}
                  >
                    <option value="the-local-leader">द लोकल लीडर (the-local-leader)</option>
                    <option value="bazar-karobar">बाज़ार कारोबार (bazar-karobar)</option>
                    <option value="golden-pearl-chronicles">गोल्डन पर्ल क्रॉनिकल्स</option>
                    <option value="desh-ki-aawaz">देश की आवाज़</option>
                    <option value="state-express">द प्रोव्यू टाइम्स</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '6px' }}>खबर श्रेणी (Category)</label>
                  <select
                    value={artCategory}
                    onChange={(e) => setArtCategory(e.target.value)}
                    style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#162238', border: '1px solid #27354f', borderRadius: '6px', padding: '10px 14px', color: '#ffffff', fontSize: '13px' }}
                  >
                    <option value="राजनीति">राजनीति</option>
                    <option value="अपराध">अपराध (Crime)</option>
                    <option value="व्यापार">व्यापार</option>
                    <option value="राज्य">राज्य / ज़िला</option>
                    <option value="खेल">खेल</option>
                    <option value="स्वास्थ्य">स्वास्थ्य</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '6px' }}>खबर का संक्षिप्त विवरण (Summary)</label>
                <textarea
                  rows={2}
                  placeholder="खबर का 1-2 लाइन का मुख्य सार लिखें..."
                  value={artSummary}
                  onChange={(e) => setArtSummary(e.target.value)}
                  style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#162238', border: '1px solid #27354f', borderRadius: '6px', padding: '10px 14px', color: '#ffffff', fontSize: '13px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '6px' }}>पूरी खबर का विवरण (Full Content) *</label>
                <textarea
                  rows={6}
                  required
                  placeholder="विस्तार से खबर लिखें..."
                  value={artContent}
                  onChange={(e) => setArtContent(e.target.value)}
                  style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#162238', border: '1px solid #27354f', borderRadius: '6px', padding: '10px 14px', color: '#ffffff', fontSize: '13px', lineHeight: 1.6 }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '6px' }}>फ़ोटो इमेज लिंक (Image URL)</label>
                <input
                  type="url"
                  placeholder="https://example.com/news-photo.jpg"
                  value={artImage}
                  onChange={(e) => setArtImage(e.target.value)}
                  style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#162238', border: '1px solid #27354f', borderRadius: '6px', padding: '10px 14px', color: '#ffffff', fontSize: '13px' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setActiveTab('overview')}
                  style={{ backgroundColor: '#1e293b', border: '1px solid #334155', color: '#94a3b8', padding: '10px 18px', borderRadius: '6px', fontSize: '13px', cursor: 'pointer' }}
                >
                  रद्द करें
                </button>
                <button
                  type="submit"
                  disabled={submittingArticle}
                  style={{ backgroundColor: '#ea580c', border: 'none', color: '#ffffff', padding: '10px 24px', borderRadius: '6px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
                >
                  {submittingArticle ? 'सबमिट हो रहा है...' : 'सबमिट करें (सत्यापन हेतु)'}
                </button>
              </div>

            </form>
          </div>
        )}

        {/* TAB 3: PRESS ID CARD & CERTIFICATE */}
        {activeTab === 'id-card' && (
          <div style={{ maxWidth: '900px', margin: '0 auto' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#ffffff', margin: 0 }}>पत्रकार प्रेस आईडी कार्ड & प्रमाणपत्र</h2>
                <p style={{ fontSize: '12px', color: '#94a3b8', margin: '4px 0 0 0' }}>डिजिटल डाउनलोड करें या घर बैठे ओरिजिनल लैमिनेटेड किट मंगवाएं।</p>
              </div>
              <button
                onClick={() => window.print()}
                style={{ backgroundColor: '#ea580c', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}
              >
                📥 डिजिटल डाउनलोड / प्रिंट
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px' }}>
              
              {/* PRESS ID CARD PREVIEW */}
              <div style={{ backgroundColor: '#ffffff', color: '#0f172a', borderRadius: '14px', overflow: 'hidden', boxShadow: '0 10px 25px rgba(0,0,0,0.4)', border: '2px solid #ea580c' }}>
                <div style={{ backgroundColor: '#ea580c', padding: '14px', textAlign: 'center', color: '#ffffff' }}>
                  <b style={{ fontSize: '17px', letterSpacing: '0.5px' }}>द लोकल लीडर डिजिटल मीडिया</b>
                  <div style={{ fontSize: '10.5px', textTransform: 'uppercase', letterSpacing: '1px' }}>Official Press Identity Card</div>
                </div>

                <div style={{ padding: '20px', textAlign: 'center' }}>
                  <img 
                    src={reporter.photo} 
                    alt={reporter.name} 
                    style={{ width: '90px', height: '90px', borderRadius: '50%', objectFit: 'cover', border: '3px solid #ea580c', margin: '0 auto 12px' }} 
                  />
                  <h3 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 2px 0', color: '#0f172a' }}>{reporter.name}</h3>
                  <div style={{ fontSize: '12px', color: '#ea580c', fontWeight: 600 }}>{reporter.designation}</div>

                  <div style={{ marginTop: '16px', borderTop: '1px dashed #cbd5e1', paddingTop: '12px', textAlign: 'left', fontSize: '12px', color: '#334155', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div><b>प्रेस आईडी सं:</b> {reporter.idNumber}</div>
                    <div><b>संपर्क:</b> +91 {reporter.phone}</div>
                    <div><b>वैधता (Validity):</b> {reporter.validTill}</div>
                    <div><b>मुख्यालय:</b> स्टेशन रोड, भरूच (गुजरात)</div>
                  </div>

                  <div style={{ marginTop: '16px', background: '#f8fafc', padding: '8px', borderRadius: '6px', fontSize: '10px', color: '#64748b' }}>
                    यह कार्ड अधिकृत समाचार संकलन हेतु मान्य है। कानून व्यवस्था के अनुपालन में सहयोग अपेक्षित है।
                  </div>
                </div>
              </div>

              {/* CERTIFICATE PREVIEW */}
              <div style={{ backgroundColor: '#fffdfa', color: '#1e293b', borderRadius: '14px', padding: '24px', border: '6px double #b45309', boxShadow: '0 10px 25px rgba(0,0,0,0.4)', textAlign: 'center' }}>
                <div style={{ fontSize: '11px', color: '#b45309', fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase' }}>
                  Certificate of Accreditation
                </div>
                <h3 style={{ fontSize: '20px', fontWeight: 700, margin: '8px 0', color: '#78350f', fontFamily: 'Georgia, serif' }}>
                  प्रमाणपत्र एवं अधिमान्यता
                </h3>
                <p style={{ fontSize: '13px', lineHeight: 1.6, color: '#451a03', margin: '14px 0' }}>
                  प्रमाणित किया जाता है कि <b>श्री/श्रीमती {reporter.name}</b> हमारे डिजिटल मीडिया नेटवर्क 'द लोकल लीडर' के अधिकृत पत्रकार के रूप में पंजीकृत हैं।
                </p>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '28px', borderTop: '1px solid #d97706', paddingTop: '10px', fontSize: '11px', color: '#78350f' }}>
                  <div>
                    <b>आईडी सं:</b> {reporter.idNumber}
                  </div>
                  <div>
                    <b>हस्ताक्षर:</b> मुख्य संपादक
                  </div>
                </div>
              </div>

            </div>

            {/* Delivery CTA Box */}
            <div style={{ marginTop: '24px', backgroundColor: '#0e1626', border: '1px solid #ea580c', borderRadius: '12px', padding: '18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <b style={{ color: '#ffffff', fontSize: '15px' }}>क्या आपको ओरिजिनल लैमिनेटेड कार्ड + डोरी + सील प्रमाणपत्र घर पर चाहिए?</b>
                <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#94a3b8' }}>मात्र ₹299 डिलीवरी व प्रिंटिंग शुल्क में स्पीड पोस्ट द्वारा आपके पते पर भेज दिया जाएगा।</p>
              </div>
              <button
                onClick={() => setActiveTab('delivery')}
                style={{ backgroundColor: '#ea580c', color: '#fff', border: 'none', padding: '9px 18px', borderRadius: '8px', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}
              >
                घर मंगवाएं (₹299)
              </button>
            </div>

          </div>
        )}

        {/* TAB 4: PHYSICAL HOME DELIVERY FORM (₹299) */}
        {activeTab === 'delivery' && (
          <div style={{ backgroundColor: '#0e1626', border: '1px solid #1e293b', borderRadius: '12px', padding: '28px', maxWidth: '650px', margin: '0 auto' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#ffffff', margin: '0 0 6px 0' }}>प्रेस किट होम डिलीवरी ऑर्डर (₹299)</h2>
            <p style={{ fontSize: '13px', color: '#94a3b8', margin: '0 0 20px 0' }}>
              किट में शामिल: हार्ड लैमिनेटेड प्रेस कार्ड, ब्रांडेड नेक डोरी (Lanyard), आधिकारिक अधिमान्यता प्रमाणपत्र व वाहन प्रेस स्टिकर।
            </p>

            <form onSubmit={handleDeliveryPayment} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '6px' }}>पत्रकार का पूरा नाम *</label>
                <input
                  type="text"
                  required
                  defaultValue={reporter?.name}
                  onChange={(e) => setDelName(e.target.value)}
                  style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#162238', border: '1px solid #27354f', borderRadius: '6px', padding: '10px 14px', color: '#ffffff', fontSize: '13px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '6px' }}>डिलीवरी संपर्क नंबर (Calling & WhatsApp) *</label>
                <input
                  type="tel"
                  required
                  defaultValue={reporter?.phone}
                  onChange={(e) => setDelPhone(e.target.value)}
                  style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#162238', border: '1px solid #27354f', borderRadius: '6px', padding: '10px 14px', color: '#ffffff', fontSize: '13px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '6px' }}>पूरा कूरियर पता (मकान नं, गली, लैंडमार्क, तहसील व ज़िला) *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="उदा. मकान नं 45, पटेल नगर, नज़दीक बस स्टैंड, भरूच, गुजरात"
                  value={delAddress}
                  onChange={(e) => setDelAddress(e.target.value)}
                  style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#162238', border: '1px solid #27354f', borderRadius: '6px', padding: '10px 14px', color: '#ffffff', fontSize: '13px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '6px' }}>पिनकोड (Pincode) *</label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  placeholder="392001"
                  value={delPincode}
                  onChange={(e) => setDelPincode(e.target.value)}
                  style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#162238', border: '1px solid #27354f', borderRadius: '6px', padding: '10px 14px', color: '#ffffff', fontSize: '13px' }}
                />
              </div>

              <div style={{ backgroundColor: '#131d33', border: '1px solid #27354f', padding: '12px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', color: '#cbd5e1' }}>कुल डिलीवरी व प्रिंटिंग शुल्क:</span>
                <b style={{ fontSize: '18px', color: '#34d399' }}>₹299</b>
              </div>

              <button
                type="submit"
                disabled={payingDelivery}
                style={{ backgroundColor: '#ea580c', border: 'none', color: '#ffffff', padding: '12px', borderRadius: '6px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', marginTop: '6px' }}
              >
                {payingDelivery ? 'पेमेंट शुरू हो रहा है...' : '₹299 का ऑनलाइन भुगतान करें'}
              </button>

            </form>
          </div>
        )}

        {/* TAB 5: MEMBERSHIP PLAN PURCHASE */}
        {activeTab === 'membership' && (
          <div style={{ maxWidth: '600px', margin: '0 auto', backgroundColor: '#0e1626', border: '2px solid #ea580c', borderRadius: '14px', padding: '32px', textAlign: 'center' }}>
            <span style={{ backgroundColor: 'rgba(234,88,12,0.15)', color: '#ea580c', border: '1px solid #ea580c', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 700 }}>
              वार्षिक पत्रकार सदस्यता (ANNUAL PLAN)
            </span>
            <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#ffffff', margin: '14px 0 6px 0' }}>असीमित खबर प्रकाशन सदस्यता</h2>
            <div style={{ fontSize: '36px', fontWeight: 800, color: '#ea580c', margin: '12px 0' }}>₹499 <small style={{ fontSize: '14px', color: '#94a3b8' }}>/ वर्ष</small></div>

            <div style={{ textAlign: 'left', margin: '20px 0', borderTop: '1px solid #1e293b', borderBottom: '1px solid #1e293b', padding: '16px 0', fontSize: '13.5px', color: '#cbd5e1', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div>✓ सभी न्यूज़ नेटवर्क वेबसाइट्स पर खबरें पोस्ट करने की अनुमति</div>
              <div>✓ डिजिटल प्रेस आईडी कार्ड एवं अधिकृत रिपोर्टर प्रमाणपत्र</div>
              <div>✓ लाइव न्यूज़ फीड में लेखक के नाम से बायलाइन (Byline)</div>
              <div>✓ 24/7 एडिटोरियल डेस्क सपोर्ट</div>
            </div>

            <button
              onClick={handleBuyMembership}
              style={{ backgroundColor: '#ea580c', color: '#ffffff', border: 'none', padding: '12px 28px', borderRadius: '8px', fontSize: '15px', fontWeight: 700, cursor: 'pointer', width: '100%' }}
            >
              सदस्यता लें एवं ₹499 भुगतान करें
            </button>
          </div>
        )}

      </div>
    </div>
  );
}