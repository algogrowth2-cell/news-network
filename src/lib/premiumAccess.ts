import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

export const getCachedReader = () => {
  try {
    const cached = localStorage.getItem('reader_user');
    return cached ? JSON.parse(cached) : null;
  } catch {
    return null;
  }
};

const isPlanActive = (data: any) => {
  if (!data || data.status !== 'active') return false;
  const expiry = data.expiresAt?.toDate ? data.expiresAt.toDate() : new Date(data.expiresAt);
  return new Date() < expiry;
};

// Premium portal ka access: paid plan (subscriptions/{email}) ya referral reward (vip_all_access/{phone})
export const hasPremiumAccess = async (user: any) => {
  const checks: Promise<boolean>[] = [];
  if (user?.email) {
    checks.push(getDoc(doc(db, 'subscriptions', user.email)).then((snap) => snap.exists() && isPlanActive(snap.data())));
  }
  if (user?.phone) {
    checks.push(getDoc(doc(db, 'vip_all_access', String(user.phone))).then((snap) => snap.exists() && isPlanActive(snap.data())));
  }
  const results = await Promise.allSettled(checks);
  return results.some((r) => r.status === 'fulfilled' && r.value);
};
