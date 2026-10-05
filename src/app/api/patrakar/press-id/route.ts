import { NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { getAdmin, phoneFromRequest } from '@/lib/firebaseAdmin';
import { PRESS_ID_PREFIX } from '@/lib/pressCard';

/*
 * Login patrakar ki apni Press ID (portal ke hisaab se, kram se TLL-2026-001…).
 * counters aur pressIds sirf yahin likhe jaate hain — patrakar browser se kram nahi badal sakta.
 */
export async function POST(req: Request) {
  const admin = getAdmin();
  if (!admin) return NextResponse.json({ error: 'not-configured' }, { status: 503 });
  const phone = await phoneFromRequest(req);
  if (!phone) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });

  const { siteSlug } = await req.json().catch(() => ({}));
  if (!siteSlug || !PRESS_ID_PREFIX[siteSlug]) return NextResponse.json({ error: 'bad-portal' }, { status: 400 });
  const { db } = admin;

  // Apna reporter doc (naya id rp_phone, purane records phone/mobile field se)
  let repRef = db.collection('reporters').doc(`rp_${phone}`);
  if (!(await repRef.get()).exists) {
    const found =
      (await db.collection('reporters').where('phone', '==', phone).limit(1).get()).docs[0] ||
      (await db.collection('reporters').where('mobile', '==', phone).limit(1).get()).docs[0];
    if (!found) return NextResponse.json({ error: 'not-a-reporter' }, { status: 403 });
    repRef = found.ref;
  }

  const prefix = PRESS_ID_PREFIX[siteSlug];
  const year = new Date().getFullYear();
  const counterRef = db.collection('counters').doc(`press_ids_${prefix}_${year}`);
  try {
    const out = await db.runTransaction(async (tx) => {
      const rep = (await tx.get(repRef)).data() || {};
      if (!['approved', 'active'].includes(String(rep.status || '').toLowerCase())) throw new Error('not-approved');
      if (rep.cardStatus === 'revoked') throw new Error('revoked');
      const existing = rep.pressIds?.[siteSlug];
      if (existing) {
        tx.update(repRef, { cardSiteId: siteSlug, pressId: existing, cardUpdatedAt: FieldValue.serverTimestamp() });
        return { pressId: existing as string, issuedOn: rep.pressIdIssuedOn?.[siteSlug] || new Date().toISOString() };
      }
      const next = Number((await tx.get(counterRef)).data()?.next || 1);
      const pressId = `${prefix}-${year}-${String(next).padStart(3, '0')}`;
      const issuedOn = new Date().toISOString();
      tx.set(counterRef, { next: next + 1, prefix, year, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
      tx.update(repRef, {
        [`pressIds.${siteSlug}`]: pressId,
        [`pressIdIssuedOn.${siteSlug}`]: issuedOn,
        pressIdList: FieldValue.arrayUnion(pressId),
        pressId,
        cardSiteId: siteSlug,
        cardUpdatedAt: FieldValue.serverTimestamp()
      });
      return { pressId, issuedOn };
    });
    return NextResponse.json(out);
  } catch (err: any) {
    if (err.message === 'not-approved' || err.message === 'revoked') return NextResponse.json({ error: err.message }, { status: 403 });
    console.error('press-id error:', err);
    return NextResponse.json({ error: 'failed' }, { status: 500 });
  }
}
