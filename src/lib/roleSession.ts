import { db } from '@/lib/firebase';
import { collection, doc, getDoc, getDocs, limit, query, where } from 'firebase/firestore';

/*
 * Patrakar aur Advertiser ke login sessions.
 * localStorage me sirf OTP-verified user ka {id, phone, verifiedAt} rehta hai — naam, status, membership
 * jaisi cheezein hamesha Firestore profile se aati hain, taaki localStorage badal kar access na badla ja sake.
 */
export type PortalRole = 'patrakar' | 'advertiser';

const ROLE_CONFIG = {
  patrakar: { key: 'patrakar_session', legacyKey: 'patrakar_user', login: '/patrakar/login', collection: 'reporters', idPrefix: 'rp_' },
  advertiser: { key: 'advertiser_session', legacyKey: 'advertiser_user', login: '/advertiser/login', collection: 'advertisers', idPrefix: 'adv_' }
} as const;

const SESSION_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 din baad dobara OTP

export interface RoleSession {
  id: string; // Firestore profile doc id
  phone: string;
  verifiedAt: number;
}

export const roleLoginPath = (role: PortalRole) => ROLE_CONFIG[role].login;

// Naye signup ka doc id phone se tay hota hai, taaki ek number ka ek hi account bane
export const profileDocId = (role: PortalRole, phone: string) => `${ROLE_CONFIG[role].idPrefix}${phone}`;

export const cleanPhone = (value: string) => value.replace(/[^0-9]/g, '').slice(-10);

export function clearRoleSession(role: PortalRole) {
  try {
    localStorage.removeItem(ROLE_CONFIG[role].key);
    localStorage.removeItem(ROLE_CONFIG[role].legacyKey); // purane hardcoded/auto sessions bhi hatao
  } catch {}
}

export function setRoleSession(role: PortalRole, id: string, phone: string) {
  const session: RoleSession = { id, phone, verifiedAt: Date.now() };
  localStorage.setItem(ROLE_CONFIG[role].key, JSON.stringify(session));
  localStorage.removeItem(ROLE_CONFIG[role].legacyKey);
}

// Valid session ya null (galat/expired session apne aap saaf)
export function getRoleSession(role: PortalRole): RoleSession | null {
  try {
    const raw = localStorage.getItem(ROLE_CONFIG[role].key);
    if (!raw) return null;
    const s = JSON.parse(raw);
    const valid =
      typeof s?.id === 'string' &&
      s.id.length > 0 &&
      /^[0-9]{10}$/.test(String(s.phone)) &&
      typeof s.verifiedAt === 'number' &&
      Date.now() - s.verifiedAt < SESSION_MAX_AGE_MS;
    if (valid) return s;
  } catch {}
  clearRoleSession(role);
  return null;
}

export interface RoleProfile {
  id: string;
  data: Record<string, any>;
}

export async function getProfileById(role: PortalRole, id: string): Promise<RoleProfile | null> {
  const snap = await getDoc(doc(db, ROLE_CONFIG[role].collection, id));
  return snap.exists() ? { id: snap.id, data: snap.data() } : null;
}

// Phone se registered profile (naye 'phone' field ke saath purane 'mobile' records bhi)
export async function findProfileByPhone(role: PortalRole, phone: string): Promise<RoleProfile | null> {
  const direct = await getProfileById(role, profileDocId(role, phone));
  if (direct) return direct;
  const col = collection(db, ROLE_CONFIG[role].collection);
  for (const field of ['phone', 'mobile']) {
    const snap = await getDocs(query(col, where(field, '==', phone), limit(1)));
    if (!snap.empty) return { id: snap.docs[0].id, data: snap.docs[0].data() };
  }
  return null;
}

// Purane records me admin 'active' set karta tha — dono ko approved maano
export const isReporterApproved = (data: Record<string, any>) => ['approved', 'active'].includes(String(data?.status || '').toLowerCase());
