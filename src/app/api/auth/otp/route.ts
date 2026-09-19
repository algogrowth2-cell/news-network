import { NextResponse } from 'next/server';

const TWO_FACTOR_API_KEY = 'aa7deb54-b3ef-11f1-af74-0200cd936042';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, phone, sessionId, otp } = body;

    // 1. SEND STRICT TEXT SMS OTP (USING 2FACTOR DLT OTP1 TEMPLATE)
    if (action === 'send') {
      if (!phone || phone.length < 10) {
        return NextResponse.json(
          { success: false, message: 'कृपया 10 अंकों का सही मोबाइल नंबर दर्ज करें।' },
          { status: 400 }
        );
      }

      const cleanPhone = phone.replace(/[^0-9]/g, '').slice(-10);

      // 2Factor DLT Pre-Approved Template Endpoint (Guaranteed Text SMS)
      const url = `https://2factor.in/API/V1/${TWO_FACTOR_API_KEY}/SMS/+91${cleanPhone}/AUTOGEN/OTP1`;

      const res = await fetch(url, { method: 'GET' });
      const data = await res.json();

      if (data.Status === 'Success') {
        return NextResponse.json({
          success: true,
          sessionId: data.Details, // Session ID returned by 2Factor
          message: 'मोबाइल पर Text SMS द्वारा OTP भेज दिया गया है।'
        });
      } else {
        return NextResponse.json(
          { success: false, message: data.Details || 'OTP भेजने में विफलता हुई।' },
          { status: 400 }
        );
      }
    }

    // 2. VERIFY OTP VIA 2FACTOR ENGINE
    if (action === 'verify') {
      if (!sessionId || !otp) {
        return NextResponse.json(
          { success: false, message: 'Session ID या OTP अनुपलब्ध है।' },
          { status: 400 }
        );
      }

      const cleanOtp = String(otp).trim();
      const verifyUrl = `https://2factor.in/API/V1/${TWO_FACTOR_API_KEY}/SMS/VERIFY/${sessionId}/${cleanOtp}`;

      const res = await fetch(verifyUrl, { method: 'GET' });
      const data = await res.json();

      if (
        data.Status === 'Success' &&
        (data.Details === 'OTP Matched' || String(data.Details).includes('Match'))
      ) {
        return NextResponse.json({
          success: true,
          message: 'OTP सफलतापूर्वक सत्यापित हुआ।'
        });
      } else {
        return NextResponse.json(
          { success: false, message: 'गलत OTP दर्ज किया गया है। कृपया पुनः प्रयास करें।' },
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