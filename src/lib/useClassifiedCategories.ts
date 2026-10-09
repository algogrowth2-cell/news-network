'use client';
import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

/* Classified ki श्रेणियाँ — admin (settings/classified_categories) se; na ho toh default. */
export const DEFAULT_CLASSIFIED_CATEGORIES = [
  'प्रॉपर्टी / ज़मीन',
  'वाहन (गाड़ियां)',
  'नौकरी / रोजगार',
  'इलेक्ट्रॉनिक्स',
  'सेवाएं / बिजनेस',
  'शिक्षा / कोचिंग',
  'अन्य'
];

export function normalizeCategories(raw: any): string[] {
  const arr = Array.isArray(raw?.list) ? raw.list : Array.isArray(raw) ? raw : null;
  if (!arr) return DEFAULT_CLASSIFIED_CATEGORIES;
  const mapped: string[] = (arr as any[]).map((x) => String(x ?? '').replace(/[<>]/g, '').trim()).filter(Boolean);
  const out = Array.from(new Set(mapped)).slice(0, 60);
  return out.length ? out : DEFAULT_CLASSIFIED_CATEGORIES;
}

let cached: Promise<string[]> | null = null;
export function loadClassifiedCategories(): Promise<string[]> {
  if (!cached) {
    cached = getDoc(doc(db, 'settings', 'classified_categories'))
      .then((s) => normalizeCategories(s.exists() ? s.data() : null))
      .catch(() => { cached = null; return DEFAULT_CLASSIFIED_CATEGORIES; });
  }
  return cached;
}
export function useClassifiedCategories(): string[] {
  const [c, setC] = useState<string[]>(DEFAULT_CLASSIFIED_CATEGORIES);
  useEffect(() => { let a = true; loadClassifiedCategories().then((x) => a && setC(x)); return () => { a = false; }; }, []);
  return c;
}
