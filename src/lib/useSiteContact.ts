'use client';
import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

/*
 * Footer ka sampark — admin (Admin → संपर्क व फुटर) se badalta hai (settings/contact).
 * Doc na ho / galat ho toh niche wale default chalte hain (kuch tute nahi).
 */
export interface SiteContact {
  email: string;
  whatsapp: string; // sirf ank, country code ke saath (jaise 918103333381)
  hoursHi: string;
  hoursEn: string;
}

export const DEFAULT_CONTACT: SiteContact = {
  email: 'goldenpearlnews@gmail.com',
  whatsapp: '918103333381',
  hoursHi: 'सोम–शनि · सुबह 10 से शाम 6',
  hoursEn: 'Mon–Sat · 10 AM to 6 PM'
};

const txt = (v: any, def: string, max = 140) => {
  const s = String(v ?? '').trim();
  return s ? s.slice(0, max) : def;
};

export function normalizeContact(raw: any): SiteContact {
  const d = DEFAULT_CONTACT;
  const wa = String(raw?.whatsapp ?? '').replace(/[^0-9]/g, '');
  return {
    email: txt(raw?.email, d.email, 120),
    whatsapp: wa.length >= 10 ? wa.slice(0, 15) : d.whatsapp,
    hoursHi: txt(raw?.hoursHi, d.hoursHi),
    hoursEn: txt(raw?.hoursEn, d.hoursEn)
  };
}

let cached: Promise<SiteContact> | null = null;
export function loadContact(): Promise<SiteContact> {
  if (!cached) {
    cached = getDoc(doc(db, 'settings', 'contact'))
      .then((snap) => normalizeContact(snap.exists() ? snap.data() : {}))
      .catch(() => { cached = null; return DEFAULT_CONTACT; });
  }
  return cached;
}

export function useSiteContact(): SiteContact {
  const [c, setC] = useState<SiteContact>(DEFAULT_CONTACT);
  useEffect(() => {
    let alive = true;
    loadContact().then((x) => alive && setC(x));
    return () => { alive = false; };
  }, []);
  return c;
}
