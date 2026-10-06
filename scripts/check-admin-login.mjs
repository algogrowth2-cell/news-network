// Admin login ki jaanch (sirf aapke computer par, kuch upload nahi hota):
//   node scripts/check-admin-login.mjs
// Vercel me daali ADMIN_CREDENTIALS value paste karein, phir email aur password — script batayegi kahan gadbad hai.
import { scryptSync, timingSafeEqual } from 'node:crypto';
import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';

const rl = createInterface({ input: stdin, output: stdout });
const cleanEnv = (v) => String(v || '').trim().replace(/^['"]+|['"]+$/g, '');

console.log('\nVercel → Settings → Environment Variables → ADMIN_CREDENTIALS ki value poori copy karke yahan paste karein:');
const credRaw = await rl.question('> ');
const email = (await rl.question('\nLogin page par jo email daal rahe hain: ')).trim().toLowerCase();
console.log('\n(Password abhi DIKHEGA — aas-paas koi na ho. Jaanch ke baad terminal band kar dein.)');
const password = await rl.question('Login page par jo password daal rahe hain: ');
rl.close();

const map = new Map();
for (const raw of cleanEnv(credRaw).split(/[,;]+/)) {
  const part = raw.replace(/\s+/g, '').replace(/^['"]+|['"]+$/g, '');
  const i = part.indexOf(':');
  if (i > 0) map.set(part.slice(0, i).toLowerCase(), part.slice(i + 1));
}

console.log('\n---- Nateeja ----');
if (!map.size) {
  console.log('❌ ADMIN_CREDENTIALS sahi format me nahi. Ye "email:scrypt$16384$...$..." jaisa hona chahiye.');
  console.log('   Dobara banayein: node scripts/hash-admin-password.mjs ' + (email || 'aapka@email.com'));
  process.exit(1);
}
console.log('Value me ye admin email mile:', [...map.keys()].join(', '));
const stored = map.get(email);
if (!stored) {
  console.log(`❌ "${email}" is value me nahi hai. Login par upar wala email hi daalein, ya is email se script dobara chalayein.`);
  process.exit(1);
}
const [algo, nStr, saltB64, hashB64] = stored.split('$');
if (algo !== 'scrypt' || !saltB64 || !hashB64) {
  console.log('❌ Hash adhoora/toota hua hai (copy karte waqt kuch chhoot gaya). Script dobara chala kar poori line copy karein.');
  process.exit(1);
}
const expected = Buffer.from(hashB64, 'base64');
const actual = scryptSync(password, Buffer.from(saltB64, 'base64'), expected.length, { N: Number(nStr) || 16384, r: 8, p: 1 });
if (actual.length === expected.length && timingSafeEqual(actual, expected)) {
  console.log('✅ Email aur password is value se MEL KHATE hain.');
  console.log('   Agar fir bhi login nahi ho raha: Vercel me yahi value Production me save karke "Redeploy" karein (env badalne ke baad redeploy zaroori).');
} else {
  const trimmedOk = password !== password.trim() && (() => {
    const a = scryptSync(password.trim(), Buffer.from(saltB64, 'base64'), expected.length, { N: Number(nStr) || 16384, r: 8, p: 1 });
    return timingSafeEqual(a, expected);
  })();
  if (trimmedOk) console.log('⚠️ Password ke aage/peeche SPACE hai. Login par bina space ke daalein.');
  else console.log('❌ Password is value se mel NAHI khata. Script banate waqt koi aur password type hua tha.\n   Hal: node scripts/hash-admin-password.mjs ' + email + '  (naya password) → nayi line Vercel me → Redeploy.');
}
