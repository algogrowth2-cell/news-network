import { NextResponse } from 'next/server';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';

// ASTHAYI diagnostic — server se S3 par ek test file. Asli AWS error dikhata hai. Baad me hata denge.
export async function GET() {
  const REGION = process.env.S3_REGION || 'ap-south-1';
  const BUCKET = process.env.S3_BUCKET || 'goldenpearl-media';
  const KEY_ID = process.env.S3_ACCESS_KEY_ID || '';
  const SECRET = process.env.S3_SECRET_ACCESS_KEY || '';
  const info: any = { region: REGION, bucket: BUCKET, hasKey: !!KEY_ID, keyIdPrefix: KEY_ID.slice(0, 4), hasSecret: !!SECRET };
  if (!KEY_ID || !SECRET) return NextResponse.json({ ok: false, step: 'env', ...info });
  try {
    const client = new S3Client({ region: REGION, credentials: { accessKeyId: KEY_ID, secretAccessKey: SECRET } });
    const key = `selftest/${Date.now()}.txt`;
    await client.send(new PutObjectCommand({ Bucket: BUCKET, Key: key, Body: 'hello from server', ContentType: 'text/plain' }));
    return NextResponse.json({ ok: true, wrote: key, publicUrl: `https://${BUCKET}.s3.${REGION}.amazonaws.com/${key}`, ...info });
  } catch (e: any) {
    return NextResponse.json({ ok: false, step: 'put', name: e?.name, message: e?.message, code: e?.Code || e?.$metadata?.httpStatusCode, ...info });
  }
}
