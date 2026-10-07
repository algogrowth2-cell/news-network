import { NETWORK_SITES, normalizeSiteId } from '@/lib/portals';

/*
 * Patrakar seva sadasyata (₹999 / saal) — HAR PORTAL KI ALAG.
 *   reporters/{id}.memberships.{portal} = { expiresAt, paymentId, since }
 * The Local Leader ki sadasyata sirf The Local Leader ke liye; doosre portal ke liye alag lena hoga.
 * Purani ₹499 wali (membershipActive: true) — reporter ke apne portal par, membershipUpdatedAt se 1 saal tak.
 */

export const MEMBERSHIP_DAYS = 365;

const toMs = (v: any) => (v?.toDate ? v.toDate().getTime() : v?.seconds ? v.seconds * 1000 : v ? new Date(v).getTime() || 0 : 0);

/** Portal slug sahi network portal ho, warna The Local Leader */
export function membershipSite(site: unknown): string {
  const s = normalizeSiteId(site);
  return NETWORK_SITES.some((x) => x.slug === s) ? s : 'the-local-leader';
}

/** Reporter ka apna (registration wala) portal */
export const reporterHomeSite = (rep: any) => membershipSite(rep?.siteId || rep?.portal || rep?.site || 'the-local-leader');

/** Is portal ki sadasyata kab tak (ms); 0 = nahi */
export function membershipTillMs(rep: any, site: string): number {
  const portal = membershipSite(site);
  const own = toMs(rep?.memberships?.[portal]?.expiresAt);
  // Purani global sadasyata — sirf apne portal par, 1 saal tak (tareekh na ho toh abhi chalu maano)
  let legacy = 0;
  if (rep?.membershipActive === true && reporterHomeSite(rep) === portal) {
    const since = toMs(rep.membershipUpdatedAt);
    legacy = since ? since + MEMBERSHIP_DAYS * 864e5 : Date.now() + MEMBERSHIP_DAYS * 864e5;
  }
  return Math.max(own, legacy);
}

export const hasMembership = (rep: any, site: string, now = Date.now()) => membershipTillMs(rep, site) > now;

/** Jin portals par abhi sadasyata chalu hai */
export const activeMembershipSites = (rep: any, now = Date.now()) => NETWORK_SITES.filter((s) => hasMembership(rep, s.slug, now)).map((s) => s.slug);
