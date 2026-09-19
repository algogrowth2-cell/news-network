import { NextResponse } from 'next/server';

const TWO_FACTOR_API_KEY = 'aa7deb54-b3ef-11f1-af74-0200cd936042';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, phone, sessionId, otp } = body;

    // 1. STRICT TEXT SMS OTP
    if (action === 'send') {
      if (!phone || phone.length < 10) {
        return NextResponse.json({ success: false, message: 'Kripya 10 ankon ka mobile number darj karein.' }, { status: 400 });
      }

      const cleanPhone = phone.replace(/[^0-9]/g, '').slice(-10);
      // 2Factor Text SMS endpoint
      const url = `https://2factor.in/API/V1/${TWO_FACTOR_API_KEY}/SMS/+91${cleanPhone}/AUTOGEN/OTP1`;

      const res = await fetch(url, { method: 'GET' });
      const data = await res.json();

      if (data.Status === 'Success') {
        return NextResponse.json({ success: true, sessionId: data.Details, message: 'SMS dwara OTP bhej diya gaya hai.' });
      } else {
        return NextResponse.json({ success: false, message: data.Details || 'OTP bhejne me samasya aayi.' }, { status: 400 });
      }
    }

    // 2. VERIFY OTP
    if (action === 'verify') {
      if (!sessionId || !otp) {
        return NextResponse.json({ success: false, message: 'Session ID ya OTP missing hai.' }, { status: 400 });
      }

      const cleanOtp = String(otp).trim();
      const url = `https://2factor.in/API/V1/${TWO_FACTOR_API_KEY}/SMS/VERIFY/${sessionId}/${cleanOtp}`;

      const res = await fetch(url, { method: 'GET' });
      const data = await res.json();

      if (data.Status === 'Success' && (data.Details === 'OTP Matched' || String(data.Details).includes('Match'))) {
        return NextResponse.json({ success: true, message: 'OTP saphalta-purvak satyapit hua.' });
      } else {
        return NextResponse.json({ success: false, message: 'Galat OTP darj kiya gaya hai.' }, { status: 400 });
      }
    }

    return NextResponse.json({ success: false, message: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message || 'Server Error' }, { status: 500 });
  }
}