import { NextResponse } from 'next/server';
import { collection, doc, getDocs, runTransaction, writeBatch, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { RASHI_LIST, todayIST, isRashifalFresh } from '@/lib/rashifal';

// Groq response me kuch second lag sakte hain
export const maxDuration = 60;

// llama-3.3-70b-versatile Groq par ab available nahi; gpt-oss-120b sabse saaf Hindi JSON deta hai
const GROQ_MODEL = process.env.GROQ_MODEL || 'openai/gpt-oss-120b';
const GROQ_TIMEOUT_MS = 50_000;

// Ek hi din me duplicate AI calls rokne ke liye lock (kai visitors ek saath site kholein tab)
const SYNC_LOCK = doc(db, 'settings', 'rashifal_sync');
const RUNNING_LOCK_MS = 2 * 60 * 1000; // chal rahi sync itni der tak dusri call rokti hai
const RETRY_AFTER_FAIL_MS = 30 * 60 * 1000; // fail hone par itni der baad hi dobara koshish

interface GeneratedRashi {
  rashiId: string;
  prediction: string;
  luckyNumber: string;
  luckyColor: string;
}

async function generateWithGroq(today: string): Promise<GeneratedRashi[]> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('GROQ_API_KEY set nahi hai');

  const ids = RASHI_LIST.map((r) => r.id).join(', ');
  // Grah-gochar ke claims jaan-boojh kar nahi: AI asli grah sthiti nahi jaanta aur aapas me takraate dave bana deta tha
  const prompt =
    `आज की तारीख ${today} (Asia/Kolkata) है। सभी 12 राशियों का आज का दैनिक राशिफल समाचार-पत्र की पेशेवर शैली में शुद्ध हिंदी में लिखें। ` +
    `हर राशि के लिए 2-3 संतुलित, व्यावहारिक वाक्य — करियर, व्यापार, स्वास्थ्य, आर्थिक स्थिति और पारिवारिक जीवन पर मार्गदर्शन। ` +
    `किसी भी ग्रह, नक्षत्र, गोचर, भाव या दशा का नाम या उल्लेख बिल्कुल न करें (जैसे सूर्य, चंद्र, मंगल, बुध, गुरु/बृहस्पति, शुक्र, शनि, राहु, केतु)। ` +
    `कोई डरावनी या पक्की भविष्यवाणी नहीं। ` +
    `इस JSON आकार में लौटाएं: {"rashifal":[{"rashiId":"aries","prediction":"...","luckyNumber":"1-9 में से एक अंक","luckyColor":"हिंदी में रंग"}]} — ` +
    `rashiId क्रम से: ${ids}।`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), GROQ_TIMEOUT_MS);
  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      signal: controller.signal,
      body: JSON.stringify({
        model: GROQ_MODEL,
        temperature: 0.8,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content:
              'आप एक हिंदी समाचार पत्र के अनुभवी राशिफल संपादक हैं। आप दैनिक जीवन पर व्यावहारिक, सकारात्मक मार्गदर्शन लिखते हैं और कभी ग्रह-नक्षत्र या गोचर का उल्लेख नहीं करते। केवल valid JSON लौटाएं।'
          },
          { role: 'user', content: prompt }
        ]
      })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(`Groq ${res.status}: ${data?.error?.message || 'unknown error'}`);

    const text: string = data?.choices?.[0]?.message?.content || '';
    const parsed = JSON.parse(text.replace(/^```(?:json)?\s*|\s*```$/g, ''));
    const list = Array.isArray(parsed) ? parsed : parsed?.rashifal;
    if (!Array.isArray(list)) throw new Error('Groq response me rashifal array nahi mila');

    // Har rashi ka valid entry zaroori — adhoora data Firestore me nahi likhenge
    return RASHI_LIST.map((r) => {
      const item = list.find((p: any) => p?.rashiId === r.id);
      const prediction = String(item?.prediction || '').trim();
      if (!prediction) throw new Error(`Groq response me ${r.id} ka rashifal nahi hai`);
      const num = String(item.luckyNumber || '').replace(/[^1-9]/g, '').charAt(0);
      return {
        rashiId: r.id,
        prediction: prediction.slice(0, 800),
        luckyNumber: num,
        luckyColor: String(item.luckyColor || '').trim().slice(0, 30)
      };
    });
  } finally {
    clearTimeout(timer);
  }
}

// Browser me URL kholne (GET) aur homepage ke background trigger (POST) — dono same sync chalate hain.
// Lock + "already up-to-date" check ki wajah se baar-baar hit karne par bhi AI din me ek hi baar call hota hai.
export async function GET() {
  return runAutoSync();
}

export async function POST() {
  return runAutoSync();
}

async function runAutoSync() {
  const today = todayIST();

  try {
    // 1. Aaj ka data pehle se hai? Toh AI call bilkul nahi
    const snap = await getDocs(collection(db, 'rashifal'));
    const docsById: Record<string, any> = {};
    snap.docs.forEach((d) => (docsById[d.id] = d.data()));
    if (isRashifalFresh(docsById, today)) {
      return NextResponse.json({ updated: false, date: today, message: 'Already up-to-date' });
    }

    // 2. Lock claim karo, taaki ek hi request AI ko call kare
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

    // 3. Groq se 12 rashiyon ka naya rashifal
    let generated: GeneratedRashi[];
    try {
      generated = await generateWithGroq(today);
    } catch (err: any) {
      const message = err?.name === 'AbortError' ? 'Groq request timed out' : err?.message || 'Groq error';
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
        source: 'groq-auto',
        updatedAt: serverTimestamp()
      });
    });
    batch.set(SYNC_LOCK, { date: today, status: 'done', finishedAt: Date.now(), model: GROQ_MODEL });
    await batch.commit();

    return NextResponse.json({ updated: true, date: today, model: GROQ_MODEL, message: 'Rashifal updated' });
  } catch (err: any) {
    console.error('Rashifal auto-sync error:', err);
    return NextResponse.json({ updated: false, date: today, message: err?.message || 'Server error' }, { status: 500 });
  }
}
