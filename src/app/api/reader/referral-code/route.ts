import { NextResponse } from 'next/server';
import { phoneFromRequest } from '@/lib/firebaseAdmin';
import { adminStore } from '@/lib/referralServer';
import { ensureReferralCodeCore } from '@/lib/referralService';

/* Login pathak ka apna referral code (na ho toh banta hai) */
export async function POST(req: Request) {
  const store = await adminStore();
  if (!store) return NextResponse.json({ error: 'not-configured' }, { status: 503 });
  const phone = await phoneFromRequest(req);
  if (!phone) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
  try {
    return NextResponse.json({ code: await ensureReferralCodeCore(store, `u_${phone}`, phone) });
  } catch (err) {
    console.error('reader/referral-code error:', err);
    return NextResponse.json({ error: 'failed' }, { status: 500 });
  }
}
