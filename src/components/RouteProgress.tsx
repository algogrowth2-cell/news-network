'use client';
import { useEffect, useRef, useState, Suspense } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

/*
 * Patla top progress bar — page badalte waqt dikhता hai. Isse navigation "same site, page load ho raha"
 * jaisा feel deta hai (blank/'dusri website' jaisा nahi). Link clicks + 'nav:start' event (router.push) dono se.
 */
function Bar() {
  const pathname = usePathname();
  const search = useSearchParams();
  const [w, setW] = useState(0);
  const [show, setShow] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const first = useRef(true);

  const start = () => {
    setShow(true);
    setW(10);
    if (timer.current) clearInterval(timer.current);
    timer.current = setInterval(() => setW((p) => (p < 90 ? p + (90 - p) * 0.12 : p)), 160);
  };
  const done = () => {
    if (timer.current) clearInterval(timer.current);
    setW(100);
    setTimeout(() => { setShow(false); setW(0); }, 260);
  };

  // Link clicks (internal) + programmatic nav event → start
  useEffect(() => {
    const cur = pathname + (search?.toString() ? `?${search}` : '');
    const onStart = () => start();
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
      const a = (e.target as HTMLElement)?.closest?.('a');
      if (!a) return;
      if (a.target === '_blank' || a.hasAttribute('download')) return;
      const href = a.getAttribute('href') || '';
      if (href.startsWith('/') && !href.startsWith('//') && href !== cur) start();
    };
    window.addEventListener('nav:start', onStart);
    document.addEventListener('click', onClick, true);
    return () => {
      window.removeEventListener('nav:start', onStart);
      document.removeEventListener('click', onClick, true);
    };
  }, [pathname, search]);

  // Route badal gaya → poora + chhupa
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    done();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, search]);

  if (!show) return null;
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, height: 3, zIndex: 99999, pointerEvents: 'none' }}>
      <div
        style={{
          height: '100%',
          width: `${w}%`,
          background: 'linear-gradient(90deg,#ea580c,#f97316)',
          boxShadow: '0 0 8px rgba(234,88,12,.6)',
          transition: 'width .18s ease',
          borderRadius: '0 2px 2px 0'
        }}
      />
    </div>
  );
}

export default function RouteProgress() {
  return (
    <Suspense fallback={null}>
      <Bar />
    </Suspense>
  );
}
