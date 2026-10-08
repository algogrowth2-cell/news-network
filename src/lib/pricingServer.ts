import type { Firestore } from 'firebase-admin/firestore';
// SIRF SERVER: admin ki tay ki hui keematein (settings/pricing) — Razorpay payment ki rakam isi se jaanchi jaati hai
import { DEFAULT_PRICING, normalizePricing, type Pricing } from '@/lib/pricing';

export async function getServerPricing(db: Firestore): Promise<Pricing> {
  try {
    const snap = await db.collection('settings').doc('pricing').get();
    return normalizePricing(snap.exists ? snap.data() : {});
  } catch (err) {
    console.error('pricing read error:', err);
    return DEFAULT_PRICING;
  }
}
