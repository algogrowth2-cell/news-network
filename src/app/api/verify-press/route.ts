import { NextResponse } from 'next/server';
import { getAdmin } from '@/lib/firebaseAdmin';

/*
 * Press ID QR verify (public) — sirf wahi jo card par chhapa hai: naam, photo, padnaam, portal, kshetra, vaidhta, status.
 * Mobile, email, pata waghera nahi (reporters collection ab public nahi padhi ja sakti).
 */
export async function GET(req: Request) {
  const admin = (await getAdmin());
  if (!admin) return NextResponse.json({ error: 'not-configured' }, { status: 503 });
  const id = (new URL(req.url).searchParams.get('id') || '').trim().toUpperCase().slice(0, 30);
  if (!/^[A-Z0-9]+-\d{4}-\d+$/.test(id)) return NextResponse.json({ found: false });
  const snap = await admin.db.collection('reporters').where('pressIdList', 'array-contains', id).limit(1).get();
  if (snap.empty) return NextResponse.json({ found: false });
  const r = snap.docs[0].data();
  const slug = Object.keys(r.pressIds || {}).find((k) => r.pressIds[k] === id) || r.cardSiteId || 'the-local-leader';
  const ts = (v: any) => (v?.toDate ? v.toDate().toISOString() : v || null);
  return NextResponse.json(
    {
      found: true,
      name: r.name || '',
      photo: r.photoUrl || '',
      designation: r.designation || 'Reporter',
      slug,
      area: r.workArea || r.city || '',
      issuedOn: r.pressIdIssuedOn?.[slug] || null,
      cardValidTill: ts(r.cardValidTill),
      status: r.status || '',
      cardStatus: r.cardStatus || ''
    },
    { headers: { 'Cache-Control': 'public, s-maxage=60' } }
  );
}
