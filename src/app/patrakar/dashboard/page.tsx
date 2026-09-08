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
    features: ['प्रति माह 15 खबरें भेजें', 'लेखक प्रोफाइल', 'स्टैंडर्ड रिव्यू']
  },
  {
    id: 'pro',
    name: 'Pro Journalist',
    price: 1199,
    validity: '3 महीने (Quarterly)',
    features: ['अनलिमिटेड खबरें भेजें', 'वेरिफाइड प्रेस आईडी कार्ड', 'प्राथमिकता रिव्यू']
  },
  {
    id: 'chief',
    name: 'Bureau Chief (वार्षिक)',
    price: 3999,
    validity: '1 वर्ष (Annual)',
    features: ['अनलिमिटेड खबरें व वीडियो', 'ज़िला ब्यूरो प्रमुख बैज', 'वेब स्टोरीज़ एक्सेस', 'डायरेक्ट एडिटोरियल एक्सेस']
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
  const [imageUrl, setImageUrl] = useState('');
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
      alert('Razorpay लोड नहीं हो सका। कृपया इंटरनेट जांचें।');
      setPayingPlan(null);
      return;
    }

    const options = {
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_placeholder',
      amount: plan.price * 100,
      currency: 'INR',
      name: 'Journalist Membership',
      description: `${plan.name} - ${plan.validity}`,
      handler: async function (response: any) {
        try {
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

          const updated = { ...reporter, membership: membershipData };
          setReporter(updated);
          localStorage.setItem('patrakar_user', JSON.stringify(updated));

          alert(`बधाई हो! आपका ${plan.name} एक्टिवेट हो गया है।`);
        } catch (err) {
          console.error(err);
          alert('एक्टिवेशन में त्रुटि आई।');
        }
        setPayingPlan(null);
      },
      prefill: {
        name: reporter?.name || 'पत्रकार',
        email: reporter?.email || '',
        contact: reporter?.mobile || ''
      },
      theme: { color: '#ea580c' }
    };

    const rzp = new (window as any).Razorpay(options);
    rzp.open();
  };

  const handleCreateArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    setSubmitting(true);
    try {
      // 🔒 HAR KHABAR STRICTLY PENDING ME JAYEGI (Bina Admin Approval ke live nahi hogi)
      await addDoc(collection(db, 'articles'), {
        title: title.trim(),
        summary: summary.trim(),
        content: content.trim(),
        category,
        image: imageUrl.trim() || 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=1200',
        authorName: reporter?.name || 'पत्रकार',
        authorEmail: reporter?.email || '',
        reporterId: reporter?.id || '',
        siteId: 'the-local-leader',
        createdAt: new Date().toISOString().split('T')[0],
        views: 0,
        status: 'pending' // 🔴 ONLY ADMIN CAN APPROVE THIS
      });

      setTitle('');
      setSummary('');
      setContent('');
      setImageUrl('');
      setArticleSuccess(true);
      setTimeout(() => setArticleSuccess(false), 6000);
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
    <div style={{ minHeight: '100vh', background: '#f8fafc', color: '#0f172a', fontFamily: 'system-ui, sans-serif' }}>
      
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

      <main style={{ maxWidth: '1000px', margin: '30px auto', padding: '0 16px' }}>
        
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
                खबरें भेजने और डिजिटल प्रेस क्रेडेंशियल के लिए सदस्यता सक्रिय करें।
              </p>
            </div>

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
                    boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
                  }}
                >
                  <div>
                    <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#1e293b', margin: '0 0 4px 0' }}>{plan.name}</h3>
                    <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '16px' }}>{plan.validity}</div>
                    
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '20px' }}>
                      <span style={{ fontSize: '28px', fontWeight: 900, color: '#ea580c' }}>₹{plan.price}</span>
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
                      cursor: payingPlan === plan.id ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {payingPlan === plan.id ? 'Razorpay लोड हो रहा है...' : `₹${plan.price} में सक्रिय करें →`}
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div>
            <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '10px', padding: '14px 18px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <b style={{ color: '#065f46', fontSize: '14px' }}>सक्रिय सदस्यता: {reporter.membership.planName}</b>
                <div style={{ fontSize: '11.5px', color: '#047857' }}>
                  वैधता: {new Date(reporter.membership.expiresAt).toLocaleDateString('hi-IN')} तक
                </div>
              </div>
              <span style={{ fontSize: '11px', background: '#059669', color: '#fff', padding: '4px 8px', borderRadius: '4px', fontWeight: 700 }}>
                वेरिफाइड पत्रकार
              </span>
            </div>

            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#1e293b', margin: '0 0 16px 0' }}>
                ✍️ नई खबर दर्ज करें (संपादकीय समीक्षा हेतु)
              </h2>

              {articleSuccess && (
                <div style={{ background: '#fffbeb', border: '1px solid #fde68a', color: '#b45309', padding: '12px 16px', borderRadius: '8px', fontSize: '13px', marginBottom: '16px', fontWeight: 700 }}>
                  ⏳ खबर सफलतापूर्वक प्रेषित हो गई है! यह संपादक की समीक्षा (Pending Review) में है और Admin द्वारा स्वीकृत होने के बाद ही मुख्य वेबसाइट पर लाइव होगी।
                </div>
              )}

              <form onSubmit={handleCreateArticle} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    खबर का शीर्षक (Headline)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="खबर का मुख्य शीर्षक दर्ज करें..."
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
                      <option value="राजनीति">राजनीति</option>
                      <option value="अपराध">अपराध</option>
                      <option value="व्यापार">व्यापार</option>
                      <option value="स्वास्थ्य">स्वास्थ्य</option>
                      <option value="खेल">खेल</option>
                      <option value="राज्य">राज्य / स्थानीय</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                      फोटो यूआरएल (Image URL - ऐच्छिक)
                    </label>
                    <input
                      type="url"
                      placeholder="https://..."
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      style={{ width: '100%', padding: '11px 14px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '13.5px', outline: 'none', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    संक्षिप्त विवरण (Summary)
                  </label>
                  <input
                    type="text"
                    placeholder="1-2 पंक्तियों में सार..."
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                    style={{ width: '100%', padding: '11px 14px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '13.5px', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    खबर का विस्तृत विवरण (Full Story)
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
                  {submitting ? 'भेजा जा रहा है...' : 'संपादक को समीक्षा हेतु भेजें →'}
                </button>
              </form>
            </div>
          </div>
        )}

      </main>

    </div>
  );
}