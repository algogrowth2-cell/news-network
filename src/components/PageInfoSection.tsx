'use client';
import { usePageContent } from '@/lib/usePageContent';
import type { PageKey, Benefit } from '@/lib/pageContent';

/**
 * विवाह / शोक संदेश jaise pages par ek editable info + benefit-cards section.
 * Content admin (Admin → पेज कंटेंट) se badalta hai (settings/page_*). Portal ke rंग ke saath.
 */
export default function PageInfoSection({ pageKey, color = '#ea580c' }: { pageKey: PageKey; color?: string }) {
  const c = usePageContent(pageKey);
  const benefits: Benefit[] = c?.benefits || [];
  if (!c?.heading && !benefits.length) return null;

  return (
    <div style={{ maxWidth: 1120, margin: '26px auto 0', padding: '0 4px' }}>
      <style
        dangerouslySetInnerHTML={{
          __html: `
        .pis-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:14px}
        .pis-card{background:#fff;border:1px solid #eceff3;border-radius:16px;padding:20px;transition:transform .18s,box-shadow .18s}
        .pis-card:hover{transform:translateY(-4px);box-shadow:0 14px 32px rgba(2,6,23,.09)}
        .pis-ic{width:50px;height:50px;border-radius:13px;display:flex;align-items:center;justify-content:center;font-size:24px}
        .pis-card h3{margin:12px 0 6px;font-size:16px;color:#111827;font-weight:800}
        .pis-card p{margin:0;font-size:13.5px;color:#64748b;line-height:1.6}
        @media (prefers-color-scheme: dark){
          .pis-card{background:#0f172a;border-color:#1e293b}
          .pis-card h3{color:#f1f5f9}
          .pis-card p{color:#94a3b8}
        }
      `
        }}
      />
      {(c.heading || c.intro) && (
        <div style={{ textAlign: 'center', marginBottom: 18 }}>
          {c.heading && <h2 style={{ margin: '0 0 6px', fontSize: 'clamp(20px,2.6vw,26px)', fontWeight: 900, color }}>{c.heading}</h2>}
          {c.intro && <p style={{ margin: '0 auto', maxWidth: 640, fontSize: 14.5, lineHeight: 1.65, color: '#64748b' }}>{c.intro}</p>}
        </div>
      )}
      <div className="pis-grid">
        {benefits.map((b, i) => (
          <div className="pis-card" key={i}>
            <div className="pis-ic" style={{ background: color + '18', color }}>{b.icon}</div>
            <h3>{b.h}</h3>
            <p>{b.p}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
