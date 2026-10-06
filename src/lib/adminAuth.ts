// Sirf server par import karein (API routes / proxy) — node:crypto browser me nahi chalta
import { createHmac, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

/*
 * Admin login — sirf SERVER par (browser bundle me koi password/hash nahi jaata).
 *
 * Env (Vercel → Settings → Environment Variables, aur local .env.local):
 *   ADMIN_CREDENTIALS     = "email1@x.com:scrypt$16384$<salt>$<hash>,email2@x.com:scrypt$..."
 *                           hash banane ke liye:  node scripts/hash-admin-password.mjs
 *   ADMIN_SESSION_SECRET  = kam se kam 32 akshar ki random string (session cookie sign karne ke liye)
 *
 * Session: HttpOnly + Secure + SameSite=Strict cookie, HMAC-SHA256 se signed, 8 ghante.
 */

export const ADMIN_COOKIE = 'gpn_admin_session';
export const SESSION_HOURS = 8;

const b64url = (buf: Buffer | string) => Buffer.from(buf).toString('base64url');

function sessionSecret() {
  const s = cleanEnv(process.env.ADMIN_SESSION_SECRET);
  if (s.length < 32) throw new Error('ADMIN_SESSION_SECRET set nahi hai (kam se kam 32 akshar)');
  return s;
}

/** "email:hash,email:hash" → Map */
// Copy-paste ki aam galtiyan khud saaf: aage-peeche quotes, space, beech me line-break / space (lambi line wrap hone par)
const cleanEnv = (v: string | undefined) => String(v || '').trim().replace(/^['"]+|['"]+$/g, '');

function credentials(): Map<string, string> {
  const map = new Map<string, string>();
  // Kai admin: comma ya semicolon se alag (line-break / space copy ki galti maan kar hata diye jaate hain)
  for (const raw of cleanEnv(process.env.ADMIN_CREDENTIALS).split(/[,;]+/)) {
    const part = raw.replace(/\s+/g, '').replace(/^['"]+|['"]+$/g, '');
    const i = part.indexOf(':');
    if (i <= 0) continue;
    map.set(part.slice(0, i).toLowerCase(), part.slice(i + 1));
  }
  return map;
}

export const adminAuthConfigured = () => credentials().size > 0 && cleanEnv(process.env.ADMIN_SESSION_SECRET).length >= 32;

export function hashPassword(password: string, N = 16384) {
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, 32, { N, r: 8, p: 1 });
  return `scrypt$${N}$${salt.toString('base64')}$${hash.toString('base64')}`;
}

function verifyHash(password: string, stored: string) {
  const [algo, nStr, saltB64, hashB64] = stored.split('$');
  if (algo !== 'scrypt' || !saltB64 || !hashB64) return false;
  const expected = Buffer.from(hashB64, 'base64');
  const actual = scryptSync(password, Buffer.from(saltB64, 'base64'), expected.length, { N: Number(nStr) || 16384, r: 8, p: 1 });
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

// Galat email par bhi utna hi samay lage (email andaaza na lag sake)
const DUMMY_HASH = hashPassword(randomBytes(12).toString('hex'));

export function verifyAdmin(email: string, password: string): boolean {
  const stored = credentials().get(email.trim().toLowerCase());
  const ok = verifyHash(password, stored || DUMMY_HASH);
  return !!stored && ok;
}

export function createSession(email: string) {
  const payload = b64url(JSON.stringify({ email: email.toLowerCase(), exp: Date.now() + SESSION_HOURS * 3600 * 1000 }));
  const sig = b64url(createHmac('sha256', sessionSecret()).update(payload).digest());
  return `${payload}.${sig}`;
}

export function readSession(token: string | undefined | null): { email: string } | null {
  if (!token || !token.includes('.')) return null;
  try {
    const [payload, sig] = token.split('.');
    const expected = createHmac('sha256', sessionSecret()).update(payload).digest();
    const got = Buffer.from(sig, 'base64url');
    if (got.length !== expected.length || !timingSafeEqual(got, expected)) return null;
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (!data?.email || typeof data.exp !== 'number' || data.exp < Date.now()) return null;
    // Admin hata diya gaya ho toh purana session bhi band
    if (!credentials().has(data.email)) return null;
    return { email: data.email };
  } catch {
    return null;
  }
}

export const sessionCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  path: '/',
  maxAge: SESSION_HOURS * 3600
});
