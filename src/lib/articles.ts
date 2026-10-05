/*
 * Articles ka saajha logic — admin editor, homepage aur article page sab yahi use karte hain.
 */

export const toJsDate = (v: any): Date | null => {
  if (!v) return null;
  if (v?.toDate) return v.toDate();
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
};

/** Khabar public dikhe ya nahi: published/approved, ya scheduled jiska samay aa chuka */
export function isArticleLive(a: { status?: string; publishAt?: any }, now = Date.now()) {
  const s = String(a.status || '').trim().toLowerCase();
  if (s === 'published' || s === 'approved') {
    const at = toJsDate(a.publishAt);
    return !at || at.getTime() <= now;
  }
  if (s === 'scheduled') {
    const at = toJsDate(a.publishAt);
    return !!at && at.getTime() <= now;
  }
  return false;
}

/** Khabar is portal ki hai? (purana single siteId ya naya siteIds array) */
export function articleBelongsTo(a: { siteId?: string; siteIds?: string[] }, siteIds: string[]) {
  if (a.siteId && siteIds.includes(a.siteId)) return true;
  return Array.isArray(a.siteIds) && a.siteIds.some((s) => siteIds.includes(s));
}

// ---------- YouTube / video ----------
export function youtubeId(url: string): string | null {
  const m = String(url || '').match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  return m ? m[1] : null;
}
export const youtubeEmbedUrl = (id: string) => `https://www.youtube-nocookie.com/embed/${id}`;
export const isDirectVideo = (url: string) => /^https:\/\/.+\.(mp4|webm|ogg|mov)(\?|$)/i.test(url) || /firebasestorage\.googleapis\.com/.test(url);

// ---------- Slug ----------
export function makeSlug(title: string) {
  const latin = title
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 70);
  const suffix = Date.now().toString(36).slice(-5);
  // Hindi shirshak me latin akshar nahi hote — tab "news-xxxxx"
  return latin.length >= 6 ? `${latin}-${suffix}` : `news-${suffix}`;
}

// ---------- Content HTML ki safai (article page par dikhane se pehle) ----------
const ALLOWED_TAGS = new Set([
  'P', 'BR', 'H2', 'H3', 'H4', 'B', 'STRONG', 'I', 'EM', 'U', 'S', 'STRIKE', 'BLOCKQUOTE', 'UL', 'OL', 'LI', 'A', 'IMG', 'HR',
  'FIGURE', 'FIGCAPTION', 'VIDEO', 'IFRAME', 'DIV', 'SPAN', 'CODE', 'PRE'
]);
const safeUrl = (v: string, allowData = false) => {
  const s = v.trim();
  if (/^https:\/\//i.test(s) || /^http:\/\//i.test(s)) return s;
  if (allowData && /^data:image\/(png|jpe?g|webp|gif);base64,/i.test(s)) return s;
  return '';
};

/** Sirf browser me (DOMParser). Script, event handlers, galat URL hata deta hai */
export function sanitizeArticleHtml(html: string): string {
  if (typeof window === 'undefined' || !html) return '';
  const doc = new DOMParser().parseFromString(`<div>${html}</div>`, 'text/html');
  const root = doc.body.firstElementChild as HTMLElement;

  const walk = (el: Element) => {
    for (const child of Array.from(el.children)) {
      if (!ALLOWED_TAGS.has(child.tagName)) {
        // Anjaan tag: andar ka text rakho, tag hatao (script/style poora hatao)
        if (['SCRIPT', 'STYLE', 'OBJECT', 'EMBED', 'FORM', 'INPUT', 'BUTTON', 'TEXTAREA', 'SELECT', 'LINK', 'META'].includes(child.tagName)) child.remove();
        else {
          walk(child);
          child.replaceWith(...Array.from(child.childNodes));
        }
        continue;
      }
      for (const attr of Array.from(child.attributes)) {
        const name = attr.name.toLowerCase();
        const keep =
          (child.tagName === 'A' && name === 'href') ||
          (['IMG', 'VIDEO', 'IFRAME'].includes(child.tagName) && name === 'src') ||
          (child.tagName === 'IMG' && name === 'alt') ||
          (child.tagName === 'VIDEO' && (name === 'controls' || name === 'poster'));
        if (!keep) child.removeAttribute(attr.name);
      }
      if (child.tagName === 'A') {
        const href = safeUrl(child.getAttribute('href') || '');
        if (href) {
          child.setAttribute('href', href);
          child.setAttribute('target', '_blank');
          child.setAttribute('rel', 'noopener noreferrer nofollow');
        } else child.removeAttribute('href');
      }
      if (child.tagName === 'IMG') {
        const src = safeUrl(child.getAttribute('src') || '', true);
        if (!src) {
          child.remove();
          continue;
        }
        child.setAttribute('loading', 'lazy');
      }
      if (child.tagName === 'VIDEO') {
        const src = safeUrl(child.getAttribute('src') || '');
        if (!src) {
          child.remove();
          continue;
        }
        child.setAttribute('controls', '');
        child.setAttribute('preload', 'metadata');
      }
      if (child.tagName === 'IFRAME') {
        const id = youtubeId(child.getAttribute('src') || '');
        if (!id) {
          child.remove();
          continue;
        }
        child.setAttribute('src', youtubeEmbedUrl(id));
        child.setAttribute('allowfullscreen', '');
        child.setAttribute('loading', 'lazy');
        child.setAttribute('allow', 'accelerometer; encrypted-media; gyroscope; picture-in-picture');
      }
      walk(child);
    }
  };
  walk(root);
  return root.innerHTML;
}

/** Content me HTML tag hain? (purani khabrein plain text hain) */
export const looksLikeHtml = (s: string) => /<(p|h[2-4]|b|strong|i|em|ul|ol|li|blockquote|img|video|iframe|br|div|a)\b/i.test(s || '');

export const stripHtml = (s: string) =>
  String(s || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();

/** ~200 shabd/minute */
export const readTimeMinutes = (text: string) => Math.max(1, Math.round(stripHtml(text).split(' ').filter(Boolean).length / 200));

// ---------- Tag sujhaav ----------
const STOP = new Set(
  (
    'और के की का को में से पर है हैं था थे थी एक यह वह इस उस ने भी तो ही कि जो कर किया करने लिए साथ गया गई गए होने होगा होगी रहा रही रहे अब तक बाद पहले जब तब कुछ सभी कई हुआ हुई हुए अपने अपनी उनके उनकी उन्होंने इसके इसकी लेकर दौरान बीच तथा एवं या नहीं वाले वाली वालों द्वारा अपना किसी कोई आज कल जारी बढ़े बढ़ा बढ़ी घटे घटा घटी मिला मिली मिले रहीं दिया दिए दी लिया लिए ली कहा कहे कही बताया बताई बड़ा बड़ी बड़े नया नई नए दिन साल समय लोग लोगों बार बात ' +
    'the a an and or of to in on for with is are was were be been by at from as this that these those it its into about after before over under not no new news said says will would can could has have had'
  ).split(' ')
);

/**
 * Khabar ke shirshak/saar/content se tags sujhao:
 *  1. pehle se istemal hue tags (popularTags) jo text me aate hain
 *  2. baar-baar aane wale shabd aur do-shabd ke jode (shirshak ke shabd zyada wazan)
 */
export function suggestTags(input: { title: string; summary: string; content: string; category: string }, popularTags: string[], chosen: string[], max = 12) {
  const title = stripHtml(input.title);
  const body = `${stripHtml(input.summary)} ${stripHtml(input.content)}`;
  const all = `${title} ${body}`.toLowerCase();
  const chosenSet = new Set(chosen.map((t) => t.toLowerCase()));
  const out: string[] = [];
  const push = (t: string) => {
    const k = t.toLowerCase();
    if (t && !chosenSet.has(k) && !out.some((o) => o.toLowerCase() === k)) out.push(t);
  };

  for (const t of popularTags) if (t.length > 1 && all.includes(t.toLowerCase())) push(t);
  if (input.category) push(input.category);

  const words = (s: string) =>
    s
      .replace(/[^\p{L}\p{M}\p{N}\s]/gu, ' ')
      .split(/\s+/)
      .filter((w) => w.length >= 3 && !STOP.has(w.toLowerCase()) && !/^\d+$/.test(w));
  const score = new Map<string, number>();
  const add = (w: string, n: number) => score.set(w, (score.get(w) || 0) + n);
  const tw = words(title);
  const bw = words(body);
  tw.forEach((w) => add(w, 3));
  bw.forEach((w) => add(w, 1));
  // Do-shabd jode (jaise "मंडी भाव", "Indian Army")
  for (const list of [tw, bw]) {
    for (let i = 0; i < list.length - 1; i++) {
      const pair = `${list[i]} ${list[i + 1]}`;
      // Jode ko tabhi jab poori khabar me 2+ baar aaye — ek baar wale jode shor hain
      if (all.split(pair.toLowerCase()).length - 1 >= 2) add(pair, list === tw ? 2.5 : 1.5);
    }
  }
  Array.from(score.entries())
    .filter(([, s]) => s >= 2)
    .sort((a, b) => b[1] - a[1])
    .forEach(([w]) => push(w));
  return out.slice(0, max);
}
