// SIRF SERVER (API routes). Firebase Admin SDK — Firestore rules ke bahar, bharose wale kaam yahin hote hain.
import { cert, getApps, initializeApp, type App } from 'firebase-admin/app';
import { getAuth, type Auth } from 'firebase-admin/auth';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';

/*
 * Env (Vercel → Settings → Environment Variables):
 *   FIREBASE_SERVICE_ACCOUNT = Firebase console → Project settings → Service accounts → "Generate new private key"
 *                              wali JSON file ka poora content (ya uska base64)
 * Local testing: FIRESTORE_EMULATOR_HOST + FIREBASE_AUTH_EMULATOR_HOST set hon toh bina key ke emulator se.
 */

let cached: { app: App; auth: Auth; db: Firestore } | null | undefined;

function readServiceAccount() {
  const raw = (process.env.FIREBASE_SERVICE_ACCOUNT || '').trim();
  if (!raw) return null;
  try {
    const json = raw.startsWith('{') ? raw : Buffer.from(raw, 'base64').toString('utf8');
    const sa = JSON.parse(json);
    if (sa.private_key) sa.private_key = String(sa.private_key).replace(/\\n/g, '\n');
    return sa;
  } catch (err) {
    console.error('FIREBASE_SERVICE_ACCOUNT padha nahi ja saka:', (err as Error).message);
    return null;
  }
}

/** Admin SDK (configure na ho toh null — tab purana tareeka chalta hai) */
export function getAdmin() {
  if (cached !== undefined) return cached;
  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const emulator = !!process.env.FIRESTORE_EMULATOR_HOST;
  const sa = readServiceAccount();
  if (!sa && !emulator) {
    cached = null;
    return cached;
  }
  const app =
    getApps().find((a) => a.name === 'gpn-admin') ||
    initializeApp(sa ? { credential: cert(sa), projectId: sa.project_id || projectId } : { projectId }, 'gpn-admin');
  cached = { app, auth: getAuth(app), db: getFirestore(app) };
  return cached;
}

export const adminConfigured = () => !!getAdmin();

/** Firebase Storage bucket (e-paper PDF ke signed links / download token hatana) */
export async function adminBucket() {
  const admin = getAdmin();
  if (!admin) return null;
  const { getStorage } = await import('firebase-admin/storage');
  const name = process.env.FIREBASE_STORAGE_BUCKET || process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
  return name ? getStorage(admin.app).bucket(name) : null;
}

/** Ek mobile number ki pehchaan — reader / patrakar / advertiser sab isi uid se (rules phone claim dekhte hain) */
export const phoneUid = (phone: string) => `ph_${phone}`;

/** Request ke "Authorization: Bearer <idToken>" se user ka phone (verify karke) */
export async function phoneFromRequest(req: Request): Promise<string | null> {
  const admin = getAdmin();
  if (!admin) return null;
  const token = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  if (!token) return null;
  try {
    const decoded = await admin.auth.verifyIdToken(token);
    const phone = String(decoded.phone || '');
    return /^[6-9]\d{9}$/.test(phone) ? phone : null;
  } catch {
    return null;
  }
}
