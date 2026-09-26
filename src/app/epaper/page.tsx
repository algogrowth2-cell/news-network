'use client';

import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface EPaperEdition {
  id: string;
  cityName: string;
  editionName: string;
  date: string;
  thumbnailUrl: string;
  pdfUrl: string;
  pages: string[];
  totalPages: number;
}

const DEFAULT_EDITIONS: EPaperEdition[] = [
  {
    id: 'bhopal-ed',
    cityName: 'भोपाल',
    editionName: 'द लोकल लीडर मुख्य संस्करण',
    date: '22-09-2026',
    thumbnailUrl: 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=700',
    pdfUrl: '',
    pages: ['https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=1200'],
    totalPages: 12
  },
  {
    id: 'indore-ed',
    cityName: 'इंदौर',
    editionName: 'द लोकल लीडर इंदौर',
    date: '22-09-2026',
    thumbnailUrl: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=700',
    pdfUrl: '',
    pages: ['https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=1200'],
    totalPages: 14
  }
];

const EPAPER_PLANS = [
  { id: 'epaper_1_month', name: '1 महीना प्लान (1 Month)', price: 21, durationDays: 30, desc: '₹21 में 30 दिनों का ई-पेपर ऐक्सेस' },
  { id: 'epaper_1_year', name: '1 साल का वार्षिक प्लान (1 Year)', price: 132, durationDays: 365, desc: '₹132 (मात्र ₹11/माह) में 365 दिनों का ऐक्सेस' }
];

const RAZORPAY_KEY = 'rzp_test_TZSA6UoKATong0';

export default function EPaperPage() {
  const router = useRouter();
  const [editions, setEditions] = useState(DEFAULT_EDITIONS);
  const [selectedCity, setSelectedCity] = useState('सभी');
  const [themeColor, setThemeColor] = useState('#ea580c');
  const [siteName, setSiteName] = useState('द लोकल लीडर');
  const [siteLogo, setSiteLogo] = useState('/logos/the-local-leader.jpeg');
  const [readingEdition, setReadingEdition] = useState<EPaperEdition | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [currentUser, setCurrentUser] = useState<{ email: string; name?: string } | null>(null);
  const [hasSubscribed, setHasSubscribed] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(EPAPER_PLANS[0]);
  const [showPayModal, setShowPayModal] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'sites', 'the-local-leader'), (snap) => {
      if (snap.exists()) {
        const d = snap.data();
        if (d.primaryColor) setThemeColor(d.primaryColor);
        if (d.name) setSiteName(d.name);
        if (d.logoUrl) setSiteLogo(d.logoUrl);
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
    return () => {
      if (document.body.contains(script)) document.body.removeChild(script);
    };
  }, []);

  useEffect(() => {
    const cached = localStorage.getItem('reader_user');
    if (cached) {
      try {
        const u = JSON.parse(cached);
        setCurrentUser(u);
        getDoc(doc(db, 'epaper_subscriptions', u.email))
          .then((snap) => {
            if (snap.exists() && snap.data().status === 'active') {
              const exp = snap.data().expiresAt?.toDate
                ? snap.data().expiresAt.toDate()
                : new Date(snap.data().expiresAt);
              if (new Date() < exp) setHasSubscribed(true);
            }
          })
          .catch(console.error);
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(
      query(collection(db, 'epaper')),
      (snapshot) => {
        if (!snapshot.empty) {
          const list: EPaperEdition[] = snapshot.docs.map((docSnap) => {
            const d = docSnap.data();
            return {
              id: docSnap.id,
              cityName: d.cityName || d.city || 'मुख्य',
              editionName: d.editionName || d.title || `${siteName} ई-पेपर`,
              date: d.date || '22-09-2026',
              thumbnailUrl: d.thumbnailUrl || d.coverImage || 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=700',
              pdfUrl: d.pdfUrl || '',
              pages:
                Array.isArray(d.pages) && d.pages.length > 0
                  ? d.pages
                  : [d.thumbnailUrl || 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=1200'],
              totalPages: Number(d.totalPages || d.pages?.length || 10)
            };
          });
          setEditions(list);
        }
      },
      console.error
    );
    return () => unsub();
  }, [siteName]);

  const filteredEditions = editions.filter(
    (ed) => selectedCity === 'सभी' || ed.cityName.includes(selectedCity)
  );

  const handleOpenSubscribe = () => {
    if (!currentUser) {
      alert('ई-पेपर सब्सक्रिप्शन लेने के लिए कृपया पहले लॉगिन करें!');
      router.push('/login?redirect=%2Fepaper');
      return;
    }
    setShowPayModal(true);
  };

  const handleOpenReader = (ed: EPaperEdition) => {
    if (!hasSubscribed) {
      handleOpenSubscribe();
      return;
    }
    setReadingEdition(ed);
    setCurrentPage(0);
  };

  const handlePayment = () => {
    if (!currentUser?.email) {
      router.push('/login?redirect=%2Fepaper');
      return;
    }
    if (!(window as any).Razorpay) {
      alert('Razorpay लोड हो रहा है, कृपया 2 सेकंड बाद पुनः प्रयास करें।');
      return;
    }

    setProcessing(true);
    const rzp = new (window as any).Razorpay({
      key: RAZORPAY_KEY,
      amount: selectedPlan.price * 100,
      currency: 'INR',
      name: `${siteName} ई-पेपर`,
      description: selectedPlan.name,
      image: siteLogo,
      handler: async function (response: any) {
        try {
          const expiresAt = new Date(Date.now() + selectedPlan.durationDays * 24 * 60 * 60 * 1000);
          await setDoc(
            doc(db, 'epaper_subscriptions', currentUser.email),
            {
              userEmail: currentUser.email,
              userName: currentUser.name || 'Reader',
              planId: selectedPlan.id,
              planName: selectedPlan.name,
              amount: selectedPlan.price,
              paymentId: response.razorpay_payment_id || 'test_id',
              status: 'active',
              startedAt: serverTimestamp(),
              expiresAt
            },
            { merge: true }
          );

          alert(`🎉 भुगतान सफल! ${selectedPlan.name} सक्रिय हो गया है।`);
          setHasSubscribed(true);
          setShowPayModal(false);
        } catch (err: any) {
          alert('त्रुटि: ' + err.message);
        } finally {
          setProcessing(false);
        }
      },
      prefill: { name: currentUser.name || '', email: currentUser.email || '' },
      theme: { color: themeColor },
      modal: { ondismiss: () => setProcessing(false) }
    });
    rzp.open();
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      {/* Header */}
      <header
        style={{
          backgroundColor: '#fff',
          borderBottom: `3px solid ${themeColor}`,
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          flexWrap: 'wrap'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {siteLogo && (
            <img src={siteLogo} alt={siteName} style={{ height: '40px', width: 'auto', borderRadius: '6px' }} />
          )}
          <div>
            <div style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>{siteName} ई-पेपर</div>
            <div style={{ fontSize: '12px', color: '#64748b' }}>दैनिक डिजिटल संस्करण</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {hasSubscribed ? (
            <span
              style={{
                backgroundColor: '#dcfce7',
                color: '#166534',
                borderRadius: '20px',
                padding: '5px 12px',
                fontSize: '12px',
                fontWeight: 700
              }}
            >
              ✓ VIP एक्टिव
            </span>
          ) : (
            <button
              onClick={handleOpenSubscribe}
              style={{
                backgroundColor: themeColor,
                color: '#fff',
                border: 'none',
                borderRadius: '20px',
                padding: '6px 14px',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              ⭐ प्लान चुनें (₹21 से शुरू)
            </button>
          )}
          <Link href="/" style={{ fontSize: '12px', color: '#475569', textDecoration: 'none' }}>
            ← मुख्य वेबसाइट
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '16px' }}>
        {/* Banner */}
        {!hasSubscribed && (
          <div
            style={{
              backgroundColor: '#0f172a',
              color: '#fff',
              borderRadius: '12px',
              padding: '16px 18px',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              flexWrap: 'wrap'
            }}
          >
            <div>
              <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>दैनिक डिजिटल ई-पेपर संपूर्ण ऐक्सेस</h2>
              <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#cbd5e1' }}>
                ₹21 (1 माह) या ₹132 (1 वर्ष - ₹11/माह) में सभी संस्करण अनलॉक करें।
              </p>
            </div>
            <button
              onClick={handleOpenSubscribe}
              style={{
                backgroundColor: themeColor,
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                padding: '8px 16px',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              सब्सक्रिप्शन लें →
            </button>
          </div>
        )}

        {/* City Filter */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
          {['सभी', 'भोपाल', 'इंदौर', 'उज्जैन', 'देवास'].map((city) => (
            <button
              key={city}
              onClick={() => setSelectedCity(city)}
              style={{
                backgroundColor: selectedCity === city ? themeColor : '#fff',
                color: selectedCity === city ? '#fff' : '#475569',
                border: `1px solid ${selectedCity === city ? themeColor : '#cbd5e1'}`,
                borderRadius: '20px',
                padding: '5px 14px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              {city}
            </button>
          ))}
        </div>

        {/* Editions Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: '16px'
          }}
        >
          {filteredEditions.map((edition) => (
            <div
              key={edition.id}
              style={{
                backgroundColor: '#fff',
                border: '1px solid #e2e8f0',
                borderRadius: '10px',
                padding: '10px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}
            >
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>{edition.cityName}</div>

              <div
                onClick={() => handleOpenReader(edition)}
                style={{
                  cursor: 'pointer',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  position: 'relative',
                  aspectRatio: '3/4',
                  backgroundColor: '#f1f5f9'
                }}
              >
                <img
                  src={edition.thumbnailUrl}
                  alt={edition.editionName}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    filter: hasSubscribed ? 'none' : 'blur(2px)'
                  }}
                />
                {!hasSubscribed && (
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      backgroundColor: 'rgba(15,23,42,0.45)',
                      color: '#fff',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px'
                    }}
                  >
                    <span style={{ fontSize: '28px' }}>🔒</span>
                    <span style={{ fontSize: '12px', fontWeight: 600 }}>सब्सक्रिप्शन आवश्यक</span>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', color: '#64748b' }}>
                <span>{edition.date}</span>
                <span>{edition.totalPages} पृष्ठ</span>
              </div>

              <button
                onClick={() => handleOpenReader(edition)}
                style={{
                  backgroundColor: hasSubscribed ? themeColor : '#0f172a',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '8px',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  marginTop: 'auto'
                }}
              >
                {hasSubscribed ? 'ई-पेपर पढ़ें' : '🔒 अनलॉक करें'}
              </button>
            </div>
          ))}
        </div>
      </main>

      {/* Reader Modal */}
      {readingEdition && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.85)',
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          <div
            style={{
              backgroundColor: '#fff',
              padding: '10px 14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '8px',
              flexWrap: 'wrap'
            }}
          >
            <div style={{ fontSize: '14px', fontWeight: 700 }}>
              {siteName} ({readingEdition.cityName})
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                disabled={currentPage === 0}
                onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                style={{ padding: '4px 10px', fontSize: '12px' }}
              >
                पिछला
              </button>
              <span style={{ fontSize: '12px' }}>
                {currentPage + 1} / {readingEdition.pages.length}
              </span>
              <button
                disabled={currentPage >= readingEdition.pages.length - 1}
                onClick={() => setCurrentPage((p) => Math.min(readingEdition.pages.length - 1, p + 1))}
                style={{ padding: '4px 10px', fontSize: '12px' }}
              >
                अगला
              </button>
              <button
                onClick={() => setReadingEdition(null)}
                style={{
                  padding: '4px 10px',
                  fontSize: '12px',
                  backgroundColor: '#ef4444',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                बंद करें
              </button>
            </div>
          </div>
          <div style={{ flex: 1, overflow: 'auto', display: 'flex', justifyContent: 'center', padding: '12px' }}>
            <img
              src={readingEdition.pages[currentPage]}
              alt={`पृष्ठ ${currentPage + 1}`}
              style={{ maxWidth: '100%', height: 'auto', backgroundColor: '#fff' }}
            />
          </div>
        </div>
      )}

      {/* Paywall Modal */}
      {showPayModal && (
        <div
          onClick={() => !processing && setShowPayModal(false)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.6)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: '#fff',
              borderRadius: '14px',
              maxWidth: '420px',
              width: '100%',
              padding: '22px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 700 }}>ई-पेपर प्लान चुनें</h3>
              <button
                onClick={() => setShowPayModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '16px', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
              {EPAPER_PLANS.map((plan) => (
                <div
                  key={plan.id}
                  onClick={() => setSelectedPlan(plan)}
                  style={{
                    border: `2px solid ${selectedPlan.id === plan.id ? themeColor : '#e2e8f0'}`,
                    backgroundColor: selectedPlan.id === plan.id ? `${themeColor}10` : '#fff',
                    borderRadius: '10px',
                    padding: '12px 14px',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 700 }}>{plan.name}</div>
                    <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>{plan.desc}</div>
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: themeColor }}>₹{plan.price}</div>
                </div>
              ))}
            </div>

            <button
              onClick={handlePayment}
              disabled={processing}
              style={{
                width: '100%',
                backgroundColor: themeColor,
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                padding: '12px',
                fontSize: '14px',
                fontWeight: 700,
                cursor: processing ? 'not-allowed' : 'pointer',
                opacity: processing ? 0.7 : 1
              }}
            >
              {processing ? 'प्रक्रिया जारी है...' : `₹${selectedPlan.price} का भुगतान करें`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}