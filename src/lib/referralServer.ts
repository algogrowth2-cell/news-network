// SIRF SERVER — referral ke niyam (lib/referralService) Admin SDK se, Firestore rules ke bahar.
import { FieldValue } from 'firebase-admin/firestore';
import { getAdmin } from '@/lib/firebaseAdmin';
import type { RefStore } from '@/lib/referralService';

export function adminStore(): RefStore | null {
  const admin = getAdmin();
  if (!admin) return null;
  const { db } = admin;
  return {
    ref: (col, id) => db.collection(col).doc(id),
    run: (fn) => db.runTransaction(fn as any) as any,
    now: () => FieldValue.serverTimestamp(),
    inc: (n) => FieldValue.increment(n)
  };
}
