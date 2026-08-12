// ==============================================================================
// DELT — Transactional Email Engine (Direct Resend API)
// ==============================================================================

import { env, hasEmailConfig } from '@/lib/env';

export interface DealInvitationEmailPayload {
  clientName: string;
  clientEmail: string;
  creatorName: string;
  dealTitle: string;
  dealPrice: number;
  dealCurrency: string;
  dealUrl: string;
}

export interface DealOtpEmailPayload {
  clientName: string;
  clientEmail: string;
  dealTitle: string;
  otpCode: string;
  expiresInMinutes: number;
}

export interface EmailSendResult {
  success: boolean;
  delivered: boolean;
  simulated?: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Sends a client invitation email with the secure canonical Deal URL.
 * Uses the Resend REST API directly with zero external dependencies.
 */
export async function sendDealInvitationEmail(
  payload: DealInvitationEmailPayload
): Promise<EmailSendResult> {
  const {
    clientName,
    clientEmail,
    creatorName,
    dealTitle,
    dealPrice,
    dealCurrency,
    dealUrl,
  } = payload;

  const formattedAmount = `${dealCurrency === 'INR' ? '₹' : dealCurrency + ' '}${dealPrice.toLocaleString('en-IN')}`;

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Deal from ${escapeHtml(creatorName)}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 32px 16px; color: #0f172a;">
  <div style="max-width: 560px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.05);">
    
    <!-- Header -->
    <div style="background-color: #0f172a; padding: 24px 32px; text-align: left;">
      <span style="font-size: 20px; font-weight: 700; letter-spacing: -0.5px; color: #ffffff;">DELT</span>
    </div>

    <!-- Body -->
    <div style="padding: 32px;">
      <h2 style="font-size: 20px; font-weight: 600; color: #0f172a; margin-top: 0; margin-bottom: 8px;">
        You have a new Deal from ${escapeHtml(creatorName)}
      </h2>
      <p style="font-size: 15px; line-height: 1.5; color: #475569; margin-top: 0; margin-bottom: 24px;">
        Hi ${escapeHtml(clientName)},<br><br>
        <strong>${escapeHtml(creatorName)}</strong> has created a private Deal workspace for you on DELT.
      </p>

      <!-- Deal Card -->
      <div style="background-color: #f1f5f9; border-radius: 8px; padding: 20px; margin-bottom: 28px; border: 1px solid #e2e8f0;">
        <div style="font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">
          Project
        </div>
        <div style="font-size: 16px; font-weight: 600; color: #0f172a; margin-bottom: 12px;">
          ${escapeHtml(dealTitle)}
        </div>
        <div style="font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">
          Total Amount
        </div>
        <div style="font-size: 18px; font-weight: 700; color: #0f172a;">
          ${formattedAmount}
        </div>
      </div>

      <p style="font-size: 14px; line-height: 1.5; color: #475569; margin-bottom: 28px;">
        Inside your private Deal workspace, you can review project details, communicate directly with the creator, negotiate pricing, make secure payment, and download verified deliverables.
      </p>

      <!-- CTA Button -->
      <div style="text-align: center; margin-bottom: 28px;">
        <a href="${dealUrl}" target="_blank" style="display: inline-block; background-color: #0f172a; color: #ffffff; font-size: 15px; font-weight: 600; text-decoration: none; padding: 14px 32px; border-radius: 8px; box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);">
          View Deal &rarr;
        </a>
      </div>

      <p style="font-size: 12px; color: #94a3b8; line-height: 1.4; margin-bottom: 0;">
        If you were not expecting this invitation, you can safely ignore this email. This private Deal link is intended solely for ${escapeHtml(clientEmail)}.
      </p>
    </div>

    <!-- Footer -->
    <div style="background-color: #f8fafc; padding: 16px 32px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8; text-align: center;">
      DELT · Private Transaction Platform for Independent Creators
    </div>

  </div>
</body>
</html>
`;

  if (!hasEmailConfig()) {
    console.info(`[Email Service - Dev Mode] Invitation simulated for ${clientEmail} -> ${dealUrl}`);
    return {
      success: true,
      delivered: false,
      simulated: true,
      error: 'Resend API key not configured in .env.local (simulated delivery in dev mode)',
    };
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.email.resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: env.email.from,
        to: [clientEmail],
        subject: `New Deal: "${dealTitle}" from ${creatorName}`,
        html: htmlContent,
      }),
    });

    const resJson = await res.json();

    if (!res.ok) {
      console.error('[Resend API Error]', resJson);
      return {
        success: false,
        delivered: false,
        error: resJson?.message || 'Failed to send invitation email',
      };
    }

    return {
      success: true,
      delivered: true,
      messageId: resJson?.id,
    };
  } catch (err: any) {
    console.error('[Email Send Error]', err);
    return {
      success: false,
      delivered: false,
      error: err?.message || 'Failed to send invitation email',
    };
  }
}

/**
 * Sends a real secure OTP verification email to the client.
 */
export async function sendDealOtpEmail(
  payload: DealOtpEmailPayload
): Promise<EmailSendResult> {
  const {
    clientName,
    clientEmail,
    dealTitle,
    otpCode,
    expiresInMinutes = 10,
  } = payload;

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Verification Code for ${escapeHtml(dealTitle)}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 32px 16px; color: #0f172a;">
  <div style="max-width: 560px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.05);">
    
    <!-- Header -->
    <div style="background-color: #0f172a; padding: 24px 32px; text-align: left;">
      <span style="font-size: 20px; font-weight: 700; letter-spacing: -0.5px; color: #ffffff;">DELT</span>
    </div>

    <!-- Body -->
    <div style="padding: 32px;">
      <h2 style="font-size: 20px; font-weight: 600; color: #0f172a; margin-top: 0; margin-bottom: 8px;">
        Your Workspace Verification Code
      </h2>
      <p style="font-size: 15px; line-height: 1.5; color: #475569; margin-top: 0; margin-bottom: 24px;">
        Hi ${escapeHtml(clientName)},<br><br>
        Use the following one-time code to access your private Deal workspace for <strong>${escapeHtml(dealTitle)}</strong>:
      </p>

      <!-- Code Box -->
      <div style="background-color: #f1f5f9; border-radius: 8px; padding: 24px; text-align: center; margin-bottom: 24px; border: 1px solid #e2e8f0;">
        <span style="font-family: monospace; font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #0f172a;">
          ${otpCode}
        </span>
      </div>

      <p style="font-size: 13px; line-height: 1.5; color: #64748b; margin-bottom: 24px;">
        This code is valid for <strong>${expiresInMinutes} minutes</strong> and can only be used once. Never share this code with anyone.
      </p>

      <p style="font-size: 12px; color: #94a3b8; line-height: 1.4; margin-bottom: 0;">
        If you did not request this verification code, you can safely ignore this message.
      </p>
    </div>

    <!-- Footer -->
    <div style="background-color: #f8fafc; padding: 16px 32px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8; text-align: center;">
      DELT · Private Transaction Platform
    </div>

  </div>
</body>
</html>
`;

  if (!hasEmailConfig()) {
    console.info(`[Email Service - Dev Mode] Verification OTP generated for ${clientEmail}: ${otpCode}`);
    return {
      success: true,
      delivered: false,
      simulated: true,
      error: 'Resend API key not configured in .env.local',
    };
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.email.resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: env.email.from,
        to: [clientEmail],
        subject: `Your Verification Code: ${otpCode} (DELT)`,
        html: htmlContent,
      }),
    });

    const resJson = await res.json();

    if (!res.ok) {
      console.error('[Resend OTP Error]', resJson);
      return {
        success: false,
        delivered: false,
        error: resJson?.message || 'Failed to send OTP email',
      };
    }

    return {
      success: true,
      delivered: true,
      messageId: resJson?.id,
    };
  } catch (err: any) {
    console.error('[Email Send Error]', err);
    return {
      success: false,
      delivered: false,
      error: err?.message || 'Failed to send OTP email',
    };
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
