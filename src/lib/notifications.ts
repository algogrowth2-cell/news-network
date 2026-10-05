import { addDoc, collection, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toJsDate } from '@/lib/articles';

/*
 * notifications/{id}
 *   title, message, link, image, type, priority, portals[] ([] = sabhi), audience ('all' | 'logged-in'),
 *   publishAt (kab se dikhe), expiresAt (kab tak, null = hamesha), active, source ('admin' | 'auto'), sourceId
 */

export type NotifType = 'announcement' | 'news' | 'breaking' | 'video' | 'live' | 'epaper' | 'offer' | 'alert';
export type NotifPriority = 'normal' | 'important' | 'urgent';

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  link: string;
  image: string;
  type: NotifType;
  priority: NotifPriority;
  portals: string[];
  audience: 'all' | 'logged-in';
  publishAt: Date | null;
  expiresAt: Date | null;
  active: boolean;
  source: 'admin' | 'auto';
}

export const NOTIF_TYPES: { value: NotifType; label: string; icon: string }[] = [
  { value: 'announcement', label: 'घोषणा', icon: '📢' },
  { value: 'news', label: 'नई खबर', icon: '📰' },
  { value: 'breaking', label: 'ब्रेकिंग न्यूज़', icon: '🔴' },
  { value: 'video', label: 'नया वीडियो', icon: '🎬' },
  { value: 'live', label: 'लाइव', icon: '📡' },
  { value: 'epaper', label: 'ई-पेपर', icon: '📄' },
  { value: 'offer', label: 'ऑफ़र / स्कीम', icon: '🎁' },
  { value: 'alert', label: 'ज़रूरी सूचना', icon: '⚠️' }
];
export const notifIcon = (t: string) => NOTIF_TYPES.find((x) => x.value === t)?.icon || '🔔';

/** 'all' / khaali = sabhi portal */
export const portalsFrom = (siteIds: string | string[] | undefined | null): string[] => {
  const list = (Array.isArray(siteIds) ? siteIds : [siteIds]).filter(Boolean) as string[];
  return list.includes('all') ? [] : list;
};

export async function createNotification(n: {
  title: string;
  message?: string;
  link?: string;
  image?: string;
  type?: NotifType;
  priority?: NotifPriority;
  portals?: string[];
  audience?: 'all' | 'logged-in';
  publishAt?: Date | null;
  expiresAt?: Date | null;
  source?: 'admin' | 'auto';
  sourceId?: string;
}) {
  return addDoc(collection(db, 'notifications'), {
    title: n.title.trim().slice(0, 140),
    message: (n.message || '').trim().slice(0, 400),
    link: n.link || '',
    image: n.image || '',
    type: n.type || 'announcement',
    priority: n.priority || 'normal',
    portals: n.portals || [],
    audience: n.audience || 'all',
    publishAt: n.publishAt ? Timestamp.fromDate(n.publishAt) : serverTimestamp(),
    expiresAt: n.expiresAt ? Timestamp.fromDate(n.expiresAt) : null,
    active: true,
    source: n.source || 'admin',
    sourceId: n.sourceId || '',
    createdAt: serverTimestamp()
  });
}

/**
 * Content publish hone par apne-aap notification — kabhi bhi save ko na roke (galti sirf console me).
 */
export function notifyContent(n: Parameters<typeof createNotification>[0]) {
  createNotification({ ...n, source: 'auto' }).catch((err) => console.error('Auto notification error:', err));
}

export const parseNotification = (id: string, x: any): NotificationItem => ({
  id,
  title: x.title || '',
  message: x.message || '',
  link: x.link || '',
  image: x.image || '',
  type: x.type || 'announcement',
  priority: x.priority || 'normal',
  portals: Array.isArray(x.portals) ? x.portals : [],
  audience: x.audience === 'logged-in' ? 'logged-in' : 'all',
  // serverTimestamp abhi pending ho toh "abhi"
  publishAt: toJsDate(x.publishAt) || toJsDate(x.createdAt) || new Date(),
  expiresAt: toJsDate(x.expiresAt),
  active: x.active !== false,
  source: x.source === 'auto' ? 'auto' : 'admin'
});

/** Is portal + user ke liye abhi dikhne wala? */
export function isVisibleNotification(n: NotificationItem, portal: string, loggedIn: boolean, now = Date.now()) {
  if (!n.active) return false;
  if (n.portals.length && !n.portals.includes(portal)) return false;
  if (n.audience === 'logged-in' && !loggedIn) return false;
  if (n.publishAt && n.publishAt.getTime() > now) return false;
  if (n.expiresAt && n.expiresAt.getTime() < now) return false;
  return true;
}

// ---------- Padhe / na-padhe (har browser + user ke liye localStorage me) ----------
const seenKey = (userKey: string) => `notif_seen_${userKey || 'guest'}`;

export function loadSeen(userKey: string): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(seenKey(userKey)) || '[]'));
  } catch {
    return new Set();
  }
}
export function saveSeen(userKey: string, ids: Set<string>) {
  try {
    // Sirf aakhri 300 yaad rakho
    localStorage.setItem(seenKey(userKey), JSON.stringify(Array.from(ids).slice(-300)));
  } catch {
    /* storage band */
  }
}

export function timeAgoHi(d: Date | null, english = false) {
  if (!d) return '';
  const s = Math.max(0, Math.round((Date.now() - d.getTime()) / 1000));
  if (s < 60) return english ? 'just now' : 'अभी';
  const m = Math.round(s / 60);
  if (m < 60) return english ? `${m} min ago` : `${m} मिनट पहले`;
  const h = Math.round(m / 60);
  if (h < 24) return english ? `${h} hr ago` : `${h} घंटे पहले`;
  const days = Math.round(h / 24);
  if (days < 7) return english ? `${days} day${days > 1 ? 's' : ''} ago` : `${days} दिन पहले`;
  return d.toLocaleDateString(english ? 'en-IN' : 'hi-IN', { day: 'numeric', month: 'short' });
}
