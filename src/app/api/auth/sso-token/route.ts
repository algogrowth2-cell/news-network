import { NextResponse } from 'next/server';
import { getAdmin, phoneUid } from '@/lib/firebaseAdmin';

/*
 * Cross-domain SSO handoff: logged-in user (Bearer ID token) ke liye ek naya short-lived custom token.
 * Portal switch par doosre domain ko bheja jata hai, wahan signInWithCustomToken se wahi login ho jata hai.
 */
export async function POST(req: Request) {
  const admin = await getAdmin();
  if (!admin) return NextResponse.json({ error: 'not-configured' }, { status: 503 });
  const idToken = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  if (!idToken) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
  try {
    const d = await admin.auth.verifyIdToken(idToken);
    const phone = String(d.phone || '');
    if (!/^[6-9]\d{9}$/.test(phone)) return NextResponse.json({ error: 'no-phone' }, { status: 400 });
    const claims: Record<string, string> = { phone };
    if (d.email) claims.email = String(d.email);
    if (d.rid) claims.rid = String(d.rid);
    if (d.aid) claims.aid = String(d.aid);
    const token = await admin.auth.createCustomToken(phoneUid(phone), claims);
    return NextResponse.json({ token });
  } catch {
    return NextResponse.json({ error: 'invalid' }, { status: 401 });
  }
}
