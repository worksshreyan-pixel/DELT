import { NextResponse } from 'next/server';
import { verifyDealOtp } from '@/lib/otp';
import { cookies } from 'next/headers';

let verifyRequestCount = 0;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    if (!code) {
      return NextResponse.json({ error: 'Deal code is required.' }, { status: 400 });
    }

    const body = await request.json();
    const { email, otp } = body;

    if (!email || !email.trim()) {
      return NextResponse.json({ error: 'Email address is required.' }, { status: 400 });
    }

    if (!otp || !otp.trim()) {
      return NextResponse.json({ error: 'Verification code is required.' }, { status: 400 });
    }

    verifyRequestCount++;
    const result = (await verifyDealOtp(code, email, otp)) as any;

    if (!result.valid) {
      return NextResponse.json(
        { error: result.error || 'Invalid verification code.' },
        { status: 401 }
      );
    }

    // Set the HttpOnly cookie
    if (result.rawSessionToken) {
      const cookieStore = await cookies();
      cookieStore.set(`delt_client_session`, result.rawSessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 7 * 24 * 60 * 60, // 7 days
      });
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
