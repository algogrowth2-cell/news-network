import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createHash } from 'node:crypto';
import { ADMIN_COOKIE, readSession } from '@/lib/adminAuth';
import { getAdmin } from '@/lib/firebaseAdmin';

/*
 * Admin session (signed HttpOnly cookie) → Firebase custom token { admin: true }.
 * Admin panel isi se Firebase me sign-in karta hai; Firestore rules me admin = request.auth.token.admin == true.
 */
export async function POST() {
  let session = null;
  try {
    session = readSession((await cookies()).get(ADMIN_COOKIE)?.value);
  } catch {
    session = null;
  }
  if (!session) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
  const admin = getAdmin();
  if (!admin) return NextResponse.json({ error: 'not-configured' }, { status: 503 });
  const uid = `admin_${createHash('sha256').update(session.email).digest('hex').slice(0, 24)}`;
  const token = await admin.auth.createCustomToken(uid, { admin: true, adminEmail: session.email });
  return NextResponse.json({ token }, { headers: { 'Cache-Control': 'no-store' } });
}
