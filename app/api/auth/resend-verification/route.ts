import { NextResponse } from 'next/server';
import { requestSignupOtp } from '@/lib/otp';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const result = await requestSignupOtp({
      email: email.trim().toLowerCase(),
      name: 'Creator',
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to resend verification code.', cooldownSeconds: result.cooldownSeconds },
        { status: result.cooldownSeconds ? 429 : 400 }
      );
    }

    return NextResponse.json({
      success: true,
      cooldownSeconds: result.cooldownSeconds || 30,
      message: `Verification code resent to ${email.trim().toLowerCase()}`,
    });
  } catch (err: any) {
    console.error('[Resend Verification Server Error]', err);
    return NextResponse.json({ error: 'Failed to resend verification code' }, { status: 500 });
  }
}
