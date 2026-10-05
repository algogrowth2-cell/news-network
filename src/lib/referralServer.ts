// SIRF SERVER — referral ke niyam (lib/referralService) Admin SDK se, Firestore rules ke bahar.
import { getAdmin } from '@/lib/firebaseAdmin';
import type { RefStore } from '@/lib/referralService';

export async function adminStore(): Promise<RefStore | null> {
  const admin = (await getAdmin());
  if (!admin) return null;
  const { db } = admin;
  return {
    ref: (col, id) => db.collection(col).doc(id),
    run: (fn) => db.runTransaction(fn as any) as any,
    now: () => admin.FieldValue.serverTimestamp(),
    inc: (n) => admin.FieldValue.increment(n)
  };
}
