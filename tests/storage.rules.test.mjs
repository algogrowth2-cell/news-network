// Storage rules test — emulator par:
//   npx firebase emulators:exec --only storage --project demo-gpn "node --test tests/storage.rules.test.mjs"
import { readFileSync } from 'node:fs';
import { after, before, test } from 'node:test';
import { assertFails, assertSucceeds, initializeTestEnvironment } from '@firebase/rules-unit-testing';
import { getBytes, ref, uploadBytes } from 'firebase/storage';

let env;
const PDF = new Uint8Array([37, 80, 68, 70]); // "%PDF"
const IMG = new Uint8Array([137, 80, 78, 71]);
const pdfPath = 'epapers/the-local-leader/2026-10-05/pdf/1-paper.pdf';
const thumbPath = 'epapers/the-local-leader/2026-10-05/thumbnails/1-cover.png';

before(async () => {
  env = await initializeTestEnvironment({ projectId: 'demo-gpn', storage: { rules: readFileSync('storage.rules', 'utf8'), host: '127.0.0.1', port: 9199 } });
  await env.withSecurityRulesDisabled(async (ctx) => {
    await uploadBytes(ref(ctx.storage(), pdfPath), PDF, { contentType: 'application/pdf' });
    await uploadBytes(ref(ctx.storage(), thumbPath), IMG, { contentType: 'image/png' });
  });
});
after(async () => env?.cleanup());

const anon = () => env.unauthenticatedContext().storage();
const reader = () => env.authenticatedContext('ph_9876543210', { phone: '9876543210' }).storage();
const admin = () => env.authenticatedContext('admin_x', { admin: true }).storage();

test('e-paper PDF koi seedha download nahi kar sakta (sirf server ka signed link)', async () => {
  await assertFails(getBytes(ref(anon(), pdfPath)));
  await assertFails(getBytes(ref(reader(), pdfPath)));
  await assertSucceeds(getBytes(ref(admin(), pdfPath)));
});
test('e-paper cover photo sabko dikhe', async () => {
  await assertSucceeds(getBytes(ref(anon(), thumbPath)));
});
test('upload sirf admin', async () => {
  await assertFails(uploadBytes(ref(reader(), 'epapers/x/2026-10-05/pdf/hack.pdf'), PDF, { contentType: 'application/pdf' }));
  await assertFails(uploadBytes(ref(anon(), 'articles/2026-10/hack.png'), IMG, { contentType: 'image/png' }));
  await assertSucceeds(uploadBytes(ref(admin(), 'articles/2026-10/ok.png'), IMG, { contentType: 'image/png' }));
  await assertFails(uploadBytes(ref(admin(), 'articles/2026-10/virus.exe'), IMG, { contentType: 'application/x-msdownload' }));
});
test('khabron ki photo sabko dikhe', async () => {
  await assertSucceeds(getBytes(ref(anon(), 'articles/2026-10/ok.png')));
});
test('admin purani file mita sake, pathak nahi', async () => {
  const { deleteObject } = await import('firebase/storage');
  await assertFails(deleteObject(ref(reader(), thumbPath)));
  await assertSucceeds(deleteObject(ref(admin(), thumbPath)));
});

const VID = new Uint8Array([0, 0, 0, 24, 102, 116, 121, 112]); // "ftyp"
test('vigyapan GIF/video: sirf apne mobile ke folder me, sirf GIF/MP4/WebM, sabko dikhe', async () => {
  const me = '9876543210';
  await assertSucceeds(uploadBytes(ref(reader(), `ad-media/${me}/1-a.mp4`), VID, { contentType: 'video/mp4' }));
  await assertSucceeds(uploadBytes(ref(reader(), `ad-media/${me}/2-a.gif`), IMG, { contentType: 'image/gif' }));
  await assertFails(uploadBytes(ref(reader(), `ad-media/9999999999/3-a.mp4`), VID, { contentType: 'video/mp4' }));
  await assertFails(uploadBytes(ref(anon(), `ad-media/${me}/4-a.mp4`), VID, { contentType: 'video/mp4' }));
  await assertFails(uploadBytes(ref(reader(), `ad-media/${me}/5-a.exe`), VID, { contentType: 'application/x-msdownload' }));
  await assertFails(uploadBytes(ref(reader(), `ad-media/${me}/6-big.mp4`), new Uint8Array(21 * 1024 * 1024), { contentType: 'video/mp4' }));
  await assertSucceeds(uploadBytes(ref(admin(), 'ad-media/admin/7-a.webm'), VID, { contentType: 'video/webm' }));
  await assertSucceeds(getBytes(ref(anon(), `ad-media/${me}/1-a.mp4`)));
});

test('patrakar ki khabar ki photo: sirf apne mobile ke folder me, sirf photo', async () => {
  const me = '9876543210';
  await assertSucceeds(uploadBytes(ref(reader(), `reporter-media/${me}/1.jpg`), IMG, { contentType: 'image/jpeg' }));
  await assertFails(uploadBytes(ref(reader(), `reporter-media/9999999999/2.jpg`), IMG, { contentType: 'image/jpeg' }));
  await assertFails(uploadBytes(ref(reader(), `reporter-media/${me}/3.mp4`), IMG, { contentType: 'video/mp4' }));
  await assertSucceeds(getBytes(ref(anon(), `reporter-media/${me}/1.jpg`)));
});
