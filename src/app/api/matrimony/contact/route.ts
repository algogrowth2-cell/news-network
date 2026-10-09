import { NextResponse } from 'next/server';
import { getAdmin, phoneFromRequest } from '@/lib/firebaseAdmin';

/*
 * Matrimony contact — login zaroori. Number SIRF tab milta hai jab:
 *   - wo apni hi profile ho, YA
 *   - dono ke beech "Ruchi" ACCEPT ho chuki ho (kisi bhi taraf se).
 * Warna 403. Isliye koi bina ijazat number nahi nikaal sakta.
 */
export async function GET(req: Request) {
  const admin = await getAdmin();
  if (!admin) return NextResponse.json({ error: 'not-configured' }, { status: 503 });
  const phone = await phoneFromRequest(req);
  if (!phone) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
  const { db } = admin;

  const profileId = new URL(req.url).searchParams.get('profileId') || '';
  if (!profileId) return NextResponse.json({ error: 'bad-request' }, { status: 400 });

  const myProfileId = (await db.collection('matrimony_index').doc(phone).get()).data()?.profileId || '';

  let allowed = profileId === myProfileId;
  if (!allowed) {
    // Maine bheji aur accept hui
    const a = await db.collection('matrimony_interests').doc(`${phone}_${profileId}`).get();
    if (a.exists && a.data()!.status === 'accepted') allowed = true;
  }
  if (!allowed && myProfileId) {
    // Unhone bheji, maine accept ki
    const q = await db.collection('matrimony_interests')
      .where('toProfileId', '==', myProfileId)
      .where('fromProfileId', '==', profileId)
      .where('status', '==', 'accepted')
      .limit(1)
      .get();
    if (!q.empty) allowed = true;
  }

  if (!allowed) return NextResponse.json({ error: 'forbidden', message: 'संपर्क देखने के लिए पहले रुचि स्वीकृत होनी चाहिए।' }, { status: 403 });

  const contact = (await db.collection('matrimony_contacts').doc(profileId).get()).data();
  if (!contact?.ownerPhone) return NextResponse.json({ error: 'not-found' }, { status: 404 });
  return NextResponse.json({ ok: true, contactPhone: contact.ownerPhone });
}
