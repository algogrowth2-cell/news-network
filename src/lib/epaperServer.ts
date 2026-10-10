// SIRF SERVER. E-paper PDF ki suraksha:
//  - public `epaper/{id}`: naam, tareekh, cover (PDF link NAHI)
//  - private `epaper_files/{id}`: pdfUrl, pdfStoragePath, pages — sirf admin / server
//  - subscriber ko 10 minute ka signed link; Storage ke public "download token" hata diye jaate hain
import { adminBucket, getAdmin } from '@/lib/firebaseAdmin';
import { epaperSite, epaperSubId, isActiveForSite } from '@/lib/epaperSub';
import { normalizeAppSettings } from '@/lib/appSettings';

const toDate = (v: any): Date | null => (v?.toDate ? v.toDate() : v ? new Date(v) : null);

/** Mobile app me admin ne jin portals par e-paper chalu kiya (settings/app) — fixed list ke alawa */
export async function appEpaperPortals(db: FirebaseFirestore.Firestore): Promise<string[]> {
  try {
    const snap = await db.collection('settings').doc('app').get();
    return normalizeAppSettings(snap.exists ? snap.data() : {}).epaperPortals;
  } catch {
    return [];
  }
}

/** Is mobile ka IS PORTAL ka e-paper subscription abhi chalu hai? (har portal ka alag) */
export async function hasActiveEpaper(phone: string, site: string, extra: string[] = []): Promise<boolean> {
  const admin = (await getAdmin());
  if (!admin) return false;
  const { db } = admin;
  const portal = epaperSite(site, extra);
  const user = (await db.collection('users').doc(`u_${phone}`).get()).data();
  const emails = [user?.email, `${phone}@news.local`].filter(Boolean) as string[];
  for (const e of emails) {
    // Naya record: {email}__{portal}; purana: {email} (sirf usi portal par jiska siteId hai)
    if (isActiveForSite((await db.collection('epaper_subscriptions').doc(epaperSubId(e, portal, extra)).get()).data(), portal, Date.now(), extra)) return true;
    if (isActiveForSite((await db.collection('epaper_subscriptions').doc(e).get()).data(), portal, Date.now(), extra)) return true;
  }
  const byPhone = await db.collection('epaper_subscriptions').where('userPhone', '==', phone).limit(20).get();
  return byPhone.docs.some((d) => isActiveForSite(d.data(), portal, Date.now(), extra));
}

/** Firebase Storage download URL se path (…/o/<encoded path>?alt=media&token=…) */
export function storagePathFromUrl(url: string): string {
  const m = String(url || '').match(/\/o\/([^?]+)/);
  return m ? decodeURIComponent(m[1]) : '';
}

/** Public download token hatao — purane leak links band (signed links chalte rahte hain) */
export async function revokeDownloadToken(path: string) {
  if (!path) return false;
  const bucket = await adminBucket();
  if (!bucket) return false;
  try {
    await bucket.file(path).setMetadata({ metadata: { firebaseStorageDownloadTokens: null } });
    return true;
  } catch (err) {
    console.warn('epaper: token revoke failed', path, (err as Error).message);
    return false;
  }
}

/** Edition ka PDF link (signed, 10 min) + purane pages */
export async function editionFile(id: string): Promise<{ url: string; pages: string[] } | null> {
  const admin = (await getAdmin());
  if (!admin) return null;
  const { db } = admin;
  const priv = (await db.collection('epaper_files').doc(id).get()).data();
  const pub = (await db.collection('epaper').doc(id).get()).data();
  if (!pub) return null;
  const pdfUrl = priv?.pdfUrl || pub.pdfUrl || '';
  const path = priv?.pdfStoragePath || pub.pdfStoragePath || storagePathFromUrl(pdfUrl);
  const pages: string[] = (priv?.pages || pub.pages || []).filter(Boolean);
  if (path) {
    const bucket = await adminBucket();
    if (bucket) {
      const [signed] = await bucket.file(path).getSignedUrl({ action: 'read', expires: Date.now() + 10 * 60 * 1000, version: 'v4' });
      return { url: signed, pages };
    }
  }
  return { url: pdfUrl, pages };
}

/**
 * Saare editions surakshit karo (idempotent): public doc se pdfUrl/pages/storage path hata kar epaper_files me,
 * aur Storage ka public download token band.
 */
export async function secureAllEditions() {
  const admin = (await getAdmin());
  if (!admin) return { moved: 0, revoked: 0 };
  const { db } = admin;
  let moved = 0;
  let revoked = 0;
  const snap = await db.collection('epaper').get();
  for (const d of snap.docs) {
    const x = d.data();
    const priv = (await db.collection('epaper_files').doc(d.id).get()).data() || {};
    const pdfUrl = x.pdfUrl || priv.pdfUrl || '';
    const path = x.pdfStoragePath || priv.pdfStoragePath || storagePathFromUrl(pdfUrl);
    const hasSecrets = 'pdfUrl' in x || 'pages' in x || 'pdfStoragePath' in x;
    if (hasSecrets) {
      await db.collection('epaper_files').doc(d.id).set(
        { pdfUrl, pdfStoragePath: path, pages: (x.pages || priv.pages || []).filter(Boolean), updatedAt: admin.FieldValue.serverTimestamp() },
        { merge: true }
      );
      await d.ref.update({
        pdfUrl: admin.FieldValue.delete(),
        pages: admin.FieldValue.delete(),
        pdfStoragePath: admin.FieldValue.delete(),
        hasPdf: !!pdfUrl,
        totalPages: Number(x.totalPages || (x.pages || []).length || 0)
      });
      moved++;
    }
    if (path && !priv.tokenRevoked) {
      if (await revokeDownloadToken(path)) {
        await db.collection('epaper_files').doc(d.id).set({ tokenRevoked: true }, { merge: true });
        revoked++;
      }
    }
  }
  return { moved, revoked };
}
