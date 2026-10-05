import { NextResponse } from 'next/server';
import { getAdmin, phoneUid } from '@/lib/firebaseAdmin';
import { readOtpTicket, signOtpTicket, ticketsConfigured } from '@/lib/otpTicket';

/*
 * 2Factor SMS OTP.
 *  send   { phone }                     → { sessionId, ticket }   (ticket = signed phone+session, 10 min)
 *  verify { sessionId, otp, ticket }    → { firebaseToken }       (sirf ticket wale number ke liye Firebase custom token)
 * Firebase token se hi Firestore rules user ka mobile pehchaante hain.
 */

// Env me rakhein (TWOFACTOR_API_KEY). Purani key git history me public ho chuki hai — 2Factor dashboard se badal dein.
const TWOFACTOR_API_KEY = process.env.TWOFACTOR_API_KEY || 'aa7deb54-b3ef-11f1-af74-0200cd936042';
if (!process.env.TWOFACTOR_API_KEY) console.warn('otp: TWOFACTOR_API_KEY env set nahi — purani (public) key use ho rahi hai');

// SMS bombing rok: ek number par 5/ghanta, ek IP se 20/ghanta
const HOUR = 60 * 60 * 1000;
const sends = new Map<string, number[]>();
const tooMany = (key: string, max: number) => {
  const now = Date.now();
  const list = (sends.get(key) || []).filter((t) => now - t < HOUR);
  if (list.length >= max) {
    sends.set(key, list);
    return true;
  }
  list.push(now);
  sends.set(key, list);
  return false;
};
const clientIp = (req: Request) => (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() || 'unknown';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, otp, sessionId, ticket } = body;

    // 1. SEND OTP
    if (action === 'send') {
      const cleanPhone = String(body.phone || '').replace(/[^0-9]/g, '').slice(-10);
      if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
        return NextResponse.json({ success: false, message: 'कृपया 10 अंकों का सही मोबाइल नंबर दर्ज करें।' }, { status: 400 });
      }
      if (tooMany(`p:${cleanPhone}`, 5) || tooMany(`ip:${clientIp(req)}`, 20)) {
        return NextResponse.json({ success: false, message: 'बहुत अधिक OTP अनुरोध। कृपया कुछ देर बाद प्रयास करें।' }, { status: 429 });
      }

      const res = await fetch(`https://2factor.in/API/V1/${TWOFACTOR_API_KEY}/SMS/${cleanPhone}/AUTOGEN/OTP1`, { method: 'GET' });
      const data = await res.json();
      if (data.Status === 'Success') {
        return NextResponse.json({
          success: true,
          sessionId: data.Details,
          ticket: ticketsConfigured() ? signOtpTicket(cleanPhone, data.Details) : null,
          message: 'OTP SMS द्वारा भेज दिया गया है।'
        });
      }
      return NextResponse.json({ success: false, message: data.Details || 'OTP भेजने में विफलता हुई।' }, { status: 400 });
    }

    // 2. VERIFY OTP
    if (action === 'verify') {
      const cleanOtp = String(otp || '').trim();
      if (!sessionId || !/^\d{4,6}$/.test(cleanOtp)) {
        return NextResponse.json({ success: false, message: 'Session ID ya OTP uplabdh nahi hai.' }, { status: 400 });
      }
      // Ticket ho toh usi number + session ka hona chahiye
      const t = ticket ? readOtpTicket(ticket) : null;
      if (ticket && (!t || t.sessionId !== sessionId)) {
        return NextResponse.json({ success: false, message: 'OTP सत्र समाप्त हो गया, कृपया दोबारा OTP भेजें।' }, { status: 400 });
      }

      const res = await fetch(`https://2factor.in/API/V1/${TWOFACTOR_API_KEY}/SMS/VERIFY/${encodeURIComponent(sessionId)}/${cleanOtp}`, { method: 'GET' });
      const data = await res.json();
      if (!(data.Status === 'Success' && data.Details === 'OTP Matched')) {
        return NextResponse.json({ success: false, message: data.Details || 'गलत OTP दर्ज किया गया है।' }, { status: 400 });
      }

      // Firebase pehchaan (Admin SDK configure ho aur ticket sahi ho tab)
      let firebaseToken: string | null = null;
      const admin = (await getAdmin());
      if (admin && t) {
        // email claim: purane e-paper subscription docs email se jude hain (rules unhe isi se pehchaante hain)
        const user = (await admin.db.collection('users').doc(`u_${t.phone}`).get()).data();
        const claims: Record<string, string> = { phone: t.phone };
        if (user?.email && !String(user.email).endsWith('@news.local')) claims.email = String(user.email).toLowerCase();
        // Patrakar / advertiser ka asli record ID (purane records 'rp_'/'adv_' naam se nahi bane — rules isi se pehchaanein)
        const findId = async (col: string, prefix: string) => {
          if ((await admin.db.collection(col).doc(`${prefix}${t.phone}`).get()).exists) return `${prefix}${t.phone}`;
          for (const field of ['phone', 'mobile']) {
            const q = await admin.db.collection(col).where(field, '==', t.phone).limit(1).get();
            if (!q.empty) return q.docs[0].id;
          }
          return '';
        };
        const [rid, aid] = await Promise.all([findId('reporters', 'rp_'), findId('advertisers', 'adv_')]);
        if (rid) claims.rid = rid;
        if (aid) claims.aid = aid;
        firebaseToken = await admin.auth.createCustomToken(phoneUid(t.phone), claims);
      }
      return NextResponse.json({ success: true, firebaseToken, message: 'OTP सत्यापित।' });
    }

    return NextResponse.json({ success: false, message: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('otp route error:', error);
    return NextResponse.json({ success: false, message: 'सर्वर त्रुटि, कृपया पुनः प्रयास करें।' }, { status: 500 });
  }
}
