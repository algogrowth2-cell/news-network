import { NextResponse } from 'next/server';

/*
 * Header ticker ke live rates — sirf free public sources, koi API key/account nahi:
 *  - Nifty 50, Sensex, Gold, Silver, USD-INR: Yahoo Finance public chart endpoint
 *  - Petrol, Diesel (Indore): goodreturns.in page ka <title> (robots.txt allow karta hai)
 * Har external fetch 1 ghante cache (next.revalidate). Koi source fail ho toh pichhla sahi value, warna fallback —
 * ticker kabhi khaali nahi rehta.
 */

const REVALIDATE_SECONDS = 3600;
const TIMEOUT_MS = 8000;
const TROY_OUNCE_GRAMS = 31.1034768;
// International rate (USD/oz) se Indian bazaar rate ka andaza: 6% import duty (GST alag). Isliye ticker par "अनुमानित"
const INDIA_IMPORT_DUTY = 1.06;

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

// 1 Oct 2026 ke asli rates — network fail hone par yahi dikhte hain
const FALLBACK: MarketRates = {
  petrol: '₹114.58',
  diesel: '₹99.70',
  nifty: '22,421.95',
  niftyChange: '-294.25',
  niftyPositive: false,
  sensex: '71,909.70',
  sensexChange: '-619.40',
  sensexPositive: false,
  gold: '₹1,37,600',
  silver: '₹1,99,900',
  updatedAt: '2026-10-01T00:00:00.000Z',
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

const indexFields = (q: { price: number; prev: number }) => {
  const change = q.price - q.prev;
  return { value: inr(q.price, 2), change: `${change >= 0 ? '+' : '-'}${inr(Math.abs(change), 2)}`, positive: change >= 0 };
};

export async function GET() {
  const [nifty, sensex, gold, silver, usdInr, petrol, diesel] = await Promise.allSettled([
    yahooQuote('^NSEI'),
    yahooQuote('^BSESN'),
    yahooQuote('GC=F'),
    yahooQuote('SI=F'),
    yahooQuote('INR=X'),
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

  if (gold.status === 'fulfilled' && silver.status === 'fulfilled' && usdInr.status === 'fulfilled') {
    const fx = usdInr.value.price;
    const goldPer10g = (gold.value.price * fx * 10 * INDIA_IMPORT_DUTY) / TROY_OUNCE_GRAMS;
    const silverPerKg = (silver.value.price * fx * 1000 * INDIA_IMPORT_DUTY) / TROY_OUNCE_GRAMS;
    rates.gold = `₹${inr(Math.round(goldPer10g / 10) * 10)}`;
    rates.silver = `₹${inr(Math.round(silverPerKg / 100) * 100)}`;
    rates.live.metals = true;
  }

  if (petrol.status === 'fulfilled' && diesel.status === 'fulfilled') {
    rates.petrol = `₹${petrol.value.toFixed(2)}`;
    rates.diesel = `₹${diesel.value.toFixed(2)}`;
    rates.live.fuel = true;
  }

  const failed = [nifty, sensex, gold, silver, usdInr, petrol, diesel].filter((r) => r.status === 'rejected');
  if (failed.length) console.warn('market-rates: some sources failed', failed.map((r) => (r as PromiseRejectedResult).reason?.message));

  if (rates.live.indices || rates.live.metals || rates.live.fuel) {
    rates.updatedAt = new Date().toISOString();
    lastGood = rates;
  }

  return NextResponse.json(rates, {
    headers: { 'Cache-Control': 'public, s-maxage=900, stale-while-revalidate=3600' }
  });
}
