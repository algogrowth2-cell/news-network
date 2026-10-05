export interface SiteItem {
  slug: string;
  name: string;
  domain?: string;
}

// Network ke 8 standard portals — har form/filter/switcher inhi slugs ko use kare
export const NETWORK_SITES: SiteItem[] = [
  { slug: 'the-local-leader', name: 'द लोकल लीडर', domain: 'thelocalleader.in' },
  { slug: 'the-provue-times', name: 'द प्रोव्यू टाइम्स', domain: 'theproviewtimes.com' },
  { slug: 'jan-bharat-news', name: 'जन भारत न्यूज़', domain: 'janbharatnews.com' },
  { slug: 'news-info-24', name: 'NEWS INFO 24', domain: 'newsinfo24.in' },
  { slug: 'ndn-defence', name: 'डिफेंस न्यूज़', domain: 'nationaldefencenetwork.com' },
  { slug: 'bazar-karobar', name: 'बाज़ार कारोबार', domain: 'bazarkarobar.com' },
  { slug: 'golden-pearl-chronicles', name: 'गोल्डन पर्ल क्रॉनिकल्स', domain: 'goldenpearlcorporation.com' },
  { slug: 'desh-ki-aawaz', name: 'देश की आवाज़', domain: 'deshkiawaz.com' }
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

// Khabrein sirf usi portal ki jahan post hui — purane dummy slugs (state-express, city-bulletin…) ki khabrein kisi asli portal par nahi.
// Sirf usi portal ke naam ki likhavat ke roop shamil: 'the-local-leader' / 'the local leader', provue / proview.
export const articleSiteIds = (slug: string) => {
  const ids = new Set([slug, slug.replace(/-/g, ' ')]);
  if (slug === 'the-provue-times') ids.add('the-proview-times');
  return Array.from(ids);
};
