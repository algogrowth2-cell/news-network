'use client';

import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { normalizeSiteId } from '@/lib/portals';
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
import PatrakarIdCardPanel from '@/components/PatrakarIdCardPanel';
import { fallbackFor, getActivePortal, logoFor } from '@/lib/siteTheme';
import { categoryOnPortal, DEFAULT_CATEGORIES, fetchCategories, type CategoryItem } from '@/lib/taxonomy';
import { clearRoleSession, getProfileById, getRoleSession, isReporterApproved } from '@/lib/roleSession';
import { sessionMatchesFirebase } from '@/lib/phoneAuth';
import { confirmPayment } from '@/lib/payments';
import { activeMembershipSites, hasMembership, membershipTillMs } from '@/lib/membership';
import { daysLabel } from '@/lib/pricing';
import { usePricing } from '@/lib/usePricing';
import { uploadNewsPhoto, validateNewsPhoto } from '@/lib/reporterMedia';

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

// Complete list of all 8 network websites (Sirf Hindi naam display ke liye)
const NETWORK_WEBSITES = [
  { name: 'द लोकल लीडर', slug: 'the-local-leader' },
  { name: 'बाज़ार कारोबार', slug: 'bazar-karobar' },
  { name: 'गोल्डन पर्ल क्रॉनिकल्स', slug: 'golden-pearl-chronicles' },
  { name: 'द प्रोव्यू टाइम्स', slug: 'the-provue-times' },
  { name: 'देश की आवाज़', slug: 'desh-ki-aawaz' },
  { name: 'जन भारत न्यूज़', slug: 'jan-bharat-news' },
  { name: 'NEWS INFO 24', slug: 'news-info-24' },
  { name: 'National Defence Network', slug: 'ndn-defence' }
];

export default function PatrakarDashboard() {
  const [reporter, setReporter] = useState<any>(null);
  // Keemat + muddat admin ki tay ki hui (Admin → प्लान व कीमतें)
  const pricing = usePricing();
  const MEMBER_PRICE = pricing.membership.price;
  const MEMBER_PERIOD = daysLabel(pricing.membership.days);
  const DELIVERY_PRICE = pricing.delivery.price;
  // Sadasyata form: shartein maani (portal = jis portal se aaye)
  const [termsOk, setTermsOk] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'create-article' | 'id-card' | 'membership' | 'delivery'>('create-article');
  const [articles, setArticles] = useState<ReporterArticle[]>([]);
  const [loading, setLoading] = useState(true);

  // Dynamic Site Theme
  const [themeColor, setThemeColor] = useState<string>('#ea580c');
  const [siteName, setSiteName] = useState<string>('द लोकल लीडर');
  const [siteLogo, setSiteLogo] = useState<string>('/logos/the-local-leader.jpeg');

  // Article Form State
  const [artTitle, setArtTitle] = useState('');
  const [artCategory, setArtCategory] = useState('राजनीति');
  // Admin → Categories se (chune portal ki active categories)
  const [catList, setCatList] = useState<CategoryItem[]>(() => DEFAULT_CATEGORIES.map((c) => ({ ...c, id: c.slug })));
  useEffect(() => {
    fetchCategories().then(setCatList);
  }, []);
  const [artSiteId, setArtSiteId] = useState('the-local-leader');
  const [artSummary, setArtSummary] = useState('');
  const [artContent, setArtContent] = useState('');
  const [artImage, setArtImage] = useState('');
  // Khabar ke aur zaroori field + device se photo
  const [artImageCaption, setArtImageCaption] = useState('');
  const [artCity, setArtCity] = useState('');
  const [artState, setArtState] = useState('');
  const [artTags, setArtTags] = useState('');
  const [artVideoUrl, setArtVideoUrl] = useState('');
  const [artPhotoPct, setArtPhotoPct] = useState<number | null>(null);
  const [artPhotoNote, setArtPhotoNote] = useState('');
  const [submittingArticle, setSubmittingArticle] = useState(false);

  // Delivery Form State
  const [delName, setDelName] = useState('');
  const [delPhone, setDelPhone] = useState('');
  const [delAddress, setDelAddress] = useState('');
  const [delPincode, setDelPincode] = useState('');
  const [payingDelivery, setPayingDelivery] = useState(false);

  // Razorpay Test Key Config
  const RAZORPAY_KEY = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_TZSA6UoKATong0';

  // 1. Jis portal se patrakar portal khula, usi ka rang/naam/logo (?site= → domain → pichhla portal)
  const [portalSlug, setPortalSlug] = useState('');
  useEffect(() => {
    const slug = getActivePortal(new URLSearchParams(window.location.search).get('site'));
    const fb = fallbackFor(slug);
    setPortalSlug(slug);
    setThemeColor(fb.primaryColor);
    setSiteName(fb.name);
    setSiteLogo(fb.logoUrl);
    setArtSiteId(slug); // nayi khabar ka default portal bhi yahi
    const unsubSite = onSnapshot(doc(db, 'sites', slug), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data.primaryColor) setThemeColor(data.primaryColor);
        if (data.name) setSiteName(data.name);
        if (data.logoUrl) setSiteLogo(logoFor(slug, data.logoUrl));
      }
    });
    return () => unsubSite();
  }, []);

  // 2. Session guard: sirf OTP-verified + admin-approved reporter; profile hamesha Firestore se
  useEffect(() => {
    const session = getRoleSession('patrakar');
    if (!session) {
      window.location.replace('/patrakar/login');
      return;
    }
    // Firebase pehchaan bhi isi number ki ho (warna rules me kuch nahi chalega) — nahi toh dobara login
    sessionMatchesFirebase(session.phone)
      .then((ok) => {
        if (!ok) throw new Error('relogin');
        return getProfileById('patrakar', session.id);
      })
      .then((profile) => {
        // Session ka phone profile se match na kare toh session nakli/purana hai
        if (!profile || (profile.data.phone !== session.phone && profile.data.mobile !== session.phone)) {
          clearRoleSession('patrakar');
          window.location.replace('/patrakar/login');
          return;
        }
        if (!isReporterApproved(profile.data)) {
          clearRoleSession('patrakar');
          window.location.replace('/patrakar/login?status=pending');
          return;
        }
        const d = profile.data;
        // Press ID ab ID card tab me portal ke hisaab se server se banti hai (TLL-2026-001…)
        const pressId = d.pressId || d.idNumber || '';
        setReporter({
          id: profile.id,
          name: d.name || 'संवाददाता',
          phone: session.phone,
          email: d.email || '',
          city: d.city || '',
          membershipActive: d.membershipActive === true,
          // Har portal ki alag sadasyata (lib/membership)
          memberships: d.memberships || {},
          membershipUpdatedAt: d.membershipUpdatedAt || null,
          siteId: d.siteId || d.portal || '',
          idNumber: pressId,
          designation: d.designation || 'अधिकृत संवाददाता (Reporter)',
          validTill: d.validTill || '',
          photo: d.photoUrl || ''
        });
      })
      .catch((err) => {
        console.error('Reporter profile load error:', err);
        clearRoleSession('patrakar');
        window.location.replace('/patrakar/login');
      });
  }, []);

  // 3. Fetch real-time articles submitted by this reporter
  useEffect(() => {
    if (!reporter?.phone && !reporter?.email) return;

    setLoading(true);
    const identifier = reporter.phone || reporter.email;
    const q = query(
      collection(db, 'articles'),
      where('authorIdentifier', '==', identifier)
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

  // Load Razorpay Script
  useEffect(() => {
    if (!document.getElementById('razorpay-checkout-js')) {
      const script = document.createElement('script');
      script.id = 'razorpay-checkout-js';
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  // Sadasyata: is portal par chalu? + kin portals par chalu
  const memberHere = !!reporter && !!portalSlug && hasMembership(reporter, portalSlug);
  const activeSites = reporter ? activeMembershipSites(reporter) : [];
  // Khabar ka portal hamesha sadasyata wala ho (pehle is portal ka, warna pehla chalu)
  const activeKey = activeSites.join(',');
  useEffect(() => {
    if (!activeSites.length || activeSites.includes(artSiteId)) return;
    setArtSiteId(portalSlug && activeSites.includes(portalSlug) ? portalSlug : activeSites[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeKey, portalSlug]);

  // Device se khabar ki photo
  const handleNewsPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !reporter) return;
    const bad = validateNewsPhoto(file);
    if (bad) return alert(bad);
    setArtPhotoPct(0);
    setArtPhotoNote('');
    try {
      const { url, inline } = await uploadNewsPhoto(file, reporter.phone || 'unknown', setArtPhotoPct);
      setArtImage(url);
      if (inline) setArtPhotoNote('फ़ोटो छोटी करके खबर के साथ जोड़ दी गई है।');
    } catch {
      alert('यह फ़ोटो पढ़ी नहीं जा सकी, कृपया दूसरी फ़ोटो चुनें।');
    }
    setArtPhotoPct(null);
  };

  const handleLogout = () => {
    clearRoleSession('patrakar');
    window.location.replace('/patrakar/login');
  };

  // 4. Patrakar seva sadasyata (₹999 / saal) — chune gaye portal ke liye
  const handleBuyMembership = () => {
    const site = portalSlug || 'the-local-leader'; // jis portal se aaye / jiska URL khola — sirf usi ki
    if (!termsOk) {
      alert('कृपया पहले सदस्यता की शर्तें पढ़कर स्वीकार करें।');
      return;
    }
    if (!window.Razorpay) {
      alert('Razorpay gateway load ho raha hai, kripya 2 second rukiye...');
      return;
    }
    const siteLabel = NETWORK_WEBSITES.find((w) => w.slug === site)?.name || site;

    const options = {
      key: RAZORPAY_KEY,
      amount: MEMBER_PRICE * 100,
      currency: 'INR',
      name: siteName,
      description: `पत्रकार सेवा सदस्यता (${MEMBER_PERIOD}) — ${siteLabel}`,
      handler: async function (response: any) {
        // Server Razorpay se jaanch kar isi portal ki sadasyata 1 saal chalu karta hai
        const confirmed = await confirmPayment('membership', response.razorpay_payment_id, { siteId: site, termsAccepted: true });
        if (!confirmed.ok && !confirmed.fallback) {
          alert(`⚠️ ${confirmed.message}\nभुगतान ID: ${response.razorpay_payment_id || '—'}`);
          return;
        }
        const till = confirmed.ok && confirmed.data?.validTill ? new Date(confirmed.data.validTill) : new Date(Date.now() + pricing.membership.days * 864e5);
        setReporter((r: any) => ({ ...r, memberships: { ...(r?.memberships || {}), [site]: { expiresAt: till.toISOString() } } }));
        alert(`सदस्यता भुगतान सफल! अब आप "${siteLabel}" पर खबरें भेज सकते हैं (${till.toLocaleDateString('hi-IN')} तक)।`);
        setArtSiteId(site);
        if (!confirmed.ok) {
          // Server abhi tayyar nahi — purana tareeka (isi portal ki sadasyata)
          await updateDoc(doc(db, 'reporters', reporter.id), { [`memberships.${site}`]: { expiresAt: till, paymentId: response.razorpay_payment_id || '' }, membershipUpdatedAt: serverTimestamp() }).catch((err) =>
            console.error('Membership update error:', err)
          );
          await addDoc(collection(db, 'membership_transactions'), {
            reporterPhone: reporter.phone,
            reporterName: reporter.name,
            siteId: site,
            paymentId: response.razorpay_payment_id || 'test_pay_' + Date.now(),
            amount: MEMBER_PRICE,
            termsAccepted: true,
            status: 'success',
            createdAt: serverTimestamp()
          }).catch(() => {});
        }
        setTermsOk(false);
        setActiveTab('create-article');
      },
      prefill: {
        name: reporter?.name,
        contact: reporter?.phone,
        email: reporter?.email
      },
      theme: {
        color: themeColor
      }
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
  };

  // 5. ID Card & Certificate Home Delivery (₹299)
  const handleDeliveryPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!delAddress || !delPincode || !delPhone) {
      alert('कृपया पूरा पता, पिनकोड और फ़ोन नंबर दर्ज करें।');
      return;
    }

    if (!window.Razorpay) {
      alert('Razorpay gateway load ho raha hai...');
      return;
    }

    setPayingDelivery(true);
    const options = {
      key: RAZORPAY_KEY,
      amount: DELIVERY_PRICE * 100,
      currency: 'INR',
      name: siteName,
      description: 'प्रेस आईडी कार्ड एवं प्रमाणपत्र होम डिलीवरी शुल्क',
      handler: async function (response: any) {
        setPayingDelivery(false);
        const confirmed = await confirmPayment('delivery', response.razorpay_payment_id, {
          delivery: { name: delName || reporter.name, phone: delPhone, address: delAddress, pincode: delPincode }
        });
        if (!confirmed.ok && !confirmed.fallback) {
          alert(`⚠️ ${confirmed.message}\nभुगतान ID: ${response.razorpay_payment_id || '—'}`);
          return;
        }
        alert(`डिलीवरी शुल्क ₹${DELIVERY_PRICE} का भुगतान सफल! आपकी किट 5-7 कार्यदिवसों में भेज दी जाएगी।`);
        if (confirmed.ok) {
          setActiveTab('overview');
          return;
        }
        // Server abhi tayyar nahi — purana tareeka

        await addDoc(collection(db, 'delivery_requests'), {
          reporterName: delName || reporter.name,
          reporterPhone: delPhone,
          address: delAddress,
          pincode: delPincode,
          idNumber: reporter.idNumber || 'LL-PRESS-7821',
          amountPaid: DELIVERY_PRICE,
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
        color: themeColor
      }
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
    setPayingDelivery(false);
  };

  // 6. Submit Article to Admin for Approval
  const handleSubmitArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    // Khabar sirf us portal par jiski seva sadasyata chalu hai
    if (!hasMembership(reporter, artSiteId)) {
      alert('इस पोर्टल पर खबर भेजने के लिए उसकी पत्रकार सेवा सदस्यता आवश्यक है।');
      setActiveTab('membership');
      return;
    }
    if (artTitle.trim().length < 10) return alert('कृपया खबर का पूरा शीर्षक लिखें (कम से कम 10 अक्षर)।');
    if (artContent.trim().length < 80) return alert('कृपया पूरी खबर विस्तार से लिखें (कम से कम 80 अक्षर)।');
    if (!artImage.trim()) return alert('कृपया खबर की फ़ोटो जोड़ें (डिवाइस से अपलोड करें या लिंक डालें)।');
    if (artPhotoPct !== null) return alert('फ़ोटो अपलोड हो रही है, कृपया पूरा होने दें।');
    if (artVideoUrl.trim() && !/^https?:\/\//i.test(artVideoUrl.trim())) return alert('वीडियो लिंक सही नहीं है।');

    try {
      setSubmittingArticle(true);
      const tags = Array.from(new Set(artTags.split(/[,#\n]/).map((t) => t.trim()).filter(Boolean))).slice(0, 10);
      const location = [artCity.trim(), artState.trim()].filter(Boolean).join(', ');

      await addDoc(collection(db, 'articles'), {
        title: artTitle.trim(),
        titleHi: artTitle.trim(),
        category: artCategory,
        siteId: artSiteId,
        siteIds: [artSiteId],
        summary: artSummary.trim(),
        content: artContent.trim(),
        contentText: artContent.trim().slice(0, 5000),
        image: artImage.trim(),
        imageCaption: artImageCaption.trim(),
        videoUrl: artVideoUrl.trim(),
        tags,
        city: artCity.trim(),
        state: artState.trim(),
        location,
        authorName: reporter.name,
        authorIdentifier: reporter.phone || reporter.email,
        authorPressId: reporter.idNumber || '',
        source: 'reporter',
        status: 'pending', // Admin → Articles me "स्वीकृत करें" ke baad hi live
        views: 0,
        createdAt: serverTimestamp()
      });

      alert('खबर सबमिट हो चुकी है! एडमिन द्वारा सत्यापन के बाद यह वेबसाइट पर लाइव दिखेगी।');
      setArtTitle('');
      setArtSummary('');
      setArtContent('');
      setArtImage('');
      setArtImageCaption('');
      setArtTags('');
      setArtVideoUrl('');
      setArtPhotoNote('');
      setSubmittingArticle(false);
      setActiveTab('overview');
    } catch (err: any) {
      setSubmittingArticle(false);
      alert('खबर भेजने में त्रुटि: ' + err.message);
    }
  };

  const totalArticles = articles.length;
  const approvedArticles = articles.filter(a => a.status === 'published' || a.status === 'approved').length;
  const pendingArticles = articles.filter(a => a.status === 'pending').length;

  // Session + approval verify hone tak dashboard nahi dikhana
  if (!reporter) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f1f5f9', color: '#64748b', fontSize: '14px' }}>
        सत्र की जांच की जा रही है...
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f1f5f9', color: '#1e293b', fontFamily: '"Mukta", system-ui, -apple-system, sans-serif' }}>
      
      {/* Top Header */}
      <header style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #e2e8f0', padding: '14px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {siteLogo && (
            <Link href="/" aria-label="मुख्य वेबसाइट" style={{ display: 'inline-flex' }}>
              <img src={siteLogo} alt={siteName} style={{ height: '54px', width: 'auto', maxWidth: '140px', borderRadius: '6px', objectFit: 'contain' }} />
            </Link>
          )}
          <div>
            <b style={{ fontSize: '18px', color: '#0f172a' }}>पत्रकार संवाददाता पोर्टल</b>
            <div style={{ fontSize: '12px', color: '#64748b' }}>
              संवाददाता: <b style={{ color: themeColor }}>{reporter?.name}</b> · {reporter?.phone} · आईडी: <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{reporter?.idNumber}</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <Link href="/" style={{ fontSize: '13.5px', color: themeColor, textDecoration: 'none', fontWeight: 600 }}>
            ← मुख्य वेबसाइट देखें
          </Link>
          <button 
            onClick={handleLogout}
            style={{ backgroundColor: '#fee2e2', border: '1px solid #fecaca', color: '#dc2626', padding: '6px 14px', borderRadius: '6px', fontSize: '12.5px', fontWeight: 600, cursor: 'pointer' }}
          >
            लॉगआउट
          </button>
        </div>
      </header>

      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '24px' }}>
        
        {/* Metric Cards Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          
          <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '18px', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
            <span style={{ fontSize: '12.5px', color: '#64748b', fontWeight: 600 }}>कुल सबमिट की गई खबरें</span>
            <div style={{ fontSize: '30px', fontWeight: 800, color: '#0f172a', marginTop: '4px' }}>{totalArticles}</div>
            <span style={{ fontSize: '11px', color: '#94a3b8' }}>आपके द्वारा भेजी गई कुल खबरें</span>
          </div>

          <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '18px', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
            <span style={{ fontSize: '12.5px', color: '#64748b', fontWeight: 600 }}>लाइव / स्वीकृत (Published)</span>
            <div style={{ fontSize: '30px', fontWeight: 800, color: '#16a34a', marginTop: '4px' }}>{approvedArticles}</div>
            <span style={{ fontSize: '11px', color: '#94a3b8' }}>संपादक द्वारा सत्यापित एवं लाइव</span>
          </div>

          <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '18px', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
            <span style={{ fontSize: '12.5px', color: '#64748b', fontWeight: 600 }}>समीक्षा हेतु लंबित (Pending)</span>
            <div style={{ fontSize: '30px', fontWeight: 800, color: '#d97706', marginTop: '4px' }}>{pendingArticles}</div>
            <span style={{ fontSize: '11px', color: '#94a3b8' }}>एडमिन सत्यापन की प्रतीक्षा में</span>
          </div>

          <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '18px', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
            <span style={{ fontSize: '12.5px', color: '#64748b', fontWeight: 600 }}>सदस्यता स्थिति (Plan)</span>
            <div style={{ fontSize: '19px', fontWeight: 800, color: memberHere ? '#16a34a' : '#dc2626', marginTop: '8px' }}>
              {memberHere ? '✓ सक्रिय (Active)' : 'अक्रिय (Inactive)'}
            </div>
            <span style={{ fontSize: '11px', color: '#94a3b8' }}>
              {memberHere
                ? `इस पोर्टल पर ${new Date(membershipTillMs(reporter, portalSlug)).toLocaleDateString('hi-IN')} तक`
                : activeSites.length
                  ? `सक्रिय: ${activeSites.map((x) => NETWORK_WEBSITES.find((w) => w.slug === x)?.name || x).join(', ')}`
                  : 'खबर भेजने हेतु इस पोर्टल की सदस्यता आवश्यक'}
            </span>
          </div>

        </div>

        {/* Tab Navigation */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
          <button
            onClick={() => setActiveTab('overview')}
            style={{
              backgroundColor: activeTab === 'overview' ? themeColor : '#ffffff',
              color: activeTab === 'overview' ? '#ffffff' : '#475569',
              border: `1.5px solid ${activeTab === 'overview' ? themeColor : '#cbd5e1'}`,
              borderRadius: '8px',
              padding: '9px 18px',
              fontSize: '13.5px',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: activeTab === 'overview' ? '0 2px 8px rgba(0,0,0,0.1)' : 'none'
            }}
          >
            मेरी खबरें ({articles.length})
          </button>

          <button
            onClick={() => {
              if (!activeSites.length) {
                alert('खबर भेजने के लिए उस पोर्टल की पत्रकार सेवा सदस्यता आवश्यक है।');
                setActiveTab('membership');
              } else {
                if (!activeSites.includes(artSiteId)) setArtSiteId(memberHere ? portalSlug : activeSites[0]);
                setActiveTab('create-article');
              }
            }}
            style={{
              backgroundColor: activeTab === 'create-article' ? themeColor : '#ffffff',
              color: activeTab === 'create-article' ? '#ffffff' : '#475569',
              border: `1.5px solid ${activeTab === 'create-article' ? themeColor : '#cbd5e1'}`,
              borderRadius: '8px',
              padding: '9px 18px',
              fontSize: '13.5px',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: activeTab === 'create-article' ? '0 2px 8px rgba(0,0,0,0.1)' : 'none'
            }}
          >
            + नई खबर भेजें
          </button>

          <button
            onClick={() => setActiveTab('id-card')}
            style={{
              backgroundColor: activeTab === 'id-card' ? themeColor : '#ffffff',
              color: activeTab === 'id-card' ? '#ffffff' : '#475569',
              border: `1.5px solid ${activeTab === 'id-card' ? themeColor : '#cbd5e1'}`,
              borderRadius: '8px',
              padding: '9px 18px',
              fontSize: '13.5px',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: activeTab === 'id-card' ? '0 2px 8px rgba(0,0,0,0.1)' : 'none'
            }}
          >
            🪪 प्रेस आईडी कार्ड & प्रमाणपत्र
          </button>

          <button
            onClick={() => setActiveTab('delivery')}
            style={{
              backgroundColor: activeTab === 'delivery' ? themeColor : '#ffffff',
              color: activeTab === 'delivery' ? '#ffffff' : '#475569',
              border: `1.5px solid ${activeTab === 'delivery' ? themeColor : '#cbd5e1'}`,
              borderRadius: '8px',
              padding: '9px 18px',
              fontSize: '13.5px',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: activeTab === 'delivery' ? '0 2px 8px rgba(0,0,0,0.1)' : 'none'
            }}
          >
            📦 होम डिलीवरी किट (₹{DELIVERY_PRICE})
          </button>

          {reporter && (
            <button
              onClick={() => setActiveTab('membership')}
              style={{
                backgroundColor: activeTab === 'membership' ? '#16a34a' : '#ecfdf5',
                color: activeTab === 'membership' ? '#ffffff' : '#15803d',
                border: '1.5px solid #16a34a',
                borderRadius: '8px',
                padding: '9px 18px',
                fontSize: '13.5px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              ★ {memberHere ? 'सदस्यता बढ़ाएँ' : 'सदस्यता लें'}
            </button>
          )}
        </div>

        {/* TAB 1: MY ARTICLES */}
        {activeTab === 'overview' && (
          <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.04)' }}>
            {loading ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>डेटा लोड हो रहा है...</div>
            ) : articles.length === 0 ? (
              <div style={{ padding: '60px 20px', textAlign: 'center', color: '#64748b' }}>
                <p style={{ fontSize: '17px', color: '#0f172a', fontWeight: 600, marginBottom: '6px' }}>आपने अभी तक कोई खबर सबमिट नहीं की है</p>
                <p style={{ fontSize: '13.5px', margin: 0, color: '#64748b' }}>खबर भेजने के लिए ऊपर "+ नई खबर भेजें" बटन पर क्लिक करें।</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13.5px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                      <th style={{ padding: '14px 18px' }}>शीर्षक (Title)</th>
                      <th style={{ padding: '14px 18px' }}>श्रेणी</th>
                      <th style={{ padding: '14px 18px' }}>पोर्टल</th>
                      <th style={{ padding: '14px 18px' }}>सत्यापन स्थिति (Status)</th>
                      <th style={{ padding: '14px 18px' }}>रीडर व्यूज़</th>
                    </tr>
                  </thead>
                  <tbody>
                    {articles.map((art, idx) => (
                      <tr key={art.id} style={{ borderBottom: idx === articles.length - 1 ? 'none' : '1px solid #f1f5f9' }}>
                        <td style={{ padding: '14px 18px', color: '#0f172a', fontWeight: 600 }}>
                          {art.title}
                        </td>
                        <td style={{ padding: '14px 18px', color: '#475569' }}>
                          {art.category}
                        </td>
                        <td style={{ padding: '14px 18px', color: themeColor, fontWeight: 600 }}>
                          {NETWORK_WEBSITES.find(w => w.slug === normalizeSiteId(art.siteId))?.name || art.siteId}
                        </td>
                        <td style={{ padding: '14px 18px' }}>
                          <span
                            style={{
                              display: 'inline-block',
                              padding: '3px 12px',
                              borderRadius: '20px',
                              fontSize: '11.5px',
                              fontWeight: 600,
                              backgroundColor: art.status === 'published' || art.status === 'approved' ? '#dcfce7' : '#fef3c7',
                              color: art.status === 'published' || art.status === 'approved' ? '#15803d' : '#b45309',
                              border: `1px solid ${art.status === 'published' || art.status === 'approved' ? '#bbf7d0' : '#fde68a'}`
                            }}
                          >
                            {art.status === 'published' || art.status === 'approved' ? '✓ लाइव (Approved)' : '⏳ समीक्षाधीन (Pending)'}
                          </span>
                        </td>
                        <td style={{ padding: '14px 18px', color: '#0284c7', fontWeight: 600 }}>
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

        {/* TAB 2: CREATE & SUBMIT ARTICLE (Sirf Hindi Names Dropdown me) */}
        {activeTab === 'create-article' && !activeSites.length && (
          <div style={{ backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: '12px', padding: '32px', maxWidth: '640px', margin: '0 auto', textAlign: 'center', color: '#78350f' }}>
            <div style={{ fontSize: '30px' }}>🔒</div>
            <h3 style={{ fontSize: '19px', margin: '8px 0 6px', color: '#0f172a' }}>खबर भेजने के लिए सदस्यता आवश्यक है</h3>
            <p style={{ fontSize: '13.5px', margin: '0 0 16px' }}>इस पोर्टल पर खबर भेजने के लिए पत्रकार सेवा सदस्यता (₹{MEMBER_PRICE} / {MEMBER_PERIOD}) लें। सदस्यता के बिना खबर सबमिट नहीं होगी।</p>
            <button type="button" onClick={() => setActiveTab('membership')} style={{ backgroundColor: themeColor, color: '#fff', border: 'none', padding: '11px 22px', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}>
              सदस्यता लें
            </button>
          </div>
        )}
        {activeTab === 'create-article' && activeSites.length > 0 && (
          <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '32px', maxWidth: '820px', margin: '0 auto', boxShadow: '0 4px 14px rgba(0,0,0,0.04)' }}>
            <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#0f172a', margin: '0 0 6px 0' }}>नई खबर सबमिट करें (सत्यापन हेतु)</h2>
            <p style={{ fontSize: '13.5px', color: '#64748b', margin: '0 0 24px 0' }}>
              आपके द्वारा भेजी गई खबर संपादक की समीक्षा के बाद पोर्टल पर आपके नाम से लाइव प्रकाशित होगी।
            </p>

            <form onSubmit={handleSubmitArticle} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>खबर का मुख्य शीर्षक (Headline) *</label>
                <input
                  type="text"
                  required
                  placeholder="उदा. भरूच में विकास योजनाओं का शुभारंभ, जनता में भारी उत्साह..."
                  value={artTitle}
                  onChange={(e) => setArtTitle(e.target.value)}
                  style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#f8fafc', border: '1.5px solid #cbd5e1', borderRadius: '8px', padding: '11px 14px', color: '#0f172a', fontSize: '14px', outline: 'none' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>पोर्टल चयन (किस वेबसाइट पर लगाना है) *</label>
                  <select
                    value={artSiteId}
                    onChange={(e) => setArtSiteId(e.target.value)}
                    style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#f8fafc', border: '1.5px solid #cbd5e1', borderRadius: '8px', padding: '11px 14px', color: '#0f172a', fontSize: '13.5px', outline: 'none', cursor: 'pointer' }}
                  >
                    {/* Sirf un portals par jinki sadasyata chalu hai */}
                    {NETWORK_WEBSITES.filter((w) => activeSites.includes(w.slug)).map(w => (
                      <option key={w.slug} value={w.slug}>
                        {w.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>श्रेणी (Category)</label>
                  <select
                    value={artCategory}
                    onChange={(e) => setArtCategory(e.target.value)}
                    style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#f8fafc', border: '1.5px solid #cbd5e1', borderRadius: '8px', padding: '11px 14px', color: '#0f172a', fontSize: '13.5px', outline: 'none', cursor: 'pointer' }}
                  >
                    {catList
                      .filter((c) => categoryOnPortal(c, artSiteId))
                      .map((c) => (
                        <option key={c.id} value={c.nameHi}>
                          {c.nameHi} ({c.name})
                        </option>
                      ))}
                    {!catList.some((c) => c.nameHi === artCategory) && <option value={artCategory}>{artCategory}</option>}
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>संक्षिप्त विवरण (Summary)</label>
                <textarea
                  rows={2}
                  placeholder="खबर का 1-2 लाइन का मुख्य सार लिखें..."
                  value={artSummary}
                  onChange={(e) => setArtSummary(e.target.value)}
                  style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#f8fafc', border: '1.5px solid #cbd5e1', borderRadius: '8px', padding: '11px 14px', color: '#0f172a', fontSize: '13.5px', outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>पूरी खबर का विवरण (Full Content) *</label>
                <textarea
                  rows={6}
                  required
                  placeholder="विस्तार से पूरी खबर लिखें..."
                  value={artContent}
                  onChange={(e) => setArtContent(e.target.value)}
                  style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#f8fafc', border: '1.5px solid #cbd5e1', borderRadius: '8px', padding: '11px 14px', color: '#0f172a', fontSize: '14px', lineHeight: 1.6, outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>खबर की फ़ोटो *</label>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', backgroundColor: themeColor, color: '#fff', padding: '10px 16px', borderRadius: '8px', fontWeight: 700, fontSize: '13.5px', cursor: artPhotoPct !== null ? 'wait' : 'pointer' }}>
                    📷 {artPhotoPct !== null ? `अपलोड हो रहा है… ${artPhotoPct}%` : 'डिवाइस से फ़ोटो चुनें'}
                    <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleNewsPhoto} disabled={artPhotoPct !== null} style={{ display: 'none' }} />
                  </label>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>JPG / PNG / WebP · 15 MB तक · या नीचे लिंक डालें</span>
                </div>
                <input
                  type="url"
                  placeholder="या फ़ोटो का लिंक: https://example.com/news-photo.jpg"
                  value={artImage.startsWith('data:') ? '' : artImage}
                  onChange={(e) => setArtImage(e.target.value)}
                  style={{ ...{ width: '100%', boxSizing: 'border-box', backgroundColor: '#f8fafc', border: '1.5px solid #cbd5e1', borderRadius: '8px', padding: '11px 14px', color: '#0f172a', fontSize: '13.5px', outline: 'none' }, marginTop: '10px' }}
                />
                {artImage && (
                  <div style={{ marginTop: '10px', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                    <img src={artImage} alt="खबर की फ़ोटो" style={{ width: '160px', height: '100px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                    <div style={{ fontSize: '12px', color: '#64748b' }}>
                      {artPhotoNote || 'फ़ोटो जुड़ गई।'}
                      <button type="button" onClick={() => setArtImage('')} style={{ display: 'block', marginTop: '6px', background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', padding: 0, fontSize: '12px' }}>✕ फ़ोटो हटाएं</button>
                    </div>
                  </div>
                )}
                <input
                  type="text"
                  placeholder="फ़ोटो कैप्शन (वैकल्पिक) — जैसे: कलेक्टर बैठक लेते हुए"
                  value={artImageCaption}
                  maxLength={140}
                  onChange={(e) => setArtImageCaption(e.target.value)}
                  style={{ ...{ width: '100%', boxSizing: 'border-box', backgroundColor: '#f8fafc', border: '1.5px solid #cbd5e1', borderRadius: '8px', padding: '11px 14px', color: '#0f172a', fontSize: '13.5px', outline: 'none' }, marginTop: '10px' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>शहर / ज़िला</label>
                  <input type="text" placeholder="उदा. महू / इंदौर" value={artCity} maxLength={60} onChange={(e) => setArtCity(e.target.value)} style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#f8fafc', border: '1.5px solid #cbd5e1', borderRadius: '8px', padding: '11px 14px', color: '#0f172a', fontSize: '13.5px', outline: 'none' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>राज्य</label>
                  <input type="text" placeholder="उदा. मध्य प्रदेश" value={artState} maxLength={60} onChange={(e) => setArtState(e.target.value)} style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#f8fafc', border: '1.5px solid #cbd5e1', borderRadius: '8px', padding: '11px 14px', color: '#0f172a', fontSize: '13.5px', outline: 'none' }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>टैग (कीवर्ड)</label>
                  <input type="text" placeholder="उदा. किसान, मंडी, बारिश (कॉमा से अलग)" value={artTags} maxLength={200} onChange={(e) => setArtTags(e.target.value)} style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#f8fafc', border: '1.5px solid #cbd5e1', borderRadius: '8px', padding: '11px 14px', color: '#0f172a', fontSize: '13.5px', outline: 'none' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>वीडियो लिंक (वैकल्पिक)</label>
                  <input type="url" placeholder="YouTube / वीडियो लिंक" value={artVideoUrl} onChange={(e) => setArtVideoUrl(e.target.value)} style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#f8fafc', border: '1.5px solid #cbd5e1', borderRadius: '8px', padding: '11px 14px', color: '#0f172a', fontSize: '13.5px', outline: 'none' }} />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setActiveTab('overview')}
                  style={{ backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', color: '#475569', padding: '10px 20px', borderRadius: '8px', fontSize: '13.5px', fontWeight: 600, cursor: 'pointer' }}
                >
                  रद्द करें
                </button>
                <button
                  type="submit"
                  disabled={submittingArticle}
                  style={{ backgroundColor: themeColor, border: 'none', color: '#ffffff', padding: '11px 26px', borderRadius: '8px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
                >
                  {submittingArticle ? 'सबमिट हो रहा है...' : 'सबमिट करें (सत्यापन हेतु)'}
                </button>
              </div>

            </form>
          </div>
        )}

        {/* TAB 3: ID CARD & CERTIFICATE — chune portal ka Media ID Card + Pradhikaran Patra */}
        {activeTab === 'id-card' && reporter?.id && (
          <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
            <div style={{ marginBottom: '18px' }}>
              <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#0f172a', margin: 0 }}>पत्रकार मीडिया आईडी कार्ड & प्राधिकरण पत्र</h2>
              <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0 0' }}>
                पोर्टल चुनें, अपनी फ़ोटो लगाएं और कार्ड व प्रमाणपत्र PNG / PDF में डाउनलोड करें।
              </p>
            </div>

            {portalSlug && <PatrakarIdCardPanel reporterDocId={reporter.id} siteSlug={portalSlug} />}

            {/* Delivery CTA */}
            <div style={{ marginTop: '24px', backgroundColor: '#ffffff', border: `1.5px solid ${themeColor}`, borderRadius: '14px', padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px', boxShadow: '0 4px 12px rgba(0,0,0,0.04)' }}>
              <div>
                <b style={{ color: '#0f172a', fontSize: '16px' }}>क्या आपको ओरिजिनल लैमिनेटेड कार्ड + डोरी + सील प्रमाणपत्र घर पर चाहिए?</b>
                <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>मात्र ₹{DELIVERY_PRICE} डिलीवरी व प्रिंटिंग शुल्क में स्पीड पोस्ट द्वारा आपके पते पर भेज दिया जाएगा।</p>
              </div>
              <button
                onClick={() => setActiveTab('delivery')}
                style={{ backgroundColor: themeColor, color: '#fff', border: 'none', padding: '11px 22px', borderRadius: '8px', fontWeight: 700, fontSize: '13.5px', cursor: 'pointer' }}
              >
                घर मंगवाएं (₹{DELIVERY_PRICE})
              </button>
            </div>

          </div>
        )}

        {/* TAB 4: DELIVERY FORM (₹299) */}
        {activeTab === 'delivery' && (
          <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '32px', maxWidth: '650px', margin: '0 auto', boxShadow: '0 4px 14px rgba(0,0,0,0.04)' }}>
            <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#0f172a', margin: '0 0 6px 0' }}>प्रेस किट होम डिलीवरी ऑर्डर (₹{DELIVERY_PRICE})</h2>
            <p style={{ fontSize: '13.5px', color: '#64748b', margin: '0 0 22px 0' }}>
              किट में शामिल: हार्ड लैमिनेटेड प्रेस कार्ड, ब्रांडेड नेक डोरी (Lanyard), आधिकारिक अधिमान्यता प्रमाणपत्र व वाहन प्रेस स्टिकर।
            </p>

            <form onSubmit={handleDeliveryPayment} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>पत्रकार का पूरा नाम *</label>
                <input
                  type="text"
                  required
                  defaultValue={reporter?.name}
                  onChange={(e) => setDelName(e.target.value)}
                  style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#f8fafc', border: '1.5px solid #cbd5e1', borderRadius: '8px', padding: '11px 14px', color: '#0f172a', fontSize: '13.5px', outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>डिलीवरी संपर्क नंबर (WhatsApp) *</label>
                <input
                  type="tel"
                  required
                  defaultValue={reporter?.phone}
                  onChange={(e) => setDelPhone(e.target.value)}
                  style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#f8fafc', border: '1.5px solid #cbd5e1', borderRadius: '8px', padding: '11px 14px', color: '#0f172a', fontSize: '13.5px', outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>पूरा कूरियर पता (मकान नं, गली, लैंडमार्क, तहसील व ज़िला) *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="उदा. मकान नं 45, पटेल नगर, नज़दीक बस स्टैंड, भरूच, गुजरात"
                  value={delAddress}
                  onChange={(e) => setDelAddress(e.target.value)}
                  style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#f8fafc', border: '1.5px solid #cbd5e1', borderRadius: '8px', padding: '11px 14px', color: '#0f172a', fontSize: '13.5px', outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>पिनकोड (Pincode) *</label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  placeholder="392001"
                  value={delPincode}
                  onChange={(e) => setDelPincode(e.target.value)}
                  style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#f8fafc', border: '1.5px solid #cbd5e1', borderRadius: '8px', padding: '11px 14px', color: '#0f172a', fontSize: '13.5px', outline: 'none' }}
                />
              </div>

              <div style={{ backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', padding: '14px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '14px', color: '#334155', fontWeight: 600 }}>कुल डिलीवरी व प्रिंटिंग शुल्क:</span>
                <b style={{ fontSize: '20px', color: '#16a34a' }}>₹{DELIVERY_PRICE}</b>
              </div>

              <button
                type="submit"
                disabled={payingDelivery}
                style={{ backgroundColor: themeColor, border: 'none', color: '#ffffff', padding: '13px', borderRadius: '8px', fontSize: '15px', fontWeight: 700, cursor: 'pointer', marginTop: '6px' }}
              >
                {payingDelivery ? 'पेमेंट शुरू हो रहा है...' : `₹${DELIVERY_PRICE} का ऑनलाइन भुगतान करें`}
              </button>
            </form>
          </div>
        )}

        {/* TAB 5: MEMBERSHIP PURCHASE (₹499) */}
        {activeTab === 'membership' && (() => {
          const site = portalSlug || 'the-local-leader';
          const siteLabel = NETWORK_WEBSITES.find((w) => w.slug === site)?.name || site;
          const till = membershipTillMs(reporter, site);
          const active = till > Date.now();
          return (
          <div style={{ maxWidth: '640px', margin: '0 auto', backgroundColor: '#ffffff', border: `2px solid ${themeColor}`, borderRadius: '16px', padding: '30px', textAlign: 'center', boxShadow: '0 8px 24px rgba(0,0,0,0.06)' }}>
            <span style={{ backgroundColor: '#fff7ed', color: themeColor, border: `1px solid ${themeColor}`, padding: '4px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: 700 }}>
              पत्रकार सेवा सदस्यता (वार्षिक)
            </span>
            <h2 style={{ fontSize: '23px', fontWeight: 800, color: '#0f172a', margin: '14px 0 6px 0' }}>डिजिटल प्रेस सेवा पैकेज</h2>

            <div style={{ margin: '10px 0 2px', fontSize: '15px', fontWeight: 700, color: '#334155' }}>
              पोर्टल: <span style={{ color: themeColor }}>{siteLabel}</span>
            </div>

            <div style={{ fontSize: '38px', fontWeight: 800, color: themeColor, margin: '12px 0 2px' }}>₹{MEMBER_PRICE} <small style={{ fontSize: '14px', color: '#64748b' }}>/ {MEMBER_PERIOD} · केवल {siteLabel}</small></div>
            {active && (
              <div style={{ fontSize: '13px', color: '#16a34a', fontWeight: 700 }}>✓ इस पोर्टल की सदस्यता {new Date(till).toLocaleDateString('hi-IN')} तक सक्रिय है — दोबारा लेने पर {MEMBER_PERIOD} आगे बढ़ेगी।</div>
            )}

            <div style={{ textAlign: 'left', margin: '18px 0', borderTop: '1px solid #e2e8f0', paddingTop: '16px', fontSize: '14px', color: '#334155', display: 'flex', flexDirection: 'column', gap: '9px' }}>
              <b style={{ color: '#0f172a' }}>इस शुल्क में मिलने वाली सेवाएं:</b>
              <div>✓ {siteLabel} पर समाचार भेजने का ऑनलाइन प्लेटफ़ॉर्म (समाचार संपादकीय जांच के बाद ही प्रकाशित)</div>
              <div>✓ प्रकाशित समाचार पर आपके नाम से बायलाइन (Byline)</div>
              <div>✓ संपादकीय डेस्क से मार्गदर्शन एवं तकनीकी सहायता</div>
            </div>

            <div style={{ textAlign: 'left', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '10px', padding: '14px 16px', fontSize: '12.5px', color: '#78350f', lineHeight: 1.65 }}>
              <b style={{ display: 'block', fontSize: '13.5px', marginBottom: '6px' }}>⚖️ महत्वपूर्ण जानकारी — भुगतान से पहले अवश्य पढ़ें</b>
              <ul style={{ margin: 0, paddingLeft: '18px' }}>
                <li>यह शुल्क ऊपर लिखी <b>डिजिटल सेवाओं</b> (समाचार प्लेटफ़ॉर्म, बायलाइन, संपादकीय सहायता) के लिए है। प्रेस आईडी कार्ड / प्रमाणपत्र इसमें शामिल नहीं हैं। यह कोई <b>नौकरी, नियुक्ति, भर्ती, पंजीकरण या जमानत (security deposit) शुल्क नहीं</b> है।</li>
                <li>सदस्यता से संस्था में <b>रोज़गार, वेतन, मानदेय या किसी पद की गारंटी नहीं</b> मिलती। आप एक स्वतंत्र (फ्रीलांस) समाचार योगदानकर्ता रहते हैं।</li>
                <li>हर समाचार संपादकीय नीति के अनुसार जांच के बाद ही प्रकाशित होता है; <b>प्रकाशन की गारंटी नहीं</b> है।</li>
                <li>पत्रकारिता के नाम पर किसी से दबाव / वसूली या अन्य अनुचित लाभ लेना वर्जित है; नियम उल्लंघन पर सदस्यता बिना रिफ़ंड रद्द की जा सकती है।</li>
                <li>यह सदस्यता केवल {siteLabel} के लिए है। हर पोर्टल की सदस्यता अलग है — किसी अन्य पोर्टल के लिए उसी पोर्टल की वेबसाइट से अलग सदस्यता लेनी होगी।</li>
                <li>
                  विस्तृत नियम: <Link href="/terms" target="_blank" style={{ color: '#b45309', fontWeight: 700 }}>उपयोग की शर्तें</Link> ·{' '}
                  <Link href="/editorial-guidelines" target="_blank" style={{ color: '#b45309', fontWeight: 700 }}>संपादकीय दिशानिर्देश</Link>
                </li>
              </ul>
            </div>

            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', textAlign: 'left', margin: '16px 0', fontSize: '13px', color: '#334155', cursor: 'pointer' }}>
              <input type="checkbox" checked={termsOk} onChange={(e) => setTermsOk(e.target.checked)} style={{ marginTop: '3px', width: '16px', height: '16px' }} />
              <span>मैंने ऊपर की जानकारी और शर्तें पढ़ ली हैं। मैं समझता/समझती हूँ कि यह सेवा शुल्क है, नौकरी / नियुक्ति का शुल्क नहीं।</span>
            </label>

            <button
              onClick={handleBuyMembership}
              disabled={!termsOk}
              style={{ backgroundColor: termsOk ? themeColor : '#cbd5e1', color: '#ffffff', border: 'none', padding: '13px 28px', borderRadius: '8px', fontSize: '15px', fontWeight: 700, cursor: termsOk ? 'pointer' : 'not-allowed', width: '100%' }}
            >
              {active ? `${MEMBER_PERIOD} और बढ़ाएँ — ₹${MEMBER_PRICE}` : `सदस्यता लें — ₹${MEMBER_PRICE} भुगतान करें`}
            </button>
          </div>
          );
        })()}

      </div>
    </div>
  );
}