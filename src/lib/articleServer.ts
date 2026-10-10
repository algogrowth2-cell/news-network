import { isArticleLive } from '@/lib/articles';

/*
 * SSR ke liye khabar server par — SIRF public Firestore REST se (koi credential nahi, sirf public article).
 * Timestamp aadi plain (serializable) ban jaate hain, taaki client component ko safe pass ho.
 * fetch memoized hai: generateMetadata + page ek hi article do baar fetch nahi karte.
 */
const BASE = 'https://firestore.googleapis.com/v1/projects/newsadmin-network/databases/(default)/documents';

// Firestore REST ka "typed" value → plain JS
function decodeValue(v: any): any {
  if (v == null) return null;
  if ('stringValue' in v) return v.stringValue;
  if ('integerValue' in v) return Number(v.integerValue);
  if ('doubleValue' in v) return Number(v.doubleValue);
  if ('booleanValue' in v) return v.booleanValue;
  if ('timestampValue' in v) return v.timestampValue; // ISO string
  if ('nullValue' in v) return null;
  if ('arrayValue' in v) return (v.arrayValue?.values || []).map(decodeValue);
  if ('mapValue' in v) return decodeFields(v.mapValue?.fields || {});
  if ('referenceValue' in v) return String(v.referenceValue).split('/').pop();
  if ('geoPointValue' in v) return v.geoPointValue;
  return null;
}
function decodeFields(fields: any): Record<string, any> {
  const out: Record<string, any> = {};
  for (const k of Object.keys(fields || {})) out[k] = decodeValue(fields[k]);
  return out;
}

async function getById(id: string): Promise<any | null> {
  try {
    const r = await fetch(`${BASE}/articles/${encodeURIComponent(id)}`, { next: { revalidate: 30 } });
    if (!r.ok) return null;
    const j = await r.json();
    if (!j.fields) return null;
    return { id, ...decodeFields(j.fields) };
  } catch { return null; }
}

async function getBySlug(slug: string): Promise<any | null> {
  try {
    const r = await fetch(`${BASE}:runQuery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ structuredQuery: { from: [{ collectionId: 'articles' }], where: { fieldFilter: { field: { fieldPath: 'slug' }, op: 'EQUAL', value: { stringValue: slug } } }, limit: 1 } }),
      next: { revalidate: 30 }
    });
    if (!r.ok) return null;
    const j = await r.json();
    const doc = Array.isArray(j) ? j.find((x: any) => x.document)?.document : null;
    if (!doc?.fields) return null;
    return { id: String(doc.name).split('/').pop(), ...decodeFields(doc.fields) };
  } catch { return null; }
}

/** routeParam = doc id ya slug. Sirf live khabar warna null. */
export async function getArticleForSSR(routeParam: string): Promise<any | null> {
  if (!routeParam) return null;
  const a = (await getById(routeParam)) || (await getBySlug(routeParam));
  if (!a) return null;
  if (!isArticleLive(a)) return null;
  return a;
}
