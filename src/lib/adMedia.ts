import { getDownloadURL, ref, uploadBytesResumable } from 'firebase/storage';
import { storage } from '@/lib/firebase';

/*
 * Animated vigyapan: GIF ya chhota video (MP4/WebM) — banner, sidebar, classified sabme.
 * Photo (JPG/PNG) wala tareeka alag hai (adImage.ts — crop + resize); GIF/video bina crop seedha Storage me
 * (ad-media/{mobile}/…) taaki animation na toote. Website par fix size ke dabbe me hi chalta hai (object-fit: cover).
 */

export const MAX_AD_VIDEO_MB = 20;
export const MAX_AD_GIF_MB = 5;
export const MAX_AD_VIDEO_SECONDS = 30;

export const isAnimatedFile = (file: File) => file.type === 'image/gif' || /^video\/(mp4|webm)$/i.test(file.type);
// Link video ka hai? (Firebase link: …%2F123.mp4?alt=media — '?' se pehle ka hissa dekho)
export const isVideoUrl = (url?: string) => !!url && /\.(mp4|webm)$/i.test(url.split(/[?#]/)[0]);

function videoSeconds(file: File): Promise<number> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const v = document.createElement('video');
    v.preload = 'metadata';
    v.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      resolve(v.duration || 0);
    };
    v.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(0);
    };
    v.src = url;
  });
}

/** GIF / video ki jaanch — galti ho toh Hindi sandesh, warna null */
export async function validateAdMedia(file: File): Promise<string | null> {
  if (file.type === 'image/gif') {
    return file.size > MAX_AD_GIF_MB * 1024 * 1024 ? `GIF ${MAX_AD_GIF_MB} MB से छोटी होनी चाहिए।` : null;
  }
  if (!/^video\/(mp4|webm)$/i.test(file.type)) return 'कृपया MP4 या WebM वीडियो, या GIF चुनें।';
  if (file.size > MAX_AD_VIDEO_MB * 1024 * 1024) return `वीडियो ${MAX_AD_VIDEO_MB} MB से छोटा होना चाहिए।`;
  const secs = await videoSeconds(file);
  if (secs > MAX_AD_VIDEO_SECONDS + 0.5) return `वीडियो ${MAX_AD_VIDEO_SECONDS} सेकंड तक का होना चाहिए (अभी ${Math.round(secs)} सेकंड)।`;
  return null;
}

/** Storage me upload (ad-media/{mobile}/…) — progress 0-100, public download URL lautata hai */
export function uploadAdMedia(file: File, owner: string, onProgress?: (pct: number) => void): Promise<string> {
  const ext = file.type === 'image/gif' ? 'gif' : file.type.includes('webm') ? 'webm' : 'mp4';
  const path = `ad-media/${owner.replace(/[^0-9a-z_-]/gi, '') || 'unknown'}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
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
