import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { phoneFromRequest } from '@/lib/firebaseAdmin';
import { ADMIN_COOKIE, readSession } from '@/lib/adminAuth';
import { presignUpload, s3Configured } from '@/lib/s3';

/*
 * Login (Bearer token) wala user hi upload kar sakta hai. Server ek 2-min ka signed PUT URL deta hai;
 * browser seedha us URL par file daalता hai. Keys browser tak kabhi nahi jaati.
 */
const FOLDERS = ['matrimony', 'ads', 'reporters', 'news'];
const EXT_OK: Record<string, string> = {
  'image/jpeg': 'jpg', 'image/jpg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif',
  'video/mp4': 'mp4', 'video/webm': 'webm'
};

export async function POST(req: Request) {
  if (!s3Configured()) return NextResponse.json({ error: 'not-configured' }, { status: 503 });
  const phone = await phoneFromRequest(req);
  let admin = false;
  try { admin = !!readSession((await cookies()).get(ADMIN_COOKIE)?.value); } catch {}
  if (!phone && !admin) return NextResponse.json({ error: 'unauthenticated', message: 'कृपया लॉगिन करें।' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const folder = FOLDERS.includes(String(body.folder)) ? String(body.folder) : 'misc';
  // 'news' folder sirf admin ke liye
  if (folder === 'news' && !admin) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  const contentType = String(body.contentType || '');
  const ext = EXT_OK[contentType];
  if (!ext) return NextResponse.json({ error: 'bad-type', message: 'इस फ़ाइल प्रकार की अनुमति नहीं है।' }, { status: 400 });

  const rand = Math.random().toString(36).slice(2, 10);
  const who = phone || 'admin';
  const key = `${folder}/${who}/${Date.now()}-${rand}.${ext}`;
  try {
    const { url, publicUrl } = await presignUpload(key, contentType);
    return NextResponse.json({ ok: true, url, publicUrl });
  } catch (e: any) {
    console.error('presign error:', e);
    return NextResponse.json({ error: 'failed', message: 'अपलोड लिंक नहीं बन पाया।' }, { status: 500 });
  }
}
