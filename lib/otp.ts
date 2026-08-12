// ==============================================================================
// DELT — Server-Side Secure OTP Verification & Token Engine
// ==============================================================================

import crypto from 'crypto';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendDealOtpEmail } from '@/lib/email';

const OTP_SECRET = process.env.SUPABASE_SERVICE_ROLE_KEY || 'delt_otp_default_hmac_secret_key_2026';
const OTP_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes
const MAX_ATTEMPTS = 3;

/**
 * Computes a salted SHA-256 hash of an OTP code.
 */
function hashOtp(otp: string, dealId: string, email: string): string {
  return crypto
    .createHmac('sha256', OTP_SECRET)
    .update(`${otp}:${dealId}:${email.trim().toLowerCase()}`)
    .digest('hex');
}

export interface RequestOtpResult {
  success: boolean;
  emailSent: boolean;
  simulated: boolean;
  cooldownSeconds?: number;
  error?: string;
}

export interface VerifyOtpResult {
  valid: boolean;
  clientSessionToken?: string;
  deal?: any;
  error?: string;
}

/**
 * Requests a secure 6-digit OTP code for a Deal client.
 */
export async function requestDealOtp(
  dealToken: string,
  email: string
): Promise<RequestOtpResult> {
  const normalizedEmail = email.trim().toLowerCase();
  const admin = createAdminClient();

  // 1. Fetch deal by token
  const { data: deal, error: dealError } = await admin
    .from('deals')
    .select('*')
    .eq('token', dealToken)
    .maybeSingle();

  if (dealError || !deal) {
    return {
      success: false,
      emailSent: false,
      simulated: false,
      error: 'Deal not found or invalid link.',
    };
  }

  // 2. Verify email matches deal client_email
  const expectedEmail = (deal.client_email || '').trim().toLowerCase();
  if (normalizedEmail !== expectedEmail) {
    return {
      success: false,
      emailSent: false,
      simulated: false,
      error: 'This email address is not authorized for this private Deal workspace.',
    };
  }

  // 3. Rate limiting check (cooldown 60 seconds)
  const { data: recentOtps } = await admin
    .from('deal_otps')
    .select('created_at')
    .eq('deal_id', deal.id)
    .eq('email', normalizedEmail)
    .order('created_at', { ascending: false })
    .limit(1);

  if (recentOtps && recentOtps.length > 0) {
    const lastCreatedAt = new Date(recentOtps[0].created_at).getTime();
    const elapsedSeconds = Math.floor((Date.now() - lastCreatedAt) / 1000);
    if (elapsedSeconds < 60) {
      return {
        success: false,
        emailSent: false,
        simulated: false,
        cooldownSeconds: 60 - elapsedSeconds,
        error: `Please wait ${60 - elapsedSeconds} seconds before requesting a new code.`,
      };
    }
  }

  // 4. Generate cryptographically secure 6-digit OTP (e.g. 100000 - 999999)
  const randomOtp = crypto.randomInt(100000, 1000000).toString();
  const otpHash = hashOtp(randomOtp, deal.id, normalizedEmail);
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MS).toISOString();

  // 5. Save OTP record
  await admin.from('deal_otps').insert({
    deal_id: deal.id,
    email: normalizedEmail,
    otp_hash: otpHash,
    attempts: 0,
    verified: false,
    expires_at: expiresAt,
  });

  // 6. Send transactional email
  const emailRes = await sendDealOtpEmail({
    clientName: deal.client_name || 'Client',
    clientEmail: normalizedEmail,
    dealTitle: deal.title,
    otpCode: randomOtp,
    expiresInMinutes: 10,
  });

  return {
    success: true,
    emailSent: emailRes.delivered,
    simulated: Boolean(emailRes.simulated),
    error: emailRes.error,
  };
}

/**
 * Verifies the OTP code submitted by the client.
 */
export async function verifyDealOtp(
  dealToken: string,
  email: string,
  inputOtp: string
): Promise<VerifyOtpResult> {
  const normalizedEmail = email.trim().toLowerCase();
  const trimmedOtp = (inputOtp || '').trim();

  if (!trimmedOtp || trimmedOtp.length !== 6 || !/^\d{6}$/.test(trimmedOtp)) {
    return { valid: false, error: 'Please enter a valid 6-digit verification code.' };
  }

  const admin = createAdminClient();

  // 1. Fetch deal by token
  const { data: deal, error: dealError } = await admin
    .from('deals')
    .select('*')
    .eq('token', dealToken)
    .maybeSingle();

  if (dealError || !deal) {
    return { valid: false, error: 'Deal not found.' };
  }

  // 2. Fetch latest active unverified OTP record
  const { data: otpRecords, error: otpError } = await admin
    .from('deal_otps')
    .select('*')
    .eq('deal_id', deal.id)
    .eq('email', normalizedEmail)
    .eq('verified', false)
    .order('created_at', { ascending: false })
    .limit(1);

  if (otpError || !otpRecords || otpRecords.length === 0) {
    return {
      valid: false,
      error: 'No active verification code found. Please request a new code.',
    };
  }

  const otpRecord = otpRecords[0];

  // 3. Check expiration
  if (new Date(otpRecord.expires_at).getTime() < Date.now()) {
    return {
      valid: false,
      error: 'Verification code has expired. Please request a new code.',
    };
  }

  // 4. Check attempts
  if (otpRecord.attempts >= MAX_ATTEMPTS) {
    return {
      valid: false,
      error: 'Too many incorrect attempts. Please request a new verification code.',
    };
  }

  // 5. Compare hash with timing-safe comparison
  const expectedHash = otpRecord.otp_hash;
  const actualHash = hashOtp(trimmedOtp, deal.id, normalizedEmail);

  const expectedBuffer = Buffer.from(expectedHash, 'hex');
  const actualBuffer = Buffer.from(actualHash, 'hex');

  const matches =
    expectedBuffer.length === actualBuffer.length &&
    crypto.timingSafeEqual(expectedBuffer, actualBuffer);

  if (!matches) {
    // Increment attempts
    await admin
      .from('deal_otps')
      .update({ attempts: otpRecord.attempts + 1 })
      .eq('id', otpRecord.id);

    const remaining = MAX_ATTEMPTS - (otpRecord.attempts + 1);
    return {
      valid: false,
      error: remaining > 0
        ? `Incorrect verification code. ${remaining} attempt(s) remaining.`
        : 'Too many incorrect attempts. Please request a new verification code.',
    };
  }

  // 6. Mark OTP verified (Single-use invalidation)
  await admin
    .from('deal_otps')
    .update({ verified: true })
    .eq('id', otpRecord.id);

  // 7. Generate cryptographically signed Client Session Token
  const sessionPayload = {
    dealId: deal.id,
    dealToken: deal.token,
    clientEmail: normalizedEmail,
    verifiedAt: Date.now(),
    expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
  };

  const payloadJson = JSON.stringify(sessionPayload);
  const payloadB64 = Buffer.from(payloadJson).toString('base64url');
  const signature = crypto
    .createHmac('sha256', OTP_SECRET)
    .update(payloadB64)
    .digest('base64url');

  const clientSessionToken = `${payloadB64}.${signature}`;

  // Log client verified event
  await admin.from('deal_events').insert({
    deal_id: deal.id,
    type: 'client_verified',
    actor_id: normalizedEmail,
    actor_name: deal.client_name || 'Client',
    actor_role: 'client',
    description: `${deal.client_name || 'Client'} verified email access to the Deal workspace.`,
  });

  return {
    valid: true,
    clientSessionToken,
    deal,
  };
}

/**
 * Validates a signed Client Session Token.
 */
export function verifyClientSessionToken(
  tokenString: string,
  dealToken: string,
  clientEmail: string
): boolean {
  if (!tokenString || !tokenString.includes('.')) return false;

  const [payloadB64, signature] = tokenString.split('.');
  if (!payloadB64 || !signature) return false;

  const expectedSignature = crypto
    .createHmac('sha256', OTP_SECRET)
    .update(payloadB64)
    .digest('base64url');

  const sigBuffer = Buffer.from(signature);
  const expBuffer = Buffer.from(expectedSignature);

  if (sigBuffer.length !== expBuffer.length || !crypto.timingSafeEqual(sigBuffer, expBuffer)) {
    return false;
  }

  try {
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf-8'));
    if (payload.dealToken !== dealToken) return false;
    if (payload.clientEmail?.toLowerCase() !== clientEmail.trim().toLowerCase()) return false;
    if (payload.expiresAt < Date.now()) return false;
    return true;
  } catch {
    return false;
  }
}
