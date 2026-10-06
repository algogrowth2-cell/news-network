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
    price: 132,
    durationDays: 365,
    desc: '₹132 (मात्र ₹11/माह) में पूरे 365 दिनों का असीमित ऐक्सेस'
  }
];

export const PATRAKAR_MEMBERSHIP_PRICE = 499;
export const PRESS_KIT_DELIVERY_PRICE = 299;
export const SHOK_SANDESH_PRICE = 199;

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
