import { db } from '@/lib/firebase';
import { collection, doc, getDoc, getDocs, limit, query, where } from 'firebase/firestore';

/*
 * Kya ye mobile number reader ke roop me pehle se registered hai? + sahmati ka version.
 * Pehle server (/api/auth/lookup); server tayyar na ho (503) toh seedha Firestore:
 * users/u_{phone}, na mile toh purane /register ke 'readers' me limit(1).
 */
export async function lookupReader(phone: string): Promise<{ registered: boolean; consentVersion: string }> {
  try {
    const res = await fetch('/api/auth/lookup', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ kind: 'reader', phone }) });
    if (res.status !== 503) {
      if (!res.ok) throw new Error('lookup ' + res.status);
      const d = await res.json();
      return { registered: !!d.found, consentVersion: d.consentVersion || '' };
    }
  } catch (err) {
    if (!(err instanceof TypeError)) throw err;
  }
  const userSnap = await getDoc(doc(db, 'users', `u_${phone}`));
  if (userSnap.exists()) return { registered: true, consentVersion: userSnap.data().consent?.version || '' };
  const legacy = await getDocs(query(collection(db, 'readers'), where('mobile', '==', phone), limit(1)));
  return { registered: !legacy.empty, consentVersion: '' };
}

export async function isReaderRegistered(phone: string): Promise<boolean> {
  return (await lookupReader(phone)).registered;
}
