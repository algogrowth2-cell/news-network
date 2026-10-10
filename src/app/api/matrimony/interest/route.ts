import { NextResponse } from 'next/server';
import { getAdmin, phoneFromRequest } from '@/lib/firebaseAdmin';
import { ageFromDob } from '@/lib/matrimony';

/*
 * Matrimony "Ruchi" (Interest) — login zaroori.
 *   GET                                  → meri bheji + mere paas aayi ruchi (bhejne wale ka number NAHI)
 *   POST { action:'send', toProfileId }  → ruchi bhejo (ek profile ko ek baar; roz seema)
 *   POST { action:'respond', interestId, accept } → apni profile par aayi ruchi accept/decline
 *
 * Number kahin nahi jaata. Accept hone par dono /api/matrimony/contact se ek-doosre ka number le sakte hain.
 */

const DAY = 864e5;
const sends = new Map<string, number[]>();
const tooMany = (phone: string) => {
  const now = Date.now();
  const list = (sends.get(phone) || []).filter((t) => now - t < DAY);
  if (list.length >= 20) { sends.set(phone, list); return true; } // roz 20 ruchi
  list.push(now); sends.set(phone, list); return false;
};

// Bhejne wale ko sirf itna (number nahi)
const summary = (id: string, d: any) => ({
  id,
  name: d?.name || '',
  age: d?.dob ? ageFromDob(d.dob) : 0,
  city: d?.city || '',
  state: d?.state || '',
  education: d?.education || '',
  occupation: d?.occupation || '',
  photoUrl: d?.photoUrl || '',
  status: d?.status || ''
});

export async function GET(req: Request) {
  const admin = await getAdmin();
  if (!admin) return NextResponse.json({ error: 'not-configured' }, { status: 503 });
  const phone = await phoneFromRequest(req);
  if (!phone) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
  const { db } = admin;

  const myProfileId = (await db.collection('matrimony_index').doc(phone).get()).data()?.profileId || '';

  // orderBy hata diya (where+orderBy ko composite index chahiye) — JS me naya-pehle sort
  const byNewest = (docs: any[]) => [...docs].sort((a, b) => (b.data().createdAt?.seconds || 0) - (a.data().createdAt?.seconds || 0)).slice(0, 100);
  const [sentSnap, recvSnap] = await Promise.all([
    db.collection('matrimony_interests').where('fromPhone', '==', phone).limit(200).get(),
    myProfileId
      ? db.collection('matrimony_interests').where('toProfileId', '==', myProfileId).limit(200).get()
      : Promise.resolve({ docs: [] as any[] })
  ]);

  // Bheji gayi: samne wale ki profile summary
  const sent = await Promise.all(
    byNewest(sentSnap.docs).map(async (d: any) => {
      const i = d.data();
      const p = (await db.collection('matrimony_profiles').doc(i.toProfileId).get()).data();
      return { interestId: d.id, status: i.status, profile: summary(i.toProfileId, p), canSeeContact: i.status === 'accepted' };
    })
  );
  // Aayi: bhejne wale ki profile summary (number nahi)
  const received = await Promise.all(
    byNewest(recvSnap.docs as any[]).map(async (d: any) => {
      const i = d.data();
      const p = i.fromProfileId ? (await db.collection('matrimony_profiles').doc(i.fromProfileId).get()).data() : null;
      return { interestId: d.id, status: i.status, profile: summary(i.fromProfileId || '', p), canSeeContact: i.status === 'accepted' };
    })
  );

  return NextResponse.json({ sent, received, hasProfile: !!myProfileId });
}

export async function POST(req: Request) {
  const admin = await getAdmin();
  if (!admin) return NextResponse.json({ error: 'not-configured' }, { status: 503 });
  const phone = await phoneFromRequest(req);
  if (!phone) return NextResponse.json({ error: 'unauthenticated', message: 'कृपया लॉगिन करें।' }, { status: 401 });
  const { db, FieldValue } = admin;

  const body = await req.json().catch(() => ({}));
  const action = String(body.action || '');
  const myProfileId = (await db.collection('matrimony_index').doc(phone).get()).data()?.profileId || '';

  if (action === 'send') {
    const toProfileId = String(body.toProfileId || '');
    if (!toProfileId) return NextResponse.json({ error: 'bad-request' }, { status: 400 });
    if (toProfileId === myProfileId) return NextResponse.json({ error: 'self', message: 'अपनी ही प्रोफ़ाइल को रुचि नहीं भेज सकते।' }, { status: 400 });

    const target = (await db.collection('matrimony_profiles').doc(toProfileId).get()).data();
    if (!target || target.status !== 'approved') return NextResponse.json({ error: 'not-found', message: 'यह प्रोफ़ाइल उपलब्ध नहीं है।' }, { status: 404 });

    const interestId = `${phone}_${toProfileId}`;
    const existing = await db.collection('matrimony_interests').doc(interestId).get();
    if (existing.exists) return NextResponse.json({ ok: true, already: true, status: existing.data()!.status });

    if (tooMany(phone)) return NextResponse.json({ error: 'rate', message: 'आज के लिए रुचि भेजने की सीमा पूरी हो गई। कृपया कल प्रयास करें।' }, { status: 429 });

    await db.collection('matrimony_interests').doc(interestId).set({
      fromPhone: phone,
      fromProfileId: myProfileId || '',
      toProfileId,
      status: 'pending',
      createdAt: FieldValue.serverTimestamp()
    });
    return NextResponse.json({ ok: true, status: 'pending' });
  }

  if (action === 'respond') {
    const interestId = String(body.interestId || '');
    const accept = body.accept === true;
    const ref = db.collection('matrimony_interests').doc(interestId);
    const i = (await ref.get()).data();
    if (!i) return NextResponse.json({ error: 'not-found' }, { status: 404 });
    // Sirf jis profile par ruchi aayi, usi ka maalik jawab de
    if (!myProfileId || i.toProfileId !== myProfileId) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    await ref.update({ status: accept ? 'accepted' : 'declined', respondedAt: FieldValue.serverTimestamp() });
    return NextResponse.json({ ok: true, status: accept ? 'accepted' : 'declined' });
  }

  return NextResponse.json({ error: 'bad-action' }, { status: 400 });
}
