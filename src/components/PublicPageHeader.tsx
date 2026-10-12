'use client';
import Link from 'next/link';
import PortalLogo from './PortalLogo';
import { fallbackFor } from '@/lib/siteTheme';

/**
 * Sub-pages (जनता दरबार / पत्रकार / विज्ञापन) ke liye saaf, professional header.
 * Logo click par usi portal ka homepage. Portal ke theme-colour ke saath.
 */
export default function PublicPageHeader({ slug }: { slug: string }) {
  const site = fallbackFor(slug);
  const c = site.primaryColor || '#ea580c';
  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        background: 'rgba(255,255,255,.92)',
        backdropFilter: 'saturate(180%) blur(10px)',
        WebkitBackdropFilter: 'saturate(180%) blur(10px)',
        borderBottom: '1px solid #e8eaed',
        boxShadow: '0 1px 3px rgba(2,6,23,.04)'
      }}
    >
      <div style={{ height: 3, background: `linear-gradient(90deg, ${c}, ${c}99 60%, transparent)` }} />
      <div
        style={{
          maxWidth: 1380,
          margin: '0 auto',
          padding: '10px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
          <PortalLogo slug={slug} height={46} />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#111827', lineHeight: 1.15, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontFamily: 'system-ui,-apple-system,sans-serif' }}>
              {site.name}
            </div>
            {site.tagline && (
              <div style={{ fontSize: 11.5, color: '#6b7280', lineHeight: 1.3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {site.tagline}
              </div>
            )}
          </div>
        </div>
        <Link
          href={`/?site=${slug}`}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            background: c,
            color: '#fff',
            textDecoration: 'none',
            fontSize: 13.5,
            fontWeight: 700,
            padding: '9px 16px',
            borderRadius: 10,
            whiteSpace: 'nowrap',
            flexShrink: 0
          }}
        >
          ← होम
        </Link>
      </div>
    </header>
  );
}
