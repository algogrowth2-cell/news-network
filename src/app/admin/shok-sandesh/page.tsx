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

interface ShokSandeshItem {
  id: string;
  name: string;
  relation: string;
  passedDate: string;
  eventDate: string;
  eventTime?: string;
  venue: string;
  address: string;
  familyMembers: string;
  contactNumber: string;
  photoUrl: string;
  templateId: 'classic-silver' | 'gold-spiritual' | 'slate-peace';
  status: 'pending' | 'approved';
  createdAt?: any;
}

export default function ShokSandeshPage() {
  const [activeTab, setActiveTab] = useState<'feed' | 'create'>('feed');
  const [posts, setPosts] = useState<ShokSandeshItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Template Selection
  const [selectedTemplate, setSelectedTemplate] = useState<'classic-silver' | 'gold-spiritual' | 'slate-peace'>('classic-silver');

  // Form Fields
  const [name, setName] = useState('');
  const [relation, setRelation] = useState('पिता जी');
  const [passedDate, setPassedDate] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventTime, setEventTime] = useState('अपराह्न 1:00 बजे के उपरांत');
  const [venue, setVenue] = useState('समस्त कार्यक्रम हमारे निवास स्थल से संपन्न होंगे');
  const [address, setAddress] = useState('');
  const [familyMembers, setFamilyMembers] = useState('');
  const [contactNumber, setContactNumber] = useState('');

  // Image Handling
  const [imageType, setImageType] = useState<'file' | 'url'>('file');
  const [photoUrl, setPhotoUrl] = useState('');
  const [imagePreview, setImagePreview] = useState<string>('https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400');

  // Payment State
  const [hasMembership, setHasMembership] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Razorpay Key Fallback
  const RAZORPAY_KEY = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_TZSA6UoKATong0';

  // 1. Fetch only Approved Shok Sandesh for Public Feed
  useEffect(() => {
    setLoading(true);
    const q = query(
      collection(db, 'shok_sandesh'),
      where('status', '==', 'approved')
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const list: ShokSandeshItem[] = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data()
      } as ShokSandeshItem));

      setPosts(list);
      setLoading(false);
    }, (err) => {
      console.error(err);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  // Check Local Membership Cache
  useEffect(() => {
    const cached = localStorage.getItem('shok_membership_active');
    if (cached === 'true') {
      setHasMembership(true);
    }
  }, []);

  // Local File Image to Base64
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('कृपया 2 MB से छोटी फ़ोटो चुनें।');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setImagePreview(base64);
      setPhotoUrl(base64);
    };
    reader.readAsDataURL(file);
  };

  // Razorpay Membership Payment (₹199 Shok Sandesh Publication Fee)
  const handleBuyPlan = () => {
    if (!window.Razorpay) {
      alert('पेमेंट गेटवे लोड हो रहा है, कृपया 2 सेकंड बाद पुनः प्रयास करें।');
      return;
    }

    const options = {
      key: RAZORPAY_KEY,
      amount: 199 * 100, // ₹199 in paise
      currency: 'INR',
      name: 'द लोकल लीडर प्रेस',
      description: 'शोक संदेश प्रकाशन शुल्क (E-Tribute Publishing)',
      handler: function (response: any) {
        alert('भुगतान सफल! अब आप अपना शोक संदेश सबमिट कर सकते हैं।');
        setHasMembership(true);
        localStorage.setItem('shok_membership_active', 'true');
      },
      prefill: {
        contact: contactNumber || '9876543210'
      },
      theme: {
        color: '#b45309'
      }
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
  };

  // Submit to Firestore for Admin Approval
  const handleSubmitShokSandesh = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      alert('कृपया दिवंगत स्वजन का नाम दर्ज करें।');
      return;
    }

    if (!hasMembership) {
      alert('शोक संदेश प्रकाशित करने हेतु पहले प्रकाशन प्लान (₹199) सक्रिय करें।');
      handleBuyPlan();
      return;
    }

    try {
      setSubmitting(true);

      await addDoc(collection(db, 'shok_sandesh'), {
        name: name.trim(),
        relation: relation.trim(),
        passedDate: passedDate || 'हाल ही में',
        eventDate: eventDate || 'शीघ्र सूचित किया जाएगा',
        eventTime: eventTime.trim(),
        venue: venue.trim(),
        address: address.trim(),
        familyMembers: familyMembers.trim(),
        contactNumber: contactNumber.trim(),
        photoUrl: photoUrl || imagePreview,
        templateId: selectedTemplate,
        status: 'pending', // Sent for Admin Verification
        createdAt: serverTimestamp()
      });

      alert('शोक संदेश सफलतापूर्वक सबमिट हो गया है! एडमिन द्वारा सत्यापन के बाद यह पोर्टल पर लाइव हो जाएगा।');
      setActiveTab('feed');
      setSubmitting(false);
    } catch (err: any) {
      setSubmitting(false);
      alert('सबमिट करने में त्रुटि: ' + err.message);
    }
  };

  // Card Renderer Component for live preview and feed
  const renderCard = (data: Partial<ShokSandeshItem>, isPreview: boolean = false) => {
    const isSilver = data.templateId === 'classic-silver' || !data.templateId;
    const isGold = data.templateId === 'gold-spiritual';

    return (
      <div 
        style={{
          width: '100%',
          maxWidth: isPreview ? '100%' : '480px',
          margin: '0 auto',
          background: isSilver 
            ? 'linear-gradient(180deg, #f8fafc 0%, #edf2f7 50%, #e2e8f0 100%)' 
            : isGold 
            ? 'linear-gradient(180deg, #fffdf7 0%, #fef3c7 50%, #fde68a 100%)' 
            : 'linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)',
          borderRadius: '16px',
          border: isSilver ? '3px solid #cbd5e1' : isGold ? '3px solid #d97706' : '3px solid #94a3b8',
          boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
          padding: '24px 20px',
          boxSizing: 'border-box',
          position: 'relative',
          overflow: 'hidden',
          textAlign: 'center',
          fontFamily: '"Mukta", system-ui, sans-serif'
        }}
      >
        {/* Top Sacred Header */}
        <div style={{ fontSize: '13px', fontWeight: 700, color: '#64748b', letterSpacing: '1px', marginBottom: '12px' }}>
          ॥ ॐ शान्तिः शान्तिः शान्तिः ॥
        </div>

        {/* Circular Photo Frame (Fixed aspect ratio, fits image properly without stretching) */}
        <div style={{
          width: '130px',
          height: '130px',
          margin: '0 auto 14px',
          borderRadius: '50%',
          padding: '4px',
          background: '#ffffff',
          border: isSilver ? '3px solid #94a3b8' : isGold ? '3px solid #b45309' : '3px solid #64748b',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <img 
            src={data.photoUrl || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400'} 
            alt={data.name || 'स्वर्गीय'} 
            style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} 
          />
        </div>

        {/* Bhavpurna Shradhanjali Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', margin: '0 0 10px' }}>
          <span style={{ fontSize: '16px' }}>🙏</span>
          <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#1e293b', margin: 0, fontFamily: 'Georgia, serif' }}>
            ॥ भावपूर्ण श्रद्धांजलि ॥
          </h3>
          <span style={{ fontSize: '16px' }}>🙏</span>
        </div>

        {/* Deceased Information */}
        <p style={{ fontSize: '13.5px', color: '#475569', lineHeight: 1.6, margin: '0 0 14px' }}>
          अत्यंत दुःख के साथ सूचित करना पड़ रहा है कि हमारे श्रद्धेय {data.relation || 'स्वजन'}, <br />
          <b style={{ fontSize: '17px', color: '#0f172a', fontWeight: 700 }}>
            स्व० श्री {data.name || 'रामप्रसाद जी'}
          </b> <br />
          का स्वर्गवास {data.passedDate || 'दिनांक 10.04.202X'} को हो गया है। <br />
          <span style={{ fontSize: '12.5px', color: '#64748b' }}>
            अतः आपसे निवेदन है कि उनकी दिवंगत आत्मा की शांति हेतु आयोजित निम्नलिखित कार्यक्रम में सम्मिलित होकर हमें कृतार्थ करें।
          </span>
        </p>

        {/* Divider Flower Line */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', margin: '14px 0 10px' }}>
          <span>🌸</span>
          <h4 style={{ fontSize: '16px', fontWeight: 700, color: isGold ? '#92400e' : '#334155', margin: 0 }}>
            ॥ तेरहवीं / पगड़ी कार्यक्रम ॥
          </h4>
          <span>🌸</span>
        </div>

        {/* Program Schedule Details */}
        <div style={{ backgroundColor: '#ffffff', borderRadius: '10px', padding: '12px 14px', border: '1px solid #e2e8f0', fontSize: '13px', color: '#334155', marginBottom: '14px', lineHeight: 1.6 }}>
          <div><b>कार्यक्रम दिनांक:</b> {data.eventDate || '20-04-202X'}</div>
          {data.eventTime && <div><b>समय:</b> {data.eventTime}</div>}
          <div style={{ marginTop: '4px', color: '#64748b' }}>{data.venue || 'समस्त कार्यक्रम हमारे निवास स्थल से संपन्न होंगे।'}</div>
          {data.address && <div style={{ fontSize: '12px', color: '#1e293b', marginTop: '4px' }}><b>स्थान:</b> {data.address}</div>}
        </div>

        {/* Traditional Diya Artwork Indicator */}
        <div style={{ fontSize: '20px', letterSpacing: '4px', margin: '4px 0 10px' }}>
          🪔 🪔 🪔
        </div>

        {/* Shokakul Parivar */}
        <div style={{ borderTop: '1px solid #cbd5e1', paddingTop: '10px' }}>
          <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', marginBottom: '4px' }}>
            ॥ शोकाकुल परिवार ॥
          </div>
          <div style={{ fontSize: '12.5px', color: '#475569', lineHeight: 1.5 }}>
            {data.familyMembers || 'समस्त जोशी परिवार एवं मित्रगण'}
          </div>
          {data.contactNumber && (
            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
              संपर्क सूत्र: {data.contactNumber}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', color: '#1e293b', fontFamily: '"Mukta", system-ui, sans-serif' }}>
      
      {/* Top Banner Header */}
      <header style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #e2e8f0', padding: '16px 24px', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '24px' }}>🕯️</span>
            <div>
              <h1 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', margin: 0 }}>शोक संदेश एवं श्रद्धांजलि मंच</h1>
              <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>डिजिटल श्रद्धांजलि कार्ड एवं दिवंगत स्वजनों के स्मृति संदेश</p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <Link href="/" style={{ fontSize: '13px', color: '#ea580c', textDecoration: 'none', fontWeight: 600, padding: '8px 12px' }}>
              ← मुख्य वेबसाइट
            </Link>

            <button
              onClick={() => setActiveTab('create')}
              style={{
                backgroundColor: '#b45309',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                padding: '9px 18px',
                fontSize: '13.5px',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(180,83,9,0.2)'
              }}
            >
              + शोक संदेश प्रकाशित करें
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '24px 16px' }}>

        {/* Tab Navigation */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
          <button
            onClick={() => setActiveTab('feed')}
            style={{
              backgroundColor: activeTab === 'feed' ? '#0f172a' : '#ffffff',
              color: activeTab === 'feed' ? '#ffffff' : '#64748b',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              padding: '8px 18px',
              fontSize: '13.5px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            सभी शोक संदेश ({posts.length})
          </button>

          <button
            onClick={() => setActiveTab('create')}
            style={{
              backgroundColor: activeTab === 'create' ? '#0f172a' : '#ffffff',
              color: activeTab === 'create' ? '#ffffff' : '#64748b',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              padding: '8px 18px',
              fontSize: '13.5px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            नया कार्ड बनाएँ
          </button>
        </div>

        {/* ── 1. PUBLIC FEED OF APPROVED POSTS ── */}
        {activeTab === 'feed' && (
          <div>
            {loading ? (
              <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>शोक संदेश लोड हो रहे हैं...</div>
            ) : posts.length === 0 ? (
              <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '60px 20px', textAlign: 'center' }}>
                <span style={{ fontSize: '32px' }}>🕊️</span>
                <h3 style={{ fontSize: '18px', color: '#0f172a', margin: '12px 0 6px' }}>अभी कोई सार्वजनिक शोक संदेश उपलब्ध नहीं है</h3>
                <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 18px' }}>अपने दिवंगत स्वजन की स्मृति में डिजिटल श्रद्धांजलि कार्ड प्रकाशित करने के लिए नया कार्ड बनाएँ।</p>
                <button
                  onClick={() => setActiveTab('create')}
                  style={{ backgroundColor: '#b45309', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', fontSize: '13.5px' }}
                >
                  + नया शोक संदेश पोस्ट करें
                </button>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px' }}>
                {posts.map((item) => (
                  <div key={item.id}>
                    {renderCard(item)}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── 2. CREATE SHOK SANDESH (CANVA TEMPLATE DESIGNER & FORM) ── */}
        {activeTab === 'create' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '32px', alignItems: 'flex-start' }}>
            
            {/* Left: Input Form */}
            <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '28px', boxShadow: '0 4px 14px rgba(0,0,0,0.04)' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', margin: '0 0 6px' }}>शोक संदेश कार्ड विवरण भरें</h2>
              <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 20px' }}>
                विवरण भरने पर दाईं ओर लाइव कार्ड का प्रीव्यू दिखेगा। सबमिट करने पर एडमिन सत्यापन के बाद यह लाइव होगा।
              </p>

              {/* Template Style Chooser */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '8px' }}>
                  कार्ड डिज़ाइन थीम चुनें (Canva Style Template)
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setSelectedTemplate('classic-silver')}
                    style={{
                      padding: '10px',
                      borderRadius: '8px',
                      border: selectedTemplate === 'classic-silver' ? '2px solid #b45309' : '1px solid #cbd5e1',
                      background: selectedTemplate === 'classic-silver' ? '#fef3c7' : '#f8fafc',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    पारंपरिक सिल्वर
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedTemplate('gold-spiritual')}
                    style={{
                      padding: '10px',
                      borderRadius: '8px',
                      border: selectedTemplate === 'gold-spiritual' ? '2px solid #b45309' : '1px solid #cbd5e1',
                      background: selectedTemplate === 'gold-spiritual' ? '#fef3c7' : '#f8fafc',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    केसरिया गोल्ड
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedTemplate('slate-peace')}
                    style={{
                      padding: '10px',
                      borderRadius: '8px',
                      border: selectedTemplate === 'slate-peace' ? '2px solid #b45309' : '1px solid #cbd5e1',
                      background: selectedTemplate === 'slate-peace' ? '#fef3c7' : '#f8fafc',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    सादा शांत
                  </button>
                </div>
              </div>

              <form onSubmit={handleSubmitShokSandesh} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                
                {/* Photo Upload: File or URL */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <label style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>दिवंगत स्वजन की फ़ोटो *</label>
                    <div style={{ display: 'flex', gap: '6px', fontSize: '12px' }}>
                      <button
                        type="button"
                        onClick={() => setImageType('file')}
                        style={{ background: 'none', border: 'none', color: imageType === 'file' ? '#b45309' : '#64748b', fontWeight: imageType === 'file' ? 700 : 400, cursor: 'pointer' }}
                      >
                        डिवाइस से फ़ाइल
                      </button>
                      <span style={{ color: '#cbd5e1' }}>|</span>
                      <button
                        type="button"
                        onClick={() => setImageType('url')}
                        style={{ background: 'none', border: 'none', color: imageType === 'url' ? '#b45309' : '#64748b', fontWeight: imageType === 'url' ? 700 : 400, cursor: 'pointer' }}
                      >
                        वेब URL
                      </button>
                    </div>
                  </div>

                  {imageType === 'file' ? (
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#f8fafc', border: '1.5px solid #cbd5e1', borderRadius: '8px', padding: '8px 12px', fontSize: '13px' }}
                    />
                  ) : (
                    <input
                      type="url"
                      placeholder="https://example.com/photo.jpg"
                      value={photoUrl}
                      onChange={(e) => {
                        setPhotoUrl(e.target.value);
                        setImagePreview(e.target.value);
                      }}
                      style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#f8fafc', border: '1.5px solid #cbd5e1', borderRadius: '8px', padding: '10px 12px', fontSize: '13px' }}
                    />
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>स्वर्गीय का पूरा नाम *</label>
                    <input
                      type="text"
                      required
                      placeholder="उदा. रामनारायण प्रसाद जी"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#f8fafc', border: '1.5px solid #cbd5e1', borderRadius: '8px', padding: '9px 12px', fontSize: '13.5px' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>संबंध / नाता</label>
                    <input
                      type="text"
                      placeholder="उदा. हमारे पूज्य पिता जी"
                      value={relation}
                      onChange={(e) => setRelation(e.target.value)}
                      style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#f8fafc', border: '1.5px solid #cbd5e1', borderRadius: '8px', padding: '9px 12px', fontSize: '13.5px' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>स्वर्गवास तिथि</label>
                    <input
                      type="text"
                      placeholder="उदा. बुधवार, 10.04.2026"
                      value={passedDate}
                      onChange={(e) => setPassedDate(e.target.value)}
                      style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#f8fafc', border: '1.5px solid #cbd5e1', borderRadius: '8px', padding: '9px 12px', fontSize: '13.5px' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>तेरहवीं / श्रद्धांजलि तिथि</label>
                    <input
                      type="text"
                      placeholder="उदा. 20-04-2026"
                      value={eventDate}
                      onChange={(e) => setEventDate(e.target.value)}
                      style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#f8fafc', border: '1.5px solid #cbd5e1', borderRadius: '8px', padding: '9px 12px', fontSize: '13.5px' }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>कार्यक्रम का समय</label>
                  <input
                    type="text"
                    value={eventTime}
                    onChange={(e) => setEventTime(e.target.value)}
                    style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#f8fafc', border: '1.5px solid #cbd5e1', borderRadius: '8px', padding: '9px 12px', fontSize: '13.5px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>कार्यक्रम स्थल एवं पता *</label>
                  <textarea
                    rows={2}
                    required
                    placeholder="उदा. 545 क/19, राजाजीपुरम, लखनऊ"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#f8fafc', border: '1.5px solid #cbd5e1', borderRadius: '8px', padding: '9px 12px', fontSize: '13px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>शोकाकुल परिवार के नाम *</label>
                  <textarea
                    rows={2}
                    required
                    placeholder="उदा. संदीप, मनीष, प्रवीण (पुत्र) एवं समस्त परिवार"
                    value={familyMembers}
                    onChange={(e) => setFamilyMembers(e.target.value)}
                    style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#f8fafc', border: '1.5px solid #cbd5e1', borderRadius: '8px', padding: '9px 12px', fontSize: '13px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>संपर्क नंबर (Mobile Number)</label>
                  <input
                    type="tel"
                    placeholder="उदा. 9829012345"
                    value={contactNumber}
                    onChange={(e) => setContactNumber(e.target.value)}
                    style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#f8fafc', border: '1.5px solid #cbd5e1', borderRadius: '8px', padding: '9px 12px', fontSize: '13.5px' }}
                  />
                </div>

                {/* Membership Payment Status Bar */}
                <div style={{ backgroundColor: '#fef3c7', border: '1px solid #fde68a', borderRadius: '8px', padding: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                  <div>
                    <b style={{ fontSize: '13px', color: '#92400e' }}>प्रकाशन शुल्क स्थिति:</b>
                    <div style={{ fontSize: '11.5px', color: '#b45309' }}>
                      {hasMembership ? '✓ ₹199 शुल्क भुगतान सत्यापित' : 'कार्ड सबमिट करने हेतु ₹199 प्रकाशन शुल्क लगेगा'}
                    </div>
                  </div>
                  {!hasMembership && (
                    <button
                      type="button"
                      onClick={handleBuyPlan}
                      style={{ backgroundColor: '#b45309', color: '#fff', border: 'none', padding: '7px 14px', borderRadius: '6px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
                    >
                      भुगतान करें (₹199)
                    </button>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    backgroundColor: '#0f172a',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '12px',
                    fontSize: '14.5px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    marginTop: '8px',
                    boxShadow: '0 4px 12px rgba(15,23,42,0.15)'
                  }}
                >
                  {submitting ? 'सत्यापन हेतु भेजा जा रहा है...' : 'शोक संदेश सबमिट करें (Admin Review)'}
                </button>

              </form>
            </div>

            {/* Right: Live Card Preview matching User Screenshot */}
            <div style={{ position: 'sticky', top: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#64748b' }}>लाइव कार्ड प्रीव्यू (Card Preview)</span>
                <span style={{ fontSize: '11px', backgroundColor: '#e2e8f0', padding: '3px 8px', borderRadius: '12px', color: '#475569' }}>
                  थीम: {selectedTemplate}
                </span>
              </div>

              {renderCard({
                name,
                relation,
                passedDate,
                eventDate,
                eventTime,
                venue,
                address,
                familyMembers,
                contactNumber,
                photoUrl: imagePreview,
                templateId: selectedTemplate
              }, true)}
            </div>

          </div>
        )}

      </div>
    </div>
  );
}