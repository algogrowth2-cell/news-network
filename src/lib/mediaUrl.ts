/**
 * Share link → seedha (direct) media link.
 *   Google Drive: drive.google.com/file/d/<ID>/view?usp=sharing  →  lh3.googleusercontent.com/d/<ID>
 *     (Drive ka share link ek webpage hota hai, photo nahi — isliye website par dikhta nahi tha; GIF ki animation bani rehti hai)
 *   Dropbox: ?dl=0 → ?raw=1
 * Baaki link jaise ke taise.
 */
export function directMediaUrl(url?: string | null): string {
  const u = String(url || '').trim();
  if (!u) return '';
  const drive = u.match(/^https?:\/\/(?:drive|docs)\.google\.com\/(?:file\/d\/|open\?id=|uc\?(?:[^#]*&)?id=)([A-Za-z0-9_-]{10,})/);
  if (drive) return `https://lh3.googleusercontent.com/d/${drive[1]}`;
  if (/^https?:\/\/(www\.)?dropbox\.com\//i.test(u)) return u.replace(/([?&])dl=0/, '$1raw=1').replace(/^(?!.*[?&]raw=1)(.*)$/, (m) => (m.includes('?') ? `${m}&raw=1` : `${m}?raw=1`));
  return u;
}
