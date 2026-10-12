import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { ADMIN_COOKIE, readSession } from '@/lib/adminAuth';
import { gaSummary, type GaSummary } from '@/lib/ga';

// Admin dashboard ke liye GA data. Sirf admin cookie wala khol sakta hai.
// 5 min memory cache — GA API baar-baar call na ho (quota + speed). Website par koi asar nahi.
let cache: { at: number; data: GaSummary } | null = null;
const TTL = 5 * 60 * 1000;

export async function GET() {
  let ok = false;
  try {
    ok = !!readSession((await cookies()).get(ADMIN_COOKIE)?.value);
  } catch {
    ok = false;
  }
  if (!ok) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });

  if (cache && Date.now() - cache.at < TTL) {
    return NextResponse.json({ ...cache.data, cached: true });
  }
  const data = await gaSummary();
  // Sirf safal (configured + bina error) hi cache karo
  if (data.configured && !data.error) cache = { at: Date.now(), data };
  return NextResponse.json(data);
}
