// Mobile app ke kaamon ke Firestore rules test — emulator par:
//   npx firebase emulators:exec --only firestore --project demo-gpn "node --test tests/app.rules.test.mjs"
// App (Golden Pearl News Android) ke apne features / price hain; ye test jaanchte hain ki app ka har
// kaam chale, aur phir bhi koi doosre ka data / approve / inaam khud na le sake.
import { readFileSync } from 'node:fs';
import { after, before, beforeEach, describe, test } from 'node:test';
import { assertFails, assertSucceeds, initializeTestEnvironment } from '@firebase/rules-unit-testing';
import {
  addDoc, collection, deleteDoc, doc, getDoc, getDocs, increment, query, setDoc, Timestamp, updateDoc, where, writeBatch
} from 'firebase/firestore';

const A = '9811111111'; // app pathak (purana random-ID record)
const B = '9822222222'; // doosra pathak
const REP = '9833333333'; // app patrakar (The Local Leader ki sadasyata, status pending)
const ADV = '9844444444'; // app vigyapandata
const WEB = '9855555555'; // website pathak (u_<phone>)

let env;
const anon = () => env.unauthenticatedContext().firestore();
const asPhone = (p, extra = {}) => env.authenticatedContext(`ph_${p}`, { phone: p, ...extra }).firestore();

before(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-gpn',
    firestore: { rules: readFileSync('firestore.rules', 'utf8'), host: '127.0.0.1', port: 8085 }
  });
});
after(async () => env?.cleanup());

beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await setDoc(doc(db, 'users', 'appRandomA'), { name: 'A', phone: A, mobile: A, role: 'user', status: 'active', referralCode: 'GPAAAAAA', referralCount: 2, rewardsClaimed: 1 });
    await setDoc(doc(db, 'users', 'appRandomB'), { name: 'B', phone: B, role: 'user', status: 'active' });
    await setDoc(doc(db, 'users', `u_${WEB}`), { name: 'Web', phone: WEB, role: 'reader', verified: true, successfulReferralsCount: 0 });
    const nextYear = Timestamp.fromMillis(Date.now() + 365 * 864e5);
    await setDoc(doc(db, 'reporters', 'appRandomRep'), {
      name: 'Rep', phone: REP, mobile: REP, status: 'pending', role: 'reporter', isVerifiedReporter: true,
      memberships: { 'the-local-leader': { expiresAt: nextYear, paymentId: 'pay_m1' } }
    });
    await setDoc(doc(db, 'payments', 'pay_shok1'), { kind: 'shok', phone: A, days: 7, amount: 11 });
    await setDoc(doc(db, 'epaper_subscriptions', `${A}@news.local__the-local-leader`), { userPhone: A, userEmail: `${A}@news.local`, siteId: 'the-local-leader', status: 'active', expiresAt: nextYear });
    await setDoc(doc(db, 'epaper_subscriptions', `${B}@news.local__bazar-karobar`), { userPhone: B, userEmail: `${B}@news.local`, siteId: 'bazar-karobar', status: 'active', expiresAt: nextYear });
    await setDoc(doc(db, 'advertisers', 'appRandomAdv'), { name: 'Adv', phone: ADV, mobile: ADV, role: 'advertiser', status: 'active' });
    await setDoc(doc(db, 'articles', 'a1'), { title: 'T', status: 'published', views: 1 });
    await setDoc(doc(db, 'videos', 'v1'), { title: 'V', likes: 3 });
    await setDoc(doc(db, 'ads', 'ad1'), { name: 'Ad', status: 'active', impressions: 1, clicks: 0 });
    await setDoc(doc(db, 'referral_codes', 'GPAAAAAA'), { userId: 'appRandomA', phone: A });
    await setDoc(doc(db, 'push_tokens', 'tokB'), { phone: B, token: 'tokB' });
    await setDoc(doc(db, 'comments', 'cB'), { articleId: 'a1', status: 'pending', userPhone: B });
  });
});

describe('App login / sign up', () => {
  test('apna purana (random ID) record phone se dhoondhe, doosre ka nahi', async () => {
    await assertSucceeds(getDocs(query(collection(asPhone(A), 'users'), where('phone', '==', A))));
    await assertSucceeds(getDocs(query(collection(asPhone(A), 'users'), where('mobile', '==', A))));
    await assertFails(getDocs(query(collection(asPhone(A), 'users'), where('phone', '==', B))));
    await assertFails(getDocs(collection(asPhone(A), 'users')));
    await assertFails(getDocs(query(collection(anon(), 'users'), where('phone', '==', A))));
  });
  test('login par last-login / consent likhe', async () => {
    await assertSucceeds(updateDoc(doc(asPhone(A), 'users', 'appRandomA'), { isPhoneVerified: true, lastLoginAt: 'x', dpdpConsent: { version: 'v1' } }));
    await assertSucceeds(updateDoc(doc(asPhone(WEB), 'users', `u_${WEB}`), { phone: WEB, mobile: WEB, isPhoneVerified: true, lastLoginAt: 'x' }));
    await assertSucceeds(updateDoc(doc(asPhone(REP), 'reporters', 'appRandomRep'), { lastLoginAt: 'x', dpdpConsent: { version: 'v1' } }));
    await assertSucceeds(updateDoc(doc(asPhone(ADV), 'advertisers', 'appRandomAdv'), { lastLoginAt: 'x' }));
  });
  test('naya app khata (u_ / rp_ / adv_) sirf apne number ka, bina inaam / approval', async () => {
    const N = '9866666666';
    await assertSucceeds(setDoc(doc(asPhone(N), 'users', `u_${N}`), { name: 'N', email: '', phone: N, mobile: N, role: 'user', status: 'active', isPhoneVerified: true, source: 'mobile_app', referralCode: 'GPNNNNNN', dpdpConsent: { version: 'v1' } }));
    await assertFails(setDoc(doc(asPhone(N), 'users', 'x1'), { name: 'N', phone: N, role: 'user', referralCount: 50 }));
    await assertFails(setDoc(doc(asPhone(N), 'users', 'x2'), { name: 'N', phone: N, role: 'admin' }));
    await assertFails(setDoc(doc(asPhone(N), 'users', 'x3'), { name: 'N', phone: B }));
    await assertSucceeds(setDoc(doc(asPhone(N), 'reporters', `rp_${N}`), { name: 'N', phone: N, mobile: N, role: 'reporter', status: 'pending', pressCardNo: 'P1', source: 'mobile_app' }));
    await assertFails(setDoc(doc(asPhone(N), 'reporters', 'r2'), { name: 'N', phone: N, status: 'active' }));
    await assertSucceeds(setDoc(doc(asPhone(N), 'advertisers', `adv_${N}`), { name: 'N', phone: N, mobile: N, role: 'advertiser', status: 'active', companyName: 'Co' }));
    await assertFails(setDoc(doc(asPhone(N), 'advertisers', 'a2'), { name: 'N', phone: N, totalAds: 99 }));
  });
});

describe('App profile / patrakar / vigyapandata', () => {
  test('profile edit (shehar, DOB, photo) — role / status / ginti nahi', async () => {
    await assertSucceeds(updateDoc(doc(asPhone(A), 'users', 'appRandomA'), { name: 'A2', city: 'Indore', dob: '2000-01-01', gender: 'male', photoUrl: 'data:x', bio: 'hi', updatedAt: 'x' }));
    await assertSucceeds(updateDoc(doc(asPhone(WEB), 'users', `u_${WEB}`), { city: 'Bhopal', photoUrl: 'data:y' }));
    await assertFails(updateDoc(doc(asPhone(A), 'users', 'appRandomA'), { role: 'admin' }));
    await assertFails(updateDoc(doc(asPhone(A), 'users', 'appRandomA'), { referralCount: 99 }));
    await assertFails(updateDoc(doc(asPhone(WEB), 'users', `u_${WEB}`), { successfulReferralsCount: 99 }));
    await assertFails(updateDoc(doc(asPhone(A), 'users', 'appRandomA'), { epaperPassUntil: '2099-01-01' }));
    await assertFails(updateDoc(doc(asPhone(A), 'users', 'appRandomB'), { name: 'hack' }));
  });
  test('press ID: photo / blood group / kshetra — sadasyata / status / padnaam nahi', async () => {
    await assertSucceeds(updateDoc(doc(asPhone(REP), 'reporters', 'appRandomRep'), { photoUrl: 'data:x', bloodGroup: 'O+', workArea: 'Indore', state: 'MP', pressPortalId: 'local_leader', updatedAt: 'x' }));
    // Sadasyata sirf server (payment jaanch ke baad) — khud nahi
    await assertFails(updateDoc(doc(asPhone(REP), 'reporters', 'appRandomRep'), { isVerifiedReporter: true, plan: 'yearly', paymentId: 'pay_1', passActivatedAt: 'x', passValidTill: 'y', updatedAt: 'x' }));
    await assertFails(updateDoc(doc(asPhone(REP), 'reporters', 'appRandomRep'), { 'memberships.bazar-karobar': { expiresAt: Timestamp.fromMillis(Date.now() + 864e5) } }));
    await assertFails(updateDoc(doc(asPhone(REP), 'reporters', 'appRandomRep'), { status: 'approved' }));
    await assertFails(updateDoc(doc(asPhone(REP), 'reporters', 'appRandomRep'), { designation: 'Editor' }));
    await assertFails(updateDoc(doc(asPhone(REP), 'reporters', 'appRandomRep'), { membershipActive: true }));
  });
  test('vigyapandata apna profile — ginti / membership nahi', async () => {
    await assertSucceeds(updateDoc(doc(asPhone(ADV), 'advertisers', 'appRandomAdv'), { companyName: 'New Co', email: 'a@b.com' }));
    await assertFails(updateDoc(doc(asPhone(ADV), 'advertisers', 'appRandomAdv'), { totalAds: 50 }));
    await assertFails(updateDoc(doc(asPhone(ADV), 'advertisers', 'appRandomAdv'), { status: 'vip' }));
  });
});

describe('App khabar / booking', () => {
  test('sadasyata wala app patrakar sirf usi portal ki khabar review ke liye bheje (token rid se)', async () => {
    const rep = asPhone(REP, { rid: 'appRandomRep' });
    const art = { title: 'x', siteId: 'the-local-leader', authorIdentifier: REP, status: 'pending_admin_approval', approved: false };
    await assertSucceeds(addDoc(collection(rep, 'articles'), art));
    // Doosre portal ki sadasyata nahi
    await assertFails(addDoc(collection(rep, 'articles'), { ...art, siteId: 'bazar-karobar' }));
    await assertFails(addDoc(collection(rep, 'articles'), { ...art, status: 'published' }));
    await assertFails(addDoc(collection(rep, 'articles'), { ...art, approved: true }));
    await assertFails(addDoc(collection(rep, 'articles'), { ...art, authorIdentifier: B }));
    await assertFails(addDoc(collection(asPhone(A), 'articles'), { ...art, authorIdentifier: A }));
  });
  test('vigyapan / classified sirf server (payment ke baad); shok sandesh sirf apne payment se', async () => {
    // Bina payment koi booking nahi — ye server banata hai
    await assertFails(addDoc(collection(asPhone(ADV), 'ads'), { name: 'My ad', status: 'paused', paymentId: 'pay_x' }));
    await assertFails(addDoc(collection(asPhone(ADV), 'ads'), { name: 'My ad', status: 'pending' }));
    await assertFails(addDoc(collection(asPhone(ADV), 'classifieds'), { title: 'c', status: 'paused' }));
    await assertFails(addDoc(collection(asPhone(A), 'obituaries'), { title: 's', status: 'paused', approved: false }));
    await assertFails(addDoc(collection(asPhone(A), 'shok_sandesh'), { title: 's', status: 'paused', approved: false }));
    // Shok: document ID = server ka payment record, usi ke din, usi ka number, pending
    const shok = { name: 'S', ownerPhone: A, days: 7, status: 'pending', paymentId: 'pay_shok1' };
    await assertFails(setDoc(doc(asPhone(A), 'shok_sandesh', 'pay_shok1'), { ...shok, days: 30 }));
    await assertFails(setDoc(doc(asPhone(A), 'shok_sandesh', 'pay_shok1'), { ...shok, status: 'approved' }));
    await assertFails(setDoc(doc(asPhone(B), 'shok_sandesh', 'pay_shok1'), { ...shok, ownerPhone: B }));
    await assertSucceeds(setDoc(doc(asPhone(A), 'shok_sandesh', 'pay_shok1'), shok));
    // Apna (pending) sandesh sirf maalik padh sake — download ke liye
    await assertSucceeds(getDocs(query(collection(asPhone(A), 'shok_sandesh'), where('ownerPhone', '==', A))));
    await assertFails(getDoc(doc(asPhone(B), 'shok_sandesh', 'pay_shok1')));
    await assertFails(getDoc(doc(anon(), 'shok_sandesh', 'pay_shok1')));
    await assertSucceeds(addDoc(collection(asPhone(REP), 'press_card_deliveries'), { reporterPhone: REP, status: 'pending_dispatch' }));
    // App Switch pass: sirf apne number ka record; apna hi padh sake (dobara login par pass wapas)
    await assertSucceeds(setDoc(doc(asPhone(A), 'app_switch_subscriptions', 'pay_sw1'), { phone: A, planId: '1_month', expiresAt: '2099-01-01T00:00:00.000Z' }));
    await assertFails(setDoc(doc(asPhone(A), 'app_switch_subscriptions', 'pay_sw2'), { phone: B, planId: '1_month' }));
    await assertFails(addDoc(collection(asPhone(A), 'app_switch_subscriptions'), { portalId: 'x', amount: 21 }));
    await assertSucceeds(getDocs(query(collection(asPhone(A), 'app_switch_subscriptions'), where('phone', '==', A))));
    await assertFails(getDocs(query(collection(asPhone(B), 'app_switch_subscriptions'), where('phone', '==', A))));
    await assertFails(getDocs(query(collection(anon(), 'app_switch_subscriptions'), where('phone', '==', A))));
  });
  test('video like ±1 aur views / clicks +1', async () => {
    await assertSucceeds(updateDoc(doc(anon(), 'videos', 'v1'), { likes: increment(1) }));
    await assertSucceeds(updateDoc(doc(anon(), 'videos', 'v1'), { likes: increment(-1) }));
    await assertFails(updateDoc(doc(anon(), 'videos', 'v1'), { likes: increment(100) }));
    await assertFails(updateDoc(doc(anon(), 'videos', 'v1'), { title: 'hack' }));
    await assertSucceeds(updateDoc(doc(anon(), 'articles', 'a1'), { views: increment(1) }));
    await assertSucceeds(updateDoc(doc(anon(), 'ads', 'ad1'), { clicks: increment(1) }));
  });
});

describe('App e-paper (har portal ka alag)', () => {
  test('apne subscriptions padhe (phone se), doosre ke nahi, likh nahi sake', async () => {
    await assertSucceeds(getDocs(query(collection(asPhone(A), 'epaper_subscriptions'), where('userPhone', '==', A))));
    await assertSucceeds(getDoc(doc(asPhone(A), 'epaper_subscriptions', `${A}@news.local__bazar-karobar`)));
    await assertFails(getDoc(doc(asPhone(A), 'epaper_subscriptions', `${B}@news.local__bazar-karobar`)));
    await assertFails(getDocs(query(collection(asPhone(A), 'epaper_subscriptions'), where('userPhone', '==', B))));
    await assertFails(setDoc(doc(asPhone(A), 'epaper_subscriptions', `${A}@news.local__bazar-karobar`), { userPhone: A, siteId: 'bazar-karobar', status: 'active', expiresAt: Timestamp.fromMillis(Date.now() + 864e5) }));
  });
});

describe('App Refer & Earn', () => {
  test('login pathak code se referrer dekhe; bina login nahi', async () => {
    await assertSucceeds(getDoc(doc(asPhone(B), 'referral_codes', 'GPAAAAAA')));
    await assertFails(getDoc(doc(anon(), 'referral_codes', 'GPAAAAAA')));
    await assertFails(getDocs(collection(asPhone(B), 'referral_codes')));
    await assertSucceeds(setDoc(doc(asPhone(B), 'referral_codes', 'GPBBBBBB'), { userId: 'appRandomB', phone: B }));
    await assertFails(setDoc(doc(asPhone(B), 'referral_codes', 'GPCCCCCC'), { userId: 'appRandomA', phone: A }));
  });
  test('naye pathak ka sign-up referrer ko sirf ek baar +1 deta hai', async () => {
    const N = '9877777777';
    const db = asPhone(N);
    const batch = writeBatch(db);
    batch.set(doc(db, 'referrals', N), { referrerPhone: A, refereePhone: N, referrerId: 'appRandomA' });
    batch.update(doc(db, 'users', 'appRandomA'), { referralCount: increment(1) });
    await assertSucceeds(batch.commit());
    // Dobara +1 nahi (referral record pehle se hai)
    await assertFails(updateDoc(doc(db, 'users', 'appRandomA'), { referralCount: increment(1) }));
    // Bina referral record +1 nahi
    await assertFails(updateDoc(doc(asPhone(B), 'users', 'appRandomA'), { referralCount: increment(1) }));
    // Kisi aur ke naam ka referral record nahi
    await assertFails(setDoc(doc(asPhone(B), 'referrals', A), { refereePhone: A, referrerPhone: B }));
  });
  test('inaam lena: sirf bacha hua, ek baar me ek', async () => {
    await assertSucceeds(updateDoc(doc(asPhone(A), 'users', 'appRandomA'), { rewardsClaimed: 2, epaperPassUntil: '2027-01-01' }));
    await assertFails(updateDoc(doc(asPhone(A), 'users', 'appRandomA'), { rewardsClaimed: 3, epaperPassUntil: '2027-04-01' }));
    await assertSucceeds(addDoc(collection(asPhone(A), 'referral_rewards'), { phone: A, rewardType: 'epaper' }));
    await assertFails(addDoc(collection(asPhone(A), 'referral_rewards'), { phone: B, rewardType: 'epaper' }));
    await assertSucceeds(getDocs(query(collection(asPhone(A), 'referrals'), where('referrerPhone', '==', A))));
    await assertSucceeds(getDocs(query(collection(asPhone(A), 'referral_rewards'), where('phone', '==', A))));
  });
});

describe('App bookmarks / push / khata hatana', () => {
  test('bookmarks sirf apne', async () => {
    await assertSucceeds(setDoc(doc(asPhone(A), 'bookmarks', `${A}_a1`), { userKey: A, articleId: 'a1' }));
    await assertSucceeds(getDocs(query(collection(asPhone(A), 'bookmarks'), where('userKey', '==', A))));
    await assertFails(setDoc(doc(asPhone(A), 'bookmarks', `${B}_a1`), { userKey: B, articleId: 'a1' }));
    await assertFails(getDocs(query(collection(asPhone(A), 'bookmarks'), where('userKey', '==', B))));
    await assertSucceeds(deleteDoc(doc(asPhone(A), 'bookmarks', `${A}_a1`)));
  });
  test('push token sirf apne number ka', async () => {
    await assertSucceeds(setDoc(doc(asPhone(A), 'push_tokens', 'tokA'), { phone: A, token: 'tokA' }, { merge: true }));
    await assertFails(setDoc(doc(asPhone(A), 'push_tokens', 'tokX'), { phone: B, token: 'tokX' }));
    await assertFails(getDoc(doc(asPhone(A), 'push_tokens', 'tokB')));
    await assertFails(getDoc(doc(anon(), 'push_tokens', 'tokB')));
  });
  test('khata hatana: apna data hi', async () => {
    await assertSucceeds(deleteDoc(doc(asPhone(B), 'comments', 'cB')));
    await assertSucceeds(deleteDoc(doc(asPhone(B), 'push_tokens', 'tokB')));
    await assertSucceeds(deleteDoc(doc(asPhone(B), 'users', 'appRandomB')));
    await assertFails(deleteDoc(doc(asPhone(B), 'users', 'appRandomA')));
    await assertSucceeds(deleteDoc(doc(asPhone(A), 'referral_codes', 'GPAAAAAA')));
    await assertSucceeds(addDoc(collection(asPhone(A), 'account_deletions'), { phoneMasked: '******1111' }));
    await assertSucceeds(addDoc(collection(asPhone(A), 'consents'), { phone: A, version: 'v1' }));
  });
});
