'use client';
import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { DEFAULT_FOR, PAGE_DOC, normalizeFor, type PageKey } from '@/lib/pageContent';

/** Client: in 3 pages ka admin-editable content (settings/page_*). Doc na ho toh default. */
export function usePageContent(key: PageKey): any {
  const [c, setC] = useState<any>(DEFAULT_FOR[key]);
  useEffect(() => {
    let alive = true;
    getDoc(doc(db, 'settings', PAGE_DOC[key]))
      .then((snap) => alive && setC(normalizeFor(key, snap.exists() ? snap.data() : {})))
      .catch(() => {});
    return () => { alive = false; };
  }, [key]);
  return c;
}
