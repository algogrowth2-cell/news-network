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

// Patrakar seva sadasyata — har portal ki alag, 1 saal (lib/membership.ts)
export const PATRAKAR_MEMBERSHIP_PRICE = 999;
export const PRESS_KIT_DELIVERY_PRICE = 299;
// Shok sandesh: jitne din ka plan, utne din website par (admin manzoori ke din se). Purane (₹199) sandesh 30 din.
export const SHOK_PLANS = [
  { id: 'shok_7_days', name: '7 दिन', price: 11, days: 7, desc: '₹11 में 7 दिन तक शोक संदेश वेबसाइट पर' },
  { id: 'shok_30_days', name: '1 महीना (30 दिन)', price: 51, days: 30, desc: '₹51 में पूरे 30 दिन तक शोक संदेश वेबसाइट पर' }
] as const;
export type ShokPlanId = (typeof SHOK_PLANS)[number]['id'];
export const SHOK_LEGACY_DAYS = 30;

// Advertiser vigyapan — shulk aur muddat (admin manzoori ke din se). Muddat poori → website se apne aap hat jaata.
// Purane (bina muddat wale) vigyapan jaise chal rahe hain waise hi chalte rahenge.
export const AD_PRICES = {
  classified: 51,
  sidebar: 999,
  banner: 999,
  popup: 2999
} as const;
export type AdFormat = keyof typeof AD_PRICES;
/** Kitne din chalega (0 = koi seema nahi) */
export const AD_DAYS: Record<AdFormat, number> = { classified: 30, sidebar: 365, banner: 365, popup: 0 };
export const AD_DURATION_LABEL: Record<AdFormat, string> = { classified: '1 महीना (30 दिन)', sidebar: '1 वर्ष', banner: '1 वर्ष', popup: '' };
export const AD_FORMAT_LABEL: Record<AdFormat, string> = {
  classified: 'क्लासिफाइड विज्ञापन',
  sidebar: 'साइडबार बैनर (300 × 250)',
  banner: 'हेडर बैनर (728 × 90)',
  popup: 'पॉप-अप विज्ञापन'
};

const _ms = (v: any) => (v?.toDate ? v.toDate().getTime() : v?.seconds ? v.seconds * 1000 : v ? new Date(v).getTime() || 0 : 0);
/** Vigyapan kab tak (ms); Infinity = koi seema nahi (purane vigyapan / pop-up) */
export function adExpiryMs(x: any): number {
  const days = Number(x?.days) || 0;
  if (!days) return Infinity;
  const start = _ms(x?.approvedAt) || _ms(x?.paidAt) || _ms(x?.createdAt) || Date.now();
  return start + days * 864e5;
}
export const adNotExpired = (x: any, now = Date.now()) => adExpiryMs(x) > now;

export type PaymentKind = 'epaper' | 'membership' | 'delivery' | 'shok' | 'ad';
