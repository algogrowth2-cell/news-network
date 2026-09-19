import { NextResponse } from 'next/server';

const MSG91_AUTH_KEY = '572914AuoT3izr6aae5b41P1';
const MSG91_WIDGET_ID = '366973693478393033383538';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, phone, otp, reqId } = body;

    // 1. SEND OTP (MSG91 Widget API - WhatsApp first with fallback)
    if (action === 'send') {
      if (!phone || phone.length < 10) {
        return NextResponse.json(
          { success: false, message: 'कृपया 10 अंकों का सही मोबाइल नंबर दर्ज करें।' },
          { status: 400 }
        );
      }

      const cleanPhone = phone.replace(/[^0-9]/g, '').slice(-10);

      // MSG91 Send OTP Endpoint
      const url = `https://control.msg91.com/api/v5/widget/sendOtp`;
      
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'authkey': MSG91_AUTH_KEY
        },
        body: JSON.stringify({
          widgetId: MSG91_WIDGET_ID,
          identifier: `91${cleanPhone}`
        })
      });

      const data = await res.json();

      if (data.type === 'success' || data.status === 'success') {
        return NextResponse.json({
          success: true,
          reqId: data.message, // MSG91 returns request id / message reference
          message: 'OTP आपके WhatsApp / मोबाइल पर भेज दिया गया है।'
        });
      } else {
        return NextResponse.json(
          { success: false, message: data.message || 'OTP भेजने में विफलता हुई।' },
          { status: 400 }
        );
      }
    }

    // 2. VERIFY OTP
    if (action === 'verify') {
      if (!phone || !otp) {
        return NextResponse.json(
          { success: false, message: 'मोबाइल नंबर या OTP अनुपलब्ध है।' },
          { status: 400 }
        );
      }

      const cleanPhone = phone.replace(/[^0-9]/g, '').slice(-10);
      const cleanOtp = String(otp).trim();

      // MSG91 Verify OTP Endpoint
      const verifyUrl = `https://control.msg91.com/api/v5/widget/verifyOtp`;

      const res = await fetch(verifyUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'authkey': MSG91_AUTH_KEY
        },
        body: JSON.stringify({
          widgetId: MSG91_WIDGET_ID,
          identifier: `91${cleanPhone}`,
          otp: cleanOtp,
          reqId: reqId || undefined
        })
      });

      const data = await res.json();

      if (data.type === 'success' || data.message === 'OTP verified success' || data.status === 'success') {
        return NextResponse.json({
          success: true,
          message: 'OTP सफलतापूर्वक सत्यापित हुआ।'
        });
      } else {
        return NextResponse.json(
          { success: false, message: data.message || 'गलत OTP दर्ज किया गया है।' },
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