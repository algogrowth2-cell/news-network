import { NextResponse } from 'next/server';
import type { Firestore } from 'firebase-admin/firestore';
import { getAdmin, phoneFromRequest } from '@/lib/firebaseAdmin';
import { cleanProfileInput } from '@/lib/matrimony';

// Is number ki chalu vivah sadasyata (bio-data submit ke liye zaroori)
async function membershipOf(db: Firestore, phone: string) {
  const m = (await db.collection('matrimony_members').doc(phone).get()).data();
  const ms = m?.expiresAt?.toDate ? m.expiresAt.toDate().getTime() : 0;
  return { active: ms > Date.now(), expiresAt: ms ? new Date(ms).toISOString() : null, plan: m?.planId || '' };
}

/*
 * Matrimony profile — login (Bearer token) zaroori.
 *   GET   → apni poori profile (contact samet) ya null
 *   POST  → banana / badalna. Number profile me nahi jaata — alag (matrimony_contacts) me.
 *           Har baar status 'pending' (admin dobara approve kare). Ek number = ek profile.
 */

export async function GET(req: Request) {
  const admin = await getAdmin();
  if (!admin) return NextResponse.json({ error: 'not-configured' }, { status: 503 });
  const phone = await phoneFromRequest(req);
  if (!phone) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
  const { db } = admin;

  const membership = await membershipOf(db, phone);
  const idx = (await db.collection('matrimony_index').doc(phone).get()).data();
  if (!idx?.profileId) return NextResponse.json({ profile: null, membership });
  const snap = await db.collection('matrimony_profiles').doc(idx.profileId).get();
  if (!snap.exists) return NextResponse.json({ profile: null, membership });
  const contact = (await db.collection('matrimony_contacts').doc(idx.profileId).get()).data();
  return NextResponse.json({ profile: { id: snap.id, ...snap.data(), contactPhone: contact?.ownerPhone || phone }, membership });
}

export async function POST(req: Request) {
  const admin = await getAdmin();
  if (!admin) return NextResponse.json({ error: 'not-configured' }, { status: 503 });
  const phone = await phoneFromRequest(req);
  if (!phone) return NextResponse.json({ error: 'unauthenticated', message: 'कृपया लॉगिन करें।' }, { status: 401 });
  const { db, FieldValue } = admin;

  // Bio-data submit ke liye chalu vivah sadasyata zaroori (1 mahina / 1 saal)
  const membership = await membershipOf(db, phone);
  if (!membership.active) return NextResponse.json({ error: 'membership-required', message: 'प्रोफ़ाइल सबमिट करने के लिए सदस्यता आवश्यक है।' }, { status: 402 });

  const body = await req.json().catch(() => ({}));
  const res = cleanProfileInput(body);
  if (!res.ok) return NextResponse.json({ error: 'bad-input', message: res.error }, { status: 400 });

  // Ek number = ek profile (id random; number kabhi id me nahi, warna hash se number toda ja sakta)
  const idxRef = db.collection('matrimony_index').doc(phone);
  const existing = (await idxRef.get()).data();
  const profileId = existing?.profileId || db.collection('matrimony_profiles').doc().id;

  const profileRef = db.collection('matrimony_profiles').doc(profileId);
  const prev = (await profileRef.get()).data();

  await db.runTransaction(async (tx) => {
    tx.set(
      profileRef,
      {
        ...res.data,
        status: 'pending', // badlne par dobara admin approval
        createdAt: prev?.createdAt || FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
        approvedAt: null
      },
      { merge: true }
    );
    // Number sirf yahan (server/admin padhe) — kabhi public profile me nahi
    tx.set(db.collection('matrimony_contacts').doc(profileId), { ownerPhone: phone, updatedAt: FieldValue.serverTimestamp() });
    tx.set(idxRef, { profileId, updatedAt: FieldValue.serverTimestamp() });
  });

  return NextResponse.json({ ok: true, id: profileId, status: 'pending' });
}
