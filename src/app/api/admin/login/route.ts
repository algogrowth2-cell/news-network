import { NextResponse } from 'next/server';
import { ADMIN_COOKIE, adminAuthConfigured, createSession, sessionCookieOptions, verifyAdmin } from '@/lib/adminAuth';

/*
 * POST { email, password } → sahi ho toh HttpOnly session cookie.
 * Brute-force rok: ek IP se 15 minute me 5 galat koshish ke baad 15 minute band.
 */

const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILS = 5;
const fails = new Map<string, { count: number; until: number; first: number }>();

const clientIp = (req: Request) =>
  (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() || req.headers.get('x-real-ip') || 'unknown';

export async function POST(req: Request) {
  if (!adminAuthConfigured()) {
    console.error('admin-login: ADMIN_CREDENTIALS / ADMIN_SESSION_SECRET env set nahi hai');
    return NextResponse.json({ ok: false, message: 'एडमिन लॉगिन अभी कॉन्फ़िगर नहीं है। सर्वर पर ADMIN_CREDENTIALS सेट करें।' }, { status: 503 });
  }

  const ip = clientIp(req);
  const now = Date.now();
  const rec = fails.get(ip);
  if (rec && rec.until > now) {
    const mins = Math.ceil((rec.until - now) / 60000);
    return NextResponse.json({ ok: false, message: `बहुत सारी गलत कोशिशें। ${mins} मिनट बाद पुनः प्रयास करें।` }, { status: 429 });
  }

  let email = '';
  let password = '';
  try {
    const body = await req.json();
    email = String(body?.email || '').slice(0, 254);
    password = String(body?.password || '').slice(0, 200);
  } catch {
    return NextResponse.json({ ok: false, message: 'अमान्य अनुरोध।' }, { status: 400 });
  }

  if (!email || !password || !verifyAdmin(email, password)) {
    const r = rec && now - rec.first < WINDOW_MS ? rec : { count: 0, until: 0, first: now };
    r.count += 1;
    if (r.count >= MAX_FAILS) r.until = now + WINDOW_MS;
    fails.set(ip, r);
    // Kaunsa galat hai (email ya password) nahi batate
    return NextResponse.json({ ok: false, message: 'ईमेल या पासवर्ड गलत है।' }, { status: 401 });
  }

  fails.delete(ip);
  const res = NextResponse.json({ ok: true, email: email.trim().toLowerCase() });
  res.cookies.set(ADMIN_COOKIE, createSession(email), sessionCookieOptions());
  res.headers.set('Cache-Control', 'no-store');
  return res;
}
