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

/** Ek portal ke social link (slug ke hisab se). */
export function useSiteSocial(slug: string): SocialSet {
  const [s, setS] = useState<SocialSet>(EMPTY_SOCIAL);
  useEffect(() => {
    let alive = true;
    loadSocialAll().then((all) => alive && setS(normalizeSocial(all?.[slug] || {})));
    return () => { alive = false; };
  }, [slug]);
  return s;
}
