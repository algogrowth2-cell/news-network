'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  FREE_SITE_SLUG,
  NETWORK_SITES,
  SUBSCRIPTION_PLANS,
  RAZORPAY_KEY,
  navigateToSite,
  saveSubscription
} from '@/components/SiteSwitcher';
import { loadRazorpayScript } from '@/lib/razorpay';
import { getCachedReader, hasPremiumAccess } from '@/lib/premiumAccess';

/*
 * Premium portal paywall (homepage, article, videos sab jagah same).
 * the-local-leader free hai; baaki portals par login + active plan (subscription ya referral VIP) zaroori.
 * siteSlug = null matlab portal abhi resolve ho raha hai — tab tak "checking" screen.
 */
const PG_STYLES = `
.pg-overlay{position:fixed;inset:0;z-index:100002;display:flex;align-items:center;justify-content:center;padding:16px;background:rgba(0,0,0,.65);backdrop-filter:blur(6px)}
.pg-checking{position:fixed;inset:0;z-index:100002;display:flex;align-items:center;justify-content:center;background:#f7f6f3;color:#888;font-size:14px;font-family:system-ui,-apple-system,sans-serif}
.pg-box{background:#fff;border-radius:20px;max-width:480px;width:100%;max-height:92vh;overflow-y:auto;padding:26px;box-shadow:0 25px 60px rgba(0,0,0,.25);color:#0f172a;font-family:system-ui,-apple-system,sans-serif}
.pg-head{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:18px}
.pg-pill{display:inline-block;font-size:11px;font-weight:700;padding:3px 10px;border-radius:10px;margin-bottom:8px}
.pg-title{margin:0;font-size:18px;font-weight:800;line-height:1.35}
.pg-text{margin:6px 0 0;font-size:13px;color:#64748b;line-height:1.5}
.pg-close{background:#f1f5f9;border:0;border-radius:50%;width:32px;height:32px;cursor:pointer;font-weight:800;font-size:14px;color:#64748b;flex-shrink:0}
.pg-plans{display:flex;flex-direction:column;gap:10px}
.pg-plan{border:2px solid #e2e8f0;background:#fff;border-radius:12px;padding:12px 16px;cursor:pointer;display:flex;align-items:center;justify-content:space-between;gap:12px;text-align:left;width:100%;color:inherit;font-family:inherit}
.pg-pay{width:100%;margin-top:18px;color:#fff;border:0;border-radius:12px;padding:14px;font-size:15px;font-weight:700;cursor:pointer;font-family:inherit}
.pg-pay:disabled{opacity:.7;cursor:not-allowed}
.pg-free{display:block;width:100%;margin-top:10px;background:none;border:0;font-size:13px;font-weight:600;color:#64748b;cursor:pointer;text-decoration:underline;font-family:inherit}
`;

const tint = (hex: string, op: number) => {
  if (!/^#[0-9a-f]{6}$/i.test(hex)) return `rgba(234,88,12,${op})`;
  const r = parseInt(hex.slice(1, 3), 16),
    g = parseInt(hex.slice(3, 5), 16),
    b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${op})`;
};

export default function PremiumGate({
  siteSlug,
  siteName,
  primaryColor = '#ea580c',
  isEnglish = false,
  returnPath
}: {
  siteSlug: string | null;
  siteName?: string;
  primaryColor?: string;
  isEnglish?: boolean;
  returnPath?: string;
}) {
  const router = useRouter();
  const [accessState, setAccessState] = useState<'checking' | 'granted' | 'paywall'>('checking');
  const [plan, setPlan] = useState(SUBSCRIPTION_PLANS[0]);
  const [processing, setProcessing] = useState(false);
  const loginPromptShownRef = useRef(false);

  const loginUrl = `/login?redirect=${encodeURIComponent(returnPath || `/?site=${siteSlug}`)}`;

  useEffect(() => {
    if (!siteSlug) return;

    if (siteSlug === FREE_SITE_SLUG) {
      setAccessState('granted');
      return;
    }

    setAccessState('checking');
    const user = getCachedReader();

    if (!user) {
      if (!loginPromptShownRef.current) {
        loginPromptShownRef.current = true;
        alert(isEnglish ? 'Please login first to read premium portals!' : 'प्रीमियम पोर्टल्स देखने के लिए कृपया पहले लॉगिन करें!');
        router.replace(loginUrl);
      }
      return;
    }

    let cancelled = false;
    hasPremiumAccess(user).then((ok) => {
      if (!cancelled) setAccessState(ok ? 'granted' : 'paywall');
    });
    return () => {
      cancelled = true;
    };
  }, [siteSlug, isEnglish, router, loginUrl]);

  const leaveToFreePortal = () => {
    const freeSite = NETWORK_SITES.find((s) => s.slug === FREE_SITE_SLUG);
    if (freeSite) navigateToSite(freeSite);
  };

  const handlePayment = async () => {
    const user = getCachedReader();
    if (!user?.email) {
      router.push(loginUrl);
      return;
    }

    setProcessing(true);
    const loaded = await loadRazorpayScript();
    if (!loaded || !(window as any).Razorpay) {
      alert(isEnglish ? 'Payment gateway failed to load. Please try again.' : 'Razorpay गेटवे लोड नहीं हो सका, कृपया पुनः प्रयास करें।');
      setProcessing(false);
      return;
    }

    const selectedPlan = plan;
    const rzp = new (window as any).Razorpay({
      key: RAZORPAY_KEY,
      amount: selectedPlan.price * 100,
      currency: 'INR',
      name: 'न्यूज़ नेटवर्क ऑल-पोर्टल ऐक्सेस',
      description: `${selectedPlan.name} - ${siteName || siteSlug}`,
      image: '/logos/the-local-leader.jpeg',
      handler: async (response: any) => {
        try {
          await saveSubscription(user, selectedPlan, response.razorpay_payment_id, siteSlug || 'all');
          alert(`🎉 भुगतान सफल! आपका ${selectedPlan.name} सक्रिय हो गया है।`);
          setAccessState('granted');
        } catch (err: any) {
          console.error(err);
          alert('डेटाबेस अपडेट में त्रुटि: ' + err.message);
        }
        setProcessing(false);
      },
      prefill: {
        name: user.name || '',
        email: user.email || '',
        contact: user.phone || ''
      },
      theme: { color: primaryColor },
      modal: {
        // Razorpay window band hone par sirf plan modal par wapas aate hain
        ondismiss: () => setProcessing(false)
      }
    });
    rzp.open();
  };

  if (accessState === 'granted') return null;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: PG_STYLES }} />
      {accessState === 'checking' ? (
        <div className="pg-checking">{isEnglish ? 'Verifying access…' : 'ऐक्सेस की जाँच हो रही है…'}</div>
      ) : (
        <div className="pg-overlay notranslate" translate="no" onClick={() => !processing && leaveToFreePortal()}>
          <div className="pg-box" onClick={(e) => e.stopPropagation()}>
            <div className="pg-head">
              <div>
                <span className="pg-pill" style={{ color: primaryColor, background: tint(primaryColor, 0.08) }}>
                  {isEnglish ? 'Premium Network Access' : 'प्रीमियम नेटवर्क ऐक्सेस'}
                </span>
                <h3 className="pg-title">{siteName || siteSlug}</h3>
                <p className="pg-text">
                  {isEnglish
                    ? 'The Local Leader is free, this is a premium network portal. Choose a plan to get access to all portals.'
                    : 'द लोकल लीडर मुफ़्त है, यह एक प्रीमियम नेटवर्क पोर्टल है। सभी पोर्टल्स का ऐक्सेस पाने के लिए प्लान चुनें।'}
                </p>
              </div>
              <button className="pg-close" onClick={leaveToFreePortal} disabled={processing} aria-label="बंद करें">
                ✕
              </button>
            </div>

            <div className="pg-plans">
              {SUBSCRIPTION_PLANS.map((p) => {
                const isSelected = plan.id === p.id;
                return (
                  <button
                    key={p.id}
                    className="pg-plan"
                    onClick={() => setPlan(p)}
                    style={isSelected ? { borderColor: primaryColor, background: tint(primaryColor, 0.03) } : undefined}
                  >
                    <span style={{ minWidth: 0 }}>
                      <span style={{ display: 'block', fontSize: '14px', fontWeight: 700 }}>{p.name}</span>
                      <span style={{ display: 'block', fontSize: '12px', color: '#64748b', marginTop: '2px' }}>{p.desc}</span>
                    </span>
                    <span style={{ fontSize: '20px', fontWeight: 800, color: primaryColor, flexShrink: 0 }}>₹{p.price}</span>
                  </button>
                );
              })}
            </div>

            <button className="pg-pay" onClick={handlePayment} disabled={processing} style={{ background: primaryColor }}>
              💳 {processing ? 'प्रक्रिया जारी है...' : `₹${plan.price} का भुगतान करें और ऐक्सेस पाएं`}
            </button>
            <button className="pg-free" onClick={leaveToFreePortal} disabled={processing}>
              {isEnglish ? '← Go to The Local Leader (Free)' : '← द लोकल लीडर (मुफ़्त) पर जाएं'}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
