// 2Factor SMS OTP (/api/auth/otp) ke client helpers — reader, patrakar, advertiser aur delete-account sab yahi use karte hain.
// OTP sahi hone par server ka Firebase token milta hai aur yahin sign-in ho jaata hai (Firestore rules isi pehchaan se chalte hain).
import { signInWithServerToken } from '@/lib/phoneAuth';

// sessionId → server ka signed ticket (number + session)
const tickets = new Map<string, string>();

export async function sendOtp(phone: string): Promise<{ ok: boolean; sessionId?: string; message: string }> {
  try {
    const res = await fetch('/api/auth/otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'send', phone })
    });
    const data = await res.json();
    if (data.success && data.ticket) tickets.set(data.sessionId, data.ticket);
    return data.success
      ? { ok: true, sessionId: data.sessionId, message: 'मोबाइल नंबर पर SMS द्वारा OTP भेज दिया गया है।' }
      : { ok: false, message: data.message || 'OTP भेजने में विफलता हुई।' };
  } catch {
    return { ok: false, message: 'सर्वर से संपर्क नहीं हो पाया, कृपया पुनः प्रयास करें।' };
  }
}

export async function verifyOtp(sessionId: string, otp: string): Promise<{ ok: boolean; message: string }> {
  try {
    const res = await fetch('/api/auth/otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'verify', sessionId, otp: otp.trim(), ticket: tickets.get(sessionId) || null })
    });
    const data = await res.json();
    if (!data.success) return { ok: false, message: data.message || 'गलत OTP दर्ज किया गया है।' };
    try {
      await signInWithServerToken(data.firebaseToken);
    } catch (err) {
      console.error('Firebase sign-in error:', err);
      return { ok: false, message: 'लॉगिन पूरा नहीं हो पाया, कृपया दोबारा OTP भेजें।' };
    }
    tickets.delete(sessionId);
    return { ok: true, message: 'OTP सत्यापित' };
  } catch {
    return { ok: false, message: 'सत्यापन के दौरान सर्वर त्रुटि, कृपया पुनः प्रयास करें।' };
  }
}
