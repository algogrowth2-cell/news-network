import type { Metadata } from 'next';
import ArticleClient from './ArticleClient';
import { getArticleForSSR } from '@/lib/articleServer';

// Khabar ka page ~60 sec CDN cache (ISR) — bahut tez, Firestore reads bahut kam.
// Dynamic hi hai: badli khabar ~60 sec me apne aap refresh. Views/comment client se realtime.
export const revalidate = 60;

const plain = (s: any) => String(s || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const a = await getArticleForSSR(decodeURIComponent(id || ''));
  if (!a) return { title: 'समाचार' };
  const title = plain(a.title) || 'समाचार';
  const description = plain(a.summary || a.content).slice(0, 160);
  const images = a.image ? [a.image] : [];
  return {
    title,
    description,
    openGraph: { title, description, images, type: 'article' },
    twitter: { card: 'summary_large_image', title, description, images }
  };
}

export default async function ArticlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const route = decodeURIComponent(id || '');
  // Server se pehle hi khabar — page content ke saath turant aata hai. Na mile to client khud le aata hai.
  const initialArticle = await getArticleForSSR(route);
  return <ArticleClient initialArticle={initialArticle} routeParam={route} />;
}
