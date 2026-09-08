'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { loadRazorpayScript } from '@/lib/razorpay';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface StateItem {
  id: string;
  name: string;
  image: string;
}

interface CityItem {
  id: string;
  name: string;
  stateId: string;
}

const STATES_DATA: StateItem[] = [
  { id: 'mp', name: 'मध्य प्रदेश', image: 'https://images.unsplash.com/photo-1599661046827-dacff0c0f09a?w=150' },
  { id: 'rj', name: 'राजस्थान', image: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?w=150' },
  { id: 'cg', name: 'छत्तीसगढ़', image: 'https://images.unsplash.com/photo-1626583222325-1e35d2524419?w=150' },
  { id: 'up', name: 'उत्तर प्रदेश', image: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?w=150' },
  { id: 'bihar', name: 'बिहार', image: 'https://images.unsplash.com/photo-1600100397608-f010f443b2f5?w=150' },
  { id: 'jharkhand', name: 'झारखंड', image: 'https://images.unsplash.com/photo-1588416936097-41850ab3d86d?w=150' },
  { id: 'delhi', name: 'नई दिल्ली', image: 'https://images.unsplash.com/photo-1587474260584-136574528ed5?w=150' },
  { id: 'haryana', name: 'हरियाणा', image: 'https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?w=150' },
  { id: 'punjab', name: 'पंजाब', image: 'https://images.unsplash.com/photo-1514222134-b57cbb8ce073?w=150' },
];

const CITIES_DATA: CityItem[] = [
  { id: 'indore', name: 'इंदौर', stateId: 'mp' },
  { id: 'bhopal', name: 'भोपाल', stateId: 'mp' },
  { id: 'gwalior', name: 'ग्वालियर', stateId: 'mp' },
  { id: 'jabalpur', name: 'जबलपुर', stateId: 'mp' },
  { id: 'ratlam', name: 'रतलाम', stateId: 'mp' },
  { id: 'khandwa', name: 'खंडवा', stateId: 'mp' },
  { id: 'ujjain', name: 'उज्जैन', stateId: 'mp' },
  { id: 'narmadapuram', name: 'नर्मदापुरम (होशंगाबाद)', stateId: 'mp' },
  { id: 'sagar', name: 'सागर', stateId: 'mp' },
  { id: 'morena', name: 'मुरैना', stateId: 'mp' },
  { id: 'bhind', name: 'भिंड', stateId: 'mp' },
  { id: 'ashoknagar', name: 'अशोकनगर', stateId: 'mp' },
  { id: 'raisen', name: 'रायसेन', stateId: 'mp' },
  { id: 'sehore', name: 'सीहोर', stateId: 'mp' },
  { id: 'guna', name: 'गुना', stateId: 'mp' },
  { id: 'datia', name: 'दतिया', stateId: 'mp' },
  { id: 'chhatarpur', name: 'छतरपुर (मध्य प्रदेश)', stateId: 'mp' },
  { id: 'mandsaur', name: 'मंदसौर', stateId: 'mp' },
  { id: 'khargone', name: 'खरगोन', stateId: 'mp' },
  { id: 'jaipur', name: 'जयपुर', stateId: 'rj' },
  { id: 'jodhpur', name: 'जोधपुर', stateId: 'rj' },
  { id: 'lucknow', name: 'लखनऊ', stateId: 'up' },
  { id: 'patna', name: 'पटना', stateId: 'bihar' },
];

export default function EPaperPage() {
  // Steps: 'state' -> 'city' -> 'plan' -> 'editions'
  const [step, setStep] = useState<'state' | 'city' | 'plan' | 'editions'>('state');
  
  const [selectedState, setSelectedState] = useState<string>('mp');
  const [selectedCities, setSelectedCities] = useState<string[]>(['indore']);
  const [citySearch, setCitySearch] = useState('');
  
  // Membership State
  const [selectedPlan, setSelectedPlan] = useState<'annual' | 'monthly'>('annual');
  const [hasSubscription, setHasSubscription] = useState(false);
  const [paying, setPaying] = useState(false);
  const [readerUser, setReaderUser] = useState<any>(null);

  // Read Reader User Session
  useEffect(() => {
    const raw = localStorage.getItem('reader_user');
    if (raw) {
      try {
        const user = JSON.parse(raw);
        setReaderUser(user);
        if (user.epaperSubscribed) {
          setHasSubscription(true);
          setStep('editions');
        }
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const toggleCity = (cityName: string) => {
    if (selectedCities.includes(cityName)) {
      setSelectedCities(selectedCities.filter((c) => c !== cityName));
    } else {
      setSelectedCities([...selectedCities, cityName]);
    }
  };

  const handleProceedToCity = () => {
    setStep('city');
  };

  const handleProceedToPlanOrEditions = () => {
    if (hasSubscription) {
      setStep('editions');
    } else {
      setStep('plan');
    }
  };

  // Razorpay Checkout Integration
  const handleRazorpayPay = async () => {
    setPaying(true);
    const loaded = await loadRazorpayScript();
    if (!loaded) {
      alert('Razorpay SDK लोड नहीं हो सका। इंटरनेट कनेक्शन जांचें।');
      setPaying(false);
      return;
    }

    const planAmount = selectedPlan === 'annual' ? 199 : 1; // Rs 199 or Rs 1
    const planName = selectedPlan === 'annual' ? 'ई-पेपर वार्षिक मेंबरशिप' : 'ई-पेपर पहला महीना ट्रायल';

    const options = {
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_placeholder',
      amount: planAmount * 100, // paise
      currency: 'INR',
      name: 'दैनिक डिजिटल ई-पेपर',
      description: planName,
      handler: async function (response: any) {
        // Success callback
        setHasSubscription(true);
        const updatedUser = {
          ...(readerUser || { name: 'पाठक', email: 'reader@news.com' }),
          epaperSubscribed: true,
          epaperPaymentId: response.razorpay_payment_id || 'pay_test_' + Date.now(),
          epaperPlan: selectedPlan,
          epaperExpireAt: new Date(Date.now() + (selectedPlan === 'annual' ? 365 : 30) * 86400000).toISOString()
        };

        localStorage.setItem('reader_user', JSON.stringify(updatedUser));
        setReaderUser(updatedUser);

        // Update in Firestore if user has account
        if (readerUser?.id) {
          try {
            await updateDoc(doc(db, 'users', readerUser.id), {
              epaperSubscribed: true,
              epaperPaymentId: response.razorpay_payment_id,
              epaperPlan: selectedPlan
            });
          } catch (e) {
            console.error(e);
          }
        }

        alert('बधाई हो! आपकी ई-पेपर प्रीमियम मेंबरशिप सक्रिय हो चुकी है।');
        setStep('editions');
        setPaying(false);
      },
      prefill: {
        name: readerUser?.name || 'पाठक',
        email: readerUser?.email || 'reader@news.com',
        contact: readerUser?.mobile || '9999999999'
      },
      theme: {
        color: '#ea580c'
      }
    };

    const rzp = new (window as any).Razorpay(options);
    rzp.on('payment.failed', function (resp: any) {
      alert('पेमेंट विफल: ' + (resp.error.description || 'त्रुटि आई'));
      setPaying(false);
    });
    rzp.open();
  };

  const filteredCities = CITIES_DATA.filter(
    (c) =>
      (!selectedState || c.stateId === selectedState) &&
      (!citySearch || c.name.toLowerCase().includes(citySearch.toLowerCase()))
  );

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', color: '#0f172a', fontFamily: 'system-ui, -apple-system, sans-serif', display: 'flex', flexDirection: 'column' }}>
      
      {/* 1. TOP E-PAPER HEADER (Exact as Screenshot) */}
      <header style={{ background: '#ffffff', borderBottom: '1px solid #e2e8f0', padding: '12px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
          <div style={{ width: '28px', height: '28px', background: '#ea580c', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '14px', fontWeight: 900 }}>
            ☀
          </div>
          <span style={{ fontSize: '20px', fontWeight: 900, color: '#1e293b' }}>
            दैनिक भास्कर <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 700 }}>ई-पेपर</span>
          </span>
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', fontSize: '13px', color: '#334155' }}>
          {step === 'editions' && (
            <>
              <button onClick={() => alert('तारीख कैलेंडर खुलेगा')} style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', color: '#334155' }}>
                📅 तारीख बदलें
              </button>
              <button onClick={() => setStep('state')} style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', color: '#334155' }}>
                📍 शहर बदलें
              </button>
            </>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontWeight: 600 }}>
            <span>📰 ई-पेपर पढ़ें</span>
          </div>
          <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px' }}>
            👤
          </div>
        </div>
      </header>

      {/* 2. BODY CONTENT (4-STEP ROUTING) */}
      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 16px' }}>
        
        {/* STEP 1: STATE SELECTION (Screenshot 4) */}
        {step === 'state' && (
          <div style={{ width: '100%', maxWidth: '440px', background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 8px 30px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', fontWeight: 800, fontSize: '16px' }}>
              ई-पेपर के लिए राज्य चुनें
            </div>

            <div style={{ maxHeight: '420px', overflowY: 'auto', padding: '20px 16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', textAlign: 'center' }}>
                {STATES_DATA.map((st) => {
                  const isSelected = selectedState === st.id;
                  return (
                    <div
                      key={st.id}
                      onClick={() => setSelectedState(st.id)}
                      style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}
                    >
                      <div style={{ position: 'relative', width: '70px', height: '70px', borderRadius: '50%', overflow: 'hidden', border: isSelected ? '3px solid #ea580c' : '2px solid transparent' }}>
                        <img src={st.image} alt={st.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        {isSelected ? (
                          <div style={{ position: 'absolute', top: 2, right: 2, background: '#ea580c', color: '#fff', borderRadius: '50%', width: '18px', height: '18px', fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900 }}>
                            ✓
                          </div>
                        ) : (
                          <div style={{ position: 'absolute', top: 2, right: 2, background: 'rgba(255,255,255,0.85)', color: '#64748b', borderRadius: '50%', width: '16px', height: '16px', fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                            +
                          </div>
                        )}
                      </div>
                      <span style={{ fontSize: '12.5px', fontWeight: isSelected ? 800 : 500, color: isSelected ? '#ea580c' : '#334155' }}>
                        {st.name}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{ padding: '14px 20px', borderTop: '1px solid #f1f5f9' }}>
              <button
                onClick={handleProceedToCity}
                style={{ width: '100%', padding: '12px', background: '#ea580c', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 800, cursor: 'pointer' }}
              >
                आगे बढ़ें
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: CITY SELECTION (Screenshot 3) */}
        {step === 'city' && (
          <div style={{ width: '100%', maxWidth: '440px', background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 8px 30px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontWeight: 800, fontSize: '16px' }}>शहर चुनें</span>
              <div style={{ position: 'relative', flex: 1 }}>
                <input
                  type="text"
                  placeholder="शहर खोजें..."
                  value={citySearch}
                  onChange={(e) => setCitySearch(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px 8px 30px', background: '#f1f5f9', border: 'none', borderRadius: '6px', fontSize: '12.5px', outline: 'none', boxSizing: 'border-box' }}
                />
                <span style={{ position: 'absolute', left: '10px', top: '7px', fontSize: '13px', color: '#64748b' }}>🔍</span>
              </div>
            </div>

            <div style={{ maxHeight: '380px', overflowY: 'auto', padding: '12px 16px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {filteredCities.map((ct) => {
                const isSelected = selectedCities.includes(ct.name);
                return (
                  <button
                    key={ct.id}
                    onClick={() => toggleCity(ct.name)}
                    style={{
                      background: isSelected ? '#fff7ed' : '#ffffff',
                      border: isSelected ? '1.5px solid #ea580c' : '1px solid #e2e8f0',
                      color: isSelected ? '#ea580c' : '#334155',
                      padding: '7px 14px',
                      borderRadius: '20px',
                      fontSize: '13px',
                      fontWeight: isSelected ? 700 : 500,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <span>{ct.name}</span>
                    <span>{isSelected ? '✓' : '+'}</span>
                  </button>
                );
              })}
            </div>

            <div style={{ padding: '14px 20px', borderTop: '1px solid #f1f5f9', display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setStep('state')}
                style={{ padding: '12px 16px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}
              >
                ← वापस
              </button>
              <button
                onClick={handleProceedToPlanOrEditions}
                style={{ flex: 1, padding: '12px', background: '#ea580c', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 800, cursor: 'pointer' }}
              >
                आगे बढ़ें ({selectedCities.length} शहर चुने गए)
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: MEMBERSHIP & RAZORPAY PAYWALL MODAL (Screenshot 1) */}
        {step === 'plan' && (
          <div style={{ width: '100%', maxWidth: '580px', background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 12px 40px rgba(0,0,0,0.08)', padding: '24px', position: 'relative' }}>
            
            {/* Top Badge Card */}
            <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '18px', display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '14px', alignItems: 'center', border: '1px solid #edf2f7' }}>
              <div>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#ea580c', color: '#fff', fontSize: '10.5px', fontWeight: 800, padding: '2px 8px', borderRadius: '4px', textTransform: 'uppercase', marginBottom: '8px' }}>
                  👑 प्रीमियम मेंबरशिप प्लान
                </span>
                <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '12.5px', color: '#334155', display: 'flex', flexDirection: 'column', gap: '6px', lineHeight: 1.4 }}>
                  <li>अपने शहर समेत 11 राज्यों के 270 शहरों के <b>ई-पेपर कहीं भी और कभी भी पढ़ें</b></li>
                  <li>प्रीमियम न्यूज़ सिर्फ आपके लिए</li>
                  <li>पढ़ें लोकल न्यूज बिना किसी रुकावट के</li>
                  <li>अनलिमिटेड न्यूज <b>2500+ जर्नलिस्ट</b> के जरिये</li>
                </ul>
              </div>

              {/* Newspaper collage graphic */}
              <div style={{ position: 'relative', height: '140px', background: '#fff', borderRadius: '8px', border: '1px solid #cbd5e1', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <img src="https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=300" alt="Newspaper Pages" style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'rotate(-3deg) scale(1.05)' }} />
              </div>
            </div>

            {/* Limited Time Offer Headline */}
            <div style={{ textAlign: 'center', margin: '20px 0 14px 0', fontSize: '13px', fontWeight: 800, color: '#c2410c' }}>
              🎉 लिमिटेड टाइम ऑफर 🎉
            </div>

            {/* Plan Select Options */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '14px' }}>
              
              {/* Option 1: 1 Year (₹199) */}
              <div
                onClick={() => setSelectedPlan('annual')}
                style={{
                  border: selectedPlan === 'annual' ? '2px solid #ea580c' : '1px solid #cbd5e1',
                  background: selectedPlan === 'annual' ? '#fffaf5' : '#ffffff',
                  borderRadius: '10px',
                  padding: '16px',
                  cursor: 'pointer',
                  position: 'relative'
                }}
              >
                <span style={{ position: 'absolute', top: '-10px', left: '16px', background: '#22c55e', color: '#fff', fontSize: '9.5px', fontWeight: 800, padding: '2px 8px', borderRadius: '4px' }}>
                  रोज़ ₹1 से कम
                </span>
                {selectedPlan === 'annual' && (
                  <span style={{ position: 'absolute', top: '-8px', right: '-8px', background: '#ea580c', color: '#fff', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 900 }}>
                    ✓
                  </span>
                )}
                <div style={{ fontSize: '12px', color: '#64748b' }}>1 साल</div>
                <div style={{ fontSize: '24px', fontWeight: 900, color: '#0f172a', marginTop: '2px' }}>₹199</div>
              </div>

              {/* Option 2: 1st Month (₹1) */}
              <div
                onClick={() => setSelectedPlan('monthly')}
                style={{
                  border: selectedPlan === 'monthly' ? '2px solid #ea580c' : '1px solid #cbd5e1',
                  background: selectedPlan === 'monthly' ? '#fffaf5' : '#ffffff',
                  borderRadius: '10px',
                  padding: '16px',
                  cursor: 'pointer',
                  position: 'relative'
                }}
              >
                {selectedPlan === 'monthly' && (
                  <span style={{ position: 'absolute', top: '-8px', right: '-8px', background: '#ea580c', color: '#fff', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 900 }}>
                    ✓
                  </span>
                )}
                <div style={{ fontSize: '12px', color: '#64748b' }}>पहला महीना</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: '2px' }}>
                  <span style={{ fontSize: '24px', fontWeight: 900, color: '#0f172a' }}>₹1</span>
                  <span style={{ fontSize: '14px', color: '#94a3b8', textDecoration: 'line-through' }}>₹25</span>
                </div>
              </div>

            </div>

            {/* Pay Button via Razorpay */}
            <div style={{ marginTop: '20px' }}>
              <button
                onClick={handleRazorpayPay}
                disabled={paying}
                style={{
                  width: '100%',
                  padding: '14px',
                  background: '#ea580c',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '15px',
                  fontWeight: 900,
                  cursor: paying ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 15px rgba(234, 88, 12, 0.3)'
                }}
              >
                {paying ? 'Razorpay लोड हो रहा है...' : `पाएं प्रीमियम सिर्फ ₹${selectedPlan === 'annual' ? '199' : '1'} में`}
              </button>
            </div>

            <div style={{ textAlign: 'center', marginTop: '10px', fontSize: '11px', color: '#94a3b8' }}>
              By proceeding you agree to our T&C and Privacy Policy
            </div>
          </div>
        )}

        {/* STEP 4: E-PAPER THUMBNAIL READER GRID (Screenshot 2) */}
        {step === 'editions' && (
          <div style={{ width: '100%', maxWidth: '1100px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 900, margin: '0 0 20px 0', color: '#1e293b' }}>
              मेरे पसंदीदा शहर
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '20px' }}>
              {selectedCities.map((cityName) => (
                <div key={cityName} style={{ background: '#ffffff', borderRadius: '10px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
                  
                  {/* City Name Header */}
                  <div style={{ padding: '10px 14px', fontWeight: 700, fontSize: '14px', color: '#1e293b', borderBottom: '1px solid #f1f5f9' }}>
                    {cityName}
                  </div>

                  {/* Newspaper Mock Page Preview */}
                  <div
                    onClick={() => alert(`${cityName} का आज का पूरा ई-पेपर पीडीएफ लोड हो रहा है...`)}
                    style={{ height: '240px', background: '#0f172a', position: 'relative', cursor: 'pointer', overflow: 'hidden' }}
                  >
                    <img
                      src="https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=500"
                      alt={cityName}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '8px', background: 'linear-gradient(transparent, rgba(0,0,0,0.85))', color: '#fff', fontSize: '11.5px', fontWeight: 700 }}>
                      पूरा अखबार पढ़ें ↗
                    </div>
                  </div>

                  {/* Date and Action Row */}
                  <div style={{ padding: '8px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: '#64748b' }}>
                    <span>08-09-2026</span>
                    <button
                      onClick={() => {
                        if (navigator.share) {
                          navigator.share({ title: `${cityName} ई-पेपर`, url: window.location.href });
                        } else {
                          navigator.clipboard.writeText(window.location.href);
                          alert('ई-पेपर लिंक कॉपी हो गया!');
                        }
                      }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px' }}
                    >
                      🔗
                    </button>
                  </div>

                </div>
              ))}
            </div>
          </div>
        )}

      </main>

      {/* 3. E-PAPER COMPLIANT FOOTER (Screenshots 3 & 4 matching) */}
      <footer style={{ background: '#ffffff', borderTop: '1px solid #e2e8f0', padding: '16px', textAlign: 'center', fontSize: '12px', color: '#64748b' }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '14px', flexWrap: 'wrap', marginBottom: '8px' }}>
          <Link href="/about-us" style={{ color: 'inherit', textDecoration: 'none' }}>About Us</Link>
          <span>|</span>
          <Link href="/privacy-policy" style={{ color: 'inherit', textDecoration: 'none' }}>Cookie Policy</Link>
          <span>|</span>
          <Link href="/privacy-policy" style={{ color: 'inherit', textDecoration: 'none' }}>Privacy Policy</Link>
          <span>|</span>
          <Link href="/terms-and-conditions" style={{ color: 'inherit', textDecoration: 'none' }}>Terms and Conditions</Link>
          <span>|</span>
          <Link href="/refund-policy" style={{ color: 'inherit', textDecoration: 'none' }}>Refund policy</Link>
          <span>|</span>
          <Link href="/contact-us" style={{ color: 'inherit', textDecoration: 'none' }}>Contact Us</Link>
        </div>
        <div>Copyright©2026 DB Corp Ltd. All Rights Reserved</div>
      </footer>

    </div>
  );
}