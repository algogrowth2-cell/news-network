import { NextResponse } from 'next/server';
import { collection, doc, getDocs, runTransaction, writeBatch, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { RASHI_LIST, todayIST, isRashifalFresh } from '@/lib/rashifal';

// Gemini response me kuch second lag sakte hain
export const maxDuration = 60;

const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.8-flash';
const GEMINI_TIMEOUT_MS = 50_000;

// Ek hi din me duplicate Gemini calls rokne ke liye lock (kai visitors ek saath site kholein tab)
const SYNC_LOCK = doc(db, 'settings', 'rashifal_sync');
const RUNNING_LOCK_MS = 2 * 60 * 1000; // chal rahi sync itni der tak dusri call rokti hai
const RETRY_AFTER_FAIL_MS = 30 * 60 * 1000; // fail hone par itni der baad hi dobara koshish

interface GeneratedRashi {
  rashiId: string;
  prediction: string;
  luckyNumber: string;
  luckyColor: string;
}

async function generateWithGemini(today: string): Promise<GeneratedRashi[]> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY set nahi hai');

  const prompt =
    `आज की तारीख ${today} है (भारतीय समय)। सभी 12 राशियों का आज का दैनिक राशिफल सरल, सकारात्मक और संतुलित हिंदी में लिखें। ` +
    `हर राशि के लिए 2-3 वाक्य (करियर/धन, स्वास्थ्य, संबंध)। कोई डरावनी या पक्की भविष्यवाणी नहीं। ` +
    `luckyNumber 1 से 99 के बीच एक अंक, luckyColor हिंदी में एक रंग का नाम। ` +
    `rashiId इनमें से ही हों: ${RASHI_LIST.map((r) => r.id).join(', ')}।`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), GEMINI_TIMEOUT_MS);
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
      signal: controller.signal,
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.9,
          responseMimeType: 'application/json',
          responseSchema: {
            type: 'ARRAY',
            items: {
              type: 'OBJECT',
              properties: {
                rashiId: { type: 'STRING', enum: RASHI_LIST.map((r) => r.id) },
                prediction: { type: 'STRING' },
                luckyNumber: { type: 'STRING' },
                luckyColor: { type: 'STRING' }
              },
              required: ['rashiId', 'prediction', 'luckyNumber', 'luckyColor']
            }
          }
        }
      })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(`Gemini ${res.status}: ${data?.error?.message || 'unknown error'}`);

    const text: string = (data?.candidates?.[0]?.content?.parts || []).map((p: any) => p.text || '').join('');
    const parsed = JSON.parse(text.replace(/^```(?:json)?\s*|\s*```$/g, ''));
    if (!Array.isArray(parsed)) throw new Error('Gemini ne array return nahi kiya');

    // Har rashi ka valid entry zaroori — adhoora data Firestore me nahi likhenge
    return RASHI_LIST.map((r) => {
      const item = parsed.find((p: any) => p?.rashiId === r.id);
      const prediction = String(item?.prediction || '').trim();
      if (!prediction) throw new Error(`Gemini response me ${r.id} ka rashifal nahi hai`);
      return {
        rashiId: r.id,
        prediction: prediction.slice(0, 800),
        luckyNumber: String(item.luckyNumber || '').replace(/[^0-9]/g, '').slice(0, 2),
        luckyColor: String(item.luckyColor || '').trim().slice(0, 30)
      };
    });
  } finally {
    clearTimeout(timer);
  }
}

export async function POST() {
  const today = todayIST();

  try {
    // 1. Aaj ka data pehle se hai? Toh Gemini call bilkul nahi
    const snap = await getDocs(collection(db, 'rashifal'));
    const docsById: Record<string, any> = {};
    snap.docs.forEach((d) => (docsById[d.id] = d.data()));
    if (isRashifalFresh(docsById, today)) {
      return NextResponse.json({ updated: false, date: today, message: 'Already up-to-date' });
    }

    // 2. Lock claim karo, taaki ek hi request Gemini ko call kare
    const claimed = await runTransaction(db, async (tx) => {
      const lock = (await tx.get(SYNC_LOCK)).data();
      const now = Date.now();
      if (lock?.date === today) {
        if (lock.status === 'done') return false;
        if (lock.status === 'running' && now - (lock.startedAt || 0) < RUNNING_LOCK_MS) return false;
        if (lock.status === 'failed' && now - (lock.failedAt || 0) < RETRY_AFTER_FAIL_MS) return false;
      }
      tx.set(SYNC_LOCK, { date: today, status: 'running', startedAt: now });
      return true;
    });
    if (!claimed) {
      return NextResponse.json({ updated: false, date: today, message: 'Sync already done, running, or recently failed' });
    }

    // 3. Gemini se 12 rashiyon ka naya rashifal
    let generated: GeneratedRashi[];
    try {
      generated = await generateWithGemini(today);
    } catch (err: any) {
      const message = err?.name === 'AbortError' ? 'Gemini request timed out' : err?.message || 'Gemini error';
      await writeBatch(db).set(SYNC_LOCK, { date: today, status: 'failed', failedAt: Date.now(), error: message }).commit();
      console.error('Rashifal auto-sync failed:', message);
      return NextResponse.json({ updated: false, date: today, message }, { status: 502 });
    }

    // 4. Saare 12 docs ek batch me — homepage ka onSnapshot turant naya data dikhayega
    const batch = writeBatch(db);
    generated.forEach((g) => {
      const rashi = RASHI_LIST.find((r) => r.id === g.rashiId)!;
      batch.set(doc(db, 'rashifal', g.rashiId), {
        rashiId: g.rashiId,
        rashiName: `${rashi.name} (${rashi.nameEn})`,
        sign: rashi.sign,
        prediction: g.prediction,
        luckyNumber: g.luckyNumber,
        luckyColor: g.luckyColor,
        date: today,
        source: 'gemini-auto',
        updatedAt: serverTimestamp()
      });
    });
    batch.set(SYNC_LOCK, { date: today, status: 'done', finishedAt: Date.now(), model: GEMINI_MODEL });
    await batch.commit();

    return NextResponse.json({ updated: true, date: today, message: 'Rashifal updated' });
  } catch (err: any) {
    console.error('Rashifal auto-sync error:', err);
    return NextResponse.json({ updated: false, date: today, message: err?.message || 'Server error' }, { status: 500 });
  }
}
