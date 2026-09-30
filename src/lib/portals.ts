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
