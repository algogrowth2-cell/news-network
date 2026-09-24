import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function clearDummy() {
  console.log('🧹 Dummy news delete ho rahi hain...');
  const snap = await getDocs(collection(db, 'articles'));
  let count = 0;

  for (const d of snap.docs) {
    const data = d.data();
    if (data.author === 'संपादकीय टीम') {
      await deleteDoc(doc(db, 'articles', d.id));
      count++;
    }
  }

  console.log(`✅ Saari ${count} dummy news delete ho gayi!`);
  process.exit(0);
}

clearDummy();