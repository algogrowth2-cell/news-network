// Admin password ka surakshit hash banata hai (password kahin save/print nahi hota, sirf hash).
// Chalayein:  node scripts/hash-admin-password.mjs admin@example.com
// Output ki line ko Vercel → Settings → Environment Variables me ADMIN_CREDENTIALS ke roop me daalein
// (kai admin ho toh comma se jodein). Saath me ADMIN_SESSION_SECRET bhi yahi script deti hai.
import { randomBytes, scryptSync } from 'node:crypto';
import { createInterface } from 'node:readline';
import { Writable } from 'node:stream';

const email = (process.argv[2] || '').trim().toLowerCase();
if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  console.error('Usage: node scripts/hash-admin-password.mjs admin@example.com');
  process.exit(1);
}

// Password type karte waqt screen par na dikhe
let muted = false;
const out = new Writable({ write: (chunk, enc, cb) => (muted ? cb() : process.stdout.write(chunk, enc, cb)) });
const rl = createInterface({ input: process.stdin, output: out, terminal: true });

const ask = (q) =>
  new Promise((resolve) => {
    process.stdout.write(q);
    muted = true;
    rl.question('', (a) => {
      muted = false;
      process.stdout.write('\n');
      resolve(a);
    });
  });

const pw = await ask('Naya admin password (kam se kam 12 akshar): ');
const pw2 = await ask('Password dobara: ');
rl.close();

if (pw !== pw2) {
  console.error('Dono password alag hain.');
  process.exit(1);
}
if (pw.length < 12 || !/[A-Za-z]/.test(pw) || !/[0-9]/.test(pw)) {
  console.error('Password kam se kam 12 akshar ka ho, aur usme akshar aur ank dono hon.');
  process.exit(1);
}

const N = 16384;
const salt = randomBytes(16);
const hash = scryptSync(pw, salt, 32, { N, r: 8, p: 1 });
console.log('\nADMIN_CREDENTIALS (is email ka hissa):');
console.log(`${email}:scrypt$${N}$${salt.toString('base64')}$${hash.toString('base64')}`);
console.log('\nADMIN_SESSION_SECRET (sirf ek baar banayein, sab admins ke liye ek hi):');
console.log(randomBytes(48).toString('base64url'));
