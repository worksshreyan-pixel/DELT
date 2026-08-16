// ==============================================================================
// DELT — Transactional Email Engine (Resend Direct REST API)
// Production-ready email delivery with branded responsive HTML templates
// ==============================================================================

import { env, hasEmailConfig } from '@/lib/env';

export interface SendOtpEmailPayload {
  to: string;
  otpCode: string;
  expiresInMinutes?: number;
  subject?: string;
  clientName?: string;
  dealTitle?: string;
}

export interface DealInvitationEmailPayload {
  clientName: string;
  clientEmail: string;
  creatorName: string;
  dealTitle: string;
  dealDescription?: string;
  dealPrice: number;
  dealCurrency: string;
  dealUrl: string;
}

export interface PaymentConfirmationEmailPayload {
  recipientName: string;
  recipientEmail: string;
  creatorName: string;
  dealTitle: string;
  amount: number;
  currency: string;
  transactionId: string;
  isCreator: boolean;
  dealUrl: string;
}

export interface DeliverablesUploadedEmailPayload {
  clientName: string;
  clientEmail: string;
  creatorName: string;
  dealTitle: string;
  versionNumber: number;
  fileNames?: string[];
  dealUrl: string;
}

export interface DealCompletionEmailPayload {
  recipientName: string;
  recipientEmail: string;
  creatorName: string;
  dealTitle: string;
  dealUrl: string;
}

export interface ProposalStatusEmailPayload {
  recipientName: string;
  recipientEmail: string;
  responderName: string;
  dealTitle: string;
  price: number;
  currency: string;
  accepted: boolean;
  dealUrl: string;
}

export interface EmailSendResult {
  success: boolean;
  delivered: boolean;
  simulated?: boolean;
  messageId?: string;
  error?: string;
}

// ------------------------------------------------------------------------------
// Core Email Dispatcher
// ------------------------------------------------------------------------------
async function sendRawEmail(params: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}): Promise<EmailSendResult> {
  const { to, subject, html, text } = params;
  const fromAddress = env.email.from;

  console.log(`[DELT EMAIL]`);
  console.log(`recipient: ${to}`);
  console.log(`from: ${fromAddress}`);
  console.log(`provider: Resend`);

  if (to.endsWith('@example.com') && process.env.NODE_ENV !== 'production') {
    console.log(`[DELT EMAIL SIMULATION] Simulated delivery to ${to}`);
    return {
      success: true,
      delivered: true,
      simulated: true,
      messageId: `sim-${crypto.randomUUID()}`
    };
  }

  if (!hasEmailConfig()) {
    const msg = 'RESEND_API_KEY is missing or unconfigured in .env.local';
    console.error(`[DELT EMAIL ERROR] ${msg}`);
    return {
      success: false,
      delivered: false,
      simulated: false,
      error: msg,
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
        from: fromAddress,
        to: [to],
        subject,
        html,
        text: text || undefined,
      }),
    });

    const resJson = await res.json();

    if (!res.ok) {
      console.error(`[DELT EMAIL ERROR] Status ${res.status}:`, resJson);
      return {
        success: false,
        delivered: false,
        error: resJson?.message || `Resend delivery failed (status ${res.status})`,
      };
    }

    console.log(`[DELT EMAIL SUCCESS] id: ${resJson?.id}`);

    return {
      success: true,
      delivered: true,
      messageId: resJson?.id,
    };
  } catch (err: any) {
    console.error('[DELT EMAIL NETWORK ERROR]', err);
    return {
      success: false,
      delivered: false,
      error: err?.message || 'Network error connecting to Resend API',
    };
  }
}

// ------------------------------------------------------------------------------
// 1. Unified 6-Digit OTP Verification Email (Creator Signup & Client Deal Access)
// ------------------------------------------------------------------------------
export async function sendOtpEmail(
  payload: SendOtpEmailPayload
): Promise<EmailSendResult> {
  const {
    to,
    otpCode,
    expiresInMinutes = 10,
    subject = 'Your DELT verification code',
  } = payload;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(subject)}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 32px 16px; color: #0f172a;">
  <div style="max-width: 520px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.05);">
    
    <!-- Header -->
    <div style="background-color: #0f172a; padding: 24px 32px; text-align: left;">
      <span style="font-size: 20px; font-weight: 700; letter-spacing: -0.5px; color: #ffffff;">DELT</span>
    </div>

    <!-- Body -->
    <div style="padding: 32px;">
      <h2 style="font-size: 18px; font-weight: 600; color: #0f172a; margin-top: 0; margin-bottom: 8px;">
        Your DELT verification code
      </h2>
      <p style="font-size: 15px; line-height: 1.5; color: #475569; margin-top: 0; margin-bottom: 20px;">
        Your DELT verification code is:
      </p>

      <!-- Code Box -->
      <div style="background-color: #f1f5f9; border-radius: 8px; padding: 20px; text-align: center; margin-bottom: 20px; border: 1px solid #e2e8f0;">
        <span style="font-family: -apple-system, BlinkMacSystemFont, monospace; font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #0f172a;">
          ${otpCode}
        </span>
      </div>

      <p style="font-size: 13px; line-height: 1.5; color: #64748b; margin-bottom: 20px;">
        This code expires in <strong>${expiresInMinutes} minutes</strong>.
      </p>

      <p style="font-size: 12px; color: #94a3b8; line-height: 1.4; margin-bottom: 0;">
        If you did not request this code, you can ignore this email.
      </p>
    </div>

    <!-- Footer -->
    <div style="background-color: #f8fafc; padding: 14px 28px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8; text-align: center;">
      DELT · Private Transaction Platform
    </div>

  </div>
</body>
</html>
`;

  const text = `Your DELT verification code is:\n\n${otpCode}\n\nThis code expires in ${expiresInMinutes} minutes.\n\nIf you did not request this code, you can ignore this email.\n\nDELT`;

  return sendRawEmail({
    to,
    subject,
    html,
    text,
  });
}

/**
 * Backward compatibility wrapper for client deal OTP emails.
 */
export async function sendDealOtpEmail(
  payload: { clientName?: string; clientEmail: string; dealTitle?: string; otpCode: string; expiresInMinutes?: number }
): Promise<EmailSendResult> {
  return sendOtpEmail({
    to: payload.clientEmail,
    otpCode: payload.otpCode,
    expiresInMinutes: payload.expiresInMinutes || 10,
    subject: 'Your DELT verification code',
  });
}

// ------------------------------------------------------------------------------
// 2. Client Deal Invitation Email
// ------------------------------------------------------------------------------
export async function sendDealInvitationEmail(
  payload: DealInvitationEmailPayload
): Promise<EmailSendResult> {
  const {
    clientName,
    clientEmail,
    creatorName,
    dealTitle,
    dealDescription,
    dealPrice,
    dealCurrency,
    dealUrl,
  } = payload;

  const formattedAmount = `${dealCurrency === 'INR' ? '₹' : dealCurrency + ' '}${dealPrice.toLocaleString('en-IN')}`;

  const html = `
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
      <div style="background-color: #f1f5f9; border-radius: 8px; padding: 20px; margin-bottom: 24px; border: 1px solid #e2e8f0;">
        <div style="font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">
          Project
        </div>
        <div style="font-size: 16px; font-weight: 600; color: #0f172a; margin-bottom: 12px;">
          ${escapeHtml(dealTitle)}
        </div>
        ${
          dealDescription
            ? `<div style="font-size: 13px; color: #475569; margin-bottom: 14px; line-height: 1.4;">
                ${escapeHtml(dealDescription)}
              </div>`
            : ''
        }
        <div style="font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">
          Agreed Amount
        </div>
        <div style="font-size: 18px; font-weight: 700; color: #0f172a;">
          ${formattedAmount}
        </div>
      </div>

      <p style="font-size: 14px; line-height: 1.5; color: #475569; margin-bottom: 28px;">
        Inside your private Deal workspace, you can review project details, communicate directly with the creator, negotiate pricing, make secure payment, and download verified deliverables.
      </p>

      <!-- CTA Button -->
      <div style="text-align: center; margin-bottom: 24px;">
        <a href="${dealUrl}" target="_blank" style="display: inline-block; background-color: #0f172a; color: #ffffff; font-size: 15px; font-weight: 600; text-decoration: none; padding: 14px 32px; border-radius: 8px; box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);">
          Open Deal Workspace &rarr;
        </a>
      </div>

      <!-- Plain Text Fallback Link -->
      <p style="font-size: 12px; color: #64748b; word-break: break-all; margin-bottom: 28px;">
        Or copy and paste this link in your browser:<br>
        <a href="${dealUrl}" style="color: #2563eb; text-decoration: underline;">${dealUrl}</a>
      </p>

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

  const text = `Hi ${clientName},\n\n${creatorName} has created a private Deal workspace for you on DELT for "${dealTitle}" (${formattedAmount}).\n\nOpen your deal here:\n${dealUrl}\n\nDELT`;

  return sendRawEmail({
    to: clientEmail,
    subject: `New Deal: "${dealTitle}" from ${creatorName}`,
    html,
    text,
  });
}

// ------------------------------------------------------------------------------
// 3. Payment Confirmation Email
// ------------------------------------------------------------------------------
export async function sendPaymentConfirmationEmail(
  payload: PaymentConfirmationEmailPayload
): Promise<EmailSendResult> {
  const {
    recipientName,
    recipientEmail,
    creatorName,
    dealTitle,
    amount,
    currency,
    transactionId,
    isCreator,
    dealUrl,
  } = payload;

  const formattedAmount = `${currency === 'INR' ? '₹' : currency + ' '}${amount.toLocaleString('en-IN')}`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payment Confirmed — ${escapeHtml(dealTitle)}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 32px 16px; color: #0f172a;">
  <div style="max-width: 560px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.05);">
    
    <div style="background-color: #0f172a; padding: 24px 32px; text-align: left;">
      <span style="font-size: 20px; font-weight: 700; letter-spacing: -0.5px; color: #ffffff;">DELT</span>
    </div>

    <div style="padding: 32px;">
      <div style="display: inline-block; background-color: #ecfdf5; color: #059669; font-size: 12px; font-weight: 600; padding: 4px 10px; border-radius: 9999px; margin-bottom: 12px;">
        Payment Successful
      </div>
      <h2 style="font-size: 20px; font-weight: 600; color: #0f172a; margin-top: 0; margin-bottom: 8px;">
        ${isCreator ? `Payment Received from ${escapeHtml(recipientName)}` : `Payment Confirmed for ${escapeHtml(dealTitle)}`}
      </h2>
      <p style="font-size: 15px; line-height: 1.5; color: #475569; margin-top: 0; margin-bottom: 24px;">
        ${
          isCreator
            ? `Great news! Your client has successfully completed the payment of <strong>${formattedAmount}</strong> for <strong>${escapeHtml(dealTitle)}</strong>.`
            : `Thank you, ${escapeHtml(recipientName)}. Your payment of <strong>${formattedAmount}</strong> to <strong>${escapeHtml(creatorName)}</strong> has been verified. All project deliverable files are now unlocked.`
        }
      </p>

      <!-- Receipt Box -->
      <div style="background-color: #f8fafc; border-radius: 8px; padding: 20px; margin-bottom: 24px; border: 1px solid #e2e8f0;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
          <span style="font-size: 13px; color: #64748b;">Transaction ID:</span>
          <span style="font-size: 13px; font-weight: 600; color: #0f172a; font-family: monospace;">${transactionId}</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
          <span style="font-size: 13px; color: #64748b;">Amount Paid:</span>
          <span style="font-size: 13px; font-weight: 700; color: #0f172a;">${formattedAmount}</span>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span style="font-size: 13px; color: #64748b;">Status:</span>
          <span style="font-size: 13px; font-weight: 600; color: #059669;">Verified & Unlocked</span>
        </div>
      </div>

      <div style="text-align: center; margin-bottom: 24px;">
        <a href="${dealUrl}" target="_blank" style="display: inline-block; background-color: #0f172a; color: #ffffff; font-size: 15px; font-weight: 600; text-decoration: none; padding: 14px 32px; border-radius: 8px;">
          ${isCreator ? 'View Deal Workspace &rarr;' : 'Download Deliverables &rarr;'}
        </a>
      </div>
    </div>

    <div style="background-color: #f8fafc; padding: 16px 32px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8; text-align: center;">
      DELT · Private Transaction Platform
    </div>

  </div>
</body>
</html>
`;

  return sendRawEmail({
    to: recipientEmail,
    subject: `Payment Confirmed: ${formattedAmount} for "${dealTitle}"`,
    html,
  });
}

// ------------------------------------------------------------------------------
// 4. Deliverables Uploaded Notification Email
// ------------------------------------------------------------------------------
export async function sendDeliverablesUploadedEmail(
  payload: DeliverablesUploadedEmailPayload
): Promise<EmailSendResult> {
  const {
    clientName,
    clientEmail,
    creatorName,
    dealTitle,
    versionNumber,
    fileNames = [],
    dealUrl,
  } = payload;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Deliverables Uploaded</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 32px 16px; color: #0f172a;">
  <div style="max-width: 560px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden;">
    
    <div style="background-color: #0f172a; padding: 24px 32px;">
      <span style="font-size: 20px; font-weight: 700; color: #ffffff;">DELT</span>
    </div>

    <div style="padding: 32px;">
      <h2 style="font-size: 20px; font-weight: 600; color: #0f172a; margin-top: 0;">
        New Deliverables Uploaded (Version ${versionNumber})
      </h2>
      <p style="font-size: 15px; line-height: 1.5; color: #475569;">
        Hi ${escapeHtml(clientName)},<br><br>
        <strong>${escapeHtml(creatorName)}</strong> has uploaded a new version of project files for <strong>${escapeHtml(dealTitle)}</strong>.
      </p>

      ${
        fileNames.length > 0
          ? `<div style="background-color: #f1f5f9; border-radius: 8px; padding: 16px; margin: 20px 0; border: 1px solid #e2e8f0;">
              <div style="font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase; margin-bottom: 8px;">Uploaded Files</div>
              <ul style="margin: 0; padding-left: 20px; font-size: 13px; color: #0f172a;">
                ${fileNames.map((f) => `<li style="margin-bottom: 4px;">${escapeHtml(f)}</li>`).join('')}
              </ul>
            </div>`
          : ''
      }

      <div style="text-align: center; margin: 24px 0;">
        <a href="${dealUrl}" target="_blank" style="display: inline-block; background-color: #0f172a; color: #ffffff; font-size: 15px; font-weight: 600; text-decoration: none; padding: 14px 32px; border-radius: 8px;">
          Review Deliverables &rarr;
        </a>
      </div>
    </div>

    <div style="background-color: #f8fafc; padding: 16px 32px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8; text-align: center;">
      DELT · Private Transaction Platform
    </div>

  </div>
</body>
</html>
`;

  return sendRawEmail({
    to: clientEmail,
    subject: `New Deliverables Uploaded (v${versionNumber}) for "${dealTitle}"`,
    html,
  });
}

// ------------------------------------------------------------------------------
// 5. Deal Completion Email
// ------------------------------------------------------------------------------
export async function sendDealCompletionEmail(
  payload: DealCompletionEmailPayload
): Promise<EmailSendResult> {
  const { recipientName, recipientEmail, creatorName, dealTitle, dealUrl } = payload;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Deal Completed — ${escapeHtml(dealTitle)}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 32px 16px; color: #0f172a;">
  <div style="max-width: 560px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden;">
    
    <div style="background-color: #0f172a; padding: 24px 32px;">
      <span style="font-size: 20px; font-weight: 700; color: #ffffff;">DELT</span>
    </div>

    <div style="padding: 32px;">
      <h2 style="font-size: 20px; font-weight: 600; color: #0f172a; margin-top: 0;">
        🎉 Deal Completed Successfully!
      </h2>
      <p style="font-size: 15px; line-height: 1.5; color: #475569;">
        Hi ${escapeHtml(recipientName)},<br><br>
        The Deal workspace for <strong>${escapeHtml(dealTitle)}</strong> with <strong>${escapeHtml(creatorName)}</strong> has been marked completed! All deliverable approvals and payments have concluded.
      </p>

      <div style="text-align: center; margin: 28px 0;">
        <a href="${dealUrl}" target="_blank" style="display: inline-block; background-color: #0f172a; color: #ffffff; font-size: 15px; font-weight: 600; text-decoration: none; padding: 14px 32px; border-radius: 8px;">
          Access Deal Archive &rarr;
        </a>
      </div>
    </div>

    <div style="background-color: #f8fafc; padding: 16px 32px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8; text-align: center;">
      DELT · Private Transaction Platform
    </div>

  </div>
</body>
</html>
`;

  return sendRawEmail({
    to: recipientEmail,
    subject: `Deal Completed: "${dealTitle}"`,
    html,
  });
}

// ------------------------------------------------------------------------------
// 6. Proposal Status Email (Accepted / Declined)
// ------------------------------------------------------------------------------
export async function sendProposalStatusEmail(
  payload: ProposalStatusEmailPayload
): Promise<EmailSendResult> {
  const {
    recipientName,
    recipientEmail,
    responderName,
    dealTitle,
    price,
    currency,
    accepted,
    dealUrl,
  } = payload;

  const formattedAmount = `${currency === 'INR' ? '₹' : currency + ' '}${price.toLocaleString('en-IN')}`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Price Proposal ${accepted ? 'Accepted' : 'Declined'}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 32px 16px; color: #0f172a;">
  <div style="max-width: 560px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden;">
    
    <div style="background-color: #0f172a; padding: 24px 32px;">
      <span style="font-size: 20px; font-weight: 700; color: #ffffff;">DELT</span>
    </div>

    <div style="padding: 32px;">
      <div style="display: inline-block; background-color: ${accepted ? '#ecfdf5' : '#fef2f2'}; color: ${accepted ? '#059669' : '#dc2626'}; font-size: 12px; font-weight: 600; padding: 4px 10px; border-radius: 9999px; margin-bottom: 12px;">
        Proposal ${accepted ? 'Accepted' : 'Declined'}
      </div>
      <h2 style="font-size: 20px; font-weight: 600; color: #0f172a; margin-top: 0;">
        ${accepted ? `Price Agreement Reached: ${formattedAmount}` : `Price Proposal Declined`}
      </h2>
      <p style="font-size: 15px; line-height: 1.5; color: #475569;">
        Hi ${escapeHtml(recipientName)},<br><br>
        <strong>${escapeHtml(responderName)}</strong> has <strong>${accepted ? 'accepted' : 'declined'}</strong> the price proposal of <strong>${formattedAmount}</strong> for <strong>${escapeHtml(dealTitle)}</strong>.
      </p>

      <div style="text-align: center; margin: 28px 0;">
        <a href="${dealUrl}" target="_blank" style="display: inline-block; background-color: #0f172a; color: #ffffff; font-size: 15px; font-weight: 600; text-decoration: none; padding: 14px 32px; border-radius: 8px;">
          View Deal Workspace &rarr;
        </a>
      </div>
    </div>

    <div style="background-color: #f8fafc; padding: 16px 32px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8; text-align: center;">
      DELT · Private Transaction Platform
    </div>

  </div>
</body>
</html>
`;

  return sendRawEmail({
    to: recipientEmail,
    subject: `Price Proposal ${accepted ? 'Accepted' : 'Declined'}: ${formattedAmount} for "${dealTitle}"`,
    html,
  });
}

function escapeHtml(str: string): string {
  return (str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
