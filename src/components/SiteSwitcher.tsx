'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

interface SiteItem {
  slug: string;
  name: string;
  tag: string;
}

const NETWORK_SITES: SiteItem[] = [
  { slug: 'the-local-leader', name: 'द लोकल लीडर', tag: 'मुफ़्त (Free)' },
  { slug: 'the-provue-times', name: 'द प्रोव्यू टाइम्स', tag: 'प्रीमियम (Premium)' },
  { slug: 'jan-bharat-news', name: 'जन भारत न्यूज़', tag: 'प्रीमियम (Premium)' },
  { slug: 'news-info-24', name: 'NEWS INFO 24', tag: 'प्रीमियम (Premium)' },
  { slug: 'ndn-defence', name: 'डिफेंस न्यूज़', tag: 'प्रीमियम (Premium)' },
  { slug: 'bazar-karobar', name: 'बाज़ार कारोबार', tag: 'प्रीमियम (Premium)' },
  { slug: 'golden-pearl-chronicles', name: 'गोल्डन पर्ल क्रॉनिकल्स', tag: 'प्रीमियम (Premium)' },
  { slug: 'desh-ki-aawaz', name: 'देश की आवाज़', tag: 'प्रीमियम (Premium)' }
];

const SUBSCRIPTION_PLANS = [
  { id: 'trial_1', name: 'ट्रायल ऑफर (Trial Access)', price: 1, durationDays: 30, desc: 'सभी 7+ प्रीमियम पोर्टल्स का ऐक्सेस' },
  { id: 'monthly_21', name: 'मंथली प्लान (Monthly)', price: 21, durationDays: 30, desc: '₹21 प्रति माह - सभी पोर्टल्स' },
  { id: 'three_month_11', name: '3 महीने का स्पेशल प्लान', price: 11, durationDays: 90, desc: '₹11 में 3 महीने के लिए सभी पोर्टल्स' },
  { id: 'six_month_11', name: '6 महीने का मेगा प्लान', price: 11, durationDays: 180, desc: '₹11 में पूरे 6 महीने के लिए सभी पोर्टल्स' }
];

const RAZORPAY_KEY = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_TZSA6UoKATong0';

/* Sirf layout: desktop me button ke neeche dropdown, mobile me neeche se sheet */
const SS_STYLES = `
.ss-panel{position:fixed;z-index:100001;width:270px;max-width:90vw;max-height:70vh;overflow-y:auto;background:#fff;border:1px solid #e2e8f0;border-radius:12px;box-shadow:0 16px 40px -12px rgba(0,0,0,.25);padding:8px}
@media (max-width:640px){
  .ss-panel{top:auto !important;right:0 !important;left:0;bottom:0;width:100%;max-width:100%;max-height:75vh;border-radius:18px 18px 0 0;border:0;padding:10px 10px calc(14px + env(safe-area-inset-bottom))}
  .ss-name{max-width:110px;overflow:hidden;text-overflow:ellipsis}
}
`;

export default function SiteSwitcher({
  currentSlug = 'the-local-leader',
  primaryColor = '#ea580c'
}: {
  currentSlug?: string;
  primaryColor?: string;
}) {
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedTargetSite, setSelectedTargetSite] = useState<SiteItem | null>(null);
  const [selectedPlan, setSelectedPlan] = useState(SUBSCRIPTION_PLANS[0]);
  const [processing, setProcessing] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [mounted, setMounted] = useState(false);
  const [panelPos, setPanelPos] = useState({ top: 0, right: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleDropdown = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!dropdownOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setPanelPos({ top: rect.bottom + 8, right: Math.max(8, window.innerWidth - rect.right) });
    }
    setDropdownOpen(!dropdownOpen);
  };

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  useEffect(() => {
    const cached = localStorage.getItem('reader_user');
    if (cached) {
      try {
        setCurrentUser(JSON.parse(cached));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const checkHasActivePlan = async (userEmail: string) => {
    try {
      const docRef = doc(db, 'subscriptions', userEmail);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data();
        if (data.status === 'active') {
          const expiry = data.expiresAt?.toDate ? data.expiresAt.toDate() : new Date(data.expiresAt);
          if (new Date() < expiry) {
            return true;
          }
        }
      }
      return false;
    } catch (err) {
      console.error('Error checking subscription:', err);
      return false;
    }
  };

  const handleSelectSite = async (site: SiteItem) => {
    setDropdownOpen(false);

    if (site.slug === 'the-local-leader') {
      window.location.href = `/?site=${site.slug}`;
      return;
    }

    const cached = localStorage.getItem('reader_user');
    if (!cached) {
      alert('प्रीमियम पोर्टल्स देखने के लिए कृपया पहले लॉगिन करें!');
      router.push(`/login?redirect=${encodeURIComponent(`/?site=${site.slug}`)}`);
      return;
    }

    const userObj = JSON.parse(cached);
    setCurrentUser(userObj);

    const hasPlan = await checkHasActivePlan(userObj.email);
    if (hasPlan) {
      window.location.href = `/?site=${site.slug}`;
    } else {
      setSelectedTargetSite(site);
      setModalOpen(true);
    }
  };

  const handlePayment = () => {
    if (!currentUser?.email) {
      router.push('/login');
      return;
    }

    if (!(window as any).Razorpay) {
      alert('Razorpay गेटवे लोड हो रहा है, कृपया 2 सेकंड बाद पुनः प्रयास करें।');
      return;
    }

    setProcessing(true);

    const options = {
      key: RAZORPAY_KEY,
      amount: selectedPlan.price * 100,
      currency: 'INR',
      name: 'न्यूज़ नेटवर्क ऑल-पोर्टल ऐक्सेस',
      description: `${selectedPlan.name} - ${selectedTargetSite?.name || 'नेटवर्क पोर्टल'}`,
      image: '/logos/the-local-leader.jpeg',
      handler: async function (response: any) {
        try {
          const now = new Date();
          const expiresAt = new Date(now.getTime() + selectedPlan.durationDays * 24 * 60 * 60 * 1000);

          await setDoc(
            doc(db, 'subscriptions', currentUser.email),
            {
              userEmail: currentUser.email,
              userName: currentUser.name || 'Reader',
              planId: selectedPlan.id,
              planName: selectedPlan.name,
              amount: selectedPlan.price,
              paymentId: response.razorpay_payment_id || 'test_pay_id',
              status: 'active',
              startedAt: serverTimestamp(),
              expiresAt: expiresAt,
              targetSite: selectedTargetSite?.slug || 'all'
            },
            { merge: true }
          );

          alert(`🎉 भुगतान सफल! आपका ${selectedPlan.name} सक्रिय हो गया है।`);
          setModalOpen(false);
          setProcessing(false);

          if (selectedTargetSite) {
            window.location.href = `/?site=${selectedTargetSite.slug}`;
          }
        } catch (err: any) {
          console.error(err);
          alert('डेटाबेस अपडेट में त्रुटि: ' + err.message);
          setProcessing(false);
        }
      },
      prefill: {
        name: currentUser.name || '',
        email: currentUser.email || '',
        contact: currentUser.phone || ''
      },
      theme: {
        color: primaryColor || '#ea580c'
      },
      modal: {
        ondismiss: function () {
          setProcessing(false);
        }
      }
    };

    const rzp = new (window as any).Razorpay(options);
    rzp.open();
  };

  const currentSiteObj = NETWORK_SITES.find((s) => s.slug === currentSlug) || NETWORK_SITES[0];

  return (
    <div className="notranslate" translate="no" style={{ position: 'relative', flexShrink: 0 }}>
      <style dangerouslySetInnerHTML={{ __html: SS_STYLES }} />
      <button
        ref={buttonRef}
        onClick={toggleDropdown}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          backgroundColor: '#f8fafc',
          border: '1.5px solid #cbd5e1',
          borderRadius: '20px',
          padding: '6px 12px',
          fontSize: '12.5px',
          fontWeight: 700,
          color: '#0f172a',
          cursor: 'pointer',
          outline: 'none',
          whiteSpace: 'nowrap'
        }}
      >
        <span>🌐</span>
        <span className="ss-name">{currentSiteObj.name}</span>
        <span style={{ fontSize: '9px', color: '#64748b' }}>▼</span>
      </button>

      {mounted && dropdownOpen && createPortal(
        <div className="notranslate" translate="no">
          <div
            onClick={() => setDropdownOpen(false)}
            style={{ position: 'fixed', inset: 0, zIndex: 100000, backgroundColor: 'rgba(0,0,0,0.25)' }}
          />

          <div className="ss-panel" style={{ top: panelPos.top, right: panelPos.right }}>
            <div
              style={{
                fontSize: '11px',
                fontWeight: 700,
                color: '#64748b',
                padding: '6px 10px 8px',
                borderBottom: '1px solid #f1f5f9',
                marginBottom: '4px'
              }}
            >
              नेटवर्क पोर्टल्स चुनें (Switch Portal)
            </div>

            {NETWORK_SITES.map((site) => {
              const isCurrent = site.slug === currentSlug;
              return (
                <button
                  key={site.slug}
                  onClick={() => handleSelectSite(site)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    padding: '9px 10px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: isCurrent ? `${primaryColor}15` : 'transparent',
                    color: isCurrent ? primaryColor : '#1e293b',
                    fontSize: '13px',
                    fontWeight: isCurrent ? 800 : 500,
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'background 0.15s'
                  }}
                  onMouseEnter={(e) => {
                    if (!isCurrent) e.currentTarget.style.backgroundColor = '#f8fafc';
                  }}
                  onMouseLeave={(e) => {
                    if (!isCurrent) e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <span>{site.name}</span>
                  <span
                    style={{
                      fontSize: '10px',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: '10px',
                      whiteSpace: 'nowrap',
                      backgroundColor: site.slug === 'the-local-leader' ? '#dcfce7' : '#fef3c7',
                      color: site.slug === 'the-local-leader' ? '#166534' : '#92400e'
                    }}
                  >
                    {site.tag}
                  </span>
                </button>
              );
            })}
          </div>
        </div>,
        document.body
      )}

      {mounted && modalOpen && createPortal(
        <div
          className="notranslate"
          translate="no"
          onClick={() => !processing && setModalOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.65)',
            backdropFilter: 'blur(4px)',
            zIndex: 100002,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '20px',
              maxWidth: '480px',
              width: '100%',
              maxHeight: '92vh',
              overflowY: 'auto',
              padding: '26px',
              boxShadow: '0 25px 60px rgba(0,0,0,0.25)',
              border: '1px solid #e2e8f0',
              color: '#0f172a'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', marginBottom: '18px' }}>
              <div>
                <span
                  style={{
                    display: 'inline-block',
                    fontSize: '11px',
                    fontWeight: 700,
                    color: primaryColor,
                    backgroundColor: `${primaryColor}15`,
                    padding: '3px 10px',
                    borderRadius: '10px',
                    marginBottom: '8px'
                  }}
                >
                  प्रीमियम नेटवर्क ऐक्सेस
                </span>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, lineHeight: 1.35 }}>
                  {selectedTargetSite?.name} में आपका स्वागत है
                </h3>
                <p style={{ margin: '6px 0 0', fontSize: '13px', color: '#64748b', lineHeight: 1.5 }}>
                  सभी नेटवर्क पोर्टल्स का असीमित समाचार ऐक्सेस पाने के लिए प्लान चुनें।
                </p>
              </div>
              <button
                onClick={() => !processing && setModalOpen(false)}
                style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', fontWeight: 800, fontSize: '14px', color: '#64748b', flexShrink: 0 }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {SUBSCRIPTION_PLANS.map((plan) => {
                const isSelected = selectedPlan.id === plan.id;
                return (
                  <div
                    key={plan.id}
                    onClick={() => setSelectedPlan(plan)}
                    style={{
                      border: `2px solid ${isSelected ? primaryColor : '#e2e8f0'}`,
                      backgroundColor: isSelected ? `${primaryColor}08` : '#ffffff',
                      borderRadius: '12px',
                      padding: '12px 16px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'all 0.15s'
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: '14px', fontWeight: 700 }}>{plan.name}</div>
                      <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>{plan.desc}</div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: '12px' }}>
                      <div style={{ fontSize: '20px', fontWeight: 800, color: primaryColor }}>₹{plan.price}</div>
                      <div style={{ fontSize: '10.5px', color: '#94a3b8' }}>मात्र</div>
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              onClick={handlePayment}
              disabled={processing}
              style={{
                width: '100%',
                marginTop: '18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                backgroundColor: primaryColor,
                color: '#ffffff',
                border: 'none',
                borderRadius: '12px',
                padding: '14px',
                fontSize: '15px',
                fontWeight: 700,
                cursor: processing ? 'not-allowed' : 'pointer',
                opacity: processing ? 0.7 : 1
              }}
            >
              <span>💳</span>
              <span>{processing ? 'प्रक्रिया जारी है...' : `₹${selectedPlan.price} का भुगतान करें और ऐक्सेस पाएं`}</span>
            </button>

            <div style={{ textAlign: 'center', fontSize: '11.5px', color: '#64748b', marginTop: '12px' }}>
              🔒 100% सुरक्षित भुगतान (Razorpay Verified Gateway)
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}