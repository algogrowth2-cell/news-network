'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { fallbackFor, getActivePortal } from '@/lib/siteTheme';

/**
 * Har sub-page ke header ka logo — isi portal ka (?site= / domain / pichhla khola), click par portal ka homepage.
 * Sab pages par ek jaisa size (default 54px — logo files me chaaron taraf safed jagah hai).
 */
export default function PortalLogo({ slug, height = 54 }: { slug?: string; height?: number }) {
  const [s, setS] = useState(slug || '');
  useEffect(() => {
    setS(slug || getActivePortal(new URLSearchParams(window.location.search).get('site')));
  }, [slug]);
  if (!s) return <span style={{ display: 'inline-block', width: height, height }} />;
  const site = fallbackFor(s);
  return (
    <Link href={`/?site=${s}`} aria-label={`${site.name} — होम`} title={site.name} style={{ display: 'inline-flex', alignItems: 'center', flexShrink: 0, lineHeight: 0 }}>
      <img src={site.logoUrl} alt={site.name} style={{ height, width: 'auto', maxWidth: height * 2.6, objectFit: 'contain', borderRadius: 6, display: 'block' }} />
    </Link>
  );
}
