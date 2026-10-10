import { NextResponse } from 'next/server';
import { getAdmin } from '@/lib/firebaseAdmin';

/*
 * Vigyapan ki impression/click ginti — server se (Admin SDK). Client Firestore write nahi,
 * isliye koi "Missing permissions" console error nahi. Low-stakes: koi auth nahi (jaise pehle rule).
 */
export async function POST(req: Request) {
  const admin = await getAdmin();
  if (!admin) return NextResponse.json({ ok: false });
  const body = await req.json().catch(() => ({}));
  const id = String(body.id || '').slice(0, 200);
  const type = body.type === 'click' ? 'clicks' : body.type === 'impression' ? 'impressions' : '';
  if (!id || !type) return NextResponse.json({ ok: false });
  try {
    await admin.db.collection('ads').doc(id).update({ [type]: admin.FieldValue.increment(1) });
  } catch { /* ad na ho / purana — chup-chap */ }
  return NextResponse.json({ ok: true });
}
