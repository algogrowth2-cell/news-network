import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { ADMIN_COOKIE, readSession } from '@/lib/adminAuth';
import { getAdmin } from '@/lib/firebaseAdmin';

/*
 * Admin: जनता दरबार submission verify kare.
 *  approve → website par live article ban jaata hai (status approved) + submission 'approved'.
 *  reject  → submission 'rejected' (website par kabhi nahi).
 * Sirf admin cookie wala. Aam user yahan kuch nahi kar sakta.
 */
async function adminOk() {
  try {
    return !!readSession((await cookies()).get(ADMIN_COOKIE)?.value);
  } catch {
    return false;
  }
}

const ts = (v: any) => (v?.toMillis ? v.toMillis() : v?._seconds ? v._seconds * 1000 : 0);

// Admin dashboard ke liye submissions ki list (pending sabse upar)
export async function GET() {
  if (!(await adminOk())) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
  const admin = await getAdmin();
  if (!admin) return NextResponse.json({ error: 'not-configured', items: [] }, { status: 503 });
  try {
    const snap = await admin.db.collection('janta_submissions').limit(300).get();
    const items = snap.docs.map((d) => {
      const x: any = d.data() || {};
      return {
        id: d.id,
        title: x.title || '',
        description: x.description || '',
        category: x.category || '',
        location: x.location || '',
        city: x.city || '',
        state: x.state || '',
        photos: Array.isArray(x.photos) ? x.photos : [],
        videos: Array.isArray(x.videos) ? x.videos : [],
        site: x.site || '',
        submitterName: x.submitterName || '',
        submitterPhone: x.submitterPhone || '',
        status: x.status || 'pending',
        articleId: x.articleId || '',
        createdAtMs: ts(x.createdAt)
      };
    });
    // pending pehle, phir naye upar
    const rank = (s: string) => (s === 'pending' ? 0 : 1);
    items.sort((a, b) => rank(a.status) - rank(b.status) || b.createdAtMs - a.createdAtMs);
    return NextResponse.json({ ok: true, items });
  } catch (e: any) {
    console.error('janta list error:', e?.message || e);
    return NextResponse.json({ error: 'failed', items: [] }, { status: 500 });
  }
}

export async function POST(req: Request) {
  if (!(await adminOk())) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });

  const admin = await getAdmin();
  if (!admin) return NextResponse.json({ error: 'not-configured' }, { status: 503 });

  const { id, action } = await req.json().catch(() => ({}));
  if (!id || !['approve', 'reject'].includes(action)) {
    return NextResponse.json({ error: 'bad-input' }, { status: 400 });
  }

  try {
    const ref = admin.db.collection('janta_submissions').doc(String(id));
    const snap = await ref.get();
    if (!snap.exists) return NextResponse.json({ error: 'not-found' }, { status: 404 });
    const s: any = snap.data() || {};

    if (action === 'reject') {
      await ref.update({ status: 'rejected', reviewedAt: admin.FieldValue.serverTimestamp() });
      return NextResponse.json({ ok: true, status: 'rejected' });
    }

    // approve → articles me live khabar
    const photos: string[] = Array.isArray(s.photos) ? s.photos : [];
    const videos: string[] = Array.isArray(s.videos) ? s.videos : [];
    const now = new Date();
    const article = {
      title: s.title || '',
      titleHi: s.title || '',
      summary: String(s.description || '').slice(0, 220),
      content: s.description || '',
      category: s.category || 'जनता दरबार',
      image: photos[0] || 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=800&auto=format&fit=crop',
      images: photos,
      videoUrl: videos[0] || '',
      videos,
      location: s.location || '',
      city: s.city || '',
      state: s.state || '',
      siteId: s.site || 'the-local-leader',
      status: 'approved',
      source: 'janta-darbaar',
      authorName: s.submitterName || 'नागरिक',
      authorIdentifier: s.submitterPhone || '',
      jantaSubmissionId: ref.id,
      views: 0,
      createdAt: now.toISOString().split('T')[0],
      publishAt: admin.FieldValue.serverTimestamp(),
      timestamp: admin.FieldValue.serverTimestamp()
    };
    const art = await admin.db.collection('articles').add(article);
    await ref.update({ status: 'approved', articleId: art.id, reviewedAt: admin.FieldValue.serverTimestamp() });
    return NextResponse.json({ ok: true, status: 'approved', articleId: art.id });
  } catch (e: any) {
    console.error('janta review error:', e?.message || e);
    return NextResponse.json({ error: 'failed' }, { status: 500 });
  }
}
