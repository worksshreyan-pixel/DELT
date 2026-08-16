import { NextResponse } from 'next/server';
import { verifySignupOtp } from '@/lib/otp';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, otp } = body;

    if (!email || !otp) {
      return NextResponse.json({ error: 'Email and verification code are required.' }, { status: 400 });
    }

    const result = await verifySignupOtp({
      email: email.trim().toLowerCase(),
      otp: otp.trim(),
    });

    if (!result.valid) {
      return NextResponse.json({ error: result.error || 'Incorrect code. Please try again.' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: 'Email verified',
    });
  } catch (err: any) {
    console.error('[Signup OTP Verify Error]', err);
    return NextResponse.json({ error: 'Verification failed. Please try again.' }, { status: 500 });
  }
}
