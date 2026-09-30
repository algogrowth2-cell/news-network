// 2Factor SMS OTP (/api/auth/otp) ke client helpers — patrakar/advertiser login aur signup me use hote hain

export async function sendOtp(phone: string): Promise<{ ok: boolean; sessionId?: string; message: string }> {
  try {
    const res = await fetch('/api/auth/otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'send', phone })
    });
    const data = await res.json();
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
      body: JSON.stringify({ action: 'verify', sessionId, otp: otp.trim() })
    });
    const data = await res.json();
    return data.success ? { ok: true, message: 'OTP सत्यापित' } : { ok: false, message: data.message || 'गलत OTP दर्ज किया गया है।' };
  } catch {
    return { ok: false, message: 'सत्यापन के दौरान सर्वर त्रुटि, कृपया पुनः प्रयास करें।' };
  }
}
