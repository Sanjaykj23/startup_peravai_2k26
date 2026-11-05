import { NextRequest, NextResponse } from 'next/server';

// In-memory OTP storage for simulation
const otpStore = new Map<string, { otp: string; expires: number }>();

export async function POST(req: NextRequest) {
  try {
    const { action, phone, otp } = await req.json();

    if (!phone || phone.length < 10) {
      return NextResponse.json({ error: 'Valid 10-digit mobile number is required' }, { status: 400 });
    }

    const cleanPhone = phone.replace(/\D/g, '').slice(-10);

    if (action === 'send') {
      // Generate 4-digit OTP (e.g., 1234 in development / test)
      const generatedOtp = cleanPhone === '9876543210' ? '1234' : Math.floor(1000 + Math.random() * 9000).toString();
      otpStore.set(cleanPhone, {
        otp: generatedOtp,
        expires: Date.now() + 5 * 60 * 1000 // 5 minutes
      });

      return NextResponse.json({
        success: true,
        message: `OTP sent successfully to +91 ${cleanPhone}`,
        // Included in response for seamless automated testing / demo convenience
        demoOtp: generatedOtp
      });
    }

    if (action === 'verify') {
      if (!otp) {
        return NextResponse.json({ error: 'OTP is required' }, { status: 400 });
      }

      const stored = otpStore.get(cleanPhone);
      // Allow '1234' as universal master test OTP
      const isValid = (stored && stored.otp === otp && stored.expires > Date.now()) || otp === '1234';

      if (!isValid) {
        return NextResponse.json({ error: 'Invalid or expired OTP' }, { status: 400 });
      }

      otpStore.delete(cleanPhone);

      return NextResponse.json({
        success: true,
        passenger: {
          phone: cleanPhone,
          token: `mtc_pass_${cleanPhone}_${Date.now()}`
        }
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'OTP verification error' }, { status: 500 });
  }
}
