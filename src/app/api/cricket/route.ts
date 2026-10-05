import { NextResponse } from 'next/server';

/*
 * Live cricket scores — ESPNcricinfo ka public RSS (bina key), 2 minute cache.
 * Title jaise: "India Under-19s 1 * v Australia Under-19s 174/10"  (* = abhi batting)
 * Bharat ke match aur live (batting chal rahi) match pehle.
 */

const FEED = 'https://static.cricinfo.com/rss/livescores.xml';

interface Match {
  title: string;
  team1: string;
  score1: string;
  team2: string;
  score2: string;
  live: boolean;
  india: boolean;
  link: string;
}

let lastGood: { matches: Match[]; updatedAt: string } = { matches: [], updatedAt: '' };

const decode = (s: string) =>
  s
    .replace(/<!\[CDATA\[|\]\]>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();

// "Team Name 259/10" / "Team 1 *" / "Team" → naam + score
const splitSide = (side: string) => {
  const m = side.trim().match(/^(.*?)\s+((?:\d+(?:\/\d+)?(?:d)?)(?:\s*&\s*\d+(?:\/\d+)?(?:d)?)*)\s*(\*)?$/);
  if (!m) return { name: side.replace(/\*$/, '').trim(), score: '', batting: /\*$/.test(side.trim()) };
  return { name: m[1].trim(), score: m[2].trim(), batting: !!m[3] };
};

function parse(xml: string): Match[] {
  const items = xml.match(/<item>[\s\S]*?<\/item>/g) || [];
  return items
    .map((it) => {
      const title = decode(it.match(/<title>([\s\S]*?)<\/title>/)?.[1] || '');
      const link = decode(it.match(/<guid>([\s\S]*?)<\/guid>/)?.[1] || it.match(/<link>([\s\S]*?)<\/link>/)?.[1] || '').replace(/^http:/, 'https:');
      const [a, b] = title.split(/\s+v\s+/);
      if (!a || !b) return null;
      const s1 = splitSide(a);
      const s2 = splitSide(b);
      return {
        title,
        team1: s1.name,
        score1: s1.score + (s1.batting ? '*' : ''),
        team2: s2.name,
        score2: s2.score + (s2.batting ? '*' : ''),
        live: s1.batting || s2.batting,
        india: /\bindia\b/i.test(title),
        link
      } as Match;
    })
    .filter(Boolean) as Match[];
}

export async function GET() {
  try {
    const res = await fetch(FEED, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; NewsNetworkTicker/1.0)' }, next: { revalidate: 120 }, signal: AbortSignal.timeout(8000) });
    if (!res.ok) throw new Error(`cricinfo ${res.status}`);
    const all = parse(await res.text());
    // Bharat (senior pehle, phir U19/women) → live → baaki
    const rank = (m: Match) => (m.india ? (/(under-19|women|u19|\ba\b)/i.test(m.title) ? 2 : 3) : 0) + (m.live ? 1 : 0) + (m.score1 || m.score2 ? 0.5 : 0);
    const matches = all.sort((x, y) => rank(y) - rank(x)).slice(0, 6);
    lastGood = { matches, updatedAt: new Date().toISOString() };
    return NextResponse.json(lastGood, { headers: { 'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=300' } });
  } catch (err) {
    console.warn('cricket: feed failed', (err as Error).message);
    // Pichhla sahi data (kuch nahi toh khaali list — ticker me cricket item nahi dikhega)
    return NextResponse.json({ ...lastGood, stale: true }, { headers: { 'Cache-Control': 'public, s-maxage=60' } });
  }
}
