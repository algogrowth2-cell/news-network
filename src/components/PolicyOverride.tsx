'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import PortalLogo from '@/components/PortalLogo';
import Footer from '@/components/Footer';
import { fallbackFor, getActivePortal, logoFor } from '@/lib/siteTheme';

/*
 * Jab admin ne kisi policy page ke liye custom content (html) daala ho, to yeh dikhता hai —
 * page ka apna header (PortalLogo) + content + footer. Portal ka rang isi se.
 */
export default function PolicyOverride({ title, html }: { title: string; html: string }) {
  const [slug, setSlug] = useState('the-local-leader');
  useEffect(() => { setSlug(getActivePortal(new URLSearchParams(window.location.search).get('site'))); }, []);
  const cfg = fallbackFor(slug);
  const primary = cfg.primaryColor || '#ea580c';

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <header style={{ background: '#fff', borderBottom: '1px solid #e2e8f0', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <PortalLogo slug={slug} />
          <Link href={`/?site=${slug}`} style={{ color: primary, fontWeight: 700, fontSize: 13, textDecoration: 'none' }}>← मुख्य वेबसाइट</Link>
        </div>
        <div style={{ height: 3, background: primary }} />
      </header>

      <main style={{ maxWidth: 820, margin: '0 auto', padding: '28px 18px 48px' }}>
        {title && <h1 style={{ fontSize: 26, fontWeight: 800, color: '#0f172a', margin: '0 0 18px', borderLeft: `4px solid ${primary}`, paddingLeft: 12 }}>{title}</h1>}
        <div className="policy-html" style={{ color: '#334155', fontSize: 15.5, lineHeight: 1.8 }} dangerouslySetInnerHTML={{ __html: html }} />
      </main>

      <style>{`
        .policy-html h2{font-size:20px;font-weight:800;color:#0f172a;margin:26px 0 10px}
        .policy-html h3{font-size:17px;font-weight:700;color:#1e293b;margin:20px 0 8px}
        .policy-html p{margin:0 0 12px}
        .policy-html ul,.policy-html ol{margin:0 0 14px;padding-left:22px}
        .policy-html li{margin:5px 0}
        .policy-html a{color:${primary};text-decoration:underline}
        .policy-html strong{color:#0f172a}
        .policy-html table{border-collapse:collapse;width:100%;margin:12px 0}
        .policy-html td,.policy-html th{border:1px solid #e2e8f0;padding:8px 10px;text-align:left}
      `}</style>

      <Footer siteName={cfg.name} primaryColor={primary} logoUrl={logoFor(slug, cfg.logoUrl)} tagline={cfg.tagline} currentSlug={slug} />
    </div>
  );
}
