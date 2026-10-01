'use client';

import React from 'react';
import Link from 'next/link';

/*
 * Khaali category/filter ke liye common empty state + feed loading skeleton.
 * Rang portal ke primaryColor se aate hain; card/text colors CSS variables se, taaki page apni theme de sake.
 */
const ES_STYLES = `
.es-box{--es-bg:#fff;--es-border:#e2ded7;--es-title:#1f2937;--es-text:#6b7280;
  background:var(--es-bg);border:1.5px dashed var(--es-border);border-radius:16px;padding:44px 20px;text-align:center;
  display:flex;flex-direction:column;align-items:center;gap:10px;width:100%;box-sizing:border-box}
.es-icon{width:64px;height:64px;border-radius:50%;display:grid;place-items:center;margin-bottom:4px}
.es-title{margin:0;font-size:17px;font-weight:800;color:var(--es-title);line-height:1.45;max-width:440px}
.es-text{margin:0;font-size:13.5px;color:var(--es-text);line-height:1.65;max-width:440px}
.es-btn{margin-top:8px;display:inline-flex;align-items:center;gap:6px;color:#fff;border:0;border-radius:10px;padding:10px 22px;font-size:14px;font-weight:700;cursor:pointer;text-decoration:none;font-family:inherit}
.es-btn:hover{filter:brightness(1.07)}
.es-skel{display:flex;flex-direction:column;gap:12px}
.es-skel-item{display:flex;gap:14px;background:#fff;border:1px solid #eae8e4;border-radius:14px;padding:12px}
.es-skel-lines{flex:1;display:flex;flex-direction:column;gap:9px;padding-top:2px}
.es-shimmer{background:linear-gradient(90deg,#efede9 25%,#f7f6f3 37%,#efede9 63%);background-size:400% 100%;animation:esShimmer 1.3s ease infinite;border-radius:6px}
@keyframes esShimmer{0%{background-position:100% 50%}100%{background-position:0 50%}}
@media(max-width:560px){
  .es-box{padding:34px 16px}
  .es-title{font-size:15.5px}
  .es-text{font-size:13px}
  .es-btn{width:100%;justify-content:center}
}
@media(prefers-reduced-motion:reduce){.es-shimmer{animation:none}}
`;

const NewspaperIcon = ({ color }: { color: string }) => (
  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M4 22h16a2 2 0 002-2V4a2 2 0 00-2-2H8a2 2 0 00-2 2v16a2 2 0 01-2 2zm0 0a2 2 0 01-2-2v-9c0-1.1.9-2 2-2h2" />
    <path d="M18 14h-8M15 18h-5M10 6h8v4h-8z" />
  </svg>
);

const tint = (hex: string, alpha: number) => {
  if (!/^#[0-9a-f]{6}$/i.test(hex)) return `rgba(234,88,12,${alpha})`;
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
};

export default function EmptyState({
  title,
  message,
  icon,
  actionLabel,
  onAction,
  actionHref,
  primaryColor = '#ea580c'
}: {
  title: string;
  message?: string;
  icon?: React.ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  actionHref?: string;
  primaryColor?: string;
}) {
  return (
    <div className="es-box" role="status">
      <style dangerouslySetInnerHTML={{ __html: ES_STYLES }} />
      <div className="es-icon" style={{ background: tint(primaryColor, 0.1) }}>
        {icon ?? <NewspaperIcon color={primaryColor} />}
      </div>
      <h3 className="es-title">{title}</h3>
      {message && <p className="es-text">{message}</p>}
      {actionLabel && actionHref && (
        <Link href={actionHref} className="es-btn" style={{ background: primaryColor }}>
          {actionLabel}
        </Link>
      )}
      {actionLabel && !actionHref && onAction && (
        <button type="button" className="es-btn" style={{ background: primaryColor }} onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </div>
  );
}

// News list ke liye loading skeleton (spinner text ke bajaye)
export function FeedSkeleton({ rows = 4, label = 'खबरें लोड हो रही हैं…' }: { rows?: number; label?: string }) {
  return (
    <div className="es-skel" aria-busy="true" aria-label={label}>
      <style dangerouslySetInnerHTML={{ __html: ES_STYLES }} />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="es-skel-item">
          <div className="es-skel-lines">
            <div className="es-shimmer" style={{ height: '11px', width: '28%' }} />
            <div className="es-shimmer" style={{ height: '14px', width: '92%' }} />
            <div className="es-shimmer" style={{ height: '14px', width: '70%' }} />
            <div className="es-shimmer" style={{ height: '10px', width: '35%', marginTop: '4px' }} />
          </div>
          <div className="es-shimmer" style={{ width: '104px', height: '78px', borderRadius: '10px', flexShrink: 0 }} />
        </div>
      ))}
    </div>
  );
}
