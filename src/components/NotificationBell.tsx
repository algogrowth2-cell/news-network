'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { collection, limit, onSnapshot, orderBy, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { isVisibleNotification, loadSeen, notifIcon, parseNotification, saveSeen, timeAgoHi, type NotificationItem } from '@/lib/notifications';

interface Props {
  portal: string;
  loggedIn: boolean;
  userKey: string; // padhe/na-padhe isi user ke liye
  primaryColor: string;
  isEnglish?: boolean;
  /** Link me ?site= jodne ke liye */
  siteQuery?: string;
}

const CSS = `
.nb-wrap{position:relative;display:inline-flex}
.nb-btn{position:relative;width:38px;height:38px;border-radius:50%;border:1px solid #eae8e4;background:#fff;cursor:pointer;display:grid;place-items:center;color:#334155;transition:background .15s}
.nb-btn:hover{background:#f8f7f5}
.nb-btn:focus-visible{outline:2px solid var(--nb-brand);outline-offset:2px}
.nb-badge{position:absolute;top:-4px;right:-4px;min-width:18px;height:18px;padding:0 5px;border-radius:9px;background:#dc2626;color:#fff;font-size:10.5px;font-weight:800;display:grid;place-items:center;border:2px solid #fff;font-family:system-ui,sans-serif}
.nb-panel{position:absolute;top:46px;right:0;width:360px;max-width:calc(100vw - 24px);background:#fff;border:1px solid #eae8e4;border-radius:14px;box-shadow:0 18px 40px rgba(15,23,42,.18);z-index:300;overflow:hidden;text-align:left}
.nb-head{display:flex;justify-content:space-between;align-items:center;padding:12px 14px;border-bottom:1px solid #f1efeb}
.nb-head b{font-size:15px;color:#0f172a}
.nb-link{background:none;border:0;color:var(--nb-brand);font-size:12.5px;font-weight:700;cursor:pointer;font-family:inherit;padding:0}
.nb-list{max-height:420px;overflow-y:auto}
.nb-item{display:flex;gap:11px;padding:12px 14px;border-bottom:1px solid #f5f3f0;cursor:pointer;text-decoration:none;color:inherit;position:relative;background:#fff;width:100%;border-left:0;border-right:0;border-top:0;font-family:inherit;text-align:left}
.nb-item:hover{background:#faf9f7}
.nb-item.unread{background:#fff8f3}
.nb-item.unread::before{content:'';position:absolute;left:5px;top:20px;width:6px;height:6px;border-radius:50%;background:var(--nb-brand)}
.nb-ic{width:36px;height:36px;border-radius:10px;background:#f4f2ee;display:grid;place-items:center;font-size:17px;flex-shrink:0;overflow:hidden}
.nb-ic img{width:100%;height:100%;object-fit:cover}
.nb-t{font-size:13.5px;font-weight:700;color:#0f172a;line-height:1.4}
.nb-m{font-size:12.5px;color:#475569;margin-top:2px;line-height:1.5;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.nb-time{font-size:11.5px;color:#94a3b8;margin-top:4px}
.nb-tag{display:inline-block;font-size:10px;font-weight:800;color:#fff;border-radius:6px;padding:1px 6px;margin-right:5px;vertical-align:1px}
.nb-empty{padding:34px 16px;text-align:center;color:#64748b;font-size:13px}
.nb-foot{padding:10px 14px;border-top:1px solid #f1efeb;background:#fcfbf9;font-size:12.5px;color:#475569;display:flex;justify-content:space-between;gap:8px;align-items:center}
.nb-toast{position:fixed;top:16px;right:16px;width:360px;max-width:calc(100vw - 32px);background:#fff;border-radius:14px;box-shadow:0 18px 44px rgba(15,23,42,.25);z-index:400;padding:14px 14px 14px 16px;display:flex;gap:12px;animation:nbIn .25s ease;text-align:left}
@keyframes nbIn{from{transform:translateY(-12px);opacity:0}to{transform:none;opacity:1}}
.nb-x{background:none;border:0;font-size:16px;color:#94a3b8;cursor:pointer;align-self:flex-start;padding:0 2px}
@media(max-width:600px){
  .nb-panel{position:fixed;top:64px;left:12px;right:12px;width:auto}
  .nb-toast{top:auto;bottom:16px;left:16px;right:16px;width:auto}
}
`;

const PRIORITY_COLOR: Record<string, string> = { important: '#d97706', urgent: '#dc2626' };

export default function NotificationBell({ portal, loggedIn, userKey, primaryColor, isEnglish = false, siteQuery = '' }: Props) {
  const [all, setAll] = useState<NotificationItem[]>([]);
  const [open, setOpen] = useState(false);
  const [seen, setSeen] = useState<Set<string>>(new Set());
  const [toastId, setToastId] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('unsupported');
  const wrapRef = useRef<HTMLDivElement>(null);
  const knownIds = useRef<Set<string> | null>(null);

  const t = isEnglish
    ? { title: 'Notifications', markAll: 'Mark all read', empty: 'No notifications yet', login: 'Log in to get all updates', loginBtn: 'Login', enable: 'Enable browser alerts', enabled: '✓ Browser alerts on', open: 'Open →', important: 'IMPORTANT', urgent: 'URGENT', bell: 'Notifications' }
    : { title: 'सूचनाएं', markAll: 'सब पढ़ा हुआ करें', empty: 'अभी कोई सूचना नहीं', login: 'सभी अपडेट पाने के लिए लॉगिन करें', loginBtn: 'लॉगिन', enable: 'ब्राउज़र सूचनाएं चालू करें', enabled: '✓ ब्राउज़र सूचनाएं चालू', open: 'खोलें →', important: 'महत्वपूर्ण', urgent: 'अति आवश्यक', bell: 'सूचनाएं' };

  useEffect(() => {
    setSeen(loadSeen(userKey));
    if (typeof window !== 'undefined' && 'Notification' in window) setPermission(Notification.permission);
  }, [userKey]);

  // Live notifications (naye aate hi dikhte hain)
  useEffect(() => {
    return onSnapshot(
      query(collection(db, 'notifications'), orderBy('createdAt', 'desc'), limit(60)),
      (snap) => setAll(snap.docs.map((d) => parseNotification(d.id, d.data()))),
      (err) => console.error('Notifications listener error:', err)
    );
  }, []);

  // Har minute dobara jaancho — scheduled notification apne samay par aa jaaye
  useEffect(() => {
    const id = setInterval(() => setTick((x) => x + 1), 60000);
    return () => clearInterval(id);
  }, []);

  const visible = useMemo(
    () =>
      all
        .filter((n) => isVisibleNotification(n, portal, loggedIn))
        .sort((a, b) => (b.publishAt?.getTime() || 0) - (a.publishAt?.getTime() || 0))
        .slice(0, 30),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [all, portal, loggedIn, tick]
  );
  const unread = visible.filter((n) => !seen.has(n.id));

  // Important/urgent na padha ho toh pop-up; site khuli ho aur naya aaye toh browser notification
  useEffect(() => {
    if (!toastId) {
      const pop = unread.find((n) => n.priority !== 'normal');
      if (pop) setToastId(pop.id);
    }
    const ids = new Set(visible.map((n) => n.id));
    if (knownIds.current) {
      const fresh = visible.filter((n) => !knownIds.current!.has(n.id) && !seen.has(n.id));
      if (fresh.length && permission === 'granted') {
        fresh.slice(0, 3).forEach((n) => {
          try {
            const bn = new Notification(n.title, { body: n.message || undefined, icon: n.image || '/icon.png', tag: n.id });
            bn.onclick = () => {
              window.focus();
              if (n.link) window.location.href = withSite(n.link);
            };
          } catch {
            /* kuch browsers page se Notification nahi banne dete */
          }
        });
      }
    }
    knownIds.current = ids;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  // Bahar click / Esc se band
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => wrapRef.current && !wrapRef.current.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const markSeen = (ids: string[]) => {
    const next = new Set(seen);
    ids.forEach((i) => next.add(i));
    setSeen(next);
    saveSeen(userKey, next);
  };

  function withSite(link: string) {
    if (!link.startsWith('/') || !siteQuery || link.includes('site=')) return link;
    return `${link}${link.includes('?') ? '&' : '?'}${siteQuery}`;
  }

  const enableBrowser = async () => {
    if (!('Notification' in window)) return;
    const p = await Notification.requestPermission();
    setPermission(p);
  };

  const Item = ({ n, onDone }: { n: NotificationItem; onDone?: () => void }) => {
    const body = (
      <>
        <div className="nb-ic">{n.image ? <img src={n.image} alt="" /> : notifIcon(n.type)}</div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div className="nb-t">
            {n.priority !== 'normal' && (
              <span className="nb-tag" style={{ background: PRIORITY_COLOR[n.priority] }}>
                {n.priority === 'urgent' ? t.urgent : t.important}
              </span>
            )}
            {n.title}
          </div>
          {n.message && <div className="nb-m">{n.message}</div>}
          <div className="nb-time">
            {timeAgoHi(n.publishAt, isEnglish)}
            {n.link ? ` · ${t.open}` : ''}
          </div>
        </div>
      </>
    );
    const cls = `nb-item ${seen.has(n.id) ? '' : 'unread'}`;
    const done = () => {
      markSeen([n.id]);
      onDone?.();
    };
    if (!n.link) {
      return (
        <button type="button" className={cls} onClick={done}>
          {body}
        </button>
      );
    }
    const href = withSite(n.link);
    return /^https?:\/\//.test(href) ? (
      <a className={cls} href={href} target="_blank" rel="noopener noreferrer" onClick={done}>
        {body}
      </a>
    ) : (
      <Link className={cls} href={href} onClick={done}>
        {body}
      </Link>
    );
  };

  const toast = toastId ? visible.find((n) => n.id === toastId && !seen.has(n.id)) : null;

  return (
    <div className="nb-wrap" ref={wrapRef} style={{ ['--nb-brand' as any]: primaryColor }}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <button
        type="button"
        className="nb-btn"
        aria-label={`${t.bell}${unread.length ? ` (${unread.length})` : ''}`}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unread.length > 0 && <span className="nb-badge">{unread.length > 9 ? '9+' : unread.length}</span>}
      </button>

      {open && (
        <div className="nb-panel" role="dialog" aria-label={t.title}>
          <div className="nb-head">
            <b>🔔 {t.title}</b>
            {unread.length > 0 && (
              <button type="button" className="nb-link" onClick={() => markSeen(visible.map((n) => n.id))}>
                {t.markAll}
              </button>
            )}
          </div>
          <div className="nb-list">
            {visible.length === 0 ? <div className="nb-empty">🔕 {t.empty}</div> : visible.map((n) => <Item key={n.id} n={n} onDone={() => setOpen(false)} />)}
          </div>
          <div className="nb-foot">
            {!loggedIn ? (
              <>
                <span>{t.login}</span>
                <Link href={`/login?redirect=${encodeURIComponent(`/${siteQuery ? `?${siteQuery}` : ''}`)}`} className="nb-link">
                  {t.loginBtn}
                </Link>
              </>
            ) : permission === 'default' ? (
              <button type="button" className="nb-link" onClick={enableBrowser}>
                🔔 {t.enable}
              </button>
            ) : permission === 'granted' ? (
              <span>{t.enabled}</span>
            ) : (
              <span />
            )}
          </div>
        </div>
      )}

      {toast && (
        <div className="nb-toast" role="alert" style={{ borderLeft: `5px solid ${PRIORITY_COLOR[toast.priority] || primaryColor}` }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <Item n={toast} onDone={() => setToastId(null)} />
          </div>
          <button
            type="button"
            className="nb-x"
            aria-label="बंद करें"
            onClick={() => {
              markSeen([toast.id]);
              setToastId(null);
            }}
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
