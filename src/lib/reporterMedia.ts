import { getDownloadURL, ref, uploadBytesResumable } from 'firebase/storage';
import { storage } from '@/lib/firebase';

/*
 * Patrakar ki khabar ki photo (device se).
 *  1) Pehle browser me chhoti (max 1600px, JPEG) — jaldi upload, kam data
 *  2) Firebase Storage me reporter-media/{mobile}/… (Storage chalu ho toh)
 *  3) Storage chalu na ho / 20 sec me upload shuru na ho → aur chhoti (max 1000px) karke khabar ke saath (data URL)
 */

export const MAX_NEWS_PHOTO_MB = 15;

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('image'));
    };
    img.src = url;
  });
}

function draw(img: HTMLImageElement, maxW: number) {
  const scale = Math.min(1, maxW / img.naturalWidth);
  const c = document.createElement('canvas');
  c.width = Math.round(img.naturalWidth * scale);
  c.height = Math.round(img.naturalHeight * scale);
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, c.width, c.height);
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, c.width, c.height);
  return c;
}

export function validateNewsPhoto(file: File): string | null {
  if (!/^image\/(png|jpe?g|webp)$/i.test(file.type)) return 'कृपया JPG, PNG या WebP फ़ोटो चुनें।';
  if (file.size > MAX_NEWS_PHOTO_MB * 1024 * 1024) return `फ़ोटो ${MAX_NEWS_PHOTO_MB} MB से छोटी होनी चाहिए।`;
  return null;
}

export async function uploadNewsPhoto(file: File, owner: string, onProgress?: (pct: number) => void): Promise<{ url: string; inline: boolean }> {
  const img = await loadImage(file);
  const blob: Blob = await new Promise((res, rej) => draw(img, 1600).toBlob((b) => (b ? res(b) : rej(new Error('blob'))), 'image/jpeg', 0.82));
  const path = `reporter-media/${owner.replace(/[^0-9a-z_-]/gi, '') || 'unknown'}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;
  try {
    const url = await new Promise<string>((resolve, reject) => {
      const task = uploadBytesResumable(ref(storage, path), blob, { contentType: 'image/jpeg', cacheControl: 'public, max-age=31536000' });
      let moved = false;
      const stall = setTimeout(() => {
        if (moved) return;
        task.cancel();
        reject(new Error('stalled'));
      }, 20000);
      task.on(
        'state_changed',
        (s) => {
          if (s.bytesTransferred > 0) moved = true;
          onProgress?.(Math.round((s.bytesTransferred / s.totalBytes) * 100));
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
    return { url, inline: false };
  } catch {
    // Storage abhi chalu nahi — chhoti photo khabar ke saath hi (Firestore 1 MB seema ke andar)
    onProgress?.(100);
    return { url: draw(img, 1000).toDataURL('image/jpeg', 0.72), inline: true };
  }
}
