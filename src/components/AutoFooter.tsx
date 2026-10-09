'use client';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Footer from '@/components/Footer';
import { fallbackFor, getActivePortal } from '@/lib/siteTheme';

/*
 * Har public page ke neeche footer (root layout se). Jin pages ka apna footer hai (homepage, khabar, e-paper,
 * videos, classifieds) aur admin panel par nahi. Portal: ?site= → domain → pichhla khola portal.
 */
const OWN_FOOTER = ['/article/', '/classifieds', '/epaper', '/videos', '/matrimony'];
const NO_FOOTER = ['/admin', '/api', '/advertiser/requests/new', '/register'];

export default function AutoFooter() {
  const pathname = usePathname() || '/';
  const [slug, setSlug] = useState<string | null>(null);

  useEffect(() => {
    setSlug(getActivePortal(new URLSearchParams(window.location.search).get('site')));
  }, [pathname]);

  if (pathname === '/' || OWN_FOOTER.some((p) => pathname.startsWith(p)) || NO_FOOTER.some((p) => pathname === p || pathname.startsWith(p + '/'))) return null;
  if (!slug) return null;

  const site = fallbackFor(slug);
  return <Footer siteName={site.name} primaryColor={site.primaryColor} logoUrl={site.logoUrl} tagline={site.tagline} currentSlug={slug} />;
}
