import { collection, deleteDoc, doc, getDoc, getDocs, query, where, type DocumentReference } from 'firebase/firestore';
import { db } from '@/lib/firebase';

/*
 * Account & data deletion (Play Store "Data safety" + Privacy Policy ke anusaar).
 *   account_deletion_requests/{phone}: phone, name, email, accountTypes[], reason, verified, status, createdAt, completedAt
 * Hataya jaata hai: profile (reader / patrakar / advertiser), referral code + referrals/rewards, e-paper subscription, comments.
 * Rakha jaata hai (kanooni / tax): payment records — membership_transactions, delivery_requests.
 */

export type DeletionAccountType = 'reader' | 'patrakar' | 'advertiser';

export const ACCOUNT_TYPE_LABEL: Record<DeletionAccountType, string> = {
  reader: 'पाठक (Reader)',
  patrakar: 'पत्रकार (Reporter)',
  advertiser: 'विज्ञापनदाता (Advertiser)'
};

export const DELETION_EMAIL = 'goldenpearlnews@gmail.com';
export const DELETION_DAYS = 30;

/** Ek mobile number ka saara personal data hatao; kya-kya hata uski ginti lautao */
export async function deleteAccountData(phone: string): Promise<Record<string, number>> {
  const counts: Record<string, number> = {};
  const refs = new Map<string, DocumentReference>();
  const add = (label: string, ref: DocumentReference) => {
    if (refs.has(ref.path)) return;
    refs.set(ref.path, ref);
    counts[label] = (counts[label] || 0) + 1;
  };
  const byField = async (col: string, field: string, value: string, label: string) => {
    if (!value) return;
    const snap = await getDocs(query(collection(db, col), where(field, '==', value)));
    snap.docs.forEach((d) => add(label, d.ref));
  };
  const byId = async (col: string, id: string, label: string) => {
    if (!id) return null;
    const snap = await getDoc(doc(db, col, id));
    if (snap.exists()) add(label, snap.ref);
    return snap.exists() ? snap.data() : null;
  };

  // Reader
  const user = await byId('users', `u_${phone}`, 'पाठक प्रोफ़ाइल');
  const emails = new Set<string>();
  if (user?.email && !String(user.email).endsWith('@news.local')) emails.add(user.email);
  emails.add(user?.email || `${phone}@news.local`);
  if (user?.referralCode) await byId('referral_codes', user.referralCode, 'रेफरल कोड');
  await byField('readers', 'mobile', phone, 'पुराना पाठक रिकॉर्ड');

  // Patrakar / advertiser
  const rep = await byId('reporters', `rp_${phone}`, 'पत्रकार प्रोफ़ाइल');
  if (rep?.email) emails.add(rep.email);
  await byField('reporters', 'phone', phone, 'पत्रकार प्रोफ़ाइल');
  await byField('reporters', 'mobile', phone, 'पत्रकार प्रोफ़ाइल');
  const adv = await byId('advertisers', `adv_${phone}`, 'विज्ञापनदाता प्रोफ़ाइल');
  if (adv?.email) emails.add(adv.email);
  await byField('advertisers', 'phone', phone, 'विज्ञापनदाता प्रोफ़ाइल');
  await byField('advertisers', 'mobile', phone, 'विज्ञापनदाता प्रोफ़ाइल');

  // Referral history (dono taraf)
  await byField('referrals', 'referrerPhone', phone, 'रेफरल रिकॉर्ड');
  await byField('referrals', 'referredUserPhone', phone, 'रेफरल रिकॉर्ड');
  await byField('referral_rewards', 'referrerPhone', phone, 'रेफरल रिवॉर्ड');
  await byField('referral_rewards', 'referredUserPhone', phone, 'रेफरल रिवॉर्ड');

  // Email se jude: e-paper subscription, comments
  for (const email of emails) {
    await byId('epaper_subscriptions', email, 'ई-पेपर सब्सक्रिप्शन');
    await byField('comments', 'userEmail', email, 'टिप्पणियां');
  }

  for (const ref of refs.values()) await deleteDoc(ref);
  return counts;
}
