import { NextResponse } from 'next/server';
import { requestSignupOtp } from '@/lib/otp';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, password } = body;

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Name, email, and password are required' }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
    }

    const result = await requestSignupOtp({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to send verification code.', cooldownSeconds: result.cooldownSeconds },
        { status: result.cooldownSeconds ? 429 : 400 }
      );
    }

    return NextResponse.json({
      success: true,
      cooldownSeconds: result.cooldownSeconds || 30,
      message: `Verification code sent to ${email.trim().toLowerCase()}`,
    });
  } catch (err: any) {
    console.error('[Signup Server Error]', err);
    return NextResponse.json({ error: 'Internal server error during signup' }, { status: 500 });
  }
}
