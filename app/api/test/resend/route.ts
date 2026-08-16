import { NextResponse } from 'next/server';
import { sendOtpEmail } from '@/lib/email';
import { env, hasEmailConfig } from '@/lib/env';

export async function GET() {
  return NextResponse.json({
    apiKeyConfigured: hasEmailConfig(),
    fromEmail: env.email.from,
  });
}

export async function POST(request: Request) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const checkOnly = searchParams.get('check') === 'true';

  const isConfigured = hasEmailConfig();
  const fromEmail = env.email.from;

  if (checkOnly) {
    return NextResponse.json({
      apiKeyConfigured: isConfigured,
      fromEmail: fromEmail,
    });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const to = body.to || 'delivered@resend.dev';

    console.log(`[DELT RESEND TEST] Testing email dispatch to ${to}...`);

    if (!isConfigured) {
      return NextResponse.json(
        {
          success: false,
          apiKeyConfigured: false,
          fromEmail: fromEmail,
          error: 'RESEND_API_KEY is not configured in .env.local',
        },
        { status: 400 }
      );
    }

    const result = await sendOtpEmail({
      to,
      otpCode: '123456',
      expiresInMinutes: 10,
      subject: 'DELT Resend Test',
    });

    if (!result.delivered) {
      return NextResponse.json(
        {
          success: false,
          apiKeyConfigured: true,
          fromEmail: fromEmail,
          error: result.error || 'Resend rejected the email',
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      apiKeyConfigured: true,
      emailId: result.messageId,
      recipient: to,
      from: fromEmail,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        error: err?.message || 'Unexpected error during test',
      },
      { status: 500 }
    );
  }
}
