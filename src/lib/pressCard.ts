import QRCode from 'qrcode';
import { db } from '@/lib/firebase';
import { arrayUnion, doc, runTransaction, serverTimestamp } from 'firebase/firestore';
import { fallbackFor } from '@/lib/siteTheme';

/*
 * Patrakar ka Media ID Card + Pradhikaran Patra (authorization letter).
 * Dono canvas par diye gaye design ke naap (ID 638×1016, patra 1131×1600) me bante hain — wahi preview, wahi PNG/PDF.
 * Portal (site) badalne par logo, naam, tagline, rang aur ID prefix us portal ke ho jaate hain.
 */

export const PRESS_ID_PREFIX: Record<string, string> = {
  'the-local-leader': 'TLL',
  'the-provue-times': 'TPT',
  'jan-bharat-news': 'JBN',
  'news-info-24': 'NI24',
  'ndn-defence': 'NDN',
  'bazar-karobar': 'BK',
  'golden-pearl-chronicles': 'GPC',
  'desh-ki-aawaz': 'DKA'
};

export const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
export const DEFAULT_DESIGNATION = 'Reporter';

// Network office (footer jaisa)
export const PRESS_OFFICE = {
  address: '1st Floor Shreenath Complex, Old A.B. Road, Kishanganj, Dr. Ambedkar Nagar (Mhow), Indore (M.P.) - 453441',
  phone: '+91 8103333381',
  email: 'goldenpearlnews@gmail.com'
};

export interface PressCardData {
  siteSlug: string;
  siteName: string;
  tagline: string;
  brand: string;
  logoSrc: string;
  name: string;
  designation: string;
  pressId: string;
  issuedOn: Date;
  validTill: Date;
  mobile: string;
  bloodGroup: string;
  area: string;
  photo: string; // data URL ya same-origin URL
  verifyUrl: string;
}

const FONT = "'Noto Sans Devanagari', 'Segoe UI', Arial, sans-serif";
const DARK = '#3d4246';
const INK = '#1f1f1f';

// ---------- helpers ----------
export const toDate = (v: any): Date | null => {
  if (!v) return null;
  if (v?.toDate) return v.toDate();
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
};

export const addYears = (d: Date, years: number) => {
  const x = new Date(d);
  x.setFullYear(x.getFullYear() + years);
  x.setDate(x.getDate() - 1);
  return x;
};

export const fmtCardDate = (d: Date) => d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
export const fmtLetterDate = (d: Date) => `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
export const letterNumberFor = (pressId: string) => pressId.replace(/^([A-Z0-9]+)-(\d{4})-(\d+)$/, '$1/AUTH/$2/$3');

/** Sirf same-origin logo (canvas export ke liye); bahar ka URL ho toh portal ka local logo */
export const safeLogoSrc = (slug: string, logoUrl?: string) => (logoUrl && logoUrl.startsWith('/') ? logoUrl : fallbackFor(slug).logoUrl);

const loadImg = (src: string) =>
  new Promise<HTMLImageElement | null>((resolve) => {
    if (!src) return resolve(null);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });

/** Logo image ke charon taraf ki safed/khaali jagah hata kar canvas lautata hai (design jaisa bada logo) */
const trimWhitespace = (img: HTMLImageElement): HTMLImageElement | HTMLCanvasElement => {
  try {
    const c = document.createElement('canvas');
    c.width = img.naturalWidth || img.width;
    c.height = img.naturalHeight || img.height;
    const x = c.getContext('2d', { willReadFrequently: true })!;
    x.drawImage(img, 0, 0);
    const { data, width, height } = x.getImageData(0, 0, c.width, c.height);
    let minX = width, minY = height, maxX = -1, maxY = -1;
    for (let y = 0; y < height; y++) {
      for (let px = 0; px < width; px++) {
        const i = (y * width + px) * 4;
        const isBlank = data[i + 3] < 20 || (data[i] > 238 && data[i + 1] > 238 && data[i + 2] > 238);
        if (!isBlank) {
          if (px < minX) minX = px;
          if (px > maxX) maxX = px;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }
    if (maxX < 0) return img;
    const pad = 4;
    minX = Math.max(0, minX - pad);
    minY = Math.max(0, minY - pad);
    maxX = Math.min(width - 1, maxX + pad);
    maxY = Math.min(height - 1, maxY + pad);
    const out = document.createElement('canvas');
    out.width = maxX - minX + 1;
    out.height = maxY - minY + 1;
    out.getContext('2d')!.drawImage(c, minX, minY, out.width, out.height, 0, 0, out.width, out.height);
    return out;
  } catch {
    return img; // cross-origin image — jaisa hai waisa
  }
};

async function ensureFonts() {
  if (typeof document === 'undefined' || !document.fonts) return;
  try {
    await Promise.all([
      document.fonts.load(`400 20px 'Noto Sans Devanagari'`, 'अ'),
      document.fonts.load(`600 20px 'Noto Sans Devanagari'`, 'अ'),
      document.fonts.load(`700 20px 'Noto Sans Devanagari'`, 'अ'),
      document.fonts.load(`800 20px 'Noto Sans Devanagari'`, 'अ')
    ]);
  } catch {
    /* system font se kaam chal jaayega */
  }
}

const setFont = (ctx: CanvasRenderingContext2D, weight: number, size: number) => {
  ctx.font = `${weight} ${size}px ${FONT}`;
};

/** Text ko maxW me fit karne tak font chhota karo */
const fitFont = (ctx: CanvasRenderingContext2D, text: string, maxW: number, weight: number, size: number, min = 10) => {
  let s = size;
  setFont(ctx, weight, s);
  while (s > min && ctx.measureText(text).width > maxW) {
    s -= 0.5;
    setFont(ctx, weight, s);
  }
  return s;
};

const drawImageFit = (ctx: CanvasRenderingContext2D, img: HTMLImageElement | HTMLCanvasElement, x: number, y: number, w: number, h: number, mode: 'contain' | 'cover') => {
  const r = mode === 'contain' ? Math.min(w / img.width, h / img.height) : Math.max(w / img.width, h / img.height);
  const dw = img.width * r;
  const dh = img.height * r;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
  ctx.restore();
};

const roundRect = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
};

const line = (ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, color: string, width: number) => {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
};

/** Brand rang ka halka shade (patra ka gulabi box) */
const tint = (hex: string, amount: number) => {
  const m = hex.replace('#', '').match(/^([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
  if (!m) return '#fbeeea';
  const [r, g, b] = m.slice(1).map((h) => parseInt(h, 16));
  const mix = (c: number) => Math.round(c + (255 - c) * (1 - amount));
  return `rgb(${mix(r)}, ${mix(g)}, ${mix(b)})`;
};

/** Shabdon par line todna; aakhri y lautata hai */
const wrapText = (ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxW: number, lineH: number) => {
  const words = text.split(' ');
  let lineText = '';
  for (const w of words) {
    const test = lineText ? `${lineText} ${w}` : w;
    if (ctx.measureText(test).width > maxW && lineText) {
      ctx.fillText(lineText, x, y);
      lineText = w;
      y += lineH;
    } else lineText = test;
  }
  if (lineText) ctx.fillText(lineText, x, y);
  return y + lineH;
};

const prepareCanvas = (canvas: HTMLCanvasElement, w: number, h: number, scale: number) => {
  canvas.width = Math.round(w * scale);
  canvas.height = Math.round(h * scale);
  const ctx = canvas.getContext('2d')!;
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, w, h);
  return ctx;
};

// ---------- MEDIA IDENTITY CARD (638 × 1016) ----------
export async function drawIdCard(canvas: HTMLCanvasElement, d: PressCardData, scale = 2) {
  await ensureFonts();
  const [logo, photo] = await Promise.all([loadImg(d.logoSrc), loadImg(d.photo)]);
  const qr = d.verifyUrl ? await loadImg(await QRCode.toDataURL(d.verifyUrl, { margin: 0, width: 300, color: { dark: '#111111', light: '#ffffff' } })) : null;
  const W = 638;
  const H = 1016;
  const ctx = prepareCanvas(canvas, W, H, scale);

  // Bahari border
  ctx.strokeStyle = '#111';
  ctx.lineWidth = 3;
  ctx.strokeRect(1.5, 1.5, W - 3, H - 3);

  // Logo
  if (logo) drawImageFit(ctx, trimWhitespace(logo), 60, 22, W - 120, 318, 'contain');
  else {
    ctx.fillStyle = d.brand;
    ctx.textAlign = 'center';
    fitFont(ctx, d.siteName, W - 80, 800, 56);
    ctx.fillText(d.siteName, W / 2, 200);
  }

  // Band: MEDIA IDENTITY CARD
  ctx.fillStyle = DARK;
  ctx.fillRect(0, 360, W, 70);
  for (const [y, w] of [
    [379, 2],
    [409, 2]
  ]) {
    line(ctx, 0, y, 140, y, d.brand, w);
    line(ctx, W - 140, y, W, y, d.brand, w);
  }
  ctx.fillStyle = DARK;
  ctx.fillRect(140, 362, W - 280, 66); // lines title ke peeche na jaayein
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  fitFont(ctx, 'MEDIA IDENTITY CARD', W - 300, 800, 34, 22);
  ctx.fillText('MEDIA IDENTITY CARD', W / 2, 407);

  // Photo
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(33, 481, 219, 283);
  if (photo) drawImageFit(ctx, photo, 33, 481, 219, 283, 'cover');
  else {
    ctx.fillStyle = '#9ca3af';
    setFont(ctx, 600, 14);
    ctx.fillText('PHOTO', 142, 627);
  }
  ctx.strokeStyle = '#555';
  ctx.lineWidth = 2.5;
  ctx.strokeRect(33, 481, 219, 283);

  // Details
  const rows: [string, string][] = [
    ['Name', d.name],
    ['Designation', d.designation],
    ['ID No.', d.pressId],
    ['Valid Till', fmtCardDate(d.validTill)],
    ['Mobile', d.mobile ? `+91 ${d.mobile}` : '—'],
    ['Blood Group', d.bloodGroup || '—']
  ];
  ctx.textAlign = 'left';
  rows.forEach(([label, value], i) => {
    const y = 518 + i * 46.5;
    ctx.fillStyle = '#444';
    setFont(ctx, 500, 19.5);
    ctx.fillText(label, 287, y);
    ctx.fillStyle = INK;
    fitFont(ctx, `: ${value}`, W - 440 - 12, 500, 19.5, 12);
    ctx.fillText(`: ${value}`, 440, y);
  });

  line(ctx, 0, 788, W, 788, d.brand, 2.5);

  // QR
  ctx.strokeStyle = d.brand;
  ctx.lineWidth = 3;
  roundRect(ctx, 31, 834, 112, 112, 12);
  ctx.stroke();
  if (qr) ctx.drawImage(qr, 44, 847, 86, 86);
  ctx.fillStyle = INK;
  setFont(ctx, 800, 15);
  ctx.fillText('SCAN TO', 158, 884);
  ctx.fillText('VERIFY', 158, 906);

  // Signature
  line(ctx, 375, 910, 587, 910, '#9ca3af', 1.5);
  ctx.textAlign = 'center';
  ctx.fillStyle = INK;
  setFont(ctx, 700, 16.5);
  ctx.fillText('Authorised Signature', 481, 939);

  // Neeche ki patti
  ctx.fillStyle = d.brand;
  ctx.fillRect(3, 972, W - 6, H - 975);
}

// ---------- PRADHIKARAN PATRA (1131 × 1600) ----------
export async function drawCertificate(canvas: HTMLCanvasElement, d: PressCardData, scale = 1.5) {
  await ensureFonts();
  const [logo, photo] = await Promise.all([loadImg(d.logoSrc), loadImg(d.photo)]);
  const W = 1131;
  const H = 1600;
  const ctx = prepareCanvas(canvas, W, H, scale);
  const L = 110; // left margin

  // Header: logo | divider | naam + tagline
  if (logo) drawImageFit(ctx, trimWhitespace(logo), 108, 52, 290, 212, 'contain');
  line(ctx, 432, 88, 432, 255, d.brand, 3);

  // Naam do rang me: aakhri shabd dark, baaki brand
  const name = d.siteName.trim();
  const cut = name.lastIndexOf(' ');
  const first = cut > 0 ? name.slice(0, cut + 1) : '';
  const last = cut > 0 ? name.slice(cut + 1) : name;
  const size = fitFont(ctx, name, 560, 800, 74, 30);
  const total = ctx.measureText(name).width;
  let x = 713 - total / 2;
  ctx.textAlign = 'left';
  ctx.fillStyle = d.brand;
  ctx.fillText(first, x, 168);
  x += ctx.measureText(first).width;
  ctx.fillStyle = INK;
  ctx.fillText(last, x, 168);
  ctx.textAlign = 'center';
  fitFont(ctx, d.tagline, 520, 700, Math.min(28, size * 0.42));
  ctx.fillText(d.tagline, 713, 215);

  // Header rule
  line(ctx, 115, 293, 357, 293, d.brand, 5);
  line(ctx, 357, 293, 777, 293, '#333', 2);
  line(ctx, 777, 293, 1017, 293, d.brand, 5);

  // Patra kramank + dinank
  ctx.textAlign = 'left';
  ctx.fillStyle = INK;
  setFont(ctx, 700, 20);
  ctx.fillText('पत्र क्रमांक:', L, 370);
  ctx.fillText('दिनांक:', 810, 370);
  setFont(ctx, 600, 18);
  ctx.fillText(letterNumberFor(d.pressId), 236, 366);
  ctx.fillText(fmtLetterDate(d.issuedOn), 896, 366);
  line(ctx, 233, 375, 380, 375, '#333', 1.2);
  line(ctx, 893, 375, 1020, 375, '#333', 1.2);

  // Title
  ctx.textAlign = 'center';
  setFont(ctx, 800, 44);
  ctx.fillText('प्राधिकरण पत्र', 566, 476);
  line(ctx, 293, 462, 400, 462, d.brand, 2.5);
  line(ctx, 735, 462, 842, 462, d.brand, 2.5);
  ctx.fillStyle = d.brand;
  ctx.beginPath();
  ctx.moveTo(566, 485);
  ctx.lineTo(576, 496);
  ctx.lineTo(566, 507);
  ctx.lineTo(556, 496);
  ctx.closePath();
  ctx.fill();

  // Details box
  ctx.fillStyle = tint(d.brand, 0.09);
  roundRect(ctx, 108, 525, 912, 310, 16);
  ctx.fill();
  const fields: [string, string, number][] = [
    ['नाम:', d.name, 222],
    ['रिपोर्टर आईडी:', d.pressId, 328],
    ['पदनाम:', d.designation, 254],
    ['कार्यक्षेत्र:', d.area || '—', 266]
  ];
  ctx.textAlign = 'left';
  fields.forEach(([label, value, lx], i) => {
    const y = 598 + i * 61;
    ctx.fillStyle = INK;
    setFont(ctx, 700, 20);
    ctx.fillText(label, 163, y);
    fitFont(ctx, value, 690 - lx - 6, 600, 20, 12);
    ctx.fillText(value, lx + 4, y - 6);
    line(ctx, lx, y + 6, 690, y + 6, '#333', 1.2);
  });
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(750, 550, 212, 260);
  if (photo) drawImageFit(ctx, photo, 750, 550, 212, 260, 'cover');
  ctx.strokeStyle = '#777';
  ctx.lineWidth = 2;
  ctx.strokeRect(750, 550, 212, 260);

  // Matter (y 1180 tak — neeche hastakshar/mohar). Lamba naam ho toh font chhota
  ctx.fillStyle = INK;
  const paras = [
    `यह प्रमाणित किया जाता है कि श्री/सुश्री ${d.name}, रिपोर्टर आईडी ${d.pressId}, ${d.siteName} के साथ ${d.designation} के रूप में कार्यरत हैं।`,
    `इन्हें ${d.area || 'निर्धारित क्षेत्र'} में संस्थान की ओर से समाचार संकलन, साक्षात्कार एवं रिपोर्टिंग करने हेतु अधिकृत किया जाता है।`,
    `यह प्राधिकरण ${fmtLetterDate(d.issuedOn)} से ${fmtLetterDate(d.validTill)} तक मान्य है, जब तक संस्थान द्वारा इसे पहले वापस न लिया जाए।`
  ];
  const countLines = (text: string) => {
    let n = 1;
    let cur = '';
    for (const w of text.split(' ')) {
      const t = cur ? `${cur} ${w}` : w;
      if (ctx.measureText(t).width > 915 && cur) {
        n++;
        cur = w;
      } else cur = t;
    }
    return n;
  };
  let fs = 31;
  let lh = 54;
  for (; fs > 22; fs -= 1) {
    setFont(ctx, 500, fs);
    lh = Math.round(fs * 1.72);
    const total = paras.reduce((sum, p) => sum + countLines(p) * lh, 0) + 2 * 14;
    if (900 + total - lh <= 1180) break;
  }
  setFont(ctx, 500, fs);
  let y = 905;
  for (const p of paras) y = wrapText(ctx, p, L, y, 915, lh) + 14;

  // Signature
  line(ctx, 108, 1297, 403, 1297, '#333', 1.5);
  ctx.textAlign = 'center';
  setFont(ctx, 500, 24);
  ctx.fillText('अधिकृत हस्ताक्षर', 255, 1342);
  setFont(ctx, 500, 21);
  ctx.fillText(`(मुख्य संपादक, ${d.siteName})`, 255, 1380);

  // Mohar
  ctx.strokeStyle = '#555';
  ctx.lineWidth = 2;
  ctx.setLineDash([8, 6]);
  ctx.beginPath();
  ctx.arc(868, 1295, 103, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = '#444';
  setFont(ctx, 500, 24);
  ctx.fillText('संस्थान की', 868, 1300);
  ctx.fillText('मुहर', 868, 1336);

  // Footer
  line(ctx, 8, 1423, W - 8, 1423, d.brand, 2);
  ctx.fillStyle = INK;
  fitFont(ctx, `कार्यालय का पता: ${PRESS_OFFICE.address}`, W - 120, 500, 22, 13);
  ctx.fillText(`कार्यालय का पता: ${PRESS_OFFICE.address}`, W / 2, 1462);
  setFont(ctx, 500, 22);
  ctx.fillText(`मोबाइल: ${PRESS_OFFICE.phone} | ईमेल: ${PRESS_OFFICE.email}`, W / 2, 1500);
  ctx.fillStyle = d.brand;
  ctx.fillRect(0, 1530, W, 28);
  ctx.fillStyle = '#333';
  ctx.fillRect(0, 1558, W, H - 1558);
}

// ---------- Photo: chhota JPEG (Firestore doc me data URL ke roop me) ----------
export async function resizePhoto(file: File, maxW = 360, maxH = 450): Promise<string> {
  if (!file.type.startsWith('image/')) throw new Error('not-image');
  const url = URL.createObjectURL(file);
  try {
    const img = await loadImg(url);
    if (!img) throw new Error('bad-image');
    // Card ke photo box (3:4) ke hisaab se beech se crop
    const target = maxW / maxH;
    let sw = img.width;
    let sh = img.height;
    if (sw / sh > target) sw = sh * target;
    else sh = sw / target;
    const canvas = document.createElement('canvas');
    canvas.width = maxW;
    canvas.height = maxH;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(img, (img.width - sw) / 2, (img.height - sh) / 2, sw, sh, 0, 0, maxW, maxH);
    return canvas.toDataURL('image/jpeg', 0.85);
  } finally {
    URL.revokeObjectURL(url);
  }
}

/**
 * Portal ke hisaab se Press ID: pehle se us portal ki ID ho toh wahi, warna naya kram (TLL-2026-001 …).
 * counters/press_ids_{PREFIX}_{YEAR} transaction se badhta hai — do patrakaron ko ek ID nahi milti.
 */
export async function issuePressId(reporterDocId: string, siteSlug: string): Promise<{ pressId: string; issuedOn: Date }> {
  const prefix = PRESS_ID_PREFIX[siteSlug] || 'GPN';
  const year = new Date().getFullYear();
  const reporterRef = doc(db, 'reporters', reporterDocId);
  const counterRef = doc(db, 'counters', `press_ids_${prefix}_${year}`);

  return runTransaction(db, async (tx) => {
    const repSnap = await tx.get(reporterRef);
    const rep = repSnap.data() || {};
    const existing = rep.pressIds?.[siteSlug];
    if (existing) {
      tx.update(reporterRef, { cardSiteId: siteSlug, pressId: existing, cardUpdatedAt: serverTimestamp() });
      return { pressId: existing as string, issuedOn: toDate(rep.pressIdIssuedOn?.[siteSlug]) || new Date() };
    }
    const counterSnap = await tx.get(counterRef);
    const next = Number(counterSnap.data()?.next || 1);
    const pressId = `${prefix}-${year}-${String(next).padStart(3, '0')}`;
    const issuedOn = new Date();
    tx.set(counterRef, { next: next + 1, prefix, year, updatedAt: serverTimestamp() }, { merge: true });
    tx.update(reporterRef, {
      [`pressIds.${siteSlug}`]: pressId,
      [`pressIdIssuedOn.${siteSlug}`]: issuedOn.toISOString(),
      pressIdList: arrayUnion(pressId),
      pressId,
      cardSiteId: siteSlug,
      cardUpdatedAt: serverTimestamp()
    });
    return { pressId, issuedOn };
  });
}

/** Reporter doc + site config se card ka data */
export function buildPressCardData(
  rep: any,
  site: { slug: string; name?: string; primaryColor?: string; logoUrl?: string; tagline?: string },
  origin: string
): PressCardData {
  const fb = fallbackFor(site.slug);
  const pressId = rep.pressIds?.[site.slug] || rep.pressId || '—';
  const issuedOn = toDate(rep.pressIdIssuedOn?.[site.slug]) || toDate(rep.approvedAt) || new Date();
  const validTill = toDate(rep.cardValidTill) || addYears(issuedOn, 1);
  return {
    siteSlug: site.slug,
    siteName: site.name || fb.name,
    tagline: site.tagline || fb.tagline,
    brand: site.primaryColor || fb.primaryColor,
    logoSrc: safeLogoSrc(site.slug, site.logoUrl),
    name: rep.name || 'संवाददाता',
    designation: rep.designation || DEFAULT_DESIGNATION,
    pressId,
    issuedOn,
    validTill,
    mobile: rep.phone || rep.mobile || '',
    bloodGroup: rep.bloodGroup || '',
    area: rep.workArea || rep.city || '',
    photo: rep.photoUrl || '',
    verifyUrl: pressId !== '—' && origin ? `${origin}/verify/press?id=${encodeURIComponent(pressId)}` : ''
  };
}
