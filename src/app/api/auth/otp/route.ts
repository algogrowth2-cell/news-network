import { NextResponse } from 'next/server';

const FAST2SMS_API_KEY = 'wAoYu8jRgpms3U9HibQqJWd6NS2kGZrC51EzMvPXa4B0ye7TLtPgUEkAzXhxFYTH1RiNdryuf0GoLZ5j';

const otpStorage = new Map<string, { otp: string; expires: number }>();

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, phone, sessionId, otp } = body;

    // 1. SEND TEXT SMS OTP VIA QUICK SMS (NO WEBSITE VERIFICATION REQUIRED)
    if (action === 'send') {
      if (!phone || phone.length < 10) {
        return NextResponse.json(
          { success: false, message: 'कृपया 10 अंकों का सही मोबाइल नंबर दर्ज करें।' },
          { status: 400 }
        );
      }

      const cleanPhone = phone.replace(/[^0-9]/g, '').slice(-10);
      const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();

      // Using Quick SMS 'q' route which does not require website or DLT verification
      const response = await fetch('https://www.fast2sms.com/dev/bulkV2', {
        method: 'POST',
        headers: {
          'authorization': FAST2SMS_API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          route: 'q',
          message: `Your verification code is ${generatedOtp}. Valid for 5 minutes.`,
          language: 'english',
          flash: 0,
          numbers: cleanPhone
        })
      });

      const data = await response.json();

      if (data.return === true || data.status_code === 200) {
        const sessionKey = 'F2S_' + cleanPhone + '_' + Date.now();
        otpStorage.set(sessionKey, {
          otp: generatedOtp,
          expires: Date.now() + 5 * 60 * 1000
        });

        return NextResponse.json({
          success: true,
          sessionId: sessionKey,
          message: 'मोबाइल पर Text SMS द्वारा OTP भेज दिया गया है।'
        });
      } else {
        const err = Array.isArray(data.message) ? data.message[0] : (data.message || 'SMS भेजने में विफलता हुई।');
        return NextResponse.json({ success: false, message: String(err) }, { status: 400 });
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
      const record = otpStorage.get(sessionId);

      if (!record) {
        return NextResponse.json(
          { success: false, message: 'OTP सत्र अमान्य या समाप्त हो चुका है।' },
          { status: 400 }
        );
      }

      if (Date.now() > record.expires) {
        otpStorage.delete(sessionId);
        return NextResponse.json(
          { success: false, message: 'OTP की समय सीमा समाप्त (Expired) हो चुकी है।' },
          { status: 400 }
        );
      }

      if (record.otp === cleanOtp) {
        otpStorage.delete(sessionId);
        return NextResponse.json({
          success: true,
          message: 'OTP सफलतापूर्वक सत्यापित हुआ।'
        });
      }

      return NextResponse.json(
        { success: false, message: 'गलत OTP दर्ज किया गया है।' },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: false, message: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Server Error' },
      { status: 500 }
    );
  }
}