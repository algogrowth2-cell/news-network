'use client';
import { authFetch } from '@/lib/phoneAuth';

/*
 * Browser se AWS S3 par upload: server se signed URL lo, phir seedha S3 par PUT. Public URL wapas.
 * S3 set na ho (503) toh null — caller purana tareeka (base64) chala sakta hai.
 */
export async function uploadToS3(file: Blob, folder: 'matrimony' | 'ads' | 'reporters' | 'news'): Promise<string | null> {
  try {
    const r = await authFetch('/api/upload/presign', { method: 'POST', body: JSON.stringify({ folder, contentType: file.type }) });
    if (r.status === 503) return null; // S3 abhi set nahi — fallback
    const j = await r.json();
    if (!r.ok || !j.url) throw new Error(j.message || 'presign-failed');
    const put = await fetch(j.url, { method: 'PUT', headers: { 'Content-Type': file.type }, body: file });
    if (!put.ok) throw new Error('s3-put-failed');
    return j.publicUrl as string;
  } catch (e) {
    console.error('S3 upload error:', e);
    throw e;
  }
}

/** Canvas se compress karke JPEG Blob (max px, quality). */
export function compressToBlob(file: File, max = 1200, quality = 0.82): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      let { width, height } = img;
      if (width > max || height > max) { const r = Math.min(max / width, max / height); width = Math.round(width * r); height = Math.round(height * r); }
      const c = document.createElement('canvas');
      c.width = width; c.height = height;
      c.getContext('2d')!.drawImage(img, 0, 0, width, height);
      URL.revokeObjectURL(url);
      c.toBlob((b) => (b ? resolve(b) : reject(new Error('blob'))), 'image/jpeg', quality);
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('img')); };
    img.src = url;
  });
}
