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
import { clearRoleSession, getProfileById, getRoleSession } from '@/lib/roleSession';
import { sessionMatchesFirebase } from '@/lib/phoneAuth';
import { confirmPayment } from '@/lib/payments';
import { AD_FORMAT_LABEL, adExpiryMs, adNotExpired } from '@/lib/plans';
import { daysLabel } from '@/lib/pricing';
import { usePricing } from '@/lib/usePricing';
import { loadRazorpayScript } from '@/lib/razorpay';
import { AD_IMAGE_SIZE, fitAdImage } from '@/lib/adImage';
import { adUploadErrorMessage, isAnimatedFile, isVideoUrl, MAX_AD_GIF_MB, MAX_AD_VIDEO_MB, MAX_AD_VIDEO_SECONDS, uploadAdMedia, validateAdMedia } from '@/lib/adMedia';
import { AdMedia } from '@/components/SiteAds';
import { logoFor } from '@/lib/siteTheme';
import { directMediaUrl } from '@/lib/mediaUrl';

const RAZORPAY_KEY = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_TZSA6UoKATong0';

interface AdvertiserAd {
  id: string;
  name: string;
  zone: string;
  type: string;
  format: 'banner' | 'sidebar' | 'classified' | 'popup';
  imageUrl: string;
  videoUrl?: string;
  targetUrl: string;
  startDate: string;
  endDate: string;
  status: 'pending' | 'active' | 'paused' | 'rejected' | 'expired';
  impressions: number;
  clicks: number;
  budget: string | number;
  advertiserEmail: string;
  advertiserName: string;
  createdAt?: any;
  city?: string;
  price?: string;
}

const NETWORK_PORTALS = [
  { slug: 'all', name: 'सभी नेटवर्क (All Portals)' },
  { slug: 'the-local-leader', name: 'द लोकल लीडर' },
  { slug: 'bazar-karobar', name: 'बाज़ार कारोबार' },
  { slug: 'golden-pearl-chronicles', name: 'गोल्डन पर्ल क्रॉनिकल्स' },
  { slug: 'the-provue-times', name: 'द प्रोव्यू टाइम्स' },
  { slug: 'desh-ki-aawaz', name: 'देश की आवाज़' },
  { slug: 'jan-bharat-news', name: 'जन भारत न्यूज़' },
  { slug: 'news-info-24', name: 'NEWS INFO 24' },
  { slug: 'ndn-defence', name: 'National Defence Network' }
];

const CLASSIFIED_CATEGORIES = [
  'प्रॉपर्टी / ज़मीन',
  'वाहन (गाड़ियां)',
  'नौकरी / रोजगार',
  'इलेक्ट्रॉनिक्स',
  'सेवाएं / बिजनेस',
  'शिक्षा / कोचिंग',
  'अन्य'
];

export default function AdvertiserDashboard() {
  const [activeTab, setActiveTab] = useState<'my-ads' | 'create-ad'>('my-ads');
  const [ads, setAds] = useState<AdvertiserAd[]>([]);
  // Vigyapan ki keemat + muddat admin ki tay ki hui (Admin → प्लान व कीमतें)
  const pricing = usePricing();
  const AD_FORMATS = ['classified', 'sidebar', 'banner', 'popup'] as const;
  const AD_PRICES = Object.fromEntries(AD_FORMATS.map((f) => [f, pricing.ads[f].price])) as Record<(typeof AD_FORMATS)[number], number>;
  const AD_DAYS = Object.fromEntries(AD_FORMATS.map((f) => [f, pricing.ads[f].days])) as Record<(typeof AD_FORMATS)[number], number>;
  const AD_DURATION_LABEL = Object.fromEntries(AD_FORMATS.map((f) => [f, daysLabel(pricing.ads[f].days)])) as Record<(typeof AD_FORMATS)[number], string>;
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Dynamic Site Theme Brand Color
  const [themeColor, setThemeColor] = useState<string>('#ea580c');
  const [siteName, setSiteName] = useState<string>('द लोकल लीडर');
  const [siteLogo, setSiteLogo] = useState<string>('/logos/the-local-leader.jpeg');

  // User session state
  const [currentUser, setCurrentUser] = useState<{ id: string; phone: string; email: string; name: string } | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [format, setFormat] = useState<'banner' | 'sidebar' | 'classified' | 'popup'>('classified');
  const [zone, setZone] = useState('classifieds-feed');
  const [selectedSite, setSelectedSite] = useState('the-local-leader');
  const [classifiedCategory, setClassifiedCategory] = useState(CLASSIFIED_CATEGORIES[0]);
  const [city, setCity] = useState('');
  const [price, setPrice] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [targetUrl, setTargetUrl] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  // Image Upload State
  const [imageUploadType, setImageUploadType] = useState<'url' | 'file'>('url');
  const [imageUrl, setImageUrl] = useState('');
  const [selectedFilePreview, setSelectedFilePreview] = useState<string>('');
  // Animated vigyapan: video ka link (GIF imageUrl me hi jaata hai); upload chal raha ho toh % (warna null)
  const [videoUrl, setVideoUrl] = useState('');
  const [mediaUploadPct, setMediaUploadPct] = useState<number | null>(null);

  // 1. Fetch Site Config for Brand Color matching Logo
  useEffect(() => {
    const unsubSite = onSnapshot(doc(db, 'sites', 'the-local-leader'), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data.primaryColor) setThemeColor(data.primaryColor);
        if (data.name) setSiteName(data.name);
        if (data.logoUrl) setSiteLogo(logoFor('the-local-leader', data.logoUrl));
      }
    });
    return () => unsubSite();
  }, []);

  // 2. Session guard: sirf OTP-verified advertiser; profile Firestore se (bina session seedha login)
  useEffect(() => {
    const session = getRoleSession('advertiser');
    if (!session) {
      window.location.replace('/advertiser/login');
      return;
    }
    // Firebase pehchaan bhi isi number ki ho (Firestore rules isi par) — nahi toh dobara login
    sessionMatchesFirebase(session.phone)
      .then((ok) => {
        if (!ok) throw new Error('relogin');
        return getProfileById('advertiser', session.id);
      })
      .then((profile) => {
        // Profile na mile ya session ka phone match na kare toh session nakli/purana hai
        if (!profile || (profile.data.phone !== session.phone && profile.data.mobile !== session.phone)) {
          clearRoleSession('advertiser');
          window.location.replace('/advertiser/login');
          return;
        }
        const d = profile.data;
        setCurrentUser({
          id: profile.id,
          phone: session.phone,
          email: String(d.email || '').toLowerCase(),
          name: d.businessName || d.contactName || d.contactPerson || 'विज्ञापनदाता'
        });
        setContactPhone(session.phone);
      })
      .catch((err) => {
        console.error('Advertiser profile load error:', err);
        clearRoleSession('advertiser');
        window.location.replace('/advertiser/login');
      });
  }, []);

  // 3. Fetch advertiser's ads in real-time (Dono: 'ads' aur 'classifieds' collections se)
  useEffect(() => {
    if (!currentUser) return;

    setLoading(true);

    // Apne vigyapan email YA phone se — ek hi number par alag-alag email wali profile ho tab bhi sab dikhein
    const byField = (col: string) => [
      ...(currentUser.email ? [query(collection(db, col), where('advertiserEmail', '==', currentUser.email))] : []),
      query(collection(db, col), where('advertiserPhone', '==', currentUser.phone))
    ];

    let bannerList: AdvertiserAd[] = [];
    let classifiedList: AdvertiserAd[] = [];
    const bannerParts: AdvertiserAd[][] = [];
    const classifiedParts: AdvertiserAd[][] = [];
    const uniq = (parts: AdvertiserAd[][]) => [...new Map(parts.flat().map((x) => [x.id, x])).values()];

    const unsubAds = byField('ads').map((q, i) => onSnapshot(q, (snapshot) => {
      bannerParts[i] = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          name: data.name || data.title || 'Untitled Banner',
          zone: data.zone || '728x90 Header Leaderboard',
          type: data.type || 'image',
          format: (data.format || 'banner') as any,
          imageUrl: data.imageUrl || '',
          videoUrl: data.videoUrl || '',
          targetUrl: data.targetUrl || '',
          startDate: data.startDate || 'तत्काल',
          endDate: data.endDate || 'खुला',
          status: data.status || 'pending',
          days: Number(data.days) || 0,
          approvedAt: data.approvedAt || null,
          paidAt: data.paidAt || null,
          impressions: Number(data.impressions || data.views || 0),
          clicks: Number(data.clicks || 0),
          budget: data.budget || 5000,
          advertiserEmail: data.advertiserEmail || '',
          advertiserName: data.advertiserName || ''
        };
      });
      bannerList = uniq(bannerParts);
      setAds([...classifiedList, ...bannerList]);
      setLoading(false);
    }, (err) => { console.error('ads load error:', err); setLoading(false); }));

    const unsubCls = byField('classifieds').map((q, i) => onSnapshot(q, (snapshot) => {
      classifiedParts[i] = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          name: data.title || data.name || 'Untitled Classified',
          zone: 'साइडबार क्लासिफाइड विजेट (Sidebar Widget)',
          type: 'classified',
          format: 'classified',
          imageUrl: data.imageUrl || '',
          videoUrl: data.videoUrl || '',
          targetUrl: data.targetUrl || '#',
          startDate: data.startDate || 'तत्काल',
          endDate: data.endDate || 'खुला',
          status: (data.status === 'active' || data.status === 'approved' ? 'active' : data.status || 'pending') as any,
          days: Number(data.days) || 0,
          approvedAt: data.approvedAt || null,
          paidAt: data.paidAt || null,
          impressions: Number(data.impressions || data.views || 0),
          clicks: Number(data.clicks || 0),
          budget: data.price ? `₹${data.price}` : 0,
          advertiserEmail: data.advertiserEmail || '',
          advertiserName: data.advertiserName || '',
          city: data.city || '',
          price: data.price || ''
        };
      });
      classifiedList = uniq(classifiedParts);
      setAds([...classifiedList, ...bannerList]);
      setLoading(false);
    }, (err) => { console.error('classifieds load error:', err); setLoading(false); }));

    return () => {
      [...unsubAds, ...unsubCls].forEach((u) => u());
    };
  }, [currentUser?.email, currentUser?.phone]);

  // Upload ki photo format ke fix size (classified 400×300, sidebar 300×250, banner 728×90) me apne aap crop + resize
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const fitAndSet = async (file: File, fmt: typeof format) => {
    try {
      const dataUrl = await fitAdImage(file, fmt);
      setSelectedFilePreview(dataUrl);
      setImageUrl(dataUrl);
    } catch {
      alert('यह फोटो पढ़ी नहीं जा सकी, कृपया JPG/PNG फोटो चुनें।');
    }
  };
  const handleLocalImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // GIF / video: bina crop seedha Storage me (animation bani rahe) — website par fix size ke dabbe me chalega
    if (isAnimatedFile(file)) {
      const problem = await validateAdMedia(file);
      if (problem) {
        alert(problem);
        e.target.value = '';
        return;
      }
      if (!currentUser?.phone) return;
      setUploadedFile(null);
      setMediaUploadPct(0);
      try {
        const url = await uploadAdMedia(file, currentUser.phone, setMediaUploadPct);
        if (file.type === 'image/gif') {
          setImageUrl(url);
          setVideoUrl('');
        } else {
          setVideoUrl(url);
          setImageUrl('');
        }
        setSelectedFilePreview(url);
      } catch (err: any) {
        alert(adUploadErrorMessage(err));
        e.target.value = '';
      }
      setMediaUploadPct(null);
      return;
    }
    setVideoUrl('');
    if (!file.type.startsWith('image/')) {
      alert('कृपया फोटो (JPG/PNG/WebP) चुनें।');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert('कृपया 10 MB से छोटी फोटो चुनें।');
      return;
    }
    setUploadedFile(file);
    fitAndSet(file, format);
  };
  // Format badla toh upload ki hui photo naye size me dobara fit
  useEffect(() => {
    if (uploadedFile && imageUploadType === 'file') fitAndSet(uploadedFile, format);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [format]);

  const handleFormatChange = (selected: 'banner' | 'sidebar' | 'classified' | 'popup') => {
    setFormat(selected);
    if (selected === 'banner') setZone('728x90 Header Leaderboard');
    if (selected === 'sidebar') setZone('300x250 (साइडबार)');
    if (selected === 'classified') setZone('classifieds-feed');
    if (selected === 'popup') setZone('popup');
  };

  // Submit Ad request to Firestore
  const handleSubmitAd = async (e: React.FormEvent) => {
    e.preventDefault();

    // Ad hamesha verified advertiser ke naam se hi save ho
    if (!currentUser || !getRoleSession('advertiser')) {
      clearRoleSession('advertiser');
      window.location.replace('/advertiser/login');
      return;
    }

    if (!name.trim()) {
      alert('विज्ञापन का शीर्षक/नाम दर्ज करना आवश्यक है।');
      return;
    }

    // Payment se PEHLE saari jaanch (paise katne ke baad request na ruke)
    if (mediaUploadPct !== null) {
      alert('GIF / वीडियो अपलोड हो रहा है, कृपया पूरा होने दें।');
      return;
    }
    const img = imageUrl.trim();
    const vid = videoUrl.trim();
    if (format !== 'classified' && !img && !vid) {
      alert('बैनर विज्ञापन के लिए इमेज, GIF या वीडियो आवश्यक है।');
      return;
    }
    if (img.startsWith('data:') && img.length > 700_000) {
      alert('फोटो बहुत बड़ी है (500KB तक की फोटो चुनें) या इमेज लिंक डालें।');
      return;
    }

    const amount = AD_PRICES[format];
    const adData = {
      format,
      title: name.trim(),
      category: classifiedCategory,
      city: city.trim(),
      price: price.trim(),
      contactNumber: contactPhone.trim() || currentUser.phone,
      imageUrl: img,
      videoUrl: vid,
      siteId: selectedSite,
      zone,
      targetUrl: targetUrl.trim(),
      startDate,
      endDate
    };

    setSubmitting(true);
    const loaded = await loadRazorpayScript();
    if (!loaded || !(window as any).Razorpay) {
      setSubmitting(false);
      alert('भुगतान सिस्टम लोड नहीं हो पाया। कृपया इंटरनेट जांच कर दोबारा प्रयास करें।');
      return;
    }

    const rzp = new (window as any).Razorpay({
      key: RAZORPAY_KEY,
      amount: amount * 100,
      currency: 'INR',
      name: siteName,
      description: `${AD_FORMAT_LABEL[format]} — विज्ञापन शुल्क`,
      prefill: { name: currentUser.name, email: currentUser.email, contact: currentUser.phone },
      theme: { color: themeColor },
      modal: { ondismiss: () => setSubmitting(false) },
      handler: async (response: any) => {
        const pid = response.razorpay_payment_id;
        try {
          // Server payment jaanch kar khud request banata hai (status: pending → admin manzoori)
          const confirmed = await confirmPayment('ad', pid, { ad: adData });
          if (!confirmed.ok && !confirmed.fallback) {
            alert(`⚠️ ${confirmed.message}\nभुगतान ID: ${pid}`);
            setSubmitting(false);
            return;
          }
          if (!confirmed.ok) {
            // Server abhi tayyar nahi — purana tareeka (payment ID ke saath)
            const paid = { paymentId: pid, amountPaid: amount, paymentStatus: 'paid' };
            const who = {
              advertiserId: currentUser.id,
              advertiserPhone: currentUser.phone,
              advertiserEmail: currentUser.email,
              advertiserName: currentUser.name
            };
            if (format === 'classified') {
              await addDoc(collection(db, 'classifieds'), {
                title: adData.title,
                category: adData.category,
                city: adData.city || 'इंदौर/महू',
                price: adData.price,
                contactNumber: adData.contactNumber,
                imageUrl: img,
                videoUrl: vid,
                siteId: selectedSite,
                status: 'pending',
                format: 'classified',
                type: 'classified',
                ...who,
                ...paid,
                createdAt: new Date().toISOString(),
                timestamp: serverTimestamp()
              });
            } else {
              await addDoc(collection(db, 'ads'), {
                name: adData.title,
                title: adData.title,
                format,
                zone,
                siteId: selectedSite,
                type: 'image',
                device: 'all',
                imageUrl: img,
                videoUrl: vid,
                targetUrl: adData.targetUrl || '#',
                startDate: startDate || 'तत्काल',
                endDate: endDate || 'खुला',
                budget: amount,
                status: 'pending',
                priority: 1,
                impressions: 0,
                clicks: 0,
                contactNumber: adData.contactNumber,
                ...who,
                ...paid,
                createdAt: serverTimestamp()
              });
            }
          }
          alert(`✅ ₹${amount} का भुगतान सफल! आपका विज्ञापन अनुरोध एडमिन को भेज दिया गया है। स्वीकृति के बाद यह वेबसाइट पर लाइव होगा।\nभुगतान ID: ${pid}`);
          resetForm();
        } catch (err: any) {
          setSubmitting(false);
          alert(`⚠️ भुगतान हो गया पर अनुरोध दर्ज नहीं हो पाया। भुगतान ID के साथ सहायता से संपर्क करें।\nभुगतान ID: ${pid}\n${err?.message || ''}`);
        }
      }
    });
    rzp.on('payment.failed', (resp: any) => {
      setSubmitting(false);
      alert(`❌ भुगतान असफल: ${resp?.error?.description || 'कृपया दोबारा प्रयास करें।'}`);
    });
    rzp.open();
  };

  const resetForm = () => {
    setName('');
    setImageUrl('');
    setVideoUrl('');
    setSelectedFilePreview('');
    setTargetUrl('');
    setCity('');
    setPrice('');
    setStartDate('');
    setEndDate('');
    setSubmitting(false);
    setActiveTab('my-ads');
  };

  const handleLogout = () => {
    clearRoleSession('advertiser');
    window.location.replace('/advertiser/login');
  };

  const activeCount = ads.filter(a => a.status === 'active').length;
  const pendingCount = ads.filter(a => a.status === 'pending').length;
  const totalViews = ads.reduce((acc, curr) => acc + (curr.impressions || 0), 0);
  const totalClicks = ads.reduce((acc, curr) => acc + (curr.clicks || 0), 0);

  // Session verify hone tak dashboard nahi dikhana
  if (!currentUser) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f1f5f9', color: '#64748b', fontSize: '14px' }}>
        सत्र की जांच की जा रही है...
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f1f5f9', color: '#1e293b', fontFamily: '"Mukta", system-ui, -apple-system, sans-serif' }}>
      
      {/* Top Navbar */}
      <header style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #e2e8f0', padding: '14px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {siteLogo && (
            <Link href="/" aria-label="मुख्य वेबसाइट" style={{ display: 'inline-flex' }}>
              <img src={siteLogo} alt={siteName} style={{ height: '54px', width: 'auto', maxWidth: '140px', borderRadius: '6px', objectFit: 'contain' }} />
            </Link>
          )}
          <div>
            <span style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>विज्ञापनदाता पोर्टल</span>
            <span style={{ fontSize: '12px', color: '#64748b', marginLeft: '10px' }}>
              {currentUser?.name} ({currentUser?.email})
            </span>
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
            <span style={{ fontSize: '12.5px', color: '#64748b', fontWeight: 600 }}>लाइव / सक्रिय विज्ञापन</span>
            <div style={{ fontSize: '30px', fontWeight: 800, color: '#16a34a', marginTop: '4px' }}>{activeCount}</div>
            <span style={{ fontSize: '11px', color: '#94a3b8' }}>वर्तमान में पोर्टल पर लाइव</span>
          </div>

          <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '18px', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
            <span style={{ fontSize: '12.5px', color: '#64748b', fontWeight: 600 }}>स्वीकृति हेतु लंबित (Pending)</span>
            <div style={{ fontSize: '30px', fontWeight: 800, color: '#d97706', marginTop: '4px' }}>{pendingCount}</div>
            <span style={{ fontSize: '11px', color: '#94a3b8' }}>एडमिन अप्रूवल की प्रतीक्षा में</span>
          </div>

          <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '18px', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
            <span style={{ fontSize: '12.5px', color: '#64748b', fontWeight: 600 }}>कुल इम्प्रेशन्स (Views)</span>
            <div style={{ fontSize: '30px', fontWeight: 800, color: '#0284c7', marginTop: '4px' }}>{totalViews}</div>
            <span style={{ fontSize: '11px', color: '#94a3b8' }}>पाठकों द्वारा देखे गए</span>
          </div>

          <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '18px', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
            <span style={{ fontSize: '12.5px', color: '#64748b', fontWeight: 600 }}>कुल क्लिक्स (Clicks)</span>
            <div style={{ fontSize: '30px', fontWeight: 800, color: '#7c3aed', marginTop: '4px' }}>{totalClicks}</div>
            <span style={{ fontSize: '11px', color: '#94a3b8' }}>वेबसाइट ट्रैफ़िक एंगेजमेंट</span>
          </div>

        </div>

        {/* Navigation Tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
          <button
            type="button"
            onClick={() => setActiveTab('my-ads')}
            style={{
              backgroundColor: activeTab === 'my-ads' ? themeColor : '#ffffff',
              color: activeTab === 'my-ads' ? '#ffffff' : '#475569',
              border: `1.5px solid ${activeTab === 'my-ads' ? themeColor : '#cbd5e1'}`,
              borderRadius: '8px',
              padding: '9px 18px',
              fontSize: '13.5px',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: activeTab === 'my-ads' ? '0 2px 8px rgba(0,0,0,0.1)' : 'none'
            }}
          >
            मेरे सभी विज्ञापन ({ads.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('create-ad')}
            style={{
              backgroundColor: activeTab === 'create-ad' ? themeColor : '#ffffff',
              color: activeTab === 'create-ad' ? '#ffffff' : '#475569',
              border: `1.5px solid ${activeTab === 'create-ad' ? themeColor : '#cbd5e1'}`,
              borderRadius: '8px',
              padding: '9px 18px',
              fontSize: '13.5px',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: activeTab === 'create-ad' ? '0 2px 8px rgba(0,0,0,0.1)' : 'none'
            }}
          >
            + नया विज्ञापन अनुरोध भेजें
          </button>
        </div>

        {/* TAB 1: MY ADS LIST */}
        {activeTab === 'my-ads' && (
          <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.04)' }}>
            {loading ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#64748b', fontSize: '14px' }}>
                डेटा लोड हो रहा है...
              </div>
            ) : ads.length === 0 ? (
              <div style={{ padding: '60px 20px', textAlign: 'center', color: '#64748b' }}>
                <p style={{ fontSize: '17px', color: '#0f172a', fontWeight: 600, marginBottom: '6px' }}>कोई विज्ञापन उपलब्ध नहीं है</p>
                <p style={{ fontSize: '13.5px', margin: 0, color: '#64748b' }}>नया विज्ञापन बनाने के लिए ऊपर "+ नया विज्ञापन अनुरोध भेजें" बटन पर क्लिक करें।</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13.5px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                      <th style={{ padding: '14px 18px' }}>विज्ञापन विवरण</th>
                      <th style={{ padding: '14px 18px' }}>प्रारूप (Format)</th>
                      <th style={{ padding: '14px 18px' }}>प्लेसमेंट ज़ोन</th>
                      <th style={{ padding: '14px 18px' }}>समय सीमा / विवरण</th>
                      <th style={{ padding: '14px 18px' }}>स्थिति (Status)</th>
                      <th style={{ padding: '14px 18px' }}>प्रदर्शन (Performance)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ads.map((ad, idx) => (
                      <tr 
                        key={ad.id} 
                        style={{ 
                          borderBottom: idx === ads.length - 1 ? 'none' : '1px solid #f1f5f9'
                        }}
                      >
                        <td style={{ padding: '14px 18px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            {ad.imageUrl || ad.videoUrl ? (
                              <AdMedia
                                ad={ad}
                                alt={ad.name}
                                style={{ width: '48px', height: '36px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                              />
                            ) : (
                              <div style={{ width: '48px', height: '36px', backgroundColor: '#f1f5f9', borderRadius: '4px', display: 'grid', placeItems: 'center', fontSize: '16px' }}>
                                📋
                              </div>
                            )}
                            <div>
                              <div style={{ fontWeight: 600, color: '#0f172a' }}>{ad.name}</div>
                              {ad.city && <span style={{ fontSize: '11px', color: '#64748b' }}>📍 {ad.city} {ad.price ? `· ₹${ad.price}` : ''}</span>}
                              {/* Muddat: kab tak chalega / samay poora */}
                              {(ad as any).days > 0 && (ad as any).approvedAt && (
                                <span style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: adNotExpired(ad) ? '#16a34a' : '#dc2626' }}>
                                  {adNotExpired(ad) ? `✓ ${new Date(adExpiryMs(ad)).toLocaleDateString('hi-IN')} तक` : '⏱ समय पूरा — नया विज्ञापन दें'}
                                </span>
                              )}
                              {ad.targetUrl && ad.targetUrl !== '#' && (
                                <a href={ad.targetUrl} target="_blank" rel="noreferrer" style={{ fontSize: '11.5px', color: '#0284c7', textDecoration: 'none', display: 'block' }}>
                                  {ad.targetUrl.slice(0, 30)}...
                                </a>
                              )}
                            </div>
                          </div>
                        </td>

                        <td style={{ padding: '14px 18px', color: '#475569' }}>
                          {ad.format === 'classified' ? (
                            <span style={{ backgroundColor: '#fef3c7', color: '#b45309', padding: '3px 8px', borderRadius: '4px', fontSize: '11.5px', fontWeight: 600 }}>
                              क्लासिफाइड
                            </span>
                          ) : (
                            <span style={{ textTransform: 'capitalize' }}>{ad.format} Banner</span>
                          )}
                        </td>

                        <td style={{ padding: '14px 18px', fontSize: '12px', color: '#64748b' }}>
                          {ad.zone}
                        </td>

                        <td style={{ padding: '14px 18px', fontSize: '12.5px', color: '#64748b' }}>
                          {ad.format === 'classified' ? (
                            <div>स्थान: {ad.city || 'MP'}</div>
                          ) : (
                            <>
                              <div>शुरू: {ad.startDate}</div>
                              <div style={{ color: '#dc2626' }}>समाप्त: {ad.endDate}</div>
                            </>
                          )}
                        </td>

                        <td style={{ padding: '14px 18px' }}>
                          <span
                            style={{
                              display: 'inline-block',
                              padding: '3px 12px',
                              borderRadius: '20px',
                              fontSize: '11.5px',
                              fontWeight: 600,
                              textTransform: 'capitalize',
                              backgroundColor: 
                                ad.status === 'active' ? '#dcfce7' :
                                ad.status === 'pending' ? '#fef3c7' : '#fee2e2',
                              color: 
                                ad.status === 'active' ? '#15803d' :
                                ad.status === 'pending' ? '#b45309' : '#dc2626',
                              border: `1px solid ${
                                ad.status === 'active' ? '#bbf7d0' :
                                ad.status === 'pending' ? '#fde68a' : '#fecaca'
                              }`
                            }}
                          >
                            {ad.status === 'pending' ? '⏳ विचाराधीन' : ad.status === 'active' ? '✓ लाइव' : ad.status}
                          </span>
                        </td>

                        <td style={{ padding: '14px 18px', fontSize: '12.5px' }}>
                          <div style={{ color: '#0284c7', fontWeight: 600 }}>{ad.impressions} Views</div>
                          <div style={{ color: '#7c3aed', fontWeight: 600 }}>{ad.clicks} Clicks</div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: CREATE AD FORM */}
        {activeTab === 'create-ad' && (
          <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '32px', maxWidth: '780px', margin: '0 auto', boxShadow: '0 4px 14px rgba(0,0,0,0.04)' }}>
            <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#0f172a', margin: '0 0 6px 0' }}>नया विज्ञापन अनुरोध सबमिट करें</h2>
            <p style={{ fontSize: '13.5px', color: '#64748b', margin: '0 0 24px 0' }}>
              क्लासिफाइड विज्ञापन सीधे साइडबार में दिखेंगे, और बैनर विज्ञापन संबंधित स्लॉट में लाइव होंगे।
            </p>

            <form onSubmit={handleSubmitAd} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>विज्ञापन का प्रकार (Format) *</label>
                <select
                  value={format}
                  onChange={(e) => handleFormatChange(e.target.value as any)}
                  style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#f8fafc', border: `2px solid ${themeColor}`, borderRadius: '8px', padding: '11px 14px', color: '#0f172a', fontSize: '14px', outline: 'none', cursor: 'pointer', fontWeight: 600 }}
                >
                  <option value="classified">📋 क्लासिफाइड विज्ञापन (साइडबार विजेट और क्लासिफाइड पेज) — ₹{AD_PRICES.classified}{AD_DURATION_LABEL.classified ? ` / ${AD_DURATION_LABEL.classified}` : ''}</option>
                  <option value="banner">🔝 हेडर / लीडरबोर्ड बैनर (728 × 90) — ₹{AD_PRICES.banner}{AD_DURATION_LABEL.banner ? ` / ${AD_DURATION_LABEL.banner}` : ''}</option>
                  <option value="sidebar">🔲 साइडबार इमेज बैनर (300 × 250) — ₹{AD_PRICES.sidebar}{AD_DURATION_LABEL.sidebar ? ` / ${AD_DURATION_LABEL.sidebar}` : ''}</option>
                  <option value="popup">🛑 पॉप-अप विज्ञापन — ₹{AD_PRICES.popup}{AD_DURATION_LABEL.popup ? ` / ${AD_DURATION_LABEL.popup}` : ''}</option>
                </select>
                <p style={{ margin: '8px 0 0', fontSize: '12.5px', color: '#475569', lineHeight: 1.5 }}>
                  💳 विज्ञापन शुल्क: <b style={{ color: themeColor }}>₹{AD_PRICES[format]}{AD_DURATION_LABEL[format] ? ` / ${AD_DURATION_LABEL[format]}` : ''}</b> — भुगतान के बाद अनुरोध एडमिन के पास जाएगा और स्वीकृति के बाद ही वेबसाइट पर लाइव होगा।{AD_DAYS[format] ? ` विज्ञापन स्वीकृति के दिन से ${AD_DURATION_LABEL[format]} तक चलेगा।` : ''}
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>टारगेट पोर्टल (Site)</label>
                  <select
                    value={selectedSite}
                    onChange={(e) => setSelectedSite(e.target.value)}
                    style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#f8fafc', border: '1.5px solid #cbd5e1', borderRadius: '8px', padding: '11px 14px', color: '#0f172a', fontSize: '13.5px', outline: 'none', cursor: 'pointer' }}
                  >
                    {NETWORK_PORTALS.map(p => (
                      <option key={p.slug} value={p.slug}>{p.name}</option>
                    ))}
                  </select>
                </div>

                {format === 'classified' ? (
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>क्लासिफाइड श्रेणी *</label>
                    <select
                      value={classifiedCategory}
                      onChange={(e) => setClassifiedCategory(e.target.value)}
                      style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#f8fafc', border: '1.5px solid #cbd5e1', borderRadius: '8px', padding: '11px 14px', color: '#0f172a', fontSize: '13.5px', outline: 'none', cursor: 'pointer' }}
                    >
                      {CLASSIFIED_CATEGORIES.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>प्लेसमेंट ज़ोन (Slot)</label>
                    <select
                      value={zone}
                      onChange={(e) => setZone(e.target.value)}
                      style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#f8fafc', border: '1.5px solid #cbd5e1', borderRadius: '8px', padding: '11px 14px', color: '#0f172a', fontSize: '13.5px', outline: 'none', cursor: 'pointer' }}
                    >
                      <option value="728x90 Header Leaderboard">728x90 Header Leaderboard</option>
                      <option value="300x250 (साइडबार)">300x250 (साइडबार)</option>
                      <option value="popup">popup</option>
                    </select>
                  </div>
                )}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>विज्ञापन का शीर्षक / नाम *</label>
                <input
                  type="text"
                  required
                  placeholder={format === 'classified' ? 'उदा. 2 BHK मकान बिकाऊ है स्टेशन रोड पर' : 'उदा. व्यापार महासेल - हेडर बैनर'}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#f8fafc', border: '1.5px solid #cbd5e1', borderRadius: '8px', padding: '11px 14px', color: '#0f172a', fontSize: '14px', outline: 'none' }}
                />
              </div>

              {/* Classified specific fields */}
              {format === 'classified' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>शहर / कस्बा (City)</label>
                    <input
                      type="text"
                      placeholder="उदा. महू / इंदौर"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#f8fafc', border: '1.5px solid #cbd5e1', borderRadius: '8px', padding: '11px 14px', color: '#0f172a', fontSize: '13.5px', outline: 'none' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>कीमत / दर (₹ Price)</label>
                    <input
                      type="text"
                      placeholder="उदा. 25,00,000 या 5000"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#f8fafc', border: '1.5px solid #cbd5e1', borderRadius: '8px', padding: '11px 14px', color: '#0f172a', fontSize: '13.5px', outline: 'none' }}
                    />
                  </div>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>संपर्क मोबाइल नंबर *</label>
                  <input
                    type="tel"
                    required
                    placeholder="8103333381"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#f8fafc', border: '1.5px solid #cbd5e1', borderRadius: '8px', padding: '11px 14px', color: '#0f172a', fontSize: '13.5px', outline: 'none' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>क्लिक लिंक (Target URL)</label>
                  <input
                    type="url"
                    placeholder="https://yourwebsite.com/offer"
                    value={targetUrl}
                    onChange={(e) => setTargetUrl(e.target.value)}
                    style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#f8fafc', border: '1.5px solid #cbd5e1', borderRadius: '8px', padding: '11px 14px', color: '#0f172a', fontSize: '13.5px', outline: 'none' }}
                  />
                </div>
              </div>

              {format !== 'classified' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>प्रसारण शुरू तारीख *</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#f8fafc', border: '1.5px solid #cbd5e1', borderRadius: '8px', padding: '11px 14px', color: '#0f172a', fontSize: '13.5px', outline: 'none' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>समाप्ति तारीख *</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#f8fafc', border: '1.5px solid #cbd5e1', borderRadius: '8px', padding: '11px 14px', color: '#0f172a', fontSize: '13.5px', outline: 'none' }}
                    />
                  </div>
                </div>
              )}

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>
                    विज्ञापन फोटो / GIF / वीडियो {format === 'classified' ? '(वैकल्पिक)' : '*'}
                    <span style={{ display: 'block', fontSize: '11.5px', fontWeight: 500, color: '#64748b', marginTop: '2px' }}>
                      साइज़: <b>{AD_IMAGE_SIZE[format].label} px</b> — अपलोड की गई फोटो अपने आप इसी साइज़ में फिट हो जाएगी
                    </span>
                    <span style={{ display: 'block', fontSize: '11.5px', fontWeight: 500, color: '#64748b' }}>
                      🎬 Animated: GIF ({MAX_AD_GIF_MB} MB तक) या MP4/WebM वीडियो ({MAX_AD_VIDEO_MB} MB, {MAX_AD_VIDEO_SECONDS} सेकंड तक) — बिना आवाज़ के लूप में चलेगा
                    </span>
                  </label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={() => setImageUploadType('url')}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: imageUploadType === 'url' ? themeColor : '#64748b',
                        fontSize: '12.5px',
                        cursor: 'pointer',
                        fontWeight: imageUploadType === 'url' ? 700 : 500
                      }}
                    >
                      वेब लिंक (URL)
                    </button>
                    <span style={{ color: '#cbd5e1' }}>|</span>
                    <button
                      type="button"
                      onClick={() => setImageUploadType('file')}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: imageUploadType === 'file' ? themeColor : '#64748b',
                        fontSize: '12.5px',
                        cursor: 'pointer',
                        fontWeight: imageUploadType === 'file' ? 700 : 500
                      }}
                    >
                      डिवाइस से अपलोड करें
                    </button>
                  </div>
                </div>

                {imageUploadType === 'url' ? (
                  <input
                    type="url"
                    placeholder="https://example.com/banner.jpg (या .gif / .mp4)"
                    value={videoUrl || imageUrl}
                    onChange={(e) => {
                      // MP4/WebM link = video vigyapan, baaki photo / GIF (Drive / Dropbox share link seedhe link me)
                      const v = directMediaUrl(e.target.value);
                      if (isVideoUrl(v)) {
                        setVideoUrl(v);
                        setImageUrl('');
                      } else {
                        setImageUrl(v);
                        setVideoUrl('');
                      }
                      setSelectedFilePreview(v);
                    }}
                    style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#f8fafc', border: '1.5px solid #cbd5e1', borderRadius: '8px', padding: '11px 14px', color: '#0f172a', fontSize: '13.5px', outline: 'none' }}
                  />
                ) : (
                  <input
                    type="file"
                    accept="image/*,video/mp4,video/webm"
                    onChange={handleLocalImageSelect}
                    style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#f8fafc', border: '1.5px solid #cbd5e1', borderRadius: '8px', padding: '9px 14px', color: '#0f172a', fontSize: '13.5px', outline: 'none' }}
                  />
                )}

                {mediaUploadPct !== null && (
                  <div style={{ marginTop: '10px', fontSize: '12.5px', color: themeColor, fontWeight: 600 }}>
                    ⏳ अपलोड हो रहा है… {mediaUploadPct}%
                    <div style={{ height: '6px', background: '#e2e8f0', borderRadius: '4px', marginTop: '6px', overflow: 'hidden' }}>
                      <div style={{ width: `${mediaUploadPct}%`, height: '100%', background: themeColor, transition: 'width .2s' }} />
                    </div>
                  </div>
                )}

                {selectedFilePreview && (
                  <div style={{ marginTop: '14px', padding: '12px', border: '1px dashed #cbd5e1', borderRadius: '8px', textAlign: 'center', backgroundColor: '#f8fafc' }}>
                    <span style={{ fontSize: '11.5px', color: '#64748b', display: 'block', marginBottom: '8px', fontWeight: 600 }}>{videoUrl ? 'वीडियो पूर्वावलोकन' : 'पूर्वावलोकन'}</span>
                    {/* Website par bilkul aisa hi — poora, bina kate (apne asli anupaat me) */}
                    <AdMedia
                      ad={{ imageUrl: videoUrl ? '' : selectedFilePreview, videoUrl }}
                      alt="Banner Preview"
                      style={{ width: '100%', height: 'auto', maxHeight: '320px', objectFit: 'contain', borderRadius: '6px', display: 'block', margin: '0 auto' }}
                    />
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setActiveTab('my-ads')}
                  style={{
                    backgroundColor: '#f1f5f9',
                    border: '1px solid #cbd5e1',
                    color: '#475569',
                    padding: '10px 20px',
                    borderRadius: '8px',
                    fontSize: '13.5px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  रद्द करें
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    backgroundColor: themeColor,
                    border: 'none',
                    color: '#ffffff',
                    padding: '11px 26px',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    opacity: submitting ? 0.6 : 1
                  }}
                >
                  {submitting ? 'भुगतान / दर्ज हो रहा है...' : `💳 ₹${AD_PRICES[format]} भुगतान करें व अनुरोध भेजें`}
                </button>
              </div>

            </form>
          </div>
        )}

      </div>
    </div>
  );
}