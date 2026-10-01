import { db } from '@/lib/firebase';
import { collection, doc, getDoc, getDocs, limit, query, where } from 'firebase/firestore';

/*
 * Kya ye mobile number reader ke roop me pehle se registered hai?
 * 1 read: users/u_{phone} (OTP signup yahi id banata hai). Na mile toh purane /register form ke
 * 'readers' records me limit(1) query — kul max 2 reads.
 */
export async function isReaderRegistered(phone: string): Promise<boolean> {
  const userSnap = await getDoc(doc(db, 'users', `u_${phone}`));
  if (userSnap.exists()) return true;
  const legacy = await getDocs(query(collection(db, 'readers'), where('mobile', '==', phone), limit(1)));
  return !legacy.empty;
}
