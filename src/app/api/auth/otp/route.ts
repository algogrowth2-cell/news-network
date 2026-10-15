import { NextResponse } from 'next/server';
import { createHash, randomInt, randomUUID } from 'node:crypto';
import { getAdmin, phoneUid } from '@/lib/firebaseAdmin';
import { readOtpTicket, signOtpTicket, ticketsConfigured } from '@/lib/otpTicket';

/*
 * OTP (SMS) — do provider:
 *  - APITXT_API_KEY env set ho  → APITxT: hum khud OTP banate/bhejte (api/sendOTP) aur Firestore (otp_sessions) me
 *                                  store karke khud verify karte hain. (Bina DLT, SMS se OTP)
 *  - warna                      → 2Factor (khud OTP banata/bhejta/verify karta hai).
 * Dono me ticket (signed phone+session) number ko session se baandhta hai — kisi aur number ka token na bane.
 */

const TWOFACTOR_API_KEY = process.env.TWOFACTOR_API_KEY || 'aa7deb54-b3ef-11f1-af74-0200cd936042';
const APITXT_API_KEY = (process.env.APITXT_API_KEY || '').trim();
const APITXT_ENDPOINT = process.env.APITXT_ENDPOINT || 'https://apitxt.com/api/sendOTP';
const USE_APITXT = !!APITXT_API_KEY;

// SMS bombing rok: ek number par 5/ghanta, ek IP se 20/ghanta
const HOUR = 60 * 60 * 1000;
const OTP_TTL_MS = 10 * 60 * 1000;
const MAX_VERIFY_ATTEMPTS = 5;
const sends = new Map<string, number[]>();
const tooMany = (key: string, max: number) => {
  const now = Date.now();
  const list = (sends.get(key) || []).filter((t) => now - t < HOUR);
  if (list.length >= max) { sends.set(key, list); return true; }
  list.push(now); sends.set(key, list); return false;
};
const clientIp = (req: Request) => (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() || 'unknown';
const sha = (s: string) => createHash('sha256').update(s).digest('hex');

// APITxT se SMS OTP bhejo (hum OTP banate hain, wo sirf deliver karta hai)
async function apitxtSend(phone10: string, otp: string): Promise<{ ok: boolean; info: string }> {
  try {
    const res = await fetch(APITXT_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ authkey: APITXT_API_KEY, mobile: phone10, country: '91', otp })
    });
    const text = (await res.text()).slice(0, 400);
    console.log('apitxt sendOTP:', res.status, text);
    // Saaf error words → fail; warna (2xx) → bhej diya maana
    const bad = /auth_failed|invalid|error|fail|insufficient|balance/i.test(text);
    return { ok: res.ok && !bad, info: `${res.status} ${text}` };
  } catch (e: any) {
    console.error('apitxt send error:', e?.message || e);
    return { ok: false, info: e?.message || 'network' };
  }
}

// OTP sahi hone par Firebase custom token (Firestore rules isi se number pehchaante hain)
async function mintToken(admin: NonNullable<Awaited<ReturnType<typeof getAdmin>>>, phone: string) {
  const user = (await admin.db.collection('users').doc(`u_${phone}`).get()).data();
  const claims: Record<string, string> = { phone };
  if (user?.email && !String(user.email).endsWith('@news.local')) claims.email = String(user.email).toLowerCase();
  const findId = async (col: string, prefix: string) => {
    if ((await admin.db.collection(col).doc(`${prefix}${phone}`).get()).exists) return `${prefix}${phone}`;
    for (const field of ['phone', 'mobile']) {
      const q = await admin.db.collection(col).where(field, '==', phone).limit(1).get();
      if (!q.empty) return q.docs[0].id;
    }
    return '';
  };
  const [rid, aid] = await Promise.all([findId('reporters', 'rp_'), findId('advertisers', 'adv_')]);
  if (rid) claims.rid = rid;
  if (aid) claims.aid = aid;
  return admin.auth.createCustomToken(phoneUid(phone), claims);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, otp, sessionId, ticket } = body;

    // ───────────────── SEND ─────────────────
    if (action === 'send') {
      const cleanPhone = String(body.phone || '').replace(/[^0-9]/g, '').slice(-10);
      if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
        return NextResponse.json({ success: false, message: 'कृपया 10 अंकों का सही मोबाइल नंबर दर्ज करें।' }, { status: 400 });
      }
      if (tooMany(`p:${cleanPhone}`, 5) || tooMany(`ip:${clientIp(req)}`, 20)) {
        return NextResponse.json({ success: false, message: 'बहुत अधिक OTP अनुरोध। कृपया कुछ देर बाद प्रयास करें।' }, { status: 429 });
      }

      if (USE_APITXT) {
        const admin = await getAdmin();
        if (!admin) return NextResponse.json({ success: false, message: 'OTP सेवा अभी उपलब्ध नहीं है।' }, { status: 503 });
        const code = String(randomInt(100000, 1000000)); // 6-ank
        const sid = randomUUID();
        await admin.db.collection('otp_sessions').doc(sid).set({
          phone: cleanPhone, otpHash: sha(code), attempts: 0, createdAt: admin.Timestamp.now()
        });
        const sent = await apitxtSend(cleanPhone, code);
        if (!sent.ok) {
          await admin.db.collection('otp_sessions').doc(sid).delete().catch(() => {});
          return NextResponse.json({ success: false, message: 'OTP भेजने में विफलता हुई, कृपया दोबारा प्रयास करें।' }, { status: 400 });
        }
        return NextResponse.json({
          success: true,
          sessionId: sid,
          ticket: ticketsConfigured() ? signOtpTicket(cleanPhone, sid) : null,
          message: 'OTP SMS द्वारा भेज दिया गया है।'
        });
      }

      // 2Factor
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

    // ───────────────── VERIFY ─────────────────
    if (action === 'verify') {
      const cleanOtp = String(otp || '').trim();
      if (!sessionId || !/^\d{4,6}$/.test(cleanOtp)) {
        return NextResponse.json({ success: false, message: 'Session ID ya OTP uplabdh nahi hai.' }, { status: 400 });
      }
      const t = ticket ? readOtpTicket(ticket) : null;
      if (ticket && (!t || t.sessionId !== sessionId)) {
        return NextResponse.json({ success: false, message: 'OTP सत्र समाप्त हो गया, कृपया दोबारा OTP भेजें।' }, { status: 400 });
      }

      if (USE_APITXT) {
        const admin = await getAdmin();
        if (!admin) return NextResponse.json({ success: false, message: 'OTP सेवा अभी उपलब्ध नहीं है।' }, { status: 503 });
        const ref = admin.db.collection('otp_sessions').doc(String(sessionId));
        const snap = await ref.get();
        const s: any = snap.data();
        if (!snap.exists || !s) {
          return NextResponse.json({ success: false, message: 'OTP सत्र समाप्त हो गया, कृपया दोबारा OTP भेजें।' }, { status: 400 });
        }
        const createdMs = s.createdAt?.toMillis ? s.createdAt.toMillis() : 0;
        if (Date.now() - createdMs > OTP_TTL_MS || (s.attempts || 0) >= MAX_VERIFY_ATTEMPTS) {
          await ref.delete().catch(() => {});
          return NextResponse.json({ success: false, message: 'OTP समय-सीमा समाप्त, कृपया दोबारा OTP भेजें।' }, { status: 400 });
        }
        if (t && t.phone !== s.phone) {
          return NextResponse.json({ success: false, message: 'सत्यापन विफल।' }, { status: 400 });
        }
        if (sha(cleanOtp) !== s.otpHash) {
          await ref.update({ attempts: (s.attempts || 0) + 1 }).catch(() => {});
          return NextResponse.json({ success: false, message: 'गलत OTP दर्ज किया गया है।' }, { status: 400 });
        }
        await ref.delete().catch(() => {});
        const firebaseToken = await mintToken(admin, s.phone);
        return NextResponse.json({ success: true, firebaseToken, message: 'OTP सत्यापित।' });
      }

      // 2Factor
      const res = await fetch(`https://2factor.in/API/V1/${TWOFACTOR_API_KEY}/SMS/VERIFY/${encodeURIComponent(sessionId)}/${cleanOtp}`, { method: 'GET' });
      const data = await res.json();
      if (!(data.Status === 'Success' && data.Details === 'OTP Matched')) {
        return NextResponse.json({ success: false, message: data.Details || 'गलत OTP दर्ज किया गया है।' }, { status: 400 });
      }
      let firebaseToken: string | null = null;
      const admin = await getAdmin();
      if (admin && t) firebaseToken = await mintToken(admin, t.phone);
      return NextResponse.json({ success: true, firebaseToken, message: 'OTP सत्यापित।' });
    }

    return NextResponse.json({ success: false, message: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('otp route error:', error);
    return NextResponse.json({ success: false, message: 'सर्वर त्रुटि, कृपया पुनः प्रयास करें।' }, { status: 500 });
  }
}
