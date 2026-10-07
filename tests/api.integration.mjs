// Naye server API ka test — Firestore + Auth emulator par, asli `next start` ke saath.
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
//   npx firebase emulators:exec --only firestore,auth --project <PROJECT_ID> "node tests/api.integration.mjs"
import { spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8').split(/\r?\n/).filter((l) => /^[A-Z_]+=/.test(l)).map((l) => {
    const i = l.indexOf('=');
    return [l.slice(0, i), l.slice(i + 1).replace(/^["']|["']$/g, '')];
  })
);
const projectId = env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const app = initializeApp({ projectId });
const db = getFirestore(app);
const auth = getAuth(app);
const PORT = 3158;
const B = `http://localhost:${PORT}`;
let pass = 0;
let fail = 0;
const check = (name, ok, extra = '') => {
  ok ? pass++ : fail++;
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}${extra ? ' — ' + extra : ''}`);
};

async function idToken(uid, claims) {
  const custom = await auth.createCustomToken(uid, claims);
  const r = await fetch(`http://${process.env.FIREBASE_AUTH_EMULATOR_HOST}/identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=fake`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: custom, returnSecureToken: true })
  });
  return (await r.json()).idToken;
}
const post = (path, body, token) =>
  fetch(B + path, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify(body) });

const REF = '9811111111';
const NEWU = '9822222222';
const REP = '9833333333';
const ADV = '9844444444';

// Seed
await db.doc(`users/u_${REF}`).set({ name: 'Referrer', email: 'ref@x.com', phone: REF, referralCode: 'GPTESTAA' });
await db.doc('referral_codes/GPTESTAA').set({ userId: `u_${REF}`, phone: REF });
await db.doc(`reporters/rp_${REP}`).set({ name: 'Rep', phone: REP, status: 'approved', memberships: { 'news-info-24': { expiresAt: new Date(Date.now() + 30 * 864e5) } } });
await db.doc('advertisers/oldAdvRecord1').set({ businessName: 'Test Shop', email: 'Shop@X.com', mobile: ADV, status: 'active' });

// Server
const server = spawn('npx', ['next', 'start', '-p', String(PORT)], {
  env: {
    ...process.env,
    ADMIN_SESSION_SECRET: 'x'.repeat(40),
    ADMIN_CREDENTIALS: (() => {
      const c = require('node:crypto');
      const s = c.randomBytes(16);
      return `tester@example.com:scrypt$16384$${s.toString('base64')}$${c.scryptSync('TestPass12345', s, 32, { N: 16384, r: 8, p: 1 }).toString('base64')}`;
    })()
  },
  shell: true,
  stdio: 'ignore'
});
for (let i = 0; i < 60; i++) {
  try {
    if ((await fetch(B + '/api/market-rates')).ok) break;
  } catch {}
  await new Promise((r) => setTimeout(r, 1000));
}

try {
  // 1. Lookup
  let r = await (await post('/api/auth/lookup', { kind: 'reader', phone: REF })).json();
  check('lookup: registered pathak mila', r.found === true && !('email' in r) && !('name' in r));
  r = await (await post('/api/auth/lookup', { kind: 'reader', phone: '9899999999' })).json();
  check('lookup: anjaan number', r.found === false);
  r = await (await post('/api/auth/lookup', { kind: 'patrakar', phone: REP })).json();
  check('lookup: patrakar status', r.found && r.status === 'approved');

  // 2. Naya pathak + referral reward (server)
  const tNew = await idToken(`ph_${NEWU}`, { phone: NEWU });
  let res = await post('/api/reader/create', { name: 'Naya', email: 'naya@x.com', referralCode: 'gptestaa' }, tNew);
  r = await res.json();
  check('reader/create: referral recorded', res.ok && r.created === true && r.referral === 'recorded', JSON.stringify(r));
  const refUser = (await db.doc(`users/u_${REF}`).get()).data();
  check('referrer ko +1 referral aur +3 mahine', refUser.successfulReferralsCount === 1 && refUser.referralRewardMonths === 3);
  const sub = (await db.doc('epaper_subscriptions/ref@x.com__the-local-leader').get()).data();
  check('referrer ka free e-paper chalu (us portal ka)', sub?.status === 'active' && sub?.userPhone === REF && sub?.siteId === 'the-local-leader');
  res = await post('/api/reader/create', { name: 'Naya', referralCode: 'GPTESTAA' }, tNew);
  r = await res.json();
  check('dobara signup par reward dobara nahi', r.created === false);
  res = await post('/api/reader/create', { name: 'Hacker' });
  check('bina token reader/create band', res.status === 401);
  res = await post('/api/reader/create', { name: 'Hacker' }, 'nakli.token.abc');
  check('nakli token band', res.status === 401);

  // 3. Referral code
  r = await (await post('/api/reader/referral-code', {}, tNew)).json();
  check('naye pathak ka referral code', /^GP[A-Z2-9]{6}$/.test(r.code || ''), r.code);

  // 4. Payments (test mode: secret nahi, rzp_test key)
  res = await post('/api/payments/confirm', { kind: 'epaper', paymentId: 'pay_TESTEPAPER01', planId: 'epaper_1_month' }, tNew);
  r = await res.json();
  check('epaper payment → subscription', res.ok && !!r.expiresAt, JSON.stringify(r));
  const nsub = (await db.doc('epaper_subscriptions/naya@x.com__the-local-leader').get()).data();
  check('subscription doc server ne likha', nsub?.status === 'active' && nsub?.amount === 21);
  res = await post('/api/payments/confirm', { kind: 'epaper', paymentId: 'pay_TESTEPAPER01', planId: 'epaper_1_month' }, await idToken(`ph_${REF}`, { phone: REF }));
  check('ek payment doosre user ke liye dobara nahi', res.status === 409);
  res = await post('/api/payments/confirm', { kind: 'epaper', paymentId: 'pay_TESTEPAPER02', planId: 'free_forever' }, tNew);
  check('nakli plan band', res.status === 400);
  res = await post('/api/payments/confirm', { kind: 'shok', paymentId: 'pay_TESTSHOK001', planId: 'shok_7_days' });
  check('shok bina login band', res.status === 401);
  res = await post('/api/payments/confirm', { kind: 'shok', paymentId: 'pay_TESTSHOK001', planId: 'shok_forever' }, tNew);
  check('shok nakli plan band', res.status === 400);
  res = await post('/api/payments/confirm', { kind: 'shok', paymentId: 'pay_TESTSHOK001', planId: 'shok_7_days' }, tNew);
  r = await res.json();
  check('shok payment → credit (7 din)', res.ok && r.shokCredit === 'pay_TESTSHOK001' && r.days === 7);
  const shokPay = (await db.doc('payments/pay_TESTSHOK001').get()).data();
  check('payments/{id}: kind shok, ₹11, 7 din, mobile', shokPay?.kind === 'shok' && shokPay?.amount === 11 && shokPay?.days === 7 && shokPay?.phone === NEWU);
  res = await post('/api/payments/confirm', { kind: 'shok', paymentId: 'pay_TESTSHOK002', planId: 'shok_30_days' }, tNew);
  check('shok 30 din ₹51', res.ok && (await db.doc('payments/pay_TESTSHOK002').get()).data()?.amount === 51);

  // 5. Patrakar press ID + membership
  const tRep = await idToken(`ph_${REP}`, { phone: REP });
  r = await (await post('/api/patrakar/press-id', { siteSlug: 'news-info-24' }, tRep)).json();
  check('press ID kram se', r.pressId === `NI24-${new Date().getFullYear()}-001`, r.pressId);
  r = await (await post('/api/patrakar/press-id', { siteSlug: 'news-info-24' }, tRep)).json();
  check('wahi portal par wahi ID', r.pressId === `NI24-${new Date().getFullYear()}-001`);
  res = await post('/api/patrakar/press-id', { siteSlug: 'news-info-24' }, tNew);
  check('pathak press ID nahi le sakta', res.status === 403);
  res = await post('/api/payments/confirm', { kind: 'membership', paymentId: 'pay_TESTMEMBER00', siteId: 'the-provue-times' }, tRep);
  check('membership bina shartein maane band', res.status === 400);
  res = await post('/api/payments/confirm', { kind: 'membership', paymentId: 'pay_TESTMEMBER01', siteId: 'the-provue-times', termsAccepted: true }, tRep);
  const repDoc = (await db.doc(`reporters/rp_${REP}`).get()).data();
  const tx1 = (await db.doc('membership_transactions/pay_TESTMEMBER01').get()).data();
  check('membership ₹999 sirf The Provue Times ke liye, 1 saal', res.ok && !!repDoc?.memberships?.['the-provue-times']?.expiresAt && !repDoc?.memberships?.['the-local-leader'] && tx1?.amount === 999 && tx1?.siteId === 'the-provue-times' && tx1?.termsAccepted === true);

  // 5b. Advertiser: bhugtan ke baad hi request (server banata hai, status pending)
  const tAdv = await idToken(`ph_${ADV}`, { phone: ADV });
  const adBase = { title: '2 BHK बिकाऊ', category: 'प्रॉपर्टी / ज़मीन', city: 'महू', siteId: 'the-local-leader' };
  res = await post('/api/payments/confirm', { kind: 'ad', paymentId: 'pay_TESTAD001', ad: { ...adBase, format: 'classified' } }, tAdv);
  r = await res.json();
  const cl = (await db.doc('classifieds/pay_TESTAD001').get()).data();
  check('classified bhugtan → pending request', res.ok && cl?.status === 'pending' && cl?.amountPaid === 51 && cl?.days === 30 && cl?.advertiserPhone === ADV && cl?.advertiserName === 'Test Shop', JSON.stringify(r));
  res = await post('/api/payments/confirm', { kind: 'ad', paymentId: 'pay_TESTAD001', ad: { ...adBase, format: 'classified' } }, tAdv);
  check('wahi payment dobara → naya ad nahi', (await res.json()).already === true);
  res = await post('/api/payments/confirm', { kind: 'ad', paymentId: 'pay_TESTAD002', ad: { ...adBase, format: 'banner' } }, tAdv);
  check('banner bina image band', res.status === 400);
  res = await post('/api/payments/confirm', { kind: 'ad', paymentId: 'pay_TESTAD003', ad: { ...adBase, format: 'banner', imageUrl: 'https://x.com/b.jpg', targetUrl: 'javascript:alert(1)' } }, tAdv);
  const bn = (await db.doc('ads/pay_TESTAD003').get()).data();
  check('banner bhugtan → pending, ₹999 / 1 saal, nakli link saaf', res.ok && bn?.status === 'pending' && bn?.amountPaid === 999 && bn?.days === 365 && bn?.targetUrl === '#');
  const VID = 'https://firebasestorage.googleapis.com/v0/b/x/o/ad-media%2F9844444444%2F1.mp4?alt=media&token=t';
  res = await post('/api/payments/confirm', { kind: 'ad', paymentId: 'pay_TESTAD007', ad: { ...adBase, format: 'sidebar', videoUrl: VID } }, tAdv);
  const vd = (await db.doc('ads/pay_TESTAD007').get()).data();
  check('video sidebar vigyapan (bina photo) → pending, video link', res.ok && vd?.status === 'pending' && vd?.videoUrl === VID && vd?.amountPaid === 999);
  res = await post('/api/payments/confirm', { kind: 'ad', paymentId: 'pay_TESTAD008', ad: { ...adBase, format: 'banner', videoUrl: 'javascript:alert(1)//x.mp4' } }, tAdv);
  check('nakli video link band', res.status === 400);
  res = await post('/api/payments/confirm', { kind: 'ad', paymentId: 'pay_TESTAD004', ad: { ...adBase, format: 'free' } }, tAdv);
  check('nakli format band', res.status === 400);
  res = await post('/api/payments/confirm', { kind: 'ad', paymentId: 'pay_TESTAD005', ad: { ...adBase, format: 'classified' } }, tNew);
  check('pathak vigyapan nahi bhej sakta', res.status === 403 && !(await db.doc('classifieds/pay_TESTAD005').get()).exists);
  res = await post('/api/payments/confirm', { kind: 'ad', paymentId: 'pay_TESTAD006', ad: { ...adBase, format: 'classified' } });
  check('bina login vigyapan band', res.status === 401);

  // 6. Verify page API (sirf public jaankari)
  r = await (await fetch(`${B}/api/verify-press?id=NI24-${new Date().getFullYear()}-001`)).json();
  check('verify: card ki jaankari, mobile nahi', r.found && r.name === 'Rep' && !JSON.stringify(r).includes(REP));

  // 7. Admin Firebase token bina session nahi
  res = await post('/api/admin/firebase-token', {});
  check('admin token bina admin login band', res.status === 401);

  // 8. E-paper PDF suraksha
  await db.doc('epaper/edExt').set({ siteId: 'the-local-leader', date: '2026-10-05', status: 'published', pdfUrl: 'https://cdn.example.com/paper.pdf', totalPages: 8 });
  res = await fetch(`${B}/api/epaper/file?id=edExt`);
  check('bina login PDF link nahi', res.status === 401);
  res = await fetch(`${B}/api/epaper/file?id=edExt`, { headers: { Authorization: `Bearer ${tRep}` } });
  check('bina subscription PDF link nahi', res.status === 403);
  res = await fetch(`${B}/api/epaper/file?id=edExt`, { headers: { Authorization: `Bearer ${tNew}` } });
  r = await res.json();
  check('subscriber ko PDF link', res.ok && r.url === 'https://cdn.example.com/paper.pdf');
  // Har portal ka alag subscription: Local Leader wala Bazar Karobar par nahi chalega
  await db.doc('epaper/edNI24').set({ siteId: 'bazar-karobar', date: '2026-10-05', status: 'published', pdfUrl: 'https://cdn.example.com/ni24.pdf', totalPages: 8 });
  res = await fetch(`${B}/api/epaper/file?id=edNI24&site=bazar-karobar`, { headers: { Authorization: `Bearer ${tNew}` } });
  check('Local Leader ka subscription Bazar Karobar par nahi', res.status === 403);
  res = await fetch(`${B}/api/epaper/file?id=edNI24&site=the-local-leader`, { headers: { Authorization: `Bearer ${tNew}` } });
  check('site badal kar bhi doosre portal ka e-paper nahi', res.status === 403);
  res = await post('/api/payments/confirm', { kind: 'epaper', paymentId: 'pay_TESTEPAPER03', planId: 'epaper_1_year', siteId: 'bazar-karobar' }, tNew);
  const niSub = (await db.doc('epaper_subscriptions/naya@x.com__bazar-karobar').get()).data();
  check('Bazar Karobar ka alag subscription (₹111)', res.ok && niSub?.status === 'active' && niSub?.amount === 111 && niSub?.siteId === 'bazar-karobar');
  res = await fetch(`${B}/api/epaper/file?id=edNI24&site=bazar-karobar`, { headers: { Authorization: `Bearer ${tNew}` } });
  check('Bazar Karobar subscription ke baad PDF', res.ok);
  // Bina e-paper wale portal (NEWS INFO 24) ka subscription alag nahi banta — The Local Leader ka hi
  res = await post('/api/payments/confirm', { kind: 'epaper', paymentId: 'pay_TESTEPAPER04', planId: 'epaper_1_month', siteId: 'news-info-24' }, tNew);
  check('NEWS INFO 24 (e-paper nahi) ka record nahi banta', res.ok && !(await db.doc('epaper_subscriptions/naya@x.com__news-info-24').get()).exists);
  // Admin login → purane editions surakshit
  res = await post('/api/admin/login', { email: 'tester@example.com', password: 'TestPass12345' });
  const cookie = (res.headers.get('set-cookie') || '').split(';')[0];
  res = await fetch(`${B}/api/admin/epaper-secure`, { method: 'POST', headers: { Cookie: cookie } });
  r = await res.json();
  check('admin: editions surakshit', res.ok && r.moved >= 1, JSON.stringify(r));
  const pubEd = (await db.doc('epaper/edExt').get()).data();
  const privEd = (await db.doc('epaper_files/edExt').get()).data();
  check('public doc me PDF link nahi, private me hai', !('pdfUrl' in pubEd) && pubEd.hasPdf === true && privEd?.pdfUrl === 'https://cdn.example.com/paper.pdf');
  res = await fetch(`${B}/api/epaper/file?id=edExt`, { headers: { Authorization: `Bearer ${tNew}` } });
  r = await res.json();
  check('surakshit hone ke baad bhi subscriber ko link', res.ok && r.url === 'https://cdn.example.com/paper.pdf');
  res = await fetch(`${B}/api/admin/epaper-secure`, { method: 'POST' });
  check('epaper-secure bina admin band', res.status === 401);
} catch (err) {
  fail++;
  console.log('FAIL exception', err);
} finally {
  server.kill();
  if (process.platform === 'win32') spawn('powershell', ['-NoProfile', '-Command', `Get-NetTCPConnection -LocalPort ${PORT} -State Listen -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }`]);
  console.log(`\n# pass ${pass}\n# fail ${fail}`);
  setTimeout(() => process.exit(fail ? 1 : 0), 1500);
}
