import { NextResponse } from 'next/server';

const FAST2SMS_API_KEY = 'wAoYu8jRgpms3U9HibQqJWd6NS2kGZrC51EzMvPXa4B0ye7TLtPgUEkAzXhxFYTH1RiNdryuf0GoLZ5j';

const otpStorage = new Map<string, { otp: string; expires: number }>();

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, phone, sessionId, otp } = body;

    if (action === 'send') {
      if (!phone || phone.length < 10) {
        return NextResponse.json(
          { success: false, message: 'Kripya 10 ankon ka sahi mobile number darj karein.' },
          { status: 400 }
        );
      }

      const cleanPhone = phone.replace(/[^0-9]/g, '').slice(-10);
      const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();

      // Fast2SMS standard OTP route payload
      const response = await fetch('https://www.fast2sms.com/dev/bulkV2', {
        method: 'POST',
        headers: {
          'authorization': FAST2SMS_API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          route: 'otp',
          variables_values: generatedOtp,
          numbers: cleanPhone
        })
      });

      const data = await response.json();

      if (data.return === true || data.status_code === 200 || data.message?.includes('successful')) {
        const sessionKey = 'F2S_' + cleanPhone + '_' + Date.now();
        otpStorage.set(sessionKey, {
          otp: generatedOtp,
          expires: Date.now() + 5 * 60 * 1000
        });

        return NextResponse.json({
          success: true,
          sessionId: sessionKey,
          message: 'Mobile number par Text SMS dwara OTP bhej diya gaya hai.'
        });
      }

      // Quick SMS route fallback if route 'otp' requires specific approval
      const quickRes = await fetch('https://www.fast2sms.com/dev/bulkV2', {
        method: 'POST',
        headers: {
          'authorization': FAST2SMS_API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          route: 'q',
          message: `Aapka verification OTP code hai: ${generatedOtp}`,
          language: 'english',
          flash: 0,
          numbers: cleanPhone
        })
      });

      const quickData = await quickRes.json();

      if (quickData.return === true || quickData.status_code === 200) {
        const sessionKey = 'F2S_' + cleanPhone + '_' + Date.now();
        otpStorage.set(sessionKey, {
          otp: generatedOtp,
          expires: Date.now() + 5 * 60 * 1000
        });

        return NextResponse.json({
          success: true,
          sessionId: sessionKey,
          message: 'Mobile number par Text SMS dwara OTP bhej diya gaya hai.'
        });
      }

      const errMsg = Array.isArray(data.message) ? data.message[0] : (data.message || quickData.message || 'SMS send fail hua');
      return NextResponse.json({ success: false, message: String(errMsg) }, { status: 400 });
    }

    if (action === 'verify') {
      if (!sessionId || !otp) {
        return NextResponse.json(
          { success: false, message: 'Session ID ya OTP anupalabdh hai.' },
          { status: 400 }
        );
      }

      const cleanOtp = String(otp).trim();
      const record = otpStorage.get(sessionId);

      if (!record) {
        return NextResponse.json(
          { success: false, message: 'OTP session expired ya invalid hai.' },
          { status: 400 }
        );
      }

      if (Date.now() > record.expires) {
        otpStorage.delete(sessionId);
        return NextResponse.json(
          { success: false, message: 'OTP ki samay seema (expire) samapt ho chuki hai.' },
          { status: 400 }
        );
      }

      if (record.otp === cleanOtp) {
        otpStorage.delete(sessionId);
        return NextResponse.json({
          success: true,
          message: 'OTP saphalta-purvak satyapit hua.'
        });
      }

      return NextResponse.json(
        { success: false, message: 'Galat OTP darj kiya gaya hai.' },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: false, message: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Server error' },
      { status: 500 }
    );
  }
}