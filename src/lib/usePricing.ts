'use client';
import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { DEFAULT_PRICING, normalizePricing, type Pricing } from '@/lib/pricing';

// Ek page load par ek hi baar padho (sab components ek hi jawab use karein)
let cached: Promise<Pricing> | null = null;

export function loadPricing(): Promise<Pricing> {
  if (!cached) {
    cached = getDoc(doc(db, 'settings', 'pricing'))
      .then((snap) => normalizePricing(snap.exists() ? snap.data() : {}))
      .catch(() => {
        cached = null;
        return DEFAULT_PRICING;
      });
  }
  return cached;
}

/** Admin ki tay ki hui keematein (load hone tak default) */
export function usePricing(): Pricing {
  const [p, setP] = useState<Pricing>(DEFAULT_PRICING);
  useEffect(() => {
    let alive = true;
    loadPricing().then((x) => alive && setP(x));
    return () => {
      alive = false;
    };
  }, []);
  return p;
}
