import { getDownloadURL, ref, uploadBytesResumable } from 'firebase/storage';
import { storage } from '@/lib/firebase';
import { compressToBlob, uploadToS3 } from '@/lib/s3Upload';

export const MAX_IMAGE_MB = 10;
export const MAX_VIDEO_MB = 200;

export type MediaKind = 'image' | 'video';

/** Device se chuni file ki jaanch — galti ho toh Hindi sandesh, warna null */
export function validateMedia(file: File, kind: MediaKind): string | null {
  if (kind === 'image' && !/^image\/(png|jpe?g|webp|gif)$/i.test(file.type)) return 'कृपया PNG, JPG, WebP या GIF फ़ोटो चुनें।';
  if (kind === 'video' && !/^video\/(mp4|webm|ogg|quicktime)$/i.test(file.type)) return 'कृपया MP4, WebM या MOV वीडियो चुनें।';
  const maxMb = kind === 'image' ? MAX_IMAGE_MB : MAX_VIDEO_MB;
  if (file.size > maxMb * 1024 * 1024) return `फ़ाइल ${maxMb} MB से छोटी होनी चाहिए।`;
  return null;
}

/**
 * News media upload — pehle AWS S3 par (image automatic COMPRESS hokar, halki & tez; quality ~85%, max 1600px).
 * GIF/video jaise ke taise. S3 set na ho / fail ho toh purana Firebase Storage tareeka (fallback).
 */
export async function uploadArticleMedia(file: File, kind: MediaKind, onProgress?: (pct: number) => void): Promise<string> {
  try {
    onProgress?.(5);
    // Image (GIF nahi — animation na tute) ko compress; baaki jaise ke taise
    const blob: Blob = kind === 'image' && file.type !== 'image/gif' ? await compressToBlob(file, 1600, 0.85) : file;
    onProgress?.(35);
    const url = await uploadToS3(blob, 'news'); // 503 (S3 off) → null
    if (url) { onProgress?.(100); return url; }
  } catch (e) {
    console.warn('S3 news upload fail, Firebase fallback:', (e as any)?.message || e);
  }
  // Fallback: purana Firebase Storage
  return uploadViaFirebase(file, kind, onProgress);
}

/** Purana Firebase Storage upload (fallback) */
function uploadViaFirebase(file: File, kind: MediaKind, onProgress?: (pct: number) => void): Promise<string> {
  const now = new Date();
  const folder = `articles/${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const safeName = file.name.toLowerCase().replace(/[^a-z0-9.]+/g, '-').slice(-60);
  const path = `${folder}/${kind}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}-${safeName}`;
  const task = uploadBytesResumable(ref(storage, path), file, { contentType: file.type, cacheControl: 'public, max-age=31536000' });
  return new Promise((resolve, reject) => {
    // Storage chalu na ho toh Firebase 0% par atka retry karta hai — 20 sec me ek byte na jaaye toh rok do
    let moved = false;
    const stall = setTimeout(() => {
      if (moved) return;
      task.cancel();
      reject(Object.assign(new Error('storage-stalled'), { code: 'storage/stalled' }));
    }, 20000);
    task.on(
      'state_changed',
      (snap) => {
        if (snap.bytesTransferred > 0) moved = true;
        onProgress?.(Math.round((snap.bytesTransferred / snap.totalBytes) * 100));
      },
      (err) => {
        clearTimeout(stall);
        reject(err);
      },
      async () => {
        clearTimeout(stall);
        try {
          resolve(await getDownloadURL(task.snapshot.ref));
        } catch (err) {
          reject(err);
        }
      }
    );
  });
}

/** Upload ki galti ka saaf sandesh */
export function uploadErrorMessage(err: any) {
  const code = String(err?.code || '');
  if (code.includes('stalled') || code.includes('retry-limit') || code.includes('bucket-not-found'))
    return 'Firebase Storage चालू नहीं है — Firebase Console → Storage → "Get started" करें (Blaze प्लान ज़रूरी)।';
  if (code.includes('unauthorized')) return 'अपलोड की अनुमति नहीं है (Firebase Storage rules जांचें)।';
  if (code.includes('canceled')) return 'अपलोड रद्द किया गया।';
  if (code.includes('quota')) return 'स्टोरेज की सीमा पूरी हो गई है।';
  return 'अपलोड नहीं हो पाया, कृपया इंटरनेट जांचकर पुनः प्रयास करें।';
}
