import { NextResponse } from 'next/server';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { getAdmin, phoneFromRequest } from '@/lib/firebaseAdmin';
import { verifyRazorpayPayment } from '@/lib/razorpayVerify';
import { EPAPER_PLANS, PATRAKAR_MEMBERSHIP_PRICE, PRESS_KIT_DELIVERY_PRICE, SHOK_SANDESH_PRICE, type PaymentKind } from '@/lib/plans';

/*
 * Razorpay payment ke baad: server payment jaanchta hai, phir hi subscription / membership / delivery / shok-credit likhta hai.
 *   payments/{paymentId}  — ek payment ek hi baar (replay nahi). Shok sandesh isi id se banta hai (rules jaanchte hain).
 * Body: { kind, paymentId, planId?, siteId?, delivery? }    Auth: Bearer (shok ke alawa)
 */

const toDate = (v: any): Date | null => (v?.toDate ? v.toDate() : v ? new Date(v) : null);
const clean = (s: any, max: number) => String(s || '').replace(/[<>{}[\]`]/g, '').trim().slice(0, max);

export async function POST(req: Request) {
  const admin = getAdmin();
  if (!admin) return NextResponse.json({ error: 'not-configured' }, { status: 503 });
  const { db } = admin;

  const body = await req.json().catch(() => ({}));
  const kind = body.kind as PaymentKind;
  const paymentId = String(body.paymentId || '');
  if (!['epaper', 'membership', 'delivery', 'shok'].includes(kind)) return NextResponse.json({ error: 'bad-kind' }, { status: 400 });

  const phone = kind === 'shok' ? null : await phoneFromRequest(req);
  if (kind !== 'shok' && !phone) return NextResponse.json({ error: 'unauthenticated', message: 'कृपया दोबारा लॉगिन करें।' }, { status: 401 });

  const plan = kind === 'epaper' ? EPAPER_PLANS.find((p) => p.id === body.planId) : null;
  if (kind === 'epaper' && !plan) return NextResponse.json({ error: 'bad-plan' }, { status: 400 });
  const amount = kind === 'epaper' ? plan!.price : kind === 'membership' ? PATRAKAR_MEMBERSHIP_PRICE : kind === 'delivery' ? PRESS_KIT_DELIVERY_PRICE : SHOK_SANDESH_PRICE;

  // Pehle hi use ho chuka? (do baar activation nahi)
  const payRef = db.collection('payments').doc(paymentId || 'invalid');
  const used = await payRef.get();
  if (used.exists) {
    const u = used.data()!;
    if (u.kind === kind && (u.phone || null) === phone) return NextResponse.json({ ok: true, already: true });
    return NextResponse.json({ error: 'payment-used', message: 'यह भुगतान पहले ही उपयोग हो चुका है।' }, { status: 409 });
  }

  const v = await verifyRazorpayPayment(paymentId, amount);
  if (!v.ok) return NextResponse.json({ error: 'verify-failed', message: v.message }, { status: v.status });

  try {
    const result = await db.runTransaction(async (tx) => {
      if ((await tx.get(payRef)).exists) throw new Error('payment-used');
      const base = { kind, amount, phone, testMode: v.testMode, createdAt: FieldValue.serverTimestamp() };

      if (kind === 'epaper') {
        const user = (await tx.get(db.collection('users').doc(`u_${phone}`))).data() || {};
        const email = user.email || `${phone}@news.local`;
        const subRef = db.collection('epaper_subscriptions').doc(email);
        const cur = (await tx.get(subRef)).data();
        const curExp = cur?.status === 'active' ? toDate(cur.expiresAt) : null;
        const start = curExp && curExp.getTime() > Date.now() ? curExp.getTime() : Date.now();
        const expiresAt = new Date(start + plan!.durationDays * 864e5);
        tx.set(
          subRef,
          {
            userEmail: email,
            userPhone: phone,
            userName: user.name || 'Reader',
            planId: plan!.id,
            planName: plan!.name,
            amount,
            paymentId,
            status: 'active',
            startedAt: FieldValue.serverTimestamp(),
            expiresAt: Timestamp.fromDate(expiresAt),
            siteId: clean(body.siteId, 60)
          },
          { merge: true }
        );
        tx.set(payRef, { ...base, email, planId: plan!.id });
        return { expiresAt: expiresAt.toISOString() };
      }

      if (kind === 'membership' || kind === 'delivery') {
        let repRef = db.collection('reporters').doc(`rp_${phone}`);
        let rep = (await tx.get(repRef)).data();
        if (!rep) {
          const q = await tx.get(db.collection('reporters').where('phone', '==', phone).limit(1));
          if (q.empty) throw new Error('not-a-reporter');
          repRef = q.docs[0].ref;
          rep = q.docs[0].data();
        }
        if (kind === 'membership') {
          tx.update(repRef, { membershipActive: true, membershipUpdatedAt: FieldValue.serverTimestamp() });
          tx.set(db.collection('membership_transactions').doc(paymentId), {
            reporterId: repRef.id,
            reporterPhone: phone,
            reporterName: rep.name || '',
            paymentId,
            amount,
            status: 'success',
            testMode: v.testMode,
            createdAt: FieldValue.serverTimestamp()
          });
        } else {
          const d = body.delivery || {};
          tx.set(db.collection('delivery_requests').doc(paymentId), {
            reporterId: repRef.id,
            reporterName: clean(d.name, 80) || rep.name || '',
            reporterPhone: clean(d.phone, 15) || phone,
            address: clean(d.address, 400),
            pincode: clean(d.pincode, 6),
            idNumber: rep.pressId || '',
            amountPaid: amount,
            paymentId,
            status: 'pending_dispatch',
            testMode: v.testMode,
            createdAt: FieldValue.serverTimestamp()
          });
        }
        tx.set(payRef, { ...base, reporterId: repRef.id });
        return {};
      }

      // shok: sirf credit — shok_sandesh/{paymentId} browser banata hai (rules payments/{id} dekhte hain)
      tx.set(payRef, { ...base, kind: 'shok' });
      return { shokCredit: paymentId };
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (err: any) {
    if (err.message === 'payment-used') return NextResponse.json({ error: 'payment-used', message: 'यह भुगतान पहले ही उपयोग हो चुका है।' }, { status: 409 });
    if (err.message === 'not-a-reporter') return NextResponse.json({ error: 'not-a-reporter' }, { status: 403 });
    console.error('payments/confirm error:', err);
    return NextResponse.json({ error: 'failed', message: 'भुगतान दर्ज नहीं हो पाया, कृपया सहायता से संपर्क करें।' }, { status: 500 });
  }
}
