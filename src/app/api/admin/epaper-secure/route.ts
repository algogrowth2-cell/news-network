import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { ADMIN_COOKIE, readSession } from '@/lib/adminAuth';
import { getAdmin } from '@/lib/firebaseAdmin';
import { secureAllEditions } from '@/lib/epaperServer';

/* Admin: saare e-paper surakshit karo (PDF link private, public download token band). Admin e-paper page khulte hi chalta hai. */
export async function POST() {
  let ok = false;
  try {
    ok = !!readSession((await cookies()).get(ADMIN_COOKIE)?.value);
  } catch {
    ok = false;
  }
  if (!ok) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
  if (!getAdmin()) return NextResponse.json({ error: 'not-configured' }, { status: 503 });
  try {
    return NextResponse.json(await secureAllEditions());
  } catch (err) {
    console.error('epaper-secure error:', err);
    return NextResponse.json({ error: 'failed' }, { status: 500 });
  }
}
