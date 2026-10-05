import { db } from '@/lib/firebase';
import { doc, increment, runTransaction, serverTimestamp } from 'firebase/firestore';
import { authFetch, legacyFallback } from '@/lib/phoneAuth';

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

/*
 * Database adapter — wahi niyam browser (Firebase SDK) aur server (Admin SDK) dono par.
 * Firestore rules lagne ke baad ye kaam server (lib/referralServer.ts) karta hai; browser wala sirf tab jab server tayyar na ho.
 */
export interface RefStore {
  ref: (col: string, id: string) => any;
  run: <T>(fn: (tx: any) => Promise<T>) => Promise<T>;
  now: () => any;
  inc: (n: number) => any;
}
const exists = (snap: any) => (typeof snap.exists === 'function' ? snap.exists() : !!snap.exists);

export const clientStore: RefStore = {
  ref: (col, id) => doc(db, col, id),
  run: (fn) => runTransaction(db, fn),
  now: () => serverTimestamp(),
  inc: (n) => increment(n)
};

/** Referrer ka e-paper: abhi active ho toh uski expiry se aage 90 din, warna aaj se 90 din */
const extendedExpiry = (currentExpiry: Date | null) => {
  const now = Date.now();
  const base = currentExpiry && currentExpiry.getTime() > now ? currentExpiry.getTime() : now;
  return new Date(base + REFERRAL_REWARD_DAYS * DAY_MS);
};

/** Transaction ke andar e-paper reward likhta hai (reads caller pehle kar chuka hota hai) */
function writeEpaperReward(s: RefStore, tx: any, subRef: any, subData: any | undefined, referrer: { userId: string; phone: string; email: string; name: string }) {
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
      ...(alreadyActive ? {} : { planName: 'रेफरल रिवार्ड (3 माह फ्री ई-पेपर)', planId: 'referral_reward', startedAt: s.now() }),
      isReferralReward: true,
      referralMonthsEarned: s.inc(REFERRAL_REWARD_MONTHS),
      lastReferralRewardAt: s.now()
    },
    { merge: true }
  );
  return validTill;
}

/*
 * OTP verify ke baad naya user + referral AUTOMATIC verify + reward — ek hi transaction me:
 *  users/{newUserId}, referrals/{referrerPhone}_{newPhone}, referrer ke users counters,
 *  epaper_subscriptions/{referrerEmail} (3 mahine), referral_rewards (granted)
 */
export async function createReaderWithReferralCore(s: RefStore, user: NewReaderProfile, referralCode?: string | null): Promise<SignupResult> {
  const newUserRef = s.ref('users', user.userId);
  const code = referralCode ? normalizeReferralInput(referralCode) : '';
  const legacyPhone = code ? phoneFromLegacyCode(code) : null;
  const newOwnCode = generateCode();

  return s.run(async (tx) => {
    // ---- Saare reads pehle (Firestore transaction ka niyam)
    const newUserSnap = await tx.get(newUserRef);
    if (exists(newUserSnap)) return { created: false, referral: 'none' } as const;

    const ownCodeSnap = await tx.get(s.ref('referral_codes', newOwnCode));

    let referral: 'none' | 'recorded' | 'self' | 'invalid_referrer' | 'duplicate' = 'none';
    let referrerId = '';
    if (legacyPhone) referrerId = `u_${legacyPhone}`;
    else if (code) {
      const codeSnap = await tx.get(s.ref('referral_codes', code));
      if (exists(codeSnap)) referrerId = codeSnap.data().userId;
      else referral = 'invalid_referrer';
    }

    let recorded: { userId: string; phone: string; name: string; email: string } | null = null;
    let referralId = '';
    let subRef: any = null;
    let subData: any;

    if (referrerId) {
      if (referrerId === user.userId) referral = 'self';
      else {
        const referrerSnap = await tx.get(s.ref('users', referrerId));
        const referrerPhone = referrerId.replace(/^u_/, '');
        referralId = `${referrerPhone}_${user.phone}`;
        const existingReferral = await tx.get(s.ref('referrals', referralId));
        if (!exists(referrerSnap)) referral = 'invalid_referrer';
        else if (exists(existingReferral)) referral = 'duplicate';
        else {
          const r = referrerSnap.data();
          recorded = {
            userId: referrerId,
            phone: r.phone || referrerPhone,
            name: r.name || 'पाठक',
            email: r.email || `${referrerPhone}@news.local`
          };
          subRef = s.ref('epaper_subscriptions', recorded.email);
          const subSnap = await tx.get(subRef);
          subData = exists(subSnap) ? subSnap.data() : undefined;
        }
      }
    }

    // ---- Writes
    const ownCodeFree = !exists(ownCodeSnap);
    tx.set(newUserRef, {
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: 'reader',
      verified: true,
      referredBy: recorded ? recorded.userId : null,
      referredByCode: recorded ? code : null,
      ...(ownCodeFree ? { referralCode: newOwnCode } : {}),
      createdAt: s.now()
    });
    if (ownCodeFree) tx.set(s.ref('referral_codes', newOwnCode), { userId: user.userId, phone: user.phone, createdAt: s.now() });

    if (recorded && subRef) {
      const validTill = writeEpaperReward(s, tx, subRef, subData, recorded);
      tx.set(s.ref('referrals', referralId), {
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
        createdAt: s.now(),
        completedAt: s.now()
      });
      tx.update(s.ref('users', recorded.userId), { successfulReferralsCount: s.inc(1), referralRewardMonths: s.inc(REFERRAL_REWARD_MONTHS) });
      tx.set(s.ref('referral_rewards', referralId), {
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
        createdAt: s.now(),
        grantedAt: s.now()
      });
      referral = 'recorded';
    }

    return { created: true, referral };
  });
}

/** Purane users ke liye: code na ho toh banao (referral_codes me unique), warna wahi lautao */
export async function ensureReferralCodeCore(s: RefStore, userId: string, phone: string): Promise<string> {
  const userRef = s.ref('users', userId);
  for (let attempt = 0; attempt < 5; attempt++) {
    const candidate = generateCode();
    const result = await s.run(async (tx) => {
      const userSnap = await tx.get(userRef);
      const existing = exists(userSnap) ? userSnap.data()?.referralCode : '';
      if (existing) return existing as string;
      const codeSnap = await tx.get(s.ref('referral_codes', candidate));
      if (exists(codeSnap)) return null; // takkar — dusra code try karo
      tx.set(s.ref('referral_codes', candidate), { userId, phone, createdAt: s.now() });
      tx.set(userRef, { referralCode: candidate }, { merge: true });
      return candidate;
    });
    if (result) return result;
  }
  throw new Error('Referral code generate nahi ho paaya');
}

/** Purane 'pending_selection' rewards — ab seedha 3 maah e-paper. Reward usi referrer ka hona chahiye. */
export async function activatePendingRewardCore(s: RefStore, rewardId: string, referrer: { userId: string; phone: string; email: string; name: string }) {
  const rewardRef = s.ref('referral_rewards', rewardId);
  const subRef = s.ref('epaper_subscriptions', referrer.email);
  return s.run(async (tx) => {
    const rewardSnap = await tx.get(rewardRef);
    if (!exists(rewardSnap) || rewardSnap.data().status !== 'pending_selection' || rewardSnap.data().referrerPhone !== referrer.phone) return null;
    const subSnap = await tx.get(subRef);
    const validTill = writeEpaperReward(s, tx, subRef, exists(subSnap) ? subSnap.data() : undefined, referrer);
    tx.update(rewardRef, { status: 'granted', rewardType: 'epaper_3_months', chosenReward: 'epaper_3_months', days: REFERRAL_REWARD_DAYS, validTill, grantedAt: s.now() });
    tx.set(s.ref('users', referrer.userId), { referralRewardMonths: s.inc(REFERRAL_REWARD_MONTHS) }, { merge: true });
    return validTill;
  });
}

// ---------- Browser se: pehle server API, server tayyar na ho (503) toh browser transaction ----------
async function viaServer<T>(url: string, body: any): Promise<{ ok: true; data: T } | { ok: false }> {
  const res = await authFetch(url, { method: 'POST', body: JSON.stringify(body) });
  if (legacyFallback(res.status)) return { ok: false };
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `server ${res.status}`);
  return { ok: true, data };
}

export async function createReader(user: NewReaderProfile, referralCode?: string | null): Promise<SignupResult> {
  const r = await viaServer<SignupResult>('/api/reader/create', { name: user.name, email: user.email, referralCode: referralCode || '' });
  return r.ok ? r.data : createReaderWithReferralCore(clientStore, user, referralCode);
}

export async function ensureReferralCode(userId: string, phone: string): Promise<string> {
  const r = await viaServer<{ code: string }>('/api/reader/referral-code', {});
  return r.ok ? r.data.code : ensureReferralCodeCore(clientStore, userId, phone);
}

export async function activatePendingReward(rewardId: string, referrer: { userId: string; phone: string; email: string; name: string }) {
  const r = await viaServer<{ validTill: string | null }>('/api/reader/activate-reward', { rewardId });
  if (r.ok) return r.data.validTill ? new Date(r.data.validTill) : null;
  return activatePendingRewardCore(clientStore, rewardId, referrer);
}
