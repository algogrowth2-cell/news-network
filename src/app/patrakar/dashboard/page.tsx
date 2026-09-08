'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { doc, getDoc, updateDoc, collection, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { loadRazorpayScript } from '@/lib/razorpay';
import Link from 'next/link';

interface Plan {
  id: string;
  name: string;
  price: number;
  validity: string;
  features: string[];
}

const REPORTER_PLANS: Plan[] = [
  {
    id: 'starter',
    name: 'Basic Reporter',
    price: 499,
    validity: '1 महीना (Monthly)',
    features: ['प्रति माह 15 खबरें प्रकाशित करें', 'लेखक प्रोफाइल बैज', 'स्टैंडर्ड सपोर्ट']
  },
  {
    id: 'pro',
    name: 'Pro Journalist',
    price: 1199,
    validity: '3 महीने (Quarterly)',
    features: ['अनलिमिटेड खबरें प्रकाशित करें', 'वेरिफाइड प्रेस आईडी कार्ड', 'ताज़ा ब्रेकिंग न्यूज़ टैग', 'प्राथमिकता सपोर्ट']
  },
  {
    id: 'chief',
    name: 'Bureau Chief (वार्षिक)',
    price: 3999,
    validity: '1 वर्ष (Annual)',
    features: ['अनलिमिटेड खबरें व वीडियो', 'ज़िला ब्यूरो प्रमुख बैज', 'वेब स्टोरीज़ व ई-पेपर एक्सेस', 'डायरेक्ट एडिटोरियल एक्सेस']
  }
];

export default function PatrakarDashboard() {
  const [reporter, setReporter] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [payingPlan, setPayingPlan] = useState<string | null>(null);

  // Article creation state
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('राजनीति');
  const [submitting, setSubmitting] = useState(false);
  const [articleSuccess, setArticleSuccess] = useState(false);

  const router = useRouter();

  useEffect(() => {
    const raw = localStorage.getItem('patrakar_user');
    if (!raw) {
      router.replace('/patrakar/login');
      return;
    }
    const parsed = JSON.parse(raw);
    setReporter(parsed);

    // Refresh user from DB to check membership
    async function syncProfile() {
      if (parsed.id) {
        const snap = await getDoc(doc(db, 'reporters', parsed.id));
        if (snap.exists()) {
          const freshData = { id: snap.id, ...snap.data() };
          setReporter(freshData);
          localStorage.setItem('patrakar_user', JSON.stringify(freshData));
        }
      }
      setLoading(false);
    }
    syncProfile();
  }, [router]);

  const handleRazorpayPayment = async (plan: Plan) => {
    setPayingPlan(plan.id);
    const res = await loadRazorpayScript();
    if (!res) {
      alert('Razorpay SDK लोड करने में विफल रहा। कृपया इंटरनेट कनेक्शन जांचें।');
      setPayingPlan(null);
      return;
    }

    const options = {
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_demoKey12345',
      amount: plan.price * 100, // in paise
      currency: 'INR',
      name: 'News Network Journalist Portal',
      description: `${plan.name} - ${plan.validity}`,
      method: {
        upi: true,
        card: true,
        netbanking: true,
        wallet: true
      },
      config: {
        display: {
          blocks: {
            banks: {
              name: 'Pay via UPI / Cards / Netbanking',
              instruments: [
                { method: 'upi' },
                { method: 'card' },
                { method: 'netbanking' },
                { method: 'wallet' }
              ]
            }
          },
          sequence: ['block.banks'],
          preferences: {
            show_default_blocks: true
          }
        }
      },
      handler: async function (response: any) {
        try {
          // Update Firestore reporter membership
          const expiryDate = new Date();
          if (plan.id === 'starter') expiryDate.setDate(expiryDate.getDate() + 30);
          else if (plan.id === 'pro') expiryDate.setDate(expiryDate.getDate() + 90);
          else expiryDate.setDate(expiryDate.getDate() + 365);

          const membershipData = {
            planId: plan.id,
            planName: plan.name,
            amount: plan.price,
            paymentId: response.razorpay_payment_id || 'test_pay_' + Date.now(),
            status: 'active',
            activatedAt: new Date().toISOString(),
            expiresAt: expiryDate.toISOString()
          };

          await updateDoc(doc(db, 'reporters', reporter.id), {
            membership: membershipData
          });

          // Update local state
          const updated = { ...reporter, membership: membershipData };
          setReporter(updated);
          localStorage.setItem('patrakar_user', JSON.stringify(updated));

          alert(`बधाई हो! आपका ${plan.name} एक्टिवेट हो गया है।`);
        } catch (err) {
          console.error('Error saving membership:', err);
          alert('पेमेंट सफल रहा, पर एक्टिवेशन में समस्या आई।');
        }
        setPayingPlan(null);
      },
      prefill: {
        name: reporter?.name || 'Journalist',
        email: reporter?.email || '',
        contact: reporter?.mobile || ''
      },
      theme: {
        color: '#ea580c'
      }
    };

    const paymentObject = new (window as any).Razorpay(options);
    paymentObject.open();
  };

  const handleCreateArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    setSubmitting(true);
    try {
      await addDoc(collection(db, 'articles'), {
        title,
        summary,
        content,
        category,
        authorName: reporter?.name || 'पत्रकार',
        authorEmail: reporter?.email || '',
        reporterId: reporter?.id,
        siteId: 'the-local-leader', // Default or user choice
        createdAt: new Date().toISOString().split('T')[0],
        views: 0,
        status: 'pending' // Enforced for Admin Approval
      });
      setTitle('');
      setSummary('');
      setContent('');
      setArticleSuccess(true);
      setTimeout(() => setArticleSuccess(false), 5000);
    } catch (err) {
      console.error(err);
      alert('खबर सबमिट करने में समस्या आई।');
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
        पत्रकार प्रोफ़ाइल लोड हो रही है...
      </div>
    );
  }

  const hasActiveMembership = reporter?.membership?.status === 'active';

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', color: '#0f172a', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      
      {/* Top Navbar */}
      <header style={{ background: '#ffffff', borderBottom: '1px solid #e2e8f0', padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '24px' }}>🪪</span>
          <div>
            <h2 style={{ fontSize: '16px', fontWeight: 800, margin: 0 }}>पत्रकार डेस्क</h2>
            <div style={{ fontSize: '11px', color: '#64748b' }}>
              नमस्ते, <b>{reporter?.name}</b> ({reporter?.email})
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Link href="/" style={{ fontSize: '12px', color: '#64748b', textDecoration: 'none' }}>
            वेबसाइट देखें ↗
          </Link>
          <button
            onClick={() => {
              localStorage.removeItem('patrakar_user');
              router.push('/patrakar/login');
            }}
            style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '11.5px', fontWeight: 700, cursor: 'pointer' }}
          >
            लॉग आउट
          </button>
        </div>
      </header>

      <main style={{ maxWidth: '1100px', margin: '30px auto', padding: '0 16px' }}>
        
        {/* MEMBERSHIP GATE: Agar membership active nahi hai toh pehle Plans screen aayegi */}
        {!hasActiveMembership ? (
          <div>
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <span style={{ background: '#ffedd5', color: '#c2410c', fontSize: '11px', fontWeight: 800, padding: '4px 12px', borderRadius: '20px', textTransform: 'uppercase' }}>
                प्रेस सदस्यता योजना
              </span>
              <h1 style={{ fontSize: '26px', fontWeight: 900, color: '#1e293b', margin: '10px 0 6px 0' }}>
                पत्रकार सदस्यता प्लान चुनें
              </h1>
              <p style={{ fontSize: '13.5px', color: '#64748b', maxWidth: '600px', margin: '0 auto' }}>
                खबरें प्रकाशित करने और डिजिटल प्रेस क्रेडेंशियल प्राप्त करने के लिए अपनी पसंद की योजना सक्रिय करें।
              </p>
            </div>

            {/* Plans Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
              {REPORTER_PLANS.map((plan) => (
                <div
                  key={plan.id}
                  style={{
                    background: '#ffffff',
                    borderRadius: '12px',
                    border: plan.id === 'pro' ? '2px solid #ea580c' : '1px solid #e2e8f0',
                    padding: '24px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    boxShadow: plan.id === 'pro' ? '0 10px 25px rgba(234,88,12,0.1)' : '0 4px 12px rgba(0,0,0,0.03)',
                    position: 'relative'
                  }}
                >
                  {plan.id === 'pro' && (
                    <span style={{ position: 'absolute', top: '-11px', right: '16px', background: '#ea580c', color: '#fff', fontSize: '10px', fontWeight: 800, padding: '2px 10px', borderRadius: '20px' }}>
                      सर्वाधिक लोकप्रिय
                    </span>
                  )}

                  <div>
                    <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#1e293b', margin: '0 0 4px 0' }}>{plan.name}</h3>
                    <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '16px' }}>{plan.validity}</div>
                    
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '20px' }}>
                      <span style={{ fontSize: '28px', fontWeight: 900, color: '#ea580c' }}>₹{plan.price}</span>
                      <span style={{ fontSize: '12px', color: '#64748b' }}>/ अवधि</span>
                    </div>

                    <ul style={{ paddingLeft: '20px', margin: '0 0 24px 0', fontSize: '13px', color: '#475569', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {plan.features.map((f, i) => (
                        <li key={i}>{f}</li>
                      ))}
                    </ul>
                  </div>

                  <button
                    onClick={() => handleRazorpayPayment(plan)}
                    disabled={payingPlan === plan.id}
                    style={{
                      width: '100%',
                      padding: '12px',
                      background: plan.id === 'pro' ? '#ea580c' : '#1e293b',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '13.5px',
                      fontWeight: 800,
                      cursor: payingPlan === plan.id ? 'not-allowed' : 'pointer',
                      transition: 'opacity 0.2s'
                    }}
                  >
                    {payingPlan === plan.id ? 'Razorpay खुल रहा है...' : `₹${plan.price} में एक्टिवेट करें →`}
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* MEMBERSHIP ACTIVE: News Article Create Dashboard */
          <div>
            {/* Active Plan Status Badge */}
            <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '10px', padding: '14px 18px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '20px' }}>✅</span>
                <div>
                  <b style={{ color: '#065f46', fontSize: '14px' }}>सक्रिय सदस्यता: {reporter.membership.planName}</b>
                  <div style={{ fontSize: '11.5px', color: '#047857' }}>
                    वैधता: {new Date(reporter.membership.expiresAt).toLocaleDateString('hi-IN')} तक
                  </div>
                </div>
              </div>
              <span style={{ fontSize: '11px', background: '#059669', color: '#fff', padding: '4px 8px', borderRadius: '4px', fontWeight: 700 }}>
                वेरिफाइड पत्रकार
              </span>
            </div>

            {/* Article Submission Card */}
            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#1e293b', margin: '0 0 16px 0' }}>
                ✍️ नई खबर / लेख दर्ज करें
              </h2>

              {articleSuccess && (
                <div style={{ background: '#f0fdf4', border: '1px solid #86efac', color: '#15803d', padding: '12px', borderRadius: '8px', fontSize: '13px', marginBottom: '16px', fontWeight: 600 }}>
                  ✓ आपकी खबर सफलतापूर्वक प्रेषित हो गई है। संपादक द्वारा समीक्षा के बाद पोर्टल पर लाइव प्रकाशित होगी।
                </div>
              )}

              <form onSubmit={handleCreateArticle} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    खबर का मुख्य शीर्षक (Headline)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="आकर्षक शीर्षक दर्ज करें..."
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    style={{ width: '100%', padding: '11px 14px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                      श्रेणी (Category)
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      style={{ width: '100%', padding: '11px 14px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '13.5px', outline: 'none', background: '#fff', boxSizing: 'border-box' }}
                    >
                      <option value="राजनीति">राजनीति (Politics)</option>
                      <option value="अपराध">अपराध (Crime)</option>
                      <option value="व्यापार">व्यापार (Business)</option>
                      <option value="स्वास्थ्य">स्वास्थ्य (Health)</option>
                      <option value="खेल">खेल (Sports)</option>
                      <option value="राज्य">राज्य / स्थानीय</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                      संक्षिप्त विवरण (Short Summary)
                    </label>
                    <input
                      type="text"
                      placeholder="1-2 पंक्तियों में सार..."
                      value={summary}
                      onChange={(e) => setSummary(e.target.value)}
                      style={{ width: '100%', padding: '11px 14px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '13.5px', outline: 'none', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    खबर का विस्तृत विवरण (Full Article Story)
                  </label>
                  <textarea
                    required
                    rows={8}
                    placeholder="खबर का पूरा ब्यौरा विस्तार से यहां लिखें..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    style={{ width: '100%', padding: '12px 14px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '14px', outline: 'none', boxSizing: 'border-box', lineHeight: '1.6' }}
                  />
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
                  {submitting ? 'भेजा जा रहा है...' : 'संपादक को खबर प्रेषित करें →'}
                </button>
              </form>
            </div>
          </div>
        )}

      </main>

    </div>
  );
}