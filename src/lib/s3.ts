// SIRF SERVER — AWS S3 par upload ke liye presigned URL. Keys (S3_ACCESS_KEY_ID/SECRET) sirf server par.
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Copy-paste se aaye faltu space/newline/quotes hata do (warna "Invalid character in header" / 403)
const clean = (v: string | undefined) => String(v || '').replace(/[\r\n\t]/g, '').replace(/^['"\s]+|['"\s]+$/g, '');
const REGION = clean(process.env.S3_REGION) || 'ap-south-1';
const BUCKET = clean(process.env.S3_BUCKET) || 'goldenpearl-media';
const KEY_ID = clean(process.env.S3_ACCESS_KEY_ID);
const SECRET = clean(process.env.S3_SECRET_ACCESS_KEY);

export const s3Configured = () => !!(KEY_ID && SECRET && BUCKET);
export const s3PublicUrl = (key: string) => `https://${BUCKET}.s3.${REGION}.amazonaws.com/${key}`;

let client: S3Client | null = null;
function s3() {
  if (!client) client = new S3Client({ region: REGION, credentials: { accessKeyId: KEY_ID, secretAccessKey: SECRET } });
  return client;
}

/** Upload ke liye 2-min ka signed PUT URL + final public URL.
 * ContentType ko SIGN nahi karte (browser bhejega) — isse signature-mismatch wali aam dikkat nahi aati. */
export async function presignUpload(key: string, _contentType: string): Promise<{ url: string; publicUrl: string }> {
  const cmd = new PutObjectCommand({ Bucket: BUCKET, Key: key });
  const url = await getSignedUrl(s3(), cmd, { expiresIn: 120 });
  return { url, publicUrl: s3PublicUrl(key) };
}
