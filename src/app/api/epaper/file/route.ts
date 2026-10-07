import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { ADMIN_COOKIE, readSession } from '@/lib/adminAuth';
import { getAdmin, phoneFromRequest } from '@/lib/firebaseAdmin';
import { editionFile, hasActiveEpaper } from '@/lib/epaperServer';
import { epaperSite } from '@/lib/epaperSub';

/*
 * GET ?id=<editionId>&site=<portal>  →  { url (10 min signed), pages }
 * Sirf ISI PORTAL ka chalu subscription wale pathak (Bearer token) ya admin (session cookie).
 * Sanskaran kisi ek portal ka ho toh usi portal ka subscription; 'all' (sab portal) ho toh jis portal par padh rahe hain uska.
 */
export async function GET(req: Request) {
  if (!(await getAdmin())) return NextResponse.json({ error: 'not-configured' }, { status: 503 });
  const id = new URL(req.url).searchParams.get('id') || '';
  if (!/^[A-Za-z0-9_-]{4,64}$/.test(id)) return NextResponse.json({ error: 'bad-id' }, { status: 400 });

  let isAdminUser = false;
  try {
    isAdminUser = !!readSession((await cookies()).get(ADMIN_COOKIE)?.value);
  } catch {
    isAdminUser = false;
  }
  if (!isAdminUser) {
    const phone = await phoneFromRequest(req);
    if (!phone) return NextResponse.json({ error: 'unauthenticated', message: 'कृपया लॉगिन करें।' }, { status: 401 });
    const { db } = (await getAdmin())!;
    const edSite = String((await db.collection('epaper').doc(id).get()).data()?.siteId || '');
    const portal = edSite && edSite !== 'all' ? epaperSite(edSite) : epaperSite(new URL(req.url).searchParams.get('site'));
    if (!(await hasActiveEpaper(phone, portal)))
      return NextResponse.json({ error: 'no-subscription', message: 'इस पोर्टल का ई-पेपर पढ़ने के लिए सब्सक्रिप्शन लें।' }, { status: 403 });
  }

  const file = await editionFile(id);
  if (!file || (!file.url && !file.pages.length)) return NextResponse.json({ error: 'not-found', message: 'इस संस्करण की PDF उपलब्ध नहीं है।' }, { status: 404 });
  return NextResponse.json(file, { headers: { 'Cache-Control': 'private, no-store' } });
}
