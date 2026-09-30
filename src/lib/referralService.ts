import { db } from '@/lib/firebase';
import { doc, runTransaction, serverTimestamp, increment } from 'firebase/firestore';

export interface NewReaderProfile {
  userId: string; // 'u_' + phone
  name: string;
  email: string;
  phone: string;
}

export type SignupResult =
  | { created: false; referral: 'none' } // user pehle se tha — referral sirf naye signup par
  | { created: true; referral: 'none' | 'recorded' | 'self' | 'invalid_referrer' | 'duplicate' };

// Referral link ?ref= me referrer ka phone (ya 'u_<phone>') aata hai
const referrerIdFromCode = (code: string) => {
  const digits = code.trim().replace(/^u_/, '').replace(/[^0-9]/g, '').slice(-10);
  return digits.length === 10 ? { referrerId: `u_${digits}`, referrerPhone: digits } : null;
};

/*
 * OTP verify hone ke baad naya user banata hai aur referral ko AUTOMATIC verify karta hai — ek hi transaction me:
 *  - users/{newUserId} bana (referredBy ke saath, taaki dobara referral na gine)
 *  - referrals/{referrerPhone}_{newPhone} doc (status: completed, verifiedAutomatically: true)
 *  - users/{referrerId}.successfulReferralsCount +1 (atomic increment)
 *  - referral_rewards doc (referrer apna 3 mahine ka reward khud chunta hai)
 * Transaction fail ho toh signup nahi rukta: user bina referral ke ban jaata hai (caller fallback karta hai).
 */
export async function createReaderWithReferral(user: NewReaderProfile, referralCode?: string | null): Promise<SignupResult> {
  const newUserRef = doc(db, 'users', user.userId);
  const ref = referralCode ? referrerIdFromCode(referralCode) : null;

  return runTransaction(db, async (tx) => {
    // Saare reads pehle (Firestore transaction ka niyam)
    const newUserSnap = await tx.get(newUserRef);
    if (newUserSnap.exists()) return { created: false, referral: 'none' } as const;

    let referral: 'none' | 'recorded' | 'self' | 'invalid_referrer' | 'duplicate' = 'none';
    let recorded: { referrerId: string; referrerPhone: string; referrerName: string } | null = null;
    const referralId = ref ? `${ref.referrerPhone}_${user.phone}` : '';

    if (ref) {
      if (ref.referrerId === user.userId) {
        referral = 'self';
      } else {
        const referrerSnap = await tx.get(doc(db, 'users', ref.referrerId));
        const existingReferral = await tx.get(doc(db, 'referrals', referralId));
        if (!referrerSnap.exists()) referral = 'invalid_referrer';
        else if (existingReferral.exists()) referral = 'duplicate';
        else {
          referral = 'recorded';
          recorded = { ...ref, referrerName: referrerSnap.data().name || 'पाठक' };
        }
      }
    }

    tx.set(newUserRef, {
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: 'reader',
      verified: true,
      referredBy: recorded ? recorded.referrerId : null,
      createdAt: serverTimestamp()
    });

    if (recorded) {
      tx.set(doc(db, 'referrals', referralId), {
        referrerId: recorded.referrerId,
        referrerName: recorded.referrerName,
        referrerPhone: recorded.referrerPhone,
        referredUserId: user.userId,
        referredUserName: user.name,
        referredUserPhone: user.phone,
        status: 'completed',
        verifiedAutomatically: true,
        createdAt: serverTimestamp(),
        completedAt: serverTimestamp()
      });

      tx.update(doc(db, 'users', recorded.referrerId), { successfulReferralsCount: increment(1) });

      tx.set(doc(db, 'referral_rewards', referralId), {
        referrerPhone: recorded.referrerPhone,
        referredUserPhone: user.phone,
        status: 'pending_selection',
        optionsAvailable: ['epaper_3_months', 'all_portals_3_months'],
        createdAt: serverTimestamp()
      });
    }

    return { created: true, referral };
  });
}
