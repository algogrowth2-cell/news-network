import { NETWORK_SITES, normalizeSiteId } from '@/lib/portals';

// Homepage jaisa hi: Firestore 'sites' doc na mile toh har portal ka apna rang/naam
export const SITE_FALLBACKS: Record<string, { name: string; primaryColor: string; logoUrl: string }> = {
  'the-local-leader': { name: 'द लोकल लीडर', primaryColor: '#ea580c', logoUrl: '/logos/the-local-leader.jpeg' },
  'the-provue-times': { name: 'द प्रोव्यू टाइम्स', primaryColor: '#b91c1c', logoUrl: '/logos/the-provue-times.jpeg' },
  'jan-bharat-news': { name: 'जन भारत न्यूज़', primaryColor: '#1d4ed8', logoUrl: '/logos/jan-bharat-news.jpeg' },
  'news-info-24': { name: 'NEWS INFO 24', primaryColor: '#dc2626', logoUrl: '/logos/news-info-24.jpeg' },
  'ndn-defence': { name: 'National Defence Network', primaryColor: '#15803d', logoUrl: '/logos/ndn-defence.jpeg' },
  'bazar-karobar': { name: 'बाजार कारोबार', primaryColor: '#059669', logoUrl: '/logos/bazar-karobar.jpeg' },
  'golden-pearl-chronicles': { name: 'गोल्डन पर्ल क्रॉनिकल्स', primaryColor: '#d97706', logoUrl: '/logos/golden-pearl-chronicles.jpeg' },
  'desh-ki-aawaz': { name: 'देश की आवाज़', primaryColor: '#7c3aed', logoUrl: '/logos/desh-ki-aawaz.jpeg' }
};

export const DEFAULT_SITE_SLUG = 'the-local-leader';

// Jin portals ki default bhasha English hai (homepage ke isEnglishSite jaisa)
export const isEnglishSlug = (slug: string) => slug === 'news-info-24' || slug === 'ndn-defence' || slug === 'national-defence-network';

/** Portal slug: pehle ?site=, warna domain (newsinfo24.in → news-info-24), warna The Local Leader */
export function resolveSiteSlug(siteParam?: string | null): string {
  if (siteParam) return normalizeSiteId(decodeURIComponent(siteParam));
  if (typeof window !== 'undefined') {
    const host = window.location.hostname.toLowerCase().replace(/^www\./, '');
    const match = NETWORK_SITES.find((s) => s.domain === host);
    if (match) return match.slug;
  }
  return DEFAULT_SITE_SLUG;
}

export const fallbackFor = (slug: string) => SITE_FALLBACKS[slug] || SITE_FALLBACKS[DEFAULT_SITE_SLUG];
