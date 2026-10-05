import { addDoc, collection, doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

/*
 * DPDP Act 2023 + DPDP Rules 2025 — notice aur sahmati (consent).
 *  - Har role (pathak / patrakar / vigyapandata) ka alag notice: kaunsa data, kis kaam ke liye, kitne samay, kise diya jaata hai
 *  - Zaroori sahmati alag, marketing (vaikalpik) alag — dono checkbox pehle se tick nahi
 *  - Har sahmati ka record: consents (log) + profile par consent {version, acceptedAt, marketing}
 * Notice badle toh CONSENT_VERSION badhao — sabse dobara sahmati li jaayegi.
 */

export const CONSENT_VERSION = '2026-10-v1';
export const DATA_FIDUCIARY = 'Golden Pearl News Network';
export const GRIEVANCE_EMAIL = 'goldenpearlnews@gmail.com';
export const GRIEVANCE_PHONE = '+91 8103333381';

export type ConsentRole = 'reader' | 'patrakar' | 'advertiser';

export interface RoleNotice {
  title: string;
  data: string[];
  purposes: string[];
  publicInfo?: string;
  retention: string;
}

export const ROLE_NOTICE: Record<ConsentRole, RoleNotice> = {
  reader: {
    title: 'पाठक खाता',
    data: ['नाम, मोबाइल नंबर, ईमेल', 'रेफरल कोड और रेफरल इतिहास', 'ई-पेपर सब्सक्रिप्शन और भुगतान संदर्भ (कार्ड/UPI विवरण हम नहीं रखते)', 'आपकी टिप्पणियां'],
    purposes: [
      'OTP से खाता बनाना और लॉगिन',
      'ई-पेपर सब्सक्रिप्शन और रेफरल रिवॉर्ड देना',
      'आपकी टिप्पणियां प्रकाशित करना (सिर्फ नाम दिखता है)',
      'खबरों/सेवाओं की सूचनाएं (नोटिफिकेशन) भेजना',
      'धोखाधड़ी रोकना और खाते की सुरक्षा'
    ],
    retention: 'खाता हटाने तक; भुगतान रिकॉर्ड कर/कानूनी आवश्यकता हेतु 8 वर्ष तक।'
  },
  patrakar: {
    title: 'पत्रकार खाता',
    data: [
      'नाम, मोबाइल नंबर, ईमेल, शहर/कार्यक्षेत्र',
      'फ़ोटो और ब्लड ग्रुप (वैकल्पिक, सिर्फ प्रेस आईडी कार्ड के लिए)',
      'प्रेस आईडी नंबर, भेजी गई खबरें',
      'मेंबरशिप/डिलीवरी भुगतान संदर्भ और डिलीवरी का पता'
    ],
    purposes: [
      'आवेदन की जांच और स्वीकृति',
      'प्रेस आईडी कार्ड और प्राधिकरण पत्र जारी करना',
      'आपकी खबरें आपके नाम (बायलाइन) के साथ प्रकाशित करना',
      'मेंबरशिप भुगतान और कार्ड की डिलीवरी',
      'संपादकीय टीम से संपर्क'
    ],
    publicInfo: 'प्रेस आईडी के QR सत्यापन पेज पर आपका नाम, फ़ोटो, पदनाम, पोर्टल, कार्यक्षेत्र और वैधता सार्वजनिक रूप से दिखती है — ताकि कोई भी कार्ड की असलियत जांच सके।',
    retention: 'खाता हटाने तक; प्रकाशित खबरें बनी रह सकती हैं; भुगतान रिकॉर्ड 8 वर्ष तक।'
  },
  advertiser: {
    title: 'विज्ञापनदाता खाता',
    data: ['नाम, कंपनी/व्यवसाय का नाम, मोबाइल नंबर, ईमेल', 'विज्ञापन सामग्री (बैनर, लिंक) और विज्ञापन आंकड़े', 'भुगतान संदर्भ और बिलिंग जानकारी'],
    purposes: ['OTP से खाता और लॉगिन', 'विज्ञापन/क्लासिफ़ाइड बुकिंग, जांच और प्रकाशन', 'भुगतान, बिल/इनवॉइस', 'विज्ञापन से जुड़ा संपर्क और रिपोर्ट'],
    retention: 'खाता हटाने तक; बिल/भुगतान रिकॉर्ड 8 वर्ष तक।'
  }
};

export const SHARED_WITH = [
  'Google Firebase — डेटा स्टोरेज (सुरक्षित सर्वर)',
  'Razorpay — भुगतान (कार्ड/UPI विवरण सीधे Razorpay के पास)'
];

export const RIGHTS = [
  'अपने डेटा की जानकारी मांगना (कौन सा डेटा, किस काम के लिए)',
  'गलत या अधूरी जानकारी सुधरवाना',
  'खाता और डेटा हटवाना',
  'सहमति कभी भी वापस लेना — उतना ही आसान जितना देना',
  'शिकायत करना, और संतुष्ट न होने पर भारत के डेटा संरक्षण बोर्ड (Data Protection Board of India) से शिकायत',
  'मृत्यु या अक्षमता की स्थिति के लिए किसी व्यक्ति को नामित (nominate) करना'
];

const deviceKey = (role: ConsentRole) => `consent_${role}_${CONSENT_VERSION}`;

/** Is device par is version ki sahmati pehle li ja chuki hai? (login par baar-baar checkbox na dikhe) */
export function hasLocalConsent(role: ConsentRole, phone?: string) {
  try {
    const raw = localStorage.getItem(deviceKey(role));
    if (!raw) return false;
    return phone ? JSON.parse(raw).includes(phone) : true;
  } catch {
    return false;
  }
}

/**
 * Sahmati ka record: consents me naya log (saboot) + profile par abhi ki sthiti.
 * profileRef: users/u_x, reporters/rp_x, advertisers/adv_x
 */
export async function recordConsent(opts: {
  role: ConsentRole;
  phone: string;
  profilePath?: [string, string];
  marketing: boolean;
  ageConfirmed: boolean;
  action: 'signup' | 'login';
  portal?: string;
}) {
  const entry = {
    role: opts.role,
    phone: opts.phone,
    version: CONSENT_VERSION,
    purposesAccepted: true,
    marketing: opts.marketing,
    ageConfirmed: opts.ageConfirmed,
    action: opts.action,
    portal: opts.portal || '',
    language: 'hi',
    page: typeof window !== 'undefined' ? window.location.pathname : '',
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent.slice(0, 200) : '',
    acceptedAt: serverTimestamp()
  };
  await addDoc(collection(db, 'consents'), entry);
  if (opts.profilePath) {
    await setDoc(
      doc(db, opts.profilePath[0], opts.profilePath[1]),
      { consent: { version: CONSENT_VERSION, acceptedAt: serverTimestamp(), marketing: opts.marketing, ageConfirmed: opts.ageConfirmed } },
      { merge: true }
    );
  }
  try {
    const list: string[] = JSON.parse(localStorage.getItem(deviceKey(opts.role)) || '[]');
    if (!list.includes(opts.phone)) list.push(opts.phone);
    localStorage.setItem(deviceKey(opts.role), JSON.stringify(list.slice(-10)));
  } catch {
    /* ignore */
  }
}

/** Marketing sahmati wapas lena / dena (profile se) */
export async function setMarketingConsent(role: ConsentRole, phone: string, profilePath: [string, string], marketing: boolean) {
  await addDoc(collection(db, 'consents'), {
    role,
    phone,
    version: CONSENT_VERSION,
    marketing,
    action: marketing ? 'marketing_opt_in' : 'marketing_withdrawn',
    acceptedAt: serverTimestamp()
  });
  await setDoc(doc(db, profilePath[0], profilePath[1]), { consent: { marketing, marketingUpdatedAt: serverTimestamp() } }, { merge: true });
}
