// Saare paid plans ki rakam — browser aur server dono yahi padhte hain (server isi se Razorpay payment jaanchta hai).

export const EPAPER_PLANS = [
  {
    id: 'epaper_1_month',
    name: '1 महीना प्लान (1 Month)',
    price: 21,
    durationDays: 30,
    desc: '₹21 में 30 दिनों का सभी संस्करणों का ई-पेपर ऐक्सेस'
  },
  {
    id: 'epaper_1_year',
    name: '1 साल का वार्षिक प्लान (1 Year)',
    price: 111,
    durationDays: 365,
    // ₹111 ÷ 12 महीने = ₹9.25/माह (रोज़ का सिर्फ़ ~30 पैसे: ₹111 ÷ 365 = ₹0.30)
    desc: '₹111 (मात्र ₹9.25/माह) में पूरे 365 दिनों का असीमित ऐक्सेस'
  }
];

export const PATRAKAR_MEMBERSHIP_PRICE = 499;
export const PRESS_KIT_DELIVERY_PRICE = 299;
// Shok sandesh: jitne din ka plan, utne din website par (admin manzoori ke din se). Purane (₹199) sandesh 30 din.
export const SHOK_PLANS = [
  { id: 'shok_7_days', name: '7 दिन', price: 11, days: 7, desc: '₹11 में 7 दिन तक शोक संदेश वेबसाइट पर' },
  { id: 'shok_30_days', name: '1 महीना (30 दिन)', price: 51, days: 30, desc: '₹51 में पूरे 30 दिन तक शोक संदेश वेबसाइट पर' }
] as const;
export type ShokPlanId = (typeof SHOK_PLANS)[number]['id'];
export const SHOK_LEGACY_DAYS = 30;

// Advertiser vigyapan — har request ka shulk (payment ke baad hi admin ke paas manzoori ke liye)
export const AD_PRICES = {
  classified: 199,
  sidebar: 999,
  banner: 1999,
  popup: 2999
} as const;
export type AdFormat = keyof typeof AD_PRICES;
export const AD_FORMAT_LABEL: Record<AdFormat, string> = {
  classified: 'क्लासिफाइड विज्ञापन',
  sidebar: 'साइडबार बैनर (300 × 250)',
  banner: 'हेडर बैनर (728 × 90)',
  popup: 'पॉप-अप विज्ञापन'
};

export type PaymentKind = 'epaper' | 'membership' | 'delivery' | 'shok' | 'ad';
