import { NextResponse } from 'next/server';

const TWO_FACTOR_API_KEY = 'aa7deb54-b3ef-11f1-af74-0200cd936042';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, phone, sessionId, otp } = body;

    // 1. SEND TEXT SMS OTP
    if (action === 'send') {
      if (!phone || phone.length < 10) {
        return NextResponse.json({ success: false, message: 'कृपया 10 अंकों का सही मोबाइल नंबर दर्ज करें।' }, { status: 400 });
      }

      const cleanPhone = phone.replace(/[^0-9]/g, '').slice(-10);
      const url = `https://2factor.in/API/V1/${TWO_FACTOR_API_KEY}/SMS/+91${cleanPhone}/AUTOGEN`;

      const res = await fetch(url, { method: 'GET' });
      const data = await res.json();

      if (data.Status === 'Success') {
        return NextResponse.json({ success: true, sessionId: data.Details, message: 'OTP आपके मोबाइल पर SMS द्वारा भेज दिया गया है।' });
      } else {
        return NextResponse.json({ success: false, message: data.Details || 'OTP भेजने में समस्या आई।' }, { status: 400 });
      }
    }

    // 2. VERIFY TEXT SMS OTP
    if (action === 'verify') {
      if (!sessionId || !otp) {
        return NextResponse.json({ success: false, message: 'Session ID या OTP अनुपलब्ध है।' }, { status: 400 });
      }

      const cleanOtp = String(otp).trim();
      const url = `https://2factor.in/API/V1/${TWO_FACTOR_API_KEY}/SMS/VERIFY/${sessionId}/${cleanOtp}`;

      const res = await fetch(url, { method: 'GET' });
      const data = await res.json();

      if (data.Status === 'Success' && (data.Details === 'OTP Matched' || data.Details.includes('Match'))) {
        return NextResponse.json({ success: true, message: 'OTP सफलतापूर्वक सत्यापित हुआ।' });
      } else {
        return NextResponse.json({ success: false, message: 'गलत OTP दर्ज किया गया है।' }, { status: 400 });
      }
    }

    return NextResponse.json({ success: false, message: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message || 'सर्वर एरर' }, { status: 500 });
  }
}