import { NextResponse, type NextRequest } from 'next/server';
import { ADMIN_COOKIE, readSession } from '@/lib/adminAuth';

/*
 * Server-side admin guard: /admin ke har page se pehle signed session cookie ki jaanch.
 * Bina sahi session ke admin ka koi page (HTML/JS) bhejne ki jagah seedha /admin/login.
 */
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  if (pathname === '/admin/login') return NextResponse.next();

  let ok = false;
  try {
    ok = !!readSession(request.cookies.get(ADMIN_COOKIE)?.value);
  } catch {
    ok = false; // secret set nahi — sab band
  }
  if (ok) return NextResponse.next();

  const url = request.nextUrl.clone();
  url.pathname = '/admin/login';
  url.search = `?next=${encodeURIComponent(pathname + search)}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ['/admin', '/admin/:path*']
};
