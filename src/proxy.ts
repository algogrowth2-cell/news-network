import { NextResponse, type NextRequest } from 'next/server';
import { ADMIN_COOKIE, readSession } from '@/lib/adminAuth';

/*
 * Admin ab ek "secret path" se khulta hai (DNS/subdomain ki zaroorat nahi):
 *   /newsroom[/...]  → admin app (login / panel). URL me /newsroom hi dikhta hai.
 *   /admin[/...]     → sirf logged-in ke liye (login ke baad andar ki navigation). Bina session wala
 *                      (jo /admin guess kare) → home par bhej diya jaata hai, taaki login kahin na mile.
 * Signed cookie hi asli suraksha hai; secret path bas extra parda (casual guessing rok).
 */
const SECRET = '/newsroom';

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  let authed = false;
  try {
    authed = !!readSession(request.cookies.get(ADMIN_COOKIE)?.value);
  } catch {
    authed = false;
  }

  // Secret entry → admin app serve (rewrite: URL /newsroom hi rehta hai)
  if (pathname === SECRET || pathname.startsWith(`${SECRET}/`)) {
    const url = request.nextUrl.clone();
    url.pathname = `/admin${pathname.slice(SECRET.length)}`;
    // Login nahi hai → admin login dikhao (bina session panel na khule)
    if (!authed && url.pathname !== '/admin/login') url.pathname = '/admin/login';
    return NextResponse.rewrite(url);
  }

  // Seedha /admin: logged-in ko andar jaane do; warna chhupa do (home) — /admin/login bhi nahi khulega
  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    if (authed) return NextResponse.next();
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin', '/admin/:path*', '/newsroom', '/newsroom/:path*']
};
