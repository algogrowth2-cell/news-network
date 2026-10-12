import { NextResponse } from 'next/server';
import { getAdmin, phoneFromRequest } from '@/lib/firebaseAdmin';

/*
 * जनता दरबार — aam (login kiya hua) user khabar bhejta hai. Admin verify karega tabhi website par aayegi.
 * Login ZAROORI (Bearer token). Bina login koi database nahi bhar sakta.
 * Spam rok: ek number ke 'pending' submissions 5 se zyada nahi.
 */
const str = (v: any, max = 4000) => String(v == null ? '' : v).trim().slice(0, max);
const arr = (v: any, max = 8) =>
  (Array.isArray(v) ? v : []).map((x) => String(x || '')).filter((x) => /^https?:\/\//i.test(x)).slice(0, max);

export async function POST(req: Request) {
  const admin = await getAdmin();
  if (!admin) return NextResponse.json({ error: 'not-configured' }, { status: 503 });

  const phone = await phoneFromRequest(req);
  if (!phone) return NextResponse.json({ error: 'unauthenticated', message: 'कृपया पहले लॉगिन करें।' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const title = str(body.title, 160);
  const description = str(body.description, 6000);
  const photos = arr(body.photos);
  const videos = arr(body.videos, 3);

  if (title.length < 5) return NextResponse.json({ error: 'bad-input', message: 'शीर्षक कम से कम 5 अक्षर का लिखें।' }, { status: 400 });
  if (description.length < 10) return NextResponse.json({ error: 'bad-input', message: 'कृपया खबर के बारे में थोड़ा विवरण लिखें।' }, { status: 400 });

  try {
    // Spam rok — is number ke kitne pending? (best-effort: index/other error par submit mat roko)
    try {
      const pend = await admin.db
        .collection('janta_submissions')
        .where('submitterPhone', '==', phone)
        .where('status', '==', 'pending')
        .count()
        .get();
      if ((pend.data().count || 0) >= 5) {
        return NextResponse.json(
          { error: 'too-many', message: 'आपकी 5 खबरें पहले से समीक्षा में हैं। कृपया उनके सत्यापन का इंतज़ार करें।' },
          { status: 429 }
        );
      }
    } catch (ce: any) {
      console.warn('janta spam-check skipped:', ce?.message || ce);
    }

    const doc = {
      title,
      description,
      category: str(body.category, 60),
      location: str(body.location, 120),
      city: str(body.city, 80),
      state: str(body.state, 80),
      photos,
      videos,
      site: str(body.site, 60) || 'the-local-leader',
      submitterPhone: phone,
      submitterName: str(body.name, 80) || 'नागरिक',
      status: 'pending', // pending → approved / rejected (sirf admin)
      createdAt: admin.FieldValue.serverTimestamp()
    };
    const ref = await admin.db.collection('janta_submissions').add(doc);
    return NextResponse.json({ ok: true, id: ref.id });
  } catch (e: any) {
    console.error('janta submit error:', e?.message || e);
    return NextResponse.json({ error: 'failed', message: 'खबर जमा नहीं हो पाई, थोड़ी देर बाद कोशिश करें।' }, { status: 500 });
  }
}
