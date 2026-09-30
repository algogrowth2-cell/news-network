export interface SiteItem {
  slug: string;
  name: string;
  tag: string;
  domain?: string;
}

export const FREE_SITE_SLUG = 'the-local-leader';

// Network ke 8 standard portals — har form/filter/switcher inhi slugs ko use kare
export const NETWORK_SITES: SiteItem[] = [
  { slug: 'the-local-leader', name: 'द लोकल लीडर', tag: 'मुफ़्त (Free)', domain: 'thelocalleader.in' },
  { slug: 'the-provue-times', name: 'द प्रोव्यू टाइम्स', tag: 'प्रीमियम (Premium)', domain: 'theproviewtimes.com' },
  { slug: 'jan-bharat-news', name: 'जन भारत न्यूज़', tag: 'प्रीमियम (Premium)', domain: 'janbharatnews.com' },
  { slug: 'news-info-24', name: 'NEWS INFO 24', tag: 'प्रीमियम (Premium)', domain: 'newsinfo24.in' },
  { slug: 'ndn-defence', name: 'डिफेंस न्यूज़', tag: 'प्रीमियम (Premium)', domain: 'nationaldefencenetwork.com' },
  { slug: 'bazar-karobar', name: 'बाज़ार कारोबार', tag: 'प्रीमियम (Premium)', domain: 'bazarkarobar.com' },
  { slug: 'golden-pearl-chronicles', name: 'गोल्डन पर्ल क्रॉनिकल्स', tag: 'प्रीमियम (Premium)', domain: 'goldenpearlcorporation.com' },
  { slug: 'desh-ki-aawaz', name: 'देश की आवाज़', tag: 'प्रीमियम (Premium)', domain: 'deshkiawaz.com' }
];

// Purane dummy slugs jo pehle admin/advertiser/patrakar forms se save hote the.
// Naya data sirf asli 8 portal slugs se save hota hai; ye map sirf purane Firestore data ko sahi portal par dikhane ke liye hai.
export const LEGACY_SLUG_MAP: Record<string, string> = {
  'state-express': 'the-provue-times',
  'jan-chetna-news': 'jan-bharat-news',
  'city-bulletin': 'news-info-24',
  'national-spotlight': 'ndn-defence'
};

// Kisi bhi stored siteId ko asli portal slug me badalta hai
export const normalizeSiteId = (siteId: unknown) => {
  const s = String(siteId || '').trim().toLowerCase().replace(/\s+/g, '-');
  return LEGACY_SLUG_MAP[s] || s;
};

// Firestore `where('siteId', 'in', ...)` queries ke liye: asli slug + uske purane aliases
export const siteIdAliases = (slug: string) => [
  slug,
  ...Object.keys(LEGACY_SLUG_MAP).filter((legacy) => LEGACY_SLUG_MAP[legacy] === slug)
];
