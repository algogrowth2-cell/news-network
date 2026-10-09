'use client';
import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

/* Homepage ke "ट्रेंडिंग" tags — admin (settings/trending_tags) se; na ho toh default. */
export interface TrendingTags { hi: string[]; en: string[]; }
export const DEFAULT_TRENDING_TAGS: TrendingTags = {
  hi: ['बजट सत्र', 'पंचायत चुनाव', 'बारिश का मौसम', 'मंडी भाव', 'भर्ती परिणाम', 'बिजली दर', 'क्रिकेट लीग'],
  en: ['Defence Budget', 'Military Drills', 'Border Security', 'Airforce Tech', 'Naval Fleet', 'Strategic Ties', 'Armed Forces']
};
const clean = (v: any, def: string[]): string[] => {
  if (!Array.isArray(v)) return def;
  const out = Array.from(new Set(v.map((x: any) => String(x ?? '').replace(/[<>]/g, '').trim()).filter(Boolean))).slice(0, 20);
  return out.length ? out : def;
};
export function normalizeTrendingTags(raw: any): TrendingTags {
  return { hi: clean(raw?.hi, DEFAULT_TRENDING_TAGS.hi), en: clean(raw?.en, DEFAULT_TRENDING_TAGS.en) };
}
let cached: Promise<TrendingTags> | null = null;
export function loadTrendingTags(): Promise<TrendingTags> {
  if (!cached) {
    cached = getDoc(doc(db, 'settings', 'trending_tags'))
      .then((s) => normalizeTrendingTags(s.exists() ? s.data() : {}))
      .catch(() => { cached = null; return DEFAULT_TRENDING_TAGS; });
  }
  return cached;
}
export function useTrendingTags(): TrendingTags {
  const [t, setT] = useState<TrendingTags>(DEFAULT_TRENDING_TAGS);
  useEffect(() => { let a = true; loadTrendingTags().then((x) => a && setT(x)); return () => { a = false; }; }, []);
  return t;
}
