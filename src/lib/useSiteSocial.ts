'use client';
import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

/*
 * Har portal ke apne social/channel link — admin (Admin → सोशल लिंक) se (settings/social).
 * Doc structure: { "<portal-slug>": { facebook, instagram, twitter, youtube, whatsappChannel, telegram } }
 * Set na ho toh button dikhega par click par platform home (ya WhatsApp/Telegram empty) — niche normalize me tay.
 */
export interface SocialSet {
  facebook: string;
  instagram: string;
  twitter: string;
  youtube: string;
  whatsappChannel: string;
  telegram: string;
}

export const EMPTY_SOCIAL: SocialSet = {
  facebook: '', instagram: '', twitter: '', youtube: '', whatsappChannel: '', telegram: ''
};

// Har portal ke official link (default). Admin (settings/social) se override ho sakta hai.
export const PORTAL_SOCIAL_DEFAULTS: Record<string, Partial<SocialSet>> = {
  'the-local-leader': { instagram: 'https://www.instagram.com/_thelocalleader/' },
  'bazar-karobar': { instagram: 'https://www.instagram.com/_bazaarkarobar/' },
  'the-provue-times': { instagram: 'https://www.instagram.com/_theproviewtimes/' },
  'news-info-24': { instagram: 'https://www.instagram.com/_newsinfo24/' },
  'desh-ki-aawaz': { instagram: 'https://www.instagram.com/__deshkiawaaz/' },
  'ndn-defence': { instagram: 'https://www.instagram.com/_nationaldefencenetwork/' },
  'jan-bharat-news': { instagram: 'https://www.instagram.com/newsjanbharat/' }
};

const url = (v: any) => {
  const s = String(v ?? '').trim();
  return /^https?:\/\//i.test(s) ? s.slice(0, 400) : '';
};

export function normalizeSocial(raw: any): SocialSet {
  return {
    facebook: url(raw?.facebook),
    instagram: url(raw?.instagram),
    twitter: url(raw?.twitter),
    youtube: url(raw?.youtube),
    whatsappChannel: url(raw?.whatsappChannel),
    telegram: url(raw?.telegram)
  };
}

let cached: Promise<Record<string, any>> | null = null;
export function loadSocialAll(): Promise<Record<string, any>> {
  if (!cached) {
    cached = getDoc(doc(db, 'settings', 'social'))
      .then((snap) => (snap.exists() ? (snap.data() as Record<string, any>) : {}))
      .catch(() => { cached = null; return {}; });
  }
  return cached;
}

/** Portal ka effective social set: admin value ho to wahi, warna portal default. */
export function socialFor(slug: string, raw: any): SocialSet {
  const admin = normalizeSocial(raw || {});
  const def = normalizeSocial(PORTAL_SOCIAL_DEFAULTS[slug] || {});
  const pick = (k: keyof SocialSet) => admin[k] || def[k];
  return {
    facebook: pick('facebook'), instagram: pick('instagram'), twitter: pick('twitter'),
    youtube: pick('youtube'), whatsappChannel: pick('whatsappChannel'), telegram: pick('telegram')
  };
}

/** Ek portal ke social link (slug ke hisab se). */
export function useSiteSocial(slug: string): SocialSet {
  const [s, setS] = useState<SocialSet>(() => socialFor(slug, {}));
  useEffect(() => {
    let alive = true;
    loadSocialAll().then((all) => alive && setS(socialFor(slug, all?.[slug])));
    return () => { alive = false; };
  }, [slug]);
  return s;
}
