import { NextResponse } from 'next/server';
import { verifyDealOtp } from '@/lib/otp';

export async function POST(
  request: Request,
  { params }: { params: { token: string } }
) {
  try {
    const token = params.token;
    if (!token) {
      return NextResponse.json({ error: 'Deal token is required.' }, { status: 400 });
    }

    const body = await request.json();
    const { email, otp } = body;

    if (!email || !email.trim()) {
      return NextResponse.json({ error: 'Email address is required.' }, { status: 400 });
    }

    if (!otp || !otp.trim()) {
      return NextResponse.json({ error: 'Verification code is required.' }, { status: 400 });
    }

    const result = await verifyDealOtp(token, email, otp);

    if (!result.valid) {
      return NextResponse.json(
        { error: result.error || 'Invalid verification code.' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      authorized: true,
      clientSessionToken: result.clientSessionToken,
      deal: result.deal,
    });
  } catch (error: any) {
    console.error('Error verifying OTP:', error);
    return NextResponse.json(
      { error: error?.message || 'Verification failed.' },
      { status: 500 }
    );
  }
}
