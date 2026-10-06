import { NextResponse } from 'next/server';
import { adminAuthConfigured, credentialFingerprints } from '@/lib/adminAuth';

/*
 * Admin login setup ki jaanch: GET /api/admin/config-check
 * Sirf ye batata hai ki server ne kitne admin padhe, unka chhupaya email aur fingerprint — koi password/hash nahi.
 * Fingerprint ko `node scripts/check-admin-login.mjs` ke fingerprint se milayein.
 */
export async function GET() {
  const secretLen = String(process.env.ADMIN_SESSION_SECRET || '').trim().replace(/^['"]+|['"]+$/g, '').length;
  return NextResponse.json(
    {
      configured: adminAuthConfigured(),
      sessionSecretOk: secretLen >= 32,
      admins: credentialFingerprints()
    },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}
