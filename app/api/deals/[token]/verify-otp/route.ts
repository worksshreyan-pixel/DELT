import { NextResponse } from 'next/server';
import { verifyDealOtp } from '@/lib/otp';

let verifyRequestCount = 0;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
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

    verifyRequestCount++;
    const result = (await verifyDealOtp(token, email, otp)) as any;

    console.log(`[OTP_VERIFY]
traceId=${result.otpTraceId || 'unknown'}
dealId=${result.dealId || 'unknown'}
normalizedEmail=${email.trim().toLowerCase()}
lookupStarted=${result.lookupStarted || 'unknown'}
matchingRowFound=${result.matchingRowFound || false}
matchingRowId=${result.matchingRowId || 'none'}
matchingRowCreatedAt=${result.matchingRowCreatedAt || 'none'}
matchingRowExpiresAt=${result.matchingRowExpiresAt || 'none'}
matchingRowVerified=${result.matchingRowVerified || false}
matchingRowAttempts=${result.matchingRowAttempts || 0}
hashComparisonResult=${result.hashComparisonResult || false}
verificationResult=${result.verificationResult || 'unknown'}`);

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
