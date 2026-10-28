import { NextResponse, type NextRequest } from 'next/server';
import { ADMIN_COOKIE, readSession } from '@/lib/adminAuth';

/*
 * Admin ka secret darwaza /newsroom (DNS/subdomain ki zaroorat nahi):
 *   /newsroom[/...] → ek chhota "gate" cookie set karke admin login (ya logged-in ho to panel) par bhejta hai.
 *   /admin[/...]    → sirf tab khulta hai jab (a) login ho, ya (b) gate cookie ho (yaani /newsroom se aaye).
 *                     Bina in dono ke /admin guess karne wala seedha home par — login kahin nahi milta.
 * Asli suraksha signed session cookie hai; ye secret path + gate bas extra parda (casual guessing rok).
 */
const SECRET = '/newsroom';
const GATE = 'gpn_gate';
const GATE_MAX_AGE = 6 * 60 * 60; // 6 ghante

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  let authed = false;
  try {
    authed = !!readSession(request.cookies.get(ADMIN_COOKIE)?.value);
  } catch {
    authed = false;
  }
  const gated = request.cookies.get(GATE)?.value === '1';

  // Secret darwaza: gate cookie set + admin par bhejo (login ya panel)
  if (pathname === SECRET || pathname.startsWith(`${SECRET}/`)) {
    const url = request.nextUrl.clone();
    url.pathname = authed ? '/admin' : '/admin/login';
    url.search = '';
    const res = NextResponse.redirect(url);
    res.cookies.set(GATE, '1', { httpOnly: true, sameSite: 'lax', path: '/', maxAge: GATE_MAX_AGE });
    return res;
  }

  // /admin — login ya gate ke bina chhupa (home)
  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    if (!authed && !gated) return NextResponse.redirect(new URL('/', request.url));
    if (authed) return NextResponse.next();
    // gate hai par login nahi: login page khulne do; baaki protected page → login
    if (pathname === '/admin/login') return NextResponse.next();
    const url = request.nextUrl.clone();
    url.pathname = '/admin/login';
    url.search = `?next=${encodeURIComponent(pathname + search)}`;
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin', '/admin/:path*', '/newsroom', '/newsroom/:path*']
};
