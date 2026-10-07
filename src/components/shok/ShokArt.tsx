'use client';
import { useId } from 'react';

/*
 * Shok sandesh card ki sajawat — emoji nahi, asli jaise chitra (SVG): pital ke latakte diye, mitti ka diya,
 * genda / gulab ke phool, pattiyan, sunehri nakkashi, toran, agarbatti, paisley background.
 * Har chitra ke gradient IDs alag (useId) — ek page par kai card hon ya PNG/PDF bane, rang na tootein.
 */

const uid = (raw: string) => raw.replace(/[^a-zA-Z0-9_-]/g, '');

/** Pital ka chamakdar rang (gradient defs) */
function BrassDefs({ id }: { id: string }) {
  return (
    <defs>
      <linearGradient id={`${id}-brass`} x1="0" x2="1" y1="0" y2="0">
        <stop offset="0" stopColor="#7a4b0c" />
        <stop offset="0.25" stopColor="#d9a23a" />
        <stop offset="0.5" stopColor="#ffe08a" />
        <stop offset="0.75" stopColor="#c98a24" />
        <stop offset="1" stopColor="#6b3f08" />
      </linearGradient>
      <radialGradient id={`${id}-flame`} cx="0.5" cy="0.7" r="0.6">
        <stop offset="0" stopColor="#fffbe6" />
        <stop offset="0.35" stopColor="#ffd54a" />
        <stop offset="0.75" stopColor="#ff8a00" />
        <stop offset="1" stopColor="#e65100" stopOpacity="0.9" />
      </radialGradient>
      <radialGradient id={`${id}-glow`} cx="0.5" cy="0.5" r="0.5">
        <stop offset="0" stopColor="#ffd54a" stopOpacity="0.55" />
        <stop offset="1" stopColor="#ffd54a" stopOpacity="0" />
      </radialGradient>
    </defs>
  );
}

/** Lau (jalta hua) */
const Flame = ({ id, x, y, s = 1 }: { id: string; x: number; y: number; s?: number }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <circle cx="0" cy="-6" r="11" fill={`url(#${id}-glow)`} />
    <path d="M0 -16 C 5 -9, 6 -4, 0 2 C -6 -4, -5 -9, 0 -16 Z" fill={`url(#${id}-flame)`} />
    <path d="M0 -8 C 2 -5, 2 -2, 0 0.5 C -2 -2, -2 -5, 0 -8 Z" fill="#fff8e1" />
  </g>
);

/** Chhat se latakta pital ka diya (zanjeer ke saath) */
export function HangingDiya({ height = 120, width = 38 }: { height?: number; width?: number }) {
  const id = uid(useId());
  const chain = Array.from({ length: 9 }, (_, i) => i);
  return (
    <svg width={width} height={height} viewBox="0 0 40 130" aria-hidden="true">
      <BrassDefs id={id} />
      {chain.map((i) => (
        <ellipse key={i} cx="20" cy={4 + i * 7} rx="2.2" ry="3.6" fill="none" stroke={`url(#${id}-brass)`} strokeWidth="1.4" />
      ))}
      {/* upar ka chhatra */}
      <path d="M12 68 Q20 60 28 68 L26 72 L14 72 Z" fill={`url(#${id}-brass)`} />
      <circle cx="20" cy="66" r="2.2" fill="#ffe08a" />
      {/* teen patli zanjeer diye tak */}
      <path d="M14 72 L9 96 M20 72 L20 96 M26 72 L31 96" stroke={`url(#${id}-brass)`} strokeWidth="0.9" />
      {/* diya ka katora */}
      <path d="M4 96 Q20 92 36 96 Q34 108 20 110 Q6 108 4 96 Z" fill={`url(#${id}-brass)`} />
      <path d="M4 96 Q20 99 36 96" stroke="#5c3507" strokeWidth="0.8" fill="none" opacity="0.6" />
      {/* neeche ki ghanti / latkan */}
      <path d="M17 110 L23 110 L22 116 L18 116 Z" fill={`url(#${id}-brass)`} />
      <circle cx="20" cy="120" r="3.4" fill={`url(#${id}-brass)`} />
      <circle cx="20" cy="126" r="1.8" fill="#c98a24" />
      <Flame id={id} x={20} y={95} s={0.9} />
    </svg>
  );
}

/** Mitti ka diya (zameen par) */
export function ClayDiya({ size = 46 }: { size?: number }) {
  const id = uid(useId());
  return (
    <svg width={size} height={size * 0.75} viewBox="0 0 60 45" aria-hidden="true">
      <BrassDefs id={id} />
      <defs>
        <linearGradient id={`${id}-clay`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#d35400" />
          <stop offset="1" stopColor="#7b2d00" />
        </linearGradient>
      </defs>
      <path d="M4 26 Q30 20 56 26 Q50 42 30 43 Q10 42 4 26 Z" fill={`url(#${id}-clay)`} />
      <path d="M48 24 Q56 20 58 24 Q54 27 48 27 Z" fill={`url(#${id}-clay)`} />
      <path d="M8 27 Q30 31 52 27" stroke="#f5b041" strokeWidth="1.2" fill="none" />
      <circle cx="18" cy="34" r="1.6" fill="#f5b041" />
      <circle cx="30" cy="36" r="1.6" fill="#f5b041" />
      <circle cx="42" cy="34" r="1.6" fill="#f5b041" />
      <Flame id={id} x={55} y={23} s={0.85} />
    </svg>
  );
}

/** Genda (marigold) */
export function Marigold({ size = 34, tone = 'orange' }: { size?: number; tone?: 'orange' | 'yellow' }) {
  const id = uid(useId());
  const [c1, c2, c3] = tone === 'yellow' ? ['#fff3a0', '#ffc107', '#e69500'] : ['#ffcf6b', '#ff8f00', '#d95300'];
  const ring = (n: number, r: number, rx: number, ry: number) =>
    Array.from({ length: n }, (_, i) => {
      const a = (i * 360) / n;
      return <ellipse key={`${r}-${i}`} cx="0" cy={-r} rx={rx} ry={ry} transform={`rotate(${a})`} fill={`url(#${id}-p)`} stroke={c3} strokeWidth="0.35" />;
    });
  return (
    <svg width={size} height={size} viewBox="-20 -20 40 40" aria-hidden="true">
      <defs>
        <radialGradient id={`${id}-p`} cx="0.5" cy="0.3" r="0.8">
          <stop offset="0" stopColor={c1} />
          <stop offset="0.6" stopColor={c2} />
          <stop offset="1" stopColor={c3} />
        </radialGradient>
      </defs>
      {ring(18, 12, 4.2, 6.5)}
      {ring(14, 8, 3.6, 5.4)}
      {ring(10, 4.5, 3, 4.2)}
      <circle r="3.2" fill={c3} />
      <circle r="1.6" fill="#8d3b00" opacity="0.7" />
    </svg>
  );
}

/** Gulab (rose) */
export function Rose({ size = 34, color = '#d81b60' }: { size?: number; color?: string }) {
  const id = uid(useId());
  return (
    <svg width={size} height={size} viewBox="-20 -20 40 40" aria-hidden="true">
      <defs>
        <radialGradient id={`${id}-r`} cx="0.45" cy="0.35" r="0.75">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.55" />
          <stop offset="0.35" stopColor={color} />
          <stop offset="1" stopColor="#5a0024" />
        </radialGradient>
      </defs>
      {[0, 72, 144, 216, 288].map((a) => (
        <path key={a} d="M0 -17 C 10 -17, 15 -6, 9 2 C 4 -4, -4 -4, -9 2 C -15 -6, -10 -17, 0 -17 Z" transform={`rotate(${a})`} fill={`url(#${id}-r)`} />
      ))}
      <circle r="10.5" fill={`url(#${id}-r)`} />
      <path d="M-6 -2 C -6 -9, 6 -9, 6 -2 C 6 3, -1 4, -2 0 C -3 -3, 2 -4, 2 -1" fill="none" stroke="#4a001c" strokeWidth="1.2" strokeLinecap="round" opacity="0.75" />
      <path d="M-8 2 C -6 8, 6 8, 8 2" fill="none" stroke="#4a001c" strokeWidth="1" opacity="0.5" />
    </svg>
  );
}

/** Patti */
export function Leaf({ size = 26, rotate = 0, color = '#2e7d32' }: { size?: number; rotate?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="-15 -15 30 30" style={{ transform: `rotate(${rotate}deg)` }} aria-hidden="true">
      <path d="M-13 0 C -6 -9, 7 -9, 13 0 C 7 9, -6 9, -13 0 Z" fill={color} />
      <path d="M-12 0 L 12 0 M-4 0 L 0 -4 M2 0 L 6 -3 M-4 0 L 0 4 M2 0 L 6 3" stroke="#a5d6a7" strokeWidth="0.8" fill="none" />
    </svg>
  );
}

/** Photo ke neeche phoolon ka guchha */
export function FlowerBed({ kind = 'marigold', width = 220 }: { kind?: 'marigold' | 'rose' | 'mixed' | 'sunflower'; width?: number }) {
  const big = Math.round(width * 0.17);
  const mid = Math.round(width * 0.13);
  const small = Math.round(width * 0.1);
  const flower = (i: number, s: number) => {
    if (kind === 'rose') return <Rose size={s} color={i % 2 ? '#e91e63' : '#c2185b'} />;
    if (kind === 'mixed') return i % 2 ? <Rose size={s} color="#ec407a" /> : <Marigold size={s} tone={i % 3 ? 'orange' : 'yellow'} />;
    return <Marigold size={s} tone={kind === 'sunflower' || i % 2 ? 'yellow' : 'orange'} />;
  };
  return (
    <div style={{ position: 'relative', width, height: big * 1.25, margin: '0 auto' }} aria-hidden="true">
      <div style={{ position: 'absolute', left: '2%', top: '30%' }}><Leaf size={mid} rotate={-20} /></div>
      <div style={{ position: 'absolute', right: '2%', top: '30%' }}><Leaf size={mid} rotate={200} /></div>
      <div style={{ position: 'absolute', left: '12%', top: '18%' }}>{flower(1, mid)}</div>
      <div style={{ position: 'absolute', right: '12%', top: '18%' }}>{flower(2, mid)}</div>
      <div style={{ position: 'absolute', left: '28%', top: '2%' }}>{flower(3, big)}</div>
      <div style={{ position: 'absolute', right: '28%', top: '2%' }}>{flower(4, big)}</div>
      <div style={{ position: 'absolute', left: '50%', top: 0, transform: 'translateX(-50%)' }}>{flower(5, big)}</div>
      <div style={{ position: 'absolute', left: '22%', top: '48%' }}><Leaf size={small} rotate={30} color="#388e3c" /></div>
      <div style={{ position: 'absolute', right: '22%', top: '48%' }}><Leaf size={small} rotate={150} color="#388e3c" /></div>
    </div>
  );
}

/** Kone ki sunehri nakkashi (corner = tl / tr / bl / br) */
export function CornerOrnament({ size = 64, corner = 'tl', color = '#b8860b' }: { size?: number; corner?: 'tl' | 'tr' | 'bl' | 'br'; color?: string }) {
  const id = uid(useId());
  const t = corner === 'tr' ? 'scale(-1 1) translate(-80 0)' : corner === 'bl' ? 'scale(1 -1) translate(0 -80)' : corner === 'br' ? 'scale(-1 -1) translate(-80 -80)' : '';
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" aria-hidden="true">
      <defs>
        <linearGradient id={`${id}-g`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#7a5200" />
          <stop offset="0.45" stopColor="#f3c969" />
          <stop offset="1" stopColor={color} />
        </linearGradient>
      </defs>
      <g transform={t} fill="none" stroke={`url(#${id}-g)`} strokeLinecap="round">
        <path d="M4 76 L4 14 Q4 4 14 4 L76 4" strokeWidth="3" />
        <path d="M10 70 L10 18 Q10 10 18 10 L70 10" strokeWidth="1.2" />
        <path d="M14 14 C 30 14, 34 30, 22 34 C 14 37, 12 26, 20 24 C 26 23, 27 30, 23 30" strokeWidth="2" />
        <path d="M14 14 C 14 30, 30 34, 34 22 C 37 14, 26 12, 24 20 C 23 26, 30 27, 30 23" strokeWidth="2" />
        <path d="M34 8 C 44 2, 52 10, 46 16 C 42 20, 38 14, 42 12" strokeWidth="1.6" />
        <path d="M8 34 C 2 44, 10 52, 16 46 C 20 42, 14 38, 12 42" strokeWidth="1.6" />
        <circle cx="14" cy="14" r="3" fill={`url(#${id}-g)`} />
      </g>
    </svg>
  );
}

/** Sajaawati divider (beech me phool) */
export function OrnateDivider({ width = 220, color = '#b8860b' }: { width?: number; color?: string }) {
  return (
    <svg width={width} height="16" viewBox="0 0 220 16" aria-hidden="true">
      <path d="M2 8 L88 8 M132 8 L218 8" stroke={color} strokeWidth="1.2" />
      <path d="M88 8 C 96 0, 104 0, 110 8 C 116 0, 124 0, 132 8 C 124 16, 116 16, 110 8 C 104 16, 96 16, 88 8 Z" fill={color} opacity="0.85" />
      <circle cx="110" cy="8" r="2.6" fill="#fff8e1" />
      <circle cx="80" cy="8" r="2" fill={color} />
      <circle cx="140" cy="8" r="2" fill={color} />
    </svg>
  );
}

/** Upar latakti genda maala (toran) */
export function MarigoldToran({ width = 400, strands = 7 }: { width?: number; strands?: number }) {
  return (
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, display: 'flex', justifyContent: 'space-between', padding: '0 6px', pointerEvents: 'none' }} aria-hidden="true">
      {Array.from({ length: strands }, (_, i) => {
        const len = i % 2 ? 3 : 4;
        return (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: -6 }}>
            {Array.from({ length: len }, (_, k) => (
              <div key={k} style={{ marginTop: -7 }}>
                <Marigold size={Math.round(width * 0.045)} tone={(i + k) % 2 ? 'yellow' : 'orange'} />
              </div>
            ))}
            <div style={{ marginTop: -4 }}>
              <Leaf size={Math.round(width * 0.035)} rotate={90} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

/** Agarbatti (dhuaan ke saath) */
export function Incense({ height = 90 }: { height?: number }) {
  return (
    <svg width={height * 0.4} height={height} viewBox="0 0 36 90" aria-hidden="true">
      <path d="M12 34 C 6 26, 18 22, 12 14 C 7 8, 16 4, 13 0" stroke="#9e9e9e" strokeWidth="1.2" fill="none" opacity="0.7" />
      <path d="M24 34 C 30 26, 18 22, 24 14 C 29 8, 20 4, 23 0" stroke="#bdbdbd" strokeWidth="1.1" fill="none" opacity="0.6" />
      <path d="M12 34 L14 78 M24 34 L22 78" stroke="#6d4c41" strokeWidth="2.2" />
      <circle cx="12" cy="34" r="1.6" fill="#ff7043" />
      <circle cx="24" cy="34" r="1.6" fill="#ff7043" />
      <path d="M6 78 L30 78 L27 88 L9 88 Z" fill="#c98a24" />
      <path d="M6 78 L30 78" stroke="#7a4b0c" strokeWidth="1.4" />
    </svg>
  );
}

/** Halka paisley / damask background (CSS background-image) */
export function damaskBg(color = '#c9a24a', opacity = 0.12) {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='90' height='90' viewBox='0 0 90 90'><g fill='none' stroke='${color}' stroke-opacity='${opacity}' stroke-width='1.4'><path d='M45 8 C 60 18, 60 36, 45 44 C 30 36, 30 18, 45 8 Z'/><path d='M45 46 C 60 56, 60 74, 45 82 C 30 74, 30 56, 45 46 Z'/><path d='M8 45 C 18 30, 36 30, 44 45 C 36 60, 18 60, 8 45 Z'/><path d='M46 45 C 54 30, 72 30, 82 45 C 72 60, 54 60, 46 45 Z'/><circle cx='45' cy='45' r='3'/><circle cx='0' cy='0' r='6'/><circle cx='90' cy='0' r='6'/><circle cx='0' cy='90' r='6'/><circle cx='90' cy='90' r='6'/></g></svg>`;
  return `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}")`;
}
