import { NextResponse } from 'next/server';

// Aapki 2Factor API Key
const TWOFACTOR_API_KEY = 'aa7deb54-b3ef-11f1-af74-0200cd936042';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, phone, otp, sessionId } = body;

    // 1. SEND OTP (Direct Text SMS Route)
    if (action === 'send') {
      if (!phone || phone.length < 10) {
        return NextResponse.json(
          { success: false, message: 'Kripya 10 ankon ka sahi mobile number darj karein.' },
          { status: 400 }
        );
      }

      const cleanPhone = phone.replace(/[^0-9]/g, '').slice(-10);

      // 2Factor Direct Text SMS Endpoint (AUTOGEN template)
      const url = `https://2factor.in/API/V1/${TWOFACTOR_API_KEY}/SMS/${cleanPhone}/AUTOGEN/OTP1`;

      const res = await fetch(url, { method: 'GET' });
      const data = await res.json();

      if (data.Status === 'Success') {
        return NextResponse.json({
          success: true,
          sessionId: data.Details, // 2Factor verification ke liye Session ID return karta hai
          message: 'OTP safaltapoorvak SMS dwara bhej diya gaya hai.'
        });
      } else {
        return NextResponse.json(
          { success: false, message: data.Details || 'OTP bhejne me vifalta hui.' },
          { status: 400 }
        );
      }
    }

    // 2. VERIFY OTP
    if (action === 'verify') {
      if (!sessionId || !otp) {
        return NextResponse.json(
          { success: false, message: 'Session ID ya OTP uplabdh nahi hai.' },
          { status: 400 }
        );
      }

      const cleanOtp = String(otp).trim();

      // 2Factor Verify Endpoint
      const verifyUrl = `https://2factor.in/API/V1/${TWOFACTOR_API_KEY}/SMS/VERIFY/${sessionId}/${cleanOtp}`;

      const res = await fetch(verifyUrl, { method: 'GET' });
      const data = await res.json();

      if (data.Status === 'Success' && data.Details === 'OTP Matched') {
        return NextResponse.json({
          success: true,
          message: 'OTP safaltapoorvak satyapit hua.'
        });
      } else {
        return NextResponse.json(
          { success: false, message: data.Details || 'Galat OTP darj kiya gaya hai.' },
          { status: 400 }
        );
      }
    }

    return NextResponse.json({ success: false, message: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Server Error' },
      { status: 500 }
    );
  }
}