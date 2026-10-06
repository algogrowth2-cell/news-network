import { NextResponse } from 'next/server';
import { getAdmin, phoneFromRequest } from '@/lib/firebaseAdmin';
import { verifyRazorpayPayment } from '@/lib/razorpayVerify';
import { AD_PRICES, EPAPER_PLANS, PATRAKAR_MEMBERSHIP_PRICE, PRESS_KIT_DELIVERY_PRICE, SHOK_SANDESH_PRICE, type AdFormat, type PaymentKind } from '@/lib/plans';

/*
 * Razorpay payment ke baad: server payment jaanchta hai, phir hi subscription / membership / delivery / shok-credit likhta hai.
 *   payments/{paymentId}  — ek payment ek hi baar (replay nahi). Shok sandesh isi id se banta hai (rules jaanchte hain).
 *   ad: advertiser ka vigyapan server hi banata hai (classifieds/ads, status 'pending') — bina payment request admin tak nahi.
 * Body: { kind, paymentId, planId?, siteId?, delivery?, ad? }    Auth: Bearer (shok ke alawa)
 */

const toDate = (v: any): Date | null => (v?.toDate ? v.toDate() : v ? new Date(v) : null);
const clean = (s: any, max: number) => String(s || '').replace(/[<>{}[\]`]/g, '').trim().slice(0, max);

// Vigyapan ki photo: https link ya chhoti upload (data:image, Firestore 1MB seema ke andar)
const cleanImage = (v: any) => {
  const s = String(v || '').trim();
  if (/^https?:\/\/[^\s"'<>]{4,2000}$/i.test(s)) return s;
  if (/^data:image\/(png|jpe?g|webp|gif);base64,[A-Za-z0-9+/=]+$/.test(s) && s.length <= 700_000) return s;
  return '';
};
const cleanUrl = (v: any) => (/^https?:\/\/[^\s"'<>]{4,1000}$/i.test(String(v || '').trim()) ? String(v).trim() : '');

export async function POST(req: Request) {
  const admin = (await getAdmin());
  if (!admin) return NextResponse.json({ error: 'not-configured' }, { status: 503 });
  const { db } = admin;

  const body = await req.json().catch(() => ({}));
  const kind = body.kind as PaymentKind;
  const paymentId = String(body.paymentId || '');
  if (!['epaper', 'membership', 'delivery', 'shok', 'ad'].includes(kind)) return NextResponse.json({ error: 'bad-kind' }, { status: 400 });

  const phone = kind === 'shok' ? null : await phoneFromRequest(req);
  if (kind !== 'shok' && !phone) return NextResponse.json({ error: 'unauthenticated', message: 'कृपया दोबारा लॉगिन करें।' }, { status: 401 });

  const plan = kind === 'epaper' ? EPAPER_PLANS.find((p) => p.id === body.planId) : null;
  if (kind === 'epaper' && !plan) return NextResponse.json({ error: 'bad-plan' }, { status: 400 });
  const ad = body.ad || {};
  const adFormat = String(ad.format || '') as AdFormat;
  if (kind === 'ad') {
    if (!Object.prototype.hasOwnProperty.call(AD_PRICES, adFormat)) return NextResponse.json({ error: 'bad-format' }, { status: 400 });
    if (!clean(ad.title, 150)) return NextResponse.json({ error: 'bad-ad', message: 'विज्ञापन का शीर्षक आवश्यक है।' }, { status: 400 });
    if (adFormat !== 'classified' && !cleanImage(ad.imageUrl))
      return NextResponse.json({ error: 'bad-ad', message: 'बैनर के लिए सही इमेज (लिंक या 500KB तक की फोटो) आवश्यक है।' }, { status: 400 });
  }
  const amount =
    kind === 'epaper' ? plan!.price
    : kind === 'membership' ? PATRAKAR_MEMBERSHIP_PRICE
    : kind === 'delivery' ? PRESS_KIT_DELIVERY_PRICE
    : kind === 'ad' ? AD_PRICES[adFormat]
    : SHOK_SANDESH_PRICE;

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
      const base = { kind, amount, phone, testMode: v.testMode, createdAt: admin.FieldValue.serverTimestamp() };

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
            startedAt: admin.FieldValue.serverTimestamp(),
            expiresAt: admin.Timestamp.fromDate(expiresAt),
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
          tx.update(repRef, { membershipActive: true, membershipUpdatedAt: admin.FieldValue.serverTimestamp() });
          tx.set(db.collection('membership_transactions').doc(paymentId), {
            reporterId: repRef.id,
            reporterPhone: phone,
            reporterName: rep.name || '',
            paymentId,
            amount,
            status: 'success',
            testMode: v.testMode,
            createdAt: admin.FieldValue.serverTimestamp()
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
            createdAt: admin.FieldValue.serverTimestamp()
          });
        }
        tx.set(payRef, { ...base, reporterId: repRef.id });
        return {};
      }

      if (kind === 'ad') {
        // Sirf registered advertiser (OTP wala mobile) — request uske naam se
        let advRef = db.collection('advertisers').doc(`adv_${phone}`);
        let adv = (await tx.get(advRef)).data();
        if (!adv) {
          for (const field of ['phone', 'mobile']) {
            const q = await tx.get(db.collection('advertisers').where(field, '==', phone).limit(1));
            if (!q.empty) {
              advRef = q.docs[0].ref;
              adv = q.docs[0].data();
              break;
            }
          }
        }
        if (!adv) throw new Error('not-an-advertiser');
        if (['blocked', 'suspended'].includes(String(adv.status || '').toLowerCase())) throw new Error('advertiser-blocked');

        const who = {
          advertiserId: advRef.id,
          advertiserPhone: phone,
          advertiserEmail: String(adv.email || '').toLowerCase(),
          advertiserName: adv.businessName || adv.contactName || adv.contactPerson || 'विज्ञापनदाता'
        };
        const paid = { paymentId, amountPaid: amount, paymentStatus: 'paid', testMode: v.testMode, paidAt: admin.FieldValue.serverTimestamp() };
        const siteId = clean(ad.siteId, 60) || 'the-local-leader';
        const title = clean(ad.title, 150);
        // Payment ID hi document ID — ek payment se ek hi vigyapan
        if (adFormat === 'classified') {
          tx.set(db.collection('classifieds').doc(paymentId), {
            title,
            category: clean(ad.category, 60),
            city: clean(ad.city, 60) || 'इंदौर/महू',
            price: clean(ad.price, 30),
            contactNumber: clean(ad.contactNumber, 15) || phone,
            imageUrl: cleanImage(ad.imageUrl),
            siteId,
            status: 'pending', // Admin ki manzoori ke baad hi live
            format: 'classified',
            type: 'classified',
            ...who,
            ...paid,
            createdAt: new Date().toISOString(),
            timestamp: admin.FieldValue.serverTimestamp()
          });
        } else {
          tx.set(db.collection('ads').doc(paymentId), {
            name: title,
            title,
            format: adFormat,
            zone: clean(ad.zone, 60),
            siteId,
            type: 'image',
            device: 'all',
            imageUrl: cleanImage(ad.imageUrl),
            targetUrl: cleanUrl(ad.targetUrl) || '#',
            startDate: clean(ad.startDate, 20) || 'तत्काल',
            endDate: clean(ad.endDate, 20) || 'खुला',
            budget: amount,
            status: 'pending', // Admin ki manzoori ke baad hi live
            priority: 1,
            impressions: 0,
            clicks: 0,
            contactNumber: clean(ad.contactNumber, 15) || phone,
            ...who,
            ...paid,
            createdAt: admin.FieldValue.serverTimestamp()
          });
        }
        tx.set(payRef, { ...base, advertiserId: advRef.id, adFormat, adCollection: adFormat === 'classified' ? 'classifieds' : 'ads' });
        return { adId: paymentId };
      }

      // shok: sirf credit — shok_sandesh/{paymentId} browser banata hai (rules payments/{id} dekhte hain)
      tx.set(payRef, { ...base, kind: 'shok' });
      return { shokCredit: paymentId };
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (err: any) {
    if (err.message === 'payment-used') return NextResponse.json({ error: 'payment-used', message: 'यह भुगतान पहले ही उपयोग हो चुका है।' }, { status: 409 });
    if (err.message === 'not-a-reporter') return NextResponse.json({ error: 'not-a-reporter' }, { status: 403 });
    if (err.message === 'not-an-advertiser')
      return NextResponse.json({ error: 'not-an-advertiser', message: 'विज्ञापनदाता खाता नहीं मिला। भुगतान ID के साथ सहायता से संपर्क करें।' }, { status: 403 });
    if (err.message === 'advertiser-blocked')
      return NextResponse.json({ error: 'advertiser-blocked', message: 'आपका विज्ञापनदाता खाता प्रतिबंधित है। भुगतान ID के साथ सहायता से संपर्क करें।' }, { status: 403 });
    console.error('payments/confirm error:', err);
    return NextResponse.json({ error: 'failed', message: 'भुगतान दर्ज नहीं हो पाया, कृपया सहायता से संपर्क करें।' }, { status: 500 });
  }
}
