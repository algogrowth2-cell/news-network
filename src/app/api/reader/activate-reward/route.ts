import { NextResponse } from 'next/server';
import { getAdmin, phoneFromRequest } from '@/lib/firebaseAdmin';
import { adminStore } from '@/lib/referralServer';
import { activatePendingRewardCore } from '@/lib/referralService';

/* Purana 'pending_selection' reward → 3 maah e-paper (sirf usi referrer ka reward) */
export async function POST(req: Request) {
  const store = await adminStore();
  const admin = (await getAdmin());
  if (!store || !admin) return NextResponse.json({ error: 'not-configured' }, { status: 503 });
  const phone = await phoneFromRequest(req);
  if (!phone) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
  const { rewardId, siteId } = await req.json().catch(() => ({}));
  if (!rewardId || typeof rewardId !== 'string') return NextResponse.json({ error: 'bad-request' }, { status: 400 });
  try {
    const user = (await admin.db.collection('users').doc(`u_${phone}`).get()).data() || {};
    const validTill = await activatePendingRewardCore(store, rewardId, {
      userId: `u_${phone}`,
      phone,
      email: user.email || `${phone}@news.local`,
      name: user.name || 'पाठक'
    }, String(siteId || ''));
    return NextResponse.json({ validTill: validTill ? validTill.toISOString() : null });
  } catch (err) {
    console.error('reader/activate-reward error:', err);
    return NextResponse.json({ error: 'failed' }, { status: 500 });
  }
}
