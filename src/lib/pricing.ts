import { AD_DAYS, AD_PRICES, type AdFormat, EPAPER_PLANS, PATRAKAR_MEMBERSHIP_PRICE, PRESS_KIT_DELIVERY_PRICE, SHOK_PLANS } from '@/lib/plans';

/*
 * Saare paid plans ki keemat + muddat — admin panel (Admin → प्लान व कीमतें) se badalti hai.
 *   Firestore: settings/pricing   (sab padh sakte hain, likhna sirf admin)
 * Browser (dikhana) aur server (Razorpay payment ki rakam jaanchna) dono yahi padhte hain.
 * Badlaav sirf NAYE bhugtan par — pehle se chalu plan / vigyapan apni muddat tak chalte rahte hain.
 */

export interface PriceDays {
  price: number;
  days: number;
}
export interface Pricing {
  epaper: { epaper_1_month: PriceDays; epaper_1_year: PriceDays };
  membership: PriceDays;
  delivery: { price: number };
  shok: { shok_7_days: PriceDays; shok_30_days: PriceDays };
  ads: Record<AdFormat, PriceDays>;
  matrimony: { matrimony_1_month: PriceDays; matrimony_1_year: PriceDays };
}

const epMonth = EPAPER_PLANS.find((p) => p.id === 'epaper_1_month')!;
const epYear = EPAPER_PLANS.find((p) => p.id === 'epaper_1_year')!;
const shok7 = SHOK_PLANS.find((p) => p.id === 'shok_7_days')!;
const shok30 = SHOK_PLANS.find((p) => p.id === 'shok_30_days')!;

export const DEFAULT_PRICING: Pricing = {
  epaper: {
    epaper_1_month: { price: epMonth.price, days: epMonth.durationDays },
    epaper_1_year: { price: epYear.price, days: epYear.durationDays }
  },
  membership: { price: PATRAKAR_MEMBERSHIP_PRICE, days: 365 },
  delivery: { price: PRESS_KIT_DELIVERY_PRICE },
  shok: {
    shok_7_days: { price: shok7.price, days: shok7.days },
    shok_30_days: { price: shok30.price, days: shok30.days }
  },
  ads: {
    classified: { price: AD_PRICES.classified, days: AD_DAYS.classified },
    sidebar: { price: AD_PRICES.sidebar, days: AD_DAYS.sidebar },
    banner: { price: AD_PRICES.banner, days: AD_DAYS.banner },
    popup: { price: AD_PRICES.popup, days: AD_DAYS.popup }
  },
  matrimony: {
    matrimony_1_month: { price: 299, days: 30 },
    matrimony_1_year: { price: 1999, days: 365 }
  }
};

export const PRICE_LIMITS = { minPrice: 1, maxPrice: 500000, maxDays: 3650 };

const price = (v: any, def: number) => {
  const n = Math.round(Number(v));
  return Number.isFinite(n) && n >= PRICE_LIMITS.minPrice && n <= PRICE_LIMITS.maxPrice ? n : def;
};
/** allowZero: 0 = koi seema nahi (sirf vigyapan ke liye) */
const days = (v: any, def: number, allowZero = false) => {
  const n = Math.round(Number(v));
  return Number.isFinite(n) && n <= PRICE_LIMITS.maxDays && (n >= 1 || (allowZero && n === 0)) ? n : def;
};
const pd = (raw: any, def: PriceDays, allowZero = false): PriceDays => ({ price: price(raw?.price, def.price), days: days(raw?.days, def.days, allowZero) });

/** Firestore ka data → poora, sahi Pricing (galat / khaali value par default) */
export function normalizePricing(raw: any): Pricing {
  const d = DEFAULT_PRICING;
  return {
    epaper: {
      epaper_1_month: pd(raw?.epaper?.epaper_1_month, d.epaper.epaper_1_month),
      epaper_1_year: pd(raw?.epaper?.epaper_1_year, d.epaper.epaper_1_year)
    },
    membership: pd(raw?.membership, d.membership),
    delivery: { price: price(raw?.delivery?.price, d.delivery.price) },
    shok: {
      shok_7_days: pd(raw?.shok?.shok_7_days, d.shok.shok_7_days),
      shok_30_days: pd(raw?.shok?.shok_30_days, d.shok.shok_30_days)
    },
    ads: {
      classified: pd(raw?.ads?.classified, d.ads.classified, true),
      sidebar: pd(raw?.ads?.sidebar, d.ads.sidebar, true),
      banner: pd(raw?.ads?.banner, d.ads.banner, true),
      popup: pd(raw?.ads?.popup, d.ads.popup, true)
    },
    matrimony: {
      matrimony_1_month: pd(raw?.matrimony?.matrimony_1_month, d.matrimony.matrimony_1_month),
      matrimony_1_year: pd(raw?.matrimony?.matrimony_1_year, d.matrimony.matrimony_1_year)
    }
  };
}

/** Din ko padhne layak: 365 → "1 वर्ष", 30 → "1 महीना (30 दिन)", 0 → "" */
export function daysLabel(n: number): string {
  if (!n) return '';
  if (n % 365 === 0) return `${n / 365} वर्ष`;
  if (n === 30) return '1 महीना (30 दिन)';
  if (n % 30 === 0) return `${n / 30} महीने (${n} दिन)`;
  return `${n} दिन`;
}

/** Chhota roop (bracket ke andar likhne ke liye): 365 → "1 वर्ष", 30 → "1 महीना", 45 → "45 दिन" */
export function daysShort(n: number): string {
  if (!n) return '';
  if (n % 365 === 0) return `${n / 365} वर्ष`;
  if (n % 30 === 0) return n === 30 ? '1 महीना' : `${n / 30} महीने`;
  return `${n} दिन`;
}

/** E-paper plan list (page / modal ke liye) */
export function epaperPlans(p: Pricing) {
  const m = p.epaper.epaper_1_month;
  const y = p.epaper.epaper_1_year;
  return [
    { id: 'epaper_1_month', name: `${daysShort(m.days)} प्लान`, price: m.price, durationDays: m.days, desc: `₹${m.price} में ${m.days} दिनों का सभी संस्करणों का ई-पेपर ऐक्सेस` },
    {
      id: 'epaper_1_year',
      name: `${daysShort(y.days)} का प्लान`,
      price: y.price,
      durationDays: y.days,
      desc: `₹${y.price} (मात्र ₹${(y.price / Math.max(1, Math.round(y.days / 30.4))).toFixed(2)}/माह) में पूरे ${y.days} दिनों का असीमित ऐक्सेस`
    }
  ];
}

/** Matrimony membership plan list */
export function matrimonyPlans(p: Pricing) {
  return (['matrimony_1_month', 'matrimony_1_year'] as const).map((id) => {
    const v = p.matrimony[id];
    return { id, name: daysLabel(v.days), price: v.price, days: v.days, desc: `₹${v.price} में ${daysShort(v.days)} तक विवाह प्रोफ़ाइल व संपर्क सुविधा` };
  });
}

/** Shok sandesh plan list */
export function shokPlans(p: Pricing) {
  return (['shok_7_days', 'shok_30_days'] as const).map((id) => {
    const v = p.shok[id];
    return { id, name: daysLabel(v.days), price: v.price, days: v.days, desc: `₹${v.price} में ${v.days} दिन तक शोक संदेश वेबसाइट पर` };
  });
}
