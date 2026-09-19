import { NextResponse } from 'next/server';

const TWO_FACTOR_API_KEY = 'aa7deb54-b3ef-11f1-af74-0200cd936042';

// In-memory OTP cache for verification (Fast and avoids voice fallback completely)
const otpStore = new Map<string, { otp: string; expires: number }>();

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, phone, sessionId, otp } = body;

    // 1. STRICT TEXT SMS OTP
    if (action === 'send') {
      if (!phone || phone.length < 10) {
        return NextResponse.json(
          { success: false, message: 'कृपया 10 अंकों का सही मोबाइल नंबर दर्ज करें।' },
          { status: 400 }
        );
      }

      const cleanPhone = phone.replace(/[^0-9]/g, '').slice(-10);
      
      // Random 6 Digit OTP Generate
      const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();

      // 2Factor Direct Text SMS Endpoint (Force SMS Only)
      const smsUrl = `https://2factor.in/API/V1/${TWO_FACTOR_API_KEY}/SMS/${cleanPhone}/${generatedOtp}`;

      const res = await fetch(smsUrl, { method: 'GET' });
      const data = await res.json();

      if (data.Status === 'Success') {
        const sessionKey = data.Details || 'SES_' + Date.now();
        // Save OTP locally for 5 minutes validity
        otpStore.set(sessionKey, {
          otp: generatedOtp,
          expires: Date.now() + 5 * 60 * 1000
        });

        return NextResponse.json({
          success: true,
          sessionId: sessionKey,
          message: 'आपके मोबाइल नंबर पर Text SMS द्वारा OTP भेज दिया गया है।'
        });
      } else {
        return NextResponse.json(
          { success: false, message: data.Details || 'SMS भेजने में त्रुटि हुई।' },
          { status: 400 }
        );
      }
    }

    // 2. VERIFY SMS OTP
    if (action === 'verify') {
      if (!sessionId || !otp) {
        return NextResponse.json(
          { success: false, message: 'Session ID या OTP अनुपलब्ध है।' },
          { status: 400 }
        );
      }

      const cleanOtp = String(otp).trim();
      const cached = otpStore.get(sessionId);

      // Check local cache first
      if (cached) {
        if (Date.now() > cached.expires) {
          otpStore.delete(sessionId);
          return NextResponse.json({ success: false, message: 'OTP की समय सीमा समाप्त हो चुकी है।' }, { status: 400 });
        }
        if (cached.otp === cleanOtp) {
          otpStore.delete(sessionId);
          return NextResponse.json({ success: true, message: 'OTP सफलतापूर्वक सत्यापित हुआ।' });
        }
      }

      // Fallback 2Factor Server Verification
      const verifyUrl = `https://2factor.in/API/V1/${TWO_FACTOR_API_KEY}/SMS/VERIFY/${sessionId}/${cleanOtp}`;
      const res = await fetch(verifyUrl, { method: 'GET' });
      const data = await res.json();

      if (data.Status === 'Success' && (data.Details === 'OTP Matched' || String(data.Details).includes('Match'))) {
        return NextResponse.json({ success: true, message: 'OTP सफलतापूर्वक सत्यापित हुआ।' });
      }

      return NextResponse.json(
        { success: false, message: 'गलत OTP दर्ज किया गया है।' },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: false, message: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message || 'Server Error' }, { status: 500 });
  }
}