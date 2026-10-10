import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import HomeClient from './HomeClient';
import { getPortalArticlesForSSR } from '@/lib/articleServer';
import { normalizeSiteId } from '@/lib/portals';

// Har request par taazi khabar (SSR — static NAHI). Admin ke badlaav turant dikhte hain.
export const dynamic = 'force-dynamic';

const DOMAIN_MAP: Record<string, string> = {
  'thelocalleader.in': 'the-local-leader',
  'theproviewtimes.com': 'the-provue-times',
  'nationaldefencenetwork.com': 'ndn-defence',
  'bazarkarobar.com': 'bazar-karobar',
  'deshkiawaz.com': 'desh-ki-aawaz',
  'janbharatnews.com': 'jan-bharat-news',
  'newsinfo24.in': 'news-info-24'
};

export default async function HomePage({ searchParams }: { searchParams: Promise<{ site?: string }> }) {
  const sp = await searchParams;
  const host = (await headers()).get('host')?.toLowerCase().replace(/^www\./, '').split(':')[0] || '';

  // goldenpearlnews.com (admin domain) ka home → admin (jaise client karta hai)
  if (!sp?.site && host === 'goldenpearlnews.com') redirect('/admin');

  const raw = sp?.site || DOMAIN_MAP[host] || 'the-local-leader';
  const slug = normalizeSiteId(decodeURIComponent(raw));

  // Server se pehle hi is portal ki taazi khabrein — HTML me news ke saath aata hai (tez). Na mile to client khud le aata hai.
  const initialArticles = await getPortalArticlesForSSR(slug).catch(() => []);

  return <HomeClient initialArticles={initialArticles} initialSlug={slug} />;
}
