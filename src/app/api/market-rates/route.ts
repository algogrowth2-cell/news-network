import { NextResponse } from 'next/server';

/*
 * Header ticker ke live rates — sirf free public sources, koi API key/account nahi:
 *  - Nifty 50, Sensex: Yahoo Finance public chart endpoint
 *  - Gold (24K/10g), Silver (per kg): goodreturns.in — ASLI Indian sarafa/retail rate (GST shaamil)
 *  - Petrol, Diesel (Indore): goodreturns.in page ka <title>
 * Har external fetch 1 ghante cache. Koi source fail ho toh pichhla sahi value, warna fallback — ticker kabhi khaali nahi.
 */

const REVALIDATE_SECONDS = 3600;
const TIMEOUT_MS = 8000;

const UA = 'Mozilla/5.0 (compatible; NewsNetworkTicker/1.0)';

interface MarketRates {
  petrol: string;
  diesel: string;
  nifty: string;
  niftyChange: string;
  niftyPositive: boolean;
  sensex: string;
  sensexChange: string;
  sensexPositive: boolean;
  gold: string;
  silver: string;
  updatedAt: string;
  live: { fuel: boolean; indices: boolean; metals: boolean };
}

// 15 Oct 2026 ke asli rates — network fail hone par yahi dikhte hain
const FALLBACK: MarketRates = {
  petrol: '₹114.58',
  diesel: '₹99.70',
  nifty: '22,421.95',
  niftyChange: '-294.25',
  niftyPositive: false,
  sensex: '71,909.70',
  sensexChange: '-619.40',
  sensexPositive: false,
  gold: '₹1,35,890',
  silver: '₹2,34,900',
  updatedAt: '2026-10-15T00:00:00.000Z',
  live: { fuel: false, indices: false, metals: false }
};

// Server instance me pichhla safal data (agle fail par yahi)
let lastGood: MarketRates = FALLBACK;

const inr = (n: number, digits = 0) => n.toLocaleString('en-IN', { minimumFractionDigits: digits, maximumFractionDigits: digits });

async function fetchWithTimeout(url: string) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, { headers: { 'User-Agent': UA }, signal: controller.signal, next: { revalidate: REVALIDATE_SECONDS } });
  } finally {
    clearTimeout(timer);
  }
}

// Yahoo chart: aaj ka price + pichhle din ka close
async function yahooQuote(symbol: string) {
  const res = await fetchWithTimeout(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1d`);
  if (!res.ok) throw new Error(`Yahoo ${symbol} ${res.status}`);
  const meta = (await res.json())?.chart?.result?.[0]?.meta;
  const price = Number(meta?.regularMarketPrice);
  const prev = Number(meta?.chartPreviousClose ?? meta?.previousClose);
  if (!Number.isFinite(price) || price <= 0) throw new Error(`Yahoo ${symbol} no price`);
  return { price, prev: Number.isFinite(prev) && prev > 0 ? prev : price };
}

// goodreturns title: "... Rs. 114.58/Ltr - Goodreturns"
async function fuelPrice(kind: 'petrol' | 'diesel') {
  const res = await fetchWithTimeout(`https://www.goodreturns.in/${kind}-price-in-indore.html`);
  if (!res.ok) throw new Error(`fuel ${kind} ${res.status}`);
  const title = (await res.text()).match(/<title>([^<]*)<\/title>/i)?.[1] || '';
  const value = Number(title.match(/Rs\.?\s*([0-9]{2,3}\.[0-9]{1,2})\s*\/\s*Ltr/i)?.[1]);
  if (!Number.isFinite(value) || value < 50 || value > 250) throw new Error(`fuel ${kind} parse`);
  return value;
}

/*
 * goodreturns gold/silver page par bhaav HTML me kai jagah aata hai (18K/22K/24K, kai sheher).
 * Jo value sabse zyada baar repeat ho (diye range me) wahi asli din ka bhaav — robust aur markup badle to bhi tike.
 */
function mostFrequent(html: string, re: RegExp, min: number, max: number): number | null {
  const counts = new Map<number, number>();
  for (const m of html.matchAll(re)) {
    const n = Number(m[0].replace(/,/g, ''));
    if (Number.isFinite(n) && n >= min && n <= max) counts.set(n, (counts.get(n) || 0) + 1);
  }
  let best = 0, bestC = 0;
  for (const [n, c] of counts) if (c > bestC || (c === bestC && n > best)) { best = n; bestC = c; }
  return best || null;
}

// 24K gold per 10g — page par 24K per-gram (₹13,xxx) sabse zyada; x10
async function goodreturnsGold(): Promise<number> {
  const res = await fetchWithTimeout('https://www.goodreturns.in/gold-rates/');
  if (!res.ok) throw new Error(`gold ${res.status}`);
  const perGram = mostFrequent(await res.text(), /\b1[0-9],[0-9]{3}\b/g, 8000, 25000);
  if (!perGram) throw new Error('gold parse');
  return perGram * 10;
}

// Silver per kg — page par per-kg (₹2,xx,xxx) sabse zyada
async function goodreturnsSilver(): Promise<number> {
  const res = await fetchWithTimeout('https://www.goodreturns.in/silver-rates/');
  if (!res.ok) throw new Error(`silver ${res.status}`);
  const perKg = mostFrequent(await res.text(), /\b[0-9],[0-9]{2},[0-9]{3}\b/g, 50000, 600000);
  if (!perKg) throw new Error('silver parse');
  return perKg;
}

const indexFields = (q: { price: number; prev: number }) => {
  const change = q.price - q.prev;
  return { value: inr(q.price, 2), change: `${change >= 0 ? '+' : '-'}${inr(Math.abs(change), 2)}`, positive: change >= 0 };
};

export async function GET() {
  const [nifty, sensex, gold, silver, petrol, diesel] = await Promise.allSettled([
    yahooQuote('^NSEI'),
    yahooQuote('^BSESN'),
    goodreturnsGold(),
    goodreturnsSilver(),
    fuelPrice('petrol'),
    fuelPrice('diesel')
  ]);

  const rates: MarketRates = { ...lastGood, live: { fuel: false, indices: false, metals: false } };

  if (nifty.status === 'fulfilled' && sensex.status === 'fulfilled') {
    const n = indexFields(nifty.value);
    const s = indexFields(sensex.value);
    Object.assign(rates, { nifty: n.value, niftyChange: n.change, niftyPositive: n.positive, sensex: s.value, sensexChange: s.change, sensexPositive: s.positive });
    rates.live.indices = true;
  }

  if (gold.status === 'fulfilled' && silver.status === 'fulfilled') {
    rates.gold = `₹${inr(gold.value)}`;
    rates.silver = `₹${inr(silver.value)}`;
    rates.live.metals = true;
  }

  if (petrol.status === 'fulfilled' && diesel.status === 'fulfilled') {
    rates.petrol = `₹${petrol.value.toFixed(2)}`;
    rates.diesel = `₹${diesel.value.toFixed(2)}`;
    rates.live.fuel = true;
  }

  const failed = [nifty, sensex, gold, silver, petrol, diesel].filter((r) => r.status === 'rejected');
  if (failed.length) console.warn('market-rates: some sources failed', failed.map((r) => (r as PromiseRejectedResult).reason?.message));

  if (rates.live.indices || rates.live.metals || rates.live.fuel) {
    rates.updatedAt = new Date().toISOString();
    lastGood = rates;
  }

  return NextResponse.json(rates, {
    headers: { 'Cache-Control': 'public, s-maxage=900, stale-while-revalidate=3600' }
  });
}
