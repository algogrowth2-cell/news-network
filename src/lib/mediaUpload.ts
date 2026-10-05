import { getDownloadURL, ref, uploadBytesResumable } from 'firebase/storage';
import { storage } from '@/lib/firebase';

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
 * Firebase Storage me upload (articles/{yyyy-mm}/…) — progress 0-100 deta hai, public download URL lautata hai.
 */
export function uploadArticleMedia(file: File, kind: MediaKind, onProgress?: (pct: number) => void): Promise<string> {
  const now = new Date();
  const folder = `articles/${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const safeName = file.name.toLowerCase().replace(/[^a-z0-9.]+/g, '-').slice(-60);
  const path = `${folder}/${kind}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}-${safeName}`;
  const task = uploadBytesResumable(ref(storage, path), file, { contentType: file.type, cacheControl: 'public, max-age=31536000' });
  return new Promise((resolve, reject) => {
    task.on(
      'state_changed',
      (snap) => onProgress?.(Math.round((snap.bytesTransferred / snap.totalBytes) * 100)),
      (err) => reject(err),
      async () => {
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
  if (code.includes('unauthorized')) return 'अपलोड की अनुमति नहीं है (Firebase Storage rules जांचें)।';
  if (code.includes('canceled')) return 'अपलोड रद्द किया गया।';
  if (code.includes('quota')) return 'स्टोरेज की सीमा पूरी हो गई है।';
  return 'अपलोड नहीं हो पाया, कृपया इंटरनेट जांचकर पुनः प्रयास करें।';
}
