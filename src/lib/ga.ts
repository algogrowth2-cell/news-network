// SIRF SERVER. Google Analytics (GA4) Data API se data — admin dashboard ke liye.
// Firebase service account hi credentials ke roop me (usi project se GA juda hai).
// Zaroori: service account email ko GA → Admin → Property access management me
// "Viewer" access dena padta hai, warna 403 aata hai (API 'notConfigured' lautata hai).
import { getServiceAccount } from '@/lib/firebaseAdmin';

// GA4 property ID — URL ke "p<number>" se (a406717415p552795190 → 552795190)
const PROPERTY_ID = process.env.GA_PROPERTY_ID || '552795190';

let cached: Promise<any | null> | null = null;

async function client(): Promise<any | null> {
  const sa = getServiceAccount();
  if (!sa?.client_email || !sa?.private_key) return null;
  try {
    const { BetaAnalyticsDataClient } = await import('@google-analytics/data');
    return new BetaAnalyticsDataClient({
      credentials: { client_email: sa.client_email, private_key: sa.private_key },
      projectId: sa.project_id,
    });
  } catch (err) {
    console.error('GA client load fail:', (err as Error).message);
    return null;
  }
}

function getClient(): Promise<any | null> {
  if (!cached) cached = client();
  return cached;
}

export const gaConfigured = async () => !!(await getClient());

const prop = `properties/${PROPERTY_ID}`;
const n = (v: any) => Number(v || 0);

export interface GaSummary {
  configured: boolean;
  error?: string;
  email?: string; // service account email (no-access par admin ko dikhane ke liye)
  cached?: boolean;
  active?: number; // abhi online (realtime)
  today?: { users: number; views: number };
  last7?: { users: number; views: number };
  last28?: { users: number; views: number };
  series?: { date: string; users: number }[]; // pichhle 7 din
  topPages?: { path: string; title: string; views: number }[];
  topSources?: { source: string; users: number }[];
}

export async function gaSummary(): Promise<GaSummary> {
  const c = await getClient();
  if (!c) return { configured: false, error: 'not-configured' };
  try {
    const [realtime] = await c.runRealtimeReport({
      property: prop,
      metrics: [{ name: 'activeUsers' }],
    });
    const active = n(realtime?.rows?.[0]?.metricValues?.[0]?.value);

    // Ek hi batchRunReports call — teen reports (speed ke liye)
    const [batch] = await c.batchRunReports({
      property: prop,
      requests: [
        // 0: aaj + 7 din + 28 din totals + daily series
        {
          dateRanges: [{ startDate: '27daysAgo', endDate: 'today' }],
          dimensions: [{ name: 'date' }],
          metrics: [{ name: 'activeUsers' }, { name: 'screenPageViews' }],
          orderBys: [{ dimension: { dimensionName: 'date' } }],
        },
        // 1: top pages (7 din)
        {
          dateRanges: [{ startDate: '7daysAgo', endDate: 'today' }],
          dimensions: [{ name: 'pagePath' }, { name: 'pageTitle' }],
          metrics: [{ name: 'screenPageViews' }],
          orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
          limit: 10,
        },
        // 2: top sources (7 din)
        {
          dateRanges: [{ startDate: '7daysAgo', endDate: 'today' }],
          dimensions: [{ name: 'sessionDefaultChannelGroup' }],
          metrics: [{ name: 'activeUsers' }],
          orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
          limit: 8,
        },
      ],
    });

    const reports = batch?.reports || [];
    const daily = reports[0]?.rows || [];

    const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const since = (days: number) => {
      const d = new Date();
      d.setDate(d.getDate() - days);
      return d.toISOString().slice(0, 10).replace(/-/g, '');
    };
    const d7 = since(6);
    const d28 = since(27);

    let today = { users: 0, views: 0 };
    const last7 = { users: 0, views: 0 };
    const last28 = { users: 0, views: 0 };
    const series: { date: string; users: number }[] = [];

    for (const row of daily) {
      const date = String(row.dimensionValues?.[0]?.value || '');
      const users = n(row.metricValues?.[0]?.value);
      const views = n(row.metricValues?.[1]?.value);
      last28.users += users;
      last28.views += views;
      if (date >= d7) {
        last7.users += users;
        last7.views += views;
      }
      if (date === todayStr) today = { users, views };
      if (date >= d7) series.push({ date, users });
    }
    void d28;

    const topPages = (reports[1]?.rows || []).map((r: any) => ({
      path: String(r.dimensionValues?.[0]?.value || ''),
      title: String(r.dimensionValues?.[1]?.value || ''),
      views: n(r.metricValues?.[0]?.value),
    }));

    const topSources = (reports[2]?.rows || []).map((r: any) => ({
      source: String(r.dimensionValues?.[0]?.value || 'Direct'),
      users: n(r.metricValues?.[0]?.value),
    }));

    return { configured: true, active, today, last7, last28, series, topPages, topSources };
  } catch (err) {
    const msg = (err as Error).message || 'error';
    console.error('GA report fail:', msg);
    const email = getServiceAccount()?.client_email;
    // API hi band hai (Google Cloud me enable karni hai)
    if (/has not been used|SERVICE_DISABLED|is disabled|accessNotConfigured|analyticsdata/i.test(msg)) {
      return { configured: true, error: 'api-disabled', email };
    }
    // 403 = service account ko GA property me Viewer access nahi diya
    if (/permission|403|PERMISSION_DENIED/i.test(msg)) {
      return { configured: true, error: 'no-access', email };
    }
    return { configured: true, error: 'failed', email };
  }
}
