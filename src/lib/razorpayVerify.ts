// SIRF SERVER. Razorpay payment ko unke server se jaanchna — browser ka "payment safal" sandesh bharose layak nahi.

export type VerifyResult = { ok: true; testMode: boolean } | { ok: false; status: number; message: string };

/*
 * Env: RAZORPAY_KEY_SECRET (Razorpay dashboard → API Keys). NEXT_PUBLIC_RAZORPAY_KEY_ID pehle se hai.
 * Secret na ho:  test key (rzp_test_…) par bina jaanch ke chalta hai (testing ke liye); live key par payment rok diya jaata hai.
 */
export async function verifyRazorpayPayment(paymentId: string, expectedRupees: number): Promise<VerifyResult> {
  const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_TZSA6UoKATong0';
  const secret = process.env.RAZORPAY_KEY_SECRET || '';
  if (!/^pay_[A-Za-z0-9]{8,}$/.test(paymentId)) return { ok: false, status: 400, message: 'अमान्य भुगतान ID।' };

  if (!secret) {
    if (keyId.startsWith('rzp_test_')) return { ok: true, testMode: true };
    console.error('payments: RAZORPAY_KEY_SECRET set nahi — live payment jaancha nahi ja sakta');
    return { ok: false, status: 503, message: 'भुगतान सत्यापन अभी उपलब्ध नहीं है। कृपया सहायता से संपर्क करें।' };
  }

  const authHeader = 'Basic ' + Buffer.from(`${keyId}:${secret}`).toString('base64');
  const res = await fetch(`https://api.razorpay.com/v1/payments/${paymentId}`, { headers: { Authorization: authHeader }, cache: 'no-store' });
  if (!res.ok) return { ok: false, status: 400, message: 'भुगतान Razorpay पर नहीं मिला।' };
  const p = await res.json();
  const expectedPaise = Math.round(expectedRupees * 100);
  if (p.currency !== 'INR' || Number(p.amount) !== expectedPaise) return { ok: false, status: 400, message: 'भुगतान की राशि मेल नहीं खाती।' };

  if (p.status === 'authorized') {
    // Auto-capture band ho toh yahin capture
    const cap = await fetch(`https://api.razorpay.com/v1/payments/${paymentId}/capture`, {
      method: 'POST',
      headers: { Authorization: authHeader, 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: expectedPaise, currency: 'INR' })
    });
    if (!cap.ok) return { ok: false, status: 400, message: 'भुगतान पूरा (capture) नहीं हो पाया।' };
  } else if (p.status !== 'captured') {
    return { ok: false, status: 400, message: 'भुगतान सफल नहीं हुआ है।' };
  }
  return { ok: true, testMode: false };
}
