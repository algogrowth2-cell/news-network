import { NETWORK_SITES, normalizeSiteId } from '@/lib/portals';

/*
 * E-paper subscription HAR PORTAL KA ALAG: The Local Leader par liya toh sirf wahin chalega;
 * doosre portal (usi mobile / email se) par naya lena hoga.
 *   epaper_subscriptions/{email}__{portal}
 * Purane record (sirf {email}, bina portal) — sirf usi portal par jiska siteId likha hai (na ho toh The Local Leader).
 */

export const DEFAULT_EPAPER_SITE = 'the-local-leader';

/** Portal slug sahi network portal ho, warna The Local Leader */
export function epaperSite(site: unknown): string {
  const s = normalizeSiteId(site);
  return NETWORK_SITES.some((x) => x.slug === s) ? s : DEFAULT_EPAPER_SITE;
}

export const epaperSubId = (email: string, site: string) => `${email}__${epaperSite(site)}`;

/** Record kis portal ka hai (purane record me siteId na ho toh The Local Leader) */
export const subSiteOf = (d: any) => epaperSite(d?.siteId || DEFAULT_EPAPER_SITE);

const toMs = (v: any) => (v?.toDate ? v.toDate().getTime() : v ? new Date(v).getTime() : 0);
export const subExpiryMs = (d: any) => (d?.status === 'active' ? toMs(d.expiresAt) : 0);

/** Is portal ke liye record chalu hai? */
export const isActiveForSite = (d: any, site: string, now = Date.now()) => !!d && subSiteOf(d) === epaperSite(site) && subExpiryMs(d) > now;
