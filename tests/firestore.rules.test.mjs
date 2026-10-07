// Firestore rules ke test — emulator par:
//   npx firebase emulators:exec --only firestore --project demo-gpn "node --test tests/firestore.rules.test.mjs"
import { readFileSync } from 'node:fs';
import { after, before, beforeEach, describe, test } from 'node:test';
import { assertFails, assertSucceeds, initializeTestEnvironment } from '@firebase/rules-unit-testing';
import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, increment, query, setDoc, updateDoc, where } from 'firebase/firestore';

const READER = '9876543210';
const OTHER = '9123456780';
const REPORTER = '9000000001';
const PENDING_REP = '9000000002';
const ADVERTISER = '9000000003';

let env;
const anon = () => env.unauthenticatedContext().firestore();
const asPhone = (p, extra = {}) => env.authenticatedContext(`ph_${p}`, { phone: p, ...extra }).firestore();
const asAdmin = () => env.authenticatedContext('admin_x', { admin: true }).firestore();

before(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-gpn',
    firestore: { rules: readFileSync('firestore.rules', 'utf8'), host: '127.0.0.1', port: 8085 }
  });
});
after(async () => env?.cleanup());

beforeEach(async () => {
  await env.clearFirestore();
  // Seed (rules ke bahar)
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await setDoc(doc(db, 'users', `u_${READER}`), { name: 'Ram', email: 'ram@x.com', phone: READER, successfulReferralsCount: 0 });
    await setDoc(doc(db, 'users', `u_${OTHER}`), { name: 'Shyam', email: 's@x.com', phone: OTHER });
    await setDoc(doc(db, 'reporters', `rp_${REPORTER}`), { name: 'Rep', phone: REPORTER, status: 'approved', designation: 'Reporter', memberships: { 'the-local-leader': { expiresAt: new Date(Date.now() + 30 * 864e5) } } });
    await setDoc(doc(db, 'reporters', `rp_${PENDING_REP}`), { name: 'Pend', phone: PENDING_REP, status: 'pending' });
    await setDoc(doc(db, 'advertisers', `adv_${ADVERTISER}`), { businessName: 'Biz', phone: ADVERTISER });
    await setDoc(doc(db, 'articles', 'a1'), { title: 'T', status: 'published', views: 5 });
    await setDoc(doc(db, 'ads', 'ad1'), { name: 'Ad', status: 'active', impressions: 10, clicks: 2 });
    await setDoc(doc(db, 'comments', 'c1'), { articleId: 'a1', status: 'approved', comment: 'ok' });
    await setDoc(doc(db, 'comments', 'c2'), { articleId: 'a1', status: 'pending', comment: 'hidden' });
    await setDoc(doc(db, 'epaper_subscriptions', 'ram@x.com'), { userEmail: 'ram@x.com', status: 'active' });
    await setDoc(doc(db, 'epaper_subscriptions', 's@x.com'), { userEmail: 's@x.com', userPhone: OTHER, status: 'active' });
    await setDoc(doc(db, 'referrals', `${READER}_${OTHER}`), { referrerPhone: READER, referredUserPhone: OTHER });
    await setDoc(doc(db, 'payments', 'pay_SHOK123456'), { kind: 'shok', amount: 11, days: 7, phone: READER });
    await setDoc(doc(db, 'shok_sandesh', 'pay_SHOKOTHER01'), { name: 'y', status: 'pending', ownerPhone: OTHER });
    await setDoc(doc(db, 'payments', 'pay_EPAP123456'), { kind: 'epaper', amount: 21 });
    await setDoc(doc(db, 'readers', 'legacy1'), { mobile: READER, name: 'Old' });
    await setDoc(doc(db, 'referral_codes', 'GPABCDEF'), { userId: `u_${READER}`, phone: READER });
  });
});

describe('Public content', () => {
  test('koi bhi khabrein / sites / notifications padh sake', async () => {
    await assertSucceeds(getDoc(doc(anon(), 'articles', 'a1')));
    await assertSucceeds(getDocs(collection(anon(), 'sites')));
    await assertSucceeds(getDocs(collection(anon(), 'notifications')));
  });
  test('bina login khabar / notification / category nahi likh sakta', async () => {
    await assertFails(setDoc(doc(anon(), 'articles', 'x'), { title: 'hack', status: 'published' }));
    await assertFails(addDoc(collection(anon(), 'notifications'), { title: 'spam' }));
    await assertFails(setDoc(doc(anon(), 'categories', 'x'), { name: 'x' }));
    await assertFails(updateDoc(doc(anon(), 'articles', 'a1'), { title: 'badla' }));
    await assertFails(deleteDoc(doc(anon(), 'articles', 'a1')));
  });
  test('views / impressions sirf +1', async () => {
    await assertSucceeds(updateDoc(doc(anon(), 'articles', 'a1'), { views: increment(1) }));
    await assertFails(updateDoc(doc(anon(), 'articles', 'a1'), { views: 9999 }));
    await assertSucceeds(updateDoc(doc(anon(), 'ads', 'ad1'), { impressions: increment(1) }));
    await assertFails(updateDoc(doc(anon(), 'ads', 'ad1'), { status: 'paused' }));
  });
});

describe('Private data', () => {
  test('bina login users / reporters / payments / readers nahi padh sakta', async () => {
    await assertFails(getDoc(doc(anon(), 'users', `u_${READER}`)));
    await assertFails(getDocs(collection(anon(), 'users')));
    await assertFails(getDoc(doc(anon(), 'reporters', `rp_${REPORTER}`)));
    await assertFails(getDocs(collection(anon(), 'epaper_subscriptions')));
    await assertFails(getDoc(doc(anon(), 'payments', 'pay_SHOK123456')));
    await assertFails(getDocs(collection(anon(), 'readers')));
    await assertFails(getDoc(doc(anon(), 'referral_codes', 'GPABCDEF')));
  });
  test('pathak apna profile padhe, doosre ka nahi', async () => {
    await assertSucceeds(getDoc(doc(asPhone(READER), 'users', `u_${READER}`)));
    await assertFails(getDoc(doc(asPhone(READER), 'users', `u_${OTHER}`)));
    await assertFails(getDocs(collection(asPhone(READER), 'users')));
  });
  test('pathak apne referral counter / reward khud nahi badal sakta', async () => {
    await assertFails(updateDoc(doc(asPhone(READER), 'users', `u_${READER}`), { successfulReferralsCount: 99 }));
    await assertFails(updateDoc(doc(asPhone(READER), 'users', `u_${OTHER}`), { name: 'x' }));
    await assertSucceeds(updateDoc(doc(asPhone(READER), 'users', `u_${READER}`), { consent: { version: 'v1' } }));
  });
  test('khud ko e-paper subscription nahi de sakta', async () => {
    await assertFails(setDoc(doc(asPhone(READER), 'epaper_subscriptions', 'ram@x.com'), { status: 'active', expiresAt: new Date(2099, 0) }));
  });
  test('apna subscription padhe (email ya phone se), doosre ka nahi', async () => {
    await assertSucceeds(getDoc(doc(asPhone(READER, { email: 'ram@x.com' }), 'epaper_subscriptions', 'ram@x.com')));
    await assertFails(getDoc(doc(asPhone(READER, { email: 'ram@x.com' }), 'epaper_subscriptions', 's@x.com')));
    await assertSucceeds(getDoc(doc(asPhone(OTHER), 'epaper_subscriptions', 's@x.com')));
  });
  test('referral list sirf apni', async () => {
    await assertSucceeds(getDocs(query(collection(asPhone(READER), 'referrals'), where('referrerPhone', '==', READER))));
    await assertFails(getDocs(query(collection(asPhone(OTHER), 'referrals'), where('referrerPhone', '==', READER))));
  });
  test('naya pathak sirf apna khata, bina reward fields', async () => {
    const NEW = '9555555555';
    await assertSucceeds(setDoc(doc(asPhone(NEW), 'users', `u_${NEW}`), { name: 'N', email: 'n@x.com', phone: NEW, role: 'reader', verified: true, referredBy: null }));
    await assertFails(setDoc(doc(asPhone('9555555556'), 'users', 'u_9555555556'), { name: 'N', phone: '9555555556', successfulReferralsCount: 50 }));
    await assertFails(setDoc(doc(asPhone(NEW), 'users', `u_${OTHER}`), { name: 'N', phone: OTHER }));
  });
});

describe('Patrakar', () => {
  test('approved patrakar pending khabar bhej sake, published nahi', async () => {
    await assertSucceeds(addDoc(collection(asPhone(REPORTER), 'articles'), { title: 'x', status: 'pending', authorIdentifier: REPORTER, siteId: 'the-local-leader' }));
    await assertFails(addDoc(collection(asPhone(REPORTER), 'articles'), { title: 'x', status: 'published', authorIdentifier: REPORTER, siteId: 'the-local-leader' }));
    await assertFails(addDoc(collection(asPhone(REPORTER), 'articles'), { title: 'x', status: 'pending', authorIdentifier: OTHER, siteId: 'the-local-leader' }));
    // Jis portal ki sadasyata nahi, wahan khabar nahi
    await assertFails(addDoc(collection(asPhone(REPORTER), 'articles'), { title: 'x', status: 'pending', authorIdentifier: REPORTER, siteId: 'bazar-karobar' }));
  });
  test('pending patrakar / pathak khabar nahi bhej sakta', async () => {
    await assertFails(addDoc(collection(asPhone(PENDING_REP), 'articles'), { title: 'x', status: 'pending', authorIdentifier: PENDING_REP }));
    await assertFails(addDoc(collection(asPhone(READER), 'articles'), { title: 'x', status: 'pending', authorIdentifier: READER }));
  });
  test('patrakar apni photo badle, khud ko approve / padnaam nahi', async () => {
    await assertSucceeds(updateDoc(doc(asPhone(REPORTER), 'reporters', `rp_${REPORTER}`), { photoUrl: 'data:x', bloodGroup: 'O+' }));
    await assertFails(updateDoc(doc(asPhone(PENDING_REP), 'reporters', `rp_${PENDING_REP}`), { status: 'approved' }));
    await assertFails(updateDoc(doc(asPhone(REPORTER), 'reporters', `rp_${REPORTER}`), { designation: 'Editor' }));
    await assertFails(updateDoc(doc(asPhone(REPORTER), 'reporters', `rp_${REPORTER}`), { membershipActive: true }));
    await assertFails(setDoc(doc(asPhone(REPORTER), 'counters', 'press_ids_TLL_2026'), { next: 1 }));
  });
  test('naya patrakar sirf pending aavedan', async () => {
    const P = '9666666666';
    await assertSucceeds(setDoc(doc(asPhone(P), 'reporters', `rp_${P}`), { name: 'A', phone: P, city: 'Indore', status: 'pending', role: 'reporter', phoneVerified: true }));
    await assertFails(setDoc(doc(asPhone('9666666667'), 'reporters', 'rp_9666666667'), { name: 'A', phone: '9666666667', status: 'approved' }));
  });
  test('doosre patrakar ka profile nahi padh sakta', async () => {
    await assertFails(getDoc(doc(asPhone(READER), 'reporters', `rp_${REPORTER}`)));
    await assertSucceeds(getDoc(doc(asPhone(REPORTER), 'reporters', `rp_${REPORTER}`)));
  });
});

describe('Advertiser', () => {
  test('advertiser browser se seedha ad nahi bana sakta (sirf server, bhugtan ke baad)', async () => {
    await assertFails(addDoc(collection(asPhone(ADVERTISER), 'ads'), { name: 'a', status: 'pending', advertiserPhone: ADVERTISER }));
    await assertFails(addDoc(collection(asPhone(ADVERTISER), 'ads'), { name: 'a', status: 'pending', advertiserPhone: OTHER }));
    await assertFails(addDoc(collection(asPhone(READER), 'ads'), { name: 'a', status: 'pending', advertiserPhone: READER }));
  });
});

describe('Comments, shok sandesh, consent, deletion', () => {
  test('sirf approved comments dikhein; login pathak pending comment kare', async () => {
    await assertSucceeds(getDocs(query(collection(anon(), 'comments'), where('articleId', '==', 'a1'), where('status', '==', 'approved'))));
    await assertFails(getDocs(query(collection(anon(), 'comments'), where('articleId', '==', 'a1'))));
    await assertSucceeds(addDoc(collection(asPhone(READER), 'comments'), { articleId: 'a1', comment: 'hi', status: 'pending' }));
    await assertFails(addDoc(collection(asPhone(READER), 'comments'), { articleId: 'a1', comment: 'hi', status: 'approved' }));
    await assertFails(addDoc(collection(anon(), 'comments'), { articleId: 'a1', comment: 'hi', status: 'pending' }));
  });
  test('shok sandesh sirf verified shok payment ID se', async () => {
    const ok = { name: 'x', status: 'pending', paymentId: 'pay_SHOK123456', ownerPhone: READER, days: 7 };
    // Bina login nahi; doosre ke naam se nahi; din badhakar nahi; seedha approved nahi
    await assertFails(setDoc(doc(anon(), 'shok_sandesh', 'pay_SHOK123456'), ok));
    await assertFails(setDoc(doc(asPhone(OTHER), 'shok_sandesh', 'pay_SHOK123456'), { ...ok, ownerPhone: OTHER }));
    await assertFails(setDoc(doc(asPhone(READER), 'shok_sandesh', 'pay_SHOK123456'), { ...ok, days: 365 }));
    await assertFails(setDoc(doc(asPhone(READER), 'shok_sandesh', 'pay_SHOK123456'), { ...ok, status: 'approved' }));
    await assertFails(setDoc(doc(asPhone(READER), 'shok_sandesh', 'pay_FAKE000000'), { ...ok, paymentId: 'pay_FAKE000000' }));
    await assertFails(setDoc(doc(asPhone(READER), 'shok_sandesh', 'pay_EPAP123456'), { ...ok, paymentId: 'pay_EPAP123456' }));
    await assertSucceeds(setDoc(doc(asPhone(READER), 'shok_sandesh', 'pay_SHOK123456'), ok));
    // Apna pending sandesh dikhe (download ke liye), doosre ka nahi
    await assertSucceeds(getDoc(doc(asPhone(READER), 'shok_sandesh', 'pay_SHOK123456')));
    await assertFails(getDoc(doc(asPhone(READER), 'shok_sandesh', 'pay_SHOKOTHER01')));
    await assertSucceeds(getDocs(query(collection(asPhone(READER), 'shok_sandesh'), where('ownerPhone', '==', READER))));
  });
  test('consent sirf apne number ka', async () => {
    await assertSucceeds(addDoc(collection(asPhone(READER), 'consents'), { phone: READER, version: 'v1' }));
    await assertFails(addDoc(collection(asPhone(READER), 'consents'), { phone: OTHER, version: 'v1' }));
    await assertFails(getDocs(collection(asPhone(READER), 'consents')));
  });
  test('khata hatane ka anurodh sirf apne number ka', async () => {
    await assertSucceeds(setDoc(doc(asPhone(READER), 'account_deletion_requests', READER), { phone: READER, status: 'pending' }));
    await assertFails(setDoc(doc(asPhone(READER), 'account_deletion_requests', OTHER), { phone: OTHER, status: 'pending' }));
    await assertFails(setDoc(doc(asPhone(READER), 'account_deletion_requests', READER), { phone: READER, status: 'completed' }));
  });
});

describe('Naye suraksha niyam', () => {
  test('purana patrakar (rp_ naam nahi) token ke rid se khabar bhej sake', async () => {
    const LEG = '9777777777';
    await env.withSecurityRulesDisabled((ctx) => setDoc(doc(ctx.firestore(), 'reporters', 'oldRecord123'), { name: 'Old', mobile: LEG, status: 'approved', membershipActive: true }));
    await assertSucceeds(addDoc(collection(asPhone(LEG, { rid: 'oldRecord123' }), 'articles'), { title: 'x', status: 'pending', authorIdentifier: LEG }));
    await assertFails(addDoc(collection(asPhone(LEG), 'articles'), { title: 'x', status: 'pending', authorIdentifier: LEG }));
    // Kisi aur ka rid (record kisi aur number ka) — band
    await assertFails(addDoc(collection(asPhone(READER, { rid: 'oldRecord123' }), 'articles'), { title: 'x', status: 'pending', authorIdentifier: READER }));
  });
  test('advertiser active/pending ad ya classified seedha nahi', async () => {
    await assertFails(addDoc(collection(asPhone(ADVERTISER), 'ads'), { name: 'a', status: 'active', advertiserPhone: ADVERTISER }));
    await assertFails(addDoc(collection(asPhone(ADVERTISER), 'classifieds'), { title: 'a', status: 'active', advertiserPhone: ADVERTISER }));
    await assertFails(addDoc(collection(asPhone(ADVERTISER), 'classifieds'), { title: 'a', status: 'pending', advertiserPhone: ADVERTISER }));
  });
  test('e-paper PDF link (epaper_files) koi nahi padh sakta, admin ke alawa', async () => {
    await env.withSecurityRulesDisabled((ctx) => setDoc(doc(ctx.firestore(), 'epaper_files', 'ed1'), { pdfUrl: 'https://secret.pdf' }));
    await assertFails(getDoc(doc(anon(), 'epaper_files', 'ed1')));
    await assertFails(getDoc(doc(asPhone(READER, { email: 'ram@x.com' }), 'epaper_files', 'ed1')));
    await assertSucceeds(getDoc(doc(asAdmin(), 'epaper_files', 'ed1')));
  });
});

describe('Admin', () => {
  test('admin sab kuch kar sake', async () => {
    await assertSucceeds(getDocs(collection(asAdmin(), 'users')));
    await assertSucceeds(setDoc(doc(asAdmin(), 'articles', 'new'), { title: 'x', status: 'published' }));
    await assertSucceeds(updateDoc(doc(asAdmin(), 'reporters', `rp_${PENDING_REP}`), { status: 'approved' }));
    await assertSucceeds(deleteDoc(doc(asAdmin(), 'readers', 'legacy1')));
  });
  test('nakli admin claim (phone user) admin nahi', async () => {
    await assertFails(getDocs(collection(asPhone(READER, { admin: false }), 'users')));
  });
});
