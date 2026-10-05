import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

/*
 * Categories, States, Cities — admin (Firestore) se poori website tak.
 *   categories/{slug}           : name, nameHi, slug, color, icon, order, active, showInMenu, portals[]
 *   states/{slug}               : name, nameHi, slug, active
 *   cities/{stateSlug}--{slug}  : name, nameHi, slug, stateSlug, active
 * portals [] = sabhi portal.
 */

export interface CategoryItem {
  id: string;
  name: string;
  nameHi: string;
  slug: string;
  color: string;
  icon: string;
  order: number;
  active: boolean;
  showInMenu: boolean;
  portals: string[];
}

export interface StateItem {
  id: string;
  name: string;
  nameHi: string;
  slug: string;
  active: boolean;
}

export interface CityItem {
  id: string;
  name: string;
  nameHi: string;
  slug: string;
  stateSlug: string;
  active: boolean;
}

export const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');

const norm = (s: string) => String(s || '').trim().toLowerCase().replace(/\s+/g, ' ');

/** Duplicate ki jaanch: slug, English naam ya Hindi naam pehle se ho toh wahi item lautao */
export function findDuplicate<T extends { id: string; name: string; nameHi: string; slug: string }>(
  list: T[],
  draft: { name: string; nameHi: string; slug: string },
  exceptId?: string
): { item: T; field: 'slug' | 'name' | 'nameHi' } | null {
  for (const it of list) {
    if (it.id === exceptId) continue;
    if (draft.slug && norm(it.slug) === norm(draft.slug)) return { item: it, field: 'slug' };
    if (draft.name && norm(it.name) === norm(draft.name)) return { item: it, field: 'name' };
    if (draft.nameHi && norm(it.nameHi) === norm(draft.nameHi)) return { item: it, field: 'nameHi' };
  }
  return null;
}

// ---------- Shuruaati data (Firestore khaali ho tab ek baar; aur website ka fallback) ----------
const HINDI_PORTALS = ['the-local-leader', 'the-provue-times', 'jan-bharat-news', 'bazar-karobar', 'golden-pearl-chronicles', 'desh-ki-aawaz'];
const ENGLISH_PORTALS = ['ndn-defence', 'news-info-24'];

type SeedCat = Omit<CategoryItem, 'id'>;
const cat = (order: number, name: string, nameHi: string, icon: string, color: string, showInMenu: boolean, portals: string[], slug = slugify(name)): SeedCat => ({
  name,
  nameHi,
  slug,
  icon,
  color,
  order,
  active: true,
  showInMenu,
  portals
});

export const DEFAULT_CATEGORIES: SeedCat[] = [
  cat(1, 'Politics', 'राजनीति', '🏛️', '#ef4444', true, HINDI_PORTALS),
  cat(2, 'National', 'देश', '🇮🇳', '#3b82f6', false, HINDI_PORTALS),
  cat(3, 'International', 'अंतरराष्ट्रीय', '🌍', '#10b981', false, HINDI_PORTALS),
  cat(4, 'Business', 'व्यापार', '📈', '#8b5cf6', true, HINDI_PORTALS),
  cat(5, 'Health', 'स्वास्थ्य', '🩺', '#14b8a6', true, HINDI_PORTALS),
  cat(6, 'Lifestyle', 'जीवनशैली', '🌿', '#84cc16', true, HINDI_PORTALS),
  cat(7, 'State', 'राज्य', '📍', '#0ea5e9', true, HINDI_PORTALS),
  cat(8, 'Crime', 'अपराध', '🚨', '#dc2626', true, HINDI_PORTALS),
  cat(9, 'Sports', 'खेल', '🏏', '#f59e0b', true, HINDI_PORTALS),
  cat(10, 'Entertainment', 'मनोरंजन', '🎬', '#ec4899', false, HINDI_PORTALS),
  cat(11, 'Technology', 'तकनीक', '💻', '#06b6d4', false, HINDI_PORTALS),
  cat(12, 'Education', 'शिक्षा', '🎓', '#6366f1', false, HINDI_PORTALS),
  cat(13, 'Agriculture', 'कृषि', '🌾', '#22c55e', false, HINDI_PORTALS),
  cat(14, 'Defence', 'रक्षा', '🛡️', '#15803d', true, ENGLISH_PORTALS),
  cat(15, 'Strategic', 'रणनीतिक', '🌐', '#0f766e', true, ENGLISH_PORTALS),
  cat(16, 'Army & Airforce', 'थलसेना और वायुसेना', '✈️', '#4d7c0f', true, ENGLISH_PORTALS, 'army-airforce'),
  cat(17, 'Naval Operations', 'नौसेना अभियान', '⚓', '#1d4ed8', true, ENGLISH_PORTALS),
  cat(18, 'National Security', 'राष्ट्रीय सुरक्षा', '🇮🇳', '#b91c1c', true, ENGLISH_PORTALS),
  cat(19, 'Special Reports', 'विशेष रिपोर्ट', '📑', '#7c3aed', true, ENGLISH_PORTALS)
];

const st = (name: string, nameHi: string): Omit<StateItem, 'id'> => ({ name, nameHi, slug: slugify(name), active: true });
export const DEFAULT_STATES: Omit<StateItem, 'id'>[] = [
  st('Andhra Pradesh', 'आंध्र प्रदेश'), st('Arunachal Pradesh', 'अरुणाचल प्रदेश'), st('Assam', 'असम'), st('Bihar', 'बिहार'),
  st('Chhattisgarh', 'छत्तीसगढ़'), st('Goa', 'गोवा'), st('Gujarat', 'गुजरात'), st('Haryana', 'हरियाणा'),
  st('Himachal Pradesh', 'हिमाचल प्रदेश'), st('Jharkhand', 'झारखंड'), st('Karnataka', 'कर्नाटक'), st('Kerala', 'केरल'),
  st('Madhya Pradesh', 'मध्य प्रदेश'), st('Maharashtra', 'महाराष्ट्र'), st('Manipur', 'मणिपुर'), st('Meghalaya', 'मेघालय'),
  st('Mizoram', 'मिज़ोरम'), st('Nagaland', 'नागालैंड'), st('Odisha', 'ओडिशा'), st('Punjab', 'पंजाब'),
  st('Rajasthan', 'राजस्थान'), st('Sikkim', 'सिक्किम'), st('Tamil Nadu', 'तमिलनाडु'), st('Telangana', 'तेलंगाना'),
  st('Tripura', 'त्रिपुरा'), st('Uttar Pradesh', 'उत्तर प्रदेश'), st('Uttarakhand', 'उत्तराखंड'), st('West Bengal', 'पश्चिम बंगाल'),
  st('Andaman and Nicobar Islands', 'अंडमान और निकोबार द्वीपसमूह'), st('Chandigarh', 'चंडीगढ़'),
  st('Dadra and Nagar Haveli and Daman and Diu', 'दादरा और नगर हवेली और दमन और दीव'), st('Delhi', 'दिल्ली'),
  st('Jammu and Kashmir', 'जम्मू और कश्मीर'), st('Ladakh', 'लद्दाख'), st('Lakshadweep', 'लक्षद्वीप'), st('Puducherry', 'पुडुचेरी')
];

const ct = (state: string, name: string, nameHi: string): Omit<CityItem, 'id'> => ({ name, nameHi, slug: slugify(name), stateSlug: slugify(state), active: true });
export const DEFAULT_CITIES: Omit<CityItem, 'id'>[] = [
  ct('Andhra Pradesh', 'Visakhapatnam', 'विशाखापट्टनम'), ct('Andhra Pradesh', 'Vijayawada', 'विजयवाड़ा'), ct('Andhra Pradesh', 'Guntur', 'गुंटूर'),
  ct('Andhra Pradesh', 'Nellore', 'नेल्लोर'), ct('Andhra Pradesh', 'Tirupati', 'तिरुपति'),
  ct('Madhya Pradesh', 'Indore', 'इंदौर'), ct('Madhya Pradesh', 'Bhopal', 'भोपाल'), ct('Madhya Pradesh', 'Jabalpur', 'जबलपुर'),
  ct('Madhya Pradesh', 'Gwalior', 'ग्वालियर'), ct('Madhya Pradesh', 'Ujjain', 'उज्जैन'), ct('Madhya Pradesh', 'Mhow', 'महू'),
  ct('Gujarat', 'Bharuch', 'भरूच'), ct('Gujarat', 'Ahmedabad', 'अहमदाबाद'), ct('Gujarat', 'Surat', 'सूरत'), ct('Gujarat', 'Vadodara', 'वडोदरा')
];

export const cityDocId = (stateSlug: string, citySlug: string) => `${stateSlug}--${citySlug}`;

// ---------- Website ke liye padhna ----------
const withDefaults = (d: any, id: string): CategoryItem => ({
  id,
  name: d.name || '',
  nameHi: d.nameHi || d.name || '',
  slug: d.slug || id,
  color: d.color || '#64748b',
  icon: d.icon || '📰',
  order: Number(d.order ?? 99),
  active: d.active !== false,
  showInMenu: d.showInMenu !== false,
  portals: Array.isArray(d.portals) ? d.portals : []
});

const fallbackCategories = () => DEFAULT_CATEGORIES.map((c) => ({ ...c, id: c.slug }));

/** Saari categories (order se). Firestore khaali/fail ho toh shuruaati list */
export async function fetchCategories(): Promise<CategoryItem[]> {
  try {
    const snap = await getDocs(collection(db, 'categories'));
    if (snap.empty) return fallbackCategories();
    return snap.docs.map((d) => withDefaults(d.data(), d.id)).sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));
  } catch (err) {
    console.error('Categories load error:', err);
    return fallbackCategories();
  }
}

export const categoryOnPortal = (c: CategoryItem, portal: string) => c.active && (c.portals.length === 0 || c.portals.includes(portal));

export async function fetchStatesAndCities(): Promise<{ states: StateItem[]; cities: CityItem[] }> {
  try {
    const [s, c] = await Promise.all([getDocs(collection(db, 'states')), getDocs(collection(db, 'cities'))]);
    const states = s.empty
      ? DEFAULT_STATES.map((x) => ({ ...x, id: x.slug }))
      : s.docs.map((d) => ({ id: d.id, name: d.data().name, nameHi: d.data().nameHi || '', slug: d.data().slug || d.id, active: d.data().active !== false }));
    const cities = c.empty
      ? DEFAULT_CITIES.map((x) => ({ ...x, id: cityDocId(x.stateSlug, x.slug) }))
      : c.docs.map((d) => ({
          id: d.id,
          name: d.data().name,
          nameHi: d.data().nameHi || '',
          slug: d.data().slug,
          stateSlug: d.data().stateSlug,
          active: d.data().active !== false
        }));
    return {
      states: states.sort((a, b) => a.name.localeCompare(b.name)),
      cities: cities.sort((a, b) => a.name.localeCompare(b.name))
    };
  } catch (err) {
    console.error('States/cities load error:', err);
    return {
      states: DEFAULT_STATES.map((x) => ({ ...x, id: x.slug })),
      cities: DEFAULT_CITIES.map((x) => ({ ...x, id: cityDocId(x.stateSlug, x.slug) }))
    };
  }
}
