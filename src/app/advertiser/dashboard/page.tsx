'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { doc, getDoc, updateDoc, collection, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { loadRazorpayScript } from '@/lib/razorpay';
import Link from 'next/link';

interface AdPackage {
  id: string;
  name: string;
  price: number;
  validity: string;
  impressions: string;
  features: string[];
}

const AD_PACKAGES: AdPackage[] = [
  {
    id: 'sidebar_pack',
    name: 'Sidebar Ad Banner',
    price: 999,
    validity: '15 दिन',
    impressions: 'लगभग 25,000+ व्यूज',
    features: ['300x250 साइडबार बैनर', 'क्लिक थ्रू ट्रैकिंग लिंक', 'सिंगल पोर्टल प्रसारण']
  },
  {
    id: 'header_leaderboard',
    name: 'Header Leaderboard Ad',
    price: 2499,
    validity: '30 दिन',
    impressions: 'लगभग 1,00,000+ व्यूज',
    features: ['728x90 टॉप हेडर स्लॉट', 'सर्वोच्च दृश्यता (Top Visibility)', 'मोबाइल एवं डेस्कटॉप दोनों पर लाइव', 'क्लिक रिपोर्ट']
  },
  {
    id: 'network_takeover',
    name: 'All 8 Portals Network Reach',
    price: 6999,
    validity: '30 दिन (सभी 8 पोर्टल्स)',
    impressions: 'लगभग 5,00,000+ व्यूज',
    features: ['नेटवर्क के सभी 8 न्यूज़ पोर्टलों पर लाइव', 'हेडर एवं साइडबार दोनों स्लॉट', 'डेडिकेटेड ब्रांड प्रमोशन', 'प्राथमिकता सपोर्ट']
  }
];

export default function AdvertiserDashboard() {
  const [advertiser, setAdvertiser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [payingPack, setPayingPack] = useState<string | null>(null);

  // Ad banner state
  const [adName, setAdName] = useState('');
  const [zone, setZone] = useState('728x90 (हेडर)');
  const [imageUrl, setImageUrl] = useState('');
  const [targetUrl, setTargetUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [adSuccess, setAdSuccess] = useState(false);

  const router = useRouter();

  useEffect(() => {
    const raw = localStorage.getItem('advertiser_user');
    if (!raw) {
      router.replace('/advertiser/login');
      return;
    }
    const parsed = JSON.parse(raw);
    setAdvertiser(parsed);

    async function syncAdv() {
      if (parsed.id) {
        const snap = await getDoc(doc(db, 'advertisers', parsed.id));
        if (snap.exists()) {
          const fresh = { id: snap.id, ...snap.data() };
          setAdvertiser(fresh);
          localStorage.setItem('advertiser_user', JSON.stringify(fresh));
        }
      }
      setLoading(false);
    }
    syncAdv();
  }, [router]);

  const handleRazorpayPayment = async (pack: AdPackage) => {
    setPayingPack(pack.id);
    const res = await loadRazorpayScript();
    if (!res) {
      alert('Razorpay SDK लोड करने में विफल रहा। कृपया इंटरनेट कनेक्शन जांचें।');
      setPayingPack(null);
      return;
    }

    const options = {
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_demoKey12345',
      amount: pack.price * 100,
      currency: 'INR',
      name: 'News Network Advertiser Hub',
      description: `${pack.name} - ${pack.validity}`,
      handler: async function (response: any) {
        try {
          const expiryDate = new Date();
          if (pack.id === 'sidebar_pack') expiryDate.setDate(expiryDate.getDate() + 15);
          else expiryDate.setDate(expiryDate.getDate() + 30);

          const membershipData = {
            packageId: pack.id,
            packageName: pack.name,
            amount: pack.price,
            paymentId: response.razorpay_payment_id || 'test_adv_' + Date.now(),
            status: 'active',
            activatedAt: new Date().toISOString(),
            expiresAt: expiryDate.toISOString()
          };

          await updateDoc(doc(db, 'advertisers', advertiser.id), {
            membership: membershipData
          });

          const updated = { ...advertiser, membership: membershipData };
          setAdvertiser(updated);
          localStorage.setItem('advertiser_user', JSON.stringify(updated));

          alert(`बधाई! आपका विज्ञापन पैकेज ${pack.name} सफलतापूर्वक एक्टिवेट हो गया है।`);
        } catch (err) {
          console.error(err);
          alert('पेमेंट सफल रहा, पर एक्टिवेशन में त्रुटि आई।');
        }
        setPayingPack(null);
      },
      prefill: {
        name: advertiser?.businessName || advertiser?.contactPerson || 'Advertiser',
        email: advertiser?.email || '',
        contact: advertiser?.mobile || ''
      },
      theme: {
        color: '#ea580c'
      }
    };

    const paymentObject = new (window as any).Razorpay(options);
    paymentObject.open();
  };

  const handleCreateAd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adName.trim() || !imageUrl.trim()) return;

    setSubmitting(true);
    try {
      await addDoc(collection(db, 'ads'), {
        name: adName,
        zone,
        imageUrl,
        targetUrl: targetUrl || '#',
        advertiserId: advertiser?.id,
        businessName: advertiser?.businessName || 'Advertiser',
        status: 'active', // Direct active because package is paid
        createdAt: new Date().toISOString().split('T')[0]
      });
      setAdName('');
      setImageUrl('');
      setTargetUrl('');
      setAdSuccess(true);
      setTimeout(() => setAdSuccess(false), 5000);
    } catch (err) {
      console.error(err);
      alert('विज्ञापन सेव करने में समस्या आई।');
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
        विज्ञापनदाता प्रोफ़ाइल लोड हो रही है...
      </div>
    );
  }

  const hasActiveMembership = advertiser?.membership?.status === 'active';

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', color: '#0f172a', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      
      {/* Top Bar */}
      <header style={{ background: '#ffffff', borderBottom: '1px solid #e2e8f0', padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '24px' }}>📢</span>
          <div>
            <h2 style={{ fontSize: '16px', fontWeight: 800, margin: 0 }}>विज्ञापनदाता डैशबोर्ड</h2>
            <div style={{ fontSize: '11px', color: '#64748b' }}>
              {advertiser?.businessName} ({advertiser?.email})
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Link href="/" style={{ fontSize: '12px', color: '#64748b', textDecoration: 'none' }}>
            लाइव पोर्टल देखें ↗
          </Link>
          <button
            onClick={() => {
              localStorage.removeItem('advertiser_user');
              router.push('/advertiser/login');
            }}
            style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '11.5px', fontWeight: 700, cursor: 'pointer' }}
          >
            लॉग आउट
          </button>
        </div>
      </header>

      <main style={{ maxWidth: '1100px', margin: '30px auto', padding: '0 16px' }}>
        
        {/* GATE: Agar membership active nahi hai toh Plans dikhao */}
        {!hasActiveMembership ? (
          <div>
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <span style={{ background: '#ffedd5', color: '#c2410c', fontSize: '11px', fontWeight: 800, padding: '4px 12px', borderRadius: '20px', textTransform: 'uppercase' }}>
                एडवरटाइजिंग पैकेज
              </span>
              <h1 style={{ fontSize: '26px', fontWeight: 900, color: '#1e293b', margin: '10px 0 6px 0' }}>
                अपना विज्ञापन प्लान चुनें
              </h1>
              <p style={{ fontSize: '13.5px', color: '#64748b', maxWidth: '600px', margin: '0 auto' }}>
                अपने ब्रांड और व्यापार को लाखों पाठकों तक पहुँचाने के लिए सही पैकेज एक्टिवेट करें।
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
              {AD_PACKAGES.map((pack) => (
                <div
                  key={pack.id}
                  style={{
                    background: '#ffffff',
                    borderRadius: '12px',
                    border: pack.id === 'network_takeover' ? '2px solid #ea580c' : '1px solid #e2e8f0',
                    padding: '24px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    boxShadow: pack.id === 'network_takeover' ? '0 10px 25px rgba(234,88,12,0.1)' : '0 4px 12px rgba(0,0,0,0.03)',
                    position: 'relative'
                  }}
                >
                  {pack.id === 'network_takeover' && (
                    <span style={{ position: 'absolute', top: '-11px', right: '16px', background: '#ea580c', color: '#fff', fontSize: '10px', fontWeight: 800, padding: '2px 10px', borderRadius: '20px' }}>
                      सर्वाधिक प्रभावी
                    </span>
                  )}

                  <div>
                    <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#1e293b', margin: '0 0 4px 0' }}>{pack.name}</h3>
                    <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '8px' }}>{pack.validity}</div>
                    <div style={{ fontSize: '12px', color: '#059669', fontWeight: 700, marginBottom: '16px' }}>👁️ {pack.impressions}</div>

                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '20px' }}>
                      <span style={{ fontSize: '28px', fontWeight: 900, color: '#ea580c' }}>₹{pack.price}</span>
                      <span style={{ fontSize: '12px', color: '#64748b' }}>/ पैकेज</span>
                    </div>

                    <ul style={{ paddingLeft: '20px', margin: '0 0 24px 0', fontSize: '13px', color: '#475569', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {pack.features.map((f, i) => (
                        <li key={i}>{f}</li>
                      ))}
                    </ul>
                  </div>

                  <button
                    onClick={() => handleRazorpayPayment(pack)}
                    disabled={payingPack === pack.id}
                    style={{
                      width: '100%',
                      padding: '12px',
                      background: pack.id === 'network_takeover' ? '#ea580c' : '#1e293b',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '13.5px',
                      fontWeight: 800,
                      cursor: payingPack === pack.id ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {payingPack === pack.id ? 'Razorpay लोड हो रहा है...' : `₹${pack.price} ऑनलाइन भुगतान करें →`}
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* MEMBERSHIP ACTIVE: Ad Creation Dashboard */
          <div>
            <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '10px', padding: '14px 18px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '20px' }}>🎯</span>
                <div>
                  <b style={{ color: '#065f46', fontSize: '14px' }}>सक्रिय विज्ञापन प्लान: {advertiser.membership.packageName}</b>
                  <div style={{ fontSize: '11.5px', color: '#047857' }}>
                    वैधता: {new Date(advertiser.membership.expiresAt).toLocaleDateString('hi-IN')} तक
                  </div>
                </div>
              </div>
              <span style={{ fontSize: '11px', background: '#059669', color: '#fff', padding: '4px 8px', borderRadius: '4px', fontWeight: 700 }}>
                एक्टिव कैंपेन
              </span>
            </div>

            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#1e293b', margin: '0 0 16px 0' }}>
                📢 नया विज्ञापन बैनर अपलोड व शेड्यूल करें
              </h2>

              {adSuccess && (
                <div style={{ background: '#f0fdf4', border: '1px solid #86efac', color: '#15803d', padding: '12px', borderRadius: '8px', fontSize: '13px', marginBottom: '16px', fontWeight: 600 }}>
                  ✓ आपका विज्ञापन सफलतापूर्वक पोर्टल पर लाइव कर दिया गया है!
                </div>
              )}

              <form onSubmit={handleCreateAd} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    विज्ञापन अभियान का नाम (Campaign Name)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="उदा. फेस्टिव सेल 50% डिस्काउंट..."
                    value={adName}
                    onChange={(e) => setAdName(e.target.value)}
                    style={{ width: '100%', padding: '11px 14px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                      विज्ञापन ज़ोन (Placement Zone)
                    </label>
                    <select
                      value={zone}
                      onChange={(e) => setZone(e.target.value)}
                      style={{ width: '100%', padding: '11px 14px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '13.5px', outline: 'none', background: '#fff', boxSizing: 'border-box' }}
                    >
                      <option value="728x90 (हेडर)">728x90 टॉप हेडर स्लॉट</option>
                      <option value="300x250 (साइडबार)">300x250 साइडबार स्लॉट</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                      टारगेट वेबसाइट लिंक (Target URL)
                    </label>
                    <input
                      type="url"
                      placeholder="https://yourwebsite.com/offer"
                      value={targetUrl}
                      onChange={(e) => setTargetUrl(e.target.value)}
                      style={{ width: '100%', padding: '11px 14px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '13.5px', outline: 'none', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    बैनर इमेज URL (Image URL)
                  </label>
                  <input
                    type="url"
                    required
                    placeholder="https://images.unsplash.com/... या इमेज का डायरेक्ट लिंक"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    style={{ width: '100%', padding: '11px 14px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '13.5px', outline: 'none', boxSizing: 'border-box' }}
                  />
                  {imageUrl && (
                    <div style={{ marginTop: '10px', maxHeight: '120px', overflow: 'hidden', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                      <img src={imageUrl} alt="Ad Preview" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    alignSelf: 'flex-start',
                    padding: '12px 28px',
                    background: '#ea580c',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: 800,
                    fontSize: '14px',
                    cursor: submitting ? 'not-allowed' : 'pointer'
                  }}
                >
                  {submitting ? 'विज्ञापन पब्लिश हो रहा है...' : 'विज्ञापन लाइव करें →'}
                </button>
              </form>
            </div>
          </div>
        )}

      </main>

    </div>
  );
}