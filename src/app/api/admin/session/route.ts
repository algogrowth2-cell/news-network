import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { ADMIN_COOKIE, readSession } from '@/lib/adminAuth';

/* GET → abhi ka admin (cookie server par verify), warna 401 */
export async function GET() {
  const store = await cookies();
  let session = null;
  try {
    session = readSession(store.get(ADMIN_COOKIE)?.value);
  } catch {
    session = null;
  }
  if (!session) return NextResponse.json({ ok: false }, { status: 401, headers: { 'Cache-Control': 'no-store' } });
  return NextResponse.json({ ok: true, email: session.email }, { headers: { 'Cache-Control': 'no-store' } });
}
