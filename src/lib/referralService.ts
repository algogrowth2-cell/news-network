import { db } from '@/lib/firebase';
import { collection, doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';

export async function processReferralOnSignup(newUserPhone: string, referralCode?: string | null) {
  if (!newUserPhone) return;

  // Agar user ke URL me ?ref= phone number ya code tha
  const cleanRef = (referralCode || '').trim();
  if (!cleanRef || cleanRef === newUserPhone) return;

  try {
    const refRecordId = `\({cleanRef}_\){newUserPhone}`;
    const refDoc = await getDoc(doc(db, 'referrals', refRecordId));

    // Duplicate tracking roko
    if (refDoc.exists()) return;

    // 1. Admin Analytics ke liye 'referrals' collection me save karein
    await setDoc(doc(db, 'referrals', refRecordId), {
      referrerPhone: cleanRef,
      referredUserPhone: newUserPhone,
      status: 'successful_signup',
      createdAt: serverTimestamp()
    });

    // 2. Referrer ke liye claimable reward create karein
    await setDoc(doc(db, 'referral_rewards', refRecordId), {
      referrerPhone: cleanRef,
      referredUserPhone: newUserPhone,
      status: 'pending_selection', // Referrer khud choose karega (3 Month E-Paper OR 3 Month All Portals)
      createdAt: serverTimestamp()
    });

    console.log(`Referral successfully registered from \({cleanRef} for\){newUserPhone}`);
  } catch (err) {
    console.error('Error saving referral data in Firebase:', err);
  }
}