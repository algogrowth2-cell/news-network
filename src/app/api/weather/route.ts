import { NextResponse } from 'next/server';

/*
 * User ki location ka live mausam — koi API key nahi:
 *  - Location: ?lat&lon (browser se) → warna Vercel ke IP headers (x-vercel-ip-latitude/longitude/city) → warna Indore
 *  - Mausam: Open-Meteo (free, bina key)
 * Har user ki location alag, isliye response CDN par share nahi hota (private cache).
 */

const DEFAULT = { lat: 22.7196, lon: 75.8577, city: 'Indore' };

// WMO weather code → Hindi/English + emoji
const WEATHER: [number[], string, string, string][] = [
  [[0], 'साफ़ आसमान', 'Clear', '☀️'],
  [[1], 'ज़्यादातर साफ़', 'Mostly clear', '🌤️'],
  [[2], 'आंशिक बादल', 'Partly cloudy', '⛅'],
  [[3], 'बादल', 'Cloudy', '☁️'],
  [[45, 48], 'कोहरा', 'Fog', '🌫️'],
  [[51, 53, 55, 56, 57], 'बूंदाबांदी', 'Drizzle', '🌦️'],
  [[61, 63, 66, 80, 81], 'बारिश', 'Rain', '🌧️'],
  [[65, 67, 82], 'तेज़ बारिश', 'Heavy rain', '🌧️'],
  [[71, 73, 75, 77, 85, 86], 'बर्फ़बारी', 'Snow', '❄️'],
  [[95, 96, 99], 'आंधी-तूफ़ान', 'Thunderstorm', '⛈️']
];
const describe = (code: number, isDay: boolean) => {
  const hit = WEATHER.find(([codes]) => codes.includes(code)) || WEATHER[2];
  const icon = !isDay && (code === 0 || code === 1) ? '🌙' : hit[3];
  return { textHi: hit[1], textEn: hit[2], icon };
};

// Bade shehron ke Hindi naam (baaki English hi)
const CITY_HI: Record<string, string> = {
  indore: 'इंदौर', bhopal: 'भोपाल', jabalpur: 'जबलपुर', gwalior: 'ग्वालियर', ujjain: 'उज्जैन', mhow: 'महू', ratlam: 'रतलाम', dewas: 'देवास',
  delhi: 'दिल्ली', 'new delhi': 'नई दिल्ली', mumbai: 'मुंबई', pune: 'पुणे', nagpur: 'नागपुर', kolkata: 'कोलकाता', chennai: 'चेन्नई',
  bengaluru: 'बेंगलुरु', bangalore: 'बेंगलुरु', hyderabad: 'हैदराबाद', ahmedabad: 'अहमदाबाद', surat: 'सूरत', vadodara: 'वडोदरा',
  bharuch: 'भरूच', rajkot: 'राजकोट', jaipur: 'जयपुर', jodhpur: 'जोधपुर', udaipur: 'उदयपुर', kota: 'कोटा', lucknow: 'लखनऊ',
  kanpur: 'कानपुर', agra: 'आगरा', varanasi: 'वाराणसी', prayagraj: 'प्रयागराज', noida: 'नोएडा', ghaziabad: 'गाज़ियाबाद',
  patna: 'पटना', ranchi: 'रांची', raipur: 'रायपुर', chandigarh: 'चंडीगढ़', ludhiana: 'लुधियाना', amritsar: 'अमृतसर',
  dehradun: 'देहरादून', gurugram: 'गुरुग्राम', gurgaon: 'गुरुग्राम', faridabad: 'फ़रीदाबाद', nashik: 'नासिक', aurangabad: 'औरंगाबाद',
  visakhapatnam: 'विशाखापट्टनम', vijayawada: 'विजयवाड़ा', guwahati: 'गुवाहाटी', bhubaneswar: 'भुवनेश्वर', kochi: 'कोच्चि',
  thiruvananthapuram: 'तिरुवनंतपुरम', coimbatore: 'कोयंबटूर', madurai: 'मदुरै', srinagar: 'श्रीनगर', jammu: 'जम्मू', shimla: 'शिमला'
};

const num = (v: string | null) => {
  const n = Number(v);
  return Number.isFinite(n) && v !== null && v !== '' ? n : null;
};

export async function GET(request: Request) {
  const url = new URL(request.url);
  const h = request.headers;

  let lat = num(url.searchParams.get('lat'));
  let lon = num(url.searchParams.get('lon'));
  let city = '';
  let source: 'browser' | 'ip' | 'default' = 'browser';

  if (lat === null || lon === null || Math.abs(lat) > 90 || Math.abs(lon) > 180) {
    lat = num(h.get('x-vercel-ip-latitude'));
    lon = num(h.get('x-vercel-ip-longitude'));
    city = decodeURIComponent(h.get('x-vercel-ip-city') || '');
    source = 'ip';
    // Sirf Bharat ke bahar ki IP (jaise CDN/bot) ho ya header na ho toh Indore
    if (lat === null || lon === null || (h.get('x-vercel-ip-country') && h.get('x-vercel-ip-country') !== 'IN')) {
      lat = DEFAULT.lat;
      lon = DEFAULT.lon;
      city = DEFAULT.city;
      source = 'default';
    }
  }
  if (!city && source === 'browser') city = url.searchParams.get('city') || '';

  // Cache ke liye location ~1 km tak gol
  const rlat = Math.round(lat * 100) / 100;
  const rlon = Math.round(lon * 100) / 100;

  try {
    const res = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${rlat}&longitude=${rlon}&current=temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,is_day,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=Asia%2FKolkata&forecast_days=1`,
      { next: { revalidate: 900 }, signal: AbortSignal.timeout(8000) }
    );
    if (!res.ok) throw new Error(`open-meteo ${res.status}`);
    const d = await res.json();
    const c = d.current || {};
    const desc = describe(Number(c.weather_code), c.is_day === 1);
    const cityKey = city.trim().toLowerCase();
    return NextResponse.json(
      {
        city: city || '',
        cityHi: CITY_HI[cityKey] || city || '',
        source,
        temp: Math.round(Number(c.temperature_2m)),
        feelsLike: Math.round(Number(c.apparent_temperature)),
        humidity: Math.round(Number(c.relative_humidity_2m)),
        wind: Math.round(Number(c.wind_speed_10m)),
        max: Math.round(Number(d.daily?.temperature_2m_max?.[0])),
        min: Math.round(Number(d.daily?.temperature_2m_min?.[0])),
        rainChance: Math.round(Number(d.daily?.precipitation_probability_max?.[0] ?? 0)),
        ...desc,
        updatedAt: c.time || new Date().toISOString()
      },
      { headers: { 'Cache-Control': 'private, max-age=600' } }
    );
  } catch (err) {
    console.warn('weather: fetch failed', (err as Error).message);
    return NextResponse.json({ error: 'unavailable' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
}
