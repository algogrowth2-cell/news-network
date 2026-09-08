'use client';
import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { loadRazorpayScript } from '@/lib/razorpay';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
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

const DEFAULT_SITES: Record<string, any> = {
  'the-local-leader': { name: 'द लोकल लीडर', primaryColor: '#ea580c', logo: '/logos/the-local-leader.jpeg' },
  'bazar-karobar': { name: 'बाजार कारोबार', primaryColor: '#059669', logo: '/logos/bazar-karobar.jpeg' },
  'ndn-defence': { name: 'National Defence Network', primaryColor: '#15803d', logo: '/logos/ndn-defence.jpeg' },
  'golden-pearl-chronicles': { name: 'गोल्डन पर्ल क्रॉनिकल्स', primaryColor: '#d97706', logo: '/logos/golden-pearl-chronicles.jpeg' },
  'the-provue-times': { name: 'द प्रोव्यू टाइम्स', primaryColor: '#2563eb', logo: '/logos/the-provue-times.jpeg' },
  'desh-ki-aawaz': { name: 'देश की आवाज़', primaryColor: '#dc2626', logo: '/logos/desh-ki-aawaz.jpeg' },
  'jan-bharat-news': { name: 'जन भारत न्यूज़', primaryColor: '#7c3aed', logo: '/logos/jan-bharat-news.jpeg' },
  'news-info-24': { name: 'NEWS INFO 24', primaryColor: '#0284c7', logo: '/logos/news-info-24.jpeg' }
};

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

function EPaperContent() {
  const searchParams = useSearchParams();
  const [currentSlug, setCurrentSlug] = useState('the-local-leader');
  const [siteConfig, setSiteConfig] = useState<any>(null);

  // Steps: 'auth' | 'state' | 'city' | 'plan' | 'editions'
  const [step, setStep] = useState<'auth' | 'state' | 'city' | 'plan' | 'editions'>('auth');
  
  // Auth Form State
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [authName, setAuthName] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [authPhone, setAuthPhone] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState('');

  // Selection States
  const [selectedState, setSelectedState] = useState<string>('mp');
  const [selectedCities, setSelectedCities] = useState<string[]>(['indore']);
  const [citySearch, setCitySearch] = useState('');
  
  // Membership States
  const [selectedPlan, setSelectedPlan] = useState<'annual' | 'monthly'>('annual');
  const [hasSubscription, setHasSubscription] = useState(false);
  const [paying, setPaying] = useState(false);
  const [readerUser, setReaderUser] = useState<any>(null);

  // 1. Dynamic Portal Setup
  useEffect(() => {
    const slugFromUrl = searchParams.get('site') || 'the-local-leader';
    setCurrentSlug(slugFromUrl);

    const unsub = onSnapshot(doc(db, 'sites', slugFromUrl), (snap) => {
      if (snap.exists()) {
        setSiteConfig({ slug: slugFromUrl, ...snap.data() });
      } else {
        const def = DEFAULT_SITES[slugFromUrl] || DEFAULT_SITES['the-local-leader'];
        setSiteConfig({
          slug: slugFromUrl,
          name: def.name,
          primaryColor: def.primaryColor,
          logoUrl: def.logo
        });
      }
    });

    return () => unsub();
  }, [searchParams]);

  // 2. Check User Session
  useEffect(() => {
    const raw = localStorage.getItem('reader_user');
    if (raw) {
      try {
        const user = JSON.parse(raw);
        setReaderUser(user);
        if (user.epaperSubscribed) {
          setHasSubscription(true);
          setStep('editions');
        } else {
          setStep('state');
        }
      } catch (e) {
        setStep('auth');
      }
    } else {
      setStep('auth');
    }
  }, []);

  const primary = siteConfig?.primaryColor || '#ea580c';
  const siteName = siteConfig?.name || 'द लोकल लीडर';

  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');

    if (!authEmail || !authPassword) {
      setAuthError('कृपया ईमेल और पासवर्ड भरें');
      return;
    }

    const userData = {
      name: authName || (authMode === 'login' ? authEmail.split('@')[0] : 'पाठक'),
      email: authEmail.trim().toLowerCase(),
      mobile: authPhone || '',
      loggedInAt: new Date().toISOString(),
      epaperSubscribed: false
    };

    localStorage.setItem('reader_user', JSON.stringify(userData));
    setReaderUser(userData);
    setStep('state');
  };

  const handleLogout = () => {
    localStorage.removeItem('reader_user');
    setReaderUser(null);
    setHasSubscription(false);
    setStep('auth');
  };

  const toggleCity = (cityName: string) => {
    if (selectedCities.includes(cityName)) {
      setSelectedCities(selectedCities.filter((c) => c !== cityName));
    } else {
      setSelectedCities([...selectedCities, cityName]);
    }
  };

  const handleRazorpayPay = async () => {
    setPaying(true);
    const loaded = await loadRazorpayScript();
    if (!loaded) {
      alert('Razorpay SDK लोड नहीं हो सका। कृपया इंटरनेट जांचें।');
      setPaying(false);
      return;
    }

    const planAmount = selectedPlan === 'annual' ? 199 : 1;
    const planName = selectedPlan === 'annual' ? `${siteName} ई-पेपर वार्षिक प्लान` : `${siteName} ई-पेपर ट्रायल`;

    const options = {
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_placeholder',
      amount: planAmount * 100,
      currency: 'INR',
      name: `${siteName} डिजिटल ई-पेपर`,
      description: planName,

      // Explicitly enable and display UPI payment method in Test Mode
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
        setHasSubscription(true);
        const updatedUser = {
          ...readerUser,
          epaperSubscribed: true,
          epaperPaymentId: response.razorpay_payment_id || 'pay_test_' + Date.now(),
          epaperPlan: selectedPlan,
          epaperExpireAt: new Date(Date.now() + (selectedPlan === 'annual' ? 365 : 30) * 86400000).toISOString()
        };

        localStorage.setItem('reader_user', JSON.stringify(updatedUser));
        setReaderUser(updatedUser);

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

        alert(`बधाई हो! आपकी ${siteName} ई-पेपर मेंबरशिप सक्रिय हो चुकी है।`);
        setStep('editions');
        setPaying(false);
      },
      prefill: {
        name: readerUser?.name || 'पाठक',
        email: readerUser?.email || '',
        contact: readerUser?.mobile || ''
      },
      theme: {
        color: primary
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
      
      {/* 1. DYNAMIC TOP PORTAL HEADER */}
      <header style={{ background: '#ffffff', borderBottom: '1px solid #e2e8f0', padding: '12px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link href={`/?site=${currentSlug}`} style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
          <img 
            src={siteConfig?.logoUrl || `/logos/${currentSlug}.jpeg`} 
            alt={siteName} 
            style={{ height: '36px', width: 'auto', objectFit: 'contain', borderRadius: '4px' }}
            onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }}
          />
          <span style={{ fontSize: '20px', fontWeight: 900, color: '#1e293b' }}>
            {siteName} <span style={{ fontSize: '13px', color: primary, fontWeight: 800 }}>ई-पेपर</span>
          </span>
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '12.5px', color: '#334155' }}>
          {step === 'editions' && (
            <button onClick={() => setStep('state')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '12.5px', color: '#334155', fontWeight: 600 }}>
              📍 शहर बदलें
            </button>
          )}

          {readerUser ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontWeight: 700, color: '#0f172a' }}>👤 {readerUser.name}</span>
              <button onClick={handleLogout} style={{ background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '4px', padding: '3px 8px', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}>
                लॉग आउट
              </button>
            </div>
          ) : (
            <button onClick={() => setStep('auth')} style={{ background: primary, color: '#fff', border: 'none', borderRadius: '4px', padding: '5px 12px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>
              लॉगिन / साइनअप
            </button>
          )}
        </div>
      </header>

      {/* 2. BODY CONTENT */}
      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 16px' }}>
        
        {/* STEP 0: LOGIN / SIGNUP */}
        {step === 'auth' && (
          <div style={{ width: '100%', maxWidth: '420px', background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 10px 30px rgba(0,0,0,0.06)', padding: '30px 24px' }}>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div style={{ width: '48px', height: '48px', background: '#fff7ed', borderRadius: '12px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', marginBottom: '8px' }}>
                📰
              </div>
              <h2 style={{ fontSize: '19px', fontWeight: 900, color: '#1e293b', margin: '0 0 4px 0' }}>
                {siteName} ई-पेपर में आपका स्वागत है
              </h2>
              <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>
                ई-पेपर और संस्करण पढ़ने के लिए कृपया पहले लॉगिन करें
              </p>
            </div>

            <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: '8px', padding: '4px', marginBottom: '18px' }}>
              <button
                type="button"
                onClick={() => setAuthMode('login')}
                style={{ flex: 1, padding: '7px', border: 'none', borderRadius: '6px', background: authMode === 'login' ? '#fff' : 'transparent', fontWeight: 700, fontSize: '12px', color: authMode === 'login' ? primary : '#64748b', cursor: 'pointer' }}
              >
                लॉगिन
              </button>
              <button
                type="button"
                onClick={() => setAuthMode('signup')}
                style={{ flex: 1, padding: '7px', border: 'none', borderRadius: '6px', background: authMode === 'signup' ? '#fff' : 'transparent', fontWeight: 700, fontSize: '12px', color: authMode === 'signup' ? primary : '#64748b', cursor: 'pointer' }}
              >
                नया खाता (साइनअप)
              </button>
            </div>

            {authError && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '8px 12px', borderRadius: '6px', fontSize: '12px', marginBottom: '14px', textAlign: 'center' }}>
                {authError}
              </div>
            )}

            <form onSubmit={handleAuthSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {authMode === 'signup' && (
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    आपका नाम
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="पूरा नाम दर्ज करें"
                    value={authName}
                    onChange={(e) => setAuthName(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
              )}

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                  ईमेल पता
                </label>
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              {authMode === 'signup' && (
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    मोबाइल नंबर (ऐच्छिक)
                  </label>
                  <input
                    type="tel"
                    placeholder="10 अंकों का नंबर"
                    value={authPhone}
                    onChange={(e) => setAuthPhone(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
              )}

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                  पासवर्ड
                </label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <button
                type="submit"
                style={{ width: '100%', padding: '12px', background: primary, color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 800, cursor: 'pointer', marginTop: '6px' }}
              >
                {authMode === 'login' ? 'लॉगिन करें और आगे बढ़ें →' : 'खाता बनाएं और आगे बढ़ें →'}
              </button>
            </form>
          </div>
        )}

        {/* STEP 1: STATE SELECTION */}
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
                      <div style={{ position: 'relative', width: '70px', height: '70px', borderRadius: '50%', overflow: 'hidden', border: isSelected ? `3px solid ${primary}` : '2px solid transparent' }}>
                        <img src={st.image} alt={st.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        {isSelected ? (
                          <div style={{ position: 'absolute', top: 2, right: 2, background: primary, color: '#fff', borderRadius: '50%', width: '18px', height: '18px', fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900 }}>
                            ✓
                          </div>
                        ) : (
                          <div style={{ position: 'absolute', top: 2, right: 2, background: 'rgba(255,255,255,0.85)', color: '#64748b', borderRadius: '50%', width: '16px', height: '16px', fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                            +
                          </div>
                        )}
                      </div>
                      <span style={{ fontSize: '12.5px', fontWeight: isSelected ? 800 : 500, color: isSelected ? primary : '#334155' }}>
                        {st.name}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{ padding: '14px 20px', borderTop: '1px solid #f1f5f9' }}>
              <button
                onClick={() => setStep('city')}
                style={{ width: '100%', padding: '12px', background: primary, color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 800, cursor: 'pointer' }}
              >
                आगे बढ़ें
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: CITY SELECTION */}
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
                      border: isSelected ? `1.5px solid ${primary}` : '1px solid #e2e8f0',
                      color: isSelected ? primary : '#334155',
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
                onClick={() => (hasSubscription ? setStep('editions') : setStep('plan'))}
                style={{ flex: 1, padding: '12px', background: primary, color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 800, cursor: 'pointer' }}
              >
                आगे बढ़ें ({selectedCities.length} शहर चुने गए)
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: MEMBERSHIP PLAN / RAZORPAY PAYWALL */}
        {step === 'plan' && (
          <div style={{ width: '100%', maxWidth: '580px', background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 12px 40px rgba(0,0,0,0.08)', padding: '24px', position: 'relative' }}>
            <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '18px', display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '14px', alignItems: 'center', border: '1px solid #edf2f7' }}>
              <div>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: primary, color: '#fff', fontSize: '10.5px', fontWeight: 800, padding: '2px 8px', borderRadius: '4px', textTransform: 'uppercase', marginBottom: '8px' }}>
                  👑 {siteName} प्रीमियम ई-पेपर
                </span>
                <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '12.5px', color: '#334155', display: 'flex', flexDirection: 'column', gap: '6px', lineHeight: 1.4 }}>
                  <li>सभी राज्यों व प्रमुख शहरों के <b>ई-पेपर कहीं भी कभी भी पढ़ें</b></li>
                  <li>उच्च गुणवत्ता (HD) डिजिटल पृष्ठ</li>
                  <li>बिना किसी विज्ञापन रुकावट के वाचन</li>
                  <li>आर्काइव और पुराने संस्करणों तक असीमित पहुंच</li>
                </ul>
              </div>

              <div style={{ height: '140px', background: '#fff', borderRadius: '8px', border: '1px solid #cbd5e1', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <img src="https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=300" alt="Newspaper Pages" style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'rotate(-3deg) scale(1.05)' }} />
              </div>
            </div>

            <div style={{ textAlign: 'center', margin: '20px 0 14px 0', fontSize: '13px', fontWeight: 800, color: primary }}>
              🎉 विशेष छूट ऑफर 🎉
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '14px' }}>
              <div
                onClick={() => setSelectedPlan('annual')}
                style={{
                  border: selectedPlan === 'annual' ? `2px solid ${primary}` : '1px solid #cbd5e1',
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
                  <span style={{ position: 'absolute', top: '-8px', right: '-8px', background: primary, color: '#fff', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 900 }}>
                    ✓
                  </span>
                )}
                <div style={{ fontSize: '12px', color: '#64748b' }}>1 साल का एक्सेस</div>
                <div style={{ fontSize: '24px', fontWeight: 900, color: '#0f172a', marginTop: '2px' }}>₹199</div>
              </div>

              <div
                onClick={() => setSelectedPlan('monthly')}
                style={{
                  border: selectedPlan === 'monthly' ? `2px solid ${primary}` : '1px solid #cbd5e1',
                  background: selectedPlan === 'monthly' ? '#fffaf5' : '#ffffff',
                  borderRadius: '10px',
                  padding: '16px',
                  cursor: 'pointer',
                  position: 'relative'
                }}
              >
                {selectedPlan === 'monthly' && (
                  <span style={{ position: 'absolute', top: '-8px', right: '-8px', background: primary, color: '#fff', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 900 }}>
                    ✓
                  </span>
                )}
                <div style={{ fontSize: '12px', color: '#64748b' }}>पहला महीना ट्रायल</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: '2px' }}>
                  <span style={{ fontSize: '24px', fontWeight: 900, color: '#0f172a' }}>₹1</span>
                  <span style={{ fontSize: '14px', color: '#94a3b8', textDecoration: 'line-through' }}>₹25</span>
                </div>
              </div>
            </div>

            <div style={{ marginTop: '20px' }}>
              <button
                onClick={handleRazorpayPay}
                disabled={paying}
                style={{
                  width: '100%',
                  padding: '14px',
                  background: primary,
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '15px',
                  fontWeight: 900,
                  cursor: paying ? 'not-allowed' : 'pointer',
                  boxShadow: `0 4px 15px ${primary}40`
                }}
              >
                {paying ? 'Razorpay खुल रहा है...' : `प्रीमियम सक्रिय करें सिर्फ ₹${selectedPlan === 'annual' ? '199' : '1'} में →`}
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: EDITIONS */}
        {step === 'editions' && (
          <div style={{ width: '100%', maxWidth: '1100px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 900, margin: '0 0 20px 0', color: '#1e293b' }}>
              {siteName} - आज के संस्करण ({selectedCities.join(', ')})
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '20px' }}>
              {selectedCities.map((cityName) => (
                <div key={cityName} style={{ background: '#ffffff', borderRadius: '10px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
                  <div style={{ padding: '10px 14px', fontWeight: 700, fontSize: '14px', color: '#1e293b', borderBottom: '1px solid #f1f5f9' }}>
                    {cityName} संस्करण
                  </div>

                  <div
                    onClick={() => alert(`${cityName} का आज का संपूर्ण ई-पेपर लोड हो रहा है...`)}
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

                  <div style={{ padding: '8px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: '#64748b' }}>
                    <span>08-09-2026</span>
                    <button
                      onClick={() => {
                        if (navigator.share) {
                          navigator.share({ title: `${siteName} ${cityName} ई-पेपर`, url: window.location.href });
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

      {/* 3. DYNAMIC FOOTER */}
      <footer style={{ background: '#ffffff', borderTop: '1px solid #e2e8f0', padding: '16px', textAlign: 'center', fontSize: '12px', color: '#64748b' }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '14px', flexWrap: 'wrap', marginBottom: '8px' }}>
          <Link href={`/?site=${currentSlug}`} style={{ color: 'inherit', textDecoration: 'none' }}>मुख्य पृष्ठ</Link>
          <span>|</span>
          <Link href="/privacy-policy" style={{ color: 'inherit', textDecoration: 'none' }}>गोपनीयता नीति</Link>
          <span>|</span>
          <Link href="/terms-and-conditions" style={{ color: 'inherit', textDecoration: 'none' }}>नियम एवं शर्तें</Link>
          <span>|</span>
          <Link href="/refund-policy" style={{ color: 'inherit', textDecoration: 'none' }}>रिफंड नीति</Link>
        </div>
        <div>Copyright©2026 {siteName} Media Network. All Rights Reserved</div>
      </footer>

    </div>
  );
}

export default function EPaperPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>ई-पेपर लोड हो रहा है...</div>}>
      <EPaperContent />
    </Suspense>
  );
} 