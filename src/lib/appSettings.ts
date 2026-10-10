/*
 * Mobile app (Golden Pearl News Android) ki admin settings — Admin → मोबाइल ऐप सेटिंग्स.
 *   Firestore: settings/app   (sab padh sakte hain, likhna sirf admin)
 * Khaali / galat value par niche wale default chalte hain — app me kuch tute nahi.
 * Server bhi `epaperPortals` padhta hai (e-paper payment / PDF sahi portal ka rahe).
 */
import { NETWORK_SITES } from '@/lib/portals';
import { EPAPER_PORTALS } from '@/lib/epaperSub';

export interface FaqItem { q: string; a: string }
export interface ShokTemplate {
  id: string; name: string; active: boolean;
  cardBg: string; borderColor: string; titleColor: string; mantraColor: string; boxBg: string; boxBorder: string;
}
export interface Designation { key: string; en: string; hi: string }
export interface AppSettings {
  referralRewardMonths: number; // Refer & Earn: har safal referral par kitne mahine
  epaperPortals: string[]; // kin portals par e-paper (site slug)
  aboutHi: string; aboutEn: string; // khaali = app ka apna text
  faqHi: FaqItem[]; faqEn: FaqItem[]; // khaali = app ke apne sawal-jawab
  shokTemplates: ShokTemplate[];
  pressPrefixes: Record<string, string>; // site slug → ID prefix (TLL-2026-…)
  designations: Designation[];
}

export const DEFAULT_SHOK_TEMPLATES: ShokTemplate[] = [
  { id: 'floral', name: '🌸 पारंपरिक पुष्प', active: true, cardBg: '#fffdfa', borderColor: '#fbcfe8', titleColor: '#be185d', mantraColor: '#9d174d', boxBg: '#fdf2f8', boxBorder: '#fbcfe8' },
  { id: 'golden', name: '👑 स्वर्ण फ्रेम', active: true, cardBg: '#fffdf5', borderColor: '#d97706', titleColor: '#b45309', mantraColor: '#92400e', boxBg: '#fef3c7', boxBorder: '#fde68a' },
  { id: 'celestial', name: '🌌 आकाशीय किरणें', active: true, cardBg: '#f8fafc', borderColor: '#0284c7', titleColor: '#0369a1', mantraColor: '#075985', boxBg: '#e0f2fe', boxBorder: '#bae6fd' },
  { id: 'garland', name: '🏵️ पुष्प माला', active: true, cardBg: '#fffbeb', borderColor: '#ea580c', titleColor: '#c2410c', mantraColor: '#9a3412', boxBg: '#ffedd5', boxBorder: '#fed7aa' },
  { id: 'silver', name: '🪙 सिल्वर सादा', active: true, cardBg: '#ffffff', borderColor: '#94a3b8', titleColor: '#334155', mantraColor: '#475569', boxBg: '#f1f5f9', boxBorder: '#cbd5e1' }
];

export const DEFAULT_PRESS_PREFIXES: Record<string, string> = {
  'the-local-leader': 'TLL', 'bazar-karobar': 'BK', 'desh-ki-aawaz': 'DKA', 'golden-pearl-chronicles': 'GPC',
  'jan-bharat-news': 'JBN', 'ndn-defence': 'NDN', 'news-info-24': 'NI24', 'the-provue-times': 'TPT'
};

export const DEFAULT_DESIGNATIONS: Designation[] = [
  { key: 'reporter', en: 'Reporter', hi: 'संवाददाता' },
  { key: 'senior reporter', en: 'Senior Reporter', hi: 'वरिष्ठ संवाददाता' },
  { key: 'district correspondent', en: 'District Correspondent', hi: 'जिला संवाददाता' },
  { key: 'bureau chief', en: 'Bureau Chief', hi: 'ब्यूरो चीफ' },
  { key: 'photo journalist', en: 'Photo Journalist', hi: 'फोटो पत्रकार' },
  { key: 'video journalist', en: 'Video Journalist', hi: 'वीडियो पत्रकार' },
  { key: 'sub editor', en: 'Sub Editor', hi: 'उप संपादक' },
  { key: 'editor', en: 'Editor', hi: 'संपादक' }
];

export const DEFAULT_APP_SETTINGS: AppSettings = {
  referralRewardMonths: 3,
  epaperPortals: [...EPAPER_PORTALS],
  aboutHi: '', aboutEn: '',
  faqHi: [], faqEn: [],
  shokTemplates: DEFAULT_SHOK_TEMPLATES,
  pressPrefixes: DEFAULT_PRESS_PREFIXES,
  designations: DEFAULT_DESIGNATIONS
};

const SITE_SLUGS = NETWORK_SITES.map((s) => s.slug);
const txt = (v: any, max: number) => String(v ?? '').replace(/[<>]/g, '').trim().slice(0, max);
const color = (v: any, def: string) => (/^#[0-9a-f]{6}$/i.test(String(v || '').trim()) ? String(v).trim() : def);
const faqs = (v: any): FaqItem[] =>
  Array.isArray(v) ? v.map((x) => ({ q: txt(x?.q, 200), a: txt(x?.a, 1500) })).filter((x) => x.q && x.a).slice(0, 30) : [];

export function normalizeAppSettings(raw: any): AppSettings {
  const d = DEFAULT_APP_SETTINGS;
  const months = Math.round(Number(raw?.referralRewardMonths));
  const ep = Array.isArray(raw?.epaperPortals) ? raw.epaperPortals.map(String).filter((s: string) => SITE_SLUGS.includes(s)) : null;

  const tpls: ShokTemplate[] = Array.isArray(raw?.shokTemplates)
    ? raw.shokTemplates
        .map((t: any, i: number) => {
          const base = DEFAULT_SHOK_TEMPLATES.find((x) => x.id === t?.id) || DEFAULT_SHOK_TEMPLATES[i % DEFAULT_SHOK_TEMPLATES.length];
          const id = txt(t?.id, 30).replace(/[^a-z0-9_-]/gi, '') || `tpl${i + 1}`;
          return {
            id, name: txt(t?.name, 40) || base.name, active: t?.active !== false,
            cardBg: color(t?.cardBg, base.cardBg), borderColor: color(t?.borderColor, base.borderColor),
            titleColor: color(t?.titleColor, base.titleColor), mantraColor: color(t?.mantraColor, base.mantraColor),
            boxBg: color(t?.boxBg, base.boxBg), boxBorder: color(t?.boxBorder, base.boxBorder)
          };
        })
        .slice(0, 12)
    : d.shokTemplates;

  const prefixes: Record<string, string> = { ...d.pressPrefixes };
  if (raw?.pressPrefixes && typeof raw.pressPrefixes === 'object') {
    for (const slug of SITE_SLUGS) {
      const p = txt(raw.pressPrefixes[slug], 8).toUpperCase().replace(/[^A-Z0-9]/g, '');
      if (p) prefixes[slug] = p;
    }
  }

  const desig: Designation[] = Array.isArray(raw?.designations)
    ? raw.designations
        .map((x: any) => ({ key: txt(x?.key || x?.en, 40).toLowerCase(), en: txt(x?.en, 40), hi: txt(x?.hi, 40) }))
        .filter((x: Designation) => x.key && x.en && x.hi)
        .slice(0, 30)
    : d.designations;

  return {
    referralRewardMonths: Number.isFinite(months) && months >= 1 && months <= 24 ? months : d.referralRewardMonths,
    epaperPortals: ep ?? d.epaperPortals,
    aboutHi: txt(raw?.aboutHi, 4000),
    aboutEn: txt(raw?.aboutEn, 4000),
    faqHi: faqs(raw?.faqHi),
    faqEn: faqs(raw?.faqEn),
    shokTemplates: tpls.length ? tpls : d.shokTemplates,
    pressPrefixes: prefixes,
    designations: desig.length ? desig : d.designations
  };
}
