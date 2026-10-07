import { NETWORK_SITES, normalizeSiteId } from '@/lib/portals';

/*
 * E-paper subscription HAR PORTAL KA ALAG: The Local Leader par liya toh sirf wahin chalega;
 * doosre portal (usi mobile / email se) par naya lena hoga.
 *   epaper_subscriptions/{email}__{portal}
 * Purane record (sirf {email}, bina portal) — sirf usi portal par jiska siteId likha hai (na ho toh The Local Leader).
 */

export const DEFAULT_EPAPER_SITE = 'the-local-leader';

/**
 * Jin portals par e-paper hai. Jan Bharat News, National Defence Network, Desh Ki Aawaz, NEWS INFO 24 par
 * e-paper section nahi (menu, footer, widget, /epaper page sab band).
 */
export const EPAPER_PORTALS = ['the-local-leader', 'bazar-karobar', 'golden-pearl-chronicles', 'the-provue-times'];
export const hasEpaper = (site: unknown) => EPAPER_PORTALS.includes(normalizeSiteId(site));

/**
 * E-paper kis portal ka: sahi network portal jahan e-paper hai — warna The Local Leader
 * (jaise bina e-paper wale portal se juda referral inaam The Local Leader ke e-paper par).
 */
export function epaperSite(site: unknown): string {
  const s = normalizeSiteId(site);
  return NETWORK_SITES.some((x) => x.slug === s) && EPAPER_PORTALS.includes(s) ? s : DEFAULT_EPAPER_SITE;
}

export const epaperSubId = (email: string, site: string) => `${email}__${epaperSite(site)}`;

/** Record kis portal ka hai (purane record me siteId na ho toh The Local Leader) */
export const subSiteOf = (d: any) => epaperSite(d?.siteId || DEFAULT_EPAPER_SITE);

const toMs = (v: any) => (v?.toDate ? v.toDate().getTime() : v ? new Date(v).getTime() : 0);
export const subExpiryMs = (d: any) => (d?.status === 'active' ? toMs(d.expiresAt) : 0);

/** Is portal ke liye record chalu hai? */
export const isActiveForSite = (d: any, site: string, now = Date.now()) => !!d && subSiteOf(d) === epaperSite(site) && subExpiryMs(d) > now;
