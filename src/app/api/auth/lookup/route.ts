import { NextResponse } from 'next/server';
import { getAdmin } from '@/lib/firebaseAdmin';

/*
 * Login/signup se PEHLE ki jaanch (bina login) — Firestore rules ke baad browser ye data seedha nahi padh sakta.
 * Sirf zaroori jawab: registered hai ya nahi, status (patrakar approval), sahmati ka version. Naam/email/pata kuch nahi.
 *   { kind: 'reader' | 'patrakar' | 'advertiser', phone }  →  { found, id, status, consentVersion }
 *   { kind: 'advertiser-email', email }                     →  { taken }
 */

const PREFIX: Record<string, { col: string; prefix: string }> = {
  reader: { col: 'users', prefix: 'u_' },
  patrakar: { col: 'reporters', prefix: 'rp_' },
  advertiser: { col: 'advertisers', prefix: 'adv_' }
};

// Number ginne (enumeration) se bachav: ek IP se 60/ghanta
const hits = new Map<string, number[]>();
const limited = (ip: string) => {
  const now = Date.now();
  const list = (hits.get(ip) || []).filter((t) => now - t < 3600e3);
  list.push(now);
  hits.set(ip, list);
  return list.length > 60;
};

export async function POST(req: Request) {
  const admin = getAdmin();
  if (!admin) return NextResponse.json({ error: 'not-configured' }, { status: 503 });
  if (limited((req.headers.get('x-forwarded-for') || '').split(',')[0].trim() || 'unknown')) {
    return NextResponse.json({ error: 'rate-limited' }, { status: 429 });
  }
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'bad-request' }, { status: 400 });
  }
  const { db } = admin;

  if (body.kind === 'advertiser-email') {
    const email = String(body.email || '').trim().toLowerCase();
    if (!email) return NextResponse.json({ taken: false });
    const snap = await db.collection('advertisers').where('email', '==', email).limit(1).get();
    return NextResponse.json({ taken: !snap.empty });
  }

  const cfg = PREFIX[body.kind];
  const phone = String(body.phone || '').replace(/[^0-9]/g, '').slice(-10);
  if (!cfg || !/^[6-9]\d{9}$/.test(phone)) return NextResponse.json({ error: 'bad-request' }, { status: 400 });

  const pick = (id: string, d: FirebaseFirestore.DocumentData) => ({
    found: true,
    id,
    status: String(d.status || ''),
    consentVersion: d.consent?.version || ''
  });

  const direct = await db.collection(cfg.col).doc(`${cfg.prefix}${phone}`).get();
  if (direct.exists) return NextResponse.json(pick(direct.id, direct.data()!));
  for (const field of ['phone', 'mobile']) {
    const snap = await db.collection(cfg.col).where(field, '==', phone).limit(1).get();
    if (!snap.empty) return NextResponse.json(pick(snap.docs[0].id, snap.docs[0].data()));
  }
  // Purane /register form ke pathak
  if (body.kind === 'reader') {
    const legacy = await db.collection('readers').where('mobile', '==', phone).limit(1).get();
    if (!legacy.empty) return NextResponse.json({ found: true, id: legacy.docs[0].id, status: '', consentVersion: '' });
  }
  return NextResponse.json({ found: false, id: '', status: '', consentVersion: '' });
}
