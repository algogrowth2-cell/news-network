'use client';

import React, { useState, useEffect } from 'react';
import { isValidIndianMobile, isValidName, sanitizeName, VALIDATION_MSG } from '@/lib/validation';
import { db } from '@/lib/firebase';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc,
  doc,
  setDoc,
  serverTimestamp
} from 'firebase/firestore';
import Link from 'next/link';
import { AdInline, AdLayout } from '@/components/SiteAds';
import { fallbackFor, getActivePortal } from '@/lib/siteTheme';
import { confirmPayment } from '@/lib/payments';
import { SECURE_AUTH } from '@/lib/phoneAuth';

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface ShokSandeshItem {
  id: string;
  name: string;
  relation: string;
  passedDate: string;
  eventDate: string;
  eventTime?: string;
  venue: string;
  address: string;
  familyMembers: string;
  contactNumber: string;
  photoUrl: string;
  templateId: 'floral-white' | 'golden-frame' | 'divine-blue' | 'rose-border' | 'classic-silver';
  status: 'pending' | 'approved';
  createdAt?: any;
}

// ---- Form validation helpers ----
const HINDI_DAYS = ['रविवार', 'सोमवार', 'मंगलवार', 'बुधवार', 'बृहस्पतिवार', 'शुक्रवार', 'शनिवार'];
const pad2 = (n: number) => String(n).padStart(2, '0');
// Local date (UTC nahi) — warna IST me raat 12 se 5:30 tak "kal" aata
const toISODate = (d: Date) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
const shiftISO = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return toISODate(d);
};
const parseISO = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
};
// Card par purane format me hi: "बुधवार, 10.04.2026" aur "20-04-2026"
const formatPassedDate = (iso: string) => {
  const d = parseISO(iso);
  return `${HINDI_DAYS[d.getDay()]}, ${pad2(d.getDate())}.${pad2(d.getMonth() + 1)}.${d.getFullYear()}`;
};
const formatEventDate = (iso: string) => {
  const d = parseISO(iso);
  return `${pad2(d.getDate())}-${pad2(d.getMonth() + 1)}-${d.getFullYear()}`;
};
// Parivar ke naam: akshar, space, comma, (), - , . allowed; ank aur < > @ # $ % ^ & * = _ [ ] { } ~ hata do
const sanitizeFamily = (v: string) => v.replace(/[<>@#$%^&*=_[\]{}~0-9\\|`"+/]/g, '').replace(/ {2,}/g, ' ').slice(0, 300);
// Pata / samay jaise free text: sirf code jaise chinh hatao (ank allowed — makan no., samay)
const sanitizeFreeText = (v: string, max: number) => v.replace(/[<>{}[\]~^`\\|]/g, '').slice(0, max);
const hasLetters = (v: string, min = 2) => (v.match(/\p{L}/gu) || []).length >= min;
const MAX_PAST_DAYS = 730; // dehavsan tithi 2 saal se purani nahi

// Photo na ho toh kisi anjaan vyakti ki stock photo nahi — saada diya placeholder
const NO_PHOTO =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><rect width="120" height="120" fill="#f1f5f9"/><text x="60" y="76" font-size="46" text-anchor="middle">🕯️</text></svg>'
  );

// Firestore document 1 MB tak — base64 photo ~33% badhti hai, isliye 700 KB tak
const MAX_PHOTO_BYTES = 700 * 1024;

export default function ShokSandeshPage() {
  const [activeTab, setActiveTab] = useState<'feed' | 'create'>('feed');
  // Kaunsa portal (?site= / domain / pichhla khola) — header ka logo aur home link isi ka
  const [portalSlug, setPortalSlug] = useState('the-local-leader');
  useEffect(() => {
    setPortalSlug(getActivePortal(new URLSearchParams(window.location.search).get('site')));
  }, []);
  const [posts, setPosts] = useState<ShokSandeshItem[]>([]);
  const [loading, setLoading] = useState(true);

  // 5 Canva Design Templates
  const [selectedTemplate, setSelectedTemplate] = useState<'floral-white' | 'golden-frame' | 'divine-blue' | 'rose-border' | 'classic-silver'>('floral-white');

  // Form Fields
  const [name, setName] = useState('');
  const [relation, setRelation] = useState('पिता जी');
  const [passedDate, setPassedDate] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventTime, setEventTime] = useState('अपराह्न 1:00 बजे के उपरांत');
  const [venue, setVenue] = useState('समस्त कार्यक्रम हमारे निवास स्थल से संपन्न होंगे');
  const [address, setAddress] = useState('');
  const [familyMembers, setFamilyMembers] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [submitAttempted, setSubmitAttempted] = useState(false);

  // Strict validation — galat data submit nahi hoga, error har field ke neeche
  const todayISO = toISODate(new Date());
  const minPassedISO = shiftISO(-MAX_PAST_DAYS);
  const maxEventISO = shiftISO(365);
  const nameOk = isValidName(name);
  const relationOk = !relation.trim() || isValidName(relation);
  const passedOk = !!passedDate && passedDate <= todayISO && passedDate >= minPassedISO;
  const eventOk = !eventDate || (eventDate <= maxEventISO && (!passedDate || eventDate >= passedDate));
  const addressOk = address.trim().length >= 5;
  const familyOk = hasLetters(familyMembers);
  const contactOk = !contactNumber || isValidIndianMobile(contactNumber);
  const formValid = nameOk && relationOk && passedOk && eventOk && addressOk && familyOk && contactOk;
  const showErr = (ok: boolean, value: string) => !ok && (submitAttempted || value.length > 0);

  // Image Upload Handling
  const [imageType, setImageType] = useState<'file' | 'url'>('file');
  const [photoUrl, setPhotoUrl] = useState('');
  const [imagePreview, setImagePreview] = useState<string>('');

  // Payment & Submit State
  const [hasMembership, setHasMembership] = useState(false);
  // Server-verified ₹199 payment ka ID (isi ID se shok sandesh banta hai)
  const [shokCredit, setShokCredit] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);

  // Razorpay Key Fallback
  const RAZORPAY_KEY = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_TZSA6UoKATong0';

  // Ensure Razorpay Script Loads reliably
  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (typeof window !== 'undefined' && window.Razorpay) {
        resolve(true);
        return;
      }
      const existing = document.getElementById('razorpay-checkout-js');
      if (existing) {
        existing.onload = () => resolve(true);
        existing.onerror = () => resolve(false);
        return;
      }
      const script = document.createElement('script');
      script.id = 'razorpay-checkout-js';
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  useEffect(() => {
    loadRazorpayScript();
  }, []);

  // 1. Fetch Approved Shok Sandesh from Firestore
  useEffect(() => {
    setLoading(true);
    const q = query(
      collection(db, 'shok_sandesh'),
      where('status', '==', 'approved')
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const liveList: ShokSandeshItem[] = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data()
      } as ShokSandeshItem));

      // Sirf asli (admin-approved) Firestore shok sandesh
      setPosts(liveList);
      setLoading(false);
    }, (err) => {
      console.error(err);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  // Check Local Membership Cache
  useEffect(() => {
    // Server-verified payment ka credit (ek payment = ek shok sandesh)
    const credit = localStorage.getItem('shok_payment_id');
    if (credit) {
      setShokCredit(credit);
      setHasMembership(true);
      return;
    }
    // Purana browser flag sirf tab jab server-verification chalu nahi
    if (!SECURE_AUTH && localStorage.getItem('shok_membership_active') === 'true') setHasMembership(true);
  }, []);

  // Local File to Base64
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('कृपया केवल फ़ोटो (JPG/PNG) चुनें।');
      e.target.value = '';
      return;
    }
    if (file.size > MAX_PHOTO_BYTES) {
      alert('कृपया 700 KB से छोटी फ़ोटो चुनें।');
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setImagePreview(base64);
      setPhotoUrl(base64);
    };
    reader.readAsDataURL(file);
  };

  // Razorpay Payment Handler (Fixed Instant Popup)
  const handleBuyPlan = async () => {
    setPaymentLoading(true);
    const isLoaded = await loadRazorpayScript();

    if (!isLoaded || !window.Razorpay) {
      setPaymentLoading(false);
      alert('इंटरनेट कनेक्टिविटी या स्क्रिप्ट लोड होने में समस्या आ रही है। कृपया एक बार पेज रिफ्रेश (F5) करें।');
      return;
    }

    try {
      const options = {
        key: RAZORPAY_KEY,
        amount: 199 * 100, // ₹199 in paise
        currency: 'INR',
        name: 'द लोकल लीडर डिजिटल मीडिया',
        description: 'शोक संदेश ई-श्रद्धांजलि प्रकाशन शुल्क',
        handler: async function (response: any) {
          // Server Razorpay se jaanch kar ek "credit" deta hai — usi payment ID se shok sandesh banta hai
          const confirmed = await confirmPayment('shok', response.razorpay_payment_id);
          setPaymentLoading(false);
          if (!confirmed.ok && !confirmed.fallback) {
            alert(`⚠️ ${confirmed.message}\nभुगतान ID: ${response.razorpay_payment_id || '—'}`);
            return;
          }
          alert('भुगतान सफल! अब आप अपना शोक संदेश सबमिट कर सकते हैं।');
          setHasMembership(true);
          if (confirmed.ok) {
            setShokCredit(response.razorpay_payment_id);
            localStorage.setItem('shok_payment_id', response.razorpay_payment_id);
          } else {
            localStorage.setItem('shok_membership_active', 'true');
          }
        },
        prefill: {
          contact: contactNumber || '9876543210'
        },
        theme: {
          color: '#b45309'
        },
        modal: {
          ondismiss: function () {
            setPaymentLoading(false);
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (resp: any) {
        setPaymentLoading(false);
        alert('भुगतान असफल रहा: ' + (resp.error?.description || 'कृपया पुनः प्रयास करें'));
      });
      rzp.open();
    } catch (e: any) {
      setPaymentLoading(false);
      alert('गेटवे खोलने में त्रुटि: ' + e.message);
    }
  };

  // Submit to Firestore for Admin Approval
  const handleSubmitShokSandesh = async (e: React.FormEvent) => {
    e.preventDefault();

    setSubmitAttempted(true);
    if (!formValid) {
      alert('कृपया लाल रंग में दिखाई गई जानकारी को सही करें।');
      return;
    }

    if (!hasMembership) {
      alert('शोक संदेश प्रकाशित करने हेतु पहले प्रकाशन प्लान (₹199) का भुगतान करें।');
      handleBuyPlan();
      return;
    }

    try {
      setSubmitting(true);

      const shokData = {
        name: name.trim(),
        relation: relation.trim(),
        passedDate: formatPassedDate(passedDate),
        passedDateISO: passedDate,
        eventDate: eventDate ? formatEventDate(eventDate) : 'शीघ्र सूचित किया जाएगा',
        eventDateISO: eventDate || null,
        eventTime: eventTime.trim(),
        venue: venue.trim(),
        address: address.trim(),
        familyMembers: familyMembers.trim().replace(/,\s*$/, ''),
        contactNumber: contactNumber,
        photoUrl: photoUrl || imagePreview,
        templateId: selectedTemplate,
        status: 'pending', // Awaiting Admin verification
        createdAt: serverTimestamp()
      };
      if (shokCredit) {
        // Payment ID hi document ID — ek payment par ek sandesh (Firestore rules payments/{id} jaanchte hain)
        await setDoc(doc(db, 'shok_sandesh', shokCredit), { ...shokData, paymentId: shokCredit });
        localStorage.removeItem('shok_payment_id');
        setShokCredit('');
        setHasMembership(false);
      } else {
        await addDoc(collection(db, 'shok_sandesh'), shokData);
      }

      alert('शोक संदेश सफलतापूर्वक सबमिट हो गया है! एडमिन द्वारा सत्यापन के बाद यह पोर्टल पर लाइव दिखेगा।');
      setActiveTab('feed');
      setSubmitting(false);
    } catch (err: any) {
      setSubmitting(false);
      alert('सबमिट करने में त्रुटि: ' + err.message);
    }
  };

  // RENDER 5 UNIQUE CANVA TEMPLATE DESIGNS
  const renderCard = (data: Partial<ShokSandeshItem>, isPreview: boolean = false) => {
    const tId = data.templateId || 'floral-white';

    // 1. TEMPLATE: FLORAL WHITE
    if (tId === 'floral-white') {
      return (
        <div style={{
          width: '100%',
          maxWidth: isPreview ? '100%' : '480px',
          margin: '0 auto',
          background: '#ffffff',
          borderRadius: '16px',
          border: '1.5px solid #e2e8f0',
          boxShadow: '0 8px 30px rgba(0,0,0,0.06)',
          padding: '28px 24px',
          boxSizing: 'border-box',
          textAlign: 'center',
          position: 'relative',
          fontFamily: '"Mukta", system-ui, sans-serif'
        }}>
          <div style={{ position: 'absolute', top: '10px', left: '12px', fontSize: '20px', opacity: 0.8 }}>🌸</div>
          <div style={{ position: 'absolute', top: '10px', right: '12px', fontSize: '20px', opacity: 0.8 }}>🌸</div>
          <div style={{ position: 'absolute', bottom: '10px', left: '12px', fontSize: '20px', opacity: 0.8 }}>🌿</div>
          <div style={{ position: 'absolute', bottom: '10px', right: '12px', fontSize: '20px', opacity: 0.8 }}>🌿</div>

          <div style={{ fontSize: '13px', fontWeight: 700, color: '#475569', letterSpacing: '1px', marginBottom: '14px' }}>
            ॥ ॐ शान्तिः शान्तिः शान्तिः ॥
          </div>

          <div style={{ width: '130px', height: '130px', margin: '0 auto 16px', borderRadius: '50%', padding: '4px', background: '#fff', border: '3.5px solid #d97706', boxShadow: '0 4px 14px rgba(217,119,6,0.2)', overflow: 'hidden' }}>
            <img src={data.photoUrl || imagePreview || NO_PHOTO} alt={data.name || 'स्वर्गीय'} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', margin: '0 0 10px' }}>
            <span style={{ fontSize: '18px' }}>🙏</span>
            <h3 style={{ fontSize: '21px', fontWeight: 800, color: '#0f172a', margin: 0, fontFamily: 'Georgia, serif' }}>
              ॥ भावपूर्ण श्रद्धांजलि ॥
            </h3>
            <span style={{ fontSize: '18px' }}>🙏</span>
          </div>

          <p style={{ fontSize: '13.5px', color: '#334155', lineHeight: 1.7, margin: '0 0 16px' }}>
            अत्यंत दुःख के साथ सूचित करना पड़ रहा है कि हमारे श्रद्धेय {data.relation || 'स्वजन'}, <br />
            <b style={{ fontSize: '18px', color: '#92400e', fontWeight: 800 }}>स्व० श्री {data.name || 'दिवंगत का नाम'}</b> <br />
            का स्वर्गवास {data.passedDate || '—'} को हो गया है। <br />
            <span style={{ fontSize: '12.5px', color: '#64748b' }}>
              उनकी दिवंगत आत्मा की शांति हेतु आयोजित कार्यक्रम में सम्मिलित होकर हमें कृतार्थ करें।
            </span>
          </p>

          <div style={{ background: '#fffbeb', border: '1px dashed #f59e0b', borderRadius: '10px', padding: '12px 14px', marginBottom: '16px' }}>
            <div style={{ fontSize: '15px', fontWeight: 700, color: '#92400e', marginBottom: '4px' }}>॥ तेरहवीं / पगड़ी कार्यक्रम ॥</div>
            <div style={{ fontSize: '13px', color: '#78350f' }}><b>दिनांक:</b> {data.eventDate || '—'} | <b>समय:</b> {data.eventTime || '—'}</div>
            <div style={{ fontSize: '12px', color: '#451a03', marginTop: '4px' }}><b>स्थान:</b> {data.address || 'निवास स्थल'}</div>
          </div>

          <div style={{ fontSize: '20px', letterSpacing: '6px', margin: '8px 0 14px' }}>🪔 🪔 🪔</div>

          <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '10px' }}>
            <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#0f172a', marginBottom: '4px' }}>॥ शोकाकुल परिवार ॥</div>
            <div style={{ fontSize: '12.5px', color: '#475569' }}>{data.familyMembers || 'समस्त शोक संतप्त परिवार'}</div>
            {data.contactNumber && <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '4px' }}>मो. {data.contactNumber}</div>}
          </div>
        </div>
      );
    }

    // 2. TEMPLATE: GOLDEN FRAME
    if (tId === 'golden-frame') {
      return (
        <div style={{
          width: '100%',
          maxWidth: isPreview ? '100%' : '480px',
          margin: '0 auto',
          background: '#fffdfa',
          borderRadius: '16px',
          border: '4px double #b45309',
          boxShadow: '0 8px 30px rgba(180,83,9,0.08)',
          padding: '24px 20px',
          boxSizing: 'border-box',
          textAlign: 'center',
          fontFamily: '"Mukta", system-ui, sans-serif'
        }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#78350f', letterSpacing: '1px', marginBottom: '14px' }}>
            ॥ ॐ शांति ॐ ॥
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '14px', marginBottom: '14px' }}>
            <span style={{ fontSize: '22px' }}>🕯️</span>
            <div style={{ width: '120px', height: '145px', border: '3px solid #b45309', padding: '3px', background: '#fff', borderRadius: '4px', overflow: 'hidden' }}>
              <img src={data.photoUrl || imagePreview || NO_PHOTO} alt={data.name || 'स्वर्गीय'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <span style={{ fontSize: '22px' }}>🕯️</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', margin: '0 0 10px' }}>
            <span style={{ fontSize: '16px' }}>🕊️</span>
            <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#78350f', margin: 0, fontFamily: 'Georgia, serif' }}>
              ॥ विनम्र श्रद्धांजलि ॥
            </h3>
            <span style={{ fontSize: '16px' }}>🕊️</span>
          </div>

          <p style={{ fontSize: '13.5px', color: '#451a03', lineHeight: 1.65, margin: '0 0 14px' }}>
            अत्यंत दुःख के साथ सूचित करना पड़ रहा है कि हमारी पूजनीय {data.relation || 'स्वजन'}, <br />
            <b style={{ fontSize: '18px', color: '#9a3412', fontWeight: 800 }}>स्व० {data.name || 'दिवंगत का नाम'}</b> <br />
            का स्वर्गवास {data.passedDate || '—'} को हो गया है।
          </p>

          <div style={{ background: '#fef3c7', borderRadius: '8px', padding: '12px', marginBottom: '14px', border: '1px solid #fde68a' }}>
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#78350f' }}>ब्राह्मण भोज एवं प्रसाद</div>
            <div style={{ fontSize: '12.5px', color: '#92400e', marginTop: '2px' }}>दिनांक: {data.eventDate || '—'} | {data.eventTime || '—'}</div>
            <div style={{ fontSize: '12px', color: '#78350f', marginTop: '4px' }}>स्थान: {data.address || 'निवास स्थल'}</div>
          </div>

          <div style={{ fontSize: '20px', letterSpacing: '6px', margin: '6px 0 12px' }}>🪔 🪔 🪔</div>

          <div style={{ borderTop: '1px dashed #d97706', paddingTop: '10px' }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#78350f' }}>॥ शोकाकुल परिवार ॥</div>
            <div style={{ fontSize: '12px', color: '#451a03', marginTop: '2px' }}>{data.familyMembers || 'समस्त शोक संतप्त परिवार'}</div>
            {data.contactNumber && <div style={{ fontSize: '11px', color: '#78350f', marginTop: '2px' }}>संपर्क: {data.contactNumber}</div>}
          </div>
        </div>
      );
    }

    // 3. TEMPLATE: DIVINE BLUE
    if (tId === 'divine-blue') {
      return (
        <div style={{
          width: '100%',
          maxWidth: isPreview ? '100%' : '480px',
          margin: '0 auto',
          background: 'linear-gradient(180deg, #eff6ff 0%, #dbeafe 50%, #f8fafc 100%)',
          borderRadius: '16px',
          border: '2px solid #93c5fd',
          boxShadow: '0 8px 30px rgba(59,130,246,0.08)',
          padding: '26px 20px',
          boxSizing: 'border-box',
          textAlign: 'center',
          fontFamily: '"Mukta", system-ui, sans-serif'
        }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#1e40af', letterSpacing: '1px', marginBottom: '14px' }}>
            ॥ शोक संदेश ॥
          </div>

          <div style={{ width: '130px', height: '130px', margin: '0 auto 14px', borderRadius: '50%', padding: '4px', background: '#fff', border: '3px solid #3b82f6', overflow: 'hidden' }}>
            <img src={data.photoUrl || imagePreview || NO_PHOTO} alt={data.name || 'स्वर्गीय'} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
          </div>

          <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#1e3a8a', margin: '0 0 10px', fontFamily: 'Georgia, serif' }}>
            ॥ अश्रुपूरित श्रद्धांजलि ॥
          </h3>

          <p style={{ fontSize: '13.5px', color: '#1e293b', lineHeight: 1.65, margin: '0 0 14px' }}>
            अत्यंत दुःख के साथ सूचित करना पड़ रहा है कि हमारी {data.relation || 'स्वजन'}, <br />
            <b style={{ fontSize: '18px', color: '#1d4ed8', fontWeight: 800 }}>स्व० श्रीमती {data.name || 'दिवंगत का नाम'}</b> <br />
            का स्वर्गवास {data.passedDate || '—'} को हो गया है।
          </p>

          <div style={{ background: '#ffffff', borderRadius: '10px', padding: '12px', border: '1px solid #bfdbfe', marginBottom: '14px' }}>
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#1e40af' }}>॥ श्राद्ध एवं पगड़ी कार्यक्रम ॥</div>
            <div style={{ fontSize: '12.5px', color: '#334155', marginTop: '2px' }}>दिनांक: {data.eventDate || '—'} | {data.eventTime || '—'}</div>
            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>स्थान: {data.address || 'निवास स्थल'}</div>
          </div>

          <div style={{ fontSize: '20px', letterSpacing: '6px', margin: '6px 0 12px' }}>🪔 🪔 🪔</div>

          <div style={{ borderTop: '1px solid #bfdbfe', paddingTop: '10px' }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#1e3a8a' }}>॥ शोकाकुल परिवार ॥</div>
            <div style={{ fontSize: '12px', color: '#334155', marginTop: '2px' }}>{data.familyMembers || 'समस्त शोक संतप्त परिवार'}</div>
            {data.contactNumber && <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>मो. {data.contactNumber}</div>}
          </div>
        </div>
      );
    }

    // 4. TEMPLATE: ROSE FLORAL BORDER
    if (tId === 'rose-border') {
      return (
        <div style={{
          width: '100%',
          maxWidth: isPreview ? '100%' : '480px',
          margin: '0 auto',
          background: '#ffffff',
          borderRadius: '16px',
          border: '6px solid #fecdd3',
          boxShadow: '0 8px 30px rgba(244,63,94,0.08)',
          padding: '24px 20px',
          boxSizing: 'border-box',
          textAlign: 'center',
          fontFamily: '"Mukta", system-ui, sans-serif'
        }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#be123c', letterSpacing: '1px', marginBottom: '14px' }}>
            ॥ ॐ शान्तिः शान्तिः शान्तिः ॥
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '14px' }}>
            <span>🌸</span>
            <div style={{ width: '120px', height: '145px', border: '3px solid #e11d48', padding: '3px', borderRadius: '6px', overflow: 'hidden' }}>
              <img src={data.photoUrl || imagePreview || NO_PHOTO} alt={data.name || 'स्वर्गीय'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <span>🌸</span>
          </div>

          <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#9f1239', margin: '0 0 10px', fontFamily: 'Georgia, serif' }}>
            ॥ भावभीनी श्रद्धांजलि ॥
          </h3>

          <p style={{ fontSize: '13.5px', color: '#334155', lineHeight: 1.65, margin: '0 0 14px' }}>
            अत्यंत दुःख के साथ सूचित करना पड़ रहा है कि हमारे पूजनीय {data.relation || 'स्वजन'}, <br />
            <b style={{ fontSize: '18px', color: '#be123c', fontWeight: 800 }}>स्व० श्री {data.name || 'दिवंगत का नाम'}</b> <br />
            का स्वर्गवास {data.passedDate || '—'} को हो गया है।
          </p>

          <div style={{ background: '#fff1f2', borderRadius: '10px', padding: '12px', border: '1px solid #fecdd3', marginBottom: '14px' }}>
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#9f1239' }}>॥ ब्राह्मण भोज एवं पगड़ी ॥</div>
            <div style={{ fontSize: '12.5px', color: '#4c0519', marginTop: '2px' }}>दिनांक: {data.eventDate || '—'} | {data.eventTime || '—'}</div>
            <div style={{ fontSize: '12px', color: '#881337', marginTop: '4px' }}>स्थान: {data.address || 'निवास स्थल'}</div>
          </div>

          <div style={{ fontSize: '20px', letterSpacing: '6px', margin: '6px 0 12px' }}>🪔 🪔 🪔</div>

          <div style={{ borderTop: '1px solid #fecdd3', paddingTop: '10px' }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#9f1239' }}>॥ शोकाकुल परिवार ॥</div>
            <div style={{ fontSize: '12px', color: '#334155', marginTop: '2px' }}>{data.familyMembers || 'समस्त शोक संतप्त परिवार'}</div>
            {data.contactNumber && <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>मो. {data.contactNumber}</div>}
          </div>
        </div>
      );
    }

    // 5. TEMPLATE: CLASSIC SILVER
    return (
      <div style={{
        width: '100%',
        maxWidth: isPreview ? '100%' : '480px',
        margin: '0 auto',
        background: 'linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)',
        borderRadius: '16px',
        border: '2px solid #cbd5e1',
        boxShadow: '0 8px 30px rgba(0,0,0,0.06)',
        padding: '24px 20px',
        boxSizing: 'border-box',
        textAlign: 'center',
        fontFamily: '"Mukta", system-ui, sans-serif'
      }}>
        <div style={{ fontSize: '13px', fontWeight: 700, color: '#475569', letterSpacing: '1px', marginBottom: '14px' }}>
          ॥ ॐ शान्तिः शान्तिः शान्तिः ॥
        </div>

        <div style={{ width: '130px', height: '130px', margin: '0 auto 14px', borderRadius: '50%', padding: '4px', background: '#fff', border: '3px solid #64748b', overflow: 'hidden' }}>
          <img src={data.photoUrl || imagePreview || NO_PHOTO} alt={data.name || 'स्वर्गीय'} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
        </div>

        <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', margin: '0 0 10px', fontFamily: 'Georgia, serif' }}>
          ॥ भावपूर्ण श्रद्धांजलि ॥
        </h3>

        <p style={{ fontSize: '13.5px', color: '#334155', lineHeight: 1.65, margin: '0 0 14px' }}>
          अत्यंत दुःख के साथ सूचित करना पड़ रहा है कि हमारे श्रद्धेय {data.relation || 'स्वजन'}, <br />
          <b style={{ fontSize: '18px', color: '#0f172a', fontWeight: 800 }}>स्व० श्री {data.name || 'दिवंगत का नाम'}</b> <br />
          का स्वर्गवास {data.passedDate || '—'} को हो गया है।
        </p>

        <div style={{ background: '#ffffff', borderRadius: '10px', padding: '12px', border: '1px solid #e2e8f0', marginBottom: '14px' }}>
          <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>॥ तेरहवीं कार्यक्रम ॥</div>
          <div style={{ fontSize: '12.5px', color: '#475569', marginTop: '2px' }}>दिनांक: {data.eventDate || '—'} | {data.eventTime || '—'}</div>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>स्थान: {data.address || 'निवास स्थल'}</div>
        </div>

        <div style={{ fontSize: '20px', letterSpacing: '6px', margin: '6px 0 12px' }}>🪔 🪔 🪔</div>

        <div style={{ borderTop: '1px solid #cbd5e1', paddingTop: '10px' }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>॥ शोकाकुल परिवार ॥</div>
          <div style={{ fontSize: '12px', color: '#475569', marginTop: '2px' }}>{data.familyMembers || 'समस्त शोक संतप्त परिवार'}</div>
          {data.contactNumber && <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>मो. {data.contactNumber}</div>}
        </div>
      </div>
    );
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', color: '#1e293b', fontFamily: '"Mukta", system-ui, sans-serif' }}>
      
      {/* Top Banner Header */}
      <header style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #e2e8f0', padding: '16px 24px', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Portal ka logo — click karne par isi portal ka homepage */}
            <Link href={`/?site=${portalSlug}`} aria-label={`${fallbackFor(portalSlug).name} होम`} title={fallbackFor(portalSlug).name} style={{ display: 'inline-flex', flexShrink: 0 }}>
              <img src={fallbackFor(portalSlug).logoUrl} alt={fallbackFor(portalSlug).name} style={{ height: '54px', width: 'auto', maxWidth: '140px', objectFit: 'contain', borderRadius: '6px' }} />
            </Link>
            <span style={{ width: '1px', height: '34px', background: '#e2e8f0' }} />
            <span style={{ fontSize: '24px' }}>🕯️</span>
            <div>
              <h1 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', margin: 0 }}>श्रद्धांजलि एवं शोक संदेश पोर्टल</h1>
              <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>डिजिटल श्रद्धांजलि कार्ड एवं दिवंगत स्वजनों के स्मृति संदेश</p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <Link href={`/?site=${portalSlug}`} style={{ fontSize: '13px', color: '#ea580c', textDecoration: 'none', fontWeight: 600, padding: '8px 12px' }}>
              ← होम पेज पर लौटें
            </Link>

            <button
              onClick={() => setActiveTab('create')}
              style={{
                backgroundColor: '#b45309',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                padding: '9px 18px',
                fontSize: '13.5px',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(180,83,9,0.2)'
              }}
            >
              + शोक संदेश प्रकाशित करें
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <AdLayout>
      <div style={{ padding: '20px 0 40px' }}>

        {/* Tab Navigation */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
          <button
            onClick={() => setActiveTab('feed')}
            style={{
              backgroundColor: activeTab === 'feed' ? '#0f172a' : '#ffffff',
              color: activeTab === 'feed' ? '#ffffff' : '#64748b',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              padding: '8px 18px',
              fontSize: '13.5px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            सभी शोक संदेश ({posts.length})
          </button>

          <button
            onClick={() => setActiveTab('create')}
            style={{
              backgroundColor: activeTab === 'create' ? '#0f172a' : '#ffffff',
              color: activeTab === 'create' ? '#ffffff' : '#64748b',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              padding: '8px 18px',
              fontSize: '13.5px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            नया कार्ड बनाएँ
          </button>
        </div>

        {/* ── 1. PUBLIC FEED TAB ── */}
        {activeTab === 'feed' && (
          <div>
            {loading ? (
              <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>शोक संदेश लोड हो रहे हैं...</div>
            ) : posts.length === 0 ? (
              <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '60px 20px', textAlign: 'center' }}>
                <span style={{ fontSize: '32px' }}>🕊️</span>
                <h3 style={{ fontSize: '18px', color: '#0f172a', margin: '12px 0 6px' }}>कोई शोक संदेश उपलब्ध नहीं है</h3>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px' }}>
                {posts.map((item, pi) => (
                  <React.Fragment key={item.id}>
                    <div>{renderCard(item)}</div>
                    {/* Shok card lambe hain (ek line me 2) — har line (2 sandesh) ke baad ek banner vigyapan */}
                    {(pi + 1) % 2 === 0 && pi < posts.length - 1 && <AdInline index={(pi + 1) / 2 - 1} />}
                  </React.Fragment>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── 2. CREATE CARD (5 CANVA TEMPLATE SELECTOR) ── */}
        {activeTab === 'create' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '32px', alignItems: 'flex-start' }}>
            
            {/* Form */}
            <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '28px', boxShadow: '0 4px 14px rgba(0,0,0,0.04)' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', margin: '0 0 6px' }}>शोक संदेश कार्ड विवरण भरें</h2>
              <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 20px' }}>
                नीचे से अपना मनपसंद टेम्पलेट चुनें और विवरण भरें। दाईं ओर लाइव प्रीव्यू दिखेगा।
              </p>

              {/* 5 Canva Template Chooser */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '8px' }}>
                  कार्ड डिज़ाइन टेम्पलेट चुनें (5 Canva Styles):
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px' }}>
                  
                  <button
                    type="button"
                    onClick={() => setSelectedTemplate('floral-white')}
                    style={{
                      padding: '10px 8px',
                      borderRadius: '8px',
                      border: selectedTemplate === 'floral-white' ? '2px solid #b45309' : '1px solid #cbd5e1',
                      background: selectedTemplate === 'floral-white' ? '#fef3c7' : '#f8fafc',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    🌸 पारंपरिक पुष्प
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedTemplate('golden-frame')}
                    style={{
                      padding: '10px 8px',
                      borderRadius: '8px',
                      border: selectedTemplate === 'golden-frame' ? '2px solid #b45309' : '1px solid #cbd5e1',
                      background: selectedTemplate === 'golden-frame' ? '#fef3c7' : '#f8fafc',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    ✨ स्वर्ण फ्रेम
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedTemplate('divine-blue')}
                    style={{
                      padding: '10px 8px',
                      borderRadius: '8px',
                      border: selectedTemplate === 'divine-blue' ? '2px solid #b45309' : '1px solid #cbd5e1',
                      background: selectedTemplate === 'divine-blue' ? '#fef3c7' : '#f8fafc',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    🕊️ आकाशीय किरणें
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedTemplate('rose-border')}
                    style={{
                      padding: '10px 8px',
                      borderRadius: '8px',
                      border: selectedTemplate === 'rose-border' ? '2px solid #b45309' : '1px solid #cbd5e1',
                      background: selectedTemplate === 'rose-border' ? '#fef3c7' : '#f8fafc',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    🌹 पुष्प माला फ्रेम
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedTemplate('classic-silver')}
                    style={{
                      padding: '10px 8px',
                      borderRadius: '8px',
                      border: selectedTemplate === 'classic-silver' ? '2px solid #b45309' : '1px solid #cbd5e1',
                      background: selectedTemplate === 'classic-silver' ? '#fef3c7' : '#f8fafc',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    ⚪ सिल्वर सादा
                  </button>

                </div>
              </div>

              <form onSubmit={handleSubmitShokSandesh} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                
                {/* Photo Upload */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <label style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>दिवंगत स्वजन की फ़ोटो *</label>
                    <div style={{ display: 'flex', gap: '6px', fontSize: '12px' }}>
                      <button
                        type="button"
                        onClick={() => setImageType('file')}
                        style={{ background: 'none', border: 'none', color: imageType === 'file' ? '#b45309' : '#64748b', fontWeight: imageType === 'file' ? 700 : 400, cursor: 'pointer' }}
                      >
                        डिवाइस से फ़ाइल
                      </button>
                      <span style={{ color: '#cbd5e1' }}>|</span>
                      <button
                        type="button"
                        onClick={() => setImageType('url')}
                        style={{ background: 'none', border: 'none', color: imageType === 'url' ? '#b45309' : '#64748b', fontWeight: imageType === 'url' ? 700 : 400, cursor: 'pointer' }}
                      >
                        वेब URL
                      </button>
                    </div>
                  </div>

                  {imageType === 'file' ? (
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#f8fafc', border: '1.5px solid #cbd5e1', borderRadius: '8px', padding: '8px 12px', fontSize: '13px' }}
                    />
                  ) : (
                    <input
                      type="url"
                      placeholder="https://example.com/photo.jpg"
                      value={photoUrl}
                      onChange={(e) => {
                        setPhotoUrl(e.target.value);
                        setImagePreview(e.target.value);
                      }}
                      style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#f8fafc', border: '1.5px solid #cbd5e1', borderRadius: '8px', padding: '10px 12px', fontSize: '13px' }}
                    />
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>स्वर्गीय का पूरा नाम *</label>
                    <input
                      type="text"
                      required
                      placeholder="उदा. रामनारायण प्रसाद जी"
                      value={name}
                      maxLength={60}
                      onChange={(e) => setName(sanitizeName(e.target.value))}
                      aria-invalid={showErr(nameOk, name)}
                      style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#f8fafc', border: `1.5px solid ${showErr(nameOk, name) ? '#dc2626' : '#cbd5e1'}`, borderRadius: '8px', padding: '9px 12px', fontSize: '13.5px' }}
                    />
                    {showErr(nameOk, name) && <span style={{ display: 'block', marginTop: '4px', fontSize: '11.5px', color: '#dc2626' }}>{VALIDATION_MSG.name}</span>}
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>संबंध / नाता</label>
                    <input
                      type="text"
                      placeholder="उदा. हमारे पूज्य पिता जी"
                      value={relation}
                      maxLength={40}
                      onChange={(e) => setRelation(sanitizeName(e.target.value))}
                      aria-invalid={showErr(relationOk, relation)}
                      style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#f8fafc', border: `1.5px solid ${showErr(relationOk, relation) ? '#dc2626' : '#cbd5e1'}`, borderRadius: '8px', padding: '9px 12px', fontSize: '13.5px' }}
                    />
                    {showErr(relationOk, relation) && <span style={{ display: 'block', marginTop: '4px', fontSize: '11.5px', color: '#dc2626' }}>संबंध में केवल अक्षर लिखें (अंक या विशेष चिह्न नहीं)</span>}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>स्वर्गवास तिथि *</label>
                    <input
                      type="date"
                      required
                      min={minPassedISO}
                      max={todayISO}
                      value={passedDate}
                      onChange={(e) => setPassedDate(e.target.value)}
                      aria-invalid={showErr(passedOk, passedDate)}
                      style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#f8fafc', border: `1.5px solid ${showErr(passedOk, passedDate) ? '#dc2626' : '#cbd5e1'}`, borderRadius: '8px', padding: '9px 12px', fontSize: '13.5px' }}
                    />
                    {showErr(passedOk, passedDate) && <span style={{ display: 'block', marginTop: '4px', fontSize: '11.5px', color: '#dc2626' }}>{passedDate > todayISO ? 'स्वर्गवास तिथि भविष्य की नहीं हो सकती' : 'कृपया कैलेंडर से सही स्वर्गवास तिथि चुनें'}</span>}
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>तेरहवीं / श्रद्धांजलि तिथि</label>
                    <input
                      type="date"
                      min={passedDate || minPassedISO}
                      max={maxEventISO}
                      value={eventDate}
                      onChange={(e) => setEventDate(e.target.value)}
                      aria-invalid={showErr(eventOk, eventDate)}
                      style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#f8fafc', border: `1.5px solid ${showErr(eventOk, eventDate) ? '#dc2626' : '#cbd5e1'}`, borderRadius: '8px', padding: '9px 12px', fontSize: '13.5px' }}
                    />
                    {showErr(eventOk, eventDate) && <span style={{ display: 'block', marginTop: '4px', fontSize: '11.5px', color: '#dc2626' }}>{passedDate && eventDate < passedDate ? 'यह तिथि स्वर्गवास तिथि के बाद की होनी चाहिए' : 'कृपया कैलेंडर से सही तिथि चुनें'}</span>}
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>कार्यक्रम का समय</label>
                  <input
                    type="text"
                    value={eventTime}
                    maxLength={120}
                    onChange={(e) => setEventTime(sanitizeFreeText(e.target.value, 120))}
                    style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#f8fafc', border: '1.5px solid #cbd5e1', borderRadius: '8px', padding: '9px 12px', fontSize: '13.5px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>कार्यक्रम स्थल एवं पता *</label>
                  <textarea
                    rows={2}
                    required
                    placeholder="उदा. 545 क/19, राजाजीपुरम, लखनऊ"
                    value={address}
                    maxLength={200}
                    onChange={(e) => setAddress(sanitizeFreeText(e.target.value, 200))}
                    aria-invalid={showErr(addressOk, address)}
                    style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#f8fafc', border: `1.5px solid ${showErr(addressOk, address) ? '#dc2626' : '#cbd5e1'}`, borderRadius: '8px', padding: '9px 12px', fontSize: '13px' }}
                  />
                    {showErr(addressOk, address) && <span style={{ display: 'block', marginTop: '4px', fontSize: '11.5px', color: '#dc2626' }}>कृपया कार्यक्रम स्थल का पूरा पता लिखें</span>}
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>शोकाकुल परिवार के नाम *</label>
                  <textarea
                    rows={2}
                    required
                    placeholder="उदा. संदीप, मनीष, प्रवीण (पुत्र) एवं समस्त परिवार"
                    value={familyMembers}
                    maxLength={300}
                    onChange={(e) => setFamilyMembers(sanitizeFamily(e.target.value))}
                    aria-invalid={showErr(familyOk, familyMembers)}
                    style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#f8fafc', border: `1.5px solid ${showErr(familyOk, familyMembers) ? '#dc2626' : '#cbd5e1'}`, borderRadius: '8px', padding: '9px 12px', fontSize: '13px' }}
                  />
                    {showErr(familyOk, familyMembers) && <span style={{ display: 'block', marginTop: '4px', fontSize: '11.5px', color: '#dc2626' }}>कृपया शोकाकुल परिवार के नाम लिखें (अंक या विशेष चिह्न नहीं)</span>}
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>संपर्क नंबर (Mobile Number)</label>
                  <input
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    placeholder="उदा. 9829012345"
                    value={contactNumber}
                    onChange={(e) => setContactNumber(e.target.value.replace(/[^0-9]/g, '').slice(0, 10))}
                    aria-invalid={showErr(contactOk, contactNumber)}
                    style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#f8fafc', border: `1.5px solid ${showErr(contactOk, contactNumber) ? '#dc2626' : '#cbd5e1'}`, borderRadius: '8px', padding: '9px 12px', fontSize: '13.5px' }}
                  />
                    {showErr(contactOk, contactNumber) && <span style={{ display: 'block', marginTop: '4px', fontSize: '11.5px', color: '#dc2626' }}>{VALIDATION_MSG.mobile}</span>}
                </div>

                {/* Membership Payment Status Bar */}
                <div style={{ backgroundColor: '#fef3c7', border: '1px solid #fde68a', borderRadius: '8px', padding: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                  <div>
                    <b style={{ fontSize: '13px', color: '#92400e' }}>प्रकाशन शुल्क स्थिति:</b>
                    <div style={{ fontSize: '11.5px', color: '#b45309' }}>
                      {hasMembership ? '✓ ₹199 शुल्क भुगतान सत्यापित' : 'कार्ड सबमिट करने हेतु ₹199 प्रकाशन शुल्क लगेगा'}
                    </div>
                  </div>
                  {!hasMembership && (
                    <button
                      type="button"
                      disabled={paymentLoading}
                      onClick={handleBuyPlan}
                      style={{
                        backgroundColor: '#b45309',
                        color: '#fff',
                        border: 'none',
                        padding: '8px 16px',
                        borderRadius: '6px',
                        fontSize: '12.5px',
                        fontWeight: 700,
                        cursor: paymentLoading ? 'not-allowed' : 'pointer',
                        opacity: paymentLoading ? 0.7 : 1
                      }}
                    >
                      {paymentLoading ? 'लोड हो रहा है...' : 'भुगतान करें (₹199)'}
                    </button>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    backgroundColor: '#0f172a',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '12px',
                    fontSize: '14.5px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    marginTop: '8px',
                    boxShadow: '0 4px 12px rgba(15,23,42,0.15)'
                  }}
                >
                  {submitting ? 'सत्यापन हेतु भेजा जा रहा है...' : 'शोक संदेश सबमिट करें (Admin Review)'}
                </button>

              </form>
            </div>

            {/* Right: Live Card Preview matching User Screenshot */}
            <div style={{ position: 'sticky', top: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#64748b' }}>लाइव कार्ड प्रीव्यू (Card Preview)</span>
                <span style={{ fontSize: '11px', backgroundColor: '#e2e8f0', padding: '3px 8px', borderRadius: '12px', color: '#475569' }}>
                  टेम्पलेट: {selectedTemplate}
                </span>
              </div>

              {renderCard({
                name,
                relation,
                passedDate: passedDate ? formatPassedDate(passedDate) : '',
                eventDate: eventDate ? formatEventDate(eventDate) : '',
                eventTime,
                venue,
                address,
                familyMembers,
                contactNumber,
                photoUrl: imagePreview,
                templateId: selectedTemplate
              }, true)}
            </div>

          </div>
        )}

      </div>
      </AdLayout>
    </div>
  );
}