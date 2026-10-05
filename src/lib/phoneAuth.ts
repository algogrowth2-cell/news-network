import { onAuthStateChanged, signInWithCustomToken, signOut, type User } from 'firebase/auth';
import { auth } from '@/lib/firebase';

/*
 * Browser me Firebase pehchaan (server ke custom token se).
 * NEXT_PUBLIC_SECURE_AUTH=1 hone par app mana karta hai ki har likhne wale kaam ke liye Firebase user ho
 * (Firestore rules isi par chalte hain). Env set hone se pehle purana tareeka chalta rehta hai.
 */
export const SECURE_AUTH = process.env.NEXT_PUBLIC_SECURE_AUTH === '1';

/**
 * Server ka jawab aisa hai ki purana (browser) tareeka chalana chahiye?
 *  503 = server setting (service account) nahi; 401 = user ke paas naya Firebase token nahi
 *  (deploy se pehle ka login). SECURE_AUTH chalu hone ke baad 401 par fallback NAHI — dobara login.
 */
export const legacyFallback = (status: number) => status === 503 || (status === 401 && !SECURE_AUTH);

export async function signInWithServerToken(token: string | null | undefined) {
  if (!token) return null;
  const cred = await signInWithCustomToken(auth, token);
  return cred.user;
}

/** Firebase auth ki pehli sthiti (page load par IndexedDB se) */
export function currentFirebaseUser(): Promise<User | null> {
  return new Promise((resolve) => {
    const unsub = onAuthStateChanged(auth, (u) => {
      unsub();
      resolve(u);
    });
  });
}

/** Login user ka mobile (token claim se) */
export async function firebasePhone(): Promise<string | null> {
  const u = await currentFirebaseUser();
  if (!u) return null;
  const t = await u.getIdTokenResult();
  return (t.claims.phone as string) || null;
}

/** Server API call — Firebase ID token ke saath */
export async function authFetch(url: string, init: RequestInit = {}) {
  const u = auth.currentUser || (await currentFirebaseUser());
  const headers = new Headers(init.headers || {});
  if (u) headers.set('Authorization', `Bearer ${await u.getIdToken()}`);
  if (init.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  return fetch(url, { ...init, headers });
}

/**
 * Role session (localStorage) hai par Firebase pehchaan nahi / dusre number ki — SECURE_AUTH me dobara login zaroori.
 * true = sab theek.
 */
export async function sessionMatchesFirebase(phone: string) {
  if (!SECURE_AUTH) return true;
  return (await firebasePhone()) === phone;
}

export async function firebaseSignOut() {
  await signOut(auth).catch(() => {});
}
