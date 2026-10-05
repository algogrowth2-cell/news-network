import { NextResponse } from 'next/server';
import { phoneFromRequest } from '@/lib/firebaseAdmin';
import { adminStore } from '@/lib/referralServer';
import { createReaderWithReferralCore } from '@/lib/referralService';

/* OTP-verified pathak ka naya khata + referral reward (server par — referrer ka data browser nahi chhoota) */
export async function POST(req: Request) {
  const store = adminStore();
  if (!store) return NextResponse.json({ error: 'not-configured' }, { status: 503 });
  const phone = await phoneFromRequest(req);
  if (!phone) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const name = String(body.name || '').replace(/[<>{}[\]\\/@#$%^&*=+_|~`"0-9]/g, '').trim().slice(0, 60) || 'पाठक';
  const emailRaw = String(body.email || '').trim().toLowerCase().slice(0, 254);
  const email = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(emailRaw) ? emailRaw : `${phone}@news.local`;
  try {
    const result = await createReaderWithReferralCore(store, { userId: `u_${phone}`, name, email, phone }, String(body.referralCode || ''));
    return NextResponse.json(result);
  } catch (err) {
    console.error('reader/create error:', err);
    return NextResponse.json({ error: 'failed' }, { status: 500 });
  }
}
