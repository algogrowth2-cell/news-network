import { db } from '@/lib/firebase';
import { doc, runTransaction, serverTimestamp, increment, type DocumentReference, type Transaction } from 'firebase/firestore';

export interface NewReaderProfile {
  userId: string; // 'u_' + phone
  name: string;
  email: string;
  phone: string;
}

export type SignupResult =
  | { created: false; referral: 'none' } // user pehle se tha — referral sirf naye signup par
  | { created: true; referral: 'none' | 'recorded' | 'self' | 'invalid_referrer' | 'duplicate' };

// Har safal referral par referrer ko itne din ka free e-paper (3 mahine)
export const REFERRAL_REWARD_DAYS = 90;
export const REFERRAL_REWARD_MONTHS = 3;
const DAY_MS = 24 * 60 * 60 * 1000;

// Referral code: 'GP' + 6 akshar (0/O, 1/I/L jaise milte-julte akshar nahi) — phone number share nahi hota
const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const generateCode = () => {
  let out = 'GP';
  const bytes = new Uint32Array(6);
  crypto.getRandomValues(bytes);
  for (const b of bytes) out += CODE_ALPHABET[b % CODE_ALPHABET.length];
  return out;
};

export const normalizeReferralInput = (raw: string) => raw.trim().toUpperCase().replace(/[^A-Z0-9_]/g, '').slice(0, 16);

// Purane links me phone ('9876543210' ya 'u_9876543210') aata tha — wo bhi chalte rahenge
const phoneFromLegacyCode = (code: string) => {
  const digits = code.replace(/^U_/, '');
  return /^[6-9][0-9]{9}$/.test(digits) ? digits : null;
};

const toDate = (v: any): Date | null => (v?.toDate ? v.toDate() : v ? new Date(v) : null);

/** Referrer ka e-paper: abhi active ho toh uski expiry se aage 90 din, warna aaj se 90 din */
const extendedExpiry = (currentExpiry: Date | null) => {
  const now = Date.now();
  const base = currentExpiry && currentExpiry.getTime() > now ? currentExpiry.getTime() : now;
  return new Date(base + REFERRAL_REWARD_DAYS * DAY_MS);
};

/** Transaction ke andar e-paper reward likhta hai (reads caller pehle kar chuka hota hai) */
function writeEpaperReward(
  tx: Transaction,
  subRef: DocumentReference,
  subData: any | undefined,
  referrer: { userId: string; phone: string; email: string; name: string }
) {
  const currentExpiry = subData?.status === 'active' ? toDate(subData.expiresAt) : null;
  const validTill = extendedExpiry(currentExpiry);
  const alreadyActive = !!currentExpiry && currentExpiry.getTime() > Date.now();
  tx.set(
    subRef,
    {
      userEmail: referrer.email,
      userPhone: referrer.phone,
      userName: referrer.name,
      status: 'active',
      expiresAt: validTill,
      // Paid plan chal raha ho toh uska naam rehne do, bas din badhao
      ...(alreadyActive ? {} : { planName: 'रेफरल रिवार्ड (3 माह फ्री ई-पेपर)', planId: 'referral_reward', startedAt: serverTimestamp() }),
      isReferralReward: true,
      referralMonthsEarned: increment(REFERRAL_REWARD_MONTHS),
      lastReferralRewardAt: serverTimestamp()
    },
    { merge: true }
  );
  return validTill;
}

/*
 * OTP verify hone ke baad naya user banata hai aur referral ko AUTOMATIC verify + reward karta hai — ek hi transaction me:
 *  - users/{newUserId} (apne referral code ke saath; referredBy se dobara gina nahi jaata)
 *  - referrals/{referrerPhone}_{newPhone} (status: completed)
 *  - users/{referrerId}: successfulReferralsCount +1, referralRewardMonths +3
 *  - epaper_subscriptions/{referrerEmail}: 3 mahine free e-paper (pehle se active ho toh aage badhta hai)
 *  - referral_rewards doc (status: granted) — admin aur referrer dono ko dikhta hai
 * Code: naya 'GP…' code ya purana phone-number wala link, dono chalte hain.
 */
export async function createReaderWithReferral(user: NewReaderProfile, referralCode?: string | null): Promise<SignupResult> {
  const newUserRef = doc(db, 'users', user.userId);
  const code = referralCode ? normalizeReferralInput(referralCode) : '';
  const legacyPhone = code ? phoneFromLegacyCode(code) : null;
  const newOwnCode = generateCode();

  return runTransaction(db, async (tx) => {
    // ---- Saare reads pehle (Firestore transaction ka niyam)
    const newUserSnap = await tx.get(newUserRef);
    if (newUserSnap.exists()) return { created: false, referral: 'none' } as const;

    const ownCodeSnap = await tx.get(doc(db, 'referral_codes', newOwnCode));

    let referral: 'none' | 'recorded' | 'self' | 'invalid_referrer' | 'duplicate' = 'none';
    let referrerId = '';
    if (legacyPhone) referrerId = `u_${legacyPhone}`;
    else if (code) {
      const codeSnap = await tx.get(doc(db, 'referral_codes', code));
      if (codeSnap.exists()) referrerId = codeSnap.data().userId;
      else referral = 'invalid_referrer';
    }

    let recorded: { userId: string; phone: string; name: string; email: string } | null = null;
    let referralId = '';
    let subRef: DocumentReference | null = null;
    let subData: any;

    if (referrerId) {
      if (referrerId === user.userId) referral = 'self';
      else {
        const referrerSnap = await tx.get(doc(db, 'users', referrerId));
        const referrerPhone = referrerId.replace(/^u_/, '');
        referralId = `${referrerPhone}_${user.phone}`;
        const existingReferral = await tx.get(doc(db, 'referrals', referralId));
        if (!referrerSnap.exists()) referral = 'invalid_referrer';
        else if (existingReferral.exists()) referral = 'duplicate';
        else {
          const r = referrerSnap.data();
          recorded = {
            userId: referrerId,
            phone: r.phone || referrerPhone,
            name: r.name || 'पाठक',
            email: r.email || `${referrerPhone}@news.local`
          };
          subRef = doc(db, 'epaper_subscriptions', recorded.email);
          const subSnap = await tx.get(subRef);
          subData = subSnap.exists() ? subSnap.data() : undefined;
        }
      }
    }

    // ---- Writes
    const ownCodeFree = !ownCodeSnap.exists();
    tx.set(newUserRef, {
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: 'reader',
      verified: true,
      referredBy: recorded ? recorded.userId : null,
      referredByCode: recorded ? code : null,
      ...(ownCodeFree ? { referralCode: newOwnCode } : {}),
      createdAt: serverTimestamp()
    });
    if (ownCodeFree) {
      tx.set(doc(db, 'referral_codes', newOwnCode), { userId: user.userId, phone: user.phone, createdAt: serverTimestamp() });
    }

    if (recorded && subRef) {
      const validTill = writeEpaperReward(tx, subRef, subData, recorded);

      tx.set(doc(db, 'referrals', referralId), {
        referrerId: recorded.userId,
        referrerName: recorded.name,
        referrerPhone: recorded.phone,
        referralCodeUsed: code,
        referredUserId: user.userId,
        referredUserName: user.name,
        referredUserPhone: user.phone,
        status: 'completed',
        verifiedAutomatically: true,
        rewardType: 'epaper_3_months',
        rewardStatus: 'granted',
        rewardValidTill: validTill,
        createdAt: serverTimestamp(),
        completedAt: serverTimestamp()
      });

      tx.update(doc(db, 'users', recorded.userId), {
        successfulReferralsCount: increment(1),
        referralRewardMonths: increment(REFERRAL_REWARD_MONTHS)
      });

      tx.set(doc(db, 'referral_rewards', referralId), {
        referrerId: recorded.userId,
        referrerPhone: recorded.phone,
        referrerName: recorded.name,
        referredUserPhone: user.phone,
        referredUserName: user.name,
        rewardType: 'epaper_3_months',
        chosenReward: 'epaper_3_months',
        status: 'granted',
        days: REFERRAL_REWARD_DAYS,
        validTill,
        grantedAutomatically: true,
        createdAt: serverTimestamp(),
        grantedAt: serverTimestamp()
      });
      referral = 'recorded';
    }

    return { created: true, referral };
  });
}

/** Purane users ke liye: code na ho toh banao (referral_codes me unique), warna wahi lautao */
export async function ensureReferralCode(userId: string, phone: string): Promise<string> {
  const userRef = doc(db, 'users', userId);
  for (let attempt = 0; attempt < 5; attempt++) {
    const candidate = generateCode();
    const result = await runTransaction(db, async (tx) => {
      const userSnap = await tx.get(userRef);
      const existing = userSnap.data()?.referralCode;
      if (existing) return existing as string;
      const codeSnap = await tx.get(doc(db, 'referral_codes', candidate));
      if (codeSnap.exists()) return null; // takkar — dusra code try karo
      tx.set(doc(db, 'referral_codes', candidate), { userId, phone, createdAt: serverTimestamp() });
      tx.set(userRef, { referralCode: candidate }, { merge: true });
      return candidate;
    });
    if (result) return result;
  }
  throw new Error('Referral code generate nahi ho paaya');
}

/** Purane 'pending_selection' rewards (jab user ko chunna padta tha) — ab seedha 3 maah e-paper activate */
export async function activatePendingReward(rewardId: string, referrer: { userId: string; phone: string; email: string; name: string }) {
  const rewardRef = doc(db, 'referral_rewards', rewardId);
  const subRef = doc(db, 'epaper_subscriptions', referrer.email);
  return runTransaction(db, async (tx) => {
    const rewardSnap = await tx.get(rewardRef);
    if (!rewardSnap.exists() || rewardSnap.data().status !== 'pending_selection') return null;
    const subSnap = await tx.get(subRef);
    const validTill = writeEpaperReward(tx, subRef, subSnap.exists() ? subSnap.data() : undefined, referrer);
    tx.update(rewardRef, {
      status: 'granted',
      rewardType: 'epaper_3_months',
      chosenReward: 'epaper_3_months',
      days: REFERRAL_REWARD_DAYS,
      validTill,
      grantedAt: serverTimestamp()
    });
    tx.set(doc(db, 'users', referrer.userId), { referralRewardMonths: increment(REFERRAL_REWARD_MONTHS) }, { merge: true });
    return validTill;
  });
}
