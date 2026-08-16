// ==============================================================================
// DELT — Server-Side Secure OTP Verification & Token Engine
// Database-backed OTP engine for Client Deal Access & Creator Signup Verification
// ==============================================================================

import crypto from 'crypto';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendOtpEmail } from '@/lib/email';
import { parseDescription } from '@/lib/utils';

const OTP_SECRET = process.env.SUPABASE_SERVICE_ROLE_KEY || 'delt_otp_default_hmac_secret_key_2026';
const OTP_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes
const MAX_ATTEMPTS = 5;
const COOLDOWN_SECONDS = 30;

/**
 * Universal email normalizer used across request, store, and verify operations.
 */
export function normalizeEmail(email: string): string {
  if (!email) return '';
  return email.trim().toLowerCase();
}

function maskEmail(email: string): string {
  const parts = email.split('@');
  if (parts.length !== 2) return '***';
  const name = parts[0];
  const domain = parts[1];
  const maskedName = name.length <= 2 ? name[0] + '*' : name.slice(0, 2) + '*'.repeat(Math.max(1, name.length - 2));
  return `${maskedName}@${domain}`;
}

/**
 * Computes a salted HMAC SHA-256 hash of an OTP code.
 */
function hashOtp(otp: string, purpose: string, identifier: string): string {
  return crypto
    .createHmac('sha256', OTP_SECRET)
    .update(`${otp}:${purpose}:${identifier.trim().toLowerCase()}`)
    .digest('hex');
}

export interface RequestOtpResult {
  success: boolean;
  emailSent: boolean;
  simulated: boolean;
  cooldownSeconds?: number;
  error?: string;
  errType?: 'DATABASE_INSERT_ERROR' | 'EMAIL_SEND_ERROR' | 'OTP_GENERATION_ERROR' | 'DEAL_NOT_FOUND' | 'INVALID_EMAIL' | 'RATE_LIMITED';
  dealId?: string;
  otpTraceId?: string;
  databaseRowCreated?: boolean;
  databaseRowId?: string;
}

export interface VerifyOtpResult {
  valid: boolean;
  clientSessionToken?: string;
  deal?: any;
  error?: string;
  dealId?: string;
  otpTraceId?: string;
  lookupStarted?: string;
  matchingRowFound?: boolean;
  matchingRowId?: string;
  matchingRowCreatedAt?: string;
  matchingRowExpiresAt?: string;
  matchingRowVerified?: boolean;
  matchingRowAttempts?: number;
  hashComparisonResult?: boolean;
  verificationResult?: string;
}

// In-memory store used exclusively for Creator Signup OTP
interface SignupOtpEntry {
  email: string;
  otpHash: string;
  attempts: number;
  expiresAt: number;
  lastSentAt: number;
}
const inMemorySignupOtpStore = new Map<string, SignupOtpEntry>();

// ------------------------------------------------------------------------------
// 1. Creator Signup OTP — Request & Resend
// ------------------------------------------------------------------------------
export async function requestSignupOtp(params: {
  email: string;
  name: string;
  password?: string;
}): Promise<RequestOtpResult> {
  const { email, name, password } = params;
  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    return { success: false, emailSent: false, simulated: false, error: 'Please enter a valid email address.' };
  }

  const admin = createAdminClient();

  try {
    const { data: usersData } = await admin.auth.admin.listUsers();
    const existingUser = usersData?.users?.find(
      (u) => u.email?.toLowerCase() === normalizedEmail
    );

    if (existingUser && existingUser.email_confirmed_at) {
      return {
        success: false,
        emailSent: false,
        simulated: false,
        error: 'An account with this email already exists. Please log in.',
      };
    }

    if (!existingUser && password) {
      await admin.auth.admin.createUser({
        email: normalizedEmail,
        password,
        user_metadata: { displayName: name.trim() },
        email_confirm: false,
      });
    } else if (existingUser && password) {
      await admin.auth.admin.updateUserById(existingUser.id, {
        password,
        user_metadata: { displayName: name.trim() },
      });
    }
  } catch (err: any) {
    console.error('[Signup User Check Error]', err);
  }

  // Cooldown check
  const existingOtp = inMemorySignupOtpStore.get(normalizedEmail);
  if (existingOtp) {
    const elapsedSeconds = Math.floor((Date.now() - existingOtp.lastSentAt) / 1000);
    if (elapsedSeconds < COOLDOWN_SECONDS) {
      return {
        success: false,
        emailSent: false,
        simulated: false,
        cooldownSeconds: COOLDOWN_SECONDS - elapsedSeconds,
        error: `Please wait ${COOLDOWN_SECONDS - elapsedSeconds} seconds before requesting a new code.`,
      };
    }
  }

  const randomOtp = crypto.randomInt(100000, 1000000).toString();
  const otpHash = hashOtp(randomOtp, 'SIGNUP_VERIFICATION', normalizedEmail);
  const now = Date.now();
  const expiresAt = now + OTP_EXPIRY_MS;

  inMemorySignupOtpStore.set(normalizedEmail, {
    email: normalizedEmail,
    otpHash,
    attempts: 0,
    expiresAt,
    lastSentAt: now,
  });

  const emailRes = await sendOtpEmail({
    to: normalizedEmail,
    otpCode: randomOtp,
    expiresInMinutes: 10,
    subject: 'Your DELT verification code',
  });

  if (!emailRes.delivered) {
    inMemorySignupOtpStore.delete(normalizedEmail);
    return {
      success: false,
      emailSent: false,
      simulated: Boolean(emailRes.simulated),
      error: emailRes.error || 'Failed to send verification email through Resend.',
    };
  }

  return {
    success: true,
    emailSent: true,
    simulated: Boolean(emailRes.simulated),
    cooldownSeconds: COOLDOWN_SECONDS,
  };
}

// ------------------------------------------------------------------------------
// 2. Creator Signup OTP — Verification
// ------------------------------------------------------------------------------
export async function verifySignupOtp(params: {
  email: string;
  otp: string;
}): Promise<VerifyOtpResult> {
  const { email, otp } = params;
  const normalizedEmail = normalizeEmail(email);
  const trimmedOtp = (otp || '').trim();

  if (!trimmedOtp || trimmedOtp.length !== 6 || !/^\d{6}$/.test(trimmedOtp)) {
    return { valid: false, error: 'Please enter a valid 6-digit verification code.' };
  }

  const otpEntry = inMemorySignupOtpStore.get(normalizedEmail);

  if (!otpEntry) {
    return {
      valid: false,
      error: 'No active verification code found. Please request a new code.',
    };
  }

  if (otpEntry.expiresAt < Date.now()) {
    inMemorySignupOtpStore.delete(normalizedEmail);
    return {
      valid: false,
      error: 'This code has expired. Request a new code.',
    };
  }

  if (otpEntry.attempts >= MAX_ATTEMPTS) {
    inMemorySignupOtpStore.delete(normalizedEmail);
    return {
      valid: false,
      error: 'Too many attempts. Please request a new code.',
    };
  }

  const expectedHash = otpEntry.otpHash;
  const actualHash = hashOtp(trimmedOtp, 'SIGNUP_VERIFICATION', normalizedEmail);

  const expectedBuffer = Buffer.from(expectedHash, 'hex');
  const actualBuffer = Buffer.from(actualHash, 'hex');

  const matches =
    expectedBuffer.length === actualBuffer.length &&
    crypto.timingSafeEqual(expectedBuffer, actualBuffer);

  if (!matches) {
    otpEntry.attempts += 1;
    const remaining = MAX_ATTEMPTS - otpEntry.attempts;
    return {
      valid: false,
      error:
        remaining > 0
          ? 'Incorrect code. Please try again.'
          : 'Too many attempts. Please request a new code.',
    };
  }

  inMemorySignupOtpStore.delete(normalizedEmail);

  const admin = createAdminClient();
  try {
    const { data: usersData } = await admin.auth.admin.listUsers();
    const user = usersData?.users?.find(
      (u) => u.email?.toLowerCase() === normalizedEmail
    );

    if (user) {
      await admin.auth.admin.updateUserById(user.id, {
        email_confirm: true,
      });

      const displayName = user.user_metadata?.displayName || normalizedEmail.split('@')[0] || 'Creator';
      await admin.from('profiles').upsert({
        id: user.id,
        email: normalizedEmail,
        display_name: displayName,
      });
      await admin.from('storage_usage').upsert({
        user_id: user.id,
        total_bytes: 0,
        limit_bytes: 5368709120, // 5 GB
      });
      await admin.from('deal_credits').upsert({
        user_id: user.id,
        plan_id: 'free',
        total: 50,
        used: 0,
        remaining: 50,
      });
    }
  } catch (err) {
    console.error('[Verify Signup Confirm Error]', err);
  }

  return { valid: true };
}

// ------------------------------------------------------------------------------
// 3. Client Deal Access OTP — Request (Database Backed: deal_otps)
// ------------------------------------------------------------------------------
export async function requestDealOtp(
  dealToken: string,
  rawEmail: string,
  traceId?: string
): Promise<RequestOtpResult> {
  const otpTraceId = traceId || `OTP-REQUEST-${crypto.randomUUID().slice(0, 8)}`;
  const normalizedEmail = normalizeEmail(rawEmail);

  console.log(`[OTP_REQUEST_START]`, JSON.stringify({
    otpTraceId,
    dealTokenPresent: Boolean(dealToken),
    token: dealToken,
    normalizedEmail,
    timestamp: new Date().toISOString()
  }));

  if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    return {
      success: false,
      emailSent: false,
      simulated: false,
      error: 'Please enter a valid email address.',
      errType: 'INVALID_EMAIL',
      otpTraceId,
      databaseRowCreated: false
    };
  }

  const admin = createAdminClient();

  // 1. Fetch deal by token
  const { data: deal, error: dealError } = await admin
    .from('deals')
    .select('id, token, client_email, client_name, title')
    .eq('token', dealToken)
    .maybeSingle();

  if (dealError || !deal) {
    console.error(`[OTP_REQUEST_ERROR] Deal not found for token: ${dealToken}`, dealError);
    return {
      success: false,
      emailSent: false,
      simulated: false,
      error: 'Deal not found or invalid link.',
      errType: 'DEAL_NOT_FOUND',
      otpTraceId,
      databaseRowCreated: false
    };
  }

  console.log(`[CLIENT_DEAL_RESOLUTION]`, JSON.stringify({
    otpTraceId,
    tokenPresent: Boolean(dealToken),
    dealId: deal.id,
    clientEmail: deal.client_email,
    timestamp: new Date().toISOString()
  }));

  // 2. Verify email matches deal client_email
  if (normalizeEmail(deal.client_email) !== normalizedEmail) {
    console.warn(`[OTP_REQUEST_UNAUTHORIZED] Email ${maskEmail(normalizedEmail)} does not match deal client ${maskEmail(deal.client_email || '')}`);
    return {
      success: false,
      emailSent: false,
      simulated: false,
      error: 'This email address is not authorized for this private Deal workspace.',
      errType: 'INVALID_EMAIL',
      dealId: deal.id,
      otpTraceId,
      databaseRowCreated: false
    };
  }

  // 3. Cooldown check: Check newest active OTP in database
  const { data: recentOtps } = await admin
    .from('deal_otps')
    .select('created_at, expires_at')
    .eq('deal_id', deal.id)
    .eq('email', normalizedEmail)
    .order('created_at', { ascending: false })
    .limit(1);

  if (recentOtps && recentOtps.length > 0) {
    const lastCreatedAt = new Date(recentOtps[0].created_at).getTime();
    const elapsedSeconds = Math.floor((Date.now() - lastCreatedAt) / 1000);
    if (elapsedSeconds < COOLDOWN_SECONDS) {
      const remainingCooldown = COOLDOWN_SECONDS - elapsedSeconds;
      console.log(`[OTP_COOLDOWN_ACTIVE] remaining: ${remainingCooldown}s`);
      return {
        success: false,
        emailSent: false,
        simulated: false,
        cooldownSeconds: remainingCooldown,
        error: `Please wait ${remainingCooldown} seconds before requesting a new code.`,
        errType: 'RATE_LIMITED',
        dealId: deal.id,
        otpTraceId,
        databaseRowCreated: false
      };
    }
  }

  // 4. Invalidate (delete) any previous unverified OTPs for this deal + email
  // Ensures only ONE active OTP exists in the database for this deal + email.
  await admin
    .from('deal_otps')
    .delete()
    .eq('deal_id', deal.id)
    .eq('email', normalizedEmail)
    .eq('verified', false);

  // 5. Generate cryptographically secure 6-digit OTP & HMAC SHA-256 hash
  const randomOtp = crypto.randomInt(100000, 1000000).toString();
  const otpHash = hashOtp(randomOtp, 'CLIENT_DEAL_ACCESS', `${deal.id}:${normalizedEmail}`);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + OTP_EXPIRY_MS);

  // 6. PERSIST TO DATABASE FIRST (Single source of truth)
  const { data: insertedOtp, error: insertError } = await admin
    .from('deal_otps')
    .insert({
      deal_id: deal.id,
      email: normalizedEmail,
      otp_hash: otpHash,
      attempts: 0,
      verified: false,
      expires_at: expiresAt.toISOString(),
      created_at: now.toISOString(),
    })
    .select('id, deal_id, email, attempts, verified, created_at, expires_at')
    .single();

  if (insertError || !insertedOtp) {
    console.error(`[DATABASE_INSERT_ERROR]`, JSON.stringify({
      otpTraceId,
      code: insertError?.code || null,
      message: insertError?.message || null,
      details: insertError?.details || null,
      hint: insertError?.hint || null,
      timestamp: new Date().toISOString()
    }));
    return {
      success: false,
      emailSent: false,
      simulated: false,
      error: 'Failed to record verification code in database. Please try again.',
      errType: 'DATABASE_INSERT_ERROR',
      dealId: deal.id,
      otpTraceId,
      databaseRowCreated: false
    };
  }

  console.log(`[OTP_DB_WRITE_SUCCESS]`, JSON.stringify({
    otpTraceId,
    dealId: deal.id,
    normalizedEmail,
    otpRowId: insertedOtp.id,
    createdAt: insertedOtp.created_at,
    expiresAt: insertedOtp.expires_at,
    attempts: insertedOtp.attempts,
    verified: insertedOtp.verified,
    timestamp: new Date().toISOString()
  }));

  console.log('[DEBUG_OTP_CODE]', randomOtp);

  // 7. Send transactional email via Resend
  const emailRes = await sendOtpEmail({
    to: normalizedEmail,
    otpCode: randomOtp,
    expiresInMinutes: 10,
    subject: 'Your DELT verification code',
  });

  if (!emailRes.delivered) {
    console.error(`[OTP_EMAIL_FAILED]`, JSON.stringify({
      otpTraceId,
      otpRowId: insertedOtp.id,
      error: emailRes.error,
      timestamp: new Date().toISOString()
    }));

    await admin.from('deal_otps').delete().eq('id', insertedOtp.id);

    return {
      success: false,
      emailSent: false,
      simulated: Boolean(emailRes.simulated),
      error: emailRes.error || 'Failed to deliver verification email through Resend.',
      errType: 'EMAIL_SEND_ERROR',
      dealId: deal.id,
      otpTraceId,
      databaseRowCreated: false
    };
  }

  console.log(`[OTP_EMAIL_SENT]`, JSON.stringify({
    otpTraceId,
    otpRowId: insertedOtp.id,
    recipient: normalizedEmail,
    resendMessageId: emailRes.messageId,
    timestamp: new Date().toISOString()
  }));

  return {
    success: true,
    emailSent: true,
    simulated: Boolean(emailRes.simulated),
    cooldownSeconds: COOLDOWN_SECONDS,
    dealId: deal.id,
    otpTraceId,
    databaseRowCreated: true,
    databaseRowId: insertedOtp.id
  };
}

// ------------------------------------------------------------------------------
// 4. Client Deal Access OTP — Verification (Database Backed: deal_otps)
// ------------------------------------------------------------------------------
export async function verifyDealOtp(
  dealToken: string,
  rawEmail: string,
  inputOtp: string,
  traceId?: string
): Promise<VerifyOtpResult> {
  const otpTraceId = traceId || `OTP-VERIFY-${crypto.randomUUID().slice(0, 8)}`;
  const normalizedEmail = normalizeEmail(rawEmail);
  const trimmedOtp = (inputOtp || '').trim();
  const lookupStarted = new Date().toISOString();

  console.log(`[OTP_VERIFY_START]`, JSON.stringify({
    otpTraceId,
    dealToken,
    normalizedEmail,
    inputOtpLength: trimmedOtp.length,
    timestamp: lookupStarted
  }));

  if (!trimmedOtp || trimmedOtp.length !== 6 || !/^\d{6}$/.test(trimmedOtp)) {
    return {
      valid: false,
      error: 'Please enter a valid 6-digit verification code.',
      otpTraceId,
      lookupStarted,
      matchingRowFound: false
    };
  }

  const admin = createAdminClient();

  // 1. Fetch deal by token
  const { data: deal, error: dealError } = await admin
    .from('deals')
    .select('*')
    .eq('token', dealToken)
    .maybeSingle();

  if (dealError || !deal) {
    console.error(`[OTP_VERIFY_ERROR] Deal not found for token: ${dealToken}`, dealError);
    return {
      valid: false,
      error: 'Deal not found.',
      otpTraceId,
      lookupStarted,
      matchingRowFound: false
    };
  }

  const parsed = parseDescription(deal.description);
  const resolvedDeal = {
    id: deal.id,
    token: deal.token,
    creatorId: deal.creator_id,
    clientId: deal.client_id,
    clientName: deal.client_name,
    clientEmail: deal.client_email,
    title: deal.title,
    description: parsed.description,
    scope: Array.isArray(deal.scope) ? deal.scope : [],
    price: Number(deal.price),
    currency: deal.currency || 'INR',
    status: deal.status || 'in_progress',
    deadline: deal.deadline,
    progress: Number(deal.progress || 0),
    paymentStatus: deal.payment_status || 'pending',
    lastActivityAt: deal.last_activity_at || deal.created_at,
    createdAt: deal.created_at,
    previewEnabled: parsed.previewEnabled,
  };

  console.log(`[CLIENT_DEAL_RESOLUTION]`, JSON.stringify({
    otpTraceId,
    tokenPresent: Boolean(dealToken),
    dealId: deal.id,
    clientEmail: deal.client_email,
    timestamp: new Date().toISOString()
  }));

  // 2. Query deal_otps for newest active unverified OTP
  const { data: activeOtps, error: queryError } = await admin
    .from('deal_otps')
    .select('*')
    .eq('deal_id', deal.id)
    .eq('email', normalizedEmail)
    .eq('verified', false)
    .order('created_at', { ascending: false })
    .limit(1);

  if (queryError) {
    console.error(`[OTP_DB_QUERY_ERROR]`, JSON.stringify({
      otpTraceId,
      error: queryError,
      timestamp: new Date().toISOString()
    }));
    return {
      valid: false,
      error: 'Unable to verify code due to a database error. Please try again.',
      dealId: deal.id,
      otpTraceId,
      lookupStarted,
      matchingRowFound: false
    };
  }

  const activeOtp = activeOtps && activeOtps.length > 0 ? activeOtps[0] : null;

  console.log(`[OTP_DB_LOOKUP]`, JSON.stringify({
    otpTraceId,
    dealId: deal.id,
    normalizedEmail,
    rowFound: Boolean(activeOtp),
    otpRowId: activeOtp?.id || null,
    createdAt: activeOtp?.created_at || null,
    expiresAt: activeOtp?.expires_at || null,
    attempts: activeOtp?.attempts || 0,
    verified: activeOtp?.verified || false,
    timestamp: new Date().toISOString()
  }));

  if (!activeOtp) {
    const { data: anyOtps } = await admin
      .from('deal_otps')
      .select('id, verified, created_at, expires_at, attempts')
      .eq('deal_id', deal.id)
      .eq('email', normalizedEmail)
      .order('created_at', { ascending: false })
      .limit(1);

    const firstAnyOtp = anyOtps && anyOtps.length > 0 ? anyOtps[0] : null;

    if (firstAnyOtp && firstAnyOtp.verified) {
      console.warn(`[OTP_ALREADY_VERIFIED]`, JSON.stringify({
        otpTraceId,
        dealId: deal.id,
        email: maskEmail(normalizedEmail),
        timestamp: new Date().toISOString()
      }));
      return {
        valid: false,
        error: 'This code has already been used. Please request a new code.',
        dealId: deal.id,
        otpTraceId,
        lookupStarted,
        matchingRowFound: true,
        matchingRowId: firstAnyOtp.id,
        matchingRowCreatedAt: firstAnyOtp.created_at,
        matchingRowExpiresAt: firstAnyOtp.expires_at,
        matchingRowVerified: firstAnyOtp.verified,
        matchingRowAttempts: firstAnyOtp.attempts,
        hashComparisonResult: false,
        verificationResult: 'ALREADY_VERIFIED'
      };
    }

    console.warn(`[OTP_NO_ROW_FOUND]`, JSON.stringify({
      otpTraceId,
      dealId: deal.id,
      email: maskEmail(normalizedEmail),
      timestamp: new Date().toISOString()
    }));
    return {
      valid: false,
      error: 'No active verification code found. Please request a new code.',
      dealId: deal.id,
      otpTraceId,
      lookupStarted,
      matchingRowFound: firstAnyOtp ? true : false,
      matchingRowId: firstAnyOtp?.id,
      matchingRowCreatedAt: firstAnyOtp?.created_at,
      matchingRowExpiresAt: firstAnyOtp?.expires_at,
      matchingRowVerified: firstAnyOtp?.verified,
      matchingRowAttempts: firstAnyOtp?.attempts,
      hashComparisonResult: false,
      verificationResult: 'NO_ROW_FOUND'
    };
  }

  const now = Date.now();
  const expiresAtMs = new Date(activeOtp.expires_at).getTime();

  // 3. Expiry check
  if (expiresAtMs < now) {
    console.warn(`[OTP_EXPIRED]`, JSON.stringify({
      otpTraceId,
      dealId: deal.id,
      email: maskEmail(normalizedEmail),
      expiredAt: activeOtp.expires_at,
      timestamp: new Date().toISOString()
    }));
    await admin.from('deal_otps').delete().eq('id', activeOtp.id);
    return {
      valid: false,
      error: 'This code has expired. Request a new code.',
      dealId: deal.id,
      otpTraceId,
      lookupStarted,
      matchingRowFound: true,
      matchingRowId: activeOtp.id,
      matchingRowCreatedAt: activeOtp.created_at,
      matchingRowExpiresAt: activeOtp.expires_at,
      matchingRowVerified: activeOtp.verified,
      matchingRowAttempts: activeOtp.attempts,
      hashComparisonResult: false,
      verificationResult: 'EXPIRED'
    };
  }

  // 4. Max attempts check
  if (activeOtp.attempts >= MAX_ATTEMPTS) {
    console.warn(`[OTP_TOO_MANY_ATTEMPTS]`, JSON.stringify({
      otpTraceId,
      dealId: deal.id,
      email: maskEmail(normalizedEmail),
      attempts: activeOtp.attempts,
      timestamp: new Date().toISOString()
    }));
    await admin.from('deal_otps').delete().eq('id', activeOtp.id);
    return {
      valid: false,
      error: 'Too many verification attempts. Please request a new code later.',
      dealId: deal.id,
      otpTraceId,
      lookupStarted,
      matchingRowFound: true,
      matchingRowId: activeOtp.id,
      matchingRowCreatedAt: activeOtp.created_at,
      matchingRowExpiresAt: activeOtp.expires_at,
      matchingRowVerified: activeOtp.verified,
      matchingRowAttempts: activeOtp.attempts,
      hashComparisonResult: false,
      verificationResult: 'MAX_ATTEMPTS_EXCEEDED'
    };
  }

  // 5. Compare hash with timing-safe comparison
  const expectedHash = activeOtp.otp_hash;
  const actualHash = hashOtp(trimmedOtp, 'CLIENT_DEAL_ACCESS', `${deal.id}:${normalizedEmail}`);

  const expectedBuffer = Buffer.from(expectedHash, 'hex');
  const actualBuffer = Buffer.from(actualHash, 'hex');

  const matches =
    expectedBuffer.length === actualBuffer.length &&
    crypto.timingSafeEqual(expectedBuffer, actualBuffer);

  if (!matches) {
    const newAttempts = (activeOtp.attempts || 0) + 1;
    await admin.from('deal_otps').update({ attempts: newAttempts }).eq('id', activeOtp.id);

    console.warn(`[OTP_INCORRECT_CODE]`, JSON.stringify({
      otpTraceId,
      dealId: deal.id,
      email: maskEmail(normalizedEmail),
      attempt: newAttempts,
      maxAttempts: MAX_ATTEMPTS,
      timestamp: new Date().toISOString()
    }));

    if (newAttempts >= MAX_ATTEMPTS) {
      await admin.from('deal_otps').delete().eq('id', activeOtp.id);
      return {
        valid: false,
        error: 'Too many verification attempts. Please request a new code later.',
        dealId: deal.id,
        otpTraceId,
        lookupStarted,
        matchingRowFound: true,
        matchingRowId: activeOtp.id,
        matchingRowCreatedAt: activeOtp.created_at,
        matchingRowExpiresAt: activeOtp.expires_at,
        matchingRowVerified: activeOtp.verified,
        matchingRowAttempts: newAttempts,
        hashComparisonResult: false,
        verificationResult: 'MAX_ATTEMPTS_EXCEEDED'
      };
    }

    return {
      valid: false,
      error: 'Incorrect verification code. Please try again.',
      dealId: deal.id,
      otpTraceId,
      lookupStarted,
      matchingRowFound: true,
      matchingRowId: activeOtp.id,
      matchingRowCreatedAt: activeOtp.created_at,
      matchingRowExpiresAt: activeOtp.expires_at,
      matchingRowVerified: activeOtp.verified,
      matchingRowAttempts: newAttempts,
      hashComparisonResult: false,
      verificationResult: 'HASH_MISMATCH'
    };
  }

  // 6. Mark OTP verified (used) immediately
  await admin.from('deal_otps').update({ verified: true }).eq('id', activeOtp.id);

  console.log(`[OTP_VERIFY_SUCCESS]`, JSON.stringify({
    otpTraceId,
    dealId: deal.id,
    normalizedEmail,
    otpRowId: activeOtp.id,
    timestamp: new Date().toISOString()
  }));

  // 7. Generate signed Client Session Token
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
  try {
    await admin.from('deal_events').insert({
      deal_id: deal.id,
      type: 'client_verified',
      actor_id: normalizedEmail,
      actor_name: deal.client_name || 'Client',
      actor_role: 'client',
      description: `${deal.client_name || 'Client'} verified email access to the Deal workspace.`,
    });
  } catch (eventErr) {
    console.warn('[Deal Event Insert Warn]', eventErr);
  }

  return {
    valid: true,
    clientSessionToken,
    deal: resolvedDeal,
    dealId: deal.id,
    otpTraceId,
    lookupStarted,
    matchingRowFound: true,
    matchingRowId: activeOtp.id,
    matchingRowCreatedAt: activeOtp.created_at,
    matchingRowExpiresAt: activeOtp.expires_at,
    matchingRowVerified: activeOtp.verified,
    matchingRowAttempts: activeOtp.attempts,
    hashComparisonResult: true,
    verificationResult: 'SUCCESS'
  };
}

/**
 * Validates a signed Client Session Token.
 */
export function verifyClientSessionToken(
  tokenString: string,
  dealToken: string,
  rawEmail: string
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
    if (normalizeEmail(payload.clientEmail) !== normalizeEmail(rawEmail)) return false;
    if (payload.expiresAt < Date.now()) return false;
    return true;
  } catch {
    return false;
  }
}
