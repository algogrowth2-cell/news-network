import { authFetch, SECURE_AUTH } from '@/lib/phoneAuth';
import type { PaymentKind } from '@/lib/plans';

/*
 * Razorpay "payment safal" ke baad server se activation (/api/payments/confirm).
 * fallback: true = server abhi tayyar nahi (Admin SDK env nahi) — caller purana browser-write tareeka chalaye.
 */
export async function confirmPayment(
  kind: PaymentKind,
  paymentId: string,
  extra: Record<string, any> = {}
): Promise<{ ok: true; fallback?: false; data: any } | { ok: false; fallback: true } | { ok: false; fallback?: false; message: string }> {
  try {
    const res = await authFetch('/api/payments/confirm', { method: 'POST', body: JSON.stringify({ kind, paymentId, ...extra }) });
    // Deploy se pehle ka login (naya token nahi) — SECURE_AUTH band hai toh purana tareeka, taaki paise kat kar bhi activation na ruke
    if (res.status === 401 && !SECURE_AUTH) return { ok: false, fallback: true };
    if (res.status === 503) {
      const d = await res.json().catch(() => ({}));
      // Server tayyar hai par payment-verify band (live key bina secret) — fallback NAHI
      if (d.error === 'verify-failed') return { ok: false, message: d.message || 'भुगतान सत्यापन अभी उपलब्ध नहीं है।' };
      return { ok: false, fallback: true };
    }
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, message: data.message || 'भुगतान दर्ज नहीं हो पाया।' };
    return { ok: true, data };
  } catch {
    return { ok: false, message: 'सर्वर से संपर्क नहीं हो पाया। यदि राशि कट गई है तो भुगतान ID के साथ सहायता से संपर्क करें।' };
  }
}
