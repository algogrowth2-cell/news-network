import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const DOMAIN_TO_SLUG: { [key: string]: string } = {
  // 1. The Local Leader
  'thelocalleader.in': 'the-local-leader',
  'www.thelocalleader.in': 'the-local-leader',

  // 2. The Proview Times
  'theproviewtimes.com': 'the-provue-times',
  'www.theproviewtimes.com': 'the-provue-times',

  // 3. National Defence Network
  'nationaldefencenetwork.com': 'ndn-defence',
  'www.nationaldefencenetwork.com': 'ndn-defence',

  // 4. Bazar Karobar
  'bazarkarobar.com': 'bazar-karobar',
  'www.bazarkarobar.com': 'bazar-karobar',

  // 5. Golden Pearl Chronicles (Domain pending)
  // 'goldenpearlcorporation.com': 'golden-pearl-chronicles',
  // 'www.goldenpearlcorporation.com': 'golden-pearl-chronicles',

  // 6. Desh Ki Aawaz
  'deshkiawaz.com': 'desh-ki-aawaz',
  'www.deshkiawaz.com': 'desh-ki-aawaz',

  // 7. Jan Bharat News
  'janbharatnews.com': 'jan-bharat-news',
  'www.janbharatnews.com': 'jan-bharat-news',

  // 8. News Info 24
  'newsinfo24.in': 'news-info-24',
  'www.newsinfo24.in': 'news-info-24'
};

export function middleware(request: NextRequest) {
  const url = request.nextUrl;
  const hostname = request.headers.get('host') || '';
  const cleanDomain = hostname.split(':')[0].toLowerCase();

  // 1. Admin Panel Domain Handling (goldenpearlnews.com)
  if (cleanDomain === 'goldenpearlnews.com' || cleanDomain === 'www.goldenpearlnews.com') {
    if (url.pathname === '/') {
      const adminUrl = url.clone();
      adminUrl.pathname = '/admin';
      return NextResponse.rewrite(adminUrl);
    }
    return NextResponse.next();
  }

  // 2. Skip middleware rewrite for internal admin & API calls
  if (url.pathname.startsWith('/admin') || url.pathname.startsWith('/api')) {
    return NextResponse.next();
  }

  // 3. Portals Routing (Mapping Hostname to Portal Slug)
  const matchedSlug = DOMAIN_TO_SLUG[cleanDomain];
  if (matchedSlug && !url.searchParams.get('site')) {
    const rewriteUrl = url.clone();
    rewriteUrl.searchParams.set('site', matchedSlug);

    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-site-domain', hostname);

    return NextResponse.rewrite(rewriteUrl, {
      request: {
        headers: requestHeaders,
      },
    });
  }

  // 4. Default header forwarding
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-site-domain', hostname);

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|logos).*)'],
};