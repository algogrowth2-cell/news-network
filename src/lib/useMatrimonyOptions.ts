'use client';
import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { DEFAULT_MATRIMONY_OPTIONS, type MatrimonyOptions, normalizeMatrimonyOptions } from '@/lib/matrimony';

/* Matrimony ke dropdown options — admin (settings/matrimony_options) se; na ho toh default. */
let cached: Promise<MatrimonyOptions> | null = null;
export function loadMatrimonyOptions(): Promise<MatrimonyOptions> {
  if (!cached) {
    cached = getDoc(doc(db, 'settings', 'matrimony_options'))
      .then((s) => normalizeMatrimonyOptions(s.exists() ? s.data() : {}))
      .catch(() => { cached = null; return DEFAULT_MATRIMONY_OPTIONS; });
  }
  return cached;
}
export function useMatrimonyOptions(): MatrimonyOptions {
  const [o, setO] = useState<MatrimonyOptions>(DEFAULT_MATRIMONY_OPTIONS);
  useEffect(() => { let a = true; loadMatrimonyOptions().then((x) => a && setO(x)); return () => { a = false; }; }, []);
  return o;
}
