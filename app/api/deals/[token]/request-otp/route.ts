import { NextResponse } from 'next/server';
import { requestDealOtp } from '@/lib/otp';

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
    const { email } = body;

    if (!email || !email.trim()) {
      return NextResponse.json({ error: 'Email address is required.' }, { status: 400 });
    }

    const result = (await requestDealOtp(token, email)) as any;
    const requestSource = request.headers.get('user-agent') || 'unknown';

    console.log(`[OTP_REQUEST]
traceId=${result.otpTraceId || 'unknown'}
timestamp=${new Date().toISOString()}
dealId=${result.dealId || 'unknown'}
normalizedEmail=${email.trim().toLowerCase()}
requestSource=${requestSource}
success=${result.success}
databaseRowCreated=${result.databaseRowCreated || false}
databaseRowId=${result.databaseRowId || 'none'}`);

    if (!result.success) {
      const status = result.errType === 'DATABASE_INSERT_ERROR' ? 500 : 400;
      return NextResponse.json(
        { 
          error: result.error, 
          errType: result.errType,
          cooldownSeconds: result.cooldownSeconds 
        },
        { status }
      );
    }

    return NextResponse.json({
      success: true,
      emailSent: result.emailSent,
      simulated: result.simulated,
      message: result.emailSent
        ? 'A 6-digit verification code has been sent to your email.'
        : 'Verification code requested.',
    });
  } catch (error: any) {
    console.error('Error requesting OTP:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to request verification code.' },
      { status: 500 }
    );
  }
}
