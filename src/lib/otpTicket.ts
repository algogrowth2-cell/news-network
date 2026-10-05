// SIRF SERVER. OTP session ko mobile number se baandhta hai (signed ticket) —
// taaki koi apne number ka OTP dekar kisi aur number ka login/token na le sake.
import { createHmac, timingSafeEqual } from 'node:crypto';

const TTL_MS = 10 * 60 * 1000;

function secret() {
  const s = process.env.OTP_TICKET_SECRET || process.env.ADMIN_SESSION_SECRET || '';
  if (s.length < 32) throw new Error('OTP_TICKET_SECRET / ADMIN_SESSION_SECRET set nahi hai');
  return s;
}

export function signOtpTicket(phone: string, sessionId: string) {
  const payload = Buffer.from(JSON.stringify({ p: phone, s: sessionId, e: Date.now() + TTL_MS })).toString('base64url');
  const sig = createHmac('sha256', secret()).update(payload).digest('base64url');
  return `${payload}.${sig}`;
}

export function readOtpTicket(ticket: string | undefined | null): { phone: string; sessionId: string } | null {
  if (!ticket || !ticket.includes('.')) return null;
  try {
    const [payload, sig] = ticket.split('.');
    const expected = createHmac('sha256', secret()).update(payload).digest();
    const got = Buffer.from(sig, 'base64url');
    if (got.length !== expected.length || !timingSafeEqual(got, expected)) return null;
    const d = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (!d?.p || !d?.s || d.e < Date.now()) return null;
    return { phone: d.p, sessionId: d.s };
  } catch {
    return null;
  }
}

export const ticketsConfigured = () => (process.env.OTP_TICKET_SECRET || process.env.ADMIN_SESSION_SECRET || '').length >= 32;
