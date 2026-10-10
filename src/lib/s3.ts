// SIRF SERVER — AWS S3 par upload ke liye presigned URL. Keys (S3_ACCESS_KEY_ID/SECRET) sirf server par.
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const REGION = process.env.S3_REGION || 'ap-south-1';
const BUCKET = process.env.S3_BUCKET || 'goldenpearl-media';
const KEY_ID = process.env.S3_ACCESS_KEY_ID || '';
const SECRET = process.env.S3_SECRET_ACCESS_KEY || '';

export const s3Configured = () => !!(KEY_ID && SECRET && BUCKET);
export const s3PublicUrl = (key: string) => `https://${BUCKET}.s3.${REGION}.amazonaws.com/${key}`;

let client: S3Client | null = null;
function s3() {
  if (!client) client = new S3Client({ region: REGION, credentials: { accessKeyId: KEY_ID, secretAccessKey: SECRET } });
  return client;
}

/** Upload ke liye 2-min ka signed PUT URL + final public URL */
export async function presignUpload(key: string, contentType: string): Promise<{ url: string; publicUrl: string }> {
  const cmd = new PutObjectCommand({ Bucket: BUCKET, Key: key, ContentType: contentType });
  const url = await getSignedUrl(s3(), cmd, { expiresIn: 120 });
  return { url, publicUrl: s3PublicUrl(key) };
}
