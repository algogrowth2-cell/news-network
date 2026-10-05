import { collection, getDocs, limit as fbLimit, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { articleSiteIds } from '@/lib/portals';
import { isArticleLive, toJsDate } from '@/lib/articles';

/** Sabse nayi pehle: publishAt → timestamp → createdAt */
export const articleTime = (a: any) => (toJsDate(a.publishAt) || toJsDate(a.timestamp) || toJsDate(a.createdAt))?.getTime() || 0;

/**
 * Ek portal ki live khabrein: purane articles (siteId) + naye multi-portal articles (siteIds array).
 * Draft aur samay se pehle ki scheduled khabrein nahi aatin.
 */
export async function fetchPortalArticles<T = any>(siteSlug: string, max?: number): Promise<T[]> {
  const ids = articleSiteIds(siteSlug);
  const col = collection(db, 'articles');
  const withLimit = (q: any) => (max ? query(q, fbLimit(max * 2)) : q);
  const [bySite, byList] = await Promise.all([
    getDocs(withLimit(query(col, where('siteId', 'in', ids)))),
    getDocs(withLimit(query(col, where('siteIds', 'array-contains-any', ids))))
  ]);
  const map = new Map<string, any>();
  for (const snap of [bySite, byList]) snap.docs.forEach((d) => map.set(d.id, { id: d.id, ...(d.data() as any) }));
  const list = Array.from(map.values())
    .filter((a) => isArticleLive(a))
    .sort((a, b) => articleTime(b) - articleTime(a));
  return (max ? list.slice(0, max) : list) as T[];
}
